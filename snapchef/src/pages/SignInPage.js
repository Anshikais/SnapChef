import React from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '100vh' }}
      >
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      className="container d-flex flex-column justify-content-center align-items-center"
      style={{
        minHeight: '100vh',
        padding: '2rem',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Logo Section */}
      <div className="text-center mb-4">
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 15px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '2rem',
          }}
        >
          🍳
        </div>

        <h1
          className="fw-bold"
          style={{
            color: '#ff6b6b',
            fontSize: '3rem',
            marginBottom: '10px',
          }}
        >
          SnapChef
        </h1>

        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '1rem',
          }}
        >
          Welcome back! Please sign in to continue.
        </p>
      </div>

      {/* Glass Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '500px',

          background: 'rgba(255,255,255,0.06)',

          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',

          border: '1px solid rgba(255,255,255,0.12)',

          borderRadius: '30px',

          boxShadow:
            '0 8px 32px rgba(0,0,0,.35), 0 0 60px rgba(75,31,111,.15)',

          padding: '20px',
        }}
      >
        <SignIn
          routing="hash"
          appearance={{
            elements: {
              rootBox: {
                width: '100%',
              },

              card: {
                background: 'transparent',
                boxShadow: 'none',
                border: 'none',
              },

              headerTitle: {
                color: '#ffffff',
                fontSize: '28px',
                fontWeight: '700',
              },

              headerSubtitle: {
                color: 'rgba(255,255,255,0.7)',
              },

              socialButtonsBlockButton: {
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ffffff',
              },

              formFieldInput: {
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ffffff',
              },

              formButtonPrimary: {
                background:
                  'linear-gradient(135deg,#ff6b6b,#ff8e8e)',
                border: 'none',
              },

              footerActionLink: {
                color: '#ff6b6b',
              },

              dividerLine: {
                background: 'rgba(255,255,255,0.15)',
              },

              dividerText: {
                color: 'rgba(255,255,255,0.5)',
              },
            },
          }}
        />
      </div>
    </div>
  );
}