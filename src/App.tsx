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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <button onClick={()=>{const i=document.createElement("input");i.type="file";i.accept="image/*";i.onchange=e=>{const f=e.target.files&&e.target.files[0];if(f&&onSave){onSave({id:Date.now()+Math.random(),name:f.name,type:f.type,file:f,url:URL.createObjectURL(f)});setSaved(true);}};i.click();}}
                style={{background:"linear-gradient(135deg,#1a0800,#2a1200)",border:"2px solid "+GOLD,color:GOLD,padding:"22px 14px",cursor:"pointer",fontSize:12,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>
                📷 UPLOAD PHOTO
              </button>
              <button onClick={()=>fileRef.current&&fileRef.current.click()}
                style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,color:WHITE,padding:"22px 14px",cursor:"pointer",fontSize:12,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>
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
                    // Show history modal by dispatching custom event
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
  const [mvMediaLib, setMvMediaLib] = useState([]);
  const [mvTimeline, setMvTimeline] = useState({video:[],audio:[]});
  const [mvDuration, setMvDuration] = useState(180);
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

  // Upload audio track
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

      // ── BEAT ANALYSIS ─────────────────────────────────────────────
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
          // Energy-based beat detection
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
          // Set up audio mixing
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

      // ── BUILT-IN RENDERER (NO PROXY) ─────────────
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
        // SKY
        if(isSpace){
          const sky=ctx.createLinearGradient(0,0,0,H);
          sky.addColorStop(0,"rgb(1,1,8)"); sky.addColorStop(1,"rgb(3,3,18)");
          ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
          for(let s=0;s<300;s++){
            const sx=(s*137.5)%W, sy=(s*97.3)%H;
            ctx.fillStyle="rgba(240,245,255,"+(0.3+Math.sin(sec*0.7+s)*0.28)+")";
            ctx.fillRect(sx,sy,s%5===0?1.8:0.8,s%5===0?1.8:0.8);
          }
        } else if(isNight){
          const sky=ctx.createLinearGradient(0,0,0,H*0.62);
          sky.addColorStop(0,"rgb(2,4,15)");
          sky.addColorStop(0.5,"rgb(5,10,32)");
          sky.addColorStop(1,"rgb(8,18,50)");
          ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
          for(let s=0;s<200;s++){
            const sx=(s*137.5)%W, sy=(s*97.3)%(H*0.55);
            ctx.fillStyle="rgba(240,245,255,"+(0.3+Math.sin(sec*0.5+s*0.3)*0.22)+")";
            ctx.fillRect(sx,sy,s%4===0?1.4:0.7,s%4===0?1.4:0.7);
          }
          const mx=W*0.78, my=H*0.13;
          const mg=ctx.createRadialGradient(mx,my,0,mx,my,H*0.078);
          mg.addColorStop(0,"rgba(255,255,248,0.96)");
          mg.addColorStop(1,"rgba(200,200,180,0)");
          ctx.fillStyle=mg; ctx.fillRect(mx-H*0.09,my-H*0.09,H*0.18,H*0.18);
        } else if(isGolden){
          const sky=ctx.createLinearGradient(0,0,0,H*0.66);
          sky.addColorStop(0,"rgb(18,10,35)");
          sky.addColorStop(0.3,"rgb(165,50,12)");
          sky.addColorStop(0.65,"rgb(248,135,28)");
          sky.addColorStop(1,"rgb(255,205,75)");
          ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
        } else {
          const sky=ctx.createLinearGradient(0,0,0,H*0.6);
          sky.addColorStop(0,"rgb(28,60,140)");
          sky.addColorStop(1,"rgb(180,210,240)");
          ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
        }
        const horizY = isIndoor ? H : H*0.56;
        // OCEAN
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
        // CITY
        if(isCity && !isIndoor){
          const grd=ctx.createLinearGradient(0,horizY,0,H);
          grd.addColorStop(0,"rgb(16,16,20)"); grd.addColorStop(1,"rgb(8,8,10)");
          ctx.fillStyle=grd; ctx.fillRect(0,horizY,W,H-horizY);
          for(let b=0;b<18;b++){
            const bx=(b*151)%W, bh=H*0.15+((b*97)%H)*0.35, bw=W*0.035;
            ctx.fillStyle=isNight?"rgb(10,10,18)":"rgb(75,80,90)";
            ctx.fillRect(bx,horizY-bh,bw,bh);
            for(let wy=0;wy<Math.floor(bh/18);wy++){
              for(let wx=0;wx<Math.floor(bw/10);wx++){
                if(Math.sin(b*13+wy*7+wx*11)>0.1){
                  const lit=Math.sin(sec*0.3+b+wy)>-0.3;
                  ctx.fillStyle=lit?"rgba(255,240,180,0.88)":"rgba(20,20,28,0.5)";
                  ctx.fillRect(bx+wx*10+2,horizY-bh+wy*18+4,7,10);
                }
              }
            }
          }
        }
        // INDOOR
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
                wg2.addColorStop(0,"rgba(2,8,35,0.9)");
                wg2.addColorStop(1,"rgba(1,3,12,0.98)");
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
        // CANDLE
        if(hasCandle){
          const candX=isIndoor?W*0.7:W*0.5, candY=isIndoor?H*0.58:H*0.5;
          const flicker=0.88+Math.sin(sec*8.8)*0.07+Math.sin(sec*13.4)*0.04;
          ctx.fillStyle="rgba(232,212,162,0.9)"; ctx.fillRect(candX-5,candY,10,32);
          const cf=ctx.createRadialGradient(candX,candY,0,candX,candY,H*0.13*flicker);
          cf.addColorStop(0,"rgba(255,255,200,0.95)");
          cf.addColorStop(0.18,"rgba(255,180,40,0.72)");
          cf.addColorStop(0.5,"rgba(255,100,8,0.3)");
          cf.addColorStop(1,"rgba(255,60,0,0)");
          ctx.fillStyle=cf; ctx.fillRect(candX-H*0.13,candY-H*0.13,H*0.26,H*0.26);
        }
        // PERSON
        if(hasPerson){
          const isSeated=/sit|bench|windowsill|chair/.test(pr);
          const fx=isOcean&&isIndoor?W*0.22:W*0.4;
          const fy=isSeated?H*0.52:H*0.44;
          const breath=Math.sin(sec*0.88)*0.007;
          if(isSilhouette){
            ctx.fillStyle="rgba(2,1,1,0.97)";
            ctx.beginPath();ctx.ellipse(fx,fy-H*0.13,H*0.036,H*0.044,0,0,Math.PI*2);ctx.fill();
            ctx.fillRect(fx-H*0.028,fy-H*0.09,H*0.056,H*(0.15+breath*2));
            if(hasGuitar){
              ctx.beginPath();ctx.ellipse(fx+H*0.072,fy+H*0.02,H*0.05,H*0.064,0.22,0,Math.PI*2);ctx.fill();
              ctx.fillRect(fx+H*0.026,fy-H*0.09,H*0.011,H*0.12);
            }
          } else {
            const hg=ctx.createRadialGradient(fx-H*0.008,fy-H*0.145,0,fx,fy-H*0.13,H*0.042);
            hg.addColorStop(0,"rgba(235,185,135,1)");
            hg.addColorStop(1,"rgba(155,102,65,1)");
            ctx.fillStyle=hg;
            ctx.beginPath();ctx.ellipse(fx,fy-H*0.13,H*0.034,H*0.042,0,0,Math.PI*2);ctx.fill();
            ctx.fillStyle="rgba(28,18,10,0.97)";
            ctx.fillRect(fx-H*0.03,fy-H*0.09,H*0.06,H*0.17);
          }
        }
        if(isRain){
          for(let r=0;r<120;r++){
            const rx=(r*137+sec*200)%W, ry=(r*97+sec*450)%H;
            ctx.strokeStyle="rgba(155,175,210,0.2)"; ctx.lineWidth=0.8;
            ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(rx-4,ry+18); ctx.stroke();
          }
        }
        if(isFog){
          const fog=ctx.createLinearGradient(0,H*0.38,0,H*0.72);
          fog.addColorStop(0,"rgba(175,180,175,0)");
          fog.addColorStop(0.5,"rgba(155,160,155,"+(0.1+Math.sin(sec*0.28)*0.04)+")");
          fog.addColorStop(1,"rgba(138,142,138,0)");
          ctx.fillStyle=fog; ctx.fillRect(0,H*0.38,W,H*0.34);
        }
        ctx.restore();
      };

      setRenderProgress(30);
      addLog("Rendering "+totalDur.toFixed(0)+"s film at 12fps...");

      // ── SET UP CANVAS + RECORDER ────────────────────────────────
      const canvas = canvasRef.current;
      const W=1280, H=720;
      canvas.width=W; canvas.height=H;
      const ctx = canvas.getContext("2d");

      const fps=12;
      const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";
      const videoStream=canvas.captureStream(fps);
      let combinedStream=videoStream;
      if(audioDest){
        combinedStream=new MediaStream([...videoStream.getTracks(),...audioDest.stream.getTracks()]);
      }
      const recorder=new MediaRecorder(combinedStream,{mimeType,videoBitsPerSecond:10000000});
      const chunks=[];
      recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
      recorder.start(Math.round(1000/fps));
      if(audioSource) audioSource.start(0);

      // ── RENDER EVERY FRAME ──────────────────────────────────────
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

          // Camera parallax base
          const drift=t*W*0.04;
          ctx.save();
          ctx.translate(-drift*0.3,0);

          try{ renderFn(ctx,W,H,t,sec,totalDur,beatNow); }
          catch(e){
            // Graceful fallback — keep rendering
            const bg=ctx.createLinearGradient(0,0,0,H);
            bg.addColorStop(0,"rgb(2,5,18)");
            bg.addColorStop(1,"rgb(4,8,28)");
            ctx.fillStyle=bg; ctx.fillRect(-W,0,W*3,H);
          }

          ctx.restore();

          // Vignette — always
          const vig=ctx.createRadialGradient(W/2,H/2,W*0.08,W/2,H/2,W*0.85);
          vig.addColorStop(0,"rgba(0,0,0,0)"); vig.addColorStop(1,"rgba(0,0,0,0.92)");
          ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

          // Letterbox
          ctx.fillStyle="#000";
          ctx.fillRect(0,0,W,Math.round(H*0.072));
          ctx.fillRect(0,H-Math.round(H*0.072),W,Math.round(H*0.072));

          // Film grain
          for(let g=0;g<30;g++){
            const gv=Math.random()>0.5?130:0;
            ctx.fillStyle="rgba("+gv+","+gv+","+gv+",0.008)";
            ctx.fillRect(Math.random()*W,Math.random()*H,1,1);
          }

          // Title card — opening and closing
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

      // ── FINALISE ────────────────────────────────────────────────
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

  const steps = ["🎵 SONG","🎤 STYLE","🎬 SCENE","▶ GENERATE","📁 LIBRARY","⏱ TIMELINE"];
  const fmt = (s)=>{const m=Math.floor(s/60);const sc=Math.floor(s%60);return String(m).padStart(2,"0")+":"+String(sc).padStart(2,"0");};

  return (
    <div style={{position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,0.98)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"min(960px,98vw)",height:"min(92vh,860px)",background:"#050505",border:"2px solid "+GOLD,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#1a0a00,#0a0500)",borderBottom:"1px solid "+GOLD+"",padding:"14px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:18,fontWeight:900,letterSpacing:4}}>🎬 MUSIC VIDEO STUDIO</div>
            <div style={{color:WHITE,fontSize:10,letterSpacing:3,marginTop:2}}>PROFESSIONAL MUSIC VIDEO PRODUCTION · AI POWERED · SELF-CONTAINED</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid "+GOLD,color:GOLD,width:32,height:32,cursor:"pointer",fontSize:16}}>✕</button>
        </div>

        {/* Step tabs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",borderBottom:"1px solid "+GOLDDIM+"",flexShrink:0}}>
          {steps.map((s,i)=>(
            <button key={i} onClick={()=>setStep(i+1)}
              style={{background:step===i+1?"#0a0500":"none",border:"none",borderBottom:step===i+1?"2px solid "+GOLD:"2px solid transparent",color:step===i+1?GOLD:WHITE,padding:"11px 6px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2}}>
              {s}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div style={{flex:1,display:"grid",gridTemplateColumns:videoUrl?"1fr 1fr":"1fr",overflow:"hidden"}}>

          {/* Left — config / generate */}
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
                <div style={{background:"#000",border:"1px dashed "+audioFile?GOLD:GOLDDIM,padding:"12px",cursor:"pointer",marginBottom:4}}
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
                <div style={{color:GOLDDIM,fontSize:11,marginBottom:8,lineHeight:1.7}}>
                  Describe what you want to see. The AI director will build 8 cinematic shots from your description.
                </div>
                <textarea
                  value={config.visualDesc}
                  onChange={e=>set("visualDesc",e.target.value)}
                  placeholder="e.g. A man sits alone on a windowsill fingerpicking acoustic guitar. Only his back is visible. Facing the open ocean at night. Full moon low on the water. A single candle burns to his right. The room behind him is empty. A cold couch. A coat still on a hook. He does not move. A man who has lost someone."
                  style={{...inp,height:160,resize:"vertical",lineHeight:1.8,border:"1px solid "+GOLD}}
                />
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
                {/* Scene description */}
                <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:6}}>DESCRIBE YOUR MUSIC VIDEO SCENE</div>
                <textarea
                  value={config.visualDesc}
                  onChange={e=>set("visualDesc",e.target.value)}
                  placeholder="Describe what you want to see. e.g. A man sits alone on a windowsill fingerpicking acoustic guitar. Only his back is visible. Facing the open ocean at night. Full moon. Single candle. The room is empty. A man who has lost someone."
                  style={{width:"100%",background:"#000",border:"1px solid "+GOLD,padding:"12px",color:WHITE,fontSize:13,outline:"none",fontFamily:"'Rajdhani',sans-serif",boxSizing:"border-box",height:130,resize:"vertical",lineHeight:1.8,marginBottom:10}}
                />
                {/* Reference image upload */}
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
                <div style={{...{background:"#0a0500",border:"1px solid "+GOLDDIM,padding:14},marginBottom:14}}>
                  <div style={{color:GOLD,fontSize:11,letterSpacing:2,marginBottom:8,fontWeight:900}}>YOUR MUSIC VIDEO</div>
                  {[["TITLE",config.title||"—"],["ARTIST",config.artist||"—"],["GENRE",config.genre||"—"],["MOOD",config.mood||"—"],["STYLE",config.videoStyle||"—"],["GRADE",config.colorGrade||"—"],["DURATION",config.duration||"—"],["AUDIO",audioName||"No audio uploaded"]].map(([k,v])=>(
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
                {!generating&&renderLog.length>0&&(
                  <div style={{background:"#000",border:"1px solid "+GOLDDIM,padding:10,maxHeight:120,overflowY:"auto"}}>
                    {renderLog.map((l,i)=>(
                      <div key={i} style={{color:i===renderLog.length-1?"#22c55e":DIM,fontSize:10,lineHeight:1.8}}>
                        {i===renderLog.length-1?"▶ ":"  "}{l}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step===5&&(
              <div>
                <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:12}}>MUSIC VIDEO LIBRARY</div>
                {mvMediaLib.length===0?(
                  <div style={{color:GOLDDIM,fontSize:12,lineHeight:2,padding:"20px",textAlign:"center",border:"1px dashed "+GOLDDIM}}>
                    No music videos yet.<br/>Generate one on Step 4 and save it here.
                  </div>
                ):(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {mvMediaLib.map((clip,i)=>(
                      <div key={i} style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,padding:8}}>
                        <video src={clip.url} controls playsInline style={{width:"100%",aspectRatio:"16/9",display:"block",marginBottom:6}}/>
                        <div style={{color:WHITE,fontSize:11,fontWeight:900,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{clip.name}</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                          <a href={clip.url} download={clip.name} style={{background:"transparent",border:"1px solid "+GOLD,color:GOLD,padding:"5px",fontSize:10,textDecoration:"none",textAlign:"center",fontWeight:900,fontFamily:"'Rajdhani',sans-serif",display:"block"}}>⬇ SAVE</a>
                          <button onClick={()=>setMvTimeline(p=>({...p,video:[...p.video,clip]}))} style={{background:"transparent",border:"1px solid "+GOLDDIM,color:WHITE,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>+ TIMELINE</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step===6&&(
              <div>
                <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:8}}>MUSIC VIDEO TIMELINE</div>
                <div style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:GOLDDIM,fontSize:10,fontWeight:900,letterSpacing:2}}>DURATION</span>
                    <span style={{color:GOLD,fontSize:11,fontWeight:900}}>{Math.floor(mvDuration/60)}:{String(mvDuration%60).padStart(2,"0")}</span>
                  </div>
                  <input type="range" min={30} max={600} step={10} value={mvDuration} onChange={e=>setMvDuration(+e.target.value)} style={{width:"100%",accentColor:GOLD}}/>
                </div>
                {["video","audio"].map(track=>(
                  <div key={track} style={{marginBottom:10}}>
                    <div style={{color:GOLD,fontSize:10,letterSpacing:3,fontWeight:900,marginBottom:4}}>{track.toUpperCase()} TRACK</div>
                    <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("mvClipId");const clip=mvMediaLib.find(c=>c.id===id);if(clip)setMvTimeline(p=>({...p,[track]:[...p[track],clip]}));}}
                      style={{background:"#0a0a0a",border:"1px dashed "+GOLDDIM,minHeight:42,padding:6,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                      {(mvTimeline[track]||[]).map((c,i)=>(
                        <div key={i} style={{background:GOLDDIM,padding:"3px 10px",fontSize:11,color:"#000",fontWeight:900,display:"flex",alignItems:"center",gap:5}}>
                          {c.name.slice(0,14)}
                          <button onClick={()=>setMvTimeline(p=>({...p,[track]:p[track].filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:"#000",cursor:"pointer",fontSize:10,padding:0}}>✕</button>
                        </div>
                      ))}
                      {!(mvTimeline[track]||[]).length&&<span style={{color:GOLDDIM,fontSize:11}}>DROP CLIPS HERE · or use + TIMELINE from Library</span>}
                    </div>
                  </div>
                ))}
                {mvMediaLib.length>0&&(
                  <div style={{marginTop:8}}>
                    <div style={{color:GOLDDIM,fontSize:10,letterSpacing:2,marginBottom:5}}>DRAG TO TRACKS:</div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {mvMediaLib.map(c=>(
                        <div key={c.id} draggable onDragStart={e=>e.dataTransfer.setData("mvClipId",c.id)}
                          style={{background:"#0a0a0a",border:"1px solid "+GOLD,padding:"3px 10px",cursor:"grab",color:GOLD,fontSize:11,fontWeight:700}}>
                          🎬 {c.name.slice(0,14)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{marginTop:14,display:"flex",gap:8}}>
                  <button onClick={()=>setMvTimeline({video:[],audio:[]})} style={{background:"transparent",border:"1px solid "+GOLDDIM,color:GOLDDIM,padding:"7px 16px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>CLEAR</button>
                </div>
              </div>
            )}
          </div>

          {/* Right — video player + export (only when video exists) */}
          {videoUrl&&(
            <div style={{display:"flex",flexDirection:"column",background:"#000",overflow:"hidden"}}>
              {/* Video player */}
              <div style={{position:"relative",background:"#000"}}>
                <canvas ref={canvasRef} style={{display:"none"}}/>
                <video ref={videoRef} src={videoUrl} playsInline
                  style={{width:"100%",aspectRatio:"16/9",display:"block",background:"#000"}}
                  onTimeUpdate={()=>setCurrentTime(videoRef.current?.currentTime||0)}
                  onLoadedMetadata={()=>setDuration2(videoRef.current?.duration||0)}
                  onPlay={()=>setPlaying(true)}
                  onPause={()=>setPlaying(false)}
                  onEnded={()=>setPlaying(false)}
                />
                {/* Custom controls overlay */}
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
                      <button onClick={()=>videoRef.current&&(videoRef.current.currentTime=Math.min(duration2,videoRef.current.currentTime+10))} style={{background:"none",border:"none",color:GOLDDIM,cursor:"pointer",fontSize:14}}>⏩</button>
                      <span style={{color:WHITE,fontSize:11,fontFamily:"monospace"}}>{fmt(currentTime||0)} / {fmt(isFinite(duration2)&&duration2>0?duration2:0)}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{color:GOLDDIM,fontSize:10}}>VOL</span>
                      <input type="range" min={0} max={1} step={0.05} defaultValue={0.85}
                        onChange={e=>{if(videoRef.current)videoRef.current.volume=+e.target.value;}}
                        style={{width:70,accentColor:GOLD}}/>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export panel */}
              <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
                <div style={{color:GOLD,fontSize:11,fontWeight:900,letterSpacing:3,marginBottom:10}}>EXPORT YOUR MUSIC VIDEO</div>

                {/* Download */}
                <a href={videoUrl} download={(config.title||"MusicVideo")+"_"+config.artist+".webm"}
                  style={{display:"block",background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",padding:"12px",textAlign:"center",textDecoration:"none",fontWeight:900,fontSize:12,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",marginBottom:8}}>
                  ⬇ DOWNLOAD VIDEO
                </a>

                {/* Save to media library */}
                <button onClick={()=>{
                  if(videoBlob&&onSave){
                    const fn=(config.title||"MusicVideo")+"_"+config.artist+".webm";
                    const asset={id:"mv_"+Date.now(),name:fn,type:"video/webm",url:videoUrl,file:new File([videoBlob],fn,{type:"video/webm"})};
                    onSave(asset);
                    setMvMediaLib(p=>[...p,asset]);
                    addLog("✓ Saved to media library");
                  }
                }} style={{width:"100%",background:"transparent",border:"1px solid "+GOLD,color:GOLD,padding:"10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",marginBottom:14}}>
                  💾 SAVE TO MEDIA LIBRARY
                </button>

                {/* Share to social */}
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

                {/* New project */}
                <button onClick={()=>{setVideoUrl("");setVideoBlob(null);setRenderLog([]);setRenderProgress(0);setStep(1);}}
                  style={{width:"100%",background:"transparent",border:"1px solid "+GOLDDIM,color:GOLDDIM,padding:"8px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>
                  + NEW MUSIC VIDEO
                </button>
              </div>
            </div>
          )}

          {/* Canvas for rendering (always hidden) */}
          {!videoUrl&&<canvas ref={canvasRef} style={{display:"none"}}/>}
        </div>

        {/* Bottom nav */}
        {!videoUrl&&(
          <div style={{borderTop:"1px solid "+GOLDDIM+"",padding:"10px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <button onClick={()=>setStep(s=>Math.max(1,s-1))} disabled={step===1} style={{background:"transparent",border:"1px solid "+GOLD,color:GOLD,padding:"6px 16px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",opacity:step===1?0.3:1}}>◀ BACK</button>
            <span style={{color:GOLDDIM,fontSize:10,letterSpacing:2}}>STEP {step} OF 6</span>
            {step<6
              ?<button onClick={()=>setStep(s=>Math.min(6,s+1))} style={{background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",padding:"6px 16px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>NEXT ▶</button>
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
    // iOS Safari fix — keepalive ping every 10s
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
              <div key={v.id} onClick={()=>setSelVoice(v.id)} style={{padding:"10px 12px",marginBottom:4,background:selVoice===v.id?"#0a0800":"#000",border:"2px solid "+selVoice===v.id?GOLD:GOLDDIM,cursor:"pointer"}}>
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
;



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

  // ════════════════════════════════════════════════════════════════
  // MANDASTRONG ENGINE v2 — CINEMA-GRADE RENDERER
  // Real depth, real volumetric lighting, real atmosphere, real motion
  // ════════════════════════════════════════════════════════════════
  const generateVideo=async()=>{
    if(!prompt.trim()){alert("Describe your scene first");return;}
    setGenerating(true);setProgress(0);setLog([]);setVideoUrl("");setSaved(false);
    addLog("MandaStrong Engine v2 — Cinema-grade renderer initialising...");
    setProgress(5);

    const pr=prompt.toLowerCase();
    const styleId=renderStyle||"photorealistic";

    // SCENE INTELLIGENCE — comprehensive prompt reading
    const scene={
      // TIME OF DAY
      isNight:/night|dark|moon|evening|dusk|midnight|stars|nocturnal/.test(pr),
      isGolden:/golden|sunset|sunrise|dusk|dawn|amber|warm light|magic hour/.test(pr),
      isDay:/day|noon|bright|sunlit|sunny|midday|afternoon/.test(pr),
      isDawn:/dawn|sunrise|first light|early morning/.test(pr),
      // ENVIRONMENT — natural
      isOcean:/ocean|sea|water|wave|shore|coast|lake|river|stream|tide|bay/.test(pr),
      isWaterfall:/waterfall|cascade|falls/.test(pr),
      isUnderwater:/underwater|beneath|submerged|diving|reef|coral|fish|whale|shark/.test(pr),
      isBeach:/beach|sand|shore|coastline/.test(pr),
      isForest:/forest|tree|wood|jungle|grove|leaves|trunk|branch|foliage/.test(pr),
      isMountain:/mountain|peak|ridge|cliff|valley|hill|alpine|summit/.test(pr),
      isDesert:/desert|sand|dune|arid|sahara|cactus/.test(pr),
      isSavanna:/savanna|plain|grassland|prairie|steppe/.test(pr),
      isField:/field|crop|farm|meadow|pasture|wheat|corn/.test(pr),
      isFlowers:/flower|petal|blossom|garden|rose|bouquet/.test(pr),
      // ENVIRONMENT — built
      isCity:/city|urban|street|building|skyline|neon|town|road|alley|sidewalk|pavement/.test(pr),
      isIndoor:/room|interior|inside|window|wall|floor|ceiling|desk|kitchen|office|library|studio|bedroom|living/.test(pr),
      isCave:/cave|cavern|underground|grotto/.test(pr),
      isMuseum:/museum|gallery|exhibit/.test(pr),
      isHospital:/hospital|clinic|surgery|operating|medical/.test(pr),
      isClassroom:/classroom|school|teacher|chalkboard|whiteboard/.test(pr),
      isChurch:/church|cathedral|mosque|temple|chapel|altar|pew/.test(pr),
      isFactory:/factory|warehouse|industrial|mill|plant/.test(pr),
      isLab:/lab|laboratory|scientist|microscope|beaker/.test(pr),
      isStudio:/jazz club|concert|stage|microphone|nightclub/.test(pr),
      // SPACE
      isSpace:/space|galaxy|planet|cosmos|nebula|orbit|earth from/.test(pr),
      hasEarth:/earth|globe|world from|planet earth/.test(pr),
      hasStars:/star|stellar|cosmos|night sky/.test(pr),
      hasMoon:/moon|lunar/.test(pr),
      hasSun:/sun|solar|sunbeam/.test(pr),
      // WEATHER
      isRain:/rain|storm|wet|drizzle|downpour|raindrop/.test(pr),
      isFog:/fog|mist|haze|smoke|cloud/.test(pr),
      isSnow:/snow|winter|frost|ice|blizzard|snowflake|glacier/.test(pr),
      isWindy:/wind|breeze|gust|blowing/.test(pr),
      isStormy:/storm|thunder|lightning|tempest/.test(pr),
      // PEOPLE
      hasPerson:/woman|man|person|figure|human|people|girl|boy|child|soldier|farmer|worker|elderly|couple|crowd|surgeon|nurse|doctor|musician|scientist|monk|philosopher|teacher|student|priest|baby|adult/.test(pr),
      hasMultiplePeople:/people|crowd|couple|group|family|three|two|many|everyone|delegates|tourists|audience|spectators|marchers|protesters/.test(pr),
      hasCrowd:/crowd|audience|stadium|festival|congregation|throng|masses/.test(pr),
      hasElderly:/elderly|old|grandma|grandpa|grandmother|grandfather|aged|wise/.test(pr),
      hasChild:/child|kid|baby|infant|toddler|newborn|young/.test(pr),
      hasFamily:/family|parent|mother|father|mom|dad/.test(pr),
      // FACES
      isCloseup:/close up|close-up|closeup|macro|extreme close|face|eye|portrait/.test(pr),
      hasEye:/eye|iris|gaze|pupil/.test(pr),
      hasHand:/hand|finger|palm|grasp|reach/.test(pr),
      hasTears:/tears|crying|weeping|sobbing|tear/.test(pr),
      isSmiling:/smile|laugh|grin|joy|laughter/.test(pr),
      // POSE
      isSitting:/sit|seated|bench|chair|windowsill|crouch/.test(pr),
      isStanding:/stand|upright/.test(pr),
      isWalking:/walk|walking|stroll|step/.test(pr),
      isLying:/lying|bed|sleeping|resting/.test(pr),
      isSilhouette:/silhouette|back to camera|facing away|shadow figure|backlit/.test(pr),
      // LIGHT SOURCES
      hasCandle:/candle|flame|fire|torch|lantern|lamp|wick/.test(pr),
      hasFire:/fire|flame|blaze|burning|spark|inferno/.test(pr),
      hasNeon:/neon|glow|led|fluorescent/.test(pr),
      hasFirelight:/firelight|fireplace|hearth|bonfire/.test(pr),
      // INSTRUMENTS / OBJECTS
      hasGuitar:/guitar|fingerpick|strum/.test(pr),
      hasInstrument:/instrument|piano|violin|trumpet|drums|saxophone|flute|cello/.test(pr),
      hasBook:/book|page|reading|scroll|manuscript|library|tome/.test(pr),
      hasPhone:/phone|smartphone|screen|mobile/.test(pr),
      hasComputer:/computer|laptop|monitor|keyboard|server|terminal/.test(pr),
      hasBallot:/ballot|vote|election|polling/.test(pr),
      hasBench:/bench|park bench/.test(pr),
      hasPainting:/painting|fresco|mural|portrait|canvas/.test(pr),
      hasStatue:/statue|sculpture|marble|bust/.test(pr),
      hasChair:/chair|couch|sofa|seat|throne/.test(pr),
      hasTable:/table|desk|surface/.test(pr),
      hasFlag:/flag|banner/.test(pr),
      hasSign:/sign|placard|poster|billboard/.test(pr),
      hasFood:/food|meal|bread|wine|cup|plate|tea|coffee/.test(pr),
      hasClock:/clock|watch|hourglass|time/.test(pr),
      hasMap:/map|chart|globe|atlas/.test(pr),
      hasMicroscope:/microscope|telescope|lens/.test(pr),
      hasVaccine:/vaccine|syringe|needle|injection/.test(pr),
      hasMoney:/money|coin|cash|gold/.test(pr),
      hasJewel:/jewel|gem|crystal|diamond/.test(pr),
      // VEHICLES
      hasVehicle:/car|truck|vehicle|bus|train|bike|motorcycle/.test(pr),
      hasPlane:/plane|aircraft|jet|airline/.test(pr),
      hasShip:/ship|boat|vessel|sail/.test(pr),
      hasRocket:/rocket|spacecraft|saturn|apollo|launch/.test(pr),
      // ANIMALS
      hasAnimal:/animal|dog|cat|horse|bird|deer|fox|wolf|bear/.test(pr),
      hasBird:/bird|eagle|pigeon|dove|sparrow|crow/.test(pr),
      hasFish:/fish|whale|shark|coral/.test(pr),
      hasInsect:/butterfly|bee|moth|insect/.test(pr),
      // ATMOSPHERE
      hasAutumn:/autumn|fall|leaves falling|orange leaves|yellow leaves/.test(pr),
      hasSpring:/spring|bloom|blossom|fresh/.test(pr),
      hasSummer:/summer|hot|tropical/.test(pr),
      hasDust:/dust|particle|sand storm/.test(pr),
      hasSmoke:/smoke|smog|haze|chimney/.test(pr),
      hasSteam:/steam|vapour|hot air|breath visible/.test(pr),
      // CAMERA
      isAerial:/aerial|above|drone|overhead|bird|sky view|top down/.test(pr),
      isWideShot:/wide|landscape|vista|panorama/.test(pr),
      isLowAngle:/low angle|looking up|ground level/.test(pr),
      isCloseup:/close up|close-up|closeup|macro|extreme close/.test(pr),
      // ERA
      isAncient:/ancient|prehistoric|caveman|stone age|paleolithic|neolithic|40,000/.test(pr),
      isMedieval:/medieval|knight|castle|dark ages/.test(pr),
      isVictorian:/victorian|19th century|1800s/.test(pr),
      isRetro:/1950s|1960s|1970s|retro|vintage|old film/.test(pr),
      isModern:/modern|today|2024|2025|present day|contemporary/.test(pr),
      isFuture:/future|sci-fi|futuristic|quantum/.test(pr),
      // SPECIFIC SCENES from AI For Humanity
      hasHieroglyph:/hieroglyph|egyptian|pyramid/.test(pr),
      hasAqueduct:/aqueduct|roman/.test(pr),
      hasPrintingPress:/printing press|gutenberg|press/.test(pr),
      hasTelescope:/hubble|telescope|deep field/.test(pr),
      hasGlacier:/glacier|melt|arctic/.test(pr),
      hasCoral:/coral|reef|bleaching/.test(pr),
      hasSolarPanel:/solar panel|wind turbine|renewable/.test(pr),
      hasMarch:/march|protest|sign|placard/.test(pr),
      hasMonk:/monk|meditat|buddh|prayer/.test(pr),
      hasMartianSunset:/mars|martian|red planet/.test(pr),
      hasMoonLanding:/apollo|moon landing|lunar|armstrong/.test(pr),
      // MOOD
      isHopeful:/hope|hopeful|joyful|celebrat|triumph|victory/.test(pr),
      isMelancholic:/melancholic|sad|grief|sorrow|loss|lonely/.test(pr),
      isTense:/tense|anxious|fear|dread|nervous/.test(pr),
      isPeaceful:/peaceful|calm|serene|tranquil|still/.test(pr),
    };

    // STYLE GRADES — proper colour science
    const grades={
      photorealistic:{tint:[8,4,0],alpha:0.04,contrast:1.0,saturation:1.0},
      cinematic:{tint:[0,12,20],alpha:0.08,contrast:1.15,saturation:0.9},
      documentary:{tint:[18,9,0],alpha:0.05,contrast:1.05,saturation:1.0},
      noir:{tint:[0,0,0],alpha:0.0,contrast:1.35,saturation:0.0},
      golden:{tint:[32,16,0],alpha:0.1,contrast:1.1,saturation:1.2},
      scifi:{tint:[0,5,22],alpha:0.08,contrast:1.2,saturation:0.85},
      horror:{tint:[0,8,4],alpha:0.08,contrast:1.25,saturation:0.7},
      animated:{tint:[5,0,12],alpha:0.05,contrast:1.1,saturation:1.4},
    };
    const grade=grades[styleId]||grades.photorealistic;

    addLog("Scene analysed: "+Object.keys(scene).filter(k=>scene[k]).join(", ").slice(0,80));
    setProgress(15);

    // ════════════════════════════════════════════════════════════
    // THE RENDERER — every frame, every layer
    // ════════════════════════════════════════════════════════════
    const drawFn=(ctx,W,H,t,sec)=>{
      ctx.globalCompositeOperation="source-over";
      ctx.globalAlpha=1;

      // ── CAMERA: cinematic push-in with subtle drift ─────────
      const pushIn=1+t*0.05;
      const driftX=Math.sin(sec*0.08)*8;
      const driftY=Math.cos(sec*0.06)*4;
      ctx.save();
      ctx.translate(W/2+driftX,H/2+driftY);
      ctx.scale(pushIn,pushIn);
      ctx.translate(-W/2,-H/2);

      // ─────────────────────────────────────────────────────────
      // LAYER 1: SKY / BACKGROUND
      // ─────────────────────────────────────────────────────────
      if(scene.isSpace){
        // Deep space with layered nebulae and 400+ stars
        const sky=ctx.createLinearGradient(0,0,W,H);
        sky.addColorStop(0,"rgb(2,1,12)");
        sky.addColorStop(0.5,"rgb(4,2,18)");
        sky.addColorStop(1,"rgb(1,1,8)");
        ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
        // Nebula clouds
        for(let n=0;n<3;n++){
          const nx=W*(0.2+n*0.3)+Math.sin(sec*0.02+n)*30;
          const ny=H*(0.3+(n%2)*0.3);
          const ng=ctx.createRadialGradient(nx,ny,0,nx,ny,W*0.3);
          const cols=[[140,40,180],[40,80,180],[180,60,100]];
          const col=cols[n%3];
          ng.addColorStop(0,"rgba("+col[0]+","+col[1]+","+col[2]+",0.12)");
          ng.addColorStop(0.5,"rgba("+col[0]+","+col[1]+","+col[2]+",0.04)");
          ng.addColorStop(1,"rgba(0,0,0,0)");
          ctx.fillStyle=ng;ctx.fillRect(0,0,W,H);
        }
        // Star layers — far, mid, near with parallax
        for(let layer=0;layer<3;layer++){
          const count=layer===0?250:layer===1?100:40;
          const speed=layer===0?0.02:layer===1?0.08:0.18;
          const baseSize=layer===0?0.6:layer===1?1.2:2.0;
          for(let s=0;s<count;s++){
            const sx=((s*137.5+sec*speed*W)%W+W)%W;
            const sy=(s*97.3*layer*1.7)%H;
            const flicker=0.4+Math.sin(sec*(1.2+layer*0.5)+s*0.7)*0.35;
            const size=baseSize*flicker;
            ctx.fillStyle="rgba(245,245,255,"+flicker+")";
            ctx.fillRect(sx,sy,size,size);
            // Bright stars get a glow
            if(layer===2&&s%4===0){
              const glow=ctx.createRadialGradient(sx,sy,0,sx,sy,size*4);
              glow.addColorStop(0,"rgba(255,255,250,0.4)");
              glow.addColorStop(1,"rgba(255,255,250,0)");
              ctx.fillStyle=glow;ctx.fillRect(sx-size*4,sy-size*4,size*8,size*8);
            }
          }
        }
        // Earth if mentioned
        if(/earth/.test(pr)){
          const ex=W*0.5,ey=H*0.5;
          const er=H*0.32;
          // Atmosphere glow
          const atm=ctx.createRadialGradient(ex,ey,er*0.95,ex,ey,er*1.15);
          atm.addColorStop(0,"rgba(120,170,230,0.6)");
          atm.addColorStop(1,"rgba(120,170,230,0)");
          ctx.fillStyle=atm;ctx.beginPath();ctx.arc(ex,ey,er*1.15,0,Math.PI*2);ctx.fill();
          // Ocean base
          const ocean=ctx.createRadialGradient(ex-er*0.3,ey-er*0.3,0,ex,ey,er);
          ocean.addColorStop(0,"rgb(70,140,200)");
          ocean.addColorStop(0.6,"rgb(20,60,120)");
          ocean.addColorStop(1,"rgb(5,20,50)");
          ctx.fillStyle=ocean;ctx.beginPath();ctx.arc(ex,ey,er,0,Math.PI*2);ctx.fill();
          // Continents (procedural blobs)
          ctx.save();ctx.beginPath();ctx.arc(ex,ey,er,0,Math.PI*2);ctx.clip();
          ctx.rotate(sec*0.03);
          for(let cont=0;cont<8;cont++){
            const cx=ex+Math.cos(cont*0.8)*er*0.6;
            const cy=ey+Math.sin(cont*1.3)*er*0.5;
            const cr=er*(0.15+cont%3*0.06);
            const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,cr);
            cg.addColorStop(0,"rgba(80,110,50,0.9)");
            cg.addColorStop(1,"rgba(40,70,30,0)");
            ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,cr,0,Math.PI*2);ctx.fill();
          }
          // Night side city lights
          const night=ctx.createRadialGradient(ex+er*0.5,ey+er*0.3,0,ex+er*0.5,ey+er*0.3,er*0.8);
          night.addColorStop(0,"rgba(0,0,0,0)");
          night.addColorStop(0.5,"rgba(0,0,0,0.5)");
          night.addColorStop(1,"rgba(0,0,0,0.85)");
          ctx.fillStyle=night;ctx.beginPath();ctx.arc(ex,ey,er,0,Math.PI*2);ctx.fill();
          // City light dots on night side
          for(let cl=0;cl<60;cl++){
            const ang=cl*0.4;
            const dist=er*(0.3+(cl%5)*0.12);
            const lx=ex+Math.cos(ang)*dist;
            const ly=ey+Math.sin(ang)*dist;
            if(lx>ex+er*0.2){
              ctx.fillStyle="rgba(255,200,100,"+(0.5+Math.sin(sec*2+cl)*0.3)+")";
              ctx.fillRect(lx,ly,1.5,1.5);
            }
          }
          ctx.restore();
          // Cloud band
          ctx.save();ctx.beginPath();ctx.arc(ex,ey,er,0,Math.PI*2);ctx.clip();
          for(let cb=0;cb<5;cb++){
            const cbg=ctx.createLinearGradient(0,ey-er*0.3+cb*er*0.15,0,ey-er*0.3+cb*er*0.15+30);
            cbg.addColorStop(0,"rgba(255,255,255,0)");
            cbg.addColorStop(0.5,"rgba(255,255,255,0.15)");
            cbg.addColorStop(1,"rgba(255,255,255,0)");
            ctx.fillStyle=cbg;ctx.fillRect(ex-er,ey-er*0.3+cb*er*0.15+Math.sin(sec*0.1+cb)*10,er*2,30);
          }
          ctx.restore();
        }
      } else if(scene.isNight||styleId==="noir"){
        // Night sky with proper gradient and stars
        const sky=ctx.createLinearGradient(0,0,0,H*0.7);
        if(styleId==="noir"){
          sky.addColorStop(0,"rgb(3,3,4)");
          sky.addColorStop(1,"rgb(10,10,12)");
        } else {
          sky.addColorStop(0,"rgb(2,4,18)");
          sky.addColorStop(0.4,"rgb(5,10,38)");
          sky.addColorStop(0.8,"rgb(12,22,58)");
          sky.addColorStop(1,"rgb(18,28,72)");
        }
        ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
        if(styleId!=="noir"){
          // Stars with twinkle
          for(let s=0;s<280;s++){
            const sx=(s*137.5)%W;
            const sy=(s*97.3)%(H*0.6);
            const br=0.25+Math.sin(sec*0.7+s*0.4)*0.25;
            const sz=s%7===0?1.8:s%3===0?1.2:0.7;
            ctx.fillStyle="rgba(245,245,255,"+br+")";
            ctx.fillRect(sx,sy,sz,sz);
            if(s%7===0){
              const g=ctx.createRadialGradient(sx,sy,0,sx,sy,sz*5);
              g.addColorStop(0,"rgba(255,255,250,0.35)");
              g.addColorStop(1,"rgba(255,255,250,0)");
              ctx.fillStyle=g;ctx.fillRect(sx-sz*5,sy-sz*5,sz*10,sz*10);
            }
          }
          // Moon
          if(/moon/.test(pr)||scene.isOcean){
            const mx=W*0.75,my=H*0.15;
            // Halo
            const halo=ctx.createRadialGradient(mx,my,0,mx,my,H*0.25);
            halo.addColorStop(0,"rgba(255,255,235,0.25)");
            halo.addColorStop(0.4,"rgba(255,255,225,0.1)");
            halo.addColorStop(1,"rgba(255,255,200,0)");
            ctx.fillStyle=halo;ctx.fillRect(mx-H*0.25,my-H*0.25,H*0.5,H*0.5);
            // Moon body
            const moon=ctx.createRadialGradient(mx-H*0.018,my-H*0.018,0,mx,my,H*0.075);
            moon.addColorStop(0,"rgba(255,255,250,1)");
            moon.addColorStop(0.6,"rgba(245,245,220,0.95)");
            moon.addColorStop(0.95,"rgba(220,220,195,0.7)");
            moon.addColorStop(1,"rgba(180,180,160,0)");
            ctx.fillStyle=moon;ctx.beginPath();ctx.arc(mx,my,H*0.078,0,Math.PI*2);ctx.fill();
            // Crater details
            for(let cr=0;cr<6;cr++){
              const cax=mx+(cr%3-1)*H*0.02;
              const cay=my+Math.floor(cr/3)*H*0.018-H*0.01;
              ctx.fillStyle="rgba(180,180,165,0.15)";
              ctx.beginPath();ctx.arc(cax,cay,H*0.008,0,Math.PI*2);ctx.fill();
            }
          }
        }
      } else if(scene.isGolden){
        // Golden hour with proper layered sky
        const sky=ctx.createLinearGradient(0,0,0,H*0.7);
        sky.addColorStop(0,"rgb(28,15,45)");
        sky.addColorStop(0.2,"rgb(95,35,55)");
        sky.addColorStop(0.45,"rgb(195,75,30)");
        sky.addColorStop(0.7,"rgb(250,140,40)");
        sky.addColorStop(0.9,"rgb(255,200,80)");
        sky.addColorStop(1,"rgb(255,225,140)");
        ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
        // Sun
        const sunX=W*0.55,sunY=H*0.52;
        const sunGlow=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,H*0.35);
        sunGlow.addColorStop(0,"rgba(255,255,210,0.95)");
        sunGlow.addColorStop(0.15,"rgba(255,210,90,0.7)");
        sunGlow.addColorStop(0.4,"rgba(255,150,40,0.35)");
        sunGlow.addColorStop(0.8,"rgba(255,90,20,0.1)");
        sunGlow.addColorStop(1,"rgba(255,90,0,0)");
        ctx.fillStyle=sunGlow;ctx.fillRect(0,0,W,H);
        // Sun body
        const sun=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,H*0.06);
        sun.addColorStop(0,"rgba(255,255,235,1)");
        sun.addColorStop(0.7,"rgba(255,230,140,0.95)");
        sun.addColorStop(1,"rgba(255,180,80,0)");
        ctx.fillStyle=sun;ctx.beginPath();ctx.arc(sunX,sunY,H*0.06,0,Math.PI*2);ctx.fill();
        // Cloud streaks lit from below
        for(let cl=0;cl<5;cl++){
          const cly=H*(0.15+cl*0.08);
          const cg=ctx.createLinearGradient(0,cly,W,cly);
          cg.addColorStop(0,"rgba(180,80,40,0)");
          cg.addColorStop(0.5,"rgba(255,180,100,0.4)");
          cg.addColorStop(1,"rgba(180,80,40,0)");
          ctx.fillStyle=cg;
          ctx.beginPath();
          for(let x=0;x<=W;x+=4){
            const y=cly+Math.sin(x*0.005+sec*0.05+cl)*8;
            x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
          }
          for(let x=W;x>=0;x-=4){
            const y=cly+12+Math.sin(x*0.005+sec*0.05+cl)*8;
            ctx.lineTo(x,y);
          }
          ctx.closePath();ctx.fill();
        }
      } else if(scene.isDay||!scene.isIndoor){
        // Day sky
        const sky=ctx.createLinearGradient(0,0,0,H*0.65);
        sky.addColorStop(0,"rgb(85,140,205)");
        sky.addColorStop(0.5,"rgb(135,180,225)");
        sky.addColorStop(1,"rgb(195,220,240)");
        ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
        // Clouds with parallax
        for(let cl=0;cl<6;cl++){
          const cx=((W*0.1+cl*W*0.22+sec*0.5)%W+W)%W;
          const cy=H*0.05+cl*H*0.04;
          const cr=W*0.09+(cl%3)*W*0.03;
          const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,cr);
          cg.addColorStop(0,"rgba(255,255,255,0.92)");
          cg.addColorStop(0.5,"rgba(250,250,250,0.5)");
          cg.addColorStop(1,"rgba(255,255,255,0)");
          ctx.fillStyle=cg;ctx.fillRect(cx-cr,cy-cr*0.6,cr*2,cr*1.2);
        }
      }

      // ─────────────────────────────────────────────────────────
      // LAYER 2: GROUND / TERRAIN / ENVIRONMENT
      // ─────────────────────────────────────────────────────────
      const horizY=scene.isIndoor?H:scene.isAerial?H*0.7:H*0.58;

      if(!scene.isIndoor&&!scene.isSpace){
        if(scene.isOcean){
          // Multi-layer animated ocean with reflections
          for(let w=0;w<12;w++){
            const yBase=horizY+w*12;
            const wg=ctx.createLinearGradient(0,yBase,0,H);
            const intensity=scene.isNight?[2+w*1.8,8+w*5,28+w*8]:scene.isGolden?[80-w*3,40+w*2,15+w]:[0+w*4,55+w*10,115+w*8];
            wg.addColorStop(0,"rgba("+intensity[0]+","+intensity[1]+","+intensity[2]+","+(0.7+w*0.025)+")");
            wg.addColorStop(1,"rgba(1,3,8,0.96)");
            ctx.fillStyle=wg;
            ctx.beginPath();ctx.moveTo(-10,H);
            for(let x=0;x<=W+10;x+=3){
              const wave1=Math.sin(x*0.007+sec*(0.2+w*0.06)+w*1.3)*16;
              const wave2=Math.sin(x*0.022+sec*0.4+w*0.7)*7;
              const wave3=Math.sin(x*0.05+sec*0.8+w)*3;
              const y=yBase+wave1+wave2+wave3;
              ctx.lineTo(x,y);
            }
            ctx.lineTo(W+10,H);ctx.closePath();ctx.fill();
          }
          // Moon reflection on water
          if(scene.isNight&&/moon/.test(pr)){
            const refX=W*0.75;
            for(let r=0;r<8;r++){
              const ry=horizY+r*14;
              const shimmer=Math.sin(sec*2+r*0.5)*0.3+0.5;
              const refG=ctx.createLinearGradient(refX-25-r*3,ry,refX+25+r*3,ry);
              refG.addColorStop(0,"rgba(255,255,230,0)");
              refG.addColorStop(0.5,"rgba(255,255,220,"+(0.25*shimmer*(1-r/8))+")");
              refG.addColorStop(1,"rgba(255,255,230,0)");
              ctx.fillStyle=refG;
              ctx.fillRect(refX-25-r*3,ry,50+r*6,4);
            }
          }
          // Sun reflection
          if(scene.isGolden){
            const refX=W*0.55;
            for(let r=0;r<10;r++){
              const ry=horizY+r*10;
              const refG=ctx.createLinearGradient(refX-30,ry,refX+30,ry);
              refG.addColorStop(0,"rgba(255,180,80,0)");
              refG.addColorStop(0.5,"rgba(255,210,110,"+(0.35*(1-r/10))+")");
              refG.addColorStop(1,"rgba(255,180,80,0)");
              ctx.fillStyle=refG;ctx.fillRect(refX-30,ry,60,5);
            }
          }
        } else if(scene.isCity){
          // City with depth — back buildings, mid, foreground
          const grd=ctx.createLinearGradient(0,horizY,0,H);
          grd.addColorStop(0,scene.isNight?"rgb(10,10,16)":"rgb(40,42,46)");
          grd.addColorStop(1,scene.isNight?"rgb(4,4,8)":"rgb(20,22,28)");
          ctx.fillStyle=grd;ctx.fillRect(0,horizY,W,H-horizY);
          // 3 layers of buildings
          for(let layer=0;layer<3;layer++){
            const layerY=horizY-(2-layer)*H*0.04;
            const opacity=0.5+layer*0.25;
            const heightMult=0.6+layer*0.4;
            for(let b=0;b<22;b++){
              const bx=(b*131+layer*47)%W;
              const bh=(H*0.12+((b*97)%H)*0.3)*heightMult;
              const bw=W*0.03+((b*53)%W)*0.025;
              const bg=ctx.createLinearGradient(bx,layerY-bh,bx+bw,layerY);
              if(scene.isNight){
                bg.addColorStop(0,"rgba(8,8,16,"+opacity+")");
                bg.addColorStop(1,"rgba(15,15,25,"+opacity+")");
              } else {
                bg.addColorStop(0,"rgba(55,60,70,"+opacity+")");
                bg.addColorStop(1,"rgba(35,38,46,"+opacity+")");
              }
              ctx.fillStyle=bg;ctx.fillRect(bx,layerY-bh,bw,bh);
              // Windows
              if(scene.isNight&&layer>=1){
                for(let wy=0;wy<Math.floor(bh/20);wy++){
                  for(let wx=0;wx<Math.floor(bw/11);wx++){
                    if(Math.sin(b*13+wy*7+wx*11+layer)>0.15){
                      const lit=Math.sin(sec*0.4+b+wy*2+wx)>-0.4;
                      ctx.fillStyle=lit?"rgba(255,235,160,"+(0.7+layer*0.1)+")":"rgba(25,25,35,0.6)";
                      ctx.fillRect(bx+wx*11+2,layerY-bh+wy*20+5,7,11);
                    }
                  }
                }
              }
            }
          }
          // Wet street reflections
          if(scene.isRain){
            const wet=ctx.createLinearGradient(0,horizY+10,0,H);
            wet.addColorStop(0,"rgba(40,50,80,0.3)");
            wet.addColorStop(1,"rgba(15,20,40,0.8)");
            ctx.fillStyle=wet;ctx.fillRect(0,horizY+10,W,H-horizY-10);
            // Reflected window lights smeared
            for(let r=0;r<40;r++){
              const rx=(r*47)%W;
              const ry=horizY+20+(r%5)*30;
              ctx.fillStyle="rgba(255,200,120,"+(0.1+Math.sin(sec*0.5+r)*0.05)+")";
              ctx.fillRect(rx,ry,4,40);
            }
          }
        } else if(scene.isForest){
          // Forest with depth — back trees, mid, foreground
          for(let layer=0;layer<3;layer++){
            const layerY=horizY-(2-layer)*H*0.03;
            const treeCount=15-layer*3;
            for(let tr=0;tr<treeCount;tr++){
              const tx=((tr*151)+layer*37)%W;
              const th=H*(0.18+layer*0.06+(tr%5)*0.04);
              const tw=W*(0.012+layer*0.004);
              ctx.fillStyle="rgba("+(15+layer*8+tr%5*3)+","+(28+layer*10+tr%4*4)+","+(10+layer*5)+",0.95)";
              ctx.fillRect(tx,layerY-th,tw,th);
              // Foliage
              const fg=ctx.createRadialGradient(tx+tw/2,layerY-th+H*0.02,0,tx+tw/2,layerY-th+H*0.02,H*0.1);
              fg.addColorStop(0,"rgba("+(14+layer*10)+","+(55+layer*15)+","+(12+layer*6)+",0.92)");
              fg.addColorStop(0.6,"rgba("+(8+layer*6)+","+(35+layer*10)+","+(7+layer*3)+",0.6)");
              fg.addColorStop(1,"rgba(5,18,4,0)");
              ctx.fillStyle=fg;ctx.fillRect(tx-H*0.1,layerY-th-H*0.06,H*0.2,H*0.18);
            }
          }
          // Light shafts through trees
          if(scene.isDay||scene.isGolden){
            for(let ls=0;ls<6;ls++){
              const lsx=W*(0.1+ls*0.15);
              const lg=ctx.createLinearGradient(lsx,0,lsx,horizY);
              lg.addColorStop(0,"rgba(255,230,160,0.18)");
              lg.addColorStop(0.5,"rgba(255,210,140,0.08)");
              lg.addColorStop(1,"rgba(255,200,120,0)");
              ctx.fillStyle=lg;
              ctx.save();ctx.translate(lsx,0);ctx.rotate(0.15);
              ctx.fillRect(-15,0,30,horizY);ctx.restore();
            }
          }
        } else if(scene.isMountain){
          // Mountain ranges with proper distance fading
          for(let m=0;m<5;m++){
            const layerY=horizY-(4-m)*H*0.05;
            const opacity=0.4+m*0.15;
            ctx.fillStyle="rgba("+(45-m*3)+","+(48-m*3)+","+(58-m*2)+","+opacity+")";
            ctx.beginPath();ctx.moveTo(0,layerY);
            for(let x=0;x<=W;x+=15){
              const y=layerY-H*0.15*Math.sin(x*0.005+m*1.3)-H*0.08*Math.sin(x*0.012+m*0.7)-(m%2)*H*0.04;
              ctx.lineTo(x,y);
            }
            ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
          }
        } else if(scene.isSavanna){
          // Savanna ground
          const gg=ctx.createLinearGradient(0,horizY,0,H);
          gg.addColorStop(0,scene.isGolden?"rgb(155,105,45)":"rgb(125,105,55)");
          gg.addColorStop(0.5,scene.isGolden?"rgb(95,65,28)":"rgb(85,70,35)");
          gg.addColorStop(1,scene.isGolden?"rgb(45,28,12)":"rgb(40,32,18)");
          ctx.fillStyle=gg;ctx.fillRect(0,horizY,W,H-horizY);
          // Acacia tree silhouettes
          for(let at=0;at<4;at++){
            const tx=W*(0.15+at*0.22);
            ctx.fillStyle=scene.isGolden?"rgba(20,12,5,0.9)":"rgba(25,20,10,0.9)";
            ctx.fillRect(tx-2,horizY-H*0.12,4,H*0.12);
            // Canopy
            ctx.beginPath();
            ctx.ellipse(tx,horizY-H*0.12,H*0.05,H*0.018,0,0,Math.PI*2);
            ctx.fill();
          }
        } else {
          // Generic ground
          const gg=ctx.createLinearGradient(0,horizY,0,H);
          gg.addColorStop(0,scene.isGolden?"rgb(105,72,32)":scene.isNight?"rgb(18,20,15)":"rgb(40,50,28)");
          gg.addColorStop(1,scene.isGolden?"rgb(48,32,12)":scene.isNight?"rgb(8,10,6)":"rgb(18,25,12)");
          ctx.fillStyle=gg;ctx.fillRect(0,horizY,W,H-horizY);
        }
      }

      // ─────────────────────────────────────────────────────────
      // LAYER 3: INDOOR ROOM
      // ─────────────────────────────────────────────────────────
      if(scene.isIndoor){
        // Wall with depth
        const wall=ctx.createRadialGradient(W*0.5,H*0.4,0,W*0.5,H*0.5,W*0.7);
        wall.addColorStop(0,"rgb(15,11,7)");
        wall.addColorStop(0.6,"rgb(8,6,4)");
        wall.addColorStop(1,"rgb(3,2,1)");
        ctx.fillStyle=wall;ctx.fillRect(0,0,W,H);
        // Floor with wood grain
        const fl=ctx.createLinearGradient(0,H*0.62,0,H);
        fl.addColorStop(0,"rgb(25,17,10)");
        fl.addColorStop(1,"rgb(8,5,3)");
        ctx.fillStyle=fl;ctx.fillRect(0,H*0.62,W,H*0.38);
        // Wood planks
        for(let p=0;p<8;p++){
          ctx.strokeStyle="rgba(50,32,15,0.4)";
          ctx.lineWidth=1;
          ctx.beginPath();
          const py=H*0.62+p*H*0.05;
          ctx.moveTo(0,py);ctx.lineTo(W,py);ctx.stroke();
        }
        // Window with view through
        const wox=W*0.1,woy=H*0.05,wow=W*0.48,woh=H*0.72;
        if(scene.isNight){
          const ws=ctx.createLinearGradient(wox,woy,wox,woy+woh);
          ws.addColorStop(0,"rgb(2,4,18)");
          ws.addColorStop(0.5,"rgb(5,12,38)");
          ws.addColorStop(1,"rgb(8,18,52)");
          ctx.fillStyle=ws;ctx.fillRect(wox,woy,wow,woh);
          // Stars through window
          for(let s=0;s<60;s++){
            const sx=wox+(s*47)%wow;
            const sy=woy+(s*31)%(woh*0.5);
            ctx.fillStyle="rgba(245,245,255,"+(0.4+Math.sin(sec*0.8+s)*0.3)+")";
            ctx.fillRect(sx,sy,s%4===0?1.4:0.7,s%4===0?1.4:0.7);
          }
          // Moon through window
          if(/moon/.test(pr)){
            const mwx=wox+wow*0.7,mwy=woy+woh*0.2;
            const halo=ctx.createRadialGradient(mwx,mwy,0,mwx,mwy,woh*0.15);
            halo.addColorStop(0,"rgba(255,255,230,0.3)");
            halo.addColorStop(1,"rgba(255,255,230,0)");
            ctx.fillStyle=halo;ctx.fillRect(mwx-woh*0.15,mwy-woh*0.15,woh*0.3,woh*0.3);
            const moon=ctx.createRadialGradient(mwx,mwy,0,mwx,mwy,woh*0.06);
            moon.addColorStop(0,"rgba(255,255,250,1)");
            moon.addColorStop(0.8,"rgba(240,240,215,0.9)");
            moon.addColorStop(1,"rgba(200,200,180,0)");
            ctx.fillStyle=moon;ctx.beginPath();ctx.arc(mwx,mwy,woh*0.062,0,Math.PI*2);ctx.fill();
          }
          // Ocean through window
          if(scene.isOcean){
            for(let w=0;w<5;w++){
              const wg2=ctx.createLinearGradient(0,woy+woh*0.55+w*9,0,woy+woh);
              wg2.addColorStop(0,"rgba(3,10,38,0.85)");
              wg2.addColorStop(1,"rgba(1,3,12,0.96)");
              ctx.fillStyle=wg2;
              ctx.beginPath();ctx.moveTo(wox,woy+woh);
              for(let x=wox;x<=wox+wow;x+=3){
                const y=woy+woh*0.6+w*10+Math.sin(x*0.012+sec*0.25+w)*9;
                ctx.lineTo(x,y);
              }
              ctx.lineTo(wox+wow,woy+woh);ctx.closePath();ctx.fill();
            }
          }
        } else if(scene.isGolden){
          const ws=ctx.createLinearGradient(wox,woy,wox,woy+woh);
          ws.addColorStop(0,"rgb(180,90,40)");
          ws.addColorStop(0.5,"rgb(245,160,60)");
          ws.addColorStop(1,"rgb(255,210,110)");
          ctx.fillStyle=ws;ctx.fillRect(wox,woy,wow,woh);
        } else {
          const ws=ctx.createLinearGradient(wox,woy,wox,woy+woh);
          ws.addColorStop(0,"rgb(140,180,220)");
          ws.addColorStop(1,"rgb(200,225,240)");
          ctx.fillStyle=ws;ctx.fillRect(wox,woy,wow,woh);
        }
        // Window frame
        ctx.strokeStyle="rgba(55,35,18,0.95)";ctx.lineWidth=12;
        ctx.strokeRect(wox,woy,wow,woh);
        ctx.beginPath();ctx.moveTo(wox+wow*0.5,woy);ctx.lineTo(wox+wow*0.5,woy+woh);ctx.stroke();
        ctx.beginPath();ctx.moveTo(wox,woy+woh*0.5);ctx.lineTo(wox+wow,woy+woh*0.5);ctx.stroke();
        // Curtains with proper drape
        for(let ci=0;ci<2;ci++){
          const cxb=wox+(ci===0?-W*0.02:wow+W*0.02);
          const cg=ctx.createLinearGradient(cxb,woy,cxb+22,woy+woh);
          cg.addColorStop(0,"rgba(145,125,100,0.7)");
          cg.addColorStop(0.5,"rgba(100,85,68,0.55)");
          cg.addColorStop(1,"rgba(70,58,45,0.4)");
          ctx.fillStyle=cg;
          ctx.beginPath();ctx.moveTo(cxb,woy);
          ctx.bezierCurveTo(
            cxb+Math.sin(sec*0.35+ci)*15,woy+woh*0.3,
            cxb+Math.sin(sec*0.35+1+ci)*20,woy+woh*0.65,
            cxb+Math.sin(sec*0.35+2+ci)*12,woy+woh
          );
          ctx.lineTo(cxb+25,woy+woh);ctx.lineTo(cxb+25,woy);ctx.closePath();ctx.fill();
        }
        // Couch silhouette
        if(/couch|sofa/.test(pr)){
          const sx=W*0.65,sy=H*0.55;
          ctx.fillStyle="rgba(38,25,15,0.92)";
          ctx.fillRect(sx,sy,W*0.28,H*0.18);
          ctx.fillRect(sx-W*0.005,sy,W*0.01,H*0.22);
          ctx.fillRect(sx+W*0.28,sy,W*0.01,H*0.22);
          ctx.fillStyle="rgba(28,18,10,0.94)";
          ctx.fillRect(sx,sy-H*0.05,W*0.28,H*0.06);
        }
        // Coat on hook
        if(/coat|hook|hung|jacket/.test(pr)){
          ctx.fillStyle="rgba(45,30,15,0.95)";
          ctx.fillRect(W*0.78,H*0.18,W*0.006,H*0.05);
          ctx.fillRect(W*0.77,H*0.23,W*0.025,H*0.2);
          ctx.fillStyle="rgba(28,18,10,0.95)";
          ctx.fillRect(W*0.77,H*0.23,W*0.025,H*0.01);
        }
      }

      // ─────────────────────────────────────────────────────────
      // LAYER 4: VOLUMETRIC LIGHT (CANDLE / FIRE)
      // ─────────────────────────────────────────────────────────
      if(scene.hasCandle){
        const candX=scene.isIndoor?W*0.72:W*0.5;
        const candY=scene.isIndoor?H*0.55:H*0.5;
        const flicker=0.85+Math.sin(sec*9.2)*0.08+Math.sin(sec*14.7)*0.05+Math.sin(sec*22.1)*0.03;
        // Candle body
        ctx.fillStyle="rgba(235,215,165,0.92)";
        ctx.fillRect(candX-5,candY,10,35);
        ctx.fillStyle="rgba(180,150,90,0.5)";
        ctx.fillRect(candX-5,candY,3,35);
        // Wick
        ctx.fillStyle="rgba(20,15,10,1)";
        ctx.fillRect(candX-0.5,candY-3,1,3);
        // Flame layers
        const flameH=22*flicker;
        // Outer flame (orange/red)
        const f1=ctx.createRadialGradient(candX,candY-flameH/2,0,candX,candY-flameH/2,flameH);
        f1.addColorStop(0,"rgba(255,180,40,0.7)");
        f1.addColorStop(0.5,"rgba(255,100,8,0.4)");
        f1.addColorStop(1,"rgba(255,60,0,0)");
        ctx.fillStyle=f1;
        ctx.beginPath();ctx.ellipse(candX,candY-flameH/2,flameH*0.4,flameH*0.7,0,0,Math.PI*2);ctx.fill();
        // Inner flame (yellow)
        const f2=ctx.createRadialGradient(candX,candY-flameH*0.6,0,candX,candY-flameH*0.6,flameH*0.5);
        f2.addColorStop(0,"rgba(255,255,220,0.95)");
        f2.addColorStop(0.4,"rgba(255,220,100,0.7)");
        f2.addColorStop(1,"rgba(255,180,50,0)");
        ctx.fillStyle=f2;
        ctx.beginPath();ctx.ellipse(candX,candY-flameH*0.6,flameH*0.2,flameH*0.4,0,0,Math.PI*2);ctx.fill();
        // Hot core (white)
        const f3=ctx.createRadialGradient(candX,candY-flameH*0.7,0,candX,candY-flameH*0.7,4);
        f3.addColorStop(0,"rgba(255,255,255,1)");
        f3.addColorStop(1,"rgba(255,255,200,0)");
        ctx.fillStyle=f3;ctx.fillRect(candX-4,candY-flameH*0.7-4,8,8);
        // Room glow
        const rg=ctx.createRadialGradient(candX,candY-flameH/2,0,candX,candY-flameH/2,W*0.4);
        rg.addColorStop(0,"rgba(255,150,40,0.15)");
        rg.addColorStop(0.3,"rgba(255,130,30,0.08)");
        rg.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
      }

      // ─────────────────────────────────────────────────────────
      // LAYER 5: HUMAN FIGURES
      // ─────────────────────────────────────────────────────────
      if(scene.hasPerson){
        const drawPerson=(fx,fy,opts)=>{
          const o=opts||{};
          const isSeated=o.seated||/sit|bench|windowsill|chair|crouch/.test(pr);
          const isElderly=o.elderly||scene.hasElderly;
          const breath=Math.sin(sec*0.9+(o.phase||0))*0.008;
          const sway=Math.sin(sec*0.4+(o.phase||0))*2;

          if(scene.isSilhouette||o.silhouette){
            ctx.fillStyle="rgba(2,1,1,0.97)";
            ctx.beginPath();ctx.ellipse(fx+sway,fy-H*0.13,H*0.034,H*0.042,0,0,Math.PI*2);ctx.fill();
            ctx.fillRect(fx-H*0.028+sway,fy-H*0.09,H*0.056,H*(0.15+breath*2));
            if(scene.hasGuitar||o.guitar){
              ctx.beginPath();ctx.ellipse(fx+H*0.072+sway,fy+H*0.02,H*0.05,H*0.064,0.22,0,Math.PI*2);ctx.fill();
              ctx.beginPath();ctx.ellipse(fx+H*0.07+sway,fy-H*0.045,H*0.04,H*0.05,0.22,0,Math.PI*2);ctx.fill();
              ctx.fillRect(fx+H*0.026+sway,fy-H*0.09,H*0.011,H*0.12);
            }
            ctx.fillRect(fx-H*0.022+sway,fy+H*0.06,H*0.018,H*(isSeated?0.06:0.22));
            ctx.fillRect(fx+H*0.004+sway,fy+H*0.06,H*0.018,H*(isSeated?0.06:0.22));
          } else {
            // Skin tone — varies by age
            const skinBase=isElderly?[210,170,135]:[230,180,140];
            const skinShadow=isElderly?[140,100,75]:[155,105,75];
            // Head with proper modelling
            const headG=ctx.createRadialGradient(fx-H*0.008+sway,fy-H*0.145,0,fx+sway,fy-H*0.13,H*0.045);
            headG.addColorStop(0,"rgba("+skinBase[0]+","+skinBase[1]+","+skinBase[2]+",1)");
            headG.addColorStop(0.6,"rgba("+(skinBase[0]-30)+","+(skinBase[1]-25)+","+(skinBase[2]-20)+",1)");
            headG.addColorStop(1,"rgba("+skinShadow[0]+","+skinShadow[1]+","+skinShadow[2]+",1)");
            ctx.fillStyle=headG;
            ctx.beginPath();ctx.ellipse(fx+sway,fy-H*0.13,H*0.034*(1+breath),H*0.044*(1+breath),0,0,Math.PI*2);ctx.fill();
            // Hair
            const hairCol=isElderly?[140,140,135]:[35,22,12];
            const hairG=ctx.createRadialGradient(fx+sway,fy-H*0.16,0,fx+sway,fy-H*0.155,H*0.048);
            hairG.addColorStop(0,"rgba("+hairCol[0]+","+hairCol[1]+","+hairCol[2]+",0.95)");
            hairG.addColorStop(1,"rgba("+(hairCol[0]-15)+","+(hairCol[1]-10)+","+(hairCol[2]-6)+",0.85)");
            ctx.fillStyle=hairG;
            ctx.beginPath();ctx.ellipse(fx+sway,fy-H*0.158,H*0.038,H*0.03,0,Math.PI,Math.PI*2);ctx.fill();
            // Eyes — with blink
            const blink=Math.sin(sec*0.35+(o.phase||0))>0.93?0.05:0.5;
            ctx.fillStyle="rgba(20,12,8,0.95)";
            ctx.beginPath();ctx.ellipse(fx-H*0.012+sway,fy-H*0.133,H*0.005,H*0.005*blink,0,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.ellipse(fx+H*0.012+sway,fy-H*0.133,H*0.005,H*0.005*blink,0,0,Math.PI*2);ctx.fill();
            // Nose shadow
            ctx.fillStyle="rgba("+skinShadow[0]+","+skinShadow[1]+","+skinShadow[2]+",0.3)";
            ctx.beginPath();ctx.ellipse(fx+sway,fy-H*0.122,H*0.005,H*0.012,0,0,Math.PI*2);ctx.fill();
            // Mouth
            ctx.fillStyle="rgba(140,75,60,0.7)";
            ctx.fillRect(fx-H*0.008+sway,fy-H*0.108,H*0.016,H*0.003);
            // Torso — clothing
            const clothCol=isElderly?[60,55,50]:[35,22,12];
            const tg=ctx.createLinearGradient(fx-H*0.035+sway,fy-H*0.09,fx+H*0.035+sway,fy+H*0.08);
            tg.addColorStop(0,"rgba("+clothCol[0]+","+clothCol[1]+","+clothCol[2]+",0.97)");
            tg.addColorStop(1,"rgba("+(clothCol[0]-15)+","+(clothCol[1]-10)+","+(clothCol[2]-6)+",0.97)");
            ctx.fillStyle=tg;
            ctx.fillRect(fx-H*0.032+sway,fy-H*(0.09+breath),H*0.064,H*(0.17+breath*2));
            // Shoulders (rounded)
            ctx.beginPath();ctx.ellipse(fx-H*0.03+sway,fy-H*0.09,H*0.018,H*0.014,0,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.ellipse(fx+H*0.03+sway,fy-H*0.09,H*0.018,H*0.014,0,0,Math.PI*2);ctx.fill();
            // Arms
            const armG=ctx.createLinearGradient(fx-H*0.05+sway,fy-H*0.04,fx+H*0.09+sway,fy+H*0.04);
            armG.addColorStop(0,"rgba("+(clothCol[0]-8)+","+(clothCol[1]-5)+","+(clothCol[2]-3)+",0.97)");
            armG.addColorStop(1,"rgba("+(clothCol[0]-20)+","+(clothCol[1]-12)+","+(clothCol[2]-8)+",0.97)");
            ctx.fillStyle=armG;
            ctx.save();ctx.translate(fx-H*0.052+sway,fy-H*0.04);ctx.rotate(0.35);
            ctx.fillRect(-H*0.012,-H*0.006,H*0.09,H*0.024);ctx.restore();
            ctx.save();ctx.translate(fx+H*0.03+sway,fy-H*0.04);ctx.rotate(-0.25);
            ctx.fillRect(0,-H*0.006,H*0.09,H*0.024);ctx.restore();
            // Hands
            ctx.fillStyle="rgba("+(skinBase[0]-10)+","+(skinBase[1]-15)+","+(skinBase[2]-15)+",1)";
            ctx.beginPath();ctx.ellipse(fx-H*0.075+sway,fy-H*0.005,H*0.011,H*0.014,0,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.ellipse(fx+H*0.072+sway,fy-H*0.005,H*0.011,H*0.014,0,0,Math.PI*2);ctx.fill();
            // Legs
            const legCol=[22,14,8];
            ctx.fillStyle="rgba("+legCol[0]+","+legCol[1]+","+legCol[2]+",0.97)";
            ctx.fillRect(fx-H*0.022+sway,fy+H*0.08,H*0.018,H*(isSeated?0.06:0.22));
            ctx.fillRect(fx+H*0.004+sway,fy+H*0.08,H*0.018,H*(isSeated?0.06:0.22));
            // Shoes
            ctx.fillStyle="rgba(8,5,3,0.97)";
            if(!isSeated){
              ctx.fillRect(fx-H*0.026+sway,fy+H*0.295,H*0.03,H*0.012);
              ctx.fillRect(fx+H*0.004+sway,fy+H*0.295,H*0.03,H*0.012);
            }
            // Guitar
            if(scene.hasGuitar||o.guitar){
              const gx=fx+H*0.09+sway,gy=fy+H*0.02;
              const gbG=ctx.createRadialGradient(gx,gy,0,gx,gy,H*0.07);
              gbG.addColorStop(0,"rgba(155,90,28,0.97)");
              gbG.addColorStop(0.5,"rgba(110,60,20,0.95)");
              gbG.addColorStop(1,"rgba(55,28,8,0.92)");
              ctx.fillStyle=gbG;
              ctx.beginPath();ctx.ellipse(gx,gy,H*0.05,H*0.064,0.22,0,Math.PI*2);ctx.fill();
              ctx.beginPath();ctx.ellipse(gx-H*0.005,gy-H*0.065,H*0.038,H*0.05,0.22,0,Math.PI*2);ctx.fill();
              // Sound hole
              ctx.fillStyle="rgba(0,0,0,0.85)";
              ctx.beginPath();ctx.ellipse(gx-H*0.005,gy,H*0.012,H*0.012,0,0,Math.PI*2);ctx.fill();
              // Neck
              ctx.fillStyle="rgba(60,32,12,0.97)";
              ctx.save();ctx.translate(gx-H*0.02,gy-H*0.06);ctx.rotate(0.4);
              ctx.fillRect(0,-H*0.005,H*0.14,H*0.01);ctx.restore();
              // Strings
              ctx.strokeStyle="rgba(200,200,180,0.5)";ctx.lineWidth=0.5;
              for(let st=0;st<6;st++){
                ctx.beginPath();
                ctx.moveTo(gx-H*0.025+st*1,gy-H*0.04);
                ctx.lineTo(gx+H*0.02+st*1,gy+H*0.04);
                ctx.stroke();
              }
            }
            // Ballot detail
            if(scene.hasBallot){
              ctx.fillStyle="rgba(240,225,195,0.95)";
              ctx.fillRect(fx-H*0.085+sway,fy-H*0.02,H*0.018,H*0.024);
              // Box
              ctx.fillStyle="rgba(80,55,32,0.95)";
              ctx.fillRect(fx-H*0.13+sway,fy+H*0.01,H*0.06,H*0.05);
              ctx.fillStyle="rgba(50,32,18,0.95)";
              ctx.fillRect(fx-H*0.125+sway,fy+H*0.005,H*0.05,H*0.005);
              // Slot
              ctx.fillStyle="rgba(20,12,6,0.95)";
              ctx.fillRect(fx-H*0.115+sway,fy+H*0.008,H*0.03,H*0.002);
            }
          }
          // Shadow on ground
          if(!scene.isIndoor){
            const sg=ctx.createRadialGradient(fx+sway,H*0.72,0,fx+sway,H*0.72,H*0.1);
            sg.addColorStop(0,"rgba(0,0,0,0.4)");
            sg.addColorStop(1,"rgba(0,0,0,0)");
            ctx.fillStyle=sg;
            ctx.beginPath();ctx.ellipse(fx+sway,H*0.72,H*0.08,H*0.024,0,0,Math.PI*2);ctx.fill();
          }
        };

        // Place figures based on scene
        if(scene.hasMultiplePeople){
          // Multiple figures with spacing and depth
          const positions=scene.hasBallot?[
            {x:W*0.38,y:H*0.5,phase:0},
            {x:W*0.62,y:H*0.42,phase:1},
            {x:W*0.72,y:H*0.4,phase:2},
            {x:W*0.82,y:H*0.4,phase:3}
          ]:scene.hasBench?[
            {x:W*0.43,y:H*0.52,seated:true,elderly:true,phase:0},
            {x:W*0.56,y:H*0.52,seated:true,elderly:true,phase:1}
          ]:[
            {x:W*0.35,y:H*0.46,phase:0},
            {x:W*0.5,y:H*0.46,phase:1.5},
            {x:W*0.65,y:H*0.46,phase:3}
          ];
          positions.forEach(p=>drawPerson(p.x,p.y,p));
        } else {
          const fx=scene.isOcean&&scene.isIndoor?W*0.22:scene.isCity?W*0.45:W*0.45;
          const fy=/sit|bench|windowsill/.test(pr)?H*0.52:H*0.44;
          drawPerson(fx,fy,{
            seated:/sit|bench|windowsill/.test(pr),
            silhouette:scene.isSilhouette,
            guitar:scene.hasGuitar,
            elderly:scene.hasElderly
          });
        }
      }

      // ─────────────────────────────────────────────────────────
      // LAYER 6: ATMOSPHERE
      // ─────────────────────────────────────────────────────────
      if(scene.isRain){
        for(let r=0;r<180;r++){
          const rx=(r*137+sec*250)%W;
          const ry=(r*97+sec*550)%H;
          ctx.strokeStyle="rgba(165,180,215,"+(0.15+Math.sin(r)*0.08)+")";
          ctx.lineWidth=0.9;
          ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-5,ry+22);ctx.stroke();
        }
      }
      if(scene.isFog){
        const fog=ctx.createLinearGradient(0,H*0.35,0,H*0.75);
        fog.addColorStop(0,"rgba(180,185,180,0)");
        fog.addColorStop(0.4,"rgba(165,170,165,"+(0.18+Math.sin(sec*0.25)*0.05)+")");
        fog.addColorStop(0.7,"rgba(155,160,155,"+(0.22+Math.sin(sec*0.3)*0.05)+")");
        fog.addColorStop(1,"rgba(145,150,145,0)");
        ctx.fillStyle=fog;ctx.fillRect(0,H*0.35,W,H*0.4);
        // Drift
        for(let f=0;f<4;f++){
          const fy2=H*(0.45+f*0.06);
          const fg=ctx.createLinearGradient(0,fy2,W,fy2);
          fg.addColorStop(0,"rgba(180,185,180,0)");
          fg.addColorStop(0.5,"rgba(180,185,180,"+(0.08+Math.sin(sec*0.2+f)*0.04)+")");
          fg.addColorStop(1,"rgba(180,185,180,0)");
          ctx.fillStyle=fg;
          ctx.save();ctx.translate(Math.sin(sec*0.1+f)*30,0);
          ctx.fillRect(0,fy2,W,20);ctx.restore();
        }
      }
      if(scene.isSnow){
        for(let s=0;s<200;s++){
          const sx=(s*137+sec*30+Math.sin(sec+s)*15)%W;
          const sy=(s*97+sec*60)%H;
          const sz=0.8+(s%5)*0.4;
          ctx.fillStyle="rgba(255,255,255,"+(0.6+Math.sin(s)*0.2)+")";
          ctx.fillRect(sx,sy,sz,sz);
        }
      }
      if(scene.hasAutumn){
        for(let l=0;l<25;l++){
          const lx=(l*73+sec*15+Math.sin(sec*0.5+l)*40)%W;
          const ly=(l*47+sec*45)%H;
          const rot=sec*2+l;
          ctx.save();ctx.translate(lx,ly);ctx.rotate(rot);
          ctx.fillStyle=l%3===0?"rgba(220,120,40,0.85)":l%3===1?"rgba(180,80,30,0.85)":"rgba(230,180,60,0.85)";
          ctx.fillRect(-4,-2,8,4);
          ctx.restore();
        }
      }

      ctx.restore(); // END CAMERA TRANSFORM

      // ─────────────────────────────────────────────────────────
      // LAYER 7: COLOUR GRADE (proper science)
      // ─────────────────────────────────────────────────────────
      if(styleId==="noir"){
        // Pull saturation
        ctx.globalCompositeOperation="saturation";
        ctx.fillStyle="rgb(128,128,128)";ctx.fillRect(0,0,W,H);
        ctx.globalCompositeOperation="source-over";
        ctx.fillStyle="rgba(0,0,0,0.3)";ctx.fillRect(0,0,W,H);
      } else if(grade.alpha>0){
        ctx.fillStyle="rgba("+grade.tint[0]+","+grade.tint[1]+","+grade.tint[2]+","+grade.alpha+")";
        ctx.fillRect(0,0,W,H);
      }

      // Lift shadows / crush blacks for film look
      ctx.globalCompositeOperation="multiply";
      const filmCurve=ctx.createLinearGradient(0,0,0,H);
      filmCurve.addColorStop(0,"rgb(240,235,220)");
      filmCurve.addColorStop(1,"rgb(245,240,225)");
      ctx.fillStyle=filmCurve;
      ctx.globalAlpha=0.08;
      ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=1;
      ctx.globalCompositeOperation="source-over";

      // ─────────────────────────────────────────────────────────
      // LAYER 8: POST — vignette, letterbox, grain, fades
      // ─────────────────────────────────────────────────────────
      const vig=ctx.createRadialGradient(W/2,H/2,W*0.1,W/2,H/2,W*0.85);
      vig.addColorStop(0,"rgba(0,0,0,0)");
      vig.addColorStop(0.6,"rgba(0,0,0,0.15)");
      vig.addColorStop(1,"rgba(0,0,0,0.85)");
      ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
      // Letterbox
      ctx.fillStyle="#000";
      ctx.fillRect(0,0,W,H*0.072);
      ctx.fillRect(0,H*0.928,W,H*0.072);
      // Film grain
      for(let g=0;g<35;g++){
        const gv=Math.random()>0.5?160:30;
        ctx.fillStyle="rgba("+gv+","+gv+","+gv+",0.01)";
        ctx.fillRect(Math.random()*W,Math.random()*H,1.2,1.2);
      }
      // Fade in
      if(t<0.05){
        ctx.fillStyle="rgba(0,0,0,"+(1-t/0.05)+")";
        ctx.fillRect(0,0,W,H);
      }
      // Fade out
      if(t>0.92){
        ctx.fillStyle="rgba(0,0,0,"+((t-0.92)/0.08)+")";
        ctx.fillRect(0,0,W,H);
      }
    };

    addLog("Engine compiled — beginning render at "+duration+"s, 24fps...");
    setProgress(25);

    try{
      const canvas=canvasRef.current;
      canvas.width=1920;canvas.height=1080;
      const ctx=canvas.getContext("2d");
      // Prime frame
      try{drawFn(ctx,1920,1080,0,0);}catch(e){addLog("Prime error: "+e.message);}
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
            drawFn(ctx,1920,1080,t,sec);
            // Final title card at end
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
          }catch(e){
            ctx.fillStyle="#050200";ctx.fillRect(0,0,1920,1080);
          }
          setProgress(25+Math.round((frame/totalFrames)*70));
          if(frame%(fps*3)===0)addLog("  "+Math.round(sec)+"s / "+duration+"s rendered");
          frame++;
          const next=startTime+(frame*msPerFrame);
          setTimeout(renderNext,Math.max(4,next-performance.now()));
        };
        renderNext();
      });

      setProgress(97);addLog("Finalising — encoding...");
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
        if(videoRef.current){
          videoRef.current.src=url;
          videoRef.current.load();
          videoRef.current.muted=false;
          videoRef.current.play().catch(()=>{});
        }
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
          <div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700}}>MANDASTRONG ENGINE v2 · CINEMA-GRADE RENDERER</div>
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
              <button onClick={()=>{const i=document.createElement("input");i.type="file";i.accept="image/*";i.onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;setRefMedia(URL.createObjectURL(f));setRefMediaType(f.type.startsWith("video")?"video":"image");const reader=new FileReader();reader.onload=ev=>setRefDataUrl(ev.target.result);reader.readAsDataURL(f);};i.click();}}
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
            <div style={{color:DIM,fontSize:11,marginBottom:8,lineHeight:1.7}}>Describe anything in plain English. MandaStrong Engine reads your prompt and renders a real cinematic scene.</div>
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
            // Detect device and trigger correct install method
            const ua = navigator.userAgent.toLowerCase();
            const isIOS = /iphone|ipad|ipod/.test(ua);
            const isAndroid = /android/.test(ua);
            const isMobile = isIOS || isAndroid;
            const isTablet = /ipad/.test(ua) || (isAndroid && !/mobile/.test(ua));

            if(window.deferredInstallPrompt){
              // Chrome/Edge/Android — native install prompt
              window.deferredInstallPrompt.prompt();
              window.deferredInstallPrompt.userChoice.then(()=>{window.deferredInstallPrompt=null;});
            } else if(isIOS){
              alert("Install MandaStrong Studio on iPhone/iPad:\n\n1. Tap the Share button ↑ at the bottom\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add'\n\nThe app will open full screen, sized to your device.");
            } else if(isAndroid){
              alert("Install MandaStrong Studio on Android:\n\n1. Tap the menu ⋮ in your browser\n2. Tap 'Add to Home Screen' or 'Install App'\n3. Tap Install\n\nThe app will open full screen on your device.");
            } else {
              // Desktop — look for install icon in address bar
              alert("Install MandaStrong Studio on Desktop:\n\n1. Look for the install icon ⊕ in your browser address bar\n2. Click it and select Install\n\nOr use Chrome/Edge for the best experience.\nThe app auto-sizes to your screen.");
            }
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
  const [uploads, setUploads] = useState([null,null,null]);
  const [titles, setTitles] = useState(["","",""]);
  const [descs, setDescs] = useState(["","",""]);
  const refs = [useRef(null),useRef(null),useRef(null)];
  const videoRefs = [useRef(null),useRef(null),useRef(null)];

  const handleFile=(i,e)=>{
    const f=e.target.files&&e.target.files[0];
    if(!f)return;
    const url=URL.createObjectURL(f);
    setUploads(p=>{const n=[...p];n[i]={url,name:f.name,type:f.type,size:(f.size/1024/1024).toFixed(1)};return n;});
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

              {/* Video/Image preview area */}
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
                    style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,0.8)",border:"1px solid "+GOLD,color:GOLD,width:22,height:22,cursor:"pointer",fontSize:12,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    ✕
                  </button>
                )}
              </div>

              <input ref={refs[i]} type="file" accept="video/*,image/*" style={{display:"none"}} onChange={e=>handleFile(i,e)}/>

              {/* Title */}
              <div style={{color:GOLD,fontSize:9,letterSpacing:2,fontWeight:900,marginBottom:4}}>FILM TITLE</div>
              <input value={titles[i]} onChange={e=>setTitles(p=>{const n=[...p];n[i]=e.target.value;return n;})}
                placeholder="Enter film title..." style={{...inp,marginBottom:8}}/>

              {/* Description */}
              <div style={{color:GOLD,fontSize:9,letterSpacing:2,fontWeight:900,marginBottom:4}}>DESCRIPTION</div>
              <textarea value={descs[i]} onChange={e=>setDescs(p=>{const n=[...p];n[i]=e.target.value;return n;})}
                placeholder="Describe this film..." style={{...inp,height:60,resize:"none",lineHeight:1.6,marginBottom:10}}/>

              {/* Upload button */}
              {!uploads[i]?(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  <button onClick={()=>{const inp2=document.createElement("input");inp2.type="file";inp2.accept="image/*";inp2.onchange=e=>handleFile(i,e);inp2.click();}}
                    style={{background:"linear-gradient(135deg,#1a0800,#2a1200)",border:"2px solid "+GOLD,color:GOLD,padding:"10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>
                    📷 PHOTO
                  </button>
                  <button onClick={()=>refs[i].current&&refs[i].current.click()}
                    style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,color:WHITE,padding:"10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>
                    📁 FILE
                  </button>
                </div>
              ):(
                <div>
                  <div style={{color:"#22c55e",fontSize:9,fontWeight:900,letterSpacing:2,marginBottom:6}}>✓ {uploads[i].name.slice(0,28)} · {uploads[i].size}MB</div>
                  <button onClick={()=>refs[i].current&&refs[i].current.click()}
                    style={{...G("out",false),width:"100%",padding:"8px",fontSize:10,letterSpacing:2}}>
                    ↻ REPLACE
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* If nothing uploaded yet */}
        {uploads.every(u=>!u)&&(
          <div style={{marginTop:32,padding:24,border:"1px dashed "+GOLDDIM,textAlign:"center"}}>
            <div style={{color:GOLDDIM,fontSize:12,letterSpacing:2,lineHeight:2}}>
              No films uploaded yet. Use Page 8 to generate scenes, Page 16 to render your film,<br/>
              then upload it here as your proof of concept.
            </div>
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
        {/* Live subscriber counter */}
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
            <button onClick={()=>{const i=document.createElement("input");i.type="file";i.accept="image/*";i.multiple=true;i.capture="environment";i.onchange=e=>onFiles(e.target.files);i.click();}}
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
            // Auto-populate tracks from media library and sync
            const videoAssets=mediaLib.filter(a=>a&&a.type&&(a.type.startsWith("video")||a.type.includes("webm")));
            const audioAssets=mediaLib.filter(a=>a&&a.type&&(a.type.startsWith("audio")||a.type==="audio/narration"||a.type.includes("webm")&&!a.type.startsWith("video")));
            const newTl={};
            if(videoAssets.length>0)newTl[0]=videoAssets.map(a=>({...a,startTime:0,syncGroup:"master",synced:true}));
            if(audioAssets.length>0)newTl[1]=audioAssets.map(a=>({...a,startTime:0,syncGroup:"master",synced:true}));
            setTimeline(p=>{
              const merged={...p,...newTl};
              Object.keys(merged).forEach(k=>{merged[k]=(merged[k]||[]).map(a=>({...a,startTime:0,syncGroup:"master",synced:true}));});
              return merged;
            });
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

function P16({ go, timeline, setRendered, mediaLib, setMediaLib, user, filmDuration, setFilmDuration }) {
  const [quality,setQuality]=useState("1080p");
  const [progress,setProgress]=useState(0);
  const [rendering,setRendering]=useState(false);
  const [done,setDone]=useState(false);
  const [renderUrl,setRenderUrl]=useState("");
  const [renderLog,setRenderLog]=useState([]);
  const [fps,setFps]=useState(30);
  const [codec,setCodec]=useState("vp9");
  const [currentClipIdx,setCurrentClipIdx]=useState(-1);
  const canvasRef=useRef(null);

  const log=(msg)=>setRenderLog(p=>[...p,msg]);

  const getVideoClips=()=>{
    const tClips=Object.values(timeline||{}).flat().filter(a=>a&&a.type&&a.type.startsWith("video"));
    if(tClips.length>0)return tClips;
    return (mediaLib||[]).filter(a=>a.type&&a.type.startsWith("video"));
  };

  const getAudioTrack=()=>{
    const tAudio=Object.values(timeline||{}).flat().filter(a=>a&&a.type&&(a.type.startsWith("audio")||a.type==="audio/narration"||a.type==="audio/webm"));
    if(tAudio.length>0)return tAudio[0];
    return (mediaLib||[]).find(a=>a.type&&(a.type.startsWith("audio")||a.type==="audio/narration"||a.type==="audio/webm"));
  };

  const startRender=async()=>{
    // Step 1: Refresh ALL clips from IndexedDB before rendering
    // This ensures clips work even after page reload
    log("Loading clips from storage...");
    // Load clips DIRECTLY from IndexedDB — don't rely on React state timing
    let freshClips = [];
    try{
      const dbClips=await getAllClipsFromDB();
      if(dbClips.length>0){
        freshClips=dbClips.map(c2=>({
          id:c2.id,name:c2.name,type:c2.type||"video/webm",
          url:URL.createObjectURL(c2.blob),
          file:new File([c2.blob],c2.name,{type:c2.type||"video/webm"}),
          dbId:c2.id
        }));
        setMediaLib(freshClips);
        log("Loaded "+freshClips.length+" clips from storage");
      }
    }catch(e){console.warn("DB load failed",e);}

    // Fall back to current mediaLib if DB empty
    let clips = freshClips.length > 0 ? freshClips.filter(c2=>c2.type&&c2.type.startsWith("video")) : getVideoClips();
    const audioAsset=getAudioTrack();
    if(clips.length===0){alert("No video clips found. Generate clips on Page 8 first.");return;}
    setRendering(true);setDone(false);setProgress(0);setRenderLog([]);setRenderUrl("");setCurrentClipIdx(-1);
    try{
      log("MandaStrong Render Engine v2 initialising...");
      log("Clips: "+clips.length+" | Quality: "+quality+" | FPS: "+fps);
      const canvas=canvasRef.current;
      const dims=quality==="4K"?{w:3840,h:2160}:quality==="1080p"?{w:1920,h:1080}:quality==="720p"?{w:1280,h:720}:{w:854,h:480};
      canvas.width=dims.w;canvas.height=dims.h;
      const ctx=canvas.getContext("2d");
      log("Canvas: "+dims.w+"x"+dims.h);
      const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      const audioDest=audioCtx.createMediaStreamDestination();
      let audioSource=null,audioBuffer=null;
      if(audioAsset&&audioAsset.url){
        try{
          const resp=await fetch(audioAsset.url);
          const arrayBuf=await resp.arrayBuffer();
          audioBuffer=await audioCtx.decodeAudioData(arrayBuf);
          log("Audio loaded: "+(audioBuffer.duration).toFixed(1)+"s");
        }catch(e){log("Audio load failed — video only");}
      }
      if(audioBuffer){audioSource=audioCtx.createBufferSource();audioSource.buffer=audioBuffer;audioSource.connect(audioDest);audioSource.connect(audioCtx.destination);}
      const videoStream=canvas.captureStream(fps);
      const tracks=[...videoStream.getTracks(),...audioDest.stream.getTracks()];
      const combinedStream=new MediaStream(tracks);
      const vCodec=codec==="vp9"?"vp9":"vp8";
      const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs="+vCodec+",opus")?"video/webm;codecs="+vCodec+",opus":"video/webm";
      const bitrate=quality==="4K"?40000000:quality==="1080p"?8000000:4000000;
      const recorder=new MediaRecorder(combinedStream,{mimeType,videoBitsPerSecond:bitrate,audioBitsPerSecond:192000});
      const chunks=[];
      recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
      // Prime the canvas so captureStream has a real frame
      ctx.fillStyle="#000";ctx.fillRect(0,0,dims.w,dims.h);
      await new Promise(r=>setTimeout(r,200));
      recorder.start(100);
      if(audioSource)audioSource.start(0);
      log("Recording started...");
      setProgress(5);
      // Helper: render a scene directly to canvas using Claude
      const renderSceneToCanvas=async(sceneName,clipDurSec)=>{
        const scenePrompt=sceneName.replace(/\.[^.]+$/,"").replace(/_/g," ").replace(/\d+s$/,"").trim();
        log("  Regenerating: "+scenePrompt.slice(0,40)+"...");
        try{
          const res=await fetch("https://njqfexhltjwpgvctmyaw.supabase.co/functions/v1/claude-proxy",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:3000,
              messages:[{role:"user",content:"Write a JavaScript canvas function for this cinematic scene: \""+scenePrompt+"\". Function: function drawFrame(ctx,W,H,t,sec). Use gradients, colours, depth, atmosphere. t=0-1 progress. Return only the function."}]})
          });
          const d=await res.json();
          let code=d.content&&d.content[0]?d.content[0].text.trim():"";
          code=code.replace(new RegExp(String.fromCharCode(96,96,96)+"javascript|"+String.fromCharCode(96,96,96)+"js|"+String.fromCharCode(96,96,96),"g"),"").trim();
          const fi=code.indexOf("function drawFrame");if(fi>0)code=code.slice(fi);
          const bOpen2=code.indexOf("{");const bClose2=code.lastIndexOf("}");const body=bOpen2>0&&bClose2>bOpen2?code.slice(bOpen2+1,bClose2):"";
          const drawFn=new Function("ctx","W","H","t","sec",body);
          const W=dims.w,H=dims.h;
          const totalFrames=Math.round(clipDurSec*fps);
          const msPerFrame=Math.round(1000/fps);
          const wallStart=performance.now();
          await new Promise(resolve=>{
            let frame=0;
            const tick=()=>{
              if(frame>=totalFrames){resolve(null);return;}
              const t=frame/totalFrames,sec=frame/fps;
              try{ctx.clearRect(0,0,W,H);drawFn(ctx,W,H,t,sec);}catch(e){ctx.fillStyle="#050200";ctx.fillRect(0,0,W,H);}
              const vig=ctx.createRadialGradient(W/2,H/2,W*0.1,W/2,H/2,W*0.8);
              vig.addColorStop(0,"rgba(0,0,0,0)");vig.addColorStop(1,"rgba(0,0,0,0.85)");
              ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
              ctx.fillStyle="#000";ctx.fillRect(0,0,W,H*0.06);ctx.fillRect(0,H*0.94,W,H*0.06);
              frame++;
              const due=wallStart+(frame*msPerFrame);
              setTimeout(tick,Math.max(4,due-performance.now()));
            };
            tick();
          });
          return true;
        }catch(e){log("  Error: "+e.message);return false;}
      };

      // Reload fresh blobs from IndexedDB for every clip before rendering
      log("Loading clips from storage...");
      try{
        const freshDB=await getAllClipsFromDB();
        if(freshDB.length>0){
          const refreshed=clips.map(cl=>{
            const db=freshDB.find(d=>d.id===cl.dbId||d.id===cl.id||d.name===cl.name);
            if(db&&db.blob){
              return {...cl,file:new File([db.blob],cl.name,{type:db.type||"video/webm"}),url:URL.createObjectURL(db.blob)};
            }
            return cl;
          });
          log("Clips refreshed from storage: "+freshDB.length+" found");
        }
      }catch(e){log("Storage reload: "+e.message);}

      for(let ci=0;ci<clips.length;ci++){
        const clip=clips[ci];setCurrentClipIdx(ci);
        log("Clip "+(ci+1)+"/"+clips.length+": "+clip.name.slice(0,45));
        setProgress(5+Math.round((ci/clips.length)*80));

        // Try to play the video file first
        let videoPlayed=false;
        if(clip.file instanceof File){
          videoPlayed=await new Promise(resolve=>{
            const vid=document.createElement("video");
            vid.muted=true;vid.playsInline=true;
            // Use file blob or fall back to existing blob URL
            const clipSrc = clip.file ? URL.createObjectURL(clip.file) : (clip.url||"");
            if(!clipSrc){resolve(false);return;}
            vid.src=clipSrc;
            let done2=false;
            const finish=(ok)=>{if(!done2){done2=true;resolve(ok);}};
            vid.onloadeddata=async()=>{
              const clipDur=Math.min(vid.duration||30,65);
              vid.currentTime=0;
              // Wait for first frame to decode before drawing
              await new Promise(r=>{
                if(vid.readyState>=3){r();}
                else{vid.oncanplay=r;}
              });
              try{await vid.play();}catch(e){}
              const startTime=Date.now();
              const msPerF=Math.round(1000/fps);
              let lastDraw=performance.now();
              const draw=()=>{
                if(done2)return;
                const elapsed=(Date.now()-startTime)/1000;
                if(vid.ended||elapsed>=clipDur||vid.paused&&elapsed>1){vid.pause();finish(true);return;}
                const now=performance.now();
                if(now-lastDraw>=msPerF-2){
                  try{
                    ctx.clearRect(0,0,dims.w,dims.h);
                    ctx.drawImage(vid,0,0,dims.w,dims.h);
                    // Vignette
                    const vig=ctx.createRadialGradient(dims.w/2,dims.h/2,dims.w*0.1,dims.w/2,dims.h/2,dims.w*0.8);
                    vig.addColorStop(0,"rgba(0,0,0,0)");vig.addColorStop(1,"rgba(0,0,0,0.7)");
                    ctx.fillStyle=vig;ctx.fillRect(0,0,dims.w,dims.h);
                    // Letterbox
                    ctx.fillStyle="#000";ctx.fillRect(0,0,dims.w,dims.h*0.05);ctx.fillRect(0,dims.h*0.95,dims.w,dims.h*0.05);
                    lastDraw=now;
                  }catch(e){finish(true);return;}
                }
                requestAnimationFrame(draw);
              };
              requestAnimationFrame(draw);
            };
            vid.onerror=()=>finish(false);
            setTimeout(()=>finish(false),70000);
            vid.load();
          });
        }

        // If video failed or no file — regenerate scene with Claude
        if(!videoPlayed){
          log("  Clip not playable — generating scene: "+clip.name.slice(0,30)+"...");
          const clipDurSec=parseInt(clip.name.match(/(\d+)s/)?.[1]||"30");
          const ok=await renderSceneToCanvas(clip.name,clipDurSec);
          if(!ok){
            // Last resort: title card — real-time paced
            const tcFrames=5*fps;
            const tcStart=performance.now();
            await new Promise(resolve=>{
              let f=0;
              const draw=()=>{
                if(f>=tcFrames){resolve(null);return;}
                ctx.fillStyle="#000";ctx.fillRect(0,0,dims.w,dims.h);
                ctx.fillStyle="#e8c96d";ctx.font="900 "+Math.round(dims.w/24)+"px Arial";ctx.textAlign="center";
                ctx.fillText(clip.name.replace(/\.[^.]+$/,"").replace(/_/g," ").slice(0,40).toUpperCase(),dims.w/2,dims.h/2);
                f++;
                const next=tcStart+(f*(1000/fps));
                setTimeout(draw,Math.max(4,next-performance.now()));
              };draw();
            });
          }
        }
      }
      setCurrentClipIdx(-1);
      // End card — real-time paced
      {const ecFrames=fps*2;const ecStart=performance.now();
      await new Promise(resolve=>{
        let f=0;
        const draw=()=>{
          if(f>=ecFrames){resolve(null);return;}
          ctx.fillStyle="#000";ctx.fillRect(0,0,dims.w,dims.h);
          f++;
          const next=ecStart+(f*(1000/fps));
          setTimeout(draw,Math.max(4,next-performance.now()));
        };draw();
      });}
      setProgress(92);log("Finalising...");
      if(audioSource){try{audioSource.stop();}catch(e){}}
      recorder.stop();
      await new Promise(r=>{recorder.onstop=r;});
      const blob=new Blob(chunks,{type:mimeType});
      const url=URL.createObjectURL(blob);
      // Save final render to IndexedDB
      try{
        const renderName="MandaStrong_Film_"+new Date().toISOString().slice(0,10)+".webm";
        await saveClipToDB("render_final",blob,renderName,"video/webm");
      }catch(e){}
      setRenderUrl(url);
      if(setRendered)setRendered({url,quality,format:"WebM",timestamp:new Date().toLocaleString()});
      setProgress(100);setDone(true);
      log("RENDER COMPLETE — "+(blob.size/1024/1024).toFixed(1)+"MB");
      audioCtx.close();
    }catch(e){log("Render error: "+e.message);}
    setRendering(false);
  };

  const clips=getVideoClips();
  const audio=getAudioTrack();
  const QUALITIES=[{id:"480p",label:"480p",sub:"854×480"},{id:"720p",label:"720p",sub:"1280×720"},{id:"1080p",label:"1080p",sub:"1920×1080"},{id:"4K",label:"4K",sub:"3840×2160"}];

  return (
    <div style={{...Sp,padding:0}}>
      <canvas ref={canvasRef} style={{display:"none"}}/>
      <div style={{padding:"12px 24px",borderBottom:"1px solid "+GOLDDIM+"",background:"#020200",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:10,color:GOLD,letterSpacing:4,fontWeight:700}}>PRODUCTION ENGINE — STAGE 6</div>
          <h1 style={{...H1,fontSize:22,margin:0}}>RENDER FILM</h1>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
            <span style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:2}}>FILM: {filmDuration||60} MIN</span>
            <input type="range" min={0} max={180} step={30} value={filmDuration||60} onChange={e=>setFilmDuration(+e.target.value)} style={{width:160,accentColor:GOLD}}/>
            <div style={{display:"flex",gap:4}}>
              {[60,90,180].map(m=><button key={m} onClick={()=>setFilmDuration(m)} style={{background:filmDuration===m?GOLD:"#111",border:"1px solid "+(filmDuration===m?"#000":GOLDDIM),color:filmDuration===m?"#000":WHITE,padding:"2px 8px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>{m}m</button>)}
            </div>
          </div>
        </div>
        {done&&!rendering&&<div style={{color:"#22c55e",fontSize:11,fontWeight:900,letterSpacing:2}}>RENDER COMPLETE</div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",minHeight:"calc(100vh - 120px)"}}>
        <div style={{padding:20,overflowY:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <div style={{background:clips.length>0?"#061406":"#0a0a0a",border:"1px solid "+(clips.length>0?"#22c55e":GOLDDIM),padding:"14px 16px"}}>
              <div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:3,marginBottom:6}}>VIDEO CLIPS</div>
              <div style={{color:clips.length>0?"#22c55e":WHITE,fontSize:14,fontWeight:900}}>{clips.length>0?"✓ "+clips.length+" clip"+(clips.length>1?"s":"")+" ready":"No clips — generate on page 8"}</div>
            </div>
            <div style={{background:audio?"#061406":"#0a0a0a",border:"1px solid "+(audio?"#22c55e":GOLDDIM),padding:"14px 16px"}}>
              <div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:3,marginBottom:6}}>AUDIO TRACK</div>
              <div style={{color:audio?"#22c55e":"#f59e0b",fontSize:14,fontWeight:900}}>{audio?"✓ Audio ready":"No audio — record on page 6"}</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <div style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,padding:"14px 16px"}}>
              <div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:3,marginBottom:10}}>OUTPUT QUALITY</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                {QUALITIES.map(q=>(
                  <button key={q.id} onClick={()=>setQuality(q.id)} style={{background:quality===q.id?"#0a0800":"#000",border:"1px solid "+(quality===q.id?GOLD:GOLDDIM),padding:"8px 6px",cursor:"pointer",textAlign:"center"}}>
                    <div style={{color:quality===q.id?GOLD:WHITE,fontSize:12,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>{q.label}</div>
                    <div style={{color:DIM,fontSize:9}}>{q.sub}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{background:"#0a0a0a",border:"1px solid "+GOLDDIM,padding:"14px 16px"}}>
              <div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:3,marginBottom:10}}>SETTINGS</div>
              <div style={{marginBottom:10}}>
                <div style={{color:DIM,fontSize:10,marginBottom:5}}>FRAME RATE</div>
                <div style={{display:"flex",gap:5}}>
                  {[24,30,60].map(f=><button key={f} onClick={()=>setFps(f)} style={{...G(fps===f?"gold":"out",true),flex:1,padding:"5px 4px",fontSize:10}}>{f}fps</button>)}
                </div>
              </div>
              <div>
                <div style={{color:DIM,fontSize:10,marginBottom:5}}>CODEC</div>
                <div style={{display:"flex",gap:5}}>
                  {["vp9","vp8"].map(c=><button key={c} onClick={()=>setCodec(c)} style={{...G(codec===c?"gold":"out",true),flex:1,padding:"5px 4px",fontSize:10}}>{c.toUpperCase()}</button>)}
                </div>
              </div>
            </div>
          </div>
          {rendering&&(
            <div style={{background:"#000",border:"1px solid "+GOLD,padding:"14px 16px",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <div style={{color:GOLD,fontSize:11,fontWeight:900}}>RENDERING</div>
                <div style={{color:GOLD,fontSize:13,fontWeight:900}}>{progress}%</div>
              </div>
              <div style={{height:8,background:"#111",overflow:"hidden"}}>
                <div style={{width:progress+"%",height:"100%",background:"linear-gradient(90deg,"+GOLDDIM+","+GOLD+")",transition:"width .3s"}}/>
              </div>
            </div>
          )}
          {renderLog.length>0&&(
            <div style={{background:"#000",border:"1px solid "+GOLDDIM,padding:"14px 16px",marginBottom:16,maxHeight:180,overflowY:"auto"}}>
              <div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:3,marginBottom:8}}>RENDER LOG</div>
              {renderLog.map((l,i)=>(
                <div key={i} style={{color:i===renderLog.length-1?"#22c55e":"#666",fontSize:10,lineHeight:1.7,fontFamily:"monospace"}}>{i===renderLog.length-1?"► ":"  "}{l}</div>
              ))}
            </div>
          )}
          {done&&renderUrl&&(
            <div style={{background:"#061406",border:"1px solid #22c55e",padding:"16px 20px",marginBottom:16}}>
              <div style={{color:"#22c55e",fontWeight:900,fontSize:13,letterSpacing:2,marginBottom:12}}>RENDER COMPLETE</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <a href={renderUrl} download="MandaStrong_Film.webm" style={{...G("gold",false),padding:"12px 24px",textDecoration:"none",display:"inline-block",fontSize:12,letterSpacing:2}}>DOWNLOAD FILM</a>
                <button onClick={()=>go(17)} style={{...G("out",false),padding:"12px 24px",fontSize:12}}>PREVIEW</button>
                <button onClick={()=>go(18)} style={{...G("out",false),padding:"12px 24px",fontSize:12}}>EXPORT</button>
              </div>
            </div>
          )}
          <div style={{background:"#050500",border:"2px solid "+GOLD,padding:"18px 20px",marginBottom:16}}>
            <button onClick={startRender} disabled={rendering||clips.length===0}
              style={{...G("gold",false),width:"100%",padding:"18px",fontSize:14,letterSpacing:3,opacity:rendering||clips.length===0?0.5:1,marginBottom:10}}>
              {rendering?"RENDERING... "+progress+"%":"START RENDER — "+quality+" · "+fps+"fps · "+clips.length+" CLIP"+(clips.length!==1?"S":"")}
            </button>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>go(13)} style={{...G("out",false),flex:1,padding:"10px",fontSize:11}}>TIMELINE</button>
            <button onClick={()=>go(15)} style={{...G("out",false),flex:1,padding:"10px",fontSize:11}}>AUDIO MIX</button>
            <button onClick={()=>go(8)} style={{...G("out",false),flex:1,padding:"10px",fontSize:11}}>GENERATOR</button>
            <button onClick={()=>go(17)} style={{...G("out",false),flex:1,padding:"10px",fontSize:11}}>PREVIEW</button>
          </div>
        </div>
        <div style={{borderLeft:"1px solid "+GOLDDIM+"",display:"flex",flexDirection:"column",background:"#020200"}}>
          <div style={{background:"#000",aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
            {renderUrl?(
              <video src={renderUrl} controls autoPlay loop playsInline style={{width:"100%",height:"100%",objectFit:"contain"}}/>
            ):(
              <div style={{textAlign:"center",padding:20}}>
                <div style={{color:GOLD,fontSize:28,marginBottom:8}}>RENDER</div>
                <div style={{color:DIM,fontSize:10,lineHeight:1.8}}>{quality} · {fps}fps<br/>{clips.length} clip{clips.length!==1?"s":""} queued</div>
              </div>
            )}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:14}}>
            <div style={{color:GOLD,fontSize:9,letterSpacing:3,fontWeight:900,marginBottom:10}}>RENDER QUEUE</div>
            {clips.length===0?(
              <div style={{color:GOLDDIM,fontSize:10,textAlign:"center",padding:"20px 0",lineHeight:1.8}}>No clips.<br/>Generate on page 8.</div>
            ):clips.map((clip,i)=>(
              <div key={clip.id||i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:4,background:currentClipIdx===i?"#0a0800":"#0a0a0a",border:"1px solid "+(currentClipIdx===i?GOLD:GOLDDIM)}}>
                <div style={{width:22,height:22,background:currentClipIdx===i?GOLD:"#222",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{color:currentClipIdx===i?"#000":DIM,fontSize:9,fontWeight:900}}>{i+1}</span>
                </div>
                <div style={{flex:1,overflow:"hidden"}}>
                  <div style={{color:currentClipIdx===i?GOLD:WHITE,fontSize:10,fontWeight:900,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{clip.name.replace(/\.[^.]+$/,"").slice(0,28)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function P17({ go, rendered, mediaLib }) {
  const videoRef = useRef(null);
  const [isPlaying,setIsPlaying]=useState(false);
  const [currentTime,setCurrentTime]=useState(0);
  const [duration,setDuration]=useState(0);
  const vs=rendered?.url||(mediaLib.find(a=>a.type&&a.type.startsWith("video"))?mediaLib.find(a=>a.type&&a.type.startsWith("video")).url:"");
  const fmt=s=>{const m=Math.floor(s/60);const sc=Math.floor(s%60);return String(m).padStart(2,"0")+":"+String(sc).padStart(2,"0");};
  const togglePlay=()=>{if(!videoRef.current)return;if(isPlaying){videoRef.current.pause();setIsPlaying(false);}else{videoRef.current.play();setIsPlaying(true);}};
  return (
    <div style={{...Sp,padding:40}}>
      <div style={{maxWidth:880,margin:"0 auto"}}>
        <h1 style={{...H1,fontSize:28,marginBottom:14}}>FILM PREVIEW</h1>
        <div style={{background:"#000",overflow:"hidden",marginBottom:14,aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid "+GOLDDIM}}>
          {vs?<video ref={videoRef} src={vs} style={{width:"100%",height:"100%"}} controls
            onTimeUpdate={()=>setCurrentTime(videoRef.current?.currentTime||0)}
            onLoadedMetadata={()=>setDuration(videoRef.current?.duration||0)}
            onEnded={()=>setIsPlaying(false)}
            onError={e=>{console.warn("Preview video error",e);}}/>:
            <div style={{textAlign:"center",color:GOLDDIM,fontSize:40}}>🎬</div>}
        </div>
        <div style={{...Card(),display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>{if(videoRef.current)videoRef.current.currentTime=0;}} style={{...G("out",true)}}>⏮</button>
          <button onClick={()=>{if(videoRef.current)videoRef.current.currentTime-=10;}} style={{...G("out",true)}}>⏪</button>
          <button onClick={togglePlay} style={{...G("gold",true),minWidth:44}}>{isPlaying?"⏸":"▶"}</button>
          <button onClick={()=>{if(videoRef.current)videoRef.current.currentTime+=10;}} style={{...G("out",true)}}>⏩</button>
          <div style={{flex:1,height:4,background:"#111",cursor:"pointer"}}
            onClick={e=>{if(!videoRef.current||!duration)return;const r=e.currentTarget.getBoundingClientRect();videoRef.current.currentTime=((e.clientX-r.left)/r.width)*duration;}}>
            <div style={{width:duration?(currentTime/duration*100):0+"%",height:"100%",background:GOLD}}/>
          </div>
          <span style={{color:WHITE,fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{fmt(currentTime)} / {fmt(duration||0)}</span>
        </div>
      </div>
    </div>
  );
}

function P18({ rendered, mediaLib }) {
  const vs=rendered?.url||(mediaLib.find(a=>a.type&&a.type.startsWith("video"))?mediaLib.find(a=>a.type&&a.type.startsWith("video")).url:"");
  const dl=()=>{if(!vs){alert("No film yet — render first!");return;}const a=document.createElement("a");a.href=vs;a.download="MandaStrong_Film.webm";a.click();};
  return (
    <div style={{...Sp,padding:40}}>
      <div style={{maxWidth:780,margin:"0 auto"}}>
        <div style={{fontSize:11,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>DISTRIBUTION</div>
        <h1 style={{...H1,fontSize:28,marginBottom:14}}>EXPORT & DISTRIBUTE</h1>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
          {[["💾","DOWNLOAD TO DEVICE",dl],["💿","SAVE PROJECT FILE",()=>{}],["🌐","SHARE TO COMMUNITY",()=>{}]].map(([ic,lb,fn])=>(
            <button key={lb} onClick={fn} style={{...Card(),cursor:"pointer",textAlign:"center",padding:16,display:"block"}}>
              <div style={{fontSize:24,marginBottom:6}}>{ic}</div>
              <div style={{color:WHITE,fontSize:11,fontWeight:900,letterSpacing:2}}>{lb}</div>
            </button>
          ))}
        </div>
        <div style={{color:GOLD,fontWeight:900,fontSize:11,letterSpacing:3,marginBottom:10}}>SHARE TO SOCIAL MEDIA</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[["YouTube","#FF0000","https://www.youtube.com/upload"],["Instagram","#E1306C","https://www.instagram.com"],["TikTok","#69C9D0","https://www.tiktok.com/upload"],["X / Twitter","#1DA1F2","https://twitter.com/intent/tweet?text=Check+out+my+film+made+with+MandaStrong+Studio"],["Facebook","#1877F2","https://www.facebook.com/sharer/sharer.php?u=https://mandastrong1.etsy.com"],["LinkedIn","#0A66C2","https://www.linkedin.com/sharing/share-offsite/?url=https://mandastrong1.etsy.com"],["Vimeo","#1AB7EA","https://vimeo.com/upload"],["WhatsApp","#25D366","https://api.whatsapp.com/send?text=Check+out+my+film+from+MandaStrong+Studio"]].map(([s,c,link])=>(
            <button key={s} onClick={()=>window.open(link,"_blank")}
              style={{background:"#000",border:"1px solid "+GOLDDIM,padding:"10px 16px",cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=c;e.currentTarget.style.background=c+"22";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM;e.currentTarget.style.background="#000";}}>
              <div style={{color:c,fontSize:12,fontWeight:900,letterSpacing:1}}>{s}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


function TutCanvas({drawFn}){
  const cvRef=useRef(null);const rafRef=useRef(null);const t0=useRef(null);
  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;
    const ctx=cv.getContext("2d");
    const resize=()=>{const p=cv.parentElement;if(!p)return;cv.width=p.clientWidth;cv.height=Math.round(p.clientWidth*9/16);};
    resize();window.addEventListener("resize",resize);
    const draw=(ts)=>{if(!t0.current)t0.current=ts;const sec=(ts-t0.current)/1000;const t=Math.min(1,(sec%120)/120);try{drawFn(ctx,cv.width,cv.height,t,sec);}catch(e){ctx.fillStyle="#111";ctx.fillRect(0,0,cv.width,cv.height);}rafRef.current=requestAnimationFrame(draw);};
    rafRef.current=requestAnimationFrame(draw);
    return()=>{window.removeEventListener("resize",resize);if(rafRef.current)cancelAnimationFrame(rafRef.current);};
  },[drawFn]);
  return <canvas ref={cvRef} style={{width:"100%",display:"block",background:"#000"}}/>;
}

function P19({ go }) {
  const [active,setActive]=useState(null);
  const [generating,setGenerating]=useState(null);
  const [drawFns,setDrawFns]=useState({});

  const tuts=[
    {n:"01",t:"Getting Started — Platform Overview",d:"Complete walkthrough of all 23 pages, Quick Access menu, footer controls, and navigation.",dur:"3:00",l:"Beginner",page:1,tips:["Use ☰ top left to jump to any page","Hit 💾 SAVE PROJECT in the footer","Page 23 has the full How-To guide"]},
    {n:"02",t:"Writing Tools — Script to Screen",d:"How to use the 50+ writing tools on Page 5. From logline to full feature script.",dur:"4:00",l:"Beginner",page:5,tips:["Click any tool card to open it","Use AI CREATE for instant professional scripts","Save results to your Media Library"]},
    {n:"03",t:"Voice Engine — 54 Characters",d:"Selecting voices, setting pitch and rate, mood, and preparing narration for documentary.",dur:"5:00",l:"Beginner",page:6,tips:["Filter by gender, age, and origin","Hit TEST on any voice card to hear it","Use PREPARE & SPEAK to AI-format your script"]},
    {n:"04",t:"Music Video Studio — Full Walkthrough",d:"Step-by-step: Song setup, style selection, scene description, generating and exporting.",dur:"5:00",l:"Intermediate",page:6,tips:["Access from MUSIC VIDEO STUDIO on Page 6","Upload your own audio for beat-synced video","Record your own song with the red button"]},
    {n:"05",t:"Video Generator — Cinematic Scenes",d:"Describe any scene and have the Cinema Engine build it. Reference images, duration, saving clips.",dur:"4:00",l:"Intermediate",page:8,tips:["Be specific — lighting, mood, camera angle","Upload a reference image to match a visual style","Use the Documentary Recovery panel for your 13 scenes"]},
    {n:"06",t:"Timeline Editor — Building Your Film",d:"Dragging clips to tracks, syncing audio and video, setting film duration, preparing for render.",dur:"4:00",l:"Intermediate",page:13,tips:["Hit ⚡ SYNC ALL TRACKS to auto-populate","Set film duration — 60, 90, or 180 minutes","Hit → RENDER when your timeline is ready"]},
    {n:"07",t:"Audio Mixer — Professional Sound",d:"Setting the perfect mix for documentary, narrative film, or music video.",dur:"3:00",l:"Beginner",page:15,tips:["Documentary: VOICE 85 · MUSIC 40 · EFX 50 · MASTER 85","Music video: MUSIC 75 · VOICE 60 · EFX 40 · MASTER 85"]},
    {n:"08",t:"Render Engine — Exporting in 4K",d:"Quality settings, starting the render, what to do if clips need regenerating.",dur:"4:00",l:"Intermediate",page:16,tips:["1080p recommended for most use","4K for professional distribution","Missing clips are regenerated automatically"]},
    {n:"09",t:"Export & Distribute",d:"Downloading your film and sharing to all social platforms directly.",dur:"2:00",l:"Beginner",page:18,tips:["Download to device first","Each social button opens the upload page directly"]},
    {n:"10",t:"Saving & Project History",d:"Save your session, restore from history, and ensure your clips persist.",dur:"2:00",l:"Beginner",page:1,tips:["Hit 💾 SAVE PROJECT in the footer at any time","📂 MY PROJECTS shows your full session history"]},
    {n:"11",t:"Agent Grok — Your AI Assistant",d:"How to use Agent Grok to get instant answers about any tool, workflow, or production question.",dur:"2:00",l:"Beginner",page:21,tips:["Ask anything — tools, pricing, workflow","Available 24/7 — no waiting"]},
    {n:"12",t:"AI For Humanity — Full Case Study",d:"Complete case study: how the AI For Humanity documentary was built from script to render.",dur:"5:00",l:"Advanced",page:8,tips:["13 scenes generated on Page 8, synced on Page 13","Full workflow: P8 → P6 → P13 → P15 → P16 → P17 → P18"]},
  ];

  const lc={Beginner:"#22c55e",Intermediate:"#f59e0b",Advanced:"#ef4444"};

  const generate=async(idx)=>{
    setGenerating(idx);setActive(idx);
    const t=tuts[idx];
    try{
      const res=await fetch("https://njqfexhltjwpgvctmyaw.supabase.co/functions/v1/claude-proxy",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:3000,
          messages:[{role:"user",content:"Write a JavaScript canvas animation for a tutorial about \""+t.t+"\" for MandaStrong Studio cinema platform. Gold (#e8c96d) on black. Cinematic. Show animated title LESSON "+t.n+", relevant diagram for the topic, and MANDASTRONG STUDIO bottom label. Use sec for animation, t=0-1 progress. W=canvas width, H=canvas height. Return ONLY: function drawFrame(ctx,W,H,t,sec){"}]})
      });
      const d=await res.json();
      let code=d.content&&d.content[0]?d.content[0].text.trim():"";
      code=code.replace(/\"\"\"javascript|\"\"\"js|\"\"\`/g,"").trim();
      const fi=code.indexOf("function drawFrame");if(fi>0)code=code.slice(fi);
      const bo=code.indexOf("{");const bc=code.lastIndexOf("}");
      const body=bo>=0&&bc>bo?code.slice(bo+1,bc):"";
      const fn=new Function("ctx","W","H","t","sec",body);
      setDrawFns(p=>({...p,[idx]:fn}));
    }catch(e){console.error(e);}
    setGenerating(null);
  };

  return(
    <div style={{...Sp,padding:0,background:"#000"}}>
      <div style={{background:"linear-gradient(180deg,#080600,#000)",borderBottom:"1px solid "+GOLD+"44",padding:"24px 32px 18px"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{fontSize:9,color:GOLDDIM,letterSpacing:5,fontWeight:900,marginBottom:6}}>LEARNING CENTER</div>
          <h1 style={{...H1,fontSize:28,margin:"0 0 8px"}}>TUTORIALS</h1>
          <p style={{color:WHITE,fontSize:13,lineHeight:1.8,margin:0,opacity:.8}}>Hit GENERATE TO WATCH on any lesson. Claude writes a unique animated tutorial and plays it instantly.</p>
        </div>
      </div>
      <div style={{maxWidth:900,margin:"0 auto",padding:"20px 32px"}}>
        {tuts.map((t,idx)=>{
          const isActive=active===idx;
          const isGen=generating===idx;
          const hasFn=!!drawFns[idx];
          return(
            <div key={t.n} style={{marginBottom:10}}>
              <div style={{background:isActive?"#060400":"#030200",border:"1px solid "+(isActive?GOLD:GOLDDIM+"66"),borderBottom:isActive?"none":undefined,display:"flex",alignItems:"stretch",cursor:"pointer"}}
                onClick={()=>setActive(isActive?null:idx)}>
                <div style={{width:56,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:isActive?"linear-gradient(180deg,"+GOLDDIM+"33,"+GOLD+"11)":"#0a0800",borderRight:"1px solid "+isActive?GOLD+"66":GOLDDIM+"33"+""}}>
                  <span style={{fontFamily:"'Cinzel',serif",color:isActive?GOLD:GOLDDIM,fontSize:13,fontWeight:900}}>{t.n}</span>
                </div>
                <div style={{flex:1,padding:"13px 16px",minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
                    <span style={{color:WHITE,fontWeight:900,fontSize:14}}>{t.t}</span>
                    <span style={{background:lc[t.l]+"1a",border:"1px solid "+lc[t.l],color:lc[t.l],padding:"1px 8px",fontSize:9,fontWeight:900,letterSpacing:2}}>{t.l.toUpperCase()}</span>
                    {hasFn&&<span style={{background:"#22c55e1a",border:"1px solid #22c55e",color:"#22c55e",padding:"1px 8px",fontSize:9,fontWeight:900,letterSpacing:2}}>GENERATED ✓</span>}
                  </div>
                  <div style={{color:GOLDDIM,fontSize:10,letterSpacing:1}}>{t.dur} · {t.tips.length} PRO TIPS</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 16px",flexShrink:0}}>
                  {isGen?(
                    <span style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:2}}>GENERATING...</span>
                  ):(
                    <button onClick={e=>{e.stopPropagation();generate(idx);}}
                      style={{background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",padding:"7px 18px",cursor:"pointer",fontSize:10,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",whiteSpace:"nowrap"}}>
                      {hasFn?"▶ PLAY AGAIN":"▶ GENERATE TO WATCH"}
                    </button>
                  )}
                  <span style={{color:isActive?GOLD:GOLDDIM,fontSize:14,fontWeight:900}}>{isActive?"▲":"▼"}</span>
                </div>
              </div>
              {isActive&&(
                <div style={{background:"#040300",border:"1px solid "+GOLD,borderTop:"none"}}>
                  {isGen?(
                    <div style={{aspectRatio:"16/9",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,background:"linear-gradient(135deg,#060400,#020100)"}}>
                      <div style={{width:60,height:60,border:"2px solid "+GOLD,borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
                      <div style={{color:GOLD,fontSize:13,fontWeight:900,letterSpacing:3}}>CLAUDE IS WRITING YOUR TUTORIAL</div>
                      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
                    </div>
                  ):hasFn?(
                    <TutCanvas drawFn={drawFns[idx]}/>
                  ):(
                    <div style={{aspectRatio:"16/9",background:"linear-gradient(135deg,#060400,#020100)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:18,cursor:"pointer"}}
                      onClick={()=>generate(idx)}>
                      <div style={{width:80,height:80,background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 50px "+GOLD+"55",cursor:"pointer"}}>
                        <span style={{color:"#000",fontSize:30,fontWeight:900,marginLeft:4}}>▶</span>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{color:GOLD,fontWeight:900,fontSize:15,letterSpacing:4,marginBottom:6}}>GENERATE TO WATCH</div>
                        <div style={{color:GOLDDIM,fontSize:10,letterSpacing:2}}>LESSON {t.n} · {t.dur} · {t.l.toUpperCase()}</div>
                      </div>
                    </div>
                  )}
                  <div style={{padding:"20px 26px"}}>
                    <p style={{color:WHITE,fontSize:14,lineHeight:1.95,marginBottom:18}}>{t.d}</p>
                    <div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:3,marginBottom:10}}>PRO TIPS</div>
                    {t.tips.map((tip,i)=>(
                      <div key={i} style={{display:"flex",gap:12,marginBottom:9,alignItems:"flex-start"}}>
                        <span style={{color:GOLD,fontWeight:900,flexShrink:0}}>✦</span>
                        <span style={{color:WHITE,fontSize:13,lineHeight:1.75}}>{tip}</span>
                      </div>
                    ))}
                    <div style={{marginTop:18,display:"flex",gap:10,flexWrap:"wrap"}}>
                      {!hasFn&&!isGen&&<button onClick={()=>generate(idx)} style={{background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",padding:"11px 28px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>▶ GENERATE TO WATCH</button>}
                      {hasFn&&!isGen&&<button onClick={()=>generate(idx)} style={{background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"none",color:"#000",padding:"11px 28px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>↺ REGENERATE</button>}
                      <button onClick={()=>go(t.page)} style={{background:"transparent",border:"1px solid "+GOLD,color:GOLD,padding:"11px 20px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>OPEN PAGE {t.page} ▶</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function P20() {
  const [tab,setTab]=useState("tos");
  const sec=(title,body)=>(
    <div style={{marginBottom:16}}>
      <h3 style={{color:GOLD,fontWeight:900,fontSize:13,marginBottom:8,letterSpacing:2,borderBottom:"1px solid "+GOLDDIM+"",paddingBottom:6}}>{title}</h3>
      {body}
    </div>
  );
  const p=(txt)=><p style={{color:WHITE,fontSize:13,lineHeight:1.9,marginBottom:8}}>{txt}</p>;
  const li=(items)=><ul style={{color:WHITE,fontSize:13,lineHeight:1.9,paddingLeft:20,marginBottom:8}}>{items.map((t,i)=><li key={i} style={{marginBottom:3}}>{t}</li>)}</ul>;

  return (
    <div style={{...Sp,padding:40}}>
      <div style={{maxWidth:860,margin:"0 auto"}}>
        <div style={{fontSize:11,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>LEGAL</div>
        <h1 style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:28,fontWeight:900,letterSpacing:4,marginBottom:4}}>TERMS & DISCLAIMER</h1>
        <div style={{color:WHITE,fontSize:11,marginBottom:20,letterSpacing:2}}>EFFECTIVE MARCH 2026 · MANDASTRONG STUDIO</div>

        {/* Tab selector */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",marginBottom:28,border:"1px solid "+GOLDDIM}}>
          {[["tos","TERMS OF SERVICE"],["disc","DISCLAIMER"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{background:tab===id?"linear-gradient(135deg,#0a0500,#1a0800)":"#000",border:"none",borderBottom:tab===id?"2px solid "+GOLD:"2px solid transparent",color:tab===id?GOLD:WHITE,padding:"14px",cursor:"pointer",fontSize:12,fontWeight:900,letterSpacing:3,fontFamily:"'Rajdhani',sans-serif"}}>
              {label}
            </button>
          ))}
        </div>

        {tab==="tos"&&(
          <div>
            <div style={{background:"#050500",border:"2px solid "+GOLD,padding:"14px 20px",marginBottom:20,textAlign:"center"}}>
              <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900}}>MANDASTRONG STUDIO · PROFESSIONAL CINEMA INTELLIGENCE PLATFORM</div>
              <div style={{color:WHITE,fontSize:12,marginTop:4}}>By using this platform you agree to be legally bound by these Terms.</div>
            </div>

            {sec("1. ACCEPTANCE OF TERMS",<>{p("By accessing or using MandaStrong Studio you agree to be legally bound by these Terms of Service. If you do not agree, do not use this platform. These terms apply to all users including free, trial, and paid subscribers.")}</>)}
            {sec("2. SUBSCRIPTIONS & BILLING",<>{p("MandaStrong Studio offers three paid plans: Creator ($20/mo), Pro ($30/mo), and Studio ($50/mo). All plans bill monthly and auto-renew unless cancelled before the renewal date. The Studio Plan includes a 7-day free trial with no charge during the trial period. All payments are processed securely via Stripe. No refunds are issued for partial billing periods.")}</>)}
            {sec("3. INTELLECTUAL PROPERTY & CONTENT RIGHTS",<>{p("You retain full ownership of all original media, scripts, and creative content you upload to MandaStrong Studio. Studio Plan subscribers receive full commercial rights to content produced using the platform's AI tools. Creator and Pro plan subscribers may use content for personal and non-commercial purposes unless otherwise agreed in writing.")}{p("MandaStrong Studio, its tools, interface, branding, and codebase remain the intellectual property of Amanda Woolley and MandaStrong Studio. You may not reproduce, distribute, or resell the platform itself.")}</>)}
            {sec("4. AI-GENERATED CONTENT",<>{p("Content generated by MandaStrong Studio's AI tools is produced algorithmically. You are solely responsible for reviewing, editing, and verifying all AI-generated outputs before use. MandaStrong Studio makes no guarantees regarding the accuracy, appropriateness, or fitness for purpose of AI-generated content.")}{p("You agree not to use AI-generated content to produce material that is defamatory, illegal, harmful, or in violation of third-party rights.")}</>)}
            {sec("5. ACCEPTABLE USE",<>{p("You agree to use MandaStrong Studio only for lawful purposes. The following are strictly prohibited:")}{li(["Producing content that is defamatory, obscene, or harasses individuals","Infringing on third-party intellectual property rights","Attempting to reverse-engineer, copy, or redistribute the platform","Using the platform to generate spam, malware, or fraudulent content","Sharing your account credentials with third parties"])}</>)}
            {sec("6. SOCIAL MISSION",<>{p("A meaningful portion of all subscription proceeds is donated to veterans mental health initiatives and school anti-bullying programmes. These are not marketing statements — they are the founding mission of this platform. Full details available at MandaStrong1.Etsy.com.")}</>)}
            {sec("7. LIMITATION OF LIABILITY",<>{p("MandaStrong Studio is provided as-is without warranties of any kind, express or implied. To the maximum extent permitted by law, MandaStrong Studio shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount you paid in the 30 days prior to the claim.")}</>)}
            {sec("8. TERMINATION",<>{p("We reserve the right to suspend or terminate your account at any time if you violate these Terms. You may cancel your subscription at any time via your account settings. Cancellation takes effect at the end of the current billing period.")}</>)}
            {sec("9. GOVERNING LAW",<>{p("These Terms are governed by the laws of the jurisdiction in which MandaStrong Studio is registered. Any disputes shall be resolved by binding arbitration or the courts of that jurisdiction.")}</>)}
            {sec("10. CONTACT",<>{p("For support, billing enquiries, or legal notices contact us at MandaStrong1.Etsy.com or through Agent Grok on Page 21 of the platform.")}</>)}

            <div style={{background:"#050500",border:"1px solid "+GOLDDIM,padding:"12px 16px",marginTop:8}}>
              <p style={{color:GOLDDIM,fontSize:11,margin:0,letterSpacing:1}}>MANDASTRONG STUDIO · AMANDA WOOLLEY, FOUNDER · MARCH 2026</p>
            </div>
          </div>
        )}

        {tab==="disc"&&(
          <div>
            <div style={{background:"#050500",border:"2px solid "+GOLD,padding:"14px 20px",marginBottom:20,textAlign:"center"}}>
              <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900}}>IMPORTANT — PLEASE READ BEFORE USING THIS PLATFORM</div>
              <div style={{color:WHITE,fontSize:12,marginTop:4}}>This disclaimer governs your use of all AI-generated content and platform services.</div>
            </div>

            {sec("AI-GENERATED CONTENT",<>{p("MandaStrong Studio is an AI-assisted creative platform. All outputs — including scripts, narrations, images, and video — are generated algorithmically and must be reviewed by the user before publication or commercial use. The platform does not guarantee the accuracy, completeness, or appropriateness of any AI-generated material.")}{p("AI-generated content may occasionally contain inaccuracies, unintended bias, outdated information, or incomplete details. You are solely responsible for fact-checking, editing, and ensuring compliance before publishing or distributing any content created on this platform.")}</>)}
            {sec("NO PROFESSIONAL ADVICE",<>{p("Nothing generated by MandaStrong Studio constitutes legal, medical, financial, psychological, or any other form of professional advice. The platform is a creative production tool only. Always consult a qualified professional before acting on any information produced by AI tools.")}</>)}
            {sec("THIRD-PARTY SERVICES",<>{p("MandaStrong Studio integrates with third-party services including payment processors and AI providers. We are not responsible for the availability, accuracy, or conduct of these services. Your use of third-party services is governed by their own terms and privacy policies.")}</>)}
            {sec("INTELLECTUAL PROPERTY",<>{p("You are responsible for ensuring that content you upload, reference, or incorporate into your productions does not infringe third-party intellectual property rights. MandaStrong Studio accepts no liability for copyright infringement arising from user-generated or user-directed content.")}</>)}
            {sec("PLATFORM AVAILABILITY",<>{p("MandaStrong Studio is provided on an 'as available' basis. We do not guarantee uninterrupted access, error-free operation, or permanent data retention. We recommend downloading and backing up all completed productions regularly. We are not liable for loss of data or creative work.")}</>)}
            {sec("SOCIAL MISSION COMMITMENT",<>{p("A meaningful portion of all subscription revenue is directed to veterans mental health programmes and school anti-bullying initiatives. This commitment is a founding principle of MandaStrong Studio and is carried out in good faith. It does not constitute a legally binding charitable obligation under these terms.")}</>)}
            {sec("USER RESPONSIBILITY",<>{p("All responsibility for how content created on MandaStrong Studio is deployed, distributed, monetised, or shared rests entirely with the user. MandaStrong Studio shall not be held liable for any consequences arising from the publication or use of platform-generated content.")}</>)}
            {sec("CHANGES TO THIS DISCLAIMER",<>{p("MandaStrong Studio reserves the right to update this disclaimer at any time. Continued use of the platform following any update constitutes your acceptance of the revised terms.")}</>)}

            <div style={{background:"#050500",border:"1px solid "+GOLDDIM,padding:"12px 16px",marginTop:8}}>
              <p style={{color:GOLDDIM,fontSize:11,margin:0,letterSpacing:1}}>— AMANDA WOOLLEY · FOUNDER · MANDASTRONG STUDIO · MARCH 2026 · mandastrongstudio2026.bolt.host</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function P21() {
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Welcome to MandaStrong Studio. I am Agent Grok — your 24/7 production consultant. Ask me anything about tools, workflow, pricing, or filmmaking."}]);
  const [inp2,setInp2]=useState(""); const [loading,setLoading]=useState(false);
  const bot=useRef(null);
  const QUICK=["Recommended production workflow?","How do I generate a scene?","Best audio mix for documentary?","How to export in 4K?","Subscription plans?","How does the Voice Engine work?","What genres can I render?","How do I use the Timeline?"];
  useEffect(()=>{if(bot.current)bot.current.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async(q)=>{
    const question=q||inp2.trim();if(!question)return;
    setInp2("");setLoading(true);
    setMsgs(p=>[...p,{role:"user",content:question}]);
    try{
      const d=await proxyFetch({model:"claude-sonnet-4-20250514",max_tokens:1000,system:"You are Agent Grok, AI production assistant for MandaStrong Studio. Expert on all 23 pages, 600+ tools, 54 voice characters, video generator, music video studio, timeline, render engine up to 4K. Plans: Creator $20/mo, Pro $30/mo, Studio $50/mo with 7-day free trial. Be specific and direct.",messages:[...msgs.filter(m=>m.role!=="system"),{role:"user",content:question}]});
      setMsgs(p=>[...p,{role:"assistant",content:d&&d.content&&d.content[0]?d.content[0].text:"Try again."}]);
    }catch(e){setMsgs(p=>[...p,{role:"assistant",content:"Connection error. Try again."}]);}
    setLoading(false);
  };
  return(
    <div style={{height:"calc(100vh - 116px)",display:"flex",flexDirection:"column",background:"#000",overflow:"hidden"}}>
      <div style={{flex:1,margin:"12px 16px",border:"2px solid "+GOLD,display:"flex",flexDirection:"column",background:"#050300",overflow:"hidden",minHeight:0}}>
        <div style={{background:"linear-gradient(135deg,#1a0800,#0a0400)",borderBottom:"2px solid "+GOLD,padding:"12px 18px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <div style={{position:"relative",flexShrink:0}}>
            <div style={{width:46,height:46,background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 18px "+GOLD+"77"}}>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:22,fontWeight:900,color:"#000"}}>G</span>
            </div>
            <div style={{position:"absolute",bottom:-2,right:-2,width:11,height:11,background:"#22c55e",border:"2px solid #000",borderRadius:"50%"}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:"clamp(18px,2.5vw,28px)",fontWeight:900,letterSpacing:4,lineHeight:1}}>AGENT GROK</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginTop:3}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 5px #22c55e"}}/><span style={{color:"#22c55e",fontSize:10,fontWeight:900,letterSpacing:2}}>ONLINE 24/7</span></div>
              <span style={{color:GOLD,fontSize:10,letterSpacing:2,fontWeight:700}}>YOUR AI PRODUCTION CONSULTANT</span>
            </div>
          </div>
          <div style={{display:"flex",gap:5,flexShrink:0}}>
            {[["23","PAGES"],["600+","TOOLS"],["54","VOICES"],["4K","RENDER"]].map(([v,l])=>(
              <div key={l} style={{background:"#0a0800",border:"1px solid "+GOLD+"44",padding:"5px 8px",textAlign:"center",minWidth:40}}>
                <div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:12,fontWeight:900}}>{v}</div>
                <div style={{color:"#22c55e",fontSize:8,letterSpacing:1,marginTop:1,fontWeight:700}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:10,flexDirection:m.role==="user"?"row-reverse":"row"}}>
              <div style={{width:32,height:32,flexShrink:0,background:m.role==="user"?"#1a0a00":"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"1px solid "+GOLD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:m.role==="user"?GOLD:"#000",fontFamily:"'Cinzel',serif"}}>{m.role==="user"?"Y":"G"}</div>
              <div style={{flex:1,maxWidth:"82%"}}>
                <div style={{color:GOLD,fontSize:9,fontWeight:900,letterSpacing:3,marginBottom:3,textAlign:m.role==="user"?"right":"left"}}>{m.role==="user"?"YOU":"AGENT GROK"}</div>
                <div style={{background:m.role==="user"?"#100800":"#0a0900",border:"1px solid "+GOLD+"33",padding:"9px 13px"}}>
                  <div style={{color:WHITE,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{m.content}</div>
                </div>
              </div>
            </div>
          ))}
          {loading&&<div style={{display:"flex",gap:10}}><div style={{width:32,height:32,flexShrink:0,background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#000",fontFamily:"'Cinzel',serif"}}>G</div><div style={{background:"#0a0900",border:"1px solid "+GOLD+"33",padding:"9px 13px"}}><span style={{color:GOLD,fontSize:12}}>Thinking...</span></div></div>}
          <div ref={bot}/>
        </div>
        <div style={{borderTop:"1px solid "+GOLD+"22",padding:"8px 16px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:4,flexShrink:0,background:"#040200"}}>
          {QUICK.map(q=>(
            <button key={q} onClick={()=>send(q)}
              style={{background:"#0a0800",border:"1px solid "+GOLD+"33",color:GOLDDIM,padding:"6px 10px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",textAlign:"left",lineHeight:1.4}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.color=GOLD;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=GOLD+"33";e.currentTarget.style.color=GOLDDIM;}}>
              ✦ {q}
            </button>
          ))}
        </div>
        <div style={{borderTop:"1px solid "+GOLD,padding:"10px 16px",display:"flex",gap:8,flexShrink:0,background:"#030200"}}>
          <textarea value={inp2} onChange={e=>setInp2(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder="Ask anything about tools, workflow, pricing or production..."
            rows={2}
            style={{flex:1,resize:"none",padding:"9px 12px",fontSize:13,background:"#0a0800",border:"1px solid "+GOLD+"44",color:WHITE,outline:"none",lineHeight:1.6,fontFamily:"'Rajdhani',sans-serif",boxSizing:"border-box"}}/>
          <button onClick={()=>send()} disabled={loading||!inp2.trim()}
            style={{background:loading||!inp2.trim()?"#1a0a00":"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",border:"1px solid "+(loading||!inp2.trim()?GOLD+"22":GOLD),color:loading||!inp2.trim()?GOLDDIM:"#000",padding:"10px 20px",cursor:loading||!inp2.trim()?"not-allowed":"pointer",fontSize:12,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",alignSelf:"stretch"}}>
            {loading?"⟳":"SEND ▶"}
          </button>
        </div>
      </div>
    </div>
  );
}

function P22() {
  const [posts,setPosts]=useState([{id:1,user:"Sarah J.",title:"Epic Action Feature",icon:"🎬",views:2847,likes:1522},{id:2,user:"Mike Chen",title:"Family Documentary",icon:"📽",views:1256,likes:812},{id:3,user:"Emily R.",title:"Short Film Entry",icon:"🏆",views:3421,likes:2156},{id:4,user:"Alex T.",title:"Music Video Cut",icon:"🎵",views:5234,likes:4012}]);
  return (
    <div style={{...Sp,padding:40}}>
      <div style={{maxWidth:780,margin:"0 auto"}}>
        <div style={{fontSize:11,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>CREATOR NETWORK</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h1 style={{...H1,fontSize:28,margin:0}}>COMMUNITY HUB</h1>
          <button style={{...G("gold",false)}}>UPLOAD YOUR MOVIE</button>
        </div>
        {posts.map(p=>(
          <div key={p.id} style={{...Card(),marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:24}}>{p.icon}</span>
              <div>
                <div style={{color:GOLD,fontWeight:900,fontSize:14}}>{p.title}</div>
                <div style={{color:WHITE,fontSize:12}}>by {p.user}</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{color:WHITE,fontSize:12}}>👁 {p.views.toLocaleString()}</span>
              <span style={{color:WHITE,fontSize:12}}>❤️ {p.likes.toLocaleString()}</span>
              <button onClick={()=>setPosts(ps=>ps.map(x=>x.id===p.id?{...x,likes:x.likes+1}:x))} style={{...G("out",true)}}>LIKE</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowToGuide() {
  const [open,setOpen]=useState(null);
  const SECTIONS=[
    {t:"GETTING STARTED",c:"Open mandastrongstudio2026.bolt.host. Admin login: woolleya129@gmail.com / Admin. Use hamburger menu top left to jump to any page. Hit Save Project in the footer regularly."},
    {t:"PAGE 5 — WRITING TOOLS",c:"100+ AI writing tools. Type a description into any tool and hit AI Create. Use the search bar to find tools fast. Save any result to your Media Library."},
    {t:"PAGE 6 — VOICE ENGINE",c:"54 cinematic voices. Filter by gender, age, origin. Hit TEST to hear any voice. Settings tab: adjust Speed, Pitch, Pause, Volume, Mood. James settings: Speed 0.62 · Pitch 0.86 · Pause 1600ms · Mood Sarcastic. Speak tab: paste script, hit Prepare and Speak. Music Video Studio button is top right."},
    {t:"PAGE 8 — VIDEO GENERATOR",c:"Click Documentary Recovery Panel to expand your 13 scenes. Click any scene to load it. Hit Generate Scene. Clips save automatically to IndexedDB. Generate all 13 then go to Page 11."},
    {t:"PAGE 11 — UPLOAD MEDIA",c:"Hit Reload Clips from Storage. All 13 clips load from IndexedDB into your Media Library. Also upload your own video, audio, and images here."},
    {t:"PAGE 13 — TIMELINE EDITOR",c:"Hit Sync All Tracks. All clips populate in correct order. Set film duration. Review timeline. When satisfied hit Render or go to Page 16."},
    {t:"PAGE 15 — AUDIO MIXER",c:"Documentary: Voice 85 · Music 40 · Effects 50 · Master 85. Music Video: Voice 60 · Music 75 · Effects 40 · Master 85. Hit Apply Mix when done."},
    {t:"PAGE 16 — RENDER ENGINE",c:"Choose quality — 720p, 1080p, or 4K. For AI For Humanity select 4K. Hit Start Render. Do not close the browser tab. Download button appears when complete."},
    {t:"PAGE 17 & 18 — PREVIEW & EXPORT",c:"Page 17: watch your completed film. Page 18: download and share directly to YouTube, Instagram, TikTok, Facebook, X, and Vimeo."},
    {t:"PAGE 19 — TUTORIALS",c:"12 lessons. Hit Generate to Watch on any lesson. Claude writes and plays an animated tutorial instantly. Each lesson has Pro Tips and an Open Page button."},
    {t:"PAGE 21 — AGENT GROK",c:"Your 24/7 AI production consultant. Ask anything about the platform, workflow, or filmmaking. Type and hit Send."},
    {t:"MUSIC VIDEO STUDIO",c:"Open from Page 6 top right. Step 1: Song details. Step 2: Style and duration 1-180 mins. Step 3: Write your scene in full detail, upload audio or hit red Record Your Own Song button. Step 4: Hit Generate Music Video. Download or Save to Media Library when done."},
    {t:"RECOMMENDED WORKFLOW",c:"Page 5 → Write script. Page 6 → Record narration. Page 8 → Generate all scenes. Page 11 → Reload clips. Page 13 → Sync tracks. Page 15 → Set audio mix. Page 16 → Render. Page 17 → Preview. Page 18 → Export and share."},
  ];
  return(
    <div style={{padding:"20px 32px 40px",maxWidth:860,margin:"0 auto"}}>
      <div style={{color:GOLD,fontWeight:900,fontSize:12,letterSpacing:4,marginBottom:12,textAlign:"center"}}>📖 HOW TO USE MANDASTRONG STUDIO — CLICK ANY SECTION</div>
      {SECTIONS.map((g,i)=>{
        const isOpen=open===i;
        return(
          <div key={i} style={{marginBottom:4}}>
            <button onClick={()=>setOpen(isOpen?null:i)} style={{width:"100%",background:isOpen?GOLD+"14":"#030200",border:"1px solid "+(isOpen?GOLD:GOLDDIM+"55"),padding:"13px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:"'Rajdhani',sans-serif"}}>
              <span style={{color:isOpen?GOLD:WHITE,fontWeight:900,fontSize:13,letterSpacing:2}}>{g.t}</span>
              <span style={{color:GOLD,fontSize:16,fontWeight:900}}>{isOpen?"▲":"▼"}</span>
            </button>
            {isOpen&&<div style={{background:"#040300",border:"1px solid "+GOLD,borderTop:"none",padding:"16px 20px",color:WHITE,fontSize:13,lineHeight:1.95}}>{g.c}</div>}
          </div>
        );
      })}
    </div>
  );
}

function P23({ go }) {
  const bgRef = useRef(null);
  const [howOpen, setHowOpen] = useState(false);
  useEffect(()=>{
    if(bgRef.current){bgRef.current.muted=true;bgRef.current.defaultMuted=true;bgRef.current.play().catch(()=>{});}
  },[]);
  return(
    <div style={{...Sp,padding:0,background:"#000"}}>
      <video ref={bgRef} autoPlay loop playsInline muted preload="auto"
        style={{width:"100%",display:"block",objectFit:"cover",background:"#000"}}
        onError={e=>{e.currentTarget.style.display="none";}}>
        <source src="/background (5).mp4" type="video/mp4"/>
        <source src="background (5).mp4" type="video/mp4"/>
        <source src="/background.mp4" type="video/mp4"/>
        <source src="background.mp4" type="video/mp4"/>
      </video>
      <div style={{padding:"28px 40px 80px"}}>
        <div style={{maxWidth:880,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:10,color:GOLD,letterSpacing:6,marginBottom:8,fontWeight:700}}>MANDASTRONG STUDIO · CINEMA INTELLIGENCE PLATFORM · 2026</div>
          <h1 style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:"clamp(32px,5vw,52px)",fontWeight:900,letterSpacing:8,textShadow:"0 0 40px "+GOLD+"99",marginBottom:20}}>THAT\'S ALL FOLKS</h1>
          <div style={{color:WHITE,fontSize:14,letterSpacing:3,marginBottom:28}}>THANK YOU FOR CREATING WITH US</div>
          <div style={{height:1,background:"linear-gradient(90deg,transparent,"+GOLD+",transparent)",marginBottom:28}}/>
          <div style={{...Card(),textAlign:"left",marginBottom:28,background:"#050500",border:"2px solid "+GOLD}}>
            <div style={{color:GOLD,fontWeight:900,fontSize:14,letterSpacing:3,marginBottom:16,textAlign:"center"}}>✦ THANK YOU ✦</div>
            <p style={{color:WHITE,fontSize:14,lineHeight:2,margin:"0 0 12px"}}>I am Amanda Woolley — author, creative producer, and founder of MandaStrong Studio.</p>
            <p style={{color:WHITE,fontSize:14,lineHeight:2,margin:"0 0 12px"}}>This platform was built for <strong style={{color:GOLD}}>you</strong> — the creator. Not just the ones here today, but every creator who comes after. The ones who have not yet found their voice. The ones with a story the world needs to hear but no studio budget to tell it.</p>
            <p style={{color:WHITE,fontSize:14,lineHeight:2,margin:"0 0 12px"}}>You now have 600+ AI tools, a full cinema production pipeline, 54 voice characters, and a render engine that outputs in 4K. The technology once locked inside major studios now lives in your browser. What you do with it is entirely yours.</p>
            <p style={{color:WHITE,fontSize:14,lineHeight:2,margin:0}}>To every creator using this platform today, and every single one who will discover it in the future — this was made for you. Keep creating. The world needs your stories. — <strong style={{color:GOLD}}>Amanda</strong></p>
          </div>
          <button onClick={()=>setHowOpen(o=>!o)} style={{width:"100%",background:howOpen?"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")":"#050500",border:"2px solid "+GOLD,color:howOpen?"#000":GOLD,padding:"18px 24px",cursor:"pointer",fontFamily:"'Cinzel',serif",fontSize:15,fontWeight:900,letterSpacing:4,marginBottom:howOpen?0:28,display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 0 30px "+GOLD+"44"}}>
            <span>📖 MANDASTRONG STUDIO HOW TO USE GUIDE</span>
            <span style={{fontSize:18}}>{howOpen?"▲":"▼"}</span>
          </button>
          {howOpen&&<div style={{background:"#030200",border:"2px solid "+GOLD,borderTop:"none",marginBottom:28}}><HowToGuide/></div>}
          <div style={{height:1,background:"linear-gradient(90deg,transparent,"+GOLD+",transparent)",margin:"28px 0"}}/>
          <div style={{...Card(),textAlign:"left",marginBottom:24,background:"#030300",border:"1px solid "+GOLDDIM}}>
            <div style={{color:GOLD,fontWeight:900,fontSize:13,letterSpacing:3,marginBottom:12,textAlign:"center"}}>✦ OUR MISSION ✦</div>
            <p style={{color:WHITE,fontSize:13,lineHeight:1.9,margin:"0 0 10px"}}>MandaStrong Studio was built on one belief: <strong style={{color:GOLD}}>every person deserves the tools to tell their story.</strong> Not just the wealthy. Not just the technically gifted. Everyone.</p>
            <p style={{color:WHITE,fontSize:13,lineHeight:1.9,margin:"0 0 10px"}}>We believe the next great filmmaker is not in Hollywood. They are in a bedroom somewhere, with a story the world needs to hear and no way to tell it. Until now.</p>
            <p style={{color:WHITE,fontSize:13,lineHeight:1.9,margin:0}}>Every Etsy purchase from MandaStrong1.Etsy.com funds anti-bullying programmes in schools and veterans mental health initiatives. When you create here, you are part of something bigger than a film.</p>
          </div>
          <div style={{...Card(),marginBottom:16,background:"#0a0600",border:"1px solid "+GOLDDIM,padding:"14px 20px",textAlign:"center"}}>
            <p style={{color:WHITE,fontSize:13,lineHeight:1.9,margin:0}}>All proceeds from <strong style={{color:GOLD}}>MandaStrong1.Etsy.com</strong> are donated directly to humanitarian causes — veterans mental health, anti-bullying programmes in schools, and children in need.</p>
          </div>
          <a href="https://MandaStrong1.Etsy.com" target="_blank" rel="noopener noreferrer"
            style={{display:"block",background:"linear-gradient(135deg,"+GOLDDIM+","+GOLD+")",color:"#000",padding:"20px 24px",textAlign:"center",textDecoration:"none",fontWeight:900,fontSize:14,letterSpacing:3,fontFamily:"'Rajdhani',sans-serif",boxShadow:"0 0 30px "+GOLD+"44",marginBottom:28}}>
            🛍 VISIT MANDASTRONG1.ETSY.COM
          </a>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>go(1)} style={{...G("gold",false),padding:"14px 40px",fontSize:13,letterSpacing:3}}>🏠 HOME</button>
            <button onClick={()=>go(1)} style={{...G("out",false),padding:"14px 40px",fontSize:13,letterSpacing:3}}>EXIT APP</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page,setPage]=useState(1);
  const [menu,setMenu]=useState(false);
  const [visited,setVisited]=useState(()=>new Set([1]));

  useEffect(()=>{
    // Fonts
    const link=document.createElement("link");
    link.rel="stylesheet";
    link.href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Rajdhani:wght@400;600;700;800;900&display=swap";
    document.head.appendChild(link);
    // Viewport — responsive for all devices
    let vp=document.querySelector("meta[name=viewport]");
    if(!vp){vp=document.createElement("meta");vp.name="viewport";document.head.appendChild(vp);}
    // Set viewport based on device type
    const hua=navigator.userAgent.toLowerCase();
    const isHPhone=/android.*mobile|iphone|ipod/.test(hua);
    const isHTablet=/ipad|android(?!.*mobile)/.test(hua);
    if(isHPhone){
      vp.content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover";
    } else if(isHTablet){
      vp.content="width=device-width,initial-scale=1,maximum-scale=2,user-scalable=yes,viewport-fit=cover";
    } else {
      vp.content="width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes";
    }
    // Global responsive + Bolt badge suppression
    const style=document.createElement("style");
    style.textContent="*{box-sizing:border-box!important;}body,html{margin:0;padding:0;width:100%;overflow-x:hidden;}[data-bolt-badge],a[href*=\'bolt.new\'],.bolt-badge,[class*=\'bolt\'],[id*=\'bolt\']{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;}@media(max-width:900px){.grid-cols-2,.grid-cols-3,.grid-cols-4{grid-template-columns:1fr 1fr!important;}}@media(max-width:600px){.grid-cols-2,.grid-cols-3,.grid-cols-4{grid-template-columns:1fr!important;}}";
    document.head.appendChild(style);
    // PWA install prompt capture
    const handleInstall=(e)=>{e.preventDefault();window.deferredInstallPrompt=e;};
    window.addEventListener("beforeinstallprompt",handleInstall);
    return()=>{try{document.head.removeChild(link);}catch{} window.removeEventListener("beforeinstallprompt",handleInstall);};
  },[]);
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("ms_user")||'{"name":"Guest","plan":"Guest","isAdmin":false}');}catch{return {name:"Guest",plan:"Guest",isAdmin:false};}});
  const [mediaLib,setMediaLib]=useState([]);
  const [timeline,setTimeline]=useState(()=>{try{return JSON.parse(localStorage.getItem("ms_timeline")||"{}");}catch{return {};}});
  const [rendered,setRendered]=useState(null);
  const [filmDuration,setFilmDuration]=useState(60);
  const [savedNotice,setSavedNotice]=useState(false);
  const [showHistory,setShowHistory]=useState(false);
  const [showSaveModal,setShowSaveModal]=useState(false);

  const go=p=>{setPage(p);window.scrollTo(0,0);try{localStorage.setItem("ms_page",JSON.stringify(p));}catch{}};

  useEffect(()=>{
    const restore=async()=>{
      try{const t=JSON.parse(localStorage.getItem("ms_timeline")||"{}");if(Object.keys(t).length>0)setTimeline(t);}catch(e){}
      try{
        const dbClips=await getAllClipsFromDB();
        if(dbClips.length>0){
          const restored=dbClips.map(c2=>({id:c2.id,name:c2.name,type:c2.type||"video/webm",url:URL.createObjectURL(c2.blob),file:new File([c2.blob],c2.name,{type:c2.type||"video/webm"}),dbId:c2.id}));
          setMediaLib(restored);
        }
      }catch(e){}
    };
    restore();
    const handler=()=>setShowHistory(true);
    window.addEventListener("ms_open_history",handler);
    return()=>window.removeEventListener("ms_open_history",handler);
  },[]);

  const saveAsset=async(a)=>{
    if(a.file instanceof File||a.file instanceof Blob){
      try{const blob=a.file;const dbId=a.id||("asset_"+Date.now());await saveClipToDB(dbId,blob,a.name||"asset",a.type||"video/webm");setMediaLib(p=>[...p,{...a,dbId}]);}
      catch(e){setMediaLib(p=>[...p,a]);}
    }else{setMediaLib(p=>[...p,a]);}
  };

  const saveProject=()=>setShowSaveModal(true);

  const doSave=(name,note)=>{
    try{
      localStorage.setItem("ms_page",JSON.stringify(page));
      localStorage.setItem("ms_user",JSON.stringify(user));
      localStorage.setItem("ms_timeline",JSON.stringify(timeline));
      localStorage.setItem("ms_medialib",JSON.stringify(mediaLib.map(a=>({...a,file:undefined}))));
      const entry={name,note,page,assetCount:mediaLib.length,date:new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}),savedPage:page,savedTimeline:JSON.parse(JSON.stringify(timeline)),savedUser:user};
      const existing=JSON.parse(localStorage.getItem("ms_project_history")||"[]");
      existing.push(entry);if(existing.length>20)existing.shift();
      localStorage.setItem("ms_project_history",JSON.stringify(existing));
      setShowSaveModal(false);setSavedNotice(true);setTimeout(()=>setSavedNotice(false),2500);
    }catch(e){setShowSaveModal(false);alert("Saved!");}
  };

  const resumeProject=async(h)=>{
    try{
      if(h.savedTimeline&&Object.keys(h.savedTimeline).length>0){setTimeline(h.savedTimeline);localStorage.setItem("ms_timeline",JSON.stringify(h.savedTimeline));}
      if(h.savedUser&&h.savedUser.name){setUser(h.savedUser);localStorage.setItem("ms_user",JSON.stringify(h.savedUser));}
      try{const dbClips=await getAllClipsFromDB();if(dbClips.length>0){const restored=dbClips.map(c2=>({id:c2.id,name:c2.name,type:c2.type||"video/webm",url:URL.createObjectURL(c2.blob),file:new File([c2.blob],c2.name,{type:c2.type||"video/webm"}),dbId:c2.id}));setMediaLib(restored);}}catch(e){}
      go(h.savedPage||h.page||5);setShowHistory(false);setSavedNotice(true);setTimeout(()=>setSavedNotice(false),2500);
    }catch(e){setShowHistory(false);}
  };

  const renderPage=()=>{
    switch(page){
      case 1: return <P1 go={go}/>;
      case 2: return <P2 go={go}/>;
      case 3: return <P3/>;
      case 4: return <P4 go={go} setUser={setUser}/>;
      case 5: return <ToolPage title="WRITING TOOLS" subtitle="AI WORKSTATION 01 — WRITING" tools={WRITING} onSave={saveAsset}/>;
      case 6: return <P6Voice onSave={saveAsset} setMediaLib={setMediaLib}/>;
      case 7: return <ToolPage title="IMAGE TOOLS" subtitle="AI WORKSTATION 03 — IMAGE" tools={IMAGE_T} onSave={saveAsset}/>;
      case 8: return <P8VideoGenerator onSave={saveAsset} user={user} filmDuration={filmDuration} setFilmDuration={setFilmDuration}/>;
      case 9: return <ToolPage title="MOTION & VFX" subtitle="AI WORKSTATION 05 — MOTION" tools={MOTION} onSave={saveAsset}/>;
      case 10: return <ToolPage title="ENHANCEMENT STUDIO" subtitle="AI WORKSTATION 06 — ENHANCE" tools={MOTION} onSave={saveAsset}/>;
      case 11: return <P11 mediaLib={mediaLib} setMediaLib={setMediaLib}/>;
      case 12: return <P12 go={go} mediaLib={mediaLib}/>;
      case 13: return <P13 go={go} mediaLib={mediaLib} timeline={timeline} setTimeline={setTimeline} user={user} filmDuration={filmDuration} setFilmDuration={setFilmDuration}/>;
      case 14: return <P14/>;
      case 15: return <P15/>;
      case 16: return <P16 go={go} timeline={timeline} setRendered={setRendered} mediaLib={mediaLib} setMediaLib={setMediaLib} user={user} filmDuration={filmDuration} setFilmDuration={setFilmDuration}/>;
      case 17: return <P17 go={go} rendered={rendered} mediaLib={mediaLib}/>;
      case 18: return <P18 rendered={rendered} mediaLib={mediaLib}/>;
      case 19: return <P19 go={go}/>;
      case 20: return <P20/>;
      case 21: return <P21/>;
      case 22: return <P22/>;
      case 23: return <P23 go={go}/>;
      default: return <P1 go={go}/>;
    }
  };

  return (
    <div style={{background:"#000",minHeight:"100vh",fontFamily:"'Rajdhani',sans-serif"}}>
      <Header go={go} setMenu={setMenu}/>
      {menu&&<QAMenu go={go} onClose={()=>setMenu(false)} user={user}/>}
      {showHistory&&<ProjectHistoryModal onClose={()=>setShowHistory(false)} onResume={resumeProject}/>}
      {showSaveModal&&<SaveSessionModal onClose={()=>setShowSaveModal(false)} onSave={doSave} currentPage={page} assetCount={mediaLib.length}/>}
      {savedNotice&&<div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",background:GOLDDIM,color:"#000",padding:"10px 24px",fontWeight:900,fontSize:13,letterSpacing:2,zIndex:999}}>✓ PROJECT SAVED</div>}
      <div style={{minHeight:"calc(100vh - 116px)"}}>
        <div key={page}>{renderPage()}</div>
      </div>
      <Footer page={page} go={go} onSave={saveProject} onHistory={()=>setShowHistory(true)}/>
    </div>
  );
}
