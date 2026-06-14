import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { dbStore } from './server/db.js';
import { triggerAdminNotification, adminNotificationsRouter, startRetryWorker } from './server/notifications.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = 'ezana_academy_secret_key_2026';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload folder setup
const uploadsDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded receipt files
app.use('/uploads', express.static(uploadsDir));

// Multer photo/pdf attachment engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.png', '.jpg', '.jpeg', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Image receipt formats (.png, .jpg, .jpeg) are supported.'));
    }
  }
});

// Authentication middleware
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: number;
    email: string;
    roleId: number;
    roleName: string;
    name: string;
    premium: boolean;
  };
}

const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access Denied. No token provided.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ message: 'Session expired. Please log in again.' });
      return;
    }
    req.user = decoded;
    next();
  });
};

const requireRole = (allowedRoleIds: number[]) => {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !allowedRoleIds.includes(req.user.roleId)) {
      res.status(403).json({ message: 'Access Denied. You do not possess the required privileges.' });
      return;
    }
    next();
  };
};

/* --- API ROUTING SYSTEMS --- */

// POST /install - Database installation routine (Safe & Re-installable)
app.post('/install', async (req, res) => {
  const result = await dbStore.installDatabase();
  if (result.success) {
    res.status(200).json({ success: true, message: result.message });
  } else {
    res.status(500).json({ success: false, message: result.message });
  }
});

// Mounted Admin Notifications Core Router
app.use(adminNotificationsRouter);

// AUTH REGISTRATION
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, roleId } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ message: 'Please provide name, email, and security password.' });
    return;
  }

  const cleanName = String(name).trim();
  const cleanEmail = String(email).toLowerCase().trim();
  const cleanPassword = String(password);

  // Payload validations
  if (cleanName.length < 2) {
    res.status(400).json({ message: 'Name must be at least 2 characters long.' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    res.status(400).json({ message: 'Please provide a valid email address.' });
    return;
  }

  if (cleanPassword.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters long for optimal system lock.' });
    return;
  }

  const users = dbStore.getTable('users');
  const existingUser = users.find(u => u.email.toLowerCase().trim() === cleanEmail);

  if (existingUser) {
    res.status(400).json({ message: 'Email already registered. Please proceed to login.' });
    return;
  }

  // Enforce Student role (3) for all public registrations
  const targetRoleId = 3;
  const targetRoleName = 'student';

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(cleanPassword, salt);

  const newUser = dbStore.insert('users', {
    name: cleanName,
    email: cleanEmail,
    password: hashedPassword,
    roleId: targetRoleId,
    status: 'active'
  });

  // Trigger Admin Notification for student registration
  triggerAdminNotification(
    newUser.id,
    'student_registration',
    `New Student Registration: ${newUser.name}`,
    `A new learning account has been established on the platform.\n\nStudent Name: ${newUser.name}\nEmail: ${newUser.email}\nStatus: Active`
  ).catch(err => console.error("Admin registration notif failed:", err));

  // Automatically construct active JWT session
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, roleId: targetRoleId, roleName: targetRoleName, name: newUser.name, premium: targetRoleId === 1 || targetRoleId === 2 },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, roleId: targetRoleId, roleName: targetRoleName, premium: targetRoleId === 1 || targetRoleId === 2 }
  });
});

const loginAttempts: Record<string, { count: number; lastAttempt: number }> = {};

// AUTH LOGIN
app.post('/api/auth/login', (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const ipStr = Array.isArray(ip) ? ip[0] : String(ip);
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute
  const maxAttempts = 6;

  const attempt = loginAttempts[ipStr];
  if (attempt) {
    if (now - attempt.lastAttempt > limitWindow) {
      attempt.count = 1;
      attempt.lastAttempt = now;
    } else {
      attempt.count += 1;
      if (attempt.count > maxAttempts) {
        res.status(429).json({ message: 'Too many authentication attempts. Please wait 1 minute before trying again.' });
        return;
      }
    }
  } else {
    loginAttempts[ipStr] = { count: 1, lastAttempt: now };
  }

  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Specify both email and login password.' });
    return;
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const cleanPassword = String(password);

  const users = dbStore.getTable('users');
  const user = users.find(u => u.email.toLowerCase().trim() === cleanEmail);

  if (!user) {
    res.status(401).json({ message: 'Invalid credentials. User record not registered.' });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ message: 'This account has been temporarily suspended. Contact support.' });
    return;
  }

  const isValid = bcrypt.compareSync(cleanPassword, user.password);
  if (!isValid) {
    res.status(401).json({ message: 'Incorrect credentials. Please try again.' });
    return;
  }

  // Clear tracking on successful authentication login
  delete loginAttempts[ipStr];

  // Get student's active payment status to check for Lifetime Premium Access
  const payments = dbStore.getTable('payments');
  const userApprovedPayment = payments.find(p => p.userId === user.id && p.status === 'approved');
  const isPremiumUser = user.roleId === 1 || user.roleId === 2 || !!userApprovedPayment;

  const roleNameMap: Record<number, string> = { 1: 'admin', 2: 'instructor', 3: 'student' };
  const token = jwt.sign(
    { id: user.id, email: user.email, roleId: user.roleId, roleName: roleNameMap[user.roleId] || 'student', name: user.name, premium: isPremiumUser },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      roleName: roleNameMap[user.roleId] || 'student',
      premium: isPremiumUser
    }
  });
});

// AUTH FORGOT/RESET PASSWORD (SIMULATED FOR SECURITY COMPLIANCE)
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: 'Please provide your account email address.' });
    return;
  }
  const users = dbStore.getTable('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    res.status(404).json({ message: 'No registered account found with this email.' });
    return;
  }
  res.json({ success: true, message: 'Password recovery flow simulation successful. To reset, trigger standard setup.' });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ message: 'Email and new password are required.' });
    return;
  }
  const users = dbStore.getTable('users');
  const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (userIndex === -1) {
    res.status(404).json({ message: 'No registered account found with this email.' });
    return;
  }
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(newPassword, salt);
  dbStore.update('users', users[userIndex].id, { password: hashedPassword });
  res.json({ success: true, message: 'Password has been updated. Please log in.' });
});

// GET CURRENT USER PROFILE
app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const users = dbStore.getTable('users');
  const user = users.find(u => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ message: 'User records clean miss.' });
    return;
  }

  const payments = dbStore.getTable('payments');
  const userApprovedPayment = payments.find(p => p.userId === user.id && p.status === 'approved');
  const isPremiumUser = user.roleId === 1 || user.roleId === 2 || !!userApprovedPayment;

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    roleId: user.roleId,
    roleName: req.user.roleName,
    premium: isPremiumUser
  });
});

/* --- IDENTITY & PROFILE MANAGEMENT APIS --- */

// PUT /api/users/profile - Update full identity names & phone number
app.put('/api/users/profile', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized session.' });
    return;
  }
  const { name, phoneNumber } = req.body;
  if (!name || name.trim().length < 2) {
    res.status(400).json({ message: 'A valid name with at least 2 characters is required.' });
    return;
  }
  const updatedUser = dbStore.update('users', req.user.id, { name: name.trim(), phoneNumber });
  if (!updatedUser) {
    res.status(404).json({ message: 'User record not located.' });
    return;
  }
  res.json({ success: true, message: 'Profile details updated and synchronized!', user: updatedUser });
});

// POST /api/users/change-password - Change user password securely
app.post('/api/users/change-password', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized session.' });
    return;
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: 'Both current password and new pass are required.' });
    return;
  }
  const users = dbStore.getTable('users');
  const userObj = users.find(u => u.id === req.user?.id);
  if (!userObj) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }
  const isValid = bcrypt.compareSync(currentPassword, userObj.password);
  if (!isValid) {
    res.status(400).json({ message: 'The current password provided is incorrect.' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ message: 'Secret password must contain at least 6 characters.' });
    return;
  }
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(newPassword, salt);
  dbStore.update('users', userObj.id, { password: hashedPassword });
  res.json({ success: true, message: 'Password reset successfully!' });
});

// DELETE /api/users/delete-account - Permanently erase course progress and credentials
app.delete('/api/users/delete-account', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized session.' });
    return;
  }
  if (req.user.roleId === 1) {
    const adminCount = dbStore.getTable('users').filter(u => u.roleId === 1).length;
    if (adminCount <= 1) {
      res.status(400).json({ message: 'Cannot erase the sole System Master Administrator.' });
      return;
    }
  }
  const deleted = dbStore.delete('users', req.user.id);
  if (deleted) {
    res.json({ success: true, message: 'Academic profile erased finalized.' });
  } else {
    res.status(500).json({ message: 'Failed to erase core credentials.' });
  }
});

// 1. COURSES RETRIEVAL & CRUD
app.get('/api/courses', (req: express.Request, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let isPremium = false;
  let loggedInUser: any = null;

  if (token) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      loggedInUser = decoded;
      const payments = dbStore.getTable('payments');
      const approvedPayment = payments.find(p => p.userId === decoded.id && p.status === 'approved');
      isPremium = decoded.roleId === 1 || decoded.roleId === 2 || !!approvedPayment;
    } catch (e) {}
  }

  // Filter out pending draft courses for students or unregistered guests
  const allCourses = dbStore.getTable('courses');
  const courses = allCourses.filter(course => {
    // Admin & Instructor see all
    if (loggedInUser && (loggedInUser.roleId === 1 || loggedInUser.roleId === 2)) {
      return true;
    }
    // Students and Guests only see active approved lessons
    return course.status !== 'pending' && course.status !== 'rejected';
  }).map(course => {
    return { ...course };
  });

  res.json(courses);
});

// GET SPECIFIC COURSE WITH DETAILS (MODULES, LESSONS)
app.get('/api/courses/:id', (req, res) => {
  const courseId = parseInt(req.params.id);
  if (isNaN(courseId)) {
    res.status(400).json({ message: 'Invalid ID parameters' });
    return;
  }

  const courses = dbStore.getTable('courses');
  const course = courses.find(c => c.id === courseId);
  if (!course) {
    res.status(404).json({ message: 'Course not found' });
    return;
  }

  // Get modules
  const allModules = dbStore.getTable('modules');
  const courseModules = allModules.filter(m => m.courseId === courseId);

  // Get lessons
  const allLessons = dbStore.getTable('lessons');
  const finalModules = courseModules.map(mod => {
    const modLessons = allLessons.filter(les => les.moduleId === mod.id).map(les => {
      // Return details
      return { ...les };
    });
    return { ...mod, lessons: modLessons };
  });

  res.json({
    ...course,
    modules: finalModules
  });
});

// CREATE COURSE (ADMIN/INSTRUCTOR PRIVILEGES)
app.post('/api/courses', authenticateToken, requireRole([1, 2]), (req: AuthenticatedRequest, res) => {
  const { title, description, category, instructorId, duration, lessonsCount, thumbnail, premium, published } = req.body;
  if (!title || !description || !category) {
    res.status(400).json({ message: 'Course title, description, and category category are mandatory.' });
    return;
  }

  // Set pending state if created by an Instructor; Admin is auto-approved.
  const initialStatus = req.user?.roleId === 1 ? 'approved' : 'pending';

  const newCourse = dbStore.insert('courses', {
    title,
    description,
    category,
    instructorId: instructorId ? parseInt(instructorId) : (req.user?.id || 2),
    duration: duration || '10 Hours',
    lessonsCount: lessonsCount ? parseInt(lessonsCount) : 0,
    thumbnail: thumbnail || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
    premium: premium !== undefined ? Boolean(premium) : true,
    published: published !== undefined ? Boolean(published) : true,
    status: initialStatus
  });

  // Notify Admin of brand-new pending syllabus submission
  if (initialStatus === 'pending') {
    dbStore.getTable('users').filter(u => u.roleId === 1).forEach(admin => {
      dbStore.insert('notifications', {
        userId: admin.id,
        title: 'New Program Pending Approval',
        message: `Instructor ${req.user?.name || 'Academic Creator'} submitted "${title}" for curriculum verification review.`,
        isRead: false
      });
    });
  }

  res.status(201).json(newCourse);
});

// ADMIN APPROVE COURSE
app.patch('/api/courses/:id/approve', authenticateToken, requireRole([1]), (req: AuthenticatedRequest, res) => {
  const courseId = parseInt(req.params.id);
  const course = dbStore.getTable('courses').find(c => c.id === courseId);
  if (!course) {
    res.status(404).json({ message: 'Course not found.' });
    return;
  }
  const updated = dbStore.update('courses', courseId, { status: 'approved' });
  
  // Notify instructor
  dbStore.insert('notifications', {
    userId: course.instructorId,
    title: 'Syllabus Approved! 🎉',
    message: `Curriculum masters successfully validated and activated your program: "${course.title}".`,
    isRead: false
  });

  res.json({ success: true, message: 'Curriculum course approved and published!', course: updated });
});

// ADMIN REJECT COURSE
app.patch('/api/courses/:id/reject', authenticateToken, requireRole([1]), (req: AuthenticatedRequest, res) => {
  const courseId = parseInt(req.params.id);
  const { notes } = req.body;
  const course = dbStore.getTable('courses').find(c => c.id === courseId);
  if (!course) {
    res.status(404).json({ message: 'Course not found.' });
    return;
  }
  const updated = dbStore.update('courses', courseId, { status: 'rejected' });

  // Notify instructor
  dbStore.insert('notifications', {
    userId: course.instructorId,
    title: 'Curriculum Revision Required',
    message: `Curriculum board requested modifications for "${course.title}". Reason: ${notes || 'Verification failed.'}`,
    isRead: false
  });

  res.json({ success: true, message: 'Curriculum course status set to rejected.', course: updated });
});

// UPDATE COURSE
app.put('/api/courses/:id', authenticateToken, requireRole([1, 2]), (req, res) => {
  const courseId = parseInt(req.params.id);
  const updated = dbStore.update('courses', courseId, req.body);
  if (!updated) {
    res.status(404).json({ message: 'Course does not exist.' });
    return;
  }
  res.json(updated);
});

// DELETE COURSE
app.delete('/api/courses/:id', authenticateToken, requireRole([1, 2]), (req, res) => {
  const courseId = parseInt(req.params.id);
  const deleted = dbStore.delete('courses', courseId);
  if (!deleted) {
    res.status(404).json({ message: 'Course record not located.' });
    return;
  }
  // clean up children modules and lessons
  const modules = dbStore.getTable('modules');
  const courseModules = modules.filter(m => m.courseId === courseId);
  courseModules.forEach(mod => {
    dbStore.delete('modules', mod.id);
  });

  const lessons = dbStore.getTable('lessons');
  const courseLessons = lessons.filter(l => l.courseId === courseId);
  courseLessons.forEach(les => {
    dbStore.delete('lessons', les.id);
  });

  res.json({ success: true, message: 'Course and child lessons purged successfully.' });
});

// 2. MODULES CRUD
app.get('/api/courses/:courseId/modules', (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const modules = dbStore.getTable('modules').filter(m => m.courseId === courseId);
  res.json(modules);
});

app.post('/api/modules', authenticateToken, requireRole([1, 2]), (req, res) => {
  const { courseId, title, description } = req.body;
  if (!courseId || !title) {
    res.status(400).json({ message: 'Please specify courseId and title.' });
    return;
  }
  const newModule = dbStore.insert('modules', {
    courseId: parseInt(courseId),
    title,
    description: description || ''
  });
  res.status(201).json(newModule);
});

app.put('/api/modules/:id', authenticateToken, requireRole([1, 2]), (req, res) => {
  const modId = parseInt(req.params.id);
  const updated = dbStore.update('modules', modId, req.body);
  if (!updated) {
    res.status(404).json({ message: 'Module does not exist.' });
    return;
  }
  res.json(updated);
});

app.delete('/api/modules/:id', authenticateToken, requireRole([1, 2]), (req, res) => {
  const modId = parseInt(req.params.id);
  const deleted = dbStore.delete('modules', modId);
  if (!deleted) {
    res.status(404).json({ message: 'Module record missing.' });
    return;
  }
  res.json({ success: true, message: 'Module deleted.' });
});

// 3. LESSONS CRUD
app.get('/api/modules/:moduleId/lessons', (req, res) => {
  const moduleId = parseInt(req.params.moduleId);
  const lessons = dbStore.getTable('lessons').filter(l => l.moduleId === moduleId);
  res.json(lessons);
});

app.post('/api/lessons', authenticateToken, requireRole([1, 2]), (req, res) => {
  const { moduleId, courseId, title, description, youtubeId, isPreview, duration } = req.body;
  if (!moduleId || !courseId || !title || !youtubeId) {
    res.status(400).json({ message: 'Please specify moduleId, courseId, title, and YouTube video ID.' });
    return;
  }
  const newLesson = dbStore.insert('lessons', {
    moduleId: parseInt(moduleId),
    courseId: parseInt(courseId),
    title,
    description: description || '',
    youtubeId,
    isPreview: isPreview !== undefined ? Boolean(isPreview) : false,
    duration: duration || '15 mins'
  });

  // Track lessonsCount auto updates inside courses
  const lessonsTable = dbStore.getTable('lessons');
  const totalLessonsCount = lessonsTable.filter(l => l.courseId === parseInt(courseId)).length;
  dbStore.update('courses', parseInt(courseId), { lessonsCount: totalLessonsCount });

  res.status(201).json(newLesson);
});

app.put('/api/lessons/:id', authenticateToken, requireRole([1, 2]), (req, res) => {
  const id = parseInt(req.params.id);
  const updated = dbStore.update('lessons', id, req.body);
  if (!updated) {
    res.status(404).json({ message: 'Lesson does not exist.' });
    return;
  }
  res.json(updated);
});

app.delete('/api/lessons/:id', authenticateToken, requireRole([1, 2]), (req, res) => {
  const id = parseInt(req.params.id);
  const lessonsTable = dbStore.getTable('lessons');
  const lesson = lessonsTable.find(l => l.id === id);
  const deleted = dbStore.delete('lessons', id);
  if (!deleted) {
    res.status(404).json({ message: 'Lesson not found.' });
    return;
  }

  if (lesson) {
    const totalLessonsCount = lessonsTable.filter(l => l.courseId === lesson.courseId).length;
    dbStore.update('courses', lesson.courseId, { lessonsCount: totalLessonsCount });
  }

  res.json({ success: true, message: 'Lesson structure removed.' });
});

// 4. PAYMENTS & RECEIPT VERIFICATION Flow
app.get('/api/payments', authenticateToken, (req: AuthenticatedRequest, res) => {
  const payments = dbStore.getTable('payments');
  const users = dbStore.getTable('users');

  // If student asks, return just their payments
  if (req.user?.roleId === 3) {
    const studentPayments = payments.filter(p => p.userId === req.user?.id);
    res.json(studentPayments);
    return;
  }

  // Admin and Instructor see all with User details linked
  const completePayments = payments.map(payment => {
    const student = users.find(u => u.id === payment.userId);
    return {
      ...payment,
      studentName: student ? student.name : 'Unknown Student',
      studentEmail: student ? student.email : 'Unknown Email'
    };
  });

  res.json(completePayments);
});

// Submit manual payment receipt with Multer upload (Image or PDF)
app.post('/api/payments', authenticateToken, upload.single('receipt'), (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized session.' });
    return;
  }

  const { refNumber, notes, paymentAmount, paymentMethod } = req.body;
  if (!refNumber) {
    res.status(400).json({ message: 'Please write down the transaction reference number (Txn ID/Reference).' });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ message: 'Please upload the receipt proof document (Image or PDF).' });
    return;
  }

  // Insert payment receipt tracking structure
  const receiptUrl = `/uploads/${file.filename}`;
  const filenameOriginal = file.originalname;

  const payment = dbStore.insert('payments', {
    userId: req.user.id,
    refNumber,
    notes: notes || '',
    receiptUrl,
    filenameOriginal,
    amount: paymentAmount ? Number(paymentAmount) : 1000,
    paymentMethod: paymentMethod || 'Commercial Bank of Ethiopia (CBE)',
    status: 'pending',
    reviewNotes: '',
    verifiedAt: null
  });

  // Trigger Admin Notification for Receipt & Upgrade submission
  triggerAdminNotification(
    req.user.id,
    'payment_receipt',
    `Premium Upgrade & Receipt Proof: Ref ${refNumber}`,
    `A student submitted a payment receipt for Lifetime Premium Access.\n\nStudent Name: ${req.user.name}\nMethod: ${paymentMethod || 'CBE'}\nRef number: ${refNumber}\nAmount: ETB ${paymentAmount || 1000}\nNotes: ${notes || 'None'}`,
    receiptUrl
  ).catch(err => console.error("Admin payment notif failed:", err));

  // Notify student
  dbStore.insert('notifications', {
    userId: req.user.id,
    title: 'Payment Receipt Submitted',
    message: `Your payment receipt for ETB 1,000 reference ${refNumber} was received. Admin is verifying the bank credentials.`,
    isRead: false
  });

  res.status(201).json({
    success: true,
    message: 'Manual receipt submitted successfully! Verification usually completes in 1-2 hours.',
    payment
  });
});

// APPROVE Receipt API
app.patch('/api/payments/:id/approve', authenticateToken, requireRole([1]), (req: AuthenticatedRequest, res) => {
  const paymentId = parseInt(req.params.id);
  const { reviewNotes } = req.body;

  const payments = dbStore.getTable('payments');
  const payment = payments.find(p => p.id === paymentId);

  if (!payment) {
    res.status(404).json({ message: 'Payment receipt record missing.' });
    return;
  }

  const updated = dbStore.update('payments', paymentId, {
    status: 'approved',
    reviewNotes: reviewNotes || 'Receipt successfully validated against bank statements.',
    verifiedAt: new Date().toISOString()
  });

  // Construct active student course enrollment records on approval
  const courses = dbStore.getTable('courses');
  courses.forEach(course => {
    // Enroll premium student to all courses
    const enrollments = dbStore.getTable('enrollments');
    const existing = enrollments.find(e => e.userId === payment.userId && e.courseId === course.id);
    if (!existing) {
      dbStore.insert('enrollments', {
        userId: payment.userId,
        courseId: course.id,
        progress: 0,
        completed: false
      });
    }
  });

  // Notify student
  dbStore.insert('notifications', {
    userId: payment.userId,
    title: 'Premium Lifetime Access Granted! 🎉',
    message: `Ezana Academy verified your bank transmission record ${payment.refNumber}. All advanced courses are now unlocked.`,
    isRead: false
  });

  res.json({ success: true, message: 'Payment APPROVED. Student account elevated to PREMIUM.', payment: updated });
});

// REJECT Receipt API
app.patch('/api/payments/:id/reject', authenticateToken, requireRole([1]), (req, res) => {
  const paymentId = parseInt(req.params.id);
  const { reviewNotes } = req.body;

  if (!reviewNotes) {
    res.status(400).json({ message: 'Please specify the reason for the rejection.' });
    return;
  }

  const payments = dbStore.getTable('payments');
  const payment = payments.find(p => p.id === paymentId);

  if (!payment) {
    res.status(404).json({ message: 'Payment record missing.' });
    return;
  }

  const updated = dbStore.update('payments', paymentId, {
    status: 'rejected',
    reviewNotes,
    verifiedAt: new Date().toISOString()
  });

  // Notify student
  dbStore.insert('notifications', {
    userId: payment.userId,
    title: 'Payment Verification Unsuccessful ⚠️',
    message: `Payment request reference ${payment.refNumber} rejected. Reason: ${reviewNotes}. Please upload corrected payment paperwork.`,
    isRead: false
  });

  res.json({ success: true, message: 'Payment rejected successfully.', payment: updated });
});

// DELETE User Payment Item
app.delete('/api/payments/:id', authenticateToken, requireRole([1]), (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = dbStore.delete('payments', id);
  if (!deleted) {
    res.status(404).json({ message: 'Payment trace not found.' });
    return;
  }
  res.json({ success: true, message: 'Payment record purged.' });
});

// 5. USER MANAGEMENT (ADMIN ONLY CRUD)
app.get('/api/users', authenticateToken, requireRole([1]), (req, res) => {
  const users = dbStore.getTable('users').map(u => {
    // Avoid sending raw crypt hashes over the wire
    const { password, ...safeUser } = u;
    return safeUser;
  });
  res.json(users);
});

app.post('/api/users', authenticateToken, requireRole([1]), (req, res) => {
  const { name, email, password, roleId } = req.body;
  if (!name || !email || !password || !roleId) {
    res.status(400).json({ message: 'Provide name, email, password code, and role ID.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const newUser = dbStore.insert('users', {
    name,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    roleId: parseInt(roleId),
    status: 'active'
  });

  res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email, roleId: newUser.roleId });
});

app.put('/api/users/:id', authenticateToken, requireRole([1]), (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email, roleId, status, password } = req.body;

  const updates: any = {};
  if (name) updates.name = name;
  if (email) updates.email = email.toLowerCase().trim();
  if (roleId) updates.roleId = parseInt(roleId);
  if (status) updates.status = status;
  if (password) {
    const salt = bcrypt.genSaltSync(10);
    updates.password = bcrypt.hashSync(password, salt);
  }

  const updated = dbStore.update('users', userId, updates);
  if (!updated) {
    res.status(404).json({ message: 'User does not exist.' });
    return;
  }
  const { password: pw, ...safeUser } = updated;
  res.json(safeUser);
});

// Delete User
app.delete('/api/users/:id', authenticateToken, requireRole([1]), (req, res) => {
  const userId = parseInt(req.params.id);
  if (userId === 1) {
    res.status(400).json({ message: 'The primary Admin account cannot be deleted.' });
    return;
  }
  const deleted = dbStore.delete('users', userId);
  if (!deleted) {
    res.status(404).json({ message: 'User not located.' });
    return;
  }
  res.json({ success: true, message: 'User deleted safely.' });
});

/* --- UNIFIED FORMS SUBMISSION GATEWAY HANDLERS --- */

// 1. Lecturer Applications
app.post('/api/lecturer/apply', (req, res) => {
  const { name, email, credentials, subjectArea, bio, cvUrl } = req.body;
  if (!name || !email || !credentials || !bio) {
    res.status(400).json({ message: 'Mandatory fields: name, email, credentials background, and bio.' });
    return;
  }

  // Save applications inside system settings or separate collection logs if needed
  // And dispatch admin notification instantly as required
  triggerAdminNotification(
    null,
    'lecturer_application',
    `Lecturer Application: Dr./Prof. ${name}`,
    `A new candidate lecturer has applied to Ezana Academy.\n\n` + 
    `Candidate: ${name}\n` +
    `Email: ${email}\n` +
    `Subject Area: ${subjectArea || 'N/A'}\n` +
    `Credentials: ${credentials}\n\n` +
    `Short Bio:\n${bio}`,
    cvUrl || ''
  ).catch(err => console.error("Admin lecturer apply fail:", err));

  res.status(200).json({ success: true, message: 'Your application has been received. Our curriculum board will revert back!' });
});

// 2. Direct Support Tickets
app.post('/api/support-tickets', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Session expired' });
    return;
  }
  const { category, subject, message } = req.body;
  if (!subject || !message) {
    res.status(400).json({ message: 'Please provide subject and message.' });
    return;
  }

  triggerAdminNotification(
    req.user.id,
    'support_ticket',
    `Support Ticket [${category || 'GENERAL'}]: ${subject}`,
    `A logged-in student has submitted an active support ticket request.\n\nFrom: ${req.user.name} (${req.user.email})\nSubject: ${subject}\n\nMessage:\n${message}`
  ).catch(err => console.error("Admin support ticket fail:", err));

  res.status(201).json({ success: true, message: 'Support ticket registered. Admin has been notified!' });
});

// 3. Website Greetings / Interactive Messages
app.post('/api/greetings', (req, res) => {
  const { name, email, message } = req.body;
  if (!message) {
    res.status(400).json({ message: 'Please write a message or greeting.' });
    return;
  }

  const senderName = name || 'Anonymous Guest';
  const senderEmail = email || 'anonymous@ezana.com';

  triggerAdminNotification(
    null,
    'greeting',
    `Quick Greeting from ${senderName}`,
    `A guest checked in with a quick greeting message!\n\nFrom: ${senderName} (${senderEmail})\n\nMessage Content:\n${message}`
  ).catch(err => console.error("Admin greeting notif fail:", err));

  res.status(201).json({ success: true, message: 'Message sent! Thank you for greeting us!' });
});

// 4. Premium Upgrade Direct Request
app.post('/api/premium/request', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Session expired' });
    return;
  }
  const { reason, remarks } = req.body;

  triggerAdminNotification(
    req.user.id,
    'premium_request',
    `Premium Upgrade Application: ${req.user.name}`,
    `Student is requesting a manual upgrade to premium level.\n\n` +
    `Student: ${req.user.name}\n` +
    `Email: ${req.user.email}\n` +
    `Reason: ${reason || 'Not specified'}\n` +
    `Remarks: ${remarks || 'None'}`
  ).catch(err => console.error("Admin premium request fail:", err));

  res.status(200).json({ success: true, message: 'Your upgrade request has been successfully filed with the admin!' });
});

// 5. Course Enrollment Direct Requests
app.post('/api/enrollments/request', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Session expired' });
    return;
  }
  const { courseId } = req.body;
  if (!courseId) {
    res.status(400).json({ message: 'Missing courseId' });
    return;
  }

  const course = dbStore.getTable('courses').find(c => c.id === parseInt(courseId));
  if (!course) {
    res.status(404).json({ message: 'Course not located' });
    return;
  }

  // Insert enrollment
  dbStore.insert('enrollments', {
    userId: req.user.id,
    courseId: parseInt(courseId),
    progress: 0,
    completed: false
  });

  triggerAdminNotification(
    req.user.id,
    'course_enrollment',
    `Direct Enrollment Requested: ${course.title}`,
    `Student ${req.user.name} requested direct enrollment on course: ${course.title}\nID: #${courseId}`
  ).catch(err => console.error("Admin direct enrollment fail:", err));

  res.status(201).json({ success: true, message: 'Course enrollment successfully synchronized!' });
});

// Suspend User
app.patch('/api/users/:id/suspend', authenticateToken, requireRole([1]), (req, res) => {
  const userId = parseInt(req.params.id);
  const users = dbStore.getTable('users');
  const user = users.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }
  const currentStatus = user.status || 'active';
  const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';

  dbStore.update('users', userId, { status: nextStatus });
  res.json({ success: true, message: `User state altered to: ${nextStatus}.` });
});

// 6. CONTACTS & SUBMISSIONS FORM
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    res.status(400).json({ message: 'Name, email, subject, and message represent mandatory inputs.' });
    return;
  }

  const contact = dbStore.insert('contact_messages', {
    name,
    email,
    subject,
    message,
    date: new Date().toISOString()
  });

  // Determine type for admin classifications
  const isTicket = String(subject).toLowerCase().includes('support') || String(subject).toLowerCase().includes('ticket') || String(message).toLowerCase().includes('help');
  const isGreeting = String(subject).toLowerCase().includes('hello') || String(subject).toLowerCase().includes('greeting') || String(message).length < 25;
  const adminType = isTicket ? 'support_ticket' : (isGreeting ? 'greeting' : 'contact_form');

  triggerAdminNotification(
    null,
    adminType,
    `Contact Form (${adminType.toUpperCase()}): ${subject}`,
    `An external form submission was entered on the web portal.\n\nFrom: ${name} (${email})\nSubject: ${subject}\n\nMessage:\n${message}`
  ).catch(err => console.error("Admin contact notif failed:", err));

  res.status(201).json({ success: true, message: 'Your support inquiry has been transmitted successfully!', contact });
});

app.get('/api/contact', authenticateToken, requireRole([1]), (req, res) => {
  res.json(dbStore.getTable('contact_messages'));
});

app.get('/api/admin/enrollments', authenticateToken, requireRole([1]), (req, res) => {
  const enrollments = dbStore.getTable('enrollments') || [];
  const users = dbStore.getTable('users') || [];
  const courses = dbStore.getTable('courses') || [];

  const detailedEnrollments = enrollments.map((e: any) => {
    const user = users.find((u: any) => u.id === e.userId);
    const course = courses.find((c: any) => c.id === e.courseId);
    return {
      id: e.id,
      userId: e.userId,
      courseId: e.courseId,
      studentName: user ? user.name : 'Unknown Student',
      studentEmail: user ? user.email : 'Unknown Email',
      courseTitle: course ? course.title : 'Unknown Course',
      progress: typeof e.progress === 'number' ? e.progress : 0,
      completed: !!e.completed,
      createdAt: e.createdAt || new Date().toISOString()
    };
  });

  res.json(detailedEnrollments);
});

// 7. ENROLLMENTS & CURRENT STUDENT COURSE PROGRESS TRACKING
app.get('/api/enrollments', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Session expired' });
    return;
  }
  const enrollments = dbStore.getTable('enrollments').filter(e => e.userId === req.user?.id);
  res.json(enrollments);
});

app.post('/api/enrollments/:courseId/progress', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const courseId = parseInt(req.params.courseId);
  const { progress, completed } = req.body;

  const enrollments = dbStore.getTable('enrollments');
  const index = enrollments.findIndex(e => e.userId === req.user?.id && e.courseId === courseId);

  if (index === -1) {
    // Auto-create enrollment on watch progress request
    const record = dbStore.insert('enrollments', {
      userId: req.user.id,
      courseId,
      progress: progress || 0,
      completed: completed || false
    });

    const courses = dbStore.getTable('courses');
    const course = courses.find(c => c.id === courseId);
    triggerAdminNotification(
      req.user.id,
      'course_enrollment',
      `New Course Enrollment: ${course ? course.title : 'Course #' + courseId}`,
      `Student ${req.user.name} started a new course enrollment request / tracker.\n\nCourse: ${course ? course.title : 'Course ID #' + courseId}\nInitial Progress: ${progress || 0}%`
    ).catch(err => console.error("Admin enrollment notif failed:", err));

    res.json(record);
    return;
  }

  const record = dbStore.update('enrollments', enrollments[index].id, {
    progress: progress !== undefined ? Math.min(progress, 100) : enrollments[index].progress,
    completed: completed !== undefined ? Boolean(completed) : enrollments[index].completed
  });

  res.json(record);
});

// 8. QUIZZES SUBMISSIONS
app.get('/api/courses/:courseId/quizzes', (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const quizzes = dbStore.getTable('quizzes').filter(q => q.courseId === courseId);
  const questions = dbStore.getTable('questions');

  const detailedQuizzes = quizzes.map(quiz => {
    const quizQuestions = questions.filter(quest => quest.quizId === quiz.id).map(quest => {
      let optionsParsed = null;
      try {
        if (typeof quest.options === 'string') {
          optionsParsed = JSON.parse(quest.options);
        } else {
          optionsParsed = quest.options;
        }
      } catch (e) {
        optionsParsed = quest.options;
      }
      return {
        ...quest,
        options: optionsParsed
      };
    });
    return { ...quiz, questions: quizQuestions };
  });

  res.json(detailedQuizzes);
});

// Submit Quiz Answer Sheet & Auto-graders
app.post('/api/quizzes/:quizId/submit', authenticateToken, (req: AuthenticatedRequest, res) => {
  const quizId = parseInt(req.params.quizId);
  const { answers } = req.body; // Map: questionId -> studentAnswer string or index int

  if (!answers || typeof answers !== 'object') {
    res.status(400).json({ message: 'No answers list submitted.' });
    return;
  }

  const quizzes = dbStore.getTable('quizzes');
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) {
    res.status(404).json({ message: 'Instructor quiz does not exist.' });
    return;
  }

  const questions = dbStore.getTable('questions').filter(q => q.quizId === quizId);
  if (questions.length === 0) {
    res.status(500).json({ message: 'No questions configured for this assessment.' });
    return;
  }

  let correctCount = 0;
  questions.forEach(q => {
    const studentAnswer = answers[q.id];
    if (studentAnswer !== undefined) {
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        let optionsArr: string[] = [];
        try {
          optionsArr = typeof q.options === 'string' ? JSON.parse(q.options) : q.options || [];
        } catch (e) {}

        const correctText = optionsArr[q.correctOptionIndex] || q.correctAnswer;
        if (String(studentAnswer).toLowerCase().trim() === String(correctText).toLowerCase().trim() ||
            String(studentAnswer) === String(q.correctOptionIndex)) {
          correctCount++;
        }
      } else {
        // short answer
        if (String(studentAnswer).toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
          correctCount++;
        }
      }
    }
  });

  const percentScore = Math.round((correctCount / questions.length) * 100);
  const passed = percentScore >= (quiz.passingScore || 70);

  const attempt = dbStore.insert('quiz_attempts', {
    userId: req.user?.id,
    quizId,
    score: percentScore,
    passed,
    correctCount,
    totalCount: questions.length,
    answersSubmitted: JSON.stringify(answers)
  });

  // Track Cert auto issuing on full course completions
  if (passed) {
    // If student has completed the lessons and passes first quiz, they receive completion cert
    const existingCert = dbStore.getTable('certificates').find(c => c.userId === req.user?.id && c.courseId === quiz.courseId);
    if (!existingCert) {
      const courses = dbStore.getTable('courses');
      const courseObj = courses.find(c => c.id === quiz.courseId);
      const randomCertNum = 'EZ-' + Math.floor(100000 + Math.random() * 900000);
      dbStore.insert('certificates', {
        userId: req.user?.id,
        courseId: quiz.courseId,
        studentName: req.user?.name || 'Martha Tefera',
        courseName: courseObj ? courseObj.title : 'Ezana Certification Course',
        certificateNumber: randomCertNum,
        issuedAt: new Date().toISOString()
      });

      dbStore.insert('notifications', {
        userId: req.user?.id,
        title: 'Graduation Certificate Generated! 🎓',
        message: `Congratulations! Your score of ${percentScore}% unlocked the Certificate ${randomCertNum}. Check in certificates panel to print context QR code.`,
        isRead: false
      });
    }
  }

  res.json({
    success: true,
    attempt: {
      id: attempt.id,
      score: percentScore,
      passed,
      correctCount,
      totalCount: questions.length
    }
  });
});

app.get('/api/student/quiz-attempts', authenticateToken, (req: AuthenticatedRequest, res) => {
  const attempts = dbStore.getTable('quiz_attempts').filter(a => a.userId === req.user?.id);
  res.json(attempts);
});

// 9. ASSIGNMENTS SUBMISSION CRUD
app.get('/api/courses/:courseId/assignments', (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const assignments = dbStore.getTable('assignments').filter(a => a.courseId === courseId);
  res.json(assignments);
});

// Create assignment
app.post('/api/assignments', authenticateToken, requireRole([1, 2]), (req, res) => {
  const { courseId, title, description, dueDate } = req.body;
  if (!courseId || !title || !description) {
    res.status(400).json({ message: 'Course ID, title, and homework description cannot be empty.' });
    return;
  }
  const assignment = dbStore.insert('assignments', {
    courseId: parseInt(courseId),
    title,
    description,
    dueDate: dueDate || '2026-06-30'
  });
  res.status(201).json(assignment);
});

// Student submit assignment script
app.post('/api/assignments/:assignmentId/submit', authenticateToken, upload.single('document'), (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Session expired' });
    return;
  }
  const assignmentId = parseInt(req.params.assignmentId);
  const { studentComments } = req.body;

  let fileUrl = '';
  if (req.file) {
    fileUrl = `/uploads/${req.file.filename}`;
  }

  const submission = dbStore.insert('submissions', {
    userId: req.user.id,
    assignmentId,
    fileUrl: fileUrl || '/uploads/sample-homework.pdf',
    studentComments: studentComments || '',
    grade: 'Pending',
    feedback: '',
    gradedAt: null
  });

  res.status(201).json({ success: true, message: 'Your assignment file has been safely uploaded for review.', submission });
});

// Instructors view submissions
app.get('/api/submissions', authenticateToken, requireRole([1, 2]), (req, res) => {
  const subs = dbStore.getTable('submissions');
  const users = dbStore.getTable('users');
  const assignments = dbStore.getTable('assignments');

  const fullSubs = subs.map(s => {
    const student = users.find(u => u.id === s.userId);
    const ass = assignments.find(a => a.id === s.assignmentId);
    return {
      ...s,
      studentName: student ? student.name : 'Martha Tefera',
      studentEmail: student ? student.email : 'Martha@example.com',
      assignmentTitle: ass ? ass.title : 'Responsive Layout Task'
    };
  });
  res.json(fullSubs);
});

// Grade student submission
app.put('/api/submissions/:id/grade', authenticateToken, requireRole([1, 2]), (req, res) => {
  const subId = parseInt(req.params.id);
  const { grade, feedback } = req.body;

  if (!grade) {
    res.status(400).json({ message: 'Please specify the evaluation grade (e.g. A, B, C, 85/100).' });
    return;
  }

  const updatedSub = dbStore.update('submissions', subId, {
    grade,
    feedback: feedback || 'Amazing effort! Meets enterprise specifications.',
    gradedAt: new Date().toISOString()
  });

  if (!updatedSub) {
    res.status(404).json({ message: 'Submission not found' });
    return;
  }

  // Notify student
  dbStore.insert('notifications', {
    userId: updatedSub.userId,
    title: 'Assignment Efficacy Marked',
    message: `Your instructor marked your exercise with Grade: ${grade}. Check reviews for detailed insights.`,
    isRead: false
  });

  res.json({ success: true, message: 'Student submission graded cleanly.', submission: updatedSub });
});

// BROADCAST ANNOUNCEMENT TO ALL STUDENTS (ACCESSED BY ADMINS OR LECTURERS)
app.post('/api/announcements/broadcast', authenticateToken, requireRole([1, 2]), (req: AuthenticatedRequest, res) => {
  const { title, message } = req.body;
  if (!title || !message) {
    res.status(400).json({ message: 'Both Announcement Title and Message are required.' });
    return;
  }

  const users = dbStore.getTable('users');
  const students = users.filter(u => u.roleId === 3);

  students.forEach(student => {
    dbStore.insert('notifications', {
      userId: student.id,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  });

  dbStore.save();
  res.json({ success: true, message: `Announcement broadcast successfully to all ${students.length} student workspace dashboards.` });
});

// 10. SYSTEM NOTIFICATIONS
app.get('/api/notifications', authenticateToken, (req: AuthenticatedRequest, res) => {
  const notifs = dbStore.getTable('notifications').filter(n => n.userId === req.user?.id);
  // Sort with the newest notifications on top
  const sortedNotifs = [...notifs].sort((a, b) => {
    const timeA = a.id ? a.id : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const timeB = b.id ? b.id : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return timeB - timeA;
  });
  res.json(sortedNotifs);
});

app.post('/api/notifications/read-all', authenticateToken, (req: AuthenticatedRequest, res) => {
  const notifs = dbStore.getTable('notifications');
  notifs.forEach(n => {
    if (n.userId === req.user?.id) {
      n.isRead = true;
    }
  });
  dbStore.save();
  res.json({ success: true });
});

// 11. CERTIFICATES LISTING
app.get('/api/certificates', authenticateToken, (req: AuthenticatedRequest, res) => {
  const certs = dbStore.getTable('certificates');
  if (req.user?.roleId === 3) {
    res.json(certs.filter(c => c.userId === req.user?.id));
  } else {
    res.json(certs);
  }
});

// 12. LOGS & STATISTS SYSTEM DEFAULTS
app.get('/api/logs', authenticateToken, requireRole([1]), (req, res) => {
  const logs = dbStore.getTable('activity_logs');
  // Order logs by newest
  const sortedLogs = [...logs].reverse().slice(0, 100);
  res.json(sortedLogs);
});

// SYSTEM SETTINGS
app.get('/api/settings', (req, res) => {
  res.json(dbStore.getTable('settings'));
});

app.put('/api/settings', authenticateToken, requireRole([1]), (req, res) => {
  const { key, value } = req.body;
  const settings = dbStore.getTable('settings');
  const index = settings.findIndex(s => s.key === key);
  if (index !== -1) {
    dbStore.update('settings', settings[index].id, { value });
  } else {
    dbStore.insert('settings', { key, value });
  }
  res.json({ success: true, key, value });
});

// PUBLIC STATISTICS COUNTER AGGREGATES
app.get('/api/stats', (req, res) => {
  const users = dbStore.getTable('users');
  const courses = dbStore.getTable('courses');
  const payments = dbStore.getTable('payments');

  const totalStudents = users.filter(u => u.roleId === 3).length;
  const totalInstructors = users.filter(u => u.roleId === 2).length;
  const totalCourses = courses.length;
  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;
  const approvedPaymentsCount = payments.filter(p => p.status === 'approved').length;
  const rejectedPaymentsCount = payments.filter(p => p.status === 'rejected').length;

  const totalRevenue = payments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 1000), 0);

  res.json({
    totalStudents: Math.max(totalStudents, 452), // Fallback initial stats if database is empty
    totalInstructors: Math.max(totalInstructors, 3),
    totalCourses: Math.max(totalCourses, 3),
    totalRevenue,
    pendingPaymentsCount,
    approvedPaymentsCount,
    rejectedPaymentsCount,
    activeUsersCount: Math.max(totalStudents, 12) + 2
  });
});

// PUBLIC TESTIMONIALS
app.get('/api/testimonials', (req, res) => {
  res.json(dbStore.getTable('testimonials'));
});

/* --- VITE DEVELOPMENT VS PRODUCTION HANDLING --- */

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Production - Serve dist static folder elements
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development - Load and use Vite Dev Server inside express to run on single Port 3000
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express Error:", err);
    res.status(500).json({ message: err.message || "An unexpected server error occurred." });
  });

  // Start Express Backend Server on Port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ezana Academy Enterprise server is active on http://localhost:${PORT}`);
    startRetryWorker(); // Boot smtp notification background auto-retry loop
  });
}

startServer().catch(err => {
  console.error("Express startup failure:", err);
});
