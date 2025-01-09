import React, { useState, useEffect } from "react";
import { FaUser, FaXTwitter } from "react-icons/fa6";
import { FaTelegramPlane, FaDiscord } from "react-icons/fa";
import { IoMdWallet } from "react-icons/io";
import { auth } from "../firebase/firebaseconfig";
import { signOut } from "firebase/auth";
import AuthModal from "./AuthModal";
import { toast } from "react-toastify";
import { useWallet } from "../contexts/WalletContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const { walletAddress, walletConnected, connectWallet, disconnectWallet } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Successfully logged out");
    } catch (err) {
      toast.error("Failed to log out");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-solana-black-light border-b border-solana-purple/20 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Side */}
          <div  className="flex items-center space-x-6 cursor-pointer">
            <span onClick={()=>{
            navigate('/');
          }} className="text-solana-purple font-bold text-xl">Solana<span className="text-solana-green">Chess</span></span>
            <div className="hidden md:flex items-center space-x-4">
              <a onClick={()=>{
                navigate('/howitworks');
              }} className="text-gray-300 hover:text-solana-purple cursor-pointer transition-colors">How it works</a>
              <a onClick={()=>{
                navigate('/support');
              }} className="text-gray-300 hover:text-solana-purple cursor-pointer transition-colors">Support</a>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <FaXTwitter onClick={()=>{
                window.open('https://x.com/chess_sola16438/');
              }} className="w-5 h-5 text-gray-300 hover:text-solana-purple cursor-pointer transition-colors" />
              <FaDiscord onClick={()=>{
                window.open('https://discord.gg/dhWdwSB5yA');
              }} className="w-5 h-5 text-gray-300 hover:text-solana-purple cursor-pointer transition-colors" />
            </div>
            
            <div className="flex items-center space-x-2">
              {!walletConnected ? (
                <button 
                  className="btn-secondary flex items-center space-x-2"
                  onClick={connectWallet}
                >
                  <IoMdWallet className="w-5 h-5" />
                  <span>Connect Wallet</span>
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </span>
                  <button
                    onClick={disconnectWallet}
                    className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </nav>
  );
};

export default Navbar;
