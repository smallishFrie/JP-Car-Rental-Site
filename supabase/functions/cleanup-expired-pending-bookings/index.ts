import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Releases inventory from unpaid "pending" bookings older than 1 hour.
 * Invoke on a schedule (e.g. every 15 minutes) via Supabase Dashboard → Edge Functions → Schedules,
 * or pg_cron + pg_net (see ../schedule_cleanup_via_pg_cron.sql).
 *
 * Secrets: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically in Edge Functions.
 * Optional: set CRON_SECRET and send Authorization: Bearer <CRON_SECRET> from external callers.
 */
Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return Response.json({ error: "Missing Supabase environment." }, { status: 500 });
  }

  const supabase = createClient(url, key);
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const canceledAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "canceled", canceled_at: canceledAt, refund_status: "not_applicable" })
    .eq("status", "pending")
    .eq("payment_status", "unpaid")
    .lte("created_at", cutoff)
    .select("id");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  return Response.json({
    ok: true,
    cleaned: rows.length,
    canceledIds: rows.map((r: { id: string }) => r.id),
  });
});
