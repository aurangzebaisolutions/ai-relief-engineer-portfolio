const BASE = ((import.meta as any).env?.VITE_RAG_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const H: Record<string, string> = { "ngrok-skip-browser-warning": "true" };

export type RagDoc = { name: string; id?: string; pages?: number };
export type RagAnswer = { answer: string; sources: string[] };

async function getJson(path: string) {
  const r = await fetch(BASE + path, { headers: H });
  if (!r.ok) throw new Error("GET " + path + " -> " + r.status);
  return r.json();
}
async function postJson(path: string, body: unknown) {
  const r = await fetch(BASE + path, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error("POST " + path + " -> " + r.status);
  return r.json();
}

export async function health(): Promise<boolean> {
  for (const p of ["/health", "/"]) { try { await getJson(p); return true; } catch { /* try next */ } }
  return false;
}

export async function listDocs(): Promise<RagDoc[]> {
  for (const p of ["/documents", "/docs", "/files"]) {
    try {
      const j = await getJson(p);
      const arr = Array.isArray(j) ? j : j.documents || j.docs || j.files || [];
      return arr.map((d: any) => ({ name: typeof d === "string" ? d : d.name || d.filename || d.title || "document", id: d.id, pages: d.pages })).slice(0, 12);
    } catch { /* try next */ }
  }
  return [];
}

function pickAnswer(j: any): RagAnswer {
  const answer = j.answer ?? j.response ?? j.result ?? j.output ?? j.text ?? j.reply ?? "";
  const srcRaw = j.sources || j.citations || j.source_documents || j.contexts || [];
  const sources = (Array.isArray(srcRaw) ? srcRaw : []).map((s: any) => (typeof s === "string" ? s : s.source || s.name || s.filename || "")).filter(Boolean);
  return { answer: String(answer), sources: [...new Set(sources)] as string[] };
}

export async function ask(question: string): Promise<RagAnswer> {
  const paths = ["/query", "/ask", "/chat", "/search", "/qa"];
  const bodies = [{ query: question }, { question }, { text: question }, { message: question }];
  let lastErr = "";
  for (const p of paths) for (const b of bodies) {
    try { const j = await postJson(p, b); const a = pickAnswer(j); if (a.answer) return a; } catch (e: any) { lastErr = String(e?.message || e); }
  }
  throw new Error("No working query endpoint (" + lastErr + ")");
}

export async function uploadPdf(file: File): Promise<string> {
  for (const p of ["/upload", "/ingest", "/documents"]) {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(BASE + p, { method: "POST", headers: H, body: fd });
      if (r.ok) return "Uploaded " + file.name;
    } catch { /* try next */ }
  }
  throw new Error("Upload endpoint not reachable");
}
