import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ChevronLeft, Save, Download, Plus, Trash2, GripVertical, Wand2, RefreshCw, ZoomIn, ZoomOut, CheckCircle2, ChevronRight, AlertCircle, Share2, Globe, Copy, Check, Loader2, LayoutTemplate, Palette } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import toast from 'react-hot-toast';
import debounce from 'lodash.debounce';
import TemplatePreview from '../components/TemplatePreview';
import ChatAssistant from '../components/ChatAssistant';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const TEMPLATES = ['Modern', 'Minimal', 'ATS Friendly', 'Creative', 'Corporate', 'Developer Portfolio'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#64748b', '#000000', '#374151', '#0f172a'];

const ResumeBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [resumeData, setResumeData] = useState({
    title: 'Untitled Resume',
    personalInfo: { fullName: '', email: '', phone: '', address: '', linkedIn: '', portfolio: '', github: '' },
    summary: '',
    skills: [''],
    education: [{ id: 'edu-0', institution: '', degree: '', startDate: '', endDate: '', description: '' }],
    experience: [{ id: 'exp-0', company: '', position: '', startDate: '', endDate: '', description: '' }],
    projects: [{ id: 'proj-0', title: '', link: '', description: '' }],
    achievements: [''],
    hobbies: [''],
    interests: [''],
    activities: [''],
    showIcons: true,
    pageMode: 'one-page',
    template: 'Modern',
    themeColor: '#3b82f6'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState('personal');
  const [atsData, setAtsData] = useState(null);
  const [generatorResult, setGeneratorResult] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobMatchData, setJobMatchData] = useState(null);
  const [recruiterMode, setRecruiterMode] = useState('🔥 FAANG Reviewer');
  const [recruiterCritique, setRecruiterCritique] = useState(null);
  const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchResumeData();
  }, [id]);

  const fetchResumeData = async () => {
    try {
      const response = await api.get(`/resume/${id}`);
      const data = response.data.data || response.data;
      
      // Ensure arrays have at least one item and add unique IDs for drag-and-drop
      if (!data.skills || data.skills.length === 0) data.skills = [''];
      
      const addIds = (arr, prefix) => (arr && arr.length > 0) ? arr.map((item, i) => ({...item, id: item._id || `${prefix}-${Date.now()}-${i}`})) : [{ id: `${prefix}-${Date.now()}`, company: '', position: '' }];
      
      data.education = addIds(data.education, 'edu');
      data.experience = addIds(data.experience, 'exp');
      data.projects = addIds(data.projects, 'proj');
      
      if (!data.sectionOrder || data.sectionOrder.length === 0) {
        data.sectionOrder = ['summary', 'experience', 'projects', 'education', 'skills', 'languages', 'achievements', 'activities'];
      }

      setResumeData(data);
    } catch (error) {
      toast.error('Failed to load resume data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-Save Implementation
  const debouncedSave = useCallback(
    debounce(async (dataToSave) => {
      try {
        setSaving(true);
        const cleanData = { ...dataToSave };
        cleanData.skills = cleanData.skills.filter(s => s.trim() !== '');
        await api.put(`/resume/update/${id}`, cleanData);
        setSaving(false);
      } catch (error) {
        setSaving(false);
        console.error('Auto-save failed', error);
      }
    }, 1500),
    [id]
  );

  // Trigger auto-save whenever resumeData changes (excluding initial load)
  useEffect(() => {
    if (!loading) {
      debouncedSave(resumeData);
    }
  }, [resumeData, debouncedSave, loading]);

  const handleManualSave = async () => {
    setSaving(true);
    const cleanData = { ...resumeData };
    cleanData.skills = cleanData.skills.filter(s => s.trim() !== '');
    try {
      await api.put(`/resume/update/${id}`, cleanData);
      toast.success('Saved successfully!');
    } catch (error) {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = async () => {
    try {
      toast.loading('Generating high-quality PDF...', { id: 'pdf' });
      const response = await api.get(`/resume/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resumeData.personalInfo?.fullName || 'resume'}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('Downloaded!', { id: 'pdf' });
    } catch (error) {
      toast.error('Failed to download PDF', { id: 'pdf' });
    }
  };

  // AI Features
  const improveWithAI = async (text, type, callback) => {
    if (!text || text.trim().length < 5) {
      toast.error('Please enter more text before using AI.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post('/ai/improve', { text, type });
      // Fallbacks to handle both the old data.text format and the new improvedText format
      callback(res.data.improvedText || res.data.text || res.data.data);
    } catch (err) {
      toast.error('AI generation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  // Merge JSON patches from AI Assistant directly into resume state
  const handleAIPatch = (patch) => {
    if (!patch || typeof patch !== 'object') return;
    
    setResumeData(prev => {
      // Create a deep copy to avoid mutation issues
      const newData = JSON.parse(JSON.stringify(prev));
      
      // Simple deep merge for the patch
      Object.keys(patch).forEach(key => {
        if (Array.isArray(patch[key])) {
          // If it's an array (like experience, projects), replace it fully 
          // because the AI returns the full updated array to maintain order.
          newData[key] = patch[key];
        } else if (typeof patch[key] === 'object' && patch[key] !== null) {
          newData[key] = { ...newData[key], ...patch[key] };
        } else {
          newData[key] = patch[key];
        }
      });
      
      return newData;
    });
  };

  const handleAIGenerate = async () => {
    setAiLoading(true);
    try {
      const response = await api.post("/ai/improve", {
        text: resumeData.personalInfo.summary,
      });
      setResumeData({
        ...resumeData,
        personalInfo: {
          ...resumeData.personalInfo,
          summary: response.data.improvedText,
        }
      });
      toast.success("AI Generated Successfully");
    } catch (error) {
      console.log(error);
      const errorMsg = error.response?.data?.message || "AI generation failed";
      toast.error(errorMsg);
    } finally {
      setAiLoading(false);
    }
  };

  const getAtsScore = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/ai/ats-score', { resumeData });
      setAtsData(res.data.data);
      // Save the score back to DB silently
      if (res.data.data && res.data.data.score) {
        setResumeData(prev => ({...prev, atsScore: res.data.data.score}));
      }
      toast.success('ATS Analysis Complete!');
    } catch (err) {
      toast.error('Failed to analyze ATS score.');
    } finally {
      setAiLoading(false);
    }
  };

  const generateExternalDoc = async (type) => {
    setAiLoading(true);
    setGeneratorResult('');
    try {
      const endpoint = type === 'cover-letter' ? '/ai/cover-letter' : '/ai/linkedin-bio';
      const payload = type === 'cover-letter' 
        ? { resumeData, jobTitle: prompt('Enter target job title:') || 'Professional' }
        : { resumeData };
        
      const res = await api.post(endpoint, payload);
      setGeneratorResult(res.data.data);
      toast.success('Generation Complete!');
    } catch (err) {
      toast.error('Generation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleJobMatch = async () => {
    if (!jobDescription || jobDescription.length < 50) {
      toast.error('Please enter a complete job description');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post('/ai/job-match', { resumeData, jobDescription });
      setJobMatchData(res.data.data);
      toast.success('Job Match Analysis Complete!');
    } catch (err) {
      toast.error('Failed to analyze job match.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAutoTailor = async () => {
    if (!jobDescription) {
      toast.error('Please enter a job description first');
      return;
    }
    setAiLoading(true);
    try {
      toast.loading('AI is auto-tailoring your resume...', { id: 'tailor' });
      const res = await api.post('/ai/tailor-resume', { resumeData, jobDescription });
      const updated = res.data.data;
      
      const newData = { ...resumeData, personalInfo: { ...resumeData.personalInfo } };
      if (updated.summary) newData.personalInfo.summary = updated.summary;
      if (updated.skills) newData.skills = updated.skills;
      if (updated.experience) {
        newData.experience = newData.experience.map(exp => {
          const matched = updated.experience.find(e => e.id === exp.id);
          return matched ? { ...exp, description: matched.description } : exp;
        });
      }
      setResumeData(newData);
      toast.success('Resume Tailored Successfully!', { id: 'tailor' });
    } catch (err) {
      toast.error('Failed to auto-tailor resume.', { id: 'tailor' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSimulateRecruiter = async () => {
    setAiLoading(true);
    try {
      toast.loading('Recruiter is reviewing your resume...', { id: 'roast' });
      const res = await api.post('/ai/simulate-recruiter', { resumeData, recruiterMode });
      setRecruiterCritique(res.data.data);
      toast.success('Feedback ready!', { id: 'roast' });
    } catch (err) {
      toast.error('Failed to get recruiter feedback.', { id: 'roast' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAutoFixRoast = async () => {
    if (!recruiterCritique) return;
    setAiLoading(true);
    try {
      toast.loading('Applying magical fixes...', { id: 'autofix' });
      const res = await api.post('/ai/auto-fix-roast', { resumeData, recruiterCritique });
      const updated = res.data.data;
      
      const newData = { ...resumeData, personalInfo: { ...resumeData.personalInfo } };
      if (updated.summary) newData.personalInfo.summary = updated.summary;
      if (updated.experience) {
        newData.experience = newData.experience.map(exp => {
          const matched = updated.experience.find(e => e.id === exp.id);
          return matched ? { ...exp, description: matched.description } : exp;
        });
      }
      setResumeData(newData);
      setRecruiterCritique(null); // Clear critique after fix
      toast.success('Resume Automatically Fixed! ✨', { id: 'autofix' });
    } catch (err) {
      toast.error('Failed to auto-fix resume.', { id: 'autofix' });
    } finally {
      setAiLoading(false);
    }
  };

  // Handlers
  const handleChange = (e) => setResumeData({ ...resumeData, [e.target.name]: e.target.value });
  const handlePersonalInfo = (e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, [e.target.name]: e.target.value } });
  
  const handleArrayChange = (field, index, e) => {
    const newArr = [...resumeData[field]];
    newArr[index][e.target.name] = e.target.value;
    setResumeData({ ...resumeData, [field]: newArr });
  };
  
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(resumeData.sectionOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setResumeData({ ...resumeData, sectionOrder: items });
  };

  const handleArrayQuill = (field, index, value) => {
    const newArr = [...resumeData[field]];
    newArr[index].description = value;
    setResumeData({ ...resumeData, [field]: newArr });
  };

  const handleInlineEdit = (fieldPath, value) => {
    setResumeData(prev => {
      const newData = { ...prev };
      if (fieldPath.includes('.')) {
        const parts = fieldPath.split('.');
        const parent = parts[0];
        const child = parts[1];
        newData[parent] = { ...newData[parent], [child]: value };
      } else if (fieldPath.includes('[')) {
        const match = fieldPath.match(/(\w+)\[(\d+)\]\.(\w+)/);
        if (match) {
          const [, arrName, indexStr, prop] = match;
          const index = parseInt(indexStr, 10);
          const newArr = [...newData[arrName]];
          newArr[index] = { ...newArr[index], [prop]: value };
          newData[arrName] = newArr;
        }
      } else {
        newData[fieldPath] = value;
      }
      return newData;
    });
  };

  const addArrayItem = (field, emptyObj) => {
    setResumeData({ ...resumeData, [field]: [...resumeData[field], { ...emptyObj, id: `${field}-${Date.now()}` }] });
  };

  const removeArrayItem = (field, index) => {
    const newArr = [...resumeData[field]];
    newArr.splice(index, 1);
    setResumeData({ ...resumeData, [field]: newArr });
  };

  // Drag and Drop
  const onDragEnd = (result, field) => {
    if (!result.destination) return;
    const items = Array.from(resumeData[field]);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setResumeData({ ...resumeData, [field]: items });
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary-500" size={40} /></div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Top Navbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-between items-center z-10 shadow-sm shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <input 
            type="text" 
            name="title" 
            value={resumeData.title} 
            onChange={handleChange}
            className="text-xl font-bold bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 p-0"
            placeholder="Resume Title"
          />
          {saving && <span className="flex items-center text-xs text-gray-500"><Loader2 size={12} className="animate-spin mr-1"/> Saving...</span>}
          {!saving && <span className="flex items-center text-xs text-green-600"><CheckCircle2 size={12} className="mr-1"/> Saved</span>}
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowShareModal(true)} 
            className="btn-secondary flex items-center space-x-2 px-4 py-2 rounded-lg text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-colors border border-blue-200 dark:border-blue-800"
          >
            <Share2 size={16} /> <span className="hidden sm:inline">Share</span>
          </button>
          <button onClick={handleManualSave} className="btn-secondary flex items-center space-x-2 px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-white transition-colors border border-gray-200 dark:border-gray-600">
            <Save size={16} /> <span className="hidden sm:inline">Save</span>
          </button>
          <button onClick={downloadPDF} className="btn-primary flex items-center space-x-2 px-5 py-2 rounded-lg text-sm shadow-lg shadow-primary-500/30">
            <Download size={16} /> <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Globe className="mr-2 text-primary-500" size={24} /> Share Resume
              </h2>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Public Link</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={resumeData.isPublic || false} onChange={(e) => {
                    setResumeData({...resumeData, isPublic: e.target.checked});
                  }} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                </label>
              </div>
              <p className="text-xs text-gray-500 mb-4">When enabled, anyone with the link can view your resume. It will not be indexed by search engines.</p>
              
              {resumeData.isPublic ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <input type="text" readOnly value={`${window.location.origin}/share/${resumeData._id}`} className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-600 dark:text-gray-400 outline-none select-all" />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/share/${resumeData._id}`);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }} 
                      className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 px-4 py-2 text-sm font-bold border-l border-gray-200 dark:border-gray-700 hover:bg-primary-100 transition-colors flex items-center"
                    >
                      {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <a href={`/share/${resumeData._id}`} target="_blank" rel="noreferrer" className="text-xs text-primary-500 font-medium hover:underline flex items-center">
                    Preview Public Link ↗
                  </a>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center text-sm text-gray-500">
                  Enable public link to share your resume.
                </div>
              )}
            </div>
            
            <button onClick={() => setShowShareModal(false)} className="w-full btn-primary py-2.5 rounded-xl font-bold">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel - Editor */}
        <div className="w-[30%] flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-700 p-2 space-x-2 scrollbar-hide shrink-0">
            {['personal', 'experience', 'projects', 'education', 'skills', 'extras', 'design'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                {tab === 'ats' ? 'ATS Score' : tab === 'experience' ? 'Experience / Internships' : tab}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Full Name</label>
                    <input type="text" name="fullName" value={resumeData.personalInfo.fullName} onChange={handlePersonalInfo} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Email</label>
                    <input type="email" name="email" value={resumeData.personalInfo.email} onChange={handlePersonalInfo} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Phone</label>
                    <input type="text" name="phone" value={resumeData.personalInfo.phone} onChange={handlePersonalInfo} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Address</label>
                    <input type="text" name="address" value={resumeData.personalInfo.address} onChange={handlePersonalInfo} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">LinkedIn</label>
                    <input type="text" name="linkedIn" value={resumeData.personalInfo.linkedIn} onChange={handlePersonalInfo} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">GitHub</label>
                    <input type="text" name="github" value={resumeData.personalInfo.github} onChange={handlePersonalInfo} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Professional Summary</label>
                    <button type="button" onClick={handleAIGenerate} disabled={aiLoading} className="text-xs flex items-center text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-colors dark:bg-purple-900/30 dark:text-purple-400">
                      {aiLoading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Wand2 size={12} className="mr-1" />} AI Generate
                    </button>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                    <ReactQuill theme="snow" value={resumeData.personalInfo.summary} onChange={(val) => handlePersonalInfo({ target: { name: 'summary', value: val } })} className="h-40 pb-10" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div>
                <DragDropContext onDragEnd={(res) => onDragEnd(res, 'experience')}>
                  <Droppable droppableId="experienceList">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                        {resumeData.experience.map((exp, index) => (
                          <Draggable key={exp.id} draggableId={exp.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 relative group">
                                <div {...provided.dragHandleProps} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                                  <GripVertical size={20} />
                                </div>
                                <div className="pl-6 grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">Position</label>
                                    <input type="text" name="position" value={exp.position} onChange={(e) => handleArrayChange('experience', index, e)} className="w-full bg-white border border-gray-200 rounded p-2 text-sm mt-1" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">Company</label>
                                    <input type="text" name="company" value={exp.company} onChange={(e) => handleArrayChange('experience', index, e)} className="w-full bg-white border border-gray-200 rounded p-2 text-sm mt-1" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">Start Date</label>
                                    <input type="text" name="startDate" placeholder="Jan 2020" value={exp.startDate} onChange={(e) => handleArrayChange('experience', index, e)} className="w-full bg-white border border-gray-200 rounded p-2 text-sm mt-1" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">End Date</label>
                                    <input type="text" name="endDate" placeholder="Present" value={exp.endDate} onChange={(e) => handleArrayChange('experience', index, e)} className="w-full bg-white border border-gray-200 rounded p-2 text-sm mt-1" />
                                  </div>
                                  <div className="col-span-2 mt-2">
                                    <div className="flex justify-between items-center mb-1">
                                      <label className="text-xs text-gray-500 uppercase">Description</label>
                                      <div className="flex gap-2">
                                        <button type="button" onClick={() => improveWithAI(exp.description, 'experience', (val) => handleArrayQuill('experience', index, val))} className="text-xs flex items-center text-purple-600 hover:underline">
                                          <Wand2 size={12} className="mr-1" /> Rewrite
                                        </button>
                                        <button type="button" onClick={() => improveWithAI(exp.description, 'bullets', (val) => handleArrayQuill('experience', index, val))} className="text-xs flex items-center text-blue-600 hover:underline">
                                          <LayoutTemplate size={12} className="mr-1" /> Bullets
                                        </button>
                                      </div>
                                    </div>
                                    <div className="bg-white rounded overflow-hidden border border-gray-200">
                                      <ReactQuill theme="snow" value={exp.description} onChange={(val) => handleArrayQuill('experience', index, val)} className="h-32 pb-10" />
                                    </div>
                                  </div>
                                </div>
                                <button onClick={() => removeArrayItem('experience', index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                <button onClick={() => addArrayItem('experience', {company:'', position:'', startDate:'', endDate:'', description:''})} className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-center font-medium">
                  <Plus size={18} className="mr-2" /> Add Experience / Internship
                </button>
              </div>
            )}

            {activeTab === 'projects' && (
              <div>
                <DragDropContext onDragEnd={(res) => onDragEnd(res, 'projects')}>
                  <Droppable droppableId="projectsList">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                        {resumeData.projects.map((proj, index) => (
                          <Draggable key={proj.id || `proj-${index}`} draggableId={proj.id || `proj-${index}`} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 relative group">
                                <div {...provided.dragHandleProps} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                                  <GripVertical size={20} />
                                </div>
                                <div className="pl-6 grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">Project Title</label>
                                    <input type="text" name="title" value={proj.title} onChange={(e) => handleArrayChange('projects', index, e)} className="w-full bg-white border border-gray-200 rounded p-2 text-sm mt-1" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">Link / URL</label>
                                    <input type="text" name="link" value={proj.link} onChange={(e) => handleArrayChange('projects', index, e)} className="w-full bg-white border border-gray-200 rounded p-2 text-sm mt-1" />
                                  </div>
                                  <div className="col-span-2 mt-2">
                                    <div className="flex justify-between items-center mb-1">
                                      <label className="text-xs text-gray-500 uppercase">Description</label>
                                      <div className="flex gap-2">
                                        <button type="button" onClick={() => improveWithAI(proj.description, 'projects', (val) => handleArrayQuill('projects', index, val))} className="text-xs flex items-center text-purple-600 hover:underline">
                                          <Wand2 size={12} className="mr-1" /> Rewrite
                                        </button>
                                      </div>
                                    </div>
                                    <div className="bg-white rounded overflow-hidden border border-gray-200">
                                      <ReactQuill theme="snow" value={proj.description} onChange={(val) => handleArrayQuill('projects', index, val)} className="h-32 pb-10" />
                                    </div>
                                  </div>
                                </div>
                                <button onClick={() => removeArrayItem('projects', index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                <button onClick={() => addArrayItem('projects', {title:'', link:'', description:''})} className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-center font-medium">
                  <Plus size={18} className="mr-2" /> Add Project
                </button>
              </div>
            )}

            {activeTab === 'education' && (
              <div>
                <DragDropContext onDragEnd={(res) => onDragEnd(res, 'education')}>
                  <Droppable droppableId="educationList">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                        {resumeData.education.map((edu, index) => (
                          <Draggable key={edu.id} draggableId={edu.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 relative group">
                                <div {...provided.dragHandleProps} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-grab opacity-0 group-hover:opacity-100">
                                  <GripVertical size={20} />
                                </div>
                                <div className="pl-6 grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">Degree</label>
                                    <input type="text" name="degree" value={edu.degree} onChange={(e) => handleArrayChange('education', index, e)} className="w-full bg-white border border-gray-200 rounded p-2 text-sm mt-1" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">Institution</label>
                                    <input type="text" name="institution" value={edu.institution} onChange={(e) => handleArrayChange('education', index, e)} className="w-full bg-white border border-gray-200 rounded p-2 text-sm mt-1" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">Start Date</label>
                                    <input type="text" name="startDate" value={edu.startDate} onChange={(e) => handleArrayChange('education', index, e)} className="w-full bg-white border border-gray-200 rounded p-2 text-sm mt-1" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">End Date</label>
                                    <input type="text" name="endDate" value={edu.endDate} onChange={(e) => handleArrayChange('education', index, e)} className="w-full bg-white border border-gray-200 rounded p-2 text-sm mt-1" />
                                  </div>
                                </div>
                                <button onClick={() => removeArrayItem('education', index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                <button onClick={() => addArrayItem('education', {institution:'', degree:'', startDate:'', endDate:''})} className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition flex items-center justify-center font-medium text-gray-500">
                  <Plus size={18} className="mr-2" /> Add Education
                </button>
              </div>
            )}

            {activeTab === 'skills' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-500">Add your skills separated by commas, or generate them using AI.</p>
                  <button onClick={() => improveWithAI(resumeData.personalInfo.summary || 'Software Engineer', 'skills', (val) => setResumeData({...resumeData, skills: val.split(',').map(s=>s.trim())}))} className="text-xs flex items-center text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    <Wand2 size={12} className="mr-1" /> AI Suggest Skills
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {resumeData.skills.map((skill, index) => (
                    <div key={index} className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden group">
                      <input 
                        type="text" 
                        value={skill} 
                        onChange={(e) => {
                          const newSkills = [...resumeData.skills];
                          newSkills[index] = e.target.value;
                          setResumeData({...resumeData, skills: newSkills});
                        }}
                        className="px-3 py-2 text-sm outline-none w-32 focus:w-40 transition-all border-none"
                        placeholder="Skill..."
                      />
                      <button onClick={() => {
                        const newSkills = [...resumeData.skills];
                        newSkills.splice(index, 1);
                        setResumeData({...resumeData, skills: newSkills});
                      }} className="px-2 text-gray-300 hover:text-red-500 bg-gray-50 border-l border-gray-200 h-full"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setResumeData({...resumeData, skills: [...resumeData.skills, '']})} className="text-sm text-primary-600 hover:underline flex items-center">
                  <Plus size={14} className="mr-1" /> Add Skill
                </button>
              </div>
            )}

            {activeTab === 'extras' && (
              <div className="space-y-6">
                {['achievements', 'hobbies', 'interests', 'activities', 'languages'].map(field => (
                  <div key={field} className="mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">{field}</h3>
                    <div className="flex flex-col gap-2">
                      {(resumeData[field] || []).map((item, index) => (
                        <div key={index} className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden group">
                          <input 
                            type="text" 
                            value={typeof item === 'string' ? item : item.language || ''} 
                            onChange={(e) => {
                              const newArr = [...(resumeData[field] || [])];
                              if (field === 'languages') {
                                newArr[index] = { language: e.target.value, proficiency: 'Native' };
                              } else {
                                newArr[index] = e.target.value;
                              }
                              setResumeData({...resumeData, [field]: newArr});
                            }}
                            className="px-3 py-2 text-sm outline-none flex-1 transition-all border-none"
                            placeholder={`Enter ${field.slice(0,-1)}...`}
                          />
                          <button onClick={() => {
                            const newArr = [...(resumeData[field] || [])];
                            newArr.splice(index, 1);
                            setResumeData({...resumeData, [field]: newArr});
                          }} className="px-3 py-2 text-gray-300 hover:text-red-500 bg-gray-50 border-l border-gray-200"><Trash2 size={14}/></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => {
                      const emptyItem = field === 'languages' ? { language: '', proficiency: 'Native' } : '';
                      setResumeData({...resumeData, [field]: [...(resumeData[field] || []), emptyItem]});
                    }} className="mt-2 text-sm text-primary-600 hover:underline flex items-center">
                      <Plus size={14} className="mr-1" /> Add {field.slice(0,-1)}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'jobMatch' && (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-2 dark:text-white">Job Match Analyzer</h3>
                  <p className="text-gray-500 text-sm mb-4">Paste a job description below to see how well your resume matches and get tailored suggestions.</p>
                  
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description here..."
                    className="w-full h-40 p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none mb-4"
                  />
                  
                  <div className="flex gap-4">
                    <button onClick={handleJobMatch} disabled={aiLoading} className="btn-primary px-6 py-2 rounded-lg flex items-center shadow-md shadow-primary-500/30">
                      {aiLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Wand2 size={16} className="mr-2" />} 
                      Analyze Match
                    </button>
                    {jobMatchData && (
                      <button onClick={handleAutoTailor} disabled={aiLoading} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center shadow-md shadow-purple-500/30 font-medium transition-colors">
                        {aiLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Wand2 size={16} className="mr-2" />} 
                        ✨ Auto Tailor Resume
                      </button>
                    )}
                  </div>
                </div>

                {jobMatchData && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold">Analysis Results</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Match Score:</span>
                        <span className={`text-2xl font-black ${jobMatchData.matchScore >= 80 ? 'text-green-500' : jobMatchData.matchScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {jobMatchData.matchScore}%
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Missing Keywords</h5>
                      <div className="flex flex-wrap gap-2">
                        {jobMatchData.missingKeywords?.map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium">
                            {kw}
                          </span>
                        ))}
                        {(!jobMatchData.missingKeywords || jobMatchData.missingKeywords.length === 0) && (
                          <span className="text-sm text-gray-500">No missing keywords detected!</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Suggestions</h5>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        {jobMatchData.suggestions?.map((sug, i) => (
                          <li key={i}>{sug}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'design' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center"><LayoutTemplate size={16} className="mr-2 text-primary-500"/> Templates</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {TEMPLATES.map(tmpl => (
                      <div 
                        key={tmpl}
                        onClick={() => setResumeData({...resumeData, template: tmpl})}
                        className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${resumeData.template === tmpl ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                      >
                        <div className="w-full h-16 bg-gray-100 dark:bg-gray-800 rounded mb-2 overflow-hidden flex items-center justify-center text-xs text-gray-400">Preview</div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{tmpl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center"><Palette size={16} className="mr-2 text-primary-500"/> Theme Color</h3>
                  <div className="flex gap-3 flex-wrap">
                    {COLORS.map(color => (
                      <button 
                        key={color}
                        onClick={() => setResumeData({...resumeData, themeColor: color})}
                        className={`w-10 h-10 rounded-full border-2 transition-transform ${resumeData.themeColor === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 mt-8 flex items-center"><LayoutTemplate size={16} className="mr-2 text-primary-500"/> Display Settings</h3>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Contact Icons</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={resumeData.showIcons} onChange={(e) => setResumeData({...resumeData, showIcons: e.target.checked})} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Page Mode</span>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="pageMode" value="one-page" checked={resumeData.pageMode === 'one-page'} onChange={(e) => setResumeData({...resumeData, pageMode: e.target.value})} className="text-primary-500 focus:ring-primary-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">One Page ATS (Compact)</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="pageMode" value="two-page" checked={resumeData.pageMode === 'two-page'} onChange={(e) => setResumeData({...resumeData, pageMode: e.target.value})} className="text-primary-500 focus:ring-primary-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Two Page (Detailed)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Live Preview */}
        <div className="w-[45%] bg-gray-100 dark:bg-gray-900 relative overflow-hidden flex flex-col items-center border-r border-gray-200 dark:border-gray-700">
          
          {/* Zoom Controls & Layout Edit */}
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-20">
            <button 
              onClick={() => setIsLayoutEditMode(!isLayoutEditMode)}
              className={`px-4 py-2 rounded-full font-bold text-xs shadow-lg transition-all ${isLayoutEditMode ? 'bg-primary-600 text-white shadow-primary-500/30' : 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700'}`}
            >
              {isLayoutEditMode ? '✅ Done Editing Layout' : '✏️ Edit Layout'}
            </button>
            <div className={`flex items-center bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-1 transition-opacity ${isLayoutEditMode ? 'opacity-30 pointer-events-none' : ''}`}>
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><ZoomOut size={18}/></button>
              <span className="text-xs font-medium w-12 text-center text-gray-700 dark:text-gray-300">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><ZoomIn size={18}/></button>
            </div>
          </div>

          <div className="flex-1 overflow-auto w-full flex justify-center py-10 custom-scrollbar relative">
            {/* Dim Overlay when Edit Mode ON */}
            {isLayoutEditMode && <div className="absolute inset-0 bg-gray-900/10 dark:bg-black/20 pointer-events-none z-10 transition-opacity duration-300"></div>}
            {/* Transform container for zoom */}
            <div 
              style={{ transform: `scale(${isLayoutEditMode ? 1 : zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }} 
              className={`w-[794px] shrink-0 ${isLayoutEditMode ? 'z-20 mt-10 mb-20' : ''}`}
            >
              <TemplatePreview 
                resumeData={resumeData} 
                isLayoutEditMode={isLayoutEditMode}
                onDragEnd={handleDragEnd}
                onInlineEdit={handleInlineEdit}
                onAddSectionItem={addArrayItem}
                onDeleteSectionItem={removeArrayItem}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Intelligence */}
        <div className="w-[25%] flex flex-col bg-white dark:bg-gray-800 z-10 overflow-y-auto scrollbar-thin shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur-sm">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center">
              <Wand2 size={16} className="mr-2 text-primary-500" />
              Intelligence
            </h2>
          </div>

          <div className="p-5 space-y-6">
            
            {/* ATS Score Card */}
            <div className="bg-white dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">ATS Score</h3>
                <button onClick={getAtsScore} disabled={aiLoading} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                  {aiLoading ? "Analyzing..." : "Analyze"}
                </button>
              </div>
              
              {atsData ? (
                <>
                  <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-gray-200 dark:text-gray-700" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className={`${atsData.score > 79 ? 'text-green-500' : atsData.score > 59 ? 'text-yellow-500' : 'text-red-500'}`} strokeDasharray={`${atsData.score}, 100`} strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-lg font-bold dark:text-white leading-none">{atsData.score}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    <span className="block font-semibold mb-1 truncate">{atsData.missingSkills ? 'Missing Skills detected' : 'Great job!'}</span>
                    <span className="text-gray-400 line-clamp-2">{atsData.resumeStrength}</span>
                  </div>
                </div>
                
                {atsData.metrics && (
                  <div className="mt-5 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Resume Strength Meter</h4>
                    {[
                      { label: 'Technical Depth', value: atsData.metrics.technicalDepth, color: 'bg-blue-500' },
                      { label: 'Leadership', value: atsData.metrics.leadership, color: 'bg-purple-500' },
                      { label: 'Impact', value: atsData.metrics.impact, color: 'bg-green-500' },
                      { label: 'Project Quality', value: atsData.metrics.projectQuality, color: 'bg-yellow-500' }
                    ].map(metric => (
                      <div key={metric.label}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="font-medium text-gray-600 dark:text-gray-300">{metric.label}</span>
                          <span className="text-gray-500">{metric.value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${metric.color} transition-all duration-1000 ease-out`} style={{ width: `${metric.value}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </>
              ) : (
                <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                  <p className="text-xs text-gray-500 mb-2">Check ATS compatibility</p>
                </div>
              )}
            </div>

            {/* Job Match Card */}
            <div className="bg-white dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Job Match</h3>
              <textarea 
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description..."
                className="w-full h-24 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-xs focus:ring-1 focus:ring-primary-500 outline-none resize-none mb-3"
              />
              <div className="flex gap-2">
                <button onClick={handleJobMatch} disabled={aiLoading} className="flex-1 btn-primary py-2 rounded-lg text-xs font-medium flex justify-center items-center">
                  Analyze
                </button>
                {jobMatchData && (
                  <button onClick={handleAutoTailor} disabled={aiLoading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-xs font-medium flex justify-center items-center">
                    ✨ Tailor
                  </button>
                )}
              </div>
              
              {jobMatchData && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">Score:</span>
                    <span className={`font-bold ${jobMatchData.matchScore >= 80 ? 'text-green-500' : jobMatchData.matchScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>{jobMatchData.matchScore}%</span>
                  </div>
                  {jobMatchData.missingKeywords && jobMatchData.missingKeywords.length > 0 && (
                     <div className="flex flex-wrap gap-1 mt-2">
                       {jobMatchData.missingKeywords.slice(0, 5).map((kw, i) => (
                         <span key={i} className="px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 rounded-md text-[10px] font-medium">{kw}</span>
                       ))}
                     </div>
                  )}
                </div>
              )}
            </div>

            {/* Harsh Recruiter Simulation */}
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Wand2 size={40} className="text-white" />
              </div>
              
              <h3 className="font-bold text-white mb-2 flex items-center">
                <span className="text-xl mr-2">🧐</span> Recruiter Roast
              </h3>
              <p className="text-gray-400 text-xs mb-4">Get brutal, honest feedback from an AI tech recruiter.</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {['🔥 FAANG Reviewer', '💀 Brutal CTO', '😎 Startup Founder', '🤖 ATS Robot', '🧠 Senior Eng Manager'].map(mode => (
                  <button 
                    key={mode}
                    onClick={() => setRecruiterMode(mode)}
                    className={`px-3 py-1 rounded-full text-[10px] font-medium transition-colors ${recruiterMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={handleSimulateRecruiter} 
                disabled={aiLoading} 
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-bold flex justify-center items-center shadow-lg shadow-red-500/20"
              >
                {aiLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Roast My Resume
              </button>
              
              {recruiterCritique && (
                <div className="mt-4 space-y-4">
                  <div className="bg-gray-800 rounded-xl p-3 border border-gray-600 relative">
                    <div className="absolute -left-2 top-3 w-4 h-4 bg-gray-800 border-l border-t border-gray-600 transform -rotate-45"></div>
                    <p className="text-sm font-medium text-white italic">"{recruiterCritique.openingLine}"</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">The Brutal Truth</h4>
                    <ul className="space-y-2">
                      {recruiterCritique.critiques?.map((critique, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start">
                          <span className="text-red-500 mr-2 mt-0.5">❌</span> {critique}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">How to Fix It</h4>
                    <ul className="space-y-2">
                      {recruiterCritique.suggestions?.map((sug, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start">
                          <span className="text-green-500 mr-2 mt-0.5">✅</span> {sug}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-700">
                    <button 
                      onClick={handleAutoFixRoast}
                      disabled={aiLoading}
                      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 py-3 rounded-xl text-sm font-black flex justify-center items-center shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all transform hover:scale-[1.02]"
                    >
                      {aiLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Wand2 size={18} className="mr-2" />}
                      ✨ Fix Automatically
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-2">AI will rewrite weak sections instantly</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      <ChatAssistant 
        resumeData={resumeData} 
        onApplyPatch={handleAIPatch} 
      />
    </div>
  );
};

export default ResumeBuilder;
