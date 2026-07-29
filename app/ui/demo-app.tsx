"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  HeartHandshake,
  Home,
  LayoutDashboard,
  LogOut,
  Moon,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  Sun,
  Upload,
  UserRound,
  Users,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import styles from "./demo-app.module.css";

type Role = "teacher" | "director" | "family";
type View = "entry" | Role;

const students = [
  { id: 1, name: "Alice", initials: "AL", color: "#D6E7DF", schedule: "Integral", status: "Comeu bem" },
  { id: 2, name: "Bento", initials: "BE", color: "#F3D5BF", schedule: "Integral", status: "Comeu bem" },
  { id: 3, name: "Cecília", initials: "CE", color: "#D9D8EF", schedule: "Manhã", status: "Comeu pouco" },
  { id: 4, name: "Davi", initials: "DA", color: "#F1E1AE", schedule: "Integral", status: "Comeu bem" },
  { id: 5, name: "Elisa", initials: "EL", color: "#CFE4EB", schedule: "Integral", status: "Repetiu" },
  { id: 6, name: "Felipe", initials: "FE", color: "#E3D8CF", schedule: "Integral", status: "Comeu bem" },
  { id: 7, name: "Gabi", initials: "GA", color: "#E6D1DA", schedule: "Tarde", status: "Comeu bem" },
  { id: 8, name: "Heitor", initials: "HE", color: "#D8E5C8", schedule: "Integral", status: "Comeu bem" },
];

const roleCards: Array<{
  role: Role;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
}> = [
  {
    role: "teacher",
    eyebrow: "Para a sala",
    title: "Professora",
    description: "Registre a rotina da turma de uma só vez e ajuste apenas o que foi diferente.",
    action: "Entrar como professora",
  },
  {
    role: "director",
    eyebrow: "Para a gestão",
    title: "Direção",
    description: "Veja o que pede atenção, acompanhe a equipe e organize a comunicação.",
    action: "Entrar como direção",
  },
  {
    role: "family",
    eyebrow: "Para quem cuida",
    title: "Família",
    description: "Acompanhe o dia da criança com clareza, carinho e segurança.",
    action: "Entrar como responsável",
  },
];

export function DemoApp() {
  const [view, setView] = useState<View>("entry");
  const [teacherStep, setTeacherStep] = useState<"home" | "meal" | "review" | "done">("home");
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  if (view === "entry") {
    return <EntryScreen onChoose={setView} />;
  }

  return (
    <div className={styles.app}>
      <DemoBar role={view} onExit={() => setView("entry")} />
      {view === "teacher" && (
        <TeacherApp
          step={teacherStep}
          setStep={setTeacherStep}
          selectedStudent={selectedStudent}
          setSelectedStudent={setSelectedStudent}
          notify={notify}
        />
      )}
      {view === "director" && <DirectorApp notify={notify} />}
      {view === "family" && <FamilyApp notify={notify} />}
      {toast && (
        <div className={styles.toast} role="status">
          <CheckCircle2 size={19} />
          {toast}
        </div>
      )}
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={styles.brand}>
      <span className={styles.brandMark} aria-hidden="true">
        <span />
        <span />
      </span>
      {!compact && <span>laço</span>}
    </div>
  );
}

function EntryScreen({ onChoose }: { onChoose: (role: Role) => void }) {
  return (
    <main className={styles.entry}>
      <header className={styles.entryHeader}>
        <Brand />
        <span className={styles.demoPill}>
          <Sparkles size={14} /> Ambiente demonstrativo
        </span>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Rotina escolar, mais leve</span>
          <h1>
            Menos tempo preenchendo.
            <br />
            <em>Mais tempo presente.</em>
          </h1>
          <p>
            Uma experiência simples para professoras, direção e famílias viverem a rotina
            da educação infantil com mais clareza e cuidado.
          </p>
        </div>
        <div className={styles.heroArtwork} aria-hidden="true">
          <div className={styles.sunShape} />
          <div className={styles.archShape}>
            <HeartHandshake size={70} strokeWidth={1.35} />
          </div>
          <span className={styles.leafOne}>⌁</span>
          <span className={styles.leafTwo}>⌁</span>
        </div>
      </section>

      <section className={styles.roleSection}>
        <div className={styles.sectionHeading}>
          <span>Escolha uma visão</span>
          <p>Explore o mesmo dia por três perspectivas.</p>
        </div>
        <div className={styles.roleGrid}>
          {roleCards.map((card, index) => (
            <button
              className={styles.roleCard}
              data-role={card.role}
              key={card.role}
              onClick={() => onChoose(card.role)}
            >
              <span className={styles.roleNumber}>0{index + 1}</span>
              <span className={styles.roleEyebrow}>{card.eyebrow}</span>
              <strong>{card.title}</strong>
              <span className={styles.roleDescription}>{card.description}</span>
              <span className={styles.roleAction}>
                {card.action} <ArrowRight size={18} />
              </span>
            </button>
          ))}
        </div>
      </section>
      <footer className={styles.entryFooter}>
        <span>Laço · conceito em validação</span>
        <span>Dados inteiramente fictícios</span>
      </footer>
    </main>
  );
}

function DemoBar({ role, onExit }: { role: Role; onExit: () => void }) {
  const labels = { teacher: "Visão da professora", director: "Visão da direção", family: "Visão da família" };
  return (
    <div className={styles.demoBar}>
      <div>
        <Sparkles size={14} />
        <span>Protótipo demonstrativo</span>
        <b>{labels[role]}</b>
      </div>
      <button onClick={onExit}>
        Trocar perfil <LogOut size={15} />
      </button>
    </div>
  );
}

function TeacherApp({
  step,
  setStep,
  selectedStudent,
  setSelectedStudent,
  notify,
}: {
  step: "home" | "meal" | "review" | "done";
  setStep: (step: "home" | "meal" | "review" | "done") => void;
  selectedStudent: number | null;
  setSelectedStudent: (id: number | null) => void;
  notify: (message: string) => void;
}) {
  return (
    <div className={styles.teacherShell}>
      <aside className={styles.teacherSide}>
        <Brand />
        <div className={styles.teacherProfile}>
          <span className={styles.avatar}>AS</span>
          <div><strong>Ana Souza</strong><span>Professora · Maternal I</span></div>
          <ChevronDown size={17} />
        </div>
        <nav>
          <button className={styles.navActive}><Home size={20} /> Hoje</button>
          <button><Users size={20} /> Minha turma</button>
          <button><BookOpen size={20} /> Comunicados</button>
          <button><CheckCircle2 size={20} /> Pendências <b>3</b></button>
        </nav>
        <div className={styles.sideFoot}>
          <button><Settings2 size={20} /> Preferências</button>
          <div><span>Escola Ipê Amarelo</span><small>Ambiente demonstrativo</small></div>
        </div>
      </aside>
      <main className={styles.teacherMain}>
        {step === "home" && <TeacherHome onMeal={() => setStep("meal")} />}
        {step === "meal" && (
          <MealFlow
            selectedStudent={selectedStudent}
            setSelectedStudent={setSelectedStudent}
            onBack={() => setStep("home")}
            onContinue={() => setStep("review")}
          />
        )}
        {step === "review" && (
          <ReviewFlow onBack={() => setStep("meal")} onPublish={() => setStep("done")} />
        )}
        {step === "done" && (
          <PublishSuccess
            onHome={() => {
              setStep("home");
              notify("A demonstração foi reiniciada");
            }}
          />
        )}
      </main>
    </div>
  );
}

function TeacherHome({ onMeal }: { onMeal: () => void }) {
  const routines = [
    { icon: <Check size={21} />, title: "Chamada", meta: "16 presentes", done: true },
    { icon: <Utensils size={21} />, title: "Alimentação", meta: "Almoço pendente", action: true },
    { icon: <Moon size={21} />, title: "Sono", meta: "12 de 16 registrados", progress: "75%" },
    { icon: <Sun size={21} />, title: "Hidratação", meta: "Último às 10h40", done: true },
    { icon: <Sparkles size={21} />, title: "Higiene", meta: "8 de 16 registrados", progress: "50%" },
    { icon: <BookOpen size={21} />, title: "Atividade", meta: "Pintura com folhas", done: true },
  ];
  return (
    <>
      <header className={styles.contentHeader}>
        <div><span>TERÇA-FEIRA, 28 DE JULHO</span><h1>Bom dia, Ana.</h1><p>Sua turma está indo muito bem hoje.</p></div>
        <button className={styles.iconButton} aria-label="Notificações"><Bell size={21} /><b /></button>
      </header>
      <section className={styles.progressHero}>
        <div>
          <span>ROTINA DE HOJE</span>
          <h2>Quase tudo pronto.</h2>
          <p>Faltam 3 registros para concluir o dia.</p>
          <div className={styles.progressTrack}><span style={{ width: "78%" }} /></div>
          <small>78% concluído</small>
        </div>
        <div className={styles.progressRing}><strong>78</strong><span>%</span></div>
      </section>
      <div className={styles.titleRow}><div><h2>Registros da turma</h2><p>Maternal I · 16 crianças presentes</p></div><button>Ver turma <ArrowRight size={17} /></button></div>
      <section className={styles.routineGrid}>
        {routines.map((item) => (
          <button key={item.title} className={`${styles.routineCard} ${item.action ? styles.routineAction : ""}`} onClick={item.action ? onMeal : undefined}>
            <span className={styles.routineIcon}>{item.icon}</span>
            <span className={styles.routineText}><strong>{item.title}</strong><small>{item.meta}</small></span>
            {item.done ? <CheckCircle2 className={styles.doneIcon} size={20} /> : item.progress ? <span className={styles.miniProgress}>{item.progress}</span> : <ArrowRight size={20} />}
          </button>
        ))}
      </section>
      <section className={styles.pendingStrip}>
        <AlertTriangle size={22} />
        <div><strong>Antes de encerrar</strong><span>3 registros ainda precisam da sua atenção.</span></div>
        <button>Ver pendências <ArrowRight size={17} /></button>
      </section>
    </>
  );
}

function MealFlow({
  selectedStudent,
  setSelectedStudent,
  onBack,
  onContinue,
}: {
  selectedStudent: number | null;
  setSelectedStudent: (id: number | null) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <header className={styles.flowHeader}>
        <button className={styles.backButton} onClick={onBack}><ArrowLeft size={20} /></button>
        <div><span>ALIMENTAÇÃO · MATERNAL I</span><h1>Como foi o almoço?</h1><p>Aplique uma resposta para a turma e ajuste só as exceções.</p></div>
        <span className={styles.stepPill}>Etapa 1 de 2</span>
      </header>
      <section className={styles.batchCard}>
        <div><span className={styles.batchIcon}><Utensils size={23} /></span><div><strong>Aplicar para a turma</strong><span>16 crianças presentes neste horário</span></div></div>
        <div className={styles.choiceRow}>
          {["Comeu tudo", "Comeu bem", "Comeu pouco", "Recusou"].map((choice) => (
            <button key={choice} className={choice === "Comeu bem" ? styles.choiceActive : ""}>
              {choice === "Comeu bem" && <Check size={16} />} {choice}
            </button>
          ))}
        </div>
      </section>
      <div className={styles.exceptionHeading}>
        <div><h2>Ajustar exceções</h2><p>Toque em uma criança para registrar algo diferente.</p></div>
        <label><Search size={17} /><input aria-label="Buscar criança" placeholder="Buscar criança" /></label>
      </div>
      <section className={styles.studentGrid}>
        {students.map((student) => (
          <button
            key={student.id}
            className={`${styles.studentCard} ${student.status !== "Comeu bem" ? styles.studentException : ""} ${selectedStudent === student.id ? styles.studentSelected : ""}`}
            onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
          >
            <span className={styles.studentAvatar} style={{ background: student.color }}>{student.initials}</span>
            <span><strong>{student.name}</strong><small>{student.schedule}</small></span>
            <span className={styles.studentStatus}>{student.status}</span>
            <MoreHorizontal size={18} />
          </button>
        ))}
      </section>
      {selectedStudent && (
        <div className={styles.inlineEditor}>
          <div><strong>Ajustar registro de {students.find((student) => student.id === selectedStudent)?.name}</strong><span>Qual foi a exceção?</span></div>
          <div className={styles.editorChoices}>
            {["Comeu tudo", "Comeu pouco", "Recusou", "Repetiu"].map((item) => <button key={item}>{item}</button>)}
          </div>
          <button className={styles.closeEditor} onClick={() => setSelectedStudent(null)}>Concluir ajuste</button>
        </div>
      )}
      <footer className={styles.flowFooter}>
        <div><CheckCircle2 size={18} /><span><strong>16 registros prontos</strong> · 2 exceções ajustadas</span></div>
        <button className={styles.primaryButton} onClick={onContinue}>Revisar registro <ArrowRight size={18} /></button>
      </footer>
    </>
  );
}

function ReviewFlow({ onBack, onPublish }: { onBack: () => void; onPublish: () => void }) {
  return (
    <>
      <header className={styles.flowHeader}>
        <button className={styles.backButton} onClick={onBack}><ArrowLeft size={20} /></button>
        <div><span>FECHAMENTO DO DIA · MATERNAL I</span><h1>Revise antes de publicar.</h1><p>Os resumos serão liberados para as famílias após a saída.</p></div>
        <span className={styles.stepPill}>Pronto para publicar</span>
      </header>
      <section className={styles.reviewLayout}>
        <div>
          <div className={styles.reviewCard}>
            <div className={styles.reviewCardHead}><div><span className={styles.studentAvatar} style={{ background: "#D6E7DF" }}>AL</span><div><strong>Alice Moreira</strong><span>Jornada integral · saída 17h30</span></div></div><button>Editar</button></div>
            <div className={styles.summaryIntro}><Sparkles size={18} /><p>Alice participou das atividades, alimentou-se bem e descansou das 12h42 às 14h03.</p></div>
            <div className={styles.summaryRows}>
              <div><Utensils size={18} /><span><strong>Alimentação</strong>Comeu bem no almoço</span><CheckCircle2 size={18} /></div>
              <div><Moon size={18} /><span><strong>Sono</strong>12h42 — 14h03 · tranquilo</span><CheckCircle2 size={18} /></div>
              <div><BookOpen size={18} /><span><strong>Atividade</strong>Pintura com folhas · 3 fotos</span><CheckCircle2 size={18} /></div>
            </div>
          </div>
          <button className={styles.nextPreview}>Ver próximo resumo <ArrowRight size={17} /></button>
        </div>
        <aside className={styles.publishPanel}>
          <span>RESUMO DA PUBLICAÇÃO</span>
          <h2>Tudo conferido.</h2>
          <div><span>Agendas prontas</span><strong>16</strong></div>
          <div><span>Campos obrigatórios</span><strong className={styles.successText}><Check size={17} /> Completos</strong></div>
          <div><span>Ocorrências</span><strong>0</strong></div>
          <div><span>Horário de liberação</span><strong>Após a saída</strong></div>
          <button className={styles.primaryButton} onClick={onPublish}><Send size={18} /> Publicar 16 agendas</button>
          <small>Uma cópia do registro e do horário de publicação será mantida no histórico.</small>
        </aside>
      </section>
    </>
  );
}

function PublishSuccess({ onHome }: { onHome: () => void }) {
  return (
    <div className={styles.successScreen}>
      <span className={styles.successMark}><Check size={42} /></span>
      <span>AGENDAS PUBLICADAS</span>
      <h1>Pronto, Ana.</h1>
      <p>As 16 famílias receberão o resumo assim que o horário de saída de cada criança chegar.</p>
      <div><CheckCircle2 size={20} /><span><strong>Publicado às 16h48</strong> · Registro salvo no histórico</span></div>
      <button className={styles.primaryButton} onClick={onHome}>Voltar ao início</button>
    </div>
  );
}

function DirectorApp({ notify }: { notify: (message: string) => void }) {
  const [tab, setTab] = useState<"overview" | "billing">("overview");
  const [reviewed, setReviewed] = useState(false);
  return (
    <div className={styles.directorShell}>
      <aside className={styles.directorSide}>
        <Brand />
        <div className={styles.schoolIdentity}><span>EI</span><div><strong>Escola Ipê Amarelo</strong><small>Unidade Centro</small></div></div>
        <nav>
          <button className={tab === "overview" ? styles.navActive : ""} onClick={() => setTab("overview")}><LayoutDashboard size={19} /> Visão geral</button>
          <button><Users size={19} /> Turmas</button>
          <button><UserRound size={19} /> Pessoas</button>
          <button><BookOpen size={19} /> Comunicação</button>
          <button className={tab === "billing" ? styles.navActive : ""} onClick={() => setTab("billing")}><FileText size={19} /> Documentos e boletos <b>4</b></button>
          <button><Settings2 size={19} /> Configurações</button>
        </nav>
        <div className={styles.directorUser}><span>MC</span><div><strong>Marina Costa</strong><small>Diretora</small></div><MoreHorizontal size={17} /></div>
      </aside>
      <main className={styles.directorMain}>
        {tab === "overview" ? (
          <DirectorOverview onBilling={() => setTab("billing")} />
        ) : (
          <BillingDemo
            reviewed={reviewed}
            onReview={() => setReviewed(true)}
            notify={notify}
          />
        )}
      </main>
    </div>
  );
}

function DirectorOverview({ onBilling }: { onBilling: () => void }) {
  return (
    <>
      <header className={styles.directorHeader}>
        <div><span>TERÇA-FEIRA, 28 DE JULHO</span><h1>Boa tarde, Marina.</h1><p>A escola está funcionando bem. Há 4 pontos que pedem atenção.</p></div>
        <div><button className={styles.iconButton}><Search size={20} /></button><button className={styles.iconButton}><Bell size={20} /><b /></button><button className={styles.primaryButton}><Plus size={17} /> Novo comunicado</button></div>
      </header>
      <section className={styles.attentionSection}>
        <div className={styles.sectionTitle}><span>PRECISA DA SUA ATENÇÃO</span><button>Ver todas as pendências <ArrowRight size={16} /></button></div>
        <div className={styles.attentionGrid}>
          <button><span className={styles.attentionIcon} data-tone="amber"><Clock3 size={21} /></span><div><strong>2 turmas com agendas pendentes</strong><small>Maternal II e Pré I · saída em até 40 min</small></div><ArrowRight size={19} /></button>
          <button><span className={styles.attentionIcon} data-tone="red"><AlertTriangle size={21} /></span><div><strong>1 ocorrência para revisar</strong><small>Registrada às 14h22 · Berçário II</small></div><ArrowRight size={19} /></button>
          <button onClick={onBilling}><span className={styles.attentionIcon} data-tone="blue"><FileText size={21} /></span><div><strong>4 boletos precisam de validação</strong><small>Lote de agosto · leitura automática concluída</small></div><ArrowRight size={19} /></button>
          <button><span className={styles.attentionIcon} data-tone="green"><UserRound size={21} /></span><div><strong>3 convites ainda não ativados</strong><small>Responsáveis convidados há mais de 3 dias</small></div><ArrowRight size={19} /></button>
        </div>
      </section>
      <section className={styles.statGrid}>
        <div><span>CRIANÇAS PRESENTES</span><strong>87 <small>de 94 esperadas</small></strong><p><i style={{ width: "92%" }} /></p><em>92% de presença hoje</em></div>
        <div><span>AGENDAS CONCLUÍDAS</span><strong>4 <small>de 6 turmas</small></strong><p><i style={{ width: "67%" }} /></p><em>2 turmas em andamento</em></div>
        <div><span>FAMÍLIAS ALCANÇADAS</span><strong>76%</strong><p><i style={{ width: "76%" }} /></p><em>Resumos visualizados hoje</em></div>
      </section>
      <section className={styles.classSection}>
        <div className={styles.titleRow}><div><h2>Rotina das turmas</h2><p>Acompanhe o fechamento de hoje.</p></div><button>Ver relatório completo <ArrowRight size={17} /></button></div>
        <div className={styles.classTable}>
          <div className={styles.tableHead}><span>Turma</span><span>Responsável</span><span>Jornada</span><span>Progresso</span><span>Status</span><span /></div>
          {[
            ["Berçário I", "Carla Mendes", "Integral", "100%", "Concluída"],
            ["Berçário II", "Júlia Nunes", "Integral", "91%", "Atenção"],
            ["Maternal I", "Ana Souza", "Integral", "78%", "Em andamento"],
            ["Maternal II", "Paula Lima", "Tarde", "64%", "Em andamento"],
          ].map((row) => (
            <div className={styles.tableRow} key={row[0]}>
              <span><b>{row[0]}</b><small>16 crianças</small></span><span>{row[1]}</span><span>{row[2]}</span>
              <span><i><b style={{ width: row[3] }} /></i><small>{row[3]}</small></span>
              <span data-status={row[4]}>{row[4]}</span><button><MoreHorizontal size={18} /></button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function BillingDemo({
  reviewed,
  onReview,
  notify,
}: {
  reviewed: boolean;
  onReview: () => void;
  notify: (message: string) => void;
}) {
  const docs = [
    ["mensalidade_alice_agosto.pdf", "Alice Moreira", "Fernanda Moreira", "99%", "Pronto"],
    ["boleto_bento_08-2026.pdf", "Bento Ribeiro", "Lucas Ribeiro", "98%", "Pronto"],
    ["doc_003_agosto.pdf", "Cecília Alves", "Marina Alves", "84%", "Revisar"],
    ["mensalidade_davi.pdf", "Davi Santos", "Camila Santos", "97%", "Pronto"],
  ];
  return (
    <>
      <header className={styles.directorHeader}>
        <div><span>DOCUMENTOS E BOLETOS</span><h1>Distribuição inteligente</h1><p>Envie vários PDFs e valide para qual família cada documento deve seguir.</p></div>
        <button className={styles.primaryButton}><Upload size={17} /> Enviar novos PDFs</button>
      </header>
      <section className={styles.aiBanner}><span><Sparkles size={22} /></span><div><strong>Leitura automática concluída</strong><p>A IA encontrou 4 famílias correspondentes. Um documento precisa da sua revisão.</p></div><small>4 de 4 processados</small></section>
      <section className={styles.billingPanel}>
        <div className={styles.billingHead}><div><h2>Lote · Mensalidades de agosto</h2><p>4 arquivos enviados hoje às 15h42</p></div><span className={reviewed ? styles.readyPill : styles.reviewPill}>{reviewed ? "Pronto para enviar" : "1 precisa de revisão"}</span></div>
        <div className={styles.billingTable}>
          <div className={styles.billingTableHead}><span>Documento</span><span>Criança identificada</span><span>Responsável</span><span>Confiança</span><span>Status</span></div>
          {docs.map((doc) => (
            <button className={styles.billingRow} key={doc[0]} onClick={doc[4] === "Revisar" && !reviewed ? onReview : undefined}>
              <span><FileText size={20} /><b>{doc[0]}</b></span><span>{doc[1]}</span><span>{doc[2]}</span>
              <span><i style={{ width: doc[3] }} /><small>{doc[3]}</small></span>
              <span data-review={doc[4] === "Revisar" && !reviewed}>{doc[4] === "Revisar" && !reviewed ? "Revisar vínculo" : <><Check size={15} /> Validado</>}</span>
            </button>
          ))}
        </div>
        {!reviewed ? (
          <div className={styles.reviewHint}><AlertTriangle size={19} /><span><strong>Confirme o vínculo de Cecília</strong>O nome do arquivo não contém identificação. A sugestão foi feita pelo CPF encontrado no documento.</span><button onClick={onReview}>Confirmar vínculo</button></div>
        ) : (
          <div className={styles.billingActions}><span><CheckCircle2 size={19} /> 4 documentos validados</span><button className={styles.primaryButton} onClick={() => notify("4 boletos distribuídos para as famílias")}><Send size={17} /> Distribuir 4 boletos</button></div>
        )}
      </section>
      <p className={styles.privacyNote}><Sparkles size={15} /> Nenhum documento é enviado sem validação da direção. Esta simulação usa dados fictícios.</p>
    </>
  );
}

function FamilyApp({ notify }: { notify: (message: string) => void }) {
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <div className={styles.familyBackground}>
      <div className={styles.phoneShell}>
        <header className={styles.familyHeader}>
          <Brand />
          <div><button className={styles.childSelector}><span>AM</span><div><small>Acompanhando</small><strong>Alice Moreira</strong></div><ChevronDown size={16} /></button><button className={styles.iconButton}><Bell size={19} /><b /></button></div>
        </header>
        <main className={styles.familyMain}>
          <div className={styles.familyDate}><span>TERÇA-FEIRA, 28 DE JULHO</span><small>Publicado às 16h48</small></div>
          <section className={styles.familyWelcome}><span className={styles.sunMini}><Sun size={25} /></span><div><h1>O dia da Alice</h1><p>Alice participou das atividades, alimentou-se bem e descansou das 12h42 às 14h03.</p></div></section>
          <section className={styles.familyCard}>
            <div className={styles.familyCardTitle}><span data-tone="meal"><Utensils size={19} /></span><div><strong>Alimentação</strong><small>Registros de hoje</small></div></div>
            <div className={styles.familyItems}><div><span>Almoço</span><strong>Comeu bem</strong></div><div><span>Lanche da tarde</span><strong>Comeu tudo</strong></div><div><span>Hidratação</span><strong>Bebeu normalmente</strong></div></div>
          </section>
          <section className={styles.familyCard}>
            <div className={styles.familyCardTitle}><span data-tone="sleep"><Moon size={19} /></span><div><strong>Sono</strong><small>Descanso da tarde</small></div></div>
            <div className={styles.sleepRow}><div><small>INÍCIO</small><strong>12h42</strong></div><span><i /><Moon size={18} /><i /></span><div><small>FIM</small><strong>14h03</strong></div></div>
            <p className={styles.calmPill}><CheckCircle2 size={15} /> Sono tranquilo</p>
          </section>
          <section className={styles.familyCard}>
            <div className={styles.familyCardTitle}><span data-tone="activity"><BookOpen size={19} /></span><div><strong>Atividade do dia</strong><small>Exploração da natureza</small></div></div>
            <div className={styles.activityBlock}><div className={styles.activityArt}><span>🍃</span><span>🎨</span></div><div><strong>Pintura com folhas</strong><p>Experimentamos formas, cores e texturas usando folhas do jardim.</p><button onClick={() => notify("Galeria demonstrativa: 3 fotos")}><Paperclip size={15} /> Ver 3 fotos</button></div></div>
          </section>
          <section className={styles.familyCard}>
            <div className={styles.familyCardTitle}><span data-tone="note"><FileText size={19} /></span><div><strong>Observação</strong><small>Da professora Ana</small></div></div>
            <blockquote>“Alice participou com curiosidade e ajudou os amigos a escolher as folhas para a atividade.”</blockquote>
          </section>
          <section className={styles.familyCard}>
            <div className={styles.familyCardTitle}><span data-tone="billing"><FileText size={19} /></span><div><strong>Documento disponível</strong><small>Enviado pela direção</small></div></div>
            <div className={styles.documentRow}><FileText size={22} /><span><strong>Mensalidade · Agosto</strong><small>PDF · vence em 10 de agosto</small></span><button onClick={() => notify("Download simulado")}><Download size={18} /></button></div>
          </section>
          <button
            className={`${styles.ackButton} ${acknowledged ? styles.ackDone : ""}`}
            onClick={() => {
              setAcknowledged(true);
              notify("Visualização registrada");
            }}
          >
            {acknowledged ? <><CheckCircle2 size={19} /> Visualização registrada</> : <>Cheguei ao fim do resumo <Check size={19} /></>}
          </button>
          <p className={styles.familyFootnote}>A visualização do resumo é registrada automaticamente para a escola.</p>
        </main>
        <nav className={styles.familyNav}><button className={styles.familyNavActive}><Home size={19} /><span>Início</span></button><button><Clock3 size={19} /><span>Histórico</span></button><button><BookOpen size={19} /><span>Escola</span></button><button><UserRound size={19} /><span>Perfil</span></button></nav>
      </div>
    </div>
  );
}
