import Web3 from 'web3';

const ANVIL_RPC = 'http://127.0.0.1:8545';

// Query Anvil directly for the pending nonce, bypassing MetaMask's stale nonce cache.
// MetaMask caches eth_getTransactionCount per block and doesn't update after Anvil restarts.
export const getPendingNonce = async (account) => {
  try {
    const anvilWeb3 = new Web3(ANVIL_RPC);
    return Number(await anvilWeb3.eth.getTransactionCount(account, 'pending'));
  } catch {
    const web3 = new Web3(window.ethereum);
    return Number(await web3.eth.getTransactionCount(account, 'pending'));
  }
};

export const NONCE_ERROR_MSG =
  'Nonce out of sync with Anvil. Open MetaMask → 3-dot menu → Settings → Advanced → ' +
  '"Clear activity and nonce data" (or "Reset Account"), then try again.';

export const isNonceTooLow = (err) =>
  /nonce too low|nonce/i.test(err?.message || '');
