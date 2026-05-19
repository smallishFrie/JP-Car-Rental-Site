import HomeContactStripClient from "./HomeContactStripClient";
import { listContactOptionsPublic } from "@/lib/contact-options";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function HomeContactStrip() {
  let isSignedIn = false;
  const contactChannels = await listContactOptionsPublic();

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    isSignedIn = Boolean(data.user);
  }

  return (
    <section className="home-bottom-section home-contact-strip" aria-labelledby="home-contact-heading">
      <HomeContactStripClient isSignedIn={isSignedIn} contactChannels={contactChannels} />
    </section>
  );
}
