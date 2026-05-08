import React from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If user is already signed in, redirect them to home
  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', padding: '2rem 0' }}>
      <div className="text-center mb-4">
        <div className="mb-2" style={{ fontSize: '3rem' }}>🍳</div>
        <h1 className="fw-bold" style={{ color: '#ff6b6b' }}>SnapChef</h1>
        <p className="text-secondary">Welcome back! Please sign in to continue.</p>
      </div>
      
      <div className="card shadow-sm border-0" style={{ maxWidth: '400px', width: '100%', borderRadius: '15px' }}>
        <div className="card-body p-4 d-flex justify-content-center">
          <SignIn routing="hash" />
        </div>
      </div>
    </div>
  );
}
