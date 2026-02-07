import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, CheckCircle2, LogOut } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletConnectDialog({ open, onOpenChange }: Props) {
  const { isConnected, publicKey, connect, disconnect } = useWallet();

  const handleConnect = async () => {
    await connect();
    // Optional: close dialog on success
    // onOpenChange(false); 
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Wallet className="h-5 w-5 text-stellar-purple" />
            Connect Stellar Wallet
          </DialogTitle>
          <DialogDescription>
            Connect your Stellar wallet via Freighter to interact with Soroban smart contracts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isConnected ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stellar-teal/10 border border-stellar-teal/30 space-y-2">
                <div className="flex items-center gap-2 text-stellar-teal">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Wallet Connected</span>
                </div>
                <p className="text-sm text-muted-foreground font-mono break-all">{publicKey}</p>
                <p className="text-xs text-muted-foreground">Stellar Testnet • Soroban Enabled</p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={disconnect}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect Wallet
              </Button>
            </div>
          ) : (
            <>
              <Button
                className="w-full gradient-stellar text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                onClick={handleConnect}
              >
                Connect Freighter Wallet
              </Button>
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-stellar-pink transition-colors"
              >
                Don&apos;t have Freighter? Install it
                <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
          <div className="text-xs text-muted-foreground p-3 bg-white/5 rounded-lg border border-white/5">
            <p className="font-medium mb-1 text-stellar-purple">Soroban Smart Contracts</p>
            <p>Invoice tokenization and lending pools run on Soroban smart contracts on the Stellar network for transparent, trustless transactions.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
