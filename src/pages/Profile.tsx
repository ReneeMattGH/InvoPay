import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Shield, Wallet } from "lucide-react";

export default function Profile() {
  const { user, userRole } = useAuth();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">Profile</h1>

      <div className="glass-card rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full gradient-stellar flex items-center justify-center">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-semibold text-lg">{user?.email}</p>
            <p className="text-sm text-muted-foreground capitalize">{userRole} Account</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <Label className="flex items-center gap-2"><Mail className="h-3 w-3" /> Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div>
            <Label className="flex items-center gap-2"><Shield className="h-3 w-3" /> Role</Label>
            <Input value={userRole === "business" ? "Business Owner (SME)" : "Investor"} disabled />
          </div>
          <div>
            <Label className="flex items-center gap-2"><Wallet className="h-3 w-3" /> Stellar Wallet</Label>
            <Input value="Not connected" disabled />
          </div>
        </div>

        <Button variant="outline" className="w-full" disabled>
          Edit Profile (Coming Soon)
        </Button>
      </div>

      <div className="glass-card rounded-xl p-5 text-xs text-muted-foreground">
        <p className="font-medium mb-1">🔐 Security</p>
        <p>Your account is secured via Lovable Cloud authentication. Invoice data is stored encrypted and tokenization happens on the Stellar Soroban network.</p>
      </div>
    </div>
  );
}
