import { FormEvent, useEffect, useRef, useState } from "react";
import { AlertTriangle, FileSearch, Send, Upload } from "lucide-react";
import { ask, health, listDocs, uploadPdf, type RagDoc } from "../lib/ragApi";

type Msg = { role: "user" | "ai"; text: string; sources?: string[] };

export default function LiveRag() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [docs, setDocs] = useState<RagDoc[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const ok = await health();
      setOnline(ok);
      if (ok) setDocs(await listDocs());
    })();
  }, []);
  useEffect(() => { boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const text = q.trim();
    if (!text || busy) return;
    setQ(""); setBusy(true);
    setMsgs((m) => [...m, { role: "user", text }]);
    try {
      const a = await ask(text);
      setMsgs((m) => [...m, { role: "ai", text: a.answer || "The backend returned an empty answer.", sources: a.sources }]);
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "The RAG tunnel did not answer. Make sure the local backend and ngrok are running, or request a private test below." }]);
    }
    setBusy(false);
  };

  const onFile = async (f: File | null) => {
    if (!f) return;
    setBusy(true);
    try {
      const msg = await uploadPdf(f);
      setMsgs((m) => [...m, { role: "ai", text: msg + " — indexed and ready to question." }]);
      setDocs(await listDocs());
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "Upload failed — the backend upload endpoint is not reachable right now." }]);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="lr-card">
      <div className="lr-bar">
        <i className={online ? "on" : ""} />
        <small>rag / live backend</small>
        <span className="lr-status">{online === null ? "connecting…" : online ? "tunnel online" : "tunnel offline"}</span>
      </div>
      {online === false && (
        <div className="lr-offline"><AlertTriangle size={14} /> Backend tunnel not reachable from this browser. Start the Flask backend + ngrok, or request a private test.</div>
      )}
      <div className="lr-body">
        <div className="lr-docs">
          <span className="lr-docs-title">indexed documents</span>
          {docs.length === 0 && <span className="lr-doc-empty">no documents yet — upload a PDF</span>}
          {docs.map((d) => <span className="lr-doc" key={d.name}><FileSearch size={14} /> {d.name}</span>)}
          <button className="lr-upload" onClick={() => fileRef.current?.click()}><Upload size={14} /> upload pdf</button>
          <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />
        </div>
        <div className="lr-chat" ref={boxRef}>
          {msgs.length === 0 && <span className="lr-hint">Ask anything about the indexed documents — answers come back with source citations.</span>}
          {msgs.map((m, i) => (
            <div className={`lr-msg ${m.role === "user" ? "lr-msg-user" : ""}`} key={i}>
              {m.text}
              {m.sources && m.sources.length > 0 && <span className="lr-srcs">{m.sources.map((s) => <em key={s}>source: {s}</em>)}</span>}
            </div>
          ))}
          {busy && <span className="lr-thinking">searching vectors…</span>}
        </div>
      </div>
      <form className="lr-form" onSubmit={submit}>
        <input id="rag-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask the documents anything…" disabled={!online} />
        <button type="submit" disabled={!online || busy}><Send size={15} /></button>
      </form>
    </div>
  );
}
