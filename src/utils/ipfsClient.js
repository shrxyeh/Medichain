/**
 * IPFS Client Utility for Medical Records
 * Uses web3.storage for uploads and public gateways for viewing
 */

import { Web3Storage } from 'web3.storage';

// Public IPFS Gateways (for retrieval/viewing)
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://w3s.link/ipfs/',
];

// Web3.Storage client instance
let web3StorageClient = null;

/**
 * Initialize Web3.Storage client
 * @param {string} token - Web3.Storage API token
 * @returns {Web3Storage} Client instance
 */
export const initWeb3Storage = (token) => {
  if (!token) {
    console.warn('Web3.Storage token not provided. Using fallback mode.');
    return null;
  }
  web3StorageClient = new Web3Storage({ token });
  console.log('Web3.Storage client initialized');
  return web3StorageClient;
};

/**
 * Get or create Web3.Storage client
 * @returns {Web3Storage|null} Client instance
 */
export const getWeb3StorageClient = () => {
  if (!web3StorageClient) {
    const token = process.env.REACT_APP_WEB3_STORAGE_TOKEN;
    if (token) {
      web3StorageClient = initWeb3Storage(token);
    }
  }
  return web3StorageClient;
};

/**
 * Upload a file to IPFS via Web3.Storage
 * @param {File} file - File object to upload
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Object>} Upload result with CID
 */
export const uploadToIPFS = async (file, onProgress = null) => {
  try {
    const client = getWeb3StorageClient();

    if (!client) {
      // Fallback: Create a mock CID for development without token
      console.warn('Web3.Storage not configured. Using development fallback.');
      return createFallbackUpload(file);
    }

    // Prepare file for upload
    const files = [file];

    // Upload to Web3.Storage
    if (onProgress) onProgress(10);

    const cid = await client.put(files, {
      name: file.name,
      onRootCidReady: (localCid) => {
        console.log('Root CID ready:', localCid);
        if (onProgress) onProgress(50);
      },
      onStoredChunk: (size) => {
        console.log('Stored chunk:', size);
        if (onProgress) onProgress(75);
      },
    });

    if (onProgress) onProgress(100);

    console.log('File uploaded to IPFS. CID:', cid);

    return {
      cid: cid,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      gateway: getIPFSUrl(cid),
    };
  } catch (error) {
    console.error('IPFS upload failed:', error);
    throw new Error(`Failed to upload file to IPFS: ${error.message}`);
  }
};

/**
 * Fallback upload for development without Web3.Storage token
 * Creates a local blob URL as a mock CID
 */
const createFallbackUpload = async (file) => {
  // Generate a pseudo-CID based on file content hash
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Create a CID-like string (not a real IPFS CID, but useful for testing)
  const fakeCid = `bafybei${hashHex.substring(0, 52)}`;

  // Store in localStorage for development retrieval
  const blobUrl = URL.createObjectURL(file);
  localStorage.setItem(`ipfs_${fakeCid}`, JSON.stringify({
    blobUrl,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
  }));

  console.log('Development mode: File stored locally with fake CID:', fakeCid);

  return {
    cid: fakeCid,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    gateway: blobUrl, // Use blob URL for local testing
    isDevelopment: true,
  };
};

/**
 * Upload JSON metadata to IPFS
 * @param {Object} metadata - Metadata object
 * @returns {Promise<string>} CID of uploaded metadata
 */
export const uploadMetadataToIPFS = async (metadata) => {
  try {
    const client = getWeb3StorageClient();

    if (!client) {
      // Fallback for development
      const jsonString = JSON.stringify(metadata);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const result = await createFallbackUpload(
        new File([blob], 'metadata.json', { type: 'application/json' })
      );
      return result.cid;
    }

    const jsonString = JSON.stringify(metadata, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], 'metadata.json', { type: 'application/json' });

    const cid = await client.put([file]);
    return cid;
  } catch (error) {
    console.error('Metadata upload failed:', error);
    throw new Error(`Failed to upload metadata: ${error.message}`);
  }
};

/**
 * Get IPFS gateway URL for a CID
 * @param {string} cid - IPFS Content Identifier
 * @param {number} gatewayIndex - Which gateway to use (0-4)
 * @returns {string} Full gateway URL
 */
export const getIPFSUrl = (cid, gatewayIndex = 0) => {
  if (!cid) return null;

  // Check if it's a development blob URL
  const localData = localStorage.getItem(`ipfs_${cid}`);
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      return parsed.blobUrl;
    } catch (e) {
      // Not local data, continue with gateway
    }
  }

  // For web3.storage uploads, use w3s.link gateway first
  if (cid.startsWith('bafybei')) {
    return `https://w3s.link/ipfs/${cid}`;
  }

  const gateway = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
  return `${gateway}${cid}`;
};

/**
 * Get all possible gateway URLs for a CID
 * @param {string} cid - IPFS Content Identifier
 * @returns {string[]} Array of gateway URLs
 */
export const getAllGatewayUrls = (cid) => {
  if (!cid) return [];
  return IPFS_GATEWAYS.map((gateway) => `${gateway}${cid}`);
};

/**
 * Fetch content from IPFS via gateway
 * @param {string} cid - IPFS Content Identifier
 * @returns {Promise<Blob>} File content as Blob
 */
export const fetchFromIPFS = async (cid) => {
  // Check local storage first (development mode)
  const localData = localStorage.getItem(`ipfs_${cid}`);
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      const response = await fetch(parsed.blobUrl);
      return await response.blob();
    } catch (e) {
      console.warn('Local fetch failed, trying gateways');
    }
  }

  // Try each gateway until one works
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${cid}`;
      const response = await fetch(url);
      if (response.ok) {
        return await response.blob();
      }
    } catch (error) {
      console.warn(`Gateway ${gateway} failed, trying next...`);
    }
  }

  throw new Error('Failed to fetch from all IPFS gateways');
};

/**
 * Check if Web3.Storage is configured and available
 * @returns {Promise<boolean>} Connection status
 */
export const checkIPFSConnection = async () => {
  const client = getWeb3StorageClient();
  if (!client) {
    // Return true for development mode (local fallback)
    console.log('IPFS: Running in development mode (local storage fallback)');
    return true;
  }

  try {
    // Test by listing uploads (limited check)
    await client.list({ maxResults: 1 });
    return true;
  } catch (error) {
    console.warn('Web3.Storage connection check failed:', error.message);
    return false;
  }
};

/**
 * List recent uploads (if using Web3.Storage)
 * @param {number} limit - Max number of results
 * @returns {Promise<Array>} List of uploads
 */
export const listUploads = async (limit = 10) => {
  const client = getWeb3StorageClient();
  if (!client) {
    return [];
  }

  try {
    const uploads = [];
    for await (const upload of client.list({ maxResults: limit })) {
      uploads.push(upload);
    }
    return uploads;
  } catch (error) {
    console.error('Failed to list uploads:', error);
    return [];
  }
};

/**
 * Get file status from Web3.Storage
 * @param {string} cid - IPFS Content Identifier
 * @returns {Promise<Object|null>} Upload status
 */
export const getUploadStatus = async (cid) => {
  const client = getWeb3StorageClient();
  if (!client) {
    return null;
  }

  try {
    const status = await client.status(cid);
    return status;
  } catch (error) {
    console.error('Failed to get upload status:', error);
    return null;
  }
};

// Export constants
export { IPFS_GATEWAYS };

// Export default object with all functions
export default {
  initWeb3Storage,
  getWeb3StorageClient,
  uploadToIPFS,
  uploadMetadataToIPFS,
  getIPFSUrl,
  getAllGatewayUrls,
  fetchFromIPFS,
  checkIPFSConnection,
  listUploads,
  getUploadStatus,
  IPFS_GATEWAYS,
};
