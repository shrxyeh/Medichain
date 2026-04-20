import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";

const roles = [
  {
    label: "Doctor",
    path: "/doctor_login",
    description: "Access patient records and manage clinical data",
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    gradient: "from-blue-500 to-indigo-600",
    accent: "border-blue-500/30 hover:border-blue-500/60",
    tag: "Clinical Access",
  },
  {
    label: "Patient",
    path: "/patient_login",
    description: "View your health records and manage data permissions",
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    gradient: "from-teal-500 to-cyan-600",
    accent: "border-teal-500/30 hover:border-teal-500/60",
    tag: "Patient Portal",
  },
  {
    label: "Diagnostic Center",
    path: "/diagnostic_login",
    description: "Upload lab reports and manage diagnostic results",
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    gradient: "from-purple-500 to-pink-600",
    accent: "border-purple-500/30 hover:border-purple-500/60",
    tag: "Lab Portal",
  },
];

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <NavBar />

      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-3xl animate-fade-in">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Sign in to <span className="gradient-text">MediChain</span>
            </h1>
            <p className="text-gray-400">
              Select your role to continue to your secure portal
            </p>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {roles.map((role) => (
              <button
                key={role.path}
                onClick={() => navigate(role.path)}
                className={`group glass-card rounded-2xl p-6 text-left border transition-all duration-300 ${role.accent} hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className={`w-13 h-13 w-12 h-12 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {role.icon}
                </div>
                <span className="text-xs font-medium text-gray-500 mb-1 block">{role.tag}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{role.label}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{role.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                  Continue
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* Footer link */}
          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
