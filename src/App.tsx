// @ts-nocheck
import { useState, useRef, useEffect } from "react";

// ==================== INDEXEDDB ====================
const DB_NAME = "mandastrong_db", DB_VER = 1, STORE = "clips";

const openDB = () => new Promise((res, rej) => {
  const r = indexedDB.open(DB_NAME, DB_VER);
  r.onupgradeneeded = e => e.target.result.createObjectStore(STORE, { keyPath: "id" });
  r.onsuccess = e => res(e.target.result);
  r.onerror = rej;
});

const saveClipToDB = async (id, blob, name, type) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ id, blob, name, type });
    await new Promise((r, j) => { tx.oncomplete = r; tx.onerror = j; });
  } catch (e) { console.warn("DB save failed", e); }
};

const getAllClipsFromDB = async () => {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = rej;
    });
  } catch (e) { return []; }
};

// ==================== CONSTANTS ====================
const GOLD = "#e8c96d";
const GOLDDIM = "#a07820";
const WHITE = "#d4c9a8";
const DIM = "#aaaaaa";

const TOTAL = 23;

const G = (v, sm) => ({
  background: v === "gold" ? `linear-gradient(135deg,${GOLDDIM},${GOLD})` : "transparent",
  border: v === "gold" ? "none" : `1px solid ${GOLD}`,
  color: v === "gold" ? "#000" : GOLD,
  borderRadius: 0, fontWeight: 900,
  padding: sm ? "5px 14px" : "10px 26px",
  fontSize: sm ? 11 : 13,
  cursor: "pointer", letterSpacing: 2, textTransform: "uppercase",
  fontFamily: "'Rajdhani',sans-serif",
});

const Sp = { minHeight: "100vh", background: "#000", color: WHITE, fontFamily: "'Rajdhani',sans-serif", paddingBottom: 160, width: "100%", overflowX: "hidden" };
const H1 = { fontFamily: "'Cinzel',serif", color: GOLD, letterSpacing: 5, textTransform: "uppercase", margin: 0, fontSize: "clamp(16px,3vw,32px)" };
const Card = (x = {}) => ({ background: "#0a0a0a", border: `1px solid ${GOLDDIM}`, borderRadius: 0, padding: 18, ...x });

// ==================== YOUR FULL ARRAYS ====================
// Paste your complete arrays here:
const VOICE_CHARACTERS = [ /* full 54 voices */ ];
const WRITING = [ /* full list */ ];
const IMAGE_T = [ /* full list */ ];
const VIDEO_T = [ /* full list */ ];
const MOTION = [ /* full list */ ];
const STOCK_VOICES = [ /* full list */ ];

// ==================== HELPERS ====================
const proxyFetch = async (body) => {
  const res = await fetch("https://njqfexhltjwpgvctmyaw.supabase.co/functions/v1/claude-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
};

function buildChunks(txt) {
  const clean = txt.replace(/\.\.\.|\.{3}/g, " ... ").trim();
  const sentences = clean.match(/[^.!?\n]+[.!?\n]?/g) || [clean];
  return sentences.map(s => ({ text: s.trim(), type: "sentence" })).filter(c => c.text);
}

function speakText(voiceId, txt, onStart, onEnd) {
  if (!txt?.trim()) return;
  window.speechSynthesis.cancel();
  const clean = txt.slice(0, 5000);
  const utt = new SpeechSynthesisUtterance(clean);
  utt.onstart = () => onStart?.();
  utt.onend = () => onEnd?.();
  utt.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utt);
}

function stopSpeaking() {
  window.speechSynthesis.cancel();
}

// ==================== PASTE ALL YOUR COMPONENTS HERE ====================
// P1, P2, P3, P4, ToolPage, P6Voice, MusicVideoStudio, P8VideoGenerator, P11–P23, etc.
// Make sure there are no duplicate function names.

export default function App() {
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState(false);
  const [user, setUser] = useState({ name: "Guest", plan: "Guest", isAdmin: false });
  const [mediaLib, setMediaLib] = useState([]);
  const [timeline, setTimeline] = useState({});
  const [rendered, setRendered] = useState(null);
  const [filmDuration, setFilmDuration] = useState(60);
  const [savedNotice, setSavedNotice] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const go = (p) => { setPage(p); window.scrollTo(0, 0); };

  useEffect(() => {
    // Restore logic
    const restore = async () => {
      try {
        const p = JSON.parse(localStorage.getItem("ms_page") || "1");
        setPage(p);
        const t = JSON.parse(localStorage.getItem("ms_timeline") || "{}");
        if (Object.keys(t).length) setTimeline(t);
        const dbClips = await getAllClipsFromDB();
        if (dbClips.length > 0) {
          const restored = dbClips.map(c => ({
            id: c.id, name: c.name, type: c.type, url: URL.createObjectURL(c.blob),
            file: new File([c.blob], c.name, { type: c.type })
          }));
          setMediaLib(restored);
        }
      } catch (e) {}
    };
    restore();
  }, []);

  const saveAsset = async (a) => {
    if (a.file) {
      try {
        const dbId = a.id || Date.now().toString();
        await saveClipTo