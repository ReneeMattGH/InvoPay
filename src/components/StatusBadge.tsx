import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  status: "uploaded" | "verified" | "tokenized" | "funded" | "repaid" | "paid";
}

export function StatusBadge({ status }: Props) {
  return (
    <Badge
      className={cn(
        "text-xs font-medium capitalize border-0 shadow-sm",
        status === "uploaded" && "bg-slate-500/10 text-slate-500",
        status === "verified" && "bg-blue-500/10 text-blue-600",
        status === "tokenized" && "bg-indigo-500/10 text-indigo-600",
        status === "funded" && "bg-emerald-500/10 text-emerald-600",
        status === "repaid" && "bg-green-500/10 text-green-600",
        status === "paid" && "bg-green-500/10 text-green-600"
      )}
    >
      {status}
    </Badge>
  );
}
