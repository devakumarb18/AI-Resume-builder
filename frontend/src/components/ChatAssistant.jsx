import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Bot, X, Sparkles, User, Minimize2, Maximize2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ChatAssistant = ({ resumeData, onApplyPatch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! I'm your AI Career Coach. Tell me what you'd like to add or change in your resume, or just tell me about your career and I'll suggest improvements." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const toggleListen = async () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());

          if (audioChunksRef.current.length === 0) return;

          setIsLoading(true);
          try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'voice-recording.webm');
            
            const response = await api.post('/resume/transcribe', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data.success && response.data.text) {
              setInputValue((prev) => prev + (prev ? ' ' : '') + response.data.text);
              toast.success('Speech transcribed!');
            }
          } catch (error) {
            console.error('Transcription error:', error);
            toast.error('Failed to transcribe audio.');
          } finally {
            setIsLoading(false);
          }
        };

        mediaRecorder.start();
        setIsListening(true);
        toast.success('Listening... Speak now.');
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast.error('Could not access microphone.');
      }
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message to UI immediately
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Send the current resume state, chat history (excluding the very first generic intro), and the new message
      const historyForAi = updatedMessages.slice(1, -1); 
      
      const response = await api.post('/resume/chat', {
        resumeData,
        chatHistory: historyForAi,
        userMessage
      });

      const aiResponse = response.data.data;
      
      if (aiResponse.reply) {
        setMessages(prev => [...prev, { role: 'ai', content: aiResponse.reply }]);
      }

      // If AI returned a JSON patch, apply it directly to the resume builder state!
      if (aiResponse.patch && Object.keys(aiResponse.patch).length > 0) {
        onApplyPatch(aiResponse.patch);
        toast.success('Resume updated!', { icon: '✨' });
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response from AI');
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I ran into an error processing that request. Could you try again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-purple-600 text-white shadow-xl shadow-purple-500/40 hover:bg-purple-700 transition-all hover:scale-105 z-50 flex items-center group"
      >
        <Sparkles size={24} className="animate-pulse" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out pl-0 group-hover:pl-3 font-semibold">
          AI Career Coach
        </span>
      </button>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`fixed right-6 bottom-6 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-900/50 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px] max-h-[80vh]'}`}
    >
      {/* Header */}
      <div className="bg-purple-600 p-4 text-white flex justify-between items-center cursor-pointer select-none" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <span className="font-bold">AI Career Coach</span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="text-purple-200 hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button className="text-purple-200 hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex items-end space-x-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 shrink-0">
                    <Bot size={16} />
                  </div>
                )}
                
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-600 rounded-bl-sm shadow-sm'}`}>
                  {msg.content}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 shrink-0">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-end space-x-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 p-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <button 
                type="button"
                onClick={toggleListen}
                className={`p-2.5 rounded-full transition-colors flex-shrink-0 ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isListening ? "Listening..." : "Tell me what to add..."}
                className="flex-1 bg-gray-50 dark:bg-gray-800 dark:text-white px-4 py-2.5 rounded-full text-sm outline-none border border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
              
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-full bg-purple-600 text-white disabled:opacity-50 hover:bg-purple-700 transition-colors flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ChatAssistant;
