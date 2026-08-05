"use client";

import { useRef } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { selectSchool } from "./school-actions";

export type SchoolOption = {
  membershipId: string;
  schoolName: string;
  role: "director" | "teacher" | "family";
};

const roleLabels = { director: "Direção", teacher: "Professora", family: "Família" } as const;

export function SchoolSwitcher({ options, activeMembershipId, tone = "light" }: { options: SchoolOption[]; activeMembershipId: string; tone?: "light" | "dark" }) {
  const formRef = useRef<HTMLFormElement>(null);
  if (options.length < 2) return null;

  return <form ref={formRef} action={selectSchool} className="relative min-w-0">
    <Building2 aria-hidden="true" size={14} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${tone === "dark" ? "text-[#9fc8f3]" : "text-[#1768c5]"}`} />
    <select
      name="membershipId"
      defaultValue={activeMembershipId}
      aria-label="Selecionar escola"
      onChange={() => formRef.current?.requestSubmit()}
      className={`h-9 max-w-[230px] appearance-none truncate rounded-xl border py-0 pl-9 pr-8 text-[10px] font-bold outline-none transition focus:ring-4 ${tone === "dark" ? "border-white/15 bg-white/10 text-white focus:ring-white/10" : "border-[#d7e4f2] bg-white text-[#17375e] focus:ring-[#dcecff]"}`}
    >
      {options.map((option) => <option key={option.membershipId} value={option.membershipId} className="text-[#17375e]">{option.schoolName} · {roleLabels[option.role]}</option>)}
    </select>
    <ChevronDown aria-hidden="true" size={13} className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${tone === "dark" ? "text-[#9fc8f3]" : "text-[#5d7d9f]"}`} />
  </form>;
}
