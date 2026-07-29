export const occurrenceSeverityLabels = {
  attention: "Atenção",
  important: "Importante",
  urgent: "Urgente",
} as const;

export type OccurrenceSeverity = keyof typeof occurrenceSeverityLabels;
