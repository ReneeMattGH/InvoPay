import { Horizon } from '@stellar/stellar-sdk';

export const STELLAR_TESTNET_URL = 'https://horizon-testnet.stellar.org';
export const server = new Horizon.Server(STELLAR_TESTNET_URL);

export interface StellarAccount {
  id: string;
  balances: {
    balance: string;
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
  }[];
}

export interface StellarTransaction {
  id: string;
  hash: string;
  created_at: string;
  successful: boolean;
  operation_count: number;
}
