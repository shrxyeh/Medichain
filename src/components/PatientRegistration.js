import React, { useState, useEffect } from "react";
import Web3 from "web3";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import ConnectWallet from "./ConnectWallet";
import { hashPassword } from "../utils/hashPassword";

const PatientRegistry = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [name, setName] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [hhNumber, sethhNumber] = useState("");
  const [hhNumberError, sethhNumberError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [gender, setGender] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [bg, setBloodGroup] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const navigate = useNavigate();

  // Handle wallet connection
  const handleWalletConnect = (address) => {
    setWalletAddress(address);
    initContract();
  };

  const initContract = async () => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      try {
        setWeb3(web3Instance);

        // Get network ID and convert BigInt to string for object key lookup
        const networkId = await web3Instance.eth.net.getId();
        const networkIdStr = networkId.toString();

        if (networkIdStr !== "31337") {
          setFormError(`Wrong network detected (Chain ${networkIdStr}). Switch MetaMask to Anvil Local (Chain ID: 31337, RPC: http://127.0.0.1:8545).`);
          return;
        }

        const deployedNetwork = PatientRegistration.networks[networkIdStr] ||
                               PatientRegistration.networks["31337"];

        if (!deployedNetwork || !deployedNetwork.address) {
          setFormError("Contract not found. Make sure Anvil is running and contracts are deployed ('npm run deploy').");
          return;
        }

        const contractInstance = new web3Instance.eth.Contract(
          PatientRegistration.abi,
          deployedNetwork.address
        );

        setContract(contractInstance);
      } catch (error) {
        console.error("Error initializing contract:", error);
      }
    }
  };

  useEffect(() => {
    initContract();
  }, []);

  const handleRegister = async () => {
    setFormError("");
    if (
      !walletAddress || !name || !dateOfBirth || !homeAddress ||
      !hhNumber || !gender || !bg || !email || !password || !confirmPassword
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (hhNumber.length !== 6) {
      setFormError("HH Number must be exactly 6 digits.");
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

      const deployedNetwork = PatientRegistration.networks[networkIdStr] ||
                             PatientRegistration.networks["31337"];

      if (!deployedNetwork || !deployedNetwork.address) {
        setFormError("Contract not deployed. Please run 'npm run deploy' first.");
        return;
      }

      const contract = new web3.eth.Contract(
        PatientRegistration.abi,
        deployedNetwork.address
      );

      const isRegPatient = await contract.methods.isRegisteredPatient(hhNumber).call();
      if (isRegPatient) {
        setFormError("An account with this HH Number already exists.");
        return;
      }

      await contract.methods
        .registerPatient(walletAddress, name, dateOfBirth, gender, bg, homeAddress, email, hhNumber, hashPassword(password))
        .send({ from: walletAddress });

      navigate("/");
    } catch (error) {
      setFormError("Registration failed. Check MetaMask and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleEmailChange = (e) => {
    const inputEmail = e.target.value;
    setEmail(inputEmail);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError("");
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setConfirmPasswordError("");
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

  const cancelOperation = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
    <NavBar />
    <div className="min-h-screen flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl text-white mb-6 font-bold">
          Patient Registration
        </h2>
        {formError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {formError}
          </div>
        )}
        <form className="glass-card p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Wallet Connection - Full Width */}
          <div className="md:col-span-2 mb-4">
            <label className="block font-bold text-white mb-2">
              Connect Your Wallet
            </label>
            <ConnectWallet onConnect={handleWalletConnect} />
            {walletAddress && (
              <p className="mt-2 text-sm text-gray-400">
                Connected: <span className="text-primary-400 font-mono">{walletAddress}</span>
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              className="block font-bold text-white"
              htmlFor="walletAddress"
            >
              Wallet Public Address
            </label>
            <input
              type="text"
              id="walletAddress"
              name="walletAddress"
              placeholder="Connected wallet address will appear here"
              value={walletAddress}
              readOnly
              className="mt-2 p-2 w-full text-gray-400 bg-gray-800 border border-gray-600 rounded-md cursor-not-allowed"
            />
            </div>
          <div className="mb-4">
            <label className="block font-bold text-white" htmlFor="name">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 p-2 w-full text-white glass-input"
            />
          </div>

          <div className="mb-4">
            <label className="block font-bold text-white" htmlFor="dateOfBirth">
              Date of Birth
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date" // Use type="date" for date picker
              required
              className="glass-input mt-1"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>
            
          <div className="mb-4">
          <label className="block font-bold text-white" htmlFor="gender">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            required
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="glass-input mt-1"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-bold text-white" htmlFor="gender">
            Blood Group
          </label>
          <select
            id="bg"
            name="bg"
            required
            value={bg}
            onChange={(e) => setBloodGroup(e.target.value)}
            className="glass-input mt-1"
          >
            <option value="">Select Blood Group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        </div>

          <div className="mb-4">
            <label className="block font-bold text-white" htmlFor="homeAddress">
              Home Address
            </label>
            <input
              type="text"
              id="homeAddress"
              name="homeAddress"
              placeholder="Enter your Permanent Address"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              className="mt-2 p-2 w-full text-white glass-input"
            />
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
              placeholder="Enter your HH Number"
              value={hhNumber}
              onChange={handlehhNumberChange}
            />
            {hhNumberError && (
              <p className="text-red-500 text-sm mt-1">{hhNumberError}</p>
            )}
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


          <div className="space-x-4 md:col-span-2 flex justify-center mt-6">
            <button
              type="button"
              onClick={handleRegister}
              disabled={isLoading}
              className="px-5 py-2.5 bg-teal-500 text-white font-bold text-lg rounded-lg cursor-pointer transition-colors duration-300 ease-in-out hover:bg-gray-600 disabled:bg-teal-500/40 disabled:cursor-not-allowed w-full md:w-auto flex items-center gap-2"
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
              className="px-5 py-2.5 bg-teal-500 text-white font-bold text-lg rounded-lg cursor-pointer transition-colors duration-300 ease-in-out hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed w-full md:w-auto"
              >
              Close
            </button>
          </div>
        </form>
      </div>
      </div>
      </div>
  );
};

export default PatientRegistry;
