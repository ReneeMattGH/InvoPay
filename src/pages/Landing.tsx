import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, TrendingUp, Wallet } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-xl font-bold">InvoPay</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/auth?tab=signup">
            <Button size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-28 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-slide-up">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Powered by Stellar & Soroban
        </div>
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold max-w-4xl mx-auto leading-tight animate-slide-up">
          Unlock <span className="text-primary">Instant Liquidity</span> from Your Invoices
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 animate-slide-up">
          Tokenize unpaid invoices on the Stellar blockchain. Get funded in minutes, not months. Built for Indian SMEs on Soroban smart contracts.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-slide-up">
          <Link to="/auth?tab=signup">
            <Button size="lg" className="px-8">
              Start as Business
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth?tab=signup&role=investor">
            <Button size="lg" variant="outline" className="px-8">
              Invest in Pools
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-28">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: "Instant Tokenization", desc: "Upload invoices, tokenize them into fractional Soroban tokens in seconds." },
            { icon: Shield, title: "Smart Risk Scoring", desc: "Dynamic risk assessment with automated interest rates from 8-15% APR." },
            { icon: TrendingUp, title: "DeFi Lending Pools", desc: "Investors earn yields by funding tokenized invoices via Stellar DEX integration." },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-xl p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 InvoPay. Built on Stellar &amp; Soroban. Made in India 🇮🇳</p>
      </footer>
    </div>
  );
}
