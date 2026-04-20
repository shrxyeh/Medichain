import React, { useState } from "react";
import Web3 from "web3";
import DiagnosticRegistration from "../build/contracts/DiagnosticRegistration.json";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import { hashPassword } from "../utils/hashPassword";

const DiagnosticLogin = () => {
  const navigate = useNavigate();
  const [hhNumber, setHhNumber] = useState("");
  const [hhNumberError, setHhNumberError] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleHhNumberChange = (e) => {
    const value = e.target.value;
    setHhNumber(value);
    if (value && !/^\d{6}$/.test(value)) {
      setHhNumberError("Must be exactly 6 digits");
    } else {
      setHhNumberError("");
    }
  };

  const handleLogin = async () => {
    if (!hhNumber || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (hhNumberError) return;

    setError("");
    setLoading(true);
    try {
      const web3 = new Web3(window.ethereum);
      const networkId = await web3.eth.net.getId();
      const deployedNetwork =
        DiagnosticRegistration.networks[networkId] ||
        DiagnosticRegistration.networks["31337"];
      const contract = new web3.eth.Contract(
        DiagnosticRegistration.abi,
        deployedNetwork && deployedNetwork.address
      );

      const isRegistered = await contract.methods.isRegisteredDiagnostic(hhNumber).call();
      if (!isRegistered) {
        setError("No diagnostic center account found with this HH Number.");
        return;
      }

      const isValidPassword = await contract.methods.validatePassword(hhNumber, hashPassword(password)).call();
      if (!isValidPassword) {
        setError("Incorrect password. Please try again.");
        return;
      }

      navigate("/diagnostic/" + hhNumber);
    } catch (err) {
      setError("Unable to connect. Make sure MetaMask is installed and connected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <NavBar />

      <div className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Diagnostic Center Sign In</h1>
            <p className="text-sm text-gray-400">Access your lab portal</p>
          </div>

          {/* Card */}
          <div className="glass-card rounded-2xl p-8">
            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="form-group">
                <label className="form-label">HH Number</label>
                <input
                  type="text"
                  className={`glass-input mt-1 ${hhNumberError ? "border-red-500/60" : ""}`}
                  placeholder="6-digit identifier"
                  value={hhNumber}
                  onChange={handleHhNumberChange}
                  maxLength={6}
                />
                {hhNumberError && (
                  <p className="text-red-400 text-xs mt-1">{hhNumberError}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="glass-input mt-1"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Verifying...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/diagnostic_registration")}
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                Register your center
              </button>
            </p>
            <button
              onClick={() => navigate("/login")}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              ← Back to role selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticLogin;
