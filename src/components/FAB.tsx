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
              className="h-14 w-14 rounded-full shadow-2xl animate-bounce-slow"
              onClick={() => navigate("/upload")}
            >
              <Plus className="h-6 w-6" />
              <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-stellar-pink"></span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-stellar-navy text-white border-stellar-purple">
            <p>New Invoice</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
