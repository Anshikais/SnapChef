import React, { useState, useEffect } from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { isSignedIn, user } = useUser();

  const [isOpen, setIsOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
      return savedTheme === 'dark';
    }

    return true; // Default Dark Mode
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
    <nav
      className={`navbar sticky-top shadow-sm mb-4 ${
        isDarkMode ? 'navbar-dark-custom' : 'bg-white'
      }`}
    >
      <div className="container">

        <Link
          to="/"
          className="navbar-brand fw-bold text-decoration-none"
        >
          <span style={{ fontSize: '1.8rem' }}>🍳</span>
          SnapChef
        </Link>

        {isSignedIn && (
          <button
            className="mobile-menu-btn"
            onClick={() => setIsOpen(!isOpen)}
          >
            ☰
          </button>
        )}

        {isSignedIn && (
          <div
            className={`navbar-nav nav-links ms-4 ${
              isOpen ? 'mobile-open' : ''
            }`}
          >
            <Link
              className="nav-link fw-medium"
              to="/"
              onClick={() => setIsOpen(false)}
            >
              Scanner
            </Link>

            <Link
              className="nav-link fw-medium"
              to="/diet-ai"
              onClick={() => setIsOpen(false)}
            >
              Diet AI
            </Link>

            <Link
              className="nav-link fw-medium"
              to="/dish-ai"
              onClick={() => setIsOpen(false)}
            >
              Dish AI
            </Link>
          </div>
        )}

        <div className="d-flex align-items-center ms-auto">

          <button
            className="btn btn-link text-decoration-none me-3 fs-5"
            onClick={toggleTheme}
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