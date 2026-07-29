"use client";

import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  idleLabel,
  pendingLabel,
  className,
}: {
  idleLabel: ReactNode;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`${className} transition hover:bg-[#284a3b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315645] disabled:cursor-wait disabled:opacity-70`}
    >
      {pending ? <LoaderCircle size={15} className="animate-spin" /> : null}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
