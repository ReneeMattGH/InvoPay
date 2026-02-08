import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RiskBadge } from "@/components/RiskBadge";
import { formatINR } from "@/lib/utils";
import { Invoice } from "@/types/app-types";
import { calculateRealRiskScore } from "@/lib/risk-scoring";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileText, Zap, CheckCircle2, Info, ScanText, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { deployLendingPool } from "@/lib/soroban";
import { performOCR, calculateFileHash, ExtractedData } from "@/lib/ocr";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { parseISO, differenceInDays, isValid } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export default function UploadInvoice() {
  const { user } = useAuth();
  const { publicKey } = useWallet();
  const [step, setStep] = useState<"upload" | "tokenize" | "done">("upload");
  const [form, setForm] = useState({
    buyerName: "",
    description: "",
    amountInr: "",
    dueDate: "",
    invoiceNumber: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [risk, setRisk] = useState<"low" | "medium" | "high">("medium");
  const [rate, setRate] = useState(10);
  const [riskReason, setRiskReason] = useState("");
  const [loading, setLoading] = useState(false);

  // OCR State
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<ExtractedData | null>(null);
  const [ocrStatus, setOcrStatus] = useState<"pending" | "scanning" | "review" | "verified" | "failed">("pending");
  const [fileHash, setFileHash] = useState("");
  const [showOcrDialog, setShowOcrDialog] = useState(false);
  const [manualOverrideReason, setManualOverrideReason] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setOcrStatus("scanning");
    setIsScanning(true);
    toast.info("Scanning invoice for verification...", { duration: 5000 });

    try {
      // 1. Calculate Hash
      const hash = await calculateFileHash(selectedFile);
      setFileHash(hash);

      // 2. Perform OCR
      const result = await performOCR(selectedFile);
      setOcrResult(result);
      setOcrStatus("review");
      setShowOcrDialog(true);
      
      // Auto-fill if form is empty
      if (!form.amountInr && result.fields.amount) {
        setForm(prev => ({ ...prev, amountInr: result.fields.amount!.toString() }));
      }
      if (!form.dueDate && result.fields.date) {
        // Try to standardize date if possible, otherwise just set it
        // Basic check for YYYY-MM-DD
        if (result.fields.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
           setForm(prev => ({ ...prev, dueDate: result.fields.date! }));
        }
      }
      if (!form.buyerName && result.fields.buyerName) {
        setForm(prev => ({ ...prev, buyerName: result.fields.buyerName! }));
      }
      if (!form.invoiceNumber && result.fields.invoiceNumber) {
        setForm(prev => ({ ...prev, invoiceNumber: result.fields.invoiceNumber! }));
      }

      setIsScanning(false);
    } catch (error) {
      console.error("OCR Failed", error);
      setOcrStatus("failed");
      setIsScanning(false);
      toast.error("OCR could not read file clearly. Manual verification required.");
    }
  };

  const handleOcrConfirm = (override: boolean) => {
    if (override && !manualOverrideReason) {
      toast.error("Please provide a reason for manual override");
      return;
    }
    setOcrStatus("verified");
    setShowOcrDialog(false);
    toast.success("Invoice verification complete ✓");
  };

  const useOcrValues = () => {
    if (!ocrResult) return;
    setForm(prev => ({
      ...prev,
      amountInr: ocrResult.fields.amount?.toString() || prev.amountInr,
      // Only set date if it looks valid for the input
      dueDate: ocrResult.fields.date?.match(/^\d{4}-\d{2}-\d{2}$/) ? ocrResult.fields.date : prev.dueDate,
      buyerName: ocrResult.fields.buyerName || prev.buyerName,
      invoiceNumber: ocrResult.fields.invoiceNumber || prev.invoiceNumber
    }));
    toast.success("Form updated with OCR values");
  };

  const isMatch = (val1: string | number, val2: string | number, type: 'amount' | 'date' | 'text') => {
    if (!val1 || !val2) return false;
    const v1 = String(val1).toLowerCase().trim();
    const v2 = String(val2).toLowerCase().trim();
    
    if (type === 'amount') {
      const n1 = parseFloat(v1.replace(/,/g, ''));
      const n2 = parseFloat(v2.replace(/,/g, ''));
      // 4% tolerance
      return Math.abs(n1 - n2) / n1 < 0.04; 
    }
    if (type === 'text') {
      return v1.includes(v2) || v2.includes(v1);
    }
    if (type === 'date') {
      try {
        const d1 = parseISO(v1);
        const d2 = parseISO(v2);
        if (!isValid(d1) || !isValid(d2)) return v1 === v2; // Fallback to string match
        return Math.abs(differenceInDays(d1, d2)) <= 3;
      } catch (e) {
        return v1 === v2;
      }
    }
    return v1 === v2; 
  };

  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to upload invoices");
      return;
    }

    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (ocrStatus !== "verified") {
      toast.error("Please verify the invoice file content first");
      setShowOcrDialog(true);
      return;
    }

    if (Number(form.amountInr) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (form.dueDate < today) {
      toast.error("Due date cannot be in the past");
      return;
    }

    setLoading(true);
    try {
      const { score, recommendedRate, reason } = await calculateRealRiskScore(
        Number(form.amountInr), 
        form.dueDate,
        publicKey || undefined,
        ocrResult?.confidence,
        manualOverrideReason ? 'manual_override' : 'verified'
      );
      
      const calculatedTokenValue = Math.round(Number(form.amountInr) / 83.5);

      setRisk(score);
      setRate(recommendedRate);
      setRiskReason(reason);
      setTokenValue(calculatedTokenValue);

      // Save as "uploaded" to match existing DB constraint
      const invoiceData = {
        user_id: user.id,
        invoice_number: form.invoiceNumber || "2026-" + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
        buyer_name: form.buyerName,
        description: form.description + (manualOverrideReason ? ` | Manual Override: ${manualOverrideReason}` : ""),
        amount_inr: Number(form.amountInr),
        due_date: form.dueDate,
        status: "uploaded", // Changed from "verified" to match DB constraint
        risk_score: score,
        interest_rate: recommendedRate,
        token_value: calculatedTokenValue,
        // Removed fields that don't exist in the current DB schema to prevent errors
        // ocr_extracted, ocr_status, file_hash, justification
        // We store critical OCR info in description if needed
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();
      
      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      if (data) setInvoiceId(data.id);

      setStep("tokenize");
      toast.success("Invoice uploaded and analyzed! Ready to tokenize.");
    } catch (error: any) {
      console.error("Detailed error:", error);
      toast.error(error.message || "Error analyzing/saving invoice. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const [txHash, setTxHash] = useState("");
  const [tokenValue, setTokenValue] = useState(0);

  const handleTokenize = async () => {
    if (!user) {
      toast.error("You must be logged in to tokenize invoices");
      return;
    }
    if (!publicKey) {
      toast.error("Connect wallet first");
      return;
    }

    setLoading(true);
    
    // Deploy Soroban Contract for this invoice
    const contractId = await deployLendingPool(publicKey);
    
    if (!contractId) {
      setLoading(false);
      return; // Error already toasted in deployLendingPool
    }

    setTxHash(contractId);

    try {
      if (invoiceId) {
        // Update existing invoice
        const { error } = await supabase
          .from('invoices')
          .update({
            status: "tokenized",
            stellar_tx_hash: contractId
            // Removed contract_id as it doesn't exist in DB schema, using stellar_tx_hash
          })
          .eq('id', invoiceId);

        if (error) throw error;
      } else {
        // Fallback: Create new invoice if not already saved
        const newInvoice = {
          user_id: user.id,
          invoice_number: form.invoiceNumber || "2026-" + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
          buyer_name: form.buyerName,
          description: form.description,
          amount_inr: Number(form.amountInr),
          due_date: form.dueDate,
          status: "tokenized",
          risk_score: risk,
          interest_rate: rate,
          token_value: tokenValue,
          stellar_tx_hash: contractId,
          // Removed fields missing from schema: contract_id, ocr_extracted, ocr_status, file_hash, justification
        };

        const { error } = await supabase.from('invoices').insert(newInvoice);
        if (error) throw error;
      }

      setStep("done");
      toast.success("Invoice tokenized on Soroban! 🚀");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <div className="h-16 w-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <h2 className="font-display text-2xl font-bold">Invoice Tokenized!</h2>
        <div className="glass-card rounded-xl p-5 text-left space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Buyer</span><span className="font-medium">{form.buyerName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">{formatINR(Number(form.amountInr))}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Token Value</span><span className="font-medium text-primary">{tokenValue} USDC</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Interest Rate</span><span className="font-medium text-primary">{rate}%</span></div>
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Risk</span><RiskBadge risk={risk} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">OCR Status</span>
             <Badge variant={manualOverrideReason ? "secondary" : "default"} className="text-[10px] uppercase">
                {manualOverrideReason ? "Manual Override" : "Verified"}
             </Badge>
          </div>
          <div className="flex justify-between"><span className="text-muted-foreground">Soroban TX</span><span className="font-mono text-xs text-accent">{txHash}</span></div>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => { 
            setStep("upload"); 
            setForm({ buyerName: "", description: "", amountInr: "", dueDate: "", invoiceNumber: "" }); 
            setFile(null); 
            setOcrStatus("pending");
            setOcrResult(null);
            setManualOverrideReason("");
          }} variant="outline">
            Upload Another Invoice
          </Button>
          <Button asChild>
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  if (step === "tokenize") {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h2 className="font-display text-2xl font-bold">Tokenize Invoice</h2>
        <p className="text-muted-foreground text-sm">Review the risk assessment and tokenize this invoice on Soroban.</p>

        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Invoice Amount</span>
            <span className="font-medium">{formatINR(Number(form.amountInr))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Token Value</span>
            <span className="font-medium text-primary">{tokenValue} USDC</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              Risk Score
              {riskReason && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground/70" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px] text-xs">{riskReason}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </span>
            <RiskBadge risk={risk} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dynamic Interest Rate</span>
            <span className="font-medium text-primary">{rate}% APR</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Due Date</span>
            <span>{form.dueDate}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-muted-foreground">OCR Verification</span>
            <span className="flex items-center text-green-600 gap-1 text-xs font-medium">
               <Check className="h-3 w-3" /> Verified ({Math.round(ocrResult?.confidence || 0)}% conf.)
            </span>
          </div>
        </div>

        <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          <p className="font-medium mb-1">⚡ Soroban Smart Contract</p>
          <p>This will deploy a Soroban token contract representing fractional ownership of this invoice on the Stellar network.</p>
        </div>

        <Button
          className="w-full"
          onClick={handleTokenize}
          disabled={loading}
        >
          <Zap className="mr-2 h-4 w-4" />
          {loading ? "Deploying to Soroban..." : "Tokenize on Stellar"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Upload Invoice</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your invoice to tokenize it on the Stellar blockchain via Soroban.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-5">
        <div>
          <Label>Buyer Name</Label>
          <Input
            placeholder="e.g. Tata Consultancy Services"
            value={form.buyerName}
            onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
            required
          />
        </div>
        
        <div>
           <Label>Invoice Number</Label>
           <Input
             placeholder="e.g. INV-2024-001"
             value={form.invoiceNumber}
             onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
           />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            placeholder="Brief description of the invoice"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Amount (₹ INR)</Label>
            <Input
              type="number"
              placeholder="500000"
              value={form.amountInr}
              onChange={(e) => setForm({ ...form, amountInr: e.target.value })}
              required
              min={1}
            />
          </div>
          <div>
            <Label>Due Date</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <Label>Invoice File (PDF/Image)</Label>
          <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              id="invoice-file"
              onChange={handleFileChange}
            />
            <label htmlFor="invoice-file" className="cursor-pointer">
              {file ? (
                <div className="flex flex-col items-center justify-center gap-2 text-sm">
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="font-medium">{file.name}</span>
                  {ocrStatus === "scanning" && <span className="text-xs text-muted-foreground animate-pulse">Scanning invoice...</span>}
                  {ocrStatus === "verified" && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> OCR Verified</span>}
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload PDF or image</p>
                  <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
                </div>
              )}
            </label>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading || isScanning}>
          <Upload className="mr-2 h-4 w-4" />
          {loading ? "Analyzing Risk..." : "Upload & Analyze"}
        </Button>
      </form>

      {/* OCR Verification Dialog */}
      <Dialog open={showOcrDialog} onOpenChange={setShowOcrDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanText className="h-5 w-5" />
              OCR Verification
            </DialogTitle>
            <DialogDescription>
              We analyzed your invoice. Please verify the extracted details match your entry.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
             <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Your Entry</h4>
                <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                   <div>
                     <span className="text-xs text-muted-foreground block">Amount</span>
                     <span className="font-medium">{form.amountInr ? formatINR(Number(form.amountInr)) : "Not entered"}</span>
                   </div>
                   <div>
                     <span className="text-xs text-muted-foreground block">Due Date</span>
                     <span className="font-medium">{form.dueDate || "Not entered"}</span>
                   </div>
                   <div>
                     <span className="text-xs text-muted-foreground block">Buyer</span>
                     <span className="font-medium">{form.buyerName || "Not entered"}</span>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Detected by OCR</h4>
                   <span className="text-[10px] text-muted-foreground">Conf: {Math.round(ocrResult?.confidence || 0)}%</span>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                   <div>
                     <span className="text-xs text-muted-foreground block">Amount</span>
                     <div className={`font-medium flex items-center gap-2 ${isMatch(form.amountInr, ocrResult?.fields.amount || 0, 'amount') ? 'text-green-600' : 'text-amber-600'}`}>
                        {ocrResult?.fields.amount ? formatINR(ocrResult.fields.amount) : "Not detected"}
                        {isMatch(form.amountInr, ocrResult?.fields.amount || 0, 'amount') && <CheckCircle2 className="h-3 w-3" />}
                     </div>
                   </div>
                   <div>
                     <span className="text-xs text-muted-foreground block">Due Date</span>
                     <div className={`font-medium flex items-center gap-2 ${isMatch(form.dueDate, ocrResult?.fields.date || "", 'date') ? 'text-green-600' : 'text-amber-600'}`}>
                        {ocrResult?.fields.date || "Not detected"}
                     </div>
                   </div>
                   <div>
                     <span className="text-xs text-muted-foreground block">Buyer</span>
                     <div className={`font-medium flex items-center gap-2 ${isMatch(form.buyerName, ocrResult?.fields.buyerName || "", 'text') ? 'text-green-600' : 'text-amber-600'}`}>
                        {ocrResult?.fields.buyerName || "Not detected"}
                     </div>
                   </div>
                </div>
             </div>
          </div>

          {!isMatch(form.amountInr, ocrResult?.fields.amount || 0, 'amount') && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
               <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium">Mismatch Detected</p>
                 <p className="text-xs opacity-90 mb-2">The extracted amount differs from your entry. If the OCR missed it, please explain below.</p>
                 <Textarea 
                    placeholder="Reason for manual override (e.g. 'OCR read subtotal instead of grand total')" 
                    className="bg-background/50 h-20 text-xs"
                    value={manualOverrideReason}
                    onChange={(e) => setManualOverrideReason(e.target.value)}
                 />
               </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
             <Button variant="outline" onClick={useOcrValues} className="mr-auto">
               Use OCR Values
             </Button>
             <Button variant="ghost" onClick={() => { setFile(null); setShowOcrDialog(false); }}>
               Re-upload
             </Button>
             <Button 
                onClick={() => handleOcrConfirm(!isMatch(form.amountInr, ocrResult?.fields.amount || 0, 'amount'))}
                disabled={!isMatch(form.amountInr, ocrResult?.fields.amount || 0, 'amount') && manualOverrideReason.length < 5}
             >
                Confirm & Proceed
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
