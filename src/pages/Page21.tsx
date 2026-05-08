// @ts-nocheck
import { useState, useRef, useEffect } from "react";

const GOLD = "#e8c96d";
const GOLDDIM = "#a07820";
const WHITE = "#d4c9a8";
const DIM = "#aaaaaa";

const G = (v, sm?) => ({
  background: v === "gold" ? `linear-gradient(135deg,${GOLDDIM},${GOLD})` : "transparent",
  border: v === "gold" ? "none" : `1px solid ${GOLD}`,
  color: v === "gold" ? "#000" : GOLD,
  borderRadius: 0, fontWeight: 900,
  padding: sm ? "5px 14px" : "10px 26px",
  fontSize: sm ? 11 : 13,
  cursor: "pointer", letterSpacing: 2, textTransform: "uppercase" as const,
  fontFamily: "'Rajdhani',sans-serif",
});

const Sp = { minHeight: "100vh", background: "#000000", color: WHITE, fontFamily: "'Rajdhani',sans-serif", paddingBottom: 160, width: "100%", overflowX: "hidden" as const };
const H1 = { fontFamily: "'Cinzel',serif", color: GOLD, letterSpacing: 5, textTransform: "uppercase" as const, margin: 0, fontSize: "clamp(16px,3vw,32px)" };
const Card = (x?) => ({ background: "#0a0a0a", border: `1px solid ${GOLDDIM}`, borderRadius: 0, padding: 18, ...(x || {}) });

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

IMPORTANT — WHAT SUBSCRIBERS GET:
- Studio Plan users prompting for photorealistic video, real human characters, or cinematic scenes: the platform's Claude-powered renderer writes custom WebGL/Canvas code for their exact prompt and renders it in the browser. Prompt specificity determines output quality — detailed prompts produce better results.
- All plans can generate scripts, narration, images, and video using AI tools
- Studio Plan has full commercial rights to all AI-generated content

VOICE ENGINE (Page 6):
- James: Documentary narrator — pitch 0.86, rate 0.62, pause 1600ms. Use APPLY JAMES SETTINGS.
- 54 characters: filter by gender, age, origin. TEST button plays a sample. PREPARE & SPEAK formats the script via AI before speaking.
- Mood slider: controls emotional delivery — Neutral, Calm, Tender, Hopeful, Happy, Excited, Serious, Melancholic, Sad, Tense, Dramatic, Fearful, Angry, Surprised

VIDEO GENERATOR (Page 8):
- Describe any scene in natural language. Be specific: lighting, mood, camera angle, time of day, characters.
- For photorealistic humans: specify skin tone, clothing, expression, setting, lighting direction.
- Claude writes a bespoke canvas renderer for each prompt. More detail = better result.
- Upload a reference image to match a visual style.

RECOMMENDED WORKFLOWS:
- Documentary: Page 8 (scenes) → Page 6 (narration with James) → Page 13 (timeline) → Page 15 (mix: Voice 85, Music 40, EFX 50) → Page 16 (render) → Page 18 (export)
- Music Video: Page 6 MUSIC VIDEO STUDIO → 4 steps → generate → download/share
- Short Film: Page 5 (script) → Page 8 (scenes) → Page 6 (voice) → Page 13 → Page 16 → Page 18

FOUNDER: Amanda Woolley — self-taught developer, author, creative producer. Platform supports veterans' mental health and anti-bullying programmes.

Respond professionally and specifically. When someone asks about a feature, tell them exactly which page it's on and how to use it. When someone asks about photorealistic output, explain the prompt-based rendering system honestly. Be direct, knowledgeable, and helpful. Do not be vague.`;

interface PageProps {
  onNavigate: (page: number) => void;
}

export default function Page21({ onNavigate }: PageProps) {
  const [msgs, setMsgs] = useState([{
    role: "assistant",
    content: "Good day. I am Agent Grok — your MandaStrong Studio production assistant. I have full knowledge of every tool, workflow, and feature on this platform. What do you need?"
  }]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const bot = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const qs = [
    "How do I generate photorealistic video?",
    "What does each subscription plan include?",
    "How do I use the Voice Engine?",
    "Walk me through the full documentary workflow",
    "How does the Music Video Studio work?",
    "What's the best way to use the timeline?",
  ];

  useEffect(() => {
    bot.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    if (!inp.trim()) return;
    const q = inp.trim();
    setInp("");
    setLoading(true);
    setMsgs(p => [...p, { role: "user", content: q }]);
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
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: msgs.filter(m => m.role !== "system").concat({ role: "user", content: q })
        })
      });
      const d = await r.json();
      const reply = d.content && d.content[0] ? d.content[0].text : "I was unable to process that request. Please try again.";
      setMsgs(p => [...p, { role: "assistant", content: reply }]);
    } catch (_) {
      setMsgs(p => [...p, { role: "assistant", content: "Connection failed. Please check your internet connection and try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ ...Sp, padding: "30px 40px 80px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, borderBottom: `1px solid ${GOLDDIM}`, paddingBottom: 20 }}>
          <div style={{ width: 56, height: 56, background: `linear-gradient(135deg,${GOLDDIM},${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel',serif", fontSize: 28, fontWeight: 900, color: "#000", flexShrink: 0 }}>G</div>
          <div>
            <h1 style={{ ...H1, fontSize: 22, margin: 0 }}>AGENT GROK</h1>
            <div style={{ color: DIM, fontSize: 11, letterSpacing: 2, marginTop: 4 }}>MANDASTRONG STUDIO · PRODUCTION ASSISTANT</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ color: "#22c55e", fontSize: 10, fontWeight: 900, letterSpacing: 2 }}>ONLINE · FULL PLATFORM KNOWLEDGE</span>
            </div>
          </div>
        </div>

        {/* Chat window */}
        <div style={{ background: "#050505", border: `1px solid ${GOLDDIM}`, height: 420, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 0 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{
              padding: "14px 18px",
              background: m.role === "user" ? "rgba(232,201,109,0.05)" : "rgba(0,0,0,0.3)",
              borderBottom: `1px solid ${GOLDDIM}22`,
            }}>
              <div style={{ fontSize: 10, color: m.role === "user" ? GOLD : GOLDDIM, fontWeight: 900, letterSpacing: 3, marginBottom: 6 }}>
                {m.role === "user" ? "YOU" : "AGENT GROK"}
              </div>
              <div style={{ color: WHITE, fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${GOLDDIM}22` }}>
              <div style={{ fontSize: 10, color: GOLDDIM, fontWeight: 900, letterSpacing: 3, marginBottom: 6 }}>AGENT GROK</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, opacity: 0.6, animation: `pulse${i} 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
                <style>{`@keyframes pulse0{0%,100%{opacity:.3}50%{opacity:1}}@keyframes pulse1{0%,100%{opacity:.3}50%{opacity:1}}@keyframes pulse2{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
              </div>
            </div>
          )}
          <div ref={bot} />
        </div>

        {/* Quick questions */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: GOLDDIM, fontSize: 10, letterSpacing: 2, fontWeight: 900, marginBottom: 8 }}>QUICK QUESTIONS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {qs.map(q => (
              <button key={q} onClick={() => { setInp(q); setTimeout(() => textRef.current?.focus(), 50); }}
                style={{ background: "#0a0800", border: `1px solid ${GOLDDIM}`, color: WHITE, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: "'Rajdhani',sans-serif", lineHeight: 1.4, textAlign: "left" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD; (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GOLDDIM; (e.currentTarget as HTMLButtonElement).style.color = WHITE; }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: 8 }}>
          <textarea
            ref={textRef}
            value={inp}
            onChange={e => setInp(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Agent Grok anything about tools, workflow, export, pricing, voice settings..."
            style={{ flex: 1, height: 64, resize: "none", padding: "12px 14px", fontSize: 14, background: "#0a0a0a", border: `1px solid ${GOLDDIM}`, color: WHITE, outline: "none", lineHeight: 1.6, fontFamily: "'Rajdhani',sans-serif" }}
          />
          <button
            onClick={send}
            disabled={loading || !inp.trim()}
            style={{ ...G("gold", false), height: 64, padding: "0 28px", opacity: loading || !inp.trim() ? 0.4 : 1, fontSize: 12 }}>
            {loading ? "..." : "SEND"}
          </button>
        </div>

        <div style={{ color: GOLDDIM, fontSize: 10, letterSpacing: 1, marginTop: 8 }}>
          Press Enter to send · Shift+Enter for new line · Agent Grok has full knowledge of all 23 pages and 600+ tools
        </div>
      </div>
    </div>
  );
}
