import { Web3Storage } from 'web3.storage';

const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://w3s.link/ipfs/',
];

export const IPFS_DEV_MODE = !process.env.REACT_APP_WEB3_STORAGE_TOKEN;

let web3StorageClient = null;

export const initWeb3Storage = (token) => {
  if (!token) return null;
  web3StorageClient = new Web3Storage({ token });
  return web3StorageClient;
};

export const getWeb3StorageClient = () => {
  if (!web3StorageClient) {
    const token = process.env.REACT_APP_WEB3_STORAGE_TOKEN;
    if (token) web3StorageClient = initWeb3Storage(token);
  }
  return web3StorageClient;
};

export const uploadToIPFS = async (file, onProgress = null) => {
  const client = getWeb3StorageClient();
  if (!client) return createFallbackUpload(file);

  if (onProgress) onProgress(10);
  const cid = await client.put([file], {
    name: file.name,
    onRootCidReady: () => { if (onProgress) onProgress(50); },
    onStoredChunk: () => { if (onProgress) onProgress(75); },
  });
  if (onProgress) onProgress(100);

  return {
    cid,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    gateway: getIPFSUrl(cid),
  };
};

// Evict oldest ipfs_* localStorage entries until setItem succeeds or nothing left to remove
const localStorageSetWithEviction = (key, value) => {
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      localStorage.setItem(key, value);
      return;
    } catch (e) {
      if (e.name !== 'QuotaExceededError' && e.code !== 22) throw e;
      const ipfsKeys = Object.keys(localStorage).filter(k => k.startsWith('ipfs_'));
      if (ipfsKeys.length === 0) {
        throw new Error(
          `File is too large for browser storage in dev mode (localStorage is full). ` +
          `Try a smaller file (under 2 MB), or clear your browser's localStorage for this site.`
        );
      }
      // Remove the oldest entry (lowest storedAt, falling back to first found)
      let oldestKey = ipfsKeys[0];
      let oldestTime = Infinity;
      for (const k of ipfsKeys) {
        try {
          const parsed = JSON.parse(localStorage.getItem(k));
          if (parsed.storedAt && parsed.storedAt < oldestTime) {
            oldestTime = parsed.storedAt;
            oldestKey = k;
          }
        } catch (_) {}
      }
      localStorage.removeItem(oldestKey);
    }
  }
  throw new Error('localStorage quota exceeded — could not free enough space after eviction.');
};

// Generate a fake CID using only valid base32 characters (a-z, 2-7)
const generateFakeCid = () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let result = 'bafybei';
  for (let i = 0; i < 52; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result; // 59 chars total, all valid base32
};

// Dev mode: store as base64 so it survives page reloads (blob URLs are session-only)
const createFallbackUpload = async (file) => {
  // base64 inflates by ~33%; cap at 3 MB source to stay safely under the 5 MB quota
  if (file.size > 3 * 1024 * 1024) {
    throw new Error(
      `File is too large for dev-mode storage (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
      `Dev mode stores files in localStorage which has a ~5 MB limit. Use a file under 3 MB, ` +
      `or set REACT_APP_WEB3_STORAGE_TOKEN in .env to enable real IPFS uploads.`
    );
  }

  const fakeCid = generateFakeCid();

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  localStorageSetWithEviction(`ipfs_${fakeCid}`, JSON.stringify({
    dataUrl,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    storedAt: Date.now(),
  }));

  return { cid: fakeCid, filename: file.name, mimeType: file.type, size: file.size, uploadedAt: new Date().toISOString(), gateway: dataUrl, isDevelopment: true };
};

export const uploadMetadataToIPFS = async (metadata) => {
  const client = getWeb3StorageClient();
  const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
  const file = new File([blob], 'metadata.json', { type: 'application/json' });

  if (!client) return (await createFallbackUpload(file)).cid;

  return client.put([file]);
};

// Base32 alphabet used by CIDv1 (bafybei... prefix)
const BASE32_RE = /^[a-z2-7]+$/;

export const getIPFSUrl = (cid, gatewayIndex = 0) => {
  if (!cid) return null;

  const localData = localStorage.getItem(`ipfs_${cid}`);
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      return parsed.dataUrl || parsed.blobUrl;
    } catch (e) {}
  }

  // If the CID starts with 'bafybei' but contains non-base32 chars (0,1,8,9...)
  // it was generated in dev mode and is not a real IPFS CID — data is lost from cache
  if (cid.startsWith('bafybei') && !BASE32_RE.test(cid)) return null;

  if (cid.startsWith('bafybei')) return `https://w3s.link/ipfs/${cid}`;
  return `${IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0]}${cid}`;
};

export const getAllGatewayUrls = (cid) => {
  if (!cid) return [];
  return IPFS_GATEWAYS.map(gw => `${gw}${cid}`);
};

export const fetchFromIPFS = async (cid) => {
  const localData = localStorage.getItem(`ipfs_${cid}`);
  if (localData) {
    try {
      const { dataUrl, blobUrl } = JSON.parse(localData);
      return await (await fetch(dataUrl || blobUrl)).blob();
    } catch (e) {}
  }

  for (const gateway of IPFS_GATEWAYS) {
    try {
      const res = await fetch(`${gateway}${cid}`);
      if (res.ok) return await res.blob();
    } catch (e) {}
  }

  throw new Error('Failed to fetch from all IPFS gateways');
};

export const checkIPFSConnection = async () => {
  const client = getWeb3StorageClient();
  if (!client) return true;
  try {
    await client.list({ maxResults: 1 });
    return true;
  } catch {
    return false;
  }
};

export const listUploads = async (limit = 10) => {
  const client = getWeb3StorageClient();
  if (!client) return [];
  try {
    const uploads = [];
    for await (const upload of client.list({ maxResults: limit })) uploads.push(upload);
    return uploads;
  } catch {
    return [];
  }
};

export const getUploadStatus = async (cid) => {
  const client = getWeb3StorageClient();
  if (!client) return null;
  try { return await client.status(cid); } catch { return null; }
};

export { IPFS_GATEWAYS };

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
