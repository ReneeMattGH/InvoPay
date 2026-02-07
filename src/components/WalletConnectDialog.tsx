import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletConnectDialog({ open, onOpenChange }: Props) {
  const [connected, setConnected] = useState(false);
  const mockAddress = "GBRP...X4Q7";

  const handleConnect = () => {
    // Mock Freighter wallet connection
    setTimeout(() => setConnected(true), 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Connect Stellar Wallet
          </DialogTitle>
          <DialogDescription>
            Connect your Stellar wallet via Freighter to interact with Soroban smart contracts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {connected ? (
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Wallet Connected</span>
              </div>
              <p className="text-sm text-muted-foreground font-mono">{mockAddress}</p>
              <p className="text-xs text-muted-foreground">Stellar Testnet • Soroban Enabled</p>
            </div>
          ) : (
            <>
              <Button
                className="w-full gradient-stellar text-primary-foreground font-medium"
                onClick={handleConnect}
              >
                Connect Freighter Wallet
              </Button>
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Don&apos;t have Freighter? Install it
                <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
          <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
            <p className="font-medium mb-1">Soroban Smart Contracts</p>
            <p>Invoice tokenization and lending pools run on Soroban smart contracts on the Stellar network for transparent, trustless transactions.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
