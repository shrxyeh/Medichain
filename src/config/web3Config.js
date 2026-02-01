/**
 * Web3 Configuration for Anvil/Foundry
 * This replaces the Truffle/Ganache configuration
 */

// Default Anvil configuration
export const ANVIL_CONFIG = {
  rpcUrl: "http://127.0.0.1:8545",
  chainId: 31337,
  networkName: "Anvil Local",
};

// Default Anvil accounts (for development only - DO NOT use in production)
// These are the default accounts that Anvil creates
export const ANVIL_ACCOUNTS = {
  // Account 0 - Default deployer
  deployer: {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  // Additional test accounts
  accounts: [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
  ],
};

/**
 * Get Web3 provider for Anvil
 */
export const getAnvilProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return window.ethereum;
  }
  // Fallback to HTTP provider
  return ANVIL_CONFIG.rpcUrl;
};

/**
 * Check if connected to Anvil network
 */
export const isAnvilNetwork = async (web3) => {
  try {
    const chainId = await web3.eth.getChainId();
    return Number(chainId) === ANVIL_CONFIG.chainId;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};

/**
 * Switch to Anvil network in MetaMask
 */
export const switchToAnvil = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${ANVIL_CONFIG.chainId.toString(16)}` }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${ANVIL_CONFIG.chainId.toString(16)}`,
            chainName: ANVIL_CONFIG.networkName,
            rpcUrls: [ANVIL_CONFIG.rpcUrl],
            nativeCurrency: {
              name: "Ethereum",
              symbol: "ETH",
              decimals: 18,
            },
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
};

/**
 * Connect wallet with Anvil network check
 */
export const connectWallet = async (web3) => {
  if (!window.ethereum) {
    throw new Error("Please install MetaMask extension");
  }

  // Request account access
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  // Check if on Anvil network
  const onAnvil = await isAnvilNetwork(web3);
  if (!onAnvil) {
    console.log("Not on Anvil network, attempting to switch...");
    await switchToAnvil();
  }

  return accounts;
};

export default {
  ANVIL_CONFIG,
  ANVIL_ACCOUNTS,
  getAnvilProvider,
  isAnvilNetwork,
  switchToAnvil,
  connectWallet,
};
