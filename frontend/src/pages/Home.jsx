import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Wand2, Sparkles, MessageSquare, Target, Flame, ChevronRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

const Home = () => {
  const containerRef = useRef(null);

  // Mouse tracking for interactive spotlight glow
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    containerRef.current.style.setProperty('--mouse-x', `${x}px`);
    containerRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="bg-ai-core bg-noise min-h-screen text-white relative overflow-hidden flex flex-col"
    >
      {/* Background Layers */}
      <div className="ai-glow-layer">
        <div className="ai-glow-emerald"></div>
        <div className="ai-glow-cyan"></div>
        <div className="ai-glow-purple"></div>
      </div>
      <div className="mouse-spotlight"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-32 pb-24 flex-grow flex flex-col items-center">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto mb-24"
        >
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 backdrop-blur-md mb-10 text-sm font-bold text-cyan-400 uppercase tracking-widest shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <Sparkles size={16} className="text-cyan-400" />
            <span>AI Career Operating System V2.0</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
            Stop filling forms. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-2xl">
              Let AI build your career.
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Transform messy notes into recruiter-ready resumes instantly. Talk to our AI coach, get roasted by virtual recruiters, and bypass ATS filters with mathematical precision.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/signup" className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-300 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-2 z-10">
                <Wand2 size={20} /> Build Resume Free
              </span>
            </Link>
            <a href="#demo" className="inline-flex items-center justify-center px-8 py-4 font-bold text-gray-300 transition-all duration-300 rounded-full hover:text-white hover:bg-white/5 gap-2">
              See the Magic <ChevronRight size={18} />
            </a>
          </div>
        </motion.div>

        {/* Interactive AI Demo / Bento Box Section */}
        <div id="demo" className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          
          {/* Card 1: Magic Paste (Spans 2 columns) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/30 transition-colors"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] group-hover:bg-emerald-500/20 transition-colors"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wand2 size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">Magic Paste Engine</h3>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 relative z-10">
              <div className="flex-1 bg-black/40 rounded-2xl p-5 border border-white/5">
                <p className="text-xs text-gray-500 font-mono mb-3">YOUR MESSY NOTES</p>
                <p className="text-sm text-gray-400 leading-relaxed font-mono">
                  "i know react and node. made an ecommerce app. it increased sales by 20%. im a self taught dev."
                </p>
              </div>
              <div className="flex flex-col justify-center items-center text-gray-600">
                <motion.div 
                  animate={{ x: [0, 10, 0] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <ChevronRight size={24} className="hidden md:block text-emerald-500" />
                </motion.div>
              </div>
              <div className="flex-1 bg-emerald-950/30 rounded-2xl p-5 border border-emerald-500/20">
                <p className="text-xs text-emerald-500/70 font-mono mb-3">AI GENERATED BULLETS</p>
                <ul className="space-y-3">
                  <li className="text-sm text-gray-200 flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Engineered a full-stack e-commerce platform using React and Node.js.</span>
                  </li>
                  <li className="text-sm text-gray-200 flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Optimized application performance resulting in a 20% increase in overall sales conversions.</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Card 2: ATS Score */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/30 transition-colors flex flex-col items-center justify-center text-center"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] group-hover:bg-cyan-500/20 transition-colors"></div>
             <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 relative z-10">
                <Target size={20} />
              </div>
              <h3 className="text-xl font-bold text-white mb-6 relative z-10">ATS Optimization</h3>
              
              <div className="relative w-32 h-32 flex items-center justify-center z-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-800" />
                  <motion.circle 
                    cx="64" cy="64" r="60" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray="377"
                    initial={{ strokeDashoffset: 377 }}
                    whileInView={{ strokeDashoffset: 377 - (377 * 0.98) }}
                    transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                    className="text-cyan-400" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.2 }}
                    className="text-3xl font-black text-white"
                  >
                    98
                  </motion.span>
                  <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">Score</span>
                </div>
              </div>
          </motion.div>

          {/* Card 3: AI Career Coach */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group hover:border-purple-500/30 transition-colors"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] group-hover:bg-purple-500/20 transition-colors"></div>
             <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">Live AI Copilot</h3>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="bg-purple-900/30 border border-purple-500/20 p-4 rounded-2xl rounded-tl-sm w-[85%]">
                <p className="text-sm text-purple-100">I noticed your summary is a bit generic. Can you tell me what you're most proud of?</p>
              </div>
              <div className="bg-black/40 border border-white/10 p-4 rounded-2xl rounded-tr-sm w-[85%] ml-auto">
                <p className="text-sm text-gray-300">I won a hackathon using Python!</p>
              </div>
              <div className="bg-purple-900/30 border border-purple-500/20 p-4 rounded-2xl rounded-tl-sm w-[85%] flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                <p className="text-sm text-purple-100 italic">I've added that to your achievements!</p>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Recruiter Roast (Spans 2 columns) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group hover:border-rose-500/30 transition-colors"
          >
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] group-hover:bg-rose-500/20 transition-colors"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                <Flame size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">Brutal Recruiter Roast</h3>
            </div>

            <div className="bg-rose-950/30 border border-rose-500/20 rounded-2xl p-6 relative z-10">
              <div className="flex gap-4 items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-rose-900/50 flex items-center justify-center flex-shrink-0 text-xl border border-rose-500/30">💀</div>
                <div>
                  <h4 className="text-rose-400 font-bold mb-1">FAANG CTO Simulation</h4>
                  <p className="text-rose-100/80 text-sm italic">"Your project descriptions are incredibly weak. 'Built a website' tells me nothing. Where are the metrics? Where is the scale? If I see this, I'm throwing it in the trash."</p>
                </div>
              </div>
              
              <div className="ml-16 pt-4 border-t border-rose-500/20 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-mono">AI AUTO-FIX AVAILABLE</span>
                <button className="flex items-center gap-2 text-xs font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
                  <Wand2 size={12} /> Fix Automatically
                </button>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
};

export default Home;
