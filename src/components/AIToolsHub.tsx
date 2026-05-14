import { useState, useRef } from 'react';

const GOLD = "#e8c96d";
const GOLDDIM = "#a07820";
const WHITE = "#d4c9a8";
const DIM = "#aaaaaa";
const BG4 = "#080808";

const H1style: React.CSSProperties = { fontFamily:"'Cinzel',serif", color:GOLD, letterSpacing:5, textTransform:"uppercase", margin:0, fontSize:"clamp(16px,3vw,28px)" };
const Gstyle = (v: "gold"|"out", sm?: boolean): React.CSSProperties => ({
  background: v==="gold" ? `linear-gradient(135deg,${GOLDDIM},${GOLD})` : "transparent",
  border: v==="gold" ? "none" : `1px solid ${GOLD}`,
  color: v==="gold" ? "#000" : GOLD,
  borderRadius:0, fontWeight:900,
  padding: sm ? "5px 14px" : "10px 26px",
  fontSize: sm ? 11 : 13,
  cursor:"pointer", letterSpacing:2, textTransform:"uppercase" as const,
  fontFamily:"'Rajdhani',sans-serif",
});
const inp: React.CSSProperties = { width:"100%", background:"#000", border:`1px solid ${GOLDDIM}`, padding:"9px 12px", color:WHITE, fontSize:14, outline:"none", boxSizing:"border-box" as const, fontFamily:"'Rajdhani',sans-serif" };

const CLAUDE_ENDPOINT = "https://njqfexhltjwpgvctmyaw.supabase.co/functions/v1/claude-proxy";

function detectToolType(tool: string) {
  const n = tool.toLowerCase();
  const isVideo = n.includes("video") || n.includes("film") || n.includes("scene") || n.includes("animator") || n.includes("motion") || n.includes("reel") || n.includes("trailer") || n.includes("cut") || n.includes("switcher") || n.includes("multi-cam");
  const isImage = n.includes("image") || n.includes("photo") || n.includes("art") || n.includes("storyboard") || n.includes("concept") || n.includes("design") || n.includes("poster") || n.includes("thumbnail") || n.includes("frame") || n.includes("look") || n.includes("grade") || n.includes("color") || n.includes("lut") || n.includes("grain") || n.includes("blur") || n.includes("glow") || n.includes("glitch") || n.includes("distort") || n.includes("texture") || n.includes("sharpen");
  const isAudio = n.includes("audio") || n.includes("sound") || n.includes("music") || n.includes("voice") || n.includes("foley") || n.includes("mix") || n.includes("eq") || n.includes("reverb") || n.includes("score") || n.includes("composer") || n.includes("mastering") || n.includes("speech");
  const isScript = n.includes("script") || n.includes("story") || n.includes("dialogue") || n.includes("screenplay") || n.includes("narrat") || n.includes("subtitle") || n.includes("caption") || n.includes("transcri");
  return { isVideo, isImage, isAudio, isScript };
}

function buildPrompt(tool: string, describe: string): string {
  const { isVideo, isImage, isAudio, isScript } = detectToolType(tool);
  if (isVideo) {
    return `You are a professional film director at MandaStrong Studio. Tool: "${tool}".\n\nUser description: ${describe}\n\nGenerate a COMPLETE PRODUCTION-READY video prompt package:\n\n1. OPTIMISED VIDEO PROMPT\n2. SCENE BREAKDOWN (5-8 shots)\n3. CAMERA DIRECTIONS\n4. LIGHTING & COLOUR GRADE\n5. AUDIO NOTES\n6. DURATION ESTIMATE\n7. DIRECTOR'S NOTES\n\nMake it specific, cinematic and immediately production-ready.`;
  }
  if (isImage) {
    return `You are a professional visual artist at MandaStrong Studio. Tool: "${tool}".\n\nUser description: ${describe}\n\nGenerate a COMPLETE IMAGE PROMPT PACKAGE:\n\n1. OPTIMISED PROMPT\n2. STYLE & MEDIUM\n3. LIGHTING & COLOUR PALETTE\n4. COMPOSITION & FRAMING\n5. NEGATIVE PROMPT\n6. ASPECT RATIO & RESOLUTION\n7. STYLE REFERENCES\n\nBe specific, artistic, and immediately usable in any image AI generator.`;
  }
  if (isAudio) {
    return `You are a professional sound designer at MandaStrong Studio. Tool: "${tool}".\n\nUser description: ${describe}\n\nGenerate a COMPLETE AUDIO PRODUCTION PACKAGE:\n\n1. AUDIO DESCRIPTION & MOOD\n2. INSTRUMENTS / SOUND ELEMENTS\n3. TEMPO & RHYTHM\n4. FREQUENCY NOTES\n5. MIX DIRECTIONS\n6. REFERENCE TRACKS\n7. TECHNICAL SPECS\n\nBe specific and production-ready.`;
  }
  if (isScript) {
    return `You are a professional screenwriter at MandaStrong Studio. Tool: "${tool}".\n\nUser request: ${describe}\n\nGenerate complete, properly formatted, production-ready content. Include character names, scene headings, action lines, and dialogue where appropriate.`;
  }
  return `You are a professional at MandaStrong Studio cinema AI platform. Tool: "${tool}".\n\nUser request: ${describe}\n\nGenerate complete, detailed, professional, production-ready content. Be specific and thorough.`;
}

function ToolPanel({ tool, onClose, onSave }: { tool: string; onClose: () => void; onSave: (asset: Record<string,unknown>) => void }) {
  const { isVideo, isImage, isAudio, isScript } = detectToolType(tool);
  const [mode, setMode] = useState<"ai"|"upload"|"paste">(isVideo||isImage||isAudio||isScript ? "ai" : "ai");
  const [describe, setDescribe] = useState("");
  const [result, setResult] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const placeholder = isVideo
    ? "e.g. A lone astronaut walks across a red planet at sunset, slow pan, golden hour light..."
    : isImage
    ? "e.g. Portrait of a warrior queen at golden hour, cinematic, film grain, 8K..."
    : isAudio
    ? "e.g. Dark orchestral score, tension building, strings and brass, cinematic..."
    : isScript
    ? "e.g. A documentary about veterans' mental health, emotional, fly-on-the-wall style..."
    : `Describe exactly what you want ${tool} to produce...`;

  const label = isVideo ? "DESCRIBE YOUR SCENE OR FILM IDEA"
    : isImage ? "DESCRIBE YOUR IMAGE"
    : isAudio ? "DESCRIBE YOUR SOUND OR MUSIC"
    : isScript ? "DESCRIBE YOUR STORY OR SCRIPT"
    : "DESCRIBE WHAT YOU WANT";

  const btnLabel = isVideo ? "🎬 CREATE VIDEO PACKAGE ✦"
    : isImage ? "🎨 CREATE IMAGE PROMPT ✦"
    : isAudio ? "🎵 CREATE AUDIO PACKAGE ✦"
    : isScript ? "✍ WRITE SCRIPT ✦"
    : "✦ AI CREATE";

  const runAI = async () => {
    if (!describe.trim()) return;
    setLoading(true); setSaved(false); setResult("");
    try {
      const prompt = buildPrompt(tool, describe);
      const res = await fetch(CLAUDE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1800, messages: [{ role: "user", content: prompt }] })
      });
      const d = await res.json();
      const txt = d.content && d.content[0] ? d.content[0].text : "Generated!";
      setResult(txt);
    } catch {
      setResult("Connection error — check your internet and try again.");
    }
    setLoading(false);
  };

  const saveAsset = () => {
    const content = result || describe;
    if (!content.trim()) return;
    onSave({ id: Date.now() + Math.random(), name: `${tool} — Result`, type: "text/plain", url: "", content });
    setSaved(true);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(0,0,0,0.92)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"min(640px,95vw)", background:"#050505", border:`1px solid ${GOLD}`, padding:26, maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h2 style={{ ...H1style, fontSize:16, margin:0, letterSpacing:4 }}>{tool}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:GOLD, fontSize:20, cursor:"pointer" }}>✕</button>
        </div>

        {/* Mode tabs */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:18 }}>
          {(["ai","upload","paste"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ ...Gstyle(mode===m?"gold":"out", true), fontSize:11 }}>
              {m==="ai" ? "AI CREATE ✦" : m==="upload" ? "UPLOAD" : "PASTE / URL"}
            </button>
          ))}
        </div>

        {mode==="ai" && (
          <div style={{ marginBottom:14 }}>
            <div style={{ color:GOLD, fontSize:12, letterSpacing:3, fontWeight:900, marginBottom:4 }}>{label}</div>
            <textarea
              value={describe}
              onChange={e => setDescribe(e.target.value)}
              placeholder={placeholder}
              style={{ ...inp, height:100, resize:"none", lineHeight:1.6 }}
            />
            <button
              onClick={runAI}
              disabled={loading || !describe.trim()}
              style={{ ...Gstyle("gold"), marginTop:8, width:"100%", padding:"14px", opacity:loading||!describe.trim()?0.5:1, fontSize:13, letterSpacing:2 }}
            >
              {loading ? "⟳ CREATING..." : btnLabel}
            </button>
            {result && (
              <div style={{ marginTop:14 }}>
                <textarea
                  value={result}
                  onChange={e => setResult(e.target.value)}
                  style={{ ...inp, height:180, resize:"none", lineHeight:1.7 }}
                />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
                  <button onClick={saveAsset} style={{ ...Gstyle("gold"), padding:"11px" }}>💾 SAVE TO LIBRARY</button>
                  <button onClick={runAI} disabled={loading} style={{ ...Gstyle("out"), padding:"11px", opacity:loading?0.5:1 }}>⟳ REGENERATE</button>
                </div>
              </div>
            )}
          </div>
        )}

        {mode==="upload" && (
          <div style={{ marginBottom:14 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border:`2px dashed ${GOLDDIM}`, padding:"30px 20px", textAlign:"center", cursor:"pointer" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor=GOLD)}
              onMouseLeave={e => (e.currentTarget.style.borderColor=GOLDDIM)}
            >
              <div style={{ fontSize:28, marginBottom:8 }}>⬆</div>
              <div style={{ color:WHITE, fontSize:13, fontWeight:700, letterSpacing:1 }}>CLICK TO BROWSE</div>
              <div style={{ color:DIM, fontSize:12, marginTop:4 }}>Video · Audio · Image · Text</div>
            </div>
            <input ref={fileRef} type="file" style={{ display:"none" }} onChange={e => {
              const f = e.target.files?.[0];
              if (f) { onSave({ id:Date.now()+Math.random(), name:f.name, type:f.type, file:f, url:URL.createObjectURL(f) }); setSaved(true); }
            }} />
          </div>
        )}

        {mode==="paste" && (
          <div style={{ marginBottom:14 }}>
            <div style={{ color:GOLD, fontSize:12, letterSpacing:3, fontWeight:900, marginBottom:6 }}>ADD URL</div>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste a URL..." style={{ ...inp, marginBottom:10 }} />
            <div style={{ color:GOLD, fontSize:12, letterSpacing:3, fontWeight:900, marginBottom:6 }}>OR PASTE TEXT</div>
            <textarea value={describe} onChange={e => setDescribe(e.target.value)} placeholder="Paste your content here..." style={{ ...inp, height:100, resize:"none", lineHeight:1.6 }} />
            <button onClick={saveAsset} style={{ ...Gstyle("gold"), marginTop:8, width:"100%", padding:"12px" }}>SAVE TO MEDIA LIBRARY</button>
          </div>
        )}

        {saved && (
          <div style={{ marginTop:14, background:"#0a2a0a", border:"1px solid #22c55e", padding:"12px 16px", textAlign:"center" }}>
            <div style={{ color:"#22c55e", fontWeight:900, fontSize:14, letterSpacing:2 }}>✓ ASSET SAVED TO MEDIA LIBRARY</div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AIToolsHubProps {
  tools: string[];
  pageNumber: number;
  onNavigate: (page: number) => void;
  onOpenAssetPage: (toolName: string, mode: 'upload' | 'create') => void;
  onSave?: (asset: Record<string,unknown>) => void;
}

export default function AIToolsHub({ tools, pageNumber, onNavigate, onSave }: AIToolsHubProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const filtered = tools.filter(t => t.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (asset: Record<string,unknown>) => {
    if (onSave) onSave(asset);
    setSelectedTool(null);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#000", color:WHITE, fontFamily:"'Rajdhani',sans-serif", paddingBottom:120 }}>
      {/* Header */}
      <div style={{ padding:"14px 18px 12px", borderBottom:`1px solid ${GOLDDIM}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:11, color:GOLD, letterSpacing:4, fontWeight:700 }}>MANDASTRONG STUDIO</div>
          <h1 style={{ ...H1style, fontSize:22, margin:0 }}>AI TOOL BOARD</h1>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ position:"relative" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${tools.length} tools...`}
              style={{ background:"#000", border:`1px solid ${GOLDDIM}`, padding:"7px 12px 7px 30px", color:WHITE, fontSize:13, outline:"none", width:220, fontFamily:"'Rajdhani',sans-serif" }}
            />
            <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:GOLD, fontSize:14 }}>🔍</span>
            {search && (
              <button onClick={() => setSearch("")} style={{ position:"absolute", right:7, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:GOLD, cursor:"pointer", padding:0 }}>✕</button>
            )}
          </div>
          <span style={{ color:WHITE, fontSize:12, fontWeight:700, letterSpacing:1 }}>{filtered.length} TOOLS</span>
        </div>
      </div>

      {/* Tool grid */}
      <div style={{ padding:12, display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:8 }}>
        {filtered.map(t => (
          <div
            key={t}
            onClick={() => setSelectedTool(t)}
            style={{ background:"#000", border:`1px solid ${GOLDDIM}`, padding:"14px 12px", cursor:"pointer", transition:"all .15s", minHeight:56, display:"flex", alignItems:"center" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor=GOLD; (e.currentTarget as HTMLDivElement).style.background=BG4; (e.currentTarget as HTMLDivElement).style.boxShadow=`0 0 10px ${GOLD}44`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor=GOLDDIM; (e.currentTarget as HTMLDivElement).style.background="#000"; (e.currentTarget as HTMLDivElement).style.boxShadow="none"; }}
          >
            <div style={{ color:WHITE, fontSize:13, fontWeight:800, lineHeight:1.3, letterSpacing:.5 }}>{t}</div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, padding:"20px 12px" }}>
        <button onClick={() => onNavigate(pageNumber - 1)} disabled={pageNumber <= 1} style={{ ...Gstyle("out", true), opacity:pageNumber<=1?0.3:1 }}>◀ BACK</button>
        <span style={{ color:GOLD, fontSize:12, fontWeight:900, letterSpacing:2, fontFamily:"'Cinzel',serif" }}>PAGE {pageNumber}</span>
        <button onClick={() => onNavigate(pageNumber + 1)} style={{ ...Gstyle("gold", true) }}>NEXT ▶</button>
      </div>

      {selectedTool && (
        <ToolPanel
          tool={selectedTool}
          onClose={() => setSelectedTool(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
