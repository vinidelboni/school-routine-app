"use client";

import { Bell, Radio, UserRound } from "lucide-react";
import { useState } from "react";
import { createCommunication } from "../../actions";
import { SubmitButton } from "../registry/submit-button";

type Option = { id: string; name: string };

export function CommunicationForm({
  classrooms,
  childOptions,
}: {
  classrooms: Option[];
  childOptions: Option[];
}) {
  const [scope, setScope] = useState("school");

  return (
    <form action={createCommunication} className="rounded-2xl border border-[#dce6f2] bg-white p-5">
      <span className="text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]">
        NOVA PUBLICAÇÃO
      </span>
      <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">
        Criar comunicado
      </h2>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-1.5 text-xs font-bold">
          Tipo
          <select name="kind" className="rounded-xl border border-[#dce6f2] bg-white px-3 py-3 font-normal" required>
            <option value="general">Comunicado comum</option>
            <option value="important">Comunicado importante</option>
            <option value="authorization">Autorização</option>
            <option value="item_request">Solicitação de item</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-bold">
          Público
          <select
            name="scope"
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            className="rounded-xl border border-[#dce6f2] bg-white px-3 py-3 font-normal"
          >
            <option value="school">Toda a escola</option>
            <option value="classroom">Uma turma</option>
            <option value="child">Uma criança</option>
          </select>
        </label>
        {scope === "classroom" ? (
          <label className="grid gap-1.5 text-xs font-bold">
            Turma
            <select name="classroomId" className="rounded-xl border border-[#dce6f2] bg-white px-3 py-3 font-normal" required>
              <option value="">Selecione</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>{classroom.name}</option>
              ))}
            </select>
          </label>
        ) : null}
        {scope === "child" ? (
          <label className="grid gap-1.5 text-xs font-bold">
            Criança
            <select name="childId" className="rounded-xl border border-[#dce6f2] bg-white px-3 py-3 font-normal" required>
              <option value="">Selecione</option>
              {childOptions.map((child) => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex items-start gap-3 rounded-xl bg-[#f2f6fb] p-3 text-[10px] leading-4 text-[#536b84]">
          {scope === "child" ? (
            <UserRound className="mt-0.5 shrink-0 text-[#0759bd]" size={16} />
          ) : (
            <Radio className="mt-0.5 shrink-0 text-[#9a623b]" size={16} />
          )}
          <span>
            <strong className="block text-[#0759bd]">
              {scope === "child"
                ? "Notificação exclusiva"
                : scope === "classroom"
                  ? "Push para a turma"
                  : "Push geral"}
            </strong>
            {scope === "child"
              ? "Somente os responsáveis vinculados a essa criança serão notificados."
              : scope === "classroom"
                ? "Todos os responsáveis com crianças ativas nessa turma receberão a publicação."
                : "Todas as famílias ativas da escola receberão a publicação."}
          </span>
          <Bell className="ml-auto shrink-0 text-[#386b9f]" size={14} />
        </div>
        <label className="grid gap-1.5 text-xs font-bold">
          Título
          <input name="title" minLength={3} maxLength={120} className="rounded-xl border border-[#dce6f2] px-3 py-3 font-normal" placeholder="Ex.: Festa da família" required />
        </label>
        <label className="grid gap-1.5 text-xs font-bold">
          Mensagem
          <textarea name="body" minLength={3} maxLength={2000} rows={5} className="resize-none rounded-xl border border-[#dce6f2] px-3 py-3 font-normal leading-5" placeholder="Escreva as informações que a família precisa receber." required />
        </label>
        <label className="grid gap-1.5 text-xs font-bold">
          Data relacionada <span className="font-normal text-[#6f8299]">(opcional)</span>
          <input type="date" name="eventDate" className="rounded-xl border border-[#dce6f2] px-3 py-3 font-normal" />
        </label>
        <SubmitButton
          idleLabel="Publicar para as famílias"
          pendingLabel="Publicando..."
          className="rounded-xl bg-[#0759bd] px-4 py-3 text-xs font-bold text-white"
        />
      </div>
    </form>
  );
}
