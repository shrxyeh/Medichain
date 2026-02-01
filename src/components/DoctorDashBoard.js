import { useState, useEffect } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
import { useSecurityContext } from "../context/SecurityContext";
import AccessControlPanel from "./AccessControlPanel";
import ZKVerificationModal from "./ZKVerificationModal";

const DoctorDashBoard = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const { authenticateUser, currentUser } = useSecurityContext();

  const [doctorDetails, setDoctorDetails] = useState(null);
  const [showAccessPanel, setShowAccessPanel] = useState(false);
  const [showZKModal, setShowZKModal] = useState(false);

  const viewPatientList = () => {
    navigate(`/doctor/${hhNumber}/patientlist`);
  };

  const viewDoctorProfile = () => {
    navigate(`/doctor/${hhNumber}/viewdoctorprofile`);
  };

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        console.error("Please install MetaMask extension");
        return;
      }

      try {
        const web3Instance = new Web3(window.ethereum);
        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = DoctorRegistration.networks[networkId] ||
          DoctorRegistration.networks["31337"];

        if (!deployedNetwork) {
          console.error("Contract not deployed on this network");
          return;
        }

        const contractInstance = new web3Instance.eth.Contract(
          DoctorRegistration.abi,
          deployedNetwork.address
        );

        const result = await contractInstance.methods.getDoctorDetails(hhNumber).call();
        setDoctorDetails(result);

        if (result && !currentUser) {
          await authenticateUser({
            hhNumber,
            name: result[1],
            specialization: result[6],
          }, "doctor");
        }
      } catch (error) {
        console.error("Error initializing:", error);
      }
    };

    init();
  }, [hhNumber, authenticateUser, currentUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <NavBar_Logout />

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center items-center">
        {/* Security Status Bar */}
        <div className="fixed top-20 right-4 flex gap-2 z-40">
          <button
            onClick={() => setShowZKModal(true)}
            className="zk-indicator hover:scale-105 transition-transform cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            ZK Active
          </button>
          <button
            onClick={() => setShowAccessPanel(true)}
            className="badge-success hover:scale-105 transition-transform cursor-pointer flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-green-400" />
            ABAC Protected
          </button>
        </div>

        {/* Welcome Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="gradient-text">Doctor Dashboard</span>
          </h2>
          {doctorDetails && (
            <p className="text-xl sm:text-2xl text-gray-300">
              Welcome, Dr. <span className="font-bold text-primary-400">{doctorDetails[1]}</span>
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">ID: {hhNumber}</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {/* View Profile Card */}
          <div onClick={viewDoctorProfile} className="dashboard-card cursor-pointer group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">View Profile</h3>
            <p className="text-gray-400 text-sm">Access your professional profile and credentials</p>
          </div>

          {/* Patient List Card */}
          <div onClick={viewPatientList} className="dashboard-card cursor-pointer group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Patient List</h3>
            <p className="text-gray-400 text-sm">View patients who have granted you access</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="badge-success text-xs">Permission Required</span>
            </div>
          </div>

          {/* Access Control Card */}
          <div onClick={() => setShowAccessPanel(true)} className="dashboard-card cursor-pointer group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Access Control</h3>
            <p className="text-gray-400 text-sm">View ABAC policies and audit logs</p>
          </div>

          {/* ZK Verification Card */}
          <div onClick={() => setShowZKModal(true)} className="dashboard-card cursor-pointer group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">ZK Credentials</h3>
            <p className="text-gray-400 text-sm">Verify your credentials without exposing sensitive data</p>
          </div>
        </div>

        {/* Security Info Footer */}
        <div className="mt-12 glass-card p-4 rounded-xl max-w-2xl w-full">
          <div className="flex items-center gap-4 justify-center flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              HIPAA Compliant
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              ZK proof verified
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Permission-based access
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAccessPanel && <AccessControlPanel onClose={() => setShowAccessPanel(false)} />}
      {showZKModal && <ZKVerificationModal onClose={() => setShowZKModal(false)} />}
    </div>
  );
};

export default DoctorDashBoard;
