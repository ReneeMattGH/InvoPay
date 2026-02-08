import { Invoice } from "@/types/app-types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatUSDC } from "@/lib/utils";
import { Shield, FileText, Hash, Calendar } from "lucide-react";

interface NFTGalleryProps {
  items: Invoice[];
  title?: string;
}

export function NFTGallery({ items, title = "My NFT Assets" }: NFTGalleryProps) {
  if (items.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No NFT assets found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-display font-bold">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-primary/20 bg-gradient-to-br from-background to-muted/50">
            <div className="absolute top-0 right-0 p-2">
              <Badge variant={item.status === "tokenized" ? "default" : "secondary"} className="uppercase text-[10px]">
                {item.status}
              </Badge>
            </div>
            
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Hash className="h-4 w-4" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">#{item.invoice_number || item.id}</span>
              </div>
              <CardTitle className="text-lg font-bold truncate" title={item.buyer_name}>
                {item.buyer_name}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-background/50 rounded-md border border-border/50">
                <span className="text-muted-foreground">Value</span>
                <span className="font-bold font-mono">{formatINR(item.amount_inr)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Due Date
                  </span>
                  <span className="font-medium">{item.due_date}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Risk
                  </span>
                  <span className={`font-medium capitalize ${
                    item.risk_score === 'low' ? 'text-green-600' : 
                    item.risk_score === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {item.risk_score || 'N/A'}
                  </span>
                </div>
              </div>

              {item.token_value && (
                <div className="mt-2 pt-2 border-t border-dashed">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Tokenized Value</span>
                    <span className="font-bold text-primary">{formatUSDC(item.token_value)}</span>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="pt-0 pb-4 text-xs text-muted-foreground">
              {item.stellar_tx_hash ? (
                 <a 
                   href={item.stellar_tx_hash.startsWith('C') 
                     ? `https://stellar.expert/explorer/testnet/contract/${item.stellar_tx_hash}`
                     : `https://stellar.expert/explorer/testnet/tx/${item.stellar_tx_hash}`
                   } 
                   target="_blank" 
                   rel="noreferrer"
                   className="hover:text-primary flex items-center gap-1 transition-colors"
                 >
                   {item.stellar_tx_hash.startsWith('C') ? 'View Contract' : 'View On-Chain Proof'} ↗
                 </a>
              ) : (
                <span className="italic">Minting pending...</span>
              )}
            </CardFooter>
            
            {/* Holographic sheen effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Card>
        ))}
      </div>
    </div>
  );
}
