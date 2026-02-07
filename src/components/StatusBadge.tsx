import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  status: "uploaded" | "tokenized" | "funded" | "paid";
}

export function StatusBadge({ status }: Props) {
  return (
    <Badge
      className={cn(
        "text-xs font-medium capitalize border-0",
        status === "uploaded" && "bg-muted text-muted-foreground",
        status === "tokenized" && "bg-primary/15 text-primary",
        status === "funded" && "bg-accent/15 text-accent",
        status === "paid" && "bg-risk-low/15 text-risk-low"
      )}
    >
      {status}
    </Badge>
  );
}
