require('dotenv').config({ path: '../.env' });
require('dotenv').config();

const WebSocket = require("ws");
const { Chess } = require("chess.js");
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } = require("@solana/web3.js");
const http = require('http');
const fs = require('fs');

// Initialize game-related variables
const games = {};
const gameBets = {};
const gameTimeouts = {};
let nextGameId = 1;

// Rate limiting
const rateLimits = {
  createGame: new Map(), // Store last game creation time per user
  moves: new Map(),      // Store last move time per user
  listGames: new Map(),  // Store last list games time per user
};

const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_GAMES_PER_WINDOW = 2;
const MAX_MOVES_PER_WINDOW = 3;
const MAX_LIST_GAMES_PER_WINDOW = 5;

function isRateLimited(type, userId) {
  const now = BigInt(Date.now());
  const limits = rateLimits[type].get(userId) || [];
  
  // Clean up old entries
  const recentActions = limits.filter(time => (now - BigInt(time)) < BigInt(RATE_LIMIT_WINDOW));
  
  // Check if under limit
  const maxActions = type === 'createGame' ? MAX_GAMES_PER_WINDOW : type === 'moves' ? MAX_MOVES_PER_WINDOW : MAX_LIST_GAMES_PER_WINDOW;
  if (recentActions.length >= maxActions) {
    return true;
  }
  
  // Update limits
  recentActions.push(Number(now));
  rateLimits[type].set(userId, recentActions);
  return false;
}

// Add this helper function at the top of your file
const formatMove = (move) => {
    if (!move) return null;
    return `${move.from}${move.to}`;
};

// Add constants at the top
const HOUSE_FEE_PERCENTAGE = 2; // 2% fee
const MIN_BET_AMOUNT = 0.01 * LAMPORTS_PER_SOL; // Minimum 0.01 SOL bet
const MAX_BET_AMOUNT = 10 * LAMPORTS_PER_SOL; // Maximum 10 SOL bet

// Add helper functions
const calculateHouseFee = (amount) => {
    return Math.floor(amount * (HOUSE_FEE_PERCENTAGE / 100));
};

const validateBetAmount = (amount) => {
    const minBet = BigInt(MIN_BET_AMOUNT);
    const maxBet = BigInt(MAX_BET_AMOUNT);
    
    if (amount < minBet) {
        return `Minimum bet amount is ${Number(minBet) / LAMPORTS_PER_SOL} SOL`;
    }
    if (amount > maxBet) {
        return `Maximum bet amount is ${Number(maxBet) / LAMPORTS_PER_SOL} SOL`;
    }
    return null;
};

const server = http.createServer();
const PORT = process.env.PORT || 3001;

const wss = new WebSocket.Server({ server: server });
console.log(`WebSocket server started on port ${PORT}`);

// Initialize Solana connection and accounts
const connection = new Connection(process.env.SOLANA_RPC_HOST);

// Initialize escrow account from private key
let escrowKeypair;
try {
    const privateKey = process.env.ESCROW_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('ESCROW_PRIVATE_KEY environment variable is not set');
    }

    // Import bs58 for decoding
    const bs58 = require('bs58');
    
    // Decode the base58 private key
    const decodedKey = bs58.decode(privateKey);
    
    // Create keypair from decoded key
    escrowKeypair = Keypair.fromSecretKey(decodedKey);
    console.log('Successfully initialized escrow account:', escrowKeypair.publicKey.toString());
} catch (error) {
    console.error('Failed to initialize escrow account:', error);
    process.exit(1);
}

const ESCROW_ACCOUNT = escrowKeypair.publicKey;
const ESCROW_KEYPAIR = escrowKeypair;

const refundPlayer = async (address, amount) => {
    try {
        console.log(`Attempting to refund ${amount} lamports to ${address}`);
        
        // Create a transaction to refund the player
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: ESCROW_ACCOUNT,
                toPubkey: new PublicKey(address),
                lamports: BigInt(amount),
            })
        );

        // Sign and send the transaction
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = ESCROW_ACCOUNT;

        // Sign with escrow account
        transaction.sign(ESCROW_KEYPAIR);

        // Send transaction
        const signature = await connection.sendRawTransaction(transaction.serialize());
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, "confirmed");
        
        if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        console.log(`Refund successful! Signature: ${signature}`);
        return signature;
    } catch (error) {
        console.error("Refund failed:", error);
        throw error;
    }
};

wss.on("connection", (ws) => {
    console.log("New client connected");
    
    // Add lastPing timestamp to track connection health
    ws.isAlive = true;
    ws.lastPing = Date.now();

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case "ping":
                ws.isAlive = true;
                ws.lastPing = Date.now();
                ws.send(JSON.stringify({ type: "pong" }));
                break;

            case "listGames":
                if (isRateLimited('listGames', data.walletAddress)) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Rate limit exceeded. Please try again later."
                    }));
                    return;
                }
                handleListGames(ws);
                break;

            case "createGame":
                if (isRateLimited('createGame', data.walletAddress)) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Rate limit exceeded. Please try again later."
                    }));
                    return;
                }
                handleCreateGame(ws, data);
                break;

            case "joinGame":
                handleJoinGame(ws, data.roomId, data);
                break;

            case "move":
                if (isRateLimited('moves', data.walletAddress)) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Rate limit exceeded. Please try again later."
                    }));
                    return;
                }
                handleMove(ws, data.roomId, data.move);
                break;
            case "leaveGame":
                handleLeaveGame(ws, data.roomId);
                break;

            default:
                console.log("Unknown message type:", data.type);
                break;
        }
    });

    ws.on("close", async () => {
        console.log("Client disconnected");
        await handleDisconnect(ws);
    });
});

// Add connection health check interval
const connectionCheckInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive && Date.now() - ws.lastPing > 60000) { // 60 seconds timeout
            console.log("Terminating inactive connection");
            return ws.terminate();
        }
    });
}, 30000); // Check every 30 seconds

// Clean up interval on server shutdown
process.on('SIGTERM', () => {
    clearInterval(connectionCheckInterval);
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
});

const handleListGames = (ws) => {
    const availableGames = Object.entries(games)
        .filter(([roomId, game]) => game.status === "waiting")
        .map(([roomId, game]) => ({
            roomId,
            players: game.players.length,
            status: game.status,
            betAmount: Number(gameBets[roomId].amount) / LAMPORTS_PER_SOL,
            requiredBet: gameBets[roomId].amount.toString() // Ensure it's a string for BigInt conversion
        }));

    ws.send(JSON.stringify({ type: "listGames", games: availableGames }));
};

const handleCreateGame = async (ws, data) => {
    const { walletAddress, betAmount, transactionSignature } = data;
    
    try {
        // Validate bet amount
        const betAmountBigInt = BigInt(betAmount);
        const betError = validateBetAmount(betAmountBigInt);
        if (betError) {
            ws.send(JSON.stringify({
                type: "error",
                message: betError
            }));
            await refundPlayer(walletAddress, betAmount);
            return;
        }

        // Verify transaction
        let tx = null;
        let retries = 3;
        while (retries > 0 && !tx) {
            try {
                tx = await connection.getTransaction(transactionSignature, {
                    commitment: "confirmed",
                    maxSupportedTransactionVersion: 0
                });
                if (!tx) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    retries--;
                    continue;
                }
            } catch (error) {
                console.error("Transaction verification failed:", error);
                retries--;
                if (retries === 0) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Failed to verify transaction"
                    }));
                    await refundPlayer(walletAddress, betAmount);
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (!tx) {
            ws.send(JSON.stringify({
                type: "error",
                message: "Transaction verification failed"
            }));
            await refundPlayer(walletAddress, betAmount);
            return;
        }

        // Create a new game room
        const roomId = `game-${nextGameId++}`;
        const chessGame = new Chess();
        games[roomId] = {
            players: [ws],
            playerAddresses: [walletAddress],
            status: "waiting",
            game: chessGame,
            lastMoveTime: Date.now(),
            colors: {
                [walletAddress]: "w" // Creator always plays as white
            }
        };

        gameBets[roomId] = {
            amount: betAmount,
            creator: walletAddress
        };

        // Add timeout for the game
        gameTimeouts[roomId] = setTimeout(() => handleGameTimeout(roomId), 30 * 60 * 1000); // 30 minutes

        ws.roomId = roomId;
        ws.walletAddress = walletAddress;
        ws.color = "w"; // Set color for the creator
        
        ws.send(JSON.stringify({ 
            type: "gameCreated", 
            roomId,
            color: "w",
            fen: chessGame.fen(),
            turn: chessGame.turn()
        }));

        broadcastAvailableGames();
        
    } catch (error) {
        console.error("Game creation error:", error);
        ws.send(JSON.stringify({
            type: "error",
            message: "Failed to create game"
        }));
        try {
            await refundPlayer(walletAddress, betAmount);
        } catch (refundError) {
            console.error("Refund failed after game creation error:", refundError);
        }
    }
};

const handleJoinGame = async (ws, roomId, data) => {
    const { walletAddress, betAmount, transactionSignature } = data;
    
    try {
        const game = games[roomId];
        if (!game) {
            ws.send(JSON.stringify({
                type: "error",
                message: "Game not found"
            }));
            await refundPlayer(walletAddress, betAmount);
            return;
        }

        if (game.status !== "waiting") {
            ws.send(JSON.stringify({
                type: "error",
                message: "Game is no longer available"
            }));
            await refundPlayer(walletAddress, betAmount);
            return;
        }

        // Verify transaction
        let tx = await connection.getTransaction(transactionSignature, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0
        });

        if (!tx) {
            ws.send(JSON.stringify({
                type: "error",
                message: "Transaction verification failed"
            }));
            await refundPlayer(walletAddress, betAmount);
            return;
        }

        // Add player to the game
        game.players.push(ws);
        game.playerAddresses.push(walletAddress);
        game.status = "active";
        game.colors[walletAddress] = "b"; // Joiner always plays as black
        
        ws.roomId = roomId;
        ws.walletAddress = walletAddress;
        ws.color = "b"; // Set color for the joiner

        // Notify both players
        game.players.forEach((player) => {
            player.send(JSON.stringify({
                type: "gameStart",
                roomId: roomId,
                color: game.colors[player.walletAddress],
                turn: "w", // Explicitly state it's white's turn
                fen: game.game.fen(),
                whitePlayer: game.playerAddresses[0], // Add player information
                blackPlayer: game.playerAddresses[1]
            }));
        });

        broadcastAvailableGames();
    } catch (error) {
        console.error("Join game error:", error);
        ws.send(JSON.stringify({
            type: "error",
            message: "Failed to join game"
        }));
        try {
            await refundPlayer(walletAddress, betAmount);
        } catch (refundError) {
            console.error("Refund failed after join error:", refundError);
        }
    }
};

const handleDisconnect = async (ws) => {
    console.log("Client disconnected");
    
    if (!ws.roomId) return;

    const game = games[ws.roomId];
    if (!game) return;

    const bet = gameBets[ws.roomId];
    if (!bet) return;

    try {
        // If game hasn't started (waiting state), refund the creator
        if (game.status === "waiting") {
            await refundPlayer(game.playerAddresses[0], bet.amount);
            game.players.forEach(player => {
                if (player.readyState === WebSocket.OPEN) {
                    player.send(JSON.stringify({
                        type: "gameOver",
                        result: "Game cancelled - Player left",
                        refunded: true
                    }));
                }
            });
        }
        // If game is in progress, refund both players
        else if (game.status === "active") {
            await Promise.all(game.playerAddresses.map(addr => 
                refundPlayer(addr, bet.amount)
            ));
            game.players.forEach(player => {
                if (player.readyState === WebSocket.OPEN) {
                    player.send(JSON.stringify({
                        type: "gameOver",
                        result: "Game cancelled - Opponent left",
                        refunded: true
                    }));
                }
            });
        }
    } catch (error) {
        console.error("Error handling disconnect:", error);
    } finally {
        // Cleanup
        if (gameTimeouts[ws.roomId]) {
            clearTimeout(gameTimeouts[ws.roomId]);
            delete gameTimeouts[ws.roomId];
        }
        delete games[ws.roomId];
        delete gameBets[ws.roomId];
        broadcastAvailableGames();
    }
};

const handleGameTimeout = async (roomId) => {
    const game = games[roomId];
    const bet = gameBets[roomId];
    
    if (!game || !bet) return;

    try {
        // Refund all players
        await Promise.all(game.playerAddresses.map(addr => 
            refundPlayer(addr, bet.amount)
        ));

        // Notify players
        game.players.forEach(player => {
            if (player.readyState === WebSocket.OPEN) {
                player.send(JSON.stringify({
                    type: "gameTimeout",
                    result: "Game timed out - Refund issued",
                    refunded: true
                }));
            }
        });
    } catch (error) {
        console.error("Error handling game timeout:", error);
    } finally {
        // Cleanup
        delete games[roomId];
        delete gameBets[roomId];
        delete gameTimeouts[roomId];
        broadcastAvailableGames();
    }
};

const handleMove = (ws, roomId, move) => {
    const game = games[roomId];

    if (!game || !game.game || !game.players.includes(ws)) {
        ws.send(JSON.stringify({
            type: "error",
            message: "You are not part of this game or the game is invalid.",
        }));
        return;
    }

    const chess = game.game;

    console.log(`Current turn: ${chess.turn()}, Player color: ${ws.color}`);

    // Ensure the player moves during their turn
    if (chess.turn() !== ws.color) {
        console.log(`Invalid turn. Expected: ${chess.turn()}, Got: ${ws.color}, Player: ${ws.walletAddress}`);
        ws.send(JSON.stringify({
            type: "error",
            message: `It's not your turn. It's ${chess.turn() === "w" ? "White" : "Black"}'s turn.`,
        }));
        return;
    }

    // Attempt the move
    try {
        const result = chess.move({
            from: move.from,
            to: move.to,
            promotion: "q" // Handle pawn promotion
        });

        if (!result) {
            ws.send(JSON.stringify({
                type: "error",
                message: "Invalid move.",
            }));
            return;
        }

        console.log(`Move successful: ${move.from} -> ${move.to}, Next turn: ${chess.turn()}`);

        // Update last move time
        game.lastMoveTime = Date.now();

        // Notify all players of the move
        game.players.forEach((player) => {
            player.send(JSON.stringify({
                type: "moveMade",
                fen: chess.fen(),
                turn: chess.turn(),
                lastMove: move,
                moveBy: ws.walletAddress
            }));
        });
    } catch (error) {
        console.error("Error handling move:", error);
    }
};

const handleGameOver = (roomId, result) => {
    const game = games[roomId];
    if (!game) {
        console.error(`Game ${roomId} not found during game over.`);
        return;
    }

    console.log(`Game ${roomId} ended with result:`, result);

    // Notify all players of the game result
    game.players.forEach((player) => {
        player.send(JSON.stringify({
            type: "gameOver",
            result, // Includes winner, draw, or other relevant info
            fen: game.game.fen(), // Final board state
        }));
    });

    // Handle bet settlement if applicable
    if (gameBets[roomId]) {
        const bet = gameBets[roomId];
        const winnerAddress = result.type === "checkmate" ? result.winner : null;

        if (winnerAddress) {
            settleBet(roomId, winnerAddress, bet.amount);
        } else if (result.type === "draw") {
            // Refund both players equally in case of a draw
            const refundAmount = BigInt(bet.amount) / BigInt(2);
            game.playerAddresses.forEach(async (address) => {
                try {
                    await refundPlayer(address, refundAmount);
                    console.log(`Refunded ${refundAmount} to player ${address}`);
                } catch (error) {
                    console.error(`Failed to refund player ${address}:`, error);
                }
            });
        }
    }

    // Clean up game state
    delete games[roomId];
    delete gameBets[roomId];
    console.log(`Cleaned up game ${roomId}.`);
};

const handleLeaveGame = (ws, roomId) => {
    const game = games[roomId];
    if (!game) return;

    game.players = game.players.filter((player) => player !== ws);
    ws.roomId = null;

    if (game.players.length === 0) {
        delete games[roomId];
    } else {
        game.status = "waiting";
        game.players.forEach((player) =>
            player.send(JSON.stringify({ type: "opponentLeft" }))
        );
    }

    broadcastAvailableGames();
};

const broadcastAvailableGames = () => {
    const availableGames = Object.entries(games)
        .filter(([_, game]) => game.status === "waiting")
        .map(([roomId, game]) => ({
            id: roomId,
            players: game.players.length,
            status: game.status,
        }));

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "listGames", games: availableGames }));
        }
    });
};

server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});
