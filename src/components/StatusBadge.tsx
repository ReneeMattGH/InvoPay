import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  status: "uploaded" | "tokenized" | "funded" | "paid";
}

export function StatusBadge({ status }: Props) {
  return (
    <Badge
      className={cn(
        "text-xs font-medium capitalize border-0 shadow-sm",
        status === "uploaded" && "bg-muted text-muted-foreground",
        status === "tokenized" && "bg-stellar-purple/20 text-stellar-purple",
        status === "funded" && "bg-stellar-pink/20 text-stellar-pink",
        status === "paid" && "bg-stellar-teal/20 text-stellar-teal"
      )}
    >
      {status}
    </Badge>
  );
}
