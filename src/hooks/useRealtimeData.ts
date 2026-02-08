import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, Investment } from "@/types/app-types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type InvestmentWithInvoice = Investment & {
  invoices: Invoice | null;
};

export function useInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchInvoices = async () => {
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching invoices:", error);
          return;
        }

        if (data) {
          setInvoices(data as Invoice[]);
        }
      } catch (e) {
        console.error("Exception fetching invoices:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();

    const channel = supabase
      .channel("invoices_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchInvoices()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { invoices, loading };
}

export function useMarketplacePools() {
  const [pools, setPools] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .in("status", ["tokenized", "funded", "repaid"])
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching pools:", error);
          return;
        }

        if (data) {
          setPools(data as Invoice[]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPools();

    const channel = supabase
      .channel("public_pools")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          // Removed invalid 'in' filter. We'll listen to all invoice changes and let fetchPools filter the relevant ones.
        },
        () => fetchPools()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { pools, loading };
}

export function useInvestments() {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<InvestmentWithInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchInvestments = async () => {
      try {
        const { data, error } = await supabase
          .from("investments")
          .select("*, invoices(*)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        // Cast data to unknown first because Supabase types might not perfectly infer the join structure without deeper generic passing
        setInvestments(data as unknown as InvestmentWithInvoice[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
    
    const channel = supabase
      .channel("my_investments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "investments", filter: `investor_id=eq.${user.id}` },
        () => fetchInvestments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { investments, loading };
}
