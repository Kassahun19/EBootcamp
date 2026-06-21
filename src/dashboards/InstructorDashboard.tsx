import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Clock, FileText, LayoutDashboard, Play, Plus, Trash2, Edit, Save, AlertTriangle, CheckCircle, Database, HelpCircle, Activity, ChevronRight, UserCheck, Bell, MessageSquare, Megaphone, Send, Upload, X, RefreshCw, Film, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { QuizExamBuilder } from '../components/QuizExamBuilder';

export interface QueuedVideo {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'queued' | 'uploading' | 'completed' | 'failed';
  uploadedUrl?: string;
  error?: string;
  lessonTitle: string;
  isSavingLesson: boolean;
  isSavedAsLesson: boolean;
}

export default function InstructorDashboard() {
  const { user, token } = useAuth();
  const [activePane, setActivePane] = useState<'overview' | 'manage_courses' | 'grade_submissions' | 'course_builder' | 'post_announcements' | 'messages' | 'quiz_builder'>('overview');
  
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

  // Interactive Live Classes Scheduler
  const [liveSessions, setLiveSessions] = useState(() => {
    const saved = localStorage.getItem('ezana_live_sessions');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Deep Dive: Vite Reverse Proxies & Port 3000 Ingress', date: '2026-06-20', time: '14:00', hostLink: 'https://meet.google.com/abc-defg-hij' },
      { id: 2, title: 'Weekly Q&A: Advanced SQL & Schema Migrations', date: '2026-06-25', time: '11:00', hostLink: 'https://meet.google.com/xyz-uvwx-123' },
    ];
  });
  const [liveTitle, setLiveTitle] = useState('');
  const [liveDate, setLiveDate] = useState('');
  const [liveTime, setLiveTime] = useState('');
  const [liveLink, setLiveLink] = useState('https://meet.google.com/mock-id');

  // Interactive Student Q&A Board
  const [studentQas, setStudentQas] = useState(() => {
    const saved = localStorage.getItem('ezana_qa_threads');
    return saved ? JSON.parse(saved) : [
      { id: 1, student: 'Abebe Kebede', course: 'AI Full Stack', question: 'How do we handle state serialization in deep nested context modules?', answer: null, date: 'June 14, 2026' },
      { id: 2, student: 'Selam Hailu', course: 'React / Node Web Dev', question: 'Is localstorage safer than cookies for JWT tokens under CSP policies?', answer: 'Cookies are safer if HttpOnly attributes are activated server-side, but localStorage is extremely clean and flexible for single page browser runtimes!', date: 'June 15, 2026' }
    ];
  });
  const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});

  // Dynamic Earnings Share calculator states
  const [calcTier, setCalcTier] = useState('0.55'); // 55% share
  const [customCalculatedPayout, setCustomCalculatedPayout] = useState<number | null>(null);

  // Certificate Issuance Simulation Registry
  const [certifiedStudents, setCertifiedStudents] = useState<Array<{ id: number; name: string; course: string; issueDate: string }>>([
    { id: 101, name: 'Rediet Solomon', course: 'HTML Basics Part II', issueDate: '2026-06-10' },
    { id: 102, name: 'Biruk Chala', course: 'English Conversational Practice', issueDate: '2026-06-12' },
  ]);
  const [certStudentName, setCertStudentName] = useState('');
  const [certCourse, setCertCourse] = useState('AI Full Stack');

  // Custom Quiz Building States
  const [quizQuestions, setQuizQuestions] = useState(() => {
    const saved = localStorage.getItem('ezana_custom_quizzes');
    return saved ? JSON.parse(saved) : [
      { id: 1, courseId: 1, question: 'Which React hook handles asynchronous side effects?', choices: ['useState', 'useEffect', 'useMemo', 'useContext'], correctAnswer: 'useEffect' }
    ];
  });
  const [quizQuestionInput, setQuizQuestionInput] = useState('');
  const [quizChoiceA, setQuizChoiceA] = useState('');
  const [quizChoiceB, setQuizChoiceB] = useState('');
  const [quizChoiceC, setQuizChoiceC] = useState('');
  const [quizChoiceD, setQuizChoiceD] = useState('');
  const [quizCorrectAnswer, setQuizCorrectAnswer] = useState('');

  // Course Builder Extended Elements state
  const [cSkillLevel, setCSkillLevel] = useState('Beginner');
  const [cPrice, setCPrice] = useState('1000');
  const [cObjectives, setCObjectives] = useState('');
  const [cPrerequisites, setCPrerequisites] = useState('');
  const [cTags, setCTags] = useState('');

  // Lessons Form Extended states
  const [lessonType, setLessonType] = useState<'video' | 'text' | 'resource'>('video');
  const [videoSource, setVideoSource] = useState<'direct' | 'youtube'>('youtube');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [textContent, setTextContent] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');

  // YouTube playlist parsing tools
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistVideos, setPlaylistVideos] = useState<any[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [selectedPlaylistVideoIds, setSelectedPlaylistVideoIds] = useState<string[]>([]);

  // Batch video upload queue state
  const [batchQueue, setBatchQueue] = useState<QueuedVideo[]>([]);
  const [isDragging, setIsDragging] = useState(false);

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
          premium: cPremium,
          skillLevel: cSkillLevel,
          price: Number(cPrice),
          objectives: cObjectives,
          prerequisites: cPrerequisites,
          tags: cTags
        })
      });

      if (res.ok) {
        setStatusMsg("✓ New Course successfully written and published.");
        setCTitle('');
        setCDesc('');
        setCObjectives('');
        setCPrerequisites('');
        setCTags('');
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
  const handleDirectVideoUpload = async (file: File) => {
    if (!token) return;
    setUploadProgress(0);
    setStatusMsg("Starting video file upload sequence (MP4, AVI, WebM)...");
    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/lessons/upload-video');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const resMap = JSON.parse(xhr.responseText);
          setUploadedVideoUrl(resMap.url);
          setStatusMsg("✓ Video uploaded successfully to server/uploads/videos!");
        } catch (err) {
          setStatusMsg("Failed parsing server upload JSON.");
        }
      } else {
        setStatusMsg("Video upload failed. Check files size is within 100MB constraints.");
      }
      setUploadProgress(null);
    };

    xhr.onerror = () => {
      setStatusMsg("Network failure occurred during video routing.");
      setUploadProgress(null);
    };

    xhr.send(formData);
  };

  const addFilesToBatchQueue = (files: FileList) => {
    const newItems: QueuedVideo[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/') || 
                      ['.mp4', '.mov', '.avi', '.webm'].some(ext => file.name.toLowerCase().endsWith(ext));
      if (!isVideo) {
        setStatusMsg(`Skipped "${file.name}" - only video files (.mp4, .mov, .avi, .webm) are allowed.`);
        continue;
      }
      if (file.size > 100 * 1024 * 1024) {
        setStatusMsg(`Skipped "${file.name}" - size exceeds 100MB constraints.`);
        continue;
      }

      // Generate standard/clean title based on file name (strip extension)
      const baseTitle = file.name.replace(/\.[^/.]+$/, "") // strip extension
                                 .replace(/[_-]/g, ' ') // replace dash/underscores
                                 .trim();

      newItems.push({
        id: 'qv-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now(),
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'queued',
        lessonTitle: baseTitle.charAt(0).toUpperCase() + baseTitle.slice(1), // Capitalize first letter
        isSavingLesson: false,
        isSavedAsLesson: false
      });
    }

    if (newItems.length > 0) {
      setBatchQueue(prev => {
        const updated = [...prev, ...newItems];
        // Auto-trigger uploads for queued items
        setTimeout(() => {
          newItems.forEach(item => startSingleVideoUploadInQueue(item.id, item.file));
        }, 100);
        return updated;
      });
      setStatusMsg(`Successfully queued ${newItems.length} videos. Processing batch uploads...`);
    }
  };

  const startSingleVideoUploadInQueue = (id: string, file: File) => {
    if (!token) return;

    setBatchQueue(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'uploading', progress: 0 };
      }
      return item;
    }));

    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/lessons/upload-video');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setBatchQueue(prev => prev.map(item => {
          if (item.id === id) {
            return { ...item, progress: percent };
          }
          return item;
        }));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const resMap = JSON.parse(xhr.responseText);
          setBatchQueue(prev => prev.map(item => {
            if (item.id === id) {
              return { ...item, status: 'completed', progress: 100, uploadedUrl: resMap.url };
            }
            return item;
          }));
        } catch (err) {
          setBatchQueue(prev => prev.map(item => {
            if (item.id === id) {
              return { ...item, status: 'failed', error: 'Response parse error' };
            }
            return item;
          }));
        }
      } else {
        setBatchQueue(prev => prev.map(item => {
          if (item.id === id) {
            return { ...item, status: 'failed', error: 'Server error ' + xhr.status };
          }
          return item;
        }));
      }
    };

    xhr.onerror = () => {
      setBatchQueue(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, status: 'failed', error: 'Network failure' };
        }
        return item;
      }));
    };

    xhr.send(formData);
  };

  const handleInlineLessonCreationFromQueue = async (id: string) => {
    const item = batchQueue.find(qi => qi.id === id);
    if (!item || !token || !item.uploadedUrl) return;

    if (!selectedCourseId || !selectedModuleId) {
      setStatusMsg("⚠️ Please select a Target Course & Module for this lesson first!");
      return;
    }

    setBatchQueue(prev => prev.map(qi => qi.id === id ? { ...qi, isSavingLesson: true } : qi));

    try {
      const bodyPayload = {
        moduleId: selectedModuleId,
        courseId: selectedCourseId,
        title: item.lessonTitle,
        description: `Lecture presentation for chapter "${item.lessonTitle}".`,
        lessonType: 'video',
        youtubeId: '',
        videoUrl: item.uploadedUrl,
        textContent: '',
        downloadUrl: '',
        resourceTitle: '',
        isPreview: false,
        duration: '15 mins'
      };

      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        setBatchQueue(prev => prev.map(qi => qi.id === id ? { ...qi, isSavedAsLesson: true, isSavingLesson: false } : qi));
        setStatusMsg(`✓ Succeeded! Created lesson chapter "${item.lessonTitle}" cleanly.`);
        fetchModuleLessons(selectedModuleId);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setStatusMsg(`Error creating lesson: ${errorData.message || 'Verification issue'}`);
        setBatchQueue(prev => prev.map(qi => qi.id === id ? { ...qi, isSavingLesson: false } : qi));
      }
    } catch (e) {
      setStatusMsg("Failed saving lesson. Please verify inputs.");
      setBatchQueue(prev => prev.map(qi => qi.id === id ? { ...qi, isSavingLesson: false } : qi));
    }
  };

  const handleClearCompletedBatch = () => {
    setBatchQueue(prev => prev.filter(item => item.status !== 'completed' || !item.isSavedAsLesson));
  };

  const handleRemoveFromQueue = (id: string) => {
    setBatchQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToBatchQueue(e.dataTransfer.files);
    }
  };

  const handleFetchYoutubePlaylist = async () => {
    if (!token || !playlistUrl) {
      setStatusMsg("Please input a valid Youtube Playlist Link or ID first.");
      return;
    }
    setPlaylistLoading(true);
    setStatusMsg("Contacting server to synchronize YouTube playlist cache...");
    try {
      const res = await fetch(`/api/youtube/playlist?playlistId=${encodeURIComponent(playlistUrl)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        setPlaylistVideos(list);
        setSelectedPlaylistVideoIds(list.map((v: any) => v.id)); // select all
        setStatusMsg(`✓ Synchronized playlist! Found ${list.length} tracks. Verify list and bulk load.`);
      } else {
        setStatusMsg("YouTube playlist could not be fetched. Utilizing fallback simulator data.");
        // Fallback simulate to ensure seamless developer experience
        const mockVideos = [
          { id: "Ke90Tje7VS0", title: "Introduction and Setup (Playlist Track 1)", duration: "10 mins", description: "Setup systems, compilers, reverse proxy." },
          { id: "L7244-S8_co", title: "Core Architecture Principles (Playlist Track 2)", duration: "18 mins", description: "Vite reverse proxies, route headers, database schemas." },
          { id: "9P8H_YvR_S0", title: "Production Deployment Practices (Playlist Track 3)", duration: "25 mins", description: "Cloud Run containers configuration, ssl setup." }
        ];
        setPlaylistVideos(mockVideos);
        setSelectedPlaylistVideoIds(mockVideos.map((v: any) => v.id));
      }
    } catch (e) {
      setStatusMsg("Connection error during playlist retrieval.");
    } finally {
      setPlaylistLoading(false);
    }
  };

  const handleBulkImportPlaylist = async () => {
    if (!token || !selectedCourseId || !selectedModuleId || playlistVideos.length === 0) {
      setStatusMsg("Make sure you specify a target course & module, and load a playlist.");
      return;
    }
    const filtered = playlistVideos.filter(v => selectedPlaylistVideoIds.includes(v.id));
    if (filtered.length === 0) {
      setStatusMsg("Please check some curriculum checkboxes before bulk submitting.");
      return;
    }
    setStatusMsg(`Importing ${filtered.length} chapters inside current module. Please wait...`);
    try {
      const res = await fetch(`/api/courses/${selectedCourseId}/import-playlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          moduleId: selectedModuleId,
          videos: filtered
        })
      });
      if (res.ok) {
        setStatusMsg(`✓ Succeeded! Synthesized and imported ${filtered.length} lessons into current module.`);
        setPlaylistUrl('');
        setPlaylistVideos([]);
        setSelectedPlaylistVideoIds([]);
        fetchModuleLessons(selectedModuleId);
      } else {
        setStatusMsg("Server failed to bulk import playlist.");
      }
    } catch (e) {
      setStatusMsg("Disruption syncing playlist elements.");
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCourseId || !selectedModuleId) {
      setStatusMsg("Select a module before appending a curriculum lesson.");
      return;
    }
    try {
      setStatusMsg("Saving lesson unit...");
      const bodyPayload = {
        moduleId: selectedModuleId,
        courseId: selectedCourseId,
        title: lTitle,
        description: lDesc,
        lessonType,
        youtubeId: (lessonType === 'video' && videoSource === 'youtube') ? lYtId : '',
        videoUrl: (lessonType === 'video' && videoSource === 'direct') ? uploadedVideoUrl : '',
        textContent: lessonType === 'text' ? textContent : '',
        downloadUrl: lessonType === 'resource' ? downloadUrl : '',
        resourceTitle: lessonType === 'resource' ? resourceTitle : '',
        isPreview: lPreview,
        duration: lDuration
      };

      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        setStatusMsg("✓ Lesson appended successfully.");
        setLTitle('');
        setLDesc('');
        setLYtId('');
        setUploadedVideoUrl('');
        setTextContent('');
        setDownloadUrl('');
        setResourceTitle('');
        fetchModuleLessons(selectedModuleId);
      } else {
        const errorData = await res.json();
        setStatusMsg(`Error creating lesson: ${errorData.message || 'Verification issue'}`);
      }
    } catch (e) {
      setStatusMsg("Failed saving lesson. Please verify inputs.");
    }
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

            <button
              id="inst_menu_quiz_builder"
              onClick={() => setActivePane('quiz_builder')}
              className={`px-4 py-2 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activePane === 'quiz_builder' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-205'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Quiz & Exam Builder</span>
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
                 {/* HIGH FIDELITY SVG CHARTS AND DETAILED PERFORMANCE MODULES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column (Charts and Course lists) */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Visual SVG column bar chart representation */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-widest">
                    📊 Academic Metrics
                  </span>
                  <h3 className="font-extrabold text-slate-950 text-xs uppercase tracking-wider">Course Enrollment Analysis & Watch Trends</h3>
                  <p className="text-[10px] text-slate-450">Estimated module watch metrics versus cumulative students enrolled across primary IT disciplines.</p>
                  
                  <div className="h-48 flex items-end gap-6 pt-4 px-2 select-none border-b border-l border-slate-200 font-mono text-[9px]">
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <span className="font-bold text-teal-800 text-[10px]">240 hrs</span>
                      <div className="bg-emerald-600 hover:bg-emerald-500 rounded-t w-full h-32 transition-all duration-300" title="AI Full Stack: 240 Students"></div>
                      <span className="text-[8px] text-slate-500 font-bold uppercase truncate max-w-[80px]">React Web</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <span className="font-bold text-teal-800 text-[10px]">160 hrs</span>
                      <div className="bg-emerald-600 hover:bg-emerald-500 rounded-t w-full h-24 transition-all duration-300" title="English conversational: 160 Students"></div>
                      <span className="text-[8px] text-slate-500 font-bold uppercase truncate max-w-[80px]">English</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <span className="font-bold text-teal-800 text-[10px]">80 hrs</span>
                      <div className="bg-emerald-600 hover:bg-emerald-500 rounded-t w-full h-12 transition-all duration-300" title="Discrete Mathematics: 80 Students"></div>
                      <span className="text-[8px] text-slate-500 font-bold uppercase truncate max-w-[80px]">Mathematics</span>
                    </div>
                  </div>
                </div>

                {/* Course syllabus visual details list */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-slate-950 text-xs uppercase tracking-widest">Dynamic Seeding syllabus metadata</h3>
                    <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">{courses.length} Active syllabi</span>
                  </div>
                  <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                    {courses.map((c) => (
                      <div key={c.id} className="p-3 bg-slate-50 hover:bg-slate-100/50 rounded border border-slate-200 text-xs flex justify-between items-center transition">
                        <div>
                          <p className="font-extrabold text-slate-900 leading-normal">{c.title}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">{c.duration} Extensive study duration • {c.category}</p>
                        </div>
                        <span className="text-[10px] font-bold text-red-650 hover:underline cursor-pointer" onClick={() => handleDeleteCourse(c.id)}>Purge</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Earnings Tracker & Revenue share calculator tool */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold">
                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-widest">
                    💰 REVENUE DESK
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest">Revenue-Share Calculator & Earnings Simulator</h4>
                  <p className="text-[10px] text-slate-450 leading-normal">
                    Calculate your net instructor share payout derived from active student subscription revenues (Active total revenue: <span className="font-bold text-emerald-700">ETB {stats.totalRevenue.toLocaleString()}</span>).
                  </p>

                  <div className="p-3.5 bg-slate-50 rounded-lg space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-600 font-bold block">Select Core Contract Royalty Tier:</label>
                      <select
                        value={calcTier}
                        onChange={(e) => {
                          setCalcTier(e.target.value);
                          setCustomCalculatedPayout(null);
                        }}
                        className="p-2 border rounded w-full bg-white text-xs cursor-pointer outline-none"
                      >
                        <option value="0.30">Tier A (30% Content Royalty Share)</option>
                        <option value="0.55">Tier B (55% Content Royalty Share - Default)</option>
                        <option value="0.75">Tier C (75% Premium Senior Scholar Partner)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const totalPayout = stats.totalRevenue * parseFloat(calcTier);
                        setCustomCalculatedPayout(totalPayout);
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs uppercase cursor-pointer"
                    >
                      Process Revenue Calculation
                    </button>

                    {customCalculatedPayout !== null && (
                      <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded text-center space-y-1">
                        <span className="text-[10px] text-emerald-800 uppercase tracking-wide font-black">Estimated Net Lecturer Payout</span>
                        <p className="text-xl font-black text-emerald-950 font-mono">
                          ETB {customCalculatedPayout.toLocaleString()} .00
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column (Live scheduled session lists + Q&A Threads board + Certificate issuing) */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Live Classes scheduling center */}
                <div className="bg-slate-950 text-slate-200 p-5 rounded-xl border border-slate-850 shadow-md space-y-4 text-xs">
                  <div>
                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-widest animate-pulse">
                      🔴 Live Class Scheduler
                    </span>
                    <h4 className="font-extrabold text-white text-sm mt-1.5 font-sans">Simulated Virtual Lecture Calendar</h4>
                    <p className="text-slate-400 text-[10px] leading-relaxed mt-0.5">
                      Schedule webinars, interactive programming labs, and coordinate Google Meet links instantly for student tracking.
                    </p>
                  </div>

                  <div className="space-y-3 p-3 bg-slate-900 border border-slate-850 rounded-lg">
                    <p className="font-bold text-slate-200">Schedule Active Stream session:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="e.g. React Suspense Mechanics"
                        value={liveTitle}
                        onChange={(e) => setLiveTitle(e.target.value)}
                        className="p-1 px-2 border border-slate-700 bg-slate-950 text-white rounded text-xs focus:outline-emerald-500"
                      />
                      <input
                        type="date"
                        value={liveDate}
                        onChange={(e) => setLiveDate(e.target.value)}
                        className="p-1 px-2 border border-slate-700 bg-slate-950 text-white rounded text-xs focus:outline-emerald-500 cursor-pointer"
                      />
                      <input
                        type="time"
                        value={liveTime}
                        onChange={(e) => setLiveTime(e.target.value)}
                        className="p-1 px-2 border border-slate-700 bg-slate-950 text-white rounded text-xs focus:outline-emerald-500 cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="Google Meet Link hst..."
                        value={liveLink}
                        onChange={(e) => setLiveLink(e.target.value)}
                        className="p-1 px-2 border border-slate-700 bg-slate-950 text-white rounded text-xs focus:outline-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!liveTitle || !liveDate || !liveTime) {
                          alert("All scheduler details must be mapped.");
                          return;
                        }
                        const updated = [
                          ...liveSessions,
                          { id: Date.now(), title: liveTitle, date: liveDate, time: liveTime, hostLink: liveLink }
                        ];
                        setLiveSessions(updated);
                        localStorage.setItem('ezana_live_sessions', JSON.stringify(updated));
                        setLiveTitle('');
                        setLiveDate('');
                        setLiveTime('');
                        setStatusMsg("✓ Dynamic Scheduled session published into learning calendars!");
                        setTimeout(() => setStatusMsg(null), 3500);
                      }}
                      className="w-full py-1.5 bg-red-650 hover:bg-red-650 text-white rounded font-bold text-xs uppercase cursor-pointer"
                    >
                      Publish Stream Event
                    </button>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {liveSessions.map((s: any) => (
                      <div key={s.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded flex justify-between items-center hover:border-slate-700 transition">
                        <div className="space-y-0.5">
                          <p className="font-bold text-emerald-400 capitalize">{s.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{s.date} at {s.time} EAT</p>
                        </div>
                        <a
                          href={s.hostLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-[10px] uppercase font-bold rounded"
                        >
                          Launch Room ↗
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Student Q&A Discussion Board */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold">
                  <span className="bg-slate-950 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-widest">
                    💬 STUDY HALL Q&A
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm">Mentorship & Peer Discussion Desk</h4>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-normal">
                    Direct academic queries published by students watch lessons. Submit answers instantly to persistent study boards.
                  </p>

                  <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
                    {studentQas.map((q: any) => (
                      <div key={q.id} className="p-3 bg-slate-50 border rounded-lg space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">👤 {q.student} ({q.course})</span>
                          <span className="text-[9px] text-slate-400">{q.date}</span>
                        </div>
                        <p className="text-slate-600 bg-white/50 p-2 rounded border border-slate-100 italic">"{q.question}"</p>
                        
                        {q.answer ? (
                          <div className="bg-emerald-50 border border-emerald-100 p-2 rounded text-[11px] space-y-1">
                            <span className="font-bold text-emerald-800">✓ Your Official Answer:</span>
                            <p className="text-slate-700">{q.answer}</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 pt-1">
                            <textarea
                              rows={1}
                              placeholder="Type expert advice response guidelines..."
                              value={replyTextMap[q.id] || ''}
                              onChange={(e) => setReplyTextMap({ ...replyTextMap, [q.id]: e.target.value })}
                              className="w-full p-1.5 border rounded bg-white text-xs outline-emerald-500 font-semibold"
                            />
                            <div className="text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  const text = replyTextMap[q.id];
                                  if (!text?.trim()) return;
                                  const updated = studentQas.map((item: any) => {
                                    if (item.id === q.id) {
                                      return { ...item, answer: text.trim() };
                                    }
                                    return item;
                                  });
                                  setStudentQas(updated);
                                  localStorage.setItem('ezana_qa_threads', JSON.stringify(updated));
                                  setReplyTextMap({ ...replyTextMap, [q.id]: '' });
                                  setStatusMsg("✓ Academic mentorship advice broadcasted successfully!");
                                  setTimeout(() => setStatusMsg(null), 3500);
                                }}
                                className="px-3.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-[10px]"
                              >
                                Publish Advice Answer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fast Certificate Seeding Engine */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-widest">
                    🎓 CERTIFICATE OFFICE
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm">Official Academic Credentials Issuer</h4>
                  <p className="text-[10px] text-slate-450 font-normal leading-normal">
                    Review or issue validated digital completion certificate templates for students completing practical learning modules.
                  </p>

                  <div className="p-3 bg-slate-50 border rounded-lg space-y-3">
                    <p className="font-bold text-slate-700">Issue New Academic Digital Certificate:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Student Fully Name..."
                        value={certStudentName}
                        onChange={(e) => setCertStudentName(e.target.value)}
                        className="p-1 px-2 border rounded bg-white text-xs"
                      />
                      <select
                        value={certCourse}
                        onChange={(e) => setCertCourse(e.target.value)}
                        className="p-1 px-2 border rounded bg-white text-xs cursor-pointer outline-none"
                      >
                        <option value="AI Full Stack">AI Full Stack</option>
                        <option value="React / Node Web Dev">React / Node Web Dev</option>
                        <option value="Discrete Mathematics">Discrete Mathematics</option>
                        <option value="English Practice">English Practice</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!certStudentName.trim()) {
                          alert("Give a valid student name to generate certificate credentials.");
                          return;
                        }
                        const updated = [
                          ...certifiedStudents,
                          { id: Date.now(), name: certStudentName.trim(), course: certCourse, issueDate: new Date().toISOString().slice(0, 10) }
                        ];
                        setCertifiedStudents(updated);
                        setCertStudentName('');
                        
                        // Push dynamic log to context notifications simulator
                        alert(`✓ Generated official digital certificate index for ${certStudentName.trim()}. Mapped securely!`);
                      }}
                      className="w-full py-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black rounded text-[10px] uppercase transition cursor-pointer"
                    >
                      Issue Certificate Template
                    </button>
                  </div>

                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {certifiedStudents.map((cs) => (
                      <div key={cs.id} className="p-2 bg-white border rounded flex justify-between items-center text-[11px] font-mono hover:bg-slate-55/40">
                        <div>
                          <p className="font-bold text-slate-900">{cs.name}</p>
                          <p className="text-[9px] text-slate-450">{cs.course} • Mapped {cs.issueDate}</p>
                        </div>
                        <button
                          onClick={() => alert(`✓ Certificate Print buffer setup. Downloading authenticated HTML5 canvas of credentials for ${cs.name}.`)}
                          className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase"
                        >
                          Print PDF ↓
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              
            </div>           </div>
          </div>
        )}

        {/* C. CURRICULUM WORKSPACE BUILDER */}
        {activePane === 'course_builder' && (
          <div className="space-y-6">
            
            <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-sm space-y-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 rounded text-[9px] font-black uppercase font-mono tracking-widest">
                ⚙️ Course Administration & Multi-Upload Engine
              </span>
              <h3 className="text-xl font-bold text-white">Advanced Curriculum Hierarchy Studio</h3>
              <p className="text-slate-400 text-xs text-slate-300">
                Create intensive programs, manage video formats, import entire YouTube playlists, track upload progress, and customize instructional modules.
              </p>
            </div>

            {statusMsg && (
              <p className="p-4 bg-emerald-900/30 border border-emerald-800/50 text-emerald-300 rounded text-xs leading-normal font-bold">
                {statusMsg}
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* 1. Dynamic Course Creation & Status Desk */}
              <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
                <div>
                  <h4 className="font-extrabold text-slate-950 text-sm">1. Program Properties Creator</h4>
                  <p className="text-[10px] text-slate-400">Apply pricing, level, and prerequisites metadata.</p>
                </div>
                
                <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs font-semibold text-slate-700">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Course title *</label>
                    <input type="text" required value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="e.g. Master React and Node Contexts" className="w-full p-2.5 border border-slate-300 rounded focus:border-slate-800 focus:outline-none" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Course narrative description *</label>
                    <textarea required rows={2} value={cDesc} onChange={(e) => setCDesc(e.target.value)} placeholder="Comprehensive program curriculum topics..." className="w-full p-2.5 border border-slate-300 rounded focus:border-slate-800 focus:outline-none"></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Category *</label>
                      <select value={cCategory} onChange={(e) => setCCategory(e.target.value)} className="w-full p-2 border rounded bg-white font-bold cursor-pointer">
                        <option value="AI Full Stack">AI Full Stack</option>
                        <option value="English">English</option>
                        <option value="Mathematics">Mathematics</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Skill level *</label>
                      <select value={cSkillLevel} onChange={(e) => setCSkillLevel(e.target.value)} className="w-full p-2 border rounded bg-white font-bold cursor-pointer">
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Duration (Est) *</label>
                      <input type="text" value={cDuration} onChange={(e) => setCDuration(e.target.value)} className="w-full p-2 border rounded" />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Price (ETB) *</label>
                      <input type="number" value={cPrice} onChange={(e) => setCPrice(e.target.value)} className="w-full p-2 border rounded font-mono font-bold" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Course Objectives / Highlights</label>
                    <input type="text" value={cObjectives} onChange={(e) => setCObjectives(e.target.value)} placeholder="Comma-separated goals" className="w-full p-2 border rounded" />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Student Prerequisites</label>
                    <input type="text" value={cPrerequisites} onChange={(e) => setCPrerequisites(e.target.value)} placeholder="e.g. Basic HTML, ES6 Basics" className="w-full p-2 border rounded" />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Course tags</label>
                    <input type="text" value={cTags} onChange={(e) => setCTags(e.target.value)} placeholder="e.g. react, context, state-management" className="w-full p-2 border rounded text-slate-500 font-mono" />
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-100">
                    <span className="font-bold text-[10px] text-slate-650">Syllabus Premium status</span>
                    <button
                      type="button"
                      onClick={() => setCPremium(!cPremium)}
                      className={`px-3 py-1 text-[9px] rounded font-black uppercase transition cursor-pointer ${
                        cPremium ? 'bg-amber-100 text-amber-800' : 'bg-slate-250 text-slate-700'
                      }`}
                    >
                      {cPremium ? '⭐ Premium Paid' : '🎁 Free Tier'}
                    </button>
                  </div>
                  
                  <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white hover:text-slate-950 font-extrabold rounded cursor-pointer uppercase transition-all tracking-wider text-[11px] shadow-sm">
                    Publish Program Card
                  </button>
                </form>

                {/* Course catalog status dashboard inline */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <header className="flex justify-between items-center">
                    <span className="font-black text-[10px] text-slate-950 uppercase tracking-wider">My Active Programs Trays</span>
                    <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{courses.length} cataloged</span>
                  </header>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {courses.map((c) => (
                      <div key={c.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-extrabold text-slate-900 leading-tight truncate max-w-[140px]">{c.title}</p>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-mono tracking-tighter uppercase font-bold">{c.skillLevel || 'Beginner'}</span>
                          </div>
                          <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded font-black ${
                            c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            c.status === 'archived' ? 'bg-slate-300 text-slate-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {c.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1 border-t border-slate-150 pt-1.5 text-[9px]">
                          {/* Toggle publish / unpublish */}
                          <button
                            onClick={async () => {
                              const nextPub = !c.published;
                              await fetch(`/api/courses/${c.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ published: nextPub })
                              });
                              fetchInstructorData();
                            }}
                            className="text-slate-600 hover:text-slate-900 cursor-pointer font-bold"
                          >
                            {c.published ? 'Unpublish' : 'Publish'}
                          </button>

                          {/* Toggle archive */}
                          <button
                            onClick={async () => {
                              const nextStatus = c.status === 'archived' ? 'pending' : 'archived';
                              await fetch(`/api/courses/${c.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ status: nextStatus })
                              });
                              fetchInstructorData();
                            }}
                            className="text-slate-600 hover:text-slate-900 cursor-pointer font-bold"
                          >
                            {c.status === 'archived' ? 'Restore' : 'Archive'}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={async () => {
                              if (confirm(`Purge this course "${c.title}" along with all sections, modules, and lessons permanently?`)) {
                                const res = await fetch(`/api/courses/${c.id}`, {
                                  method: 'DELETE',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) fetchInstructorData();
                              }
                            }}
                            className="text-red-650 hover:text-red-700 font-extrabold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* 2. Section / Modules Workspace Builder */}
              <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-950 text-sm">2. Create and Append Modules</h4>
                  <p className="text-[10px] text-slate-400">Specify parent course elements:</p>
                </div>

                <select value={selectedCourseId || ''} onChange={(e) => setSelectedCourseId(parseInt(e.target.value))} className="w-full p-2.5 border border-slate-350 rounded bg-white text-xs font-bold">
                  <option value="" disabled>-- Select target program --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>

                <form onSubmit={handleCreateModule} className="space-y-3.5 text-xs font-semibold text-slate-700">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Module title *</label>
                    <input type="text" required value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="e.g. Module 3: State Serialization Hooks" className="w-full p-2.5 border border-slate-300 rounded" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Module objectives / synopsis</label>
                    <textarea rows={2} value={mDesc} onChange={(e) => setMDesc(e.target.value)} placeholder="Describe core learning tasks..." className="w-full p-2.5 border border-slate-300 rounded"></textarea>
                  </div>
                  
                  <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white hover:text-slate-950 font-bold rounded cursor-pointer uppercase text-[11px] transition-all">
                    Create Module Item
                  </button>
                </form>

                {/* Modules list catalog */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h5 className="font-extrabold text-[10px] text-slate-950 uppercase tracking-widest">Active Course Modules ({modules.length})</h5>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {modules.map((m) => (
                      <div key={m.id} className={`p-2 rounded text-[11px] border cursor-pointer hover:bg-slate-50 transition ${
                        selectedModuleId === m.id ? 'bg-slate-100 border-slate-400 font-bold' : 'bg-white border-slate-200'
                      }`} onClick={() => {
                        setSelectedModuleId(m.id);
                        fetchModuleLessons(m.id);
                      }}>
                        <p className="text-slate-900">{m.title}</p>
                        <p className="text-[9px] text-slate-400 font-mono">ID: #{m.id}</p>
                      </div>
                    ))}
                    {modules.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic">No modules created yet for selected course.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* 3. Advanced Lesson Studio & Direct upload engine */}
              <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">3. Lesson Workspace & Video Studio</h4>
                  <p className="text-[10px] text-slate-400 block">Specify destination module segment:</p>
                </div>

                <select value={selectedModuleId || ''} onChange={(e) => {
                  setSelectedModuleId(parseInt(e.target.value));
                  fetchModuleLessons(parseInt(e.target.value));
                }} className="w-full p-2.5 border border-slate-350 rounded bg-white text-xs font-bold">
                  <option value="" disabled>-- Select target module --</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>

                {/* Lesson types configuration switcher */}
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-lg text-[10px]">
                  <button
                    onClick={() => setLessonType('video')}
                    className={`py-1 rounded font-bold uppercase cursor-pointer ${lessonType === 'video' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    🎥 Video
                  </button>
                  <button
                    onClick={() => setLessonType('text')}
                    className={`py-1 rounded font-bold uppercase cursor-pointer ${lessonType === 'text' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    📝 Text
                  </button>
                  <button
                    onClick={() => setLessonType('resource')}
                    className={`py-1 rounded font-bold uppercase cursor-pointer ${lessonType === 'resource' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    📁 Slid/Slide
                  </button>
                </div>

                {lessonType === 'video' && (
                  <div className="space-y-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <header className="flex justify-between items-center">
                      <span className="font-bold text-[10px] text-slate-700 uppercase">Video Provider Source</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setVideoSource('youtube')}
                          className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${videoSource === 'youtube' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-200 text-slate-600'}`}
                        >
                          YouTube ID
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoSource('direct')}
                          className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${videoSource === 'direct' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-200 text-slate-600'}`}
                        >
                          Server Upload
                        </button>
                      </div>
                    </header>

                    {videoSource === 'youtube' ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Single YouTube video ID or Key *</label>
                          <input type="text" value={lYtId} onChange={(e) => setLYtId(e.target.value)} placeholder="e.g. Ke90Tje7VS0" className="w-full p-2 border font-mono rounded bg-white" />
                        </div>

                        {/* YouTube Playlist Import Widget */}
                        <div className="border-t border-slate-250 pt-2.5 space-y-2">
                          <span className="font-bold text-[9px] text-red-700 uppercase tracking-widest block font-mono">Import YouTube Playlist (Batch Sync)</span>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={playlistUrl}
                              onChange={(e) => setPlaylistUrl(e.target.value)}
                              placeholder="Playlist URL/ID or Demo Suffix"
                              className="flex-1 p-1.5 border rounded text-[10px]"
                            />
                            <button
                              type="button"
                              onClick={handleFetchYoutubePlaylist}
                              disabled={playlistLoading}
                              className="px-2.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[10px] cursor-pointer"
                            >
                              {playlistLoading ? 'Loading...' : 'Scan'}
                            </button>
                          </div>

                          {playlistVideos.length > 0 && (
                            <div className="p-2 border bg-white rounded-lg space-y-2 text-[10px]">
                              <header className="flex justify-between items-center text-[9px] font-sans">
                                <span className="font-extrabold text-slate-800 uppercase">Synchronized: {playlistVideos.length} playlist chapters</span>
                                <button type="button" onClick={handleBulkImportPlaylist} className="px-2 py-0.5 bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 rounded text-[9px]">
                                  Bulk Import →
                                </button>
                              </header>

                              <div className="space-y-1.5 max-h-40 overflow-y-auto border-t pt-1.5">
                                {playlistVideos.map((v: any) => (
                                  <label key={v.id} className="flex gap-2 items-start cursor-pointer hover:bg-slate-50 p-1 rounded font-mono">
                                    <input
                                      type="checkbox"
                                      checked={selectedPlaylistVideoIds.includes(v.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedPlaylistVideoIds([...selectedPlaylistVideoIds, v.id]);
                                        } else {
                                          setSelectedPlaylistVideoIds(selectedPlaylistVideoIds.filter(id => id !== v.id));
                                        }
                                      }}
                                    />
                                    <div className="truncate leading-normal">
                                      <p className="font-bold text-slate-800 truncate">{v.title}</p>
                                      <p className="text-[8px] text-slate-400 font-bold font-mono">{v.duration} • ID: {v.id}</p>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Drag and Drop multiple files zone */}
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`p-5 border-2 border-dashed rounded-lg text-center transition relative flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                            isDragging 
                              ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]' 
                              : 'border-slate-305 hover:border-slate-400 bg-white'
                          }`}
                        >
                          <label className="block w-full cursor-pointer h-full py-4">
                            <div className="flex justify-center mb-1">
                              <Upload className={`w-8 h-8 ${isDragging ? 'text-emerald-600 animate-bounce' : 'text-slate-400'}`} />
                            </div>
                            <span className="text-[11px] text-slate-700 font-extrabold block uppercase tracking-wide">
                              Drag & Drop Video Files Here
                            </span>
                            <span className="text-[9px] text-slate-450 block mt-0.5">
                              Supports multiple files at once • MP4, MOV, AVI, WebM (Max 100MB per file)
                            </span>
                            <span className="inline-block mt-3 px-3 py-1 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-bold rounded uppercase tracking-wider transition-all">
                              Browse Files
                            </span>
                            <input
                              type="file"
                              accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  addFilesToBatchQueue(e.target.files);
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* Batch Queue Section */}
                        {batchQueue.length > 0 && (
                          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/85 space-y-3">
                            <header className="flex justify-between items-center pb-2 border-b border-slate-200">
                              <div>
                                <span className="font-extrabold text-[10px] text-slate-850 uppercase tracking-widest block">
                                  Batch Upload Queue
                                </span>
                                <span className="text-[8px] text-slate-400 font-mono">
                                  {batchQueue.filter(q => q.status === 'completed').length} / {batchQueue.length} files uploaded
                                </span>
                              </div>
                              {batchQueue.some(q => q.status === 'completed' && q.isSavedAsLesson) && (
                                <button
                                  type="button"
                                  onClick={handleClearCompletedBatch}
                                  className="text-[9px] font-bold text-slate-550 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-sans"
                                >
                                  <X className="w-3 h-3" /> Clear Saved
                                </button>
                              )}
                            </header>

                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {batchQueue.map((item) => {
                                const sizeInMb = (item.size / (1024 * 1024)).toFixed(1);
                                return (
                                  <div key={item.id} className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-2xs space-y-2.5 text-[11px]">
                                    <div className="flex items-start justify-between gap-1.5">
                                      <div className="flex items-start gap-1.5 truncate">
                                        <Film className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                        <div className="truncate">
                                          <p className="font-bold text-slate-800 truncate" title={item.name}>
                                            {item.name}
                                          </p>
                                          <p className="text-[8px] text-slate-400 font-bold font-mono">
                                            {sizeInMb} MB
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {item.status === 'queued' && (
                                          <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase font-mono">
                                            Queued
                                          </span>
                                        )}
                                        {item.status === 'uploading' && (
                                          <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase font-mono flex items-center gap-1">
                                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> {item.progress}%
                                          </span>
                                        )}
                                        {item.status === 'completed' && (
                                          <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black uppercase font-mono">
                                            Uploaded
                                          </span>
                                        )}
                                        {item.status === 'failed' && (
                                          <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black uppercase font-mono" title={item.error}>
                                            Failed
                                          </span>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => handleRemoveFromQueue(item.id)}
                                          className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Progress track */}
                                    {item.status === 'uploading' && (
                                      <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                        <div className="bg-blue-600 h-1 transition-all duration-150" style={{ width: `${item.progress}%` }}></div>
                                      </div>
                                    )}

                                    {item.status === 'failed' && (
                                      <p className="text-[9px] text-red-600 font-semibold font-sans leading-tight">
                                        ⚠️ {item.error || 'Check server connection & file bounds.'}
                                      </p>
                                    )}

                                    {/* Create lesson metadata inline directly from queue */}
                                    {item.status === 'completed' && (
                                      <div className="p-2 bg-slate-55 border border-slate-150 rounded text-[10px] space-y-2">
                                        {item.isSavedAsLesson ? (
                                          <div className="flex items-center gap-1 text-emerald-700 font-extrabold">
                                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span>Lesson chapter successfully synthesized inside module catalog!</span>
                                          </div>
                                        ) : (
                                          <div className="space-y-1.5">
                                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                                              <span>Step 2: Define Lesson Title inline:</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setUploadedVideoUrl(item.uploadedUrl || '');
                                                  setLTitle(item.lessonTitle);
                                                  setStatusMsg(`Pre-filled main lesson creation form with "${item.lessonTitle}".`);
                                                }}
                                                className="text-blue-650 hover:text-blue-800 font-extrabold cursor-pointer font-sans"
                                              >
                                                Use Main Form instead ↑
                                              </button>
                                            </div>

                                            <div className="flex gap-1.5">
                                              <input
                                                type="text"
                                                value={item.lessonTitle}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setBatchQueue(prev => prev.map(qi => qi.id === item.id ? { ...qi, lessonTitle: val } : qi));
                                                }}
                                                placeholder="Give this video lesson a title..."
                                                className="flex-1 px-2 py-1 border border-slate-300 rounded bg-white font-medium focus:border-slate-500 focus:outline-none text-[11px]"
                                              />
                                              <button
                                                type="button"
                                                disabled={item.isSavingLesson || !selectedModuleId}
                                                onClick={() => handleInlineLessonCreationFromQueue(item.id)}
                                                className="px-2.5 bg-slate-900 border border-slate-900 text-white hover:bg-emerald-600 hover:text-slate-955 hover:border-emerald-600 rounded text-[9px] font-black uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                              >
                                                {item.isSavingLesson ? (
                                                  <>
                                                    <Loader2 className="w-3 animate-spin" /> Saving
                                                  </>
                                                ) : (
                                                  'Add Lesson'
                                                )}
                                              </button>
                                            </div>
                                            {!selectedModuleId && (
                                              <p className="text-[8px] text-amber-700 font-extrabold leading-none">
                                                ⚠️ Must select a Lecture Module above first to quick-add lesson
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {uploadedVideoUrl && (
                          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[9px] font-mono leading-relaxed truncate">
                            <span className="font-extrabold text-emerald-850">✓ Current Single Upload Path:</span>
                            <p className="text-slate-800 truncate select-all">{uploadedVideoUrl}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {lessonType === 'text' && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block text-xs">Rich Text / Markdown content *</label>
                    <textarea
                      rows={5}
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="# Advanced React context logic&#10;&#10;Use the standard useContext hook to retrieve global state maps gracefully."
                      className="w-full p-2.5 border border-slate-350 rounded focus:border-slate-800 text-xs font-mono"
                    ></textarea>
                  </div>
                )}

                {lessonType === 'resource' && (
                  <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <span className="font-bold text-[9px] text-slate-600 uppercase">Supplementary slides & supplementary resources</span>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Resource title *</label>
                      <input type="text" value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} placeholder="e.g. Slide 3: Advanced PDF guide" className="w-full p-2 border rounded bg-white text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Attachment download link (URL) *</label>
                      <input type="text" value={downloadUrl} onChange={(e) => setDownloadUrl(e.target.value)} placeholder="e.g. /uploads/Slide-React.pdf" className="w-full p-2 border rounded bg-white text-xs font-mono" />
                    </div>
                  </div>
                )}

                <form onSubmit={handleCreateLesson} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Lesson chapter title *</label>
                    <input type="text" required value={lTitle} onChange={(e) => setLTitle(e.target.value)} placeholder="e.g. 1. Introduction and Reverse Proxy Setup" className="w-full p-2.5 border border-slate-300 rounded text-xs focus:border-slate-800" />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Lesson objective / description</label>
                    <textarea rows={2} value={lDesc} onChange={(e) => setLDesc(e.target.value)} placeholder="Short descriptions on this lesson chapter..." className="w-full p-2 border rounded text-xs focus:border-slate-800" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 block">Lesson duration</label>
                      <input type="text" value={lDuration} onChange={(e) => setLDuration(e.target.value)} placeholder="e.g. 15 mins" className="w-full p-2 border rounded text-xs font-bold" />
                    </div>
                    
                    <div className="space-y-1 pt-4">
                      <label className="flex gap-2.5 items-center cursor-pointer font-bold text-slate-600">
                        <input type="checkbox" checked={lPreview} onChange={(e) => setLPreview(e.target.checked)} className="accent-emerald-600" />
                        <span>Preview Demo?</span>
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white hover:text-slate-910 font-bold rounded cursor-pointer uppercase text-[11px] transition">
                    Save Lesson row
                  </button>
                </form>

                {/* Lesson rows sorting & review list inside workspace */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <header className="flex justify-between items-center">
                    <span className="font-extrabold text-[10px] text-slate-950 uppercase tracking-widest">Active Lessons ({lessons.length})</span>
                    <span className="text-[10px] text-slate-400 font-bold italic">Arrow Click to Reorder</span>
                  </header>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {lessons.map((les, index) => (
                      <div key={les.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] flex items-center justify-between gap-1.5">
                        <div className="truncate flex-1 leading-normal">
                          <p className="font-extrabold text-slate-900 truncate">
                            {index + 1}. {les.title}
                          </p>
                          <span className={`text-[8px] px-1 rounded uppercase font-bold text-white font-mono ${
                            les.lessonType === 'text' ? 'bg-indigo-600' :
                            les.lessonType === 'resource' ? 'bg-amber-600' : 'bg-rose-600'
                          }`}>
                            {les.lessonType || 'video'}
                          </span>
                          {les.duration && <span className="text-[8px] text-slate-450 ml-2 font-mono">({les.duration})</span>}
                        </div>

                        {/* Move Up/Down reordering sequences */}
                        <div className="flex gap-1 items-center shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={async () => {
                              const updatedLessons = [...lessons];
                              // Swap position indices
                              const temp = updatedLessons[index];
                              updatedLessons[index] = updatedLessons[index - 1];
                              updatedLessons[index - 1] = temp;
                              
                              const orderedIds = updatedLessons.map(l => l.id);
                              const res = await fetch('/api/lessons/reorder', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ lessonIds: orderedIds })
                              });
                              if (res.ok) {
                                fetchModuleLessons(selectedModuleId!);
                              }
                            }}
                            className={`p-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 active:scale-95 transition ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                            title="Move Lesson Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={index === lessons.length - 1}
                            onClick={async () => {
                              const updatedLessons = [...lessons];
                              // Swap position indices
                              const temp = updatedLessons[index];
                              updatedLessons[index] = updatedLessons[index + 1];
                              updatedLessons[index + 1] = temp;
                              
                              const orderedIds = updatedLessons.map(l => l.id);
                              const res = await fetch('/api/lessons/reorder', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ lessonIds: orderedIds })
                              });
                              if (res.ok) {
                                fetchModuleLessons(selectedModuleId!);
                              }
                            }}
                            className={`p-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 active:scale-95 transition ${index === lessons.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                            title="Move Lesson Down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Purge lesson "${les.title}" permanently?`)) {
                                const res = await fetch(`/api/lessons/${les.id}`, {
                                  method: 'DELETE',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) {
                                  // Clean up physical file too if needed
                                  if (les.videoUrl) {
                                    await fetch('/api/lessons/delete-video', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                      body: JSON.stringify({ url: les.videoUrl })
                                    });
                                  }
                                  fetchModuleLessons(selectedModuleId!);
                                }
                              }
                            }}
                            className="p-1 bg-red-50 hover:bg-red-100 text-red-650 rounded border border-red-100 cursor-pointer"
                            title="Delete Lesson"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {lessons.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic">No lessons defined within selected module.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* INTERACTIVE QUIZ & ASSESSMENT BUILDER */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-widest">
                    ✏️ Exam Office
                  </span>
                  <h4 className="font-extrabold text-slate-950 text-base mt-1">Quiz Questions & Assessment Builder</h4>
                  <p className="text-[10px] text-slate-450">Construct diagnostic multiple choice questions mapped to any published program syllabi.</p>
                </div>
                
                <span className="text-xs bg-slate-100 px-3 py-1 rounded font-bold font-mono">
                  {quizQuestions.length} TOTAL BUILT QUESTIONS
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Addition Form */}
                <div className="lg:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 text-xs">
                  <p className="font-extrabold text-slate-900 uppercase tracking-wide text-[11px]">Add New Assessment Entry</p>
                  
                  <div className="space-y-3 font-semibold">
                    <div className="space-y-1">
                      <label className="text-slate-650 font-bold block">For Course syllabus</label>
                      <select
                        value={selectedCourseId || ''}
                        onChange={(e) => setSelectedCourseId(parseInt(e.target.value))}
                        className="w-full p-2 border border-slate-350 rounded bg-white text-xs"
                      >
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-605 font-bold block">Question Context *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="e.g., Which protocol is utilized for instant bi-directional events on port 3000?"
                        value={quizQuestionInput}
                        onChange={(e) => setQuizQuestionInput(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-bold">Choice A *</label>
                        <input type="text" placeholder="HTTP REST" value={quizChoiceA} onChange={(e) => setQuizChoiceA(e.target.value)} className="w-full p-1.5 border rounded bg-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 font-bold">Choice B *</label>
                        <input type="text" placeholder="WebSockets" value={quizChoiceB} onChange={(e) => setQuizChoiceB(e.target.value)} className="w-full p-1.5 border rounded bg-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 font-bold">Choice C *</label>
                        <input type="text" placeholder="SMTP Mail" value={quizChoiceC} onChange={(e) => setQuizChoiceC(e.target.value)} className="w-full p-1.5 border rounded bg-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 font-bold">Choice D *</label>
                        <input type="text" placeholder="gRPC Buffers" value={quizChoiceD} onChange={(e) => setQuizChoiceD(e.target.value)} className="w-full p-1.5 border rounded bg-white" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-605 font-bold block text-emerald-800">Correct Answer String (must match choice exactly) *</label>
                      <input
                        type="text"
                        required
                        placeholder="WebSockets"
                        value={quizCorrectAnswer}
                        onChange={(e) => setQuizCorrectAnswer(e.target.value)}
                        className="w-full p-2 border border-emerald-300 bg-emerald-50 rounded"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!quizQuestionInput || !quizChoiceA || !quizChoiceB || !quizChoiceC || !quizChoiceD || !quizCorrectAnswer) {
                          alert("All question context and choice options must be mapped.");
                          return;
                        }
                        const choices = [quizChoiceA, quizChoiceB, quizChoiceC, quizChoiceD];
                        if (!choices.includes(quizCorrectAnswer)) {
                          alert("Correct answer must match one of the Choice strings exactly.");
                          return;
                        }

                        const updated = [
                          ...quizQuestions,
                          {
                            id: Date.now(),
                            courseId: selectedCourseId || 1,
                            question: quizQuestionInput,
                            choices,
                            correctAnswer: quizCorrectAnswer
                          }
                        ];
                        setQuizQuestions(updated);
                        localStorage.setItem('ezana_custom_quizzes', JSON.stringify(updated));
                        
                        // Clear
                        setQuizQuestionInput('');
                        setQuizChoiceA('');
                        setQuizChoiceB('');
                        setQuizChoiceC('');
                        setQuizChoiceD('');
                        setQuizCorrectAnswer('');

                        setStatusMsg("✓ Dynamic evaluation quiz question stored securely in program cache!");
                        setTimeout(() => setStatusMsg(null), 3000);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 hover:text-white font-extrabold rounded text-xs uppercase cursor-pointer transition shadow-xs"
                    >
                      Save Quiz Question
                    </button>
                  </div>
                </div>

                {/* Questions Database List */}
                <div className="lg:col-span-7 space-y-3.5">
                  <p className="font-extrabold text-slate-950 uppercase tracking-widest text-[11px]">Active Question Seeding Database</p>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {quizQuestions.map((q: any) => (
                      <div key={q.id} className="p-3 bg-white border border-slate-200 shadow-xs rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center bg-slate-50 p-1 rounded px-2 font-bold text-[10px]">
                          <span className="text-slate-600 font-mono">ID: #{q.id.toString().slice(-4)}</span>
                          <button
                            onClick={() => {
                              const updated = quizQuestions.filter((item: any) => item.id !== q.id);
                              setQuizQuestions(updated);
                              localStorage.setItem('ezana_custom_quizzes', JSON.stringify(updated));
                            }}
                            className="text-red-655 hover:underline cursor-pointer"
                          >
                            Purge Row
                          </button>
                        </div>
                        <p className="font-extrabold text-slate-900 leading-normal">Q: {q.question}</p>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-500 pl-2">
                          {q.choices.map((c: string, idx: number) => (
                            <span key={idx} className={c === q.correctAnswer ? 'font-bold text-emerald-700 bg-emerald-50/50 px-1 rounded' : 'truncate'}>
                              {idx + 1}. {c} {c === q.correctAnswer ? '(Correct)' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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

        {/* QUIZ & EXAM BUILDER SECTION */}
        {activePane === 'quiz_builder' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <QuizExamBuilder />
          </div>
        )}

      </div>
    </div>
  );
}
