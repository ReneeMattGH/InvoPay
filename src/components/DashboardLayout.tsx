import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { WalletConnectDialog } from "@/components/WalletConnectDialog";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [walletOpen, setWalletOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm">
            <SidebarTrigger />
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setWalletOpen(true)}
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Connect Stellar Wallet</span>
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <WalletConnectDialog open={walletOpen} onOpenChange={setWalletOpen} />
    </SidebarProvider>
  );
}
