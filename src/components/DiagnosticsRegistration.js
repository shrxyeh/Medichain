import React, { useState, useEffect } from "react";
import Web3 from "web3";
import DiagnosticRegistration from "../build/contracts/DiagnosticRegistration.json";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import { hashPassword } from "../utils/hashPassword";

const DiagnosticRegistry = () => {
  const [diagnosticAddress, setDiagnosticAddress] = useState("");
  const [diagnosticName, setDiagnosticName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [diagnosticLocation, setDiagnosticLocation] = useState("");
  const [hhNumber, sethhNumber] = useState("");
  const [hhNumberError, sethhNumberError] = useState("");
  const [password, setPassword] = useState(""); // Define password state variable
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });

          const accounts = await web3Instance.eth.getAccounts();
          if (accounts.length > 0) {
            setDiagnosticAddress(accounts[0]);
          }

          const networkId = await web3Instance.eth.net.getId();
          const networkIdStr = networkId.toString();
          const deployedNetwork =
            DiagnosticRegistration.networks[networkIdStr] ||
            DiagnosticRegistration.networks["31337"];
        } catch (error) {
          setFormError("Failed to connect to MetaMask: " + error.message);
        }
      } else {
        setFormError("Please install MetaMask to use this app.");
      }
    };

    init();

    // Update address if user switches MetaMask account
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) setDiagnosticAddress(accounts[0]);
      });
    }
  }, []);


  const handleRegister = async () => {
    setFormError("");
    if (
      !diagnosticAddress || !diagnosticName || !hospitalName ||
      !diagnosticLocation || !email || !hhNumber || !password || !confirmPassword
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setPassword("");
      setConfirmPassword("");
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPassword("");
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    } else {
      setEmailError("");
    }

    setIsLoading(true);
    try {
      const web3 = new Web3(window.ethereum);
      const networkId = await web3.eth.net.getId();
      const networkIdStr = networkId.toString();

      if (networkIdStr !== "31337") {
        setFormError(`Wrong network (Chain ${networkIdStr}). Switch MetaMask to Anvil Local — Chain ID: 31337, RPC: http://127.0.0.1:8545.`);
        return;
      }

      const deployedNetwork =
        DiagnosticRegistration.networks[networkIdStr] ||
        DiagnosticRegistration.networks["31337"];

      if (!deployedNetwork) {
        setFormError("Contract not deployed. Please run 'npm run deploy' first.");
        return;
      }

      const accounts = await web3.eth.getAccounts();
      if (!accounts.length) {
        setFormError("No MetaMask account connected. Please unlock MetaMask.");
        return;
      }

      const contract = new web3.eth.Contract(
        DiagnosticRegistration.abi,
        deployedNetwork.address
      );

      const isRegDoc = await contract.methods.isRegisteredDiagnostic(hhNumber).call();
      if (isRegDoc) {
        setFormError("An account with this HH Number already exists.");
        return;
      }

      await contract.methods
        .registerDiagnostic(diagnosticName, hospitalName, diagnosticLocation, email, hhNumber, hashPassword(password))
        .send({ from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0], 'pending') });

      navigate("/");
    } catch (error) {
      setFormError(error.message || "Registration failed. Check MetaMask and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEmailChange = (e) => {
    const inputEmail = e.target.value;
    setEmail(inputEmail);
  };

    const handlehhNumberChange = (e) => {
      const inputhhNumber = e.target.value;
      const phoneRegex = /^\d{6}$/;
      if (phoneRegex.test(inputhhNumber)) {
        sethhNumber(inputhhNumber);
        sethhNumberError("");
      } else {
        sethhNumber(inputhhNumber);
        sethhNumberError("Please enter a 6-digit HH Number.");
      }
  };
  
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError("");
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setConfirmPasswordError("");
  };
  
  
  const cancelOperation = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
    <NavBar />
    <div className="min-h-screen flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-2xl">
        <h2 className="text-3xl text-white mb-6 font-bold">
          Diagnostic Registration
        </h2>
        {formError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {formError}
          </div>
        )}
        <form className="glass-card p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="mb-4">
            <label
              className="block font-bold text-white"
              htmlFor="diagnosticAddress"
            >
              Wallet Public Address
            </label>
            <input
              id="diagnosticAddress"
              name="diagnosticAddress"
              type="text"
              readOnly
              className="mt-2 p-2 w-full text-white glass-input opacity-70 cursor-not-allowed"
              placeholder="Auto-filled from MetaMask..."
              value={diagnosticAddress}
            />
          </div>
          <div className="mb-4">
            <label className="block font-bold text-white" htmlFor="diagnosticName">
              Diagnostic Center Name
            </label>
            <input
              id="diagnosticName"
              name="diagnosticName"
              type="text"
              required
              className="mt-2 p-2 w-full text-white glass-input"
              placeholder="Enter Diagnostic's Center Full Name"
              value={diagnosticName}
              onChange={(e) => setDiagnosticName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label
              className="block font-bold text-white"
              htmlFor="hospitalName"
            >
              Hospital Name
            </label>
            <input
              id="hospitalName"
              name="hospitalName"
              type="text"
              required
              className="mt-2 p-2 w-full text-white glass-input"
              placeholder="Enter Hospital Name"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
            />
          </div>

            <div className="mb-4">
            <label className="block font-bold text-white" htmlFor="diagnosticLocation">
              Location 
            </label>
            <input
              type="text"
              id="diagnosticLocation"
              name="diagnosticLocation"
              placeholder="Enter the location of Diagnostic center"
              value={diagnosticLocation}
              onChange={(e) => setDiagnosticLocation(e.target.value)}
              className="mt-2 p-2 w-full text-white glass-input"
            />
            </div>
          
          <div className="mb-4">
            <label className="block font-bold text-white" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={`glass-input mt-1 ${
                emailError && "border-red-500"
              }`}
              placeholder="Enter your Email-id"
              value={email}
              onChange={handleEmailChange}
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>
            
          <div className="mb-4">
            <label className="block font-bold text-white" htmlFor="hhNumber">
              HH Number
            </label>
            <input
              id="hhNumber"
              name="hhNumber"
              type="text"
              required
              className={`glass-input mt-1 ${hhNumberError && "border-red-500"}`}
              placeholder="HH Number"
              value={hhNumber}
              onChange={handlehhNumberChange}
            />
            {hhNumberError && (
              <p className="text-red-500 text-sm mt-1">{hhNumberError}</p>
            )}
          </div>

          <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`glass-input mt-1 ${
                  passwordError && "border-red-500"
                }`}
                placeholder="Enter your Password"
                value={password}
                onChange={handlePasswordChange}
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
          </div>
            
          <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={`glass-input mt-1 ${
                  confirmPasswordError && "border-red-500"
                }`}
                placeholder="Confirm your Password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
              />
              {confirmPasswordError && (
                <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>
              )}
          </div>
            
        </form>
        <div className="space-x-4 text-center mt-6">
          <button
            type="button"
            onClick={handleRegister}
            disabled={isLoading}
            className="py-3 px-4 bg-teal-500 text-white rounded-md font-medium hover:bg-gray-600 disabled:bg-teal-500/40 disabled:cursor-not-allowed focus:outline-none flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Registering...
              </>
            ) : "Register"}
          </button>
          <button
            onClick={cancelOperation}
            className="py-3 px-4 bg-teal-500 text-white rounded-md font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
            Close
          </button>
        </div>
      </div>
      </div>
      </div>
  );
};

export default DiagnosticRegistry;
