import React from 'react';

const Tos = () => {
  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-b from-solana-black to-solana-black-light">
      <div className="max-w-4xl mx-auto">
        <div className="card p-8">
          <h1 className="gradient-text text-4xl font-bold mb-8">Terms of Service</h1>
          
          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-solana-purple mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using SolanaChess, you agree to be bound by these Terms of Service and all applicable laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-solana-purple mb-4">2. Game Rules and Betting</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-200">2.1 Betting</h3>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Minimum bet amount is 0.01 SOL</li>
                  <li>Maximum bet amount is 10 SOL</li>
                  <li>All bets are locked in an escrow account until the game concludes</li>
                  <li>A 2% house fee is deducted from the winnings</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-200">2.2 Game Rules</h3>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Games follow standard chess rules</li>
                  <li>Each game has a 30-minute inactivity timeout</li>
                  <li>In case of a draw, the bet amount is split equally between players</li>
                  <li>Disconnections may result in game forfeit</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-solana-purple mb-4">3. User Responsibilities</h2>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Users must maintain a stable internet connection</li>
                <li>Users must not use chess engines or external assistance</li>
                <li>Users must not exploit any bugs or glitches</li>
                <li>Users are responsible for their wallet security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-solana-purple mb-4">4. Game Outcomes</h2>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Checkmate: Winner receives the entire prize pool minus house fee</li>
                <li>Draw: Bet amount is split equally between players</li>
                <li>Timeout: Inactive player forfeits their bet</li>
                <li>Disconnection: May result in forfeit if not reconnected within 5 minutes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-solana-purple mb-4">5. Dispute Resolution</h2>
              <p className="mb-4">
                All game outcomes are final and automatically enforced by smart contracts. In case of technical issues,
                please contact support with your game ID and transaction details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-solana-purple mb-4">6. Modifications</h2>
              <p className="mb-4">
                We reserve the right to modify these terms at any time. Continued use of SolanaChess after changes
                constitutes acceptance of the modified terms.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tos;
