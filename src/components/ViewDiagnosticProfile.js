import React, { useState, useEffect } from "react";
import DiagnosticRegistration from "../build/contracts/DiagnosticRegistration.json";
import Web3 from "web3";
import { useNavigate, useParams } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";

const Field = ({ label, value }) => (
  <div className="py-4 border-b border-white/5 last:border-0 flex flex-col sm:flex-row sm:items-center gap-1">
    <span className="text-sm text-gray-500 sm:w-44 shrink-0">{label}</span>
    <span className="text-white font-medium">{value || "—"}</span>
  </div>
);

const ViewDiagnosticProfile = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!window.ethereum) return;
      try {
        const web3Instance = new Web3(window.ethereum);
        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork =
          DiagnosticRegistration.networks[networkId] ||
          DiagnosticRegistration.networks["31337"];
        const contract = new web3Instance.eth.Contract(
          DiagnosticRegistration.abi,
          deployedNetwork && deployedNetwork.address
        );
        const result = await contract.methods.getDiagnosticDetails(hhNumber).call();
        setDetails(result);
      } catch (err) {
        // silently fail
      }
    };
    fetchDetails();
  }, [hhNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <NavBar_Logout />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="w-full max-w-xl animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Diagnostic Center Profile</h1>
              <p className="text-sm text-gray-500">HH Number: {hhNumber}</p>
            </div>
          </div>

          {/* Card */}
          <div className="glass-card rounded-2xl p-6">
            {details ? (
              <div>
                <Field label="Center Name" value={details[1]} />
                <Field label="Hospital" value={details[2]} />
                <Field label="Location" value={details[3]} />
                <Field label="Email" value={details[4]} />
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="spinner mx-auto block mb-3" />
                <p className="text-gray-500 text-sm">Loading profile...</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button onClick={() => navigate(`/diagnostic/${hhNumber}`)} className="btn-secondary w-full">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDiagnosticProfile;
