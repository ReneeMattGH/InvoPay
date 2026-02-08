import { useAuth } from "@/hooks/useAuth";
import { BusinessDashboard } from "@/pages/dashboards/BusinessDashboard";
import { InvestorDashboard } from "@/pages/dashboards/InvestorDashboard";

export default function Dashboard() {
  const { userRole } = useAuth();

  if (userRole === "investor") {
    return <InvestorDashboard />;
  }

  return <BusinessDashboard />;
}
