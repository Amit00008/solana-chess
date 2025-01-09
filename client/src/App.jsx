import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { auth } from './firebase/firebaseconfig';
import { onAuthStateChanged } from 'firebase/auth';
import { WalletProvider } from './contexts/WalletContext';
import Navbar from './components/Navbar';
import Account from './components/account';
import ChessComponent from './components/chess';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from './components/footer';
import HowItWorks from './pages/hiw';
import Support from './pages/support';
import Tos from './components/Tos';

function Home() {
  const [availableGames, setAvailableGames] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket(import.meta.env.REACT_APP_SERVER);

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      // Request list of games when connection is established
      ws.send(JSON.stringify({ type: "listGames" }));
    };

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === "listGames") {
        setAvailableGames(data.games);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from server");
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Calculate total active players
  const totalPlayers = availableGames.reduce((total, game) => total + game.players, 0);

  return (
    <div className="mt-4">
      <KingOfTheHill />
      <Post
        image="https://play-lh.googleusercontent.com/bpdkCCI8e5IbAkLgRwI3e5dJDSR_kFe1Ioh7f7_AxxaR_Jn9VHF1Hx56DEAqGnHPynmd"
        mcap="Play Now"
        activePlayers={totalPlayers}
      />
    </div>
  );
}

function App() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <WalletProvider>
      <div className="min-h-screen">
        <Router>
          <Navbar />
          <div className="px-4 w-full min-h-[calc(100vh-80px)]">
            <Routes>
              <Route exact path="/" element={<ChessComponent userId={userId} />} />
              <Route exact path="/chess" element={<ChessComponent userId={userId} />} />
              <Route path="/user" element={<Account />} />
              <Route path="/howitworks" element={<HowItWorks />} />
              <Route path="/support" element={<Support />} />
              <Route path="/tos" element={<Tos />} />
            </Routes>
          </div>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
          <div className=' w-full sm:relative sm:bottom-0'>
            <Footer />
          </div>
        </Router>
      </div>
    </WalletProvider>
  );
}

export default App;
