/**
 * ConnectWallet Component
 * Handles MetaMask wallet connection with proper network detection
 */

import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

const ConnectWallet = ({ onConnect, compact = false }) => {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkName, setNetworkName] = useState('');
  const [error, setError] = useState('');

  // Expected network for Anvil
  const EXPECTED_CHAIN_ID = 31337;

  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setError('Please connect to MetaMask');
    } else {
      setAccount(accounts[0]);
      setError('');
      if (onConnect) onConnect(accounts[0]);
    }
  };

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await checkNetwork(web3);
          if (onConnect) onConnect(accounts[0]);
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    }
  };

  const checkNetwork = async (web3) => {
    try {
      const chainId = await web3.eth.getChainId();
      // Convert BigInt to Number for comparison
      const chainIdNum = Number(chainId);

      if (chainIdNum === EXPECTED_CHAIN_ID) {
        setNetworkName('Anvil Local');
        setError('');
      } else {
        setNetworkName(`Chain ${chainIdNum}`);
        setError('Please switch to Anvil network (Chain ID: 31337)');
      }
    } catch (err) {
      console.error('Error checking network:', err);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      const web3 = new Web3(window.ethereum);

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await checkNetwork(web3);
        if (onConnect) onConnect(accounts[0]);
      }
    } catch (err) {
      if (err.code === 4001) {
        setError('Connection rejected by user');
      } else {
        setError('Failed to connect wallet');
        console.error('Connection error:', err);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToAnvil = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7A69' }], // 31337 in hex
      });
    } catch (switchError) {
      // Network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7A69',
              chainName: 'Anvil Local',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['http://127.0.0.1:8545'],
            }],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      }
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Compact version for navbar
  if (compact) {
    if (account) {
      return (
        <div className="flex items-center gap-2">
          {error && (
            <button
              onClick={switchToAnvil}
              className="px-3 py-1.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/30 hover:bg-yellow-500/30 transition-all"
            >
              Switch Network
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-green-400 font-medium">{formatAddress(account)}</span>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50"
      >
        {isConnecting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Connect Wallet</span>
          </>
        )}
      </button>
    );
  }

  // Full version for forms
  return (
    <div className="space-y-3">
      {!account ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50"
        >
          {isConnecting ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Connecting to MetaMask...</span>
            </>
          ) : (
            <>
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-6 h-6" />
              <span>Connect MetaMask Wallet</span>
            </>
          )}
        </button>
      ) : (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Connected Wallet</p>
                <p className="text-white font-mono text-sm">{formatAddress(account)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Network</p>
              <p className={`text-sm font-medium ${error ? 'text-yellow-400' : 'text-green-400'}`}>
                {networkName}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-sm text-yellow-400">{error}</p>
          {error.includes('switch') && (
            <button
              onClick={switchToAnvil}
              className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all"
            >
              Switch Network
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;
