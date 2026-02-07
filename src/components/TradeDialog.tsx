import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/useWallet";
import { Asset, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";
import { server } from "@/lib/stellar";
import { toast } from "sonner";
import { ArrowRightLeft, ExternalLink } from "lucide-react";

interface TradeDialogProps {
  assetCode: string;
  assetIssuer: string;
  balance?: string;
}

export function TradeDialog({ assetCode, assetIssuer, balance }: TradeDialogProps) {
  const { publicKey, network } = useWallet();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("1.0"); // USDC per token
  const [loading, setLoading] = useState(false);

  const handleTrade = async () => {
    if (!publicKey) {
      toast.error("Connect wallet first");
      return;
    }

    setLoading(true);
    try {
      const account = await server.loadAccount(publicKey);
      const assetToSell = new Asset(assetCode, assetIssuer);
      const buyingAsset = Asset.native(); // Selling for XLM for simplicity, or we could use USDC

      // Operation: Manage Sell Offer
      // Selling 'amount' of 'assetToSell' at 'price' of 'buyingAsset'
      const op = Operation.manageSellOffer({
        selling: assetToSell,
        buying: buyingAsset,
        amount: amount,
        price: price,
      });

      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: "Test SDF Network ; September 2015",
      })
        .addOperation(op)
        .setTimeout(30)
        .build();

      const signedTx = await signTransaction(tx.toXDR(), {
        networkPassphrase: "Test SDF Network ; September 2015",
      });

      if (signedTx.error) throw new Error(signedTx.error.toString());

      const txFromXdr = TransactionBuilder.fromXDR(
        signedTx.signedTxXdr,
        "Test SDF Network ; September 2015"
      );
      
      await server.submitTransaction(txFromXdr);
      
      toast.success("Sell offer placed on Stellar DEX!");
      setOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error("Trade failed: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const stellarExpertUrl = `https://stellar.expert/explorer/testnet/asset/${assetCode}-${assetIssuer}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Trade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Trade {assetCode}</DialogTitle>
          <DialogDescription>
            Place a sell offer on the Stellar Decentralized Exchange (DEX).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder={balance ? `Max: ${balance}` : "0.00"}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price (XLM)
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3"
              placeholder="1.0"
            />
          </div>
          <div className="text-xs text-muted-foreground text-center">
            <a 
              href={stellarExpertUrl} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              View on Stellar.Expert <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleTrade} disabled={loading}>
            {loading ? "Placing Offer..." : "Place Sell Offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
