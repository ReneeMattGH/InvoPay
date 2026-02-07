import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";
import { Keypair } from "@stellar/stellar-sdk";

interface WalletContextType {
  isConnected: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const connect = async () => {
    try {
      // Simulating Freighter connection
      // In a real app: const { publicKey } = await freighter.getPublicKey();
      
      // For demo: Generate a random keypair if none exists, or use a fixed one for testing
      // We'll generate one so it's a valid Stellar address
      const pair = Keypair.random();
      const key = pair.publicKey();
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setPublicKey(key);
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
    toast.info("Wallet disconnected");
  };

  return (
    <WalletContext.Provider value={{ isConnected, publicKey, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
};
