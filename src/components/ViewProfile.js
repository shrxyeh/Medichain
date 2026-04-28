import React, { useState, useEffect } from "react";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import Web3 from "web3";
import { useNavigate, useParams } from "react-router-dom";
import NavBarLogout from "./NavBar_Logout";

const Field = ({ label, value }) => (
  <div className="py-4 border-b border-white/5 last:border-0 flex flex-col sm:flex-row sm:items-center gap-1">
    <span className="text-sm text-gray-500 sm:w-40 shrink-0">{label}</span>
    <span className="text-white font-medium">{value || "—"}</span>
  </div>
);

const ViewProfile = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return;
      const web3Instance = new Web3(window.ethereum);
      const networkId = await web3Instance.eth.net.getId();
      const deployedNetwork = PatientRegistration.networks[networkId];
      const contractInstance = new web3Instance.eth.Contract(
        PatientRegistration.abi,
        deployedNetwork && deployedNetwork.address
      );
      setContract(contractInstance);
    };
    init();
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!contract || !hhNumber) return;
      try {
        const result = await contract.methods.getPatientDetails(hhNumber).call();
        setPatientDetails(result);
      } catch (err) {
        // silently fail
      }
    };
    fetchDetails();
  }, [contract, hhNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <NavBarLogout />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="w-full max-w-xl animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Patient Profile</h1>
              <p className="text-sm text-gray-500">HH Number: {hhNumber}</p>
            </div>
          </div>

          {/* Card */}
          <div className="glass-card rounded-2xl p-6">
            {patientDetails ? (
              <div>
                <Field label="Full Name" value={patientDetails.name} />
                <Field label="Date of Birth" value={patientDetails.dateOfBirth} />
                <Field label="Gender" value={patientDetails.gender} />
                <Field label="Blood Group" value={patientDetails.bloodGroup} />
                <Field label="Home Address" value={patientDetails.homeAddress} />
                <Field label="Email" value={patientDetails.email} />
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="spinner mx-auto block mb-3" />
                <p className="text-gray-500 text-sm">Loading profile...</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button onClick={() => navigate(`/patient/${hhNumber}`)} className="btn-secondary w-full">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;
