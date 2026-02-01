import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import MedicalRecords from "../build/contracts/MedicalRecords.json";
import { uploadToIPFS, checkIPFSConnection } from "../utils/ipfsClient";

const UploadPastRecords = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();

  // State
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [recordType, setRecordType] = useState("0"); // PAST_RECORD
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [ipfsConnected, setIpfsConnected] = useState(false);
  const [contractReady, setContractReady] = useState(false);

  // Allowed file types
  const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const RECORD_TYPES = [
    { value: "0", label: "Medical Report" },
    { value: "1", label: "Lab Result" },
    { value: "2", label: "Prescription" },
    { value: "3", label: "Imaging (X-Ray, MRI)" },
    { value: "4", label: "Consultation Notes" },
  ];

  useEffect(() => {
    const init = async () => {
      // Check IPFS connection
      const isConnected = await checkIPFSConnection();
      setIpfsConnected(isConnected);

      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const fetchedAccounts = await web3Instance.eth.getAccounts();
          setAccounts(fetchedAccounts);

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
            setContractReady(true);
          } else {
            setError("MedicalRecords contract not deployed on this network. Please deploy the contract first.");
          }
        } catch (err) {
          console.error("Initialization error:", err);
          setError("Failed to connect to wallet: " + err.message);
        }
      } else {
        setError("Please install MetaMask extension");
      }
    };

    init();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);
    setSuccess(null);

    if (!selectedFile) {
      setFile(null);
      setFileName("");
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Invalid file type. Please upload PDF, images, or documents.");
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    if (!contract || !accounts.length) {
      setError("Wallet not connected or contract not loaded");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      // Step 1: Upload file to IPFS
      setUploadProgress(10);
      const ipfsResult = await uploadToIPFS(file, (progress) => {
        setUploadProgress(10 + Math.round(progress * 0.4)); // 10-50%
      });

      setUploadProgress(50);

      // Step 2: Prepare metadata
      const metadata = JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        description: description,
        recordCategory: RECORD_TYPES.find(t => t.value === recordType)?.label || "Medical Report",
        uploadedAt: new Date().toISOString(),
      });

      setUploadProgress(60);

      // Step 3: Store CID on blockchain
      let tx;
      if (recordType === "0") {
        // Use uploadPastRecord for past records
        tx = await contract.methods
          .uploadPastRecord(hhNumber, ipfsResult.cid, metadata)
          .send({ from: accounts[0] });
      } else {
        // Use uploadRecord with specific type
        tx = await contract.methods
          .uploadRecord(hhNumber, ipfsResult.cid, parseInt(recordType), metadata)
          .send({ from: accounts[0] });
      }

      setUploadProgress(100);

      // Get record ID from event
      const recordId = tx.events?.RecordUploaded?.returnValues?.recordId || "N/A";

      setSuccess({
        message: "Record uploaded successfully!",
        recordId: recordId,
        cid: ipfsResult.cid,
        transactionHash: tx.transactionHash,
      });

      // Reset form
      setFile(null);
      setFileName("");
      setDescription("");
      setRecordType("0");
      const fileInput = document.getElementById("fileInput");
      if (fileInput) fileInput.value = "";

    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/patient/${hhNumber}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-800">
      <NavBar_Logout />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-teal-400">
              Upload your Past Records
            </h2>
            <p className="text-gray-400">
              Securely store your medical records on IPFS
            </p>
          </div>

          {/* Connection Status */}
          <div className="flex justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              ipfsConnected ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-red-900/50 text-red-400 border border-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                ipfsConnected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              IPFS {ipfsConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              contractReady ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                contractReady ? 'bg-green-400' : 'bg-yellow-400'
              }`} />
              Contract {contractReady ? 'Ready' : 'Loading...'}
            </div>
          </div>

          {/* Upload Form */}
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700">
            {/* File Input */}
            <div className="mb-6">
              <label className="block font-bold text-white mb-2">Select File</label>
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-teal-500 transition-colors cursor-pointer"
                onClick={() => document.getElementById('fileInput').click()}>
                <input
                  id="fileInput"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                  className="hidden"
                />
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-300">
                  {fileName || 'Click to select or drag and drop'}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  PDF, Images, Documents (Max 10MB)
                </p>
              </div>
            </div>

            {/* Record Type */}
            <div className="mb-6">
              <label className="block font-bold text-white mb-2">Record Type</label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white bg-gray-700 border border-gray-600 focus:border-teal-500 focus:outline-none transition-colors"
              >
                {RECORD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block font-bold text-white mb-2">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the record..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-white bg-gray-700 border border-gray-600 focus:border-teal-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Uploading...</span>
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
              <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-xl text-red-400">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-xl text-green-400">
                <p className="font-medium">{success.message}</p>
                <p className="text-sm mt-2">Record ID: {success.recordId}</p>
                <p className="text-sm truncate">CID: {success.cid}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleUpload}
                disabled={uploading || !file || !contractReady}
                className="px-6 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
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

export default UploadPastRecords;
