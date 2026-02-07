import { useState } from "react";
import { mockInvoices, formatINR, formatUSDC } from "@/lib/mock-data";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Layers, TrendingUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function BrowsePools() {
  const pools = mockInvoices.filter((i) => i.status === "tokenized" || i.status === "funded");
  const [investDialog, setInvestDialog] = useState<typeof pools[0] | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [investing, setInvesting] = useState(false);

  const handleInvest = () => {
    setInvesting(true);
    setTimeout(() => {
      setInvesting(false);
      setInvestDialog(null);
      setInvestAmount("");
      toast.success("Investment submitted via Soroban! 🎉");
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Lending Pools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse tokenized invoices and invest via Stellar smart contracts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pools.map((pool) => (
          <div key={pool.id} className="glass-card rounded-xl p-5 space-y-4 hover:glow-cyan transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{pool.id}</p>
                <h3 className="font-display font-semibold mt-1">{pool.buyer_name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{pool.description}</p>
              </div>
              <StatusBadge status={pool.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Value</p>
                <p className="font-medium">{formatINR(pool.amount_inr)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Token Value</p>
                <p className="font-medium text-primary">{formatUSDC(pool.token_value!)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">APR</p>
                <p className="font-medium text-primary">{pool.interest_rate}%</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Risk</p>
                <RiskBadge risk={pool.risk_score} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">Due: {pool.due_date}</span>
              <Button
                size="sm"
                className="gradient-stellar text-primary-foreground"
                onClick={() => setInvestDialog(pool)}
                disabled={pool.status === "funded"}
              >
                <TrendingUp className="mr-1 h-3 w-3" />
                {pool.status === "funded" ? "Fully Funded" : "Invest"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {pools.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-display text-lg">No pools available yet</p>
          <p className="text-sm mt-1">Tokenized invoices will appear here.</p>
        </div>
      )}

      {/* Invest Dialog */}
      <Dialog open={!!investDialog} onOpenChange={() => setInvestDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Invest in Pool</DialogTitle>
            <DialogDescription>
              Invest in {investDialog?.buyer_name} via Soroban smart contract.
            </DialogDescription>
          </DialogHeader>
          {investDialog && (
            <div className="space-y-4 mt-2">
              <div className="glass-card rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Pool</span><span className="font-medium">{investDialog.id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">APR</span><span className="text-primary font-medium">{investDialog.interest_rate}%</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Risk</span><RiskBadge risk={investDialog.risk_score} /></div>
              </div>

              <div>
                <Label>Investment Amount (USDC)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 1000"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  min={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {formatINR(Number(investAmount || 0) * 83.5)} equivalent
                </p>
              </div>

              <Button
                className="w-full gradient-stellar text-primary-foreground"
                onClick={handleInvest}
                disabled={!investAmount || investing}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {investing ? "Processing on Soroban..." : "Confirm Investment"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
