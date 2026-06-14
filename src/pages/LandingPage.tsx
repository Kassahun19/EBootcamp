import React, { useState, useEffect } from 'react';
import { BookOpen, HelpCircle, CheckCircle, Video, Award, Star, Users, Briefcase, ChevronRight, Mail, Phone, MapPin, Send, AlertTriangle, Play, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  avatar: string;
}

interface Stats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalRevenue: number;
  activeUsersCount: number;
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

function AnimatedCounter({ value, duration = 1200, prefix = '', suffix = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = React.useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setHasTriggered(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasTriggered) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    window.requestAnimationFrame(step);
  }, [hasTriggered, value, duration]);

  return (
    <span ref={elementRef}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function LandingPage({
  onNavigate,
  onShowDemoVideo
}: {
  onNavigate: (page: string, params?: any) => void;
  onShowDemoVideo: (youtubeId: string, title: string) => void;
}) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 452,
    totalInstructors: 3,
    totalCourses: 3,
    totalRevenue: 24000,
    activeUsersCount: 38
  });

  // Contact State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // FAQ State
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({ 0: true });

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  useEffect(() => {
    // Read courses from our dynamic APIs
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(err => console.error("Error loaded courses list:", err));

    // Read live stats
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Error stats fetch:", err));

    // Get testimonials
    fetch('/api/testimonials')
      .then(res => res.json())
      .then(data => setTestimonials(data))
      .catch(err => console.error("Error testimonials read:", err));
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactSubject || !contactMsg) {
      setContactStatus({ type: 'error', message: 'All inputs are required.' });
      return;
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: contactName, email: contactEmail, subject: contactSubject, message: contactMsg })
      });
      const data = await res.json();
      if (res.ok) {
        setContactStatus({ type: 'success', message: 'Message sent successfully! Our administrative team will reach out in 24 hours.' });
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMsg('');
      } else {
        setContactStatus({ type: 'error', message: data.message || 'Transmission failed.' });
      }
    } catch (err) {
      setContactStatus({ type: 'error', message: 'Network communication failure.' });
    }
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSuccess(true);
      setTimeout(() => {
        setNewsletterSuccess(false);
        setNewsletterEmail('');
      }, 5000);
    }
  };

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Static FAQ dataset
  const faqs = [
    {
      q: "What payment frameworks are supported inside Ezana Academy?",
      a: "We deploy a manual bank transmission receipt verification workflow. Simply pay ETB 1,000 to Kassahun Mulatu (via Commercial Bank of Ethiopia (CBE) Birr or Telebirr as shown in the Pricing structure), upload your receipt image or PDF file on our platform, and admin will unlock your lifetime access within hours."
    },
    {
      q: "Do I hold lifetime access to courses and certificates?",
      a: "Absolutely! Once your premium receipt verification is stamped positive by our admin, you receive full unlocked access to English, Math, and AI-powered Full Stack Web development programs, standard source resources, assignments review, and premium interactive downloadable certificates with active QR verification links."
    },
    {
      q: "Can public guests see the educational course chapters?",
      a: "Public and student accounts have pre-authenticated accessibility to selected Free Demo Lessons on our lessons catalog. High-tier premium chapters contain locked indicators. To watch, you pay once and click Upgrade."
    },
    {
      q: "Are video assets hosted securely?",
      a: "Yes! All lessons rely on elite embedded YouTube playback streams using professional, high-performance unlisted and public configurations. It prevents buffering, works beautifully on cellular layouts, and keeps lessons lightweight."
    }
  ];

  return (
    <div className="bg-slate-50 text-slate-800 font-sans" id="ez_landing_page">
      
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 text-white py-20 lg:py-32 px-4 shadow-inner">
        {/* Absolute visual patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-300 text-sm font-semibold tracking-wide uppercase">
              <Star className="w-4 h-4 fill-emerald-300" />
              Empowering Ethiopian Minds with Elite Knowledge
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Master English, Maths & <span className="text-emerald-400 bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">AI Full Stack</span> Engineering
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 font-normal">
              Ezana Academy delivers top-tier English communication, rigorous mathematical logics, and production web development workflows. Elevate your global career for a single legacy price.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <button 
                id="hero_cta_courses"
                onClick={() => onNavigate('courses')}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 transition text-slate-950 font-bold rounded-lg shadow-lg shadow-emerald-950/40 text-base inline-flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                Browse All Courses <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                id="hero_cta_premium"
                onClick={() => onNavigate('pricing')}
                className="px-8 py-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500/40 transition text-slate-100 font-semibold rounded-lg text-base inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                Go Premium Plan (ETB 1,000)
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
              <div>
                <p className="text-3xl font-extrabold text-emerald-400">
                  <AnimatedCounter value={stats.totalStudents} />+
                </p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Alumni</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-emerald-400">
                  <AnimatedCounter value={100} suffix="%" />
                </p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Unlisted Videos</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-emerald-400">QR Verified</p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Certificates</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 p-3">
              <div className="aspect-video w-full rounded-lg bg-slate-900 relative group flex items-center justify-center overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600" 
                  alt="Ezana Dev Classroom" 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent"></div>
                
                {/* Visual Video Play Overlay Button */}
                <button
                  id="hero_demo_play_btn"
                  onClick={() => onShowDemoVideo('Ke90Tje7VS0', 'Ezana Academy - Free Demo Lesson preview')}
                  className="absolute p-5 rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 hover:scale-110 transition cursor-pointer shadow-xl border-4 border-slate-950"
                  title="Watch Free Welcome Video"
                >
                  <Play className="w-8 h-8 fill-slate-950" />
                </button>
                
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-300">
                  <span className="bg-emerald-500/25 border border-emerald-400/20 px-2 py-0.5 rounded text-emerald-300 font-semibold">FREE DEMO PLAY</span>
                  <span className="font-mono">Duration: 35 mins</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-slate-900/60 rounded-lg text-xs space-y-1">
                <p className="font-bold text-slate-200">✨ Standard Dynamic Seeding Module Active</p>
                <p className="text-slate-400">Play real-world React state elements, props, and Tailwind configurations instantly with unlisted YouTube integrations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE STATISTICS & LOGO CARDS */}
      <section className="bg-white border-b border-slate-200 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-8 justify-around items-center text-center">
          <div className="p-4">
            <p className="text-4xl font-black text-slate-900">
              <AnimatedCounter value={stats.totalStudents || 452} />
            </p>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Total Enrolled Users</p>
          </div>
          <div className="h-12 w-[1px] bg-slate-200 hidden md:block"></div>
          <div className="p-4">
            <p className="text-4xl font-black text-slate-900">
              <AnimatedCounter value={stats.totalInstructors || 3} />
            </p>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Certified Lecturers</p>
          </div>
          <div className="h-12 w-[1px] bg-slate-200 hidden md:block"></div>
          <div className="p-4">
            <p className="text-4xl font-black text-slate-900">
              <AnimatedCounter value={stats.totalCourses || 3} />
            </p>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Enterprise Programs</p>
          </div>
          <div className="h-12 w-[1px] bg-slate-200 hidden md:block"></div>
          <div className="p-4">
            <p className="text-4xl font-black text-emerald-600">
              <AnimatedCounter value={stats.totalRevenue || 24000} prefix="ETB " />
            </p>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Verified Revenue Logs</p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED COURSES SECTION */}
      <section className="py-20 px-4 max-w-7xl mx-auto" id="featured_courses">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Our Elite Curriculum Portfolio
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-base">
            Structured for maximum efficacy. Go from true novice to production-competent engineer, confident speaker, or analytical thinker.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.slice(0, 3).map((course) => (
            <div 
              id={`featured_course_${course.id}`}
              key={course.id} 
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition duration-300 flex flex-col group"
            >
              <div className="aspect-video w-full relative overflow-hidden bg-slate-200">
                <img 
                  src={course.thumbnail} 
                  alt={course.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded text-xs font-bold tracking-wide">
                    {course.category}
                  </span>
                  {course.premium ? (
                    <span className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-extrabold tracking-wide uppercase shadow">
                      Premium
                    </span>
                  ) : (
                    <span className="bg-blue-600 text-white px-2.5 py-1 rounded text-xs font-bold uppercase">
                      Free Access
                    </span>
                  )}
                </div>
                <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded text-[11px] text-slate-200 font-mono">
                  {course.duration}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition">
                    {course.title}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                    {course.description}
                  </p>
                </div>

                <div className="pt-5 border-t border-slate-100 mt-5 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    {course.lessonsCount} Core Lessons
                  </span>
                  <button 
                    id={`featured_view_btn_${course.id}`}
                    onClick={() => onNavigate('courses', { courseId: course.id })}
                    className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    View Details <ChevronRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            id="view_catalog_btn"
            onClick={() => onNavigate('courses')}
            className="px-6 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold rounded-lg transition text-sm cursor-pointer inline-flex items-center gap-2 border border-emerald-200"
          >
            Explore Complete Course Catalog
          </button>
        </div>
      </section>

      {/* 4. FREE DEMO STUDY VIEWPORT */}
      <section className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <span className="bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 font-bold text-xs uppercase px-2.5 py-1 rounded-full">
              ⚡ Free Learning Preview Sandbox
            </span>
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight leading-snug">
              Begin Learning Instantly with Free Demo Video Lessons
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              No registration or immediate credit card actions required! Ezana Academy offers open modules so you can verify our pristine lecturing quality first. Watch selected course segments today.
            </p>

            <div className="space-y-3.5 pt-2">
              <div 
                className="p-3.5 bg-slate-950/40 hover:bg-slate-950/80 rounded-lg border border-slate-800 flex items-start gap-3.5 cursor-pointer transition"
                onClick={() => onShowDemoVideo('Ke90Tje7VS0', 'React Elements, State Loops & Hooks (Demo Lesson)')}
              >
                <div className="p-2.5 bg-emerald-500/15 rounded text-emerald-400 mt-0.5">
                  <Play className="w-5 h-5 fill-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">React Components & State Logic</h4>
                  <p className="text-slate-500 text-xs">AI Full Stack Web Development Course Preview • 35 mins</p>
                </div>
              </div>

              <div 
                className="p-3.5 bg-slate-950/40 hover:bg-slate-950/80 rounded-lg border border-slate-800 flex items-start gap-3.5 cursor-pointer transition"
                onClick={() => onShowDemoVideo('3U7u9z7zR0U', 'Discrete Logic & Analytical Calculus (Demo Lesson)')}
              >
                <div className="p-2.5 bg-emerald-500/15 rounded text-emerald-400 mt-0.5">
                  <Play className="w-5 h-5 fill-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">Discrete Logic Truth Tables</h4>
                  <p className="text-slate-500 text-xs">Mathematics Course Preview • 22 mins</p>
                </div>
              </div>

              <div 
                className="p-3.5 bg-slate-950/40 hover:bg-slate-950/80 rounded-lg border border-slate-800 flex items-start gap-3.5 cursor-pointer transition"
                onClick={() => onShowDemoVideo('eIho2S0ZahI', 'Professional Workplace Conversation Intro (Demo Lesson) [Julian Treasure TED Talk]')}
              >
                <div className="p-2.5 bg-emerald-500/15 rounded text-emerald-400 mt-0.5">
                  <Play className="w-5 h-5 fill-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">Professional Intro & Conversational Vocab</h4>
                  <p className="text-slate-500 text-xs">English Course Preview • 15 mins</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="aspect-video bg-slate-900 rounded-lg flex flex-col items-center justify-center p-6 text-center shadow-inner relative overflow-hidden">
              <div className="absolute top-4 left-4 bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 px-3 py-1 rounded text-xs font-bold uppercase">
                Now Previewing (No Auth Needed)
              </div>
              <Video className="w-16 h-16 text-emerald-400/20 mb-4" />
              <h3 className="text-lg font-bold text-slate-300">Choose a lesson on the left to activate streaming</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-2">
                All premium course elements are secured under student authorization token loops. Play back selected demo materials instantly!
              </p>
              
              <button
                id="preview_study_launcher"
                onClick={() => onShowDemoVideo('Ke90Tje7VS0', 'Full Stack React & Tailwind Demonstration (Standard Seeding)')}
                className="mt-6 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition"
              >
                Launch Active Player <Play className="w-3.5 h-3.5 fill-slate-950" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="py-20 px-4 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900">Why Ethiopian Leaders Choose Ezana</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              We did not copy standard western structures. We explicitly tailored our e-learning metrics to fit regional networks, logical needs, and payment scenarios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Expert Regional Instructors</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Tackle discrete mathematical systems and React state arrays with expert tutors who explain complex computer models clearly.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Zero-Buffered Unlisted YouTube</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                We embed unlisted YouTube IDs, giving you high-performance streaming. Use your local internet speed efficiently on any device.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Manual Secure Receipt Approvals</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                No foreign visa cards needed. Make standard, reliable bank transfers (CBE / Telebirr), upload your receipt, and instantly unlock your dashboard permissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. STUDENT TESTIMONIALS */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900">Success Stories From Our Students</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Read how our students built careers, mastered logic, and streamlined project tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test) => (
              <div key={test.id} className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm relative">
                <div className="space-y-4">
                  <div className="text-amber-400 flex gap-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed italic">
                    "{test.content}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-5 border-t border-slate-100 mt-5">
                  <img src={test.avatar} alt={test.name} className="w-10 h-10 rounded-full object-cover border border-emerald-500/20" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{test.name}</h5>
                    <p className="text-slate-500 text-[11px]">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PRICING PLAN */}
      <section className="py-20 px-4 bg-white border-b border-slate-200" id="pricing-section">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest">
              One Price. Lifetime Access. Unlimited Growth.
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-950">Standard Premium Lifetime Plan</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
              No subscription fatigue. No hidden invoices. Invest once and get lifetime software updates and course materials.
            </p>
          </div>

          <div className="max-w-md mx-auto rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-950 text-white border border-emerald-500/25 p-8 relative overflow-hidden shadow-xl">
            {/* Absolute accent glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-emerald-400">PREMIUM</h3>
                  <p className="text-xs text-slate-400 mt-1">LIFETIME ACCESS MEMBER</p>
                </div>
                <span className="bg-emerald-500/15 border border-emerald-400/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
                  BEST VALUE
                </span>
              </div>

              <div className="py-4 border-y border-slate-800">
                <span className="text-4xl lg:text-5xl font-extrabold text-emerald-400">ETB 1,000</span>
                <span className="text-xs text-slate-400 font-medium ml-2">Legacy rate</span>
              </div>

              <div className="space-y-3.5">
                {[
                  "Lifetime Access to English, Maths, and AI Full Stack Web Development Courses",
                  "Video Access organized by Course, Module, and Lesson",
                  "Downloadable code and documentation archives",
                  "Comprehensive assessment with custom quizzes and grade logs",
                  "Interactive QR Code Verified Graduation Certificates",
                  "Future courses and system updates included free"
                ].map((benefit, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-xs text-slate-300 leading-normal">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-3 text-center">
                {/* When clicked, redirect user as requested */}
                <a 
                  id="go_premium_bnt_landing"
                  href="https://ye-buna.com/kassahunmulatu" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full inline-block text-center py-4 bg-emerald-500 hover:bg-emerald-400 transition text-slate-950 font-extrabold rounded-lg text-base shadow-lg cursor-pointer transform hover:-translate-y-0.5"
                >
                  GO PREMIUM
                </a>
                <p className="text-[11px] text-slate-400">
                  Secure transfer directed to **ye-buna.com/kassahunmulatu**
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section className="bg-slate-50 py-20 px-4" id="faq-section">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-sm">
              Answers to common questions about registration, bank payments, and system options.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition">
                <button
                  id={`faq_btn_${index}`}
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-5 flex justify-between items-center gap-4 hover:bg-slate-50 cursor-pointer"
                >
                  <span className="font-bold text-slate-900 text-sm md:text-base inline-flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronRight className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${faqOpen[index] ? 'rotate-90' : ''}`} />
                </button>
                {faqOpen[index] && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/50 text-slate-600 text-xs md:text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CONTACT SECTION WITH GOOGLE MAP */}
      <section className="py-20 px-4 bg-white border-b border-slate-200" id="contact-section">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          <div className="lg:col-span-12 text-center space-y-3 mb-4">
            <h2 className="text-3xl font-extrabold text-slate-950">Get in Touch With Our Admissions Team</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm">
              Have questions prior to submitting your receipt? Write us a message or find our offices in Bahir Dar, Ethiopia.
            </p>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg">Contact Information</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Contact our regional team if you have payment or login questions.
              </p>

              <div className="space-y-3 pt-2 text-xs text-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>0915508167</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>support@ezana.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>Bahir Dar, Kebele 11, Ethiopia</span>
                </div>
              </div>
            </div>

            {/* Google Map Section */}
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm h-64 bg-slate-200 relative">
              {/* Stand-in high fidelity map representation with clean vector graphic styles */}
              <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
                <MapPin className="w-12 h-12 text-rose-500 animate-bounce mb-2" />
                <h4 className="font-bold text-slate-900 text-sm">Bahir Dar, Kebele 11 Office Map Placeholder</h4>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Near main city circle, Kebele 11 region. Standard responsive Google Maps integration coordinates: Lat: 11.5742, Long: 37.3614.
                </p>
                <div className="mt-4 flex gap-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-[10px] px-2 py-1 rounded text-white font-bold cursor-pointer">
                  Open coordinates in new window
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-300 relative">
            <div className="absolute top-0 right-10 w-24 h-24 bg-teal-50 rounded-full blur-2xl -z-10 opacity-60"></div>
            <h3 className="font-black text-slate-950 text-xl tracking-tight mb-2">Send Us a Direct Message</h3>
            <p className="text-slate-500 text-xs mb-6">Have an inquiry regarding courses, campus programs, or corporate partnerships? Get in touch.</p>
            
            <form onSubmit={handleContactSubmit} className="space-y-5">
              {contactStatus.type && (
                <div className={`p-4 rounded-xl text-xs leading-normal flex items-center gap-3 animate-fade-in ${
                  contactStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                }`}>
                  {contactStatus.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
                  <span className="font-semibold">{contactStatus.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Your Full Name</label>
                  <div className="relative group">
                    <input
                      id="contact_form_name"
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Samuel Hailu"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all duration-250 text-slate-800 text-sm placeholder-slate-400"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Your Email Address</label>
                  <div className="relative group">
                    <input
                      id="contact_form_email"
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. samuel@example.com"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all duration-250 text-slate-800 text-sm placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Inquiry Subject</label>
                <div className="relative group">
                  <input
                    id="contact_form_subject"
                    type="text"
                    required
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="e.g. Sponsorship or dashboard queries"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all duration-250 text-slate-800 text-sm placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Message Content</label>
                <div className="relative group">
                  <textarea
                    id="contact_form_msg"
                    required
                    rows={4}
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="Tell us what you are trying to solve..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all duration-250 text-slate-800 text-sm placeholder-slate-400 resize-none"
                  ></textarea>
                </div>
              </div>

              <button
                id="contact_submit_btn"
                type="submit"
                className="px-6 py-3.5 bg-slate-950 hover:bg-emerald-600 hover:text-slate-950 text-white font-black rounded-xl text-xs inline-flex items-center gap-2.5 cursor-pointer transition-all duration-200 uppercase tracking-widest hover:shadow-lg active:scale-[0.98]"
              >
                Send Message <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 10. NEWSLETTER OPT-IN */}
      <section className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white py-16 px-4 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.08),transparent_50%)]"></div>
        
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-900/40 border border-emerald-800/60 mb-2">
            <Mail className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black md:text-4xl tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent">Stay Updated on Course Expansions</h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Subscribe to receives alert tokens when we release new lessons, unlisted YouTube items, or dashboard modules.
          </p>
          
          <form onSubmit={handleNewsletter} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 pt-2">
            <div className="flex-1 relative">
              <input
                id="newsletter_email"
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter email address..."
                className="w-full px-5 py-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 focus:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-sm text-white placeholder-emerald-600/70 transition-all duration-200"
              />
            </div>
            <button
              id="newsletter_submit_btn"
              type="submit"
              className="px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
            >
              Subscribe
            </button>
          </form>

          {newsletterSuccess && (
            <div className="inline-block p-3 px-6 bg-emerald-900/50 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 font-bold animate-pulse">
              🎉 Subscription successful! Welcome to the Ezana notification loops.
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
