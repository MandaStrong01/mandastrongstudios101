// @ts-nocheck
import { useState } from "react";

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

interface PageProps {
  onNavigate: (page: number) => void;
}

const tuts = [
  {
    n: "01", t: "Getting Started — Platform Overview & Navigation",
    d: "Full walkthrough of all 23 pages, the Quick Access menu, footer controls, and how to navigate the studio.",
    dur: "12:00", l: "Beginner",
    videoId: "4RixMPF4xis",
    tips: ["Use the menu top left to jump to any page instantly", "Footer shows your current page and lets you save your project", "Page 23 has the full How-To guide"]
  },
  {
    n: "02", t: "Writing Tools — Script to Screen in Minutes",
    d: "How to use the 50+ writing tools on Page 5. From logline to full feature script using AI Create.",
    dur: "9:30", l: "Beginner",
    videoId: "OWMS7PNL7Eo",
    tips: ["Click any tool card to open it", "Use AI CREATE for instant professional scripts", "Save results to your Media Library"]
  },
  {
    n: "03", t: "Voice Engine — 54 Characters, Real Narration",
    d: "Complete guide to Page 6. Selecting voices, setting pitch and rate, using the TEST button, and preparing narration for your documentary.",
    dur: "14:20", l: "Beginner",
    videoId: "pLqipLSTiKs",
    tips: ["James is your primary documentary narrator — pitch 0.86, rate 0.62", "Hit TEST on any voice card to hear it instantly", "Use PREPARE & SPEAK to AI-format your script before speaking"]
  },
  {
    n: "04", t: "Music Video Studio — Full Production Walkthrough",
    d: "Step-by-step: Song setup, style selection, scene description, generating your music video, and exporting to social platforms.",
    dur: "18:45", l: "Intermediate",
    videoId: "1vYvsdE8B6A",
    tips: ["Access from the MUSIC VIDEO STUDIO button on Page 6", "Upload your own audio track on Step 1 for beat-synced video", "The more detailed your scene description, the better the output", "Download directly or share to YouTube, TikTok, Instagram"]
  },
  {
    n: "05", t: "Video Generator — Generating Cinematic Scenes (Page 8)",
    d: "How to describe any scene and have the MandaStrong Cinema Engine build it. Using reference images, duration settings, and saving to your Media Library.",
    dur: "16:00", l: "Intermediate",
    videoId: "sTsGILvmBVE",
    tips: ["Be specific in your scene description — lighting, mood, camera angle", "Upload a reference image to match a visual style", "Each scene saves automatically to your Media Library", "Use NEXT SCENE to build your full film clip by clip"]
  },
  {
    n: "06", t: "Timeline Editor — Building Your Film (Page 13)",
    d: "Dragging clips to tracks, syncing audio and video, adjusting film duration from 60 to 180 minutes, and preparing for render.",
    dur: "11:30", l: "Intermediate",
    videoId: "Bl1WEiHvHEA",
    tips: ["Hit SYNC ALL TRACKS to auto-populate from your Media Library", "Drag any clip from the library to any track", "Set film duration with the slider — 60, 90, or 180 minutes", "Hit RENDER when your timeline is ready"]
  },
  {
    n: "07", t: "Audio Mixer — Professional Sound (Page 15)",
    d: "Setting the perfect mix for documentary, narrative film, or music video. Recommended levels explained.",
    dur: "7:15", l: "Beginner",
    videoId: "GOuniqx0geA",
    tips: ["Documentary: VOICE 85 · MUSIC 40 · EFX 50 · MASTER 85", "Music video: MUSIC 75 · VOICE 60 · EFX 40 · MASTER 85", "Hit SAVE PRESET to store your favourite mix"]
  },
  {
    n: "08", t: "Render Engine — Exporting Your Film in 4K (Page 16)",
    d: "Choosing quality settings, understanding VP9 vs VP8, starting the render, and what to do if clips need regenerating.",
    dur: "10:45", l: "Intermediate",
    videoId: "v3hnz4OQ8c4",
    tips: ["1080p recommended for most use", "4K for professional distribution", "VP9 gives better quality at same file size", "If clips are missing the engine regenerates them automatically"]
  },
  {
    n: "09", t: "Export & Distribute — Getting Your Film Out (Page 18)",
    d: "Downloading your film, sharing to YouTube, TikTok, Instagram, Facebook, LinkedIn, Vimeo and WhatsApp directly from the platform.",
    dur: "6:00", l: "Beginner",
    videoId: "pOfFmSPi7iE",
    tips: ["Hit DOWNLOAD to save to your device first", "Each social platform button opens the upload page directly", "Share your MandaStrong Studio credit in your post description"]
  },
  {
    n: "10", t: "AI For Humanity Documentary — Full Production Case Study",
    d: "Complete case study: how the AI For Humanity documentary was built inside MandaStrong Studio from script to render.",
    dur: "25:00", l: "Advanced",
    videoId: "qV8CBzxYIFw",
    tips: ["James narration — pitch 0.86, rate 0.62, pause 1600ms", "13 scenes generated on Page 8, synced on Page 13", "Full workflow: P8 → P6 → P13 → P15 → P16 → P17 → P18", "Each chapter gets its own generated scene — total runtime 90 minutes"]
  },
  {
    n: "11", t: "Saving, Loading & Project History",
    d: "How to save your session, restore from the project history, and use IndexedDB clip persistence so nothing is ever lost.",
    dur: "5:30", l: "Beginner",
    videoId: "WRHPFKEiXv4",
    tips: ["Hit SAVE PROJECT in the footer at any time", "MY PROJECTS shows your full session history", "Clips survive page reloads automatically via local storage", "Always download your finished film before closing the browser"]
  },
  {
    n: "12", t: "Agent Grok — Your 24/7 AI Studio Assistant (Page 21)",
    d: "How to use Agent Grok to get instant answers about any tool, workflow, pricing, or production question.",
    dur: "4:00", l: "Beginner",
    videoId: "yV3gOJwOa5I",
    tips: ["Ask anything — tools, pricing, workflow, export settings", "Use the quick-question buttons for instant answers", "Agent Grok knows the entire MandaStrong Studio platform"]
  },
];

const lc: Record<string, string> = { Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444" };

export default function Page19({ onNavigate }: PageProps) {
  const [activeVid, setActiveVid] = useState<number | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const openTutorial = (idx: number) => {
    if (activeVid === idx) {
      setActiveVid(null);
      setVideoPlaying(false);
    } else {
      setActiveVid(idx);
      setVideoPlaying(false);
    }
  };

  return (
    <div style={{ ...Sp, padding: "30px 40px" }}>
      <style>{`
        @keyframes p2{0%,100%{opacity:.4}50%{opacity:1}}
        .tut-iframe { border: none; width: 100%; aspect-ratio: 16/9; background: #000; display: block; }
        .tut-play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); cursor: pointer; transition: background .2s; }
        .tut-play-overlay:hover { background: rgba(0,0,0,0.3); }
      `}</style>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ fontSize: 11, color: GOLD, letterSpacing: 4, marginBottom: 4, fontWeight: 700 }}>LEARNING CENTER</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4, flexWrap: "wrap" }}>
          <h1 style={{ ...H1, fontSize: 28, margin: 0 }}>TUTORIALS</h1>
          <div style={{ background: "#0a0500", border: `1px solid ${GOLD}`, padding: "4px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD, animation: "p2 1.5s ease-in-out infinite" }} />
            <span style={{ color: GOLD, fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>VIDEO CREATION IN PROGRESS</span>
          </div>
        </div>
        <div style={{ color: WHITE, fontSize: 13, marginBottom: 24, lineHeight: 1.8 }}>
          Step-by-step guides for every part of MandaStrong Studio. Click any tutorial to expand and watch the lesson.
        </div>

        {tuts.map((t, idx) => (
          <div key={t.n} style={{ marginBottom: 10 }}>
            {/* Header row — always visible */}
            <div
              onClick={() => openTutorial(idx)}
              style={{
                ...Card(), cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderColor: activeVid === idx ? GOLD : GOLDDIM,
                borderBottom: activeVid === idx ? "none" : `1px solid ${activeVid === idx ? GOLD : GOLDDIM}`,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = GOLD}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = activeVid === idx ? GOLD : GOLDDIM}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontFamily: "'Cinzel',serif", color: GOLD, fontSize: 16, fontWeight: 900, minWidth: 28 }}>{t.n}</span>
                <div>
                  <div style={{ color: WHITE, fontWeight: 800, fontSize: 14 }}>{t.t}</div>
                  <div style={{ color: DIM, fontSize: 11, marginTop: 2, letterSpacing: 1 }}>{t.dur} · {t.tips.length} PRO TIPS · CLICK TO {activeVid === idx ? "COLLAPSE" : "EXPAND"}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ background: lc[t.l] + "22", border: `1px solid ${lc[t.l]}`, color: lc[t.l], padding: "3px 10px", fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>{t.l.toUpperCase()}</span>
                <span style={{ color: GOLD, fontSize: 16, fontWeight: 900 }}>{activeVid === idx ? "▲" : "▼"}</span>
              </div>
            </div>

            {/* Expanded panel */}
            {activeVid === idx && (
              <div style={{ background: "#050500", border: `2px solid ${GOLD}`, borderTop: "none", padding: 0 }}>
                {/* Inline video player */}
                <div style={{ position: "relative", background: "#000" }}>
                  {!videoPlaying ? (
                    <div style={{ position: "relative" }}>
                      <img
                        src={`https://img.youtube.com/vi/${t.videoId}/hqdefault.jpg`}
                        alt={t.t}
                        style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.background = "#111"; (e.currentTarget as HTMLImageElement).style.minHeight = "200px"; }}
                      />
                      <div
                        className="tut-play-overlay"
                        onClick={() => setVideoPlaying(true)}
                      >
                        <div style={{
                          width: 64, height: 64, borderRadius: "50%",
                          background: `linear-gradient(135deg,${GOLDDIM},${GOLD})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 26, color: "#000", fontWeight: 900,
                          boxShadow: `0 0 30px ${GOLD}66`,
                        }}>
                          ▶
                        </div>
                      </div>
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", padding: "8px 14px" }}>
                        <div style={{ color: GOLD, fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>TUTORIAL {t.n} · {t.dur} · {t.l.toUpperCase()}</div>
                        <div style={{ color: WHITE, fontSize: 12, fontWeight: 700, marginTop: 2 }}>{t.t}</div>
                      </div>
                    </div>
                  ) : (
                    <iframe
                      className="tut-iframe"
                      src={`https://www.youtube.com/embed/${t.videoId}?autoplay=1&rel=0&modestbranding=1`}
                      title={t.t}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>

                {/* Description + tips */}
                <div style={{ padding: "20px 24px" }}>
                  <p style={{ color: WHITE, fontSize: 14, lineHeight: 1.9, marginBottom: 16 }}>{t.d}</p>
                  <div style={{ color: GOLD, fontSize: 11, fontWeight: 900, letterSpacing: 2, marginBottom: 10 }}>PRO TIPS</div>
                  {t.tips.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                      <span style={{ color: GOLD, fontWeight: 900, flexShrink: 0 }}>✦</span>
                      <span style={{ color: WHITE, fontSize: 13, lineHeight: 1.7 }}>{tip}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${t.videoId}`, "_blank")}
                      style={{ background: `linear-gradient(135deg,#a07820,#e8c96d)`, border: "none", color: "#000", padding: "12px 24px", cursor: "pointer", fontSize: 12, fontWeight: 900, letterSpacing: 2, fontFamily: "'Rajdhani',sans-serif" }}
                    >
                      OPEN ON YOUTUBE
                    </button>
                    {!videoPlaying && (
                      <button
                        onClick={() => setVideoPlaying(true)}
                        style={{ ...G("out", true) }}
                      >
                        PLAY INLINE
                      </button>
                    )}
                    {videoPlaying && (
                      <button
                        onClick={() => setVideoPlaying(false)}
                        style={{ ...G("out", true) }}
                      >
                        CLOSE PLAYER
                      </button>
                    )}
                    {idx > 0 && (
                      <button onClick={() => { setActiveVid(idx - 1); setVideoPlaying(false); }} style={{ ...G("out", true) }}>PREV</button>
                    )}
                    {idx < tuts.length - 1 && (
                      <button onClick={() => { setActiveVid(idx + 1); setVideoPlaying(false); }} style={{ ...G("out", true) }}>NEXT</button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
