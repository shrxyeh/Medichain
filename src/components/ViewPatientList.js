import { useState, useEffect } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBarLogout from "./NavBar_Logout";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";

const ViewPatientList = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();

  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const networkId = await web3Instance.eth.net.getId();
          const networkIdStr = networkId.toString();
          const deployedNetwork = DoctorRegistration.networks[networkIdStr] ||
            DoctorRegistration.networks["31337"];

          if (deployedNetwork) {
            const contractInstance = new web3Instance.eth.Contract(
              DoctorRegistration.abi,
              deployedNetwork.address
            );
            setContract(contractInstance);

            // Fetch patient list
            await fetchPatientList(contractInstance);
          } else {
            setError("DoctorRegistration contract not deployed. Please deploy the contract first.");
          }
        } catch (err) {

          setError("Failed to load patient list: " + err.message);
        }
      } else {
        setError("Please install MetaMask extension");
      }
      setLoading(false);
    };

    init();
  }, [hhNumber]);

  const fetchPatientList = async (contractInstance) => {
    try {
      // Get all patients who granted permission to this doctor
      const patientList = await contractInstance.methods
        .getPatientList(hhNumber)
        .call();

      // Deduplicate by patient_number (guard against multiple grants)
      const seen = new Set();
      const formattedPatients = patientList
        .filter(p => {
          if (seen.has(p.patient_number)) return false;
          seen.add(p.patient_number);
          return true;
        })
        .map((patient) => ({
          patientNumber: patient.patient_number,
          patientName: patient.patient_name,
        }));

      setPatients(formattedPatients);
    } catch (err) {

      throw err;
    }
  };

  const viewPatientRecords = (patientNumber) => {
    navigate(`/doctor/${hhNumber}/patient/${patientNumber}/records`);
  };

  const goBack = () => {
    navigate(`/doctor/${hhNumber}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <NavBarLogout />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Patient List</h2>
            <p className="text-gray-400 mt-1 text-sm">Patients who have granted you access</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <span className="spinner mx-auto block mb-3" />
              <p className="text-gray-400 text-sm">Loading patient list...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button onClick={goBack} className="btn-secondary px-6 py-2">Back</button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && patients.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No patients yet</h3>
              <p className="text-gray-500 text-sm mb-6">No patients have granted you access.</p>
              <button onClick={goBack} className="btn-secondary px-6 py-2">Back</button>
            </div>
          )}

          {/* Patient List */}
          {!loading && !error && patients.length > 0 && (
            <>
              <div className="glass-card rounded-2xl overflow-hidden">
                {patients.map((patient, index) => (
                  <div
                    key={patient.patientNumber}
                    className={`px-5 py-4 flex justify-between items-center ${
                      index !== patients.length - 1 ? "border-b border-white/5" : ""
                    }`}
                  >
                    <div>
                      <p className="text-white font-medium">{patient.patientName}</p>
                      <p className="text-gray-500 text-sm mt-0.5">HH: {patient.patientNumber}</p>
                    </div>
                    <button
                      onClick={() => viewPatientRecords(patient.patientNumber)}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      View Records
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <button onClick={goBack} className="btn-secondary w-full py-3">
                  ← Back to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewPatientList;
