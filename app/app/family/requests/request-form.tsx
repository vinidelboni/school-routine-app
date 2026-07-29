"use client";

import { useState } from "react";
import { createFamilyRequest } from "../../actions";
import { SubmitButton } from "../../direction/registry/submit-button";
import {
  familyRequestLabels,
  type FamilyRequestType,
} from "../../../lib/family-requests";

const fieldConfiguration: Record<
  FamilyRequestType,
  {
    primary: string;
    primaryType?: string;
    primaryPlaceholder: string;
    secondary: string;
    secondaryPlaceholder: string;
  }
> = {
  absence: {
    primary: "Motivo",
    primaryPlaceholder: "Ex.: consulta, indisposição ou assunto familiar",
    secondary: "Observação curta",
    secondaryPlaceholder: "Opcional",
  },
  late_arrival: {
    primary: "Horário previsto",
    primaryType: "time",
    primaryPlaceholder: "",
    secondary: "Motivo",
    secondaryPlaceholder: "Ex.: consulta pela manhã",
  },
  early_departure: {
    primary: "Horário da saída",
    primaryType: "time",
    primaryPlaceholder: "",
    secondary: "Quem fará a retirada",
    secondaryPlaceholder: "Nome completo",
  },
  poor_sleep: {
    primary: "Como foi a noite",
    primaryPlaceholder: "Ex.: dormiu depois das 23h",
    secondary: "Despertares ou cuidado necessário",
    secondaryPlaceholder: "Ex.: acordou três vezes",
  },
  toilet_training: {
    primary: "Etapa atual",
    primaryPlaceholder: "Ex.: iniciando sem fralda durante o dia",
    secondary: "Cuidado combinado",
    secondaryPlaceholder: "Ex.: oferecer banheiro a cada duas horas",
  },
  pickup_change: {
    primary: "Nome de quem fará a retirada",
    primaryPlaceholder: "Nome completo",
    secondary: "Vínculo com a criança",
    secondaryPlaceholder: "Ex.: avó, tio ou responsável",
  },
  extended_period: {
    primary: "Horário solicitado até",
    primaryType: "time",
    primaryPlaceholder: "",
    secondary: "Motivo da solicitação",
    secondaryPlaceholder: "A direção avaliará disponibilidade e cobrança",
  },
};

export function RequestForm({
  childOptions,
  defaultDate,
}: {
  childOptions: { id: string; name: string }[];
  defaultDate: string;
}) {
  const [type, setType] = useState<FamilyRequestType>("absence");
  const fields = fieldConfiguration[type];

  return (
    <form
      action={createFamilyRequest}
      className="rounded-2xl border border-[#dfe1d9] bg-white p-5"
    >
      <span className="text-[10px] font-extrabold tracking-[.12em] text-[#557164]">
        NOVO AVISO
      </span>
      <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">
        Informar a escola
      </h2>
      <p className="mt-1 text-xs leading-5 text-[#69746f]">
        Escolha uma situação e preencha somente as informações necessárias.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Criança">
          <select name="childId" required className="input">
            {childOptions.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Data">
          <input
            name="effectiveDate"
            type="date"
            required
            defaultValue={defaultDate}
            className="input"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="O que deseja informar?">
            <select
              name="requestType"
              value={type}
              onChange={(event) =>
                setType(event.target.value as FamilyRequestType)
              }
              className="input"
            >
              {Object.entries(familyRequestLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={fields.primary}>
          <input
            key={`${type}-primary`}
            name="detailPrimary"
            type={fields.primaryType ?? "text"}
            required
            placeholder={fields.primaryPlaceholder}
            className="input"
          />
        </Field>
        <Field label={fields.secondary}>
          <input
            key={`${type}-secondary`}
            name="detailSecondary"
            placeholder={fields.secondaryPlaceholder}
            className="input"
          />
        </Field>
      </div>

      {type === "extended_period" ? (
        <p className="mt-4 rounded-xl bg-[#fff4e9] p-3 text-xs leading-5 text-[#80512f]">
          Esta opção é uma solicitação. A extensão só estará confirmada após a
          aprovação da direção.
        </p>
      ) : null}

      <SubmitButton
        idleLabel="Enviar aviso à direção"
        pendingLabel="Enviando aviso..."
        className="mt-5 rounded-xl bg-[#315645] px-5 py-3 text-xs font-bold text-white"
      />
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
