import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  KeyRound,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { getCurrentContext } from "../../../lib/auth";
import { updateFamilyAccessStatus } from "../../actions";
import { ContactForm } from "./contact-form";
import { SubmitButton } from "../registry/submit-button";

type SearchParams = Promise<{ contact?: string; success?: string }>;

const kindLabels = {
  primary_guardian: "Responsável principal",
  additional_guardian: "Responsável adicional",
  emergency_contact: "Contato de emergência",
  pickup_only: "Somente retirada",
} as const;

const statusLabels = {
  not_invited: "Sem acesso",
  pending: "Convite pendente",
  active: "Acesso ativado",
  expired: "Convite expirado",
  suspended: "Acesso suspenso",
} as const;

const permissionLabels = {
  can_view_routine: "Rotina",
  can_view_photos: "Fotos",
  can_view_communications: "Comunicados",
  can_view_documents: "Documentos",
} as const;

export default async function FamiliesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const { supabase, membership } = await getCurrentContext();
  if (membership.role !== "director") redirect("/app");

  const [{ data: children }, { data: enrollments }, { data: contacts }] =
    await Promise.all([
      supabase
        .from("children")
        .select("id, first_name, last_name")
        .eq("school_id", membership.school_id)
        .eq("active", true)
        .order("first_name"),
      supabase
        .from("enrollments")
        .select("child_id, classrooms(name)")
        .eq("school_id", membership.school_id)
        .eq("status", "active"),
      supabase
        .from("family_contacts")
        .select(
          "id, full_name, email, phone, access_status, invited_at, invitation_expires_at, child_contact_links(id, child_id, kind, relationship, can_view_routine, can_view_photos, can_view_communications, can_view_documents, children(first_name, last_name))",
        )
        .eq("school_id", membership.school_id)
        .order("created_at", { ascending: false }),
    ]);

  const classroomByChild = new Map(
    (enrollments ?? []).map((enrollment) => {
      const classroom = Array.isArray(enrollment.classrooms)
        ? enrollment.classrooms[0]
        : enrollment.classrooms;
      return [enrollment.child_id, classroom?.name ?? "Sem turma"];
    }),
  );
  const childOptions = (children ?? []).map((child) => ({
    id: child.id,
    name: `${child.first_name} ${child.last_name}`,
    classroom: classroomByChild.get(child.id) ?? "Sem turma",
  }));
  const selectedContact =
    contacts?.find((contact) => contact.id === query.contact) ?? contacts?.[0];

  return (
    <div>
      <header>
        <span className="text-[10px] font-extrabold tracking-[.16em] text-[#386b9f]">
          FAMÍLIAS E ACESSOS
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-[-.05em]">
          Quem pode acessar cada criança
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61758d]">
          Centralize responsáveis, contatos de emergência e pessoas autorizadas
          para retirada, com permissões individuais e rastreáveis.
        </p>
      </header>

      {query.success ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-[#b4d5f3] bg-[#eff7ff] p-4 text-[#0759bd]"
        >
          <CheckCircle2 size={21} className="mt-0.5 shrink-0" />
          <span>
            <strong className="block text-sm">
              {query.success === "contact-created"
                ? "Contato cadastrado e vinculado!"
                : "Situação do acesso atualizada!"}
            </strong>
            <small className="mt-1 block text-[#386b9f]">
              As permissões e os vínculos já aparecem no painel abaixo.
            </small>
          </span>
        </div>
      ) : null}

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <Metric
          icon={<UsersRound size={18} />}
          label="Contatos cadastrados"
          value={contacts?.length ?? 0}
        />
        <Metric
          icon={<Clock3 size={18} />}
          label="Convites pendentes"
          value={
            contacts?.filter((contact) => contact.access_status === "pending")
              .length ?? 0
          }
        />
        <Metric
          icon={<ShieldCheck size={18} />}
          label="Acessos ativos"
          value={
            contacts?.filter((contact) => contact.access_status === "active")
              .length ?? 0
          }
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <ContactForm childOptions={childOptions} />

        <div className="rounded-2xl border border-[#dce6f2] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]">
                CONTATOS DA ESCOLA
              </span>
              <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold">
                Vínculos cadastrados
              </h2>
            </div>
            <span className="rounded-full bg-[#edf5fd] px-3 py-1 text-[10px] font-bold text-[#0759bd]">
              {contacts?.length ?? 0} pessoas
            </span>
          </div>

          <div className="mt-5 grid gap-2">
            {contacts?.map((contact) => {
              const link = contact.child_contact_links[0];
              return (
                <Link
                  key={contact.id}
                  href={`/app/direction/families?contact=${contact.id}`}
                  className={`rounded-xl border p-3 text-xs transition-colors ${
                    selectedContact?.id === contact.id
                      ? "border-[#0759bd] bg-[#edf5fd]"
                      : "border-[#e3eaf2] hover:border-[#b1c2d4]"
                  }`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span>
                      <strong className="block">{contact.full_name}</strong>
                      <small className="mt-1 block text-[#6f8299]">
                        {link ? kindLabels[link.kind] : "Sem vínculo"} ·{" "}
                        {contact.child_contact_links.length} criança(s)
                      </small>
                    </span>
                    <StatusBadge status={contact.access_status} />
                  </span>
                </Link>
              );
            })}
            {!contacts?.length ? (
              <div className="rounded-xl border border-dashed border-[#dce6f2] p-8 text-center text-xs text-[#6f8299]">
                Nenhum contato cadastrado ainda.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {selectedContact ? (
        <ContactDetails contact={selectedContact} />
      ) : null}
    </div>
  );
}

type Contact = NonNullable<
  Awaited<
    ReturnType<typeof getCurrentContext>
  >
> extends never
  ? never
  : {
      id: string;
      full_name: string;
      email: string | null;
      phone: string;
      access_status:
        | "not_invited"
        | "pending"
        | "active"
        | "expired"
        | "suspended";
      invited_at: string | null;
      invitation_expires_at: string | null;
      child_contact_links: {
        id: string;
        child_id: string;
        kind:
          | "primary_guardian"
          | "additional_guardian"
          | "emergency_contact"
          | "pickup_only";
        relationship: string;
        can_view_routine: boolean;
        can_view_photos: boolean;
        can_view_communications: boolean;
        can_view_documents: boolean;
        children:
          | { first_name: string; last_name: string }
          | { first_name: string; last_name: string }[];
      }[];
    };

function ContactDetails({ contact }: { contact: Contact }) {
  const grantsAccess = contact.child_contact_links.some((link) =>
    ["primary_guardian", "additional_guardian"].includes(link.kind),
  );
  const permissions = contact.child_contact_links[0];

  return (
    <section className="mt-5 rounded-2xl border border-[#dce6f2] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e7edf4] pb-5">
        <div>
          <span className="text-[10px] font-extrabold tracking-[.12em] text-[#386b9f]">
            DETALHES DO CONTATO
          </span>
          <h2 className="mt-1 font-[var(--font-display)] text-3xl font-semibold">
            {contact.full_name}
          </h2>
          <p className="mt-1 text-xs text-[#61758d]">
            {contact.email ?? "Sem e-mail"} · {contact.phone}
          </p>
        </div>
        <StatusBadge status={contact.access_status} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div>
          <strong className="text-xs">Crianças e vínculos</strong>
          <div className="mt-3 grid gap-2">
            {contact.child_contact_links.map((link) => {
              const child = Array.isArray(link.children)
                ? link.children[0]
                : link.children;
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-xl bg-[#f7f7f3] p-3 text-xs"
                >
                  <span>
                    <strong className="block">
                      {child?.first_name} {child?.last_name}
                    </strong>
                    <small className="text-[#6f8299]">{link.relationship}</small>
                  </span>
                  <span className="text-[10px] font-bold text-[#386b9f]">
                    {kindLabels[link.kind]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <strong className="text-xs">Permissões concedidas</strong>
          {grantsAccess && permissions ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(permissionLabels).map(([key, label]) => (
                <span
                  key={key}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
                    permissions[key as keyof typeof permissionLabels]
                      ? "bg-[#e6f2eb] text-[#0759bd]"
                      : "bg-[#f0f0ec] text-[#75869a] line-through"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#fff4e9] p-3 text-xs leading-5 text-[#80512f]">
              <CircleAlert size={16} className="mt-0.5 shrink-0" />
              Este contato não possui nem receberá acesso ao aplicativo.
            </p>
          )}

          {grantsAccess ? (
            <AccessActions contact={contact} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AccessActions({ contact }: { contact: Contact }) {
  return (
    <div className="mt-5 border-t border-[#e7edf4] pt-4">
      <strong className="text-xs">Gerenciar acesso demonstrativo</strong>
      <div className="mt-3 flex flex-wrap gap-2">
        {contact.access_status !== "pending" ? (
          <StatusForm
            contactId={contact.id}
            status="pending"
            label="Enviar novo convite"
            icon={<KeyRound size={14} />}
          />
        ) : (
          <StatusForm
            contactId={contact.id}
            status="active"
            label="Simular ativação"
            icon={<UserRoundCheck size={14} />}
          />
        )}
        {contact.access_status !== "suspended" &&
        contact.access_status !== "not_invited" ? (
          <StatusForm
            contactId={contact.id}
            status="suspended"
            label="Suspender acesso"
            secondary
            icon={<CircleAlert size={14} />}
          />
        ) : null}
      </div>
      {contact.access_status === "pending" &&
      contact.invitation_expires_at ? (
        <p className="mt-3 text-[10px] text-[#6f8299]">
          Convite demonstrativo válido até{" "}
          {new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: "America/Sao_Paulo",
          }).format(new Date(contact.invitation_expires_at))}
          .
        </p>
      ) : null}
    </div>
  );
}

function StatusForm({
  contactId,
  status,
  label,
  icon,
  secondary = false,
}: {
  contactId: string;
  status: "pending" | "active" | "suspended";
  label: string;
  icon: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <form action={updateFamilyAccessStatus}>
      <input type="hidden" name="contactId" value={contactId} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton
        idleLabel={
          <span className="flex items-center gap-1.5">
            {icon} {label}
          </span>
        }
        pendingLabel="Atualizando..."
        className={`rounded-xl px-4 py-2.5 text-[10px] font-bold ${
          secondary
            ? "border border-[#d8bca7] bg-white text-[#80512f]"
            : "bg-[#0759bd] text-white"
        }`}
      />
    </form>
  );
}

function StatusBadge({
  status,
}: {
  status: keyof typeof statusLabels;
}) {
  const styles = {
    not_invited: "bg-[#f0f0ec] text-[#61758d]",
    pending: "bg-[#fff1dc] text-[#8b5b25]",
    active: "bg-[#e6f2eb] text-[#0759bd]",
    expired: "bg-[#f4ece7] text-[#80512f]",
    suspended: "bg-[#f7e8e5] text-[#93463c]",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold ${styles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#dce6f2] bg-white p-4">
      <span className="flex items-center gap-2 text-[#386b9f]">
        {icon}
        <small className="text-[10px] font-bold uppercase tracking-[.08em]">
          {label}
        </small>
      </span>
      <strong className="mt-3 block font-[var(--font-display)] text-3xl">
        {value}
      </strong>
    </div>
  );
}
