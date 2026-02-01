import { useState, useEffect } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import MedicalRecords from "../build/contracts/MedicalRecords.json";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import { getIPFSUrl } from "../utils/ipfsClient";

const RECORD_TYPE_LABELS = {
  0: "Past Record",
  1: "Lab Report",
  2: "Prescription",
  3: "Imaging",
  4: "Consultation"
};

const DoctorViewPatientRecords = () => {
  const { hhNumber, patientHhNumber } = useParams();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const networkId = await web3Instance.eth.net.getId();
          const networkIdStr = networkId.toString();

          // Initialize PatientRegistration contract
          const patientDeployedNetwork = PatientRegistration.networks[networkIdStr] ||
            PatientRegistration.networks["31337"];

          if (!patientDeployedNetwork) {
            setError("PatientRegistration contract not deployed.");
            setLoading(false);
            return;
          }

          const patientContractInstance = new web3Instance.eth.Contract(
            PatientRegistration.abi,
            patientDeployedNetwork.address
          );
          setPatientContract(patientContractInstance);

          // Check permission
          const permission = await patientContractInstance.methods
            .isPermissionGranted(patientHhNumber, hhNumber)
            .call();

          if (!permission) {
            setHasPermission(false);
            setError("Access denied. You do not have permission to view this patient's records.");
            setLoading(false);
            return;
          }

          setHasPermission(true);

          // Fetch patient details
          const details = await patientContractInstance.methods
            .getPatientDetails(patientHhNumber)
            .call();
          setPatientDetails(details);

          // Initialize MedicalRecords contract
          const medicalDeployedNetwork = MedicalRecords.networks[networkIdStr] ||
            MedicalRecords.networks["31337"];

          if (medicalDeployedNetwork) {
            const medicalContractInstance = new web3Instance.eth.Contract(
              MedicalRecords.abi,
              medicalDeployedNetwork.address
            );
            setMedicalContract(medicalContractInstance);

            // Fetch records
            await fetchRecords(medicalContractInstance);
          } else {
            setError("MedicalRecords contract not deployed.");
          }
        } catch (err) {
          console.error("Init failed:", err);
          setError("Failed to load records: " + err.message);
        }
      } else {
        setError("Please install MetaMask extension");
      }
      setLoading(false);
    };

    init();
  }, [hhNumber, patientHhNumber]);

  const fetchRecords = async (contractInstance) => {
    try {
      // Get all record IDs for patient
      const recordIds = await contractInstance.methods
        .getPatientRecordIds(patientHhNumber)
        .call();

      if (recordIds.length === 0) {
        setRecords([]);
        return;
      }

      // Fetch details for each record
      const recordDetails = await Promise.all(
        recordIds.map(async (id) => {
          const record = await contractInstance.methods.getRecord(id).call();
          let metadata = {};
          try {
            metadata = JSON.parse(record.metadata);
          } catch (e) {
            metadata = { description: record.metadata };
          }
          return {
            id: record.recordId,
            ipfsCID: record.ipfsCID,
            recordType: parseInt(record.recordType),
            uploadedAt: new Date(parseInt(record.uploadedAt) * 1000),
            uploadedBy: record.uploadedBy,
            metadata,
            isActive: record.isActive,
          };
        })
      );

      // Filter active records and sort by date (newest first)
      const activeRecords = recordDetails
        .filter(r => r.isActive)
        .sort((a, b) => b.uploadedAt - a.uploadedAt);

      setRecords(activeRecords);
    } catch (err) {
      console.error("Failed to fetch records:", err);
      throw err;
    }
  };

  const openRecord = (record) => {
    const url = getIPFSUrl(record.ipfsCID);
    window.open(url, '_blank');
  };

  const formatDate = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const goBack = () => {
    navigate(`/doctor/${hhNumber}/patientlist`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-800">
      <NavBar_Logout />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-teal-400">
              Record Viewer
            </h2>
            {patientDetails && (
              <div className="mt-4 bg-gray-900 rounded-xl p-4 border border-gray-700 inline-block">
                <p className="text-gray-400">
                  Patient: <span className="text-cyan-400 font-semibold">{patientDetails.name}</span>
                </p>
                <p className="text-gray-400 text-sm">
                  HH Number: <span className="text-gray-300">{patientHhNumber}</span>
                </p>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-gray-900 rounded-2xl p-12 text-center border border-gray-700">
              <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-teal-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-400">Loading records...</p>
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
          {!loading && !error && hasPermission && records.length === 0 && (
            <div className="bg-gray-900 rounded-2xl p-12 text-center border border-gray-700">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-700/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Records Found</h3>
              <p className="text-gray-400 mb-6">This patient has no medical records yet.</p>
              <button
                onClick={goBack}
                className="px-6 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition-colors"
              >
                Back
              </button>
            </div>
          )}

          {/* Records List */}
          {!loading && !error && hasPermission && records.length > 0 && (
            <>
              <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-700">
                {records.map((record, index) => (
                  <div
                    key={record.id}
                    className={`p-4 flex justify-between items-center ${
                      index !== records.length - 1 ? 'border-b border-gray-700' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-yellow-500 font-mono">
                          Record : <span className="text-cyan-400">{record.id}</span>
                        </p>
                        <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                          {RECORD_TYPE_LABELS[record.recordType] || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-yellow-500 font-mono text-sm">
                        Uploaded : <span className="text-gray-400">{formatDate(record.uploadedAt)}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => openRecord(record)}
                      className="px-6 py-2 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition-colors"
                    >
                      View
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

export default DoctorViewPatientRecords;
