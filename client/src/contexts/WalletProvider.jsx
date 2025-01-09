import React, { createContext, useContext, useEffect, useState } from 'react';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { toast } from 'react-toastify';

const WalletContext = createContext();

// Network and connection setup
const network = WalletAdapterNetwork.Devnet; // or 'mainnet-beta'
const endpoint = clusterApiUrl(network);
const connection = new Connection(endpoint);

export const WalletProviderWrapper = ({ children }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');

  const checkIfPhantomIsInstalled = () => {
    if ("solana" in window && window.solana?.isPhantom) {
      return true;
    }
    return false;
  };

  const connect = async () => {
    if (!checkIfPhantomIsInstalled()) {
      toast.error(
        <div>
          Phantom Wallet is not installed. 
          <a 
            href="https://phantom.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-solana-purple hover:text-solana-purple-light ml-1 underline"
          >
            Install Phantom
          </a>
        </div>,
        {
          autoClose: 5000,
          closeButton: true,
          closeOnClick: false
        }
      );
      return false;
    }
    
    try {
      if (wallet) {
        await wallet.connect();
        return true;
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect wallet. Please try again.");
      return false;
    }
    return false;
  };

  useEffect(() => {
    if (checkIfPhantomIsInstalled()) {
      const phantom = new PhantomWalletAdapter();

      // Set up event listeners for connecting and disconnecting the wallet
      phantom.on('connect', () => {
        setWalletConnected(true);
        // Fetch the wallet address when the wallet is connected
        const address = phantom.publicKey.toString();
        setWalletAddress(address);
      });

      phantom.on('disconnect', () => {
        setWalletConnected(false);
        setWalletAddress('');
      });

      phantom.on('error', (error) => {
        console.error("Wallet error:", error);
        toast.error("Wallet error: " + error.message);
      });

      setWallet(phantom);

      // Clean up on component unmount
      return () => {
        phantom.off('connect');
        phantom.off('disconnect');
        phantom.off('error');
      };
    }
  }, []);

  const wallets = [new PhantomWalletAdapter()];

  return (
    <SolanaWalletProvider wallets={wallets} connection={connection}>
      <WalletContext.Provider value={{ walletConnected, walletAddress, wallet, connect }}>
        {children}
      </WalletContext.Provider>
    </SolanaWalletProvider>
  );
};

export const useWalletContext = () => useContext(WalletContext);
