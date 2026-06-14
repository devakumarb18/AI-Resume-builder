import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Edit2, Trash2, FileText, Loader2, Copy, Eye, Download, FilePlus2, UploadCloud, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import TemplatePreview from '../components/TemplatePreview';

const Dashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [magicNotes, setMagicNotes] = useState('');
  const [magicLoadingStep, setMagicLoadingStep] = useState('');
  const fileInputRef = useRef(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await api.get('/resume/all');
      setResumes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const createNewResume = async () => {
    try {
      const response = await api.post('/resume/create', { title: 'Untitled Resume', template: 'Modern' });
      toast.success('Resume created successfully!');
      navigate(`/builder/${response.data.data._id}`);
    } catch (error) {
      console.error('Error creating resume:', error);
      toast.error('Failed to create a new resume.');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported');
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('resume', file);
    
    try {
      toast.loading('Extracting & Parsing PDF with AI...', { id: 'pdf-upload' });
      
      const uploadRes = await api.post('/upload/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const parsedResumeData = uploadRes.data.resumeData;
      const createRes = await api.post('/resume/create', parsedResumeData);
      
      toast.success('Resume imported successfully!', { id: 'pdf-upload' });
      navigate(`/builder/${createRes.data.data._id}`);
      
    } catch (error) {
      console.error('Upload Error:', error);
      toast.error(error.response?.data?.message || 'Failed to parse resume PDF', { id: 'pdf-upload' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const duplicateResume = async (id) => {
    try {
      const response = await api.post(`/resume/duplicate/${id}`);
      setResumes([response.data.data, ...resumes]);
      toast.success('Resume duplicated!');
    } catch (error) {
      toast.error('Failed to duplicate resume');
    }
  };

  const handleMagicPaste = async () => {
    if (!magicNotes.trim()) {
      toast.error('Please paste some notes first!');
      return;
    }
    
    try {
      setMagicLoadingStep('Understanding your experience...');
      
      setTimeout(() => {
        setMagicLoadingStep('Optimizing ATS structure...');
      }, 2500);

      setTimeout(() => {
        setMagicLoadingStep('Building professional resume...');
      }, 5000);

      const response = await api.post('/resume/magic-generate', { rawNotes: magicNotes });
      
      toast.success('Magic Resume Created! ✨');
      setShowMagicModal(false);
      navigate(`/builder/${response.data.data._id}`);
      
    } catch (error) {
      console.error('Magic Paste error:', error);
      toast.error('Failed to generate resume from notes.');
      setMagicLoadingStep('');
    }
  };

  const deleteResume = async (id) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await api.delete(`/resume/delete/${id}`);
        setResumes(resumes.filter(resume => resume._id !== id));
        toast.success('Resume deleted');
      } catch (error) {
        toast.error('Failed to delete resume.');
      }
    }
  };

  const copyShareLink = (id) => {
    const url = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const filteredResumes = resumes.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Resumes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and build your professional portfolio.</p>
        </div>
        <div className="flex items-center space-x-4">
          <input 
            type="text" 
            placeholder="Search resumes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full text-sm w-64 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="application/pdf" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-full shadow-lg shadow-gray-200/50 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
            <span>Upload PDF</span>
          </button>
          <button onClick={() => setShowMagicModal(true)} disabled={isUploading} className="flex items-center space-x-2 px-6 py-2.5 rounded-full shadow-lg shadow-purple-500/30 bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50">
            <Sparkles size={18} className="animate-pulse" />
            <span>Magic Paste</span>
          </button>
          <button onClick={createNewResume} disabled={isUploading} className="btn-primary flex items-center space-x-2 px-6 py-2.5 rounded-full shadow-lg shadow-primary-500/30 disabled:opacity-50">
            <Plus size={20} />
            <span>Create New</span>
          </button>
        </div>
      </motion.div>

      {resumes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-16 text-center"
        >
          <div className="mx-auto w-24 h-24 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6">
            <FileText size={48} className="text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No resumes yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">Start building your premium professional resume today using our AI-powered templates.</p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              className="flex items-center space-x-2 px-8 py-3 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-md transition-colors disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
              <span>Import PDF Resume</span>
            </button>
            <button onClick={createNewResume} disabled={isUploading} className="btn-primary flex items-center space-x-2 px-8 py-3 rounded-full shadow-md disabled:opacity-50">
              <Plus size={20} />
              <span>Create from scratch</span>
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredResumes.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-10">No resumes match your search.</div>
          ) : filteredResumes.map(resume => (
            <motion.div 
              variants={itemVariants}
              key={resume._id} 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden group flex flex-col"
            >
              {/* Thumbnail Container */}
              <div 
                className="relative w-full aspect-[210/250] bg-gray-100 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 overflow-hidden pointer-events-none select-none flex justify-center cursor-pointer"
                onClick={() => navigate(`/builder/${resume._id}`)}
              >
                <div style={{ transform: 'scale(0.38)', transformOrigin: 'top center', width: '794px', marginTop: '10px' }} className="absolute top-0">
                  <TemplatePreview resumeData={resume} isLayoutEditMode={false} />
                </div>
                {/* Overlay gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-gray-800 opacity-60"></div>
                
                {/* Click overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur text-gray-900 font-bold px-4 py-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all pointer-events-auto">
                    Edit Resume
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate cursor-pointer hover:text-primary-600 transition-colors" title={resume.title} onClick={() => navigate(`/builder/${resume._id}`)}>
                      {resume.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Updated {new Date(resume.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <span className="bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold whitespace-nowrap shrink-0 border border-primary-100 dark:border-primary-800/50">
                    {resume.template}
                  </span>
                </div>
                
                {/* Analytics */}
                <div className="flex items-center gap-4 mt-auto text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 font-medium" title="Public Views">
                    <Eye size={16} className="text-gray-400" /> <span>{resume.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium" title="Downloads">
                    <Download size={16} className="text-gray-400" /> <span>{resume.downloads || 0}</span>
                  </div>
                  {resume.aiGenerated && (
                    <div className="ml-auto text-[10px] uppercase tracking-wider font-bold bg-purple-100/50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2.5 py-1 rounded-full border border-purple-200/50 dark:border-purple-800/30">
                      AI Built
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex justify-between items-center transition-all">
                <button 
                  onClick={() => navigate(`/builder/${resume._id}`)} 
                  className="flex items-center text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                >
                  <Edit2 size={16} className="mr-1.5" /> Edit
                </button>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => duplicateResume(resume._id)} 
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <FilePlus2 size={18} />
                  </button>
                  <button 
                    onClick={() => copyShareLink(resume._id)} 
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy Public Link"
                  >
                    <Copy size={18} />
                  </button>
                  <button 
                    onClick={() => deleteResume(resume._id)} 
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
      {/* Magic Paste Modal */}
      <AnimatePresence>
        {showMagicModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full p-8 border border-gray-100 dark:border-gray-700 relative overflow-hidden"
            >
              {magicLoadingStep ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative w-20 h-20 mb-8">
                    <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-purple-600 animate-pulse" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">AI is working its magic...</h3>
                  <p className="text-purple-600 dark:text-purple-400 font-medium animate-pulse text-center">{magicLoadingStep}</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                      <Sparkles className="mr-3 text-purple-500" size={28} /> Magic Paste
                    </h2>
                    <button onClick={() => setShowMagicModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 mb-6 border border-purple-100 dark:border-purple-800/30">
                    <p className="text-sm text-purple-800 dark:text-purple-300 font-medium">
                      Paste your messy notes, an old resume, a LinkedIn bio, or just tell me about your career. I will instantly build a structured, ATS-friendly professional resume for you.
                    </p>
                  </div>

                  <textarea 
                    value={magicNotes}
                    onChange={(e) => setMagicNotes(e.target.value)}
                    placeholder="e.g. I am a frontend developer with 3 years of experience. I know React, Tailwind, and Node.js. I built an ecommerce platform that increased sales by 20%. I graduated from MIT in 2021..."
                    className="w-full h-64 p-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none mb-6 dark:text-gray-200"
                  />
                  
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowMagicModal(false)} className="px-6 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleMagicPaste} className="px-8 py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30 flex items-center transition-colors">
                      <Sparkles size={18} className="mr-2" /> Generate Resume
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
