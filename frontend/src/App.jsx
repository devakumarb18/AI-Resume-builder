import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ResumeBuilder from './pages/ResumeBuilder';
import PublicResume from './pages/PublicResume';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Toaster position="top-right" />
        <Navbar />
        <main className="flex-grow flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/share/:id" element={<PublicResume />} />
            
            {/* Protected Routes - only logged in users can access these */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/builder/:id?" element={
              <ProtectedRoute>
                <ResumeBuilder />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        {/* Simple Footer */}
        <footer className="bg-white border-t border-gray-200 py-8 text-center text-gray-500">
          <p>© {new Date().getFullYear()} AI Resume Builder. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
