import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { WalletProvider } from "../src/context/WalletContext"; 
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </StrictMode>,
)
