import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import DiagnosticRegistration from "../build/contracts/DiagnosticRegistration.json";

const DiagnosticDashBoard = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [diagnosticDetails, setDiagnosticDetails] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return;
      try {
        const web3Instance = new Web3(window.ethereum);
        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork =
          DiagnosticRegistration.networks[networkId] ||
          DiagnosticRegistration.networks["31337"];
        const contractInstance = new web3Instance.eth.Contract(
          DiagnosticRegistration.abi,
          deployedNetwork && deployedNetwork.address
        );
        const result = await contractInstance.methods
          .getDiagnosticDetails(hhNumber)
          .call();
        setDiagnosticDetails(result);
      } catch (err) {
        // handled silently — user sees empty state
      }
    };
    init();
  }, [hhNumber]);

  const cards = [
    {
      label: "View Profile",
      description: "Review your facility information and credentials",
      onClick: () => navigate(`/diagnostic/${hhNumber}/viewdiagnosticprofile`),
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      gradient: "from-teal-400 to-cyan-500",
    },
    {
      label: "Create Lab Report",
      description: "Upload diagnostic results and associate them with patient records",
      onClick: () => navigate(`/diagnostic/${hhNumber}/diagnosticform`),
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gradient: "from-purple-400 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <NavBar_Logout />

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center items-center">
        {/* Welcome Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="gradient-text">Diagnostic Dashboard</span>
          </h2>
          {diagnosticDetails && (
            <p className="text-xl sm:text-2xl text-gray-300">
              Welcome,{" "}
              <span className="font-bold text-primary-400">{diagnosticDetails[1]}</span>
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">ID: {hhNumber}</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          {cards.map((card) => (
            <div
              key={card.label}
              onClick={card.onClick}
              className="dashboard-card cursor-pointer group"
            >
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                {card.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{card.label}</h3>
              <p className="text-gray-400 text-sm">{card.description}</p>
            </div>
          ))}
        </div>

        {/* Security Footer */}
        <div className="mt-12 glass-card p-4 rounded-xl max-w-2xl w-full">
          <div className="flex items-center gap-6 justify-center flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              IPFS-backed storage
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              On-chain audit trail
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Patient-permissioned
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticDashBoard;
