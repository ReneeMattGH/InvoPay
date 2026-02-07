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
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Background particles/glow could go here */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-stellar-purple/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-stellar-pink/10 rounded-full blur-[100px]" />
          </div>

          <header className="h-16 flex items-center justify-between border-b border-white/5 px-6 bg-background/40 backdrop-blur-md sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Button
              variant="neon"
              size="sm"
              className="gap-2"
              onClick={() => setWalletOpen(true)}
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Connect Stellar Wallet</span>
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto z-0">
            {children}
          </main>
        </div>
      </div>
      <WalletConnectDialog open={walletOpen} onOpenChange={setWalletOpen} />
    </SidebarProvider>
  );
}
