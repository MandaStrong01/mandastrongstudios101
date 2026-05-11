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
    d: "Full walkthrough of all 23 pages, the Quick Access menu, footer controls, and how to navigate the studio. Learn how every page connects and what order gives you the fastest path from idea to finished film.",
    dur: "12:00", l: "Beginner",
    videoId: "4RixMPF4xis",
    tips: [
      "Use the Quick Access menu (top left) to jump to any of the 23 pages instantly",
      "Hit SAVE PROJECT in the footer at any time — your work restores exactly where you left off",
      "Page 23 has the complete How-To-Use Guide covering every page in detail",
      "Guest users can explore the full platform without signing in",
    ]
  },
  {
    n: "02", t: "Writing Tools — Script to Screen in Minutes (Page 5)",
    d: "How to use the 50+ professional writing tools on Page 5. From logline to full feature screenplay, episode arc, character bible, and documentary script — all generated in seconds with AI CREATE.",
    dur: "9:30", l: "Beginner",
    videoId: "OWMS7PNL7Eo",
    tips: [
      "Click any tool card to open it in a full modal with prompt fields",
      "Use AI CREATE to generate any script format instantly",
      "Copy your finished script straight into the Voice Engine on Page 6",
      "50+ formats: loglines, treatments, feature scripts, episode arcs, character bibles, dialogue rewrites",
    ]
  },
  {
    n: "03", t: "Voice Engine — 54 Characters, Real Narration (Page 6)",
    d: "Complete guide to Page 6. Choosing from 54 professional voice characters, setting pitch, rate, pause and mood, using the TEST button before committing, and using PREPARE & SPEAK for the best AI-formatted delivery.",
    dur: "14:20", l: "Beginner",
    videoId: "pLqipLSTiKs",
    tips: [
      "APPLY JAMES SETTINGS sets the perfect documentary narration: pitch 0.86, rate 0.62, pause 1600ms",
      "Filter voices by gender, age, and origin to find your character instantly",
      "Hit TEST on any voice card to hear it before selecting",
      "Always use PREPARE & SPEAK — it AI-formats your script for the best spoken result",
      "Adjust the MOOD slider across 14 emotional registers for the right tone",
    ]
  },
  {
    n: "04", t: "Music Video Studio — Full Production Walkthrough (Page 6)",
    d: "Step-by-step guide to the Music Video Studio inside Page 6. Song setup, choosing visual style and colour grade, writing your scene description, generating your music video, and exporting to social platforms.",
    dur: "18:45", l: "Intermediate",
    videoId: "1vYvsdE8B6A",
    tips: [
      "Access from the MUSIC VIDEO STUDIO button on Page 6",
      "Upload your own audio track on Step 1 — the visuals sync to your beat automatically",
      "The more detailed your Step 3 scene description, the better the generated result",
      "Step 2 colour grade choices: Cinematic, Noir, Golden Hour, Arctic Blue, and more",
      "Download directly from Step 4 or share to YouTube, TikTok, and Instagram in one click",
    ]
  },
  {
    n: "05", t: "Video Generator — Cinematic Scene Generation (Page 8)",
    d: "How to describe any scene and have the MandaStrong Cinema Engine build it as a visual clip. Using reference images to match a style, setting duration, and saving clips to your Media Library for the Timeline.",
    dur: "16:00", l: "Intermediate",
    videoId: "sTsGILvmBVE",
    tips: [
      "Describe lighting, mood, camera angle, time of day, characters, and setting for the best result",
      "Upload a reference image to match a specific visual style or colour palette",
      "Every generated clip saves automatically to your Media Library on Page 11",
      "Use NEXT SCENE to build your full film clip by clip in sequence",
      "You can also bypass this page entirely and upload your own video files using UPLOAD MEDIA on Page 13",
    ]
  },
  {
    n: "06", t: "Upload Media — Bring Your Own Files to the Timeline (Page 13)",
    d: "How to upload your own video, audio, and image files directly into the Timeline Editor without using the AI Video Generator. Files are saved to your Supabase Media Library and available across every tool in the platform.",
    dur: "5:00", l: "Beginner",
    videoId: "Bl1WEiHvHEA",
    tips: [
      "Hit UPLOAD MEDIA at the top of the MEDIA BOX in the Timeline Editor on Page 13",
      "Accepts video (MP4, MOV, WebM), audio (MP3, WAV), and images (JPG, PNG, WebP) — multiple files at once",
      "Uploaded files are saved to Supabase Storage and your Asset Library on Page 11 — they persist across sessions",
      "Guest users get a local session-only upload — sign in to save files permanently",
      "A progress bar shows upload percentage in real time — green checkmark confirms the file is saved to your library",
      "This is the fastest way to get your own footage, music, or photos into a production",
    ]
  },
  {
    n: "07", t: "Timeline Editor — Building Your Film (Page 13)",
    d: "Dragging clips to video, voice, music, and effects tracks. Syncing all tracks from your Media Library with one click. Adjusting film duration from 1 to 180 minutes, and locking your timeline before render.",
    dur: "11:30", l: "Intermediate",
    videoId: "Bl1WEiHvHEA",
    tips: [
      "Hit SYNC ALL TRACKS to auto-populate all four tracks from your Media Library",
      "Four tracks: VIDEO · VOICE · MUSIC · EFFECTS — drag any asset to any track",
      "Set film duration with the slider: 60, 90, or 180 minutes",
      "Use UPLOAD MEDIA to bring in your own files without using the AI generator",
      "Hit RENDER when your timeline is locked and ready",
    ]
  },
  {
    n: "08", t: "Audio Mixer — Professional Sound Design (Page 15)",
    d: "Setting the perfect mix for documentary, narrative film, or music video. Recommended levels for each format, the equaliser, audio ducking, noise reduction, and saving your mix as a preset.",
    dur: "7:15", l: "Beginner",
    videoId: "GOuniqx0geA",
    tips: [
      "Documentary mix: VOICE 85 · MUSIC 40 · EFX 50 · MASTER 85",
      "Music video mix: MUSIC 75 · VOICE 60 · EFX 40 · MASTER 85",
      "Enable AUDIO DUCKING to automatically lower music when voice plays",
      "Use the 3-band EQ (Bass / Mid / Treble) to shape your final sound",
      "Hit SAVE PRESET to store your favourite mix for future projects",
    ]
  },
  {
    n: "09", t: "Render Engine — Producing Your Film (Page 16)",
    d: "Choosing quality settings (1080p, 4K, 8K), understanding VP9 codec advantages, starting the render, and what happens when clips need regenerating before the final output.",
    dur: "10:45", l: "Intermediate",
    videoId: "v3hnz4OQ8c4",
    tips: [
      "Creator plan: 1080p HD · Pro plan: 4K · Studio plan: 8K cinema quality",
      "VP9 codec delivers better quality at the same file size compared to H.264",
      "The engine automatically detects and re-generates any missing clips before rendering",
      "Lock your timeline and approve your audio mix before hitting START RENDER",
      "Studio plan supports films up to 3 hours (180 minutes)",
    ]
  },
  {
    n: "10", t: "Export & Distribute — Getting Your Film Out (Page 18)",
    d: "Downloading your completed film and sharing one-click to YouTube, TikTok, Instagram, Facebook, LinkedIn, Vimeo, and WhatsApp directly from inside the platform.",
    dur: "6:00", l: "Beginner",
    videoId: "pOfFmSPi7iE",
    tips: [
      "Hit DOWNLOAD to save the film file to your device first as a backup",
      "One-click share buttons open each platform's upload page with your file ready",
      "Your rendered film is saved to your project history for re-download at any time",
      "Add your MandaStrong Studio credit and a link in your post description",
    ]
  },
  {
    n: "11", t: "AI For Humanity Documentary — Full Case Study",
    d: "Complete production case study: how a full-length AI For Humanity documentary was built inside MandaStrong Studio from concept to render — covering script, narration, scene generation, timeline assembly, and export.",
    dur: "25:00", l: "Advanced",
    videoId: "qV8CBzxYIFw",
    tips: [
      "Full workflow: Page 5 (script) → Page 6 (James narration) → Page 8 (scenes) → Page 13 (timeline) → Page 15 (mix) → Page 16 (render) → Page 18 (export)",
      "James narration settings: pitch 0.86, rate 0.62, pause 1600ms",
      "13 scenes generated on Page 8 and synced on the timeline — total runtime 90 minutes",
      "Each chapter of the documentary gets its own dedicated generated scene",
      "Own footage was added via UPLOAD MEDIA on Page 13 alongside AI-generated clips",
    ]
  },
  {
    n: "12", t: "Saving, Loading & Project History",
    d: "How to save your full session, restore from project history, and ensure your media library assets persist across devices and sessions via Supabase cloud storage.",
    dur: "5:30", l: "Beginner",
    videoId: "WRHPFKEiXv4",
    tips: [
      "Hit SAVE PROJECT in the footer at any time from any page",
      "MY PROJECTS restores your work exactly where you left off — timeline, media, settings",
      "Uploaded files via UPLOAD MEDIA are stored in Supabase and survive browser restarts",
      "Always download your rendered film before closing the browser",
      "Sign in to enable permanent cloud saves — guest sessions are local only",
    ]
  },
  {
    n: "13", t: "Agent Grok — Your 24/7 AI Studio Assistant",
    d: "How to use Agent Grok for instant answers on any tool, workflow, voice settings, pricing, or export question. Grok has full knowledge of all 23 pages and every feature in the platform.",
    dur: "4:00", l: "Beginner",
    videoId: "yV3gOJwOa5I",
    tips: [
      "Click the gold G button fixed to the bottom-left of every page to open Agent Grok",
      "Use the Quick Start suggestion buttons to get answers immediately without typing",
      "Follow-up suggestion buttons appear after each answer for deeper exploration",
      "Ask about any page, tool, workflow, pricing plan, voice settings, or export options",
      "Agent Grok covers all 23 pages with detailed, accurate answers — available 24/7",
    ]
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
          13 step-by-step lessons covering every part of MandaStrong Studio — from first upload to final export. Click any tutorial to expand and watch inline.
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
