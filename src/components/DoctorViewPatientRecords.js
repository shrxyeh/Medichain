import { useState, useEffect } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import MedicalRecords from "../build/contracts/MedicalRecords.json";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
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
  const [refreshCount, setRefreshCount] = useState(0);
  const [web3, setWeb3] = useState(null);
  const [patientContract, setPatientContract] = useState(null);
  const [medicalContract, setMedicalContract] = useState(null);

  // Consultation notes
  const notesKey = `doctorNotes_${hhNumber}_${patientHhNumber}`;
  const [notes, setNotes] = useState(() => localStorage.getItem(notesKey) || "");
  const [notesSaved, setNotesSaved] = useState(false);

  const saveNotes = () => {
    localStorage.setItem(notesKey, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

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

          // Check permission via DoctorRegistration contract
          const doctorDeployedNetwork = DoctorRegistration.networks[networkIdStr] ||
            DoctorRegistration.networks["31337"];
          const doctorContractInstance = new web3Instance.eth.Contract(
            DoctorRegistration.abi,
            doctorDeployedNetwork.address
          );
          const permission = await doctorContractInstance.methods
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

          setError("Failed to load records: " + err.message);
        }
      } else {
        setError("Please install MetaMask extension");
      }
      setLoading(false);
    };

    init();
  }, [hhNumber, patientHhNumber, refreshCount]);

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

      throw err;
    }
  };

  const openRecord = (record) => {
    const url = getIPFSUrl(record.ipfsCID);
    if (!url) {
      setError("File not available — it was stored in dev-mode localStorage which has since been cleared. Ask the patient to re-upload the record.");
      return;
    }

    if (url.startsWith('data:')) {
      const [header, base64] = url.split(',');
      const mimeType = header.split(':')[1].split(';')[0];
      const bytes = atob(base64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: mimeType });
      window.open(URL.createObjectURL(blob), '_blank');
    } else {
      window.open(url, '_blank');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <NavBar_Logout />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Patient Records</h2>
              {patientDetails && (
                <p className="text-gray-400 mt-1 text-sm">
                  {patientDetails.name} · HH: {patientHhNumber}
                </p>
              )}
            </div>
            <button
              onClick={() => { setLoading(true); setError(null); setRefreshCount(c => c + 1); }}
              disabled={loading}
              className="btn-secondary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loading && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <span className="spinner mx-auto block mb-3" />
              <p className="text-gray-400 text-sm">Loading records...</p>
            </div>
          )}

          {!loading && error && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button onClick={goBack} className="btn-secondary px-6 py-2">Back</button>
            </div>
          )}

          {!loading && !error && hasPermission && records.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/5 flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No records yet</h3>
              <p className="text-gray-500 text-sm mb-6">This patient has no medical records uploaded.</p>
              <button onClick={goBack} className="btn-secondary px-6 py-2">Back</button>
            </div>
          )}

          {!loading && !error && hasPermission && records.length > 0 && (
            <>
              <div className="glass-card rounded-2xl overflow-hidden">
                {records.map((record, index) => (
                  <div
                    key={record.id}
                    className={`px-5 py-4 flex justify-between items-center ${
                      index !== records.length - 1 ? "border-b border-white/5" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white font-medium text-sm">Record #{record.id}</p>
                        <span className="badge-success text-xs">
                          {RECORD_TYPE_LABELS[record.recordType] || "Unknown"}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs">Uploaded: {formatDate(record.uploadedAt)}</p>
                    </div>
                    <button onClick={() => openRecord(record)} className="btn-primary px-4 py-2 text-sm">
                      View
                    </button>
                  </div>
                ))}
              </div>
              {/* Consultation Notes */}
              <div className="mt-6 glass-card rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-1">Consultation Notes</h3>
                <p className="text-xs text-gray-500 mb-3">Private notes — stored locally, not shared on-chain.</p>
                <textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
                  rows={5}
                  placeholder="Enter your clinical observations, diagnosis, or follow-up notes..."
                  className="glass-input w-full resize-none text-sm"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs transition-opacity ${notesSaved ? "text-green-400 opacity-100" : "opacity-0"}`}>
                    Notes saved
                  </span>
                  <button onClick={saveNotes} className="btn-primary px-5 py-2 text-sm">
                    Save Notes
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <button onClick={goBack} className="btn-secondary w-full py-3">
                  ← Back to Patient List
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
