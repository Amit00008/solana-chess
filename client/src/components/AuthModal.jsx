import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/firebaseconfig"; // Import Firebase auth
import { FaGoogle, FaWallet } from "react-icons/fa"; // Import Google icon
import { toast } from "react-toastify"; // Import react-toastify
import { useWalletContext } from "../contexts/WalletProvider";

const AuthModal = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState("");
  const { walletConnected, wallet } = useWalletContext();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Signup successful! You can now log in.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Login successful!");
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error("Authentication failed. Please try again.");
    }
  };

  const handlePhantom = async () => {
    try {
      wallet.connect();
      toast.success("Wallet Added successful!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Wallet adding failed. Please try again.");
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999]" 
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[999999] grid place-items-center">
        <div className="bg-[#1E1E1E] rounded-xl border border-solana-purple/20 p-6 w-[400px] shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-solana-purple transition-colors text-2xl font-light"
          >
            ×
          </button>
          
          <h2 className="text-[#00E4FF] text-2xl font-bold text-center mb-6">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-gray-300 block text-sm">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#2B2B2B] border border-solana-purple/20 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-solana-purple transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-300 block text-sm">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#2B2B2B] border border-solana-purple/20 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-solana-purple transition-colors"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                <p className="text-red-500 text-xs">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-[#9945FF] hover:bg-[#9945FF]/90 text-white py-3 rounded-lg transition-colors font-medium"
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-solana-purple/20"></div>
            <span className="px-3 text-gray-400 text-sm">or</span>
            <div className="flex-1 border-t border-solana-purple/20"></div>
          </div>

          {!walletConnected && (
            <button
              onClick={handlePhantom}
              className="w-full border border-[#9945FF] bg-transparent hover:bg-[#2B2B2B] text-white py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium"
            >
              <FaWallet className="w-4 h-4" />
              <span>Connect Phantom Wallet</span>
            </button>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#9945FF] hover:text-[#9945FF]/90 transition-colors text-sm"
            >
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;
