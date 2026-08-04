"use client";

import { useState } from "react";
import { createFamilyContact } from "../../actions";
import { SubmitButton } from "../registry/submit-button";

type ChildOption = {
  id: string;
  name: string;
  classroom: string;
};

export function ContactForm({ childOptions }: { childOptions: ChildOption[] }) {
  const [kind, setKind] = useState("primary_guardian");
  const grantsAccess =
    kind === "primary_guardian" || kind === "additional_guardian";

  return (
    <form
      action={createFamilyContact}
      className="rounded-2xl border border-[#dce6f2] bg-white p-5"
    >
      <div>
        <span className="text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]">
          NOVO VÍNCULO
        </span>
        <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">
          Cadastrar contato
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#61758d]">
          Vincule a mesma pessoa a uma ou mais crianças sem compartilhar senhas.
        </p>
      </div>

      <fieldset className="mt-5">
        <legend className="field-label">Crianças vinculadas</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {childOptions.map((child) => (
            <label
              key={child.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e3eaf2] p-3 text-xs has-checked:border-[#0759bd] has-checked:bg-[#edf5fd]"
            >
              <input
                type="checkbox"
                name="childIds"
                value={child.id}
                className="mt-0.5 accent-[#0759bd]"
              />
              <span>
                <strong className="block">{child.name}</strong>
                <small className="text-[#6f8299]">{child.classroom}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Nome completo">
          <input name="fullName" required className="input" />
        </Field>
        <Field label="Parentesco ou vínculo">
          <input
            name="relationship"
            required
            placeholder="Ex.: Mãe, pai, avó"
            className="input"
          />
        </Field>
        <Field label="E-mail">
          <input name="email" type="email" className="input" />
        </Field>
        <Field label="Telefone">
          <input
            name="phone"
            type="tel"
            required
            placeholder="(11) 99999-9999"
            className="input"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Tipo de vínculo">
            <select
              name="kind"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              className="input"
            >
              <option value="primary_guardian">Responsável principal</option>
              <option value="additional_guardian">Responsável adicional</option>
              <option value="emergency_contact">Contato de emergência</option>
              <option value="pickup_only">Autorizado somente para retirada</option>
            </select>
          </Field>
        </div>
      </div>

      <fieldset
        disabled={!grantsAccess}
        className={`mt-5 rounded-xl border p-4 ${
          grantsAccess
            ? "border-[#dce6f2] bg-[#fbfdff]"
            : "border-[#e9eef5] bg-[#f4f4f0] opacity-60"
        }`}
      >
        <legend className="px-1 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#386b9f]">
          Permissões no aplicativo
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Permission name="canViewRoutine" label="Rotina diária" />
          <Permission name="canViewPhotos" label="Galeria autorizada" />
          <Permission name="canViewCommunications" label="Comunicados" />
          <Permission name="canViewDocuments" label="Documentos e boletos" />
        </div>
        <label className="mt-4 flex items-start gap-3 border-t border-[#e2e6e2] pt-4 text-xs">
          <input
            type="checkbox"
            name="sendInvite"
            className="mt-0.5 accent-[#0759bd]"
          />
          <span>
            <strong className="block">Enviar convite por e-mail agora</strong>
            <small className="mt-1 block leading-4 text-[#61758d]">
              O responsável receberá um link individual para criar a própria senha.
              Por segurança, o link ficará válido por uma hora.
            </small>
          </span>
        </label>
      </fieldset>

      {!grantsAccess ? (
        <p className="mt-3 rounded-xl bg-[#fff4e9] p-3 text-xs leading-5 text-[#80512f]">
          Este tipo de contato ficará apenas no cadastro da escola e não terá
          acesso ao aplicativo.
        </p>
      ) : null}

      <SubmitButton
        idleLabel="Cadastrar e vincular"
        pendingLabel="Cadastrando contato..."
        className="mt-5 rounded-xl bg-[#0759bd] px-5 py-3 text-xs font-bold text-white"
      />
    </form>
  );
}

function Permission({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <input
        type="checkbox"
        name={name}
        defaultChecked
        className="accent-[#0759bd]"
      />
      {label}
    </label>
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
