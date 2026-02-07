import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon, className }: Props) {
  return (
    <div className={cn("glass-card rounded-2xl p-5 animate-slide-up hover-glow", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-display font-bold mt-1 text-glow">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="h-12 w-12 rounded-xl bg-stellar-purple/20 flex items-center justify-center text-stellar-pink shadow-[0_0_15px_rgba(255,110,219,0.3)]">
          {icon}
        </div>
      </div>
    </div>
  );
}
