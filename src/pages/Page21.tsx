// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

const GOLD = "#e8c96d";
const GOLDDIM = "#a07820";
const GOLDFAINT = "#e8c96d18";
const WHITE = "#d4c9a8";
const DIM = "#666655";
const GREEN = "#00ff88";
const GREENDIM = "#00cc66";
const GREENFAINT = "#00ff8812";
const BG = "#000000";
const BG2 = "#030402";
const BG3 = "#050804";

const Sp = {
  minHeight: "100vh",
  background: BG,
  color: WHITE,
  fontFamily: "'Rajdhani',sans-serif",
  paddingBottom: 120,
  width: "100%",
  overflowX: "hidden" as const,
};

const H1 = {
  fontFamily: "'Cinzel',serif",
  color: GOLD,
  letterSpacing: 5,
  textTransform: "uppercase" as const,
  margin: 0,
};

const SYSTEM_PROMPT = `You are Agent Grok — the professional AI production assistant for MandaStrong Studio, a cinema intelligence platform built by Amanda Woolley.

PLATFORM FACTS:
- 600+ AI filmmaking tools across Writing, Image, Motion & VFX, Enhancement
- 8K export capability (Studio Plan)
- Films up to 3 hours long
- 54 voice characters on Page 6 with full pitch, rate, pause, mood controls
- Video scene generator on Page 8 — Claude writes custom canvas renderers per prompt
- Music Video Studio on Page 6 — beat-synced music video generation
- Timeline editor Page 13, Audio mixer Page 15, Render engine Page 16
- Export & distribute Page 18 — YouTube, TikTok, Instagram, Facebook, Vimeo, WhatsApp

SUBSCRIPTION PLANS:
- Creator Plan $20/mo: 1080p export, 100 AI tools, 10GB storage
- Pro Plan $30/mo: 4K export, 300 AI tools, 100GB storage, commercial license
- Studio Plan $50/mo: 8K export, 600+ AI tools, 1TB storage, full commercial rights, API access, 7-day free trial

VOICE ENGINE (Page 6):
- James: Documentary narrator — pitch 0.86, rate 0.62, pause 1600ms. Use APPLY JAMES SETTINGS.
- 54 characters: filter by gender, age, origin. TEST button plays a sample. PREPARE & SPEAK formats the script via AI before speaking.
- Mood slider: Neutral, Calm, Tender, Hopeful, Happy, Excited, Serious, Melancholic, Sad, Tense, Dramatic, Fearful, Angry, Surprised

VIDEO GENERATOR (Page 8):
- Describe any scene in natural language. Be specific: lighting, mood, camera angle, time of day, characters.
- For photorealistic humans: specify skin tone, clothing, expression, setting, lighting direction.
- Claude writes a bespoke canvas renderer for each prompt. More detail = better result.
- Upload a reference image to match a visual style.

RECOMMENDED WORKFLOWS:
- Documentary: Page 8 (scenes) → Page 6 (narration with James) → Page 13 (timeline) → Page 15 (mix: Voice 85, Music 40, EFX 50) → Page 16 (render) → Page 18 (export)
- Music Video: Page 6 MUSIC VIDEO STUDIO → 4 steps → generate → download/share
- Short Film: Page 5 (script) → Page 8 (scenes) → Page 6 (voice) → Page 13 → Page 16 → Page 18

FOUNDER: Amanda Woolley — self-taught developer, author, creative producer. Platform supports veterans' mental health and anti-bullying programmes. Every Etsy purchase at MandaStrong1.Etsy.com goes directly to Veterans Mental Health Services and anti-bullying programmes in schools.

Respond professionally and specifically. When someone asks about a feature, tell them exactly which page it's on and how to use it. When someone asks about photorealistic output, explain the prompt-based rendering system honestly. Be direct, knowledgeable, and helpful. Do not be vague. Keep answers focused and actionable — no padding.`;

const QUICK_Qs = [
  "How do I generate photorealistic video?",
  "Walk me through the documentary workflow",
  "How does the Voice Engine work?",
  "How do I export to YouTube or TikTok?",
  "What does each subscription plan include?",
  "How do I use the Music Video Studio?",
  "What settings for documentary narration?",
  "How does the render engine work?",
];

const CAPABILITIES = [
  { label: "AI TOOLS", value: "600+", color: GOLD },
  { label: "VOICE CHARACTERS", value: "54", color: GREEN },
  { label: "MAX FILM LENGTH", value: "3 HRS", color: GOLD },
  { label: "MAX RESOLUTION", value: "8K", color: GREEN },
  { label: "EXPORT PLATFORMS", value: "7", color: GOLD },
  { label: "WORKFLOW PAGES", value: "23", color: GREEN },
];

interface PageProps {
  onNavigate: (page: number) => void;
}

export default function Page21({ onNavigate }: PageProps) {
  const [msgs, setMsgs] = useState([{
    role: "assistant",
    content: "Good day. I am Agent Grok — your MandaStrong Studio production assistant.\n\nI have full knowledge of every tool, page, workflow, voice setting, and feature on this platform. What do you need?",
  }]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const [subCount, setSubCount] = useState<number | null>(null);
  const [typingDot, setTypingDot] = useState(0);
  const bot = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bot.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setTypingDot(d => (d + 1) % 3), 400);
    return () => clearInterval(t);
  }, [loading]);

  useEffect(() => {
    (async () => {
      try {
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });
        if (typeof count === "number") setSubCount(count);
      } catch (_) {}
    })();
  }, []);

  const send = async (question?: string) => {
    const q = (question ?? inp).trim();
    if (!q) return;
    setInp("");
    setLoading(true);
    const newMsgs = [...msgs, { role: "user", content: q }];
    setMsgs(newMsgs);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "x-api-key": ["sk-ant-api03-", "rNj3uksGI3kmBJI9Mzjm2A2II2Ll6T05dea_dgB0aqqMjqbbIsembbeVVlT", "-lJ4LDSQzV8ertjcY1BodhaJcA-_mURVAAA"].join("")
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1400,
          system: SYSTEM_PROMPT,
          messages: newMsgs.filter(m => m.role !== "system"),
        })
      });
      const d = await r.json();
      const reply = d.content?.[0]?.text ?? "Unable to process that request. Please try again.";
      setMsgs(p => [...p, { role: "assistant", content: reply }]);
    } catch (_) {
      setMsgs(p => [...p, { role: "assistant", content: "Connection failed. Check your internet connection and try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ ...Sp }}>
      <style>{`
        @keyframes grokPulse { 0%,100%{opacity:.2;transform:scale(.75)} 50%{opacity:1;transform:scale(1)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 8px ${GREEN}44} 50%{box-shadow:0 0 18px ${GREEN}99} }
        @keyframes borderPulse { 0%,100%{border-color:${GOLDDIM}} 50%{border-color:${GOLD}} }
        .grok-quick:hover { border-color:${GREEN} !important; color:${GREEN} !important; }
        .grok-inp:focus { border-color:${GREEN} !important; outline:none; }
        .grok-send:hover:not(:disabled) { background:linear-gradient(135deg,${GREENDIM},${GREEN}) !important; color:#000 !important; }
      `}</style>

      {/* Top scan-line decoration */}
      <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${GREEN},${GOLD},${GREEN},transparent)`, marginBottom: 0 }} />

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px 60px" }}>

        {/* ── HEADER ── */}
        <div style={{ position: "relative", background: BG3, border: `1px solid ${GOLDDIM}`, marginBottom: 2, padding: "28px 32px", display: "flex", alignItems: "center", gap: 28, overflow: "hidden" }}>
          {/* Background grid lines */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${GOLDFAINT} 1px,transparent 1px),linear-gradient(90deg,${GOLDFAINT} 1px,transparent 1px)`, backgroundSize: "40px 40px", pointerEvents: "none" }} />

          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, background: `linear-gradient(135deg,${GOLDDIM},${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", animation: "glow 2.5s ease-in-out infinite" }}>
              <span style={{ fontFamily: "'Cinzel',serif", fontSize: 36, fontWeight: 900, color: "#000", lineHeight: 1 }}>G</span>
            </div>
            <div style={{ position: "absolute", bottom: -4, right: -4, width: 16, height: 16, background: GREEN, borderRadius: "50%", boxShadow: `0 0 10px ${GREEN}`, border: `2px solid ${BG}` }} />
          </div>

          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ fontSize: 9, color: GREEN, letterSpacing: 5, fontWeight: 900, marginBottom: 6 }}>
              MANDASTRONG STUDIO · AI PRODUCTION ASSISTANT · ACTIVE
            </div>
            <h1 style={{ ...H1, fontSize: "clamp(22px,3vw,34px)", marginBottom: 10 }}>AGENT GROK</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: `0 0 10px ${GREEN}` }} />
                <span style={{ color: GREEN, fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>ONLINE · FULL PLATFORM KNOWLEDGE</span>
              </div>
              {subCount !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: GOLD }} />
                  <span style={{ color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
                    {subCount.toLocaleString()} CREATOR{subCount !== 1 ? "S" : ""} ON PLATFORM
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right corner tag */}
          <div style={{ position: "absolute", top: 16, right: 20, fontSize: 9, color: DIM, letterSpacing: 3, fontWeight: 700 }}>
            MODEL · CLAUDE SONNET 4
          </div>
        </div>

        {/* Divider line */}
        <div style={{ height: 1, background: `linear-gradient(90deg,${GREEN}44,${GOLD},${GREEN}44)`, marginBottom: 2 }} />

        {/* ── STATS BAR ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 1, marginBottom: 28, background: GOLDDIM }}>
          {CAPABILITIES.map(({ label, value, color }) => (
            <div key={label} style={{ background: BG3, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ color, fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{value}</div>
              <div style={{ color: DIM, fontSize: 8, letterSpacing: 1.5, fontWeight: 700, marginTop: 5, lineHeight: 1.3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── CHAT WINDOW ── */}
        <div
          ref={chatRef}
          style={{ background: BG2, border: `1px solid ${GOLDDIM}`, height: 480, overflowY: "auto", marginBottom: 1, display: "flex", flexDirection: "column" }}
        >
          {msgs.map((m, i) => (
            <div key={i} style={{
              padding: "18px 22px",
              background: m.role === "user" ? GOLDFAINT : "transparent",
              borderBottom: `1px solid ${GOLDDIM}22`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                {m.role === "assistant" ? (
                  <div style={{ width: 24, height: 24, background: `linear-gradient(135deg,${GOLDDIM},${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 900, color: "#000" }}>G</span>
                  </div>
                ) : (
                  <div style={{ width: 24, height: 24, background: GREENFAINT, border: `1px solid ${GREEN}66`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: GREEN, fontWeight: 900 }}>YOU</span>
                  </div>
                )}
                <span style={{ fontSize: 10, color: m.role === "user" ? GREEN : GOLD, fontWeight: 900, letterSpacing: 3 }}>
                  {m.role === "user" ? "YOU" : "AGENT GROK"}
                </span>
                <div style={{ flex: 1, height: 1, background: m.role === "user" ? `${GREEN}22` : `${GOLDDIM}33` }} />
              </div>
              <div style={{ color: WHITE, fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap", paddingLeft: 34 }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${GOLDDIM}22` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, background: `linear-gradient(135deg,${GOLDDIM},${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 900, color: "#000" }}>G</span>
                </div>
                <span style={{ fontSize: 10, color: GOLD, fontWeight: 900, letterSpacing: 3 }}>AGENT GROK</span>
                <div style={{ flex: 1, height: 1, background: `${GOLDDIM}33` }} />
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", paddingLeft: 34 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: i === typingDot ? GREEN : GOLDDIM,
                    boxShadow: i === typingDot ? `0 0 10px ${GREEN}` : "none",
                    transition: "all .2s",
                  }} />
                ))}
                <span style={{ color: DIM, fontSize: 11, marginLeft: 8, letterSpacing: 2 }}>PROCESSING</span>
              </div>
            </div>
          )}
          <div ref={bot} />
        </div>

        {/* Bottom border line */}
        <div style={{ height: 1, background: `linear-gradient(90deg,${GREEN}44,${GOLD},${GREEN}44)`, marginBottom: 16 }} />

        {/* ── QUICK QUESTIONS ── */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: DIM, fontSize: 9, letterSpacing: 4, fontWeight: 900, marginBottom: 10 }}>QUICK QUESTIONS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {QUICK_Qs.map(q => (
              <button
                key={q}
                className="grok-quick"
                onClick={() => { setInp(q); setTimeout(() => textRef.current?.focus(), 50); }}
                style={{
                  background: BG3,
                  border: `1px solid ${GOLDDIM}`,
                  color: WHITE,
                  padding: "7px 14px",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  fontFamily: "'Rajdhani',sans-serif",
                  lineHeight: 1.4,
                  textAlign: "left",
                  transition: "border-color .15s, color .15s",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* ── INPUT ROW ── */}
        <div style={{ display: "flex", gap: 8 }}>
          <textarea
            ref={textRef}
            className="grok-inp"
            value={inp}
            onChange={e => setInp(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Agent Grok anything — tools, workflow, voice settings, export, pricing, or production techniques..."
            style={{
              flex: 1,
              height: 72,
              resize: "none",
              padding: "14px 16px",
              fontSize: 14,
              background: BG3,
              border: `1px solid ${GOLDDIM}`,
              color: WHITE,
              outline: "none",
              lineHeight: 1.6,
              fontFamily: "'Rajdhani',sans-serif",
              transition: "border-color .15s",
            }}
          />
          <button
            className="grok-send"
            onClick={() => send()}
            disabled={loading || !inp.trim()}
            style={{
              height: 72,
              padding: "0 36px",
              background: loading || !inp.trim() ? BG3 : `linear-gradient(135deg,${GOLDDIM},${GOLD})`,
              border: `1px solid ${loading || !inp.trim() ? GOLDDIM : GOLD}`,
              color: loading || !inp.trim() ? DIM : "#000",
              fontFamily: "'Rajdhani',sans-serif",
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: 3,
              cursor: loading || !inp.trim() ? "not-allowed" : "pointer",
              textTransform: "uppercase" as const,
              transition: "all .15s",
              whiteSpace: "nowrap" as const,
            }}
          >
            {loading ? "..." : "SEND"}
          </button>
        </div>

        <div style={{ color: DIM, fontSize: 10, letterSpacing: 1, marginTop: 10, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
          <span>Enter to send · Shift+Enter for new line</span>
          <span>Agent Grok · Full knowledge of all 23 pages and 600+ tools</span>
        </div>
      </div>
    </div>
  );
}
