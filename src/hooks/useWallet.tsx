import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { isConnected as checkFreighterConnected, requestAccess, getAddress, getNetwork } from "@stellar/freighter-api";

interface WalletContextType {
  isConnected: boolean;
  publicKey: string | null;
  network: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);

  useEffect(() => {
    // Check if Freighter is already connected on mount
    const checkConnection = async () => {
      try {
        const { isConnected: connected } = await checkFreighterConnected();
        if (connected) {
          const { address } = await getAddress();
          const { network: net } = await getNetwork();
          if (address) {
            setPublicKey(address);
            setIsConnected(true);
            setNetwork(net);
          }
        }
      } catch (e) {
        // Silently fail if not connected
      }
    };
    checkConnection();
  }, []);

  const connect = async () => {
    try {
      // Check if Freighter is installed
      const { isConnected: isInstalled } = await checkFreighterConnected();
      
      if (!isInstalled) {
        toast.error("Freighter wallet not found. Please install it.");
        window.open("https://www.freighter.app/", "_blank");
        return;
      }

      // Request access
      // requestAccess returns the address directly in 'address' field if successful
      const response = await requestAccess();
      
      if (response.error) {
        toast.error("User denied access to Freighter");
        return;
      }
      
      const address = response.address;
      const { network: net } = await getNetwork();

      if (net !== "TESTNET") {
        toast.warning("Please switch Freighter to TESTNET for this demo");
      }

      setPublicKey(address);
      setNetwork(net);
      setIsConnected(true);
      toast.success("Wallet connected successfully");
    } catch (error) {
      toast.error("Failed to connect wallet");
      console.error(error);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setPublicKey(null);
    setNetwork(null);
    toast.info("Wallet disconnected");
  };

  return (
    <WalletContext.Provider value={{ isConnected, publicKey, network, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
};
