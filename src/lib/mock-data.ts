export const mockInvoices = [
  {
    id: "INV-2026-001",
    buyer_name: "Tata Consultancy Services",
    description: "IT Services - Q1 2026",
    amount_inr: 450000,
    due_date: "2026-04-15",
    status: "tokenized" as const,
    risk_score: "low" as const,
    interest_rate: 8.5,
    token_value: 5400,
    created_at: "2026-01-10",
  },
  {
    id: "INV-2026-002",
    buyer_name: "Infosys Limited",
    description: "Software Development Contract",
    amount_inr: 780000,
    due_date: "2026-03-30",
    status: "tokenized" as const,
    risk_score: "low" as const,
    interest_rate: 9.0,
    token_value: 9360,
    created_at: "2026-01-15",
  },
  {
    id: "INV-2026-003",
    buyer_name: "Reliance Industries",
    description: "Supply Chain Management",
    amount_inr: 320000,
    due_date: "2026-05-20",
    status: "funded" as const,
    risk_score: "medium" as const,
    interest_rate: 12.0,
    token_value: 3840,
    created_at: "2026-01-20",
  },
  {
    id: "INV-2026-004",
    buyer_name: "Wipro Technologies",
    description: "Cloud Infrastructure Setup",
    amount_inr: 1250000,
    due_date: "2026-06-10",
    status: "uploaded" as const,
    risk_score: "high" as const,
    interest_rate: 15.0,
    token_value: null,
    created_at: "2026-02-01",
  },
];

export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export const formatUSDC = (amount: number) =>
  `${amount.toLocaleString("en-US")} USDC`;

export const calculateRiskScore = (amount: number, dueDateStr: string): "low" | "medium" | "high" => {
  const dueDate = new Date(dueDateStr);
  const now = new Date();
  const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (amount < 500000 && daysUntilDue < 60) return "low";
  if (amount > 1000000 || daysUntilDue > 120) return "high";
  return "medium";
};

export const calculateInterestRate = (risk: "low" | "medium" | "high"): number => {
  const rates = { low: 8 + Math.random() * 2, medium: 11 + Math.random() * 2, high: 13 + Math.random() * 2 };
  return Math.round(rates[risk] * 100) / 100;
};
