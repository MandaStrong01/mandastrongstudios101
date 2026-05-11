// @ts-nocheck
import { useState } from "react";

const GOLD = "#e8c96d";
const GOLDDIM = "#a07820";
const GOLDFAINT = "#e8c96d15";
const WHITE = "#d4c9a8";
const DIM = "#666655";
const GREEN = "#00ff88";
const GREENDIM = "#00cc66";
const BG = "#000000";
const BG2 = "#030402";
const BG3 = "#050804";

const Card = (x?) => ({ background: BG3, border: `1px solid ${GOLDDIM}`, borderRadius: 0, padding: "24px 28px", ...(x || {}) });

const HOW_TO = [
  { t: "GETTING STARTED", c: "Use the Quick Access menu to jump to any of the 23 pages instantly. Hit SAVE PROJECT in the footer at any time — MY PROJECTS restores exactly where you left off, including your timeline and all uploaded files. Works on desktop, tablet, and mobile." },
  { t: "PAGE 1 — HOME", c: "Your starting point. Hit ENTER STUDIO to begin. The dashboard gives you a quick overview of your recent work and fast access to every major tool." },
  { t: "PAGE 2 — QUICK ACCESS", c: "Dashboard overview — jump to any tool section instantly. See your recent work and navigate without scrolling through the full menu." },
  { t: "PAGE 3 — AI TOOLS HUB", c: "600+ professional filmmaking tools across four categories: Writing, Image, Motion & VFX, and Enhancement. Click any tool card to open it in a full modal with prompt fields and AI output." },
  { t: "PAGE 4 — LOGIN & PRICING", c: "Creator $20/mo (1080p) · Pro $30/mo (4K) · Studio $50/mo (8K, films up to 3 hours) — 7-day free trial on Studio. Sign in, create account, or browse as guest. Stripe handles all payments securely." },
  { t: "PAGE 5 — WRITING TOOLS", c: "50+ AI writing tools. Loglines, treatments, feature scripts, episode arcs, character bibles, dialogue, scene rewrites, and documentary narration. Hit AI CREATE to generate any format instantly. Results feed directly into the Voice Engine on Page 6." },
  { t: "PAGE 6 — VOICE ENGINE", c: "54 professional voice characters. Filter by gender, age, and origin. Hit TEST to hear any voice before selecting. Set PITCH, RATE, PAUSE, and VOLUME sliders. Use the MOOD slider across 14 emotional registers. Hit APPLY JAMES SETTINGS for documentary narration (pitch 0.86, rate 0.62, pause 1600ms). Always use PREPARE & SPEAK — it AI-formats your script for the best spoken delivery." },
  { t: "PAGE 6 — MUSIC VIDEO STUDIO", c: "4-step production wizard inside Page 6. Step 1: title, artist, genre, mood, tempo, upload your audio. Step 2: video style, colour grade, effects, edit style. Step 3: describe your scene in detail. Step 4: generate, download, and share directly to YouTube, TikTok, and Instagram." },
  { t: "PAGE 7 — IMAGE TOOLS", c: "AI image generation, style transfer, upscaling, and background removal. Generate reference images for your production or visual assets for titles and thumbnails." },
  { t: "PAGE 8 — VIDEO GENERATOR", c: "Describe any scene in natural language — lighting, mood, camera angle, time of day, characters, and setting. Claude writes a custom canvas renderer for each unique prompt. Upload a reference image to match a visual style. Every generated clip auto-saves to your Media Library. You can also skip this page and upload your own video files directly on Page 13." },
  { t: "PAGE 9 — VFX TOOLS", c: "Motion graphics, transitions, titles, and colour grading effects. Add professional visual effects to any scene in your production." },
  { t: "PAGE 10 — ENHANCEMENT", c: "Upscale, sharpen, denoise, and stabilise any footage or image in your project. Runs on your uploaded or generated files from the Media Library." },
  { t: "PAGE 11 — ASSET MANAGER", c: "Your central media library. All uploaded files and generated clips in one place. Preview, rename, delete, and organise. Files uploaded via UPLOAD MEDIA on Page 13 appear here automatically and persist across sessions." },
  { t: "PAGE 12 — STORYBOARD", c: "Build a visual storyboard from your scenes. Assign clips to cells, add shot type and production notes, drag to reorder shots, and hit POPULATE TIMELINE FROM STORYBOARD to auto-arrange everything in the Timeline Editor." },
  { t: "PAGE 13 — TIMELINE EDITOR & UPLOAD MEDIA", c: "Drag clips to VIDEO, VOICE, MUSIC, and EFFECTS tracks. Hit SYNC ALL TRACKS to auto-populate from your Media Library. Hit UPLOAD MEDIA at the top of the MEDIA BOX to bring in your own video, audio, or image files — they upload directly to Supabase and save to your library. Set film duration (60, 90, or 180 minutes). Hit RENDER when ready." },
  { t: "PAGE 14 — COLOUR GRADE", c: "Professional colour grading. Apply LUT presets (Cinematic, Noir, Golden Hour, Arctic Blue), adjust tone, contrast, and colour temperature. Apply grading to the whole timeline or individual clips." },
  { t: "PAGE 15 — AUDIO MIXER", c: "Documentary mix: VOICE 85, MUSIC 40, EFX 50, MASTER 85. Music video mix: MUSIC 75, VOICE 60, EFX 40, MASTER 85. 3-band equaliser (Bass / Mid / Treble), Audio Ducking, Noise Reduction, and Compressor. Save presets for future projects." },
  { t: "PAGE 16 — RENDER ENGINE", c: "Choose quality: 1080p (Creator), 4K (Pro), 8K (Studio). VP9 codec delivers better quality at the same file size. The engine auto-detects and re-generates any missing clips before rendering. Hit START RENDER when your timeline and mix are locked." },
  { t: "PAGE 17 — PREVIEW", c: "Full film preview before final export. Review chapters, check audio sync, and approve your cut. Return to the Timeline or Audio Mixer if any adjustments are needed before re-rendering." },
  { t: "PAGE 18 — EXPORT & DISTRIBUTE", c: "Download your completed film. One-click share to YouTube, TikTok, Instagram, Facebook, LinkedIn, Vimeo, and WhatsApp from inside the platform. Your rendered film saves to project history for re-download at any time." },
  { t: "PAGE 19 — TUTORIALS", c: "13 step-by-step video lessons covering every part of the platform — including a dedicated lesson on UPLOAD MEDIA (Tutorial 06) and Agent Grok (Tutorial 13). Click any tutorial to expand and watch inline. Each includes expert pro tips." },
  { t: "PAGE 20 — ABOUT & LEGAL", c: "Who built this platform, why it exists, terms of service, and legal disclaimer. Honest information about what the AI does and what each plan receives." },
  { t: "PAGE 21 — AGENT GROK", c: "Your AI studio assistant — fixed gold G button on the bottom-left of every page. Ask anything about tools, workflow, pricing, voice settings, upload, export, or production. Use Quick Start buttons for instant answers or follow-up suggestions after each response. Full knowledge of all 23 pages. Available 24/7." },
  { t: "UPLOAD MEDIA — QUICK GUIDE", c: "Go to Page 13 (Timeline Editor). Hit UPLOAD MEDIA at the top of the MEDIA BOX. Select video, audio, or image files — multiple at once. Files upload to Supabase Storage and save permanently to your Asset Library on Page 11. Progress bar shows upload percentage in real time. No need to use Page 8 — you can build an entire film using your own uploaded footage." },
  { t: "WORKFLOW — DOCUMENTARY", c: "Page 5 (script) → Page 6 (James narration, pitch 0.86, rate 0.62) → Page 8 (generate scenes) or Page 13 UPLOAD MEDIA (own footage) → Page 13 (timeline assembly) → Page 15 (audio mix) → Page 16 (render) → Page 18 (export)" },
  { t: "WORKFLOW — SHORT FILM", c: "Page 5 (script) → Page 8 (scenes) or Page 13 UPLOAD MEDIA → Page 6 (voice) → Page 13 (timeline) → Page 16 (render) → Page 18 (export)" },
  { t: "WORKFLOW — MUSIC VIDEO", c: "Page 6 → MUSIC VIDEO STUDIO → Step 1 (upload your track) → Step 2 (visual style) → Step 3 (scene description) → Step 4 (generate) → download and share to all platforms" },
  { t: "WORKFLOW — OWN FOOTAGE ONLY", c: "Page 13 → UPLOAD MEDIA (upload all your video, audio, image files) → Page 13 (arrange on timeline tracks) → Page 15 (audio mix) → Page 14 (colour grade) → Page 16 (render) → Page 18 (export). No AI generation required." },
];

interface PageProps {
  onNavigate: (page: number) => void;
}

export default function Page23({ onNavigate }: PageProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: WHITE, fontFamily: "'Rajdhani',sans-serif", paddingBottom: 80, width: "100%", overflowX: "hidden" as const }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:.6} 50%{opacity:1} }
        .etsy-btn:hover { background:linear-gradient(135deg,${GREENDIM},${GREEN}) !important; color:#000 !important; }
        .exit-btn:hover { border-color:${GOLD} !important; color:${GOLD} !important; }
        .guide-row:hover { background:${GOLDFAINT} !important; }
      `}</style>

      {/* Top accent line */}
      <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${GREEN},${GOLD},${GREEN},transparent)` }} />

      {/* ── OPENING VIDEO ── */}
      <div style={{ position: "relative", background: "#000" }}>
        <video
          autoPlay loop playsInline preload="auto" muted
          style={{ width: "100%", aspectRatio: "16/9", display: "block", maxHeight: "70vh", objectFit: "cover" }}
          onError={e => { (e.currentTarget as HTMLVideoElement).style.display = "none"; }}
        >
          <source src="/background.mp4" type="video/mp4" />
          <source src="./background.mp4" type="video/mp4" />
          <source src="background.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: "linear-gradient(transparent,#000)", pointerEvents: "none" }} />
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 0" }}>

        {/* ── TITLE ── */}
        <div style={{ textAlign: "center", padding: "40px 0 32px" }}>
          <div style={{ fontSize: 9, color: GREEN, letterSpacing: 6, fontWeight: 900, marginBottom: 12, animation: "shimmer 3s ease-in-out infinite" }}>
            MANDASTRONG STUDIO · CINEMA INTELLIGENCE PLATFORM · 2026
          </div>
          <h1 style={{ fontFamily: "'Cinzel',serif", color: GOLD, fontSize: "clamp(24px,4vw,42px)", fontWeight: 900, letterSpacing: 6, textShadow: `0 0 40px ${GOLD}66`, margin: "0 0 16px" }}>
            THAT'S ALL FOLKS
          </h1>
          <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${GREEN},${GOLD},${GREEN},transparent)`, marginBottom: 8 }} />
          <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${GOLDDIM}44,transparent)`, marginBottom: 0 }} />
        </div>

        {/* ── LETTER ── */}
        <div style={{ ...Card(), marginBottom: 16, border: `2px solid ${GOLD}`, background: "#040400", position: "relative", overflow: "hidden" }}>
          {/* Corner accents */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 40, height: 40, borderRight: `1px solid ${GREEN}`, borderBottom: `1px solid ${GREEN}` }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 40, height: 40, borderLeft: `1px solid ${GREEN}`, borderTop: `1px solid ${GREEN}` }} />

          <div style={{ color: GOLD, fontWeight: 900, fontSize: 13, letterSpacing: 4, marginBottom: 18, textAlign: "center" }}>
            A LETTER TO THE CREATORS OF TODAY AND FOR THE FUTURE
          </div>
          <p style={{ color: WHITE, fontSize: 14, lineHeight: 2.1, margin: "0 0 14px 0" }}>
            To every creator who has ever had a story burning inside them and not known how to get it out — this platform is for you. Whether you are a first-time filmmaker, a veteran with decades of lived experience, a teacher trying to reach a classroom, or someone who simply wants to leave something behind — your story matters. You matter.
          </p>
          <p style={{ color: WHITE, fontSize: 14, lineHeight: 2.1, margin: "0 0 16px 0" }}>
            MandaStrong Studio was built with one belief: <strong style={{ color: GOLD }}>that every person deserves the tools to tell their story.</strong> Not just the wealthy. Not just the technically gifted. Everyone. To the creators of today — thank you. To the creators of the future — welcome.
          </p>
          <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${GOLDDIM},transparent)`, marginBottom: 16 }} />
          <p style={{ color: GOLD, fontWeight: 900, fontSize: 12, letterSpacing: 3, margin: 0, textAlign: "center" }}>
            — AMANDA WOOLLEY · FOUNDER · MANDASTRONG STUDIO
          </p>
        </div>

        {/* ── MISSION ── */}
        <div style={{ ...Card(), marginBottom: 16, border: `1px solid ${GOLDDIM}` }}>
          <div style={{ color: GOLD, fontWeight: 900, fontSize: 13, letterSpacing: 4, marginBottom: 18, textAlign: "center" }}>OUR MISSION</div>
          <p style={{ color: WHITE, fontSize: 14, lineHeight: 2, margin: "0 0 14px 0" }}>
            I am Amanda Woolley — author, creative producer, and founder of MandaStrong Studio. I built this platform because I believe <strong style={{ color: GOLD }}>technology should serve humanity</strong>, and art should serve truth. We exist to give every person — regardless of background, budget, or technical skill — the power to tell their story and make it count.
          </p>
          <p style={{ color: WHITE, fontSize: 14, lineHeight: 2, margin: "0 0 18px 0" }}>
            MandaStrong Studio stands for three causes at the heart of a kinder world:
          </p>

          {/* Three causes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {[
              { icon: "◈", label: "HUMANITY FIRST", text: "We believe in the fundamental dignity of every human being. Technology, creativity, and storytelling are tools for connection — not division. MandaStrong Studio is built on compassion." },
              { icon: "◈", label: "ADVOCATE AGAINST BULLYING", text: "Bullying destroys confidence, silences voices, and steals futures. We actively advocate against bullying in all its forms — online, in schools, and in communities. No child should be made to feel less than." },
              { icon: "◈", label: "SOCIAL SKILLS IN CHILDREN", text: "Healthy social development is foundational. We champion programmes that help children communicate, empathise, and build meaningful relationships — skills that last a lifetime." },
            ].map(({ icon, label, text }) => (
              <div key={label} style={{ background: "#020501", border: `1px solid ${GREEN}33`, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 3, background: GREEN, alignSelf: "stretch", flexShrink: 0, minHeight: 40 }} />
                <div>
                  <div style={{ color: GREEN, fontWeight: 900, fontSize: 11, letterSpacing: 3, marginBottom: 6 }}>{icon} {label}</div>
                  <p style={{ color: WHITE, fontSize: 14, lineHeight: 1.85, margin: 0 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "#040300", border: `2px solid ${GOLD}44`, padding: "18px 22px" }}>
            <div style={{ color: GOLD, fontWeight: 900, fontSize: 11, letterSpacing: 3, marginBottom: 8 }}>ALL PROCEEDS FROM MANDA'S ETSY STORE</div>
            <p style={{ color: WHITE, fontSize: 14, lineHeight: 2, margin: 0 }}>
              <strong style={{ color: GREEN }}>Every single purchase</strong> from{" "}
              <a href="https://MandaStrong1.Etsy.com" target="_blank" rel="noopener noreferrer" style={{ color: GOLD, fontWeight: 900, textDecoration: "none" }}>
                MandaStrong1.Etsy.com
              </a>{" "}
              is donated directly to causes that support humanity, advocate against bullying, and build social skills in children. When you buy from Manda's store, you are not just buying a product — you are funding a better world.
            </p>
          </div>
        </div>

        {/* ── COLLAPSIBLE GUIDE ── */}
        <div
          onClick={() => setGuideOpen(g => !g)}
          style={{
            ...Card(),
            marginBottom: guideOpen ? 0 : 24,
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: `2px solid ${GOLD}`,
            background: "#040300",
            transition: "background .15s",
          }}
        >
          <span style={{ color: GOLD, fontWeight: 900, fontSize: 13, letterSpacing: 3 }}>
            COMPLETE HOW-TO-USE GUIDE — ALL 23 PAGES
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: DIM, fontSize: 11 }}>{guideOpen ? "CLOSE" : "EXPAND"}</span>
            <span style={{ color: GOLD, fontSize: 16, lineHeight: 1 }}>{guideOpen ? "▲" : "▼"}</span>
          </div>
        </div>

        {guideOpen && (
          <div style={{ ...Card(), padding: "20px 28px", border: `2px solid ${GOLD}`, borderTopWidth: 0, marginBottom: 24, background: "#040300" }}>
            {HOW_TO.map(({ t, c }, idx) => (
              <div
                key={t}
                className="guide-row"
                style={{
                  borderBottom: idx < HOW_TO.length - 1 ? `1px solid ${GOLDDIM}22` : "none",
                  padding: "12px 8px",
                  transition: "background .12s",
                }}
              >
                <div style={{ color: GOLD, fontWeight: 900, fontSize: 11, letterSpacing: 2, marginBottom: 5 }}>▸ {t}</div>
                <div style={{ color: WHITE, fontSize: 13, lineHeight: 1.85, paddingLeft: 12 }}>{c}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── ACTION BUTTONS ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 40 }}>
          <button
            className="exit-btn"
            onClick={() => onNavigate(1)}
            style={{
              background: "transparent",
              border: `1px solid ${GOLDDIM}`,
              color: WHITE,
              padding: "12px 28px",
              fontFamily: "'Rajdhani',sans-serif",
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: 3,
              cursor: "pointer",
              textTransform: "uppercase" as const,
              transition: "border-color .15s, color .15s",
            }}
          >
            EXIT ALL
          </button>
          <button
            className="etsy-btn"
            onClick={() => window.open("https://MandaStrong1.Etsy.com", "_blank")}
            style={{
              background: `linear-gradient(135deg,${GOLDDIM},${GOLD})`,
              border: "none",
              color: "#000",
              padding: "14px 40px",
              fontFamily: "'Rajdhani',sans-serif",
              fontWeight: 900,
              fontSize: 15,
              letterSpacing: 3,
              cursor: "pointer",
              textTransform: "uppercase" as const,
              transition: "all .2s",
            }}
          >
            VISIT ETSY STORE
          </button>
        </div>

        {/* ── CLOSING VIDEO ── */}
        <div style={{ position: "relative" }}>
          <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${GREEN},${GOLD},${GREEN},transparent)`, marginBottom: 0 }} />
          <div style={{ background: "#000", border: `1px solid ${GOLDDIM}`, overflow: "hidden" }}>
            {/* Top overlay label */}
            <div style={{ background: "#000", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${GOLDDIM}33` }}>
              <div style={{ width: 8, height: 8, background: GREEN, borderRadius: "50%", boxShadow: `0 0 8px ${GREEN}` }} />
              <span style={{ color: GREEN, fontSize: 10, fontWeight: 900, letterSpacing: 3 }}>MANDASTRONG STUDIO · SHOWREEL</span>
            </div>
            <video
              autoPlay loop playsInline preload="auto" muted
              style={{ width: "100%", aspectRatio: "16/9", display: "block" }}
              onError={e => { (e.currentTarget as HTMLVideoElement).style.display = "none"; }}
            >
              <source src="/thatsallfolks.mp4" type="video/mp4" />
              <source src="./thatsallfolks.mp4" type="video/mp4" />
              <source src="thatsallfolks.mp4" type="video/mp4" />
            </video>
          </div>
          <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${GOLD},${GREEN},${GOLD},transparent)` }} />
        </div>

        {/* Footer credit */}
        <div style={{ textAlign: "center", padding: "24px 0 0", color: DIM, fontSize: 10, letterSpacing: 3, fontWeight: 700 }}>
          MANDASTRONG STUDIO © 2026 · BUILT BY AMANDA WOOLLEY
        </div>
      </div>
    </div>
  );
}
