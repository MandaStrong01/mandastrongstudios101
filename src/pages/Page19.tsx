// @ts-nocheck
import { useState, useRef, useEffect } from "react";

const GOLD = "#e8c96d";
const GOLDDIM = "#a07820";
const GOLDFAINT = "#e8c96d14";
const WHITE = "#d4c9a8";
const DIM = "#5a5040";
const BG = "#000000";

const Sp = { minHeight: "100vh", background: BG, color: WHITE, fontFamily: "'Rajdhani',sans-serif", paddingBottom: 160, width: "100%", overflowX: "hidden" as const };
const H1 = { fontFamily: "'Cinzel',serif", color: GOLD, letterSpacing: 5, textTransform: "uppercase" as const, margin: 0, fontSize: "clamp(16px,3vw,32px)" };
const Card = (x?) => ({ background: "#0a0a0a", border: `1px solid ${GOLDDIM}`, borderRadius: 0, padding: 18, ...(x || {}) });

interface PageProps { onNavigate: (page: number) => void; }

const lc: Record<string, string> = { Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444" };

// Each lesson has a draw function that renders a cinematic tutorial canvas animation
const lessonRenderers: Record<string, (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void> = {
  "01": (ctx, t, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    // Starfield
    for (let i = 0; i < 80; i++) {
      const x = ((i * 137.5 + t * 0.05) % 1) * w;
      const y = ((i * 97.3) % 1) * h;
      const a = 0.3 + 0.5 * Math.sin(t * 0.8 + i);
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232,201,109,${a})`;
      ctx.fill();
    }
    // Central platform diagram
    const cx = w / 2, cy = h / 2 - 30;
    ctx.strokeStyle = "#e8c96d55";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 180, cy - 80, 360, 160);
    ctx.fillStyle = "#e8c96d11";
    ctx.fillRect(cx - 180, cy - 80, 360, 160);
    // Pages indicators
    for (let i = 0; i < 23; i++) {
      const bx = cx - 165 + (i % 8) * 45;
      const by = cy - 60 + Math.floor(i / 8) * 40;
      const active = i === Math.floor(t * 1.5) % 23;
      ctx.fillStyle = active ? GOLD : "#e8c96d22";
      ctx.fillRect(bx, by, 32, 24);
      ctx.fillStyle = active ? "#000" : "#e8c96d66";
      ctx.font = `bold 9px Rajdhani`;
      ctx.textAlign = "center";
      ctx.fillText(`P${i + 1}`, bx + 16, by + 15);
    }
    // Title
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.floor(w * 0.028)}px Cinzel`;
    ctx.textAlign = "center";
    ctx.fillText("GETTING STARTED — PLATFORM OVERVIEW", cx, h - 80);
    ctx.font = `${Math.floor(w * 0.016)}px Rajdhani`;
    ctx.fillStyle = WHITE;
    ctx.fillText("Navigate all 23 pages · Save & restore your project · Quick Access menu", cx, h - 55);
    ctx.fillStyle = "#e8c96d44";
    ctx.font = `bold 11px Rajdhani`;
    ctx.fillText("LESSON 01 · BEGINNER · 12:00", cx, h - 32);
  },

  "02": (ctx, t, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    // Scrolling script lines
    const lines = ["INT. CITY STREET — NIGHT","A lone figure crosses the rain-slicked road.","Her coat catches the wind. She doesn't look back.","","EXT. ROOFTOP — CONTINUOUS","The skyline burns gold against the dark.","She opens the letter. Reads once. Twice. Drops it.","","VOICE (V.O.)","Every story begins with a single decision."];
    const scroll = (t * 18) % (lines.length * 32 + h);
    ctx.fillStyle = "#e8c96d08";
    ctx.fillRect(cx - 260, 0, 520, h);
    lines.forEach((line, i) => {
      const y = h - scroll + i * 32;
      if (y < -40 || y > h + 40) return;
      const a = Math.max(0, Math.min(1, Math.min(y / 100, (h - y) / 100)));
      ctx.fillStyle = line === "VOICE (V.O.)" ? `rgba(232,201,109,${a})` : line.startsWith("INT") || line.startsWith("EXT") ? `rgba(232,201,109,${a * 0.8})` : `rgba(212,201,168,${a * 0.7})`;
      ctx.font = `${line.startsWith("INT") || line.startsWith("EXT") ? "bold" : "normal"} 14px Courier New`;
      ctx.textAlign = "left";
      ctx.fillText(line, cx - 240, y);
    });
    // AI CREATE button glow
    const blink = 0.7 + 0.3 * Math.sin(t * 3);
    ctx.fillStyle = `rgba(232,201,109,${blink * 0.25})`;
    ctx.fillRect(cx - 80, h - 130, 160, 44);
    ctx.strokeStyle = `rgba(232,201,109,${blink})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 80, h - 130, 160, 44);
    ctx.fillStyle = `rgba(0,0,0,${blink})`;
    ctx.font = "bold 13px Rajdhani";
    ctx.textAlign = "center";
    ctx.fillText("AI CREATE", cx, h - 102);
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.floor(w * 0.025)}px Cinzel`;
    ctx.textAlign = "center";
    ctx.fillText("WRITING TOOLS — SCRIPT TO SCREEN", cx, h - 55);
    ctx.font = `${Math.floor(w * 0.015)}px Rajdhani`;
    ctx.fillStyle = WHITE;
    ctx.fillText("50+ AI formats · Loglines · Feature scripts · Episode arcs · Character bibles", cx, h - 32);
  },

  "03": (ctx, t, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    // Waveform
    ctx.strokeStyle = "#e8c96d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const amp = 40 + 20 * Math.sin(x * 0.03 + t * 2);
      const y = h / 2 - 80 + Math.sin(x * 0.05 + t * 3) * amp * Math.sin(t * 0.5 + x * 0.01);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Voice cards
    const voices = ["James · Documentary","Elena · News Anchor","Marcus · Action","Sofia · Drama","Chen · Narrator","Amara · Character"];
    voices.forEach((v, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const bx = cx - 195 + col * 134, by = 60 + row * 64;
      const active = Math.floor(t * 0.8) % voices.length === i;
      ctx.fillStyle = active ? "#e8c96d22" : "#0a0a0a";
      ctx.fillRect(bx, by, 120, 48);
      ctx.strokeStyle = active ? GOLD : "#a0782044";
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeRect(bx, by, 120, 48);
      ctx.fillStyle = active ? GOLD : WHITE;
      ctx.font = `${active ? "bold" : "normal"} 11px Rajdhani`;
      ctx.textAlign = "center";
      ctx.fillText(v, bx + 60, by + 30);
    });
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.floor(w * 0.025)}px Cinzel`;
    ctx.textAlign = "center";
    ctx.fillText("VOICE ENGINE — 54 CHARACTERS", cx, h - 55);
    ctx.font = `${Math.floor(w * 0.015)}px Rajdhani`;
    ctx.fillStyle = WHITE;
    ctx.fillText("PITCH · RATE · PAUSE · MOOD · TEST · PREPARE & SPEAK", cx, h - 32);
  },

  "04": (ctx, t, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    // Beat visualiser
    const bars = 32;
    for (let i = 0; i < bars; i++) {
      const bh = 20 + 80 * Math.abs(Math.sin(i * 0.4 + t * 4)) * (0.5 + 0.5 * Math.sin(t * 2 + i * 0.2));
      const x = cx - 160 + i * 10;
      const g = ctx.createLinearGradient(0, h / 2 - 20, 0, h / 2 - 20 - bh);
      g.addColorStop(0, GOLDDIM);
      g.addColorStop(1, GOLD);
      ctx.fillStyle = g;
      ctx.fillRect(x, h / 2 - 20 - bh, 6, bh);
    }
    // 4 step indicators
    const steps = ["SONG SETUP","VISUAL STYLE","SCENE DESC","GENERATE"];
    const currentStep = Math.floor(t * 0.5) % 4;
    steps.forEach((s, i) => {
      const x = cx - 180 + i * 120;
      const active = i === currentStep || i < currentStep;
      ctx.fillStyle = active ? "#e8c96d22" : "#0a0a0a";
      ctx.fillRect(x, h - 160, 100, 36);
      ctx.strokeStyle = active ? GOLD : "#a0782044";
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeRect(x, h - 160, 100, 36);
      ctx.fillStyle = active ? GOLD : DIM;
      ctx.font = `bold 10px Rajdhani`;
      ctx.textAlign = "center";
      ctx.fillText(`STEP ${i + 1}`, x + 50, h - 148);
      ctx.font = `9px Rajdhani`;
      ctx.fillText(s, x + 50, h - 134);
    });
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.floor(w * 0.025)}px Cinzel`;
    ctx.textAlign = "center";
    ctx.fillText("MUSIC VIDEO STUDIO", cx, h - 88);
    ctx.font = `${Math.floor(w * 0.015)}px Rajdhani`;
    ctx.fillStyle = WHITE;
    ctx.fillText("Upload your track · Set visual style · Describe your scene · Generate & share", cx, h - 65);
  },

  "05": (ctx, t, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 - 30;
    // Film frame
    const fw = 380, fh = 220;
    ctx.fillStyle = "#111";
    ctx.fillRect(cx - fw / 2, cy - fh / 2, fw, fh);
    // Sky gradient inside frame
    const sky = ctx.createLinearGradient(0, cy - fh / 2, 0, cy + fh / 2);
    sky.addColorStop(0, "#0a0a1a");
    sky.addColorStop(1, "#1a0800");
    ctx.fillStyle = sky;
    ctx.fillRect(cx - fw / 2 + 4, cy - fh / 2 + 4, fw - 8, fh - 8);
    // City silhouette
    for (let i = 0; i < 12; i++) {
      const bw = 18 + (i * 17) % 30;
      const bh = 30 + (i * 23) % 90;
      const bx = cx - fw / 2 + 10 + i * 30;
      const by = cy + fh / 2 - 4 - bh;
      ctx.fillStyle = "#050505";
      ctx.fillRect(bx, by, bw, bh);
      // Window lights
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 2; c++) {
          if (Math.sin(t * 0.3 + i * 2 + r + c) > 0.3) {
            ctx.fillStyle = `rgba(232,201,109,0.6)`;
            ctx.fillRect(bx + 3 + c * 8, by + 6 + r * 12, 4, 6);
          }
        }
      }
    }
    // Moving golden ray
    const ray = (Math.sin(t * 0.4) + 1) / 2;
    const g = ctx.createRadialGradient(cx - 80 + ray * 160, cy - 40, 0, cx - 80 + ray * 160, cy - 40, 140);
    g.addColorStop(0, "rgba(232,201,109,0.15)");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(cx - fw / 2, cy - fh / 2, fw, fh);
    // Frame border
    ctx.strokeStyle = GOLDDIM;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - fw / 2, cy - fh / 2, fw, fh);
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.floor(w * 0.025)}px Cinzel`;
    ctx.textAlign = "center";
    ctx.fillText("VIDEO GENERATOR — CINEMATIC SCENES", cx, h - 55);
    ctx.font = `${Math.floor(w * 0.015)}px Rajdhani`;
    ctx.fillStyle = WHITE;
    ctx.fillText("Describe any scene in natural language · AI builds the visual for you", cx, h - 32);
  },

  "06": (ctx, t, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    // Progress bar upload simulation
    const prog = (t * 12) % 110;
    ctx.fillStyle = "#111";
    ctx.fillRect(cx - 220, h / 2 - 60, 440, 20);
    ctx.fillStyle = "#e8c96d33";
    ctx.fillRect(cx - 220, h / 2 - 60, Math.min(440, prog * 4), 20);
    ctx.strokeStyle = GOLDDIM;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 220, h / 2 - 60, 440, 20);
    const pct = Math.min(100, Math.floor(prog));
    ctx.fillStyle = pct >= 100 ? GOLD : WHITE;
    ctx.font = "bold 11px Rajdhani";
    ctx.textAlign = "center";
    ctx.fillText(pct >= 100 ? "✓ SAVED TO LIBRARY" : `UPLOADING... ${pct}%`, cx, h / 2 - 45);
    // File type cards
    const types = [["VIDEO","MP4 · MOV · WebM","#e8c96d"],["AUDIO","MP3 · WAV","#22c55e"],["IMAGE","JPG · PNG · WebP","#f59e0b"]];
    types.forEach(([label, ext, col], i) => {
      const x = cx - 165 + i * 110;
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(x, h / 2 - 140, 90, 60);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, h / 2 - 140, 90, 60);
      ctx.fillStyle = col;
      ctx.font = "bold 12px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText(label, x + 45, h / 2 - 112);
      ctx.fillStyle = WHITE + "88";
      ctx.font = "9px Rajdhani";
      ctx.fillText(ext, x + 45, h / 2 - 96);
    });
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.floor(w * 0.025)}px Cinzel`;
    ctx.textAlign = "center";
    ctx.fillText("UPLOAD MEDIA — YOUR OWN FILES", cx, h - 55);
    ctx.font = `${Math.floor(w * 0.015)}px Rajdhani`;
    ctx.fillStyle = WHITE;
    ctx.fillText("Page 13 UPLOAD MEDIA button · Saved to Supabase Storage · Persists across sessions", cx, h - 32);
  },

  "07": (ctx, t, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 - 20;
    // Timeline tracks
    const tracks = ["VIDEO","VOICE","MUSIC","EFFECTS"];
    const trackW = 380, segW = [120, 90, 150, 80];
    tracks.forEach((track, ti) => {
      const ty = cy - 70 + ti * 38;
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(cx - 190, ty, trackW, 28);
      ctx.strokeStyle = "#e8c96d22";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 190, ty, trackW, 28);
      ctx.fillStyle = DIM;
      ctx.font = "bold 9px Rajdhani";
      ctx.textAlign = "left";
      ctx.fillText(track, cx - 185, ty + 18);
      // Clip on track
      const clipX = cx - 190 + 50 + (Math.sin(t * 0.3 + ti) + 1) * 20;
      ctx.fillStyle = ti === 0 ? "#e8c96d33" : ti === 1 ? "#22c55e22" : ti === 2 ? "#f59e0b22" : "#ef444422";
      ctx.fillRect(clipX, ty + 3, segW[ti], 22);
      ctx.strokeStyle = ti === 0 ? GOLD : ti === 1 ? "#22c55e" : ti === 2 ? "#f59e0b" : "#ef4444";
      ctx.lineWidth = 1;
      ctx.strokeRect(clipX, ty + 3, segW[ti], 22);
    });
    // Playhead
    const phX = cx - 190 + 50 + ((t * 20) % trackW);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(phX, cy - 70);
    ctx.lineTo(phX, cy - 70 + tracks.length * 38);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.floor(w * 0.025)}px Cinzel`;
    ctx.textAlign = "center";
    ctx.fillText("TIMELINE EDITOR", cx, h - 55);
    ctx.font = `${Math.floor(w * 0.015)}px Rajdhani`;
    ctx.fillStyle = WHITE;
    ctx.fillText("4 tracks · Drag clips · SYNC ALL TRACKS · Set duration · RENDER", cx, h - 32);
  },

  "08": (ctx, t, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    // Mixer faders
    const faders = [{ l: "VOICE", v: 0.85, c: GOLD }, { l: "MUSIC", v: 0.40, c: "#e8c96d" }, { l: "EFX", v: 0.50, c: "#a07820" }, { l: "MASTER", v: 0.85, c: GOLD }];
    faders.forEach((f, i) => {
      const x = cx - 180 + i * 95;
      const th = 180;
      const fy = h / 2 - 20;
      // Track
      ctx.fillStyle = "#111";
      ctx.fillRect(x + 20, fy - th / 2, 8, th);
      // Fill
      ctx.fillStyle = f.c + "44";
      ctx.fillRect(x + 20, fy - th / 2 + th * (1 - f.v), 8, th * f.v);
      // Knob
      const ky = fy - th / 2 + th * (1 - f.v);
      ctx.fillStyle = f.c;
      ctx.fillRect(x + 12, ky - 4, 24, 10);
      ctx.fillStyle = WHITE;
      ctx.font = "bold 10px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText(f.l, x + 24, fy + 20);
      ctx.fillStyle = f.c;
      ctx.font = "bold 11px Rajdhani";
      ctx.fillText(Math.round(f.v * 100), x + 24, fy + 36);
    });
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.floor(w * 0.025)}px Cinzel`;
    ctx.textAlign = "center";
    ctx.fillText("AUDIO MIXER — PROFESSIONAL SOUND", cx, h - 55);
    ctx.font = `${Math.floor(w * 0.015)}px Rajdhani`;
    ctx.fillStyle = WHITE;
    ctx.fillText("Documentary: VOICE 85 · MUSIC 40 · EFX 50 · MASTER 85", cx, h - 32);
  },

  "09": (ctx, t, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 - 20;
    // Render progress
    const prog = (t * 6) % 105;
    const pct = Math.min(100, Math.floor(prog));
    // Film strip
    for (let i = 0; i < 8; i++) {
      const fx = cx - 280 + i * 70;
      const lit = i <= pct / 12.5;
      ctx.fillStyle = lit ? "#e8c96d11" : "#0a0a0a";
      ctx.fillRect(fx, cy - 60, 60, 80);
      ctx.strokeStyle = lit ? GOLD : "#a0782033";
      ctx.lineWidth = lit ? 2 : 1;
      ctx.strokeRect(fx, cy - 60, 60, 80);
      if (lit) {
        const g = ctx.createRadialGradient(fx + 30, cy - 20, 0, fx + 30, cy - 20, 30);
        g.addColorStop(0, "#e8c96d33");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(fx, cy - 60, 60, 80);
      }
    }
    // Progress bar
    ctx.fillStyle = "#111";
    ctx.fillRect(cx - 200, cy + 50, 400, 16);
    ctx.fillStyle = pct >= 100 ? GOLD : "#e8c96d88";
    ctx.fillRect(cx - 200, cy + 50, pct * 4, 16);
    ctx.strokeStyle = GOLDDIM;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 200, cy + 50, 400, 16);
    ctx.fillStyle = pct >= 100 ? "#000" : WHITE;
    ctx.font = "bold 10px Rajdhani";
    ctx.textAlign = "center";
    ctx.fillText(pct >= 100 ? "RENDER COMPLETE" : `RENDERING... ${pct}%`, cx, cy + 62);
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.floor(w * 0.025)}px Cinzel`;
    ctx.textAlign = "center";
    ctx.fillText("RENDER ENGINE", cx, h - 55);
    ctx.font = `${Math.floor(w * 0.015)}px Rajdhani`;
    ctx.fillStyle = WHITE;
    ctx.fillText("1080p · 4K · 8K Cinema · VP9 Codec · Up to 180 minutes", cx, h - 32);
  },

  "10": (ctx, t, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    // Platforms
    const platforms = ["YOUTUBE","TIKTOK","INSTAGRAM","FACEBOOK","LINKEDIN","VIMEO","WHATSAPP"];
    const cols = [["#ff0000","#ff0000"],["#000","#fff"],["#e1306c","#f77737"],["#1877f2","#1877f2"],["#0a66c2","#0a66c2"],["#1ab7ea","#1ab7ea"],["#25d366","#25d366"]];
    platforms.forEach((p, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = cx - 190 + col * 100;
      const y = h / 2 - 100 + row * 55;
      const sent = Math.floor(t * 0.6) > i;
      ctx.fillStyle = sent ? cols[i][0] + "33" : "#0a0a0a";
      ctx.fillRect(x, y, 80, 36);
      ctx.strokeStyle = sent ? cols[i][0] : "#a0782033";
      ctx.lineWidth = sent ? 2 : 1;
      ctx.strokeRect(x, y, 80, 36);
      ctx.fillStyle = sent ? cols[i][0] : DIM;
      ctx.font = `bold 9px Rajdhani`;
      ctx.textAlign = "center";
      ctx.fillText(p, x + 40, y + 22);
    });
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.floor(w * 0.025)}px Cinzel`;
    ctx.textAlign = "center";
    ctx.fillText("EXPORT & DISTRIBUTE", cx, h - 55);
    ctx.font = `${Math.floor(w * 0.015)}px Rajdhani`;
    ctx.fillStyle = WHITE;
    ctx.fillText("One-click to 7 platforms · Download to device · Permanent cloud backup", cx, h - 32);
  },

  "11": (ctx, t, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 - 30;
    // Documentary timeline overview
    const chapters = ["CONCEPT","SCRIPT","VOICE","SCENES","TIMELINE","MIX","RENDER","EXPORT"];
    chapters.forEach((c, i) => {
      const x = cx - 320 + i * 82;
      const done = i <= Math.floor(t * 0.5) % (chapters.length + 1);
      ctx.fillStyle = done ? "#e8c96d22" : "#0a0a0a";
      ctx.fillRect(x, cy - 24, 68, 48);
      ctx.strokeStyle = done ? GOLD : "#a0782033";
      ctx.lineWidth = done ? 2 : 1;
      ctx.strokeRect(x, cy - 24, 68, 48);
      ctx.fillStyle = done ? GOLD : DIM;
      ctx.font = `bold 9px Rajdhani`;
      ctx.textAlign = "center";
      ctx.fillText(c, x + 34, cy + 6);
      if (i < chapters.length - 1) {
        ctx.strokeStyle = done ? GOLD + "88" : "#a0782022";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 68, cy);
        ctx.lineTo(x + 82, cy);
        ctx.stroke();
      }
    });
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.floor(w * 0.025)}px Cinzel`;
    ctx.textAlign = "center";
    ctx.fillText("DOCUMENTARY FULL CASE STUDY", cx, h - 55);
    ctx.font = `${Math.floor(w * 0.015)}px Rajdhani`;
    ctx.fillStyle = WHITE;
    ctx.fillText("Page 5 → Page 6 (James) → Page 8 → Page 13 → Page 15 → Page 16 → Page 18", cx, h - 32);
  },

  "12": (ctx, t, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 - 20;
    // Cloud save animation
    const pulse = 0.6 + 0.4 * Math.sin(t * 2);
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 55, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(232,201,109,${pulse * 0.3})`;
    ctx.lineWidth = 20;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 35, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(232,201,109,${pulse * 0.5})`;
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = `rgba(232,201,109,${pulse})`;
    ctx.font = "bold 32px Rajdhani";
    ctx.textAlign = "center";
    ctx.fillText("☁", cx, cy - 14);
    // Status
    const states = ["SAVING PROJECT...","PROJECT SAVED ✓","RESTORING...","RESTORED ✓"];
    const st = states[Math.floor(t * 0.5) % states.length];
    ctx.fillStyle = st.includes("✓") ? GOLD : WHITE;
    ctx.font = `bold 14px Rajdhani`;
    ctx.fillText(st, cx, cy + 30);
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.floor(w * 0.025)}px Cinzel`;
    ctx.textAlign = "center";
    ctx.fillText("SAVING, LOADING & PROJECT HISTORY", cx, h - 55);
    ctx.font = `${Math.floor(w * 0.015)}px Rajdhani`;
    ctx.fillStyle = WHITE;
    ctx.fillText("SAVE PROJECT · MY PROJECTS · Cloud storage via Supabase", cx, h - 32);
  },

  "13": (ctx, t, w, h) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 - 20;
    // Agent Grok panel
    ctx.fillStyle = "#040300";
    ctx.fillRect(cx - 220, cy - 100, 440, 160);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 220, cy - 100, 440, 160);
    // G avatar
    const ga = ctx.createLinearGradient(cx - 200, cy - 80, cx - 150, cy - 30);
    ga.addColorStop(0, GOLDDIM);
    ga.addColorStop(1, GOLD);
    ctx.fillStyle = ga;
    ctx.fillRect(cx - 200, cy - 80, 44, 44);
    ctx.fillStyle = "#000";
    ctx.font = "bold 22px Cinzel";
    ctx.textAlign = "center";
    ctx.fillText("G", cx - 178, cy - 50);
    // Green online dot
    ctx.beginPath();
    ctx.arc(cx - 160, cy - 42, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#22c55e";
    ctx.fill();
    // Chat bubble
    const bubbleY = cy - 60;
    const typing = Math.floor(t * 1.5) % 40;
    const fullText = "How can I help your production today?";
    const shown = fullText.slice(0, typing);
    ctx.fillStyle = WHITE;
    ctx.font = "13px Rajdhani";
    ctx.textAlign = "left";
    ctx.fillText(shown + (typing < fullText.length ? "▌" : ""), cx - 145, bubbleY);
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.floor(w * 0.025)}px Cinzel`;
    ctx.textAlign = "center";
    ctx.fillText("AGENT GROK — 24/7 AI ASSISTANT", cx, h - 55);
    ctx.font = `${Math.floor(w * 0.015)}px Rajdhani`;
    ctx.fillStyle = WHITE;
    ctx.fillText("Full knowledge of all 23 pages · Available on every page · Ask anything", cx, h - 32);
  },
};

const tuts = [
  { n: "01", t: "Getting Started — Platform Overview & Navigation", d: "Full walkthrough of all 23 pages, the Quick Access menu, footer controls, and how to navigate the studio. Learn how every page connects and what order gives you the fastest path from idea to finished film.", dur: "12:00", l: "Beginner", tips: ["Use the Quick Access menu (top left) to jump to any of the 23 pages instantly","Hit SAVE PROJECT in the footer at any time — your work restores exactly where you left off","Page 23 has the complete How-To-Use Guide covering every page in detail","Guest users can explore the full platform without signing in"] },
  { n: "02", t: "Writing Tools — Script to Screen in Minutes (Page 5)", d: "How to use the 50+ professional writing tools on Page 5. From logline to full feature screenplay, episode arc, character bible, and documentary script — all generated in seconds with AI CREATE.", dur: "9:30", l: "Beginner", tips: ["Click any tool card to open it in a full modal with prompt fields","Use AI CREATE to generate any script format instantly","Copy your finished script straight into the Voice Engine on Page 6","50+ formats: loglines, treatments, feature scripts, episode arcs, character bibles, dialogue rewrites"] },
  { n: "03", t: "Voice Engine — 54 Characters, Real Narration (Page 6)", d: "Complete guide to Page 6. Choosing from 54 professional voice characters, setting pitch, rate, pause and mood, using the TEST button before committing, and using PREPARE & SPEAK for the best AI-formatted delivery.", dur: "14:20", l: "Beginner", tips: ["APPLY JAMES SETTINGS sets the perfect documentary narration: pitch 0.86, rate 0.62, pause 1600ms","Filter voices by gender, age, and origin to find your character instantly","Hit TEST on any voice card to hear it before selecting","Always use PREPARE & SPEAK — it AI-formats your script for the best spoken result","Adjust the MOOD slider across 14 emotional registers for the right tone"] },
  { n: "04", t: "Music Video Studio — Full Production Walkthrough (Page 6)", d: "Step-by-step guide to the Music Video Studio inside Page 6. Song setup, choosing visual style and colour grade, writing your scene description, generating your music video, and exporting to social platforms.", dur: "18:45", l: "Intermediate", tips: ["Access from the MUSIC VIDEO STUDIO button on Page 6","Upload your own audio track on Step 1 — the visuals sync to your beat automatically","The more detailed your Step 3 scene description, the better the generated result","Step 2 colour grade choices: Cinematic, Noir, Golden Hour, Arctic Blue, and more","Download directly from Step 4 or share to YouTube, TikTok, and Instagram in one click"] },
  { n: "05", t: "Video Generator — Cinematic Scene Generation (Page 8)", d: "How to describe any scene and have the MandaStrong Cinema Engine build it as a visual clip. Using reference images to match a style, setting duration, and saving clips to your Media Library for the Timeline.", dur: "16:00", l: "Intermediate", tips: ["Describe lighting, mood, camera angle, time of day, characters, and setting for the best result","Upload a reference image to match a specific visual style or colour palette","Every generated clip saves automatically to your Media Library on Page 11","Use NEXT SCENE to build your full film clip by clip in sequence","You can bypass this and upload your own video files using UPLOAD MEDIA on Page 13"] },
  { n: "06", t: "Upload Media — Bring Your Own Files (Page 13)", d: "How to upload your own video, audio, and image files directly into the Timeline Editor without using the AI Video Generator. Files are saved to your Supabase Media Library and available across every tool.", dur: "5:00", l: "Beginner", tips: ["Hit UPLOAD MEDIA at the top of the MEDIA BOX in the Timeline Editor on Page 13","Accepts video (MP4, MOV, WebM), audio (MP3, WAV), and images (JPG, PNG, WebP)","Uploaded files are saved to Supabase Storage and persist across sessions","Guest users get a local session-only upload — sign in to save files permanently","A progress bar shows upload percentage in real time"] },
  { n: "07", t: "Timeline Editor — Building Your Film (Page 13)", d: "Dragging clips to video, voice, music, and effects tracks. Syncing all tracks from your Media Library with one click. Adjusting film duration from 1 to 180 minutes, and locking your timeline before render.", dur: "11:30", l: "Intermediate", tips: ["Hit SYNC ALL TRACKS to auto-populate all four tracks from your Media Library","Four tracks: VIDEO · VOICE · MUSIC · EFFECTS — drag any asset to any track","Set film duration: 60, 90, or 180 minutes","Use UPLOAD MEDIA to bring in your own files without using the AI generator","Hit RENDER when your timeline is locked and ready"] },
  { n: "08", t: "Audio Mixer — Professional Sound Design (Page 15)", d: "Setting the perfect mix for documentary, narrative film, or music video. Recommended levels for each format, the equaliser, audio ducking, noise reduction, and saving your mix as a preset.", dur: "7:15", l: "Beginner", tips: ["Documentary mix: VOICE 85 · MUSIC 40 · EFX 50 · MASTER 85","Music video mix: MUSIC 75 · VOICE 60 · EFX 40 · MASTER 85","Enable AUDIO DUCKING to automatically lower music when voice plays","Use the 3-band EQ (Bass / Mid / Treble) to shape your final sound","Hit SAVE PRESET to store your favourite mix for future projects"] },
  { n: "09", t: "Render Engine — Producing Your Film (Page 16)", d: "Choosing quality settings (1080p, 4K, 8K), understanding VP9 codec advantages, starting the render, and what happens when clips need regenerating before the final output.", dur: "10:45", l: "Intermediate", tips: ["Creator plan: 1080p HD · Pro plan: 4K · Studio plan: 8K cinema quality","VP9 codec delivers better quality at the same file size compared to H.264","The engine automatically detects and re-generates any missing clips before rendering","Lock your timeline and approve your audio mix before hitting START RENDER","Studio plan supports films up to 3 hours (180 minutes)"] },
  { n: "10", t: "Export & Distribute — Getting Your Film Out (Page 18)", d: "Downloading your completed film and sharing one-click to YouTube, TikTok, Instagram, Facebook, LinkedIn, Vimeo, and WhatsApp directly from inside the platform.", dur: "6:00", l: "Beginner", tips: ["Hit DOWNLOAD to save the film file to your device first as a backup","One-click share buttons open each platform's upload page with your file ready","Your rendered film is saved to your project history for re-download at any time","Add your MandaStrong Studio credit and a link in your post description"] },
  { n: "11", t: "AI For Humanity Documentary — Full Case Study", d: "Complete production case study: how a full-length AI For Humanity documentary was built inside MandaStrong Studio from concept to render — covering script, narration, scene generation, timeline assembly, and export.", dur: "25:00", l: "Advanced", tips: ["Full workflow: Page 5 → Page 6 (James) → Page 8 → Page 13 → Page 15 → Page 16 → Page 18","James narration: pitch 0.86, rate 0.62, pause 1600ms","13 scenes generated on Page 8 and synced on the timeline — total runtime 90 minutes","Each chapter of the documentary gets its own dedicated generated scene","Own footage added via UPLOAD MEDIA on Page 13 alongside AI-generated clips"] },
  { n: "12", t: "Saving, Loading & Project History", d: "How to save your full session, restore from project history, and ensure your media library assets persist across devices and sessions via Supabase cloud storage.", dur: "5:30", l: "Beginner", tips: ["Hit SAVE PROJECT in the footer at any time from any page","MY PROJECTS restores your work exactly where you left off — timeline, media, settings","Uploaded files via UPLOAD MEDIA are stored in Supabase and survive browser restarts","Always download your rendered film before closing the browser","Sign in to enable permanent cloud saves — guest sessions are local only"] },
  { n: "13", t: "Agent Grok — Your 24/7 AI Studio Assistant", d: "How to use Agent Grok for instant answers on any tool, workflow, voice settings, pricing, or export question. Grok has full knowledge of all 23 pages and every feature in the platform.", dur: "4:00", l: "Beginner", tips: ["Click the gold G button fixed to the bottom-left of every page to open Agent Grok","Use the Quick Start suggestion buttons to get answers immediately without typing","Follow-up suggestion buttons appear after each answer for deeper exploration","Ask about any page, tool, workflow, pricing plan, voice settings, or export options","Agent Grok covers all 23 pages with detailed, accurate answers — available 24/7"] },
];

function LessonCanvas({ lessonId }: { lessonId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const renderer = lessonRenderers[lessonId];
    if (!renderer) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = Math.round(parent.clientWidth * 9 / 16);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = (ts - startRef.current) / 1000;
      renderer(ctx, t, canvas.width, canvas.height);
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [lessonId]);

  return <canvas ref={canvasRef} style={{ width: "100%", display: "block", background: "#000" }} />;
}

export default function Page19({ onNavigate }: PageProps) {
  const [activeVid, setActiveVid] = useState<number | null>(null);
  const [playing, setPlaying] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setActiveVid(v => v === idx ? null : idx);
  };

  const generate = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setPlaying(p => { const n = new Set(p); n.add(idx); return n; });
    setActiveVid(idx);
  };

  return (
    <div style={{ ...Sp, padding: "30px 40px" }}>
      <style>{`
        @keyframes p2{0%,100%{opacity:.4}50%{opacity:1}}
        .tut-row:hover { border-color: ${GOLD} !important; }
        .gen-btn:hover { filter: brightness(1.15); }
      `}</style>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ fontSize: 11, color: GOLD, letterSpacing: 4, marginBottom: 4, fontWeight: 700 }}>LEARNING CENTER</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4, flexWrap: "wrap" }}>
          <h1 style={{ ...H1, fontSize: 28, margin: 0 }}>TUTORIALS</h1>
          <div style={{ background: "#0a0500", border: `1px solid ${GOLD}`, padding: "4px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "p2 1.5s ease-in-out infinite" }} />
            <span style={{ color: GOLD, fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>13 LESSONS READY TO WATCH</span>
          </div>
        </div>
        <div style={{ color: WHITE, fontSize: 13, marginBottom: 24, lineHeight: 1.8 }}>
          Step-by-step video guides for every part of MandaStrong Studio. Click any tutorial to generate and watch.
        </div>

        {tuts.map((t, idx) => (
          <div key={t.n} style={{ marginBottom: 10 }}>
            <div
              className="tut-row"
              onClick={() => toggle(idx)}
              style={{
                ...Card(), cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderColor: activeVid === idx ? GOLD : GOLDDIM,
                borderBottom: activeVid === idx ? "none" : undefined,
                transition: "border-color .15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontFamily: "'Cinzel',serif", color: GOLD, fontSize: 16, fontWeight: 900, minWidth: 28 }}>{t.n}</span>
                <div>
                  <div style={{ color: WHITE, fontWeight: 800, fontSize: 14 }}>{t.t}</div>
                  <div style={{ color: DIM, fontSize: 11, marginTop: 2, letterSpacing: 1 }}>{t.dur} · {t.tips.length} PRO TIPS · CLICK TO {activeVid === idx ? "COLLAPSE" : "EXPAND"}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                {!playing.has(idx) && (
                  <button
                    className="gen-btn"
                    onClick={e => generate(e, idx)}
                    style={{
                      background: `linear-gradient(135deg,${GOLDDIM},${GOLD})`,
                      border: "none", color: "#000",
                      padding: "6px 16px", cursor: "pointer",
                      fontSize: 10, fontWeight: 900, letterSpacing: 2,
                      fontFamily: "'Rajdhani',sans-serif",
                      transition: "filter .15s",
                    }}
                  >
                    ▶ GENERATE TO WATCH
                  </button>
                )}
                {playing.has(idx) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e", animation: "p2 1s ease-in-out infinite" }} />
                    <span style={{ color: "#22c55e", fontSize: 10, fontWeight: 900, letterSpacing: 2 }}>PLAYING</span>
                  </div>
                )}
                <span style={{ background: lc[t.l] + "22", border: `1px solid ${lc[t.l]}`, color: lc[t.l], padding: "3px 10px", fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>{t.l.toUpperCase()}</span>
                <span style={{ color: GOLD, fontSize: 16, fontWeight: 900 }}>{activeVid === idx ? "▲" : "▼"}</span>
              </div>
            </div>

            {activeVid === idx && (
              <div style={{ background: "#050500", border: `2px solid ${GOLD}`, borderTop: "none" }}>
                {playing.has(idx) ? (
                  <LessonCanvas lessonId={t.n} />
                ) : (
                  <div
                    onClick={e => generate(e, idx)}
                    style={{
                      aspectRatio: "16/9", background: "#040300",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", gap: 16,
                    }}
                  >
                    <div style={{
                      width: 72, height: 72,
                      background: `linear-gradient(135deg,${GOLDDIM},${GOLD})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 0 40px ${GOLD}44`,
                    }}>
                      <span style={{ color: "#000", fontSize: 28, fontWeight: 900 }}>▶</span>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: GOLD, fontWeight: 900, fontSize: 14, letterSpacing: 3 }}>GENERATE TO WATCH</div>
                      <div style={{ color: DIM, fontSize: 11, marginTop: 4, letterSpacing: 1 }}>LESSON {t.n} · {t.dur} · {t.l.toUpperCase()}</div>
                    </div>
                  </div>
                )}

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
                    {!playing.has(idx) && (
                      <button onClick={e => generate(e, idx)} style={{ background: `linear-gradient(135deg,${GOLDDIM},${GOLD})`, border: "none", color: "#000", padding: "12px 24px", cursor: "pointer", fontSize: 12, fontWeight: 900, letterSpacing: 2, fontFamily: "'Rajdhani',sans-serif" }}>
                        ▶ GENERATE TO WATCH
                      </button>
                    )}
                    {playing.has(idx) && (
                      <button onClick={() => { setPlaying(p => { const n = new Set(p); n.delete(idx); return n; }); }} style={{ background: "transparent", border: `1px solid ${GOLD}`, color: GOLD, padding: "12px 24px", cursor: "pointer", fontSize: 12, fontWeight: 900, letterSpacing: 2, fontFamily: "'Rajdhani',sans-serif" }}>
                        STOP
                      </button>
                    )}
                    {idx > 0 && <button onClick={() => { setActiveVid(idx - 1); }} style={{ background: "transparent", border: `1px solid ${GOLDDIM}`, color: WHITE, padding: "8px 16px", cursor: "pointer", fontSize: 11, fontWeight: 900, letterSpacing: 2, fontFamily: "'Rajdhani',sans-serif" }}>PREV</button>}
                    {idx < tuts.length - 1 && <button onClick={() => { setActiveVid(idx + 1); }} style={{ background: "transparent", border: `1px solid ${GOLDDIM}`, color: WHITE, padding: "8px 16px", cursor: "pointer", fontSize: 11, fontWeight: 900, letterSpacing: 2, fontFamily: "'Rajdhani',sans-serif" }}>NEXT</button>}
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
