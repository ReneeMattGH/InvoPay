import { server } from "./stellar";

export interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  dueDate: string;
  daysOverdue: number;
}

export const checkOverdueInvoices = async (invoices: { id: string; invoice_number?: string; due_date: string; status: string }[]): Promise<OverdueInvoice[]> => {
  try {
    // 1. Get latest ledger close time to be accurate with blockchain time
    const latestLedger = await server.ledgers().order("desc").limit(1).call();
    const ledgerTime = new Date(latestLedger.records[0].closed_at);
    
    const overdue: OverdueInvoice[] = [];

    invoices.forEach(inv => {
      if (inv.status === "paid" || inv.status === "repaid") return;
      
      const dueDate = new Date(inv.due_date);
      // Compare dates (ignoring time for simplicity, or use ledgerTime)
      if (ledgerTime > dueDate) {
        const diffTime = Math.abs(ledgerTime.getTime() - dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        overdue.push({
          id: inv.id,
          invoiceNumber: inv.invoice_number || inv.id,
          dueDate: inv.due_date,
          daysOverdue: diffDays
        });
      }
    });

    return overdue;
  } catch (error) {
    console.error("Error checking overdue invoices:", error);
    return [];
  }
};
