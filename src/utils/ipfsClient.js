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

// Dev mode: store as base64 so it survives page reloads (blob URLs are session-only)
const createFallbackUpload = async (file) => {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 18);
  const nameSlug = file.name.replace(/[^a-z0-9]/gi, '').substring(0, 10).toLowerCase();
  const fakeCid = `bafybei${ts}${rand}${nameSlug}`.substring(0, 59);

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  localStorage.setItem(`ipfs_${fakeCid}`, JSON.stringify({
    dataUrl,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
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

export const getIPFSUrl = (cid, gatewayIndex = 0) => {
  if (!cid) return null;

  const localData = localStorage.getItem(`ipfs_${cid}`);
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      return parsed.dataUrl || parsed.blobUrl;
    } catch (e) {}
  }

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
