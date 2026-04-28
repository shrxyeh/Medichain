import { useState, useEffect } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import MedicalRecords from "../build/contracts/MedicalRecords.json";
import { getIPFSUrl } from "../utils/ipfsClient";

const ViewPatientRecords = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();

  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [records, setRecords] = useState([]);
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
          const deployedNetwork = MedicalRecords.networks[networkIdStr] ||
            MedicalRecords.networks["31337"];

          if (deployedNetwork) {
            const contractInstance = new web3Instance.eth.Contract(
              MedicalRecords.abi,
              deployedNetwork.address
            );
            setContract(contractInstance);

            // Fetch records
            await fetchRecords(contractInstance);
          } else {
            setError("MedicalRecords contract not deployed. Please deploy the contract first.");
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
  }, [hhNumber]);

  const fetchRecords = async (contractInstance) => {
    try {
      // Get all record IDs for patient
      const recordIds = await contractInstance.methods
        .getPatientRecordIds(hhNumber)
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
    if (!url) return;

    // data: URLs can't render PDFs directly in Chrome/Brave — convert to blob URL first
    if (url.startsWith('data:')) {
      const [header, base64] = url.split(',');
      const mimeType = header.split(':')[1].split(';')[0];
      const bytes = atob(base64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
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

  const RECORD_TYPE_LABELS = {
    0: "Medical Report",
    1: "Lab Report",
    2: "Prescription",
    3: "Imaging",
    4: "Consultation",
  };

  const RECORD_TYPE_COLORS = {
    0: "bg-blue-500/20 text-blue-400",
    1: "bg-purple-500/20 text-purple-400",
    2: "bg-green-500/20 text-green-400",
    3: "bg-orange-500/20 text-orange-400",
    4: "bg-teal-500/20 text-teal-400",
  };

  const goBack = () => {
    navigate(`/patient/${hhNumber}`);
  };

  const goToUpload = () => {
    navigate(`/patient/${hhNumber}/upload`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <NavBar_Logout />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Medical Records</h2>
            <p className="text-gray-400 mt-1 text-sm">Your complete health record history</p>
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

          {!loading && !error && records.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/5 flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No records yet</h3>
              <p className="text-gray-500 text-sm mb-6">Upload your first medical record to get started.</p>
              <div className="flex justify-center gap-3">
                <button onClick={goToUpload} className="btn-primary px-5 py-2">Upload Record</button>
                <button onClick={goBack} className="btn-secondary px-5 py-2">Back</button>
              </div>
            </div>
          )}

          {!loading && !error && records.length > 0 && (
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
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium text-sm">Record #{record.id}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RECORD_TYPE_COLORS[record.recordType] || "bg-gray-500/20 text-gray-400"}`}>
                          {RECORD_TYPE_LABELS[record.recordType] || "Unknown"}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs">{formatDate(record.uploadedAt)}</p>
                      {record.metadata?.filename && (
                        <p className="text-gray-600 text-xs mt-0.5 truncate max-w-xs">{record.metadata.filename}</p>
                      )}
                    </div>
                    <button onClick={() => openRecord(record)} className="btn-primary px-4 py-2 text-sm">
                      View
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

export default ViewPatientRecords;
