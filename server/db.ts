import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure upload directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface DbSchema {
  users: any[];
  roles: any[];
  courses: any[];
  modules: any[];
  lessons: any[];
  youtube_videos: any[];
  enrollments: any[];
  payments: any[];
  payment_receipts: any[];
  assignments: any[];
  submissions: any[];
  quizzes: any[];
  questions: any[];
  quiz_attempts: any[];
  certificates: any[];
  notifications: any[];
  testimonials: any[];
  contact_messages: any[];
  activity_logs: any[];
  settings: any[];
}

const DEFAULT_STATE: DbSchema = {
  users: [],
  roles: [
    { id: 1, name: 'admin', description: 'Full access to panel' },
    { id: 2, name: 'instructor', description: 'Course and student management' },
    { id: 3, name: 'student', description: 'Access to learning materials' }
  ],
  courses: [],
  modules: [],
  lessons: [],
  youtube_videos: [],
  enrollments: [],
  payments: [],
  payment_receipts: [],
  assignments: [],
  submissions: [],
  quizzes: [],
  questions: [],
  quiz_attempts: [],
  certificates: [],
  notifications: [],
  testimonials: [
    { id: 1, name: "Abebe Kebede", role: "Software Engineer", content: "Ezana Academy completely shifted my career trajectory. The AI Full Stack course is direct, rigorous, and highly practical.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
    { id: 2, name: "Helen Alula", role: "Maths Teacher", content: "The discrete mathematics and Calculus modules are brilliantly structured. Highly recommended for students of all backgrounds.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
    { id: 3, name: "Michael Demeke", role: "SaaS Starter", content: "The payment workflow is simple, and the instructor feedback on assignments is top-tier. Lifetime access is totally worth ETB 1,000.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" }
  ],
  contact_messages: [
    { id: 1, name: "Samuel Hailu", email: "samuel@example.com", subject: "SaaS Partnership", message: "Hello, do you offer corporate packages for tech training?", date: "2026-06-05T10:30:00Z" }
  ],
  activity_logs: [],
  settings: [
    { key: 'site_name', value: 'Ezana Academy' },
    { key: 'premium_price_etb', value: '1000' },
    { key: 'payment_account_info', value: 'CBE Birr / Telebirr - Ye-Buna Link' }
  ]
};

class DatabaseEngine {
  private data: DbSchema = { ...DEFAULT_STATE };

  constructor() {
    this.load();
    // If database contains no user or course records, auto-install default seeds to guarantee instant functional state
    if (this.data.users.length === 0 || !this.data.courses || this.data.courses.length === 0) {
      console.log("Database is empty or missing courses on start. Running automated table seeding and initialization routines...");
      this.installDatabase();
    }
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = { ...DEFAULT_STATE };
        this.save();
      }
    } catch (e) {
      console.error("Error loading database file, initializing empty:", e);
      this.data = { ...DEFAULT_STATE };
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write to database file:", e);
    }
  }

  // Read direct database pointer
  getTable<K extends keyof DbSchema>(table: K): DbSchema[K] {
    return this.data[table];
  }

  // Insert helper
  insert<K extends keyof DbSchema>(table: K, record: any): any {
    const list = this.data[table];
    const newId = list.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
    const newRecord = { id: newId, ...record, createdAt: new Date().toISOString() };
    list.push(newRecord);
    this.save();
    this.logActivity(`INSERT into ${table}`, `Record created with ID: ${newId}`);
    return newRecord;
  }

  // Update helper
  update<K extends keyof DbSchema>(table: K, id: number, updates: any): any {
    const list = this.data[table];
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;
    const updatedRecord = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
    list[index] = updatedRecord;
    this.save();
    this.logActivity(`UPDATE ${table}`, `Record ID: ${id} updated.`);
    return updatedRecord;
  }

  // Delete helper
  delete<K extends keyof DbSchema>(table: K, id: number): boolean {
    const list = this.data[table];
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    this.save();
    this.logActivity(`DELETE from ${table}`, `Record ID: ${id} is deleted.`);
    return true;
  }

  logActivity(action: string, details: string, userId?: number) {
    const logs = this.data.activity_logs;
    const newId = logs.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
    logs.push({
      id: newId,
      userId: userId || null,
      action,
      details,
      timestamp: new Date().toISOString()
    });
    this.save();
  }

  // Full Database installation logic (POST /install)
  async installDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      // Re-initialize default collections
      this.data = {
        users: [],
        roles: [
          { id: 1, name: 'admin', description: 'Full access to panel' },
          { id: 2, name: 'instructor', description: 'Course and student management' },
          { id: 3, name: 'student', description: 'Access to learning materials' }
        ],
        courses: [],
        modules: [],
        lessons: [],
        youtube_videos: [],
        enrollments: [],
        payments: [],
        payment_receipts: [],
        assignments: [],
        submissions: [],
        quizzes: [],
        questions: [],
        quiz_attempts: [],
        certificates: [],
        notifications: [],
        testimonials: [...DEFAULT_STATE.testimonials],
        contact_messages: [...DEFAULT_STATE.contact_messages],
        activity_logs: [],
        settings: [...DEFAULT_STATE.settings]
      };

      // 1. Create Core Roles (Seeded)
      this.logActivity("DB INSTALL", "Created Roles table.");

      // 2. Insert Standard Seeding Admin & Instructor & Student
      const salt = bcrypt.genSaltSync(10);
      const adminPass = bcrypt.hashSync("admin123", salt);
      const instructorPass = bcrypt.hashSync("instructor123", salt);
      const studentPass = bcrypt.hashSync("student123", salt);

      this.insert('users', {
        name: 'Kassahun Mulatu',
        email: 'admin@ezana.com',
        password: adminPass,
        roleId: 1, // Admin
        status: 'active'
      });

      this.insert('users', {
        name: 'Dr. Demeke Assefa',
        email: 'instructor@ezana.com',
        roleId: 2, // Instructor
        password: instructorPass,
        status: 'active'
      });

      this.insert('users', {
        name: 'Martha Tefera',
        email: 'student@ezana.com',
        roleId: 3, // Student
        password: studentPass,
        status: 'active'
      });

      // 3. Create Courses
      const englishCourse = this.insert('courses', {
        title: 'Mastering Professional Conversational English',
        description: 'Accelerate your career with elite communication strategies, business vocabularies, native idioms, and advanced interactive pronunciations.',
        category: 'English',
        instructorId: 2,
        duration: '12 Hours',
        lessonsCount: 4,
        thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
        premium: true,
        published: true
      });

      const mathCourse = this.insert('courses', {
        title: 'Discrete Mathematics and Analytical Calculus',
        description: 'Construct solid structural logic foundations. Master set theory, mathematical proofs, combinations, dynamic graphing, and derivatives.',
        category: 'Mathematics',
        instructorId: 2,
        duration: '18 Hours',
        lessonsCount: 4,
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600',
        premium: true,
        published: true
      });

      const aiCourse = this.insert('courses', {
        title: 'AI-Powered Full Stack Web Development',
        description: 'Build robust scalable modern applications using React, Express, and SQLite. Seamlessly deploy and leverage Gemini AI prompt orchestration and APIs.',
        category: 'AI Full Stack',
        instructorId: 2,
        duration: '24 Hours',
        lessonsCount: 6,
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
        premium: true,
        published: true
      });

      // 4. Create Modules and lessons for English
      const engModule1 = this.insert('modules', {
        courseId: englishCourse.id,
        title: 'Module 1: Workplace Communication Dynamics',
        description: 'Master correct tones, professional emails, and elevator pitches.'
      });
      const engModule2 = this.insert('modules', {
        courseId: englishCourse.id,
        title: 'Module 2: Idiomatic Brilliance & Fluency',
        description: 'Learn everyday expressions to sound authentic and highly native.'
      });

      // YouTube Video IDs for English (using popular top-tier educational videos)
      const engLesson1 = this.insert('lessons', {
        moduleId: engModule1.id,
        courseId: englishCourse.id,
        title: 'Professional Intro & Core Vocabulary',
        description: 'How to make a high-impact first impression in business conversations.',
        youtubeId: 'eIho2S0ZahI', // Permanently active Julian Treasure TED talk on professional voice and vocabulary
        isPreview: true, // Demo video
        duration: '15 mins'
      });
      const engLesson2 = this.insert('lessons', {
        moduleId: engModule1.id,
        courseId: englishCourse.id,
        title: 'Mastering Email Etiquette & Responses',
        description: 'Polite vocabulary and phrases to structure clear workplace messages.',
        youtubeId: 'qf_U64eKx08',
        isPreview: false,
        duration: '18 mins'
      });
      const engLesson3 = this.insert('lessons', {
        moduleId: engModule2.id,
        courseId: englishCourse.id,
        title: 'Common American Idioms Explained',
        description: 'Discover the contextual meanings of idioms used daily in professional settings.',
        youtubeId: 'Wun8_B3M4pY',
        isPreview: false,
        duration: '22 mins'
      });
      const engLesson4 = this.insert('lessons', {
        moduleId: engModule2.id,
        courseId: englishCourse.id,
        title: 'Sounding Natural: Intonation Drill',
        description: 'Advanced voice rise-and-fall rhythm exercises for high clarity speech.',
        youtubeId: 'T8X8hFmsb5U',
        isPreview: false,
        duration: '16 mins'
      });

      // Modules and lessons for Maths
      const mathModule1 = this.insert('modules', {
        courseId: mathCourse.id,
        title: 'Module 1: Logic & Set Theory Foundations',
        description: 'Propositional operators, set builders, Venn representations.'
      });
      const mathModule2 = this.insert('modules', {
        courseId: mathCourse.id,
        title: 'Module 2: Calculus Core Foundations',
        description: 'Concept of limits, differentiation, and curves.'
      });

      const mathLesson1 = this.insert('lessons', {
        moduleId: mathModule1.id,
        courseId: mathCourse.id,
        title: 'Introduction to Discrete Logic Statements',
        description: 'Master truth tables, logic Gates, conditionals, and logical equivalences.',
        youtubeId: '3U7u9z7zR0U',
        isPreview: true, // Demo video
        duration: '22 mins'
      });
      const mathLesson2 = this.insert('lessons', {
        moduleId: mathModule1.id,
        courseId: mathCourse.id,
        title: 'Sets, Subsets, and Set Operations',
        description: 'Unions, intersections, cartesian products, and notation definitions.',
        youtubeId: 'j98Z-Yp97OQ',
        isPreview: false,
        duration: '20 mins'
      });
      const mathLesson3 = this.insert('lessons', {
        moduleId: mathModule2.id,
        courseId: mathCourse.id,
        title: 'Understanding Calculus Limits Intuitively',
        description: 'Discover the bedrock of calculus with graphics-heavy limits definitions.',
        youtubeId: 'YNstP0ESpsU',
        isPreview: false,
        duration: '31 mins'
      });
      const mathLesson4 = this.insert('lessons', {
        moduleId: mathModule2.id,
        courseId: mathCourse.id,
        title: 'The Power Rule & Derivative Shortcuts',
        description: 'Easy mathematical derivation techniques to find curves slopes.',
        youtubeId: 'O9Yg28v86u0',
        isPreview: false,
        duration: '25 mins'
      });

      // Modules and lessons for AI Web Dev
      const aiModule1 = this.insert('modules', {
        courseId: aiCourse.id,
        title: 'Module 1: Interactive Frontends with React',
        description: 'Hooks, States, DOM diffing, and Tailwind configuration.'
      });
      const aiModule2 = this.insert('modules', {
        courseId: aiCourse.id,
        title: 'Module 2: High Performance APIs in Express & Node',
        description: 'Routing, middleware architectures, and SQLite connections.'
      });
      const aiModule3 = this.insert('modules', {
        courseId: aiCourse.id,
        title: 'Module 3: AI Orchestration (Gemini)',
        description: 'Leveraging Gemini APIs in node servers to build smarter interfaces.'
      });

      const aiLesson1 = this.insert('lessons', {
        moduleId: aiModule1.id,
        courseId: aiCourse.id,
        title: 'React Components, Props & State Loops',
        description: 'Learn fundamental UI rendering lifecycle and interactive state workflows.',
        youtubeId: 'Ke90Tje7VS0',
        isPreview: true, // Demo video
        duration: '35 mins'
      });
      const aiLesson2 = this.insert('lessons', {
        moduleId: aiModule1.id,
        courseId: aiCourse.id,
        title: 'Styling at Light Speed with Tailwind CSS',
        description: 'Utility classes, grid structures, layouts, animations, and transitions.',
        youtubeId: 'UBOj6txRkco',
        isPreview: false,
        duration: '22 mins'
      });
      const aiLesson3 = this.insert('lessons', {
        moduleId: aiModule2.id,
        courseId: aiCourse.id,
        title: 'ExpressJS Routes, Middlewares, and Headers',
        description: 'Configure clean secure REST endpoints to interact with your frontend app.',
        youtubeId: 'lY6icfhap2o',
        isPreview: false,
        duration: '40 mins'
      });
      const aiLesson4 = this.insert('lessons', {
        moduleId: aiModule2.id,
        courseId: aiCourse.id,
        title: 'DB Integration: Storing relational rows safely',
        description: 'How to construct secure relational connections and query records.',
        youtubeId: 'HXV3zeQKqGY',
        isPreview: false,
        duration: '28 mins'
      });
      const aiLesson5 = this.insert('lessons', {
        moduleId: aiModule3.id,
        courseId: aiCourse.id,
        title: 'Intro to `@google/genai` TypeScript Node SDK',
        description: 'Generate real-time AI context tokens, complete structured outputs, and stream chats.',
        youtubeId: 'Kz9-jSVo8mU',
        isPreview: false,
        duration: '42 mins'
      });
      const aiLesson6 = this.insert('lessons', {
        moduleId: aiModule3.id,
        courseId: aiCourse.id,
        title: 'Fine-Tuning Prompts & System Instructions',
        description: 'Structuring clean models outputs for structured visual dashboards.',
        youtubeId: 'F1g_z0a9C4k',
        isPreview: false,
        duration: '33 mins'
      });

      // Create Free Web Dev Course to host the playlist videos
      const freeWebCourse = this.insert('courses', {
        title: 'Introduction to Web Development & Future of AI',
        description: 'Your gateway to engineering in Ethiopia and beyond. Master the absolute basics of HTML, structured layout rendering, and prepare yourself for the developer workforce by 2030.',
        category: 'AI Full Stack',
        instructorId: 2,
        duration: '5 Hours',
        lessonsCount: 6,
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600',
        premium: false,
        published: true
      });

      const freeModule1 = this.insert('modules', {
        courseId: freeWebCourse.id,
        title: 'Module 1: Preparing for the Future with Artificial Intelligence & AI Readiness',
        description: 'Deep dive discussions about technological shifts, industry expectations, and self-readiness.'
      });

      const freeModule2 = this.insert('modules', {
        courseId: freeWebCourse.id,
        title: 'Module 2: Getting Started and HTML Basics',
        description: 'Understand the building blocks of the web, browser layouts, and elements.'
      });

      this.insert('lessons', {
        moduleId: freeModule2.id,
        courseId: freeWebCourse.id,
        title: 'Introducing Ezana Academy',
        description: 'Brief introduction to Ezana Academy objectives, student tracks, and e-learning facilities.',
        youtubeId: '-7P8QpFCZyo',
        isPreview: true,
        duration: '2 mins'
      });

      this.insert('lessons', {
        moduleId: freeModule2.id,
        courseId: freeWebCourse.id,
        title: 'Introduction to HTML',
        description: 'Learn the architectural structure of a HTML template file and tag pairs.',
        youtubeId: 'ZGl_dOoWC5c',
        isPreview: true,
        duration: '15 mins'
      });

      this.insert('lessons', {
        moduleId: freeModule2.id,
        courseId: freeWebCourse.id,
        title: 'HTML Basics – Part 1 | Introduction to Web Development',
        description: 'Step-by-step introduction to tag headers, images, layout boxes, and core structural tags.',
        youtubeId: 'DRD4I2ar7_Q',
        isPreview: false,
        duration: '25 mins'
      });

      this.insert('lessons', {
        moduleId: freeModule2.id,
        courseId: freeWebCourse.id,
        title: 'Basics of HTML – Part II',
        description: 'Master advanced lists, interactive forms, links, buttons, and structured layout styling foundations.',
        youtubeId: 'Sj_TSrRuUHw',
        isPreview: false,
        duration: '22 mins'
      });

      this.insert('lessons', {
        moduleId: freeModule1.id,
        courseId: freeWebCourse.id,
        title: 'ለ2030 እንዴት እንዘጋጅ? - Evangadi Night - EPS I',
        description: 'First part of the essential discussion on career preparation and strategic tech skills for upcoming industry horizons.',
        youtubeId: 'vx4tXeIBTNY',
        isPreview: true,
        duration: '1 Hour 10 mins'
      });

      this.insert('lessons', {
        moduleId: freeModule1.id,
        courseId: freeWebCourse.id,
        title: 'በ2030 በAI ላለመተካት እንዴት እንዘጋጅ? - Evangadi Night - EPS II',
        description: 'Strategic analysis and guidance on staying irreplaceable and relevant in the golden era of generative models and automation tools.',
        youtubeId: 'baLf033SUkg',
        isPreview: true,
        duration: '1 Hour 32 mins'
      });

      // 5. Create Quiz Questions for AI developer course Modules
      const devQuiz = this.insert('quizzes', {
        courseId: aiCourse.id,
        title: 'AI Full-Stack React Core Fundamentals Quiz',
        description: 'Test your grasp of state mechanics, render intervals, and Tailwind layout logic.',
        passingScore: 70
      });

      this.insert('questions', {
        quizId: devQuiz.id,
        type: 'multiple_choice',
        questionText: 'Which React hook is explicitly utilized to memorize computed values and prevent redundant calculations?',
        options: JSON.stringify(['useEffect', 'useMemo', 'useRef', 'useCallback']),
        correctOptionIndex: 1, // useMemo
        correctAnswer: 'useMemo'
      });

      this.insert('questions', {
        quizId: devQuiz.id,
        type: 'true_false',
        questionText: 'Vite binds hot module replacement on port 3000 directly inside AI Studio workspaces.',
        options: JSON.stringify(['True', 'False']),
        correctOptionIndex: 1, // False
        correctAnswer: 'False'
      });

      this.insert('questions', {
        quizId: devQuiz.id,
        type: 'short_answer',
        questionText: 'What is the utility class prefix used in Tailwind to implement dark mode custom styles (lowercase)?',
        options: null,
        correctOptionIndex: null,
        correctAnswer: 'dark'
      });

      // Course Quizzes for math
      const mathQuiz = this.insert('quizzes', {
        courseId: mathCourse.id,
        title: 'Logic statements & sets logic test',
        description: 'Verify your proof-building capabilities in propositional logic.',
        passingScore: 75
      });

      this.insert('questions', {
        quizId: mathQuiz.id,
        type: 'multiple_choice',
        questionText: 'In propositional logic, when is a conditional statement (p → q) FALSE?',
        options: JSON.stringify(['When p is true and q is false', 'When p is false and q is true', 'When both are false', 'When both are true']),
        correctOptionIndex: 0,
        correctAnswer: 'When p is true and q is false'
      });

      // Create Assignments
      this.insert('assignments', {
        courseId: aiCourse.id,
        title: 'Assignment 1: Responsive Flex Grid Form',
        description: 'Construct a visual profile editor with clean touch-enabled Tailwind utility forms. Support profile metadata and save status alerts.',
        dueDate: '2026-06-30'
      });

      // Create notifications
      this.insert('notifications', {
        userId: 3,
        title: 'Welcome to Ezana Academy!',
        message: 'Your enrollment workspace is loaded and prepared. Navigate to the courses catalog to watch free preview demo courses elements.',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      this.save();
      this.logActivity("DB INSTALL", "Enterprise tables schema and seeding datasets fully reloaded.");
      return { success: true, message: "MySQL simulation schema created and populated with demo courses!" };
    } catch (e: any) {
      this.logActivity("DB INSTALL ERROR", e.message || "Failed db install process.");
      return { success: false, message: e.message || "Fatal installation error occurred." };
    }
  }
}

export const dbStore = new DatabaseEngine();
