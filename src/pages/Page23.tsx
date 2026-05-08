// @ts-nocheck
import { useState } from "react";

const GOLD = "#e8c96d";
const GOLDDIM = "#a07820";
const WHITE = "#d4c9a8";

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
const Card = (x?) => ({ background: "#0a0a0a", border: `1px solid ${GOLDDIM}`, borderRadius: 0, padding: 18, ...(x || {}) });

interface PageProps {
  onNavigate: (page: number) => void;
}

const HOW_TO = [
  { t: "GETTING STARTED", c: "Use the menu to jump to any of the 23 pages. Hit SAVE PROJECT in the footer at any time. MY PROJECTS restores exactly where you left off. Works on desktop, tablet, and mobile." },
  { t: "PAGE 1 — HOME", c: "Your starting point. ENTER STUDIO to begin. Quick access to all tools from the dashboard." },
  { t: "PAGE 2 — QUICK ACCESS", c: "Dashboard overview — jump to any tool section instantly. See your recent work." },
  { t: "PAGE 3 — AI TOOLS HUB", c: "600+ filmmaking tools across Writing, Image, Motion & VFX, Enhancement. Browse and launch any tool." },
  { t: "PAGE 4 — LOGIN & PRICING", c: "Creator $20/mo · Pro $30/mo · Studio $50/mo with 7-day free trial. Sign in, create account, or browse as guest. Stripe handles all payments securely." },
  { t: "PAGE 5 — WRITING TOOLS", c: "50+ AI writing tools. Loglines, treatments, feature scripts, episode arcs, character bibles, dialogue, scene rewrites. Hit AI CREATE to generate any format instantly." },
  { t: "PAGE 6 — VOICE ENGINE", c: "54 voice characters. Filter by gender, age, origin. Hit TEST to hear any voice. Set PITCH, RATE, PAUSE, VOLUME sliders. Use the MOOD slider across 14 moods. Hit APPLY JAMES SETTINGS for documentary narration (pitch 0.86, rate 0.62, pause 1600ms). PREPARE & SPEAK AI-formats your script before speaking." },
  { t: "PAGE 6 — MUSIC VIDEO STUDIO", c: "4-step wizard. Step 1: title, artist, genre, mood, tempo, upload audio. Step 2: video style, colour grade, effects, edit style. Step 3: describe your scene in detail. Step 4: generate, download, and share." },
  { t: "PAGE 7 — IMAGE TOOLS", c: "AI image generation, style transfer, upscaling, background removal. Generate reference images for your production." },
  { t: "PAGE 8 — VIDEO GENERATOR", c: "Describe any scene in natural language. Be specific — lighting, mood, camera angle, time of day, characters, setting. Claude writes a custom canvas renderer for each prompt. Upload a reference image to match a visual style. Every clip saves to your Media Library." },
  { t: "PAGE 9 — VFX TOOLS", c: "Motion graphics, transitions, titles, colour grading. Add professional visual effects to your scenes." },
  { t: "PAGE 10 — ENHANCEMENT", c: "Upscale, sharpen, denoise, and enhance any footage or image in your project." },
  { t: "PAGE 11 — ASSET MANAGER", c: "All your uploads and generated clips in one place. Preview, rename, delete, and organise your media library." },
  { t: "PAGE 12 — STORYBOARD", c: "Build a visual storyboard from your scenes. Rearrange shots, add notes, plan your production shot by shot." },
  { t: "PAGE 13 — TIMELINE EDITOR", c: "Drag clips to video, voice, music, and effects tracks. Hit SYNC ALL TRACKS to auto-populate from your Media Library. Set film duration: 60, 90, or 180 minutes. Hit RENDER when your timeline is ready." },
  { t: "PAGE 14 — COLOUR GRADE", c: "Cinematic colour grading tools. Apply LUTs, adjust tone, contrast, and colour temperature across your whole timeline." },
  { t: "PAGE 15 — AUDIO MIXER", c: "Documentary: VOICE 85, MUSIC 40, EFX 50, MASTER 85. Music video: MUSIC 75, VOICE 60, EFX 40, MASTER 85. Save presets for future projects." },
  { t: "PAGE 16 — RENDER ENGINE", c: "Choose quality: 1080p (Creator Plan), 4K (Pro Plan), 8K (Studio Plan). VP9 codec gives better quality at the same file size. The engine auto-regenerates any missing clips. Hit START RENDER when ready." },
  { t: "PAGE 17 — PREVIEW", c: "Full preview of your rendered film before final export. Review chapters, check audio sync, and approve before distribution." },
  { t: "PAGE 18 — EXPORT & DISTRIBUTE", c: "Download your completed film. Share directly to YouTube, TikTok, Instagram, Facebook, LinkedIn, Vimeo, and WhatsApp from inside the platform." },
  { t: "PAGE 19 — TUTORIALS", c: "12 step-by-step video tutorials covering every part of the platform. Click any tutorial to expand and watch inline. Each includes pro tips for that lesson." },
  { t: "PAGE 20 — ABOUT & LEGAL", c: "Who built this platform, why it exists, terms of service, and disclaimer. Honest information about what the AI does and what each subscriber plan receives." },
  { t: "PAGE 21 — AGENT GROK", c: "Your AI studio assistant. Ask anything about tools, workflow, pricing, voice settings, export, or production. Full platform knowledge. Available 24/7." },
  { t: "WORKFLOW — DOCUMENTARY", c: "Page 8 (generate scenes) → Page 6 (narration with James) → Page 13 (timeline) → Page 15 (audio mix) → Page 16 (render) → Page 18 (export)" },
  { t: "WORKFLOW — SHORT FILM", c: "Page 5 (script) → Page 8 (scenes) → Page 6 (voice) → Page 13 (timeline) → Page 16 (render) → Page 18 (export)" },
  { t: "WORKFLOW — MUSIC VIDEO", c: "Page 6 → MUSIC VIDEO STUDIO → 4 steps → generate → download and share to all platforms" },
];

export default function Page23({ onNavigate }: PageProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div style={{ ...Sp, padding: 0, position: "relative" }}>
      {/* Ambient background video */}
      <video
        autoPlay loop playsInline preload="auto" muted
        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.15, zIndex: 0, pointerEvents: "none" }}
        onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = "none"; }}
      >
        <source src="./background.mp4" type="video/mp4" />
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* Content layer */}
      <div style={{ position: "relative", zIndex: 1, padding: "26px 40px 80px" }}>
        {/* Closing film video */}
        <video
          autoPlay loop playsInline preload="auto" muted
          style={{ width: "100%", aspectRatio: "16/9", background: "#000", border: `1px solid ${GOLD}`, marginBottom: 24, display: "block" }}
          onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = "none"; }}
        >
          <source src="./thatsallfolks.mp4" type="video/mp4" />
          <source src="/thatsallfolks.mp4" type="video/mp4" />
          <source src="thatsallfolks.mp4" type="video/mp4" />
        </video>

        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: GOLD, letterSpacing: 6, marginBottom: 10, fontWeight: 700 }}>MANDASTRONG STUDIO · CINEMA INTELLIGENCE PLATFORM · 2026</div>
          <h1 style={{ fontFamily: "'Cinzel',serif", color: GOLD, fontSize: "clamp(22px,3vw,32px)", fontWeight: 900, letterSpacing: 5, textShadow: `0 0 30px ${GOLD}99`, marginBottom: 6 }}>THAT'S ALL FOLKS</h1>
          <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${GOLD},transparent)`, marginBottom: 24 }} />

          {/* Letter */}
          <div style={{ ...Card(), textAlign: "left", marginBottom: 16, background: "rgba(5,5,0,0.95)", border: `2px solid ${GOLD}` }}>
            <div style={{ color: GOLD, fontWeight: 900, fontSize: 14, letterSpacing: 3, marginBottom: 14, textAlign: "center" }}>✦ A LETTER TO THE CREATORS OF TODAY AND FOR THE FUTURE ✦</div>
            <p style={{ color: WHITE, fontSize: 14, lineHeight: 2, margin: "0 0 12px 0" }}>
              To every creator who has ever had a story burning inside them and not known how to get it out — this platform is for you. Whether you are a first-time filmmaker, a veteran with decades of lived experience, a teacher trying to reach a classroom, or someone who simply wants to leave something behind — your story matters. You matter.
            </p>
            <p style={{ color: WHITE, fontSize: 14, lineHeight: 2, margin: "0 0 12px 0" }}>
              MandaStrong Studio was built with one belief: <strong style={{ color: GOLD }}>that every person deserves the tools to tell their story.</strong> Not just the wealthy. Not just the technically gifted. Everyone. To the creators of today — thank you. To the creators of the future — welcome.
            </p>
            <p style={{ color: GOLD, fontWeight: 900, fontSize: 13, letterSpacing: 2, margin: 0 }}>— AMANDA WOOLLEY · FOUNDER · MANDASTRONG STUDIO</p>
          </div>

          {/* Mission */}
          <div style={{ ...Card(), textAlign: "left", marginBottom: 16, background: "rgba(5,5,5,0.95)", border: `1px solid ${GOLD}` }}>
            <div style={{ color: GOLD, fontWeight: 900, fontSize: 14, letterSpacing: 3, marginBottom: 14, textAlign: "center" }}>✦ OUR MISSION ✦</div>
            <p style={{ color: WHITE, fontSize: 14, lineHeight: 2, margin: "0 0 12px 0" }}>
              I am Amanda Woolley — author, creative producer, and founder of MandaStrong Studio. I built this platform because I believe technology should serve humanity, and art should serve truth. MandaStrong Studio supports two causes: <strong style={{ color: GOLD }}>veterans' mental health</strong> and <strong style={{ color: GOLD }}>anti-bullying programmes in schools</strong>.
            </p>
            <p style={{ color: WHITE, fontSize: 14, lineHeight: 2, margin: 0 }}>
              We give creators access to <strong style={{ color: GOLD }}>600+ AI filmmaking tools</strong>, a full production pipeline, and films up to 3 hours long — on any device.
            </p>
          </div>

          {/* Collapsible full guide */}
          <div
            onClick={() => setGuideOpen((g) => !g)}
            style={{ ...Card(), marginBottom: guideOpen ? 0 : 16, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", border: `2px solid ${GOLD}`, background: "rgba(10,8,0,0.97)" }}
          >
            <span style={{ color: GOLD, fontWeight: 900, fontSize: 14, letterSpacing: 3 }}>MANDASTRONG STUDIO — COMPLETE HOW TO USE GUIDE</span>
            <span style={{ color: GOLD, fontSize: 18 }}>{guideOpen ? "▲" : "▼"}</span>
          </div>
          {guideOpen && (
            <div style={{ ...Card(), textAlign: "left", marginBottom: 16, padding: "24px 28px", border: `2px solid ${GOLD}`, borderTopWidth: 0, background: "rgba(5,5,0,0.97)" }}>
              {HOW_TO.map(({ t, c }) => (
                <div key={t} style={{ borderBottom: `1px solid ${GOLDDIM}33`, paddingBottom: 12, marginBottom: 12 }}>
                  <div style={{ color: GOLD, fontWeight: 900, fontSize: 12, letterSpacing: 2, marginBottom: 4 }}>✦ {t}</div>
                  <div style={{ color: WHITE, fontSize: 13, lineHeight: 1.8 }}>{c}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
            <button onClick={() => onNavigate(4)} style={{ ...G("gold", false) }}>START CREATING</button>
            <button onClick={() => window.open("https://MandaStrong1.Etsy.com", "_blank")} style={{ ...G("out", false) }}>VISIT ETSY STORE</button>
            <button onClick={() => onNavigate(1)} style={{ ...G("out", false) }}>EXIT APP</button>
          </div>
        </div>
      </div>
    </div>
  );
}
