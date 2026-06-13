import React from "react";
import { SignIn, useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="spinner-border text-danger"></div>
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
        minHeight: "100vh",
        position: "relative",
        zIndex: 2,
      }}
    >
      {/* Logo */}
      <div className="text-center mb-4">
        <div
          className="logo-float"
          style={{
            fontSize: "4rem",
            marginBottom: "10px",
          }}
        >
          👨‍🍳
        </div>

        <h1
          style={{
            color: "#ff6b6b",
            fontWeight: "700",
            fontSize: "3rem",
          }}
        >
          SnapChef
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,.7)",
          }}
        >
          AI Powered Recipe Assistant
        </p>
      </div>

      <SignIn
        routing="hash"
        appearance={{
          elements: {
            rootBox: {
              width: "100%",
              maxWidth: "420px",
            },

            card: {
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: "24px",
              boxShadow:
                "0 20px 60px rgba(0,0,0,.35)",
            },

            headerTitle: {
              display: "none",
            },

            headerSubtitle: {
              display: "none",
            },

            footer: {
              display: "none",
            },

            footerAction: {
              display: "none",
            },

            footerActionText: {
              display: "none",
            },

            footerActionLink: {
              display: "none",
            },

            socialButtonsBlockButton: {
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.12)",
              color: "#fff",
            },

            formFieldInput: {
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.15)",
              color: "#fff",
            },

            formButtonPrimary: {
              background:
                "linear-gradient(135deg,#ff6b6b,#ff8e8e)",
              border: "none",
            },

            dividerText: {
              color: "rgba(255,255,255,.5)",
            },

            dividerLine: {
              background: "rgba(255,255,255,.15)",
            },

            identityPreviewText: {
              color: "#fff",
            },
          },
        }}
      />
    </div>
  );
}