"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="mt-1 flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#13c8f2] to-[#1687f3] text-sm font-extrabold uppercase tracking-[.08em] text-white shadow-[0_16px_36px_rgba(0,31,112,.4)] transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#55dfff]/25 active:translate-y-px disabled:cursor-wait disabled:brightness-90 disabled:active:translate-y-0"
    >
      {pending ? (
        <>
          <LoaderCircle aria-hidden="true" className="animate-spin" size={20} />
          <span aria-live="polite">Entrando...</span>
        </>
      ) : (
        "Entrar"
      )}
    </button>
  );
}
