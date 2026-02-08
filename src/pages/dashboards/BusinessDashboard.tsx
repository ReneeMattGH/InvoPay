import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useInvoices } from "@/hooks/useRealtimeData";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { TradeDialog } from "@/components/TradeDialog";
import { NFTGallery } from "@/components/NFTGallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, FileText, DollarSign, TrendingUp, Info, Check, AlertTriangle, Rocket } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Invoice } from "@/types/app-types";
import { checkOverdueInvoices } from "@/lib/early-warning";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { fundLoan, repayPool, deployLendingPool, CURRENT_POOL_CONTRACT_ID } from "@/lib/soroban";
import { supabase } from "@/integrations/supabase/client";

export function BusinessDashboard() {
  const { user } = useAuth();
  const { publicKey } = useWallet();
  const { invoices, loading } = useInvoices();
  const [filter, setFilter] = useState("");

  // Calculate stats
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((acc, inv) => acc + (inv.amount_inr || 0), 0);
  const outstandingAmount = invoices
    .filter((inv) => inv.status !== "repaid")
    .reduce((acc, inv) => acc + (inv.amount_inr || 0), 0);

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) =>
    inv.buyer_name.toLowerCase().includes(filter.toLowerCase()) ||
    inv.id.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    // Check for overdue invoices on mount
    checkOverdueInvoices(invoices).then((overdue) => {
      if (overdue.length > 0) {
        toast.warning(`${overdue.length} invoices are overdue!`, {
          description: "Please check your repayment schedule.",
        });
      }
    });
  }, [invoices]);

  const handleReleaseFunds = async (invoice: Invoice) => {
    if (!publicKey) {
      toast.error("Connect wallet first");
      return;
    }
    try {
      const contractId = invoice.contract_id || CURRENT_POOL_CONTRACT_ID;
      const result = await fundLoan(contractId, publicKey);
      if (result?.success) {
        const { error } = await supabase
          .from("invoices")
          .update({ status: "funded" })
          .eq("id", invoice.id);
          
        if (error) throw error;
        toast.success("Funds released successfully!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to release funds");
    }
  };

  const handleRepayLoan = async (invoice: Invoice) => {
    if (!publicKey) {
      toast.error("Connect wallet first");
      return;
    }
    try {
      // Repay full amount (Principal + Interest would be calculated in real contract)
      const contractId = invoice.contract_id || CURRENT_POOL_CONTRACT_ID;
      const result = await repayPool(contractId, publicKey, invoice.amount_inr); 
      if (result?.success) {
        const { error } = await supabase
          .from("invoices")
          .update({ status: "repaid" })
          .eq("id", invoice.id);

        if (error) throw error;
        toast.success("Loan repaid successfully!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to repay loan");
    }
  };

  const handleCreatePool = async (invoice: Invoice) => {
    if (!publicKey) {
      toast.error("Connect wallet first");
      return;
    }
    const toastId = toast.loading("Deploying Soroban Contract...");
    try {
      const contractId = await deployLendingPool(publicKey);
      if (contractId) {
        const { error } = await supabase
          .from("invoices")
          .update({ 
            status: "tokenized",
            stellar_tx_hash: contractId
            // contract_id: contractId // Removed to prevent schema error
          })
          .eq("id", invoice.id);

        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }
        toast.success("Pool Created! Invoice Tokenized.", { id: toastId });
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to create pool", { id: toastId });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Business Dashboard</h1>
          <p className="text-muted-foreground">Manage your invoices and liquidity.</p>
        </div>
        <Button asChild size="lg" className="gap-2 shadow-lg hover:shadow-primary/20 transition-all">
          <Link to="/upload">
            <Plus className="h-4 w-4" />
            Upload New Invoice
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Invoices"
          value={totalInvoices.toString()}
          icon={<FileText className="h-5 w-5" />}
          subtitle="All time uploaded"
        />
        <StatsCard
          title="Outstanding Amount"
          value={formatINR(outstandingAmount)}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle="Pending repayment"
        />
        <StatsCard
          title="Liquidity Received"
          value={formatINR(totalAmount * 0.8)} // Mock 80% LTV
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle="+12% this month"
        />
      </div>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invoices">My Invoices</TabsTrigger>
          <TabsTrigger value="nfts">My NFT Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Invoices</CardTitle>
                  <CardDescription>A list of your recent invoices and their status.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Filter by buyer..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="max-w-sm h-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.buyer_name}</TableCell>
                      <TableCell>{formatINR(invoice.amount_inr)}</TableCell>
                      <TableCell>{invoice.due_date}</TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status as "repaid" | "funded" | "tokenized" | "verified" | "uploaded" | "paid"} />
                      </TableCell>
                      <TableCell>
                        {invoice.ocr_status === 'verified' ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 gap-1 font-normal">
                            <Check className="h-3 w-3" /> OCR Verified
                          </Badge>
                        ) : invoice.ocr_status === 'manual_override' ? (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 gap-1 font-normal">
                            <AlertTriangle className="h-3 w-3" /> Manual
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground gap-1 font-normal opacity-50">
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(invoice.id)}>
                              Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {invoice.status === "verified" && (
                              <DropdownMenuItem onClick={() => handleCreatePool(invoice)}>
                                <Rocket className="mr-2 h-4 w-4" />
                                Create Pool (Tokenize)
                              </DropdownMenuItem>
                            )}
                            {invoice.status === "tokenized" && (
                              <>
                                <DropdownMenuItem onClick={() => handleReleaseFunds(invoice)}>
                                  Release Funds (Escrow)
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <span className="cursor-pointer flex items-center">
                                    <TradeDialog 
                                      assetCode={`INV${invoice.invoice_number?.slice(-4) || '0000'}`} 
                                      assetIssuer={publicKey || ""}
                                    />
                                  </span>
                                </DropdownMenuItem>
                              </>
                            )}
                            {invoice.status === "funded" && (
                              <DropdownMenuItem onClick={() => handleRepayLoan(invoice)}>
                                Repay Loan
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => window.open(`https://stellar.expert/explorer/testnet/account/${publicKey}`, '_blank')}>
                              View on Explorer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfts">
          <NFTGallery items={filteredInvoices.filter(i => i.status === 'tokenized' || i.status === 'funded')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
