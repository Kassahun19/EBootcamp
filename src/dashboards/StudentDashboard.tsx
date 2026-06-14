import React, { useState, useEffect } from 'react';
import { BookOpen, MapPin, CheckCircle, Award, LayoutDashboard, Database, Star, Play, Lock, AlertTriangle, ShieldCheck, Clock, FileText, Send, Bell, User, MessageSquare, Flame, Check, HelpCircle, ChevronRight, Bookmark, Notebook, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Lesson {
  id: number;
  moduleId: number;
  courseId: number;
  title: string;
  description: string;
  youtubeId: string;
  isPreview: boolean;
  duration: string;
}

interface Module {
  id: number;
  courseId: number;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  duration: string;
  lessonsCount: number;
  thumbnail: string;
  premium: boolean;
  published: boolean;
  modules?: Module[];
}

export default function StudentDashboard({
  onShowDemoVideo,
  onNavigate
}: {
  onShowDemoVideo: (youtubeId: string, title: string) => void;
  onNavigate: (page: string, params?: any) => void;
}) {
  const { user, token, notifications, markNotificationsAsRead } = useAuth();
  
  // Dashboard view selection
  const [activePane, setActivePane] = useState<'my_courses' | 'learning_page' | 'quizzes' | 'assignments' | 'certificates' | 'settings' | 'messages' | 'wishlist'>('my_courses');
  
  // Courses lists
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Wishlist list
  const [wishlist, setWishlist] = useState<number[]>([]);
  
  // Sync wishlist from localstorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`ezana_wishlist_${user.id}`);
      if (saved) {
        try {
          setWishlist(JSON.parse(saved));
        } catch (err) {
          console.warn("Could not load checklist.");
        }
      }
    }
  }, [user]);

  const handleRemoveWishlistItem = (id: number) => {
    const updated = wishlist.filter(item => item !== id);
    setWishlist(updated);
    if (user) {
      localStorage.setItem(`ezana_wishlist_${user.id}`, JSON.stringify(updated));
    }
  };
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active watching state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [learningNotes, setLearningNotes] = useState('');
  const [notesSavedAlert, setNotesSavedAlert] = useState(false);
  const [discussionInput, setDiscussionInput] = useState('');
  const [discussions, setDiscussions] = useState<{ id: number; name: string; content: string; date: string }[]>([
    { id: 1, name: "Helen Alula", content: "Does the local database simulation survive browser restarts?", date: "Just now" },
    { id: 2, name: "Dr. Demeke", content: "Yes, it writes straight to database.json on the server! Perfectly persistent.", date: "5 mins ago" }
  ]);

  // Quiz state
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizAtStatus, setQuizAtStatus] = useState<{ score?: number; passed?: boolean; correctCount?: number; totalCount?: number; solved: boolean }>({ solved: false });
  const [quizSubmitLoading, setQuizSubmitLoading] = useState(false);

  // Assignment states
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [studentComments, setStudentComments] = useState('');
  const [assignSubmitStatus, setAssignSubmitStatus] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Certificates list
  const [certs, setCerts] = useState<any[]>([]);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  // Local settings State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [settingStatus, setSettingStatus] = useState<string | null>(null);

  // Streak/Gamification Simulator
  const [learningStreak] = useState(3); // Active streak

  // Premium Custom Features State
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [studyPlanDays, setStudyPlanDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);
  const [focusMode, setFocusMode] = useState<'standard' | 'theater' | 'sepia'>('standard');
  const [estimatedDailyGoal, setEstimatedDailyGoal] = useState('45 mins');
  const [completionGoalAlert, setCompletionGoalAlert] = useState<string | null>(null);

  // Local consultations/direct support messages state
  const [directMessages, setDirectMessages] = useState<{ id: number; sender: string; text: string; date: string; isResponse?: boolean }[]>([
    { id: 1, sender: "Registrar Support Desk", text: "Welcome to your Ezana Academy Workspace! This private chat connects you directly with instructors and support representatives. Feel free to ask any question about your curriculum progress, or request certificate issues verification.", date: "Today, 9:00 AM", isResponse: true }
  ]);
  const [newDirectQuery, setNewDirectQuery] = useState('');
  const [sendingQuery, setSendingQuery] = useState(false);
  const [messagesTab, setMessagesTab] = useState<'bulletins' | 'consultation' | 'feedback'>('bulletins');
  
  // Quiz timers & explanations helper
  const [quizTimerValue, setQuizTimerValue] = useState(600); // 10 minutes (600 seconds)
  const [explanationMap, setExplanationMap] = useState<Record<number, string>>({});

  const selectedQuizId = selectedQuiz?.id;
  const quizSolvedStatus = quizAtStatus.solved;
  
  useEffect(() => {
    let timerId: any;
    if (selectedQuizId && !quizSolvedStatus && quizTimerValue > 0) {
      timerId = setInterval(() => {
        setQuizTimerValue(v => {
          if (v <= 1) return 0;
          return v - 1;
        });
      }, 1000);
    } else {
      setQuizTimerValue(600);
    }
    return () => clearInterval(timerId);
  }, [selectedQuizId, quizSolvedStatus]);

  const handleDownloadNotes = () => {
    if (!learningNotes) return;
    const blob = new Blob([`EZANA ACADEMY STUDY NOTES\nCourse: ${selectedCourse?.title}\nTimestamp: ${new Date().toLocaleString()}\n\n${learningNotes}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedCourse?.title?.toLowerCase()?.replace(/\s+/g, '_')}_notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getVocabularyItems = () => {
    const category = selectedCourse?.category || '';
    if (category.toLowerCase().includes('ai') || category.toLowerCase().includes('web') || category.toLowerCase().includes('stack')) {
      return [
        { term: 'React State/Hook', definition: 'Local dynamic reactive variables that trigger automatic screen rendering upon mutation.' },
        { term: 'Express Middleware', definition: 'Interception pipeline processing server request payloads prior to router callbacks.' },
        { term: 'JWT (JSON Web Token)', definition: 'Secure cryptographically encrypted credentials verifying stateless browser clients.' },
        { term: 'MySQL Relational DB', definition: 'Tabular storage systems maintaining physical referential constraints between schemas.' }
      ];
    } else if (category.toLowerCase().includes('math')) {
      return [
        { term: 'Axiom of Limits', definition: 'Calculus concept bounding mathematical trends as variables approach specific real points.' },
        { term: 'Quadratic roots', definition: 'Algebra formula resolving roots of standard polynomic forms via discriminant curves.' },
        { term: 'Induction Logic', definition: 'Rigorous theorem validation verifying formula truths for subsequent countable integers.' },
        { term: 'Geometric Progression', definition: 'Mathematical sequences scaled steadily with constant ratio ratios.' }
      ];
    } else {
      return [
        { term: 'Present Perfect Tense', definition: 'English tense matching past experiences connecting directly up to the current timeline.' },
        { term: 'Coordinating Conjunction', definition: 'Syntactic connector words joining simple equal grammatic independent clauses.' },
        { term: 'Subjunctive Mood', definition: 'Verb conjugations representing hypothetic wishes, suggestions or critical rules.' },
        { term: 'Active Listening', definition: 'Psychocognitive focus of understanding and formulating responses during verbal lectures.' }
      ];
    }
  };

  const [copiedCertText, setCopiedCertText] = useState<string | null>(null);
  const handleCopyShareText = (cert: any) => {
    const shareMsg = `🎓 Just graduated from Ezana Academy! Completed: "${cert.courseName}". Certificate Reference: ${cert.certificateNumber}. Check out https://ezana.academy!`;
    navigator.clipboard.writeText(shareMsg);
    setCopiedCertText("Verification share text copied to clipboard!");
    setTimeout(() => setCopiedCertText(null), 3000);
  };

  const toggleStudyDay = (day: string) => {
    if (studyPlanDays.includes(day)) {
      setStudyPlanDays(prev => prev.filter(d => d !== day));
    } else {
      setStudyPlanDays(prev => [...prev, day]);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [token]);

  const fetchWorkspaceData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      // Fetch courses
      const cres = await fetch('/api/courses');
      if (cres.ok) {
        setCourses(await cres.json());
      }
      // Fetch enrollments
      const eres = await fetch('/api/enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (eres.ok) {
        setEnrollments(await eres.json());
      }
      // Fetch student submissions
      const sres = await fetch('/api/submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (sres.ok) {
        // Filter submissions for this user
        const list = await sres.json();
        setSubmissions(list.filter((s: any) => s.userId === user?.id));
      }
      // Fetch certificates
      const certRes = await fetch('/api/certificates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (certRes.ok) {
        setCerts(await certRes.json());
      }
    } catch (e) {
      console.error("Failed loading student workspace datasets:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearning = async (courseId: number) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (res.ok) {
        const item = await res.json();
        setSelectedCourse(item);
        
        // Find first lesson
        const firstLesson = item.modules?.[0]?.lessons?.[0];
        if (firstLesson) {
          setSelectedLesson(firstLesson);
        }
        
        // Fetch assignments & quizzes
        fetchCourseAssessments(courseId);
        setActivePane('learning_page');
      }
    } catch (e) {
      console.error("Error launching study details:", e);
    }
  };

  const fetchCourseAssessments = async (courseId: number) => {
    try {
      // Quizzes
      const qres = await fetch(`/api/courses/${courseId}/quizzes`);
      if (qres.ok) {
        setQuizzes(await qres.json());
      }
      // Assignments
      const ares = await fetch(`/api/courses/${courseId}/assignments`);
      if (ares.ok) {
        setAssignments(await ares.json());
      }
    } catch (e) {
      console.error("Error sync assessment queries:", e);
    }
  };

  const handleMarkLessonComplete = async () => {
    if (!selectedCourse || !selectedLesson || !token) return;
    try {
      // Find index of current lesson to calculate progress
      const allLessons = selectedCourse.modules?.flatMap(m => m.lessons) || [];
      const currentIdx = allLessons.findIndex(l => l.id === selectedLesson.id);
      const computedPercent = Math.round(((currentIdx + 1) / allLessons.length) * 100);

      const res = await fetch(`/api/enrollments/${selectedCourse.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          progress: computedPercent,
          completed: computedPercent >= 100
        })
      });

      if (res.ok) {
        // Trigger alert, refresh enrollments
        setNotesSavedAlert(true);
        setTimeout(() => setNotesSavedAlert(false), 3000);
        fetchWorkspaceData();

        // Advance to next lesson if configured
        if (currentIdx < allLessons.length - 1) {
          setSelectedLesson(allLessons[currentIdx + 1]);
        }
      }
    } catch (e) {
      console.error("Error setting lesson completed status:", e);
    }
  };

  // Submit assessment answer sheets
  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz || !token) return;

    try {
      setQuizSubmitLoading(true);
      const res = await fetch(`/api/quizzes/${selectedQuiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: quizAnswers })
      });

      if (res.ok) {
        const result = await res.json();
        setQuizAtStatus({
          score: result.attempt.score,
          passed: result.attempt.passed,
          correctCount: result.attempt.correctCount,
          totalCount: result.attempt.totalCount,
          solved: true
        });

        // Generate customized tutorial explanations for student study review
        const explanations: Record<number, string> = {};
        selectedQuiz.questions?.forEach((q: any) => {
          const answerUser = quizAnswers[q.id];
          const isCorrect = String(q.correctOptionIndex) === answerUser || q.correctAnswer === answerUser;
          explanations[q.id] = isCorrect
            ? `Correct Choice! "${q.options?.[parseInt(answerUser)] || answerUser}" is the mathematically and contextually sound choice.`
            : `Review Insight: Your choice "${q.options?.[parseInt(answerUser)] || answerUser || 'Blank'}" was incorrect. The accurate solution is: "${q.options?.[q.correctOptionIndex] || q.correctAnswer}".`;
        });
        setExplanationMap(explanations);

        fetchWorkspaceData(); // Refresh certificates
      }
    } catch (e) {
      console.error("Error submitting quiz attempts:", e);
    } finally {
      setQuizSubmitLoading(false);
    }
  };

  // Submit Homework assignment
  const handleAssignmentSubmit = async (e: React.FormEvent, assignmentId: number) => {
    e.preventDefault();
    if (!token) return;
    if (!assignmentFile) {
        setAssignSubmitStatus("Please attach the corresponding PDF/Image output document.");
        return;
    }

    try {
      setAssignSubmitStatus("Transmitting assignment documents...");
      const formData = new FormData();
      formData.append('document', assignmentFile);
      formData.append('studentComments', studentComments);

      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setAssignSubmitStatus("🎉 Homework document uploaded for Instructor grades review!");
        setAssignmentFile(null);
        setStudentComments('');
        fetchWorkspaceData();
      } else {
        setAssignSubmitStatus("Upload error occurred during transmission.");
      }
    } catch (err) {
      setAssignSubmitStatus("Network communication error.");
    }
  };

  // Profile saves
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;
    try {
      setSettingStatus("Applying profile security modifications...");
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileName,
          password: profilePassword || undefined
        })
      });

      if (res.ok) {
        setSettingStatus("✓ Profile successfully synchronized. Refreshing token parameters.");
        setProfilePassword('');
      } else {
        setSettingStatus("Correction error occurred during profiling.");
      }
    } catch (e) {
      setSettingStatus("Fatal error saving profiles.");
    }
  };

  const handleSaveNotes = () => {
    if (learningNotes) {
      setNotesSavedAlert(true);
      setTimeout(() => setNotesSavedAlert(false), 3000);
    }
  };

  const handlePostDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (discussionInput) {
      setDiscussions(prev => [
        { id: prev.length + 1, name: user?.name || "Martha Tefera", content: discussionInput, date: "Just now" },
        ...prev
      ]);
      setDiscussionInput('');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col pt-1" id="student_workspace">
      
      {/* Top Welcome Bar & Gamified Streak level */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
            Welcome Back, {user?.name}! 🎓
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Registered Role: <span className="font-bold text-emerald-700 capitalize">student Workspace</span> • Status: 
            {user?.premium ? (
              <span className="ml-1 px-2 py-0.5 rounded bg-emerald-150 text-emerald-800 text-[10px] font-bold uppercase">PREMIUM LIFETIME ACCESS</span>
            ) : (
              <span className="ml-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">PUBLIC ACCESS</span>
            )}
          </p>
        </div>

        {/* Streak levels & Notification Badge */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="px-3 py-1.5 rounded-lg bg-orange-100 border border-orange-200 text-orange-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm">
            <Flame className="w-4 h-4 text-orange-600 fill-orange-600 text-orange-600 shrink-0" />
            <span>Learning Streak: {learningStreak} Days!</span>
          </div>

          <div className="relative">
            <button
              id="student_notif_bell"
              onClick={() => {
                markNotificationsAsRead();
                alert(notifications.map(n => `📎 [${n.title}] - ${n.message}`).join('\n\n') || "No notifications logs yet.");
              }}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition relative cursor-pointer"
              title="Active System Notifications"
            >
              <Bell className="w-4.5 h-4.5 text-slate-700" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center font-bold font-mono">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main workspace splits */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto w-full p-4 gap-6">
        
        {/* Left Side menu */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 shadow-sm">
            <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-widest px-3">Student Modules</h3>
            
            <button
              id="pane_my_courses"
              onClick={() => setActivePane('my_courses')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2.5 transition cursor-pointer ${
                activePane === 'my_courses' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
              <span>Catalog & My Courses</span>
            </button>

            {selectedCourse && (
              <button
                id="pane_learning_page"
                onClick={() => setActivePane('learning_page')}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2.5 transition cursor-pointer ${
                  activePane === 'learning_page' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Play className="w-4.5 h-4.5 shrink-0" />
                <span>Active Classroom</span>
              </button>
            )}

            <button
              id="pane_quizzes"
              onClick={() => {
                if (!selectedCourse) {
                  alert("Please select a course to view assessment quizzes!");
                  setActivePane('my_courses');
                } else {
                  setActivePane('quizzes');
                }
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2.5 transition cursor-pointer ${
                activePane === 'quizzes' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-4.5 h-4.5 shrink-0" />
              <span>Assessment Quizzes</span>
            </button>

            <button
              id="pane_assignments"
              onClick={() => {
                if (!selectedCourse) {
                  alert("Select a course to check task assignments.");
                  setActivePane('my_courses');
                } else {
                  setActivePane('assignments');
                }
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2.5 transition cursor-pointer ${
                activePane === 'assignments' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4.5 h-4.5 shrink-0" />
              <span>My Assignments</span>
            </button>

            <button
              id="pane_messages"
              onClick={() => setActivePane('messages')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center justify-between transition cursor-pointer ${
                activePane === 'messages' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4.5 h-4.5 shrink-0" />
                <span>Inbox & Bulletins</span>
              </div>
              {notifications.some(n => !n.isRead) && (
                <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full font-mono">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>

            <button
              id="pane_wishlist"
              onClick={() => setActivePane('wishlist')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2.5 transition cursor-pointer ${
                activePane === 'wishlist' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Heart className="w-4.5 h-4.5 shrink-0 text-rose-500 fill-rose-500" />
              <span>My Wishlist ({wishlist.length})</span>
            </button>

            <button
              id="pane_certificates"
              onClick={() => setActivePane('certificates')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2.5 transition cursor-pointer ${
                activePane === 'certificates' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4.5 h-4.5 shrink-0" />
              <span>My Certificates ({certs.length})</span>
            </button>

            <button
              id="pane_settings"
              onClick={() => setActivePane('settings')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2.5 transition cursor-pointer ${
                activePane === 'settings' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <User className="w-4.5 h-4.5 shrink-0" />
              <span>Account Credentials</span>
            </button>
          </div>

          {/* Rapid Recommendation Widget */}
          <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-sm space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended programs</h4>
            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-800 line-clamp-1">AI-Powered Full Stack Web Development</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">Study React component lifecycles, and backend Node.js endpoints.</p>
              <button
                id="rec-program-btn"
                onClick={() => handleStartLearning(3)}
                className="text-emerald-600 font-bold hover:text-emerald-700 cursor-pointer inline-flex items-center gap-1 mt-1"
              >
                Access Syllabus <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Dynamic Viewport Portions */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* A. MY COURSES / DIRECT CATALOG PANEL */}
          {activePane === 'my_courses' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <h2 className="text-xl font-bold text-slate-950">My Courses Workspace</h2>
                <p className="text-slate-500 text-xs">
                  Review courses in local archives. Pay 1,055 Birr once to unlock elite unlisted YouTube components.
                </p>
              </div>

              {/* Real-time Lecturer Notice Broadcaster alert banner */}
              {(() => {
                const notice = localStorage.getItem('instructor_announcement') || '🚀 Welcome back to class! The final modules of React hooks with Node context have been published.';
                return (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-xs font-semibold rounded-r-xl text-amber-900 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="shrink-0 bg-amber-500 text-white font-mono font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                        Broadcaster Bulletin
                      </span>
                      <span className="leading-relaxed text-amber-905">{notice}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Premium Feature: Interactive Study Routine Planner Bento Card */}
              <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Interactive Student Tool</span>
                    <h3 className="font-extrabold text-white text-sm md:text-base mt-1">Personalized Weekly Study Routine Planner</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Build daily consistency by selecting your routine lecture study days.</p>
                  </div>
                  
                  {/* Goal Level Setting Selector */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Daily Study Goal:</span>
                    <select 
                      value={estimatedDailyGoal} 
                      onChange={(e) => {
                        setEstimatedDailyGoal(e.target.value);
                        setCompletionGoalAlert(`Fantastic! Daily target adjusted to ${e.target.value}. Keep up the steady cadence!`);
                        setTimeout(() => setCompletionGoalAlert(null), 4000);
                      }} 
                      className="bg-slate-800 border border-slate-705 text-emerald-400 font-bold p-1 rounded focus:outline-emerald-500 cursor-pointer text-xs"
                    >
                      <option value="30 mins">30 mins / day</option>
                      <option value="45 mins">45 mins / day</option>
                      <option value="1 hour">1 hour / day</option>
                      <option value="2 hours">2 hours / day</option>
                    </select>
                  </div>
                </div>

                {/* Week Day Checkboxes */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isSelected = studyPlanDays.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleStudyDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isSelected ? 'bg-emerald-600 border border-emerald-500 text-white shadow-md' : 'bg-slate-850 hover:bg-slate-800 text-slate-450 border border-slate-700/60'
                        }`}
                      >
                        {isSelected && <span className="text-emerald-300">✓</span>}
                        <span>{day.substring(0, 3)}</span>
                      </button>
                    );
                  })}
                </div>

                {completionGoalAlert && (
                  <p className="text-[11px] text-emerald-300 font-medium animate-pulse">★ {completionGoalAlert}</p>
                )}

                <div className="text-[10px] text-slate-400 flex justify-between items-center bg-slate-950/40 p-2.5 rounded border border-slate-850 text-xs leading-normal">
                  <span>🎯 Plan Status: <b className="text-emerald-400">{studyPlanDays.length} Study Days</b> registered this week at <b className="text-white">{estimatedDailyGoal}</b> per session.</span>
                  <span className="font-mono text-emerald-450 font-bold">Commitment: {studyPlanDays.length >= 4 ? 'Elite 🔥' : studyPlanDays.length >= 2 ? 'Steady ⭐' : 'Casual 💤'}</span>
                </div>
              </div>

              {/* Course Filters & Search Bar Section */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center text-xs">
                {/* Search Box input */}
                <div className="w-full sm:max-w-xs relative text-xs">
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="Search courses or keywords..."
                    className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-emerald-500 text-slate-800 font-medium"
                  />
                  {courseSearch && (
                    <button 
                      onClick={() => setCourseSearch('')}
                      className="absolute right-2.5 top-2 hover:text-rose-500 text-slate-400 text-[10px] cursor-pointer font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter chip indicators */}
                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto overflow-x-auto">
                  {['All', 'AI Full Stack', 'English', 'Mathematics'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition capitalize ${
                        selectedCategoryFilter === cat
                          ? 'bg-slate-900 border border-slate-800 text-white'
                          : 'bg-slate-105 hover:bg-slate-150 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {cat === 'All' ? 'All Classes' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200 p-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
                </div>
              ) : (
                (() => {
                  const filteredCourses = courses.filter((course) => {
                    const matchesSearch = course.title.toLowerCase().includes(courseSearch.toLowerCase()) || 
                                          course.description.toLowerCase().includes(courseSearch.toLowerCase());
                    const matchesCategory = selectedCategoryFilter === 'All' || course.category === selectedCategoryFilter;
                    return matchesSearch && matchesCategory;
                  });

                  if (filteredCourses.length === 0) {
                    return (
                      <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
                        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
                        <p className="text-xs text-slate-500 mt-2">No programs match your current search query or selected filter chips.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredCourses.map((course) => {
                        const isPremiumCourse = course.premium;
                        const hasAccess = !isPremiumCourse || user?.roleId === 1 || user?.roleId === 2 || user?.premium;
                        const progressRecord = enrollments.find(e => e.courseId === course.id);
                        const progressVal = progressRecord ? progressRecord.progress : 0;

                        return (
                          <div key={course.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between group">
                            <div>
                              <div className="aspect-video w-full overflow-hidden relative bg-slate-100">
                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                <div className="absolute top-2 left-2 flex gap-1.5">
                                  <span className="bg-slate-900/80 backdrop-blur text-white font-bold px-2 py-0.5 rounded text-[10px]">
                                    {course.category}
                                  </span>
                                  {!hasAccess ? (
                                    <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-wide inline-flex items-center gap-1">
                                      <Lock className="w-3" /> Lock
                                    </span>
                                  ) : (
                                    <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                                      unlocked
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="p-5 space-y-2">
                                <h4 className="font-extrabold text-slate-950 text-sm md:text-base line-clamp-1">{course.title}</h4>
                                <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{course.description}</p>
                                
                                {hasAccess && (
                                  <div className="space-y-1.5 pt-2">
                                    <div className="flex justify-between text-[11px] font-mono text-slate-500">
                                      <span>Study Process Track</span>
                                      <span>{progressVal}% complete</span>
                                    </div>
                                    <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-emerald-600 h-1.5 transition-all duration-500" style={{ width: `${progressVal}%` }}></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="p-5 pt-0">
                              {hasAccess ? (
                                <button
                                  id={`course_learn_act_${course.id}`}
                                  onClick={() => handleStartLearning(course.id)}
                                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 transition text-white font-extrabold rounded text-xs cursor-pointer"
                                >
                                  {progressVal > 0 ? "Continue Program Work" : "Enter Study Workspace"}
                                </button>
                              ) : (
                                <button
                                  id={`course_learn_locked_${course.id}`}
                                  onClick={() => onNavigate('pricing')}
                                  className="w-full py-2.5 bg-slate-100 text-amber-800 border border-slate-200 hover:bg-amber-50 transition font-bold rounded text-xs cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Upgrade to Unlocks (ETB 1,000)</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* B. ACTIVE LEARNING PAGE / CLASSROOM VIDEO PLAYER */}
          {activePane === 'learning_page' && selectedCourse && (
            <div className="space-y-6">
              
              {/* Classroom header banner */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Active Classroom Workspace</span>
                  <h3 className="font-extrabold text-slate-950 text-base md:text-lg line-clamp-1">{selectedCourse.title}</h3>
                </div>
                <button
                  id="classroom_change_prog"
                  onClick={() => setActivePane('my_courses')}
                  className="px-3.5 py-1.5 text-xs text-slate-600 border border-slate-200 hover:bg-slate-100 rounded transition cursor-pointer shrink-0 font-bold"
                >
                  Change Course
                </button>
              </div>

              {/* Classroom split workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Embedded YouTube video player & tabs */}
                <div className="lg:col-span-8 space-y-4">
                  <div className={`aspect-video rounded-xl overflow-hidden relative transition-all duration-500 ${
                    focusMode === 'theater' 
                      ? 'bg-black border-2 border-emerald-500/40 shadow-2xl scale-[1.01]' 
                      : focusMode === 'sepia' 
                        ? 'bg-[#fcf5e3] border-2 border-amber-900/15 shadow' 
                        : 'bg-slate-950 border border-slate-850 shadow-md'
                  }`}>
                    {selectedLesson ? (
                      <iframe
                        id="unlisted_yt_player"
                        src={`https://www.youtube.com/embed/${selectedLesson.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
                        title={selectedLesson.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                        <Play className="w-12 h-12 text-slate-650" />
                        <p className="text-xs pt-1">Select an active lecture segment in the syllabus sidebar.</p>
                      </div>
                    )}
                  </div>

                  {/* Focus Comfort Viewing Mode Selector */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs shadow-sm">
                    <span className="font-bold text-slate-705 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" /> Lesson Comfort Viewing Filter:
                    </span>
                    <div className="flex gap-1.5">
                      {[
                        { key: 'standard', name: 'Ambient Light ☀️' },
                        { key: 'theater', name: 'Midnight Focus 🎬' },
                        { key: 'sepia', name: 'Warm Paper 📖' }
                      ].map((mode) => (
                        <button
                          key={mode.key}
                          onClick={() => setFocusMode(mode.key as any)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition ${
                            focusMode === mode.key
                              ? 'bg-slate-900 border border-slate-800 text-white shadow'
                              : 'bg-slate-105 text-slate-600 hover:bg-slate-150 border border-slate-200'
                          }`}
                        >
                          {mode.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedLesson && (
                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3.5 shadow-sm">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                            ACTIVE CHAPTER
                          </span>
                          <h4 className="font-black text-slate-950 text-sm md:text-base mt-1 leading-snug">{selectedLesson.title}</h4>
                        </div>
                        
                        <button
                          id="mark_lesson_done"
                          onClick={handleMarkLessonComplete}
                          className="px-4 py-2 bg-slate-900 text-white hover:bg-emerald-600 hover:text-slate-950 text-xs font-bold transition rounded cursor-pointer shrink-0"
                        >
                          Mark Complete & Next
                        </button>
                      </div>

                      <p className="text-slate-500 text-xs leading-relaxed">{selectedLesson.description}</p>
                    </div>
                  )}

                  {/* Notes & Discussions Tabs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Notes Pad */}
                    <div className="bg-white p-4.5 rounded-xl border border-slate-200 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span className="font-bold text-slate-900 inline-flex items-center gap-1">
                          <Notebook className="w-4.5 h-4.5 text-emerald-600" /> Notes Pad
                        </span>
                        <span className="text-[10px]">Private study notes</span>
                      </div>

                      <textarea
                        id="study-scratchpad-notes"
                        rows={4}
                        value={learningNotes}
                        onChange={(e) => setLearningNotes(e.target.value)}
                        placeholder="Key in private reminders during lecture..."
                        className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 text-xs focus:outline-emerald-500 text-slate-800"
                      ></textarea>

                      <div className="flex justify-between items-center">
                        {notesSavedAlert && <span className="text-[10px] text-emerald-600 font-bold">✓ Notes saved.</span>}
                        <div className="flex gap-1.5 ml-auto">
                          {learningNotes && (
                            <button
                              id="note_download_txt_btn"
                              onClick={handleDownloadNotes}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded text-[10px] cursor-pointer"
                              title="Download study notes as TXT document"
                            >
                              Download TXT File
                            </button>
                          )}
                          <button
                            id="note_save_submit"
                            onClick={handleSaveNotes}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded text-[10px] cursor-pointer"
                          >
                            Save Notes
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Discussions forum */}
                    <div className="bg-white p-4.5 rounded-xl border border-slate-200 space-y-3 shadow-sm flex flex-col justify-between">
                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-900 text-xs inline-flex items-center gap-1 uppercase tracking-wider">
                          <MessageSquare className="w-4.5 h-4.5 text-emerald-600" /> Discussions Area
                        </h4>
                        
                        <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                          {discussions.map((d) => (
                            <div key={d.id} className="p-2 border border-slate-100 rounded bg-slate-50 text-[10px] space-y-0.5">
                              <p className="font-bold text-slate-700 flex justify-between">
                                <span>{d.name}</span>
                                <span className="text-[9px] text-slate-400">{d.date}</span>
                              </p>
                              <p className="text-slate-500">{d.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <form onSubmit={handlePostDiscussion} className="flex gap-2 pt-2">
                        <input
                          id="forum_post_input"
                          type="text"
                          value={discussionInput}
                          onChange={(e) => setDiscussionInput(e.target.value)}
                          placeholder="Ask a question..."
                          className="flex-1 p-2 border border-slate-200 rounded text-[11px] h-8 text-slate-800 focus:outline-emerald-600"
                        />
                        <button
                          id="forum_post_submit"
                          type="submit"
                          className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] h-8 cursor-pointer"
                        >
                          Send
                        </button>
                      </form>
                    </div>

                  </div>
                </div>

                {/* Course syllabus tracking sidebar */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="font-extrabold text-slate-200 text-xs tracking-wide uppercase">Lectures Navigation</h4>
                    
                    <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                      {selectedCourse.modules?.map((mod) => (
                        <div key={mod.id} className="space-y-1.5 p-2 bg-slate-950/40 rounded border border-slate-800/50 text-xs">
                          <h5 className="font-bold text-slate-200 text-[11px] leading-snug">{mod.title}</h5>
                          
                          <div className="space-y-1 pt-1">
                            {mod.lessons.map((les) => {
                              const isActive = selectedLesson?.id === les.id;
                              return (
                                <button
                                  id={`class_select_les_${les.id}`}
                                  key={les.id}
                                  onClick={() => setSelectedLesson(les)}
                                  className={`w-full text-left p-1.5 rounded transition text-[10px] flex items-center gap-1.5 leading-snug cursor-pointer ${
                                    isActive 
                                      ? 'bg-emerald-600 text-white font-bold' 
                                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                  }`}
                                >
                                  <Play className="w-3 h-3 fill-current shrink-0" />
                                  <span className="line-clamp-1">{les.title}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-[10px] text-slate-400 leading-normal">
                      💡 Click Mark Complete above to log progress and advance automatically. Complete lectures to unlock graduation certifications!
                    </div>
                  </div>

                  {/* High Value Extra Feature: Live Key Concepts Glossary helper card */}
                  <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h4 className="font-extrabold text-slate-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        📖 Lesson Vocabulary Desk
                      </h4>
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-1.5 py-0.5 rounded uppercase">
                        Active Glossary
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {getVocabularyItems().map((v, i) => (
                        <div key={i} className="text-xs p-2 bg-slate-50 rounded border border-slate-150 space-y-0.5 hover:bg-emerald-50/50 transition duration-300 font-medium">
                          <p className="font-extrabold text-emerald-800 text-[11px] font-mono">{v.term}</p>
                          <p className="text-slate-500 text-[10px] leading-relaxed">{v.definition}</p>
                        </div>
                      ))}
                    </div>

                    <div className="text-[10px] text-slate-400 text-center italic pt-1 border-t border-slate-100">
                      Terms update dynamically based on program category.
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* C. ASSESSMENTS QUIZZES VIEWPORT */}
          {activePane === 'quizzes' && (
            <div className="space-y-6">
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <h3 className="text-xl font-bold text-slate-950">Modular Assessment Quizzes</h3>
                <p className="text-slate-500 text-xs">
                  Validate your comprehension logic in key lessons. Achieve {selectedQuiz?.passingScore || 70}% or more to automatically issue QR graduation certificates.
                </p>
              </div>

              {!selectedQuiz ? (
                <div className="space-y-4">
                  {quizzes.length === 0 ? (
                    <p className="text-slate-500 text-xs p-6 bg-white border border-slate-200 rounded text-center">No assessments configured for this course yet.</p>
                  ) : (
                    quizzes.map((q) => (
                      <div key={q.id} className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-emerald-500/20 transition shadow-sm">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-sm md:text-base">{q.title}</h4>
                          <p className="text-slate-500 text-xs">{q.description}</p>
                          <p className="text-emerald-700 text-xs font-semibold">Requirement: Pass rate {q.passingScore}%</p>
                        </div>
                        
                        <button
                          id={`start_quiz_${q.id}`}
                          onClick={() => {
                            setSelectedQuiz(q);
                            setQuizAnswers({});
                            setQuizAtStatus({ solved: false });
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs transition rounded cursor-pointer shrink-0"
                        >
                          Start Test
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Interactive Quiz Sheet */
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm md:text-base">{selectedQuiz.title}</h4>
                      <p className="text-slate-500 text-xs">{selectedQuiz.questions?.length || 0} questions listed</p>
                    </div>
                    
                    <button
                      id="close_quiz"
                      onClick={() => setSelectedQuiz(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
                    >
                      Exit quiz
                    </button>
                  </div>

                  {/* Active Countdown Timer helper for ongoing quiz */}
                  {!quizAtStatus.solved && (
                    <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 text-xs shadow-xs">
                      <span className="font-bold text-slate-705 flex items-center gap-1">
                        ⏱️ Active Assessment Timer:
                      </span>
                      <span className={`font-mono font-black text-sm px-2.5 py-1 rounded-md ${
                        quizTimerValue <= 60 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {Math.floor(quizTimerValue / 60)}:{(quizTimerValue % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  {/* Solved details */}
                  {quizAtStatus.solved ? (
                    <div className="p-6 bg-slate-50 rounded-xl space-y-4 border border-slate-200 max-w-2xl mx-auto">
                      <div className="text-center space-y-2">
                        {quizAtStatus.passed ? (
                          <>
                            <ShieldCheck className="w-14 h-14 text-emerald-600 mx-auto" />
                            <h4 className="text-xl font-black text-emerald-800">Congratulations! You PASSED!</h4>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-14 h-14 text-rose-500 mx-auto" />
                            <h4 className="text-xl font-bold text-rose-800">Test Not Passed Yet</h4>
                          </>
                        )}

                        <div className="p-4 bg-white border border-slate-250 rounded-lg text-xs space-y-2 max-w-sm mx-auto">
                          <p className="text-slate-705 font-bold text-lg">Your Score: {quizAtStatus.score}%</p>
                          <p className="text-slate-500">Correct answers: {quizAtStatus.correctCount} / {quizAtStatus.totalCount}</p>
                          <p className="text-slate-400">Minimal passing score threshold: {selectedQuiz.passingScore || 70}%</p>
                        </div>
                      </div>

                      {/* Detailed Educational Breakdown */}
                      <div className="text-left mt-6 pt-5 border-t border-slate-200 space-y-4">
                        <h5 className="font-extrabold text-slate-900 text-sm">🎓 Detailed Question walkthrough & Corrections</h5>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          Review standard model solutions and mathematical/code insights to retain solid recall of core concepts:
                        </p>
                        
                        <div className="space-y-3.5">
                          {selectedQuiz.questions?.map((q: any, qIdx: number) => {
                            const expl = explanationMap[q.id];
                            return (
                              <div key={q.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 shadow-sm">
                                <p className="font-bold text-slate-800 text-xs text-slate-950">Q{qIdx + 1}: {q.questionText}</p>
                                <p className="text-[11px] leading-relaxed font-semibold italic text-emerald-850 bg-emerald-50/20 p-2.5 rounded border border-emerald-100/60">
                                  {expl || `Correct Option Choice is: "${q.options?.[q.correctOptionIndex] || q.correctAnswer || 'Not provided'}". Verify your syntax to master the segment.`}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex gap-4 justify-center pt-4">
                        <button
                          id="solve_retry_quiz"
                          onClick={() => {
                            setQuizAnswers({});
                            setQuizAtStatus({ solved: false });
                            setQuizTimerValue(600); // reset 10 minutes
                          }}
                          className="px-4.5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition rounded cursor-pointer border border-slate-300"
                        >
                          Retry Quiz
                        </button>
                        <button
                          id="solve_done_quiz"
                          onClick={() => setSelectedQuiz(null)}
                          className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded cursor-pointer transition shadow"
                        >
                          View Syllabus
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Active form sheet */
                    <form onSubmit={handleQuizSubmit} className="space-y-6">
                      {selectedQuiz.questions?.map((q: any, qIdx: number) => (
                        <div key={q.id} className="space-y-3.5 pb-5 border-b border-slate-100 last:border-0 last:pb-0 text-xs md:text-sm">
                          <p className="font-extrabold text-slate-900">Question {qIdx + 1}: {q.questionText}</p>
                          
                          {q.type === 'multiple_choice' || q.type === 'true_false' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl">
                              {q.options?.map((opt: string, optIdx: number) => (
                                <label key={optIdx} className="flex gap-2.5 items-center p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs md:text-sm">
                                  <input
                                    id={`quiz_opt_btn_${q.id}_${optIdx}`}
                                    type="radio"
                                    name={`quest_${q.id}`}
                                    required
                                    checked={quizAnswers[q.id] === String(optIdx) || quizAnswers[q.id] === opt}
                                    onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: String(optIdx) }))}
                                    className="accent-emerald-600 scale-105"
                                  />
                                  <span className="text-slate-700">{opt}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            /* Short Answer text field */
                            <div className="space-y-1">
                              <input
                                id={`quiz_short_ans_${q.id}`}
                                type="text"
                                required
                                value={quizAnswers[q.id] || ''}
                                onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="Your short answer response here (be concise)..."
                                className="w-full max-w-lg px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-xs focus:outline-emerald-500 text-slate-700"
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        id="sheet_quiz_submit"
                        type="submit"
                        disabled={quizSubmitLoading}
                        className="px-6 py-3 bg-slate-900 hover:bg-emerald-600 text-white hover:text-slate-950 font-bold transition rounded-lg text-xs uppercase tracking-wide cursor-pointer shadow-md"
                      >
                        {quizSubmitLoading ? "Scoring Test Sheets..." : "Submit Answer Sheet"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* D. ASSIGNMENTS HOMEWORK VIEWPORT */}
          {activePane === 'assignments' && (
            <div className="space-y-6">
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <h3 className="text-xl font-bold text-slate-950">Active Assignments & Submission Trackers</h3>
                <p className="text-slate-500 text-xs">
                  Review assignment requirements, upload homework documents (PDF or image outputs), and browse active lectures feedback grades.
                </p>
              </div>

              <div className="space-y-6">
                {assignments.length === 0 ? (
                  <p className="text-slate-500 text-xs p-6 bg-white border border-slate-200 rounded text-center">No assignments declared for this course.</p>
                ) : (
                  assignments.map((ass) => {
                    const mySubmission = submissions.find(s => s.assignmentId === ass.id);
                    return (
                      <div key={ass.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        
                        <div className="lg:col-span-12 xl:col-span-7 space-y-3 text-xs md:text-sm">
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            DUE DATE: {new Date(ass.dueDate).toLocaleDateString()}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-sm md:text-base">{ass.title}</h4>
                          <p className="text-slate-500 leading-relaxed text-xs">{ass.description}</p>
                          
                          {mySubmission && (
                            <div className="pt-3 border-t border-slate-150 mt-3 space-y-1 bg-slate-50 p-3 rounded border border-slate-250 text-xs">
                              <p className="text-slate-800 font-bold flex justify-between h-4.5">
                                <span>Your Submission Grade:</span>
                                <span className="font-mono bg-slate-950 text-emerald-400 px-2 rounded font-bold h-4">
                                  {mySubmission.grade || "Evaluating"}
                                </span>
                              </p>
                              {mySubmission.feedback && (
                                <p className="text-amber-850 mt-1 italic font-medium">Instructor Review: "{mySubmission.feedback}"</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Submission Form Right */}
                        <div className="lg:col-span-12 xl:col-span-5 border-t lg:border-t-0 xl:border-l border-slate-100 pt-5 lg:pt-0 xl:pl-6 text-xs">
                          {mySubmission && mySubmission.grade !== 'Pending' ? (
                            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-center space-y-1.5 border border-emerald-100">
                              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                              <p className="font-bold">Evaluation completed!</p>
                              <p className="text-[10px] text-slate-500 leading-normal">Your solution matched criteria specifications completely.</p>
                            </div>
                          ) : (
                            <form onSubmit={(e) => handleAssignmentSubmit(e, ass.id)} className="space-y-3.5">
                              <h5 className="font-bold text-slate-900">Upload assignment PDF or image</h5>

                              {assignSubmitStatus && (
                                <p className="text-[11px] text-emerald-800 bg-emerald-55 border border-emerald-110 p-2 rounded">{assignSubmitStatus}</p>
                              )}

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Attach file *</label>
                                <input
                                  id={`assign_file_${ass.id}`}
                                  type="file"
                                  required
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      setAssignmentFile(e.target.files[0]);
                                    }
                                  }}
                                  className="w-full text-xs text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-205 cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Upload notes (Optional)</label>
                                <textarea
                                  id={`assign_notes_${ass.id}`}
                                  rows={2}
                                  value={studentComments}
                                  onChange={(e) => setStudentComments(e.target.value)}
                                  placeholder="Write notes regarding files code details..."
                                  className="w-full p-2 border border-slate-300 bg-slate-50 rounded text-xs focus:outline-emerald-500"
                                ></textarea>
                              </div>

                              <button
                                id={`assign_submit_btn_${ass.id}`}
                                type="submit"
                                className="w-full py-2 bg-slate-900 border border-slate-700 hover:bg-emerald-600 hover:text-slate-950 text-white font-bold transition rounded text-[11px] uppercase tracking-wider cursor-pointer"
                              >
                                Submit Assignment
                              </button>
                            </form>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* E. CERTIFICATES DOWN-LOADER */}
          {activePane === 'certificates' && (
            <div className="space-y-6">
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <h3 className="text-xl font-bold text-slate-950">My Certificates Catalog</h3>
                <p className="text-slate-500 text-xs">
                  Your graduation credentials are automatically authorized on scoring high in active course quizzes. Download or print credentials.
                </p>
              </div>

              {certs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
                  <Award className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-800 mt-2">No Certificates earned yet</h4>
                  <p className="text-slate-400 text-xs mt-1">Achieve {`>=70%`} on course assessment quizzes to immediately unlock interactive certificates.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certs.map((c) => (
                    <div key={c.id} className="bg-white p-6 rounded-xl border-2 border-emerald-500/10 hover:border-emerald-500/35 transition flex flex-col justify-between shadow-sm">
                      <div className="space-y-3">
                        <Award className="w-10 h-10 text-emerald-600" />
                        <h4 className="font-extrabold text-slate-900 text-sm md:text-base leading-snug">{c.courseName}</h4>
                        <p className="text-slate-400 text-xs font-mono">ID Number: {c.certificateNumber}</p>
                        <p className="text-slate-500 text-xs font-semibold">Authorized Graduation Stamp: {new Date(c.issuedAt).toLocaleDateString()}</p>
                      </div>

                      <button
                        id={`view_cert_${c.id}`}
                        onClick={() => setSelectedCert(c)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 max-h-12 text-white font-extrabold rounded text-xs mt-6 cursor-pointer inline-flex items-center justify-center gap-1.5 shadow"
                      >
                        Launch Interactive Certificate
                      </button>
                    </div>
                  ))}
                </div>
              )}

          {/* F. COURSE WISHLIST */}
          {activePane === 'wishlist' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-201 shadow-sm space-y-2">
                <h3 className="text-xl font-bold text-slate-950">My Saved Learning Wishlist</h3>
                <p className="text-slate-500 text-xs">
                  Review and enroll into saved flagship syllabi. Upgrading unlocks these immediately!
                </p>
              </div>

              {wishlist.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
                  <Heart className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
                  <h4 className="font-bold text-slate-800 mt-2">Your Wishlist is empty</h4>
                  <p className="text-slate-400 text-xs mt-1">Browse the main courses catalog to save items you are interested in.</p>
                  <button
                    onClick={() => onNavigate('courses')}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 transition text-white font-extrabold rounded text-xs cursor-pointer inline-block"
                  >
                    Browse Catalogs
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.filter(c => wishlist.includes(c.id)).map(course => {
                    const isEnrolled = enrollments.some(e => e.courseId === course.id);
                    return (
                      <div key={course.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between p-4 space-y-4">
                        <div className="flex gap-4">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-24 h-16 object-cover rounded-lg bg-slate-100 shrink-0"
                          />
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{course.title}</h4>
                            <p className="text-slate-500 text-[11px] line-clamp-2">{course.description}</p>
                            <span className="inline-block bg-slate-150 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase">
                              {course.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                          <button
                            onClick={() => handleRemoveWishlistItem(course.id)}
                            className="text-rose-600 hover:text-rose-800 font-extrabold transition cursor-pointer flex items-center gap-1"
                          >
                            <Heart className="w-3.5 h-3.5 fill-rose-600" /> Remove
                          </button>

                          {isEnrolled ? (
                            <button
                              onClick={() => handleStartLearning(course.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] cursor-pointer"
                            >
                              Open Studies Workspace
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                alert(`Syllabus review ready! Enroll into '${course.title}' via Course catalog panel.`);
                                onNavigate('courses', { courseId: course.id });
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-[11px] cursor-pointer"
                            >
                              Enroll / Learn More
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Certificate Modal Viewer */}
          {selectedCert && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <div className="bg-amber-100 max-w-3xl w-full p-8 rounded-xl border-4 border-amber-800 text-amber-955 relative shadow-2xl overflow-y-auto max-h-[90vh]">
                    
                    {/* Absolute close button */}
                    <button
                      id="close_cert_modal"
                      onClick={() => setSelectedCert(null)}
                      className="absolute top-4 right-4 text-amber-900/60 hover:text-amber-900 font-extrabold text-sm cursor-pointer"
                    >
                      [CLOSE WINDOW]
                    </button>

                    {/* High-fidelity certificate display layout */}
                    <div className="border border-amber-800 p-8 space-y-8 text-center bg-white/40">
                      
                      <div className="space-y-2">
                        <h3 className="text-3xl font-black tracking-widest text-emerald-950 font-serif lowercase">EZANA ACADEMY</h3>
                        <p className="text-xs uppercase tracking-widest border-y border-amber-800 py-1.5 text-amber-900 font-semibold">CERTIFICATE OF GRADUATION</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs italic">This certifies that dynamic student</p>
                        <h4 className="text-2xl font-black text-amber-950 font-serif">{selectedCert.studentName}</h4>
                        <p className="text-xs italic">has successfully satisfied all core lecture chapters, solved comprehensive logic quizzes, and submitted structural exercises to earn elite master credentials in</p>
                        <h5 className="text-xl font-bold text-emerald-955">{selectedCert.courseName}</h5>
                      </div>

                      {/* Split sign offs & QR codes */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-amber-800/20 text-xs text-amber-950">
                        <div className="space-y-1.5">
                          <p className="font-bold underline italic text-amber-950">Dr. Demeke Assefa</p>
                          <p className="text-[10px] text-slate-500 uppercase">Principal Coordinator Coordinator</p>
                        </div>

                        {/* QR Verification placeholder */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-20 h-20 bg-emerald-950 text-white flex flex-col items-center justify-center p-1 font-mono text-[7px] border border-amber-800">
                            {/* Standard SVG/Representational QR code layout */}
                            <div className="grid grid-cols-5 gap-0.5 bg-white p-1">
                              {[...Array(25)].map((_, i) => (
                                <div key={i} className={`w-2.5 h-2.5 ${((i * 7) % 3 === 0 || i % 4 === 1) ? 'bg-black' : 'bg-transparent'}`}></div>
                              ))}
                            </div>
                          </div>
                          <p className="text-[7px] text-slate-400 mt-1 uppercase">Scan QR code Code</p>
                        </div>

                        <div className="space-y-1.5">
                          <p className="font-mono text-xs font-bold">{selectedCert.certificateNumber}</p>
                          <p className="text-[10px] text-slate-500 uppercase">Serial Verification Code</p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages, Notifications and Academic Advising Desk */}
          {activePane === 'messages' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-950">Messages & Notifications Desk</h3>
                  <p className="text-slate-500 text-xs">
                    View official school bulletins, request feedback on assignments, or chat with the student support desk.
                  </p>
                </div>
                {messagesTab === 'bulletins' && notifications.some(n => !n.isRead) && (
                  <button
                    onClick={() => {
                      markNotificationsAsRead();
                    }}
                    className="self-start md:self-auto px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition cursor-pointer shrink-0"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>

              {/* Sub-tabs header */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setMessagesTab('bulletins')}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                    messagesTab === 'bulletins'
                      ? 'border-emerald-600 text-emerald-700 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  System Bulletins ({notifications.length})
                </button>
                <button
                  onClick={() => setMessagesTab('consultation')}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                    messagesTab === 'consultation'
                      ? 'border-emerald-600 text-emerald-700 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Direct Support Chat ({directMessages.length})
                </button>
                <button
                  onClick={() => setMessagesTab('feedback')}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                    messagesTab === 'feedback'
                      ? 'border-emerald-600 text-emerald-700 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Grades Feedback ({submissions.filter(s => s.feedback).length})
                </button>
              </div>

              {/* A. SYSTEM BULLETINS / NOTIFICATIONS */}
              {messagesTab === 'bulletins' && (
                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-xl border border-slate-200 space-y-2">
                      <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-slate-500 text-xs font-medium">You have no system bulletins or notifications yet.</p>
                    </div>
                  ) : (
                    [...notifications].sort((a, b) => (b.id || 0) - (a.id || 0)).map((notif, index) => (
                      <div
                        key={index}
                        className={`bg-white p-4.5 rounded-xl border transition shadow-xs flex items-start gap-3.5 ${
                          notif.isRead ? 'border-slate-200' : 'border-emerald-250 bg-emerald-50/20'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${notif.isRead ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 flex-1 text-xs md:text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-slate-900 text-xs md:text-sm">{notif.title || "System Notice"}</h4>
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                              {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Active'}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed text-xs">{notif.message}</p>
                          {!notif.isRead && (
                            <span className="inline-block mt-1 text-[9px] uppercase font-black tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              New Bulletin
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* B. CONSULTATION & DIRECT MESSAGE FORM */}
              {messagesTab === 'consultation' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Chat feed */}
                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[400px]">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-black text-slate-800">Academic & Tuition Advisor Desk</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Auto-Advisory Enabled</span>
                    </div>

                    {/* Messages feed */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/30">
                      {[...directMessages].sort((a, b) => b.id - a.id).map((msg) => (
                        <div
                          key={msg.id}
                          className={`max-w-[85%] rounded-xl p-3 text-xs md:text-sm flex flex-col space-y-1 ${
                            msg.isResponse
                              ? 'bg-white text-slate-800 self-start mr-auto border border-slate-200'
                              : 'bg-emerald-600 text-white self-end ml-auto'
                          }`}
                        >
                          <span className={`text-[9px] font-bold ${msg.isResponse ? 'text-emerald-700' : 'text-emerald-100'}`}>
                            {msg.sender}
                          </span>
                          <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                          <span className={`text-[8px] text-right ${msg.isResponse ? 'text-slate-400' : 'text-emerald-200'}`}>
                            {msg.date}
                          </span>
                        </div>
                      ))}

                      {sendingQuery && (
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs self-start mr-auto max-w-[85%] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                          <span className="text-slate-400 italic">Academic Advisor is typing...</span>
                        </div>
                      )}
                    </div>

                    {/* Chat input */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newDirectQuery.trim()) return;
                        
                        const queryId = Date.now();
                        const userMsg = {
                          id: queryId,
                          sender: user?.name || "Student",
                          text: newDirectQuery,
                          date: "Just now",
                          isResponse: false
                        };
                        
                        setDirectMessages(prev => [...prev, userMsg]);
                        const typedQuery = newDirectQuery.toLowerCase();
                        setNewDirectQuery('');
                        setSendingQuery(true);

                        // Trigger auto feedback reply
                        setTimeout(() => {
                          setSendingQuery(false);
                          
                          let responseText = "Thank you for reaching out! Your consulting message has been safely received. An Academic Registrar will review this and respond within the next workspace business hour.";
                          
                          if (typedQuery.includes('certificate') || typedQuery.includes('degree') || typedQuery.includes('graduate')) {
                            responseText = "For certificates, they are auto-generated when you complete all course dynamic quizzes with score >= 70%. You can view and download them in the 'My Certificates' sidebar section anytime.";
                          } else if (typedQuery.includes('payment') || typedQuery.includes('money') || typedQuery.includes('bank') || typedQuery.includes('birr') || typedQuery.includes('telebirr')) {
                            responseText = "For payment and fee activations, we support CBE, BOA, Bunna Bank, and Telebirr. Make sure to specify 'Ezana Academy' and your registered email as the reference when conducting transfers. Then, upload your receipt block in the Pricing tab for registration validation.";
                          } else if (typedQuery.includes('quiz') || typedQuery.includes('exam') || typedQuery.includes('fail')) {
                            responseText = "All Ezana Academy quizzes feature unlimited re-attempts! You can study module feedback sheets and restart the quiz to improve your score anytime and acquire your certificate.";
                          }

                          setDirectMessages(prev => [...prev, {
                            id: queryId + 1,
                            sender: "Official Registrar System",
                            text: responseText,
                            date: "Just now",
                            isResponse: true
                          }]);
                        }, 1200);
                      }}
                      className="p-3 border-t border-slate-205 bg-white shrink-0 flex gap-2.5"
                    >
                      <input
                        type="text"
                        value={newDirectQuery}
                        onChange={(e) => setNewDirectQuery(e.target.value)}
                        placeholder="Write dynamic inquiry message..."
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs md:text-sm focus:outline-emerald-500 bg-slate-50 focus:bg-white"
                      />
                      <button
                        type="submit"
                        disabled={sendingQuery}
                        className="px-4 py-2 bg-slate-900 hover:bg-emerald-600 hover:text-slate-950 text-white font-extrabold uppercase text-[10px] tracking-wider transition rounded-lg shrink-0 cursor-pointer disabled:opacity-55"
                      >
                        Transmit
                      </button>
                    </form>
                  </div>

                  {/* FAQ Card Helper */}
                  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <HelpCircle className="w-4 h-4 text-emerald-600" /> Consultations FAQ
                    </h4>
                    
                    <div className="space-y-3 text-xs leading-relaxed">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-900 block">Q: Restoring local transactions info?</span>
                        <p className="text-slate-500">All submissions are written permanently directly to database.json, ensuring perfect state across multiple logins.</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-900 block font-bold">Q: Contact feedback due dates?</span>
                        <p className="text-slate-500">Instructors grade uploaded documents within 24 hours of submission. Once graded, feedback remarks are mirrored instantly.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* C. INSTRUCTOR GRADES AND SOLUTIONS FEEDBACK */}
              {messagesTab === 'feedback' && (
                <div className="space-y-4">
                  {submissions.filter(s => s.feedback || s.grade).length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-xl border border-slate-200 space-y-2">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-slate-500 text-xs font-medium">You have no graded assignments or instructor feedback remarks yet.</p>
                    </div>
                  ) : (
                    [...submissions].filter(s => s.feedback || s.grade).sort((a, b) => b.id - a.id).map((submission, index) => {
                      const correlatedAssignment = assignments.find(a => a.id === submission.assignmentId);
                      return (
                        <div key={index} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs md:text-sm">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <span className="bg-emerald-50 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase font-mono">
                              GRADE: {submission.grade || "Under review"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Submitted solutions desk
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-extrabold text-slate-900">
                              {correlatedAssignment?.title || `Assignment ID: ${submission.assignmentId}`}
                            </h4>
                            <p className="text-slate-500 text-xs">
                              {correlatedAssignment?.description}
                            </p>
                          </div>

                          {submission.feedback && (
                            <div className="bg-amber-50/40 p-3 border border-amber-200/50 rounded-lg text-amber-955 font-medium italic">
                              <span className="font-black not-italic text-amber-900 block text-xs tracking-wide">
                                💬 Instructor Review feedback:
                              </span>
                              "{submission.feedback}"
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* F. PROFILE SETTINGS */}
          {activePane === 'settings' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Account Profile Settings</h3>
                <p className="text-slate-500 text-xs mt-1">Modify your visual profile credentials or security passwords below.</p>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4 max-w-lg text-xs md:text-sm">
                {settingStatus && (
                  <p className="p-3 bg-emerald-55 text-emerald-800 border border-emerald-100 rounded text-xs">{settingStatus}</p>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Recipient Profile Name</label>
                  <input
                    id="profile_name_input"
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Security Password (leave blank to protect current)</label>
                  <input
                    id="profile_pass_input"
                    type="password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="New password code..."
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                  />
                </div>

                <button
                  id="profile-save-submit"
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white hover:text-slate-950 transition font-bold text-xs uppercase cursor-pointer"
                >
                  Apply Settings Change
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
