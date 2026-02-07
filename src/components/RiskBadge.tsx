import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  risk: "low" | "medium" | "high";
  className?: string;
}

export function RiskBadge({ risk, className }: Props) {
  return (
    <Badge
      className={cn(
        "text-xs font-medium capitalize border-0",
        risk === "low" && "bg-risk-low/15 text-risk-low",
        risk === "medium" && "bg-risk-medium/15 text-risk-medium",
        risk === "high" && "bg-risk-high/15 text-risk-high",
        className
      )}
    >
      {risk} risk
    </Badge>
  );
}
