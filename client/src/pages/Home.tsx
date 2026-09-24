import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bot, Check, FileSearch,
  Github, Globe2, Linkedin, Mail, MessageCircle, Network, Phone, Radar,
  Send, Workflow, X,
} from "lucide-react";
import LiveRagDemo from "../components/LiveRag";

type ChatMsg = { role: "me" | "user"; text: string };

const problems = [
  { tag: "revenue", title: "Missed calls are missed revenue.", body: "Every unanswered call or slow reply hands your customer to a competitor. I build assistants that answer, qualify, and book — instantly, at any hour.", outcome: "Every lead answered in seconds, day or night.", icon: Radar },
  { tag: "operations", title: "Your team is doing robot work.", body: "Copy-paste, report building, data entry — expensive humans doing machine jobs. I hand those workflows to AI agents so your people can do human work.", outcome: "Hours returned to your team, every single week.", icon: Workflow },
  { tag: "knowledge", title: "Knowledge trapped in PDFs.", body: "Policies, manuals, records — scattered across drives and inboxes. I turn them into a private, searchable AI knowledge base that answers with sources.", outcome: "Answers in seconds, with the source attached.", icon: FileSearch },
  { tag: "web", title: "A website that just sits there.", body: "Most sites are brochures. Yours can be an employee: answering questions, capturing leads, and routing work while you sleep.", outcome: "A site that works the hours you don't.", icon: Globe2 },
];

const services = [
  { title: "AI chat assistants", body: "Custom assistants that answer questions, guide users, collect details, and reduce repetitive work across your site and WhatsApp.", tags: ["Support", "Lead capture", "FAQ"] },
  { title: "RAG knowledge systems", body: "Document-aware AI with semantic search and source-based answers for the knowledge your team already owns.", tags: ["PDFs", "Policies", "Q&A"] },
  { title: "AI voice assistants", body: "Real-time voice systems that listen, understand, and respond naturally for reception-style workflows and after-hours calls.", tags: ["LiveKit", "STT / TTS", "Voice"] },
  { title: "Intelligent web apps", body: "Modern interfaces connected to AI backends — useful applications, dashboards and tools, not just static pages.", tags: ["React", "Vite", "FastAPI"] },
  { title: "Automation & AI agents", body: "Multi-agent workflows that collect information, analyze data, create reports, and remove manual research.", tags: ["CrewAI", "Research", "Reports"] },
];

const projects = [
  { cat: "agent", year: "2026", tag: "AI Agent", title: "Voice AI assistant — Friday", type: "Voice AI", stack: "LiveKit · Gemini · Deepgram", icon: Phone },
  { cat: "web", year: "2026", tag: "Web + RAG", title: "Retrieval-augmented generation system", type: "RAG Q&A", stack: "Qdrant · LangChain · React", icon: FileSearch },
  { cat: "agent", year: "2025", tag: "AI Agent", title: "Multi-agent competitive intelligence", type: "Agents", stack: "CrewAI · Playwright · Serper", icon: Network },
  { cat: "vision", year: "2025", tag: "Vision", title: "Emoji detection & classification", type: "Computer Vision", stack: "PyTorch · Faster R-CNN", icon: Radar },
];

const methodSteps = [
  ["Problem call", "You tell me what is broken, slow, annoying, or expensive. No technical pressure."],
  ["Relief plan", "I propose the simplest practical solution — AI, web, automation, or a smart combination."],
  ["Build", "I build the system with clear progress updates and decisions you can actually understand."],
  ["Deploy & improve", "I deliver, test, and improve based on real use — not a handoff and goodbye."],
  ["Relief", "The problem becomes smaller, faster, cheaper, or gone. That is the only metric I care about."],
];

const experience = [
  ["Horquva LLC", "AI Engineer Intern — Remote", "Jul 2026 – Sep 2026"],
  ["Orzeh Technologies", "AI Engineer Intern — Lahore", "Jul 2026 – Aug 2026"],
  ["Information Technology University", "B.S. Artificial Intelligence · CGPA 3.15", "2023 – 2027"],
  ["Certifications", "BCG Forage · IBM · Kaggle · Coderush", "2023 – 2026"],
];

const faqs = [
  ["Do you only build AI?", "No. I build AI systems and web-related solutions — assistants, RAG systems, automation workflows, and intelligent web applications."],
  ["Can you work with international clients?", "Yes. I work remotely with clients in the US, UK, Canada, and Australia, with overlapping hours for meetings."],
  ["Can I try your RAG demo?", "Two ways: the live frontend link is available instantly on request, and a full private test with your own PDFs is set up after a short request form."],
  ["Is ME actually Aurangzeb?", "ME is my AI twin. It speaks as me, in first person, trained on my work. For final decisions and contracts, I join personally."],
  ["How much does it cost?", "It depends on the problem, scope, and timeline. The first step is free: explain the pain point, and I will propose a practical solution with a clear number."],
];

const suggestions = ["I lose calls after hours", "I want to test your RAG", "What do you charge?"];

function replyFor(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes("rag") || t.includes("pdf") || t.includes("demo") || t.includes("test"))
    return "Two ways to try my RAG system. Quick look: I give you the live frontend link right now — sample documents, full interface. Serious test: send your own PDFs through the request form and I will set up a private workspace for you.";
  if (t.includes("price") || t.includes("cost") || t.includes("charge"))
    return "I price per problem, not per hour. A focused build usually lands as a one-time setup fee plus a small monthly retainer. Tell me the workflow that hurts and I will give you a clear number — no surprise invoices.";
  if (t.includes("voice") || t.includes("call") || t.includes("receptionist"))
    return "That is my favourite build. My voice agent answers in under a second, qualifies the job, and books it into your calendar — nights, weekends, holidays. Missed calls are the most expensive silence in a service business.";
  if (t.includes("website") || t.includes("web ") || t.includes("site"))
    return "I build websites that work like employees: they answer, guide, and collect leads while you sleep. If your current site is a brochure, I will turn it into a system — React frontend, AI backend, one build.";
  if (t.includes("agent") || t.includes("automat") || t.includes("research"))
    return "I run multi-agent crews that scrape, read, and report automatically. If your team spends hours compiling research, that is the first thing I would take off their plate.";
  return "Here is how I think: every business has one workflow that quietly leaks time or money. Describe yours in one sentence and I will tell you exactly what I would build to stop the leak — and roughly what it saves you.";
}

export default function Home() {
  const [ragOpen, setRagOpen] = useState(false);
  const [ragSent, setRagSent] = useState(false);
  const [filter, setFilter] = useState("all");
  const [input, setInput] = useState("");
  const [thread, setThread] = useState<ChatMsg[]>([
    { role: "me", text: "Hi, I'm ME — Aurangzeb's AI twin. Tell me what's slowing your business down and I'll answer as him, in first person." },
  ]);
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: "smooth" });
  }, [thread]);

  const ask = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setThread((cur) => [...cur, { role: "user", text: clean }, { role: "me", text: "thinking..." }]);
    setInput("");
    try {
      const baseUrl = (import.meta as any).env?.VITE_RAG_BASE_URL || "http://localhost:8000";
      const res = await fetch(baseUrl + "/talk", {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ message: clean })
      });
      const data = await res.json();
      setThread((cur) => cur.slice(0, -1).concat({ role: "me", text: data.reply || "I couldn't process that right now." }));
    } catch (e) {
      setThread((cur) => cur.slice(0, -1).concat({ role: "me", text: "I'm having trouble connecting to my brain right now. Please email Aurangzeb directly." }));
    }
  };
  const askEvent = (e: FormEvent) => { e.preventDefault(); ask(input); };
  const submitRag = (e: FormEvent) => { e.preventDefault(); setRagSent(true); };
  const goToChat = () => document.getElementById("me-chat")?.scrollIntoView({ behavior: "smooth", block: "center" });
  const shown = filter === "all" ? projects : projects.filter((p) => p.cat === filter);
  const filters: Array<[string, string]> = [["all", "All"], ["agent", "AI Agents"], ["web", "Web & RAG"], ["vision", "Computer Vision"]];

  return (
    <>
      <div className="shell" id="top">
        <header className="nav">
          <a className="brand-small" href="#top">Aurangzeb Imran</a>
          <nav className="nav-links">
            <a href="#problems">Problems</a>
            <a href="#service">Services</a>
            <a href="#work">Work</a>
            <a href="#rag">RAG demo</a>
            <a href="#contact">Contact</a>
          </nav>
          <button className="pill pill-dark" onClick={goToChat}>Talk with ME <ArrowUpRight size={15} /></button>
        </header>

        <section className="hero">
          <div className="hero-top">
            <h1 className="hero-name"><span className="outline">Aurangzeb</span><span>Imran</span></h1>
            <div className="avail-badge" aria-label="Available for new projects">
              <svg viewBox="0 0 100 100">
                <defs><path id="circ" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" /></defs>
                <text><textPath href="#circ">AVAILABLE FOR NEW PROJECTS · TWO SLOTS LEFT · </textPath></text>
              </svg>
              <span className="avail-core"><ArrowDownRight size={20} /></span>
            </div>
          </div>
          <div className="hero-grid">
            <div>
              <h2 className="role-title">AI Relief Engineer</h2>
              <p className="role-copy">I remove business pain with practical AI and web systems — assistants, knowledge bases, and automation that actually ship.</p>
              <div className="hero-actions">
                <button className="pill pill-dark" onClick={goToChat}>Talk with ME <ArrowUpRight size={15} /></button>
                <button className="pill pill-ghost" onClick={() => setRagOpen(true)}>Request RAG access</button>
              </div>
              <p className="hero-note">Based in Lahore · working US / UK / AU hours</p>
            </div>
            <div className="me-card" id="me-chat">
              <div className="me-head">
                <span className="me-ava">AI</span>
                <div><strong>ME — Aurangzeb's AI twin</strong><small>Trained on my work · replies instantly</small></div>
              </div>
              <div className="me-msgs" ref={msgsRef}>
                {thread.map((m, i) => (
                  <div className={`me-msg ${m.role === "user" ? "me-msg-user" : ""}`} key={i}>{m.text}</div>
                ))}
              </div>
              <div className="me-chips">{suggestions.map((s) => <button key={s} onClick={() => ask(s)}>{s}</button>)}</div>
              <form className="me-form" onSubmit={askEvent}>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask ME anything — your problem, my work, pricing..." aria-label="Ask ME anything" />
                <button type="submit" aria-label="Send"><ArrowUpRight size={16} /></button>
              </form>
            </div>
            <div className="social-col">
              <a className="pill pill-white" href="https://github.com/aurangzeb200" target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a>
              <a className="pill pill-white" href="https://linkedin.com/in/aurangzeb-malik1" target="_blank" rel="noreferrer"><Linkedin size={15} /> LinkedIn</a>
              <a className="pill pill-white" href="mailto:aurangzebmalik1077@gmail.com"><Mail size={15} /> Email</a>
              <a className="pill pill-white" href="https://wa.me/923122993557" target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a>
            </div>
          </div>
        </section>

        <section className="section" id="problems">
          <span className="ghost">DIAGNOSIS</span>
          <div className="sec-head">
            <p className="sec-kicker">A diagnosis before any prescription.</p>
            <h2 className="sec-title">Where businesses quietly lose money.</h2>
            <p className="sec-sub">Every engagement starts here. These four leaks show up in almost every small business I audit — and each one has a practical, proven fix.</p>
          </div>
          <div className="diag-grid">
            {problems.map((p) => { const Icon = p.icon; return (
              <div className="diag-card" key={p.tag}>
                <div className="diag-top"><span>{p.tag}</span><Icon size={18} strokeWidth={1.5} /></div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
                <div className="outcome"><ArrowRight size={14} /> {p.outcome}</div>
              </div>
            ); })}
          </div>
        </section>

        <section className="section" id="service">
          <span className="ghost">SERVICE</span>
          <div className="sec-head">
            <p className="sec-kicker">No packages, no retainers-forced-on-you.</p>
            <h2 className="sec-title">Built around your problem.</h2>
            <p className="sec-sub">Hover a line to see what it actually means for your business.</p>
          </div>
          <div className="svc-list">
            {services.map((s) => (
              <div className="svc-row" key={s.title} tabIndex={0}>
                <span className="svc-line"><strong>{s.title}</strong><ArrowUpRight className="svc-arrow" size={24} strokeWidth={1.6} /></span>
                <span className="svc-body"><p>{s.body}</p><span className="svc-tags">{s.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</span></span>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="work">
          <span className="ghost">PORTFOLIO</span>
          <div className="sec-head"><h2 className="sec-title">Work that makes the case.</h2></div>
          <div className="work-bar">
            <div className="work-tabs">{filters.map(([key, label]) => <button key={key} className={filter === key ? "on" : ""} onClick={() => setFilter(key)}>{label}</button>)}</div>
            <a className="pill pill-white" href="https://github.com/aurangzeb200" target="_blank" rel="noreferrer">View All Work <ArrowUpRight size={14} /></a>
          </div>
          <div className="work-grid">
            {shown.map((p) => { const Icon = p.icon; return (
              <article className="work-card" key={p.title}>
                <div className="wc-visual"><span className="wc-tag">{p.tag}</span><div className="wc-glyph"><Icon size={34} strokeWidth={1.3} /></div><ArrowUpRight className="wc-arrow" size={18} /></div>
                <div className="wc-body"><h3>{p.title}</h3><div className="wc-meta"><span className="tag">{p.type}</span><span className="tag">{p.stack}</span><span className="tag">{p.year}</span></div></div>
              </article>
            ); })}
          </div>
        </section>

        <section className="section" id="rag">
          <span className="ghost">LIVE RAG</span>
          <div className="proof">
            <div>
              <h2 className="sec-title">Try the RAG system.</h2>
              <p className="sec-sub">A working retrieval-augmented generation build: ingestion, semantic search, and answers with visible source context — not a screenshot of one.</p>
              <div className="rag-modes">
                <div className="rag-mode"><strong>Live backend</strong><small>Connected to my local RAG server through a secure tunnel — upload a PDF or ask the indexed documents anything.</small><button className="pill pill-dark" onClick={() => document.getElementById("rag-input")?.focus()}>Ask the documents <ArrowUpRight size={14} /></button></div>
                <div className="rag-mode"><strong>Private test</strong><small>Need a dedicated workspace for sensitive files? Request one and I will set it up.</small><button className="pill pill-ghost" onClick={() => setRagOpen(true)}>Request access <ArrowUpRight size={14} /></button></div>
              </div>
              <small className="rag-note">Full tests are approved manually to keep the demo safe and stable.</small>
            </div>
            <LiveRagDemo />
          </div>
        </section>

        <section className="section" id="method">
          <span className="ghost">PROCESS</span>
          <div className="sec-head"><h2 className="sec-title">How the relief happens.</h2></div>
          <div className="method-list">
            {methodSteps.map(([t, b]) => (
              <div className="method-item" key={t}><span className="method-dot" /><div><h3>{t}</h3><p>{b}</p></div></div>
            ))}
          </div>
        </section>

        <div className="exp-wrap" id="experience">
          <div className="exp-panel">
            <span className="exp-ghost">EXPERIENCE</span>
            <div className="exp-head"><h2>/EXPERIENCE</h2><span>2 internships · shipped real systems</span></div>
            {experience.map(([o, r, w]) => (
              <div className="exp-row" key={o}><div><strong>{o}</strong><em>{r}</em></div><span className="when">{w}</span></div>
            ))}
          </div>
        </div>

        <section className="section" id="questions">
          <span className="ghost">FAQ</span>
          <div className="sec-head"><h2 className="sec-title">Questions, answered.</h2></div>
          <div className="qa-grid">{faqs.map(([q, a]) => <div className="qa-item" key={q}><h3>{q}</h3><p>{a}</p></div>)}</div>
        </section>

        <section className="cta" id="contact">
          <h2>HAVE A PROBLEM IN MIND?</h2>
          <p>Talk to ME first. If ME convinces you, we build. If it doesn't, I join personally and we talk it through — either way, you leave with a plan.</p>
          <div className="cta-actions">
            <button className="pill pill-dark" onClick={goToChat}>Talk with ME <ArrowUpRight size={15} /></button>
            <button className="pill pill-ghost" onClick={() => setRagOpen(true)}>Request RAG access</button>
          </div>
        </section>

        <footer className="footer">
          <span className="me-pill"><span className="ava">AI</span> Aurangzeb Imran</span>
          <span className="footer-spacer" />
          <a className="pill pill-white" href="https://github.com/aurangzeb200" target="_blank" rel="noreferrer"><Github size={14} /> GitHub</a>
          <a className="pill pill-white" href="https://linkedin.com/in/aurangzeb-malik1" target="_blank" rel="noreferrer"><Linkedin size={14} /> LinkedIn</a>
          <a className="pill pill-white" href="mailto:aurangzebmalik1077@gmail.com"><Mail size={14} /> Email</a>
          <a className="pill pill-white" href="https://wa.me/923122993557" target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a>
        </footer>
        <div className="footer-bottom">
          <span>© 2026 Aurangzeb Imran — Lahore, Pakistan</span>
          <span>Practical AI · Web systems · Real relief — <a href="#top">back to top ↑</a></span>
        </div>
      </div>

      <button className="fab" onClick={goToChat} aria-label="Go to ME chat"><span className="ic"><Bot size={17} /></span> Talk with ME</button>

      {ragOpen && (
        <div className="overlay center" onClick={() => setRagOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Request RAG demo access">
            <div className="d-head">
              <div><span className="kicker">LIVE RAG DEMO</span><h3>{ragSent ? "Request received." : "Request access."}</h3></div>
              <button className="icon-btn" onClick={() => setRagOpen(false)} aria-label="Close access form"><X size={17} /></button>
            </div>
            {ragSent ? (
              <div className="success">
                <span className="ok"><Check size={24} /></span>
                <p>I will review your request. If approved, you will receive a notification with demo access details.</p>
                <button className="pill pill-dark" onClick={() => { setRagOpen(false); setRagSent(false); }}>Done <ArrowUpRight size={14} /></button>
              </div>
            ) : (
              <form className="form" onSubmit={submitRag}>
                <p className="form-note">Tell me a little about your use case. I review each request manually to keep the demo stable and safe.</p>
                <label>Name<input required placeholder="Your name" /></label>
                <label>Email or WhatsApp<input required placeholder="How should I reach you?" /></label>
                <label>Business or role<input required placeholder="What do you do?" /></label>
                <label>What problem needs relief?<textarea required rows={2} placeholder="The pain point you want to explore..." /></label>
                <button className="pill pill-dark" type="submit">Request access <ArrowUpRight size={14} /></button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
