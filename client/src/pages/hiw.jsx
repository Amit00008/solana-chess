import React from "react";
import { FaWallet, FaChessKing, FaCoins, FaGamepad, FaTrophy } from "react-icons/fa";
import { AiOutlineSafety } from "react-icons/ai";

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 ">
      <div className="max-w-3xl w-full">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-white mb-8">
          How It Works
        </h1>

        {/* Steps Container */}
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex items-start space-x-4">
            <FaWallet className="text-purple-500 w-10 h-10" />
            <div>
              <h2 className="text-lg font-medium text-white">Connect Your Wallet</h2>
              <p className="text-gray-300 mt-1">
                Use a Solana-compatible wallet like Phantom to securely log in. Your wallet ensures trustless and decentralized authentication.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start space-x-4">
            <FaCoins className="text-purple-500 w-10 h-10" />
            <div>
              <h2 className="text-lg font-medium text-white">Deposit SOL</h2>
              <p className="text-gray-300 mt-1">
                Deposit a minimum amount of SOL into the betting pool. All transactions are securely handled on the blockchain.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start space-x-4">
            <FaChessKing className="text-purple-500 w-10 h-10" />
            <div>
              <h2 className="text-lg font-medium text-white">Choose Your Mode</h2>
              <p className="text-gray-300 mt-1">
                Play against other players in multiplayer mode 
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start space-x-4">
            <AiOutlineSafety className="text-purple-500 w-10 h-10" />
            <div>
              <h2 className="text-lg font-medium text-white">Place Your Bet</h2>
              <p className="text-gray-300 mt-1">
                Before starting the game, place your bet in SOL. The total pot will be secured by a smart contract.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-start space-x-4">
            <FaGamepad className="text-purple-500 w-10 h-10" />
            <div>
              <h2 className="text-lg font-medium text-white">Play the Game</h2>
              <p className="text-gray-300 mt-1">
                Enjoy a seamless chess experience. SolanaChess ensures fair gameplay 
              </p>
            </div>
          </div>

          {/* Step 6 */}
          <div className="flex items-start space-x-4">
            <FaTrophy className="text-purple-500 w-10 h-10" />
            <div>
              <h2 className="text-lg font-medium text-white">Win and Withdraw</h2>
              <p className="text-gray-300 mt-1">
                The winner receives the entire pot directly into their wallet. Withdraw your winnings or continue playing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
