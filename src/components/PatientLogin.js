import React, { useState } from "react";
import Web3 from "web3";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import { hashPassword } from "../utils/hashPassword";

const PatientLogin = () => {
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
        PatientRegistration.networks[networkId] ||
        PatientRegistration.networks["31337"];
      const contract = new web3.eth.Contract(
        PatientRegistration.abi,
        deployedNetwork && deployedNetwork.address
      );

      const isRegistered = await contract.methods.isRegisteredPatient(hhNumber).call();
      if (!isRegistered) {
        setError("No patient account found with this HH Number.");
        return;
      }

      const isValidPassword = await contract.methods.validatePassword(hhNumber, hashPassword(password)).call();
      if (!isValidPassword) {
        setError("Incorrect password. Please try again.");
        return;
      }

      navigate("/patient/" + hhNumber);
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Patient Sign In</h1>
            <p className="text-sm text-gray-400">Access your health records securely</p>
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
                onClick={() => navigate("/patient_registration")}
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                Register as Patient
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

export default PatientLogin;
