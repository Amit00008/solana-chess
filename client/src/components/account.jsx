import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebaseconfig'; // Firebase Auth
import { doc, getDoc } from 'firebase/firestore'; // Firebase Firestore
import { db } from '../firebase/firebaseconfig'; // Firebase Firestore config
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../contexts/WalletProvider'; // Adjust the import path to your WalletProvider
import { FaWallet, FaCopy, FaCoins } from 'react-icons/fa'; // React Icons for wallet and copy
import { SiCoinbase, SiGmail, SiNewbalance, SiSolana } from 'react-icons/si'; // Solana Icon
import { AiOutlineTransaction } from 'react-icons/ai';

const Account = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null); // Holds user data (wallet, balance, etc.)
  const navigate = useNavigate();
  const { walletConnected, walletAddress, wallet } = useWalletContext(); // Get wallet address and connect function from WalletProvider

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser); // User is authenticated
        fetchUserData(authUser.uid); // Fetch additional user data
      } else {
        setUser(null); // User is not authenticated
        navigate('/'); // Redirect to home page if not authenticated
      }
      setLoading(false);
    });

    // Cleanup subscription when component unmounts
    return () => unsubscribe();
  }, [navigate]);

  const fetchUserData = async (userUID) => {
    try {
      const userRef = doc(db, 'users', userUID);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      } else {
        console.log('No user data found!');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('Wallet Address Copied!'))
      .catch((err) => console.error('Error copying text: ', err));
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center items-center bg-gradient-to-b from-solana-black to-solana-black-light">
        <div className="animate-pulse text-solana-purple text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex justify-center items-center bg-gradient-to-b from-solana-black to-solana-black-light">
        <div className="card p-6 text-center">
          <p className="text-xl text-gray-300">Please log in to view your account.</p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary mt-4"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-b from-solana-black to-solana-black-light">
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <h1 className="gradient-text text-3xl font-bold text-center mb-8">Account Dashboard</h1>

          <div className="space-y-6">
            {/* Email Section */}
            <div className="card bg-solana-black-lighter p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-solana-black rounded-lg">
                  <SiGmail className="w-6 h-6 text-solana-purple" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">Email Address</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Wallet Section */}
            <div className="card bg-solana-black-lighter p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-solana-black rounded-lg">
                    <SiSolana className="w-6 h-6 text-solana-purple" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm">Wallet Address</p>
                    <p className="text-white font-medium truncate max-w-[200px] sm:max-w-[300px]">
                      {walletAddress || 'Not Connected'}
                    </p>
                  </div>
                </div>
                {walletAddress && (
                  <button
                    onClick={() => copyToClipboard(walletAddress)}
                    className="p-2 hover:bg-solana-black rounded-lg transition-colors group"
                    title="Copy Address"
                  >
                    <FaCopy className="w-5 h-5 text-gray-400 group-hover:text-solana-purple" />
                  </button>
                )}
              </div>
              {!walletConnected && (
                <button
                  onClick={() => wallet.connect()}
                  className="btn-primary w-full mt-4 flex items-center justify-center space-x-2"
                >
                  <FaWallet className="w-5 h-5" />
                  <span>Connect Phantom Wallet</span>
                </button>
              )}
            </div>

            {/* Balance Section */}
            <div className="card bg-solana-black-lighter p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-solana-black rounded-lg">
                  <FaCoins className="w-6 h-6 text-solana-purple" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">Wallet Balance</p>
                  <p className="text-white font-medium">
                    {userData?.walletBalance ? `${userData.walletBalance} SOL` : 'Connect wallet to view balance'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card bg-solana-black-lighter p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-solana-black rounded-lg">
                    <SiNewbalance className="w-6 h-6 text-solana-green" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm">Games Won</p>
                    <p className="text-white font-medium">{userData?.gamesWon || '0'}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-solana-black-lighter p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-solana-black rounded-lg">
                    <AiOutlineTransaction className="w-6 h-6 text-solana-blue" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm">Total Games</p>
                    <p className="text-white font-medium">{userData?.totalGames || '0'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => auth.signOut()}
              className="btn-secondary w-full flex items-center justify-center space-x-2"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
