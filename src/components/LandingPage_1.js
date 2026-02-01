import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";

function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Zero Knowledge Proofs",
      description: "Verify identity and attributes without revealing sensitive data. Prove you're over 18 without sharing your birthdate.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "ABAC Access Control",
      description: "Attribute-Based Access Control ensures only authorized personnel access your records based on role and permissions.",
      gradient: "from-teal-500 to-cyan-500",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: "Blockchain Secured",
      description: "Immutable health records stored on Ethereum blockchain with IPFS for decentralized, tamper-proof storage.",
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      title: "Patient-Controlled",
      description: "You decide who accesses your health data. Grant and revoke permissions to doctors and diagnostic centers.",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <NavBar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-gray-300">Powered by Ethereum & IPFS</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6">
              <span className="text-white">Secure Electronic</span>
              <br />
              <span className="gradient-text">Health Records</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10">
              Revolutionizing healthcare data management with blockchain technology,
              Zero Knowledge proofs, and Attribute-Based Access Control for
              unparalleled security and privacy.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/register")}
                className="btn-primary text-lg px-8 py-4"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate("/login")}
                className="btn-secondary text-lg px-8 py-4"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-2xl hover:scale-105 transition-all duration-300 cursor-default group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card rounded-3xl p-8 sm:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Privacy-First Healthcare
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Our advanced security features ensure your health data remains private and under your control.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: "256-bit", label: "Encryption" },
                { value: "ZK", label: "Proof System" },
                { value: "ABAC", label: "Access Control" },
                { value: "100%", label: "Decentralized" },
              ].map((stat, index) => (
                <div key={index} className="text-center p-4">
                  <p className="text-3xl sm:text-4xl font-bold gradient-text mb-2">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-400">Simple, secure, and patient-controlled</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Register Securely",
                description: "Create your account with MetaMask. Your credentials are secured with ZK commitments.",
              },
              {
                step: "02",
                title: "Control Access",
                description: "Grant or revoke access to doctors and diagnostic centers using ABAC policies.",
              },
              {
                step: "03",
                title: "Share Privately",
                description: "Share verified health attributes without revealing sensitive underlying data.",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="glass-card-inner p-6 rounded-2xl h-full">
                  <span className="text-6xl font-bold text-white/5 absolute top-4 right-4">
                    {item.step}
                  </span>
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12 gradient-border">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Secure Your Health Data?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of patients and healthcare providers who trust MediChain for secure, private health record management.
            </p>
            <button
              onClick={() => navigate("/register")}
              className="btn-primary text-lg px-10 py-4"
            >
              Create Your Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;