// Fallback seed data for local storage and Vercel static deployments
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

export const FALLBACK_DATABASE_STATE: DbSchema = {
  users: [
    { id: 1, name: 'Kassahun Mulatu', email: 'admin@ezana.com', password: 'admin123', roleId: 1, status: 'active' },
    { id: 2, name: 'Dr. Demeke Assefa', email: 'instructor@ezana.com', password: 'instructor123', roleId: 2, status: 'active' },
    { id: 3, name: 'Martha Tefera', email: 'student@ezana.com', password: 'student123', roleId: 3, status: 'active' }
  ],
  roles: [
    { id: 1, name: 'admin', description: 'Full access to panel' },
    { id: 2, name: 'instructor', description: 'Course and student management' },
    { id: 3, name: 'student', description: 'Access to learning materials' }
  ],
  courses: [
    {
      id: 1,
      title: 'Mastering Professional Conversational English',
      description: 'Accelerate your career with elite communication strategies, business vocabularies, native idioms, and advanced interactive pronunciations.',
      category: 'English',
      instructorId: 2,
      duration: '12 Hours',
      lessonsCount: 4,
      thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
      premium: true,
      published: true
    },
    {
      id: 2,
      title: 'Discrete Mathematics and Analytical Calculus',
      description: 'Construct solid structural logic foundations. Master set theory, mathematical proofs, combinations, dynamic graphing, and derivatives.',
      category: 'Mathematics',
      instructorId: 2,
      duration: '18 Hours',
      lessonsCount: 4,
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600',
      premium: true,
      published: true
    },
    {
      id: 3,
      title: 'AI-Powered Full Stack Web Development',
      description: 'Build robust scalable modern applications using React, Express, and SQLite. Seamlessly deploy and leverage Gemini AI prompt orchestration and APIs.',
      category: 'AI Full Stack',
      instructorId: 2,
      duration: '24 Hours',
      lessonsCount: 6,
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
      premium: true,
      published: true
    },
    {
      id: 4,
      title: 'Introduction to Web Development & Future of AI',
      description: 'Your gateway to engineering in Ethiopia and beyond. Master the absolute basics of HTML, structured layout rendering, and prepare yourself for the developer workforce by 2030.',
      category: 'AI Full Stack',
      instructorId: 2,
      duration: '5 Hours',
      lessonsCount: 4,
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600',
      premium: false,
      published: true
    }
  ],
  modules: [
    { id: 1, courseId: 1, title: 'Module 1: Workplace Communication Dynamics', description: 'Master correct tones, professional emails, and elevator pitches.' },
    { id: 2, courseId: 1, title: 'Module 2: Idiomatic Brilliance & Fluency', description: 'Learn everyday expressions to sound authentic and highly native.' },
    { id: 3, courseId: 2, title: 'Module 1: Logic & Set Theory Foundations', description: 'Propositional operators, set builders, Venn representations.' },
    { id: 4, courseId: 2, title: 'Module 2: Calculus Core Foundations', description: 'Concept of limits, differentiation, and curves.' },
    { id: 5, courseId: 3, title: 'Module 1: Interactive Frontends with React', description: 'Hooks, States, DOM diffing, and Tailwind configuration.' },
    { id: 6, courseId: 3, title: 'Module 2: High Performance APIs in Express & Node', description: 'Routing, middleware architectures, and SQLite connections.' },
    { id: 7, courseId: 3, title: 'Module 3: AI Orchestration (Gemini)', description: 'Leveraging Gemini APIs in node servers to build smarter interfaces.' },
    { id: 8, courseId: 4, title: 'Module 1: Preparing for the Future with Artificial Intelligence & AI Readiness', description: 'Deep dive discussions about technological shifts, industry expectations, and self-readiness.' },
    { id: 9, courseId: 4, title: 'Module 2: Getting Started and HTML Basics', description: 'Understand the building blocks of the web, browser layouts, and elements.' }
  ],
  lessons: [
    { id: 1, moduleId: 1, courseId: 1, title: 'Professional Intro & Core Vocabulary', description: 'How to make a high-impact first impression in business conversations.', youtubeId: 'eIho2S0ZahI', isPreview: true, duration: '15 mins', viewsCount: 145 },
    { id: 2, moduleId: 1, courseId: 1, title: 'Mastering Email Etiquette & Responses', description: 'Polite vocabulary and phrases to structure clear workplace messages.', youtubeId: 'qf_U64eKx08', isPreview: false, duration: '18 mins', viewsCount: 92 },
    { id: 3, moduleId: 2, courseId: 1, title: 'Common American Idioms Explained', description: 'Discover the contextual meanings of idioms used daily in professional settings.', youtubeId: 'Wun8_B3M4pY', isPreview: false, duration: '22 mins', viewsCount: 84 },
    { id: 4, moduleId: 2, courseId: 1, title: 'Sounding Natural: Intonation Drill', description: 'Advanced voice rise-and-fall rhythm exercises for high clarity speech.', youtubeId: 'T8X8hFmsb5U', isPreview: false, duration: '16 mins', viewsCount: 101 },
    { id: 5, moduleId: 3, courseId: 2, title: 'Introduction to Discrete Logic Statements', description: 'Master truth tables, logic Gates, conditionals, and logical equivalences.', youtubeId: '3U7u9z7zR0U', isPreview: true, duration: '22 mins', viewsCount: 211 },
    { id: 6, moduleId: 3, courseId: 2, title: 'Sets, Subsets, and Set Operations', description: 'Unions, intersections, cartesian products, and notation definitions.', youtubeId: 'j98Z-Yp97OQ', isPreview: false, duration: '20 mins', viewsCount: 178 },
    { id: 7, moduleId: 4, courseId: 2, title: 'Understanding Calculus Limits Intuitively', description: 'Discover the bedrock of calculus with graphics-heavy limits definitions.', youtubeId: 'YNstP0ESpsU', isPreview: false, duration: '31 mins', viewsCount: 120 },
    { id: 8, moduleId: 4, courseId: 2, title: 'The Power Rule & Derivative Shortcuts', description: 'Easy mathematical derivation techniques to find curves slopes.', youtubeId: 'O9Yg28v86u0', isPreview: false, duration: '25 mins', viewsCount: 134 },
    { id: 9, moduleId: 5, courseId: 3, title: 'React Components, Props & State Loops', description: 'Learn fundamental UI rendering lifecycle and interactive state workflows.', youtubeId: 'Ke90Tje7VS0', isPreview: true, duration: '35 mins', viewsCount: 345 },
    { id: 10, moduleId: 5, courseId: 3, title: 'Styling at Light Speed with Tailwind CSS', description: 'Utility classes, grid structures, layouts, animations, and transitions.', youtubeId: 'UBOj6txRkco', isPreview: false, duration: '22 mins', viewsCount: 290 },
    { id: 11, moduleId: 6, courseId: 3, title: 'ExpressJS Routes, Middlewares, and Headers', description: 'Configure clean secure REST endpoints to interact with your frontend app.', youtubeId: 'lY6icfhap2o', isPreview: false, duration: '40 mins', viewsCount: 198 },
    { id: 12, moduleId: 6, courseId: 3, title: 'DB Integration: Storing relational rows safely', description: 'How to construct secure relational connections and query records.', youtubeId: 'HXV3zeQKqGY', isPreview: false, duration: '28 mins', viewsCount: 145 },
    { id: 13, moduleId: 7, courseId: 3, title: 'Intro to `@google/genai` TypeScript Node SDK', description: 'Generate real-time AI context tokens, complete structured outputs, and stream chats.', youtubeId: 'Kz9-jSVo8mU', isPreview: false, duration: '42 mins', viewsCount: 220 },
    { id: 14, moduleId: 7, courseId: 3, title: 'Fine-Tuning Prompts & System Instructions', description: 'Structuring clean models outputs for structured visual dashboards.', youtubeId: 'F1g_z0a9C4k', isPreview: false, duration: '33 mins', viewsCount: 176 },
    { id: 15, moduleId: 9, courseId: 4, title: 'Introducing Ezana Academy', description: 'Brief introduction to Ezana Academy objectives, student tracks, and e-learning facilities.', youtubeId: '-7P8QpFCZyo', isPreview: true, duration: '2 mins', viewsCount: 99 },
    { id: 16, moduleId: 9, courseId: 4, title: 'Introduction to HTML', description: 'Learn the architectural structure of a HTML template file and tag pairs.', youtubeId: 'ZGl_dOoWC5c', isPreview: true, duration: '15 mins', viewsCount: 287 },
    { id: 17, moduleId: 9, courseId: 4, title: 'HTML Basics – Part 1 | Introduction to Web Development', description: 'Step-by-step introduction to tag headers, images, layout boxes, and core structural tags.', youtubeId: 'DRD4I2ar7_Q', isPreview: false, duration: '25 mins', viewsCount: 182 },
    { id: 18, moduleId: 9, courseId: 4, title: 'Basics of HTML – Part II', description: 'Master advanced lists, interactive forms, links, buttons, and structured layout styling foundations.', youtubeId: 'Sj_TSrRuUHw', isPreview: false, duration: '22 mins', viewsCount: 164 }
  ],
  youtube_videos: [],
  enrollments: [
    { id: 1, userId: 3, courseId: 4, progress: 50, completed: false, completedLessons: [15, 16] }
  ],
  payments: [
    { id: 1, userId: 3, courseId: 1, amount: 1000, referenceCode: 'CBE-SIM-98124', status: 'approved', createdAt: new Date().toISOString() }
  ],
  payment_receipts: [],
  assignments: [
    { id: 1, courseId: 1, title: 'Professional Business Email Drafting', description: 'Draft a formal response to an angry stakeholder correcting a shipment error using at least 3 newly learned professional vocabularies.', dueDate: '2026-06-30' },
    { id: 2, courseId: 2, title: 'Relational Proposition Proof Formulation', description: 'Construct a step-by-step rigorous logical proof showing that (A ∩ B) U (A ∩ B\') = A.', dueDate: '2026-07-05' },
    { id: 3, courseId: 3, title: 'Building your first REST controller with Node.js', description: 'Write a complete Express route configuration holding GET and POST request operations with status code mappings.', dueDate: '2026-07-10' }
  ],
  submissions: [],
  quizzes: [
    { id: 1, courseId: 1, title: 'Business English & Tone Placement', description: 'Assess correct tones, professional vocabulary, and basic business idioms.', duration: 15, randomizeQuestions: true, randomizeAnswers: true, status: 'published', isExam: false },
    { id: 2, courseId: 2, title: 'Set Operations and Discrete Logic Exam', description: 'Comprehensive evaluation covering propositions, subsets, truth states, and functions.', duration: 30, randomizeQuestions: true, randomizeAnswers: true, status: 'published', isExam: true },
    { id: 3, courseId: 3, title: 'React and Express Core Architecture Quiz', description: 'Evaluate comprehension of React rendering lifecycles, states, and Express routing handlers.', duration: 20, randomizeQuestions: true, randomizeAnswers: true, status: 'published', isExam: false }
  ],
  questions: [
    { id: 1, quizId: 1, type: 'multiple_choice', questionText: 'In professional contexts, which word is the most appropriate synonym for "to start or launch" an initiative?', options: '["Commence", "Get going", "Kick off", "Ignite"]', correctOptionIndex: 0, correctAnswer: 'Commence', difficulty: 'medium', topic: 'Business Vocabulary' },
    { id: 2, quizId: 1, type: 'true_false', questionText: 'Is it correct to use "irregardless" in professional business emails?', options: '["True", "False"]', correctOptionIndex: 1, correctAnswer: 'False', difficulty: 'easy', topic: 'Grammar' },
    { id: 3, quizId: 2, type: 'multiple_choice', questionText: 'In propositional logic, if p is True and q is False, what is the truth value of the statement (p ↔ q)?', options: '["True", "False"]', correctOptionIndex: 1, correctAnswer: 'False', difficulty: 'medium', topic: 'Discrete Logic' },
    { id: 4, quizId: 3, type: 'multiple_choice', questionText: 'Which React hook should be utilized to perform side effects such as data fetching or DOM subscriptions in a functional component?', options: '["useState", "useMemo", "useEffect", "useCallback"]', correctOptionIndex: 2, correctAnswer: 'useEffect', difficulty: 'easy', topic: 'React Core Hooks' }
  ],
  quiz_attempts: [],
  certificates: [],
  notifications: [
    { id: 1, userId: 3, title: 'Welcome to Ezana Academy!', message: 'Explore elite programming, English, and analytical calculus courses instantly.', read: false, createdAt: new Date().toISOString() }
  ],
  testimonials: [
    { id: 1, name: 'Abebe Kebede', role: 'Software Engineer', content: 'Ezana Academy completely shifted my career trajectory. The AI Full Stack course is direct, rigorous, and highly practical.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: 2, name: 'Helen Alula', role: 'Maths Teacher', content: 'The discrete mathematics and Calculus modules are brilliantly structured. Highly recommended for students of all backgrounds.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 3, name: 'Michael Demeke', role: 'SaaS Starter', content: 'The payment workflow is simple, and the instructor feedback on assignments is top-tier. Lifetime access is totally worth ETB 1,000.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' }
  ],
  contact_messages: [
    { id: 1, name: 'Samuel Hailu', email: 'samuel@example.com', subject: 'SaaS Partnership', message: 'Hello, do you offer corporate packages for tech training?', date: '2026-06-05T10:30:00Z' }
  ],
  activity_logs: [],
  settings: [
    { key: 'site_name', value: 'Ezana Academy' },
    { key: 'premium_price_etb', value: '1000' },
    { key: 'payment_account_info', value: 'CBE Birr / Telebirr - Ye-Buna Link' }
  ]
};
