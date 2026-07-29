export const familyRequestLabels = {
  absence: "Faltará",
  late_arrival: "Chegará mais tarde",
  early_departure: "Sairá mais cedo",
  poor_sleep: "Dormiu mal",
  toilet_training: "Processo de desfralde",
  pickup_change: "Outra pessoa fará a retirada",
  extended_period: "Período integral excepcional",
} as const;

export const familyRequestStatusLabels = {
  submitted: "Aguardando direção",
  acknowledged: "Recebido pela escola",
  approved: "Aprovado",
  declined: "Não aprovado",
  completed: "Concluído",
} as const;

export type FamilyRequestType = keyof typeof familyRequestLabels;

export function requestDetailSummary(
  type: FamilyRequestType,
  details: Record<string, unknown>,
) {
  const keys = {
    absence: ["reason", "note"],
    late_arrival: ["expected_time", "reason"],
    early_departure: ["departure_time", "pickup_person"],
    poor_sleep: ["sleep_note", "wake_note"],
    toilet_training: ["stage", "care_note"],
    pickup_change: ["pickup_person", "relationship"],
    extended_period: ["requested_until", "reason"],
  }[type];

  return keys
    .map((key) => details[key])
    .filter(Boolean)
    .map(String)
    .join(" · ");
}
