"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";

export default function InviteSessionPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      window.location.replace(`/auth/callback?code=${encodeURIComponent(code)}&next=/invite/accept`);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let completed = false;
    const finish = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session && !completed) {
        completed = true;
        window.location.replace("/invite/accept");
      }
    };
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !completed) {
        completed = true;
        window.location.replace("/invite/accept");
      }
    });
    void finish();
    const timer = window.setTimeout(() => { if (!completed) setFailed(true); }, 8000);
    return () => {
      window.clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  return <main className="grid min-h-dvh place-items-center bg-[#041b46] px-5 text-white">
    <section className="text-center">
      {failed ? <><h1 className="text-xl font-bold">Este convite não é mais válido</h1><p className="mt-2 text-sm text-[#aac9ed]">Peça à escola para reenviar o acesso.</p></> : <><LoaderCircle className="mx-auto animate-spin text-[#19b9ff]" size={34} /><h1 className="mt-5 text-lg font-bold">Validando seu convite...</h1><p className="mt-2 text-xs text-[#aac9ed]">Isso leva apenas alguns segundos.</p></>}
    </section>
  </main>;
}
