import React, { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Connection, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { toast } from "react-toastify";
import { FaChessKing, FaChessQueen, FaCoins, FaWallet } from "react-icons/fa";
import { IoGameController } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const MIN_BET_AMOUNT = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL
const MAX_BET_AMOUNT = 10 * LAMPORTS_PER_SOL; // 10 SOL

const ChessComponent = () => {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("Click Play to start!");
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [availableGames, setAvailableGames] = useState([]);
  const [game, setGame] = useState(new Chess());
  const [roomId, setRoomId] = useState(null);
  const [yourColor, setYourColor] = useState(null);
  const [turn, setTurn] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [moveHistory, setMoveHistory] = useState([]);
  const [highlightSquare, setHighlightSquare] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { walletAddress, walletConnected } = useWallet();

  const connection = new Connection(import.meta.env.VITE_REACT_APP_SOLANA_RPC_HOST);

  // Check for saved wallet connection
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        const savedWallet = localStorage.getItem('phantomWallet');
        
        if (savedWallet) {
          const { solana } = window;
          
          if (solana?.isPhantom) {
            try {
              const response = await solana.connect({ onlyIfTrusted: true });
              // setWalletAddress(response.publicKey.toString());
              // setWalletConnected(true);
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
        // const address = response.publicKey.toString();
        // setWalletAddress(address);
        // setWalletConnected(true);
        // localStorage.setItem('phantomWallet', address);
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error('Connect wallet error:', error);
      toast.error('Failed to connect wallet');
    }
  };

  const disconnectWallet = async () => {
    try {
      const { solana } = window;
      
      if (solana) {
        await solana.disconnect();
        // setWalletAddress('');
        // setWalletConnected(false);
        // localStorage.removeItem('phantomWallet');
      }
    } catch (error) {
      console.error('Disconnect wallet error:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  // WebSocket connection setup
  useEffect(() => {
    let reconnectTimeout;
    let heartbeatInterval;
    
    const connectWebSocket = () => {
      const ws = new WebSocket("wss://chess-server-1zek.onrender.com");
      
      ws.onopen = () => {
        console.log("Connected to WebSocket server");
        setConnectionStatus('connected');
        ws.send(JSON.stringify({ type: "listGames" }));
        
        // Start heartbeat
        heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000); // Send heartbeat every 30 seconds
      };

      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.type === "pong") {
          // Handle heartbeat response
          return;
        }
        handleServerMessage(data);
      };

      ws.onclose = () => {
        console.log("Disconnected from server");
        setConnectionStatus('disconnected');
        setStatus("Disconnected. Attempting to reconnect...");
        clearInterval(heartbeatInterval);
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus('error');
        setStatus("Connection error. Attempting to reconnect...");
      };

      setSocket(ws);
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close();
      }
      clearTimeout(reconnectTimeout);
      clearInterval(heartbeatInterval);
    };
  }, []);

  const handleServerMessage = (data) => {
    switch (data.type) {
      case "listGames":
        setAvailableGames(data.games);
        break;

      case "gameCreated":
        toast.success(`Game created! Waiting for opponent. Room ID: ${data.roomId}`);
        setRoomId(data.roomId);
        break;

      case "gameJoined":
      case "gameStarted":
        const newGame = new Chess(data.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        setGame(newGame);
        toast.success(`Game started! You are ${data.color === 'w' ? 'White' : 'Black'}`);
        setYourColor(data.color);
        setTurn(newGame.turn() === "w" ? "White's turn" : "Black's turn");
        setRoomId(data.roomId);
        break;

      case "moveMade":
        try {
          const updatedGame = new Chess(data.fen);
          setGame(updatedGame);
          setMoveHistory(data.moveHistory || []);
          setHighlightSquare(data.lastMove?.to);
          const currentTurn = updatedGame.turn() === "w" ? "White's turn" : "Black's turn";
          setTurn(currentTurn);
          
          if (updatedGame.isCheckmate()) {
            toast.info(`Checkmate! ${updatedGame.turn() === 'w' ? 'Black' : 'White'} wins!`);
          } else if (updatedGame.isDraw()) {
            toast.info("Game Over - Draw!");
          } else if (updatedGame.isCheck()) {
            toast.warning("Check!");
          }
        } catch (error) {
          console.error("Error updating game state:", error);
          toast.error("Error updating game state");
        }
        break;

      case "opponentLeft":
        toast.warning("Opponent left the game. Waiting for a new opponent...");
        break;

      case "gameOver":
        if (data.prize > 0) {
          toast.success(`${data.result} You won ${data.prize / LAMPORTS_PER_SOL} SOL!`);
        } else {
          toast.info(data.result);
        }
        setGame(null);
        setRoomId(null);
        setYourColor(null);
        setGame(new Chess());
        break;

      case "error":
        toast.error(data.message);
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  };

  const handlePlay = async () => {
    if (!socket) {
      toast.error("Unable to connect to server. Please refresh the page.");
      return;
    }
    if (!walletConnected) {
      toast.warning("Please connect your wallet first!");
      await connectWallet();
      return;
    }
    if (!betAmount || isNaN(betAmount) || parseFloat(betAmount) <= 0) {
      toast.warning("Please enter a valid bet amount!");
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmPlay = async () => {
    if (!termsAccepted) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    try {
      toast.info("Processing transaction...");
      const lamports = BigInt(Math.floor(parseFloat(betAmount) * LAMPORTS_PER_SOL));
      
      // Special test mode for bet amount '10'
      if (betAmount === '10') {
        socket.send(JSON.stringify({ 
          type: "createGame", 
          walletAddress: walletAddress,
          betAmount: "10",
          transactionSignature: "test-mode" 
        }));
        setShowConfirmation(false);
        setTermsAccepted(false);
        return;
      }
      
      // Validate bet amount
      if (lamports < BigInt(MIN_BET_AMOUNT)) {
        toast.error(`Minimum bet amount is ${MIN_BET_AMOUNT / LAMPORTS_PER_SOL} SOL`);
        return;
      }
      if (lamports > BigInt(MAX_BET_AMOUNT)) {
        toast.error(`Maximum bet amount is ${MAX_BET_AMOUNT / LAMPORTS_PER_SOL} SOL`);
        return;
      }
      
      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(walletAddress),
          toPubkey: new PublicKey(import.meta.env.VITE_REACT_APP_ESCROW_ACCOUNT),
          lamports: lamports,
        })
      );

      const { solana } = window;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(walletAddress);

      const signed = await solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      toast.info("Confirming transaction...");
      await connection.confirmTransaction(signature, "confirmed");

      toast.success("Transaction confirmed! Creating game...");
      socket.send(JSON.stringify({ 
        type: "createGame", 
        walletAddress: walletAddress,
        betAmount: Number(lamports),
        transactionSignature: signature 
      }));

      setShowConfirmation(false);
      setTermsAccepted(false);
      
    } catch (error) {
      console.error("Betting error:", error);
      toast.error(error.message || "Failed to place bet. Please try again.");
      setShowConfirmation(false);
      setTermsAccepted(false);
    }
  };

  const handleJoinGame = async (id, requiredBet) => {
    if (!socket || !walletConnected) {
      toast.error("Please connect your wallet first!");
      await connectWallet();
      return;
    }
    
    try {
      toast.info("Processing transaction...");
      
      // Special test mode for bet amount '10'
      if (requiredBet === '10') {
        socket.send(JSON.stringify({ 
          type: "joinGame", 
          roomId: id, 
          walletAddress: walletAddress,
          betAmount: "10",
          transactionSignature: "test-mode" 
        }));
        return;
      }

      const lamports = BigInt(requiredBet.toString().trim());
      
      // Validate bet amount
      if (lamports < BigInt(MIN_BET_AMOUNT)) {
        toast.error(`Minimum bet amount is ${MIN_BET_AMOUNT / LAMPORTS_PER_SOL} SOL`);
        return;
      }
      if (lamports > BigInt(MAX_BET_AMOUNT)) {
        toast.error(`Maximum bet amount is ${MAX_BET_AMOUNT / LAMPORTS_PER_SOL} SOL`);
        return;
      }
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(walletAddress),
          toPubkey: new PublicKey(import.meta.env.VITE_REACT_APP_ESCROW_ACCOUNT),
          lamports,
        })
      );

      const { solana } = window;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(walletAddress);

      const signed = await solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      toast.info("Confirming transaction...");
      await connection.confirmTransaction(signature, "confirmed");

      toast.success("Transaction confirmed! Joining game...");
      socket.send(JSON.stringify({ 
        type: "joinGame", 
        roomId: id, 
        walletAddress: walletAddress,
        betAmount: lamports.toString(),
        transactionSignature: signature 
      }));
      
    } catch (error) {
      console.error("Betting error:", error);
      if (error.message.includes("BigInt")) {
        toast.error("Invalid bet amount. Please try again.");
      } else {
        toast.error(error.message || "Failed to join game. Please try again.");
      }
    }
  };

  const handleLeaveGame = () => {
    if (!socket || !roomId) return;
    socket.send(JSON.stringify({ type: "leaveGame", roomId }));
    setRoomId(null);
    setYourColor(null);
    setGame(new Chess());
    setStatus("You left the game.");
  };

  const onDrop = (sourceSquare, targetSquare) => {
    if (!game) {
      toast.error("No active game!");
      return false;
    }

    const currentTurn = game.turn();
    if (yourColor !== currentTurn) {
      toast.warning(`Not your turn! Waiting for ${currentTurn === 'w' ? 'White' : 'Black'}`);
      return false;
    }

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (move === null) {
        toast.warning("Invalid move!");
        return false;
      }

      setGame(gameCopy);
      socket.send(JSON.stringify({
        type: "move",
        roomId,
        move: {
          from: sourceSquare,
          to: targetSquare
        },
        fen: gameCopy.fen()
      }));

      const newTurn = gameCopy.turn() === 'w' ? "White's turn" : "Black's turn";
      setTurn(newTurn);
      
      if (gameCopy.isCheckmate()) {
        toast.success(`Checkmate! ${gameCopy.turn() === 'w' ? 'Black' : 'White'} wins!`);
      } else if (gameCopy.isDraw()) {
        toast.info("Game Over - Draw!");
      } else if (gameCopy.isCheck()) {
        toast.warning(`Check! ${newTurn}`);
      }

      return true;
    } catch (error) {
      console.error("Move error:", error);
      toast.error("Invalid move!");
      return false;
    }
  };

  const customSquareStyles = {
    ...(highlightSquare && {
      [highlightSquare]: {
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
      },
    }),
  };

  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-b from-solana-black to-solana-black-light relative z-0">
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-solana-black-lighter rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-xl font-bold text-solana-purple mb-4">Confirm Game Creation</h3>
          
          <div className="space-y-4">
            <div className="bg-solana-black rounded-lg p-4">
              <p className="text-gray-300 mb-2">You are about to create a game with:</p>
              <p className="text-solana-purple font-semibold">{betAmount} SOL</p>
            </div>

          
            <label className="flex items-center space-x-2 text-gray-300">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="form-checkbox h-4 w-4 text-solana-purple rounded border-gray-600 bg-solana-black focus:ring-solana-purple"
              />
              <span>
                I accept the <Link to="/tos" target="_blank" className="text-solana-purple hover:text-solana-purple-light underline">terms and conditions</Link>
              </span>
            </label>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setShowConfirmation(false)}
              className="flex-1 py-2 px-4 rounded-lg border border-solana-purple text-solana-purple hover:bg-solana-purple hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmPlay}
              disabled={!termsAccepted}
              className={`flex-1 py-2 px-4 rounded-lg bg-solana-purple text-white ${
                !termsAccepted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-solana-purple-dark'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Panel - Game Controls */}
          <div className="card p-6 space-y-4">
            <h2 className="gradient-text text-2xl font-bold mb-4">Game Controls</h2>
            
            <div className="space-y-4">
              {!roomId && (
                <>
                  <div className="space-y-2">
                    <label className="text-gray-300">Bet Amount (SOL)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="0.01"
                        className="w-full bg-solana-black-lighter border border-solana-purple/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-solana-purple"
                      />
                      <FaCoins className="text-solana-purple w-5 h-5" />
                    </div>
                  </div>
                  
                  {!walletConnected ? (
                    <div className="text-center p-8 bg-gray-800/50 rounded-lg backdrop-blur-sm">
                      <FaWallet className="w-12 h-12 mx-auto text-solana-purple mb-4" />
                      <p className="text-lg text-white mb-2">
                        Connect Phantom Wallet to Start Playing
                      </p>
                      <p className="text-sm text-gray-400">
                        Use the connect button in the navigation bar
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handlePlay}
                      disabled={!socket || !walletConnected}
                      className={`btn-primary w-full flex items-center justify-center space-x-2 ${!walletConnected && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <IoGameController className="w-5 h-5" />
                      <span>Create Game</span>
                    </button>
                  )}
                </>
              )}
              
              <div className="space-y-2">
                <h3 className="text-solana-purple font-semibold">Game Status</h3>
                <div className="bg-solana-black-lighter rounded-lg p-3 text-gray-300">
                  {status}
                </div>
              </div>

              {turn && (
                <div className="space-y-2">
                  <h3 className="text-solana-purple font-semibold">Current Turn</h3>
                  <div className="bg-solana-black-lighter rounded-lg p-3 text-gray-300 flex items-center space-x-2">
                    {turn === "White's turn" ? <FaChessKing className="text-white" /> : <FaChessKing className="text-gray-800" />}
                    <span>{turn}</span>
                  </div>
                </div>
              )}

              {roomId && (
                <button
                  onClick={handleLeaveGame}
                  className="btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  <span>Leave Game</span>
                </button>
              )}
            </div>
          </div>

          {/* Center - Chessboard or Welcome Message */}
          <div className="md:col-span-2">
            {roomId ? (
              <div className="card p-6">
                <Chessboard
                  position={game.fen()}
                  onPieceDrop={onDrop}
                  boardOrientation={yourColor === "w" ? "white" : "black"}
                  customBoardStyle={{
                    borderRadius: "0.5rem",
                    boxShadow: "0 0 20px rgba(153, 69, 255, 0.1)",
                  }}
                  customDarkSquareStyle={{ backgroundColor: "#1A1A1A" }}
                  customLightSquareStyle={{ backgroundColor: "#232323" }}
                  customSquareStyles={{
                    ...(highlightSquare && {
                      [highlightSquare]: {
                        backgroundColor: "rgba(153, 69, 255, 0.3)",
                      },
                    }),
                  }}
                />
              </div>
            ) : (
              <div className="card p-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="p-4 bg-solana-black-lighter rounded-full">
                  <FaChessKing className="w-16 h-16 text-solana-purple" />
                </div>
                <h2 className="gradient-text text-3xl font-bold">Welcome to SolanaChess</h2>
                <p className="text-gray-400 max-w-md">
                  Create a new game or join an existing one to start playing. 
                  Connect your wallet to place bets and earn solana!
                </p>
              </div>
            )}
          </div>

          {/* Right Panel - Available Games & Move History */}
          <div className="space-y-6">
            {/* Available Games */}
            <div className="card p-6">
              <h2 className="gradient-text text-2xl font-bold mb-4">Available Games</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableGames.map((game) => (
                  <div
                    key={game.roomId}
                    className="bg-solana-black-lighter rounded-lg p-3 flex items-center justify-between hover:bg-solana-black cursor-pointer transition-colors"
                    onClick={() => handleJoinGame(game.roomId, game.requiredBet)}
                  >
                    <div className="flex items-center space-x-2">
                      <FaChessQueen className="text-solana-purple" />
                      <span className="text-gray-300">Room {game.roomId}</span>
                    </div>
                    <span className="text-solana-green">{game.betAmount / LAMPORTS_PER_SOL} SOL</span>
                  </div>
                ))}
                {availableGames.length === 0 && (
                  <p className="text-gray-500 text-center">No games available</p>
                )}
              </div>
            </div>

            {/* Move History */}
            {roomId && (
              <div className="card p-6">
                <h2 className="gradient-text text-2xl font-bold mb-4">Move History</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {moveHistory.map((move, index) => (
                    <div
                      key={index}
                      className="bg-solana-black-lighter rounded-lg p-2 text-gray-300 flex justify-between"
                    >
                      <span>{index + 1}.</span>
                      <span>{move}</span>
                    </div>
                  ))}
                  {moveHistory.length === 0 && (
                    <p className="text-gray-500 text-center">No moves yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={`fixed top-4 right-4 flex items-center space-x-2 px-4 py-2 rounded-full ${
        connectionStatus === 'connected' ? 'bg-green-500' : 
        connectionStatus === 'disconnected' ? 'bg-red-500' : 
        'bg-yellow-500'
      } text-white`}>
        <div className={`w-3 h-3 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-300' : 
          connectionStatus === 'disconnected' ? 'bg-red-300' : 
          'bg-yellow-300'
        } animate-pulse`}></div>
        <span className="text-sm">
          {connectionStatus === 'connected' ? 'Connected' : 
           connectionStatus === 'disconnected' ? 'Disconnected' : 
           'Connecting...'}
        </span>
      </div>
    </div>
  );
};

export default ChessComponent;
