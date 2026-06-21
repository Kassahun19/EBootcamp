import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash, Edit, Copy, Check, X, Award, Sparkles, Clock, 
  AlertTriangle, Archive, Users, Search, FileUp, FileDown, Eye, 
  Settings, HelpCircle, Activity, CheckSquare, FileText, LayoutDashboard,
  ChevronRight, ChevronLeft, BookOpen, RefreshCw, Layers
} from 'lucide-react';

interface Quiz {
  id: number;
  courseId: number;
  moduleId?: number | null;
  lessonId?: number | null;
  title: string;
  description: string;
  passingScore: number;
  duration: number;
  attemptsAllowed: number;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  availableFrom?: string | null;
  availableTo?: string | null;
  status: 'draft' | 'published' | 'archived';
  isExam: boolean;
  questionsCount?: number;
  questions?: any[];
  courseTitle?: string;
}

interface Course {
  id: number;
  title: string;
}

export function QuizExamBuilder() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [questionBank, setQuestionBank] = useState<any[]>([]);
  const [liveMonitoring, setLiveMonitoring] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'question_bank' | 'live_monitoring' | 'ai_generator'>('ai_generator');

  // Multi-step Dynamic AI Wizard States
  const [wizardCourseId, setWizardCourseId] = useState<number | ''>('');
  const [wizardIsExam, setWizardIsExam] = useState(false);
  const [wizardContentSource, setWizardContentSource] = useState<string>('entire_content');
  const [wizardMaterialText, setWizardMaterialText] = useState('');
  const [wizardCount, setWizardCount] = useState(30);
  const [wizardDifficulty, setWizardDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [wizardQuestionTypes, setWizardQuestionTypes] = useState<string[]>([
    'multiple_choice', 'true_false', 'short_answer', 'multiple_select', 'matching', 'scenario_based'
  ]);
  const [wizardTitle, setWizardTitle] = useState('');
  const [wizardPassingScore, setWizardPassingScore] = useState(70);
  const [wizardDuration, setWizardDuration] = useState(60);
  
  // Custom file upload / paste indicators
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [attachedFileName, setAttachedFileName] = useState('');

  // AI-Generated Preview List state
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<any[]>([]);
  const [wizardStep, setWizardStep] = useState<'setup' | 'preview'>('setup');
  const [wizardSearchQuery, setWizardSearchQuery] = useState('');
  const [wizardFilterDifficulty, setWizardFilterDifficulty] = useState('all');
  const [selectedQuestionsCount, setSelectedQuestionsCount] = useState<number>(0);
  
  // Managing Active Quiz Form Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null);
  
  // Manage Questions within Selected Quiz
  const [selectedQuizForQuestions, setSelectedQuizForQuestions] = useState<Quiz | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  // Live Preview Modal
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [previewAnswers, setPreviewAnswers] = useState<Record<number, string>>({});
  const [previewCurrentIdx, setPreviewCurrentIdx] = useState(0);

  // Bulk Upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkQuizId, setBulkQuizId] = useState<number | ''>('');

  // AI Generation configuration state
  const [aiTopic, setAiTopic] = useState('');
  const [aiCategory, setAiCategory] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiCount, setAiCount] = useState(5);
  const [aiType, setAiType] = useState<'all' | 'multiple_choice' | 'true_false' | 'fill_in_the_blank'>('all');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedList, setAiGeneratedList] = useState<any[]>([]);
  const [aiTargetQuizId, setAiTargetQuizId] = useState<number | ''>('');

  // Question lists filter state
  const [qbSearch, setQbSearch] = useState('');
  const [qbDifficulty, setQbDifficulty] = useState('all');

  const token = localStorage.getItem('token');

  // Fetch all starting datasets
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const qRes = await fetch('/api/quizzes', { headers });
      if (qRes.ok) {
        const qData = await qRes.json();
        setQuizzes(qData);
      }

      const cRes = await fetch('/api/courses');
      if (cRes.ok) {
        const cData = await cRes.json();
        setCourses(cData);
      }

      const qbRes = await fetch('/api/question-bank', { headers });
      if (qbRes.ok) {
        const qbData = await qbRes.json();
        setQuestionBank(qbData);
      }

      const mRes = await fetch('/api/exams/live-monitoring', { headers });
      if (mRes.ok) {
        const mData = await mRes.json();
        setLiveMonitoring(mData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Poll for monitoring update
  const handleRefreshMonitoring = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const mRes = await fetch('/api/exams/live-monitoring', { headers });
      if (mRes.ok) {
        const mData = await mRes.json();
        setLiveMonitoring(mData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quiz CRUD calls
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz) return;

    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const isNew = !editingQuiz.id;
      const url = isNew ? '/api/quizzes' : `/api/quizzes/${editingQuiz.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(editingQuiz)
      });

      if (response.ok) {
        setShowConfigModal(false);
        setEditingQuiz(null);
        await fetchData();
      } else {
        const err = await response.json();
        alert(err.message || 'Error occurred while saving!');
      }
    } catch (err) {
      alert('Network error saving quiz settings.');
    }
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!confirm('Are you absolutely sure you want to delete this quiz/exam? All questions will be permanently deleted.')) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`/api/quizzes/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicateQuiz = async (id: number) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`/api/quizzes/${id}/duplicate`, { method: 'POST', headers });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (quiz: Quiz, newStatus: 'published' | 'draft' | 'archived') => {
    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Question CRUD calls
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !selectedQuizForQuestions) return;

    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const isNew = !editingQuestion.id;
      const url = isNew ? '/api/questions' : `/api/questions/${editingQuestion.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        ...editingQuestion,
        quizId: selectedQuizForQuestions.id
      };

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowQuestionModal(false);
        setEditingQuestion(null);
        
        // Refresh detail list
        const headersGet = { 'Authorization': `Bearer ${token}` };
        const qRes = await fetch('/api/quizzes', { headers: headersGet });
        if (qRes.ok) {
          const qData = await qRes.json();
          setQuizzes(qData);
          const updatedSelected = qData.find((item: Quiz) => item.id === selectedQuizForQuestions.id);
          if (updatedSelected) {
            setSelectedQuizForQuestions(updatedSelected);
          }
        }
        await fetchData();
      } else {
        const err = await response.json();
        alert(err.message || 'Error occurred.');
      }
    } catch (err) {
      alert('Error updating question structure.');
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Permanently delete this question from assessment list?')) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        if (selectedQuizForQuestions) {
          setSelectedQuizForQuestions(prev => {
            if (!prev) return null;
            return {
              ...prev,
              questions: prev.questions?.filter(q => q.id !== id) || []
            };
          });
        }
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // AI-Assisted Question Generator
  const handleGenerateAI = async () => {
    if (!aiTopic) {
      alert('Please fill in a topic or subject segment first!');
      return;
    }
    setAiLoading(true);
    setAiGeneratedList([]);
    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const res = await fetch('/api/quizzes/generate-ai-questions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: aiTopic,
          category: aiCategory,
          difficulty: aiDifficulty,
          count: aiCount,
          type: aiType
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiGeneratedList(data.questions || []);
      } else {
        const err = await res.json();
        alert(err.message || 'Gemini system failed. Verify process.env.GEMINI_API_KEY!');
      }
    } catch (e: any) {
      alert('Failed to connect to the compilation micro-agency.');
    } finally {
      setAiLoading(false);
    }
  };

  // AI Wizard Engine Methods
  const handleWizardGenerate = async (forcedCount?: number) => {
    if (!wizardCourseId) {
      alert("Please select a target course for composition.");
      return;
    }
    setAiLoading(true);
    setWizardStep('setup');
    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const payload = {
        courseId: wizardCourseId,
        contentSource: wizardContentSource,
        materialText: wizardMaterialText,
        count: forcedCount || wizardCount,
        questionTypes: wizardQuestionTypes,
        difficulty: wizardDifficulty,
        isExam: wizardIsExam
      };

      const res = await fetch('/api/quizzes/generate-ai-questions', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errMessage = "Failed to compile content context with Gemini 3.5.";
        try {
          const detail = await res.json();
          if (detail && detail.message) {
            errMessage = detail.message;
          }
        } catch (_) {}
        throw new Error(errMessage);
      }

      const resData = await res.json();
      if (resData.success && Array.isArray(resData.questions)) {
        const mapped = resData.questions.map((q: any, idx: number) => ({
          ...q,
          id: Date.now() + idx,
          points: q.points || (q.difficulty === 'hard' ? 8 : q.difficulty === 'medium' ? 5 : 3),
          checked: false
        }));
        setAiGeneratedQuestions(mapped);
        setWizardStep('preview');
        
        // Auto-initialize title if empty
        if (!wizardTitle) {
          const course = courses.find(c => c.id === wizardCourseId);
          setWizardTitle(`${course?.title || 'Academic'} AI-Generated ${wizardIsExam ? 'Exam Template' : 'Assessment Quiz'}`);
        }
      } else {
        alert("Empty pool or format mismatch returned from Gemini. Retry generating.");
      }
    } catch (e: any) {
      console.error(e);
      alert(`AI compilation issue: ${e.message || 'Verification failed.'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleWizardPublish = async () => {
    if (!wizardCourseId || !wizardTitle) {
      alert("Please ensure Course selection and Title are provided before publishing.");
      return;
    }
    if (aiGeneratedQuestions.length === 0) {
      alert("No questions in the preview pool to publish.");
      return;
    }

    setLoading(true);
    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // 1. Create Quiz Setup
      const quizPayload = {
        courseId: parseInt(String(wizardCourseId)),
        title: wizardTitle,
        description: `AI-Generated assessment based on course framework content (${wizardContentSource}). Balanced and structured for grading.`,
        passingScore: wizardPassingScore,
        duration: wizardDuration,
        attemptsAllowed: 0,
        randomizeQuestions: true,
        randomizeAnswers: true,
        status: 'published',
        isExam: wizardIsExam,
        skipAutoSpawn: true
      };

      const quizRes = await fetch('/api/quizzes', {
        method: 'POST',
        headers,
        body: JSON.stringify(quizPayload)
      });

      if (!quizRes.ok) {
        throw new Error("Could not initialize the core exam template in DB.");
      }

      const freshQuiz = await quizRes.json();
      const newQuizId = freshQuiz.id || freshQuiz.quiz?.id;
      
      if (!newQuizId) {
        throw new Error("Created quiz template has unrecognized ID formatting.");
      }

      // 2. Inject Questions in Bulk
      const qRes = await fetch(`/api/quizzes/${newQuizId}/questions/bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ questions: aiGeneratedQuestions })
      });

      if (qRes.ok) {
        alert(`🎉 Excellent! "${wizardTitle}" has been successfully generated, reviewed, and published! It is immediately active for students.`);
        // Reset Setup and switch back to quizzes list
        setWizardStep('setup');
        setAiGeneratedQuestions([]);
        setWizardTitle('');
        setWizardMaterialText('');
        setActiveTab('quizzes');
        await fetchData();
      } else {
        alert("Failed to inject compilation pool items into the template.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Publication blocker: ${err.message || 'Try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveQuestionUp = (index: number) => {
    if (index === 0) return;
    setAiGeneratedQuestions(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const handleMoveQuestionDown = (index: number) => {
    setAiGeneratedQuestions(prev => {
      if (index === prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const handleInlineQuestionChange = (index: number, key: string, val: any) => {
    setAiGeneratedQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: val };
      return copy;
    });
  };

  const handleInlineOptionChange = (qIdx: number, optIdx: number, val: string) => {
    setAiGeneratedQuestions(prev => {
      const copy = [...prev];
      const optsCopy = [...(copy[qIdx].options || [])];
      optsCopy[optIdx] = val;
      copy[qIdx] = { ...copy[qIdx], options: optsCopy };
      return copy;
    });
  };

  const handleDeleteGeneratedQuestion = (index: number) => {
    setAiGeneratedQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRegenerateIndividualQuestion = async (index: number) => {
    const original = aiGeneratedQuestions[index];
    if (!original) return;

    // Set loading indicator on that question text
    setAiGeneratedQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], questionText: '🔄 Gemini AI is recomposing a rigorous alternate item...', loading: true };
      return copy;
    });

    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Retrieve simple context of the course/topic to substitute
      const substitutePrompt = {
        courseId: wizardCourseId,
        contentSource: 'raw_text',
        materialText: `Generate exactly 1 high-quality question replacing and fitting this sub-topic segment: "${original.topic || 'General study outline'}". Target difficulty is: "${original.difficulty || 'medium'}". Preferred type: "${original.type || 'multiple_choice'}". Make it completely unique.`,
        count: 1,
        questionTypes: [original.type || 'multiple_choice'],
        difficulty: original.difficulty || 'medium',
        isExam: wizardIsExam
      };

      const res = await fetch('/api/quizzes/generate-ai-questions', {
        method: 'POST',
        headers,
        body: JSON.stringify(substitutePrompt)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          const freshItem = data.questions[0];
          setAiGeneratedQuestions(prev => {
            const copy = [...prev];
            copy[index] = {
              ...freshItem,
              id: Date.now() + index,
              points: freshItem.points || original.points || 5,
              checked: false
            };
            return copy;
          });
          return;
        }
      }
      throw new Error();
    } catch (e) {
      // Fallback: restore original and prompt error
      setAiGeneratedQuestions(prev => {
        const copy = [...prev];
        copy[index] = { 
          ...original, 
          questionText: original.questionText + " (Composition substitute failed. Try again!)", 
          loading: false 
        };
        return copy;
      });
    }
  };

  // Bulk operation helpers
  const handleToggleCheckAll = (checked: boolean) => {
    setAiGeneratedQuestions(prev => prev.map(q => ({ ...q, checked })));
  };

  const handleToggleCheckSingle = (index: number) => {
    setAiGeneratedQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], checked: !copy[index].checked };
      return copy;
    });
  };

  const handleBulkSetPoints = (pts: number) => {
    setAiGeneratedQuestions(prev => prev.map(q => q.checked ? { ...q, points: pts } : q));
  };

  const handleBulkDeleteSelected = () => {
    const countChecked = aiGeneratedQuestions.filter(q => q.checked).length;
    if (countChecked === 0) return;
    if (confirm(`Remove all ${countChecked} selected questions from the compile pool?`)) {
      setAiGeneratedQuestions(prev => prev.filter(q => !q.checked));
    }
  };

  const handleBulkSetDifficulty = (diff: 'easy' | 'medium' | 'hard') => {
    setAiGeneratedQuestions(prev => prev.map(q => q.checked ? { ...q, difficulty: diff } : q));
  };

  const handleSaveAIGenerated = async () => {
    if (!aiTargetQuizId) {
      alert('Please choose a target assessment to append the AI-compiled questions!');
      return;
    }
    if (aiGeneratedList.length === 0) return;

    setLoading(true);
    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const res = await fetch(`/api/quizzes/${aiTargetQuizId}/questions/bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ questions: aiGeneratedList })
      });
      if (res.ok) {
        alert(`Successfully injected ${aiGeneratedList.length} questions of scientific standards!`);
        setAiGeneratedList([]);
        setAiTopic('');
        await fetchData();
      } else {
        alert('Could not append the items.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Bulk uploading parsing logic
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkQuizId || !bulkText) {
      alert('Provide target ID and some CSV content!');
      return;
    }

    try {
      // Basic CSV parser logic: "Type,QuestionText,Options,CorrectOptionIndex,CorrectAnswer"
      const lines = bulkText.split('\n').filter(l => l.trim() !== '');
      const parsedQuestions: any[] = [];
      
      lines.forEach((line, index) => {
        if (index === 0 && line.toLowerCase().includes('type')) return; // skip header
        
        const cols = line.split(';');
        if (cols.length >= 3) {
          const type = cols[0]?.trim() || 'multiple_choice';
          const text = cols[1]?.trim() || 'Question text';
          const optsText = cols[2]?.trim() || '';
          const opts = optsText ? optsText.split(',').map(o => o.trim()) : [];
          const correctIdx = cols[3] ? parseInt(cols[3].trim()) : 0;
          const correctAns = cols[4]?.trim() || '';

          parsedQuestions.push({
            type,
            questionText: text,
            options: opts,
            correctOptionIndex: correctIdx,
            correctAnswer: correctAns,
            difficulty: 'medium',
            topic: 'Bulk imported'
          });
        }
      });

      if (parsedQuestions.length === 0) {
        alert('Could not parse any active columns. Use format: type;questionText;optionA,optionB,optionC;correctIndex;correctAnswer');
        return;
      }

      setLoading(true);
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const res = await fetch(`/api/quizzes/${bulkQuizId}/questions/bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ questions: parsedQuestions })
      });

      if (res.ok) {
        alert(`Successfully bulk-imported ${parsedQuestions.length} records!`);
        setShowBulkUpload(false);
        setBulkText('');
        await fetchData();
      } else {
        alert('Bulk submission failed.');
      }
    } catch (err) {
      alert('Error parsing CSV upload structure.');
    } finally {
      setLoading(false);
    }
  };

  const filteredQb = questionBank.filter(q => {
    const searchMatch = !qbSearch || q.questionText.toLowerCase().includes(qbSearch.toLowerCase()) || (q.topic && q.topic.toLowerCase().includes(qbSearch.toLowerCase()));
    const diffMatch = qbDifficulty === 'all' || q.difficulty === qbDifficulty;
    return searchMatch && diffMatch;
  });

  return (
    <div className="space-y-6">
      {/* Visual Hub Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-radial from-slate-900 to-slate-950 rounded-2xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono tracking-widest uppercase rounded-full">
              Enterprise Suite
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-emerald-400" />
            Quiz & Exam Engine
          </h2>
          <p className="text-slate-400 text-xs max-w-xl">
            Configure assessments logic, manage the centralized Question Bank, build with Gemini AI, and monitor student testing sessions in real-time.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 z-10">
          <button
            id="builder_add_quiz_btn"
            onClick={() => {
              setActiveTab('ai_generator');
            }}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white hover:text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md border border-indigo-500/35"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" /> ✨ AI Academic Compiler Active
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'quizzes' 
              ? 'border-b-2 border-emerald-600 text-slate-900 bg-emerald-50/50 rounded-t-lg' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Active Quizzes & Exams ({quizzes.length})
        </button>
        <button
          onClick={() => setActiveTab('question_bank')}
          className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'question_bank' 
              ? 'border-b-2 border-emerald-600 text-slate-900 bg-emerald-50/50 rounded-t-lg' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Question Bank ({questionBank.length})
        </button>
         <button
          onClick={() => setActiveTab('live_monitoring')}
          className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'live_monitoring' 
              ? 'border-b-2 border-emerald-600 text-slate-900 bg-emerald-50/50 rounded-t-lg' 
              : 'text-slate-505 hover:text-slate-950'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500" />
          Live Monitoring Panel
        </button>
        <button
          onClick={() => setActiveTab('ai_generator')}
          className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'ai_generator' 
              ? 'border-b-2 border-emerald-600 text-slate-900 bg-emerald-50/50 rounded-t-lg font-black' 
              : 'text-indigo-600 hover:text-indigo-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          ✨ AI Automatic Generator
        </button>
      </div>

      {/* PANES CONTENT */}
      {activeTab === 'quizzes' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main List */}
          <div className="xl:col-span-2 space-y-4">
            {loading && <p className="text-xs text-slate-400 p-4 animate-pulse">Synchronizing assessments databases...</p>}
            
            {quizzes.length === 0 ? (
              <div className="text-center bg-white p-8 rounded-xl border border-slate-200">
                <p className="text-slate-500 text-xs text-balance">
                  No active assessments or tests created. Generate one automatically using the <strong>✨ AI Automatic Generator</strong> tab!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {quizzes.map((q) => (
                  <div 
                    key={q.id} 
                    className={`bg-white p-5 rounded-xl border transition shadow-sm hover:shadow ${
                      selectedQuizForQuestions?.id === q.id 
                        ? 'border-2 border-emerald-500' 
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                            q.isExam ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-650'
                          }`}>
                            {q.isExam ? 'Comprehensive Exam' : 'Module Quiz'}
                          </span>
                          
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                            q.status === 'published' ? 'bg-emerald-100 text-emerald-700' : q.status === 'archived' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {q.status}
                          </span>

                          <span className="text-[11px] text-slate-400 font-mono">
                            Course: {q.courseTitle}
                          </span>
                        </div>
                        
                        <h3 className="text-base font-black text-slate-900">{q.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 max-w-xl">{q.description || 'No evaluation metadata supplied.'}</p>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400 text-[11px] font-mono">
                          <span className="flex items-center gap-1 text-slate-600 font-bold">🎯 Threshold: {q.passingScore}%</span>
                          <span className="flex items-center gap-1">⏱️ Duration: {q.duration || 60} mins</span>
                          <span className="flex items-center gap-1">📝 Questions: {q.questionsCount || 0}</span>
                          <span className="flex items-center gap-1">🔄 Attempts Limit: {q.attemptsAllowed === 0 ? 'Unlimited' : q.attemptsAllowed}</span>
                        </div>
                      </div>

                      {/* Interactive Actions Grid */}
                      <div className="flex flex-wrap gap-2 sm:self-center shrink-0">
                        <button
                          onClick={() => setSelectedQuizForQuestions(q)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Manage Questions"
                        >
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                          Questions ({q.questionsCount})
                        </button>
                        
                        <button
                          onClick={() => {
                            setPreviewQuiz(q);
                            setPreviewCurrentIdx(0);
                            setPreviewAnswers({});
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                          title="Live Exam Preview before publishing"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingQuiz({ ...q });
                            setShowConfigModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                          title="Edit settings"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDuplicateQuiz(q.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                          title="Duplicate Exam Template"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {q.status === 'published' ? (
                          <button
                            onClick={() => handleToggleStatus(q, 'draft')}
                            className="p-1.5 text-amber-650 hover:text-amber-800 bg-amber-50 rounded-lg transition text-[11px] font-bold"
                            title="Unpublish Quiz"
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(q, 'published')}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 rounded-lg transition text-[11px] font-bold"
                            title="Publish Quiz"
                          >
                            Publish
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteQuiz(q.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 rounded-lg transition"
                          title="Delete permanently"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Area: Live Questions Drawer matching selected quiz */}
          <div className="space-y-6">
            {selectedQuizForQuestions ? (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold tracking-wider">Configure Questionnaire</span>
                    <h4 className="font-extrabold text-slate-900 text-sm md:text-base line-clamp-1">{selectedQuizForQuestions.title}</h4>
                  </div>
                  <button 
                    onClick={() => setSelectedQuizForQuestions(null)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                  🛡️ Questions in this curriculum are restricted to auto-generation to secure high precision and avoid subjective content errors. Use the AI Assistant below to compose target questions.
                </div>

                {/* AI generated prompt drawer */}
                <div className="p-3.5 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-100 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <h5 className="text-[12px] font-extrabold text-indigo-950">AI-Assisted Question Builder</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Let Gemini compose test materials about specific course segments. Results sync into this test template.</p>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">Sub-Topic / Prompt Keyword</label>
                      <input
                        type="text"
                        placeholder="e.g. React hooks memoization"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-xs mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Count</label>
                        <select
                          value={aiCount}
                          onChange={(e) => setAiCount(parseInt(e.target.value))}
                          className="w-full px-1.5 py-1.5 border border-slate-205 roundedbg bg-white text-[11px]"
                        >
                          <option value={3}>3</option>
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={15}>15</option>
                          <option value={30}>30 Questions</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block">Type</label>
                        <select
                          value={aiType}
                          onChange={(e) => setAiType(e.target.value as any)}
                          className="w-full px-1.5 py-1.5 border border-slate-205 roundedbg bg-white text-[11px]"
                        >
                          <option value="all">Mix All</option>
                          <option value="multiple_choice">MCQ</option>
                          <option value="true_false">True/False</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAiTargetQuizId(selectedQuizForQuestions.id);
                        handleGenerateAI();
                      }}
                      disabled={aiLoading}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white rounded text-[11px] font-bold transition flex justify-center items-center gap-1 cursor-pointer"
                    >
                      {aiLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Composing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> Generate using Gemini AI
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Questions List ({selectedQuizForQuestions.questions?.length || 0})</h5>
                  
                  {selectedQuizForQuestions.questions?.length === 0 ? (
                    <p className="text-slate-400 text-xs p-3 bg-slate-50 rounded border text-center">No questions added yet. Use the manual form or AI assistant above.</p>
                  ) : (
                    selectedQuizForQuestions.questions?.map((q, idx) => (
                      <div key={q.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-extrabold text-slate-700">Q{idx+1}: {q.type.replace('_', ' ')}</span>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingQuestion({ ...q });
                                setShowQuestionModal(true);
                              }}
                              className="text-slate-500 hover:text-slate-900 border border-slate-200 bg-white p-1 rounded"
                              title="Edit Question"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-rose-600 hover:text-rose-800 border border-rose-100 bg-white p-1 rounded"
                              title="Delete Question"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-650 text-xs leading-snug line-clamp-2">{q.questionText}</p>
                        
                        {Array.isArray(q.options) && q.options.length > 0 && (
                          <div className="text-[10px] text-slate-400 italic line-clamp-1">
                            Choices: {q.options.join(' | ')}
                          </div>
                        )}
                        <p className="text-[10px] font-semibold text-emerald-700">Ans: {q.options?.[q.correctOptionIndex] || q.correctAnswer}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 text-center text-xs p-8 text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                Select a quiz from list to edit its syllabus questions, load CSV templates, or utilize Gemini composition.
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUESTION BANK PANE */}
      {activeTab === 'question_bank' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-950">Centralized Question Repository</h3>
              <p className="text-slate-500 text-xs text-slate-400">All questions across exams/quizzes catalog. Duplicate and port them to various modules dynamically.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter by keyword..."
                  value={qbSearch}
                  onChange={(e) => setQbSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs w-48 shadow-inner"
                />
              </div>

              <select
                value={qbDifficulty}
                onChange={(e) => setQbDifficulty(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-205 rounded-lg text-xs"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="max-h-160 overflow-y-auto space-y-3.5 pr-1">
            {filteredQb.length === 0 ? (
              <p className="text-slate-400 text-xs p-6 bg-slate-50 border border-dashed border-slate-200 rounded text-center">No questions found in this bank.</p>
            ) : (
              filteredQb.map((q) => (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 hover:border-emerald-500/30 rounded-xl space-y-2 text-xs transition">
                  <div className="flex justify-between items-center bg-slate-200/50 p-2 rounded-lg text-[11px] text-slate-650">
                    <span className="font-bold flex items-center gap-1">🏷️ Topic: {q.topic || 'General'}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                      q.difficulty === 'hard' ? 'bg-rose-100 text-rose-700' : q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {q.difficulty}
                    </span>
                    <span className="text-slate-450 text-[10px]">Associated Exam: {q.quizTitle}</span>
                  </div>

                  <p className="font-extrabold text-slate-900 pt-1 text-xs md:text-sm">{q.questionText}</p>
                  
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-w-xl text-slate-700 mt-1">
                      {q.options.map((opt: string, oi: number) => (
                        <div key={oi} className="flex gap-2 items-center px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-[11px]">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-mono text-[10px] text-slate-500 font-black">{String.fromCharCode(65+oi)}</span>
                          <span className="truncate">{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-emerald-750 font-bold bg-emerald-50/40 p-2 rounded border border-emerald-100/50 mt-1 max-w-lg">
                    ✅ Evaluated Solution Choice: <span className="font-mono">{q.options?.[q.correctOptionIndex] || q.correctAnswer}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* LIVE MONITORING PANE */}
      {activeTab === 'live_monitoring' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                Active Examination Inactivity & Session Monitor
              </h3>
              <p className="text-slate-500 text-xs">Verify students currently solving exams or assess historic submit times of exam answer sheets.</p>
            </div>

            <button
              onClick={handleRefreshMonitoring}
              className="px-4 py-2 bg-slate-900 font-bold text-white text-xs hover:bg-slate-800 hover:text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Screen
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-slate-100 text-slate-700 text-[11px] font-mono uppercase border-b border-rose-100">
                <tr>
                  <th className="p-4 font-bold">Student Identity</th>
                  <th className="p-4 font-bold">Assessment / Exam</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Score Sheet</th>
                  <th className="p-4 font-bold">Time Started / Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-650 bg-white">
                {liveMonitoring.map((m: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/85 transition">
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-black text-slate-900">{m.studentName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{m.studentEmail}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">{m.examTitle}</p>
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                          m.isExam ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {m.isExam ? 'Exam' : 'Quiz'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {m.status === 'ongoing' ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-300 rounded-full animate-pulse flex items-center gap-1 max-w-fit">
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                          Solving
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-full border border-slate-200 flex items-center gap-1 max-w-fit">
                          Finished
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {m.status === 'ongoing' ? (
                        <p className="text-slate-405 leading-snug">Answers auto-saved ({m.correctCount} mapped)</p>
                      ) : (
                        <div className="space-y-0.5">
                          <p className={`font-black text-xs ${m.passed ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {m.score}% Achieved
                          </p>
                          <p className="text-[10px] text-slate-400">{m.correctCount} / {m.totalCount} Correct Choices</p>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {m.status === 'ongoing' ? (
                        <p className="font-mono text-rose-600 font-black text-xs text-sm">{m.timeRemaining || 'Minutes remaining'}</p>
                      ) : (
                        <p className="font-mono text-[10px] text-slate-400">{new Date(m.timestamp).toLocaleString()}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE AI QUIZ & EXAM GENERATOR WIZARD */}
      {activeTab === 'ai_generator' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-2 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles className="w-36 h-36 text-white" />
            </div>
            <div className="relative z-10 space-y-1">
              <span className="px-2.5 py-0.5 bg-indigo-600/35 border border-indigo-500 rounded text-[10px] font-mono tracking-widest font-black uppercase text-indigo-300">
                Cognitive Studio
              </span>
              <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                ✨ Core AI Academic Compiler
              </h3>
              <p className="text-slate-405 text-xs max-w-2xl leading-relaxed">
                Ingest textbook chapters, course syllabus frameworks, video scripts, course descriptions, or pasted YouTube transcripts. Gemini will automatically compose rigorous, highly balanced quizzes or examinations in seconds.
              </p>
            </div>
          </div>

          {wizardStep === 'setup' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Configuration Panel */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-205 shadow-sm space-y-5">
                <h4 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Settings className="w-5 h-5 text-emerald-600" />
                  1. Setup Curriculum & Composition Goals
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Select Course */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-700 block">Target Syllabus Course</label>
                    <select
                      value={wizardCourseId}
                      onChange={(e) => setWizardCourseId(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-350 bg-white rounded-lg focus:outline-emerald-650"
                    >
                      <option value="">-- Choose Target syllabus --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Assessment Type */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-700 block">Academic Output Sizing</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setWizardIsExam(false)}
                        className={`py-2 px-3 border rounded-lg text-center font-bold font-mono transition ${
                          !wizardIsExam
                            ? 'bg-emerald-55 border-emerald-500 text-emerald-800'
                            : 'border-slate-300 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        Module Quiz
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardIsExam(true)}
                        className={`py-2 px-3 border rounded-lg text-center font-bold font-mono transition ${
                          wizardIsExam
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-800'
                            : 'border-slate-300 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        Rigorous Exam
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Content Source Selection */}
                  <div className="space-y-1 md:col-span-1">
                    <label className="font-extrabold text-slate-700 block">Curriculum Source Ingest</label>
                    <select
                      value={wizardContentSource}
                      onChange={(e) => setWizardContentSource(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-350 bg-white rounded-lg focus:outline-emerald-650 mt-1"
                    >
                      <option value="entire_content">Entire Course Content</option>
                      <option value="description">Course Descriptions</option>
                      <option value="modules">Module Lecture Guidelines</option>
                      <option value="lessons">Lesson Titles Outline</option>
                      <option value="uploaded_docs">Uploaded PDFs / Notes</option>
                      <option value="videos_transcript">Lesson Video Outlines</option>
                      <option value="youtube_transcript">YouTube Video Transcripts</option>
                      <option value="raw_text">Direct Manual Material Pasting</option>
                    </select>
                  </div>

                  {/* Count */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-705 block">Quantity of Questions</label>
                    <select
                      value={wizardCount}
                      onChange={(e) => setWizardCount(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-350 bg-white rounded-lg focus:outline-emerald-650 mt-1"
                    >
                      <option value={10}>10 Questions</option>
                      <option value={20}>20 Questions</option>
                      <option value={30}>30 Questions (Default)</option>
                      <option value={50}>50 Questions</option>
                      <option value={100}>100 Questions</option>
                    </select>
                  </div>

                  {/* Difficulty level */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-700 block">Integrity & Difficulty</label>
                    <select
                      value={wizardDifficulty}
                      onChange={(e) => setWizardDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-350 bg-white rounded-lg focus:outline-emerald-650 mt-1"
                    >
                      <option value="easy">Easy Recall</option>
                      <option value="medium">Medium Analysis</option>
                      <option value="hard">Hard Integrity Critical</option>
                      <option value="mixed">Perfect Mixed Distributions</option>
                    </select>
                  </div>
                </div>

                {/* Question Types Checkbox array */}
                <div className="space-y-2 text-xs">
                  <label className="font-extrabold text-slate-700 block">Exclude / Include Target Question Types</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    {[
                      { value: 'multiple_choice', label: 'Multiple Choice (MCQ)' },
                      { value: 'multiple_select', label: 'Select Multiple (Checkboxes)' },
                      { value: 'true_false', label: 'True / False Statement' },
                      { value: 'fill_in_the_blank', label: 'Fill in Blanks' },
                      { value: 'matching', label: 'Pair Matching Items' },
                      { value: 'short_answer', label: 'Short Written Answers' },
                      { value: 'scenario_based', label: 'High-Integrity Scenario Based' }
                    ].map((t) => {
                      const isChecked = wizardQuestionTypes.includes(t.value);
                      return (
                        <label key={t.value} className="flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setWizardQuestionTypes(prev => prev.filter(x => x !== t.value));
                              } else {
                                setWizardQuestionTypes(prev => [...prev, t.value]);
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span>{t.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* REFERENCE MATERIALS BOX (Supporting text pasting / transcripts files load) */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold text-slate-700 block">
                      Textbook Content, Custom PDF text copy, or Video Script/Transcript Attachment
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Pasting accepts unlimited words</span>
                  </div>

                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0];
                        setAttachedFileName(file.name);
                        setWizardMaterialText(prev => prev + `\n\n[Ingested Textbook Context from File: ${file.name}]\n...`);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-4 transition ${
                      isDraggingFile 
                        ? 'border-emerald-500 bg-emerald-50/40' 
                        : 'border-slate-350 hover:border-slate-400 bg-slate-50/20'
                    }`}
                  >
                    <textarea
                      rows={6}
                      value={wizardMaterialText}
                      onChange={(e) => setWizardMaterialText(e.target.value)}
                      placeholder="Paste PDF chapters, transcription of youtube guides, lectures worksheets, or customized study notes here..."
                      className="w-full bg-transparent border-0 focus:ring-0 p-0 text-slate-700 text-xs placeholder:text-slate-400 focus:outline-none focus:border-transparent resize-y"
                    />

                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5 mt-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <FileUp className="w-4 h-4 text-slate-500" />
                        <span>Drag & Drop PDF, DOCX, or video files to simulate ingestion</span>
                      </div>

                      {attachedFileName && (
                        <span className="bg-emerald-50 border border-emerald-305 text-emerald-800 font-mono px-2 py-0.5 rounded font-bold">
                          ✓ {attachedFileName} Loaded Successfully
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleWizardGenerate(30)}
                    disabled={aiLoading || !wizardCourseId}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-205 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4" /> Match 30 Items (Quick)
                  </button>

                  <button
                    onClick={() => handleWizardGenerate()}
                    disabled={aiLoading || !wizardCourseId}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-emerald-600 hover:text-slate-950 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md hover:translate-y-[-1px]"
                  >
                    {aiLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing context & compiling Q&A...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span>✨ Generate {wizardCount} Questions</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Informative Wizard Guide */}
              <div className="bg-gradient-to-b from-slate-50 to-indigo-50/20 p-6 rounded-2xl border border-slate-205 shadow-sm space-y-4">
                <h4 className="text-sm font-extrabold text-indigo-950 flex items-center gap-1">
                  <Clock className="w-4.5 h-4.5 text-indigo-600" />
                  Syllabus Calibration Guidelines
                </h4>

                <div className="space-y-4 text-xs text-slate-600">
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800">1. Context Matching</p>
                    <p className="leading-relaxed text-[11px]">AI matches lesson description headers with ingested textbooks automatically, avoiding out-of-syllabus items.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800">2. Integrity Checking</p>
                    <p className="leading-relaxed text-[11px]">Correct answers are verified using secondary reasoning loops, guaranteeing clean student scoring feedback sheet.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800">3. Scenario Builder</p>
                    <p className="leading-relaxed text-[11px]">If including scenario-based questions, Gemini crafts high-fidelity practical workflows (e.g. debugging codes, diagnosing patients, matching financial boards) setting realistic evaluations.</p>
                  </div>

                  <div className="bg-slate-900/5 p-3 rounded-lg border border-slate-200 text-[10px] space-y-1">
                    <p className="font-extrabold text-slate-700 uppercase tracking-widest">Generative Steps</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Configure sources</li>
                      <li>Extract key topics & content terms</li>
                      <li>Draft academic questions pool</li>
                      <li>Perform preview & inline corrections</li>
                      <li>Reorder items logically</li>
                      <li>Select grading and timing</li>
                      <li>Publish assessment to student lists</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PREVIEW PAGE & REFINE STAGE (4 & 5) */
            <div className="space-y-4">
              {/* Header control and filter bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-1.5">
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                    2. AI Generator Editor & Preview Stage
                  </h4>
                  <p className="text-slate-500 text-xs">
                    Review and modify the {aiGeneratedQuestions.length} compiled items. Click any text area to make inline modifications.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      if (confirm("Reset compilation pool? You will lose inline adjustments.")) {
                        setWizardStep('setup');
                        setAiGeneratedQuestions([]);
                      }
                    }}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition"
                  >
                    Back to setup
                  </button>

                  <button
                    onClick={() => handleWizardGenerate()}
                    disabled={aiLoading}
                    className="px-4 py-2 bg-slate-900 text-white hover:bg-emerald-600 hover:text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-Draft Entire List
                  </button>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Filters & Publish details setter card */}
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-sm space-y-4">
                    <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-rose-50/50 pb-2 flex items-center gap-1">
                      <Settings className="w-4 h-4 text-indigo-600" />
                      Grading & Publishing Rules
                    </h5>

                    <div className="space-y-3.5 text-xs">
                      {/* Name of Assessment */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700 block">Assessment / Exam Title</label>
                        <input
                          type="text"
                          required
                          value={wizardTitle}
                          onChange={(e) => setWizardTitle(e.target.value)}
                          placeholder="e.g. Advanced Fluid Mechanics Term Assessment"
                          className="w-full px-3 py-2 border border-slate-350 rounded-lg focus:outline-emerald-650"
                        />
                      </div>

                      {/* Passing score threshold */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-750 block">Passing Grading Threshold (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={wizardPassingScore}
                          onChange={(e) => setWizardPassingScore(parseInt(e.target.value) || 70)}
                          className="w-full px-3 py-2 border border-slate-350 rounded-lg focus:outline-emerald-650 font-mono font-bold"
                        />
                      </div>

                      {/* Duration time */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700 block">Assessment Countdown (minutes)</label>
                        <select
                          value={wizardDuration}
                          onChange={(e) => setWizardDuration(parseInt(e.target.value) || 60)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-emerald-650 font-bold"
                        >
                          <option value={15}>15 Minutes</option>
                          <option value={30}>30 Minutes</option>
                          <option value={45}>45 Minutes (Short Exam)</option>
                          <option value={60}>60 Minutes (Standard)</option>
                          <option value={90}>90 Minutes (Rigorous)</option>
                          <option value={120}>120 Minutes (Final term)</option>
                        </select>
                      </div>

                      <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-[11px] leading-relaxed text-indigo-950 space-y-1">
                        <p className="font-black">💡 Instant Student Issuance</p>
                        <p className="text-slate-500">Upon scoring higher than the threshold, dynamic QR portfolio certificates are generated and issued to the student's portfolio immediately.</p>
                      </div>

                      <button
                        onClick={handleWizardPublish}
                        disabled={loading || aiGeneratedQuestions.length === 0}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl transition cursor-pointer shadow flex justify-center items-center gap-1.5"
                      >
                        🚀 Save and Publish Assessment
                      </button>
                    </div>
                  </div>

                  {/* Pool Filter Panel */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-sm space-y-3.5">
                    <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-rose-50/50 pb-2">
                      Search & Filter Preview Pool
                    </h5>

                    <div className="space-y-2.5 text-xs">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search questions list..."
                          value={wizardSearchQuery}
                          onChange={(e) => setWizardSearchQuery(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-slate-350 bg-white rounded-lg text-xs w-full focus:outline-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-505 block">Filter difficulty level</label>
                        <select
                          value={wizardFilterDifficulty}
                          onChange={(e) => setWizardFilterDifficulty(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                        >
                          <option value="all">All Difficulties</option>
                          <option value="easy">Easy Recall</option>
                          <option value="medium">Medium Analysis</option>
                          <option value="hard">Hard Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Interactive list stage */}
                <div className="lg:col-span-2 space-y-3">
                  {/* Bulk Actions Banner */}
                  <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-850 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={aiGeneratedQuestions.length > 0 && aiGeneratedQuestions.every(q => q.checked)}
                        onChange={(e) => handleToggleCheckAll(e.target.checked)}
                        className="rounded text-slate-900 focus:ring-slate-500 w-4 h-4 bg-slate-850 border-slate-700"
                      />
                      <span className="font-bold">Select All Items ({aiGeneratedQuestions.filter(q => q.checked).length} selected)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Set points */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBulkSetPoints(parseInt(e.target.value));
                            e.target.value = '';
                          }
                        }}
                        className="px-2 py-1 bg-slate-800 border border-slate-650 rounded text-[11px] font-mono text-slate-205"
                      >
                        <option value="">Set Points...</option>
                        <option value="2">2 Pts</option>
                        <option value="3">3 Pts</option>
                        <option value="5">5 Pts</option>
                        <option value="10">10 Pts</option>
                      </select>

                      {/* Set difficulty */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBulkSetDifficulty(e.target.value as any);
                            e.target.value = '';
                          }
                        }}
                        className="px-2 py-1 bg-slate-800 border border-slate-650 rounded text-[11px] font-mono text-slate-205"
                      >
                        <option value="">Set Difficulty...</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>

                      {/* Delete */}
                      <button
                        onClick={handleBulkDeleteSelected}
                        disabled={aiGeneratedQuestions.filter(q => q.checked).length === 0}
                        className="px-3 py-1 bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800 rounded font-bold transition flex items-center gap-1"
                      >
                        <Trash className="w-3.5 h-3.5" /> Wipe Selected
                      </button>
                    </div>
                  </div>

                  {/* Render list of filtered questions */}
                  <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                    {aiGeneratedQuestions
                      .map((q, idx) => ({ ...q, originalIdx: idx }))
                      .filter(q => {
                        const matchesQuery = q.questionText.toLowerCase().includes(wizardSearchQuery.toLowerCase()) || 
                                             (q.topic && q.topic.toLowerCase().includes(wizardSearchQuery.toLowerCase()));
                        const matchesDiff = wizardFilterDifficulty === 'all' || q.difficulty === wizardFilterDifficulty;
                        return matchesQuery && matchesDiff;
                      })
                      .map((q, filteredIndex, arr) => {
                        const origIdx = q.originalIdx;
                        return (
                          <div 
                            key={q.id || origIdx} 
                            className={`p-5 bg-white border rounded-xl space-y-4 transition-all shadow-sm ${
                              q.checked ? 'border-indigo-400 bg-indigo-50/5' : 'border-slate-205 hover:border-slate-350'
                            }`}
                          >
                            {/* Question meta line */}
                            <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-slate-100 pb-2 text-slate-600 font-mono">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!q.checked}
                                  onChange={() => handleToggleCheckSingle(origIdx)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 border-slate-300"
                                />
                                <span className="font-extrabold text-slate-800">ITEM #{origIdx + 1}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest ${
                                  q.difficulty === 'hard' 
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                    : q.difficulty === 'easy' 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                      : 'bg-slate-100 text-slate-650 border border-slate-200'
                                }`}>
                                  {q.difficulty}
                                </span>
                                <span className="text-indigo-600 uppercase font-black tracking-wider text-[9px]">
                                  {q.type.replace('_', ' ')}
                                </span>
                              </div>

                              {/* Arrange controls */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={origIdx === 0}
                                  onClick={() => handleMoveQuestionUp(origIdx)}
                                  className="p-1 hover:bg-slate-100 text-slate-500 rounded disabled:opacity-30 transition"
                                  title="Move Up"
                                >
                                  <ChevronRight className="w-4 h-4 rotate-270" />
                                </button>
                                <button
                                  type="button"
                                  disabled={origIdx === aiGeneratedQuestions.length - 1}
                                  onClick={() => handleMoveQuestionDown(origIdx)}
                                  className="p-1 hover:bg-slate-100 text-slate-505 rounded disabled:opacity-30 transition"
                                  title="Move Down"
                                >
                                  <ChevronRight className="w-4 h-4 rotate-90" />
                                </button>

                                {/* Direct Single AI replacement */}
                                <button
                                  type="button"
                                  onClick={() => handleRegenerateIndividualQuestion(origIdx)}
                                  disabled={q.loading}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-black rounded text-[10px] border border-indigo-200 flex items-center gap-1 transition"
                                  title="Re-fetch completely unique substitute using Gemini AI"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                  AI Replace
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteGeneratedQuestion(origIdx)}
                                  className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition"
                                  title="Delete question permanently"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Question text textarea */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Question Description text</label>
                              <textarea
                                value={q.questionText || ''}
                                rows={2}
                                onChange={(e) => handleInlineQuestionChange(origIdx, 'questionText', e.target.value)}
                                className="w-full text-slate-900 border border-slate-205 rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-emerald-500 bg-slate-50/20"
                                placeholder="Edit question textual context..."
                              />
                            </div>

                            {/* Choice Options list (MCQ / Select Multiple / Scenario) */}
                            {Array.isArray(q.options) && q.options.length > 0 && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Configure Distractors and Answers Choices</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  {q.options.map((opt: string, optIdx: number) => {
                                    // check if this is the correct choice option index
                                    const isCorrect = Array.isArray(q.correctOptionIndex) 
                                      ? q.correctOptionIndex.includes(optIdx)
                                      : q.correctOptionIndex === optIdx;
                                    return (
                                      <div key={optIdx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (q.type === 'multiple_select') {
                                              let curr = Array.isArray(q.correctOptionIndex) ? [...q.correctOptionIndex] : [];
                                              if (curr.includes(optIdx)) {
                                                curr = curr.filter(i => i !== optIdx);
                                              } else {
                                                curr.push(optIdx);
                                              }
                                              handleInlineQuestionChange(origIdx, 'correctOptionIndex', curr);
                                            } else {
                                              handleInlineQuestionChange(origIdx, 'correctOptionIndex', optIdx);
                                            }
                                          }}
                                          className={`w-5 h-5 rounded-full flex items-center justify-center border font-extrabold text-[10px] transition ${
                                            isCorrect 
                                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                                              : 'bg-white border-slate-350 text-slate-500 hover:border-slate-500'
                                          }`}
                                        >
                                          {String.fromCharCode(65 + optIdx)}
                                        </button>
                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) => handleInlineOptionChange(origIdx, optIdx, e.target.value)}
                                          className="bg-transparent border-0 focus:ring-0 p-0 text-slate-700 text-xs w-full focus:outline-none"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Additional controls: corrective answers & explanations */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 block">Keyword SubTopic</label>
                                <input
                                  type="text"
                                  value={q.topic || ''}
                                  onChange={(e) => handleInlineQuestionChange(origIdx, 'topic', e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-md font-bold"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 block">Grading Points weight</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={q.points || 5}
                                  onChange={(e) => handleInlineQuestionChange(origIdx, 'points', parseInt(e.target.value) || 5)}
                                  className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-md font-mono text-xs font-black text-indigo-700"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 block">Standard Match String Solution</label>
                                <input
                                  type="text"
                                  value={q.correctAnswer || ''}
                                  onChange={(e) => handleInlineQuestionChange(origIdx, 'correctAnswer', e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-md text-xs font-semibold text-emerald-800"
                                  placeholder="Solution target or index array text representation"
                                />
                              </div>
                            </div>

                            {/* Explanation */}
                            <div className="space-y-1 text-xs">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Detailed Solution Explanation (visible to student upon grading review)</label>
                              <input
                                type="text"
                                value={q.explanation || ''}
                                onChange={(e) => handleInlineQuestionChange(origIdx, 'explanation', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-250 bg-slate-50/50 rounded-lg text-xs text-slate-650 focus:outline-emerald-500"
                                placeholder="Explain why correct and why other choices fail..."
                              />
                            </div>
                          </div>
                        );
                      })}

                    {aiGeneratedQuestions.length === 0 && (
                      <div className="text-center p-8 bg-white border rounded-xl">
                        <p className="text-slate-405 text-xs">All questions have been cleared or discarded form compiling stage.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI GENERATED DRAWER LIST DISPLAY (Saves generated questions into the bank) */}
      {aiGeneratedList.length > 0 && (
        <div className="bg-indigo-950 text-white p-6 rounded-2xl border border-indigo-800 space-y-4 shadow-xl z-20">
          <div className="flex justify-between items-center border-b border-indigo-900 pb-3">
            <div className="space-y-1">
              <h4 className="text-base font-black text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Gemini AI-Generated Exam Questions Catalog
              </h4>
              <p className="text-xs text-slate-300">Generated {aiGeneratedList.length} questions tailored for high academic integrity. Choose test target to save.</p>
            </div>
            
            <button
              onClick={() => setAiGeneratedList([])}
              className="text-slate-400 hover:text-white text-xs border border-indigo-900 p-1 rounded"
            >
              Discard Generated
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-3 pr-1 text-slate-200 text-xs">
            {aiGeneratedList.map((item, index) => (
              <div key={index} className="p-3 bg-indigo-900/60 border border-indigo-805 rounded-xl space-y-1.5">
                <p className="font-bold text-white">Q{index + 1}: ({item.type}) {item.questionText}</p>
                {item.options && item.options.length > 0 && (
                  <p className="text-[10px] text-slate-300 italic">Options: {item.options.join(', ')}</p>
                )}
                <p className="text-[11px] font-semibold text-emerald-400">Correct Answer: {item.options?.[item.correctOptionIndex] || item.correctAnswer}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 pt-3 border-t border-indigo-900">
            <div className="w-full sm:max-w-xs space-y-1 text-slate-300">
              <label className="text-[10px] text-indigo-300 font-bold uppercase block dark:text-gray-300">Target Quiz/Exam</label>
              <select
                value={aiTargetQuizId}
                onChange={(e) => setAiTargetQuizId(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-indigo-800 bg-indigo-900 text-white rounded text-xs"
              >
                <option value="">-- Choose Quiz target to inject --</option>
                {quizzes.map(qz => (
                  <option key={qz.id} value={qz.id}>{qz.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSaveAIGenerated}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 hover:text-white text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
            >
              <Check className="w-4 h-4" /> Save Compiled Questions
            </button>
          </div>
        </div>
      )}

      {/* CONFIG DIALOG MODAL (Add/Edit Quiz Settings) */}
      {showConfigModal && editingQuiz && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-950 flex items-center gap-1">
                <Settings className="w-5 h-5 text-emerald-600" />
                {editingQuiz.id ? 'Edit Quiz & Exam Settings' : 'Create New Assessment / Exam Template'}
              </h3>
              <button 
                onClick={() => {
                  setShowConfigModal(false);
                  setEditingQuiz(null);
                }}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block">Parent Course</label>
                  <select
                    value={editingQuiz.courseId}
                    onChange={(e) => setEditingQuiz(prev => ({ ...prev, courseId: parseInt(e.target.value) }))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-emerald-650"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block">Assessment Type</label>
                  <select
                    value={editingQuiz.isExam ? 'exam' : 'quiz'}
                    onChange={(e) => setEditingQuiz(prev => ({ ...prev, isExam: e.target.value === 'exam' }))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-emerald-650"
                  >
                    <option value="quiz">Module Quiz</option>
                    <option value="exam">Comprehensive Exam Template</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block">Quiz / Exam Title</label>
                <input
                  type="text"
                  required
                  value={editingQuiz.title || ''}
                  onChange={(e) => setEditingQuiz(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Propositional Logic Gates Exam"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-650"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block">Description & Instructions</label>
                <textarea
                  value={editingQuiz.description || ''}
                  onChange={(e) => setEditingQuiz(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide exam criteria and student behavioral requirements..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-650 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block">Passing score rate (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={editingQuiz.passingScore || ''}
                    onChange={(e) => setEditingQuiz(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-650"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block">Allow Attempts count (0 = unlimited)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingQuiz.attemptsAllowed !== undefined ? editingQuiz.attemptsAllowed : 0}
                    onChange={(e) => setEditingQuiz(prev => ({ ...prev, attemptsAllowed: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-650"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 font-mono">
                  <label className="font-extrabold text-slate-700 block">Exam Duration Time (minutes)</label>
                  <select
                    value={editingQuiz.duration || 60}
                    onChange={(e) => setEditingQuiz(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-650"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes</option>
                    <option value={120}>120 Minutes</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block">Initial Status</label>
                  <select
                    value={editingQuiz.status || 'draft'}
                    onChange={(e) => setEditingQuiz(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-650"
                  >
                    <option value="draft">Draft / Private</option>
                    <option value="published">Published / live</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingQuiz.randomizeQuestions}
                    onChange={(e) => setEditingQuiz(prev => ({ ...prev, randomizeQuestions: e.target.checked }))}
                    className="accent-emerald-600 scale-110"
                  />
                  Randomize Questions Order
                </label>

                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingQuiz.randomizeAnswers}
                    onChange={(e) => setEditingQuiz(prev => ({ ...prev, randomizeAnswers: e.target.checked }))}
                    className="accent-emerald-600 scale-110"
                  />
                  Randomize Choices Order
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfigModal(false);
                    setEditingQuiz(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-205 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUESTION CREATE/EDIT MODAL PANEL */}
      {showQuestionModal && editingQuestion && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-950">
                {editingQuestion.id ? 'Edit Question properties' : `Insert Question to ${selectedQuizForQuestions?.title}`}
              </h3>
              <button
                onClick={() => {
                  setShowQuestionModal(false);
                  setEditingQuestion(null);
                }}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block">Question Structure Type</label>
                  <select
                    value={editingQuestion.type}
                    onChange={(e) => {
                      const selType = e.target.value;
                      let dummyOpts = editingQuestion.options || [];
                      if (selType === 'true_false') dummyOpts = ['True', 'False'];
                      setEditingQuestion(prev => ({ 
                        ...prev, 
                        type: selType,
                        options: dummyOpts,
                        correctOptionIndex: dummyOpts.length > 0 ? 0 : null
                      }));
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-emerald-650"
                  >
                    <option value="multiple_choice">Multiple Choice (MCQ)</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short Answer Text entry</option>
                    <option value="fill_in_the_blank">Fill in the Blank</option>
                    <option value="matching">Matching Pairs Question</option>
                    <option value="multiple_select">Multiple Select checkbox</option>
                    <option value="essay">Essay Question</option>
                    <option value="drag_and_drop">Drag-and-Drop Ordering</option>
                    <option value="scenario_based">Scenario-Based Case Study</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block">Difficulty Category</label>
                  <select
                    value={editingQuestion.difficulty || 'medium'}
                    onChange={(e) => setEditingQuestion(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-emerald-650"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block">Main Subject Topic / Segment</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JSX logic, Propositional logic, Set theory"
                    value={editingQuestion.topic || ''}
                    onChange={(e) => setEditingQuestion(prev => ({ ...prev, topic: e.target.value }))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-emerald-650"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block">Question Prompts & Scenario text</label>
                <textarea
                  required
                  rows={3}
                  value={editingQuestion.questionText || ''}
                  onChange={(e) => setEditingQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                  placeholder="Enter the complete question prompt, code segment, scenario description, or matching table here..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-650"
                />
              </div>

              {/* Dynamic options display for choices style */}
              {(editingQuestion.type === 'multiple_choice' || editingQuestion.type === 'multiple_select' || editingQuestion.type === 'matching' || editingQuestion.type === 'drag_and_drop' || editingQuestion.type === 'scenario_based') && (
                <div className="space-y-2 border-l-2 border-emerald-500 pl-3">
                  <label className="font-black text-slate-800 block">Configure Options Choices (One choice per line)</label>
                  <textarea
                    rows={4}
                    value={Array.isArray(editingQuestion.options) ? editingQuestion.options.join('\n') : ''}
                    onChange={(e) => {
                      const splitArr = e.target.value.split('\n');
                      setEditingQuestion(prev => ({ ...prev, options: splitArr }));
                    }}
                    placeholder="Choice 1&#10;Choice 2&#10;Choice 3&#10;Choice 4"
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-emerald-650 font-mono text-[11px]"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="font-extrabold text-slate-700 block">Correct Choice index (0-based)</label>
                      <input
                        type="number"
                        min="0"
                        max={Array.isArray(editingQuestion.options) ? editingQuestion.options.length - 1 : 0}
                        value={editingQuestion.correctOptionIndex !== null ? editingQuestion.correctOptionIndex : 0}
                        onChange={(e) => setEditingQuestion(prev => ({ ...prev, correctOptionIndex: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md focus:outline-emerald-650"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editingQuestion.type === 'true_false' && (
                <div className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between">
                  <span className="font-bold">Correct Options value:</span>
                  <select
                    value={editingQuestion.correctOptionIndex === null ? 0 : editingQuestion.correctOptionIndex}
                    onChange={(e) => setEditingQuestion(prev => ({ ...prev, correctOptionIndex: parseInt(e.target.value), correctAnswer: parseInt(e.target.value) === 0 ? 'True' : 'False' }))}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                  >
                    <option value={0}>True</option>
                    <option value={1}>False</option>
                  </select>
                </div>
              )}

              {/* Text solution key matcher */}
              {(editingQuestion.type === 'short_answer' || editingQuestion.type === 'fill_in_the_blank') && (
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block">Correct matching text (case-insensitive key)</label>
                  <input
                    type="text"
                    required
                    value={editingQuestion.correctAnswer || ''}
                    onChange={(e) => setEditingQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    placeholder="The exact word, index list, or sentence chunk to cross-compare."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-650"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionModal(false);
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-205 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  required
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                >
                  Compile Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPLOAD MODAL AREA */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-950 flex items-center gap-1.5">
                <FileUp className="w-5 h-5 text-indigo-600" />
                Bulk Question CSV CSV / Semi-colon importer
              </h3>
              <button 
                onClick={() => setShowBulkUpload(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
              <p className="text-slate-500 leading-normal text-[11px]">
                Import questions in bulk by formatting them with semi-colons (;) separates:
                <br />
                <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">type;questionText;optionA,optionB,optionC;correctOptionIndex;correctAnswer</span>
              </p>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block">Target Quiz / Exam destination</label>
                <select
                  required
                  value={bulkQuizId}
                  onChange={(e) => setBulkQuizId(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-emerald-650"
                >
                  <option value="">-- Choose destination to import into --</option>
                  {quizzes.map(q => (
                    <option key={q.id} value={q.id}>{q.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block">Data Records (CSV Text block)</label>
                <textarea
                  required
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="type;questionText;options;correctOptionIndex;correctAnswer&#10;multiple_choice;Which hook caches computed variables?;useEffect,useMemo,useCallback;1;useMemo&#10;true_false;React is a framework;True,False;1;False"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-650 font-mono text-[11px]"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowBulkUpload(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-205 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition text-xs shadow-md"
                >
                  Bulk Import Syllabus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE INTERACTIVE PREVIEW MODAL */}
      {previewQuiz && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-slate-100 space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono rounded inline-block uppercase font-bold tracking-widest">
                  Live Preview Mode
                </span>
                <h3 className="text-lg font-black text-white">{previewQuiz.title}</h3>
              </div>
              
              <button 
                onClick={() => setPreviewQuiz(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(!previewQuiz.questions || previewQuiz.questions.length === 0) ? (
              <div className="text-center py-12 space-y-2">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                <p className="text-slate-400 text-xs">No questions loaded in this draft. Utilize Gemini or manual builders to add content!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Progress bar info */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Question {previewCurrentIdx + 1} of {previewQuiz.questions.length}</span>
                    <span>Completion index: {Math.round(((previewCurrentIdx + 1) / previewQuiz.questions.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${((previewCurrentIdx + 1) / previewQuiz.questions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Question item container holding animated transition-feel card */}
                {previewQuiz.questions[previewCurrentIdx] && (() => {
                  const q = previewQuiz.questions[previewCurrentIdx];
                  return (
                    <div className="p-5 bg-slate-850 border border-slate-800 rounded-xl space-y-4">
                      <div className="flex justify-between items-center bg-slate-800 p-2 rounded-lg text-[10px] font-mono text-slate-400 uppercase font-black">
                        <span>Type: {q.type.replace('_', ' ')}</span>
                        <span>Topic: {q.topic || 'General'}</span>
                        <span className="text-emerald-400 font-bold">Difficulty: {q.difficulty}</span>
                      </div>

                      <p className="font-extrabold text-sm md:text-base leading-relaxed text-white">Q{previewCurrentIdx + 1}: {q.questionText}</p>

                      {/* Display answer options Choice Box */}
                      {Array.isArray(q.options) && q.options.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl pr-2">
                          {q.options.map((opt: string, optIdx: number) => (
                            <label key={optIdx} className={`flex gap-3 items-center p-3.5 rounded-xl border cursor-pointer transition text-xs md:text-sm ${
                              previewAnswers[previewCurrentIdx] === String(optIdx)
                                ? 'bg-emerald-500/10 border-emerald-500 text-white font-bold'
                                : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                            }`}>
                              <input
                                type="radio"
                                name={`preview_quest_${previewCurrentIdx}`}
                                checked={previewAnswers[previewCurrentIdx] === String(optIdx)}
                                onChange={() => setPreviewAnswers(prev => ({ ...prev, [previewCurrentIdx]: String(optIdx) }))}
                                className="accent-emerald-500 scale-105"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="Enter short response response value..."
                            value={previewAnswers[previewCurrentIdx] || ''}
                            onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [previewCurrentIdx]: e.target.value }))}
                            className="w-full max-w-lg px-4 py-2.5 rounded-lg border border-slate-750 bg-slate-800/80 text-white text-xs text-sm focus:outline-emerald-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <button
                    disabled={previewCurrentIdx === 0}
                    onClick={() => setPreviewCurrentIdx(prev => prev - 1)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1 transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous Question
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const q = previewQuiz.questions?.[previewCurrentIdx];
                        alert(`Evaluated Correction Info:\n\nCorrect Option index: ${q.correctOptionIndex}\nCorrect Solution choice: ${q.options?.[q.correctOptionIndex] || q.correctAnswer || 'None provided'}`);
                      }}
                      className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-lg border border-slate-800"
                    >
                      Show Answer Key
                    </button>

                    {previewCurrentIdx < previewQuiz.questions.length - 1 ? (
                      <button
                        onClick={() => setPreviewCurrentIdx(prev => prev + 1)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition"
                      >
                        Next Question <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          alert('Great job reviewing! Close the Preview to return to configuration and publish.');
                          setPreviewQuiz(null);
                        }}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg transition"
                      >
                        Complete Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
