import React, { useState, useEffect } from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <nav className={`navbar navbar-expand-lg sticky-top shadow-sm mb-4 ${isDarkMode ? 'navbar-dark-custom' : 'bg-white'}`} style={{ transition: 'all 0.3s ease' }}>
      <div className="container">
        <Link to="/" className="navbar-brand fw-bold text-decoration-none" style={{ color: '#ff6b6b' }}>
          <span style={{ fontSize: '1.8rem' }}>🍳</span> SnapChef
        </Link>

        {isSignedIn && (
          <div className="navbar-nav me-auto mb-2 mb-lg-0 ms-4">
            <Link className="nav-link fw-medium" to="/">Scanner</Link>
            <Link className="nav-link fw-medium" to="/diet-ai">Diet AI</Link>
            <Link className="nav-link fw-medium" to="/dish-ai">Dish AI</Link>
          </div>
        )}

        <div className="d-flex align-items-center ms-auto">
          <button 
            className="btn btn-link text-decoration-none me-3 fs-5" 
            onClick={toggleTheme}
            style={{ transition: 'all 0.3s ease' }}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          {isSignedIn && (
            <>
              <span className="me-3 fw-medium navbar-text-custom">
                Hello, {user?.firstName || user?.username || 'Chef'}!
              </span>
              <UserButton afterSignOutUrl="/sign-in" />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
