import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Loader2, AlertCircle } from 'lucide-react';
import TemplatePreview from '../components/TemplatePreview';

const PublicResume = () => {
  const { id } = useParams();
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicResume = async () => {
      try {
        const response = await api.get(`/resume/share/${id}`);
        setResumeData(response.data.data);
      } catch (err) {
        console.error('Error fetching public resume:', err);
        setError(err.response?.data?.error || 'Resume not found or not public.');
      } finally {
        setLoading(false);
      }
    };
    fetchPublicResume();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin text-primary-500 mb-4" size={48} />
        <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide animate-pulse">Loading Resume...</p>
      </div>
    );
  }

  if (error || !resumeData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Resume Unavailable</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">{error}</p>
          <Link to="/" className="btn-primary block w-full py-3 rounded-xl font-bold shadow-lg shadow-primary-500/30">
            Create Your Own Resume
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col relative pb-24">
      {/* Subtle Top Banner */}
      <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm py-4 px-6 flex justify-between items-center z-10 sticky top-0 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight hidden sm:block">
            ResumeBuilder
          </span>
        </div>
        <Link to="/" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2 rounded-full font-bold text-sm shadow-md hover:scale-105 transition-transform">
          Build yours for free
        </Link>
      </div>

      {/* Main Resume Canvas */}
      <div className="flex-1 w-full overflow-auto flex justify-center py-12 px-4">
        {/* We use a wrapper to ensure it renders nicely on all screens, scaling if necessary on mobile */}
        <div className="max-w-full overflow-x-auto custom-scrollbar pb-10">
          <div className="w-[794px] shrink-0 mx-auto shadow-2xl rounded-sm bg-white overflow-hidden">
            <TemplatePreview resumeData={resumeData} isLayoutEditMode={false} />
          </div>
        </div>
      </div>
      
      {/* Floating CTA for Mobile */}
      <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%]">
        <Link to="/" className="btn-primary block w-full py-3.5 rounded-2xl font-bold text-center shadow-2xl shadow-primary-500/40 border border-primary-400">
          Create Your AI Resume
        </Link>
      </div>
    </div>
  );
};

export default PublicResume;
