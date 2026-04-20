import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

const sections = [
  {
    title: "What is MediChain?",
    body: "MediChain is a decentralized Electronic Health Records platform built on Ethereum. It gives patients full ownership of their medical data while enabling secure, permissioned access for doctors and diagnostic centers — without any central authority.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    gradient: "from-teal-500 to-cyan-600",
  },
  {
    title: "For Patients",
    body: "Upload and view your full medical history stored immutably on IPFS. Control exactly which doctors can access your records, for how long, and revoke permissions at any time — all enforced by smart contracts.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    title: "For Doctors",
    body: "Access the complete medical history of patients who have granted you permission. Time-limited access ensures compliance and privacy. Clinical notes and consultation records are stored securely on-chain.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3" />
      </svg>
    ),
    gradient: "from-purple-500 to-pink-600",
  },
  {
    title: "For Diagnostic Centers",
    body: "Upload lab reports, imaging results, and test data directly to patient records on IPFS. Reports are cryptographically linked to the patient's on-chain identity, ensuring authenticity and traceability.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    gradient: "from-orange-500 to-red-500",
  },
];

const pillars = [
  { label: "Decentralized", description: "No central server. Records live on Ethereum and IPFS." },
  { label: "Patient-Owned", description: "You hold the keys. No third party controls your data." },
  { label: "Auditable", description: "Every access attempt is logged immutably on-chain." },
  { label: "Privacy-First", description: "Zero Knowledge Proofs verify identity without exposure." },
];

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <NavBar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5">
            About <span className="gradient-text">MediChain</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
            We believe health data belongs to the patient. MediChain is an open,
            blockchain-based platform that makes that a technical reality — not
            just a policy promise.
          </p>
        </div>
      </section>

      {/* Role sections */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {sections.map((s) => (
            <div key={s.title} className="glass-card rounded-2xl p-6">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white mb-4`}>
                {s.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              Our Core Principles
            </h2>
            <p className="text-gray-500 text-center text-sm mb-10">
              Every design decision traces back to these four ideas.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {pillars.map((p) => (
                <div key={p.label} className="text-center">
                  <p className="text-lg font-semibold gradient-text mb-2">{p.label}</p>
                  <p className="text-sm text-gray-500">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-8 text-sm">
            Create an account or sign in to your existing portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/register")} className="btn-primary px-8 py-3">
              Create Account
            </button>
            <button onClick={() => navigate("/")} className="btn-secondary px-8 py-3">
              Back to Home
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
