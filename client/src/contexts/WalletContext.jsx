import React, { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        const savedWallet = localStorage.getItem('phantomWallet');
        
        if (savedWallet) {
          const { solana } = window;
          
          if (solana?.isPhantom) {
            try {
              const response = await solana.connect({ onlyIfTrusted: true });
              setWalletAddress(response.publicKey.toString());
              setWalletConnected(true);
            } catch (error) {
              console.error('Auto-connect error:', error);
              localStorage.removeItem('phantomWallet');
            }
          }
        }
      } catch (error) {
        console.error('Wallet check error:', error);
      }
    };

    checkWalletConnection();
  }, []);

  const connectWallet = async () => {
    try {
      const { solana } = window;

      if (solana?.isPhantom) {
        const response = await solana.connect();
        const address = response.publicKey.toString();
        setWalletAddress(address);
        setWalletConnected(true);
        localStorage.setItem('phantomWallet', address);
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error('Connect wallet error:', error);
    }
  };

  const disconnectWallet = async () => {
    try {
      const { solana } = window;
      
      if (solana) {
        await solana.disconnect();
        setWalletAddress('');
        setWalletConnected(false);
        localStorage.removeItem('phantomWallet');
      }
    } catch (error) {
      console.error('Disconnect wallet error:', error);
    }
  };

  return (
    <WalletContext.Provider 
      value={{ 
        walletAddress, 
        walletConnected, 
        connectWallet, 
        disconnectWallet 
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
