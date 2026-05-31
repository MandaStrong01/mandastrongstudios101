// @ts-nocheck
import { useState, useRef, useEffect } from "react";

// IndexedDB helpers for persistent clip storage
const DB_NAME="mandastrong_db",DB_VER=1,STORE="clips";
const openDB=()=>new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,DB_VER);r.onupgradeneeded=e=>e.target.result.createObjectStore(STORE,{keyPath:"id"});r.onsuccess=e=>res(e.target.result);r.onerror=rej;});

function buildChunks(text){const clean=text.replace(/\s+/g," ").trim();const sentences=clean.match(/[^.!?]+[.!?]+[\s]*/g)||[clean];const chunks=[];for(const s of sentences){const trimmed=s.trim();if(trimmed.length>0){const type=trimmed.endsWith("?")?"question":trimmed.endsWith("!")?"exclaim":"sentence";chunks.push({text:trimmed,type});}}return chunks.length>0?chunks:[{text:clean.slice(0,200),type:"sentence"}];}

async function proxyFetch(body){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),55000);
  try{
    const res=await fetch("https://njqfexhltjwpgvctmyaw.supabase.co/functions/v1/claude-proxy",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:controller.signal});
    clearTimeout(timeout);
    return res.json();
  }catch(e){clearTimeout(timeout);throw e;}
}
const saveClipToDB=async(id,blob,name,type)=>{try{const db=await openDB();const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put({id,blob,name,type});await new Promise((r,j)=>{tx.oncomplete=r;tx.onerror=j;});}catch(e){console.warn("DB save failed",e);}};
const loadClipFromDB=async(id)=>{try{const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,"readonly");const req=tx.objectStore(STORE).get(id);req.onsuccess=()=>res(req.result);req.onerror=rej;});}catch(e){return null;}};
const getAllClipsFromDB=async()=>{try{const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,"readonly");const req=tx.objectStore(STORE).getAll();req.onsuccess=()=>res(req.result||[]);req.onerror=rej;});}catch(e){return[];}};

const GOLD = "#e8c96d";
const GOLDDIM = "#a07820";
const BG = "#000000";
const BLACK = "#000000";
const BG4 = "#080808";
const WHITE = "#d4c9a8";
const DIM = "#aaaaaa";
const TOTAL = 23;

const STRIPE = {
  basic:"https://buy.stripe.com/4gM5kFaVYfjN7EX0vMafS00",
  pro:"https://buy.stripe.com/14A00l8NQ0oTbVd3HYafS01",
  studio:"https://buy.stripe.com/fZubJ35BE3B53oHdiyafS02",
};

const G = (v, sm) => ({
  background: v==="gold" ? "linear-gradient(135deg,"+GOLDDIM+","+GOLD+")" : "transparent",
  border: v==="gold" ? "none" : "1px solid "+GOLD,
  color: v==="gold" ? "#000" : GOLD,
  borderRadius:0, fontWeight:900,
  padding: sm ? "5px 14px" : "10px 26px",
  fontSize: sm ? 11 : 13,
  cursor:"pointer", letterSpacing:2, textTransform:"uppercase",
  fontFamily:"'Rajdhani',sans-serif",
});
const Sp = { minHeight:"100vh", background:BG, color:WHITE, fontFamily:"'Rajdhani',sans-serif", paddingBottom:160, width:"100%", overflowX:"hidden" };
const H1 = { fontFamily:"'Cinzel',serif", color:GOLD, letterSpacing:5, textTransform:"uppercase", margin:0, fontSize:"clamp(16px,3vw,32px)" };
const Card = (x) => ({ background:"#0a0a0a", border:"1px solid "+GOLDDIM, borderRadius:0, padding:18, ...(x||{}) });

const STOCK_VOICES = [
  { id:"aurora", name:"Aurora", desc:"Warm British Female", style:"Documentary · Narrator", accent:"British RP" },
  { id:"marcus", name:"Marcus", desc:"Deep American Male", style:"Cinematic · Authoritative", accent:"American" },
  { id:"sophia", name:"Sophia", desc:"Bright Australian Female", style:"Upbeat · Engaging", accent:"Australian" },
  { id:"james",  name:"James",  desc:"Dry British Male", style:"Sarcastic · Witty", accent:"British" },
  { id:"nova",   name:"Nova",   desc:"Neutral AI Female", style:"Clean · Professional", accent:"Neutral" },
  { id:"river",  name:"River",  desc:"Warm American Male", style:"Friendly · Intimate", accent:"American South" },
];

const VOICE_TOOLS = ["Text to Voice","Text to Speech","Text to Narration","Text to Audiobook","Text to Voiceover","AI Voice Actor","Neural Voice Generator","Emotion Voice Synth","Documentary Voice","Trailer Voice Generator","Commercial Voice","Character Voice Creator","Audiobook Creator","Podcast Voice"];

let VOICE_ASSIGNMENTS = {};
const loadVoiceAssignments = () => {
  try { VOICE_ASSIGNMENTS = JSON.parse(localStorage.getItem("ms_voice_assign")||"{}"); } catch{}
};
if (typeof window !== "undefined") loadVoiceAssignments();

let currentUtterance = null;

function speakText(voiceId, txt, onStart, onEnd) {
  if (!txt||!txt.trim()) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
  const clean = txt
    .replace(/\.\.\.|\.{3}/g," ... ")
    .replace(/—/g,", ")
    .replace(/[*\/]/g," ")
    .replace(/([.!?])\s+([A-Z])/g,"$1 ... $2")
    .slice(0,5000);
  const doSpeak = () => {
    const allVoices = window.speechSynthesis.getVoices();
    const voiceChar = typeof VOICE_CHARACTERS !== "undefined"
      ? VOICE_CHARACTERS.find(v=>v.id===voiceId) : null;
    const utt = new SpeechSynthesisUtterance(clean);
    utt.pitch = voiceChar ? voiceChar.pitch : 1.0;
    utt.rate  = voiceChar ? voiceChar.rate  : 0.85;
    utt.volume = 1.0;
    const assignedName = VOICE_ASSIGNMENTS[voiceId];
    let picked = null;
    if(assignedName) picked = allVoices.find(v=>v.name===assignedName);
    if(!picked && voiceChar){
      const origin = (voiceChar.origin||"").toLowerCase();
      const gender = (voiceChar.gender||"").toLowerCase();
      const premiumBritish  = ["Daniel","Oliver","Arthur","George","Malcolm"];
      const premiumUSFemale = ["Samantha","Ava","Victoria","Karen"];
      const premiumUSMale   = ["Alex","Tom","Fred","Aaron"];
      const premiumAussie   = ["Karen","Lee"];
      const premiumIrish    = ["Moira"];
      const premiumScottish = ["Fiona"];
      let candidates = [];
      if(origin.includes("british")||origin.includes("english"))
        candidates = gender==="female" ? ["Serena","Tessa","Kate"] : premiumBritish;
      else if(origin.includes("irish"))    candidates = premiumIrish;
      else if(origin.includes("scottish")) candidates = premiumScottish;
      else if(origin.includes("australian")) candidates = premiumAussie;
      else if(gender==="female") candidates = premiumUSFemale;
      else candidates = premiumUSMale;
      for(const name of candidates){
        picked = allVoices.find(v=>v.name.includes(name));
        if(picked) break;
      }
    }
    if(!picked) picked = allVoices.find(v=>v.lang&&v.lang.startsWith("en"));
    if(!picked && allVoices.length) picked = allVoices[0];
    if(picked) utt.voice = picked;
    utt.lang = "en-GB";
    utt.onstart  = ()=>{ currentUtterance=utt; if(onStart) onStart(); };
    utt.onend    = ()=>{ currentUtterance=null; if(onEnd) onEnd(); };
    utt.onerror  = ()=>{ currentUtterance=null; if(onEnd) onEnd(); };
    window.speechSynthesis.speak(utt);
  };
  if(window.speechSynthesis.getVoices().length===0){
    window.speechSynthesis.onvoiceschanged=()=>{ window.speechSynthesis.onvoiceschanged=null; doSpeak(); };
  } else { doSpeak(); }
}

function stopSpeaking() {
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

const WRITING = ["Script to Movie","Text to Script","Script to Screenplay","Prompt to Story","Story to Script","Feature Film Script","Short Film Script","TV Pilot Script","Documentary Script","Commercial Script","YouTube Script","Podcast Script","Social Media Script","Explainer Script","Plot Generator","Story Outline","Three Act Structure","Five Act Structure","Beat Sheet Builder","Character Bio Writer","Character Arc Builder","Subplot Generator","Plot Twist Generator","Opening Hook Creator","Climax Designer","Logline Generator","Synopsis Writer","Treatment Writer","Scene Writer","Text to Dialogue","Dialogue Generator","Narration Writer","Voiceover Script","Interview Script","Action Line Writer","Scene Heading Tool","Parenthetical Generator","Script Formatter","Dialogue Tightener","Script Timer","Word Counter","Page Counter","Reading Time Estimator","Format Checker","Grammar Polish","Spell Checker","Continuity Checker","Plot Hole Detector","Tone Checker","Genre Classifier"];
const VOICE = ["Upload Own Voice","Record My Voice","Clone My Voice","Text to Voice","Text to Speech","Text to Narration","Text to Audiobook","Text to Voiceover","Voice Cloning","Voice to Voice","AI Voice Actor","Neural Voice Generator","Emotion Voice Synth","Trailer Voice Generator","Documentary Voice","Commercial Voice","Character Voice Creator","Accent Generator","Multi Language Voice","Voice Translator","Lip Sync AI","Dialogue Synth","Audiobook Creator","Podcast Voice","Radio DJ Voice","Sports Commentary Voice","ASMR Creator","Whisper Generator","Meditation Voice","Alien Voice","Deep Voice Generator","Robot Voice","Monster Voice","Child Voice","Elderly Voice","Male to Female Voice","Female to Male Voice","Speed Controller","Tone Adjuster","Pitch Controller","Volume Normalizer","Clarity Booster","Voice Denoiser","Echo Remover","Reverb Remover","Background Noise Remover","Voice EQ Studio"];
const IMAGE_T = ["Text to Image","Prompt to Image","Image to Image","Image Upscaler","Image Generator","AI Art Generator","Photo to Painting","Sketch to Image","Wireframe to Image","Background Generator","Background Remover","Sky Replacer","Object Remover","Face Generator","Character Design","Portrait Generator","Avatar Creator","Product Image Generator","Architecture Visualizer","Interior Design Generator","Landscape Generator","Abstract Art Generator","Logo Generator","Icon Creator","Texture Generator","Pattern Maker","Color Palette Generator","Style Transfer","Photo Enhancer","Photo Restorer","Old Photo Colorizer","Black & White to Color","Image Denoiser","Sharpness Enhancer","Clarity Booster","Detail Enhancer","HDR Image Creator","Exposure Fixer","White Balance AI","Color Grading Studio","LUT Creator","Tone Mapper","Contrast Adjuster","Brightness Tool","Saturation Engine","Hue Shift","Temperature Control","Vignette Tool"];
const VIDEO_T = ["Text to Video","Image to Video","Video to Video","AI Video Creator","AI Film Generator","Video Upscaler","AI Video Generator 4K","Set to Video","Video Colorizer","Color Grading Pro","Fast Look Generator","Film Restoration","Time Lapse Creator","Video Trimmer","Background Remover","Digital Human Video","Rotoscope Video","Animation Creator","Puppet Animator","Motion Capture","Character Animator","Video Stabilizer","Video Compressor","Cinematic LUT","Black & White Film","Film Texture","VHS Effect","Glitch Effect","Quick Film Creator","Opening Slate","Time Freeze","Bullet Time Effect","Rain Simulation","Snow Simulation","Smoke Generator","Fire Simulation","Particle System","AI Progressive Video","4K Upscaling"];
const MOTION = ["AI 8K Upscaling","AI 4K Upscaling","Video Super Resolution","Frame Interpolation","Video Denoiser","Noise Reduction","Grain Remover","Artifact Remover","Scratch Remover","Video Sharpener","Clarity Booster","Detail Enhancer","Edge Enhancement","Texture Boost","White Balance AI","Color Correction","Auto Color Balance","Color Match Pro","Color Grading AI","Cinematic Color Grade","Film Stock Emulation","LUT Generator","Tone Mapping Pro","HDR Enhancement","Deep HDR Boost","Dynamic Range Expansion","Shadow Recovery","Highlight Recovery","Black Point Calibration","Gamma Correction","Contrast Enhancer","Brightness Optimizer","Saturation Booster","Smart Saturation","Face Enhancement","Face Retouch","Eye Enhancer","Teeth Whitener","Skin Tone Enhancer","Background Enhancer","Sky Enhancer","Landscape Enhancer","Night Video Enhancer","Low Light Clarity","Motion Stabilization","Shake Remover","Rolling Shutter Fix"];

const NAV = [{p:1,l:"Home"},{p:2,l:"Platform"},{p:3,l:"Examples"},{p:4,l:"Login / Pricing"},{p:5,l:"Writing Tools"},{p:6,l:"Voice Tools"},{p:7,l:"Image Tools"},{p:8,l:"Video Tools"},{p:9,l:"Motion & VFX"},{p:10,l:"Enhancement"},{p:11,l:"Upload Media"},{p:12,l:"Editor Suite"},{p:13,l:"Timeline Editor"},{p:14,l:"Enhancement Studio"},{p:15,l:"Audio Mixer"},{p:16,l:"Render Engine"},{p:17,l:"Film Preview"},{p:18,l:"Export & Distribute"},{p:19,l:"Tutorials"},{p:20,l:"Terms & Disclaimer"},{p:21,l:"Agent Grok"},{p:22,l:"Community Hub"},{p:23,l:"That's All Folks"}];

function ProjectHistoryModal({ onClose, onResume }) {
  const [history,setHistory]=useState([]);
  useEffect(()=>{try{setHistory(JSON.parse(localStorage.getItem("ms_project_history")||"[]"));}catch{};},[]);
  const del=(idx)=>{const u=history.filter((_,i)=>i!==idx);setHistory(u);localStorage.setItem("ms_project_history",JSON.stringify(u));};
  return (
    <div style={{position:"fixed",inset:0,zIndex:1200,background:"rgba(0,0,0,0.96)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"min(580px,95vw)",background:"#050505",border:"2px solid "+GOLD,maxHeight:"82vh",display:"flex",flexDirection:"column"}}>
        <div style={{background:"linear-gradient(135deg,#0a0500,#050200)",borderBottom:"1px solid "+GOLD+"",padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:17,fontWeight:900,letterSpacing:4}}>📂 MY PROJECTS</div>
            <div style={{color:WHITE,fontSize:10,letterSpacing:3,marginTop:3}}>CONTINUE WHERE YOU LEFT OFF</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid "+GOLD,color:GOLD,width:30,height:30,cursor:"pointer",fontSize:15}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:18}}>
          {history.length===0?(
            <div style={{textAlign:"center",padding:"40px 20px",color:GOLDDIM}}>
              <div style={{fontSize:34,marginBottom:10}}>📂</div>
              <div style={{fontSize:12,letterSpacing:2,marginBottom:8}}>No saved sessions yet.</div>
              <div style={{fontSize:11,color:DIM,lineHeight:1.7}}>Hit 💾 SAVE PROJECT in the footer<br/>to save your current session.</div>
            </div>
          ):[...history].reverse().map((h,i)=>(
            <div key={i} style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,padding:"12px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1}}>
                <div style={{color:GOLD,fontWeight:900,fontSize:13,letterSpacing:2,marginBottom:3}}>{h.name||"Untitled Session"}</div>
                <div style={{color:DIM,fontSize:10,letterSpacing:1}}>{h.date} · Page {h.page} · {h.assetCount} asset{h.assetCount!==1?"s":""}</div>
                {h.note&&<div style={{color:WHITE,fontSize:11,marginTop:4,fontStyle:"italic"}}>{h.note}</div>}
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>onResume(h)} style={{background:"linear-gradient(135deg,#a07820,#e8c96d)",border:"none",color:"#000",padding:"8px 18px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>▶ CONTINUE PROJECT</button>
                <button onClick={()=>del(history.length-1-i)} style={{background:"none",border:"1px solid #ef4444",color:"#ef4444",padding:"5px 10px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>✕</button>
              </div>
            </div>
          ))}
        </div>
        {history.length>0&&(
          <div style={{borderTop:"1px solid "+GOLDDIM+"",padding:"10px 18px",flexShrink:0}}>
            <button onClick={()=>{if(confirm("Delete all project history?")){{localStorage.removeItem("ms_project_history");setHistory([]);}}}} style={{background:"none",border:"1px solid #ef4444",color:"#ef4444",padding:"5px 14px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>🗑 CLEAR ALL</button>
          </div>
        )}
      </div>
    </div>
  );
}

function SaveSessionModal({ onClose, onSave, currentPage, assetCount }) {
  const [name,setName]=useState("Session — "+new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}));
  const [note,setNote]=useState("");
  const inp2={width:"100%",background:"#000",border:"1px solid "+GOLDDIM,padding:"9px 12px",color:WHITE,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif"};
  return (
    <div style={{position:"fixed",inset:0,zIndex:1200,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"min(400px,92vw)",background:"#050505",border:"2px solid "+GOLD,padding:22}}>
        <div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:15,fontWeight:900,letterSpacing:3,marginBottom:4}}>💾 SAVE SESSION</div>
        <div style={{color:DIM,fontSize:10,marginBottom:14}}>Page {currentPage} · {assetCount} assets in library</div>
        <div style={{color:GOLD,fontSize:10,letterSpacing:3,marginBottom:5}}>PROJECT NAME</div>
        <input value={name} onChange={e=>setName(e.target.value)} style={{...inp2,marginBottom:10}}/>
        <div style={{color:GOLD,fontSize:10,letterSpacing:3,marginBottom:5}}>NOTE (OPTIONAL)</div>
        <input value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Done chapters 1-5, continuing from 6..." style={{...inp2,marginBottom:16}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button onClick={onClose} style={{background:"transparent",border:"1px solid "+GOLD,color:GOLD,padding:"11px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>CANCEL</button>
          <button onClick={()=>onSave(name,note)} style={{background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",padding:"11px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>💾 SAVE</button>
        </div>
      </div>
    </div>
  );
}

function QAMenu({ go, onClose, user }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex"}}>
      <div style={{width:256,background:"#050505",borderRight:"1px solid "+GOLD+"",height:"100vh",overflowY:"auto",padding:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <span style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:13,fontWeight:900,letterSpacing:3}}>QUICK ACCESS</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:GOLD,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",padding:"9px 12px",marginBottom:10,textAlign:"center"}}>
          <div style={{color:"#000",fontWeight:900,fontSize:10,letterSpacing:3,fontFamily:"'Cinzel',serif"}}>MANDA STRONG STUDIO</div>
        </div>
        <div style={{background:"#0a0a0a",border:"1px solid "+GOLD,padding:"7px 10px",marginBottom:14,textAlign:"center"}}>
          <div style={{color:DIM,fontSize:9,letterSpacing:2}}>PLAN</div>
          <div style={{color:GOLD,fontWeight:900,fontSize:14,fontFamily:"'Cinzel',serif"}}>STUDIO</div>
        </div>
        {NAV.map(i=>(
          <button key={i.p} onClick={()=>{go(i.p);onClose();}}
            style={{width:"100%",textAlign:"left",background:"none",border:"none",color:WHITE,padding:"8px",cursor:"pointer",fontSize:13,fontWeight:700,display:"block",marginBottom:1,letterSpacing:1}}
            onMouseEnter={e=>{e.currentTarget.style.background=BG4;e.currentTarget.style.color=GOLD;}}
            onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=WHITE;}}>
            {String(i.p).padStart(2,"0")} &nbsp; {i.l.toUpperCase()}
          </button>
        ))}
      </div>
      <div style={{flex:1,background:"rgba(0,0,0,0.75)"}} onClick={onClose}/>
    </div>
  );
}

function Header({ go, setMenu }) {
  return (
    <header style={{position:"sticky",top:0,zIndex:500,background:"#000",borderBottom:"1px solid "+GOLD+"",padding:"0 16px",height:52,display:"flex",alignItems:"center",gap:12}}>
      <button onClick={()=>setMenu(true)} style={{background:"none",border:"1px solid "+GOLD,color:GOLD,width:34,height:34,cursor:"pointer",fontSize:16,flexShrink:0}}>☰</button>
      <div onClick={()=>go(1)} style={{cursor:"pointer",flexShrink:0}}>
        <div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:13,fontWeight:900,letterSpacing:3,lineHeight:1,textShadow:"0 0 16px "+GOLD+"99"}}>MANDA STRONG</div>
        <div style={{fontFamily:"'Cinzel',serif",color:GOLDDIM,fontSize:9,letterSpacing:4}}>STUDIO</div>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{color:GOLD,fontSize:11,letterSpacing:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:700}}>
          ✦ CINEMA INTELLIGENCE PLATFORM &nbsp;·&nbsp; 600+ AI TOOLS &nbsp;·&nbsp; 8K EXPORT &nbsp;·&nbsp; UP TO 3-HOUR FILMS
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <div style={{color:"#22c55e",fontSize:11,letterSpacing:2,fontWeight:900}}>● SYSTEM ONLINE</div>
        <div onClick={()=>go(21)} style={{width:36,height:36,background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontFamily:"'Cinzel',serif",fontSize:19,fontWeight:900,color:"#000",boxShadow:"0 0 18px "+GOLD+"77"}}>G</div>
      </div>
    </header>
  );
}

function Footer({ page, go, onSave, onHistory }) {
  return (
    <footer style={{position:"fixed",bottom:0,left:0,right:0,zIndex:400,background:"#000",borderTop:"1px solid "+GOLD+"",padding:"6px 20px 8px",display:"flex",flexDirection:"column",gap:4}}>
      <div style={{textAlign:"center"}}>
        <span style={{color:GOLD,fontSize:11,letterSpacing:1,fontWeight:700}}>MANDASTRONG STUDIO 2026 · PROFESSIONAL CINEMA SYNTHESIS · MandaStrong1.Etsy.com</span>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
        <button onClick={()=>go(Math.max(1,page-1))} disabled={page===1} style={{...G("out",true),opacity:page===1?0.3:1}}>◀ BACK</button>
        <span style={{color:GOLD,fontSize:11,fontWeight:900,fontFamily:"'Cinzel',serif",letterSpacing:2}}>PAGE {page} / {TOTAL}</span>
        <button onClick={()=>go(Math.min(TOTAL,page+1))} disabled={page===TOTAL} style={{...G("gold",true),opacity:page===TOTAL?0.3:1}}>NEXT ▶</button>
        <button onClick={onSave} style={{...G("out",true),fontSize:11,letterSpacing:2}}>💾 SAVE PROJECT</button>
        <button onClick={onHistory} style={{background:"linear-gradient(135deg,#0a0300,#1a0800)",border:"1px solid "+GOLD,color:GOLD,padding:"5px 14px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>📂 MY PROJECTS</button>
        <span style={{color:"#22c55e",fontSize:11,fontWeight:700}}>● AUTOSAVE ON</span>
      </div>
    </footer>
  );
}

function ToolCard({ name, onOpen }) {
  return (
    <div onClick={()=>onOpen(name)}
      style={{background:"#000",border:"1px solid "+GOLDDIM,padding:"14px 12px",cursor:"pointer",transition:"all .15s",minHeight:56,display:"flex",alignItems:"center"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.background=BG4;e.currentTarget.style.boxShadow="0 0 10px "+GOLD+"44";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM;e.currentTarget.style.background="#000";e.currentTarget.style.boxShadow="none";}}>
      <div style={{color:WHITE,fontSize:13,fontWeight:800,lineHeight:1.3,letterSpacing:.5}}>{name}</div>
    </div>
  );
}

function ToolPanel({ tool, onClose, onSave }) {
  const isVoice = VOICE_TOOLS.includes(tool);
  const isVideoTool = ["Text to Video","Image to Video","Video to Video","AI Video Creator","AI Film Generator","Video Upscaler","AI Video Generator 4K","Set to Video","Video Colorizer","Film Restoration","Time Lapse Creator","Animation Creator","Quick Film Creator"].includes(tool);
  const isImageTool = ["Text to Image","Prompt to Image","Image to Image","Image Generator","AI Art Generator","Photo to Painting","Sketch to Image","Background Generator","Face Generator","Character Design","Portrait Generator","Logo Generator","Avatar Creator"].includes(tool);
  const isWritingTool = ["Script to Movie","Text to Script","Script to Screenplay","Prompt to Story","Feature Film Script","Short Film Script","Documentary Script","Plot Generator","Story Outline","Beat Sheet Builder","Character Bio Writer","Logline Generator","Synopsis Writer","Scene Writer","Dialogue Generator","Narration Writer","Voiceover Script"].includes(tool);
  const [mode, setMode] = useState(isVoice?"voice":(isVideoTool||isImageTool||isWritingTool)?"ai":"upload");
  const [describe, setDescribe] = useState("");
  const [result, setResult] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [playing, setPlaying] = useState(null);
  const [selVoice, setSelVoice] = useState("james");
  const fileRef = useRef(null);
  const inp = {width:"100%",background:"#000",border:"1px solid "+GOLDDIM,padding:"9px 12px",color:WHITE,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif"};

  const speak = (vid, txt) => speakText(vid, txt, ()=>setPlaying(vid), ()=>setPlaying(null));

  const runAI = async () => {
    if (!describe.trim()) return;
    setLoading(true); setSaved(false); setResult("");
    try {
      let prompt = "";
      if (isVoice) {
        prompt = "Format this as cinematic narration, voice style: "+(STOCK_VOICES.find(x=>x.id===selVoice)?.style||"")+". Mark pauses as [pause] and emphasis as *word*:\n\n"+describe;
      } else if (isVideoTool) {
        prompt = "You are a professional film director at MandaStrong Studio. Tool: "+tool+". User description: "+describe+"\n\nGenerate: 1. OPTIMISED VIDEO PROMPT 2. SCENE BREAKDOWN 3. CAMERA DIRECTIONS 4. LIGHTING & COLOUR GRADE 5. AUDIO NOTES 6. DURATION ESTIMATE 7. DIRECTOR'S NOTES. Make it cinematic and production-ready.";
      } else if (isImageTool) {
        prompt = "You are a professional visual artist at MandaStrong Studio. Tool: tool.\n\nUser description: "+describe+"\n\nGenerate a COMPLETE IMAGE PROMPT PACKAGE:\n\n1. OPTIMISED PROMPT\n2. STYLE\n3. LIGHTING & COLOUR PALETTE\n4. COMPOSITION & FRAMING\n5. NEGATIVE PROMPT\n6. ASPECT RATIO & RESOLUTION\n7. STYLE REFERENCES";
      } else if (isWritingTool) {
        prompt = "You are a professional screenwriter at MandaStrong Studio. Tool: tool.\n\nUser request: "+describe+"\n\nGenerate complete, properly formatted, production-ready content.";
      } else {
        prompt = "You are a professional at MandaStrong Studio cinema AI platform. Tool: tool.\n\nUser request: "+describe+"\n\nGenerate complete, detailed, professional, production-ready content.";
      }
      const res = await fetch("https://njqfexhltjwpgvctmyaw.supabase.co/functions/v1/claude-proxy",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,
          messages:[{role:"user",content:prompt}]})
      });
      const d = await res.json();
      const txt = d.content&&d.content[0]?d.content[0].text:"Generated!";
      setResult(txt);
      if (isVoice) speak(selVoice, txt);
    } catch(e) { setResult("Error — check your connection and try again."); }
    setLoading(false);
  };

  const saveAsset = () => {
    const content = result||describe;
    if (!content.trim()) return;
    if (onSave) onSave({id:Date.now()+Math.random(),name:tool+" — "+isVoice?STOCK_VOICES.find(x=>x.id===selVoice)?.name:"Result",type:isVoice?"audio/narration":"text/plain",url:"",content});
    setSaved(true);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"min(600px,95vw)",background:"#050505",border:"1px solid "+GOLD,padding:26,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h2 style={{...H1,fontSize:16,margin:0,letterSpacing:4}}>{tool}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",color:GOLD,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isVoice?"1fr 1fr 1fr 1fr":"1fr 1fr 1fr",gap:8,marginBottom:18}}>
          {isVoice&&<button onClick={()=>setMode("voice")} style={{...G(mode==="voice"?"gold":"out",true),fontSize:11}}>🎙 VOICE</button>}
          {[["upload","UPLOAD"],["paste","PASTE"],["ai","AI CREATE ✦"]].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)} style={{...G(mode===m?"gold":"out",true),fontSize:11}}>{l}</button>
          ))}
        </div>
        {mode==="voice"&&isVoice&&(
          <div>
            <div style={{color:GOLD,fontSize:12,letterSpacing:3,fontWeight:900,marginBottom:10}}>SELECT VOICE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {STOCK_VOICES.map(v=>(
                <div key={v.id} onClick={()=>setSelVoice(v.id)}
                  style={{background:"#000",border:"2px solid "+selVoice===v.id?GOLD:GOLDDIM,padding:"10px 12px",cursor:"pointer",boxShadow:selVoice===v.id?"0 0 12px "+GOLD+"44":"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{color:selVoice===v.id?GOLD:WHITE,fontSize:14,fontWeight:900}}>{v.name}</span>
                    <button onClick={e=>{e.stopPropagation();speak(v.id,"Hi I am "+v.name+". "+v.desc+". Ready to narrate.");}}
                      style={{background:"none",border:"1px solid "+GOLDDIM,color:GOLD,padding:"2px 8px",cursor:"pointer",fontSize:10,fontWeight:900}}>
                      {playing===v.id?"⏹":"▶"}
                    </button>
                  </div>
                  <div style={{color:GOLD,fontSize:11}}>{v.desc}</div>
                  <div style={{color:WHITE,fontSize:10,marginTop:2}}>{v.style} · {v.accent}</div>
                </div>
              ))}
            </div>
            <textarea value={describe} onChange={e=>setDescribe(e.target.value)} placeholder="Paste your narration text here..."
              style={{...inp,height:110,resize:"none",lineHeight:1.7,marginBottom:10}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:result?14:0}}>
              <button onClick={runAI} disabled={loading||!describe.trim()} style={{...G("gold",false),padding:"12px",opacity:loading||!describe.trim()?0.5:1}}>
                {loading?"⟳ GENERATING...":"AI FORMAT & SPEAK ✦"}
              </button>
              <button onClick={()=>speak(selVoice,describe)} disabled={!describe.trim()} style={{...G("out",false),padding:"12px",opacity:!describe.trim()?0.5:1}}>
                ▶ SPEAK NOW
              </button>
            </div>
            {result&&(
              <div>
                <textarea value={result} onChange={e=>setResult(e.target.value)} style={{...inp,height:110,resize:"none",lineHeight:1.7,marginBottom:10}}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  <button onClick={()=>speak(selVoice,result)} style={{...G("out",false),padding:"10px"}}>▶ PLAY</button>
                  <button onClick={stopSpeaking} style={{...G("out",false),padding:"10px"}}>⏹ STOP</button>
                  <button onClick={saveAsset} style={{...G("gold",false),padding:"10px"}}>SAVE TO LIBRARY</button>
                </div>
              </div>
            )}
          </div>
        )}
        {mode==="upload"&&(
          <div style={{marginBottom:14}}>
            {/* FIX 1: Photo button opens images only. File button opens all files. */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <button
                onClick={()=>{
                  const i=document.createElement("input");
                  i.type="file";
                  i.accept="image/*";
                  i.onchange=e=>{
                    const f=e.target.files&&e.target.files[0];
                    if(f&&onSave){onSave({id:Date.now()+Math.random(),name:f.name,type:f.type,file:f,url:URL.createObjectURL(f)});setSaved(true);}
                  };
                  i.click();
                }}
                style={{background:"linear-gradient(135deg,#1a0800,#2a1200)",border:"2px solid "+GOLD,color:GOLD,padding:"18px 14px",cursor:"pointer",fontSize:12,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>
                📷 UPLOAD PHOTO
              </button>
              <button
                onClick={()=>fileRef.current&&fileRef.current.click()}
                style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,color:WHITE,padding:"18px 14px",cursor:"pointer",fontSize:12,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>
                📁 UPLOAD FILE
              </button>
            </div>
            <input ref={fileRef} type="file" accept="video/*,audio/*,image/*,text/*" style={{display:"none"}} onChange={e=>{
              const f=e.target.files&&e.target.files[0];
              if(f&&onSave){onSave({id:Date.now()+Math.random(),name:f.name,type:f.type,file:f,url:URL.createObjectURL(f)});setSaved(true);}
            }}/>
          </div>
        )}
        {mode==="paste"&&(
          <div style={{marginBottom:14}}>
            <div style={{color:GOLD,fontSize:12,letterSpacing:3,fontWeight:900,marginBottom:6}}>ADD URL</div>
            <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste a URL..." style={{...inp,marginBottom:10}}/>
            <div style={{color:GOLD,fontSize:12,letterSpacing:3,fontWeight:900,marginBottom:6}}>OR PASTE TEXT</div>
            <textarea value={describe} onChange={e=>setDescribe(e.target.value)} placeholder="Paste your content here..." style={{...inp,height:100,resize:"none",lineHeight:1.6}}/>
            <button onClick={saveAsset} style={{...G("gold",false),marginTop:8,width:"100%",padding:"12px"}}>SAVE TO MEDIA LIBRARY</button>
          </div>
        )}
        {mode==="ai"&&(
          <div style={{marginBottom:14}}>
            <div style={{color:GOLD,fontSize:12,letterSpacing:3,fontWeight:900,marginBottom:4}}>
              {isVideoTool?"DESCRIBE YOUR SCENE OR FILM IDEA":isImageTool?"DESCRIBE YOUR IMAGE":isWritingTool?"DESCRIBE YOUR STORY OR SCRIPT":"DESCRIBE WHAT YOU WANT"}
            </div>
            <textarea value={describe} onChange={e=>setDescribe(e.target.value)}
              placeholder={isVideoTool?"e.g. A lone astronaut walks across a red planet at sunset...":isImageTool?"e.g. Portrait of a warrior queen at golden hour...":isWritingTool?"e.g. A documentary about veterans mental health...":"Describe what you want from "+tool+"..."}
              style={{...inp,height:100,resize:"none",lineHeight:1.6}}/>
            <button onClick={runAI} disabled={loading||!describe.trim()} style={{...G("gold",false),marginTop:8,width:"100%",padding:"14px",opacity:loading||!describe.trim()?0.5:1,fontSize:13,letterSpacing:2}}>
              {loading?"⟳ CREATING...":isVideoTool?"🎬 CREATE VIDEO PACKAGE ✦":isImageTool?"🎨 CREATE IMAGE PROMPT ✦":isWritingTool?"✍ WRITE SCRIPT ✦":"✦ AI CREATE"}
            </button>
            {result&&(
              <div style={{marginTop:14}}>
                <textarea value={result} onChange={e=>setResult(e.target.value)} style={{...inp,height:140,resize:"none",lineHeight:1.7}}/>
                <button onClick={saveAsset} style={{...G("gold",false),marginTop:8,width:"100%",padding:"12px"}}>GENERATE & SAVE</button>
              </div>
            )}
          </div>
        )}
        {saved&&(
          <div style={{marginTop:14,background:"#0a2a0a",border:"1px solid #22c55e",padding:"12px 16px",textAlign:"center"}}>
            <div style={{color:"#22c55e",fontWeight:900,fontSize:14,letterSpacing:2}}>✓ ASSET SAVED TO MEDIA LIBRARY</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolPage({ title, subtitle, tools, onSave }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(null);
  const filtered = tools.filter(t=>t.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{...Sp}}>
      <div style={{padding:"14px 18px 12px",borderBottom:"1px solid "+GOLDDIM+"",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:12,color:GOLD,letterSpacing:4,fontWeight:700}}>{subtitle}</div>
          <h1 style={{...H1,fontSize:24,margin:0}}>{title}</h1>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{position:"relative"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={"Search "+tools.length+" tools..."}
              style={{background:"#000",border:"1px solid "+GOLDDIM,padding:"7px 12px 7px 28px",color:WHITE,fontSize:13,outline:"none",width:200}}/>
            <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:GOLD}}>🔍</span>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:GOLD,cursor:"pointer",padding:0}}>✕</button>}
          </div>
          <span style={{color:WHITE,fontSize:12,fontWeight:700,letterSpacing:1}}>{filtered.length} TOOLS</span>
        </div>
      </div>
      <div style={{padding:12,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {filtered.map(t=><ToolCard key={t} name={t} onOpen={setOpen}/>)}
      </div>
      {open&&<ToolPanel tool={open} onClose={()=>setOpen(null)} onSave={onSave}/>}
      {title==="WRITING TOOLS"&&(
        <div style={{padding:"0 12px 12px"}}>
          <div style={{background:"#050500",border:"2px solid "+GOLD,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{color:GOLD,fontWeight:900,fontSize:13,letterSpacing:3}}>📂 YOUR PROJECTS</div>
              <div style={{color:WHITE,fontSize:12,marginTop:3}}>Save and reload your work at any time</div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{
                try{
                  const hist=JSON.parse(localStorage.getItem("ms_project_history")||"[]");
                  if(hist.length>0){
                    window.dispatchEvent(new CustomEvent("ms_open_history"));
                  } else {
                    alert("No saved projects found. Hit 💾 SAVE PROJECT in the footer to save your work.");
                  }
                }catch(e){alert("Could not open projects.");}
              }}
                style={{background:"linear-gradient(135deg,#a07820,#e8c96d)",border:"none",color:"#000",padding:"12px 24px",cursor:"pointer",fontSize:12,fontWeight:900,letterSpacing:2}}>
                📂 OPEN PROJECT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordYourOwnSong({ onRecorded }) {
  const [recording,setRecording]=useState(false);
  const [recTime,setRecTime]=useState(0);
  const mrRef=useRef(null);
  const timerRef=useRef(null);
  const start=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mr=new MediaRecorder(stream);
      mrRef.current=mr;
      const chunks=[];
      mr.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
      mr.onstop=()=>{
        const blob=new Blob(chunks,{type:"audio/webm"});
        const name="recording_"+Date.now()+".webm";
        onRecorded(blob,name);
        stream.getTracks().forEach(t=>t.stop());
        setRecording(false);setRecTime(0);
      };
      mr.start(100);setRecording(true);setRecTime(0);
      timerRef.current=setInterval(()=>setRecTime(t=>t+1),1000);
    }catch(e){alert("Microphone access denied. Please allow microphone and try again.");}
  };
  const stop=()=>{
    if(mrRef.current&&mrRef.current.state!=="inactive")mrRef.current.stop();
    if(timerRef.current)clearInterval(timerRef.current);
  };
  const fmt=s=>{const n=isFinite(+s)&&!isNaN(+s)?+s:0;return String(Math.floor(n/60)).padStart(2,"0")+":"+String(Math.floor(n%60)).padStart(2,"0");};
  return recording?(
    <div style={{display:"flex",alignItems:"center",gap:10,background:"#1a0000",border:"1px solid #ef4444",padding:"10px 14px",marginTop:8}}>
      <div style={{width:10,height:10,borderRadius:"50%",background:"#ef4444",boxShadow:"0 0 8px #ef4444"}}/>
      <span style={{color:"#ef4444",fontWeight:900,fontSize:12,letterSpacing:2,flex:1}}>RECORDING — {fmt(recTime)}</span>
      <button onClick={stop} style={{background:"#ef4444",border:"none",color:"#fff",padding:"6px 16px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>■ STOP & SAVE</button>
    </div>
  ):(
    <button onClick={start} style={{width:"100%",background:"linear-gradient(135deg,#7a0000,#ef4444)",border:"none",color:"#fff",padding:"10px 14px",cursor:"pointer",fontSize:12,fontWeight:900,letterSpacing:2,marginTop:8,fontFamily:"'Rajdhani',sans-serif"}}>
      ● RECORD YOUR OWN SONG
    </button>
  );
}


function MusicVideoStudio({ onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoBlob, setVideoBlob] = useState(null);
  const [renderLog, setRenderLog] = useState([]);
  const [renderProgress, setRenderProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration2, setDuration2] = useState(0);
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState("");
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const audioInputRef = useRef(null);

  const [config, setConfig] = useState({
    title:"If Only", artist:"Manda", genre:"Folk / Acoustic",
    mood:"Melancholic", tempo:"Slow (60-80 BPM)",
    videoStyle:"Cinematic Narrative", colorGrade:"Cinematic Teal & Orange",
    effects:["Slow Motion","Film Grain","Vignette"],
    cuts:"Long Takes", aspectRatio:"16:9", duration:"3 Minutes",
    visualDesc:"",
  });
  const set = (k,v) => setConfig(p=>({...p,[k]:v}));
  const tog = (k,v) => setConfig(p=>({...p,[k]:p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v]}));

  const GENRES=["Pop","Rock","Hip Hop","R&B / Soul","Electronic / EDM","Country","Jazz","Classical","Metal","Folk / Acoustic","Latin","K-Pop","Blues","Cinematic / Score"];
  const MOODS=["Euphoric","Melancholic","Energetic","Romantic","Angry","Peaceful","Mysterious","Empowering","Nostalgic","Dark","Haunting","Uplifting","Tense"];
  const TEMPOS=["Very Slow (40-60 BPM)","Slow (60-80 BPM)","Mid-Tempo (80-100 BPM)","Upbeat (100-120 BPM)","Fast (120-140 BPM)"];
  const STYLES=["Cinematic Narrative","Performance / Live","Abstract / Visual Art","Documentary Style","Lyric Video","Retro / VHS","Noir / Black & White","Surrealist / Dreamlike"];
  const GRADES=["Natural / Clean","Golden Hour Warm","Cool Blue / Moody","High Contrast Black & White","Cinematic Teal & Orange","Vintage Film Grain","Dark & Desaturated"];
  const EFFECTS=["Slow Motion","Speed Ramps","Glitch Effects","Light Leaks","Lens Flares","Rain / Water","Bokeh / Blur","Film Grain","Vignette","Particle Effects"];
  const CUTS=["Fast Cuts / High Energy","Slow & Deliberate","Long Takes","Beat-Synced Cuts","Montage Style"];

  const addLog = (msg) => setRenderLog(p=>[...p,msg]);

  const handleAudioUpload = (e) => {
    const f = e.target.files&&e.target.files[0];
    if(!f) return;
    setAudioFile(f);
    setAudioUrl(URL.createObjectURL(f));
    setAudioName(f.name);
  };

  const generateVideo = async () => {
    setGenerating(true);
    setRenderLog([]);
    setRenderProgress(0);
    setVideoUrl("");
    setVideoBlob(null);

    try {
      const sceneDesc = config.visualDesc || "A man sits on a windowsill overlooking the ocean at night, fingerpicking acoustic guitar. Only his back is visible. Full moon. Single candle. Dark wooden room. Empty couch. Coat on a hook. Curtains lift in the wind.";
      addLog("MandaStrong Cinema Engine — writing your film...");
      setRenderProgress(4);

      const durationMap = {"2 Minutes":120,"3 Minutes":180,"4 Minutes":240,"5 Minutes":300};
      let totalDur = Math.max(30, Number(durationMap[config.duration])||180);
      if(!isFinite(totalDur)||isNaN(totalDur)) totalDur = 180;
      let beatGrid = [];
      let audioCtx = null, audioDest = null, audioSource = null;

      if(audioFile){
        try{
          audioCtx = new (window.AudioContext||window.webkitAudioContext)();
          const ab = await audioFile.arrayBuffer();
          const buf = await audioCtx.decodeAudioData(ab);
          totalDur = buf.duration;
          const data = buf.getChannelData(0);
          const sr = buf.sampleRate;
          const win = Math.round(sr*0.35);
          const energies = [];
          for(let i=0;i<data.length-win;i+=win){
            let e=0; for(let j=0;j<win;j++) e+=data[i+j]*data[i+j];
            energies.push({t:i/sr,e:e/win});
          }
          const avg = energies.reduce((s,x)=>s+x.e,0)/energies.length;
          let last=-1;
          energies.forEach(x=>{
            if(x.e>avg*1.35&&x.t-last>0.28){beatGrid.push(x.t);last=x.t;}
          });
          addLog("Audio: "+totalDur.toFixed(1)+"s — "+beatGrid.length+" beats detected");
          audioDest = audioCtx.createMediaStreamDestination();
          audioSource = audioCtx.createBufferSource();
          audioSource.buffer = buf;
          const gain = audioCtx.createGain(); gain.gain.value=0.92;
          audioSource.connect(gain);
          gain.connect(audioDest);
          gain.connect(audioCtx.destination);
        }catch(e){ addLog("Audio: "+e.message); audioCtx=null; }
      } else {
        addLog("No audio — generating "+totalDur+"s visual");
        for(let t=0;t<totalDur;t+=1.8) beatGrid.push(t);
      }
      setRenderProgress(10);

      addLog("MandaStrong Engine — built-in renderer ready");
      const pr = sceneDesc.toLowerCase();
      const isNight = /night|dark|moon|evening|dusk/.test(pr);
      const isGolden = /golden|sunset|sunrise|amber/.test(pr);
      const isOcean = /ocean|sea|water|wave|shore|coast/.test(pr);
      const isCity = /city|urban|street|skyline|neon/.test(pr);
      const isSpace = /space|star|galaxy|planet|cosmos/.test(pr);
      const isIndoor = /room|interior|inside|window|wall/.test(pr);
      const isRain = /rain|storm|wet|drizzle/.test(pr);
      const isFog = /fog|mist|haze|smoke/.test(pr);
      const hasPerson = /woman|man|person|figure|human/.test(pr);
      const hasCandle = /candle|flame|fire|torch/.test(pr);
      const hasGuitar = /guitar|musician|fingerpick/.test(pr);
      const isSilhouette = /silhouette|back to camera|facing away/.test(pr);

      const renderFn = (ctx, W, H, t, sec, totalSec, beatNow) => {
        const pulse = beatNow ? 1.02 : 1.0;
        ctx.save();
        ctx.translate(W/2, H/2);
        ctx.scale(pulse + t*0.04, pulse + t*0.04);
        ctx.translate(-W/2, -H/2);
        if(isNight){
          const sky=ctx.createLinearGradient(0,0,0,H*0.62);
          sky.addColorStop(0,"rgb(2,4,15)");sky.addColorStop(0.5,"rgb(5,10,32)");sky.addColorStop(1,"rgb(8,18,50)");
          ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
          for(let s=0;s<200;s++){
            const sx=(s*137.5)%W, sy=(s*97.3)%(H*0.55);
            ctx.fillStyle="rgba(240,245,255,"+(0.3+Math.sin(sec*0.5+s*0.3)*0.22)+")";
            ctx.fillRect(sx,sy,s%4===0?1.4:0.7,s%4===0?1.4:0.7);
          }
          const mx=W*0.78, my=H*0.13;
          const mg=ctx.createRadialGradient(mx,my,0,mx,my,H*0.078);
          mg.addColorStop(0,"rgba(255,255,248,0.96)");mg.addColorStop(1,"rgba(200,200,180,0)");
          ctx.fillStyle=mg; ctx.fillRect(mx-H*0.09,my-H*0.09,H*0.18,H*0.18);
        } else {
          const sky=ctx.createLinearGradient(0,0,0,H*0.6);
          sky.addColorStop(0,"rgb(28,60,140)");sky.addColorStop(1,"rgb(180,210,240)");
          ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
        }
        const horizY = isIndoor ? H : H*0.56;
        if(isOcean && !isIndoor){
          for(let w=0;w<10;w++){
            const wg=ctx.createLinearGradient(0,horizY+w*13,0,H);
            const d=isNight?[2+w*2,8+w*6,30+w*10]:[0+w*3,55+w*12,115+w*10];
            wg.addColorStop(0,"rgba("+d[0]+","+d[1]+","+d[2]+","+(0.7+w*0.03)+")");
            wg.addColorStop(1,"rgba(1,3,8,0.98)");
            ctx.fillStyle=wg;
            ctx.beginPath(); ctx.moveTo(-10,H);
            for(let x=0;x<=W+10;x+=3){
              const y=horizY+w*14+Math.sin(x*0.007+sec*(0.24+w*0.07)+w*1.3)*17;
              ctx.lineTo(x,y);
            }
            ctx.lineTo(W+10,H); ctx.closePath(); ctx.fill();
          }
        }
        if(isIndoor){
          const wall=ctx.createLinearGradient(0,0,W,H);
          wall.addColorStop(0,"rgb(9,6,3)"); wall.addColorStop(1,"rgb(4,3,2)");
          ctx.fillStyle=wall; ctx.fillRect(0,0,W,H);
          const fl=ctx.createLinearGradient(0,H*0.65,0,H);
          fl.addColorStop(0,"rgb(18,12,7)"); fl.addColorStop(1,"rgb(7,5,3)");
          ctx.fillStyle=fl; ctx.fillRect(0,H*0.65,W,H*0.35);
          const wox=W*0.12, woy=H*0.05, wow=W*0.46, woh=H*0.74;
          if(isNight){
            const ws=ctx.createLinearGradient(wox,woy,wox,woy+woh);
            ws.addColorStop(0,"rgb(2,4,15)"); ws.addColorStop(1,"rgb(6,14,42)");
            ctx.fillStyle=ws; ctx.fillRect(wox,woy,wow,woh);
            if(isOcean){
              for(let w=0;w<6;w++){
                const wg2=ctx.createLinearGradient(0,woy+woh*0.55+w*8,0,woy+woh);
                wg2.addColorStop(0,"rgba(2,8,35,0.9)");wg2.addColorStop(1,"rgba(1,3,12,0.98)");
                ctx.fillStyle=wg2;
                ctx.beginPath(); ctx.moveTo(wox,woy+woh);
                for(let x=wox;x<=wox+wow;x+=3){
                  const y=woy+woh*0.58+w*10+Math.sin(x*0.01+sec*(0.2+w*0.07)+w)*10;
                  ctx.lineTo(x,y);
                }
                ctx.lineTo(wox+wow,woy+woh); ctx.closePath(); ctx.fill();
              }
            }
          }
          ctx.strokeStyle="rgba(48,32,16,0.92)"; ctx.lineWidth=10;
          ctx.strokeRect(wox,woy,wow,woh);
        }
        if(hasCandle){
          const candX=isIndoor?W*0.7:W*0.5, candY=isIndoor?H*0.58:H*0.5;
          const flicker=0.88+Math.sin(sec*8.8)*0.07+Math.sin(sec*13.4)*0.04;
          ctx.fillStyle="rgba(232,212,162,0.9)"; ctx.fillRect(candX-5,candY,10,32);
          const cf=ctx.createRadialGradient(candX,candY,0,candX,candY,H*0.13*flicker);
          cf.addColorStop(0,"rgba(255,255,200,0.95)");cf.addColorStop(0.18,"rgba(255,180,40,0.72)");
          cf.addColorStop(0.5,"rgba(255,100,8,0.3)");cf.addColorStop(1,"rgba(255,60,0,0)");
          ctx.fillStyle=cf; ctx.fillRect(candX-H*0.13,candY-H*0.13,H*0.26,H*0.26);
        }
        if(hasPerson){
          const isSeated=/sit|bench|windowsill|chair/.test(pr);
          const fx=isOcean&&isIndoor?W*0.22:W*0.4;
          const fy=isSeated?H*0.52:H*0.44;
          const breath=Math.sin(sec*0.88)*0.007;
          ctx.fillStyle="rgba(2,1,1,0.97)";
          ctx.beginPath();ctx.ellipse(fx,fy-H*0.13,H*0.036,H*0.044,0,0,Math.PI*2);ctx.fill();
          ctx.fillRect(fx-H*0.028,fy-H*0.09,H*0.056,H*(0.15+breath*2));
          if(hasGuitar){
            ctx.beginPath();ctx.ellipse(fx+H*0.072,fy+H*0.02,H*0.05,H*0.064,0.22,0,Math.PI*2);ctx.fill();
            ctx.fillRect(fx+H*0.026,fy-H*0.09,H*0.011,H*0.12);
          }
        }
        ctx.restore();
      };

      setRenderProgress(30);
      addLog("Rendering "+totalDur.toFixed(0)+"s film at 12fps...");

      const canvas = canvasRef.current;
      const W=1280, H=720;
      canvas.width=W; canvas.height=H;
      const ctx = canvas.getContext("2d");
      const fps=12;
      const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";
      const videoStream=canvas.captureStream(fps);
      let combinedStream=videoStream;
      if(audioDest) combinedStream=new MediaStream([...videoStream.getTracks(),...audioDest.stream.getTracks()]);
      const recorder=new MediaRecorder(combinedStream,{mimeType,videoBitsPerSecond:10000000});
      const chunks=[];
      recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
      recorder.start(Math.round(1000/fps));
      if(audioSource) audioSource.start(0);

      const totalFrames=Math.max(fps*5, Math.round((totalDur||180)*fps));
      const msPerFrame=Math.round(1000/fps);
      const wallStart=performance.now();

      await new Promise(resolve=>{
        let frame=0;
        const tick=()=>{
          if(frame>=totalFrames){resolve(null);return;}
          const sec=frame/fps;
          const t=sec/totalDur;
          const beatNow=beatGrid.some(b=>Math.abs(sec-b)<0.055);
          ctx.clearRect(0,0,W,H);
          const drift=t*W*0.04;
          ctx.save();ctx.translate(-drift*0.3,0);
          try{ renderFn(ctx,W,H,t,sec,totalDur,beatNow); }
          catch(e){
            const bg=ctx.createLinearGradient(0,0,0,H);
            bg.addColorStop(0,"rgb(2,5,18)");bg.addColorStop(1,"rgb(4,8,28)");
            ctx.fillStyle=bg; ctx.fillRect(-W,0,W*3,H);
          }
          ctx.restore();
          const vig=ctx.createRadialGradient(W/2,H/2,W*0.08,W/2,H/2,W*0.85);
          vig.addColorStop(0,"rgba(0,0,0,0)"); vig.addColorStop(1,"rgba(0,0,0,0.92)");
          ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);
          ctx.fillStyle="#000";
          ctx.fillRect(0,0,W,Math.round(H*0.072));
          ctx.fillRect(0,H-Math.round(H*0.072),W,Math.round(H*0.072));
          for(let g=0;g<30;g++){
            const gv=Math.random()>0.5?130:0;
            ctx.fillStyle="rgba("+gv+","+gv+","+gv+",0.008)";
            ctx.fillRect(Math.random()*W,Math.random()*H,1,1);
          }
          if(t<0.12||t>0.9){
            const a=t<0.12?Math.min(1,t/0.08):Math.max(0,(1-t)/0.08);
            ctx.globalAlpha=a*0.95;
            ctx.fillStyle="#e8c96d";
            ctx.font="900 "+Math.round(H*0.072)+"px Arial Black,Arial";
            ctx.textAlign="center";
            ctx.shadowColor="#e8c96d"; ctx.shadowBlur=28;
            ctx.fillText((config.title||"UNTITLED").toUpperCase(),W/2,H*0.43);
            ctx.shadowBlur=0;
            ctx.fillStyle="rgba(255,255,255,0.8)";
            ctx.font="300 "+Math.round(H*0.034)+"px Arial";
            ctx.fillText((config.artist||"").toUpperCase(),W/2,H*0.56);
            ctx.globalAlpha=1;
          }
          setRenderProgress(30+Math.round((frame/totalFrames)*64));
          if(frame%(fps*10)===0) addLog("  "+Math.round(sec)+"s / "+Math.round(totalDur)+"s");
          frame++;
          const due=wallStart+(frame*msPerFrame);
          setTimeout(tick,Math.max(4,due-performance.now()));
        };
        tick();
      });

      setRenderProgress(96);
      addLog("Cutting to final...");
      await new Promise(r=>setTimeout(r,600));
      if(audioSource){try{audioSource.stop();}catch(e){}}
      recorder.stop();
      await new Promise(r=>{recorder.onstop=r;});
      const blob=new Blob(chunks,{type:mimeType});
      const url=URL.createObjectURL(blob);
      setVideoUrl(url); setVideoBlob(blob);
      setRenderProgress(100);
      addLog("✓ "+config.title+" complete — "+(blob.size/1024/1024).toFixed(1)+"MB · "+Math.round(totalDur)+"s");
      const fn=(config.title||"MusicVideo")+"_"+config.artist+".webm";
      try{
        const clipId="mv_"+Date.now();
        await saveClipToDB(clipId,blob,fn,"video/webm");
        addLog("✓ Saved");
        if(onSave)onSave({id:clipId,name:fn,type:"video/webm",url:URL.createObjectURL(blob),file:new File([blob],fn,{type:"video/webm"}),dbId:clipId});
      }catch(e){}
      if(audioCtx)try{audioCtx.close();}catch(e){}

    }catch(e){ addLog("Error: "+e.message); }
    setGenerating(false);
  };

  const SOCIAL = [
    ["YouTube","#FF0000","https://www.youtube.com/upload"],
    ["Instagram","#E1306C","https://www.instagram.com"],
    ["TikTok","#69C9D0","https://www.tiktok.com/upload"],
    ["Facebook","#1877F2","https://www.facebook.com"],
    ["X / Twitter","#1DA1F2","https://twitter.com"],
    ["Vimeo","#1AB7EA","https://vimeo.com/upload"],
  ];

  const inp = {width:"100%",background:"#000",border:"1px solid "+GOLDDIM,padding:"9px 12px",color:WHITE,fontSize:13,outline:"none",fontFamily:"'Rajdhani',sans-serif",boxSizing:"border-box"};
  const label = (txt) => <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:6,marginTop:12}}>{txt}</div>;
  const sel = (k,arr) => (
    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:4}}>
      {arr.map(item=>(
        <button key={item} onClick={()=>set(k,item)}
          style={{background:config[k]===item?GOLD:"#111",border:"1px solid "+(config[k]===item?"#000":GOLDDIM),color:config[k]===item?"#000":WHITE,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:1}}>
          {item}
        </button>
      ))}
    </div>
  );
  const multi = (k,arr) => (
    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:4}}>
      {arr.map(item=>(
        <button key={item} onClick={()=>tog(k,item)}
          style={{background:config[k].includes(item)?GOLD:"#111",border:"1px solid "+(config[k].includes(item)?"#000":GOLDDIM),color:config[k].includes(item)?"#000":WHITE,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:1}}>
          {item}
        </button>
      ))}
    </div>
  );

  const steps = ["🎵 SONG","🎤 STYLE","🎬 SCENE","▶ GENERATE"];
  const fmt = (s)=>{const m=Math.floor(s/60);const sc=Math.floor(s%60);return String(m).padStart(2,"0")+":"+String(sc).padStart(2,"0");};

  return (
    <div style={{position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,0.98)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"min(960px,98vw)",height:"min(92vh,860px)",background:"#050505",border:"2px solid "+GOLD,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#1a0a00,#0a0500)",borderBottom:"1px solid "+GOLD+"",padding:"14px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:18,fontWeight:900,letterSpacing:4}}>🎬 MUSIC VIDEO STUDIO</div>
            <div style={{color:WHITE,fontSize:10,letterSpacing:3,marginTop:2}}>PROFESSIONAL MUSIC VIDEO PRODUCTION · AI POWERED · SELF-CONTAINED</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid "+GOLD,color:GOLD,width:32,height:32,cursor:"pointer",fontSize:16}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderBottom:"1px solid "+GOLDDIM+"",flexShrink:0}}>
          {steps.map((s,i)=>(
            <button key={i} onClick={()=>setStep(i+1)}
              style={{background:step===i+1?"#0a0500":"none",border:"none",borderBottom:step===i+1?"2px solid "+GOLD:"2px solid transparent",color:step===i+1?GOLD:WHITE,padding:"11px 6px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2}}>
              {s}
            </button>
          ))}
        </div>
        <div style={{flex:1,display:"grid",gridTemplateColumns:videoUrl?"1fr 1fr":"1fr",overflow:"hidden"}}>
          <div style={{overflowY:"auto",padding:"16px 20px",borderRight:videoUrl?"1px solid "+GOLDDIM:"none"}}>
            {step===1&&(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>{label("SONG TITLE")}<input value={config.title} onChange={e=>set("title",e.target.value)} placeholder="Song title..." style={inp}/></div>
                  <div>{label("ARTIST")}<input value={config.artist} onChange={e=>set("artist",e.target.value)} placeholder="Artist name..." style={inp}/></div>
                </div>
                {label("GENRE")}{sel("genre",GENRES)}
                {label("MOOD")}{sel("mood",MOODS)}
                {label("TEMPO")}{sel("tempo",TEMPOS)}
                {label("UPLOAD YOUR AUDIO TRACK (OPTIONAL)")}
                <div style={{background:"#000",border:"1px dashed "+GOLDDIM,padding:"12px",cursor:"pointer",marginBottom:4}}
                  onClick={()=>audioInputRef.current&&audioInputRef.current.click()}>
                  <div style={{color:audioFile?"#22c55e":WHITE,fontWeight:900,fontSize:12,letterSpacing:2}}>
                    {audioFile?"✓ "+audioName:"⬆ CLICK TO UPLOAD MP3 / WAV / M4A"}
                  </div>
                  {audioFile&&<div style={{color:GOLDDIM,fontSize:10,marginTop:4}}>Audio will be mixed into your music video</div>}
                </div>
                <input ref={audioInputRef} type="file" accept="audio/*" style={{display:"none"}} onChange={handleAudioUpload}/>
                <RecordYourOwnSong onRecorded={(blob,name)=>{setAudioFile(blob);const u=URL.createObjectURL(blob);setAudioUrl(u);setAudioName(name);}}/>
                {audioFile&&<button onClick={()=>{setAudioFile(null);setAudioUrl("");setAudioName("");}} style={{background:"none",border:"1px solid #ef4444",color:"#ef4444",padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:900,marginTop:4}}>✕ REMOVE AUDIO</button>}
              </div>
            )}
            {step===2&&(
              <div>
                {label("VIDEO STYLE")}{sel("videoStyle",STYLES)}
                {label("COLOUR GRADE")}{sel("colorGrade",GRADES)}
                {label("VISUAL EFFECTS")}{multi("effects",EFFECTS)}
                {label("EDITING STYLE")}{sel("cuts",CUTS)}
                {label("ASPECT RATIO")}
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["16:9","9:16 (Vertical)","1:1 (Square)","2.39:1 (Cinematic)"].map(r=>(
                    <button key={r} onClick={()=>set("aspectRatio",r)}
                      style={{background:config.aspectRatio===r?GOLD:"#111",border:"1px solid "+(config.aspectRatio===r?"#000":GOLDDIM),color:config.aspectRatio===r?"#000":WHITE,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:900}}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step===3&&(
              <div>
                {label("DESCRIBE YOUR MUSIC VIDEO SCENE")}
                <textarea value={config.visualDesc} onChange={e=>set("visualDesc",e.target.value)}
                  placeholder="e.g. A man sits alone on a windowsill fingerpicking acoustic guitar. Only his back is visible. Facing the open ocean at night. Full moon. Single candle. The room is empty."
                  style={{...inp,height:160,resize:"vertical",lineHeight:1.8,border:"1px solid "+GOLD}}/>
                {label("DURATION")}
                <div style={{display:"flex",gap:6}}>
                  {["2 Minutes","3 Minutes","4 Minutes","5 Minutes"].map(d=>(
                    <button key={d} onClick={()=>set("duration",d)}
                      style={{background:config.duration===d?GOLD:"#111",border:"1px solid "+(config.duration===d?"#000":GOLDDIM),color:config.duration===d?"#000":WHITE,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:900}}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step===4&&(
              <div>
                <div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:16,fontWeight:900,marginBottom:10,letterSpacing:3}}>READY TO CREATE</div>
                <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:6}}>DESCRIBE YOUR MUSIC VIDEO SCENE</div>
                <textarea value={config.visualDesc} onChange={e=>set("visualDesc",e.target.value)}
                  placeholder="Describe what you want to see..."
                  style={{width:"100%",background:"#000",border:"1px solid "+GOLD,padding:"12px",color:WHITE,fontSize:13,outline:"none",fontFamily:"'Rajdhani',sans-serif",boxSizing:"border-box",height:130,resize:"vertical",lineHeight:1.8,marginBottom:10}}/>
                <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:6}}>⬆ UPLOAD REFERENCE IMAGE (OPTIONAL)</div>
                {config.refMedia?(
                  <div style={{position:"relative",marginBottom:10}}>
                    <img src={config.refMedia} alt="ref" style={{width:"100%",height:70,objectFit:"cover",border:"1px solid "+GOLD}}/>
                    <button onClick={()=>set("refMedia",null)} style={{position:"absolute",top:4,right:4,background:"#000",border:"1px solid "+GOLD,color:GOLD,padding:"1px 7px",cursor:"pointer",fontSize:10,fontWeight:900}}>✕</button>
                    <div style={{color:"#22c55e",fontSize:9,fontWeight:900,letterSpacing:2,marginTop:3}}>✓ REFERENCE LOADED</div>
                  </div>
                ):(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
                    <button onClick={()=>{const inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)set("refMedia",URL.createObjectURL(f));};inp.click();}}
                      style={{background:"linear-gradient(135deg,#1a0800,#2a1200)",border:"2px solid "+GOLD,color:GOLD,padding:"10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>
                      📷 UPLOAD PHOTO
                    </button>
                    <button onClick={()=>{const inp=document.createElement("input");inp.type="file";inp.accept="image/*,video/*";inp.onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)set("refMedia",URL.createObjectURL(f));};inp.click();}}
                      style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,color:WHITE,padding:"10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>
                      📁 UPLOAD FILE
                    </button>
                  </div>
                )}
                <div style={{background:"#0a0500",border:"1px solid "+GOLDDIM,padding:14,marginBottom:14}}>
                  <div style={{color:GOLD,fontSize:11,letterSpacing:2,marginBottom:8,fontWeight:900}}>YOUR MUSIC VIDEO</div>
                  {[["TITLE",config.title||"—"],["ARTIST",config.artist||"—"],["GENRE",config.genre||"—"],["MOOD",config.mood||"—"],["STYLE",config.videoStyle||"—"],["DURATION",config.duration||"—"],["AUDIO",audioName||"No audio uploaded"]].map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0",borderBottom:"1px solid #0a0800"}}>
                      <span style={{color:GOLDDIM,letterSpacing:2}}>{k}</span>
                      <span style={{color:WHITE,fontWeight:700}}>{v}</span>
                    </div>
                  ))}
                </div>
                <button onClick={generateVideo} disabled={generating}
                  style={{background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",width:"100%",padding:"18px",fontSize:14,letterSpacing:3,cursor:generating?"not-allowed":"pointer",fontWeight:900,fontFamily:"'Rajdhani',sans-serif",opacity:generating?0.7:1,marginBottom:10}}>
                  {generating?"⟳ RENDERING... "+renderProgress+"%":"🎬 GENERATE MUSIC VIDEO"}
                </button>
                {generating&&(
                  <div>
                    <div style={{height:5,background:"#111",marginBottom:6}}>
                      <div style={{width:renderProgress+"%",height:"100%",background:"linear-gradient(90deg,#a07820,#e8c96d)",transition:"width .3s"}}/>
                    </div>
                    <div style={{background:"#000",border:"1px solid "+GOLDDIM,padding:10,maxHeight:140,overflowY:"auto"}}>
                      {renderLog.map((l,i)=>(
                        <div key={i} style={{color:i===renderLog.length-1?"#22c55e":DIM,fontSize:10,lineHeight:1.8}}>
                          {i===renderLog.length-1?"▶ ":"  "}{l}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {videoUrl&&(
            <div style={{display:"flex",flexDirection:"column",background:"#000",overflow:"hidden"}}>
              <div style={{position:"relative",background:"#000"}}>
                <canvas ref={canvasRef} style={{display:"none"}}/>
                <video ref={videoRef} src={videoUrl} playsInline
                  style={{width:"100%",aspectRatio:"16/9",display:"block",background:"#000"}}
                  onTimeUpdate={()=>setCurrentTime(videoRef.current?.currentTime||0)}
                  onLoadedMetadata={()=>setDuration2(videoRef.current?.duration||0)}
                  onPlay={()=>setPlaying(true)}
                  onPause={()=>setPlaying(false)}
                  onEnded={()=>setPlaying(false)}/>
                <div style={{background:"rgba(0,0,0,0.85)",padding:"8px 12px"}}>
                  <div style={{height:3,background:"#222",marginBottom:8,cursor:"pointer",borderRadius:2}}
                    onClick={e=>{if(!videoRef.current||!duration2)return;const r=e.currentTarget.getBoundingClientRect();videoRef.current.currentTime=((e.clientX-r.left)/r.width)*duration2;}}>
                    <div style={{width:duration2&&isFinite(duration2)?(currentTime/duration2*100):0+"%",height:"100%",background:GOLD,borderRadius:2,transition:"width .1s"}}/>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <button onClick={()=>videoRef.current&&(videoRef.current.currentTime=0)} style={{background:"none",border:"none",color:GOLDDIM,cursor:"pointer",fontSize:14}}>⏮</button>
                      <button onClick={()=>{if(!videoRef.current)return;playing?videoRef.current.pause():videoRef.current.play();}} style={{background:GOLD,border:"none",color:"#000",width:32,height:32,cursor:"pointer",fontSize:16,fontWeight:900}}>
                        {playing?"⏸":"▶"}
                      </button>
                      <span style={{color:WHITE,fontSize:11,fontFamily:"monospace"}}>{fmt(currentTime||0)} / {fmt(isFinite(duration2)&&duration2>0?duration2:0)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
                <div style={{color:GOLD,fontSize:11,fontWeight:900,letterSpacing:3,marginBottom:10}}>EXPORT YOUR MUSIC VIDEO</div>
                <a href={videoUrl} download={(config.title||"MusicVideo")+"_"+config.artist+".webm"}
                  style={{display:"block",background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",padding:"12px",textAlign:"center",textDecoration:"none",fontWeight:900,fontSize:12,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",marginBottom:8}}>
                  ⬇ DOWNLOAD VIDEO
                </a>
                <button onClick={()=>{
                  if(videoBlob&&onSave){
                    const fn=(config.title||"MusicVideo")+"_"+config.artist+".webm";
                    onSave({id:"mv_"+Date.now(),name:fn,type:"video/webm",url:videoUrl,file:new File([videoBlob],fn,{type:"video/webm"})});
                    addLog("✓ Saved to media library");
                  }
                }} style={{width:"100%",background:"transparent",border:"1px solid "+GOLD,color:GOLD,padding:"10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",marginBottom:14}}>
                  💾 SAVE TO MEDIA LIBRARY
                </button>
                <div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:3,marginBottom:8}}>SHARE TO</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:12}}>
                  {SOCIAL.map(([name,color,url])=>(
                    <button key={name} onClick={()=>window.open(url,"_blank")}
                      style={{background:"#000",border:"1px solid "+color+"33",color:color,padding:"7px 4px",cursor:"pointer",fontSize:10,fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}
                      onMouseEnter={e=>{e.currentTarget.style.background=color+"22";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="#000";}}>
                      {name}
                    </button>
                  ))}
                </div>
                <button onClick={()=>{setVideoUrl("");setVideoBlob(null);setRenderLog([]);setRenderProgress(0);setStep(1);}}
                  style={{width:"100%",background:"transparent",border:"1px solid "+GOLDDIM,color:GOLDDIM,padding:"8px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>
                  + NEW MUSIC VIDEO
                </button>
              </div>
            </div>
          )}
          {!videoUrl&&<canvas ref={canvasRef} style={{display:"none"}}/>}
        </div>
        {!videoUrl&&(
          <div style={{borderTop:"1px solid "+GOLDDIM+"",padding:"10px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <button onClick={()=>setStep(s=>Math.max(1,s-1))} disabled={step===1} style={{background:"transparent",border:"1px solid "+GOLD,color:GOLD,padding:"6px 16px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",opacity:step===1?0.3:1}}>◀ BACK</button>
            <span style={{color:GOLDDIM,fontSize:10,letterSpacing:2}}>STEP {step} OF 4</span>
            {step<4
              ?<button onClick={()=>setStep(s=>Math.min(4,s+1))} style={{background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",padding:"6px 16px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>NEXT ▶</button>
              :<button onClick={onClose} style={{background:"transparent",border:"1px solid "+GOLDDIM,color:GOLDDIM,padding:"6px 16px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>CLOSE</button>
            }
          </div>
        )}
      </div>
    </div>
  );
}


const VOICE_CHARACTERS = [
  {id:"james",name:"James",emoji:"🎩",gender:"Male",age:"Adult",origin:"British",region:"London",style:"Sarcastic · Deadpan · Witty",pitch:0.86,rate:0.62,desc:"Dry British wit. Devastating things said with complete calm."},
  {id:"aurora",name:"Aurora",emoji:"🌅",gender:"Female",age:"Adult",origin:"British",region:"London",style:"Warm · Documentary · Authoritative",pitch:1.08,rate:0.80,desc:"Calm authority. The voice you trust completely."},
  {id:"edward",name:"Edward",emoji:"🎭",gender:"Male",age:"Adult",origin:"British",region:"London",style:"Theatrical · Grand · Classical",pitch:0.85,rate:0.75,desc:"Shakespearean gravitas. Every sentence carved in stone."},
  {id:"cecily",name:"Cecily",emoji:"🫖",gender:"Female",age:"Adult",origin:"British",region:"London",style:"Crisp · Intelligent · Sardonic",pitch:1.12,rate:0.85,desc:"Sharp as a tack. Mildly disappointed by most things."},
  {id:"nana",name:"Nana",emoji:"🧶",gender:"Female",age:"Elderly",origin:"British",region:"Yorkshire",style:"Gentle · Wise · Warm",pitch:1.02,rate:0.70,desc:"Warm elderly wisdom. Has seen everything twice."},
  {id:"colonel",name:"Colonel",emoji:"🎖️",gender:"Male",age:"Elderly",origin:"British",region:"London",style:"Commanding · Dignified · Veteran",pitch:0.80,rate:0.74,desc:"Authority earned through decades of experience."},
  {id:"pippa",name:"Pippa",emoji:"🎀",gender:"Female",age:"Teen",origin:"British",region:"London",style:"Bright · Cheerful · Young",pitch:1.25,rate:0.95,desc:"Fresh and warm. Natural young British energy."},
  {id:"archie",name:"Archie",emoji:"⚽",gender:"Male",age:"Teen",origin:"British",region:"Manchester",style:"Casual · Friendly · Teen",pitch:1.05,rate:0.98,desc:"Relaxed and genuine. Sounds like a real teenager."},
  {id:"ewan",name:"Ewan",emoji:"🏴",gender:"Male",age:"Adult",origin:"Scottish",region:"Edinburgh",style:"Warm · Rugged · Sincere",pitch:0.92,rate:0.82,desc:"Deep warm Scottish sincerity."},
  {id:"fiona",name:"Fiona",emoji:"🌿",gender:"Female",age:"Adult",origin:"Scottish",region:"Glasgow",style:"Lilting · Warm · Storyteller",pitch:1.10,rate:0.84,desc:"Beautiful Scottish lilt."},
  {id:"paddy",name:"Paddy",emoji:"☘️",gender:"Male",age:"Adult",origin:"Irish",region:"Dublin",style:"Charming · Witty · Warm",pitch:0.95,rate:0.88,desc:"Easy Irish charm."},
  {id:"siobhan",name:"Siobhan",emoji:"🌸",gender:"Female",age:"Adult",origin:"Irish",region:"Cork",style:"Gentle · Musical · Emotional",pitch:1.15,rate:0.82,desc:"Soft Irish voice with real emotional depth."},
  {id:"dafydd",name:"Dafydd",emoji:"🐉",gender:"Male",age:"Adult",origin:"Welsh",region:"Cardiff",style:"Musical · Passionate · Rich",pitch:0.90,rate:0.80,desc:"Rich Welsh musicality."},
  {id:"marcus",name:"Marcus",emoji:"⚡",gender:"Male",age:"Adult",origin:"American",region:"New York",style:"Deep · Cinematic · Commanding",pitch:0.72,rate:0.74,desc:"Big voice. When Marcus speaks people stop."},
  {id:"river",name:"River",emoji:"🌊",gender:"Male",age:"Adult",origin:"American",region:"Tennessee",style:"Warm · Intimate · Storyteller",pitch:0.98,rate:0.76,desc:"Unhurried Southern charm."},
  {id:"dakota",name:"Dakota",emoji:"🏔️",gender:"Female",age:"Adult",origin:"American",region:"Chicago",style:"Bold · Direct · Confident",pitch:1.05,rate:0.92,desc:"No filler. No hesitation."},
  {id:"wade",name:"Wade",emoji:"🤠",gender:"Male",age:"Adult",origin:"American",region:"Texas",style:"Laid Back · Humorous · Folksy",pitch:0.94,rate:0.85,desc:"Easy going Southern humour."},
  {id:"brooklyn",name:"Brooklyn",emoji:"🗽",gender:"Female",age:"Adult",origin:"American",region:"New York",style:"Fast · Sharp · City Energy",pitch:1.18,rate:1.10,desc:"Fast New York energy."},
  {id:"savannah",name:"Savannah",emoji:"🌺",gender:"Female",age:"Adult",origin:"American",region:"Georgia",style:"Sweet · Gracious · Warm",pitch:1.20,rate:0.84,desc:"Warm Southern grace."},
  {id:"madison",name:"Madison",emoji:"📱",gender:"Female",age:"Teen",origin:"American",region:"California",style:"Upbeat · Social · Natural",pitch:1.30,rate:1.08,desc:"Real American teenage energy."},
  {id:"tyler",name:"Tyler",emoji:"🎮",gender:"Male",age:"Teen",origin:"American",region:"Ohio",style:"Casual · Relatable · Teen",pitch:1.08,rate:1.00,desc:"Natural and unforced."},
  {id:"rosie",name:"Rosie",emoji:"🌼",gender:"Female",age:"Child",origin:"American",region:"Florida",style:"Sweet · Innocent · Child",pitch:1.45,rate:0.88,desc:"Young warm and sweet."},
  {id:"cooper",name:"Cooper",emoji:"🚂",gender:"Male",age:"Child",origin:"American",region:"Colorado",style:"Bright · Curious · Child",pitch:1.40,rate:0.90,desc:"Curious about everything."},
  {id:"grandma",name:"Grandma",emoji:"🫶",gender:"Female",age:"Elderly",origin:"American",region:"Virginia",style:"Warm · Loving · Elderly",pitch:1.00,rate:0.72,desc:"Full of love and life experience."},
  {id:"frank",name:"Frank",emoji:"🪑",gender:"Male",age:"Elderly",origin:"American",region:"New Jersey",style:"Gruff · Honest · Elder",pitch:0.78,rate:0.76,desc:"Says it straight."},
  {id:"sophia",name:"Sophia",emoji:"☀️",gender:"Female",age:"Adult",origin:"Australian",region:"Sydney",style:"Upbeat · Bright · Energetic",pitch:1.35,rate:1.12,desc:"Forward energy."},
  {id:"finn",name:"Finn",emoji:"🏄",gender:"Male",age:"Adult",origin:"Australian",region:"Melbourne",style:"Casual · Confident · Outdoorsy",pitch:0.95,rate:0.95,desc:"Relaxed Australian confidence."},
  {id:"aroha",name:"Aroha",emoji:"🌿",gender:"Female",age:"Adult",origin:"New Zealand",region:"Auckland",style:"Warm · Grounded · Sincere",pitch:1.10,rate:0.86,desc:"Natural sincerity."},
  {id:"amara",name:"Amara",emoji:"🌍",gender:"Female",age:"Adult",origin:"South African",region:"Cape Town",style:"Rich · Warm · Powerful",pitch:1.05,rate:0.84,desc:"Quiet power."},
  {id:"kofi",name:"Kofi",emoji:"🥁",gender:"Male",age:"Adult",origin:"West African",region:"Ghana",style:"Deep · Rhythmic · Storyteller",pitch:0.82,rate:0.78,desc:"Every sentence has music in it."},
  {id:"priya",name:"Priya",emoji:"🪷",gender:"Female",age:"Adult",origin:"Indian",region:"Mumbai",style:"Precise · Warm · Intelligent",pitch:1.15,rate:0.90,desc:"Warm and intelligent."},
  {id:"arjun",name:"Arjun",emoji:"🎯",gender:"Male",age:"Adult",origin:"Indian",region:"Delhi",style:"Authoritative · Clear · Measured",pitch:0.88,rate:0.85,desc:"Sounds like someone who knows exactly what they are talking about."},
  {id:"valentina",name:"Valentina",emoji:"🌹",gender:"Female",age:"Adult",origin:"Spanish",region:"Madrid",style:"Passionate · Warm · Expressive",pitch:1.18,rate:0.92,desc:"Everything sounds felt."},
  {id:"pierre",name:"Pierre",emoji:"🥐",gender:"Male",age:"Adult",origin:"French",region:"Paris",style:"Suave · Dry · Cultured",pitch:0.90,rate:0.84,desc:"Makes things sound interesting."},
  {id:"ingrid",name:"Ingrid",emoji:"❄️",gender:"Female",age:"Adult",origin:"Scandinavian",region:"Stockholm",style:"Clean · Cool · Direct",pitch:1.08,rate:0.88,desc:"No excess words."},
  {id:"yemi",name:"Yemi",emoji:"🌟",gender:"Female",age:"Adult",origin:"Nigerian",region:"Lagos",style:"Bold · Joyful · Energetic",pitch:1.25,rate:1.00,desc:"Life-affirming."},
  {id:"magnus",name:"Magnus",emoji:"🧙",gender:"Male",age:"Elderly",origin:"Fantasy",region:"Ancient",style:"Ancient · Wise · Epic",pitch:0.75,rate:0.70,desc:"Seen civilisations rise and fall."},
  {id:"nova",name:"Nova",emoji:"🤖",gender:"Female",age:"Adult",origin:"Neutral",region:"AI",style:"Clean · Precise · Neutral",pitch:1.12,rate:0.95,desc:"No accent. No emotion. No opinion."},
  {id:"hunter",name:"Hunter",emoji:"🎬",gender:"Male",age:"Adult",origin:"American",region:"Hollywood",style:"Trailer · Epic · Explosive",pitch:0.70,rate:0.80,desc:"Full movie trailer energy."},
  {id:"luna",name:"Luna",emoji:"🌙",gender:"Female",age:"Adult",origin:"Neutral",region:"ASMR",style:"Whisper · ASMR · Intimate",pitch:1.20,rate:0.65,desc:"Soft whisper. Complete calm."},
  {id:"professor",name:"Professor",emoji:"🎓",gender:"Male",age:"Elderly",origin:"British",region:"Oxford",style:"Academic · Thoughtful · Measured",pitch:0.88,rate:0.78,desc:"Distinguished. Precise."},
  {id:"hope",name:"Hope",emoji:"🌤️",gender:"Female",age:"Adult",origin:"American",region:"Heartfelt",style:"Tender · Gentle · Loving",pitch:1.15,rate:0.78,desc:"Pure tenderness."},
  {id:"storm",name:"Storm",emoji:"⛈️",gender:"Male",age:"Adult",origin:"American",region:"Intense",style:"Intense · Angry · Powerful",pitch:0.82,rate:1.00,desc:"Raw intensity."},
  {id:"joy",name:"Joy",emoji:"🎉",gender:"Female",age:"Adult",origin:"American",region:"Uplifting",style:"Excited · Joyful · Celebratory",pitch:1.40,rate:1.15,desc:"Pure infectious joy."},
  {id:"sage",name:"Sage",emoji:"🌿",gender:"Male",age:"Adult",origin:"Neutral",region:"Mindful",style:"Peaceful · Mindful · Grounded",pitch:0.95,rate:0.72,desc:"Deep calm."},
  {id:"faith",name:"Faith",emoji:"✨",gender:"Female",age:"Adult",origin:"American",region:"Gospel",style:"Inspirational · Gospel · Uplifting",pitch:1.18,rate:0.88,desc:"Gospel soul."},
  {id:"rebel",name:"Rebel",emoji:"✊",gender:"Female",age:"Teen",origin:"American",region:"Activist",style:"Fierce · Defiant · Young",pitch:1.22,rate:1.05,desc:"Will not back down."},
  {id:"blaze",name:"Blaze",emoji:"🔥",gender:"Male",age:"Adult",origin:"American",region:"Comedy",style:"Comic · Ridiculous · Energetic",pitch:1.05,rate:1.18,desc:"No dignity whatsoever."},
  {id:"remy",name:"Remy",emoji:"🎻",gender:"Male",age:"Adult",origin:"French",region:"Lyon",style:"Smooth · Romantic · Intimate",pitch:0.92,rate:0.80,desc:"Everything sounds like poetry."},
  {id:"zhara",name:"Zhara",emoji:"💫",gender:"Female",age:"Adult",origin:"Middle Eastern",region:"Dubai",style:"Elegant · Warm · Sophisticated",pitch:1.10,rate:0.85,desc:"Graceful and precise."},
  {id:"kai",name:"Kai",emoji:"🌊",gender:"Male",age:"Adult",origin:"Hawaiian",region:"Honolulu",style:"Relaxed · Warm · Soulful",pitch:0.96,rate:0.82,desc:"Unhurried ocean warmth."},
  {id:"sienna",name:"Sienna",emoji:"🎨",gender:"Female",age:"Adult",origin:"American",region:"New Orleans",style:"Soulful · Blues · Deep",pitch:1.05,rate:0.78,desc:"Every word feels lived-in."},
  {id:"atlas",name:"Atlas",emoji:"🌐",gender:"Male",age:"Adult",origin:"Neutral",region:"Epic",style:"Cinematic · Epic · Booming",pitch:0.68,rate:0.76,desc:"The voice of a thousand documentaries."},
  {id:"echo",name:"Echo",emoji:"🔮",gender:"Female",age:"Adult",origin:"Neutral",region:"Ethereal",style:"Ethereal · Dreamy · Otherworldly",pitch:1.22,rate:0.72,desc:"Sounds like it came from somewhere else."},
];

function P6Voice({ onSave, setMediaLib }) {
  const [text,setText]=useState(""); const [loading,setLoading]=useState(false);
  const [speaking,setSpeaking]=useState(false); const [mood,setMood]=useState("Neutral");
  const [savedToLib,setSavedToLib]=useState(false); const [showMVS,setShowMVS]=useState(false);
  const [selVoice,setSelVoice]=useState("james"); const [search,setSearch]=useState("");
  const [filterGender,setFilterGender]=useState("All"); const [filterAge,setFilterAge]=useState("All");
  const [filterOrigin,setFilterOrigin]=useState("All"); const [speed,setSpeed]=useState(0.62);
  const [pitchV,setPitchV]=useState(0.86); const [pauseLen,setPauseLen]=useState(1600);
  const [volume,setVolume]=useState(1.0); const [sysVoices,setSysVoices]=useState([]);
  const chunksRef=useRef([]); const idxRef=useRef(0); const timerRef=useRef(null);

  useEffect(()=>{
    const load=()=>setSysVoices(window.speechSynthesis.getVoices().filter(v=>v.lang&&v.lang.startsWith("en")));
    load(); window.speechSynthesis.onvoiceschanged=load;
    return()=>{window.speechSynthesis.cancel();if(timerRef.current)clearTimeout(timerRef.current);};
  },[]);

  const ORIGINS=["All","British","Scottish","Irish","Welsh","American","Australian","New Zealand","South African","West African","Indian","Spanish","French","Scandinavian","Nigerian","Fantasy","Neutral"];
  const AGES=["All","Child","Teen","Adult","Elderly"];
  const GENDERS=["All","Male","Female"];
  const filtered=VOICE_CHARACTERS.filter(v=>{
    const mg=filterGender==="All"||v.gender===filterGender;
    const ma=filterAge==="All"||v.age===filterAge;
    const mo=filterOrigin==="All"||v.origin===filterOrigin;
    const ms=search===""||v.name.toLowerCase().includes(search.toLowerCase())||v.style.toLowerCase().includes(search.toLowerCase());
    return mg&&ma&&mo&&ms;
  });
  const selected=VOICE_CHARACTERS.find(v=>v.id===selVoice)||VOICE_CHARACTERS[0];

  const pickSysVoice=(vc)=>{
    const all=sysVoices.length?sysVoices:window.speechSynthesis.getVoices().filter(v=>v.lang&&v.lang.startsWith("en"));
    if(!all.length)return null;
    const gb=all.filter(v=>v.lang==="en-GB"),us=all.filter(v=>v.lang==="en-US"),au=all.filter(v=>v.lang==="en-AU");
    const hash=vc.id.split("").reduce((a,ch)=>a+ch.charCodeAt(0),0);
    const isMale=vc.gender==="Male",isBritish=["British","Scottish","Irish","Welsh"].includes(vc.origin),isAU=["Australian","New Zealand"].includes(vc.origin);
    const deepMaleNames=/daniel|oliver|arthur|malcolm|george|alex|fred|tom|aaron|guy|bruce|lee|david|mark/i;
    const softFemaleNames=/kate|serena|emily|moira|fiona|samantha|ava|victoria|zoe|susan|karen|tessa/i;
    let pool=[];
    if(isBritish&&isMale){pool=[...gb.filter(v=>deepMaleNames.test(v.name)),...gb.filter(v=>!softFemaleNames.test(v.name))];}
    else if(isBritish&&!isMale){pool=[...gb.filter(v=>softFemaleNames.test(v.name)),...gb.filter(v=>!deepMaleNames.test(v.name))];}
    else if(isAU){pool=[...au,...all];}
    else if(vc.origin==="Irish"){pool=gb.filter(v=>/moira/i.test(v.name));}
    else if(isMale){pool=[...us.filter(v=>deepMaleNames.test(v.name)),...us.filter(v=>!softFemaleNames.test(v.name)),...all.filter(v=>!softFemaleNames.test(v.name))];}
    else{pool=[...us.filter(v=>softFemaleNames.test(v.name)),...us.filter(v=>!deepMaleNames.test(v.name)),...all.filter(v=>!deepMaleNames.test(v.name))];}
    if(!pool.length)pool=all;
    const unique=[...new Map(pool.map(v=>[v.name,v])).values()];
    return unique[hash%unique.length]||all[0];
  };

  const speakOneShot=(vc,txt)=>{
    window.speechSynthesis.cancel();
    const utt=new SpeechSynthesisUtterance(txt);
    const sv=pickSysVoice(vc);if(sv)utt.voice=sv;
    utt.pitch=Math.max(0.1,Math.min(2.0,vc.pitch||1.0));
    utt.rate=vc.rate||0.85;utt.volume=1.0;
    window.speechSynthesis.speak(utt);
  };

  const speakNow=(txt)=>{
    window.speechSynthesis.cancel();if(timerRef.current)clearTimeout(timerRef.current);
    if(/iphone|ipad|ipod/i.test(navigator.userAgent)){
      const keepAlive=setInterval(()=>{if(window.speechSynthesis.speaking){window.speechSynthesis.pause();window.speechSynthesis.resume();}else{clearInterval(keepAlive);}},9000);
    }
    const chunks=buildChunks(txt);chunksRef.current=chunks;idxRef.current=0;setSpeaking(true);
    const baseRate=speed*(selected.rate||0.9),basePitch=pitchV*(selected.pitch||1.0);
    const next=()=>{
      const idx=idxRef.current;
      if(idx>=chunksRef.current.length){setSpeaking(false);return;}
      const chunk=chunksRef.current[idx];
      if(!chunk||!chunk.text){idxRef.current=idx+1;timerRef.current=setTimeout(next,200);return;}
      const sv=pickSysVoice(selected);
      const utt=new SpeechSynthesisUtterance(chunk.text);
      if(sv)utt.voice=sv;utt.volume=volume;
      utt.rate=Math.max(0.1,Math.min(2.0,baseRate));
      utt.pitch=Math.max(0.1,Math.min(2.0,basePitch+(chunk.type==="question"?0.1:chunk.type==="exclaim"?0.07:0)));
      const ap=chunk.type==="question"?Math.round(pauseLen*1.1):chunk.type==="sentence"?pauseLen:Math.round(pauseLen*0.4);
      utt.onend=()=>{idxRef.current=idx+1;timerRef.current=setTimeout(next,ap);};
      utt.onerror=()=>{idxRef.current=idx+1;next();};
      window.speechSynthesis.speak(utt);
    };
    window.speechSynthesis.getVoices().length>0?setTimeout(next,50):window.speechSynthesis.onvoiceschanged=()=>{window.speechSynthesis.onvoiceschanged=null;setTimeout(next,50);};
  };

  const stop=()=>{window.speechSynthesis.cancel();if(timerRef.current)clearTimeout(timerRef.current);setSpeaking(false);};

  const processAndSpeak=async()=>{
    if(!text.trim())return;setLoading(true);
    try{
      const d=await proxyFetch({model:"claude-sonnet-4-20250514",max_tokens:2000,messages:[{role:"user",content:"Speech coach for TTS. Speaker: "+selected.name+" - "+selected.style+". Mood: "+mood+". Reformat for natural speech: short sentences, commas for pauses, numbers spelled out. Return ONLY reformatted text:\n\n"+text}]});
      speakNow(d&&d.content&&d.content[0]?d.content[0].text.trim():text);
    }catch(e){speakNow(text);}
    setLoading(false);
  };

  const inp={width:"100%",background:"#000",border:"1px solid "+GOLDDIM,padding:"12px 14px",color:WHITE,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif",lineHeight:1.9};

  return(
    <div style={{...Sp}}>
      {showMVS&&<MusicVideoStudio onClose={()=>setShowMVS(false)} onSave={onSave}/>}
      <div style={{padding:"12px 18px",borderBottom:"1px solid "+GOLDDIM+"",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div><div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700}}>AI WORKSTATION 02 — CINEMA VOICE ENGINE</div><h1 style={{...H1,fontSize:24,margin:0}}>TEXT TO LIFELIKE SPEECH</h1></div>
        <button onClick={()=>setShowMVS(true)} style={{background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",padding:"10px 20px",cursor:"pointer",fontSize:12,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>🎬 MUSIC VIDEO STUDIO</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"290px 1fr",minHeight:"calc(100vh - 120px)"}}>
        <div style={{borderRight:"1px solid "+GOLDDIM+"",background:"#030303",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"10px 10px 6px"}}>
            <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:8}}>VOICE LIBRARY — {filtered.length} / {VOICE_CHARACTERS.length}</div>
            <div style={{marginBottom:5}}><div style={{color:GOLDDIM,fontSize:9,letterSpacing:2,marginBottom:3}}>GENDER</div><div style={{display:"flex",gap:4}}>{GENDERS.map(g=><button key={g} onClick={()=>setFilterGender(g)} style={{flex:1,background:filterGender===g?GOLD:"#111",border:"1px solid "+(filterGender===g?"#000":GOLDDIM),color:filterGender===g?"#000":WHITE,padding:"3px 0",cursor:"pointer",fontSize:10,fontWeight:900}}>{g}</button>)}</div></div>
            <div style={{marginBottom:5}}><div style={{color:GOLDDIM,fontSize:9,letterSpacing:2,marginBottom:3}}>AGE</div><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{AGES.map(a=><button key={a} onClick={()=>setFilterAge(a)} style={{background:filterAge===a?GOLD:"#111",border:"1px solid "+(filterAge===a?"#000":GOLDDIM),color:filterAge===a?"#000":WHITE,padding:"2px 8px",cursor:"pointer",fontSize:9,fontWeight:900}}>{a}</button>)}</div></div>
            <div style={{marginBottom:6}}><div style={{color:GOLDDIM,fontSize:9,letterSpacing:2,marginBottom:3}}>ORIGIN</div><select value={filterOrigin} onChange={e=>setFilterOrigin(e.target.value)} style={{width:"100%",background:"#111",border:"1px solid "+GOLDDIM,color:WHITE,padding:"4px 8px",fontSize:11,outline:"none"}}>{ORIGINS.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search voices..." style={{...inp,padding:"6px 10px",fontSize:11,height:30}}/>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"6px 6px 80px"}}>
            {filtered.map(v=>(
              <div key={v.id} onClick={()=>setSelVoice(v.id)} style={{padding:"10px 12px",marginBottom:4,background:selVoice===v.id?"#0a0800":"#000",border:"2px solid "+(selVoice===v.id?GOLD:GOLDDIM),cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:18}}>{v.emoji}</span>
                    <div><div style={{color:selVoice===v.id?GOLD:WHITE,fontSize:13,fontWeight:900}}>{v.name}</div><div style={{color:GOLDDIM,fontSize:10}}>{v.origin} · {v.gender} · {v.age}</div></div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();setSelVoice(v.id);speakOneShot(v,"Hello, this is "+v.name+". "+v.desc);}}
                    style={{background:GOLDDIM,border:"none",color:"#000",padding:"3px 10px",cursor:"pointer",fontSize:9,fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif",whiteSpace:"nowrap",flexShrink:0}}>▶ TEST</button>
                </div>
                <div style={{color:DIM,fontSize:10,lineHeight:1.5}}>{v.style}</div>
                {selVoice===v.id&&<div style={{color:GOLD,fontSize:9,letterSpacing:2,marginTop:4,fontWeight:900}}>✓ SELECTED</div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",background:"#030303",overflowY:"auto",padding:20}}>
          <div style={{background:"#000",border:"1px solid "+GOLDDIM,padding:"10px 14px",marginBottom:14}}>
            <div style={{color:WHITE,fontSize:13,fontWeight:900}}>{selected.name} {selected.emoji} · {selected.origin} · {selected.gender}</div>
            <div style={{color:GOLDDIM,fontSize:11,marginTop:3}}>{selected.style}</div>
            <div style={{color:DIM,fontSize:11,marginTop:2,fontStyle:"italic"}}>{selected.desc}</div>
          </div>
          <div style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,padding:"12px 14px",marginBottom:14}}>
            <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:10}}>VOICE SETTINGS</div>
            <div style={{marginBottom:10}}><div style={{color:GOLDDIM,fontSize:10,fontWeight:900,letterSpacing:2,marginBottom:4}}>MOOD</div>
              <select value={mood} onChange={e=>setMood(e.target.value)} style={{width:"100%",background:"#0a0800",border:"1px solid "+GOLDDIM,color:WHITE,padding:"8px 12px",fontSize:13,fontFamily:"'Rajdhani',sans-serif",outline:"none"}}>
                {["Neutral","Happy","Sad","Angry","Excited","Calm","Dramatic","Mysterious","Romantic","Sarcastic","Melancholic","Authoritative","Warm"].map(m=><option key={m} value={m} style={{background:"#000"}}>{m}</option>)}
              </select>
            </div>
            {[["SPEED",speed,0.3,1.5,0.01,v=>setSpeed(v),speed.toFixed(2)+"x"],["PITCH",pitchV,0.3,2.0,0.01,v=>setPitchV(v),pitchV.toFixed(2)],["PAUSE (ms)",pauseLen,200,2000,50,v=>setPauseLen(v),pauseLen+"ms"],["VOLUME",volume,0.1,1.0,0.05,v=>setVolume(v),Math.round(volume*100)+"%"]].map(([label,val,mn,mx,st,setter,display])=>(
              <div key={label} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:GOLDDIM,fontSize:10,fontWeight:900,letterSpacing:2}}>{label}</span><span style={{color:GOLD,fontSize:11,fontWeight:900}}>{display}</span></div>
                <input type="range" min={mn} max={mx} step={st} value={val} onChange={e=>setter(+e.target.value)} style={{width:"100%",accentColor:GOLD}}/>
              </div>
            ))}
          </div>
          <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:6}}>YOUR NARRATION SCRIPT</div>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste your narration script here..."
            style={{...inp,height:160,resize:"vertical",marginBottom:14}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            <div style={{background:"#0a0800",border:"1px solid "+GOLDDIM,padding:"12px 14px"}}>
              <div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:2,marginBottom:6}}>TEST SCRIPT</div>
              <div style={{color:WHITE,fontSize:11,lineHeight:1.7,marginBottom:10}}>Hear your script with current voice and settings.</div>
              <button onClick={()=>speaking?stop():speakNow(text)} disabled={!text.trim()} style={{background:"transparent",border:"1px solid "+GOLD,color:GOLD,width:"100%",padding:"9px",fontSize:11,fontWeight:900,letterSpacing:2,cursor:!text.trim()?"not-allowed":"pointer",fontFamily:"'Rajdhani',sans-serif",opacity:!text.trim()?0.5:1}}>{speaking?"⏹ STOP":"▶ TEST SCRIPT"}</button>
            </div>
            <div style={{background:"#0a0800",border:"1px solid "+GOLDDIM,padding:"12px 14px"}}>
              <div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:2,marginBottom:6}}>RESET</div>
              <div style={{color:WHITE,fontSize:11,lineHeight:1.7,marginBottom:10}}>Clear script and reset all settings.</div>
              <button onClick={()=>{stop();setText("");setSavedToLib(false);setSpeed(0.62);setPitchV(0.86);setPauseLen(1600);setVolume(1.0);setMood("Neutral");}} style={{background:"transparent",border:"1px solid "+GOLD,color:GOLD,width:"100%",padding:"9px",fontSize:11,fontWeight:900,letterSpacing:2,cursor:"pointer",fontFamily:"'Rajdhani',sans-serif"}}>↺ RESET ALL</button>
            </div>
          </div>
          <button onClick={processAndSpeak} disabled={loading||!text.trim()} style={{background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",width:"100%",padding:"16px",fontSize:14,fontWeight:900,letterSpacing:3,cursor:loading||!text.trim()?"not-allowed":"pointer",fontFamily:"'Rajdhani',sans-serif",opacity:loading||!text.trim()?0.5:1,marginBottom:8}}>
            {loading?"⟳ PREPARING AND SPEAKING...":"✦ PREPARE AND SPEAK"}
          </button>
          <button onClick={()=>{if(text.trim()&&onSave){const asset={id:Date.now()+Math.random(),name:"Narration - "+selected.name+" - "+new Date().toLocaleTimeString(),type:"narration",text,voice:selected.name,date:new Date().toISOString()};onSave(asset);if(setMediaLib)setMediaLib(p=>[...p,asset]);setSavedToLib(true);setTimeout(()=>setSavedToLib(false),2500);}}} disabled={!text.trim()} style={{background:savedToLib?"#061406":"transparent",border:"1px solid "+(savedToLib?"#22c55e":GOLD),color:savedToLib?"#22c55e":GOLD,width:"100%",padding:"12px",fontSize:12,letterSpacing:2,cursor:!text.trim()?"not-allowed":"pointer",fontFamily:"'Rajdhani',sans-serif",fontWeight:900,opacity:!text.trim()?0.5:1}}>
            {savedToLib?"✓ SAVED TO MEDIA LIBRARY":"💾 SAVE TO MEDIA LIBRARY"}
          </button>
        </div>
      </div>
    </div>
  );
}


function P8VideoGenerator({ onSave, user, filmDuration, setFilmDuration }) {
  const canvasRef=useRef(null);
  const videoRef=useRef(null);
  const refMediaRef=useRef(null);
  const [prompt,setPrompt]=useState("");
  const [title,setTitle]=useState("");
  const [duration,setDuration]=useState(30);
  const [generating,setGenerating]=useState(false);
  const [progress,setProgress]=useState(0);
  const [log,setLog]=useState([]);
  const [videoUrl,setVideoUrl]=useState("");
  const [saved,setSaved]=useState(false);
  const [refMedia,setRefMedia]=useState(null);
  const [refMediaType,setRefMediaType]=useState("");
  const [refDataUrl,setRefDataUrl]=useState(null);
  const [refImages,setRefImages]=useState([]);
  const [useReality,setUseReality]=useState(true);
  const [renderStyle,setRenderStyle]=useState("photorealistic");
  const [genre,setGenre]=useState("");
  const addLog=(msg)=>setLog(p=>[...p,msg]);

  const RENDER_STYLES=[
    {id:"photorealistic",label:"📷 Photorealistic"},
    {id:"cinematic",label:"🎬 Cinematic"},
    {id:"documentary",label:"🎥 Documentary"},
    {id:"noir",label:"🌑 Film Noir"},
    {id:"golden",label:"🌅 Golden Hour"},
    {id:"scifi",label:"🚀 Sci-Fi"},
    {id:"horror",label:"👻 Horror"},
    {id:"animated",label:"✨ Stylised"},
  ];
  const FILM_GENRES=[
    {id:"",label:"— NO GENRE —"},
    {id:"feature",label:"🎬 Feature Film"},{id:"documentary",label:"🎥 Documentary"},
    {id:"musicvideo",label:"🎵 Music Video"},{id:"shortfilm",label:"🎭 Short Film"},
    {id:"horror",label:"👻 Horror"},{id:"scifi",label:"🚀 Sci-Fi"},
    {id:"romance",label:"💕 Romance"},{id:"thriller",label:"⚡ Thriller"},
    {id:"action",label:"💥 Action"},{id:"comedy",label:"😄 Comedy"},
    {id:"drama",label:"🎭 Drama"},{id:"animation",label:"✨ Animation"},
    {id:"historical",label:"🏛 Historical"},{id:"nature",label:"🌿 Nature"},
  ];
  const EXAMPLES=[
    "Earth rotating slowly in deep space. City lights blazing gold on the night side. Stars everywhere.",
    "A woman places a folded paper into a wooden ballot box. Morning light from a window.",
    "Night city skyline. Rain. Neon reflections on wet streets. A lone figure walks under a streetlight.",
    "Underwater coral reef. Vivid tropical fish. Light shafts from the surface above.",
    "An elderly couple on a park bench in autumn. Golden leaves falling. Neither speaking.",
    "Vast dark server room. Three people huddled around a single warm lantern. Faces lit gold.",
    "Cave interior. Torchlight. Ancient paintings on the walls. A figure looking at camera.",
    "Dawn breaking over a savanna. A silhouetted human figure stands at the horizon.",
  ];

  const handleRefUpload=(e)=>{
    const f=e.target.files&&e.target.files[0];
    if(!f)return;
    setRefMedia(URL.createObjectURL(f));
    setRefMediaType(f.type.startsWith("video")?"video":"image");
    const reader=new FileReader();
    reader.onload=ev=>setRefDataUrl(ev.target.result);
    reader.readAsDataURL(f);
  };

  const generateVideo=async()=>{
    if(!prompt.trim()){alert("Describe your scene first");return;}
    setGenerating(true);setProgress(0);setLog([]);setVideoUrl("");setSaved(false);
    addLog("MandaStrong Reality Engine — initialising...");
    setProgress(5);

    let realityPlan = null;
    let loadedImages = [];

    if(useReality && refImages.length > 0){
      addLog("Reality Engine: loading "+refImages.length+" reference photo(s)...");
      try {
        loadedImages = await Promise.all(refImages.map(ri => new Promise((res, rej) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => res({...ri, img, w: img.naturalWidth, h: img.naturalHeight});
          img.onerror = () => res(null);
          img.src = ri.url;
        })));
        loadedImages = loadedImages.filter(Boolean);
        addLog("✓ "+loadedImages.length+" photo(s) loaded");
      } catch(e){ addLog("Image load error: "+e.message); }

      if(loadedImages.length > 0){
        try {
          addLog("Claude is directing your scene composition...");
          const photoList = loadedImages.map((p,i) => "Photo "+(i+1)+": "+(p.name||"image")+" ("+p.w+"x"+p.h+")").join("\n");
          const planPrompt = "You are a film director assembling a "+duration+"-second scene from real photographs.\n\nScene description: \""+prompt+"\"\n\nAvailable photographs:\n"+photoList+"\n\nReturn a JSON plan (no markdown fences):\n{\"backgroundIdx\":0,\"backgroundMotion\":\"kenburns-in\",\"layers\":[],\"atmosphere\":[\"none\"],\"lightWrap\":{\"color\":\"warm\",\"intensity\":0.3},\"colorGrade\":\"teal-orange\",\"vignette\":0.5,\"grainAmount\":0.04,\"cameraShake\":0.002,\"depthBlur\":true}";
          const res = await proxyFetch({model:"claude-sonnet-4-20250514",max_tokens:1500,messages:[{role:"user",content:planPrompt}]});
          let planText = res && res.content && res.content[0] ? res.content[0].text.trim() : "";
          planText = planText.replace(/^```(?:json)?/gm,"").replace(/```$/gm,"").trim();
          const jsonStart = planText.indexOf("{");
          const jsonEnd = planText.lastIndexOf("}");
          if(jsonStart >= 0 && jsonEnd > jsonStart) planText = planText.slice(jsonStart, jsonEnd+1);
          realityPlan = JSON.parse(planText);
          addLog("✓ Composition plan: "+(realityPlan.layers?.length||0)+" layers · "+realityPlan.colorGrade+" grade");
        } catch(e){
          addLog("Plan failed — using default composition");
          realityPlan = {backgroundIdx:0,backgroundMotion:"kenburns-in",layers:[],atmosphere:["none"],lightWrap:{color:"warm",intensity:0.3},colorGrade:"teal-orange",vignette:0.55,grainAmount:0.04,cameraShake:0.002,depthBlur:true};
        }
      }
    }
    setProgress(15);

    const realityDrawFn = realityPlan && loadedImages.length > 0 ? (ctx, W, H, t, sec) => {
      const plan = realityPlan;
      const bgImg = loadedImages[plan.backgroundIdx || 0];
      let camScale = 1, camX = 0, camY = 0;
      const motion = plan.backgroundMotion || "kenburns-in";
      if(motion === "kenburns-in") camScale = 1 + t*0.18;
      else if(motion === "kenburns-out") camScale = 1.18 - t*0.18;
      else if(motion === "pan-left") camX = -W*0.1*t;
      else if(motion === "pan-right") camX = W*0.1*t;
      camX += Math.sin(sec*0.7)*W*plan.cameraShake;
      camY += Math.cos(sec*0.6)*H*plan.cameraShake;
      if(bgImg){
        const ar = bgImg.w / bgImg.h;
        const targetAR = W/H;
        let dw, dh, dx, dy;
        if(ar > targetAR){ dh = H*camScale; dw = dh*ar; }
        else{ dw = W*camScale; dh = dw/ar; }
        dx = (W-dw)/2 + camX;
        dy = (H-dh)/2 + camY;
        ctx.drawImage(bgImg.img, dx, dy, dw, dh);
      }
      if(plan.depthBlur){
        ctx.globalAlpha = 0.08;
        for(let b=0;b<3;b++){
          const off = b+1;
          if(bgImg){
            const ar = bgImg.w/bgImg.h;
            const dh = H*camScale*1.02; const dw = dh*ar;
            ctx.drawImage(bgImg.img, (W-dw)/2+off+camX, (H-dh)/2+off+camY, dw, dh);
          }
        }
        ctx.globalAlpha = 1;
      }
      (plan.layers || []).forEach((layer, li) => {
        const img = loadedImages[layer.idx];
        if(!img) return;
        const pos = layer.position || {x: 0.5, y: 0.5};
        const scale = layer.scale || 0.4;
        const parallax = layer.role === "foreground" ? 1 : layer.role === "midground" ? 0.5 : 0.2;
        const lx = W*pos.x + Math.sin(sec*0.4+li)*W*0.005*parallax + camX*parallax;
        const ly = H*pos.y + Math.cos(sec*0.3+li)*H*0.004*parallax + camY*parallax;
        const lw = W*scale;
        const lh = lw * (img.h/img.w);
        ctx.globalAlpha = layer.opacity || 1;
        ctx.globalCompositeOperation = layer.blend || "normal";
        const sway = Math.sin(sec*0.5+li)*2;
        ctx.drawImage(img.img, lx-lw/2+sway, ly-lh/2, lw, lh);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      });
      const grades = {"teal-orange":{r:10,g:5,b:25,a:0.08},"golden":{r:40,g:20,b:0,a:0.1},"noir":{r:0,g:0,b:0,a:0.2},"natural":{r:5,g:5,b:0,a:0.03},"cool":{r:0,g:10,b:30,a:0.08},"warm":{r:30,g:15,b:0,a:0.08}};
      const grade = grades[plan.colorGrade || "teal-orange"];
      ctx.fillStyle = "rgba("+grade.r+","+grade.g+","+grade.b+","+grade.a+")";
      ctx.fillRect(0, 0, W, H);
      const vig = ctx.createRadialGradient(W/2, H/2, W*0.1, W/2, H/2, W*0.85);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,"+(plan.vignette||0.5)+")");
      ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H*0.072);
      ctx.fillRect(0, H*0.928, W, H*0.072);
      const gAmount = Math.round((plan.grainAmount||0.04) * 1000);
      for(let g=0;g<gAmount;g++){
        const gv = Math.random()>0.5 ? 160 : 30;
        ctx.fillStyle = "rgba("+gv+","+gv+","+gv+",0.01)";
        ctx.fillRect(Math.random()*W, Math.random()*H, 1.2, 1.2);
      }
      if(t < 0.05){ ctx.fillStyle = "rgba(0,0,0,"+(1-t/0.05)+")"; ctx.fillRect(0, 0, W, H); }
      if(t > 0.92){ ctx.fillStyle = "rgba(0,0,0,"+((t-0.92)/0.08)+")"; ctx.fillRect(0, 0, W, H); }
    } : null;

    let claudeRenderer = null;
    try {
      addLog("Claude is writing a custom renderer for your scene...");
      setProgress(8);
      const styleNote = renderStyle==="photorealistic"?"photorealistic with real-world lighting and depth":renderStyle==="cinematic"?"cinematic teal-orange grade, anamorphic feel":renderStyle==="noir"?"black and white, high contrast film noir":renderStyle==="golden"?"golden hour warmth, rich amber light":renderStyle==="scifi"?"blue-tinted sci-fi with deep blacks":renderStyle==="horror"?"desaturated greens, deep shadows, unease":"naturalistic documentary look";
      const claudePrompt = "You are writing a canvas2d render function for a "+duration+"-second cinematic video. Scene: \""+prompt+"\". Style: "+styleNote+". Write ONLY a function called drawFrame(ctx, W, H, t, sec). Use gradient layers, volumetric lighting, atmospheric depth, camera motion. No external resources. No images. Output ONLY the function declaration, no markdown.";
      const res = await proxyFetch({model:"claude-sonnet-4-20250514",max_tokens:8000,messages:[{role:"user",content:claudePrompt}]});
      let code = res && res.content && res.content[0] ? res.content[0].text.trim() : "";
      code = code.replace(/^```(?:javascript|js)?/gm,"").replace(/```$/gm,"").trim();
      const fi = code.indexOf("function drawFrame");
      if (fi >= 0) code = code.slice(fi);
      const bo = code.indexOf("{");
      const bc = code.lastIndexOf("}");
      if (bo > 0 && bc > bo) {
        const body = code.slice(bo+1, bc);
        claudeRenderer = new Function("ctx","W","H","t","sec",body);
        const testCanvas = document.createElement("canvas");
        testCanvas.width = 200; testCanvas.height = 112;
        claudeRenderer(testCanvas.getContext("2d"), 200, 112, 0.5, duration*0.5);
        addLog("✓ Claude renderer compiled — photorealistic mode engaged");
      }
    } catch(claudeErr) {
      addLog("Claude renderer unavailable — using MandaStrong Engine v2");
      claudeRenderer = null;
    }
    setProgress(15);

    const pr=prompt.toLowerCase();
    const scene={
      isNight:/night|dark|moon|evening|dusk|midnight|stars/.test(pr),
      isGolden:/golden|sunset|sunrise|dusk|dawn|amber/.test(pr),
      isDay:/day|noon|bright|sunlit|sunny|midday/.test(pr),
      isOcean:/ocean|sea|water|wave|shore|coast|lake|river/.test(pr),
      isCity:/city|urban|street|building|skyline|neon|town/.test(pr),
      isIndoor:/room|interior|inside|window|wall|floor|ceiling/.test(pr),
      isForest:/forest|tree|wood|jungle|grove|leaves/.test(pr),
      isMountain:/mountain|peak|ridge|cliff|valley|hill/.test(pr),
      isSpace:/space|galaxy|planet|cosmos|nebula|orbit/.test(pr),
      isRain:/rain|storm|wet|drizzle|downpour/.test(pr),
      isFog:/fog|mist|haze|smoke|cloud/.test(pr),
      isSnow:/snow|winter|frost|ice|blizzard/.test(pr),
      hasPerson:/woman|man|person|figure|human|people|girl|boy|child/.test(pr),
      hasMultiplePeople:/people|crowd|couple|group|family|three|two|many/.test(pr),
      hasElderly:/elderly|old|grandma|grandpa|aged/.test(pr),
      hasCandle:/candle|flame|fire|torch|lantern|lamp/.test(pr),
      hasGuitar:/guitar|fingerpick|strum/.test(pr),
      isSilhouette:/silhouette|back to camera|facing away|backlit/.test(pr),
      isSitting:/sit|seated|bench|chair|windowsill|crouch/.test(pr),
      hasAutumn:/autumn|fall|leaves falling|orange leaves/.test(pr),
      isAerial:/aerial|above|drone|overhead/.test(pr),
      hasBench:/bench|park bench/.test(pr),
    };

    const drawFn=(ctx,W,H,t,sec)=>{
      ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;
      const pushIn=1+t*0.05;
      const driftX=Math.sin(sec*0.08)*8;
      const driftY=Math.cos(sec*0.06)*4;
      ctx.save();
      ctx.translate(W/2+driftX,H/2+driftY);
      ctx.scale(pushIn,pushIn);
      ctx.translate(-W/2,-H/2);

      if(scene.isNight){
        const sky=ctx.createLinearGradient(0,0,0,H*0.7);
        sky.addColorStop(0,"rgb(2,4,18)");sky.addColorStop(0.4,"rgb(5,10,38)");sky.addColorStop(1,"rgb(18,28,72)");
        ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
        for(let s=0;s<280;s++){
          const sx=(s*137.5)%W,sy=(s*97.3)%(H*0.6);
          const br=0.25+Math.sin(sec*0.7+s*0.4)*0.25;
          ctx.fillStyle="rgba(245,245,255,"+br+")";
          ctx.fillRect(sx,sy,s%7===0?1.8:0.7,s%7===0?1.8:0.7);
        }
        if(scene.isOcean){
          const mx=W*0.75,my=H*0.15;
          const moon=ctx.createRadialGradient(mx,my,0,mx,my,H*0.075);
          moon.addColorStop(0,"rgba(255,255,250,1)");moon.addColorStop(1,"rgba(180,180,160,0)");
          ctx.fillStyle=moon;ctx.beginPath();ctx.arc(mx,my,H*0.078,0,Math.PI*2);ctx.fill();
        }
      } else if(scene.isGolden){
        const sky=ctx.createLinearGradient(0,0,0,H*0.7);
        sky.addColorStop(0,"rgb(28,15,45)");sky.addColorStop(0.45,"rgb(195,75,30)");sky.addColorStop(1,"rgb(255,225,140)");
        ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
      } else {
        const sky=ctx.createLinearGradient(0,0,0,H*0.65);
        sky.addColorStop(0,"rgb(85,140,205)");sky.addColorStop(1,"rgb(195,220,240)");
        ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
        for(let cl=0;cl<6;cl++){
          const cx=((cl*W*0.22+sec*0.5)%W+W)%W;
          const cy=H*0.05+cl*H*0.04;
          const cr=W*0.09+(cl%3)*W*0.03;
          const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,cr);
          cg.addColorStop(0,"rgba(255,255,255,0.92)");cg.addColorStop(1,"rgba(255,255,255,0)");
          ctx.fillStyle=cg;ctx.fillRect(cx-cr,cy-cr*0.6,cr*2,cr*1.2);
        }
      }

      const horizY=scene.isIndoor?H:H*0.58;

      if(!scene.isIndoor&&!scene.isSpace){
        if(scene.isOcean){
          for(let w=0;w<12;w++){
            const yBase=horizY+w*12;
            const wg=ctx.createLinearGradient(0,yBase,0,H);
            const intensity=scene.isNight?[2+w*1.8,8+w*5,28+w*8]:scene.isGolden?[80-w*3,40+w*2,15+w]:[0+w*4,55+w*10,115+w*8];
            wg.addColorStop(0,"rgba("+intensity[0]+","+intensity[1]+","+intensity[2]+","+(0.7+w*0.025)+")");
            wg.addColorStop(1,"rgba(1,3,8,0.96)");
            ctx.fillStyle=wg;
            ctx.beginPath();ctx.moveTo(-10,H);
            for(let x=0;x<=W+10;x+=3){
              const y=yBase+Math.sin(x*0.007+sec*(0.2+w*0.06)+w*1.3)*16+Math.sin(x*0.022+sec*0.4+w*0.7)*7;
              ctx.lineTo(x,y);
            }
            ctx.lineTo(W+10,H);ctx.closePath();ctx.fill();
          }
        } else if(scene.isCity){
          const grd=ctx.createLinearGradient(0,horizY,0,H);
          grd.addColorStop(0,scene.isNight?"rgb(10,10,16)":"rgb(40,42,46)");
          grd.addColorStop(1,scene.isNight?"rgb(4,4,8)":"rgb(20,22,28)");
          ctx.fillStyle=grd;ctx.fillRect(0,horizY,W,H-horizY);
          for(let layer=0;layer<3;layer++){
            const layerY=horizY-(2-layer)*H*0.04;
            for(let b=0;b<22;b++){
              const bx=(b*131+layer*47)%W;
              const bh=(H*0.12+((b*97)%H)*0.3)*(0.6+layer*0.4);
              const bw=W*0.03+((b*53)%W)*0.025;
              ctx.fillStyle="rgba("+(scene.isNight?"8,8,16":"55,60,70")+","+(0.5+layer*0.25)+")";
              ctx.fillRect(bx,layerY-bh,bw,bh);
              if(scene.isNight&&layer>=1){
                for(let wy=0;wy<Math.floor(bh/20);wy++){
                  for(let wx=0;wx<Math.floor(bw/11);wx++){
                    if(Math.sin(b*13+wy*7+wx*11+layer)>0.15){
                      const lit=Math.sin(sec*0.4+b+wy*2+wx)>-0.4;
                      ctx.fillStyle=lit?"rgba(255,235,160,0.8)":"rgba(25,25,35,0.6)";
                      ctx.fillRect(bx+wx*11+2,layerY-bh+wy*20+5,7,11);
                    }
                  }
                }
              }
            }
          }
        } else if(scene.isForest){
          for(let layer=0;layer<3;layer++){
            const layerY=horizY-(2-layer)*H*0.03;
            for(let tr=0;tr<15-layer*3;tr++){
              const tx=((tr*151)+layer*37)%W;
              const th=H*(0.18+layer*0.06+(tr%5)*0.04);
              const tw=W*(0.012+layer*0.004);
              ctx.fillStyle="rgba("+(15+layer*8)+","+(28+layer*10)+","+(10+layer*5)+",0.95)";
              ctx.fillRect(tx,layerY-th,tw,th);
              const fg=ctx.createRadialGradient(tx+tw/2,layerY-th,0,tx+tw/2,layerY-th,H*0.1);
              fg.addColorStop(0,"rgba("+(14+layer*10)+","+(55+layer*15)+","+(12+layer*6)+",0.92)");
              fg.addColorStop(1,"rgba(5,18,4,0)");
              ctx.fillStyle=fg;ctx.fillRect(tx-H*0.1,layerY-th-H*0.06,H*0.2,H*0.18);
            }
          }
        } else {
          const gg=ctx.createLinearGradient(0,horizY,0,H);
          gg.addColorStop(0,scene.isGolden?"rgb(105,72,32)":scene.isNight?"rgb(18,20,15)":"rgb(40,50,28)");
          gg.addColorStop(1,scene.isGolden?"rgb(48,32,12)":scene.isNight?"rgb(8,10,6)":"rgb(18,25,12)");
          ctx.fillStyle=gg;ctx.fillRect(0,horizY,W,H-horizY);
        }
      }

      if(scene.isIndoor){
        const wall=ctx.createRadialGradient(W*0.5,H*0.4,0,W*0.5,H*0.5,W*0.7);
        wall.addColorStop(0,"rgb(15,11,7)");wall.addColorStop(1,"rgb(3,2,1)");
        ctx.fillStyle=wall;ctx.fillRect(0,0,W,H);
        const fl=ctx.createLinearGradient(0,H*0.62,0,H);
        fl.addColorStop(0,"rgb(25,17,10)");fl.addColorStop(1,"rgb(8,5,3)");
        ctx.fillStyle=fl;ctx.fillRect(0,H*0.62,W,H*0.38);
        const wox=W*0.1,woy=H*0.05,wow=W*0.48,woh=H*0.72;
        if(scene.isNight){
          const ws=ctx.createLinearGradient(wox,woy,wox,woy+woh);
          ws.addColorStop(0,"rgb(2,4,18)");ws.addColorStop(1,"rgb(8,18,52)");
          ctx.fillStyle=ws;ctx.fillRect(wox,woy,wow,woh);
          for(let s=0;s<60;s++){
            const sx=wox+(s*47)%wow,sy=woy+(s*31)%(woh*0.5);
            ctx.fillStyle="rgba(245,245,255,"+(0.4+Math.sin(sec*0.8+s)*0.3)+")";
            ctx.fillRect(sx,sy,s%4===0?1.4:0.7,s%4===0?1.4:0.7);
          }
          if(scene.isOcean){
            for(let w=0;w<5;w++){
              const wg2=ctx.createLinearGradient(0,woy+woh*0.55+w*9,0,woy+woh);
              wg2.addColorStop(0,"rgba(3,10,38,0.85)");wg2.addColorStop(1,"rgba(1,3,12,0.96)");
              ctx.fillStyle=wg2;
              ctx.beginPath();ctx.moveTo(wox,woy+woh);
              for(let x=wox;x<=wox+wow;x+=3){
                const y=woy+woh*0.6+w*10+Math.sin(x*0.012+sec*0.25+w)*9;
                ctx.lineTo(x,y);
              }
              ctx.lineTo(wox+wow,woy+woh);ctx.closePath();ctx.fill();
            }
          }
        } else {
          const ws=ctx.createLinearGradient(wox,woy,wox,woy+woh);
          ws.addColorStop(0,"rgb(140,180,220)");ws.addColorStop(1,"rgb(200,225,240)");
          ctx.fillStyle=ws;ctx.fillRect(wox,woy,wow,woh);
        }
        ctx.strokeStyle="rgba(55,35,18,0.95)";ctx.lineWidth=12;
        ctx.strokeRect(wox,woy,wow,woh);
        ctx.beginPath();ctx.moveTo(wox+wow*0.5,woy);ctx.lineTo(wox+wow*0.5,woy+woh);ctx.stroke();
        ctx.beginPath();ctx.moveTo(wox,woy+woh*0.5);ctx.lineTo(wox+wow,woy+woh*0.5);ctx.stroke();
      }

      if(scene.hasCandle){
        const candX=scene.isIndoor?W*0.72:W*0.5,candY=scene.isIndoor?H*0.55:H*0.5;
        const flicker=0.85+Math.sin(sec*9.2)*0.08+Math.sin(sec*14.7)*0.05;
        ctx.fillStyle="rgba(235,215,165,0.92)";ctx.fillRect(candX-5,candY,10,35);
        const flameH=22*flicker;
        const f1=ctx.createRadialGradient(candX,candY-flameH/2,0,candX,candY-flameH/2,flameH);
        f1.addColorStop(0,"rgba(255,180,40,0.7)");f1.addColorStop(1,"rgba(255,60,0,0)");
        ctx.fillStyle=f1;ctx.beginPath();ctx.ellipse(candX,candY-flameH/2,flameH*0.4,flameH*0.7,0,0,Math.PI*2);ctx.fill();
        const rg=ctx.createRadialGradient(candX,candY,0,candX,candY,W*0.4);
        rg.addColorStop(0,"rgba(255,150,40,0.15)");rg.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
      }

      if(scene.hasPerson){
        const drawPerson=(fx,fy,opts)=>{
          const o=opts||{};
          const isSeated=o.seated||scene.isSitting;
          const breath=Math.sin(sec*0.9+(o.phase||0))*0.008;
          const sway=Math.sin(sec*0.4+(o.phase||0))*2;
          if(scene.isSilhouette||o.silhouette){
            ctx.fillStyle="rgba(2,1,1,0.97)";
            ctx.beginPath();ctx.ellipse(fx+sway,fy-H*0.13,H*0.034,H*0.042,0,0,Math.PI*2);ctx.fill();
            ctx.fillRect(fx-H*0.028+sway,fy-H*0.09,H*0.056,H*(0.15+breath*2));
            if(scene.hasGuitar||o.guitar){
              ctx.beginPath();ctx.ellipse(fx+H*0.072+sway,fy+H*0.02,H*0.05,H*0.064,0.22,0,Math.PI*2);ctx.fill();
              ctx.fillRect(fx+H*0.026+sway,fy-H*0.09,H*0.011,H*0.12);
            }
            ctx.fillRect(fx-H*0.022+sway,fy+H*0.06,H*0.018,H*(isSeated?0.06:0.22));
            ctx.fillRect(fx+H*0.004+sway,fy+H*0.06,H*0.018,H*(isSeated?0.06:0.22));
          } else {
            const skinBase=[230,180,140];
            const headG=ctx.createRadialGradient(fx-H*0.008+sway,fy-H*0.145,0,fx+sway,fy-H*0.13,H*0.045);
            headG.addColorStop(0,"rgba("+skinBase[0]+","+skinBase[1]+","+skinBase[2]+",1)");
            headG.addColorStop(1,"rgba(155,105,75,1)");
            ctx.fillStyle=headG;
            ctx.beginPath();ctx.ellipse(fx+sway,fy-H*0.13,H*0.034*(1+breath),H*0.044*(1+breath),0,0,Math.PI*2);ctx.fill();
            const hairG=ctx.createRadialGradient(fx+sway,fy-H*0.16,0,fx+sway,fy-H*0.155,H*0.048);
            hairG.addColorStop(0,"rgba(35,22,12,0.95)");hairG.addColorStop(1,"rgba(20,12,6,0.85)");
            ctx.fillStyle=hairG;
            ctx.beginPath();ctx.ellipse(fx+sway,fy-H*0.158,H*0.038,H*0.03,0,Math.PI,Math.PI*2);ctx.fill();
            const blink=Math.sin(sec*0.35+(o.phase||0))>0.93?0.05:0.5;
            ctx.fillStyle="rgba(20,12,8,0.95)";
            ctx.beginPath();ctx.ellipse(fx-H*0.012+sway,fy-H*0.133,H*0.005,H*0.005*blink,0,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.ellipse(fx+H*0.012+sway,fy-H*0.133,H*0.005,H*0.005*blink,0,0,Math.PI*2);ctx.fill();
            ctx.fillStyle="rgba(140,75,60,0.7)";
            ctx.fillRect(fx-H*0.008+sway,fy-H*0.108,H*0.016,H*0.003);
            const tg=ctx.createLinearGradient(fx-H*0.035+sway,fy-H*0.09,fx+H*0.035+sway,fy+H*0.08);
            tg.addColorStop(0,"rgba(35,22,12,0.97)");tg.addColorStop(1,"rgba(20,12,6,0.97)");
            ctx.fillStyle=tg;
            ctx.fillRect(fx-H*0.032+sway,fy-H*(0.09+breath),H*0.064,H*(0.17+breath*2));
            ctx.fillRect(fx-H*0.022+sway,fy+H*0.08,H*0.018,H*(isSeated?0.06:0.22));
            ctx.fillRect(fx+H*0.004+sway,fy+H*0.08,H*0.018,H*(isSeated?0.06:0.22));
            if(scene.hasGuitar||o.guitar){
              const gx=fx+H*0.09+sway,gy=fy+H*0.02;
              const gbG=ctx.createRadialGradient(gx,gy,0,gx,gy,H*0.07);
              gbG.addColorStop(0,"rgba(155,90,28,0.97)");gbG.addColorStop(1,"rgba(55,28,8,0.92)");
              ctx.fillStyle=gbG;
              ctx.beginPath();ctx.ellipse(gx,gy,H*0.05,H*0.064,0.22,0,Math.PI*2);ctx.fill();
              ctx.beginPath();ctx.ellipse(gx-H*0.005,gy-H*0.065,H*0.038,H*0.05,0.22,0,Math.PI*2);ctx.fill();
              ctx.fillStyle="rgba(0,0,0,0.85)";
              ctx.beginPath();ctx.ellipse(gx-H*0.005,gy,H*0.012,H*0.012,0,0,Math.PI*2);ctx.fill();
              ctx.fillStyle="rgba(60,32,12,0.97)";
              ctx.save();ctx.translate(gx-H*0.02,gy-H*0.06);ctx.rotate(0.4);
              ctx.fillRect(0,-H*0.005,H*0.14,H*0.01);ctx.restore();
            }
          }
        };
        if(scene.hasMultiplePeople){
          const positions=scene.hasBench?[
            {x:W*0.43,y:H*0.52,seated:true,elderly:true,phase:0},
            {x:W*0.56,y:H*0.52,seated:true,elderly:true,phase:1}
          ]:[
            {x:W*0.35,y:H*0.46,phase:0},
            {x:W*0.5,y:H*0.46,phase:1.5},
            {x:W*0.65,y:H*0.46,phase:3}
          ];
          positions.forEach(p=>drawPerson(p.x,p.y,p));
        } else {
          const fx=scene.isOcean&&scene.isIndoor?W*0.22:W*0.45;
          const fy=scene.isSitting?H*0.52:H*0.44;
          drawPerson(fx,fy,{seated:scene.isSitting,silhouette:scene.isSilhouette,guitar:scene.hasGuitar,elderly:scene.hasElderly});
        }
      }

      if(scene.isRain){
        for(let r=0;r<180;r++){
          const rx=(r*137+sec*250)%W,ry=(r*97+sec*550)%H;
          ctx.strokeStyle="rgba(165,180,215,0.18)";ctx.lineWidth=0.9;
          ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-5,ry+22);ctx.stroke();
        }
      }
      if(scene.isSnow){
        for(let s=0;s<200;s++){
          const sx=(s*137+sec*30+Math.sin(sec+s)*15)%W,sy=(s*97+sec*60)%H;
          ctx.fillStyle="rgba(255,255,255,"+(0.6+Math.sin(s)*0.2)+")";
          ctx.fillRect(sx,sy,0.8+(s%5)*0.4,0.8+(s%5)*0.4);
        }
      }
      if(scene.hasAutumn){
        for(let l=0;l<25;l++){
          const lx=(l*73+sec*15+Math.sin(sec*0.5+l)*40)%W,ly=(l*47+sec*45)%H;
          ctx.save();ctx.translate(lx,ly);ctx.rotate(sec*2+l);
          ctx.fillStyle=l%3===0?"rgba(220,120,40,0.85)":l%3===1?"rgba(180,80,30,0.85)":"rgba(230,180,60,0.85)";
          ctx.fillRect(-4,-2,8,4);ctx.restore();
        }
      }

      ctx.restore();

      ctx.globalCompositeOperation="multiply";
      const filmCurve=ctx.createLinearGradient(0,0,0,H);
      filmCurve.addColorStop(0,"rgb(240,235,220)");filmCurve.addColorStop(1,"rgb(245,240,225)");
      ctx.fillStyle=filmCurve;ctx.globalAlpha=0.08;ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";

      const vig=ctx.createRadialGradient(W/2,H/2,W*0.1,W/2,H/2,W*0.85);
      vig.addColorStop(0,"rgba(0,0,0,0)");vig.addColorStop(1,"rgba(0,0,0,0.85)");
      ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
      ctx.fillStyle="#000";
      ctx.fillRect(0,0,W,H*0.072);
      ctx.fillRect(0,H*0.928,W,H*0.072);
      for(let g=0;g<35;g++){
        const gv=Math.random()>0.5?160:30;
        ctx.fillStyle="rgba("+gv+","+gv+","+gv+",0.01)";
        ctx.fillRect(Math.random()*W,Math.random()*H,1.2,1.2);
      }
      if(t<0.05){ctx.fillStyle="rgba(0,0,0,"+(1-t/0.05)+")";ctx.fillRect(0,0,W,H);}
      if(t>0.92){ctx.fillStyle="rgba(0,0,0,"+((t-0.92)/0.08)+")";ctx.fillRect(0,0,W,H);}
    };

    addLog("Engine compiled — rendering at "+duration+"s, 24fps...");
    setProgress(25);

    try{
      const canvas=canvasRef.current;
      canvas.width=1920;canvas.height=1080;
      const ctx=canvas.getContext("2d");
      try{(realityDrawFn||claudeRenderer||drawFn)(ctx,1920,1080,0,0);}catch(e){addLog("Prime error: "+e.message);}
      await new Promise(r=>setTimeout(r,300));
      const fps=24;
      const msPerFrame=Math.round(1000/fps);
      const totalFrames=duration*fps;
      const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";
      const stream=canvas.captureStream(fps);
      const recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:18000000});
      const chunks=[];
      recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
      recorder.start(msPerFrame);
      addLog("Camera rolling — "+duration+"s at "+fps+"fps...");
      await new Promise(resolve=>{
        let frame=0;
        const startTime=performance.now();
        const renderNext=()=>{
          if(frame>=totalFrames){resolve(null);return;}
          const t=frame/totalFrames;
          const sec=frame/fps;
          try{
            ctx.clearRect(0,0,1920,1080);
            if(realityDrawFn){try{realityDrawFn(ctx,1920,1080,t,sec);}catch(e){(claudeRenderer||drawFn)(ctx,1920,1080,t,sec);}}
            else if(claudeRenderer){try{claudeRenderer(ctx,1920,1080,t,sec);}catch(e){drawFn(ctx,1920,1080,t,sec);}}
            else{drawFn(ctx,1920,1080,t,sec);}
            if(t>0.9){
              const a=(t-0.9)/0.1;
              ctx.globalAlpha=a*0.9;
              ctx.fillStyle="rgba(0,0,0,"+a*0.7+")";ctx.fillRect(0,0,1920,1080);
              ctx.fillStyle="#e8c96d";ctx.font="900 50px Arial Black";ctx.textAlign="center";
              ctx.shadowColor="#e8c96d";ctx.shadowBlur=32;
              ctx.fillText("MANDASTRONG STUDIO",960,500);
              ctx.shadowBlur=0;ctx.fillStyle="#a07820";ctx.font="400 22px Arial";
              ctx.fillText("CINEMA INTELLIGENCE PLATFORM",960,545);
              ctx.globalAlpha=1;
            }
          }catch(e){ctx.fillStyle="#050200";ctx.fillRect(0,0,1920,1080);}
          setProgress(25+Math.round((frame/totalFrames)*70));
          if(frame%(fps*3)===0)addLog("  "+Math.round(sec)+"s / "+duration+"s rendered");
          frame++;
          const next=startTime+(frame*msPerFrame);
          setTimeout(renderNext,Math.max(4,next-performance.now()));
        };
        renderNext();
      });
      setProgress(97);addLog("Finalising...");
      await new Promise(r=>setTimeout(r,800));
      recorder.stop();
      await new Promise(r=>{recorder.onstop=r;});
      const blob=new Blob(chunks,{type:mimeType});
      const url=URL.createObjectURL(blob);
      setVideoUrl(url);setProgress(100);
      addLog("✓ Render complete — "+(blob.size/1024/1024).toFixed(1)+"MB · "+duration+"s · 1080p");
      const fn=(title||"Scene")+"_"+duration+"s.webm";
      try{
        const clipId="clip_"+Date.now();
        await saveClipToDB(clipId,blob,fn,"video/webm");
        if(onSave)onSave({id:clipId,name:fn,type:"video/webm",url:URL.createObjectURL(blob),file:new File([blob],fn,{type:"video/webm"}),dbId:clipId});
        addLog("✓ Saved to media library");
      }catch(e){}
      setTimeout(()=>{
        if(videoRef.current){videoRef.current.src=url;videoRef.current.load();videoRef.current.play().catch(()=>{});}
      },500);
    }catch(e){addLog("Render error: "+e.message);}
    setGenerating(false);
  };

  const saveToLibrary=async()=>{
    if(!videoUrl)return;
    try{
      const r=await fetch(videoUrl);const b=await r.blob();
      const fn=(title||"Scene")+"_"+duration+"s.webm";
      const file=new File([b],fn,{type:"video/webm"});
      if(onSave)onSave({id:Date.now()+Math.random(),name:fn,type:"video/webm",url:URL.createObjectURL(file),file});
    }catch(e){if(onSave)onSave({id:Date.now()+Math.random(),name:(title||"Scene")+"_"+duration+"s.webm",type:"video/webm",url:videoUrl});}
    setSaved(true);
  };

  return (
    <div style={{minHeight:"100vh",background:"#000",color:WHITE,fontFamily:"'Rajdhani',sans-serif",paddingBottom:160}}>
      <canvas ref={canvasRef} style={{display:"none"}}/>
      <div style={{padding:"12px 20px",borderBottom:"1px solid "+GOLDDIM+"",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700}}>MANDASTRONG REALITY ENGINE · COMPOSE REAL PHOTOS INTO CINEMA</div>
          <h1 style={{fontFamily:"'Cinzel',serif",color:GOLD,letterSpacing:5,margin:0,fontSize:24,textTransform:"uppercase"}}>VIDEO GENERATOR</h1>
        </div>
        <div style={{color:GOLD,fontSize:11,fontWeight:700,letterSpacing:2}}>✦ MANDASTRONG ENGINE · ANY PROMPT · ANY SUBJECT</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 420px",minHeight:"calc(100vh - 120px)"}}>
        <div style={{padding:20,overflowY:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div>
              <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:5}}>RENDER STYLE</div>
              <select value={renderStyle} onChange={e=>setRenderStyle(e.target.value)}
                style={{width:"100%",background:"#0a0800",border:"1px solid "+GOLD,color:GOLD,padding:"9px 12px",fontSize:12,outline:"none",fontFamily:"'Rajdhani',sans-serif",cursor:"pointer"}}>
                {RENDER_STYLES.map(s=><option key={s.id} value={s.id} style={{background:"#000"}}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:5}}>GENRE</div>
              <select value={genre} onChange={e=>setGenre(e.target.value)}
                style={{width:"100%",background:"#0a0800",border:"1px solid "+GOLDDIM,color:genre?GOLD:GOLDDIM,padding:"9px 12px",fontSize:12,outline:"none",fontFamily:"'Rajdhani',sans-serif",cursor:"pointer"}}>
                {FILM_GENRES.map(g=><option key={g.id} value={g.id} style={{background:"#000"}}>{g.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{background:"linear-gradient(135deg,#0a0500,#1a0a00)",border:"2px solid "+GOLD,padding:14,marginBottom:12,boxShadow:"0 0 20px "+GOLD+"22"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div>
                <div style={{color:GOLD,fontSize:12,letterSpacing:3,fontWeight:900}}>✦ REALITY ENGINE — REAL PHOTO COMPOSITION</div>
                <div style={{color:DIM,fontSize:10,marginTop:2,lineHeight:1.5}}>Upload 2-6 real photos. Claude composes them into your scene with parallax, depth, light wrap & atmosphere.</div>
              </div>
              <button onClick={()=>setUseReality(u=>!u)} style={{background:useReality?GOLD:"#000",border:"1px solid "+GOLD,color:useReality?"#000":GOLD,padding:"4px 10px",cursor:"pointer",fontSize:10,fontWeight:900,letterSpacing:1}}>
                {useReality?"ON":"OFF"}
              </button>
            </div>
            {refImages.length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,marginBottom:8}}>
                {refImages.map((ri,i)=>(
                  <div key={i} style={{position:"relative"}}>
                    <img src={ri.url} alt={ri.name||"ref"} style={{width:"100%",height:50,objectFit:"cover",border:"1px solid "+GOLD}}/>
                    <button onClick={()=>setRefImages(p=>p.filter((_,j)=>j!==i))} style={{position:"absolute",top:1,right:1,background:"#000",border:"1px solid "+GOLD,color:GOLD,padding:"0 4px",cursor:"pointer",fontSize:9,fontWeight:900,lineHeight:1.2}}>✕</button>
                    <div style={{color:GOLD,fontSize:8,letterSpacing:1,marginTop:1,textAlign:"center",fontWeight:900}}>{i===0?"BG":"L"+i}</div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={()=>{
              if(refImages.length>=6){alert("Max 6 photos");return;}
              const i=document.createElement("input");
              i.type="file";i.accept="image/*";i.multiple=true;
              i.onchange=e=>{
                const files=Array.from(e.target.files||[]).slice(0,6-refImages.length);
                setRefImages(p=>[...p,...files.map(f=>({url:URL.createObjectURL(f),name:f.name}))]);
              };
              i.click();
            }} style={{width:"100%",background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",padding:"10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>
              📷 {refImages.length===0?"ADD PHOTOS (UP TO 6)":"ADD MORE PHOTOS — "+refImages.length+"/6 LOADED"}
            </button>
            <div style={{color:GOLDDIM,fontSize:9,marginTop:5,letterSpacing:1,textAlign:"center"}}>1st photo = BACKGROUND · others composited as foreground layers</div>
          </div>
          <div style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,padding:12,marginBottom:12}}>
            <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:5}}>⬆ UPLOAD REFERENCE IMAGE (OPTIONAL)</div>
            {refMedia?(
              <div style={{position:"relative"}}>
                <img src={refMedia} alt="ref" style={{width:"100%",height:72,objectFit:"cover",border:"1px solid "+GOLD}}/>
                <button onClick={()=>{setRefMedia(null);setRefDataUrl(null);}} style={{position:"absolute",top:3,right:3,background:"#000",border:"1px solid "+GOLD,color:GOLD,padding:"1px 6px",cursor:"pointer",fontSize:10,fontWeight:900}}>✕</button>
                <div style={{color:"#22c55e",fontSize:9,fontWeight:900,letterSpacing:2,marginTop:3}}>✓ REFERENCE LOADED</div>
              </div>
            ):(
              <div onClick={()=>refMediaRef.current&&refMediaRef.current.click()}
                style={{border:"1px dashed "+GOLDDIM,padding:"8px",textAlign:"center",cursor:"pointer"}}>
                <div style={{color:WHITE,fontSize:11,fontWeight:700}}>⬆ CLICK TO UPLOAD</div>
                <div style={{color:DIM,fontSize:10,marginTop:1}}>JPG · PNG · MP4</div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:6}}>
              <button onClick={()=>{const i=document.createElement("input");i.type="file";i.accept="image/*";i.onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;setRefMedia(URL.createObjectURL(f));setRefMediaType("image");const reader=new FileReader();reader.onload=ev=>setRefDataUrl(ev.target.result);reader.readAsDataURL(f);};i.click();}}
                style={{background:"linear-gradient(135deg,#1a0800,#2a1200)",border:"2px solid "+GOLD,color:GOLD,padding:"10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>
                📷 UPLOAD PHOTO
              </button>
              <button onClick={()=>{const i=document.createElement("input");i.type="file";i.accept="image/*,video/*";i.onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;setRefMedia(URL.createObjectURL(f));setRefMediaType(f.type.startsWith("video")?"video":"image");const reader=new FileReader();reader.onload=ev=>setRefDataUrl(ev.target.result);reader.readAsDataURL(f);};i.click();}}
                style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,color:WHITE,padding:"10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>
                📁 UPLOAD FILE
              </button>
            </div>
            <input ref={refMediaRef} type="file" accept="image/*,video/*" style={{display:"none"}} onChange={handleRefUpload}/>
          </div>
          <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:6}}>SCENE TITLE</div>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. AI For Humanity — Chapter 1"
            style={{width:"100%",background:"#000",border:"1px solid "+GOLDDIM,padding:"10px 14px",color:WHITE,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif",marginBottom:14}}/>
          <div style={{marginBottom:14}}>
            <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:6}}>DESCRIBE YOUR SCENE</div>
            <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
              placeholder="e.g. A woman in a heavy coat places a folded paper into a wooden ballot box. Morning light from a window on the left."
              style={{width:"100%",background:"#000",border:"1px solid "+GOLDDIM,padding:"12px 14px",color:WHITE,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif",lineHeight:1.9,height:140,resize:"none"}}/>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:8}}>QUICK EXAMPLES — CLICK TO TRY</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {EXAMPLES.map((ex,i)=>(
                <div key={i} onClick={()=>setPrompt(ex)}
                  style={{background:"#000",border:"1px solid "+GOLDDIM,padding:"10px 12px",cursor:"pointer",fontSize:11,color:DIM,lineHeight:1.6}}>
                  {ex.slice(0,65)}{ex.length>65?"...":""}
                </div>
              ))}
            </div>
          </div>
          <div style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,padding:14,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{color:GOLD,fontSize:11,fontWeight:900,letterSpacing:2}}>DURATION</span>
              <span style={{color:WHITE,fontSize:11,fontWeight:900}}>{duration} SECONDS</span>
            </div>
            <input type="range" min={5} max={60} value={duration} onChange={e=>setDuration(+e.target.value)} style={{width:"100%",accentColor:GOLD}}/>
          </div>
          <button onClick={generateVideo} disabled={generating||!prompt.trim()}
            style={{background:"linear-gradient(135deg,#a07820,#e8c96d)",border:"none",color:"#000",width:"100%",padding:"20px",fontSize:15,letterSpacing:3,cursor:generating||!prompt.trim()?"not-allowed":"pointer",fontWeight:900,fontFamily:"'Rajdhani',sans-serif",opacity:generating||!prompt.trim()?0.5:1}}>
            {generating?"⟳ MANDASTRONG ENGINE RENDERING... "+progress+"%":"🎬 GENERATE SCENE"}
          </button>
        </div>
        <div style={{borderLeft:"1px solid "+GOLDDIM+"",display:"flex",flexDirection:"column"}}>
          <div style={{background:"#000",aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",borderBottom:"1px solid "+GOLDDIM+"",overflow:"hidden"}}>
            {videoUrl?(
              <video ref={videoRef} src={videoUrl} controls autoPlay loop playsInline style={{width:"100%",height:"100%",objectFit:"contain"}}/>
            ):(
              <div style={{textAlign:"center",padding:20}}>
                <div style={{color:GOLD,fontSize:11,fontWeight:900,letterSpacing:3,marginBottom:8}}>MANDASTRONG ENGINE v2</div>
                <div style={{color:DIM,fontSize:10,lineHeight:2}}>Type any scene description.<br/>Hit Generate.<br/>Real cinematic output.</div>
              </div>
            )}
          </div>
          {generating&&(
            <div style={{padding:"10px 14px",borderBottom:"1px solid "+GOLDDIM+""}}>
              <div style={{height:5,background:"#111",marginBottom:4}}>
                <div style={{width:progress+"%",height:"100%",background:"linear-gradient(90deg,#a07820,#e8c96d)",transition:"width .4s"}}/>
              </div>
              <div style={{color:GOLD,fontSize:10,textAlign:"center",letterSpacing:2}}>{progress}%</div>
            </div>
          )}
          {videoUrl&&!generating&&(
            <div style={{padding:"10px 14px",borderBottom:"1px solid "+GOLDDIM+"",display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                <a href={videoUrl} download={(title||"scene")+"_"+duration+"s.webm"}
                  style={{background:"transparent",border:"1px solid "+GOLD,color:GOLD,padding:"8px",fontSize:10,textDecoration:"none",textAlign:"center",letterSpacing:1,fontWeight:900,fontFamily:"'Rajdhani',sans-serif",display:"block"}}>⬇ DOWNLOAD</a>
                <button onClick={saveToLibrary}
                  style={{background:saved?"linear-gradient(135deg,#a07820,#e8c96d)":"transparent",border:"1px solid "+GOLD,color:saved?"#000":GOLD,padding:"8px",fontSize:10,cursor:"pointer",fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>
                  {saved?"✓ SAVED":"💾 LIBRARY"}
                </button>
              </div>
              <button onClick={()=>{setVideoUrl("");setLog([]);setSaved(false);setTitle("");setPrompt("");}}
                style={{background:"linear-gradient(135deg,#a07820,#e8c96d)",border:"none",color:"#000",padding:"8px",fontSize:11,width:"100%",letterSpacing:2,cursor:"pointer",fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>
                ▶ NEXT SCENE
              </button>
            </div>
          )}
          <div style={{flex:1,overflowY:"auto",padding:14}}>
            {log.length>0?(
              <div>
                <div style={{color:GOLD,fontSize:10,letterSpacing:3,fontWeight:900,marginBottom:10}}>PRODUCTION LOG</div>
                {log.map((l,i)=>(
                  <div key={i} style={{color:i===log.length-1?"#22c55e":DIM,fontSize:11,lineHeight:2,letterSpacing:1}}>
                    {i===log.length-1?"▶ ":"  "}{l}
                  </div>
                ))}
              </div>
            ):(
              <div style={{padding:"16px 0",color:GOLDDIM,fontSize:10,lineHeight:2.2,letterSpacing:1}}>
                <div style={{color:GOLD,fontWeight:900,fontSize:11,marginBottom:8}}>MANDASTRONG ENGINE v2</div>
                ✦ 8 rendering layers per frame<br/>
                ✦ Multi-layer parallax depth<br/>
                ✦ Volumetric candle flickering<br/>
                ✦ Animated ocean (12 wave layers)<br/>
                ✦ Procedural human anatomy<br/>
                ✦ Real moon halos + reflections<br/>
                ✦ Three-tier city buildings<br/>
                ✦ Film grain + vignette + grade<br/>
                ✦ Camera push-in + drift<br/>
                ✦ 24fps · 1080p · 18Mbps
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


function P1({ go }) {
  return (
    <div style={{...Sp}}>
      <div style={{background:"#000",padding:"56px 40px 36px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
          {[...Array(55)].map((_,i)=>(
            <div key={i} style={{position:"absolute",width:i%4===0?2:1,height:i%4===0?2:1,background:GOLD,borderRadius:"50%",opacity:.1+i%4*.15,left:(i*17+3)%100+"%",top:(i*11+7)%100+"%",animation:"tw "+1.8+i%3*.8+"s ease-in-out "+i%5*.35+"s infinite"}}/>
          ))}
        </div>
        <style>{"@keyframes tw{0%,100%{opacity:.05}50%{opacity:.85}}"}</style>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:11,color:DIM,letterSpacing:6,marginBottom:12}}>CINEMA INTELLIGENCE PLATFORM — EST. 2026</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(34px,6vw,58px)",fontWeight:900,color:GOLD,letterSpacing:5,lineHeight:1,textShadow:"0 0 60px "+GOLD+"dd,0 0 120px "+GOLD+"66"}}>MANDA STRONG</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(34px,6vw,58px)",fontWeight:900,color:GOLD,letterSpacing:5,lineHeight:1,textShadow:"0 0 60px "+GOLD+"dd,0 0 120px "+GOLD+"66",marginBottom:14}}>STUDIO</div>
          <div style={{color:WHITE,fontSize:12,letterSpacing:4,marginBottom:28,fontWeight:600}}>600+ AI TOOLS · 8K EXPORT · UP TO 3-HOUR FILMS</div>
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>go(4)} style={{...G("gold",false),fontSize:14,padding:"14px 38px",letterSpacing:3}}>START CREATING</button>
            <button onClick={()=>go(4)} style={{...G("out",false),fontSize:14,padding:"14px 38px",letterSpacing:3}}>LOGIN / REGISTER</button>
          </div>
        </div>
      </div>
      <div style={{borderTop:"1px solid "+GOLD+"",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,padding:"16px 24px",maxWidth:800,margin:"0 auto"}}>
        {[["600+","AI TOOLS"],["8K","EXPORT"],["3 HRS","DURATION"],["1TB","STORAGE"]].map(([v,l])=>(
          <div key={v} style={{...Card(),textAlign:"center",padding:12}}>
            <div style={{color:GOLD,fontFamily:"'Cinzel',serif",fontSize:22,fontWeight:900}}>{v}</div>
            <div style={{color:WHITE,fontSize:11,marginTop:3,fontWeight:700,letterSpacing:2}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{textAlign:"center",paddingBottom:24,paddingTop:16}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          <button onClick={()=>{
            const ua=navigator.userAgent.toLowerCase();
            const isIOS=/iphone|ipad|ipod/.test(ua);
            const isAndroid=/android/.test(ua);
            if(window.deferredInstallPrompt){window.deferredInstallPrompt.prompt();window.deferredInstallPrompt.userChoice.then(()=>{window.deferredInstallPrompt=null;});}
            else if(isIOS){alert("Install MandaStrong Studio on iPhone/iPad:\n\n1. Tap the Share button ↑ at the bottom\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add'");}
            else if(isAndroid){alert("Install MandaStrong Studio on Android:\n\n1. Tap the menu ⋮ in your browser\n2. Tap 'Add to Home Screen' or 'Install App'\n3. Tap Install");}
            else{alert("Install MandaStrong Studio on Desktop:\n\n1. Look for the install icon ⊕ in your browser address bar\n2. Click it and select Install");}
          }} style={{background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",padding:"14px 32px",fontSize:14,fontWeight:900,letterSpacing:3,cursor:"pointer",fontFamily:"'Rajdhani',sans-serif",width:"100%",maxWidth:320}}>
            ⬇ DOWNLOAD APP
          </button>
          <div style={{color:GOLDDIM,fontSize:10,letterSpacing:2,textAlign:"center"}}>BROWSER MENU → ADD TO HOME SCREEN</div>
        </div>
      </div>
    </div>
  );
}

function P2({ go }) {
  const pipeline=[{n:"01",ic:"✍",t:"WRITE",d:"Script, logline, scenes",p:5},{n:"02",ic:"🎙",t:"VOICE",d:"54 AI voice characters",p:6},{n:"03",ic:"🎨",t:"IMAGE",d:"AI-generated stills",p:7},{n:"04",ic:"🎬",t:"VIDEO",d:"Cinema scene engine",p:8},{n:"05",ic:"⏱",t:"TIMELINE",d:"Multi-track editor",p:13},{n:"06",ic:"🎚",t:"MIX",d:"4-channel audio mixer",p:15},{n:"07",ic:"⚡",t:"RENDER",d:"Up to 4K export",p:16}];
  const templates=[{ic:"🎬",t:"FEATURE FILM",d:"90-minute drama.",pages:[5,6,8,13,15,16],bg:"#1a0800"},{ic:"🎥",t:"DOCUMENTARY",d:"60-minute documentary.",pages:[5,6,8,13,15,16],bg:"#061a06"},{ic:"🎵",t:"MUSIC VIDEO",d:"Beat-synced cinematic video.",pages:[6,8,13,16],bg:"#0a0618"},{ic:"🎭",t:"SHORT FILM",d:"10-minute narrative.",pages:[5,6,8,13,16],bg:"#0a0a18"},{ic:"👨‍👩‍👧",t:"FAMILY MOVIE",d:"30-minute family film.",pages:[5,6,8,13,16],bg:"#1a0a00"},{ic:"📖",t:"AUDIOBOOK",d:"Narrated audiobook.",pages:[5,6,15,16],bg:"#181200"}];
  return(
    <div style={{...Sp,padding:"0 0 40px"}}>
      <div style={{padding:"20px 24px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div><div style={{fontSize:10,color:GOLD,letterSpacing:4,fontWeight:700,marginBottom:4}}>MANDASTRONG STUDIO · CINEMA INTELLIGENCE PLATFORM</div><h1 style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:"clamp(22px,4vw,40px)",fontWeight:900,letterSpacing:6,margin:0}}>STUDIO DASHBOARD</h1></div>
        <button onClick={()=>go(5)} style={{background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",padding:"14px 28px",fontSize:13,fontWeight:900,letterSpacing:3,cursor:"pointer",fontFamily:"'Rajdhani',sans-serif"}}>+ NEW PROJECT</button>
      </div>
      <div style={{padding:"0 24px 20px"}}>
        <div style={{fontSize:10,color:GOLD,letterSpacing:4,fontWeight:700,marginBottom:12}}>PRODUCTION PIPELINE</div>
        <div style={{display:"flex",gap:0,overflowX:"auto"}}>
          {pipeline.map((step,i)=>(
            <div key={step.n} style={{display:"flex",alignItems:"center",flexShrink:0}}>
              <div onClick={()=>go(step.p)} style={{background:"#0a0800",border:"1px solid "+GOLDDIM,padding:"14px 16px",cursor:"pointer",textAlign:"center",minWidth:120}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM;}}>
                <div style={{color:GOLDDIM,fontSize:9,letterSpacing:3,marginBottom:4}}>STEP {step.n}</div>
                <div style={{fontSize:20,marginBottom:4}}>{step.ic}</div>
                <div style={{color:GOLD,fontWeight:900,fontSize:12,letterSpacing:2,marginBottom:2}}>{step.t}</div>
                <div style={{color:WHITE,fontSize:10,lineHeight:1.3}}>{step.d}</div>
              </div>
              {i<pipeline.length-1&&<div style={{color:GOLDDIM,fontSize:14,padding:"0 3px",flexShrink:0}}>›</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"0 24px"}}>
        <div style={{fontSize:10,color:GOLD,letterSpacing:4,fontWeight:700,marginBottom:12}}>QUICK START TEMPLATES</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {templates.map(tmpl=>(
            <div key={tmpl.t} style={{background:tmpl.bg,border:"1px solid "+GOLDDIM+"33",padding:"16px 18px",cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM+"33";}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:24}}>{tmpl.ic}</span><span style={{color:GOLD,fontWeight:900,fontSize:13,letterSpacing:2}}>{tmpl.t}</span></div>
              <div style={{color:WHITE,fontSize:12,lineHeight:1.6,marginBottom:10}}>{tmpl.d}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {tmpl.pages.map(p=>(
                  <button key={p} onClick={()=>go(p)} style={{background:"transparent",border:"1px solid "+GOLDDIM,color:GOLDDIM,padding:"2px 8px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.color=GOLD;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM;e.currentTarget.style.color=GOLDDIM;}}>P{p}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function P3() {
  const [uploads,setUploads]=useState([null,null,null]);
  const [titles,setTitles]=useState(["","",""]);
  const [descs,setDescs]=useState(["","",""]);
  const refs=[useRef(null),useRef(null),useRef(null)];
  const videoRefs=[useRef(null),useRef(null),useRef(null)];
  const handleFile=(i,e)=>{
    const f=e.target.files&&e.target.files[0];
    if(!f)return;
    setUploads(p=>{const n=[...p];n[i]={url:URL.createObjectURL(f),name:f.name,type:f.type,size:(f.size/1024/1024).toFixed(1)};return n;});
  };
  const removeUpload=(i)=>{
    setUploads(p=>{const n=[...p];if(n[i])URL.revokeObjectURL(n[i].url);n[i]=null;return n;});
    setTitles(p=>{const n=[...p];n[i]="";return n;});
    setDescs(p=>{const n=[...p];n[i]="";return n;});
  };
  const inp={width:"100%",background:"#000",border:"1px solid "+GOLDDIM,padding:"8px 10px",color:WHITE,fontSize:12,outline:"none",fontFamily:"'Rajdhani',sans-serif",boxSizing:"border-box"};
  return (
    <div style={{...Sp,padding:40}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <div style={{fontSize:12,color:GOLD,letterSpacing:4,marginBottom:8,fontWeight:700}}>SHOWCASE</div>
        <h1 style={{...H1,fontSize:30,marginBottom:6}}>PROOF OF CONCEPT</h1>
        <div style={{color:GOLDDIM,fontSize:13,marginBottom:28,letterSpacing:1}}>Upload up to 3 films, trailers, or demo reels created with MandaStrong Studio.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{...Card(),padding:16}}>
              <div style={{color:GOLD,fontSize:10,letterSpacing:3,fontWeight:900,marginBottom:10}}>FILM {i+1}</div>
              <div style={{background:"#000",aspectRatio:"16/9",marginBottom:10,border:"1px solid "+(uploads[i]?GOLD:GOLDDIM),overflow:"hidden",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
                onClick={()=>!uploads[i]&&refs[i].current&&refs[i].current.click()}>
                {uploads[i]?(
                  uploads[i].type.startsWith("video")?(
                    <video ref={videoRefs[i]} src={uploads[i].url} controls playsInline style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                  ):(
                    <img src={uploads[i].url} alt="upload" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                  )
                ):(
                  <div style={{textAlign:"center",padding:16}}>
                    <div style={{color:GOLDDIM,fontSize:28,marginBottom:8}}>🎬</div>
                    <div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:2}}>CLICK TO UPLOAD</div>
                    <div style={{color:GOLDDIM,fontSize:9,marginTop:4}}>MP4 · WEBM · MOV · JPG · PNG</div>
                  </div>
                )}
                {uploads[i]&&(
                  <button onClick={e=>{e.stopPropagation();removeUpload(i);}}
                    style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,0.8)",border:"1px solid "+GOLD,color:GOLD,width:22,height:22,cursor:"pointer",fontSize:12,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                )}
              </div>
              <input ref={refs[i]} type="file" accept="video/*,image/*" style={{display:"none"}} onChange={e=>handleFile(i,e)}/>
              <div style={{color:GOLD,fontSize:9,letterSpacing:2,fontWeight:900,marginBottom:4}}>FILM TITLE</div>
              <input value={titles[i]} onChange={e=>setTitles(p=>{const n=[...p];n[i]=e.target.value;return n;})} placeholder="Enter film title..." style={{...inp,marginBottom:8}}/>
              <div style={{color:GOLD,fontSize:9,letterSpacing:2,fontWeight:900,marginBottom:4}}>DESCRIPTION</div>
              <textarea value={descs[i]} onChange={e=>setDescs(p=>{const n=[...p];n[i]=e.target.value;return n;})} placeholder="Describe this film..." style={{...inp,height:60,resize:"none",lineHeight:1.6,marginBottom:10}}/>
              {!uploads[i]?(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  <button onClick={()=>{const inp2=document.createElement("input");inp2.type="file";inp2.accept="image/*";inp2.onchange=e=>handleFile(i,e);inp2.click();}}
                    style={{background:"linear-gradient(135deg,#1a0800,#2a1200)",border:"2px solid "+GOLD,color:GOLD,padding:"10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>📷 PHOTO</button>
                  <button onClick={()=>refs[i].current&&refs[i].current.click()}
                    style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,color:WHITE,padding:"10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>📁 FILE</button>
                </div>
              ):(
                <div>
                  <div style={{color:"#22c55e",fontSize:9,fontWeight:900,letterSpacing:2,marginBottom:6}}>✓ {uploads[i].name.slice(0,28)} · {uploads[i].size}MB</div>
                  <button onClick={()=>refs[i].current&&refs[i].current.click()} style={{...G("out",false),width:"100%",padding:"8px",fontSize:10,letterSpacing:2}}>↻ REPLACE</button>
                </div>
              )}
            </div>
          ))}
        </div>
        {uploads.every(u=>!u)&&(
          <div style={{marginTop:32,padding:24,border:"1px dashed "+GOLDDIM,textAlign:"center"}}>
            <div style={{color:GOLDDIM,fontSize:12,letterSpacing:2,lineHeight:2}}>No films uploaded yet. Use Page 8 to generate scenes, Page 16 to render your film,<br/>then upload it here as your proof of concept.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function P4({ go, setUser }) {
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [name,setName]=useState(""); const [re,setRe]=useState("");
  const [loginOk,setLoginOk]=useState(false);
  const inp={width:"100%",background:"#0a0a0a",border:"1px solid "+GOLDDIM,padding:"10px 12px",color:WHITE,fontSize:14,marginBottom:10,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif"};
  const login=()=>{
    if(email==="woolleya129@gmail.com"&&pass==="Mangler1970!!"){
      setLoginOk(true);setTimeout(()=>{setUser({name:"Amanda",plan:"Studio",isAdmin:true});go(5);},800);
    } else if(email==="studio@mandastrong.com"&&pass==="Studio2026!"){
      setLoginOk(true);setTimeout(()=>{setUser({name:"Studio User",plan:"Studio",isAdmin:true});go(5);},800);
    } else if(email.includes("@")&&pass.length>0){
      setLoginOk(true);setTimeout(()=>{setUser({name:email.split("@")[0]||"Creator",plan:"Creator",isAdmin:false});go(5);},800);
    } else {alert("Please enter a valid email and password.");}
  };
  return (
    <div style={{...Sp,padding:40}}>
      <div style={{maxWidth:1000,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
          <div style={{background:"#050500",border:"2px solid "+GOLD,padding:"14px 48px",textAlign:"center",boxShadow:"0 0 24px "+GOLD+"33"}}>
            <div style={{color:GOLDDIM,fontSize:10,letterSpacing:4,fontWeight:700,marginBottom:4}}>LIVE SUBSCRIBERS</div>
            <div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:42,fontWeight:900,lineHeight:1,textShadow:"0 0 20px "+GOLD+"99"}}>0</div>
            <div style={{color:"#22c55e",fontSize:9,letterSpacing:3,marginTop:4}}>● GROWING</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:18,marginBottom:36}}>
          <div style={{...Card()}}>
            <div style={{fontSize:11,color:GOLD,letterSpacing:3,marginBottom:8,fontWeight:700}}>EXISTING USER</div>
            <h2 style={{...H1,fontSize:18,marginBottom:18}}>SIGN IN</h2>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" style={inp}/>
            <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="Password" style={{...inp,marginBottom:16}}/>
            {loginOk&&<div style={{background:"#061406",border:"1px solid #22c55e",padding:"10px",textAlign:"center",marginBottom:8}}>
              <span style={{color:"#22c55e",fontWeight:900,fontSize:14,letterSpacing:2}}>✓ LOGIN SUCCESSFUL</span>
            </div>}
            <button onClick={login} style={{...G("gold",false),width:"100%",padding:"12px"}}>{loginOk?"✓ ENTERING STUDIO...":"SIGN IN TO STUDIO"}</button>
          </div>
          <div style={{...Card(),border:"2px solid #22c55e",position:"relative"}}>
            <div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"#22c55e",color:"#000",padding:"3px 14px",fontSize:11,fontWeight:900,whiteSpace:"nowrap"}}>🎉 7-DAY FREE TRIAL</div>
            <div style={{fontSize:11,color:GOLD,letterSpacing:3,marginBottom:8,marginTop:10,fontWeight:700}}>NEW CREATOR</div>
            <h2 style={{...H1,fontSize:18,marginBottom:18}}>CREATE ACCOUNT</h2>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your Name" style={inp}/>
            <input value={re} onChange={e=>setRe(e.target.value)} placeholder="Email address" style={{...inp,marginBottom:16}}/>
            <button onClick={()=>{setUser({name:name||"Creator",plan:"Studio Trial",isAdmin:false});window.open(STRIPE.studio,"_blank");go(5);}}
              style={{width:"100%",padding:"12px",background:"#22c55e",border:"none",color:"#000",fontWeight:900,fontSize:13,cursor:"pointer",letterSpacing:2}}>START FREE TRIAL — $0</button>
          </div>
          <div style={{...Card(),textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10}}>👁</div>
            <h2 style={{...H1,fontSize:16,marginBottom:10}}>EXPLORE FIRST</h2>
            <p style={{color:WHITE,fontSize:14,lineHeight:1.7,marginBottom:20}}>Browse 600+ AI tools before committing. No account required.</p>
            <button onClick={()=>{setUser({name:"Guest",plan:"Guest",isAdmin:false});go(5);}} style={{...G("out",false),width:"100%"}}>BROWSE AS GUEST</button>
          </div>
        </div>
        <div style={{textAlign:"center",marginBottom:24,display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>{try{const m=JSON.parse(localStorage.getItem("ms_medialib")||"[]");const t=JSON.parse(localStorage.getItem("ms_timeline")||"{}");const u=JSON.parse(localStorage.getItem("ms_user")||"{}");const p=JSON.parse(localStorage.getItem("ms_page")||"5");if(m.length>0||Object.keys(t).length>0){if(u&&u.name)setUser(u);go(p);}else{alert("No saved project found.");}}catch(e){alert("Could not load project.");}}} style={{...G("gold",false),padding:"12px 32px"}}>📂 OPEN PROJECT</button>
          <button onClick={()=>{setUser({name:"Creator",plan:"Guest",isAdmin:false});go(5);}} style={{...G("out",false),padding:"12px 32px"}}>✦ NEW PROJECT</button>
        </div>
        <h2 style={{...H1,fontSize:22,textAlign:"center",marginBottom:22}}>SUBSCRIPTION PLANS</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
          {[
            {t:"CREATOR PLAN",p:"20",link:STRIPE.basic,f:["HD Export 1080p","100 AI Tools","10GB Storage","Email Support"],pop:false,trial:false},
            {t:"PRO PLAN",p:"30",link:STRIPE.pro,f:["4K Export","300 AI Tools","100GB Storage","Priority Support","Commercial License"],pop:true,trial:false},
            {t:"STUDIO PLAN",p:"50",link:STRIPE.studio,f:["8K Export","600+ AI Tools","1TB Storage","24/7 Support","Full Rights","API Access","7-Day Free Trial"],pop:false,trial:true},
          ].map(plan=>(
            <div key={plan.t} style={{...Card(),border:plan.pop?"2px solid "+GOLD:"1px solid "+GOLDDIM,position:"relative"}}>
              {plan.pop&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:GOLD,color:"#000",padding:"2px 12px",fontSize:11,fontWeight:900,whiteSpace:"nowrap"}}>MOST POPULAR</div>}
              {plan.trial&&<div style={{position:"absolute",top:-11,right:12,background:"#22c55e",color:"#000",padding:"2px 10px",fontSize:11,fontWeight:900}}>🎉 FREE TRIAL</div>}
              <div style={{color:WHITE,fontSize:11,letterSpacing:3,fontWeight:700}}>{plan.t}</div>
              <div style={{color:GOLD,fontFamily:"'Cinzel',serif",fontSize:34,fontWeight:900,margin:"8px 0"}}>{plan.p}<span style={{fontSize:12,color:WHITE}}>/mo</span></div>
              <div style={{margin:"12px 0"}}>{plan.f.map(f=><div key={f} style={{color:WHITE,fontSize:13,padding:"3px 0",borderBottom:"1px solid #0a0a0a"}}>✓ {f}</div>)}</div>
              <button onClick={()=>window.open(plan.link,"_blank")} style={{...G(plan.trial?"out":"gold",false),width:"100%"}}>{plan.trial?"START FREE TRIAL":"SUBSCRIBE NOW"}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function P11({ mediaLib, setMediaLib }) {
  const fileRef = useRef(null);
  const onFiles = files => {
    if(!files)return;
    const n=Array.from(files).map(f=>({id:Date.now()+Math.random(),name:f.name,type:f.type,file:f,url:URL.createObjectURL(f)}));
    setMediaLib(p=>[...p,...n]);
  };
  return (
    <div style={{...Sp,padding:40}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{fontSize:12,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>ASSET INGESTION</div>
        <h1 style={{...H1,fontSize:28,marginBottom:4}}>UPLOAD MEDIA</h1>
        <div style={{color:WHITE,fontSize:14,marginBottom:20,fontWeight:700,letterSpacing:1}}>{mediaLib.length} ASSETS IN LIBRARY</div>
        <div onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=GOLD;}}
          onDragLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM;}}
          onDrop={e=>{e.preventDefault();onFiles(e.dataTransfer.files);e.currentTarget.style.borderColor=GOLDDIM;}}
          style={{border:"2px dashed "+GOLDDIM,padding:"30px 40px",textAlign:"center",marginBottom:12}}>
          <div style={{fontSize:36,marginBottom:10}}>🎬</div>
          <div style={{color:WHITE,fontWeight:900,fontSize:16,letterSpacing:3,marginBottom:16}}>DRAG & DROP YOUR MEDIA HERE</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,maxWidth:360,margin:"0 auto"}}>
            <button onClick={()=>{const i=document.createElement("input");i.type="file";i.accept="image/*";i.multiple=true;i.onchange=e=>onFiles(e.target.files);i.click();}}
              style={{background:"linear-gradient(135deg,#1a0800,#2a1200)",border:"2px solid "+GOLD,color:GOLD,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>
              📷 UPLOAD PHOTOS
            </button>
            <button onClick={()=>fileRef.current&&fileRef.current.click()}
              style={{background:"#0a0a0a",border:"2px solid "+GOLDDIM,color:WHITE,padding:"14px",cursor:"pointer",fontSize:13,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>
              📁 UPLOAD FILES
            </button>
          </div>
        </div>
        {mediaLib.length>0&&(
          <div>
            <h3 style={{color:GOLD,fontWeight:900,fontSize:13,letterSpacing:3,marginBottom:10}}>MEDIA LIBRARY ({mediaLib.length})</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
              {mediaLib.map(a=>(
                <div key={a.id} style={{...Card(),padding:8,position:"relative"}}>
                  {a.type.startsWith("video")?<video src={a.url} style={{width:"100%",marginBottom:5}}/>:
                   a.type.startsWith("image")?<img src={a.url} style={{width:"100%",marginBottom:5}} alt={a.name}/>:
                   <div style={{height:60,background:"#000",marginBottom:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🎵</div>}
                  <div style={{color:WHITE,fontSize:11,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div>
                  <button onClick={()=>setMediaLib(p=>p.filter(x=>x.id!==a.id))}
                    style={{position:"absolute",top:5,right:5,background:"#7f1d1d",border:"none",color:"#ef4444",width:16,height:16,cursor:"pointer",fontSize:9,padding:0}}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" multiple accept="video/*,audio/*,image/*" onChange={e=>onFiles(e.target.files)} style={{display:"none"}}/>
      </div>
    </div>
  );
}

function P12({ go, mediaLib }) {
  return (
    <div style={{...Sp,padding:40}}>
      <div style={{maxWidth:880,margin:"0 auto"}}>
        <div style={{fontSize:12,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>PRODUCTION HUB</div>
        <h1 style={{...H1,fontSize:28,marginBottom:4}}>EDITOR SUITE</h1>
        <div style={{color:WHITE,fontSize:14,marginBottom:20,fontWeight:600}}>Your complete post-production workspace.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
          {[{ic:"🗂",t:"MEDIA LIBRARY",d:mediaLib.length+" assets",p:11},{ic:"⏱",t:"TIMELINE EDITOR",d:"Multi-track editing",p:13},{ic:"✨",t:"ENHANCEMENT STUDIO",d:"90+ AI tools",p:14},{ic:"🎵",t:"AUDIO MIXER",d:"4-channel mixing",p:15},{ic:"⚡",t:"RENDER ENGINE",d:"Up to 8K output",p:16},{ic:"▶",t:"PREVIEW PLAYER",d:"Full-screen playback",p:17}].map(c=>(
            <button key={c.t} onClick={()=>go(c.p)}
              style={{...Card(),textAlign:"left",cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM;}}>
              <div style={{fontSize:28,marginBottom:8}}>{c.ic}</div>
              <div style={{color:GOLD,fontWeight:900,fontSize:13,letterSpacing:2}}>{c.t}</div>
              <div style={{color:WHITE,fontSize:12,marginTop:4}}>{c.d}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function P13({ go, mediaLib, timeline, setTimeline, user, filmDuration, setFilmDuration }) {
  const [tracks,setTracks]=useState(["VIDEO TRACK","AUDIO TRACK","TEXT / TITLES"]);
  const addToTrack=(idx,asset)=>setTimeline(p=>({...p,[idx]:[...(p[idx]||[]),asset]}));
  return (
    <div style={{...Sp,padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700}}>EDITING WORKSPACE</div>
          <h1 style={{...H1,fontSize:24,margin:0}}>TIMELINE EDITOR</h1>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
            <span style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:2}}>FILM: {filmDuration||60} MIN</span>
            <input type="range" min={0} max={180} step={30} value={filmDuration||60} onChange={e=>setFilmDuration(+e.target.value)} style={{width:160,accentColor:GOLD}}/>
            <div style={{display:"flex",gap:4}}>
              {[60,90,180].map(m=><button key={m} onClick={()=>setFilmDuration(m)} style={{background:filmDuration===m?GOLD:"#111",border:"1px solid "+(filmDuration===m?"#000":GOLDDIM),color:filmDuration===m?"#000":WHITE,padding:"2px 8px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>{m}m</button>)}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setTracks(p=>[...p,"TRACK "+p.length+1])} style={{...G("out",true)}}>+ ADD TRACK</button>
          <button onClick={()=>{
            const videoAssets=mediaLib.filter(a=>a&&a.type&&(a.type.startsWith("video")||a.type.includes("webm")));
            const audioAssets=mediaLib.filter(a=>a&&a.type&&(a.type.startsWith("audio")||a.type==="audio/narration"));
            const newTl={};
            if(videoAssets.length>0)newTl[0]=videoAssets.map(a=>({...a,startTime:0,syncGroup:"master",synced:true}));
            if(audioAssets.length>0)newTl[1]=audioAssets.map(a=>({...a,startTime:0,syncGroup:"master",synced:true}));
            setTimeline(p=>{const merged={...p,...newTl};Object.keys(merged).forEach(k=>{merged[k]=(merged[k]||[]).map(a=>({...a,startTime:0,syncGroup:"master",synced:true}));});return merged;});
            alert("✓ All tracks synced — "+videoAssets.length+" video clips · "+audioAssets.length+" audio tracks");
          }} style={{background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",padding:"5px 14px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>⚡ SYNC ALL TRACKS</button>
          <button onClick={()=>go(16)} style={{...G("gold",false)}}>→ RENDER</button>
          <button onClick={()=>setTimeline({})} style={{...G("out",true)}}>CLEAR ALL</button>
        </div>
      </div>
      <div style={{background:"#000",height:100,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,border:"1px solid "+GOLDDIM}}>
        {mediaLib[0]&&mediaLib[0].type.startsWith("video")?
          <video src={mediaLib[0].url} style={{height:"100%",width:"100%",objectFit:"cover",opacity:.5}}/>:
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:12,letterSpacing:3,color:WHITE,marginBottom:8}}>ADD MEDIA TO SEE PREVIEW</div>
            <button onClick={()=>go(11)} style={{...G("out",true)}}>⬆ UPLOAD MEDIA</button>
          </div>}
      </div>
      {tracks.map((tr,idx)=>(
        <div key={idx} style={{marginBottom:8}}>
          <div style={{color:GOLD,fontSize:11,letterSpacing:3,marginBottom:4,fontWeight:900}}>{tr}</div>
          <div onDragOver={e=>e.preventDefault()}
            onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("assetId");const a=mediaLib.find(x=>String(x.id)===id);if(a)addToTrack(idx,a);}}
            style={{background:"#0a0a0a",border:"1px dashed "+GOLDDIM,minHeight:42,padding:6,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            {(timeline[idx]||[]).map((a,i)=>(
              <div key={i} style={{background:GOLDDIM,padding:"3px 10px",fontSize:12,color:"#000",fontWeight:900,display:"flex",alignItems:"center",gap:5}}>
                {a.name.slice(0,12)}
                <button onClick={()=>setTimeline(p=>({...p,[idx]:p[idx].filter((_,j)=>j!==i)}))}
                  style={{background:"none",border:"none",color:"#000",cursor:"pointer",fontSize:11,padding:0}}>✕</button>
              </div>
            ))}
            {!(timeline[idx]||[]).length&&<span style={{color:WHITE,fontSize:12,letterSpacing:1}}>DROP {tr} CLIPS HERE</span>}
          </div>
        </div>
      ))}
      {mediaLib.length>0&&(
        <div style={{marginTop:12}}>
          <div style={{color:GOLD,fontSize:11,letterSpacing:3,marginBottom:6,fontWeight:900}}>DRAG TO TIMELINE:</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {mediaLib.map(a=>(
              <div key={a.id} draggable onDragStart={e=>e.dataTransfer.setData("assetId",String(a.id))}
                style={{background:"#0a0a0a",border:"1px solid "+GOLD,padding:"4px 10px",cursor:"grab",color:GOLD,fontSize:12,fontWeight:700}}>
                📎 {a.name.slice(0,14)}
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{...Card(),marginTop:12,display:"flex",alignItems:"center",gap:8}}>
        {["⏮","⏪","▶","⏩","⏭"].map(c=><button key={c} style={{...G("out",true)}}>{c}</button>)}
        <div style={{flex:1,height:3,background:"#000"}}/>
        <span style={{color:WHITE,fontSize:12,fontWeight:700}}>00:00 / 90:00</span>
      </div>
    </div>
  );
}

function P14() {
  const tools14=MOTION.slice(0,14);
  const [active,setActive]=useState(tools14[0]);
  const [vals,setVals]=useState({Intensity:75,Clarity:80,Color:70,Brightness:65});
  return (
    <div style={{...Sp,display:"flex"}}>
      <div style={{width:176,background:"#050505",borderRight:"1px solid "+GOLDDIM+"",overflowY:"auto",padding:8}}>
        {tools14.map(t=>(
          <button key={t} onClick={()=>setActive(t)}
            style={{width:"100%",textAlign:"left",background:t===active?BG4:"none",border:"none",color:t===active?GOLD:WHITE,padding:"8px 10px",cursor:"pointer",fontSize:12,fontWeight:t===active?900:600,marginBottom:1,borderLeft:t===active?"2px solid "+GOLD:"2px solid transparent"}}>
            {t}
          </button>
        ))}
      </div>
      <div style={{flex:1,padding:28}}>
        <div style={{fontSize:11,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>ENHANCEMENT STUDIO</div>
        <h2 style={{...H1,fontSize:22,marginBottom:6}}>{active.toUpperCase()}</h2>
        {Object.entries(vals).map(([k,v])=>(
          <div key={k} style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{color:WHITE,fontSize:13,fontWeight:700}}>{k}</span>
              <span style={{color:GOLD,fontSize:13,fontWeight:900}}>{v}%</span>
            </div>
            <input type="range" min={0} max={100} value={v} onChange={e=>setVals(p=>({...p,[k]:+e.target.value}))} style={{width:"100%",accentColor:GOLD}}/>
          </div>
        ))}
        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button style={{...G("gold",false)}}>APPLY ENHANCEMENT</button>
          <button onClick={()=>setVals({Intensity:75,Clarity:80,Color:70,Brightness:65})} style={{...G("out",false)}}>RESET</button>
        </div>
      </div>
    </div>
  );
}

function P15() {
  const [lvl,setLvl]=useState({VOICE:85,MUSIC:40,EFX:50,MASTER:85});
  return (
    <div style={{...Sp,padding:40}}>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <div style={{fontSize:11,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>MIXING CONSOLE</div>
        <h1 style={{...H1,fontSize:28,marginBottom:24}}>AUDIO MIXER</h1>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
          {Object.entries(lvl).map(([ch,val])=>(
            <div key={ch} style={{...Card(),textAlign:"center",padding:18}}>
              <div style={{color:GOLD,fontSize:11,letterSpacing:3,marginBottom:8,fontWeight:900}}>{ch}</div>
              <div style={{color:GOLD,fontFamily:"'Cinzel',serif",fontSize:30,fontWeight:900,marginBottom:12}}>{val}</div>
              <input type="range" min={0} max={100} value={val} onChange={e=>setLvl(p=>({...p,[ch]:+e.target.value}))} style={{width:"100%",height:100,accentColor:GOLD}}/>
              <div style={{height:3,background:"#000",marginTop:10}}>
                <div style={{width:val+"%",height:"100%",background:"linear-gradient(90deg,"+GOLDDIM+","+GOLD+")"}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setLvl({VOICE:85,MUSIC:40,EFX:50,MASTER:85})} style={{...G("out",false)}}>RESET LEVELS</button>
          <button style={{...G("gold",false)}}>SAVE PRESET</button>
        </div>
      </div>
    </div>
  );
}


function P16({ mediaLib, timeline, setTimeline, filmDuration }) {
  const canvasRef=useRef(null);
  const [rendering,setRendering]=useState(false);
  const [progress,setProgress]=useState(0);
  const [log,setLog]=useState([]);
  const [outputUrl,setOutputUrl]=useState("");
  const [outputSize,setOutputSize]=useState("");
  const [resolution,setResolution]=useState("1920x1080");
  const [fps,setFps]=useState(24);
  const [grain,setGrain]=useState(true);
  const [letterbox,setLetterbox]=useState(true);
  const [vignette,setVignette]=useState(true);
  const [colorGrade,setColorGrade]=useState("teal-orange");
  const [aborted,setAborted]=useState(false);
  const abortRef=useRef(false);
  const addLog=msg=>setLog(p=>[...p,msg]);

  const clips=[...mediaLib.filter(a=>a&&a.type&&(a.type.startsWith("video")||a.type.includes("webm")))];
  const audioClips=[...mediaLib.filter(a=>a&&a.type&&(a.type.startsWith("audio")||a.type==="audio/narration"))];

  const startRender=async()=>{
    if(clips.length===0){alert("No video clips in your media library. Generate scenes on Page 8 first.");return;}
    setRendering(true);setProgress(0);setLog([]);setOutputUrl("");abortRef.current=false;setAborted(false);
    addLog("MandaStrong Render Engine — initialising...");
    const [W,H]=resolution==="3840x2160"?[3840,2160]:resolution==="2560x1440"?[2560,1440]:[1920,1080];
    const canvas=canvasRef.current;
    canvas.width=W;canvas.height=H;
    const ctx=canvas.getContext("2d");
    addLog("Canvas: "+W+"x"+H+" · "+fps+"fps · "+clips.length+" clip(s)");
    setProgress(5);

    const loadedClips=[];
    for(let i=0;i<clips.length;i++){
      if(abortRef.current)break;
      addLog("Loading clip "+(i+1)+"/"+clips.length+": "+clips[i].name);
      try{
        let blobUrl=clips[i].url;
        if(clips[i].dbId){
          try{
            const stored=await loadClipFromDB(clips[i].dbId);
            if(stored){blobUrl=URL.createObjectURL(stored.blob);addLog("  ✓ Loaded from storage");}
          }catch(e){addLog("  Using direct URL");}
        }
        const vid=document.createElement("video");
        vid.src=blobUrl;vid.muted=true;vid.playsInline=true;vid.preload="auto";
        await new Promise((res,rej)=>{
          vid.onloadedmetadata=()=>res(null);
          vid.onerror=()=>rej(new Error("Load failed"));
          vid.load();
          setTimeout(()=>res(null),3000);
        });
        loadedClips.push({...clips[i],vid,duration:vid.duration||10,url:blobUrl});
        addLog("  ✓ "+Math.round(vid.duration||10)+"s");
      }catch(e){addLog("  ! Could not load — skipping: "+e.message);}
      setProgress(5+Math.round((i+1)/clips.length*20));
    }
    if(loadedClips.length===0){addLog("No clips loaded. Render aborted.");setRendering(false);return;}
    addLog("✓ "+loadedClips.length+" clip(s) ready");
    setProgress(26);

    const grades={"teal-orange":{r:20,g:15,b:35,a:0.1},"golden":{r:40,g:22,b:0,a:0.1},"noir":{r:0,g:0,b:0,a:0.18},"natural":{r:8,g:8,b:0,a:0.04},"cool":{r:0,g:12,b:32,a:0.09}};
    const grade=grades[colorGrade]||grades["teal-orange"];

    const postProcess=(ctx,W,H)=>{
      ctx.globalCompositeOperation="multiply";
      ctx.fillStyle="rgba("+grade.r+","+grade.g+","+grade.b+","+grade.a+")";
      ctx.globalAlpha=1;ctx.fillRect(0,0,W,H);
      ctx.globalCompositeOperation="source-over";
      if(vignette){
        const vig=ctx.createRadialGradient(W/2,H/2,W*0.08,W/2,H/2,W*0.82);
        vig.addColorStop(0,"rgba(0,0,0,0)");vig.addColorStop(1,"rgba(0,0,0,0.82)");
        ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
      }
      if(letterbox){
        ctx.fillStyle="#000";
        ctx.fillRect(0,0,W,Math.round(H*0.072));
        ctx.fillRect(0,Math.round(H*0.928),W,Math.round(H*0.072));
      }
      if(grain){
        for(let g=0;g<50;g++){
          const gv=Math.random()>0.5?180:20;
          ctx.fillStyle="rgba("+gv+","+gv+","+gv+",0.012)";
          ctx.fillRect(Math.random()*W,Math.random()*H,1.5,1.5);
        }
      }
    };

    const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";
    const stream=canvas.captureStream(fps);
    const recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:W>=3840?50000000:W>=2560?28000000:18000000});
    const chunks=[];
    recorder.ondataavailable=e=>{if(e.data&&e.data.size>0)chunks.push(e.data);};
    recorder.start(Math.round(1000/fps));
    addLog("Recording started...");
    setProgress(28);

    let totalRendered=0;
    for(let ci=0;ci<loadedClips.length;ci++){
      if(abortRef.current)break;
      const clip=loadedClips[ci];
      addLog("Rendering clip "+(ci+1)+"/"+loadedClips.length+": "+clip.name);
      const clipDur=Math.min(clip.duration||10,300);
      const totalFrames=Math.round(clipDur*fps);
      const msPerFrame=Math.round(1000/fps);
      const vid=clip.vid;
      vid.currentTime=0;
      await new Promise(r=>setTimeout(r,200));
      await new Promise(resolve=>{
        let frame=0;
        const startTime=performance.now();
        const renderFrame=async()=>{
          if(abortRef.current||frame>=totalFrames){resolve(null);return;}
          const t=frame/totalFrames;
          const sec=frame/fps;
          const targetTime=sec;
          vid.currentTime=targetTime;
          await new Promise(r=>setTimeout(r,Math.max(2,msPerFrame-10)));
          try{
            ctx.clearRect(0,0,W,H);
            ctx.drawImage(vid,0,0,W,H);
            postProcess(ctx,W,H);
            if(t<0.04){ctx.fillStyle="rgba(0,0,0,"+(1-t/0.04)+")";ctx.fillRect(0,0,W,H);}
            if(t>0.93){ctx.fillStyle="rgba(0,0,0,"+((t-0.93)/0.07)+")";ctx.fillRect(0,0,W,H);}
          }catch(e){ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);}
          frame++;totalRendered++;
          const overall=28+Math.round((totalRendered/(loadedClips.reduce((a,c)=>a+Math.round((c.duration||10)*fps),0)))*68);
          setProgress(Math.min(96,overall));
          if(frame%fps===0)addLog("  "+Math.round(sec)+"s / "+Math.round(clipDur)+"s");
          const nextTime=startTime+(frame*msPerFrame);
          setTimeout(renderFrame,Math.max(4,nextTime-performance.now()));
        };
        renderFrame();
      });
      if(!abortRef.current)addLog("  ✓ Clip "+(ci+1)+" complete");
    }

    if(abortRef.current){recorder.stop();setRendering(false);setAborted(true);addLog("Render aborted by user.");return;}

    ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);
    ctx.fillStyle=GOLD;ctx.font="900 "+(W*0.028)+"px Arial Black";
    ctx.textAlign="center";ctx.shadowColor=GOLD;ctx.shadowBlur=40;
    ctx.fillText("MANDASTRONG STUDIO",W/2,H*0.48);
    ctx.shadowBlur=0;ctx.fillStyle="#a07820";ctx.font="400 "+(W*0.012)+"px Arial";
    ctx.fillText("CINEMA INTELLIGENCE PLATFORM",W/2,H*0.54);
    for(let f=0;f<fps*2;f++){
      await new Promise(r=>setTimeout(r,Math.round(1000/fps)));
    }
    setProgress(98);addLog("Finalising export...");
    await new Promise(r=>setTimeout(r,600));
    recorder.stop();
    await new Promise(r=>{recorder.onstop=r;});
    const blob=new Blob(chunks,{type:mimeType});
    const url=URL.createObjectURL(blob);
    setOutputUrl(url);
    const mb=(blob.size/1024/1024).toFixed(1);
    setOutputSize(mb+"MB");
    setProgress(100);
    addLog("✓ RENDER COMPLETE — "+mb+"MB · "+resolution+" · "+fps+"fps · "+loadedClips.length+" clips merged");
    setRendering(false);
  };

  const abort=()=>{abortRef.current=true;addLog("Aborting...");};

  const GRADES=[["teal-orange","Teal/Orange"],["golden","Golden"],["noir","Noir B&W"],["natural","Natural"],["cool","Cool Blue"]];
  const RESOLUTIONS=[["1920x1080","1080p HD"],["2560x1440","1440p QHD"],["3840x2160","4K UHD"]];

  return(
    <div style={{...Sp,padding:20}}>
      <canvas ref={canvasRef} style={{display:"none"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700}}>POST-PRODUCTION</div>
          <h1 style={{...H1,fontSize:24,margin:0}}>RENDER ENGINE</h1>
          <div style={{color:WHITE,fontSize:12,marginTop:2}}>{clips.length} video clips · {audioClips.length} audio tracks · {mediaLib.length} total assets</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {rendering?<button onClick={abort} style={{background:"#7f1d1d",border:"1px solid #ef4444",color:"#ef4444",padding:"8px 20px",cursor:"pointer",fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",fontSize:12}}>⏹ ABORT</button>:
          <button onClick={startRender} disabled={clips.length===0} style={{...G("gold",false),opacity:clips.length===0?0.5:1,padding:"10px 24px"}}>🎬 START RENDER</button>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:16}}>
        <div>
          <div style={{...Card(),marginBottom:12}}>
            <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:12}}>RENDER SETTINGS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div style={{color:GOLDDIM,fontSize:10,letterSpacing:2,marginBottom:4}}>RESOLUTION</div>
                <select value={resolution} onChange={e=>setResolution(e.target.value)} style={{width:"100%",background:"#0a0800",border:"1px solid "+GOLDDIM,color:WHITE,padding:"8px 10px",fontSize:12,outline:"none",fontFamily:"'Rajdhani',sans-serif"}}>
                  {RESOLUTIONS.map(([v,l])=><option key={v} value={v} style={{background:"#000"}}>{l} ({v})</option>)}
                </select>
              </div>
              <div>
                <div style={{color:GOLDDIM,fontSize:10,letterSpacing:2,marginBottom:4}}>FRAME RATE</div>
                <select value={fps} onChange={e=>setFps(+e.target.value)} style={{width:"100%",background:"#0a0800",border:"1px solid "+GOLDDIM,color:WHITE,padding:"8px 10px",fontSize:12,outline:"none",fontFamily:"'Rajdhani',sans-serif"}}>
                  {[24,25,30,60].map(f=><option key={f} value={f} style={{background:"#000"}}>{f}fps {f===24?"(Cinema)":f===30?"(TV)":f===60?"(HFR)":""}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div style={{color:GOLDDIM,fontSize:10,letterSpacing:2,marginBottom:6}}>COLOUR GRADE</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {GRADES.map(([v,l])=><button key={v} onClick={()=>setColorGrade(v)} style={{background:colorGrade===v?GOLD:"#0a0800",border:"1px solid "+(colorGrade===v?"#000":GOLDDIM),color:colorGrade===v?"#000":WHITE,padding:"4px 12px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>{l}</button>)}
              </div>
            </div>
            <div style={{display:"flex",gap:16,marginTop:12}}>
              {[["Film Grain",grain,setGrain],["Letterbox",letterbox,setLetterbox],["Vignette",vignette,setVignette]].map(([l,v,s])=>(
                <label key={l} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
                  <input type="checkbox" checked={v} onChange={e=>s(e.target.checked)} style={{accentColor:GOLD}}/>
                  <span style={{color:v?GOLD:WHITE,fontSize:11,fontWeight:v?900:600,letterSpacing:1}}>{l}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{...Card()}}>
            <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:8}}>CLIP SEQUENCE ({clips.length})</div>
            {clips.length===0?(
              <div style={{color:GOLDDIM,fontSize:12,lineHeight:2,padding:"8px 0"}}>No video clips yet. Go to Page 8 to generate scenes, then they appear here automatically.</div>
            ):(
              clips.map((c,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid #0a0a0a"}}>
                  <div style={{color:GOLD,fontSize:11,fontWeight:900,width:24}}>#{i+1}</div>
                  <div style={{flex:1,color:WHITE,fontSize:12}}>{c.name}</div>
                  <div style={{color:GOLDDIM,fontSize:11}}>{c.type}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <div style={{background:"#000",border:"1px solid "+GOLDDIM,aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,overflow:"hidden"}}>
            {outputUrl?(
              <video src={outputUrl} controls autoPlay loop playsInline style={{width:"100%",height:"100%",objectFit:"contain"}}/>
            ):(
              <div style={{textAlign:"center",padding:16}}>
                <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:8}}>RENDER OUTPUT</div>
                <div style={{color:GOLDDIM,fontSize:10,lineHeight:2}}>Configure settings<br/>then hit Start Render</div>
              </div>
            )}
          </div>
          {rendering&&(
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{color:GOLD,fontSize:11,fontWeight:900,letterSpacing:2}}>RENDERING</span>
                <span style={{color:GOLD,fontSize:11,fontWeight:900}}>{progress}%</span>
              </div>
              <div style={{height:6,background:"#0a0a0a",border:"1px solid "+GOLDDIM}}>
                <div style={{height:"100%",width:progress+"%",background:"linear-gradient(90deg,#a07820,"+GOLD+")",transition:"width .3s"}}/>
              </div>
            </div>
          )}
          {outputUrl&&!rendering&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              <a href={outputUrl} download={"mandastrong_render_"+resolution+".webm"}
                style={{background:"linear-gradient(135deg,#a07820,"+GOLD+")",border:"none",color:"#000",padding:"10px",fontSize:11,textDecoration:"none",textAlign:"center",fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",display:"block"}}>⬇ DOWNLOAD</a>
              <button onClick={()=>{setOutputUrl("");setLog([]);setProgress(0);}}
                style={{background:"transparent",border:"1px solid "+GOLD,color:GOLD,padding:"10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>↺ NEW RENDER</button>
            </div>
          )}
          <div style={{background:"#050505",border:"1px solid "+GOLDDIM,padding:12,maxHeight:260,overflowY:"auto"}}>
            <div style={{color:GOLD,fontSize:10,letterSpacing:3,fontWeight:900,marginBottom:8}}>RENDER LOG</div>
            {log.length===0?<div style={{color:GOLDDIM,fontSize:11}}>Log will appear here during render.</div>:
            log.map((l,i)=>(
              <div key={i} style={{color:i===log.length-1?"#22c55e":GOLDDIM,fontSize:11,lineHeight:2,letterSpacing:1}}>
                {i===log.length-1?"▶ ":"  "}{l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function P17({ mediaLib }) {
  const [current,setCurrent]=useState(0);
  const videoClips=mediaLib.filter(a=>a&&a.type&&(a.type.startsWith("video")||a.type.includes("webm")));
  return(
    <div style={{...Sp,background:"#000",display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <div style={{padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid "+GOLDDIM+""}}>
        <div>
          <div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700}}>PREVIEW PLAYER</div>
          <h1 style={{...H1,fontSize:20,margin:0}}>FILM PREVIEW</h1>
        </div>
        <div style={{color:GOLDDIM,fontSize:11}}>{videoClips.length} CLIPS IN LIBRARY</div>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        {videoClips.length>0?(
          <div style={{width:"100%",maxWidth:1280}}>
            <video src={videoClips[current]?.url} controls autoPlay style={{width:"100%",background:"#000",display:"block"}}/>
            <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
              {videoClips.map((c,i)=>(
                <button key={i} onClick={()=>setCurrent(i)}
                  style={{background:i===current?GOLD:"#0a0a0a",border:"1px solid "+(i===current?"#000":GOLDDIM),color:i===current?"#000":WHITE,padding:"5px 14px",cursor:"pointer",fontSize:11,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>
                  {c.name.slice(0,18)}
                </button>
              ))}
            </div>
          </div>
        ):(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>🎬</div>
            <div style={{color:GOLD,fontSize:12,letterSpacing:3,fontWeight:900}}>NO CLIPS YET</div>
            <div style={{color:GOLDDIM,fontSize:11,marginTop:6}}>Generate scenes on Page 8, then preview them here.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function P18({ mediaLib }) {
  const videoClips=mediaLib.filter(a=>a&&a.type&&(a.type.startsWith("video")||a.type.includes("webm")));
  const [platform,setPlatform]=useState("");
  const PLATFORMS=[{id:"youtube",label:"▶ YouTube",aspect:"16:9",res:"4K"},{id:"tiktok",label:"⊕ TikTok",aspect:"9:16",res:"1080p"},{id:"instagram",label:"◈ Instagram",aspect:"1:1",res:"1080p"},{id:"vimeo",label:"◆ Vimeo",aspect:"16:9",res:"4K"},{id:"twitter",label:"⊞ X / Twitter",aspect:"16:9",res:"1080p"},{id:"film",label:"🎬 Film Festival",aspect:"2.39:1",res:"4K"}];
  return(
    <div style={{...Sp,padding:40}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        <div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700,marginBottom:4}}>DISTRIBUTION</div>
        <h1 style={{...H1,fontSize:28,marginBottom:4}}>EXPORT & DISTRIBUTE</h1>
        <div style={{color:WHITE,fontSize:14,marginBottom:24}}>{videoClips.length} clip(s) ready for export.</div>
        <div style={{...Card(),marginBottom:16}}>
          <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:12}}>TARGET PLATFORM</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {PLATFORMS.map(p=>(
              <button key={p.id} onClick={()=>setPlatform(p.id)}
                style={{background:platform===p.id?GOLD:"#0a0a0a",border:"1px solid "+(platform===p.id?"#000":GOLDDIM),color:platform===p.id?"#000":WHITE,padding:"12px 8px",cursor:"pointer",fontSize:12,fontWeight:900,fontFamily:"'Rajdhani',sans-serif",lineHeight:1.5}}>
                {p.label}<br/><span style={{fontSize:9,opacity:0.8}}>{p.aspect} · {p.res}</span>
              </button>
            ))}
          </div>
        </div>
        {videoClips.length>0&&(
          <div style={{...Card(),marginBottom:16}}>
            <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:10}}>EXPORT CLIPS ({videoClips.length})</div>
            {videoClips.map((c,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #0a0a0a"}}>
                <div style={{color:WHITE,fontSize:12}}>{c.name}</div>
                <a href={c.url} download={c.name}
                  style={{background:"transparent",border:"1px solid "+GOLD,color:GOLD,padding:"4px 14px",fontSize:11,textDecoration:"none",fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>⬇ DOWNLOAD</a>
              </div>
            ))}
          </div>
        )}
        <button style={{...G("gold",false),width:"100%",padding:"14px"}} onClick={()=>{
          if(videoClips.length===0){alert("No clips to export.");}
          else{alert("Exporting "+videoClips.length+" clip(s) for "+( platform||"general")+" distribution.");}
        }}>EXPORT ALL CLIPS</button>
      </div>
    </div>
  );
}

function P19() {
  const [active,setActive]=useState(0);
  const tutorials=[
    {title:"Getting Started",emoji:"🚀",steps:["Login on Page 4","Browse the Studio Dashboard on Page 2","Start your first project on Page 5"]},
    {title:"Writing Your Script",emoji:"✍",steps:["Go to Page 5 — Script to Movie","Type or paste your script","Use AI to expand, edit, or generate scenes","Save your script to the Media Library"]},
    {title:"Generating Video",emoji:"🎬",steps:["Go to Page 8 — Video Generator","Upload reference photos (optional)","Describe your scene in detail","Hit Generate — Reality Engine renders it","Save to your Media Library"]},
    {title:"Voice Narration",emoji:"🎙",steps:["Go to Page 6 — Voice Engine","Choose from 54 voice characters","Paste your narration script","Adjust Speed, Pitch, Pause, Volume","Click Prepare and Speak"]},
    {title:"Music Video Studio",emoji:"🎵",steps:["From Page 6 click Music Video Studio","Upload your reference photos","Set Ken Burns / candle / moonlight overlays","Mix music and voice levels","Export your music video"]},
    {title:"Timeline Editing",emoji:"⏱",steps:["Go to Page 13 — Timeline Editor","Drag clips to video and audio tracks","Use Sync All Tracks to align everything","Adjust film duration (60/90/180 min)","Click Render to proceed"]},
    {title:"Audio Mixing",emoji:"🎚",steps:["Go to Page 15 — Audio Mixer","Set VOICE level (recommended 85)","Set MUSIC level (recommended 40)","Set EFX level (recommended 50)","Set MASTER level (recommended 85)"]},
    {title:"Rendering Your Film",emoji:"⚡",steps:["Go to Page 16 — Render Engine","Choose resolution (1080p / 4K / 8K)","Select colour grade","Enable Film Grain, Letterbox, Vignette","Hit Start Render — download when complete"]},
    {title:"Exporting & Sharing",emoji:"📤",steps:["Go to Page 18 — Export & Distribute","Choose your target platform","Download individual clips or full render","Share to YouTube, Vimeo, TikTok, festivals"]},
    {title:"Doxy The School Bully",emoji:"🎭",steps:["Use Page 5 to paste the Master System Prompt","Generate each of the 20 scenes on Page 8","Assign voices on Page 6 (Doxy/Ethan/Lily)","Merge all scenes on Page 16 — Merge In Sequence","Export 4K MP4 — your 2-hour film is complete"]},
    {title:"AI For Humanity Documentary",emoji:"🌍",steps:["Use James voice (Speed 0.62, Pitch 0.86, Pause 1600ms)","Set Mood to Sarcastic","Paste each chapter narration on Page 6","Generate 13 scenes on Page 8","Render with Teal-Orange grade on Page 16"]},
    {title:"Music Video: If Only",emoji:"🌊",steps:["Upload ocean night reference photo on Page 8","Generate man on windowsill scene (face never shown)","Add guitar and candle to the composition","Render with Golden grade on Page 16","Mix with music track on Page 15"]},
  ];
  return(
    <div style={{...Sp,display:"flex",minHeight:"calc(100vh - 60px)"}}>
      <div style={{width:200,background:"#030303",borderRight:"1px solid "+GOLDDIM,padding:"12px 8px",overflowY:"auto",flexShrink:0}}>
        <div style={{color:GOLD,fontSize:10,letterSpacing:4,fontWeight:900,marginBottom:10,padding:"0 4px"}}>TUTORIALS</div>
        {tutorials.map((t,i)=>(
          <button key={i} onClick={()=>setActive(i)}
            style={{width:"100%",textAlign:"left",background:i===active?"#0a0800":"none",border:"none",color:i===active?GOLD:WHITE,padding:"9px 10px",cursor:"pointer",fontSize:11,fontWeight:i===active?900:600,marginBottom:2,borderLeft:i===active?"2px solid "+GOLD:"2px solid transparent",lineHeight:1.3}}>
            {t.emoji} {t.title}
          </button>
        ))}
      </div>
      <div style={{flex:1,padding:36,overflowY:"auto"}}>
        <div style={{fontSize:10,color:GOLD,letterSpacing:4,fontWeight:700,marginBottom:6}}>STEP-BY-STEP GUIDE</div>
        <h1 style={{...H1,fontSize:26,marginBottom:20}}>{tutorials[active].emoji} {tutorials[active].title.toUpperCase()}</h1>
        <div style={{maxWidth:540}}>
          {tutorials[active].steps.map((step,i)=>(
            <div key={i} style={{display:"flex",gap:14,marginBottom:18,alignItems:"flex-start"}}>
              <div style={{background:GOLD,color:"#000",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,flexShrink:0,fontFamily:"'Cinzel',serif"}}>{i+1}</div>
              <div style={{color:WHITE,fontSize:14,lineHeight:1.8,paddingTop:2}}>{step}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:32,background:"#0a0800",border:"1px solid "+GOLDDIM,padding:16}}>
          <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:6}}>PRO TIP</div>
          <div style={{color:WHITE,fontSize:13,lineHeight:1.8}}>Always save your work to the Media Library after each step. Your clips persist across browser sessions using IndexedDB storage — even after closing the tab.</div>
        </div>
      </div>
    </div>
  );
}

function P20() {
  return(
    <div style={{...Sp,padding:40}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        <div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700,marginBottom:4}}>LEGAL</div>
        <h1 style={{...H1,fontSize:28,marginBottom:20}}>TERMS & DISCLAIMER</h1>
        {[
          ["TERMS OF USE","By using MandaStrong Studio you agree to use this platform for lawful creative purposes only. You retain full rights to content you create. MandaStrong Studio grants you a non-exclusive licence to use the platform tools for personal and commercial film projects."],
          ["AI-GENERATED CONTENT","All AI-generated content is produced by Claude (Anthropic) via a secure server-side proxy. You are responsible for reviewing and approving all AI outputs before publishing or distributing. MandaStrong Studio is not liable for AI-generated content used outside the platform."],
          ["SUBSCRIPTION BILLING","Subscriptions are billed monthly via Stripe. You may cancel at any time. The Studio Plan includes a 7-day free trial. No refunds on partial months. All prices are in USD."],
          ["INTELLECTUAL PROPERTY","MandaStrong Studio, its branding, and platform architecture are the intellectual property of Amanda Woolley. Doxy The School Bully and AI For Humanity are registered creative works of Amanda Claire Woolley. All rights reserved."],
          ["PRIVACY","We collect only email and billing data via Stripe. No creative content is stored on our servers. All media is stored locally in your browser. We do not sell or share your data."],
          ["DISCLAIMER","MandaStrong Studio is provided as-is. We make no guarantees about uptime, AI output quality, or fitness for any specific purpose. Use at your own creative risk — which, honestly, is the only way to make anything great."],
        ].map(([h,b])=>(
          <div key={h} style={{marginBottom:24}}>
            <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:8}}>{h}</div>
            <div style={{color:WHITE,fontSize:13,lineHeight:1.9,borderLeft:"2px solid "+GOLDDIM,paddingLeft:14}}>{b}</div>
          </div>
        ))}
        <div style={{marginTop:28,padding:"14px 18px",background:"#0a0800",border:"1px solid "+GOLDDIM}}>
          <div style={{color:GOLD,fontWeight:900,fontSize:12,letterSpacing:2}}>© 2026 MANDASTRONG STUDIO — AMANDA WOOLLEY — ALL RIGHTS RESERVED</div>
        </div>
      </div>
    </div>
  );
}

function P21() {
  const [input,setInput]=useState("");
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Hello. I am Agent Grok — your cinema intelligence advisor. Ask me anything about your film, your script, your characters, your distribution strategy, or your production workflow. What are we making today?"}]);
  const [loading,setLoading]=useState(false);
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current&&bottomRef.current.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async()=>{
    if(!input.trim()||loading)return;
    const userMsg={role:"user",content:input.trim()};
    setMsgs(p=>[...p,userMsg]);setInput("");setLoading(true);
    try{
      const history=msgs.slice(-8).map(m=>({role:m.role,content:m.content}));
      const d=await proxyFetch({model:"claude-sonnet-4-20250514",max_tokens:1000,system:"You are Agent Grok, a sharp-witted cinema intelligence advisor for MandaStrong Studio. You have deep knowledge of filmmaking, screenwriting, distribution, AI tools, and post-production. You are direct, smart, and occasionally dry. You help the user build their film project. Keep answers concise and actionable.",messages:[...history,{role:"user",content:input.trim()}]});
      const reply=d&&d.content&&d.content[0]?d.content[0].text.trim():"I encountered an issue. Please try again.";
      setMsgs(p=>[...p,{role:"assistant",content:reply}]);
    }catch(e){setMsgs(p=>[...p,{role:"assistant",content:"Connection issue. Check your network and try again."}]);}
    setLoading(false);
  };
  return(
    <div style={{...Sp,display:"flex",flexDirection:"column",height:"calc(100vh - 60px)"}}>
      <div style={{padding:"12px 20px",borderBottom:"1px solid "+GOLDDIM+""}}>
        <div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700}}>AI FILM ADVISOR</div>
        <h1 style={{...H1,fontSize:22,margin:0}}>AGENT GROK</h1>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:14}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"72%",background:m.role==="user"?"linear-gradient(135deg,#1a0800,#2a1200)":"#0a0a0a",border:"1px solid "+(m.role==="user"?GOLD:GOLDDIM),padding:"12px 16px",lineHeight:1.8}}>
              {m.role==="assistant"&&<div style={{color:GOLD,fontSize:9,letterSpacing:3,fontWeight:900,marginBottom:5}}>AGENT GROK</div>}
              <div style={{color:WHITE,fontSize:13,whiteSpace:"pre-wrap"}}>{m.content}</div>
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,padding:"12px 16px"}}><div style={{color:GOLD,fontSize:9,letterSpacing:3,marginBottom:5}}>AGENT GROK</div><div style={{color:GOLDDIM,fontSize:13}}>Thinking...</div></div></div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"12px 20px",borderTop:"1px solid "+GOLDDIM+"",display:"flex",gap:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask Agent Grok anything about your film..."
          style={{flex:1,background:"#000",border:"1px solid "+GOLDDIM,padding:"10px 14px",color:WHITE,fontSize:13,outline:"none",fontFamily:"'Rajdhani',sans-serif"}}/>
        <button onClick={send} disabled={loading||!input.trim()}
          style={{background:"linear-gradient(135deg,#a07820,"+GOLD+")",border:"none",color:"#000",padding:"10px 24px",cursor:loading||!input.trim()?"not-allowed":"pointer",fontSize:12,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",opacity:loading||!input.trim()?0.5:1}}>SEND</button>
      </div>
    </div>
  );
}

function P22() {
  const [posts,setPosts]=useState([
    {id:1,user:"FilmmakerJade",time:"2h ago",text:"Just rendered my first 4K short using the Reality Engine. The parallax depth on the ocean shots is incredible. This platform is the real deal.",likes:14,liked:false},
    {id:2,user:"DocuDirector",time:"5h ago",text:"Finished my 60-minute veterans documentary using the James voice narration. The prosody engine nails the emotional pacing. Subscribers are already watching.",likes:28,liked:false},
    {id:3,user:"MandaStrong",time:"1d ago",text:"Welcome to the MandaStrong Community Hub. Share your films, your process, your wins and your struggles. We build cinema here. 🎬",likes:47,liked:false},
  ]);
  const [newPost,setNewPost]=useState("");
  const submit=()=>{
    if(!newPost.trim())return;
    setPosts(p=>[{id:Date.now(),user:"You",time:"just now",text:newPost.trim(),likes:0,liked:false},...p]);
    setNewPost("");
  };
  const like=(id)=>setPosts(p=>p.map(post=>post.id===id?{...post,likes:post.liked?post.likes-1:post.likes+1,liked:!post.liked}:post));
  return(
    <div style={{...Sp,padding:40}}>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700,marginBottom:4}}>FILMMAKER NETWORK</div>
        <h1 style={{...H1,fontSize:28,marginBottom:20}}>COMMUNITY HUB</h1>
        <div style={{...Card(),marginBottom:20}}>
          <textarea value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="Share your film, your process, your breakthrough..."
            style={{width:"100%",background:"#000",border:"1px solid "+GOLDDIM,padding:"12px 14px",color:WHITE,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif",lineHeight:1.8,height:100,resize:"none",marginBottom:10}}/>
          <button onClick={submit} disabled={!newPost.trim()} style={{...G("gold",false),padding:"10px 28px",opacity:!newPost.trim()?0.5:1}}>POST TO COMMUNITY</button>
        </div>
        {posts.map(post=>(
          <div key={post.id} style={{...Card(),marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{color:GOLD,fontWeight:900,fontSize:13}}>{post.user}</span>
              <span style={{color:GOLDDIM,fontSize:11}}>{post.time}</span>
            </div>
            <div style={{color:WHITE,fontSize:13,lineHeight:1.8,marginBottom:10}}>{post.text}</div>
            <button onClick={()=>like(post.id)}
              style={{background:"none",border:"1px solid "+(post.liked?GOLD:GOLDDIM),color:post.liked?GOLD:GOLDDIM,padding:"4px 14px",cursor:"pointer",fontSize:12,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>
              {post.liked?"♥":"♡"} {post.likes}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function P23() {
  return(
    <div style={{position:"relative",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden",background:"#000"}}>
      <video autoPlay muted loop playsInline style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.22,zIndex:0}}>
        <source src="background.mp4" type="video/mp4"/>
        <source src="/background.mp4" type="video/mp4"/>
      </video>
      <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"60px 40px"}}>
        <div style={{fontSize:11,color:GOLDDIM,letterSpacing:6,marginBottom:20}}>MANDASTRONG STUDIO — CINEMA INTELLIGENCE PLATFORM</div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(28px,5vw,52px)",fontWeight:900,color:GOLD,letterSpacing:5,lineHeight:1.15,textShadow:"0 0 60px "+GOLD+"cc,0 0 120px "+GOLD+"44",marginBottom:8}}>THAT'S ALL FOLKS</div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(14px,2vw,20px)",color:"rgba(232,201,109,0.55)",letterSpacing:8,marginBottom:40}}>THE WORLD'S MOST POWERFUL CINEMA AI</div>
        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap",marginBottom:40}}>
          {[["🎖","VETERANS MENTAL HEALTH","Supporting those who served"],["🎬","CINEMA AI","Films that change everything"],["📚","ANTI-BULLYING","Doxy The School Bully"]].map(([ic,t,d])=>(
            <div key={t} style={{background:"rgba(0,0,0,0.5)",border:"1px solid "+GOLDDIM,padding:"16px 22px",textAlign:"center",minWidth:160}}>
              <div style={{fontSize:24,marginBottom:6}}>{ic}</div>
              <div style={{color:GOLD,fontSize:11,fontWeight:900,letterSpacing:2,marginBottom:4}}>{t}</div>
              <div style={{color:GOLDDIM,fontSize:10,lineHeight:1.5}}>{d}</div>
            </div>
          ))}
        </div>
        <div style={{color:GOLDDIM,fontSize:11,letterSpacing:2,lineHeight:2,marginBottom:28}}>
          Built with love, sarcasm, and way too much coffee.<br/>
          By Amanda Woolley — Author, Filmmaker, AI Builder.<br/>
          <a href="https://MandaStrong1.Etsy.com" target="_blank" rel="noreferrer" style={{color:GOLD,textDecoration:"none"}}>MandaStrong1.Etsy.com</a>
        </div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:12,color:"rgba(232,201,109,0.3)",letterSpacing:6}}>© 2026 MANDASTRONG STUDIO — ALL RIGHTS RESERVED</div>
      </div>
    </div>
  );
}


function HowToGuide({ onClose }) {
  const [step,setStep]=useState(0);
  const steps=[
    {t:"WELCOME TO MANDASTRONG STUDIO",b:"The world's most powerful Cinema Intelligence Platform. 600+ AI tools. 8K export. Films up to 3 hours. Built for creators who refuse to compromise."},
    {t:"STEP 1 — LOGIN OR SUBSCRIBE",b:"Go to Page 4. Sign in with your account, start a 7-day free trial on the Studio Plan, or browse as a guest to explore the platform first."},
    {t:"STEP 2 — WRITE YOUR SCRIPT",b:"Page 5 — Script to Movie. Paste your script or use AI to generate one. Assign voices to characters. Save to your Media Library."},
    {t:"STEP 3 — GENERATE VIDEO",b:"Page 8 — Video Generator. Upload reference photos (Reality Engine) or describe your scene. The MandaStrong Engine renders photorealistic cinema. One scene at a time."},
    {t:"STEP 4 — RECORD NARRATION",b:"Page 6 — Voice Engine. Choose from 54 voice characters. Paste your narration, set Speed/Pitch/Pause/Mood, and speak. Save to your Media Library."},
    {t:"STEP 5 — EDIT YOUR TIMELINE",b:"Page 13 — Timeline Editor. Drag your clips and audio into tracks. Sync all tracks. Set your film duration (60/90/180 minutes)."},
    {t:"STEP 6 — MIX YOUR AUDIO",b:"Page 15 — Audio Mixer. Set VOICE 85 / MUSIC 40 / EFX 50 / MASTER 85. Adjust to taste."},
    {t:"STEP 7 — RENDER YOUR FILM",b:"Page 16 — Render Engine. Choose resolution up to 4K. Apply colour grade, film grain, letterbox. Hit Start Render. Download your film."},
    {t:"YOU'RE READY",b:"Your film is ready. Export it from Page 18 for YouTube, Vimeo, TikTok, or film festivals. Share it with the Community Hub on Page 22. Go make something extraordinary."},
  ];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.94)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20}}>
      <div style={{background:"#050500",border:"2px solid "+GOLD,maxWidth:540,width:"100%",padding:36,boxShadow:"0 0 60px "+GOLD+"33"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{color:GOLD,fontSize:11,letterSpacing:4,fontWeight:900}}>HOW TO USE THE STUDIO</div>
          <button onClick={onClose} style={{background:"none",border:"1px solid "+GOLDDIM,color:GOLDDIM,padding:"3px 10px",cursor:"pointer",fontSize:14,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>✕</button>
        </div>
        <div style={{color:GOLD,fontSize:10,letterSpacing:3,fontWeight:900,marginBottom:6}}>STEP {step+1} OF {steps.length}</div>
        <h2 style={{...H1,fontSize:20,marginBottom:14}}>{steps[step].t}</h2>
        <div style={{color:WHITE,fontSize:14,lineHeight:1.9,marginBottom:28}}>{steps[step].b}</div>
        <div style={{display:"flex",gap:8}}>
          {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{...G("out",false),flex:1}}>← BACK</button>}
          {step<steps.length-1?<button onClick={()=>setStep(s=>s+1)} style={{...G("gold",false),flex:2}}>NEXT →</button>:
          <button onClick={onClose} style={{...G("gold",false),flex:2}}>LET'S MAKE FILMS ✦</button>}
        </div>
        <div style={{display:"flex",gap:4,justifyContent:"center",marginTop:16}}>
          {steps.map((_,i)=><div key={i} style={{width:i===step?20:6,height:4,background:i===step?GOLD:GOLDDIM,transition:"width .3s"}}/>)}
        </div>
      </div>
    </div>
  );
}

function P5Placeholder({ go }) {
  const [script,setScript]=useState("");
  const [title,setTitle]=useState("");
  const [result,setResult]=useState("");
  const [loading,setLoading]=useState(false);
  const inp={width:"100%",background:"#000",border:"1px solid "+GOLDDIM,padding:"10px 14px",color:WHITE,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif",lineHeight:1.8};
  const generate=async()=>{
    if(!script.trim())return;
    setLoading(true);setResult("");
    try{
      const d=await proxyFetch({model:"claude-sonnet-4-20250514",max_tokens:2000,messages:[{role:"user",content:"You are a professional screenplay consultant. The user has provided a script or idea. Provide: 1) A compelling logline 2) Scene breakdown (5-8 scenes) 3) Character notes 4) Production recommendations for MandaStrong Studio.\n\nTitle: "+(title||"Untitled")+"\n\nScript/Idea:\n"+script}]});
      setResult(d&&d.content&&d.content[0]?d.content[0].text.trim():"Could not generate. Please try again.");
    }catch(e){setResult("Error: "+e.message);}
    setLoading(false);
  };
  return(
    <div style={{...Sp,padding:32}}>
      <div style={{maxWidth:780,margin:"0 auto"}}>
        <div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700,marginBottom:4}}>AI WORKSTATION 01</div>
        <h1 style={{...H1,fontSize:26,marginBottom:4}}>SCRIPT TO MOVIE</h1>
        <div style={{color:WHITE,fontSize:13,marginBottom:20}}>Write your idea. AI develops it into a production-ready script with scene breakdowns and character notes.</div>
        <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:5}}>FILM TITLE</div>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Doxy The School Bully"
          style={{...inp,marginBottom:14}}/>
        <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:5}}>YOUR SCRIPT OR IDEA</div>
        <textarea value={script} onChange={e=>setScript(e.target.value)}
          placeholder="Paste your script, scene notes, or describe your film idea here. The more detail you give, the better the output."
          style={{...inp,height:200,resize:"vertical",marginBottom:14}}/>
        <button onClick={generate} disabled={loading||!script.trim()}
          style={{background:"linear-gradient(135deg,#a07820,"+GOLD+")",border:"none",color:"#000",width:"100%",padding:"16px",fontSize:14,fontWeight:900,letterSpacing:3,cursor:loading||!script.trim()?"not-allowed":"pointer",fontFamily:"'Rajdhani',sans-serif",opacity:loading||!script.trim()?0.5:1,marginBottom:16}}>
          {loading?"⟳ DEVELOPING YOUR SCRIPT...":"✦ DEVELOP WITH AI"}
        </button>
        {result&&(
          <div style={{background:"#0a0800",border:"1px solid "+GOLD,padding:20}}>
            <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:12}}>SCRIPT DEVELOPMENT REPORT</div>
            <pre style={{color:WHITE,fontSize:13,lineHeight:1.9,whiteSpace:"pre-wrap",margin:0,fontFamily:"'Rajdhani',sans-serif"}}>{result}</pre>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={()=>go(8)} style={{...G("gold",false),flex:1}}>→ VIDEO GENERATOR</button>
              <button onClick={()=>go(6)} style={{...G("out",false),flex:1}}>→ VOICE ENGINE</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function P7Placeholder() {
  const [prompt,setPrompt]=useState("");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState("");
  const [style,setStyle]=useState("photorealistic");
  const STYLES=["photorealistic","cinematic","oil painting","watercolour","concept art","noir","golden hour","epic fantasy"];
  return(
    <div style={{...Sp,padding:32}}>
      <div style={{maxWidth:700,margin:"0 auto"}}>
        <div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700,marginBottom:4}}>AI WORKSTATION 03</div>
        <h1 style={{...H1,fontSize:26,marginBottom:16}}>IMAGE GENERATOR</h1>
        <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:6}}>IMAGE STYLE</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
          {STYLES.map(s=><button key={s} onClick={()=>setStyle(s)} style={{background:style===s?GOLD:"#0a0a0a",border:"1px solid "+(style===s?"#000":GOLDDIM),color:style===s?"#000":WHITE,padding:"5px 14px",cursor:"pointer",fontSize:11,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>{s}</button>)}
        </div>
        <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:5}}>DESCRIBE YOUR IMAGE</div>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe the image you want to generate..."
          style={{width:"100%",background:"#000",border:"1px solid "+GOLDDIM,padding:"12px 14px",color:WHITE,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif",lineHeight:1.9,height:120,resize:"none",marginBottom:14}}/>
        <button onClick={async()=>{if(!prompt.trim())return;setLoading(true);setResult("");try{const d=await proxyFetch({model:"claude-sonnet-4-20250514",max_tokens:500,messages:[{role:"user",content:"Create a detailed visual description for an image: "+style+" style. Scene: "+prompt+". Describe lighting, composition, colours, depth, atmosphere in 3-4 sentences as if directing a photographer."}]});setResult(d&&d.content&&d.content[0]?d.content[0].text.trim():"");}catch(e){setResult("Error: "+e.message);}setLoading(false);}}
          disabled={loading||!prompt.trim()} style={{background:"linear-gradient(135deg,#a07820,"+GOLD+")",border:"none",color:"#000",width:"100%",padding:"16px",fontSize:14,fontWeight:900,letterSpacing:3,cursor:loading||!prompt.trim()?"not-allowed":"pointer",fontFamily:"'Rajdhani',sans-serif",opacity:loading||!prompt.trim()?0.5:1,marginBottom:16}}>
          {loading?"⟳ GENERATING...":"🎨 GENERATE IMAGE DESCRIPTION"}
        </button>
        {result&&<div style={{background:"#0a0800",border:"1px solid "+GOLD,padding:20}}><div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:10}}>VISUAL DIRECTION</div><div style={{color:WHITE,fontSize:13,lineHeight:1.9}}>{result}</div></div>}
      </div>
    </div>
  );
}

function P9({ onSave }) {
  return <ToolPage title="MOTION & VFX" subtitle="AI WORKSTATION 05 — MOTION TOOLS" tools={MOTION} onSave={onSave}/>;
}

function P10({ onSave }) {
  return <ToolPage title="ENHANCEMENT STUDIO" subtitle="AI WORKSTATION 06 — IMAGE & VIDEO ENHANCEMENT" tools={[...IMAGE_T,...MOTION].slice(0,60)} onSave={onSave}/>;
}

export default function App() {
  const [page,setPage]=useState(1);
  const [user,setUser]=useState(null);
  const [mediaLib,setMediaLib]=useState([]);
  const [timeline,setTimeline]=useState({});
  const [filmDuration,setFilmDuration]=useState(60);
  const [showGuide,setShowGuide]=useState(false);
  const [showSave,setShowSave]=useState(false);
  const [showHistory,setShowHistory]=useState(false);
  const [savedProjects,setSavedProjects]=useState([]);
  const [showQA,setShowQA]=useState(false);

  useEffect(()=>{
    try{
      const saved=localStorage.getItem("ms_medialib");
      if(saved)setMediaLib(JSON.parse(saved));
      const savedTl=localStorage.getItem("ms_timeline");
      if(savedTl)setTimeline(JSON.parse(savedTl));
      const savedUser=localStorage.getItem("ms_user");
      if(savedUser)setUser(JSON.parse(savedUser));
      const savedPage=localStorage.getItem("ms_page");
      if(savedPage)setPage(+savedPage);
      const savedProj=localStorage.getItem("ms_saved_projects");
      if(savedProj)setSavedProjects(JSON.parse(savedProj));
    }catch(e){}
  },[]);

  useEffect(()=>{
    try{
      const saveable=mediaLib.filter(a=>!a.file&&a.type!=="video/webm");
      localStorage.setItem("ms_medialib",JSON.stringify(saveable));
    }catch(e){}
  },[mediaLib]);

  useEffect(()=>{try{localStorage.setItem("ms_timeline",JSON.stringify(timeline));}catch(e){}}, [timeline]);
  useEffect(()=>{try{if(user)localStorage.setItem("ms_user",JSON.stringify(user));}catch(e){}}, [user]);
  useEffect(()=>{try{localStorage.setItem("ms_page",String(page));}catch(e){}}, [page]);

  const addToLib=(asset)=>{
    if(!asset)return;
    setMediaLib(p=>{
      const exists=p.find(a=>a.id===asset.id);
      return exists?p.map(a=>a.id===asset.id?asset:a):[...p,asset];
    });
  };

  const saveProject=(name)=>{
    const proj={id:Date.now(),name,date:new Date().toISOString(),page,mediaCount:mediaLib.length,timelineTracks:Object.keys(timeline).length};
    const updated=[proj,...savedProjects].slice(0,20);
    setSavedProjects(updated);
    try{localStorage.setItem("ms_saved_projects",JSON.stringify(updated));}catch(e){}
  };

  const go=(p)=>{setPage(p);window.scrollTo(0,0);};

  const NAV_PAGES=[
    {p:1,label:"HOME"},{p:2,label:"DASHBOARD"},{p:3,label:"SHOWCASE"},{p:4,label:"LOGIN"},
    {p:5,label:"SCRIPT"},{p:6,label:"VOICE"},{p:7,label:"IMAGE"},{p:8,label:"VIDEO"},
    {p:11,label:"UPLOAD"},{p:12,label:"EDITOR"},{p:13,label:"TIMELINE"},{p:14,label:"ENHANCE"},
    {p:15,label:"AUDIO"},{p:16,label:"RENDER"},{p:17,label:"PREVIEW"},{p:18,label:"EXPORT"},
    {p:19,label:"TUTORIALS"},{p:20,label:"TERMS"},{p:21,label:"GROK"},{p:22,label:"COMMUNITY"},{p:23,label:"CREDITS"},
  ];

  const renderPage=()=>{
    switch(page){
      case 1: return <P1 go={go}/>;
      case 2: return <P2 go={go}/>;
      case 3: return <P3/>;
      case 4: return <P4 go={go} setUser={setUser}/>;
      case 5: return <P5Placeholder go={go}/>;
      case 6: return <P6Voice onSave={addToLib} setMediaLib={setMediaLib}/>;
      case 7: return <P7Placeholder/>;
      case 8: return <P8VideoGenerator onSave={addToLib} user={user} filmDuration={filmDuration} setFilmDuration={setFilmDuration}/>;
      case 9: return <P9 onSave={addToLib}/>;
      case 10: return <P10 onSave={addToLib}/>;
      case 11: return <P11 mediaLib={mediaLib} setMediaLib={setMediaLib}/>;
      case 12: return <P12 go={go} mediaLib={mediaLib}/>;
      case 13: return <P13 go={go} mediaLib={mediaLib} timeline={timeline} setTimeline={setTimeline} user={user} filmDuration={filmDuration} setFilmDuration={setFilmDuration}/>;
      case 14: return <P14/>;
      case 15: return <P15/>;
      case 16: return <P16 mediaLib={mediaLib} timeline={timeline} setTimeline={setTimeline} filmDuration={filmDuration}/>;
      case 17: return <P17 mediaLib={mediaLib}/>;
      case 18: return <P18 mediaLib={mediaLib}/>;
      case 19: return <P19/>;
      case 20: return <P20/>;
      case 21: return <P21/>;
      case 22: return <P22/>;
      case 23: return <P23/>;
      default: return <P1 go={go}/>;
    }
  };

  return(
    <div style={{minHeight:"100vh",background:"#000",color:WHITE,fontFamily:"'Rajdhani',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#000;color:#fff;font-family:'Rajdhani',sans-serif;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:#000;}
        ::-webkit-scrollbar-thumb{background:#4a3800;}
        ::-webkit-scrollbar-thumb:hover{background:#e8c96d;}
        input,textarea,select{color-scheme:dark;}
        .bolt-badge,.bolt-watermark,[class*="bolt-"]{display:none!important;opacity:0!important;pointer-events:none!important;}
      `}</style>

      {showGuide&&<HowToGuide onClose={()=>setShowGuide(false)}/>}
      {showSave&&<SaveSessionModal onClose={()=>setShowSave(false)} onSave={saveProject}/>}
      {showHistory&&<ProjectHistoryModal projects={savedProjects} onClose={()=>setShowHistory(false)} onLoad={(p)=>{setPage(p.page||1);setShowHistory(false);}}/>}
      {showQA&&<QAMenu onClose={()=>setShowQA(false)} user={user} mediaLib={mediaLib} page={page}/>}

      <Header page={page} go={go} user={user} onGuide={()=>setShowGuide(true)} onSave={()=>setShowSave(true)} onHistory={()=>setShowHistory(true)} onQA={()=>setShowQA(true)} NAV={NAV_PAGES}/>

      <div style={{paddingTop:58}}>
        {renderPage()}
      </div>

      <Footer go={go} onSave={()=>setShowSave(true)} onHistory={()=>setShowHistory(true)} mediaLib={mediaLib} page={page}/>
    </div>
  );
}

