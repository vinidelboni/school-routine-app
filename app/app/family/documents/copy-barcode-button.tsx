"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyBarcodeButton({ value }: { value: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    window.setTimeout(() => setStatus("idle"), 2200);
  }

  const copied = status === "copied";

  return (
    <button
      type="button"
      onClick={copy}
      className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#b9d6f3] bg-[#f4f9ff] px-3 py-2 text-[10px] font-bold text-[#1768c5] transition hover:bg-[#e7f3ff]"
      aria-label={copied ? "Código copiado" : status === "error" ? "Não foi possível copiar" : "Copiar linha digitável"}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span aria-live="polite">{copied ? "Copiado" : status === "error" ? "Tente novamente" : "Copiar código"}</span>
    </button>
  );
}
