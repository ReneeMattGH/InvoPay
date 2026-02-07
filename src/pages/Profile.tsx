import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Shield, Wallet } from "lucide-react";

export default function Profile() {
  const { user, userRole } = useAuth();

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-slide-up">
      <h1 className="font-display text-3xl font-bold gradient-text w-fit">Profile</h1>

      <div className="glass-card rounded-2xl p-8 space-y-6 hover-glow">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-full gradient-stellar flex items-center justify-center shadow-[0_0_20px_rgba(255,110,219,0.4)]">
            <User className="h-10 w-10 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-xl text-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
              {userRole} Account
              <span className="inline-block w-2 h-2 rounded-full bg-stellar-teal shadow-[0_0_10px_rgba(0,255,195,0.8)]"></span>
            </p>
          </div>
        </div>

        <div className="space-y-5 pt-6 border-t border-white/10">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-stellar-purple"><Mail className="h-4 w-4" /> Email</Label>
            <Input value={user?.email ?? ""} disabled className="bg-white/5 border-white/10 text-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-stellar-purple"><Shield className="h-4 w-4" /> Role</Label>
            <Input value={userRole === "business" ? "Business Owner (SME)" : "Investor"} disabled className="bg-white/5 border-white/10 text-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-stellar-purple"><Wallet className="h-4 w-4" /> Stellar Wallet</Label>
            <Input value="Not connected" disabled className="bg-white/5 border-white/10 text-foreground" />
          </div>
        </div>

        <Button variant="neon" className="w-full h-12" disabled>
          Edit Profile (Coming Soon)
        </Button>
      </div>

      <div className="glass-card rounded-xl p-5 text-xs text-muted-foreground border-l-4 border-stellar-teal bg-stellar-teal/5">
        <p className="font-bold mb-1 text-stellar-teal text-sm">🔐 Security</p>
        <p>Your account is secured via Lovable Cloud authentication. Invoice data is stored encrypted and tokenization happens on the Stellar Soroban network.</p>
      </div>
    </div>
  );
}
