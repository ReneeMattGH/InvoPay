import { Asset, Keypair, Operation, TransactionBuilder, AuthRequiredFlag, AuthRevocableFlag, AuthClawbackEnabledFlag } from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";
import { server } from "./stellar";
import { toast } from "sonner";

// Hardcoded for demo purposes (In production, store securely on backend)
// Public: GA7M6MRGN4THGVMJ6BUY62TBFB5Z564E5N47N2Y2GQZ5I3UHFWJ5OBI3
const ISSUER_SECRET = "SC5RDALI2TDFQQXBAWG2NOI6XKHCX7FOYK3NB62PY56ANMFWGRLLHBET";
const ISSUER_KEYPAIR = Keypair.fromSecret(ISSUER_SECRET);

export const getIssuerPublicKey = () => ISSUER_KEYPAIR.publicKey();

// Fund the issuer account using Friendbot (only needed once, but good for demo)
export const fundIssuerAccount = async () => {
  try {
    const response = await fetch(`https://friendbot.stellar.org?addr=${ISSUER_KEYPAIR.publicKey()}`);
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Error funding issuer:", e);
    // Might already be funded
    return null;
  }
};

export const configureIssuerCompliance = async () => {
  try {
    const account = await server.loadAccount(ISSUER_KEYPAIR.publicKey());
    
    // Check if flags are already set (simplified check)
    if (account.flags.auth_required && account.flags.auth_revocable && account.flags.auth_clawback_enabled) {
      return;
    }

    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: "Test SDF Network ; September 2015",
    })
    .addOperation(Operation.setOptions({
      setFlags: (AuthRequiredFlag | AuthRevocableFlag | AuthClawbackEnabledFlag) as any
    }))
    .setTimeout(30)
    .build();

    tx.sign(ISSUER_KEYPAIR);
    await server.submitTransaction(tx);
    console.log("Issuer compliance flags set");
  } catch (e) {
    console.error("Error configuring issuer compliance:", e);
    // Don't block flow if this fails (e.g., already set or network issue)
  }
};

export const tokenizeInvoice = async (
  userPublicKey: string,
  invoiceId: string,
  amount: number,
  invoiceNumber: string
) => {
  try {
    // 1. Ensure Issuer is funded (lazy funding for demo)
    await fundIssuerAccount();
    
    // 1.5 Configure Compliance Flags
    await configureIssuerCompliance();

    // 2. Generate Asset Code (Must be alphanumeric, <= 12 chars)
    // Format: INV-[Last 8 chars of ID] or similar. 
    // Let's use "INV" + last 4 of invoice number to keep it short and readable
    const shortCode = `INV${invoiceNumber.slice(-4)}`.toUpperCase();
    // Fallback if invoice number is weird, ensure alphanumeric
    const sanitizedCode = shortCode.replace(/[^A-Z0-9]/g, 'X').slice(0, 12);
    
    if (sanitizedCode.length < 3) throw new Error("Asset code too short");

    const asset = new Asset(sanitizedCode, ISSUER_KEYPAIR.publicKey());

    // 3. Load User Account (Source of transaction)
    const userAccount = await server.loadAccount(userPublicKey);

    // 4. Build Transaction
    // Op 1: User trusts Issuer for Asset (User signs)
    // Op 2: Issuer sends Asset to User (Issuer signs)
    const tx = new TransactionBuilder(userAccount, {
      fee: "100", // min fee
      networkPassphrase: "Test SDF Network ; September 2015",
      // timebounds is required, but setTimeout handles it if omitted or we can pass explicit
    })
      .addOperation(Operation.changeTrust({
        asset: asset,
        // Limit can be amount or max
        limit: amount.toString()
      }))
      .addOperation(Operation.payment({
        source: ISSUER_KEYPAIR.publicKey(),
        destination: userPublicKey,
        asset: asset,
        amount: amount.toString()
      }))
      .setTimeout(30)
      .build();

    // 5. Sign with Issuer Keypair (Server-side signing simulated)
    tx.sign(ISSUER_KEYPAIR);

    // 6. Sign with Freighter (User-side signing)
    const signedTx = await signTransaction(tx.toXDR(), {
      networkPassphrase: "Test SDF Network ; September 2015"
    });

    if (signedTx.error) {
      throw new Error(signedTx.error.toString());
    }

    // 7. Submit to Stellar
    const txFromXdr = TransactionBuilder.fromXDR(signedTx.signedTxXdr, "Test SDF Network ; September 2015");
    const txResult = await server.submitTransaction(txFromXdr);
    
    console.log("Tokenization Success:", txResult);
    return {
      success: true,
      hash: txResult.hash,
      assetCode: sanitizedCode,
      issuer: ISSUER_KEYPAIR.publicKey()
    };

  } catch (error) {
    console.error("Tokenization Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    toast.error("Tokenization failed: " + errorMessage);
    throw error;
  }
};
