import React, { useState, useEffect } from 'react';
import { BookOpen, MapPin, Users, Video, Eye, ShieldAlert, Play, Lock, ChevronRight, Activity, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FALLBACK_DATABASE_STATE } from '../lib/fallbackData';

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
  instructorId: number;
  modules?: Module[];
}

export default function CoursesPage({
  initialSelectedCourseId,
  onNavigate,
  onShowDemoVideo,
  promptPremiumUpgrade
}: {
  initialSelectedCourseId: number | null;
  onNavigate: (page: string, params?: any) => void;
  onShowDemoVideo: (youtubeId: string, title: string) => void;
  promptPremiumUpgrade: () => void;
}) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>(FALLBACK_DATABASE_STATE.courses);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'English' | 'Mathematics' | 'AI Full Stack'>('All');
  const [loading, setLoading] = useState(true);
  
  // Search and Advanced filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [wishlist, setWishlist] = useState<number[]>([]);

  useEffect(() => {
    fetchCourses();
    // Load wishlist
    if (user) {
      const saved = localStorage.getItem(`ezana_wishlist_${user.id}`);
      if (saved) {
        try {
          setWishlist(JSON.parse(saved));
        } catch (err) {
          console.warn("Could not deserialize user course wishlist key.");
        }
      }
    }
  }, [user]);

  const toggleWishlist = (courseId: number) => {
    if (!user) {
      alert("Please register or log in to manage your private learning wishlist!");
      return;
    }
    const updated = wishlist.includes(courseId)
      ? wishlist.filter(id => id !== courseId)
      : [...wishlist, courseId];
    
    setWishlist(updated);
    localStorage.setItem(`ezana_wishlist_${user.id}`, JSON.stringify(updated));
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/courses');
      if (res.ok) {
        const list = await res.json();
        if (list && list.length > 0) {
          setCourses(list);
        } else {
          setCourses(FALLBACK_DATABASE_STATE.courses);
        }
      } else {
        setCourses(FALLBACK_DATABASE_STATE.courses);
      }
    } catch (e) {
      console.error("Error fetching courses List:", e);
      setCourses(FALLBACK_DATABASE_STATE.courses);
    } finally {
      setLoading(false);
      if (initialSelectedCourseId) {
        fetchCourseDetails(initialSelectedCourseId);
      }
    }
  };

  const fetchCourseDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (res.ok) {
        const item = await res.json();
        setSelectedCourse(item);
        return;
      }
    } catch (e) {
      console.error("Error loaded individual course Details:", e);
    }

    // High performance local fallback
    const matchedCourse = FALLBACK_DATABASE_STATE.courses.find(c => c.id === id);
    if (matchedCourse) {
      const courseModules = FALLBACK_DATABASE_STATE.modules
        .filter(m => m.courseId === id)
        .map(mod => ({
          ...mod,
          lessons: FALLBACK_DATABASE_STATE.lessons.filter(l => l.moduleId === mod.id)
        }));
      setSelectedCourse({
        ...matchedCourse,
        modules: courseModules
      });
    }
  };

  const handleSelectCourse = (courseId: number) => {
    fetchCourseDetails(courseId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredCourses = courses.filter(course => {
    // 1. Category Filter Tab
    if (activeTab !== 'All' && course.category !== activeTab) return false;
    
    // 2. Price/Tier Filter
    if (priceFilter === 'free' && course.premium) return false;
    if (priceFilter === 'premium' && !course.premium) return false;
    
    // 3. Search text matching query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      const matchTitle = course.title.toLowerCase().includes(query);
      const matchDesc = course.description.toLowerCase().includes(query);
      const matchCat = course.category.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    
    return true;
  });

  return (
    <div className="bg-slate-50 text-slate-800 py-10 px-4" id="courses_catalog_view">
      
      {/* Dynamic Header */}
      {!selectedCourse ? (
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Explore Our Specialist Courses
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              Learn English communication, rigorous mathematics logic, or AI Full Stack orchestration. Zero buffer videos, high-fidelity homework assignments, and QR code certificates.
            </p>
          </div>

          {/* Search Bar + Price Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-6 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search master curriculum, keywords or lecturer..."
                className="w-full bg-slate-100 focus:bg-white text-xs text-slate-800 px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="md:col-span-6 flex gap-2 justify-end">
              <span className="text-xs text-slate-500 self-center font-bold mr-1">Tier Filter:</span>
              {(['all', 'free', 'premium'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPriceFilter(mode)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition cursor-pointer ${
                    priceFilter === mode
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Categorized Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2.5 pb-2">
            {(['All', 'English', 'Mathematics', 'AI Full Stack'] as const).map((tab) => (
              <button
                id={`filter_tab_${tab.replace(' ', '_')}`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab === 'All' ? '💡 All Academic Courses' : `${tab} Program`}
              </button>
            ))}
          </div>

          {/* Courses Cards Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600 mx-auto"></div>
              <p className="text-slate-500 text-xs mt-3.5">Syncing courses syllabus database...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="font-bold text-slate-950 mt-3.5 text-base">No course list loaded</h3>
              <p className="text-slate-400 text-xs mt-1">Please log in to Admin panel and trigger **/install** pipeline.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
              {filteredCourses.map((course) => {
                const isPremiumUser = user?.roleId === 1 || user?.roleId === 2 || user?.premium;
                return (
                  <div 
                    id={`catalog_course_card_${course.id}`}
                    key={course.id} 
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition duration-300 flex flex-col group justify-between"
                  >
                    <div>
                      <div className="aspect-video w-full relative overflow-hidden bg-slate-100">
                        <img 
                          src={course.thumbnail} 
                          alt={course.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded text-xs font-bold">
                            {course.category}
                          </span>
                          {course.premium ? (
                            <span className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-extrabold tracking-wide uppercase shadow">
                              Premium
                            </span>
                          ) : (
                            <span className="bg-blue-600 text-white px-2.5 py-1 rounded text-xs font-bold uppercase">
                              Free
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(course.id);
                          }}
                          className="absolute top-3 right-3 p-2 bg-white/95 hover:bg-white text-rose-500 rounded-full shadow-md hover:scale-105 transition duration-200 z-10 cursor-pointer"
                          title={wishlist.includes(course.id) ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill={wishlist.includes(course.id) ? "currentColor" : "none"}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="w-4.5 h-4.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </button>

                        <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] text-slate-200 font-mono">
                          {course.duration}
                        </div>
                      </div>

                      <div className="p-6 space-y-3">
                        <h3 className="text-lg font-bold text-slate-950 leading-snug line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                          {course.description}
                        </p>

                        <div className="text-xs pt-2 space-y-1 text-slate-500">
                          <p>👤 <span className="font-bold text-slate-700">Lecturer:</span> Dr. Demeke Assefa</p>
                          <p>🎒 <span className="font-bold text-slate-700">Comprehension:</span> Quizzes & Homework</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs mt-4">
                        <span className="font-bold text-slate-700 inline-flex items-center gap-1">
                          <BookOpen className="w-4 h-4 text-emerald-600" />
                          {course.lessonsCount} Core Lessons
                        </span>
                        
                        <button
                          id={`explore_course_btn_${course.id}`}
                          onClick={() => handleSelectCourse(course.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 transition text-white font-extrabold rounded text-xs cursor-pointer"
                        >
                          View Syllabus & Play Demo
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Course Syllabus Viewer + Lesson Selector & Embed player */
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          
          <button
            id="back_to_catalog_btn"
            onClick={() => setSelectedCourse(null)}
            className="px-4.5 py-2 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center gap-2 cursor-pointer border border-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Complete Course Catalog
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Course Information Metadata Left Section */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                <div className="aspect-video w-full rounded-lg overflow-hidden relative bg-slate-900 flex items-center justify-center border border-slate-200">
                  <img 
                    src={selectedCourse.thumbnail} 
                    alt={selectedCourse.title} 
                    className="w-full h-full object-cover opacity-65 absolute inset-0 pb-1"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
                  
                  {/* Stand-in play button of first free demo lesson */}
                  <div className="relative text-center z-10 space-y-3 p-4">
                    <button
                      id="view_first_demo_btn"
                      onClick={() => {
                        const firstPreview = selectedCourse.modules
                          ?.flatMap(m => m.lessons)
                          .find(l => l?.isPreview);
                        if (firstPreview) {
                          onShowDemoVideo(firstPreview.youtubeId, firstPreview.title);
                        } else {
                          onShowDemoVideo('Ke90Tje7VS0', 'Ezana Course Introduction Webcast');
                        }
                      }}
                      className="p-4.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 hover:scale-105 transition cursor-pointer self-center"
                    >
                      <Play className="w-6 h-6 fill-slate-900 ml-0.5" />
                    </button>
                    <p className="text-white text-xs font-bold uppercase tracking-wider">Play Free Demo Intro Segment</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded font-bold uppercase">
                      {selectedCourse.category}
                    </span>
                    <span className="bg-slate-900 text-slate-200 text-xs px-2.5 py-0.5 rounded font-mono">
                      {selectedCourse.duration} Extensive Study
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-slate-950 tracking-tight leading-snug">
                    {selectedCourse.title}
                  </h2>
                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                    {selectedCourse.description}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800 uppercase">🎓 certified academic instructors</h5>
                    <p className="text-slate-500 mt-1">Dr. Demeke Assefa (Assistant Professor, Addis Ababa Univ.)</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 uppercase">💼 career alignment outcomes</h5>
                    <p className="text-slate-500 mt-1">Acquire international levels of tech engineering, logical validation, or conversational fluency.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modules & Lessons Segment Syllabus Right Section */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-slate-100 text-sm tracking-wide uppercase">Course Syllabi</h3>
                  <span className="bg-emerald-500/15 border border-emerald-400/20 px-2 py-0.5 rounded text-emerald-300 font-mono text-[10px]">
                    {selectedCourse.lessonsCount} lessons
                  </span>
                </div>

                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                  {!selectedCourse.modules || selectedCourse.modules.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center">Module records temporarily initializing.</p>
                  ) : (
                    selectedCourse.modules.map((mod) => (
                      <div key={mod.id} className="space-y-2.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                        <div>
                          <h4 className="font-extrabold text-slate-200 text-xs leading-normal">{mod.title}</h4>
                          <p className="text-slate-500 text-[10px] mt-0.5">{mod.description}</p>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {mod.lessons.map((les) => {
                            // Checked if user has Premium to decide dynamic lockers override
                            const isPremiumMember = user?.roleId === 1 || user?.roleId === 2 || user?.premium;
                            const isClickable = les.isPreview || isPremiumMember;

                            return (
                              <div
                                id={`syllabus_lesson_${les.id}`}
                                key={les.id}
                                onClick={() => {
                                  if (isClickable) {
                                    onShowDemoVideo(les.youtubeId, les.title);
                                  } else {
                                    promptPremiumUpgrade();
                                  }
                                }}
                                className={`p-2 rounded-md flex items-center justify-between gap-3 text-xs transition cursor-pointer ${
                                  isClickable 
                                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800' 
                                    : 'bg-slate-950/80 text-slate-500 border border-slate-900/40'
                                }`}
                              >
                                <span className="flex items-center gap-2 line-clamp-1">
                                  {isClickable ? (
                                    <Play className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                  )}
                                  <span className="font-medium">{les.title}</span>
                                </span>

                                {les.isPreview ? (
                                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-1.5 py-0.5 rounded text-[9px] shrink-0 uppercase tracking-widest">
                                    Demo
                                  </span>
                                ) : !isPremiumMember ? (
                                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-slate-900 px-1 py-0.5 rounded border border-slate-800 shrink-0">
                                    Lock
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-emerald-400 font-mono italic shrink-0">
                                    {les.duration}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Lock banner matching requirement */}
                {!(user?.roleId === 1 || user?.roleId === 2 || user?.premium) && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-xs space-y-2 text-amber-200">
                    <p className="font-bold flex items-center gap-2 text-[11px] uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-amber-300" /> Upgrade to Premium to Unlock Full Course
                    </p>
                    <p className="text-[10px] text-slate-300 leading-normal">
                      Premium locked contents remain secured. Elevate to Lifetime Access for only **ETB 1,000** to watch all unlisted lessons and earn certified diploma credentials.
                    </p>
                    <button
                      id="syllabus_upgrade_cta"
                      onClick={() => onNavigate('pricing')}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-black text-[10px] transition cursor-pointer"
                    >
                      GO PREMIUM NOW
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
