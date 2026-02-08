import { Database } from "@/integrations/supabase/types";

export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type Investment = Database['public']['Tables']['investments']['Row'];
