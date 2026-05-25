// @ts-nocheck
import { useState, useRef, useEffect } from "react";

// ==================== INDEXEDDB ====================
const DB_NAME = "mandastrong_db";
const DB_VER = 1;
const STORE = "clips";

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

// ==================== ARRAYS (Paste your full versions) ====================
const VOICE_CHARACTERS = [ /* ← PASTE YOUR FULL 54 VOICE ARRAY HERE */ ];
const WRITING = [ /* your full WRITING tools */ ];
const IMAGE_T = [ /* your full IMAGE tools */ ];
const VIDEO_T = [ /* your full VIDEO tools */ ];
const MOTION = [ /* your full MOTION tools */ ];
const STOCK_VOICES = [ /* your STOCK_VOICES */ ];

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

// ==================== ALL COMPONENTS (P1 to P23) ====================
// Paste your full component definitions here (Header, Footer, P1, P2, ..., P23, ToolPage, MusicVideoStudio, etc.)

// Example placeholders - replace with your actual code:
function P1({ go }) { return <div style={Sp}><h1 style={H1}>Welcome to MandaStrong Studio</h1></div>; }
function P6Voice({ onSave, setMediaLib }) { /* your full P6Voice code */ return <div style={Sp}>Voice Engine</div>; }
function P8VideoGenerator({ onSave, filmDuration, setFilmDuration }) { /* your full P8 code */ return <div style={Sp}>Video Generator</div>; }
// ... add all other P components ...

function Header({ go, setMenu }) { /* your Header */ return <div>...</div>; }
function Footer({ page, go, onSave, onHistory }) { /* your Footer */ return <div>...</div>; }
// Add ProjectHistoryModal, SaveSessionModal, ToolPage, etc.

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

  // Restore logic
  useEffect(() => {
    const restore = async () => {
      try {
        const savedPage = JSON.parse(localStorage.getItem("ms_page") || "1");
        setPage(Number(savedPage));

        const savedTimeline = JSON.parse(localStorage.getItem("ms_timeline") || "{}");
        if (Object.keys(savedTimeline).length) setTimeline(savedTimeline);

        const dbClips = await getAllClipsFromDB();
        if (dbClips.length > 0) {
          const restored = dbClips.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            url: URL.createObjectURL(c.blob),
            file: new File([c.blob], c.name, { type: c.type }),
            dbId: c.id
          }));
          setMediaLib(restored);
        }
      } catch (e) { console.warn(e); }
    };
    restore();
  }, []);

  const saveAsset = async (a) => {
    if (a.file) {
      try {
        const dbId = a.id || "asset_" + Date.now().toString();
        await saveClipToDB(dbId, a.file, a.name || "asset", a.type || "video/webm");
        setMediaLib(prev => [...prev, { ...a, id: dbId, dbId, url: URL.createObjectURL(a.file) }]);
      } catch (e) {
        console.warn(e);
        setMediaLib(prev => [...prev, a]);
      }
    } else {
      setMediaLib(prev => [...prev, a]);
    }
  };

  const renderPage = () => {
    switch (page) {
      case 1: return <P1 go={go} />;
      case 6: return <P6Voice onSave={saveAsset} setMediaLib={setMediaLib} />;
      case 8: return <P8VideoGenerator onSave={saveAsset} filmDuration={filmDuration} setFilmDuration={setFilmDuration} />;
      // Add all your other cases here (2-5,7,9-23)
      default: return <P1 go={go} />;
    }
  };

  return (
    <div style={{ background: "#000", minHeight: "100vh", fontFamily: "'Rajdhani',sans-serif" }}>
      <Header go={go} setMenu={setMenu} />
      {menu && <QAMenu go={go} onClose={() => setMenu(false)} user={user} />}
      {showHistory && <ProjectHistoryModal onClose={() => setShowHistory(false)} />}
      {showSaveModal && <SaveSessionModal onClose={() => setShowSaveModal(false)} onSave={() => {}} currentPage={page} assetCount={mediaLib.length} />}
      {savedNotice && <div style={{position:"fixed", top:60, left:"50%", transform:"translateX(-50%)", background:GOLD, color:"#000", padding:"10px 24px", fontWeight:900, zIndex:999}}>✓ PROJECT SAVED</div>}

      <div style={{ minHeight: "calc(100vh - 116px)" }}>
        <div key={page}>{renderPage()}</div>
      </div>

      <Footer page={page} go={go} onSave={() => setShowSaveModal(true)} onHistory={() => setShowHistory(true)} />
    </div>
  );
}