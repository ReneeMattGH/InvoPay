# InvoPay - Invoice Financing on Stellar & Soroban

InvoPay is a decentralized invoice financing platform that allows businesses to tokenize their invoices as NFTs on the Stellar network and raise liquidity from investors through Soroban smart contracts.

## Features

- **Role-Based Dashboards**: Separate interfaces for Businesses (Borrowers) and Investors (Lenders).
- **Invoice Tokenization**: Mint invoices as unique NFTs on Stellar with metadata.
- **Real-Time Risk Scoring**: Dynamic risk assessment based on Horizon account history.
- **Lending Pools**: Soroban-based liquidity pools with senior/junior tranches.
- **Secondary Market**: Trade tokenized invoices on the Stellar DEX.
- **Compliance**: Asset authorization and clawback flags for regulatory compliance.
- **India Focus**: INR denomination and simulated UPI payout integration.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Blockchain**: Stellar SDK, Soroban Client, Freighter Wallet
- **Backend/Storage**: Supabase (Auth, Database, Storage)
- **Deployment**: Vercel (Frontend), Soroban Testnet (Contracts)

## Prerequisites

- Node.js v18+
- Freighter Wallet Extension (configured for Testnet)
- Soroban CLI (for contract compilation, optional for frontend dev)

## Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/stellar-cash-flow.git
    cd stellar-cash-flow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
    VITE_SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

5.  **Build for Production:**
    ```bash
    npm run build
    ```

## Usage Flow

1.  **Sign Up/Login**: Create an account as a Business or Investor.
2.  **Connect Wallet**: Connect Freighter wallet (ensure Testnet is selected and funded via Friendbot).
3.  **Business**:
    - Upload an invoice PDF.
    - Tokenize the invoice (mints NFT).
    - Deploy a Lending Pool for the invoice.
4.  **Investor**:
    - Browse available pools.
    - Invest USDC/XLM into a pool (Senior or Junior tranche).
    - View yields and withdraw returns.
5.  **Secondary Market**: Trade invoice tokens on the DEX.

## Smart Contracts

The project uses two main Soroban contracts:
- `invoice_nft`: Handles minting and metadata of invoice tokens.
- `lending_pool`: Manages deposits, tranches, and yield distribution.

## License

MIT
