import { type CommunicationKind } from "../../../lib/communications";
import { respondToCommunication } from "../../actions";
import { SubmitButton } from "../../direction/registry/submit-button";

export function ResponseActions({
  recipientId,
  kind,
  viewed,
}: {
  recipientId: string;
  kind: CommunicationKind;
  viewed: boolean;
}) {
  const actions =
    kind === "important"
      ? [{ value: "acknowledged", label: "Confirmo que visualizei" }]
      : kind === "authorization"
        ? [
            { value: "authorized", label: "Autorizo" },
            { value: "not_authorized", label: "Não autorizo" },
          ]
        : kind === "item_request"
          ? [
              { value: "will_send", label: "Vou enviar" },
              { value: "sent", label: "Já enviei" },
              { value: "cannot_send", label: "Não consigo enviar" },
            ]
          : [{ value: "", label: viewed ? "Visualizado" : "Confirmo que visualizei" }];
  if (kind === "general" && viewed) {
    return <span className="text-xs text-[#557164]">Visualização registrada.</span>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, index) => (
        <form key={action.value || "viewed"} action={respondToCommunication}>
          <input type="hidden" name="recipientId" value={recipientId} />
          <input type="hidden" name="response" value={action.value} />
          <SubmitButton
            idleLabel={action.label}
            pendingLabel="Registrando..."
            className={`rounded-xl px-4 py-2.5 text-[10px] font-bold ${
              index === 0
                ? "bg-[#315645] text-white"
                : "border border-[#cfd8d2] bg-white text-[#315645]"
            }`}
          />
        </form>
      ))}
    </div>
  );
}
