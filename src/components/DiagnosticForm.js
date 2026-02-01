import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import MedicalRecords from "../build/contracts/MedicalRecords.json";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import { uploadToIPFS, checkIPFSConnection } from "../utils/ipfsClient";

// Simple unique ID generator (avoids uuid dependency)
const generateUniqueId = () => {
  return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 11);
};

const DiagnosticForm = () => {
  const { hhNumber: diagnosticHhNumber } = useParams();
  const navigate = useNavigate();

  // Web3 State
  const [web3, setWeb3] = useState(null);
  const [medicalRecordsContract, setMedicalRecordsContract] = useState(null);
  const [patientContract, setPatientContract] = useState(null);
  const [accounts, setAccounts] = useState([]);

  // Form State
  const [recordId, setRecordId] = useState("");
  const [patientHhNumber, setPatientHhNumber] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [patientWallet, setPatientWallet] = useState("");
  const [diagnosticWallet, setDiagnosticWallet] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");

  // UI State
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [ipfsConnected, setIpfsConnected] = useState(false);
  const [patientVerified, setPatientVerified] = useState(false);
  const [contractsReady, setContractsReady] = useState(false);

  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const GENDERS = ["Male", "Female", "Other"];

  useEffect(() => {
    const init = async () => {
      // Generate unique record ID
      setRecordId(`EHR${generateUniqueId()}`);

      const connected = await checkIPFSConnection();
      setIpfsConnected(connected);

      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const fetchedAccounts = await web3Instance.eth.getAccounts();
          setAccounts(fetchedAccounts);
          if (fetchedAccounts.length > 0) {
            setDiagnosticWallet(fetchedAccounts[0]);
          }

          const networkId = await web3Instance.eth.net.getId();
          const networkIdStr = networkId.toString();

          // Load MedicalRecords contract
          const medRecordsNetwork = MedicalRecords.networks[networkIdStr] ||
            MedicalRecords.networks["31337"];
          if (medRecordsNetwork) {
            const medRecordsInstance = new web3Instance.eth.Contract(
              MedicalRecords.abi,
              medRecordsNetwork.address
            );
            setMedicalRecordsContract(medRecordsInstance);
          }

          // Load PatientRegistration contract
          const patientNetwork = PatientRegistration.networks[networkIdStr] ||
            PatientRegistration.networks["31337"];
          if (patientNetwork) {
            const patientInstance = new web3Instance.eth.Contract(
              PatientRegistration.abi,
              patientNetwork.address
            );
            setPatientContract(patientInstance);
          }

          if (medRecordsNetwork && patientNetwork) {
            setContractsReady(true);
          } else {
            setError("Contracts not deployed. Please deploy contracts first.");
          }
        } catch (err) {
          console.error("Initialization error:", err);
          setError("Failed to connect to blockchain: " + err.message);
        }
      } else {
        setError("Please install MetaMask extension");
      }
    };

    init();
  }, []);

  const verifyPatient = async () => {
    if (!patientHhNumber || patientHhNumber.length < 1) {
      setError("Please enter a valid patient HH number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isRegistered = await patientContract.methods
        .isRegisteredPatient(patientHhNumber)
        .call();

      if (!isRegistered) {
        setError("Patient not found in the system");
        setPatientVerified(false);
        setLoading(false);
        return;
      }

      const details = await patientContract.methods
        .getPatientDetails(patientHhNumber)
        .call();

      setPatientName(details.name);
      setGender(details.gender);
      setBloodGroup(details.bloodGroup);
      setPatientWallet(details.walletAddress);

      // Calculate age from DOB
      if (details.dateOfBirth) {
        const dob = new Date(details.dateOfBirth);
        const today = new Date();
        const calculatedAge = Math.floor(
          (today - dob) / (365.25 * 24 * 60 * 60 * 1000)
        );
        setAge(calculatedAge > 0 ? calculatedAge.toString() : "");
      }

      setPatientVerified(true);
      setError(null);
    } catch (err) {
      console.error("Patient verification failed:", err);
      setError("Failed to verify patient: " + err.message);
      setPatientVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
    }
  };

  const handleCreateRecord = async () => {
    // Just verify patient without uploading
    if (!patientVerified) {
      await verifyPatient();
    }
  };

  const handleUploadReport = async () => {
    if (!patientVerified) {
      setError("Please verify patient first by clicking 'Create Record'");
      return;
    }

    if (!file) {
      setError("Please select a report file to upload");
      return;
    }

    if (!doctorName.trim()) {
      setError("Please enter doctor name");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      // Step 1: Upload to IPFS
      setUploadProgress(10);
      const ipfsResult = await uploadToIPFS(file, (progress) => {
        setUploadProgress(10 + Math.round(progress * 0.4));
      });

      setUploadProgress(50);

      // Step 2: Prepare metadata
      const metadata = JSON.stringify({
        recordId: recordId,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        testType: "Lab Report",
        createdBy: diagnosticHhNumber,
        createdAt: new Date().toISOString(),
      });

      setUploadProgress(60);

      // Step 3: Store on blockchain
      const tx = await medicalRecordsContract.methods
        .createLabReport(
          patientHhNumber,
          doctorName,
          patientName,
          age,
          gender,
          bloodGroup,
          patientWallet,
          ipfsResult.cid,
          metadata
        )
        .send({ from: accounts[0] });

      setUploadProgress(100);

      // Get record ID from event
      const blockchainRecordId = tx.events?.LabReportCreated?.returnValues?.recordId || "N/A";

      setSuccess({
        message: "Lab report created successfully!",
        recordId: blockchainRecordId,
        cid: ipfsResult.cid,
        patientName: patientName,
      });

      // Reset form after successful upload
      setTimeout(() => {
        resetForm();
      }, 3000);

    } catch (err) {
      console.error("Failed to create lab report:", err);
      setError(err.message || "Failed to create lab report");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setRecordId(`EHR${generateUniqueId()}`);
    setPatientHhNumber("");
    setDoctorName("");
    setPatientName("");
    setAge("");
    setGender("");
    setBloodGroup("");
    setPatientWallet("");
    setFile(null);
    setFileName("");
    setPatientVerified(false);
    setSuccess(null);
    const fileInput = document.getElementById("reportFile");
    if (fileInput) fileInput.value = "";
  };

  const handleCancel = () => {
    navigate(`/diagnostic/${diagnosticHhNumber}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-800">
      <NavBar_Logout />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Create Lab Report
            </h2>
          </div>

          {/* Form */}
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Record ID (Auto-generated) */}
              <div className="form-group">
                <label className="block font-bold text-gray-400 mb-2">Record Id :</label>
                <p className="text-white font-mono text-sm break-all">{recordId}</p>
              </div>

              {/* Doctor Name */}
              <div className="form-group">
                <label className="block font-bold text-gray-400 mb-2">Doctor Name:</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Enter doctor's name"
                  className="w-full px-4 py-3 rounded-lg text-white bg-gray-700 border border-gray-600 focus:border-teal-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Patient Name */}
              <div className="form-group">
                <label className="block font-bold text-gray-400 mb-2">Patient Name:</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Patient name"
                  className="w-full px-4 py-3 rounded-lg text-white bg-gray-700 border border-gray-600 focus:border-teal-500 focus:outline-none transition-colors"
                  readOnly={patientVerified}
                />
              </div>

              {/* Age */}
              <div className="form-group">
                <label className="block font-bold text-gray-400 mb-2">Age:</label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  className="w-full px-4 py-3 rounded-lg text-white bg-gray-700 border border-gray-600 focus:border-teal-500 focus:outline-none transition-colors"
                  readOnly={patientVerified}
                />
              </div>

              {/* Gender */}
              <div className="form-group">
                <label className="block font-bold text-gray-400 mb-2">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-white bg-gray-700 border border-gray-600 focus:border-teal-500 focus:outline-none transition-colors"
                  disabled={patientVerified}
                >
                  <option value="">Select Gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Blood Group */}
              <div className="form-group">
                <label className="block font-bold text-gray-400 mb-2">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-white bg-gray-700 border border-gray-600 focus:border-teal-500 focus:outline-none transition-colors"
                  disabled={patientVerified}
                >
                  <option value="">Select Blood Group</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* Patient Wallet Address */}
              <div className="form-group">
                <label className="block font-bold text-gray-400 mb-2">Patient Wallet Address:</label>
                <input
                  type="text"
                  value={patientWallet}
                  onChange={(e) => setPatientWallet(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 rounded-lg text-white bg-gray-700 border border-gray-600 focus:border-teal-500 focus:outline-none transition-colors font-mono text-sm"
                  readOnly={patientVerified}
                />
              </div>

              {/* Diagnostic Wallet Address */}
              <div className="form-group">
                <label className="block font-bold text-gray-400 mb-2">Diagnostic Wallet Address:</label>
                <input
                  type="text"
                  value={diagnosticWallet}
                  readOnly
                  className="w-full px-4 py-3 rounded-lg text-white bg-gray-600 border border-gray-600 font-mono text-sm cursor-not-allowed"
                />
              </div>

              {/* File Upload - Full Width */}
              <div className="form-group sm:col-span-2">
                <label className="block font-bold text-gray-400 mb-2">Upload Final Report</label>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="reportFile"
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg cursor-pointer hover:bg-gray-500 transition-colors"
                  >
                    Choose file
                  </label>
                  <span className="text-gray-400 text-sm truncate flex-1">
                    {fileName || "No file chosen"}
                  </span>
                  <input
                    id="reportFile"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Patient HH Number for verification (hidden section) */}
              {!patientVerified && (
                <div className="form-group sm:col-span-2">
                  <label className="block font-bold text-gray-400 mb-2">Patient HH Number (for verification):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={patientHhNumber}
                      onChange={(e) => setPatientHhNumber(e.target.value)}
                      placeholder="Enter patient HH number"
                      className="flex-1 px-4 py-3 rounded-lg text-white bg-gray-700 border border-gray-600 focus:border-teal-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Creating report...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-xl text-red-400">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mt-6 p-4 bg-green-900/50 border border-green-700 rounded-xl text-green-400">
                <p className="font-medium">{success.message}</p>
                <p className="text-sm mt-2">Record ID: {success.recordId}</p>
                <p className="text-sm">Patient: {success.patientName}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={handleCreateRecord}
                disabled={loading || patientVerified || !contractsReady}
                className={`px-6 py-3 font-bold rounded-lg transition-colors ${
                  patientVerified
                    ? 'bg-green-600 text-white cursor-not-allowed'
                    : 'bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                ) : patientVerified ? (
                  'Patient Verified'
                ) : (
                  'Create Record'
                )}
              </button>

              <button
                onClick={handleUploadReport}
                disabled={uploading || !patientVerified || !file || !contractsReady}
                className="px-6 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Upload Report'
                )}
              </button>
            </div>

            {/* Cancel Button */}
            <div className="flex justify-center mt-4">
              <button
                onClick={handleCancel}
                className="px-8 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticForm;
