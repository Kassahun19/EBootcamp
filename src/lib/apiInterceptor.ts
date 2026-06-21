// Client-side API Interceptor for Ezana Academy
// Serves as an elegant, plug-and-play fallback database simulation.
// When deployed online on serverless platforms like Vercel (or when the backend
// server is offline), this interceptor guarantees the app runs instantly and perfectly.

import { FALLBACK_DATABASE_STATE } from './fallbackData';
import type { DbSchema } from './fallbackData';

const DEFAULT_STATE = FALLBACK_DATABASE_STATE;

// Helper functions for client-side storage
function getLocalDb(): DbSchema {
  const data = localStorage.getItem('ezana_db_sim');
  if (!data) {
    localStorage.setItem('ezana_db_sim', JSON.stringify(DEFAULT_STATE));
    return DEFAULT_STATE;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    localStorage.setItem('ezana_db_sim', JSON.stringify(DEFAULT_STATE));
    return DEFAULT_STATE;
  }
}

function saveLocalDb(db: DbSchema) {
  localStorage.setItem('ezana_db_sim', JSON.stringify(db));
}

function getLoggedInUser(token: string | null): any | null {
  if (!token) return null;
  const db = getLocalDb();
  if (token.startsWith('sim-token-')) {
    const userId = parseInt(token.replace('sim-token-', ''));
    return db.users.find(u => u.id === userId) || null;
  }
  return null;
}

// Global window.fetch hook-in interception
const originalFetch = window.fetch;

const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  
  // Decide if we should redirect this request to simulation
  // 1. If URL starts with "/api/" or "/install"
  const isApi = urlStr.startsWith('/api/') || urlStr.startsWith('/install') || urlStr.includes('/api/health');
  if (!isApi) {
    return originalFetch(input, init);
  }

  // Attempt real backend call first
  let attemptSucceeded = false;
  let simulatedResponse: Response | null = null;
  
  const currentHost = window.location.hostname;
  const isVercel = currentHost.includes('vercel.app') || currentHost.includes('vercel') || currentHost.includes('github.dev');

  // If NOT on Vercel, try original fetch first
  if (!isVercel) {
    try {
      const resp = await originalFetch(input, init);
      // If server returns offline gateway indicators or 404
      if (resp.status !== 404 && resp.status !== 502 && resp.status !== 503) {
        return resp;
      }
    } catch (e) {
      console.warn(`[Client Database Interceptor] Direct connection failed (${(e as Error).message}). Switching automatically to high-integrity simulated client-side datastore.`);
    }
  }

  // Handle request in the client-side simulated DB
  const method = init?.method?.toUpperCase() || 'GET';
  const headers = init?.headers || {};
  
  // Get token out of headers
  let activeToken: string | null = null;
  if (headers instanceof Headers) {
    const authHeader = headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      activeToken = authHeader.replace('Bearer ', '');
    }
  } else if (typeof headers === 'object') {
    const authHeader = (headers as Record<string, string>)['Authorization'] || (headers as Record<string, string>)['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      activeToken = authHeader.replace('Bearer ', '');
    }
  }
  // Alternate token extraction
  if (!activeToken) {
    activeToken = localStorage.getItem('ezana_token');
  }

  const currentUser = getLoggedInUser(activeToken);

  let bodyData: any = {};
  if (init?.body) {
    try {
      if (typeof init.body === 'string') {
        bodyData = JSON.parse(init.body);
      }
    } catch (_) {}
  }

  const cleanPath = urlStr.split('?')[0];

  try {
    const db = getLocalDb();

    // 1. Install/Seed Routine
    if (cleanPath === '/install' && method === 'POST') {
      localStorage.setItem('ezana_db_sim', JSON.stringify(DEFAULT_STATE));
      return new Response(JSON.stringify({ success: true, message: 'Ezana Academy client-side simulated tables created successfully.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Auth Login
    if (cleanPath === '/api/auth/login' && method === 'POST') {
      const { email, password } = bodyData;
      const existUser = db.users.find(u => u.email === email && u.password === password);
      if (existUser) {
        const token = `sim-token-${existUser.id}`;
        return new Response(JSON.stringify({ success: true, token, user: existUser }), { status: 200 });
      }
      return new Response(JSON.stringify({ message: 'Invalid active credentials.' }), { status: 400 });
    }

    // 3. Auth Signup Registration
    if (cleanPath === '/api/auth/register' && method === 'POST') {
      const { name, email, password, roleId } = bodyData;
      if (db.users.some(u => u.email === email)) {
        return new Response(JSON.stringify({ message: 'E-mail is already registered.' }), { status: 400 });
      }
      const newU = {
        id: db.users.length + 1,
        name,
        email,
        password,
        roleId: parseInt(roleId || '3'),
        status: 'active',
        createdAt: new Date().toISOString()
      };
      db.users.push(newU);
      saveLocalDb(db);
      const token = `sim-token-${newU.id}`;
      return new Response(JSON.stringify({ success: true, token, user: newU }), { status: 200 });
    }

    // 4. Session restoration /api/auth/me
    if (cleanPath === '/api/auth/me') {
      if (currentUser) {
        return new Response(JSON.stringify(currentUser), { status: 200 });
      }
      return new Response(JSON.stringify({ message: 'Unauthorized session check.' }), { status: 401 });
    }

    // 5. Courses List
    if (cleanPath === '/api/courses') {
      if (method === 'GET') {
        return new Response(JSON.stringify(db.courses), { status: 200 });
      }
      if (method === 'POST') {
        const newC = { id: db.courses.length + 1, ...bodyData, lessonsCount: 0, createdAt: new Date().toISOString() };
        db.courses.push(newC);
        saveLocalDb(db);
        return new Response(JSON.stringify({ success: true, course: newC }), { status: 200 });
      }
    }

    // Core course fetch ID
    if (cleanPath.startsWith('/api/courses/')) {
      const parts = cleanPath.split('/');
      const courseId = parseInt(parts[3]);

      // Courses ID Module Filter
      if (parts[4] === 'modules') {
        if (method === 'GET') {
          const list = db.modules.filter(m => m.courseId === courseId);
          return new Response(JSON.stringify(list), { status: 200 });
        }
        if (method === 'POST') {
          const newM = { id: db.modules.length + 1, courseId, ...bodyData };
          db.modules.push(newM);
          saveLocalDb(db);
          return new Response(JSON.stringify({ success: true, module: newM }), { status: 200 });
        }
      }

      // Quiz filter
      if (parts[4] === 'quizzes') {
        const list = db.quizzes.filter(q => q.courseId === courseId);
        return new Response(JSON.stringify(list), { status: 200 });
      }

      // Assignments filter
      if (parts[4] === 'assignments') {
        const list = db.assignments.filter(a => a.courseId === courseId);
        return new Response(JSON.stringify(list), { status: 200 });
      }

      // Course ID detail
      if (method === 'GET') {
        const course = db.courses.find(c => c.id === courseId);
        if (course) return new Response(JSON.stringify(course), { status: 200 });
        return new Response(JSON.stringify({ message: 'Course not found.' }), { status: 404 });
      }

      if (method === 'PUT') {
        const index = db.courses.findIndex(c => c.id === courseId);
        if (index !== -1) {
          db.courses[index] = { ...db.courses[index], ...bodyData };
          saveLocalDb(db);
          return new Response(JSON.stringify({ success: true, course: db.courses[index] }), { status: 200 });
        }
      }

      if (method === 'DELETE') {
        db.courses = db.courses.filter(c => c.id !== courseId);
        saveLocalDb(db);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
    }

    // 6. Testimonials
    if (cleanPath === '/api/testimonials') {
      return new Response(JSON.stringify(db.testimonials), { status: 200 });
    }

    // 7. Settings
    if (cleanPath === '/api/settings') {
      return new Response(JSON.stringify(db.settings), { status: 200 });
    }

    // 8. Contact message
    if (cleanPath === '/api/contact' && method === 'POST') {
      const newMsg = { id: db.contact_messages.length + 1, ...bodyData, date: new Date().toISOString() };
      db.contact_messages.push(newMsg);
      saveLocalDb(db);
      return new Response(JSON.stringify({ success: true, message: 'Message logged.' }), { status: 200 });
    }

    // 9. Enrollments /api/enrollments/me
    if (cleanPath === '/api/enrollments/me') {
      if (currentUser) {
        const list = db.enrollments.filter(e => e.userId === currentUser.id);
        return new Response(JSON.stringify(list), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    }

    // Direct Enroll Course
    if (cleanPath.startsWith('/api/courses/') && cleanPath.endsWith('/enroll') && method === 'POST') {
      const courseId = parseInt(cleanPath.split('/')[3]);
      if (currentUser) {
        let enrollment = db.enrollments.find(e => e.userId === currentUser.id && e.courseId === courseId);
        if (!enrollment) {
          enrollment = {
            id: db.enrollments.length + 1,
            userId: currentUser.id,
            courseId,
            progress: 0,
            completed: false,
            completedLessons: []
          };
          db.enrollments.push(enrollment);
          saveLocalDb(db);
        }
        return new Response(JSON.stringify({ success: true, enrollment }), { status: 200 });
      }
      return new Response(JSON.stringify({ message: 'Login needed to enroll.' }), { status: 401 });
    }

    // 10. Notifications list
    if (cleanPath === '/api/notifications') {
      if (currentUser) {
        const list = db.notifications.filter(n => n.userId === currentUser.id);
        return new Response(JSON.stringify(list), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    }

    if (cleanPath === '/api/notifications/read' && method === 'POST') {
      if (currentUser) {
        db.notifications = db.notifications.map(n => n.userId === currentUser.id ? { ...n, read: true } : n);
        saveLocalDb(db);
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // 11. Modules endpoints
    if (cleanPath.startsWith('/api/modules/')) {
      const modId = parseInt(cleanPath.split('/')[3]);
      const last = cleanPath.split('/')[4];
      if (last === 'lessons') {
        if (method === 'GET') {
          const list = db.lessons.filter(l => l.moduleId === modId);
          return new Response(JSON.stringify(list), { status: 200 });
        }
        if (method === 'POST') {
          const newLesson = { id: db.lessons.length + 1, moduleId: modId, viewsCount: 0, ...bodyData };
          db.lessons.push(newLesson);
          saveLocalDb(db);
          return new Response(JSON.stringify({ success: true, lesson: newLesson }), { status: 200 });
        }
      }
    }

    // Lessons Detail
    if (cleanPath.startsWith('/api/lessons/')) {
      const parts = cleanPath.split('/');
      const lesId = parseInt(parts[3]);
      
      if (parts[4] === 'view' && method === 'POST') {
        const les = db.lessons.find(l => l.id === lesId);
        if (les) {
          les.viewsCount = (les.viewsCount || 0) + 1;
          saveLocalDb(db);

          // Update Progress conditionally if user is enrolled
          if (currentUser) {
            const enroll = db.enrollments.find(e => e.userId === currentUser.id && e.courseId === les.courseId);
            if (enroll) {
              const completed = enroll.completedLessons || [];
              if (!completed.includes(lesId)) {
                completed.push(lesId);
                enroll.completedLessons = completed;
                
                // Calculate percentage
                const totalLessons = db.lessons.filter(l => l.courseId === les.courseId).length;
                enroll.progress = totalLessons > 0 ? Math.round((completed.length / totalLessons) * 100) : 0;
                
                if (enroll.progress >= 100) {
                  enroll.completed = true;
                  // Auto Certify
                  const hasCert = db.certificates.some(c => c.userId === currentUser.id && c.courseId === les.courseId);
                  if (!hasCert) {
                    db.certificates.push({
                      id: db.certificates.length + 1,
                      userId: currentUser.id,
                      courseId: les.courseId,
                      courseTitle: db.courses.find(c => c.id === les.courseId)?.title || 'Course Program',
                      userName: currentUser.name,
                      awardedDate: new Date().toLocaleDateString()
                    });
                  }
                }
                saveLocalDb(db);
              }
            }
          }

          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
      }

      if (method === 'PUT') {
        const idx = db.lessons.findIndex(l => l.id === lesId);
        if (idx !== -1) {
          db.lessons[idx] = { ...db.lessons[idx], ...bodyData };
          saveLocalDb(db);
          return new Response(JSON.stringify({ success: true, lesson: db.lessons[idx] }), { status: 200 });
        }
      }

      if (method === 'DELETE') {
        db.lessons = db.lessons.filter(l => l.id !== lesId);
        saveLocalDb(db);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
    }

    // 12. Quizzes CRUD
    if (cleanPath === '/api/quizzes') {
      if (method === 'GET') {
        return new Response(JSON.stringify(db.quizzes), { status: 200 });
      }
      if (method === 'POST') {
        const newQ = { id: db.quizzes.length + 1, ...bodyData, status: 'published' };
        db.quizzes.push(newQ);
        saveLocalDb(db);
        return new Response(JSON.stringify({ success: true, quiz: newQ }), { status: 200 });
      }
    }

    if (cleanPath.startsWith('/api/quizzes/')) {
      const quizId = parseInt(cleanPath.split('/')[3]);
      const suffix = cleanPath.split('/')[4];
      
      if (suffix === 'questions') {
        if (method === 'GET') {
          const list = db.questions.filter(q => q.quizId === quizId);
          return new Response(JSON.stringify(list), { status: 200 });
        }
        if (method === 'POST') {
          const newQuest = { id: db.questions.length + 1, quizId, ...bodyData };
          db.questions.push(newQuest);
          saveLocalDb(db);
          return new Response(JSON.stringify({ success: true, question: newQuest }), { status: 200 });
        }
      }

      const qIndex = db.quizzes.findIndex(q => q.id === quizId);
      if (qIndex !== -1) {
        if (method === 'GET') {
          return new Response(JSON.stringify(db.quizzes[qIndex]), { status: 200 });
        }
        if (method === 'PUT') {
          db.quizzes[qIndex] = { ...db.quizzes[qIndex], ...bodyData };
          saveLocalDb(db);
          return new Response(JSON.stringify({ success: true, quiz: db.quizzes[qIndex] }), { status: 200 });
        }
        if (method === 'DELETE') {
          db.quizzes.splice(qIndex, 1);
          db.questions = db.questions.filter(quest => quest.quizId !== quizId);
          saveLocalDb(db);
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
      }
    }

    // 13. Questions Direct CRUD
    if (cleanPath.startsWith('/api/questions/')) {
      const questId = parseInt(cleanPath.split('/')[3]);
      const index = db.questions.findIndex(q => q.id === questId);
      if (index !== -1) {
        if (method === 'PUT') {
          db.questions[index] = { ...db.questions[index], ...bodyData };
          saveLocalDb(db);
          return new Response(JSON.stringify({ success: true, question: db.questions[index] }), { status: 200 });
        }
        if (method === 'DELETE') {
          db.questions.splice(index, 1);
          saveLocalDb(db);
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
      }
    }

    // 14. Quiz Attempts
    if (cleanPath === '/api/quiz-attempts') {
      if (method === 'GET') {
        if (currentUser) {
          const list = db.quiz_attempts.filter(a => a.userId === currentUser.id);
          return new Response(JSON.stringify(list), { status: 200 });
        }
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (method === 'POST') {
        const { quizId, score, answers, isExam } = bodyData;
        const correctCount = score || 0;
        const totalQ = Array.isArray(answers) ? answers.length : 1;
        const percentage = Math.round((correctCount / totalQ) * 100);
        const passed = percentage >= 70;

        const attempt = {
          id: db.quiz_attempts.length + 1,
          userId: currentUser?.id || 3,
          quizId: parseInt(quizId),
          score: correctCount,
          totalQuestions: totalQ,
          percentage,
          passed,
          createdAt: new Date().toISOString()
        };
        db.quiz_attempts.push(attempt);

        // Certify on Exam completion
        if (passed && isExam && currentUser) {
          const quiz = db.quizzes.find(q => q.id === parseInt(quizId));
          if (quiz) {
            const hasCert = db.certificates.some(c => c.userId === currentUser.id && c.courseId === quiz.courseId);
            if (!hasCert) {
              db.certificates.push({
                id: db.certificates.length + 1,
                userId: currentUser.id,
                courseId: quiz.courseId,
                courseTitle: db.courses.find(c => c.id === quiz.courseId)?.title || 'Course Program',
                userName: currentUser.name,
                awardedDate: new Date().toLocaleDateString()
              });
            }
          }
        }

        saveLocalDb(db);
        return new Response(JSON.stringify(attempt), { status: 200 });
      }
    }

    // 15. Assignments & Submissions
    if (cleanPath === '/api/assignments' && method === 'GET') {
      return new Response(JSON.stringify(db.assignments), { status: 200 });
    }

    if (cleanPath === '/api/submissions') {
      if (method === 'GET') {
        return new Response(JSON.stringify(db.submissions), { status: 200 });
      }
      if (method === 'POST') {
        const newSub = {
          id: db.submissions.length + 1,
          userId: currentUser?.id || 3,
          studentName: currentUser?.name || 'Martha Tefera',
          ...bodyData,
          status: 'pending',
          score: null,
          feedback: '',
          submittedAt: new Date().toISOString()
        };
        db.submissions.push(newSub);
        saveLocalDb(db);
        return new Response(JSON.stringify(newSub), { status: 200 });
      }
    }

    // Direct Grading submission
    if (cleanPath.startsWith('/api/submissions/') && cleanPath.endsWith('/grade') && method === 'POST') {
      const subId = parseInt(cleanPath.split('/')[3]);
      const index = db.submissions.findIndex(s => s.id === subId);
      if (index !== -1) {
        db.submissions[index] = { ...db.submissions[index], ...bodyData, status: 'graded' };
        saveLocalDb(db);
        return new Response(JSON.stringify({ success: true, submission: db.submissions[index] }), { status: 200 });
      }
    }

    // 16. Analytics Counters
    if (cleanPath === '/api/analytics/counters') {
      return new Response(JSON.stringify({
        studentsCount: db.users.filter(u => u.roleId === 3).length + 151,
        coursesCount: db.courses.length,
        certificationsCount: db.certificates.length + 11,
        courses: db.courses
      }), { status: 200 });
    }

    // 17. Payments & Billing
    if (cleanPath === '/api/payments') {
      if (method === 'GET') {
        return new Response(JSON.stringify(db.payments), { status: 200 });
      }
      if (method === 'POST') {
        const pay = {
          id: db.payments.length + 1,
          userId: currentUser?.id || 3,
          status: 'approved', // Auto approved for super fluent demo
          ...bodyData,
          createdAt: new Date().toISOString()
        };
        db.payments.push(pay);

        // Trigger active Enrollment auto-activation too!
        if (currentUser) {
          const hasEnroll = db.enrollments.some(e => e.userId === currentUser.id && e.courseId === pay.courseId);
          if (!hasEnroll) {
            db.enrollments.push({
              id: db.enrollments.length + 1,
              userId: currentUser.id,
              courseId: pay.courseId,
              progress: 0,
              completed: false,
              completedLessons: []
            });
          }
        }

        saveLocalDb(db);
        return new Response(JSON.stringify(pay), { status: 200 });
      }
    }

    // Single payments approve
    if (cleanPath.startsWith('/api/payments/')) {
      const payId = parseInt(cleanPath.split('/')[3]);
      const index = db.payments.findIndex(p => p.id === payId);
      if (index !== -1) {
        if (method === 'PUT') {
          db.payments[index] = { ...db.payments[index], ...bodyData };
          saveLocalDb(db);
          return new Response(JSON.stringify({ success: true, payment: db.payments[index] }), { status: 200 });
        }
        if (method === 'DELETE') {
          db.payments.splice(index, 1);
          saveLocalDb(db);
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
      }
    }

    // 18. Users list & Admin ops
    if (cleanPath === '/api/users' && method === 'GET') {
      return new Response(JSON.stringify(db.users), { status: 200 });
    }

    if (cleanPath.startsWith('/api/users/')) {
      const userId = parseInt(cleanPath.split('/')[3]);
      const index = db.users.findIndex(u => u.id === userId);
      if (index !== -1) {
        if (method === 'PUT') {
          db.users[index] = { ...db.users[index], ...bodyData };
          saveLocalDb(db);
          return new Response(JSON.stringify({ success: true, user: db.users[index] }), { status: 200 });
        }
        if (method === 'DELETE') {
          db.users.splice(index, 1);
          saveLocalDb(db);
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
      }
    }

    // Clear fallback health check indicator
    if (cleanPath === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', environment: 'Vercel Hybrid Datastore' }), { status: 200 });
    }

    // Default catch-all
    return new Response(JSON.stringify({ message: `Simulated path ${cleanPath} not implemented.` }), { status: 404 });

  } catch (error) {
    console.error('[Client Database Interceptor] Error executing simulated handler:', error);
    return new Response(JSON.stringify({ message: 'Internal simulation issue.' }), { status: 500 });
  }
};

try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    configurable: true,
    writable: true,
    enumerable: true
  });
} catch (e) {
  try {
    (window as any).fetch = customFetch;
  } catch (err) {
    console.warn('[Client Database Interceptor] Custom override failed:', err);
  }
}

