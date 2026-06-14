import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Command, LogOut, User, Moon, Sun } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    // Check local storage or system preference
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`${isHome ? 'absolute w-full bg-transparent border-transparent' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 sticky shadow-sm'} border-b top-0 z-50 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 shadow-[0_0_15px_rgba(34,211,238,0.3)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] group-hover:scale-105 transition-all duration-300">
                <Command size={18} className="text-white" />
              </div>
              <span className={`font-black text-2xl tracking-tighter ${isHome ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                Free<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Resume</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />}
            </button>
            {user ? (
              <>
                <Link to="/dashboard" className={`${isHome ? 'text-gray-300 hover:text-white' : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'} font-medium transition-colors`}>
                  Dashboard
                </Link>
                <div className={`h-6 w-px ${isHome ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'} mx-2`}></div>
                <div className={`flex items-center gap-2 text-sm ${isHome ? 'text-gray-200 bg-white/10 border-white/10' : 'text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'} px-3 py-1.5 rounded-full border`}>
                  <User size={16} />
                  <span>{user.name}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className={`flex items-center gap-2 ${isHome ? 'text-gray-400 hover:text-rose-400' : 'text-gray-500 hover:text-red-500'} transition-colors p-2`}
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`${isHome ? 'text-gray-300 hover:text-white' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'} font-medium transition-colors`}>
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
