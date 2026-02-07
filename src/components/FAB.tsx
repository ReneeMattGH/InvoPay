import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

export function FAB() {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="gradient"
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate("/upload")}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-popover text-popover-foreground border-border">
            <p>New Invoice</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
