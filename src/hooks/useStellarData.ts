import { useQuery } from "@tanstack/react-query";
import { server } from "@/lib/stellar";

// Mock rate for XLM to INR
const MOCK_XLM_TO_INR = 25.5; 

export function useStellarAccount(publicKey: string | null) {
  return useQuery({
    queryKey: ["stellar-account", publicKey],
    queryFn: async () => {
      if (!publicKey) return null;
      try {
        // Fetch account details
        const account = await server.accounts().accountId(publicKey).call();
        return account;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        // If account not found (404), it means it's not funded yet.
        if (error.response?.status === 404) {
          return null; // Handle not funded case
        }
        console.error("Error fetching Stellar account:", error);
        throw error;
      }
    },
    enabled: !!publicKey,
    refetchInterval: 30000, // Poll every 30s
    retry: false,
  });
}

export function useStellarTransactions(publicKey: string | null) {
  return useQuery({
    queryKey: ["stellar-transactions", publicKey],
    queryFn: async () => {
      if (!publicKey) return [];
      try {
        const response = await server.transactions()
          .forAccount(publicKey)
          .limit(5)
          .order("desc")
          .call();
        return response.records;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.response?.status === 404) {
          return [];  
        }
        console.error("Error fetching Stellar transactions:", error);
        throw error;
      }
    },
    enabled: !!publicKey,
    refetchInterval: 30000,
    retry: false,
  });
}

export function useXLMToINR() {
  return {
    rate: MOCK_XLM_TO_INR,
    convert: (xlmAmount: string | number) => {
      const val = typeof xlmAmount === 'string' ? parseFloat(xlmAmount) : xlmAmount;
      return isNaN(val) ? 0 : val * MOCK_XLM_TO_INR;
    }
  };
}
