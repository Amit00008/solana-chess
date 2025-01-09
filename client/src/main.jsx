import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { WalletProviderWrapper } from './contexts/WalletProvider.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Buffer and polyfill
import { Buffer } from 'buffer';

// Make Buffer globally available
if (!window.Buffer) {
  window.Buffer = Buffer;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Wrap WalletProviderWrapper here if needed */}
    <WalletProviderWrapper>
      <App />
    </WalletProviderWrapper>
    <ToastContainer />
  </StrictMode>
);
