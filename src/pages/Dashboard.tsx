import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useStellarAccount, useStellarTransactions, useXLMToINR } from "@/hooks/useStellarData";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskBadge } from "@/components/RiskBadge";
import { mockInvoices, formatINR } from "@/lib/mock-data";
import {
  FileText,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowRight,
  Wallet,
  Loader2,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { FAB } from "@/components/FAB";

export default function Dashboard() {
  const { userRole, user } = useAuth();
  const { isConnected, publicKey } = useWallet();
  const { data: account, isLoading: isLoadingAccount } = useStellarAccount(publicKey);
  const { data: transactions, isLoading: isLoadingTx } = useStellarTransactions(publicKey);
  const { convert } = useXLMToINR();

  const isBusiness = userRole === "business";

  const totalInvoices = mockInvoices.length;
  const totalValue = mockInvoices.reduce((s, i) => s + i.amount_inr, 0);
  const funded = mockInvoices.filter((i) => ["funded", "paid"].includes(i.status));
  const tokenized = mockInvoices.filter((i) => i.status === "tokenized");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nativeBalance = account?.balances.find((b: any) => b.asset_type === 'native')?.balance || "0";
  const balanceInr = convert(nativeBalance);

  return (
    <div className="space-y-6 max-w-7xl animate-slide-up pb-20">
      <div>
        <h1 className="font-display text-3xl font-bold gradient-text w-fit">
          {isBusiness ? "Business Dashboard" : "Investor Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user?.email}
        </p>
      </div>

      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 glass-card border-stellar-purple/30 bg-stellar-purple/10 hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stellar-purple">Stellar Wallet (Testnet)</CardTitle>
              <Wallet className="h-5 w-5 text-stellar-purple" />
            </CardHeader>
            <CardContent>
              {isLoadingAccount ? (
                <Loader2 className="h-4 w-4 animate-spin text-stellar-purple" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground text-glow">{parseFloat(nativeBalance).toFixed(2)} XLM</div>
                  <p className="text-sm text-muted-foreground mt-1">≈ {formatINR(balanceInr)}</p>
                  {!account && <p className="text-xs text-amber-500 mt-2">Account not funded on Testnet</p>}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 glass-card hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingTx ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-stellar-purple" />
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-3 mt-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {transactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-muted-foreground">{tx.hash.substring(0, 12)}...</span>
                        <span className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className={`font-medium ${tx.successful ? 'text-stellar-teal' : 'text-destructive'}`}>
                        {tx.successful ? 'Success' : 'Failed'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">No recent transactions found</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={isBusiness ? "Total Invoices" : "Available Pools"}
          value={String(totalInvoices)}
          icon={<FileText className="h-6 w-6" />}
        />
        <StatsCard
          title={isBusiness ? "Total Value" : "Pool Value"}
          value={formatINR(totalValue)}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="Funded"
          value={String(funded.length)}
          subtitle={formatINR(funded.reduce((s, i) => s + i.amount_inr, 0))}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <StatsCard
          title="Awaiting"
          value={String(tokenized.length)}
          subtitle="Ready for investment"
          icon={<Clock className="h-6 w-6" />}
        />
      </div>

      {/* Invoice/Pool List */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-display font-bold text-lg">
            {isBusiness ? "My Invoices" : "Top Pools"}
          </h2>
          <Link to={isBusiness ? "/upload" : "/pools"}>
            <Button variant="ghost" size="sm" className="text-stellar-pink hover:text-stellar-pink hover:bg-stellar-pink/10">
              {isBusiness ? "Upload New" : "View All"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground bg-black/20">
                <th className="text-left p-4 font-medium">ID</th>
                <th className="text-left p-4 font-medium">Buyer</th>
                <th className="text-right p-4 font-medium">Amount</th>
                <th className="text-center p-4 font-medium">Risk</th>
                <th className="text-center p-4 font-medium">Rate</th>
                <th className="text-center p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">{inv.id}</td>
                  <td className="p-4 font-medium">{inv.buyer_name}</td>
                  <td className="p-4 text-right font-bold text-foreground">{formatINR(inv.amount_inr)}</td>
                  <td className="p-4 text-center"><RiskBadge risk={inv.risk_score} /></td>
                  <td className="p-4 text-center text-stellar-purple font-bold">{inv.interest_rate}%</td>
                  <td className="p-4 text-center"><StatusBadge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {isBusiness && <FAB />}
    </div>
  );
}
