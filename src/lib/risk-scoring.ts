import { server } from "./stellar";

export interface RiskProfile {
  score: "low" | "medium" | "high";
  reason: string;
  recommendedRate: number;
}

export const fetchAccountActivity = async (publicKey: string) => {
  try {
    // Fetch recent payments for the account
    const payments = await server.payments().forAccount(publicKey).limit(50).order("desc").call();
    
    // Fetch account details (balances, age)
    const account = await server.loadAccount(publicKey);
    
    return {
      payments: payments.records,
      account
    };
  } catch (error) {
    console.error("Error fetching account activity:", error);
    return null;
  }
};

export const calculateRealRiskScore = async (
  amount: number, 
  dueDateStr: string,
  userPublicKey?: string,
  ocrConfidence?: number,
  ocrStatus?: string
): Promise<RiskProfile> => {
  const dueDate = new Date(dueDateStr);
  const now = new Date();
  const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Default baseline
  let score: "low" | "medium" | "high" = "medium";
  let reason = "Standard risk profile based on invoice amount and duration.";
  let rate = 10;

  // 1. Basic Invoice Logic
  if (amount < 500000 && daysUntilDue < 60) {
    score = "low";
    rate = 8.5;
  } else if (amount > 1000000 || daysUntilDue > 120) {
    score = "high";
    rate = 14.5;
  }

  // 2. Advanced Horizon Data (if user connected)
  if (userPublicKey) {
    const activity = await fetchAccountActivity(userPublicKey);
    
    if (activity) {
      const txCount = activity.payments.length;
      // const balance = activity.account.balances.find(b => b.asset_type === 'native')?.balance || "0";
      
      // Heuristic: High activity = Active business = Lower Risk
      if (txCount > 20) {
        if (score === "high") score = "medium";
        else if (score === "medium") score = "low";
        
        rate -= 1.5; // Discount for active history
        reason = `High on-chain activity (${txCount}+ recent txs) indicates healthy business flow.`;
      } else if (txCount < 5) {
         // Low activity might indicate new or dormant account
         if (score === "low") score = "medium";
         rate += 1.0;
         reason = "Low on-chain activity detected. Standard rates apply.";
      }
    }
  }

  // 3. OCR Verification Bonus
  if (ocrStatus === 'verified' && ocrConfidence && ocrConfidence > 85) {
    // High confidence OCR match lowers risk
    
    if (score === "high") score = "medium";
    else if (score === "medium") score = "low";
    
    rate -= 1.0;
    reason += " + OCR Verified with high confidence.";
  } else if (ocrStatus === 'manual_override') {
    // Manual override might slightly increase risk or keep it neutral, but definitely flags it
    // We won't penalize too much, but won't give the bonus
    reason += " (Manual verification).";
  }

  // Cap rates
  if (rate < 8) rate = 8;
  if (rate > 18) rate = 18;

  return {
    score,
    reason,
    recommendedRate: Math.round(rate * 100) / 100
  };
};
