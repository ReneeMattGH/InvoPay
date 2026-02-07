import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { userRole, user } = useAuth();
  const isBusiness = userRole === "business";

  const totalInvoices = mockInvoices.length;
  const totalValue = mockInvoices.reduce((s, i) => s + i.amount_inr, 0);
  const funded = mockInvoices.filter((i) => ["funded", "paid"].includes(i.status));
  const tokenized = mockInvoices.filter((i) => i.status === "tokenized");

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display text-2xl font-bold">
          {isBusiness ? "Business Dashboard" : "Investor Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user?.email}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={isBusiness ? "Total Invoices" : "Available Pools"}
          value={String(totalInvoices)}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatsCard
          title={isBusiness ? "Total Value" : "Pool Value"}
          value={formatINR(totalValue)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatsCard
          title="Funded"
          value={String(funded.length)}
          subtitle={formatINR(funded.reduce((s, i) => s + i.amount_inr, 0))}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatsCard
          title="Awaiting"
          value={String(tokenized.length)}
          subtitle="Ready for investment"
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Invoice/Pool List */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-semibold">
            {isBusiness ? "My Invoices" : "Top Pools"}
          </h2>
          <Link to={isBusiness ? "/upload" : "/pools"}>
            <Button variant="ghost" size="sm" className="text-primary">
              {isBusiness ? "Upload New" : "View All"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3 font-medium">ID</th>
                <th className="text-left p-3 font-medium">Buyer</th>
                <th className="text-right p-3 font-medium">Amount</th>
                <th className="text-center p-3 font-medium">Risk</th>
                <th className="text-center p-3 font-medium">Rate</th>
                <th className="text-center p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono text-xs">{inv.id}</td>
                  <td className="p-3">{inv.buyer_name}</td>
                  <td className="p-3 text-right font-medium">{formatINR(inv.amount_inr)}</td>
                  <td className="p-3 text-center"><RiskBadge risk={inv.risk_score} /></td>
                  <td className="p-3 text-center text-primary font-medium">{inv.interest_rate}%</td>
                  <td className="p-3 text-center"><StatusBadge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
