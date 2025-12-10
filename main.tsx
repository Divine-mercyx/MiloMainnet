import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const { networkConfig } = createNetworkConfig({
    localnet: { url: getFullnodeUrl('localnet') },
    devnet: { url: getFullnodeUrl('devnet') },
    testnet: { url: getFullnodeUrl('testnet') },
    mainnet: { url: getFullnodeUrl('mainnet') },
});

const queryClient = new QueryClient();

// Create a component to handle network switching
const AppWithNetworkSwitching = () => {
  const [activeNetwork, setActiveNetwork] = useState<'mainnet' | 'testnet' | 'devnet' | 'localnet'>('mainnet');

  useEffect(() => {
    const handleNetworkChange = (event: CustomEvent) => {
      setActiveNetwork(event.detail);
    };

    window.addEventListener('networkChange', handleNetworkChange as EventListener);
    return () => {
      window.removeEventListener('networkChange', handleNetworkChange as EventListener);
    };
  }, []);


  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider 
        networks={networkConfig} 
        network={activeNetwork}
        onNetworkChange={(network) => setActiveNetwork(network as any)}
      >
        <WalletProvider autoConnect>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppWithNetworkSwitching />
  </React.StrictMode>
);