export const communicationKindLabels = {
  general: "Comunicado comum",
  important: "Comunicado importante",
  authorization: "Autorização",
  item_request: "Solicitação de item",
} as const;

export const communicationResponseLabels = {
  acknowledged: "Li e estou ciente",
  authorized: "Autorizado",
  not_authorized: "Não autorizado",
  will_send: "Vou enviar",
  sent: "Já enviei",
  cannot_send: "Não consigo enviar",
} as const;

export type CommunicationKind = keyof typeof communicationKindLabels;
export type CommunicationResponse = keyof typeof communicationResponseLabels;

export const allowedCommunicationResponses: Record<
  CommunicationKind,
  CommunicationResponse[]
> = {
  general: [],
  important: ["acknowledged"],
  authorization: ["authorized", "not_authorized"],
  item_request: ["will_send", "sent", "cannot_send"],
};
