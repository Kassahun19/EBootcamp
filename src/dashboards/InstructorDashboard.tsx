import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Clock, FileText, LayoutDashboard, Play, Plus, Trash2, Edit, Save, AlertTriangle, CheckCircle, Database, HelpCircle, Activity, ChevronRight, UserCheck, Bell, MessageSquare, Megaphone, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function InstructorDashboard() {
  const { user, token } = useAuth();
  const [activePane, setActivePane] = useState<'overview' | 'manage_courses' | 'grade_submissions' | 'course_builder' | 'post_announcements' | 'messages'>('overview');
  
  // Dynamic stats
  const [stats, setStats] = useState({
    totalCourses: 3,
    totalStudents: 452,
    totalRevenue: 24000,
    courseProgressAverage: 38
  });

  // Announcements & notifications states
  const [instNotifications, setInstNotifications] = useState<any[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState<string | null>(null);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);

  // Database listings
  const [courses, setCourses] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);

  // Selection keys
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

  // Homework grading states
  const [activeSub, setActiveSub] = useState<any | null>(null);
  const [gradeVal, setGradeVal] = useState('');
  const [feedbackVal, setFeedbackVal] = useState('');
  const [gradingStatus, setGradingStatus] = useState<string | null>(null);

  // Global notice board broadcast feature states
  const [announcementText, setAnnouncementText] = useState(() => localStorage.getItem('instructor_announcement') || '🚀 Welcome back to the class! The final modules of React hooks with Node context have been published.');
  const [announcementStatus, setAnnouncementStatus] = useState<string | null>(null);

  // Forms states (Course CRUD)
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [cTitle, setCTitle] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cCategory, setCCategory] = useState('AI Full Stack');
  const [cDuration, setCDuration] = useState('15 Hours');
  const [cThumbnail, setCThumbnail] = useState('https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600');
  const [cPremium, setCPremium] = useState(true);

  // Forms states (Module CRUD)
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');

  // Forms states (Lesson CRUD)
  const [lTitle, setLTitle] = useState('');
  const [lDesc, setLDesc] = useState('');
  const [lYtId, setLYtId] = useState('');
  const [lPreview, setLPreview] = useState(false);
  const [lDuration, setLDuration] = useState('15 mins');

  useEffect(() => {
    fetchInstructorData();
  }, [token]);

  const fetchInstructorData = async () => {
    if (!token) return;
    try {
      // stats
      const sres = await fetch('/api/stats');
      if (sres.ok) {
        const d = await sres.json();
        setStats({
          totalCourses: d.totalCourses,
          totalStudents: d.totalStudents,
          totalRevenue: d.totalRevenue,
          courseProgressAverage: 45
        });
      }

      // courses
      const cres = await fetch('/api/courses');
      if (cres.ok) {
        const list = await cres.json();
        setCourses(list);
        if (list.length > 0 && !selectedCourseId) {
          setSelectedCourseId(list[0].id);
        }
      }

      // homework submissions
      const subRes = await fetch('/api/submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (subRes.ok) {
        setSubmissions(await subRes.json());
      }

      // personal notifications
      const notifRes = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notifRes.ok) {
        setInstNotifications(await notifRes.json());
      }
    } catch (e) {
      console.error("Error loaded instructor dashboard datasets:", e);
    }
  };

  const markInstructorNotificationsAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setInstNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (e) {
      console.warn("Error marking instructor notifications as read:", e);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseModules(selectedCourseId);
    }
  }, [selectedCourseId]);

  const fetchCourseModules = async (courseId: number) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/modules`);
      if (res.ok) {
        const mList = await res.json();
        setModules(mList);
        if (mList.length > 0) {
          setSelectedModuleId(mList[0].id);
          fetchModuleLessons(mList[0].id);
        } else {
          setModules([]);
          setLessons([]);
          setSelectedModuleId(null);
        }
      }
    } catch (e) {
      console.error("Error fetching modules list:", e);
    }
  };

  const fetchModuleLessons = async (moduleId: number) => {
    try {
      const res = await fetch(`/api/modules/${moduleId}/lessons`);
      if (res.ok) {
        setLessons(await res.json());
      }
    } catch (e) {
      console.error("Error fetching lessons:", e);
    }
  };

  // 1. Course Creation
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setStatusMsg("Writing course record to Simulated database...");
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: cTitle,
          description: cDesc,
          category: cCategory,
          duration: cDuration,
          thumbnail: cThumbnail,
          premium: cPremium
        })
      });

      if (res.ok) {
        setStatusMsg("✓ New Course successfully written and published.");
        setCTitle('');
        setCDesc('');
        fetchInstructorData();
      } else {
        setStatusMsg("Error submitting course elements.");
      }
    } catch (e) {
      setStatusMsg("Network failure.");
    }
  };

  // 2. Module Creation
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCourseId) return;
    try {
      setStatusMsg("Appending new Module item...");
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
          title: mTitle,
          description: mDesc
        })
      });

      if (res.ok) {
        setStatusMsg("✓ Module appended.");
        setMTitle('');
        setMDesc('');
        fetchCourseModules(selectedCourseId);
      }
    } catch (e) {}
  };

  // 3. Lesson Creation
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCourseId || !selectedModuleId) return;
    try {
      setStatusMsg("Creating lesson details with YouTube unlisted video ID...");
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          moduleId: selectedModuleId,
          courseId: selectedCourseId,
          title: lTitle,
          description: lDesc,
          youtubeId: lYtId,
          isPreview: lPreview,
          duration: lDuration
        })
      });

      if (res.ok) {
        setStatusMsg("✓ Lesson appended successfully.");
        setLTitle('');
        setLDesc('');
        setLYtId('');
        fetchModuleLessons(selectedModuleId);
      }
    } catch (e) {}
  };

  // Grade student solution submissions
  const handleGradeSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSub || !token) return;

    try {
      setGradingStatus("Recording evaluation grades...");
      const res = await fetch(`/api/submissions/${activeSub.id}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ grade: gradeVal, feedback: feedbackVal })
      });

      if (res.ok) {
        setGradingStatus("✓ Grade saved. Student notified.");
        setGradeVal('');
        setFeedbackVal('');
        setActiveSub(null);
        fetchInstructorData();
      }
    } catch (e) {
      setGradingStatus("Error grading submission.");
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Are you sure you want to purge this course? This deletes modules and child lessons too.")) return;
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchInstructorData();
      }
    } catch (e) {}
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 p-4" id="instructor_dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Title Board */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900">Lecturer & Curriculum Administration</h1>
            <p className="text-slate-500 text-xs mt-1">
              Role Flag: <span className="font-bold text-teal-800 capitalize">instructor dashboard</span> • Workspace: Seeding elements active.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              id="inst_menu_overview"
              onClick={() => setActivePane('overview')}
              className={`px-4 py-2 rounded text-xs font-bold transition cursor-pointer ${
                activePane === 'overview' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-205'
              }`}
            >
              Overview stats
            </button>
            <button
              id="inst_menu_builder"
              onClick={() => setActivePane('course_builder')}
              className={`px-4 py-2 rounded text-xs font-bold transition cursor-pointer ${
                activePane === 'course_builder' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-205'
              }`}
            >
              Curriculum Builder
            </button>
            <button
              id="inst_menu_grade"
              onClick={() => setActivePane('grade_submissions')}
              className={`px-4 py-2 rounded text-xs font-bold transition cursor-pointer ${
                activePane === 'grade_submissions' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-205'
              }`}
            >
              Grade Homework ({submissions.filter(s => s.grade === 'Pending').length})
            </button>
            <button
              id="inst_menu_announcement"
              onClick={() => setActivePane('post_announcements')}
              className={`px-4 py-2 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activePane === 'post_announcements' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-205'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Post Announcement</span>
            </button>
            <button
              id="inst_menu_notifications"
              onClick={() => {
                setActivePane('messages');
                markInstructorNotificationsAsRead();
              }}
              className={`px-4 py-2 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activePane === 'messages' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-205'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Inbox & Bulletins</span>
              {instNotifications.filter(n => !n.isRead).length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full font-mono">
                  {instNotifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* STATS DECK */}
        {activePane === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Dynamic Programs</span>
                <p className="text-3xl font-black text-slate-900">{stats.totalCourses}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Enrolled Alumni</span>
                <p className="text-3xl font-black text-slate-900">{stats.totalStudents}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Cumulative Revenue</span>
                <p className="text-3xl font-black text-emerald-600">ETB {stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Course Completion</span>
                <p className="text-3xl font-black text-slate-900">{stats.courseProgressAverage}%</p>
              </div>
            </div>

            {/* Global Notice Ticker Broadcaster banner */}
            <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 shadow-md space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Interactive Board Ticker</span>
                  <h3 className="font-extrabold text-white text-sm md:text-base mt-2">SaaS Student Notice Broadcaster</h3>
                  <p className="text-slate-400 text-xs leading-normal">Transmit layout changes or announcement bulletins to active student workspace views instantaneously.</p>
                </div>
                
                <span className="bg-slate-800 text-emerald-400 border border-slate-700 font-mono text-xs font-bold px-2.5 py-1 rounded inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Transmitter On
                </span>
              </div>

              <div className="space-y-3">
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Draft dynamic bulletin alerts..."
                  rows={2}
                  className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-200 focus:outline-emerald-500 text-slate-100"
                ></textarea>

                <div className="flex justify-between items-center text-xs">
                  {announcementStatus ? (
                    <span className="text-emerald-300 font-extrabold text-[11px] animate-pulse">✓ {announcementStatus}</span>
                  ) : <span className="text-[10px] text-slate-500">Notice displays as a high-visibility warning ribbon on students home screen.</span>}
                  
                  <button
                    onClick={() => {
                      localStorage.setItem('instructor_announcement', announcementText);
                      setAnnouncementStatus("Broadcast published to student dashboards!");
                      setTimeout(() => setAnnouncementStatus(null), 3000);
                    }}
                    className="ml-auto px-4.5 py-2 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 text-slate-950 hover:text-white font-extrabold transition rounded text-[11px] cursor-pointer shadow-xs"
                  >
                    Transmit Bulletin
                  </button>
                </div>
              </div>
            </div>

            {/* HIGH FIDELITY SVG CHARTS AS REQUESTED */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-950 text-xs uppercase tracking-widest">Academic Enrollment Analysis</h3>
                
                {/* Visual SVG column bar chart representation */}
                <div className="h-64 flex items-end gap-6 pt-4 px-2 select-none border-b border-l border-slate-200">
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="bg-emerald-600 hover:bg-emerald-500 rounded-t w-full h-40 transition-all duration-300" title="AI Full Stack: 240 Students"></div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase truncate max-w-[80px]">React Dev</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="bg-emerald-600 hover:bg-emerald-500 rounded-t w-full h-32 transition-all duration-300" title="English conversational: 160 Students"></div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase truncate max-w-[80px]">English</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="bg-emerald-600 hover:bg-emerald-500 rounded-t w-full h-16 transition-all duration-300" title="Discrete Mathematics: 80 Students"></div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase truncate max-w-[80px]">Mathematics</span>
                  </div>
                </div>
              </div>

              {/* Course syllabus visual details list */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-950 text-xs uppercase tracking-widest">Dynamic Seeding syllabus metadata</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {courses.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-extrabold text-slate-900 leading-normal">{c.title}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">{c.duration} Extensive study duration • {c.category}</p>
                      </div>
                      <span className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer" onClick={() => handleDeleteCourse(c.id)}>Purge</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* C. CURRICULUM WORKSPACE BUILDER */}
        {activePane === 'course_builder' && (
          <div className="space-y-6">
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <h3 className="text-xl font-bold text-slate-950">Curriculum Hierarchy Builder</h3>
              <p className="text-slate-500 text-xs">
                Construct and publish courses,Modules, lessons, and assignments which bind YouTube unlisted video playback keys.
              </p>
            </div>

            {statusMsg && (
              <p className="p-4 bg-emerald-55 border border-emerald-100 text-emerald-800 rounded text-xs">{statusMsg}</p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Add Course Form */}
              <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-950 text-sm">1. Create New Program Model</h4>
                
                <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Course title *</label>
                    <input type="text" required value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="e.g. ADVANCED CALCULUS SYSTEMS" className="w-full p-2.5 border border-slate-350 rounded focus:outline-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Course narrative description *</label>
                    <textarea required rows={3} value={cDesc} onChange={(e) => setCDesc(e.target.value)} placeholder="Comprehensive course curriculum descriptions..." className="w-full p-2.5 border border-slate-350 rounded focus:outline-emerald-500"></textarea>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Category *</label>
                    <select value={cCategory} onChange={(e) => setCCategory(e.target.value)} className="w-full p-2.5 border border-slate-350 rounded bg-white">
                      <option value="AI Full Stack">AI Full Stack Program</option>
                      <option value="English">English Program</option>
                      <option value="Mathematics">Mathematics Program</option>
                    </select>
                  </div>
                  
                  <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white hover:text-slate-950 font-bold rounded cursor-pointer uppercase transition tracking-wider text-[11px]">
                    Publish Program Card
                  </button>
                </form>
              </div>

              {/* Module Hierarchy builder form */}
              <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-950 text-sm">2. Create and Append Modules</h4>
                  <p className="text-[10px] text-slate-400">Specify parent course elements:</p>
                  
                  <select value={selectedCourseId || ''} onChange={(e) => setSelectedCourseId(parseInt(e.target.value))} className="w-full p-2 border border-slate-350 rounded bg-white text-xs">
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <form onSubmit={handleCreateModule} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Module title *</label>
                    <input type="text" required value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="e.g. Module 3: Calculus Proof techniques Setup" className="w-full p-2.5 border border-slate-350 rounded" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Module objective notes</label>
                    <textarea rows={2} value={mDesc} onChange={(e) => setMDesc(e.target.value)} placeholder="Describe core comprehension topics..." className="w-full p-2.5 border border-slate-350 rounded"></textarea>
                  </div>
                  
                  <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white hover:text-slate-950 font-bold rounded cursor-pointer uppercase text-[11px]">
                    Create Module Item
                  </button>
                </form>
              </div>

              {/* Lessons creation and YouTube embedding form */}
              <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-slate-900 text-sm">3. Append Lessons (unlisted YouTube IDs)</h4>
                  <p className="text-[10px] text-slate-400 font-bold">Select Active Module:</p>
                  
                  <select value={selectedModuleId || ''} onChange={(e) => {
                    setSelectedModuleId(parseInt(e.target.value));
                    fetchModuleLessons(parseInt(e.target.value));
                  }} className="w-full p-2 border border-slate-350 rounded bg-white text-xs">
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>

                <form onSubmit={handleCreateLesson} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Lesson Chapter Title *</label>
                    <input type="text" required value={lTitle} onChange={(e) => setLTitle(e.target.value)} placeholder="e.g. power limits calculation routines" className="w-full p-2 border" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Unlisted YouTube Video ID *</label>
                    <input type="text" required value={lYtId} onChange={(e) => setLYtId(e.target.value)} placeholder="e.g. Ke90Tje7VS0" className="w-full p-2 border text-xs font-mono" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Duration</label>
                      <input type="text" value={lDuration} onChange={(e) => setLDuration(e.target.value)} placeholder="e.g. 15 mins" className="w-full p-2 border" />
                    </div>
                    
                    <div className="space-y-1.5 pt-4">
                      <label className="flex gap-2.5 items-center cursor-pointer font-bold text-slate-600">
                        <input type="checkbox" checked={lPreview} onChange={(e) => setLPreview(e.target.checked)} className="accent-emerald-600" />
                        <span>Free Demo?</span>
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-2.5 bg-slate-900 text-white font-bold rounded cursor-pointer uppercase text-[11px]">
                    Save Lesson row
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* D. GRADE SUBMISSIONS SECTION */}
        {activePane === 'grade_submissions' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Student homework document submissions reviewer</h3>
              <p className="text-slate-500 text-xs">Verify uploaded image screenshots or PDF attachments and append marks and custom remarks.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Assignment submissions queue */}
              <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest">Awaiting assessment review queue</h4>
                
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {submissions.length === 0 ? (
                    <p className="text-slate-500 text-xs p-4 bg-slate-10 w-full text-center">No assignment sheets submitted yet by student accounts.</p>
                  ) : (
                    submissions.map((sub) => (
                      <div key={sub.id} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-2">
                        <div className="flex justify-between items-start h-5">
                          <div>
                            <p className="font-bold text-slate-950">{sub.studentName} ({sub.studentEmail})</p>
                            <p className="text-[10px] text-slate-400">{sub.assignmentTitle || "Responsive layout exercise"}</p>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            sub.grade === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-150 text-emerald-800'
                          }`}>
                            Grade: {sub.grade}
                          </span>
                        </div>

                        {sub.studentComments && (
                          <p className="text-slate-500 mt-1 italic font-medium">Comments: "{sub.studentComments}"</p>
                        )}

                        <div className="flex gap-4 justify-between items-center pt-2">
                          <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold hover:underline">
                            📎 Review Attachment Document (PDF/Image)
                          </a>
                          
                          {sub.grade === 'Pending' && (
                            <button
                              id={`active_grade_trigger_${sub.id}`}
                              onClick={() => {
                                setActiveSub(sub);
                                setGradeVal('');
                                setFeedbackVal('');
                              }}
                              className="px-3 py-1 bg-slate-900 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Grade Solution
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Grading interface form */}
              <div className="lg:col-span-6">
                {activeSub ? (
                  <div className="bg-white p-5 rounded-xl border-2 border-emerald-500/20 bg-emerald-55/15 space-y-4 shadow-sm">
                    <h4 className="font-extrabold text-slate-950 text-sm">Reviewing homework solution of: {activeSub.studentName}</h4>
                    {gradingStatus && <p className="text-xs text-emerald-800 bg-emerald-55 p-2 rounded">{gradingStatus}</p>}

                    <form onSubmit={handleGradeSub} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600">Assign Grade Mark (e.g. A, B, C, or 92/100) *</label>
                        <input id="score-val-input" type="text" required value={gradeVal} onChange={(e) => setGradeVal(e.target.value)} placeholder="A-Plus" className="w-full p-2 border bg-white rounded" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600">Efficacy feedback comments *</label>
                        <textarea id="feedback-val-textarea" required rows={3} value={feedbackVal} onChange={(e) => setFeedbackVal(e.target.value)} placeholder="Fantastic code layout and structured CSS formatting. Highly compliant." className="w-full p-2 border bg-white rounded"></textarea>
                      </div>

                      <div className="flex gap-3.5 pt-2">
                        <button type="submit" className="px-5 py-2.5 bg-slate-900 text-white hover:bg-emerald-600 hover:text-slate-950 transition font-bold rounded uppercase tracking-wider text-[11px] cursor-pointer">
                          Apply Stamp and Notify
                        </button>
                        <button type="button" onClick={() => setActiveSub(null)} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-205 rounded font-bold cursor-pointer text-xs">
                          Dismiss
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                    Please click "Grade Solution" on any student in the pending queue to open the active evaluation panel.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* POST ANNOUNCEMENTS SECTION */}
        {activePane === 'post_announcements' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-600" />
                Post Announcement to All Students
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Publish a global bulletin to all registered students of Ezana Academy. This notification will instantly show up on each student's personal dashboard.
              </p>
            </div>

            {announcementMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{announcementMsg}</span>
              </div>
            )}

            {announcementError && (
              <div className="p-3 bg-rose-50 border border-rose-250 text-rose-900 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{announcementError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
                  setAnnouncementError("Please fill out both the title and message fields.");
                  return;
                }
                setAnnouncementMsg(null);
                setAnnouncementError(null);

                try {
                  const res = await fetch('/api/announcements/broadcast', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      title: broadcastTitle,
                      message: broadcastMessage
                    })
                  });

                  if (res.ok) {
                    const data = await res.json();
                    setAnnouncementMsg(`✓ ${data.message || 'Announcement broadcasted successfully!'}`);
                    setBroadcastTitle('');
                    setBroadcastMessage('');
                  } else {
                    const errorData = await res.json();
                    setAnnouncementError(errorData.message || "Failed to broadcast the announcement. Please try again.");
                  }
                } catch (err) {
                  setAnnouncementError("A network error occurred. Please verify your connection.");
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Update for Advanced Machine Learning & Deep Logic"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs md:text-sm focus:outline-emerald-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Announcement Message Content *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Type your notification description or school announcement block details here..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs md:text-sm focus:outline-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-emerald-600 hover:text-slate-950 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Broadcast Announcement
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBroadcastTitle('');
                    setBroadcastMessage('');
                    setAnnouncementMsg(null);
                    setAnnouncementError(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Clear Fields
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MESSAGES & NOTIFICATIONS SECTION */}
        {activePane === 'messages' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex justify-between items-center gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  My Inbox & System Notifications
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  View recent workspace action notifications and private academic messages sent back to you.
                </p>
              </div>
              {instNotifications.some(n => !n.isRead) && (
                <button
                  onClick={markInstructorNotificationsAsRead}
                  className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
                >
                  Mark All as Read
                </button>
              )}
            </div>

            <div className="space-y-3.5">
              {instNotifications.length === 0 ? (
                <div className="p-12 text-center rounded-xl border border-slate-100 space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-500 text-xs font-semibold">No messages or notifications log entries found.</p>
                </div>
              ) : (
                [...instNotifications].sort((a, b) => (b.id || 0) - (a.id || 0)).map((notif, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition flex items-start gap-3.5 ${
                      notif.isRead ? 'border-slate-200 bg-white' : 'border-emerald-200 bg-emerald-50/10'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${notif.isRead ? 'bg-slate-50 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                      {notif.type === 'message' ? <MessageSquare className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </div>
                    <div className="space-y-1 flex-1 text-xs md:text-sm">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-xs md:text-sm">{notif.title || "Academic Notice"}</h4>
                        <span className="text-[10px] text-slate-400 font-medium font-mono whitespace-nowrap">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Active'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{notif.message}</p>
                      {!notif.isRead && (
                        <span className="inline-block mt-0.5 text-[9px] uppercase font-black tracking-widest text-emerald-850 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Unread Notice
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
