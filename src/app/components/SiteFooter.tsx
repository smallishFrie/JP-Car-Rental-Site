import SiteFooterMotion from "./SiteFooterMotion";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function SiteFooter() {
  const year = new Date().getFullYear();
  let isSignedIn = false;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    isSignedIn = Boolean(data.user);
  }

  return <SiteFooterMotion year={year} isSignedIn={isSignedIn} />;
}
