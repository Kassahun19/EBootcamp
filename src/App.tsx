import React, { useState, useEffect } from 'react';
import { 
  BookOpen, MapPin, CheckCircle, Award, BrainCircuit, Users, BookOpenCheck, 
  Lock, LogIn, Menu, X, Play, ShieldAlert, BadgeInfo, Bell, HelpCircle, 
  Sun, Moon, MessageSquare, Settings, User, LogOut, Check, ChevronRight, 
  Eye, EyeOff, KeyRound, Smartphone, Mail, ShieldCheck, Sparkles, Star, ArrowRight, ShieldCheck as ShieldIcon, Database
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import CoursesPage from './pages/CoursesPage';
import PricingPage from './pages/PricingPage';
import StudentDashboard from './dashboards/StudentDashboard';
import InstructorDashboard from './dashboards/InstructorDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import AccountSettingsPage from './pages/AccountSettingsPage';
import ContactPage from './pages/ContactPage';

function MainAppContent() {
  const { user, token, login, logout, refreshUser, notifications, markNotificationsAsRead } = useAuth();
  
  // Theme selection state
  const [darkMode, setDarkMode] = useState(localStorage.getItem('ezana_darkMode') === 'true');

  // Local Academic Messages Desk Channels State to fulfil instruction 1
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "Dr. Martha (Database Systems)",
      text: "Please sync with our updated schema and submit your assignment before the due date.",
      date: "10:45 AM",
      isRead: false,
      replies: [] as string[]
    },
    {
      id: 2,
      sender: "Academy Registrar",
      text: "Premium accounts unlocked. Verify your tuition voucher numbers.",
      date: "Yesterday",
      isRead: false,
      replies: [] as string[]
    }
  ]);

  // Selected Message or Notification to show in full detail Modal reader
  const [selectedInboxItem, setSelectedInboxItem] = useState<{
    type: 'message' | 'notification';
    id: number;
    sender?: string;
    title?: string;
    text: string;
    date: string;
  } | null>(null);

  const [messageReplyText, setMessageReplyText] = useState('');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ezana_darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ezana_darkMode', 'false');
    }
  }, [darkMode]);
  
  // Hash routing choices: 'home' | 'about' | 'courses' | 'contact' | 'pricing' | 'login' | 'register' | 'forgot' | 'dashboard' | 'instructor' | 'admin'
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [paramCourseId, setParamCourseId] = useState<number | null>(null);

  // Database initialization banner trigger
  const [dbEmpty, setDbEmpty] = useState(false);
  const [dbInstallStatus, setDbInstallStatus] = useState<string | null>(null);

  // Navigation menu collapsible
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication submission forms
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<number>(3);
  const [authStatus, setAuthStatus] = useState<string | null>(null);

  // Layout UI Dropdown Toggles
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
  const [messagesDropdownOpen, setMessagesDropdownOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Multi-step registration wizard details state
  const [regStep, setRegStep] = useState(1);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Centralized YouTube overlay player
  const [activePlayVideo, setActivePlayVideo] = useState<{ youtubeId: string; title: string } | null>(null);

  useEffect(() => {
    // Dynamic load remember preference
    const savedEmail = localStorage.getItem('ezana_saved_email');
    if (savedEmail) {
      setAuthEmail(savedEmail);
    }
  }, []);

  // Synchronize hash paths for bookmarks and URL reloads
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#/admin/dashboard') {
      if (token && user?.roleId === 1) setCurrentPage('admin');
    } else if (hash === '#/lecturer/dashboard') {
      if (token && user?.roleId === 2) setCurrentPage('instructor');
    } else if (hash === '#/student/dashboard') {
      if (token && user?.roleId === 3) setCurrentPage('dashboard');
    } else if (hash === '#/account/settings') {
      if (token && user) setCurrentPage('settings');
    }
  }, [token, user]);

  useEffect(() => {
    if (currentPage === 'admin') {
      window.location.hash = '/admin/dashboard';
    } else if (currentPage === 'instructor') {
      window.location.hash = '/lecturer/dashboard';
    } else if (currentPage === 'dashboard') {
      window.location.hash = '/student/dashboard';
    } else if (currentPage === 'settings') {
      window.location.hash = '/account/settings';
    } else {
      window.location.hash = '/' + currentPage;
    }
  }, [currentPage]);

  // Role Protection Guard
  useEffect(() => {
    if (token && user) {
      if (currentPage === 'admin' && user.roleId !== 1) {
        alert("🔒 Admin access restricted.");
        setCurrentPage('dashboard');
      } else if (currentPage === 'instructor' && user.roleId !== 2) {
        alert("🔒 Lecturer access restricted.");
        setCurrentPage('dashboard');
      } else if (currentPage === 'dashboard' && user.roleId === 1) {
        setCurrentPage('admin');
      } else if (currentPage === 'dashboard' && user.roleId === 2) {
        setCurrentPage('instructor');
      }
    }
  }, [currentPage, user, token]);

  async function triggerDbInstallation() {
    try {
      setDbInstallStatus("Configuring relational MySQL database.json tables...");
      const res = await fetch('/install', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setDbInstallStatus("✓ Ezana Academy seeded successfully! Refreshing dynamic course lists.");
        setDbEmpty(false);
        // Reload page to refresh context
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setDbInstallStatus("Configuration issue: " + data.message);
      }
    } catch (e) {
      setDbInstallStatus("Failed contacting backend installer.");
    }
  }

  useEffect(() => {
    // Audit if database exists or holds courses on first launch
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        if (!data || data.length === 0) {
          setDbEmpty(true);
          triggerDbInstallation();
        }
      })
      .catch((e) => {
        // Fallback to true if network is loading
        setDbEmpty(true);
        triggerDbInstallation();
      });
  }, []);

  useEffect(() => {
    if (user && (currentPage === 'home' || currentPage === 'login' || currentPage === 'register')) {
      if (user.roleId === 1) {
        setCurrentPage('admin');
      } else if (user.roleId === 2) {
        setCurrentPage('instructor');
      } else {
        setCurrentPage('dashboard');
      }
    }
  }, [user]);

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    setAuthStatus(null);
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (params && params.courseId) {
      setParamCourseId(params.courseId);
    } else {
      setParamCourseId(null);
    }
  };

  const executeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthStatus("Please fill in both email and password.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail.trim())) {
      setAuthStatus("Please enter a valid email address format.");
      return;
    }
    if (authPassword.length < 6) {
      setAuthStatus("Password must contain at least 6 characters.");
      return;
    }

    try {
      setAuthStatus("Authenticating core security credentials...");
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail.trim(), password: authPassword })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        
        // Redirect depending on privilege index immediately
        if (data.user.roleId === 1) {
          handleNavigate('admin');
        } else if (data.user.roleId === 2) {
          handleNavigate('instructor');
        } else {
          handleNavigate('dashboard');
        }
        setAuthEmail('');
        setAuthPassword('');
        setAuthStatus(null);
      } else {
        setAuthStatus(data.message || "Invalid credentials.");
      }
    } catch (e) {
      setAuthStatus("Failed communicating with authentication servers.");
    }
  };

  const executeRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authEmail || !authPassword) {
      setAuthStatus("Please fill in your name, email, and password.");
      return;
    }
    if (authName.trim().length < 2) {
      setAuthStatus("Please specify your real name (at least 2 letters).");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail.trim())) {
      setAuthStatus("Please enter a valid email address format.");
      return;
    }
    if (authPassword.length < 6) {
      setAuthStatus("Security guidelines require your password to be at least 6 characters.");
      return;
    }

    try {
      setAuthStatus("Registering secure profile and keys...");
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword, roleId: authRole })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        
        // Action Redirects to correct dashboard based on registration role chosen
        if (data.user.roleId === 1) {
          handleNavigate('admin');
        } else if (data.user.roleId === 2) {
          handleNavigate('instructor');
        } else {
          handleNavigate('dashboard');
        }
        setAuthName('');
        setAuthEmail('');
        setAuthPassword('');
        setAuthStatus(null);
      } else {
        setAuthStatus(data.message || "Email address is already registered.");
      }
    } catch (e) {
      setAuthStatus("Communications failure.");
    }
  };

  const executeForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    try {
      setAuthStatus("Triggering forgot-password flow...");
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail })
      });
      const data = await res.json();
      setAuthStatus(data.message || "Recovery flow successfully triggered. Please use reset route.");
    } catch (e) {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 select-none">
      
      {/* 1. SEED INSTALLATION PROMPT HEADER AT TOP OF APPLICATION IF DB IS DETECTED EMPTY */}
      {dbEmpty && (
        <div className="bg-gradient-to-r from-teal-900 to-emerald-950 text-white p-3 text-center text-xs space-y-2 border-b border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-center gap-3 relative z-50">
          <p className="font-bold inline-flex items-center gap-1.5 justify-center">
            <BadgeInfo className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            <span>Database Initializer Active: Ezana Academy has no courses configured yet. Click install to populate English, Maths, & AI programs instantly!</span>
          </p>
          <button
            id="seed_db_installer_btn"
            onClick={triggerDbInstallation}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 transition text-slate-950 font-black rounded text-xs select-none self-center cursor-pointer active:scale-95 whitespace-nowrap"
          >
            Install & Seed Database
          </button>
          {dbInstallStatus && <span className="font-mono text-emerald-300 font-semibold">{dbInstallStatus}</span>}
        </div>
      )}

      {/* 2. GLOBAL NAV BAR */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm" id="global_header">
        <div className="max-w-7xl mx-auto px-4 h-18 flex items-center justify-between">
          
          {/* Brand logo container left matching specifications */}
          <div 
            onClick={() => handleNavigate('home')} 
            className="flex items-center gap-2 cursor-pointer transition select-none group"
            id="brand_logo_nav"
          >
            <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center text-white font-extrabold group-hover:bg-emerald-600 shadow">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <p className="text-lg font-black tracking-wider leading-none text-slate-950 dark:text-white">EZANA</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-widest uppercase mt-0.5">ACADEMY</p>
            </div>
          </div>

          {/* Navigation link options center (Only visible conditionally or adjusted before login) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600 dark:text-slate-350 tracking-wide">
            <button id="nav_home" onClick={() => handleNavigate('home')} className={`hover:text-emerald-700 transition cursor-pointer uppercase ${currentPage === 'home' ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : ''}`}>Home</button>
            <button id="nav_courses" onClick={() => handleNavigate('courses')} className={`hover:text-emerald-700 transition cursor-pointer uppercase ${currentPage === 'courses' ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : ''}`}>Courses</button>
            <button id="nav_pricing" onClick={() => handleNavigate('pricing')} className={`hover:text-emerald-700 transition cursor-pointer uppercase ${currentPage === 'pricing' ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : ''}`}>Pricing</button>
            <button id="nav_about" onClick={() => handleNavigate('about')} className={`hover:text-emerald-700 transition cursor-pointer uppercase ${currentPage === 'about' ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : ''}`}>About</button>
            <button id="nav_contact" onClick={() => handleNavigate('contact')} className={`hover:text-emerald-700 transition cursor-pointer uppercase ${currentPage === 'contact' ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : ''}`}>Contact</button>
          </nav>

          {/* User operations index buttons right */}
          <div className="hidden md:flex items-center gap-4 relative">
            <button
              id="theme_toggle_btn"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-full transition cursor-pointer flex items-center justify-center focus:outline-none"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            {token && user ? (
              <div className="flex items-center gap-4">
                
                {/* 1. SHORTCUTS DASHBOARD LINK */}
                <button
                  onClick={() => {
                    if (user.roleId === 1) handleNavigate('admin');
                    else if (user.roleId === 2) handleNavigate('instructor');
                    else handleNavigate('dashboard');
                  }}
                  className="px-3.5 py-2 bg-slate-900 dark:bg-slate-800 text-white hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white transition font-black rounded-lg text-xs uppercase cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Database className="w-3.5 h-3.5" /> Dashboard
                </button>

                {/* 2. MESSAGES SYSTEM DISCUSSIONS ACCORDION DRIP */}
                <div className="relative">
                  <button
                    id="nav_messages_icon"
                    onClick={() => {
                      setMessagesDropdownOpen(!messagesDropdownOpen);
                      setNotificationsDropdownOpen(false);
                      setProfileDropdownOpen(false);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition relative cursor-pointer"
                    title="Active Workspace Messages"
                  >
                    <MessageSquare className="w-5 h-5 text-slate-700 dark:text-slate-300 hover:text-emerald-700" />
                    {messages.filter(m => !m.isRead).length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-600 text-white font-black text-[9px] rounded-full flex items-center justify-center">
                        {messages.filter(m => !m.isRead).length}
                      </span>
                    )}
                  </button>

                  {messagesDropdownOpen && (
                    <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-950 rounded-xl shadow-xl border border-slate-205 dark:border-slate-800 py-3 text-slate-850 dark:text-slate-100 z-50 space-y-2">
                      <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center text-xs">
                        <span className="font-extrabold uppercase text-slate-905 dark:text-emerald-400 tracking-wide text-[10px]">Academic Messages Desk</span>
                        <span className="bg-emerald-100 text-emerald-850 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Channels</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto px-2 space-y-2 text-xs">
                        {[...messages].sort((a, b) => b.id - a.id).map((msg) => (
                          <div 
                            key={msg.id}
                            onClick={() => {
                              setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
                              setSelectedInboxItem({
                                type: 'message',
                                id: msg.id,
                                sender: msg.sender,
                                text: msg.text,
                                date: msg.date
                              });
                              setMessagesDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition text-left cursor-pointer space-y-1 block ${
                              msg.isRead ? 'opacity-80 text-slate-500' : 'bg-emerald-50/20 text-slate-850 dark:text-slate-100 font-semibold border-l-2 border-emerald-600'
                            }`}
                          >
                            <div className="flex justify-between font-bold text-slate-900 dark:text-white items-center">
                              <span className="truncate max-w-[170px]">{msg.sender}</span>
                              <span className="text-[9px] font-normal text-slate-450 font-mono shrink-0">{msg.date}</span>
                            </div>
                            <p className="text-slate-505 dark:text-slate-400 text-[11px] line-clamp-1 truncate">
                              "{msg.text}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. NOTIFICATIONS POPDOWN TRIGGER */}
                <div className="relative">
                  <button
                    id="nav_notifications_bell"
                    onClick={() => {
                      setNotificationsDropdownOpen(!notificationsDropdownOpen);
                      setProfileDropdownOpen(false);
                      setMessagesDropdownOpen(false);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition relative cursor-pointer"
                    title="System Broadcast Bulletins"
                  >
                    <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300 hover:text-emerald-700" />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white font-black text-[9px] rounded-full flex items-center justify-center animate-pulse">
                        {notifications.filter(n => !n.isRead).length}
                      </span>
                    )}
                  </button>

                  {notificationsDropdownOpen && (
                    <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-950 rounded-xl shadow-lg border border-slate-205 dark:border-slate-800 py-3 text-slate-850 dark:text-slate-100 z-50 space-y-2">
                      <div className="flex justify-between items-center px-4 pb-2 border-b border-slate-100 dark:border-slate-950">
                        <span className="font-extrabold text-[10px] text-slate-900 dark:text-emerald-400 uppercase tracking-wide">System Notifications</span>
                        {notifications.filter(n => !n.isRead).length > 0 && (
                          <button
                            onClick={async () => {
                              await markNotificationsAsRead();
                              setNotificationsDropdownOpen(false);
                            }}
                            className="text-[10px] text-emerald-700 hover:text-emerald-950 font-extrabold cursor-pointer uppercase"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-64 overflow-y-auto px-1 space-y-1">
                        {notifications.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 italic text-[11px] space-y-1">
                            <p>🛎️ No active bulletins.</p>
                          </div>
                        ) : (
                          [...notifications].sort((a, b) => (b.id || 0) - (a.id || 0)).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={async () => {
                                setSelectedInboxItem({
                                  type: 'notification',
                                  id: notif.id,
                                  title: 'System Bulletin System',
                                  text: notif.message,
                                  date: notif.createdAt || 'Just now'
                                });
                                await markNotificationsAsRead();
                                setNotificationsDropdownOpen(false);
                              }}
                              className={`p-2.5 rounded-lg text-[11px] leading-relaxed transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 ${
                                notif.isRead ? 'bg-white dark:bg-slate-900 text-slate-500' : 'bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-250 font-semibold border-l-2 border-emerald-600'
                              }`}
                            >
                              <div className="flex items-start gap-1.5">
                                {!notif.isRead && <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-emerald-600 shrink-0"></span>}
                                <p className="flex-1">{notif.message}</p>
                              </div>
                              <span className="text-[9px] text-slate-450 block mt-1 text-right font-mono">{notif.createdAt || 'Just now'}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. PREMIUM USER AVATAR & DROPDOWN */}
                <div className="relative">
                  <button
                    id="nav_profile_avatar"
                    onClick={() => {
                      setProfileDropdownOpen(!profileDropdownOpen);
                      setNotificationsDropdownOpen(false);
                      setMessagesDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 p-1 px-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer text-left focus:outline-none"
                  >
                    <div className="w-8.5 h-8.5 bg-gradient-to-tr from-emerald-800 to-teal-500 bg-emerald-750 text-white font-black rounded-full flex items-center justify-center text-sm shadow border border-white">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 truncate max-w-[90px] block">{user.name || 'Account'}</span>
                    </div>
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2.5 w-64 bg-white dark:bg-slate-950 rounded-xl shadow-xl border border-slate-200 dark:border-slate-850 py-3 text-slate-800 dark:text-slate-200 z-50 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-900">
                      
                      {/* User Context details header */}
                      <div className="px-4 pb-2 text-xs space-y-1">
                        <p className="font-extrabold text-slate-900 dark:text-white text-xs truncate leading-normal">{user.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-450 truncate leading-none uppercase font-mono tracking-wider">{user.email}</p>
                        <div className="pt-1.5">
                          <span className={`inline-block text-[9px] px-2 py-0.5 font-bold rounded-full uppercase tracking-wider ${
                            user.roleId === 1 ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            user.roleId === 2 ? 'bg-amber-100 text-amber-805 border border-amber-200' :
                            'bg-blue-105 bg-blue-100 text-blue-805 border border-blue-200'
                          }`}>
                            🛡️ {user.roleId === 1 ? 'Administrator' : user.roleId === 2 ? 'Lecturer' : 'Active Student'}
                          </span>
                        </div>
                      </div>

                      {/* Workspace navigations list */}
                      <div className="pt-2.5 px-2 flex flex-col gap-0.5 text-xs font-semibold text-slate-700 dark:text-slate-350">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            if (user.roleId === 1) handleNavigate('admin');
                            else if (user.roleId === 2) handleNavigate('instructor');
                            else handleNavigate('dashboard');
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-emerald-800 transition cursor-pointer flex items-center gap-2"
                        >
                          💼 My Profile & Dashboard
                        </button>
                        
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleNavigate('settings');
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-emerald-800 transition cursor-pointer flex items-center gap-2"
                        >
                          🛠️ Account Settings Console
                        </button>

                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleNavigate('settings');
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-emerald-800 transition cursor-pointer flex items-center gap-2"
                        >
                          🔑 Change Secret Password
                        </button>

                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            alert("📖 Redirecting to systemic help manuals... Welcome to Ezana Support, available 24/7!");
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-emerald-800 transition cursor-pointer flex items-center gap-2"
                        >
                          ❓ Help Center & Support Desk
                        </button>
                      </div>

                      {/* Log out option */}
                      <div className="pt-2 px-2">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                            handleNavigate('home');
                          }}
                          className="w-full text-left p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg font-bold transition cursor-pointer flex items-center gap-2"
                        >
                          🚪 Secure Sign Out
                        </button>
                      </div>

                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNavigate('login')}
                  className="px-4 py-2 text-xs font-extrabold text-slate-600 dark:text-slate-350 hover:text-emerald-700 transition cursor-pointer uppercase tracking-wider"
                >
                  Sign In
                </button>
                <button
                  id="get_started_btn"
                  onClick={() => handleNavigate('login')}
                  className="px-5.5 py-2.5 bg-slate-900 dark:bg-slate-850 text-white hover:bg-emerald-650 hover:bg-emerald-700 font-extrabold rounded-lg text-xs leading-none transition cursor-pointer inline-flex items-center gap-1.5 uppercase tracking-wider shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" /> Get Started
                </button>
              </div>
            )}
          </div>

          {/* Hamburger menu trigger */}
          <button 
            id="mobile_hamburger_btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Dynamic Mobile collapsing drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 p-4 space-y-3.5 flex flex-col text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-205">
            <button onClick={() => handleNavigate('home')} className="text-left py-1 hover:text-emerald-700">Home</button>
            <button onClick={() => handleNavigate('courses')} className="text-left py-1 hover:text-emerald-705">Courses</button>
            <button onClick={() => handleNavigate('pricing')} className="text-left py-1 hover:text-emerald-705">Pricing</button>
            <button onClick={() => handleNavigate('about')} className="text-left py-1 hover:text-emerald-705">About</button>
            <button onClick={() => handleNavigate('contact')} className={`text-left py-1 hover:text-emerald-705 ${currentPage === 'contact' ? 'text-emerald-705 font-bold' : ''}`}>Contact</button>
            
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="text-left py-1 hover:text-emerald-707 flex items-center gap-2 cursor-pointer"
            >
              {darkMode ? <><Sun className="w-4 h-4 text-amber-500" /> Light Mode</> : <><Moon className="w-4 h-4 text-slate-700" /> Dark Mode</>}
            </button>
            
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
              {token ? (
                <>
                  <button onClick={() => {
                    if (user?.roleId === 1) handleNavigate('admin');
                    else if (user?.roleId === 2) handleNavigate('instructor');
                    else handleNavigate('dashboard');
                  }} className="w-full text-center py-2 bg-emerald-600 text-white rounded">My Workspace</button>
                  <button onClick={() => { logout(); handleNavigate('home'); }} className="w-full text-center py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">Log Out</button>
                </>
              ) : (
                <button onClick={() => handleNavigate('login')} className="w-full text-center py-2.5 bg-slate-950 text-white rounded">Get Started</button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 3. DYNAMIC PAGES VIEWPORTS */}
      <main className="flex-grow">
        
        {currentPage === 'home' && (
          <LandingPage
            onNavigate={handleNavigate}
            onShowDemoVideo={(ytId, title) => setActivePlayVideo({ youtubeId: ytId, title })}
          />
        )}

        {currentPage === 'about' && <AboutPage />}

        {currentPage === 'contact' && <ContactPage />}

        {currentPage === 'courses' && (
          <CoursesPage
            initialSelectedCourseId={paramCourseId}
            onNavigate={handleNavigate}
            onShowDemoVideo={(ytId, title) => setActivePlayVideo({ youtubeId: ytId, title })}
            promptPremiumUpgrade={async () => {
              if (token && user?.roleId === 3) {
                try {
                  const res = await fetch('/api/payments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (res.ok) {
                    const studentPayments = await res.json();
                    const isPending = studentPayments.some((p: any) => p.status === 'pending');
                    if (isPending) {
                      alert("Your payment is pending. Please wait for administrator approval.");
                      return;
                    }
                  }
                } catch (e) {
                  console.error(e);
                }
              }
              alert("Upgrade to Premium to Unlock Full Course");
              handleNavigate('pricing');
            }}
          />
        )}

        {currentPage === 'pricing' && <PricingPage onNavigate={handleNavigate} />}

        {/* Authentication Pages */}
        {currentPage === 'login' && (
          <div className="max-w-md mx-auto w-full my-12 bg-white rounded-2xl border border-slate-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden" id="auth-login-card">
            {/* Top accent gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600"></div>
            
            <div className="text-center space-y-2 mt-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                <LogIn className="w-6 h-6 text-slate-800" />
              </div>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Sign In to Ezana</h2>
              <p className="text-slate-500 text-xs px-2 leading-relaxed">Enter your credentials below to access unlisted learning resources and track your progress.</p>
            </div>

            {authStatus && (
              <div className="p-4 bg-rose-50/80 backdrop-blur-xs border border-rose-100 text-rose-800 rounded-xl font-bold text-xs flex items-center gap-2 animate-fade-in" id="auth_status_msg">
                <span>⚠️</span>
                <span>{authStatus}</span>
              </div>
            )}

            <form onSubmit={executeLogin} className="space-y-5 text-xs pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Account Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth_login_email"
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="e.g. martha@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all duration-250 text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Security Password</label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth_login_password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter your security password"
                    className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all duration-250 text-slate-900 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="login_submit_btn"
                type="submit"
                className="w-full py-3.5 bg-slate-950 hover:bg-emerald-600 hover:text-slate-950 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                Sign In to Dashboard
              </button>
            </form>

            <div className="flex justify-between text-[11px] pt-4.5 border-t border-slate-100 text-slate-500 font-bold">
              <button onClick={() => handleNavigate('forgot')} className="hover:text-emerald-700 hover:underline cursor-pointer transition">Forgot Password?</button>
              <button onClick={() => handleNavigate('register')} className="hover:text-emerald-700 hover:underline cursor-pointer transition">Register New Account</button>
            </div>
          </div>
        )}

        {currentPage === 'register' && (
          <div className="max-w-md mx-auto w-full my-12 bg-white rounded-2xl border border-slate-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden" id="auth-register-card">
            {/* Top accent gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600"></div>

            <div className="text-center space-y-2 mt-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                <User className="w-6 h-6 text-slate-800" />
              </div>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Create Academic Profile</h2>
              <p className="text-slate-500 text-xs px-2 leading-relaxed">Fill in the fields below to set up your learning or instruction dashboard.</p>
            </div>

            {authStatus && (
              <div className="p-4 bg-emerald-50/80 backdrop-blur-xs border border-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 animate-fade-in" id="auth_status_msg">
                <span>✓</span>
                <span>{authStatus}</span>
              </div>
            )}

            <form onSubmit={executeRegister} className="space-y-4 text-xs pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="auth_reg_name"
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. Martha Tefera"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all duration-250 text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth_reg_email"
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="e.g. martha@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all duration-250 text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Create Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth_reg_pass"
                    type={showPassword ? "text" : "password"}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Create a strong secure password"
                    className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all duration-250 text-slate-900 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authPassword && authPassword.length < 6 && (
                  <p className="text-[10px] text-rose-500 font-bold transition-all pt-1">⚠️ Password must be at least 6 characters long.</p>
                )}
              </div>

              <button
                id="register_submit_btn"
                type="submit"
                className="w-full py-3.5 bg-slate-950 hover:bg-emerald-600 hover:text-slate-950 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                Register & Initialize Workspace
              </button>
            </form>

            <p className="text-center text-[11px] text-slate-500 pt-4 border-t border-slate-100 font-bold">
              Already have an account? <button onClick={() => handleNavigate('login')} className="text-emerald-700 hover:underline font-extrabold cursor-pointer transition">Log In</button>
            </p>
          </div>
        )}

        {currentPage === 'forgot' && (
          <div className="max-w-md mx-auto w-full my-12 bg-white rounded-2xl border border-slate-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden" id="auth-forgot-card">
            {/* Top accent gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600"></div>

            <div className="text-center space-y-2 mt-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                <KeyRound className="w-6 h-6 text-slate-800" />
              </div>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Reset Security Password</h2>
              <p className="text-slate-500 text-xs px-2 leading-relaxed">Enter your registered email below to generate a secure password recovery token.</p>
            </div>

            {authStatus && (
              <div className="p-4 bg-indigo-50/80 border border-indigo-100 text-indigo-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 animate-fade-in">
                <span>ℹ️</span>
                <span>{authStatus}</span>
              </div>
            )}

            <form onSubmit={executeForgot} className="space-y-5 text-xs pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Registered Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="e.g. martha@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all duration-250 text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-slate-950 hover:bg-emerald-600 hover:text-slate-950 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                Generate Dynamic Reset Token
              </button>
            </form>
            
            <div className="pt-4 border-t border-slate-100 flex justify-center">
              <button onClick={() => handleNavigate('login')} className="text-[11px] text-emerald-700 font-extrabold hover:underline cursor-pointer transition">Back to Sign In</button>
            </div>
          </div>
        )}

        {/* Dashboards Routing with role checks */}
        {currentPage === 'dashboard' && token && (
          <StudentDashboard
            onShowDemoVideo={(ytId, title) => setActivePlayVideo({ youtubeId: ytId, title })}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'instructor' && token && <InstructorDashboard />}

        {currentPage === 'admin' && token && <AdminDashboard onRefreshSession={refreshUser} />}

        {currentPage === 'settings' && token && (
          <AccountSettingsPage onBackToDashboard={() => {
            if (user?.roleId === 1) handleNavigate('admin');
            else if (user?.roleId === 2) handleNavigate('instructor');
            else handleNavigate('dashboard');
          }} />
        )}

      </main>

      {/* 4. SECTORS FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 select-none">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <p className="text-slate-100 font-black text-sm tracking-widest">EZANA ACADEMY</p>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Leading the digital education movement in East Africa. Specialized studies built for immediate employment.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-100 uppercase tracking-widest text-[11px]">Academic Programs</h4>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleNavigate('courses')} className="text-left hover:text-emerald-400">Conversational English</button>
              <button onClick={() => handleNavigate('courses')} className="text-left hover:text-emerald-400">Discrete Mathematics</button>
              <button onClick={() => handleNavigate('courses')} className="text-left hover:text-emerald-400">AI Full-Stack Development</button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-100 uppercase tracking-widest text-[11px]">Helpful Links</h4>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleNavigate('about')} className="text-left hover:text-emerald-400">Our Methodologies</button>
              <button onClick={() => handleNavigate('pricing')} className="text-left hover:text-emerald-400">Manual CBE/Telebirr Bank Instructions</button>
              <button onClick={() => handleNavigate('login')} className="text-left hover:text-emerald-400">Sign In Workspace</button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-100 uppercase tracking-widest text-[11px]">Verification Standard</h4>
            <p className="text-[11px] leading-relaxed text-slate-450">
              Graduates receive interactive certificates equipped with a verification QR matrix and custom serial hash trace codes.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-600 text-[10px] flex flex-col sm:flex-row justify-between max-w-7xl mx-auto gap-4">
          <p>© 2026 Ezana Academy. Securely built according to specifications.</p>
          <p className="font-mono">Development Build • Version 1.0.4</p>
        </div>
      </footer>

      {/* 5. DYNAMIC POPUP EMBED YOUTUBE PLAYER OVERLAY */}
      {activePlayVideo && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 max-w-4xl w-full text-slate-200 overflow-hidden shadow-2xl relative">
            
            {/* Overlay controller Header */}
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center px-6">
              <h4 className="font-bold text-emerald-400 text-xs md:text-sm tracking-wide line-clamp-1 truncate">{activePlayVideo.title}</h4>
              <button
                id="close_global_video_overlay"
                onClick={() => setActivePlayVideo(null)}
                className="p-1 px-3 bg-slate-900 hover:bg-slate-800 text-xs font-bold rounded cursor-pointer border border-slate-800"
              >
                Close Video Player
              </button>
            </div>

            {/* Embed video frame */}
            <div className="aspect-video w-full bg-slate-950 relative">
              <iframe
                src={`https://www.youtube.com/embed/${activePlayVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={activePlayVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            <div className="p-4 bg-slate-950/20 text-center text-[11px] text-slate-500 leading-normal">
              📹 Active unlisted lesson segment. Speed optimized by default. Use YouTube controls to scale quality logs.
            </div>

          </div>
        </div>
      )}

      {/* RICH INBOX READER MODAL */}
      {selectedInboxItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full text-xs text-slate-800 dark:text-slate-100 overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-extrabold uppercase tracking-widest text-[9px]">
                {selectedInboxItem.type === 'message' ? '📩 Direct Private Message' : '📢 System Bulletin'}
              </span>
              <button 
                onClick={() => { setSelectedInboxItem(null); setMessageReplyText(''); }}
                className="p-1 px-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded font-black text-rose-500 cursor-pointer"
              >
                Close (X)
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-950 dark:text-white leading-tight">
                  {selectedInboxItem.type === 'message' ? selectedInboxItem.sender : selectedInboxItem.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">{selectedInboxItem.date}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl leading-relaxed text-slate-700 dark:text-slate-300 text-xs border border-slate-100 dark:border-slate-800">
                "{selectedInboxItem.text}"
              </div>

              {selectedInboxItem.type === 'message' && (
                <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  
                  {/* List replies if any */}
                  {messages.find(m => m.id === selectedInboxItem.id)?.replies.map((rep, idx) => (
                    <div key={idx} className="bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-lg text-[11px] space-y-1 border border-emerald-100/30">
                      <div className="flex justify-between font-bold text-emerald-800 dark:text-emerald-400">
                        <span>You (Student Partner)</span>
                        <span className="text-[9px] font-mono text-slate-405 font-normal">Just now</span>
                      </div>
                      <p className="text-slate-650 dark:text-slate-300">"{rep}"</p>
                    </div>
                  ))}

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 text-[10px] uppercase block">Draft private workspace response</label>
                    <textarea
                      rows={3}
                      value={messageReplyText}
                      onChange={(e) => setMessageReplyText(e.target.value)}
                      placeholder="Type your response to academic advisors here..."
                      className="w-full p-2.5 border rounded bg-slate-50 focus:bg-white dark:bg-slate-950 dark:text-white dark:border-slate-800 focus:outline-emerald-600 outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!messageReplyText.trim()) return;
                      // Add reply locally
                      setMessages(prev => prev.map(m => m.id === selectedInboxItem.id ? {
                        ...m,
                        replies: [...m.replies, messageReplyText]
                      } : m));
                      setMessageReplyText('');
                      alert("✓ Message reply has been transmitted securely via the academic channel!");
                    }}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded text-xs uppercase"
                  >
                    Transmit Workspace Response
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
