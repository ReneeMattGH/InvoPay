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

      <div className="glass-card rounded-xl p-8 space-y-6 hover-glow border border-border">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="h-10 w-10" />
          </div>
          <div>
            <p className="font-display font-bold text-xl text-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
              {userRole} Account
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            </p>
          </div>
        </div>

        <div className="space-y-5 pt-6 border-t border-border">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-primary"><Mail className="h-4 w-4" /> Email</Label>
            <Input value={user?.email ?? ""} disabled className="bg-muted/30 border-border text-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-primary"><Shield className="h-4 w-4" /> Role</Label>
            <Input value={userRole === "business" ? "Business Owner (SME)" : "Investor"} disabled className="bg-muted/30 border-border text-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-primary"><Wallet className="h-4 w-4" /> Stellar Wallet</Label>
            <Input value="Not connected" disabled className="bg-muted/30 border-border text-foreground" />
          </div>
        </div>

        <Button variant="outline" className="w-full h-12" disabled>
          Edit Profile (Coming Soon)
        </Button>
      </div>

      <div className="glass-card rounded-xl p-5 text-xs text-muted-foreground border-l-4 border-emerald-500 bg-emerald-500/5">
        <p className="font-bold mb-1 text-emerald-600 text-sm">🔐 Security</p>
        <p>Your account is secured via standard encryption. Invoice data is stored encrypted and tokenization happens on the Stellar Soroban network.</p>
      </div>
    </div>
  );
}
