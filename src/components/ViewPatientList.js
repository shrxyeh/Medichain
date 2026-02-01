import { useState, useEffect } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import PatientRegistration from "../build/contracts/PatientRegistration.json";

const ViewPatientList = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();

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
          const deployedNetwork = PatientRegistration.networks[networkIdStr] ||
            PatientRegistration.networks["31337"];

          if (deployedNetwork) {
            const contractInstance = new web3Instance.eth.Contract(
              PatientRegistration.abi,
              deployedNetwork.address
            );
            setContract(contractInstance);

            // Fetch patient list
            await fetchPatientList(contractInstance);
          } else {
            setError("PatientRegistration contract not deployed. Please deploy the contract first.");
          }
        } catch (err) {
          console.error("Init failed:", err);
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

      // Transform the data
      const formattedPatients = patientList.map((patient) => ({
        patientNumber: patient.patient_number,
        patientName: patient.patient_name,
      }));

      setPatients(formattedPatients);
    } catch (err) {
      console.error("Failed to fetch patient list:", err);
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
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-800">
      <NavBar_Logout />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-teal-400">
              Patient List
            </h2>
            <p className="text-gray-400 mt-2">Patients who have granted you access</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-gray-900 rounded-2xl p-12 text-center border border-gray-700">
              <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-teal-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-400">Loading patient list...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-gray-900 rounded-2xl p-8 text-center border border-gray-700">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-400">{error}</p>
              <button
                onClick={goBack}
                className="mt-6 px-6 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition-colors"
              >
                Back
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && patients.length === 0 && (
            <div className="bg-gray-900 rounded-2xl p-12 text-center border border-gray-700">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-700/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Patients Found</h3>
              <p className="text-gray-400 mb-6">No patients have granted you access yet.</p>
              <button
                onClick={goBack}
                className="px-6 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition-colors"
              >
                Back
              </button>
            </div>
          )}

          {/* Patient List */}
          {!loading && !error && patients.length > 0 && (
            <>
              <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-700">
                {patients.map((patient, index) => (
                  <div
                    key={patient.patientNumber}
                    className={`p-4 flex justify-between items-center ${
                      index !== patients.length - 1 ? 'border-b border-gray-700' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-yellow-500 font-mono">
                        Patient : <span className="text-cyan-400">{patient.patientName}</span>
                      </p>
                      <p className="text-yellow-500 font-mono text-sm">
                        HH Number : <span className="text-gray-400">{patient.patientNumber}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => viewPatientRecords(patient.patientNumber)}
                      className="px-6 py-2 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition-colors"
                    >
                      View Records
                    </button>
                  </div>
                ))}
              </div>

              {/* Back Button */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={goBack}
                  className="px-8 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition-colors"
                >
                  Back
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
