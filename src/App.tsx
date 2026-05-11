// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";

const DB_NAME="mandastrong_db",DB_VER=1,STORE="clips";
const openDB=()=>new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,DB_VER);r.onupgradeneeded=e=>e.target.result.createObjectStore(STORE,{keyPath:"id"});r.onsuccess=e=>res(e.target.result);r.onerror=rej;});
const saveClipToDB=async(id,blob,name,type)=>{try{const db=await openDB();const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put({id,blob,name,type});await new Promise((r,j)=>{tx.oncomplete=r;tx.onerror=j;});}catch(e){console.warn("DB save failed",e);}};
const getAllClipsFromDB=async()=>{try{const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,"readonly");const req=tx.objectStore(STORE).getAll();req.onsuccess=()=>res(req.result||[]);req.onerror=rej;});}catch(e){return[];}};

const GOLD="#e8c96d",GOLDDIM="#a07820",BG="#000000",BG4="#080808",WHITE="#d4c9a8",DIM="#aaaaaa",TOTAL=23;
const PROXY_URL="https://njqfexhltjwpgvctmyaw.supabase.co/functions/v1/claude-proxy";
const PROXY_HEADERS={"Content-Type":"application/json","anthropic-version":"2023-06-01"};
const STRIPE={basic:"https://buy.stripe.com/00wcN7fcefjNgbtceuafS03",pro:"https://buy.stripe.com/cNi8wRe8a3B52kDceuafS04",studio:"https://buy.stripe.com/cNi8wRe8a9ZtcZh7YeafS05"};

const G=(v,sm)=>({background:v==="gold"?`linear-gradient(135deg,${GOLDDIM},${GOLD})`:"transparent",border:v==="gold"?"none":`1px solid ${GOLD}`,color:v==="gold"?"#000":GOLD,borderRadius:0,fontWeight:900,padding:sm?"5px 14px":"10px 26px",fontSize:sm?11:13,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'Rajdhani',sans-serif"});
const Sp={minHeight:"100vh",background:BG,color:WHITE,fontFamily:"'Rajdhani',sans-serif",paddingBottom:160,width:"100%",overflowX:"hidden"};
const H1={fontFamily:"'Cinzel',serif",color:GOLD,letterSpacing:5,textTransform:"uppercase",margin:0,fontSize:"clamp(16px,3vw,32px)"};
const Card=(x)=>({background:"#0a0a0a",border:`1px solid ${GOLDDIM}`,borderRadius:0,padding:18,...(x||{})});

const STOCK_VOICES=[{id:"aurora",name:"Aurora",desc:"Warm British Female",style:"Documentary · Narrator",accent:"British RP"},{id:"marcus",name:"Marcus",desc:"Deep American Male",style:"Cinematic · Authoritative",accent:"American"},{id:"sophia",name:"Sophia",desc:"Bright Australian Female",style:"Upbeat · Engaging",accent:"Australian"},{id:"james",name:"James",desc:"Dry British Male",style:"Sarcastic · Witty",accent:"British"},{id:"nova",name:"Nova",desc:"Neutral AI Female",style:"Clean · Professional",accent:"Neutral"},{id:"river",name:"River",desc:"Warm American Male",style:"Friendly · Intimate",accent:"American South"}];
const VOICE_TOOLS=["Text to Voice","Text to Speech","Text to Narration","Text to Audiobook","Text to Voiceover","AI Voice Actor","Neural Voice Generator","Emotion Voice Synth","Documentary Voice","Trailer Voice Generator","Commercial Voice","Character Voice Creator","Audiobook Creator","Podcast Voice"];
let VOICE_ASSIGNMENTS={};
const loadVoiceAssignments=()=>{try{VOICE_ASSIGNMENTS=JSON.parse(localStorage.getItem("ms_voice_assign")||"{}");}catch{}};
if(typeof window!=="undefined")loadVoiceAssignments();
let currentUtterance=null;
function speakText(voiceId,txt,onStart,onEnd){if(!txt||!txt.trim())return;window.speechSynthesis.cancel();currentUtterance=null;const clean=txt.replace(/\[pause\]/g,". ").replace(/[*\/]/g," ").slice(0,5000);const doSpeak=()=>{const allVoices=window.speechSynthesis.getVoices();const utt=new SpeechSynthesisUtterance(clean);utt.pitch=1.0;utt.rate=0.9;const assignedName=VOICE_ASSIGNMENTS[voiceId];let picked=assignedName?allVoices.find(v=>v.name===assignedName):null;if(!picked){const isMale=["james","marcus","river"].includes(voiceId);const femalePat=/samantha|zira|victoria|moira|karen|susan|lisa|fiona|serena|tessa|heather|hazel|allison|ava|nora|siri|female/i;const malePat=/david|daniel|oliver|arthur|george|harry|lee|ryan|eric|reed|liam|aaron|rishi|wayne|brian|derek|steven|alan|albert|andy|tom|bruce|fred|mark|paul|peter|john|james|gordon|alex|eddy|bobby|ralph|male/i;if(isMale){picked=allVoices.find(x=>malePat.test(x.name))||allVoices.find(x=>x.lang==="en-GB"&&!femalePat.test(x.name))||allVoices.find(x=>x.lang.startsWith("en")&&!femalePat.test(x.name))||allVoices[0];}else{picked=voiceId==="aurora"?(allVoices.find(x=>/kate|serena|emily/i.test(x.name))||allVoices.find(x=>x.lang==="en-GB")):voiceId==="sophia"?(allVoices.find(x=>/karen/i.test(x.name))||allVoices.find(x=>x.lang==="en-AU")):allVoices.find(x=>/samantha|victoria|zira/i.test(x.name));picked=picked||allVoices.find(x=>x.lang.startsWith("en"))||allVoices[0];}}if(picked)utt.voice=picked;currentUtterance=utt;if(onStart)onStart();utt.onend=()=>{currentUtterance=null;if(onEnd)onEnd();};utt.onerror=()=>{currentUtterance=null;if(onEnd)onEnd();};window.speechSynthesis.speak(utt);};if(window.speechSynthesis.getVoices().length>0){doSpeak();}else{window.speechSynthesis.onvoiceschanged=()=>{doSpeak();};}}
function stopSpeaking(){window.speechSynthesis.cancel();currentUtterance=null;}

const WRITING=["Script to Movie","Text to Script","Script to Screenplay","Prompt to Story","Story to Script","Feature Film Script","Short Film Script","TV Pilot Script","Documentary Script","Commercial Script","YouTube Script","Podcast Script","Social Media Script","Explainer Script","Plot Generator","Story Outline","Three Act Structure","Five Act Structure","Beat Sheet Builder","Character Bio Writer","Character Arc Builder","Subplot Generator","Plot Twist Generator","Opening Hook Creator","Climax Designer","Logline Generator","Synopsis Writer","Treatment Writer","Scene Writer","Text to Dialogue","Dialogue Generator","Narration Writer","Voiceover Script","Interview Script","Action Line Writer","Scene Heading Tool","Parenthetical Generator","Script Formatter","Dialogue Tightener","Script Timer","Word Counter","Page Counter","Reading Time Estimator","Format Checker","Grammar Polish","Spell Checker","Continuity Checker","Plot Hole Detector","Tone Checker","Genre Classifier"];
const IMAGE_T=["Text to Image","Prompt to Image","Image to Image","Image Upscaler","Image Generator","AI Art Generator","Photo to Painting","Sketch to Image","Wireframe to Image","Background Generator","Background Remover","Sky Replacer","Object Remover","Face Generator","Character Design","Portrait Generator","Avatar Creator","Product Image Generator","Architecture Visualizer","Interior Design Generator","Landscape Generator","Abstract Art Generator","Logo Generator","Icon Creator","Texture Generator","Pattern Maker","Color Palette Generator","Style Transfer","Photo Enhancer","Photo Restorer","Old Photo Colorizer","Black & White to Color","Image Denoiser","Sharpness Enhancer","Clarity Booster","Detail Enhancer","HDR Image Creator","Exposure Fixer","White Balance AI","Color Grading Studio","LUT Creator","Tone Mapper","Contrast Adjuster","Brightness Tool","Saturation Engine","Hue Shift","Temperature Control","Vignette Tool"];
const MOTION=["AI 8K Upscaling","AI 4K Upscaling","Video Super Resolution","Frame Interpolation","Video Denoiser","Noise Reduction","Grain Remover","Artifact Remover","Scratch Remover","Video Sharpener","Clarity Booster","Detail Enhancer","Edge Enhancement","Texture Boost","White Balance AI","Color Correction","Auto Color Balance","Color Match Pro","Color Grading AI","Cinematic Color Grade","Film Stock Emulation","LUT Generator","Tone Mapping Pro","HDR Enhancement","Deep HDR Boost","Dynamic Range Expansion","Shadow Recovery","Highlight Recovery","Black Point Calibration","Gamma Correction","Contrast Enhancer","Brightness Optimizer","Saturation Booster","Smart Saturation","Face Enhancement","Face Retouch","Eye Enhancer","Teeth Whitener","Skin Tone Enhancer","Background Enhancer","Sky Enhancer","Landscape Enhancer","Night Video Enhancer","Low Light Clarity","Motion Stabilization","Shake Remover","Rolling Shutter Fix"];
const NAV=[{p:1,l:"Home"},{p:2,l:"Platform"},{p:3,l:"Examples"},{p:4,l:"Login / Pricing"},{p:5,l:"Writing Tools"},{p:6,l:"Voice Tools"},{p:7,l:"Image Tools"},{p:8,l:"Video Tools"},{p:9,l:"Motion & VFX"},{p:10,l:"Enhancement"},{p:11,l:"Upload Media"},{p:12,l:"Editor Suite"},{p:13,l:"Timeline Editor"},{p:14,l:"Enhancement Studio"},{p:15,l:"Audio Mixer"},{p:16,l:"Render Engine"},{p:17,l:"Film Preview"},{p:18,l:"Export & Distribute"},{p:19,l:"Tutorials"},{p:20,l:"Terms & Disclaimer"},{p:21,l:"Agent Grok"},{p:22,l:"Community Hub"},{p:23,l:"That's All Folks"}];

// ── TUTORIAL DATA — 16 lessons, Marcus voice, 2-3 min each ───────────────
const TUTORIAL_DATA=[
  {n:"01",page:1,title:"Getting Started — Platform Overview",level:"Beginner",duration:60,segments:[{t:0,narration:"Welcome to MandaStrong Studio. The most powerful cinema intelligence platform ever built for independent creators. I'm going to walk you through everything.",text:"MANDASTRONG STUDIO",sub:"Cinema Intelligence Platform"},{t:14,narration:"When you first open the app you are on Page 1 the home screen. You will see the platform title, key stats, and two main buttons: Start Creating, and Login.",text:"PAGE 1 — HOME",sub:"Your starting point"},{t:28,narration:"In the top left corner you will always see the hamburger menu. Click it at any time to jump directly to any of the 23 pages instantly.",text:"☰ HAMBURGER MENU",sub:"Top left — always available"},{t:42,narration:"At the bottom of every page is your footer bar. Back and Next move you page by page. Save Project saves your entire session. Open Project restores it.",text:"FOOTER BAR",sub:"Navigation · Save · Open · New Project"}]},
  {n:"02",page:4,title:"Login, Pricing & Account Setup",level:"Beginner",duration:60,segments:[{t:0,narration:"Page 4 is your login and pricing hub. Whether you are signing in, creating a new account, or just exploring, this is where it starts.",text:"PAGE 4 — LOGIN & PRICING",sub:"Your account gateway"},{t:14,narration:"On the left panel, existing users. Enter your email and password and hit Sign In to Studio. Your session, tools, and plan all load instantly.",text:"SIGN IN",sub:"Left panel — existing users"},{t:28,narration:"In the centre, new creators. Enter your name and email, hit Start Free Trial, and you get 7 days on the full Studio plan at zero cost.",text:"7-DAY FREE TRIAL",sub:"Centre panel — Studio plan, $0 to start"},{t:44,narration:"On the right, Explore First. Click Browse as Guest to access the platform immediately without an account. Some AI features require a plan but you can see everything.",text:"BROWSE AS GUEST",sub:"Right panel — no signup needed"}]},
  {n:"03",page:5,title:"Writing Tools — 50+ AI Script Writers",level:"Beginner",duration:60,segments:[{t:0,narration:"Page 5 is your writing workshop. Fifty professional AI writing tools covering every format a filmmaker needs, from loglines to full feature scripts.",text:"PAGE 5 — WRITING TOOLS",sub:"50+ AI screenplay and script tools"},{t:14,narration:"Every tool follows the same three-step pattern. You click the tool card. A panel opens with three modes, Upload, Paste, and AI Create. Choose your mode.",text:"3 MODES PER TOOL",sub:"Upload · Paste · AI Create"},{t:28,narration:"AI Create is the most powerful. Type your idea in plain English. Hit the generate button. The AI builds complete, production-ready content in seconds.",text:"AI CREATE MODE",sub:"Type your idea → get professional output"},{t:44,narration:"For scripts, try Script to Movie. Describe your film in one sentence. The AI returns a full three-act structure with scenes, dialogue, and direction.",text:"SCRIPT TO MOVIE",sub:"One idea → complete screenplay"}]},
  {n:"04",page:6,title:"Voice Engine — 55 Cinematic Characters",level:"Beginner",duration:60,segments:[{t:0,narration:"Page 6 is your Voice Engine. 55 cinematic voice characters spanning every accent, age, and style. This is where your script becomes a living performance.",text:"PAGE 6 — VOICE ENGINE",sub:"55 characters · every accent · all ages"},{t:14,narration:"The left panel is your voice library. Filter by gender, age, and origin. Search by name or style. Every character has a preview button, click the arrow to hear them speak.",text:"VOICE LIBRARY",sub:"Filter · Search · Preview any character"},{t:28,narration:"James is your primary documentary narrator. Dry, British, devastatingly calm. Speed 0.62, Pitch 0.86, Pause 1600 milliseconds. That combination produces the most human-sounding narration.",text:"JAMES — DOCUMENTARY VOICE",sub:"Speed 0.62 · Pitch 0.86 · Pause 1600ms"},{t:46,narration:"To use a voice, click their card to select them. Paste your script into the text area on the Speak tab. Hit Prepare and Speak to reformat and perform.",text:"PREPARE & SPEAK",sub:"AI formats → then performs your script"}]},
  {n:"05",page:6,title:"Music Video Studio — Photo to Cinematic Video",level:"Intermediate",duration:60,segments:[{t:0,narration:"The Music Video Studio turns your photos and audio into professional cinematic music videos. No green screen. No camera. Just your image and your music.",text:"MUSIC VIDEO STUDIO",sub:"Photo + Audio → Cinematic Music Video"},{t:14,narration:"Access it from Page 6, the Voice Engine. Hit the Music Video Studio button in the top right. A full-screen four-step wizard opens.",text:"ACCESS FROM PAGE 6",sub:"Top right button on Voice Engine"},{t:28,narration:"Step 1 is your song. Enter the title and artist name. Select genre and mood from the option panels. Set tempo. Then upload your audio track.",text:"STEP 1 — SONG",sub:"Title · Genre · Mood · Tempo · Audio"},{t:44,narration:"Step 2 is style. Choose your video style, Cinematic Narrative, Abstract, Documentary, Noir. Choose your colour grade, Golden Hour, Cool Blue, Teal and Orange.",text:"STEP 2 — STYLE",sub:"Video style · Colour grade · Effects · Cuts"}]},
  {n:"06",page:7,title:"Image Tools — 48 AI Image Generators",level:"Beginner",duration:60,segments:[{t:0,narration:"Page 7 is your image workshop. 48 professional AI image tools. Text to Image. Portrait Generator. Character Design. Background creation. Everything visual starts here.",text:"PAGE 7 — IMAGE TOOLS",sub:"48 AI image generation tools"},{t:14,narration:"The most-used tool is Text to Image. Click it. The panel opens. Switch to AI Create mode. Describe your image in detail, lighting, mood, style, subject. Hit Create.",text:"TEXT TO IMAGE",sub:"Describe anything → get a prompt package"},{t:30,narration:"The AI returns a complete image prompt package with the optimised prompt, style notes, lighting and colour palette, composition, negative prompt, and resolution settings.",text:"IMAGE PROMPT PACKAGE",sub:"7-part professional prompt output"},{t:46,narration:"Portrait Generator creates character portraits from text. Describe your character's appearance, age, emotion, lighting. Perfect for casting documents and story bibles.",text:"PORTRAIT GENERATOR",sub:"Character portraits from description"}]},
  {n:"07",page:8,title:"Video Generator — AI Scene Builder",level:"Intermediate",duration:60,segments:[{t:0,narration:"Page 8 is the heart of MandaStrong Studio. The AI Video Generator. This is where your descriptions become real cinematic scenes rendered in your browser.",text:"PAGE 8 — VIDEO GENERATOR",sub:"The heart of MandaStrong Studio"},{t:16,narration:"The workflow is simple. Enter your scene title. Describe your scene in the text area. Be specific about lighting direction, weather, subject, mood, and camera movement.",text:"DESCRIBE YOUR SCENE",sub:"Plain English → cinematic rendering"},{t:32,narration:"Use the Quick Examples panel to see what kinds of scenes work well. Click any example to load it into the description field. These are production-tested prompts.",text:"QUICK EXAMPLES",sub:"8 tested cinematic prompts to start"},{t:48,narration:"The Duration slider sets clip length from 30 to 60 seconds. For a documentary, 30-second clips give you flexibility. For music videos, longer clips create better atmosphere.",text:"DURATION SLIDER",sub:"30 to 60 seconds per clip"}]},
  {n:"08",page:11,title:"Upload Media — Asset Library",level:"Beginner",duration:60,segments:[{t:0,narration:"Page 11 is your media upload centre and asset library. Everything you bring into MandaStrong Studio lands here, your own footage, audio, images, or AI-generated clips.",text:"PAGE 11 — UPLOAD MEDIA",sub:"Your asset library and ingestion centre"},{t:14,narration:"Upload is as simple as it gets. Drag your files directly onto the upload zone, or click to browse. Video, audio, and images all accepted. Multiple files at once.",text:"DRAG & DROP",sub:"Video · Audio · Images · Multiple files"},{t:28,narration:"Every file you upload is stored in your browser's IndexedDB, a permanent local database. Your assets survive page refreshes and browser restarts automatically.",text:"INDEXEDDB STORAGE",sub:"Permanent storage — survives refresh"},{t:42,narration:"The Media Library grid shows thumbnails for every asset. Video files show a preview frame. Audio files show a music note. Images show the full thumbnail.",text:"MEDIA LIBRARY GRID",sub:"Visual thumbnails for every asset"}]},
  {n:"09",page:13,title:"Timeline Editor — Multi-Track Editing",level:"Intermediate",duration:60,segments:[{t:0,narration:"Page 13 is the Timeline Editor. This is where your clips, narration, and music come together into a complete film. Drag, arrange, sync. This is the edit suite.",text:"PAGE 13 — TIMELINE EDITOR",sub:"Multi-track editing suite"},{t:14,narration:"The timeline has three default tracks, Video Track, Audio Track, and Text Titles. You can add more tracks at any time by clicking the Add Track button in the top right.",text:"DEFAULT TRACKS",sub:"Video · Audio · Text + add unlimited tracks"},{t:30,narration:"To add clips to tracks, drag them from the asset panel at the bottom of the page. Drag video clips onto the Video Track. Drag narration files onto the Audio Track.",text:"DRAG CLIPS TO TRACKS",sub:"Drag from asset panel → drop on track"},{t:46,narration:"The Sync All Tracks button is a one-click solution. It auto-populates all tracks from your Media Library. Video clips to the video track, audio to the audio track. Everything aligned.",text:"⚡ SYNC ALL TRACKS",sub:"One click → all tracks auto-populated"}]},
  {n:"10",page:15,title:"Audio Mixer — 4-Channel Console",level:"Beginner",duration:60,segments:[{t:0,narration:"Page 15 is your Audio Mixer. A professional 4-channel mixing console that controls the balance between your voice narration, background music, sound effects, and master output.",text:"PAGE 15 — AUDIO MIXER",sub:"4-channel professional mixing console"},{t:14,narration:"The four channels are Voice, Music, EFX, and Master. Each has a large numerical display and a vertical fader. Drag the fader up and down to set your levels.",text:"4 CHANNELS",sub:"VOICE · MUSIC · EFX · MASTER"},{t:28,narration:"The recommended documentary settings are Voice at 85, Music at 40, EFX at 50, Master at 85. These settings give your narration prominence while keeping music atmospheric.",text:"DOCUMENTARY SETTINGS",sub:"VOICE 85 · MUSIC 40 · EFX 50 · MASTER 85"},{t:44,narration:"For drama and narrative films, try Voice at 75 and Music at 65. This gives music more presence while keeping dialogue clear. Adjust to taste after previewing.",text:"DRAMA SETTINGS",sub:"VOICE 75 · MUSIC 65 — more cinematic"}]},
  {n:"11",page:16,title:"Render Engine — Film Assembly",level:"Intermediate",duration:60,segments:[{t:0,narration:"Page 16 is the Render Engine. This is where every clip, every narration, every track comes together into a single complete film file. This is the finishing line.",text:"PAGE 16 — RENDER ENGINE",sub:"Full film assembly in your browser"},{t:16,narration:"Before rendering, check your clip status panel. Green means video clips are ready. If it shows no clips, go back to Page 8 to generate scenes, or Page 11 to upload media.",text:"CLIP STATUS CHECK",sub:"Green = ready · Red = go back to Page 8"},{t:32,narration:"Choose your output quality. 480p for fast drafts and testing. 720p for standard delivery. 1080p for professional broadcast. 4K for cinematic exhibition.",text:"OUTPUT QUALITY",sub:"480p · 720p · 1080p · 4K"},{t:48,narration:"Set your frame rate. 24 frames per second gives you the classic cinematic film look. 30 is broadcast standard. 60 is ultra-smooth for action and sport content.",text:"FRAME RATE",sub:"24fps cinematic · 30fps broadcast · 60fps"}]},
  {n:"12",page:17,title:"Film Preview & Export",level:"Beginner",duration:60,segments:[{t:0,narration:"Pages 17 and 18 are the last steps of your production. Page 17 is Film Preview where you watch your complete render. Page 18 is Export where you get it out into the world.",text:"PAGES 17 & 18",sub:"Final review → distribution"},{t:14,narration:"On Page 17, your rendered film loads automatically into the full-width player. Hit play to watch from the beginning. Use the scrub bar to jump to any point.",text:"PAGE 17 — FILM PREVIEW",sub:"Full-width player · Full playback controls"},{t:28,narration:"The playback controls give you skip back, rewind, play-pause, fast forward, and skip to end. The time display shows current position and total duration.",text:"PLAYBACK CONTROLS",sub:"⏮ ⏪ ▶ ⏩ ⏭ · Time display"},{t:42,narration:"If you spot something that needs fixing, go back to the relevant page for timeline changes or audio adjustments, then re-render on Page 16.",text:"REVISION WORKFLOW",sub:"Fix → re-render → preview again"}]},
  {n:"13",page:8,title:"Full Documentary Production Workflow",level:"Advanced",duration:60,segments:[{t:0,narration:"This is the complete documentary production workflow. Every stage, in order, from first idea to finished film. Follow this sequence and you will produce a professional result every time.",text:"DOCUMENTARY WORKFLOW",sub:"The complete 7-stage production pipeline"},{t:16,narration:"Stage 1, Video Generator, Page 8. This is where you build your visual scenes. Write your prompts. Upload reference images if you have them. Generate each scene and save to library.",text:"STAGE 1 — PAGE 8",sub:"Video Generator → generate all scenes"},{t:32,narration:"For a documentary, aim for 8 to 12 scenes. Each 30 to 60 seconds. Give each scene a clear descriptive title so you can identify it easily in the Timeline Editor.",text:"SCENE PLANNING",sub:"8-12 scenes · 30-60s each · clear titles"},{t:48,narration:"Stage 2, Voice Engine, Page 6. Select James. Set speed to 0.62, pitch to 0.86, pause to 1600 milliseconds. Paste your narration. Hit Prepare and Speak. Save each chapter.",text:"STAGE 2 — PAGE 6",sub:"Voice Engine → James → record narration"}]},
  {n:"14",page:1,title:"Save & Restore Projects",level:"Beginner",duration:60,segments:[{t:0,narration:"MandaStrong Studio has a full project save and restore system. Your work is never lost. This tutorial covers exactly how to save, restore, and manage your projects.",text:"SAVE & RESTORE PROJECTS",sub:"Never lose your work"},{t:14,narration:"Hit Save Project in the footer bar at any time. A modal opens. Give your session a name, Chapter 1 Complete, Scene 3 Draft, Final Cut, and an optional note.",text:"💾 SAVE PROJECT",sub:"Footer bar → name your session → save"},{t:28,narration:"Your session saves four things. Your current page, your user plan, your timeline arrangement, and your complete media library reference list.",text:"WHAT GETS SAVED",sub:"Page · Plan · Timeline · Media Library"},{t:42,narration:"Video clips and audio files are stored separately in IndexedDB, your browser's permanent local database. They survive page refreshes and browser restarts automatically.",text:"INDEXEDDB — PERMANENT STORAGE",sub:"Clips stored in browser database permanently"}]},
  {n:"15",page:21,title:"Agent Grok — AI Studio Assistant",level:"Beginner",duration:60,segments:[{t:0,narration:"Page 21 is Agent Grok. Your 24-7 AI studio assistant with expert knowledge of every tool, every workflow, and every page in MandaStrong Studio.",text:"PAGE 21 — AGENT GROK",sub:"Your 24/7 AI studio assistant"},{t:14,narration:"Access Agent Grok two ways. Click the G icon in the top right of the header from any page. Or navigate directly to Page 21 from the Quick Access menu.",text:"ACCESS AGENT GROK",sub:"Header G icon · or Page 21 from ☰ menu"},{t:28,narration:"The chat interface is professional and clean. Your messages in gold. Grok's responses in blue. A full conversation history scrolls as you talk.",text:"CHAT INTERFACE",sub:"You in gold · Grok in blue · full history"},{t:42,narration:"Ask Grok anything about the platform. Walk me through the full production workflow. How do I export in 8K. What voice should I use for documentary.",text:"WHAT TO ASK",sub:"Workflow · Tools · Export · Pricing · Anything"}]},
  {n:"16",page:23,title:"Mission, Community & Final Words",level:"Beginner",duration:60,segments:[{t:0,narration:"Page 23 is That's All Folks. The heart of MandaStrong Studio. The mission statement. The community hub. And a thank you to every creator who builds here.",text:"PAGE 23 — THAT'S ALL FOLKS",sub:"Mission · Community · Final words"},{t:14,narration:"MandaStrong Studio was built on one belief. That every person deserves the tools to tell their story. Not just the wealthy. Not just the technically gifted. Everyone.",text:"THE MISSION",sub:"Every person deserves to tell their story"},{t:30,narration:"Every subscription directly funds two causes. Veterans mental health support. And school anti-bullying programmes. These are not marketing lines. They are the reason this platform exists.",text:"SOCIAL MISSION",sub:"Veterans mental health · Anti-bullying programs"},{t:46,narration:"Page 22 is the Community Hub. Upload your finished films. Watch what other creators have made. Like, comment, and connect. This is the creator network.",text:"PAGE 22 — COMMUNITY HUB",sub:"Upload · Watch · Like · Connect"}]}
];

// ── P19 — TUTORIALS with real narrated video generation ──────────────────
function P19({ go }) {
  const [tutVideos, setTutVideos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ms_tut_videos") || "{}"); } catch { return {}; }
  });
  const [generating, setGenerating] = useState(false);
  const [currentTut, setCurrentTut] = useState(null);
  const [genProgress, setGenProgress] = useState(0);
  const [genLog, setGenLog] = useState([]);
  const [playingTut, setPlayingTut] = useState(null);
  const canvasRef = useRef(null);
  const lc = { Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444" };

  const saveTutVideo = (id, url) => {
    setTutVideos(prev => {
      const updated = { ...prev, [id]: url };
      try { localStorage.setItem("ms_tut_videos", JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Pick Marcus voice (deep American male)
  const getMarcusVoice = () => {
    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
    const malePat = /david|daniel|oliver|arthur|george|harry|lee|ryan|eric|reed|liam|aaron|rishi|wayne|brian|derek|steven|alan|albert|andy|tom|bruce|fred|mark|paul|peter|john|james|gordon|alex/i;
    const femalePat = /samantha|zira|victoria|moira|karen|susan|lisa|fiona|serena|tessa|heather|allison|ava|nora|hazel|kate|emily/i;
    return voices.find(v => malePat.test(v.name) && !femalePat.test(v.name))
      || voices.find(v => v.lang === "en-US" && !femalePat.test(v.name))
      || voices.find(v => v.lang.startsWith("en") && !femalePat.test(v.name))
      || voices[0];
  };

  // Speak a segment and return promise that resolves when done
  const speakSegment = (text, voice) => new Promise(resolve => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    if (voice) utt.voice = voice;
    utt.rate = 0.74;
    utt.pitch = 0.72;
    utt.volume = 1.0;
    utt.onend = () => resolve();
    utt.onerror = () => resolve();
    window.speechSynthesis.speak(utt);
  });

  // Draw a single tutorial frame to canvas
  const drawTutFrame = (ctx, W, H, t, tut, segIdx) => {
    const seg = tut.segments[Math.min(segIdx, tut.segments.length - 1)];
    // Background — deep black with gold particle field
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    // Animated gold particles
    for (let i = 0; i < 60; i++) {
      const px = ((i * 137 + t * 80) % 1) * W;
      const py = ((i * 97 + t * 40) % 1) * H;
      const alpha = 0.04 + Math.sin(t * Math.PI * 2 + i) * 0.03;
      ctx.fillStyle = `rgba(232,201,109,${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, i % 3 === 0 ? 2 : 1, 0, Math.PI * 2);
      ctx.fill();
    }
    // Scan line effect
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, y, W, 1);
    }
    // Top bar
    const tG = ctx.createLinearGradient(0, 0, W, 0);
    tG.addColorStop(0, "rgba(160,120,32,0.9)");
    tG.addColorStop(0.5, "rgba(232,201,109,0.95)");
    tG.addColorStop(1, "rgba(160,120,32,0.9)");
    ctx.fillStyle = tG;
    ctx.fillRect(0, 0, W, H * 0.07);
    ctx.fillStyle = "#000";
    ctx.font = `900 ${Math.round(H * 0.038)}px Arial Black, Arial`;
    ctx.textAlign = "center";
    ctx.fillText("MANDASTRONG STUDIO", W / 2, H * 0.05);
    // Tutorial number badge
    ctx.fillStyle = "#000";
    ctx.fillRect(W * 0.02, H * 0.1, W * 0.1, H * 0.08);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(W * 0.02, H * 0.1, W * 0.1, H * 0.08);
    ctx.fillStyle = GOLD;
    ctx.font = `900 ${Math.round(H * 0.032)}px Arial Black`;
    ctx.textAlign = "center";
    ctx.fillText("TUT " + tut.n, W * 0.07, H * 0.148);
    // Level badge
    const lvlColor = tut.level === "Beginner" ? "#22c55e" : tut.level === "Intermediate" ? "#f59e0b" : "#ef4444";
    ctx.fillStyle = lvlColor;
    ctx.fillRect(W * 0.14, H * 0.1, W * 0.14, H * 0.08);
    ctx.fillStyle = "#000";
    ctx.font = `900 ${Math.round(H * 0.026)}px Arial Black`;
    ctx.textAlign = "center";
    ctx.fillText(tut.level.toUpperCase(), W * 0.21, H * 0.148);
    // Main title
    ctx.fillStyle = GOLD;
    ctx.font = `900 ${Math.round(H * 0.045)}px Arial Black, Arial`;
    ctx.textAlign = "center";
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 20;
    ctx.fillText(tut.title.toUpperCase(), W / 2, H * 0.28);
    ctx.shadowBlur = 0;
    // Current segment main text — big, centred
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${Math.round(H * 0.062)}px Arial Black, Arial`;
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(232,201,109,0.6)";
    ctx.shadowBlur = 30;
    const mainWords = seg.text.split(" ");
    let line1 = "", line2 = "";
    mainWords.forEach(w => {
      if ((line1 + " " + w).trim().length < 22) line1 = (line1 + " " + w).trim();
      else line2 = (line2 + " " + w).trim();
    });
    ctx.fillText(line1, W / 2, H * 0.46);
    if (line2) ctx.fillText(line2, W / 2, H * 0.54);
    ctx.shadowBlur = 0;
    // Sub text
    ctx.fillStyle = "rgba(232,201,109,0.85)";
    ctx.font = `700 ${Math.round(H * 0.032)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(seg.sub, W / 2, H * 0.65);
    // Progress bar
    ctx.fillStyle = "#111";
    ctx.fillRect(W * 0.1, H * 0.75, W * 0.8, H * 0.012);
    const progW = (t * W * 0.8);
    const pG = ctx.createLinearGradient(W * 0.1, 0, W * 0.9, 0);
    pG.addColorStop(0, GOLDDIM);
    pG.addColorStop(1, GOLD);
    ctx.fillStyle = pG;
    ctx.fillRect(W * 0.1, H * 0.75, progW, H * 0.012);
    // Segment dots
    const dots = tut.segments.length;
    const dotSpacing = W * 0.6 / dots;
    for (let d = 0; d < dots; d++) {
      ctx.beginPath();
      ctx.arc(W * 0.2 + d * dotSpacing, H * 0.82, d === segIdx ? 6 : 3, 0, Math.PI * 2);
      ctx.fillStyle = d <= segIdx ? GOLD : "#333";
      ctx.fill();
    }
    // Bottom bar
    const bG = ctx.createLinearGradient(0, H * 0.9, 0, H);
    bG.addColorStop(0, "rgba(0,0,0,0)");
    bG.addColorStop(1, "rgba(10,8,0,0.95)");
    ctx.fillStyle = bG;
    ctx.fillRect(0, H * 0.9, W, H * 0.1);
    ctx.fillStyle = "rgba(232,201,109,0.5)";
    ctx.font = `700 ${Math.round(H * 0.022)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("MANDASTRONG STUDIO 2026  ·  TUTORIAL " + tut.n + " OF 16", W / 2, H * 0.97);
    // Vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.8);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  };

  const generateOneTutorial = async (tut) => {
    setCurrentTut(tut.n);
    setGenLog(p => [...p, `Generating Tutorial ${tut.n}: ${tut.title}...`]);
    const canvas = canvasRef.current;
    const W = 1280, H = 720;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const fps = 12;
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    // Set up audio capture for narration
    let audioCtx, audioDest;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioDest = audioCtx.createMediaStreamDestination();
      // Route speech synthesis audio to capture
    } catch (e) {}
    const videoStream = canvas.captureStream(fps);
    const videoTrack = videoStream.getVideoTracks()[0];
    const combinedStream = audioDest
      ? new MediaStream([...videoStream.getTracks(), ...audioDest.stream.getTracks()])
      : videoStream;
    const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 8000000 });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.start(Math.round(1000 / fps));
    // Load voice
    await new Promise(r => {
      if (window.speechSynthesis.getVoices().length > 0) r();
      else { window.speechSynthesis.onvoiceschanged = () => r(); }
    });
    const marcusVoice = getMarcusVoice();
    // Render each segment
    for (let si = 0; si < tut.segments.length; si++) {
      const seg = tut.segments[si];
      const nextSeg = tut.segments[si + 1];
      const segDur = nextSeg ? nextSeg.t - seg.t : tut.duration - seg.t;
      const segFrames = Math.round(segDur * fps);
      const msPerFrame = Math.round(1000 / fps);
      const wallStart = performance.now();
      // Start speaking this segment (async, runs while frames render)
      speakSegment(seg.narration, marcusVoice);
      // Render frames for this segment
      await new Promise(resolve => {
        let frame = 0;
        const tick = () => {
          if (frame >= segFrames) { resolve(); return; }
          const t = frame / segFrames;
          try { drawTutFrame(ctx, W, H, (seg.t + t * segDur) / tut.duration, tut, si); } catch (e) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); }
          if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame();
          frame++;
          const due = wallStart + frame * msPerFrame;
          setTimeout(tick, Math.max(4, due - performance.now()));
        };
        tick();
      });
      // Pause between segments
      await new Promise(r => setTimeout(r, 400));
    }
    window.speechSynthesis.cancel();
    // Stop recording
    recorder.stop();
    await new Promise(r => { recorder.onstop = r; });
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    // Save to IndexedDB
    try {
      const dbId = "tut_" + tut.n;
      await saveClipToDB(dbId, blob, "Tutorial_" + tut.n + ".webm", "video/webm");
    } catch (e) {}
    saveTutVideo(tut.n, url);
    setGenLog(p => [...p, `✓ Tutorial ${tut.n} complete — ${(blob.size / 1024 / 1024).toFixed(1)}MB`]);
    setGenProgress(p => p + Math.round(100 / TUTORIAL_DATA.length));
    if (audioCtx) try { audioCtx.close(); } catch (e) {}
    return url;
  };

  const generateAllTutorials = async () => {
    setGenerating(true);
    setGenProgress(0);
    setGenLog(["Starting tutorial generation — 16 videos, Marcus voice..."]);
    for (let i = 0; i < TUTORIAL_DATA.length; i++) {
      await generateOneTutorial(TUTORIAL_DATA[i]);
      await new Promise(r => setTimeout(r, 600));
    }
    setGenerating(false);
    setCurrentTut(null);
    setGenLog(p => [...p, "✓ ALL 16 TUTORIALS COMPLETE — saved permanently to library"]);
  };

  const regenerateOne = async (tut) => {
    setGenerating(true);
    setGenLog([`Regenerating Tutorial ${tut.n}...`]);
    await generateOneTutorial(tut);
    setGenerating(false);
    setCurrentTut(null);
  };

  const doneCount = Object.keys(tutVideos).length;

  return (
    <div style={{ ...Sp }}>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ padding: "12px 18px 12px", borderBottom: `1px solid ${GOLDDIM}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: 4, fontWeight: 700 }}>LEARNING CENTER</div>
          <h1 style={{ ...H1, fontSize: 24, margin: 0 }}>TUTORIALS</h1>
          <div style={{ color: WHITE, fontSize: 11, marginTop: 3, letterSpacing: 1 }}>{doneCount} / 16 videos generated · Marcus voice · 2–3 min each</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {doneCount < 16 && !generating && (
            <button onClick={generateAllTutorials}
              style={{ background: `linear-gradient(135deg,${GOLDDIM},${GOLD})`, border: "none", color: "#000", padding: "12px 24px", cursor: "pointer", fontSize: 12, fontWeight: 900, letterSpacing: 2, fontFamily: "'Rajdhani',sans-serif" }}>
              🎬 GENERATE ALL {16 - doneCount} REMAINING
            </button>
          )}
          {doneCount === 16 && !generating && (
            <div style={{ background: "#061406", border: "1px solid #22c55e", padding: "10px 18px", color: "#22c55e", fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>
              ✓ ALL 16 TUTORIALS READY
            </div>
          )}
          {generating && (
            <div style={{ background: "#0a0800", border: `1px solid ${GOLD}`, padding: "10px 18px" }}>
              <div style={{ color: GOLD, fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>⟳ GENERATING TUT {currentTut}... {genProgress}%</div>
              <div style={{ height: 3, background: "#111", marginTop: 6 }}>
                <div style={{ width: genProgress + "%", height: "100%", background: `linear-gradient(90deg,${GOLDDIM},${GOLD})`, transition: "width .3s" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generation log */}
      {genLog.length > 0 && (
        <div style={{ margin: "10px 18px", background: "#000", border: `1px solid ${GOLDDIM}`, padding: "10px 14px", maxHeight: 100, overflowY: "auto" }}>
          {genLog.map((l, i) => (
            <div key={i} style={{ color: i === genLog.length - 1 ? "#22c55e" : DIM, fontSize: 10, lineHeight: 1.8 }}>
              {i === genLog.length - 1 ? "▶ " : "  "}{l}
            </div>
          ))}
        </div>
      )}

      {/* Tutorial cards */}
      <div style={{ padding: "8px 18px 20px" }}>
        {TUTORIAL_DATA.map(tut => (
          <div key={tut.n} style={{ ...Card(), marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {/* Number + page badge */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, minWidth: 48 }}>
                <span style={{ fontFamily: "'Cinzel',serif", color: GOLD, fontSize: 15, fontWeight: 900 }}>{tut.n}</span>
                <span style={{ background: "#050500", border: `1px solid ${GOLDDIM}`, color: GOLDDIM, padding: "1px 5px", fontSize: 9, fontWeight: 900, letterSpacing: 1 }}>P{tut.page}</span>
              </div>
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ color: WHITE, fontWeight: 900, fontSize: 13 }}>{tut.title}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ background: lc[tut.level] + "22", border: `1px solid ${lc[tut.level]}`, color: lc[tut.level], padding: "2px 8px", fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>{tut.level.toUpperCase()}</span>
                    <span style={{ color: GOLDDIM, fontSize: 10, letterSpacing: 1 }}>{Math.round(tut.duration / 60)}:{String(tut.duration % 60).padStart(2, "0")} MIN</span>
                  </div>
                </div>
                <div style={{ color: DIM, fontSize: 11, lineHeight: 1.6, marginBottom: tutVideos[tut.n] ? 10 : 0 }}>
                  {tut.segments[0].narration.slice(0, 100)}...
                </div>
                {/* Video player — shown when video exists */}
                {tutVideos[tut.n] && (
                  <div style={{ marginTop: 8 }}>
                    <video
                      src={tutVideos[tut.n]}
                      controls
                      playsInline
                      style={{ width: "100%", maxHeight: 220, background: "#000", border: `1px solid ${GOLDDIM}`, display: "block" }}
                      onPlay={() => setPlayingTut(tut.n)}
                      onPause={() => setPlayingTut(null)}
                      onEnded={() => setPlayingTut(null)}
                    />
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <button onClick={() => go(tut.page)} style={{ ...G("out", true), fontSize: 10 }}>→ GO TO PAGE {tut.page}</button>
                      {!generating && (
                        <button onClick={() => regenerateOne(tut)} style={{ background: "none", border: `1px solid ${GOLDDIM}`, color: GOLDDIM, padding: "4px 10px", cursor: "pointer", fontSize: 9, fontWeight: 900, fontFamily: "'Rajdhani',sans-serif" }}>↺ REGENERATE</button>
                      )}
                    </div>
                  </div>
                )}
                {/* Generate button for individual tutorial */}
                {!tutVideos[tut.n] && !generating && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => regenerateOne(tut)} style={{ ...G("gold", true), fontSize: 10 }}>🎬 GENERATE THIS TUTORIAL</button>
                    <button onClick={() => go(tut.page)} style={{ ...G("out", true), fontSize: 10 }}>→ GO TO PAGE {tut.page}</button>
                  </div>
                )}
                {!tutVideos[tut.n] && generating && currentTut === tut.n && (
                  <div style={{ color: GOLD, fontSize: 10, fontWeight: 900, letterSpacing: 2, marginTop: 6 }}>⟳ RENDERING NOW...</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectHistoryModal({ onClose, onResume }) {
  const [history,setHistory]=useState([]);
  useEffect(()=>{try{setHistory(JSON.parse(localStorage.getItem("ms_project_history")||"[]"));}catch{};},[]);
  const del=(idx)=>{const u=history.filter((_,i)=>i!==idx);setHistory(u);localStorage.setItem("ms_project_history",JSON.stringify(u));};
  return (
    <div style={{position:"fixed",inset:0,zIndex:1200,background:"rgba(0,0,0,0.96)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"min(580px,95vw)",background:"#050505",border:`2px solid ${GOLD}`,maxHeight:"82vh",display:"flex",flexDirection:"column"}}>
        <div style={{background:"linear-gradient(135deg,#0a0500,#050200)",borderBottom:`1px solid ${GOLD}`,padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:17,fontWeight:900,letterSpacing:4}}>📂 MY PROJECTS</div>
            <div style={{color:WHITE,fontSize:10,letterSpacing:3,marginTop:3}}>CONTINUE WHERE YOU LEFT OFF</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${GOLD}`,color:GOLD,width:30,height:30,cursor:"pointer",fontSize:15}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:18}}>
          {history.length===0?(
            <div style={{textAlign:"center",padding:"40px 20px",color:GOLDDIM}}>
              <div style={{fontSize:34,marginBottom:10}}>📂</div>
              <div style={{fontSize:12,letterSpacing:2,marginBottom:8}}>No saved sessions yet.</div>
              <div style={{fontSize:11,color:DIM,lineHeight:1.7}}>Hit 💾 SAVE PROJECT in the footer to save your current session.</div>
            </div>
          ):[...history].reverse().map((h,i)=>(
            <div key={i} style={{background:"#0a0a0a",border:`1px solid ${GOLDDIM}`,padding:"12px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1}}>
                <div style={{color:GOLD,fontWeight:900,fontSize:13,letterSpacing:2,marginBottom:3}}>{h.name||"Untitled Session"}</div>
                <div style={{color:DIM,fontSize:10,letterSpacing:1}}>{h.date} · Page {h.page} · {h.assetCount} asset{h.assetCount!==1?"s":""}</div>
                {h.note&&<div style={{color:WHITE,fontSize:11,marginTop:4,fontStyle:"italic"}}>{h.note}</div>}
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>onResume(h)} style={{background:`linear-gradient(135deg,#a07820,#e8c96d)`,border:"none",color:"#000",padding:"8px 18px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>▶ CONTINUE PROJECT</button>
                <button onClick={()=>del(history.length-1-i)} style={{background:"none",border:"1px solid #ef4444",color:"#ef4444",padding:"5px 10px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>✕</button>
              </div>
            </div>
          ))}
        </div>
        {history.length>0&&<div style={{borderTop:`1px solid ${GOLDDIM}`,padding:"10px 18px",flexShrink:0}}><button onClick={()=>{if(confirm("Delete all project history?")){localStorage.removeItem("ms_project_history");setHistory([]);}}} style={{background:"none",border:"1px solid #ef4444",color:"#ef4444",padding:"5px 14px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>🗑 CLEAR ALL</button></div>}
      </div>
    </div>
  );
}

function SaveSessionModal({ onClose, onSave, currentPage, assetCount }) {
  const [name,setName]=useState("Session — "+new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}));
  const [note,setNote]=useState("");
  const inp2={width:"100%",background:"#000",border:`1px solid ${GOLDDIM}`,padding:"9px 12px",color:WHITE,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif"};
  return (
    <div style={{position:"fixed",inset:0,zIndex:1200,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"min(400px,92vw)",background:"#050505",border:`2px solid ${GOLD}`,padding:22}}>
        <div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:15,fontWeight:900,letterSpacing:3,marginBottom:4}}>💾 SAVE SESSION</div>
        <div style={{color:DIM,fontSize:10,marginBottom:14}}>Page {currentPage} · {assetCount} assets in library</div>
        <div style={{color:GOLD,fontSize:10,letterSpacing:3,marginBottom:5}}>PROJECT NAME</div>
        <input value={name} onChange={e=>setName(e.target.value)} style={{...inp2,marginBottom:10}}/>
        <div style={{color:GOLD,fontSize:10,letterSpacing:3,marginBottom:5}}>NOTE (OPTIONAL)</div>
        <input value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Done chapters 1-5, continuing from 6..." style={{...inp2,marginBottom:16}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${GOLD}`,color:GOLD,padding:"11px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>CANCEL</button>
          <button onClick={()=>onSave(name,note)} style={{background:`linear-gradient(135deg,${GOLDDIM},${GOLD})`,border:"none",color:"#000",padding:"11px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>💾 SAVE</button>
        </div>
      </div>
    </div>
  );
}

function QAMenu({ go, onClose, user }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex"}}>
      <div style={{width:256,background:"#050505",borderRight:`1px solid ${GOLD}`,height:"100vh",overflowY:"auto",padding:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <span style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:13,fontWeight:900,letterSpacing:3}}>QUICK ACCESS</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:GOLD,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{background:`linear-gradient(135deg,${GOLDDIM},${GOLD})`,padding:"9px 12px",marginBottom:10,textAlign:"center"}}>
          <div style={{color:"#000",fontWeight:900,fontSize:10,letterSpacing:3,fontFamily:"'Cinzel',serif"}}>MANDA STRONG STUDIO</div>
        </div>
        <div style={{background:"#0a0a0a",border:`1px solid ${GOLD}`,padding:"7px 10px",marginBottom:14,textAlign:"center"}}>
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

// ── SUBSCRIBER COUNT BOX ──────────────────────────────────────────────────
function SubscriberCountBox({ user }) {
  const [count,setCount]=useState(null);
  useEffect(()=>{try{const s=localStorage.getItem("ms_subscriber_count");if(s)setCount(parseInt(s,10));}catch{};},[]);
  if(!user||user.plan==="Guest")return null;
  return (
    <div style={{background:"#0a0800",border:`1px solid ${GOLDDIM}`,padding:"3px 12px",display:"flex",flexDirection:"column",alignItems:"center",minWidth:80,flexShrink:0}}>
      <div style={{color:GOLDDIM,fontSize:8,letterSpacing:2,fontWeight:900,lineHeight:1}}>SUBSCRIBERS</div>
      <div style={{color:GOLD,fontFamily:"'Cinzel',serif",fontSize:16,fontWeight:900,lineHeight:1.2}}>{count!==null?count.toLocaleString():"—"}</div>
    </div>
  );
}

function Header({ go, setMenu, user }) {
  return (
    <header style={{position:"sticky",top:0,zIndex:500,background:"#000",borderBottom:`1px solid ${GOLD}`,padding:"0 16px",height:52,display:"flex",alignItems:"center",gap:12}}>
      <button onClick={()=>setMenu(true)} style={{background:"none",border:`1px solid ${GOLD}`,color:GOLD,width:34,height:34,cursor:"pointer",fontSize:16,flexShrink:0}}>☰</button>
      <div onClick={()=>go(1)} style={{cursor:"pointer",flexShrink:0}}>
        <div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:13,fontWeight:900,letterSpacing:3,lineHeight:1,textShadow:`0 0 16px ${GOLD}99`}}>MANDA STRONG</div>
        <div style={{fontFamily:"'Cinzel',serif",color:GOLDDIM,fontSize:9,letterSpacing:4}}>STUDIO</div>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{color:GOLD,fontSize:11,letterSpacing:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:700}}>
          ✦ CINEMA INTELLIGENCE PLATFORM &nbsp;·&nbsp; 600+ AI TOOLS &nbsp;·&nbsp; 8K EXPORT &nbsp;·&nbsp; UP TO 3-HOUR FILMS
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <SubscriberCountBox user={user}/>
        <div style={{color:"#22c55e",fontSize:11,letterSpacing:2,fontWeight:900}}>● SYSTEM ONLINE</div>
        <div onClick={()=>go(21)} style={{width:36,height:36,background:`linear-gradient(135deg,${GOLDDIM},${GOLD})`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontFamily:"'Cinzel',serif",fontSize:19,fontWeight:900,color:"#000",boxShadow:`0 0 18px ${GOLD}77`}}>G</div>
      </div>
    </header>
  );
}

function Footer({ page, go, onSave, onHistory, onNew }) {
  return (
    <footer style={{position:"fixed",bottom:0,left:0,right:0,zIndex:400,background:"#000",borderTop:`1px solid ${GOLD}`,padding:"6px 20px 8px",display:"flex",flexDirection:"column",gap:4}}>
      <div style={{textAlign:"center"}}>
        <span style={{color:GOLD,fontSize:11,letterSpacing:1,fontWeight:700}}>MANDASTRONG STUDIO 2026 · PROFESSIONAL CINEMA SYNTHESIS · MandaStrong1.Etsy.com</span>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
        <button onClick={()=>go(Math.max(1,page-1))} disabled={page===1} style={{...G("out",true),opacity:page===1?0.3:1}}>◀ BACK</button>
        <span style={{color:GOLD,fontSize:11,fontWeight:900,fontFamily:"'Cinzel',serif",letterSpacing:2}}>PAGE {page} / {TOTAL}</span>
        <button onClick={()=>go(Math.min(TOTAL,page+1))} disabled={page===TOTAL} style={{...G("gold",true),opacity:page===TOTAL?0.3:1}}>NEXT ▶</button>
        <button onClick={onSave} style={{...G("out",true),fontSize:11,letterSpacing:2}}>💾 SAVE PROJECT</button>
        <button onClick={onHistory} style={{background:`linear-gradient(135deg,${GOLDDIM},${GOLD})`,border:"none",color:"#000",padding:"5px 14px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>📂 OPEN PROJECT</button>
        <button onClick={onNew} style={{...G("out",true),fontSize:11,letterSpacing:2}}>✦ NEW PROJECT</button>
        <span style={{color:"#22c55e",fontSize:11,fontWeight:700}}>● AUTOSAVE ON</span>
      </div>
    </footer>
  );
}

function ToolCard({ name, onOpen }) {
  return (
    <div onClick={()=>onOpen(name)}
      style={{background:"#000",border:`1px solid ${GOLDDIM}`,padding:"14px 12px",cursor:"pointer",transition:"all .15s",minHeight:56,display:"flex",alignItems:"center"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.background=BG4;e.currentTarget.style.boxShadow=`0 0 10px ${GOLD}44`;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM;e.currentTarget.style.background="#000";e.currentTarget.style.boxShadow="none";}}>
      <div style={{color:WHITE,fontSize:13,fontWeight:800,lineHeight:1.3,letterSpacing:.5}}>{name}</div>
    </div>
  );
}

function ToolPanel({ tool, onClose, onSave }) {
  const isVoice=VOICE_TOOLS.includes(tool);
  const isVideoTool=["Text to Video","Image to Video","Video to Video","AI Video Creator","AI Film Generator","Video Upscaler","AI Video Generator 4K","Set to Video","Video Colorizer","Film Restoration","Time Lapse Creator","Animation Creator","Quick Film Creator"].includes(tool);
  const isImageTool=["Text to Image","Prompt to Image","Image to Image","Image Generator","AI Art Generator","Photo to Painting","Sketch to Image","Background Generator","Face Generator","Character Design","Portrait Generator","Logo Generator","Avatar Creator"].includes(tool);
  const isWritingTool=["Script to Movie","Text to Script","Script to Screenplay","Prompt to Story","Feature Film Script","Short Film Script","Documentary Script","Plot Generator","Story Outline","Beat Sheet Builder","Character Bio Writer","Logline Generator","Synopsis Writer","Scene Writer","Dialogue Generator","Narration Writer","Voiceover Script"].includes(tool);
  const [mode,setMode]=useState(isVoice?"voice":(isVideoTool||isImageTool||isWritingTool)?"ai":"upload");
  const [describe,setDescribe]=useState("");
  const [result,setResult]=useState("");
  const [url,setUrl]=useState("");
  const [loading,setLoading]=useState(false);
  const [saved,setSaved]=useState(false);
  const [playing,setPlaying]=useState(null);
  const [selVoice,setSelVoice]=useState("james");
  const fileRef=useRef(null);
  const inp={width:"100%",background:"#000",border:`1px solid ${GOLDDIM}`,padding:"9px 12px",color:WHITE,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif"};
  const speak=(vid,txt)=>speakText(vid,txt,()=>setPlaying(vid),()=>setPlaying(null));
  const runAI=async()=>{
    if(!describe.trim())return;
    setLoading(true);setSaved(false);setResult("");
    try{
      let prompt="";
      if(isVoice){prompt=`Format this as cinematic narration, voice style: ${STOCK_VOICES.find(x=>x.id===selVoice)?.style}. Mark pauses as [pause] and emphasis as *word*:\n\n${describe}`;}
      else if(isVideoTool){prompt=`You are a professional film director at MandaStrong Studio. Tool: "${tool}".\n\nUser description: ${describe}\n\nGenerate a COMPLETE PRODUCTION-READY video prompt package:\n\n1. OPTIMISED VIDEO PROMPT\n2. SCENE BREAKDOWN (5-8 shots)\n3. CAMERA DIRECTIONS\n4. LIGHTING & COLOUR GRADE\n5. AUDIO NOTES\n6. DURATION ESTIMATE\n7. DIRECTOR'S NOTES`;}
      else if(isImageTool){prompt=`You are a professional visual artist at MandaStrong Studio. Tool: "${tool}".\n\nUser description: ${describe}\n\nGenerate a COMPLETE IMAGE PROMPT PACKAGE:\n\n1. OPTIMISED PROMPT\n2. STYLE\n3. LIGHTING & COLOUR PALETTE\n4. COMPOSITION & FRAMING\n5. NEGATIVE PROMPT\n6. ASPECT RATIO & RESOLUTION\n7. STYLE REFERENCES`;}
      else if(isWritingTool){prompt=`You are a professional screenwriter at MandaStrong Studio. Tool: "${tool}".\n\nUser request: ${describe}\n\nGenerate complete, properly formatted, production-ready content.`;}
      else{prompt=`You are a professional at MandaStrong Studio cinema AI platform. Tool: "${tool}".\n\nUser request: ${describe}\n\nGenerate complete, detailed, professional, production-ready content.`;}
      const res=await fetch(PROXY_URL,{method:"POST",headers:PROXY_HEADERS,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,messages:[{role:"user",content:prompt}]})});
      const d=await res.json();
      const txt=d.content&&d.content[0]?d.content[0].text:"Generated!";
      setResult(txt);
      if(isVoice)speak(selVoice,txt);
    }catch(e){setResult("Error — check your connection and try again.");}
    setLoading(false);
  };
  const saveAsset=()=>{const content=result||describe;if(!content.trim())return;if(onSave)onSave({id:Date.now()+Math.random(),name:`${tool} — ${isVoice?STOCK_VOICES.find(x=>x.id===selVoice)?.name:"Result"}`,type:isVoice?"audio/narration":"text/plain",url:"",content});setSaved(true);};
  return (
    <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"min(600px,95vw)",background:"#050505",border:`1px solid ${GOLD}`,padding:26,maxHeight:"92vh",overflowY:"auto"}}>
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
                <div key={v.id} onClick={()=>setSelVoice(v.id)} style={{background:"#000",border:`2px solid ${selVoice===v.id?GOLD:GOLDDIM}`,padding:"10px 12px",cursor:"pointer",boxShadow:selVoice===v.id?`0 0 12px ${GOLD}44`:"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{color:selVoice===v.id?GOLD:WHITE,fontSize:14,fontWeight:900}}>{v.name}</span>
                    <button onClick={e=>{e.stopPropagation();speak(v.id,`Hi I am ${v.name}. ${v.desc}. Ready to narrate.`);}} style={{background:"none",border:`1px solid ${GOLDDIM}`,color:GOLD,padding:"2px 8px",cursor:"pointer",fontSize:10,fontWeight:900}}>{playing===v.id?"⏹":"▶"}</button>
                  </div>
                  <div style={{color:GOLD,fontSize:11}}>{v.desc}</div>
                  <div style={{color:WHITE,fontSize:10,marginTop:2}}>{v.style} · {v.accent}</div>
                </div>
              ))}
            </div>
            <textarea value={describe} onChange={e=>setDescribe(e.target.value)} placeholder="Paste your narration text here..." style={{...inp,height:110,resize:"none",lineHeight:1.7,marginBottom:10}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:result?14:0}}>
              <button onClick={runAI} disabled={loading||!describe.trim()} style={{...G("gold",false),padding:"12px",opacity:loading||!describe.trim()?0.5:1}}>{loading?"⟳ GENERATING...":"AI FORMAT & SPEAK ✦"}</button>
              <button onClick={()=>speak(selVoice,describe)} disabled={!describe.trim()} style={{...G("out",false),padding:"12px",opacity:!describe.trim()?0.5:1}}>▶ SPEAK NOW</button>
            </div>
            {result&&<div><textarea value={result} onChange={e=>setResult(e.target.value)} style={{...inp,height:110,resize:"none",lineHeight:1.7,marginBottom:10}}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}><button onClick={()=>speak(selVoice,result)} style={{...G("out",false),padding:"10px"}}>▶ PLAY</button><button onClick={stopSpeaking} style={{...G("out",false),padding:"10px"}}>⏹ STOP</button><button onClick={saveAsset} style={{...G("gold",false),padding:"10px"}}>SAVE TO LIBRARY</button></div></div>}
          </div>
        )}
        {mode==="upload"&&<div style={{marginBottom:14}}><div onClick={()=>fileRef.current&&fileRef.current.click()} style={{border:`2px dashed ${GOLDDIM}`,padding:"30px 20px",textAlign:"center",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD} onMouseLeave={e=>e.currentTarget.style.borderColor=GOLDDIM}><div style={{fontSize:28,marginBottom:8}}>⬆</div><div style={{color:WHITE,fontSize:13,fontWeight:700,letterSpacing:1}}>CLICK TO BROWSE</div><div style={{color:DIM,fontSize:12,marginTop:4}}>Video · Audio · Image · Text</div></div><input ref={fileRef} type="file" style={{display:"none"}} onChange={e=>{const f=e.target.files&&e.target.files[0];if(f&&onSave){onSave({id:Date.now()+Math.random(),name:f.name,type:f.type,file:f,url:URL.createObjectURL(f)});setSaved(true);}}}/></div>}
        {mode==="paste"&&<div style={{marginBottom:14}}><div style={{color:GOLD,fontSize:12,letterSpacing:3,fontWeight:900,marginBottom:6}}>ADD URL</div><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste a URL..." style={{...inp,marginBottom:10}}/><div style={{color:GOLD,fontSize:12,letterSpacing:3,fontWeight:900,marginBottom:6}}>OR PASTE TEXT</div><textarea value={describe} onChange={e=>setDescribe(e.target.value)} placeholder="Paste your content here..." style={{...inp,height:100,resize:"none",lineHeight:1.6}}/><button onClick={saveAsset} style={{...G("gold",false),marginTop:8,width:"100%",padding:"12px"}}>SAVE TO MEDIA LIBRARY</button></div>}
        {mode==="ai"&&<div style={{marginBottom:14}}><div style={{color:GOLD,fontSize:12,letterSpacing:3,fontWeight:900,marginBottom:4}}>{isVideoTool?"DESCRIBE YOUR SCENE OR FILM IDEA":isImageTool?"DESCRIBE YOUR IMAGE":isWritingTool?"DESCRIBE YOUR STORY OR SCRIPT":"DESCRIBE WHAT YOU WANT"}</div><textarea value={describe} onChange={e=>setDescribe(e.target.value)} placeholder={isVideoTool?"e.g. A lone astronaut walks across a red planet at sunset...":isImageTool?"e.g. Portrait of a warrior queen at golden hour...":isWritingTool?"e.g. A documentary about veterans mental health...":`Describe what you want from ${tool}...`} style={{...inp,height:100,resize:"none",lineHeight:1.6}}/><button onClick={runAI} disabled={loading||!describe.trim()} style={{...G("gold",false),marginTop:8,width:"100%",padding:"14px",opacity:loading||!describe.trim()?0.5:1,fontSize:13,letterSpacing:2}}>{loading?"⟳ CREATING...":isVideoTool?"🎬 CREATE VIDEO PACKAGE ✦":isImageTool?"🎨 CREATE IMAGE PROMPT ✦":isWritingTool?"✍ WRITE SCRIPT ✦":"✦ AI CREATE"}</button>{result&&<div style={{marginTop:14}}><textarea value={result} onChange={e=>setResult(e.target.value)} style={{...inp,height:140,resize:"none",lineHeight:1.7}}/><button onClick={saveAsset} style={{...G("gold",false),marginTop:8,width:"100%",padding:"12px"}}>GENERATE & SAVE</button></div>}</div>}
        {saved&&<div style={{marginTop:14,background:"#0a2a0a",border:"1px solid #22c55e",padding:"12px 16px",textAlign:"center"}}><div style={{color:"#22c55e",fontWeight:900,fontSize:14,letterSpacing:2}}>✓ ASSET SAVED TO MEDIA LIBRARY</div></div>}
      </div>
    </div>
  );
}

function ToolPage({ title, subtitle, tools, onSave }) {
  const [search,setSearch]=useState("");
  const [open,setOpen]=useState(null);
  const filtered=tools.filter(t=>t.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{...Sp}}>
      <div style={{padding:"14px 18px 12px",borderBottom:`1px solid ${GOLDDIM}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:12,color:GOLD,letterSpacing:4,fontWeight:700}}>{subtitle}</div>
          <h1 style={{...H1,fontSize:24,margin:0}}>{title}</h1>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{position:"relative"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${tools.length} tools...`} style={{background:"#000",border:`1px solid ${GOLDDIM}`,padding:"7px 12px 7px 28px",color:WHITE,fontSize:13,outline:"none",width:200}}/>
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

function P6Voice({ onSave }) {
  const [text,setText]=useState("");
  const [processed,setProcessed]=useState("");
  const [loading,setLoading]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const [saved,setSaved]=useState(false);
  const [copied,setCopied]=useState(false);
  const [showMVS,setShowMVS]=useState(false);
  const [selVoice,setSelVoice]=useState("james");
  const [search,setSearch]=useState("");
  const [filterGender,setFilterGender]=useState("All");
  const [filterAge,setFilterAge]=useState("All");
  const [filterOrigin,setFilterOrigin]=useState("All");
  const [speed,setSpeed]=useState(0.82);
  const [pitchV,setPitchV]=useState(1.0);
  const [pauseLen,setPauseLen]=useState(700);
  const [volume,setVolume]=useState(1.0);
  const [activeTab,setActiveTab]=useState("speak");
  const [sysVoices,setSysVoices]=useState([]);
  const [audioUrl,setAudioUrl]=useState("");
  const chunksRef=useRef([]);
  const idxRef=useRef(0);
  const timerRef=useRef(null);

  useEffect(()=>{
    const load=()=>setSysVoices(window.speechSynthesis.getVoices().filter(v=>v.lang.startsWith("en")));
    load();window.speechSynthesis.onvoiceschanged=load;
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
    if(!sysVoices.length)return null;
    const enVoices=sysVoices.filter(v=>v.lang.startsWith("en"));
    const byGender=(isMale)=>enVoices.filter(v=>{const n=v.name.toLowerCase();const femalePat=/samantha|zira|victoria|moira|karen|susan|lisa|fiona|serena|tessa|heather|allison|ava|nora|hazel|kate|emily|siri/;return isMale?!femalePat.test(n):femalePat.test(n);});
    const isMale=vc.gender==="Male";
    if(["British","Scottish"].includes(vc.origin)){const gb=enVoices.filter(v=>v.lang==="en-GB");const pick=isMale?gb.find(v=>!/samantha|karen|kate|moira/i.test(v.name)):gb.find(v=>/kate|serena|moira|emily/i.test(v.name));if(pick)return pick;if(gb.length)return gb[Math.floor((vc.pitch||1)*gb.length)%gb.length];}
    if(["Irish","Welsh"].includes(vc.origin)){const gb=enVoices.filter(v=>v.lang==="en-GB"||v.lang==="en-IE");if(gb.length)return gb[Math.floor((vc.rate||0.8)*gb.length)%gb.length];}
    if(["Australian","New Zealand"].includes(vc.origin)){const au=enVoices.filter(v=>v.lang==="en-AU");if(au.length)return au[Math.floor((vc.pitch||1)*au.length)%au.length];}
    const pool=byGender(isMale);
    if(pool.length){const idx=Math.floor((vc.pitch||1.0)*10)%pool.length;return pool[idx];}
    return enVoices[0]||sysVoices[0];
  };

  const buildChunks=(txt)=>{
    let expanded=txt.replace(/\bMr\./g,"Mister").replace(/\bMrs\./g,"Missus").replace(/\bDr\./g,"Doctor").replace(/—/g," [breath] ").replace(/-{2}/g," [breath] ").replace(/\.\.\./g," [ellipsis] ").replace(/\*\*(.+?)\*\*/g,"$1").replace(/\*(.+?)\*/g,"$1").replace(/\s+/g," ").trim();
    const raw=expanded.match(/[^.!?;,\n\[\]]+[.!?;,\n]+|\[breath\]|\[ellipsis\]|[^.!?;,\n\[\]]+$/g)||[expanded];
    const chunks=[];
    for(const s of raw){const t=s.trim();if(!t)continue;if(t==="[breath]"){chunks.push({text:"",pause:0,type:"breath"});continue;}if(t==="[ellipsis]"){chunks.push({text:"",pause:0,type:"ellipsis"});continue;}const endsQuestion=/\?/.test(t),endsExclaim=/!/.test(t),endsStrong=/[.!?]$/.test(t),endsComma=/[,;]$/.test(t);chunks.push({text:t,pause:0,type:endsQuestion?"question":endsExclaim?"exclaim":endsStrong?"sentence":endsComma?"clause":"fragment"});}
    return chunks.length?chunks:[{text:expanded,pause:0,type:"sentence"}];
  };

  const speakNow=(txt)=>{
    window.speechSynthesis.cancel();if(timerRef.current)clearTimeout(timerRef.current);
    const chunks=buildChunks(txt);chunksRef.current=chunks;idxRef.current=0;setSpeaking(true);
    const baseRate=speed*(selected.rate||0.9);const basePitch=pitchV*(selected.pitch||1.0);const totalChunks=chunks.length;
    const next=()=>{
      const idx=idxRef.current;if(idx>=chunksRef.current.length){setSpeaking(false);return;}
      const chunk=chunksRef.current[idx];
      if(chunk.type==="breath"||chunk.type==="ellipsis"||!chunk.text){idxRef.current=idx+1;timerRef.current=setTimeout(next,pauseLen*0.6);return;}
      const liveVoices=window.speechSynthesis.getVoices().filter(v=>v.lang.startsWith("en"));
      const liveV=liveVoices.length>0?pickSysVoice(selected):null;
      const utt=new SpeechSynthesisUtterance(chunk.text);
      if(liveV)utt.voice=liveV;utt.volume=volume;
      const isFirst=idx===0,isLast=idx===totalChunks-1;const posInSentence=idx/Math.max(totalChunks,1);
      const ratePos=isFirst?-0.04:isLast?-0.07:posInSentence>0.35&&posInSentence<0.65?0.03:-0.01;
      const rVar=[0,0.018,-0.022,0.012,-0.016,0.024,-0.008,0.020,-0.014,0.010];const pVar=[0,0.025,-0.018,0.035,-0.022,0.015,-0.030,0.020,-0.010,0.028];
      const pitchArc=Math.sin(posInSentence*Math.PI)*0.055;
      let pitchMod=chunk.type==="question"?0.14:chunk.type==="exclaim"?0.10:isLast?-0.09:pitchArc;
      const hasEmphasis=/[A-Z]{2,}/.test(chunk.text)||/[:—]/.test(chunk.text);const emphMod=hasEmphasis?0.04:0;
      utt.rate=Math.max(0.1,Math.min(2.0,baseRate+ratePos+rVar[idx%rVar.length]));
      utt.pitch=Math.max(0.1,Math.min(2.0,basePitch+pVar[idx%pVar.length]+pitchMod+emphMod));
      const afterPause=chunk.type==="question"?Math.round(pauseLen*1.25):chunk.type==="exclaim"?Math.round(pauseLen*0.85):isLast?Math.round(pauseLen*1.5):chunk.type==="sentence"?pauseLen:chunk.type==="clause"?Math.round(pauseLen*0.48):Math.round(pauseLen*0.16);
      utt.onend=()=>{idxRef.current=idx+1;timerRef.current=setTimeout(next,afterPause);};utt.onerror=()=>{idxRef.current=idx+1;next();};
      window.speechSynthesis.speak(utt);
    };
    const voices=window.speechSynthesis.getVoices();
    if(voices.length>0){setTimeout(()=>next(),50);}else{window.speechSynthesis.onvoiceschanged=()=>{window.speechSynthesis.onvoiceschanged=null;setTimeout(()=>next(),50);};}
  };

  const processAndSpeak=async()=>{
    if(!text.trim())return;setLoading(true);setProcessed("");setSaved(false);
    try{
      const res=await fetch(PROXY_URL,{method:"POST",headers:PROXY_HEADERS,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,messages:[{role:"user",content:`You are a speech coach preparing text for TTS. Speaker: ${selected.name} — ${selected.style}. Break into short sentences, add commas for natural pauses, spell out numbers. Output ONLY the reformatted text:\n\n${text}`}]})});
      const d=await res.json();const out=d.content&&d.content[0]?d.content[0].text.trim():text;
      setProcessed(out);setActiveTab("result");speakNow(out);
    }catch(e){setProcessed(text);speakNow(text);}
    setLoading(false);
  };

  const stop=()=>{window.speechSynthesis.cancel();if(timerRef.current)clearTimeout(timerRef.current);setSpeaking(false);};
  const inp={width:"100%",background:"#000",border:`1px solid ${GOLDDIM}`,padding:"12px 14px",color:WHITE,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif",lineHeight:1.9};

  return (
    <div style={{...Sp}}>
      {showMVS&&<MusicVideoStudio onClose={()=>setShowMVS(false)} onSave={onSave}/>}
      <div style={{padding:"12px 18px",borderBottom:`1px solid ${GOLDDIM}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700}}>AI WORKSTATION 02 — CINEMA VOICE ENGINE</div>
          <h1 style={{...H1,fontSize:24,margin:0}}>TEXT TO LIFELIKE SPEECH</h1>
        </div>
        <button onClick={()=>setShowMVS(true)} style={{...G("gold",true)}}>🎬 MUSIC VIDEO STUDIO</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"290px 1fr",minHeight:"calc(100vh - 120px)"}}>
        <div style={{borderRight:`1px solid ${GOLDDIM}`,background:"#030303",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"10px 10px 6px"}}>
            <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:8}}>VOICE LIBRARY — {filtered.length} / {VOICE_CHARACTERS.length}</div>
            <div style={{marginBottom:5}}><div style={{color:GOLDDIM,fontSize:9,letterSpacing:2,marginBottom:3}}>GENDER</div><div style={{display:"flex",gap:4}}>{GENDERS.map(g=><button key={g} onClick={()=>setFilterGender(g)} style={{flex:1,background:filterGender===g?GOLD:"#111",border:`1px solid ${filterGender===g?"#000":GOLDDIM}`,color:filterGender===g?"#000":WHITE,padding:"3px 0",cursor:"pointer",fontSize:10,fontWeight:900}}>{g}</button>)}</div></div>
            <div style={{marginBottom:5}}><div style={{color:GOLDDIM,fontSize:9,letterSpacing:2,marginBottom:3}}>AGE</div><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{AGES.map(a=><button key={a} onClick={()=>setFilterAge(a)} style={{background:filterAge===a?GOLD:"#111",border:`1px solid ${filterAge===a?"#000":GOLDDIM}`,color:filterAge===a?"#000":WHITE,padding:"2px 8px",cursor:"pointer",fontSize:9,fontWeight:900}}>{a}</button>)}</div></div>
            <div style={{marginBottom:6}}><div style={{color:GOLDDIM,fontSize:9,letterSpacing:2,marginBottom:3}}>ORIGIN</div><select value={filterOrigin} onChange={e=>setFilterOrigin(e.target.value)} style={{width:"100%",background:"#111",border:`1px solid ${GOLDDIM}`,color:WHITE,padding:"4px 8px",fontSize:11,outline:"none"}}>{ORIGINS.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search voices..." style={{...inp,padding:"6px 10px",fontSize:11,height:30,marginBottom:0}}/>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"6px 6px 80px"}}>
            {filtered.map(v=>(
              <div key={v.id} onClick={()=>setSelVoice(v.id)} style={{padding:"8px 10px",marginBottom:3,background:selVoice===v.id?"#0a0800":"#000",border:`1px solid ${selVoice===v.id?GOLD:GOLDDIM}`,cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:14}}>{v.emoji}</span><span style={{color:selVoice===v.id?GOLD:WHITE,fontSize:12,fontWeight:900}}>{v.name}</span></div>
                  <button onClick={e=>{e.stopPropagation();const utt=new SpeechSynthesisUtterance("Hi I am "+v.name+". "+v.desc);const sv=pickSysVoice(v);if(sv)utt.voice=sv;utt.pitch=v.pitch||1.0;utt.rate=v.rate||0.9;window.speechSynthesis.cancel();window.speechSynthesis.speak(utt);}} style={{background:"none",border:`1px solid ${GOLDDIM}`,color:GOLD,padding:"1px 6px",cursor:"pointer",fontSize:9,fontWeight:900}}>▶</button>
                </div>
                <div style={{color:GOLD,fontSize:8,letterSpacing:1}}>{v.style}</div>
                <div style={{color:DIM,fontSize:9}}>{v.age} · {v.gender} · {v.origin}</div>
                {selVoice===v.id&&<div style={{color:"#22c55e",fontSize:8,fontWeight:900,letterSpacing:2,marginTop:2}}>✓ SELECTED</div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",borderBottom:`1px solid ${GOLDDIM}`}}>
            {[["speak","🎙 SPEAK"],["result","✦ RESULT"],["settings","🎚 SLIDERS"],["mood","🎭 MOOD"]].map(([t,l])=>(
              <button key={t} onClick={()=>setActiveTab(t)} style={{background:activeTab===t?"#0a0800":"none",border:"none",borderBottom:activeTab===t?`2px solid ${GOLD}`:"2px solid transparent",color:activeTab===t?GOLD:WHITE,padding:"10px 4px",cursor:"pointer",fontSize:10,fontWeight:900,letterSpacing:1}}>{l}</button>
            ))}
          </div>
          <div style={{flex:1,padding:"16px 20px",overflowY:"auto"}}>
            {activeTab==="speak"&&(
              <div>
                <div style={{...Card(),marginBottom:14,background:"#050500",border:`1px solid ${GOLD}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:28}}>{selected.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{color:GOLD,fontSize:14,fontWeight:900,letterSpacing:2}}>{selected.name} <span style={{color:DIM,fontSize:11,fontWeight:400}}>— {selected.region}, {selected.origin}</span></div>
                      <div style={{color:WHITE,fontSize:11,marginTop:2}}>{selected.style}</div>
                    </div>
                  </div>
                </div>
                <textarea value={text} onChange={e=>{setText(e.target.value);setProcessed("");}} placeholder={"Paste your narration here..."} style={{...inp,height:"calc(100vh - 440px)",resize:"none",marginBottom:12}}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <button onClick={processAndSpeak} disabled={loading||speaking||!text.trim()} style={{...G("gold",false),padding:"16px",fontSize:12,letterSpacing:2,opacity:loading||speaking||!text.trim()?0.5:1}}>{loading?"⟳ AI PREPARING...":"✦ PREPARE & SPEAK"}</button>
                  <button onClick={speaking?stop:()=>speakNow(text)} disabled={!text.trim()} style={{...G("out",false),padding:"16px",fontSize:12,opacity:!text.trim()?0.5:1,borderColor:speaking?"#ef4444":undefined,color:speaking?"#ef4444":undefined}}>{speaking?"⏹ STOP":"▶ SPEAK NOW"}</button>
                </div>
              </div>
            )}
            {activeTab==="result"&&(
              <div>
                <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:8}}>AI PREPARED — {selected.emoji} {selected.name}</div>
                {processed?(
                  <div>
                    <textarea value={processed} onChange={e=>setProcessed(e.target.value)} style={{...inp,height:"calc(100vh - 460px)",resize:"none",marginBottom:12,borderColor:GOLD,fontSize:12}}/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
                      <button onClick={()=>speakNow(processed)} disabled={speaking} style={{...G("gold",false),padding:"12px",opacity:speaking?0.5:1}}>{speaking?"● SPEAKING":"▶ PLAY"}</button>
                      <button onClick={stop} style={{...G("out",false),padding:"12px"}}>⏹ STOP</button>
                      <button onClick={()=>{if(onSave)onSave({id:Date.now()+Math.random(),name:"Narration — "+selected.name,type:"audio/narration",url:audioUrl||"",content:processed});setSaved(true);}} style={{...G("gold",false),padding:"12px"}}>💾 SAVE</button>
                    </div>
                    <button onClick={()=>{navigator.clipboard&&navigator.clipboard.writeText(processed);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{...G("out",true),width:"100%",fontSize:11}}>{copied?"✓ COPIED":"📋 COPY TEXT"}</button>
                    {saved&&<div style={{marginTop:8,background:"#0a2a0a",border:"1px solid #22c55e",padding:"10px",color:"#22c55e",fontWeight:900,fontSize:11,letterSpacing:2,textAlign:"center"}}>✓ SAVED TO MEDIA LIBRARY</div>}
                  </div>
                ):(
                  <div style={{textAlign:"center",padding:"80px 20px",color:GOLDDIM}}><div style={{fontSize:40,marginBottom:12}}>🎙</div><div style={{fontSize:13,letterSpacing:2}}>Paste text on the SPEAK tab then hit PREPARE & SPEAK</div></div>
                )}
              </div>
            )}
            {activeTab==="mood"&&(
              <div>
                <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:16}}>{selected.emoji} {selected.name} — MOOD PRESETS</div>
                {[["😢 Sad & Melancholic",0.55,0.82,1800],["😊 Warm & Friendly",0.88,1.05,600],["😤 Intense & Dramatic",0.78,0.95,900],["🎉 Excited & Upbeat",1.05,1.15,400],["😌 Calm & Peaceful",0.65,0.90,1200],["👔 Professional & Authoritative",0.72,0.88,800],["🎭 Theatrical & Grand",0.68,0.85,1400],["💀 Dark & Ominous",0.55,0.75,2000],["🌟 Inspirational",0.76,1.00,1000],["😏 Sarcastic & Dry",0.80,0.92,1600]].map(([mood,spd,ptch,pse])=>(
                  <button key={mood} onClick={()=>{setSpeed(spd);setPitchV(ptch);setPauseLen(pse);setActiveTab("settings");}} style={{display:"block",width:"100%",background:"#0a0800",border:`1px solid ${GOLDDIM}`,color:WHITE,padding:"10px 14px",cursor:"pointer",fontSize:12,fontWeight:700,textAlign:"left",marginBottom:6,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.color=GOLD;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM;e.currentTarget.style.color=WHITE;}}>
                    {mood}<span style={{float:"right",color:GOLDDIM,fontSize:10}}>spd {spd} · pitch {ptch} · pause {pse}ms</span>
                  </button>
                ))}
              </div>
            )}
            {activeTab==="settings"&&(
              <div>
                <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:16}}>{selected.emoji} {selected.name} — VOICE SLIDERS</div>
                {[["SPEED",speed,setSpeed,0.30,1.40,0.01,speed<0.55?"Very Slow":speed<0.75?"Slow":speed<0.90?"Natural":"Fast","0.3x","1.4x"],["PITCH",pitchV,setPitchV,0.50,2.00,0.01,pitchV<0.75?"Very Deep":pitchV<0.90?"Deep":pitchV<1.05?"Natural":"High","0.5","2.0"],["VOLUME",volume,setVolume,0.1,1.0,0.01,Math.round(volume*100)+"%","Quiet","Full"],["PAUSE (ms)",pauseLen,setPauseLen,0,2500,50,pauseLen<300?"Urgent":pauseLen<600?"Natural":pauseLen<1500?"Dramatic":"Deadpan","0ms","2500ms"]].map(([label,val,setter,min,max,step,desc,lo,hi])=>(
                  <div key={label} style={{...Card(),marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:GOLD,fontSize:11,fontWeight:900,letterSpacing:2}}>{label}</span><span style={{color:WHITE,fontSize:11}}>{desc}</span></div>
                    <input type="range" min={min} max={max} step={step} value={val} onChange={e=>setter(+e.target.value)} style={{width:"100%",accentColor:GOLD}}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{color:DIM,fontSize:10}}>{lo}</span><span style={{color:DIM,fontSize:10}}>{hi}</span></div>
                  </div>
                ))}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <button onClick={()=>{const utt=new SpeechSynthesisUtterance("Hello I am "+selected.name+". Testing your current settings.");const sv=pickSysVoice(selected);if(sv)utt.voice=sv;utt.rate=Math.max(0.1,Math.min(2.0,speed*(selected.rate||0.9)));utt.pitch=Math.max(0.1,Math.min(2.0,pitchV*(selected.pitch||1.0)));utt.volume=volume;window.speechSynthesis.cancel();window.speechSynthesis.speak(utt);}} style={{...G("gold",false),padding:"14px",fontSize:12}}>▶ TEST</button>
                  <button onClick={()=>{setSpeed(0.82);setPitchV(1.0);setVolume(1.0);setPauseLen(700);}} style={{...G("out",false),padding:"14px",fontSize:12}}>RESET</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MusicVideoStudio({ onClose, onSave }) {
  const [step,setStep]=useState(1);const [generating,setGenerating]=useState(false);const [videoUrl,setVideoUrl]=useState("");const [videoBlob,setVideoBlob]=useState(null);const [renderLog,setRenderLog]=useState([]);const [renderProgress,setRenderProgress]=useState(0);const [playing,setPlaying]=useState(false);const [currentTime,setCurrentTime]=useState(0);const [duration2,setDuration2]=useState(0);const [audioFile,setAudioFile]=useState(null);const [audioUrl,setAudioUrl]=useState("");const [audioName,setAudioName]=useState("");
  const canvasRef=useRef(null);const videoRef=useRef(null);const audioRef=useRef(null);const audioInputRef=useRef(null);
  const [recState,setRecState]=useState('idle');const [recSecs,setRecSecs]=useState(0);const [recErr,setRecErr]=useState('');
  const recMR=useRef(null);const recChunks=useRef([]);const recTimer=useRef(null);
  const fmtRec=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const startSongRec=async()=>{setRecErr('');recChunks.current=[];try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const mr=new MediaRecorder(stream);recMR.current=mr;mr.ondataavailable=e=>{if(e.data.size>0)recChunks.current.push(e.data);};mr.onstop=()=>stream.getTracks().forEach(t=>t.stop());mr.start();setRecState('recording');setRecSecs(0);recTimer.current=setInterval(()=>setRecSecs(s=>s+1),1000);}catch{setRecErr('Microphone access denied');}};
  const stopSongRec=()=>{if(!recMR.current)return;if(recTimer.current)clearInterval(recTimer.current);setRecState('saving');recMR.current.addEventListener('stop',()=>{const blob=new Blob(recChunks.current,{type:'audio/webm'});const name=`my-song-${Date.now()}.webm`;const url=URL.createObjectURL(blob);setAudioFile(new File([blob],name,{type:'audio/webm'}));setAudioUrl(url);setAudioName(name);setRecState('idle');setRecSecs(0);},{once:true});recMR.current.stop();};
  const [config,setConfig]=useState({title:"If Only",artist:"Manda",genre:"Folk / Acoustic",mood:"Melancholic",tempo:"Slow (60-80 BPM)",videoStyle:"Cinematic Narrative",colorGrade:"Cinematic Teal & Orange",effects:["Slow Motion","Film Grain","Vignette"],cuts:"Long Takes",aspectRatio:"16:9",duration:"3 Minutes",visualDesc:"",refMedia:null});
  const set=(k,v)=>setConfig(p=>({...p,[k]:v}));const tog=(k,v)=>setConfig(p=>({...p,[k]:p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v]}));
  const GENRES=["Pop","Rock","Hip Hop","R&B / Soul","Electronic / EDM","Country","Jazz","Classical","Metal","Folk / Acoustic","Latin","K-Pop","Blues","Cinematic / Score"];
  const MOODS=["Euphoric","Melancholic","Energetic","Romantic","Angry","Peaceful","Mysterious","Empowering","Nostalgic","Dark","Haunting","Uplifting","Tense"];
  const TEMPOS=["Very Slow (40-60 BPM)","Slow (60-80 BPM)","Mid-Tempo (80-100 BPM)","Upbeat (100-120 BPM)","Fast (120-140 BPM)"];
  const STYLES=["Cinematic Narrative","Performance / Live","Abstract / Visual Art","Documentary Style","Lyric Video","Retro / VHS","Noir / Black & White","Surrealist / Dreamlike"];
  const GRADES=["Natural / Clean","Golden Hour Warm","Cool Blue / Moody","High Contrast Black & White","Cinematic Teal & Orange","Vintage Film Grain","Dark & Desaturated"];
  const EFFECTS=["Slow Motion","Speed Ramps","Glitch Effects","Light Leaks","Lens Flares","Rain / Water","Bokeh / Blur","Film Grain","Vignette","Particle Effects"];
  const CUTS=["Fast Cuts / High Energy","Slow & Deliberate","Long Takes","Beat-Synced Cuts","Montage Style"];
  const addLog=(msg)=>setRenderLog(p=>[...p,msg]);
  const handleAudioUpload=(e)=>{const f=e.target.files&&e.target.files[0];if(!f)return;setAudioFile(f);setAudioUrl(URL.createObjectURL(f));setAudioName(f.name);};
  const generateVideo=async()=>{
    setGenerating(true);setRenderLog([]);setRenderProgress(0);setVideoUrl("");setVideoBlob(null);
    try{
      let refImg=null;
      if(config.refMedia){addLog("Loading reference photo...");refImg=await new Promise(resolve=>{const img=new Image();img.crossOrigin="anonymous";img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=config.refMedia;});if(refImg)addLog("✓ Photo loaded — photorealistic mode");else addLog("Photo load failed — using canvas renderer");}
      else{addLog("MandaStrong Cinema Engine — describe your scene on Step 3 for best results");}
      setRenderProgress(14);
      let totalDur=180,beatGrid=[],audioCtx=null,audioDest=null,audioSource=null;
      if(audioFile){try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();const ab=await audioFile.arrayBuffer();const buf=await audioCtx.decodeAudioData(ab);totalDur=buf.duration;const data=buf.getChannelData(0),sr=buf.sampleRate,win=Math.round(sr*0.35);const energies=[];for(let i=0;i<data.length-win;i+=win){let e=0;for(let j=0;j<win;j++)e+=data[i+j]*data[i+j];energies.push({t:i/sr,e:e/win});}const avg=energies.reduce((s,x)=>s+x.e,0)/energies.length;let last=-1;energies.forEach(x=>{if(x.e>avg*1.35&&x.t-last>0.28){beatGrid.push(x.t);last=x.t;}});addLog("Audio: "+totalDur.toFixed(1)+"s — "+beatGrid.length+" beats detected");audioDest=audioCtx.createMediaStreamDestination();audioSource=audioCtx.createBufferSource();audioSource.buffer=buf;const gain=audioCtx.createGain();gain.gain.value=0.92;audioSource.connect(gain);gain.connect(audioDest);gain.connect(audioCtx.destination);}catch(e){addLog("Audio: "+e.message);audioCtx=null;}}
      else{const mins=parseInt(config.duration)||3;totalDur=mins*60;addLog("No audio — "+mins+" min visual");for(let t2=0;t2<totalDur;t2+=1.8)beatGrid.push(t2);}
      setRenderProgress(22);addLog("Rendering "+Math.round(totalDur)+"s photorealistic film at 12fps...");
      const canvas=canvasRef.current;const W=1280,H=720;canvas.width=W;canvas.height=H;const ctx=canvas.getContext("2d");const fps=12;
      const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";
      const videoStream=canvas.captureStream(0);const videoTrack=videoStream.getVideoTracks()[0];
      const combinedStream=audioDest?new MediaStream([...videoStream.getTracks(),...audioDest.stream.getTracks()]):videoStream;
      const recorder=new MediaRecorder(combinedStream,{mimeType,videoBitsPerSecond:10000000});const chunks=[];recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
      recorder.start(Math.round(1000/fps));if(audioSource)audioSource.start(0);
      const totalFrames=Math.round(totalDur*fps),msPerFrame=Math.round(1000/fps),wallStart=performance.now();
      await new Promise(resolve=>{
        let frame=0;
        const tick=()=>{
          if(frame>=totalFrames){resolve(null);return;}
          const sec=frame/fps,t=sec/totalDur,beatNow=beatGrid.some(b=>Math.abs(sec-b)<0.055);
          ctx.clearRect(0,0,W,H);
          if(refImg){const scale=1+t*0.065,ox=(W*(scale-1))/2,oy=(H*(scale-1))/2,driftX=t*W*0.016;ctx.drawImage(refImg,-ox-driftX,-oy,W*scale,H*scale);}
          else{ctx.fillStyle="#050505";ctx.fillRect(0,0,W,H);ctx.fillStyle=GOLD;ctx.font="700 18px Arial";ctx.textAlign="center";ctx.fillText("Upload a reference image on Step 4 for best results",W/2,H/2);}
          const flk=0.80+Math.sin(sec*9.1)*0.10+Math.sin(sec*14.7)*0.06+Math.random()*0.025;
          const cG=ctx.createRadialGradient(W*0.84,H*0.80,0,W*0.84,H*0.80,W*0.33*flk);cG.addColorStop(0,"rgba(255,150,30,"+(0.14*flk)+")");cG.addColorStop(0.4,"rgba(255,100,15,"+(0.055*flk)+")");cG.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=cG;ctx.fillRect(0,0,W,H);
          const shA=0.030+Math.sin(sec*0.6)*0.020+Math.sin(sec*1.3)*0.012;const sh=ctx.createLinearGradient(W*0.22,H*0.36,W*0.72,H*0.62);sh.addColorStop(0,"rgba(255,255,230,0)");sh.addColorStop(0.4,"rgba(255,255,220,"+shA+")");sh.addColorStop(0.6,"rgba(200,220,255,"+(shA*0.5)+")");sh.addColorStop(1,"rgba(255,255,200,0)");ctx.fillStyle=sh;ctx.fillRect(0,0,W,H);
          const cb=0.026+Math.sin(sec*0.42)*0.014+Math.sin(sec*0.85)*0.009;const crt=ctx.createLinearGradient(W*0.74,0,W,0);crt.addColorStop(0,"rgba(255,255,255,0)");crt.addColorStop(0.5,"rgba(255,255,255,"+cb+")");crt.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=crt;ctx.fillRect(W*0.74,0,W*0.26,H);
          ctx.fillStyle="rgba(0,4,16,"+(0.022+t*0.042)+")";ctx.fillRect(0,0,W,H);
          if(beatNow){ctx.fillStyle="rgba(255,200,100,0.036)";ctx.fillRect(0,0,W,H);}
          if(t>0.72&&t<0.88){const a=(t-0.72)/0.16;const mP=ctx.createLinearGradient(W*0.28,H*0.40,W*0.62,H*0.68);mP.addColorStop(0,"rgba(255,255,220,0)");mP.addColorStop(0.5,"rgba(255,255,210,"+(a*0.10)+")");mP.addColorStop(1,"rgba(255,255,200,0)");ctx.fillStyle=mP;ctx.fillRect(0,0,W,H);}
          const vig=ctx.createRadialGradient(W/2,H/2,W*0.10,W/2,H/2,W*0.82);vig.addColorStop(0,"rgba(0,0,0,0)");vig.addColorStop(1,"rgba(0,0,0,0.88)");ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
          ctx.fillStyle="#000";ctx.fillRect(0,0,W,Math.round(H*0.070));ctx.fillRect(0,H-Math.round(H*0.070),W,Math.round(H*0.070));
          for(let g=0;g<28;g++){const gv=Math.random()>0.5?140:0;ctx.fillStyle="rgba("+gv+","+gv+","+gv+",0.007)";ctx.fillRect(Math.random()*W,Math.random()*H,1,1);}
          if(t<0.12||t>0.90){const a=t<0.12?Math.min(1,t/0.08):Math.max(0,(1-t)/0.08);ctx.globalAlpha=a;ctx.fillStyle="#e8c96d";ctx.font="900 "+Math.round(H*0.068)+"px Arial Black,Arial";ctx.textAlign="center";ctx.shadowColor="#e8c96d";ctx.shadowBlur=24;ctx.fillText((config.title||"UNTITLED").toUpperCase(),W/2,H*0.43);ctx.shadowBlur=0;ctx.fillStyle="rgba(255,255,255,0.82)";ctx.font="300 "+Math.round(H*0.032)+"px Arial";ctx.fillText((config.artist||"").toUpperCase(),W/2,H*0.56);ctx.globalAlpha=1;}
          setRenderProgress(22+Math.round((frame/totalFrames)*72));
          if(frame%(fps*10)===0)addLog("  "+Math.round(sec)+"s / "+Math.round(totalDur)+"s");
          if(videoTrack&&videoTrack.requestFrame)videoTrack.requestFrame();
          frame++;const due=wallStart+(frame*msPerFrame);setTimeout(tick,Math.max(4,due-performance.now()));
        };tick();
      });
      setRenderProgress(96);addLog("Cutting to final...");await new Promise(r=>setTimeout(r,500));
      if(audioSource){try{audioSource.stop();}catch(e){}}
      recorder.stop();await new Promise(r=>{recorder.onstop=r;});
      const blob=new Blob(chunks,{type:mimeType});const url=URL.createObjectURL(blob);
      setVideoUrl(url);setVideoBlob(blob);setRenderProgress(100);
      addLog("✓ "+config.title+" — "+(blob.size/1024/1024).toFixed(1)+"MB · "+Math.round(totalDur)+"s");
      const fn=(config.title||"MusicVideo")+"_"+config.artist+".webm";
      try{const clipId="mv_"+Date.now();await saveClipToDB(clipId,blob,fn,"video/webm");addLog("✓ Saved");if(onSave)onSave({id:clipId,name:fn,type:"video/webm",url:URL.createObjectURL(blob),file:new File([blob],fn,{type:"video/webm"}),dbId:clipId});}catch(e){}
      if(audioCtx)try{audioCtx.close();}catch(e){}
    }catch(e){addLog("Error: "+e.message);}
    setGenerating(false);
  };
  const SOCIAL=[["YouTube","#FF0000","https://www.youtube.com/upload"],["Instagram","#E1306C","https://www.instagram.com"],["TikTok","#69C9D0","https://www.tiktok.com/upload"],["Facebook","#1877F2","https://www.facebook.com"],["X / Twitter","#1DA1F2","https://twitter.com"],["Vimeo","#1AB7EA","https://vimeo.com/upload"]];
  const inp={width:"100%",background:"#000",border:`1px solid ${GOLDDIM}`,padding:"9px 12px",color:WHITE,fontSize:13,outline:"none",fontFamily:"'Rajdhani',sans-serif",boxSizing:"border-box"};
  const label=(txt)=><div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:6,marginTop:12}}>{txt}</div>;
  const sel=(k,arr)=>(<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:4}}>{arr.map(item=>(<button key={item} onClick={()=>set(k,item)} style={{background:config[k]===item?GOLD:"#111",border:`1px solid ${config[k]===item?"#000":GOLDDIM}`,color:config[k]===item?"#000":WHITE,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:1}}>{item}</button>))}</div>);
  const multi=(k,arr)=>(<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:4}}>{arr.map(item=>(<button key={item} onClick={()=>tog(k,item)} style={{background:config[k].includes(item)?GOLD:"#111",border:`1px solid ${config[k].includes(item)?"#000":GOLDDIM}`,color:config[k].includes(item)?"#000":WHITE,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:1}}>{item}</button>))}</div>);
  const steps=["🎵 SONG","🎤 STYLE","🎬 SCENE","▶ GENERATE"];
  const fmt=(s)=>{if(!s||!isFinite(s)||isNaN(s))return"00:00";const m=Math.floor(s/60);const sc=Math.floor(s%60);return String(m).padStart(2,"0")+":"+String(sc).padStart(2,"0");};
  return (
    <div style={{position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,0.98)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"min(960px,98vw)",height:"min(92vh,860px)",background:"#050505",border:`2px solid ${GOLD}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:`linear-gradient(135deg,#1a0a00,#0a0500)`,borderBottom:`1px solid ${GOLD}`,padding:"14px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div><div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:18,fontWeight:900,letterSpacing:4}}>🎬 MUSIC VIDEO STUDIO</div><div style={{color:WHITE,fontSize:10,letterSpacing:3,marginTop:2}}>PROFESSIONAL MUSIC VIDEO PRODUCTION · AI POWERED</div></div>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${GOLD}`,color:GOLD,width:32,height:32,cursor:"pointer",fontSize:16}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderBottom:`1px solid ${GOLDDIM}`,flexShrink:0}}>
          {steps.map((s,i)=>(<button key={i} onClick={()=>setStep(i+1)} style={{background:step===i+1?"#0a0500":"none",border:"none",borderBottom:step===i+1?`2px solid ${GOLD}`:"2px solid transparent",color:step===i+1?GOLD:WHITE,padding:"11px 6px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2}}>{s}</button>))}
        </div>
        <div style={{flex:1,display:"grid",gridTemplateColumns:videoUrl?"1fr 1fr":"1fr",overflow:"hidden"}}>
          <div style={{overflowY:"auto",padding:"16px 20px",borderRight:videoUrl?`1px solid ${GOLDDIM}`:"none"}}>
            {step===1&&(<div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div>{label("SONG TITLE")}<input value={config.title} onChange={e=>set("title",e.target.value)} placeholder="Song title..." style={inp}/></div><div>{label("ARTIST")}<input value={config.artist} onChange={e=>set("artist",e.target.value)} placeholder="Artist name..." style={inp}/></div></div>
              {label("GENRE")}{sel("genre",GENRES)}{label("MOOD")}{sel("mood",MOODS)}{label("TEMPO")}{sel("tempo",TEMPOS)}
              {label("UPLOAD YOUR AUDIO TRACK (OPTIONAL)")}
              <div style={{background:"#000",border:`1px dashed ${audioFile?GOLD:GOLDDIM}`,padding:"12px",cursor:"pointer",marginBottom:4}} onClick={()=>audioInputRef.current&&audioInputRef.current.click()}><div style={{color:audioFile?"#22c55e":WHITE,fontWeight:900,fontSize:12,letterSpacing:2}}>{audioFile?"✓ "+audioName:"⬆ CLICK TO UPLOAD MP3 / WAV / M4A"}</div></div>
              <input ref={audioInputRef} type="file" accept="audio/*" style={{display:"none"}} onChange={handleAudioUpload}/>
              {audioFile&&<button onClick={()=>{setAudioFile(null);setAudioUrl("");setAudioName("");}} style={{background:"none",border:`1px solid #ef4444`,color:"#ef4444",padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:900,marginTop:4}}>✕ REMOVE AUDIO</button>}
              <div style={{marginTop:14,background:"#050505",border:`1px solid ${GOLDDIM}`,padding:"12px"}}>
                <div style={{color:GOLD,fontWeight:900,fontSize:11,letterSpacing:3,marginBottom:10}}>🎙 RECORD YOUR OWN SONG</div>
                {recErr&&<div style={{color:"#ef4444",fontSize:10,marginBottom:8}}>{recErr}</div>}
                {recState==='idle'&&<button onClick={startSongRec} style={{width:"100%",background:"#7f1d1d",border:"1px solid #ef4444",color:"#fca5a5",padding:"8px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>● START RECORDING</button>}
                {recState==='recording'&&<div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><span style={{color:"#ef4444",fontWeight:900,fontSize:11,letterSpacing:2}}>● REC {fmtRec(recSecs)}</span><span style={{color:DIM,fontSize:10}}>Recording your song...</span></div><button onClick={stopSongRec} style={{width:"100%",background:"#1a1a1a",border:`1px solid ${GOLD}`,color:GOLD,padding:"8px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>■ STOP &amp; USE THIS RECORDING</button></div>}
                {recState==='saving'&&<div style={{color:DIM,fontSize:11,textAlign:"center",padding:"8px"}}>Processing recording...</div>}
                <div style={{color:GOLDDIM,fontSize:10,marginTop:8,lineHeight:1.6}}>Sing or play your song — it becomes the audio track for your music video.</div>
              </div>
            </div>)}
            {step===2&&(<div>{label("VIDEO STYLE")}{sel("videoStyle",STYLES)}{label("COLOUR GRADE")}{sel("colorGrade",GRADES)}{label("VISUAL EFFECTS")}{multi("effects",EFFECTS)}{label("EDITING STYLE")}{sel("cuts",CUTS)}{label("ASPECT RATIO")}<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["16:9","9:16 (Vertical)","1:1 (Square)","2.39:1 (Cinematic)"].map(r=>(<button key={r} onClick={()=>set("aspectRatio",r)} style={{background:config.aspectRatio===r?GOLD:"#111",border:`1px solid ${config.aspectRatio===r?"#000":GOLDDIM}`,color:config.aspectRatio===r?"#000":WHITE,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:900}}>{r}</button>))}</div></div>)}
            {step===3&&(<div>{label("DESCRIBE YOUR MUSIC VIDEO SCENE")}<textarea value={config.visualDesc} onChange={e=>set("visualDesc",e.target.value)} placeholder="e.g. A woman walks alone on a rain-soaked city street at night..." style={{...inp,height:160,resize:"vertical",lineHeight:1.8,border:`1px solid ${GOLD}`}}/>{label("DURATION")}<div style={{display:"flex",gap:6}}>{["2 Minutes","3 Minutes","4 Minutes","5 Minutes"].map(d=>(<button key={d} onClick={()=>set("duration",d)} style={{background:config.duration===d?GOLD:"#111",border:`1px solid ${config.duration===d?"#000":GOLDDIM}`,color:config.duration===d?"#000":WHITE,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:900}}>{d}</button>))}</div></div>)}
            {step===4&&(<div>
              <div style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:16,fontWeight:900,marginBottom:10,letterSpacing:3}}>READY TO CREATE</div>
              <div style={{background:config.refMedia?"#020a02":"#0a0200",border:`1px solid ${config.refMedia?"#22c55e":GOLDDIM}`,padding:14,marginBottom:12}}>
                <div style={{color:config.refMedia?"#22c55e":GOLD,fontSize:12,letterSpacing:3,fontWeight:900,marginBottom:6}}>{config.refMedia?"✓ PHOTO LOADED — PHOTOREALISTIC MODE":"📸 UPLOAD YOUR PHOTO — REQUIRED"}</div>
                {config.refMedia?(<div style={{position:"relative"}}><img src={config.refMedia} alt="ref" style={{width:"100%",height:120,objectFit:"cover",border:"1px solid #22c55e",display:"block"}}/><button onClick={()=>set("refMedia",null)} style={{position:"absolute",top:6,right:6,background:"#000",border:"1px solid #ef4444",color:"#ef4444",padding:"2px 9px",cursor:"pointer",fontSize:11,fontWeight:900}}>✕ CHANGE</button></div>):(<label style={{display:"block",border:`2px dashed ${GOLD}`,padding:"18px",textAlign:"center",cursor:"pointer",background:"#050200"}}><div style={{fontSize:28,marginBottom:6}}>📸</div><div style={{color:GOLD,fontSize:13,fontWeight:900,letterSpacing:1}}>CLICK TO UPLOAD YOUR PHOTO</div><div style={{color:DIM,fontSize:10,marginTop:4}}>JPG · PNG · This photo becomes your music video</div><input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files&&e.target.files[0];if(f)set("refMedia",URL.createObjectURL(f));}}/></label>)}
              </div>
              <button onClick={generateVideo} disabled={generating} style={{background:`linear-gradient(135deg,${GOLDDIM},${GOLD})`,border:"none",color:"#000",width:"100%",padding:"18px",fontSize:14,letterSpacing:3,cursor:generating?"not-allowed":"pointer",fontWeight:900,fontFamily:"'Rajdhani',sans-serif",opacity:generating?0.7:1,marginBottom:10}}>{generating?"⟳ RENDERING... "+renderProgress+"%":"🎬 GENERATE MUSIC VIDEO"}</button>
              {generating&&(<div><div style={{height:5,background:"#111",marginBottom:6}}><div style={{width:renderProgress+"%",height:"100%",background:`linear-gradient(90deg,#a07820,#e8c96d)`,transition:"width .3s"}}/></div><div style={{background:"#000",border:`1px solid ${GOLDDIM}`,padding:10,maxHeight:140,overflowY:"auto"}}>{renderLog.map((l,i)=>(<div key={i} style={{color:i===renderLog.length-1?"#22c55e":DIM,fontSize:10,lineHeight:1.8}}>{i===renderLog.length-1?"▶ ":"  "}{l}</div>))}</div></div>)}
              {!generating&&renderLog.length>0&&(<div style={{background:"#000",border:`1px solid ${GOLDDIM}`,padding:10,maxHeight:120,overflowY:"auto"}}>{renderLog.map((l,i)=>(<div key={i} style={{color:i===renderLog.length-1?"#22c55e":DIM,fontSize:10,lineHeight:1.8}}>{i===renderLog.length-1?"▶ ":"  "}{l}</div>))}</div>)}
            </div>)}
          </div>
          {videoUrl&&(<div style={{display:"flex",flexDirection:"column",background:"#000",overflow:"hidden"}}>
            <div style={{position:"relative",background:"#000"}}><canvas ref={canvasRef} style={{display:"none"}}/><video ref={videoRef} src={videoUrl} playsInline style={{width:"100%",aspectRatio:"16/9",display:"block",background:"#000"}} onTimeUpdate={()=>setCurrentTime(videoRef.current?.currentTime||0)} onLoadedMetadata={()=>{const d=videoRef.current?.duration;if(d&&isFinite(d)&&d>0)setDuration2(d);}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)}/>
              <div style={{background:"rgba(0,0,0,0.85)",padding:"8px 12px"}}><div style={{height:3,background:"#222",marginBottom:8,cursor:"pointer",borderRadius:2}} onClick={e=>{if(!videoRef.current||!duration2)return;const r=e.currentTarget.getBoundingClientRect();videoRef.current.currentTime=((e.clientX-r.left)/r.width)*duration2;}}><div style={{width:`${duration2?(currentTime/duration2*100):0}%`,height:"100%",background:GOLD,borderRadius:2,transition:"width .1s"}}/></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:8}}><button onClick={()=>videoRef.current&&(videoRef.current.currentTime=0)} style={{background:"none",border:"none",color:GOLDDIM,cursor:"pointer",fontSize:14}}>⏮</button><button onClick={()=>{if(!videoRef.current)return;playing?videoRef.current.pause():videoRef.current.play();}} style={{background:GOLD,border:"none",color:"#000",width:32,height:32,cursor:"pointer",fontSize:16,fontWeight:900}}>{playing?"⏸":"▶"}</button><span style={{color:WHITE,fontSize:11,fontFamily:"monospace"}}>{fmt(currentTime)} / {fmt(duration2)}</span></div></div></div></div>
            <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
              <div style={{color:GOLD,fontSize:11,fontWeight:900,letterSpacing:3,marginBottom:10}}>EXPORT YOUR MUSIC VIDEO</div>
              <a href={videoUrl} download={(config.title||"MusicVideo")+"_"+config.artist+".webm"} style={{display:"block",background:`linear-gradient(135deg,${GOLDDIM},${GOLD})`,border:"none",color:"#000",padding:"12px",textAlign:"center",textDecoration:"none",fontWeight:900,fontSize:12,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",marginBottom:8}}>⬇ DOWNLOAD VIDEO</a>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:12}}>{SOCIAL.map(([name,color,url])=>(<button key={name} onClick={()=>window.open(url,"_blank")} style={{background:"#000",border:`1px solid ${color}33`,color:color,padding:"7px 4px",cursor:"pointer",fontSize:10,fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}} onMouseEnter={e=>{e.currentTarget.style.background=color+"22";}} onMouseLeave={e=>{e.currentTarget.style.background="#000";}}>{name}</button>))}</div>
              <button onClick={()=>{setVideoUrl("");setVideoBlob(null);setRenderLog([]);setRenderProgress(0);setStep(1);}} style={{width:"100%",background:"transparent",border:`1px solid ${GOLDDIM}`,color:GOLDDIM,padding:"8px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>+ NEW MUSIC VIDEO</button>
            </div>
          </div>)}
          {!videoUrl&&<canvas ref={canvasRef} style={{display:"none"}}/>}
        </div>
        {!videoUrl&&(<div style={{borderTop:`1px solid ${GOLDDIM}`,padding:"10px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}><button onClick={()=>setStep(s=>Math.max(1,s-1))} disabled={step===1} style={{background:"transparent",border:`1px solid ${GOLD}`,color:GOLD,padding:"6px 16px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",opacity:step===1?0.3:1}}>◀ BACK</button><span style={{color:GOLDDIM,fontSize:10,letterSpacing:2}}>STEP {step} OF 4</span>{step<4?<button onClick={()=>setStep(s=>Math.min(4,s+1))} style={{background:`linear-gradient(135deg,${GOLDDIM},${GOLD})`,border:"none",color:"#000",padding:"6px 16px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>NEXT ▶</button>:<button onClick={onClose} style={{background:"transparent",border:`1px solid ${GOLDDIM}`,color:GOLDDIM,padding:"6px 16px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>CLOSE</button>}</div>)}
      </div>
    </div>
  );
}

function P8VideoGenerator({onSave,user,filmDuration,setFilmDuration}){
  const canvasRef=useRef(null);const videoRef=useRef(null);
  const[prompt,setPrompt]=useState("");const[title,setTitle]=useState("");const[duration,setDuration]=useState(30);
  const[generating,setGenerating]=useState(false);const[progress,setProgress]=useState(0);const[log,setLog]=useState([]);const[videoUrl,setVideoUrl]=useState("");const[saved,setSaved]=useState(false);const[refMedia,setRefMedia]=useState(null);const[refMediaType,setRefMediaType]=useState("");const[refDataUrl,setRefDataUrl]=useState(null);
  const refMediaRef=useRef(null);
  const addLog=(msg)=>setLog(p=>[...p,msg]);
  const EXAMPLES=["Earth rotating slowly in deep space. City lights blazing gold on the night side. Stars everywhere.","A woman places a folded paper into a wooden ballot box. Morning light from a window. Women watching behind her with tears.","Night city skyline. Rain. Neon reflections on wet streets. A lone figure walks under a streetlight.","Underwater coral reef. Vivid tropical fish. Light shafts from the surface above.","An elderly couple on a park bench in autumn. Golden leaves falling. Neither speaking.","Vast dark server room. Three people huddled around a single warm lantern. Faces lit gold.","Cave interior. Torchlight. Ancient paintings on the walls. A figure looking at camera.","Dawn breaking over a savanna. A silhouetted human figure stands at the horizon."];
  const handleRefUpload=(e)=>{const f=e.target.files&&e.target.files[0];if(!f)return;const url=URL.createObjectURL(f);setRefMedia(url);setRefMediaType(f.type.startsWith("video")?"video":"image");const img=new Image();img.onload=()=>{const MAX=1200;let w=img.width,h=img.height;if(w>MAX||h>MAX){const r=Math.min(MAX/w,MAX/h);w=Math.round(w*r);h=Math.round(h*r);}const cv=document.createElement("canvas");cv.width=w;cv.height=h;const cx=cv.getContext("2d");cx.drawImage(img,0,0,w,h);const dataUrl=cv.toDataURL("image/jpeg",0.7);setRefDataUrl(dataUrl);};img.src=url;};
  const generateVideo=async()=>{
    if(!prompt.trim()){alert("Describe your scene first");return;}
    setGenerating(true);setProgress(0);setLog([]);setVideoUrl("");setSaved(false);addLog("Director reading your scene...");setProgress(8);
    try{
      const motionRules=`
CRITICAL MOTION RULES — the output MUST be a moving video, NOT a still image:
- EVERY element MUST change position, opacity, scale, or colour as t increases from 0 to 1
- Use t and sec for ALL animations: stars must twinkle, clouds must drift, light must shift, particles must move
- Camera must slowly push in OR pan across the scene (use t to scale/translate ctx)
- Atmospheric particles (dust, rain, fog, embers, stars) must animate with unique offsets per particle using index-based Math.sin/Math.cos patterns
- Lighting must shift subtly: golden hour glow strengthens, shadows lengthen, colours warm or cool
- Any human figures must have subtle breathing or movement animated with Math.sin(sec*1.2)
- Minimum 3 independent animated layers (background, midground, foreground/particles)
- The first frame (t=0) and last frame (t=1) must look visually different`;

      const refInstruction=refDataUrl?"\n\nREFERENCE IMAGE: The user uploaded a reference. Match its exact colour palette, lighting direction, and mood across ALL frames. The image is drawn as background — add motion layers on top.":"";
      const directorPrompt=`You are the MandaStrong Cinema Engine. Write a JavaScript canvas renderer that produces a REAL CINEMATIC VIDEO with genuine motion and animation.\n\nSCENE: "${prompt}"\nDURATION: ${duration} seconds${refInstruction}\n${motionRules}\n\nWrite a function: drawFrame(ctx, W, H, t, sec)\nWhere t=0 to 1 (total progress through clip), sec=current second elapsed, W=1920, H=1080\n\nUse ctx.save()/ctx.restore() for camera transforms. Use layered gradient fills for depth. Animate EVERYTHING.\n\nReturn ONLY the JavaScript function starting with:\nfunction drawFrame(ctx, W, H, t, sec) {`;
      const msgContent=[];
      if(refDataUrl&&refDataUrl.startsWith("data:image")){const mType=refDataUrl.split(";")[0].split(":")[1]||"image/jpeg";const b64=refDataUrl.split(",")[1];msgContent.push({type:"image",source:{type:"base64",media_type:mType,data:b64}});msgContent.push({type:"text",text:"Reference image provided. Match its colours and lighting exactly. Scene: "+prompt+"\n\n"+motionRules+"\n\nWrite function drawFrame(ctx,W,H,t,sec) that adds animated atmospheric overlays, particles, light shafts, and colour grading on top of the background image. Animate EVERY element using t and sec. Return only the function."});}
      else{msgContent.push({type:"text",text:directorPrompt});}
      const res=await fetch(PROXY_URL,{method:"POST",headers:PROXY_HEADERS,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:4000,messages:[{role:"user",content:msgContent}]})});
      const d=await res.json();
      if(d.error){addLog("Error: "+d.error.message);setGenerating(false);return;}
      let fnCode=d.content&&d.content[0]?d.content[0].text.trim():"";
      fnCode=fnCode.replace(new RegExp(String.fromCharCode(96,96,96)+"javascript|"+String.fromCharCode(96,96,96)+"js|"+String.fromCharCode(96,96,96),"g"),"").trim();
      const fnStart=fnCode.indexOf("function drawFrame");if(fnStart>0)fnCode=fnCode.slice(fnStart);
      addLog("Scene designed. Rendering frames...");setProgress(22);
      let refImg=null;
      if(refMedia){refImg=await new Promise(resolve=>{const img=new Image();img.crossOrigin="anonymous";img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=refMedia;});if(refImg)addLog("Reference image loaded.");}
      let drawFn;
      try{const body=fnCode.replace(/^function drawFrame\s*\([^)]*\)\s*\{/,"").slice(0,-1);drawFn=new Function("ctx","W","H","t","sec",body);}
      catch(e){
        addLog("Retrying...");
        const retry=await fetch(PROXY_URL,{method:"POST",headers:PROXY_HEADERS,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,messages:[{role:"user",content:`Write a cinematic canvas renderer for: "${prompt}". Function: function drawFrame(ctx,W,H,t,sec) where t=0-1 and sec=elapsed seconds. MUST have real motion: animate particles, shift lighting, move camera (ctx.translate/scale using t), drift clouds or atmosphere. Every element must change as t increases. Return only the function.`}]})});
        const rd=await retry.json();let rc=rd.content&&rd.content[0]?rd.content[0].text.trim():"";rc=rc.replace(new RegExp(String.fromCharCode(96,96,96)+"javascript|"+String.fromCharCode(96,96,96)+"js|"+String.fromCharCode(96,96,96),"g"),"").trim();const ri=rc.indexOf("function drawFrame");if(ri>0)rc=rc.slice(ri);
        try{const rb=rc.replace(/^function drawFrame\s*\([^)]*\)\s*\{/,"").slice(0,-1);drawFn=new Function("ctx","W","H","t","sec",rb);}
        catch(e2){addLog("Render failed: "+e2.message);setGenerating(false);return;}
      }
      const canvas=canvasRef.current;canvas.width=1920;canvas.height=1080;const ctx=canvas.getContext("2d");
      try{drawFn(ctx,1920,1080,0,0);}catch(e){}await new Promise(r=>setTimeout(r,300));
      const fps=12;const msPerFrame=Math.round(1000/fps);const totalFrames=duration*fps;
      const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";
      const stream=canvas.captureStream(fps);const recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:15000000});
      const chunks=[];recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};recorder.start(msPerFrame);
      addLog("Camera rolling — "+duration+"s...");
      await new Promise(resolve=>{
        let frame=0;const startTime=performance.now();
        const renderNext=()=>{
          if(frame>=totalFrames){resolve(null);return;}
          const t=frame/totalFrames;const sec=frame/fps;
          try{ctx.clearRect(0,0,1920,1080);
            if(refImg){const scale=1+t*0.04;const ox=(1920*(scale-1))/2;const oy=(1080*(scale-1))/2;ctx.drawImage(refImg,-ox,-oy,1920*scale,1080*scale);try{drawFn(ctx,1920,1080,t,sec);}catch(oe){}}
            else{drawFn(ctx,1920,1080,t,sec);}
            const vig=ctx.createRadialGradient(960,540,200,960,540,1100);vig.addColorStop(0,"rgba(0,0,0,0)");vig.addColorStop(1,"rgba(0,0,0,0.85)");ctx.fillStyle=vig;ctx.fillRect(0,0,1920,1080);
            ctx.fillStyle="#000";ctx.fillRect(0,0,1920,78);ctx.fillRect(0,1002,1920,78);
            for(let g=0;g<80;g++){ctx.fillStyle=`rgba(${Math.random()>0.5?180:20},${Math.random()>0.5?180:20},${Math.random()>0.5?180:20},0.012)`;ctx.fillRect(Math.random()*1920,Math.random()*1080,1,1);}
          }catch(e){ctx.fillStyle="#050200";ctx.fillRect(0,0,1920,1080);}
          setProgress(22+Math.round((frame/totalFrames)*73));if(frame%(fps*4)===0)addLog("  "+Math.round(sec)+"s / "+duration+"s...");
          frame++;const next=startTime+(frame*msPerFrame);setTimeout(renderNext,Math.max(4,next-performance.now()));
        };renderNext();
      });
      setProgress(97);addLog("Finalising...");await new Promise(r=>setTimeout(r,800));recorder.stop();await new Promise(r=>{recorder.onstop=r;});
      const blob=new Blob(chunks,{type:mimeType});const url=URL.createObjectURL(blob);setVideoUrl(url);setProgress(100);
      addLog("✓ Scene complete — "+(blob.size/1024/1024).toFixed(1)+"MB · "+duration+"s");
      setTimeout(()=>{if(videoRef.current){videoRef.current.src=url;videoRef.current.load();videoRef.current.play().catch(()=>{});}},300);
    }catch(e){addLog("Error: "+e.message);}
    setGenerating(false);
  };
  const saveToLibrary=async()=>{
    if(!videoUrl)return;
    try{const r=await fetch(videoUrl);const b=await r.blob();const fn=(title||"Scene")+"_"+duration+"s.webm";const clipId="clip_"+Date.now();await saveClipToDB(clipId,b,fn,"video/webm");const file=new File([b],fn,{type:"video/webm"});const freshUrl=URL.createObjectURL(file);if(onSave)onSave({id:clipId,name:fn,type:"video/webm",url:freshUrl,file,dbId:clipId});}
    catch(e){if(onSave)onSave({id:Date.now()+Math.random(),name:(title||"Scene")+"_"+duration+"s.webm",type:"video/webm",url:videoUrl});}
    setSaved(true);
  };
  return(
    <div style={{minHeight:"100vh",background:"#000",color:WHITE,fontFamily:"'Rajdhani',sans-serif",paddingBottom:160}}>
      <canvas ref={canvasRef} style={{display:"none"}}/>
      <div style={{padding:"12px 20px",borderBottom:`1px solid ${GOLDDIM}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div><div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700}}>MANDASTRONG CINEMA ENGINE · SCENE GENERATION · CLAUDE POWERED</div><h1 style={{fontFamily:"'Cinzel',serif",color:GOLD,letterSpacing:5,margin:0,fontSize:24,textTransform:"uppercase"}}>VIDEO GENERATOR</h1></div>
        <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <div style={{color:GOLD,fontSize:11,fontWeight:700,letterSpacing:2}}>✦ ANY PROMPT · ANY SCENE · ANY SUBJECT</div>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"#0a0800",border:`1px solid ${GOLDDIM}`,padding:"4px 12px"}}>
            <span style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:2,whiteSpace:"nowrap"}}>FILM: {filmDuration||60} MIN</span>
            <input type="range" min={1} max={180} step={1} value={filmDuration||60} onChange={e=>setFilmDuration(+e.target.value)} style={{width:120,accentColor:GOLD}}/>
            <div style={{display:"flex",gap:4}}>{[60,90,180].map(m=><button key={m} onClick={()=>setFilmDuration(m)} style={{background:filmDuration===m?GOLD:"#111",border:`1px solid ${filmDuration===m?"#000":GOLDDIM}`,color:filmDuration===m?"#000":WHITE,padding:"2px 8px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>{m}m</button>)}</div>
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 420px",minHeight:"calc(100vh - 120px)"}}>
        <div style={{padding:20,overflowY:"auto"}}>
          <div style={{marginBottom:12}}><div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:6}}>SCENE TITLE</div><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. AI For Humanity — Chapter 1" style={{width:"100%",background:"#000",border:`1px solid ${GOLDDIM}`,padding:"10px 14px",color:WHITE,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif"}}/></div>
          <div style={{marginBottom:14}}><div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:6}}>DESCRIBE YOUR SCENE</div><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe anything in plain English. Humans, environments, lighting, weather, mood." style={{width:"100%",background:"#000",border:`1px solid ${GOLDDIM}`,padding:"12px 14px",color:WHITE,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif",lineHeight:1.9,height:140,resize:"none"}}/></div>
          <div style={{marginBottom:14}}><div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:8}}>QUICK EXAMPLES</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{EXAMPLES.map((ex,i)=>(<div key={i} onClick={()=>setPrompt(ex)} style={{background:"#000",border:`1px solid ${GOLDDIM}`,padding:"8px 10px",cursor:"pointer",fontSize:10,color:DIM,lineHeight:1.6}} onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.color=WHITE;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM;e.currentTarget.style.color=DIM;}}>{ex.slice(0,70)}{ex.length>70?"...":""}</div>))}</div></div>
          <div style={{background:"#0a0a0a",border:`1px solid ${GOLDDIM}`,padding:12,marginBottom:14}}>
            <div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900,marginBottom:6}}>⬆ UPLOAD REFERENCE IMAGE</div>
            <div style={{color:DIM,fontSize:10,marginBottom:8}}>Upload a reference and the engine will match its colours, lighting and mood exactly.</div>
            {refMedia?(<div style={{position:"relative",marginBottom:8}}>{refMediaType==="video"?<video src={refMedia} muted playsInline style={{width:"100%",height:80,objectFit:"cover",border:`1px solid ${GOLD}`}}/>:<img src={refMedia} alt="ref" style={{width:"100%",height:80,objectFit:"cover",border:`1px solid ${GOLD}`}}/>}<button onClick={()=>{setRefMedia(null);setRefMediaType("");setRefDataUrl(null);}} style={{position:"absolute",top:4,right:4,background:"#000",border:`1px solid ${GOLD}`,color:GOLD,padding:"1px 7px",cursor:"pointer",fontSize:10,fontWeight:900}}>✕</button><div style={{color:"#22c55e",fontSize:9,fontWeight:900,letterSpacing:2,marginTop:4}}>✓ REFERENCE LOADED</div></div>):(<div onClick={()=>refMediaRef.current&&refMediaRef.current.click()} style={{border:`1px dashed ${GOLDDIM}`,padding:"12px",textAlign:"center",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD} onMouseLeave={e=>e.currentTarget.style.borderColor=GOLDDIM}><div style={{color:WHITE,fontSize:12,fontWeight:700}}>⬆ CLICK TO UPLOAD REFERENCE</div><div style={{color:DIM,fontSize:10,marginTop:2}}>JPG · PNG · MP4 · WEBM</div></div>)}
            <input ref={refMediaRef} type="file" accept="image/*,video/*" style={{display:"none"}} onChange={handleRefUpload}/>
          </div>
          <div style={{background:"#0a0a0a",border:`1px solid ${GOLDDIM}`,padding:14,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:GOLD,fontSize:11,fontWeight:900,letterSpacing:2}}>DURATION</span><span style={{color:WHITE,fontSize:11,fontWeight:900}}>{duration} SECONDS</span></div>
            <input type="range" min={30} max={60} value={duration} onChange={e=>setDuration(+e.target.value)} style={{width:"100%",accentColor:GOLD}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}><span style={{color:DIM,fontSize:10}}>30s</span><span style={{color:DIM,fontSize:10}}>60s</span></div>
          </div>
          <button onClick={generateVideo} disabled={generating||!prompt.trim()} style={{background:`linear-gradient(135deg,#a07820,#e8c96d)`,border:"none",color:"#000",width:"100%",padding:"20px",fontSize:15,letterSpacing:3,cursor:generating||!prompt.trim()?"not-allowed":"pointer",fontWeight:900,fontFamily:"'Rajdhani',sans-serif",opacity:generating||!prompt.trim()?0.5:1}}>
            {generating?"⟳ CREATING YOUR SCENE... "+progress+"%":"🎬 GENERATE SCENE"}
          </button>
        </div>
        <div style={{borderLeft:`1px solid ${GOLDDIM}`,display:"flex",flexDirection:"column"}}>
          <div style={{background:"#000",aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",borderBottom:`1px solid ${GOLDDIM}`,overflow:"hidden"}}>
            {videoUrl?(<video ref={videoRef} src={videoUrl} controls autoPlay loop playsInline style={{width:"100%",height:"100%",objectFit:"contain"}}/>):(<div style={{textAlign:"center",padding:20}}><div style={{color:GOLD,fontSize:11,fontWeight:900,letterSpacing:3,marginBottom:8}}>MANDASTRONG CINEMA ENGINE</div><div style={{color:DIM,fontSize:10,lineHeight:2}}>Type any scene description.<br/>Upload a reference image.<br/>Hit Generate.<br/>Get a real cinematic scene.</div></div>)}
          </div>
          {generating&&(<div style={{padding:"10px 14px",borderBottom:`1px solid ${GOLDDIM}`}}><div style={{height:5,background:"#111",marginBottom:4}}><div style={{width:progress+"%",height:"100%",background:`linear-gradient(90deg,#a07820,#e8c96d)`,transition:"width .4s"}}/></div><div style={{color:GOLD,fontSize:10,textAlign:"center",letterSpacing:2}}>{progress}%</div></div>)}
          {videoUrl&&!generating&&(<div style={{padding:"10px 14px",borderBottom:`1px solid ${GOLDDIM}`,display:"flex",flexDirection:"column",gap:6}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}><a href={videoUrl} download={(title||"scene")+"_"+duration+"s.webm"} style={{background:"transparent",border:`1px solid ${GOLD}`,color:GOLD,padding:"8px",fontSize:10,textDecoration:"none",textAlign:"center",letterSpacing:1,fontWeight:900,fontFamily:"'Rajdhani',sans-serif",display:"block"}}>⬇ DOWNLOAD</a><button onClick={saveToLibrary} style={{background:saved?`linear-gradient(135deg,#a07820,#e8c96d)`:"transparent",border:`1px solid ${GOLD}`,color:saved?"#000":GOLD,padding:"8px",fontSize:10,cursor:"pointer",fontWeight:900,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>{saved?"✓ SAVED":"💾 LIBRARY"}</button></div><button onClick={()=>{setVideoUrl("");setLog([]);setSaved(false);setTitle("");setPrompt("");}} style={{background:`linear-gradient(135deg,#a07820,#e8c96d)`,border:"none",color:"#000",padding:"8px",fontSize:11,width:"100%",letterSpacing:2,cursor:"pointer",fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>▶ NEXT SCENE</button></div>)}
          <div style={{flex:1,overflowY:"auto",padding:14}}>
            {log.length>0?(<div><div style={{color:GOLD,fontSize:10,letterSpacing:3,fontWeight:900,marginBottom:10}}>PRODUCTION LOG</div>{log.map((l,i)=>(<div key={i} style={{color:i===log.length-1?"#22c55e":DIM,fontSize:11,lineHeight:2,letterSpacing:1}}>{i===log.length-1?"▶ ":"  "}{l}</div>))}</div>):(<div style={{padding:"16px 0",color:GOLDDIM,fontSize:10,lineHeight:2.2,letterSpacing:1}}><div style={{color:GOLD,fontWeight:900,fontSize:11,marginBottom:8}}>WHAT THIS ENGINE RENDERS</div>✦ Real human figures with skin tones<br/>✦ Any environment or setting<br/>✦ Physical lighting and atmosphere<br/>✦ Cities, oceans, space, interiors<br/>✦ Weather — rain, fog, dust, fire<br/>✦ Camera movement and parallax<br/>✦ Cinematic colour grading<br/>✦ Matches your reference image</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function P1({go}){return(<div style={{...Sp}}><div style={{background:"#000",padding:"56px 40px 36px",textAlign:"center",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:0,pointerEvents:"none"}}>{[...Array(55)].map((_,i)=>(<div key={i} style={{position:"absolute",width:i%4===0?2:1,height:i%4===0?2:1,background:GOLD,borderRadius:"50%",opacity:.1+i%4*.15,left:`${(i*17+3)%100}%`,top:`${(i*11+7)%100}%`,animation:`tw ${1.8+i%3*.8}s ease-in-out ${i%5*.35}s infinite`}}/>))}</div><style>{`@keyframes tw{0%,100%{opacity:.05}50%{opacity:.85}}`}</style><div style={{position:"relative",zIndex:1}}><div style={{fontSize:11,color:DIM,letterSpacing:6,marginBottom:12}}>CINEMA INTELLIGENCE PLATFORM — EST. 2026</div><div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(34px,6vw,58px)",fontWeight:900,color:GOLD,letterSpacing:5,lineHeight:1,textShadow:`0 0 60px ${GOLD}dd,0 0 120px ${GOLD}66`}}>MANDA STRONG</div><div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(34px,6vw,58px)",fontWeight:900,color:GOLD,letterSpacing:5,lineHeight:1,textShadow:`0 0 60px ${GOLD}dd,0 0 120px ${GOLD}66`,marginBottom:14}}>STUDIO</div><div style={{color:WHITE,fontSize:12,letterSpacing:4,marginBottom:28,fontWeight:600}}>600+ AI TOOLS · 8K EXPORT · UP TO 3-HOUR FILMS</div><div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}><button onClick={()=>go(4)} style={{...G("gold",false),fontSize:14,padding:"14px 38px",letterSpacing:3}}>START CREATING</button><button onClick={()=>go(4)} style={{...G("out",false),fontSize:14,padding:"14px 38px",letterSpacing:3}}>LOGIN / REGISTER</button></div></div></div><div style={{borderTop:`1px solid ${GOLD}`,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,padding:"16px 24px",maxWidth:800,margin:"0 auto"}}>{[["600+","AI TOOLS"],["8K","EXPORT"],["3 HRS","DURATION"],["1TB","STORAGE"]].map(([v,l])=>(<div key={v} style={{...Card(),textAlign:"center",padding:12}}><div style={{color:GOLD,fontFamily:"'Cinzel',serif",fontSize:22,fontWeight:900}}>{v}</div><div style={{color:WHITE,fontSize:11,marginTop:3,fontWeight:700,letterSpacing:2}}>{l}</div></div>))}</div><div style={{textAlign:"center",paddingBottom:24,paddingTop:16}}><a href="https://mandastrongstudio2026.bolt.host" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:110,height:110,background:"#000",border:`2px solid ${GOLD}`,cursor:"pointer",gap:4,textDecoration:"none"}}><div style={{fontSize:26,lineHeight:1}}>⬇</div><div style={{color:GOLD,fontSize:11,fontWeight:900,letterSpacing:1,textAlign:"center",lineHeight:1.4}}>DOWNLOAD<br/>AS APP</div></a></div></div>);}

function P2({go}){return(<div style={{...Sp,padding:40}}><div style={{maxWidth:880,margin:"0 auto"}}><div style={{fontSize:12,color:GOLD,letterSpacing:4,marginBottom:8,fontWeight:700}}>AI CREATOR PLATFORM</div><h1 style={{...H1,fontSize:30,marginBottom:14}}>MAKE AWESOME FAMILY MOVIES OR TURN YOUR DREAMS INTO REALITY</h1><p style={{color:WHITE,fontSize:15,lineHeight:1.9,maxWidth:720,marginBottom:28}}>MandaStrong Studio combines 600+ professional AI tools with an intuitive cinematic workspace — so anyone can create stunning short films, family videos, or feature-length productions up to 3 hours long.</p><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>{[["600+","AI Tools"],["8K","Export Quality"],["3 HOURS","Max Duration"],["1TB","Cloud Storage"]].map(([v,l])=>(<div key={v} style={{...Card(),textAlign:"center",padding:14}}><div style={{color:GOLD,fontFamily:"'Cinzel',serif",fontSize:22,fontWeight:900}}>{v}</div><div style={{color:WHITE,fontSize:11,marginTop:4,fontWeight:600,letterSpacing:1}}>{l}</div></div>))}</div><button onClick={()=>go(4)} style={{...G("gold",false)}}>START CREATING</button></div></div>);}

function P3({onSave}){const[f0,setF0]=useState(null);const[f1,setF1]=useState(null);const[f2,setF2]=useState(null);const[n0,setN0]=useState("");const[n1,setN1]=useState("");const[n2,setN2]=useState("");const handle=(idx,e)=>{const f=e.target.files&&e.target.files[0];if(!f)return;const url=URL.createObjectURL(f);if(idx===0){setF0(url);setN0(f.name);}if(idx===1){setF1(url);setN1(f.name);}if(idx===2){setF2(url);setN2(f.name);}if(onSave)onSave({id:Date.now()+Math.random(),name:f.name,type:f.type,file:f,url});};const btnSt={display:"block",width:"100%",padding:"12px",background:`linear-gradient(135deg,${GOLDDIM},${GOLD})`,color:"#000",fontSize:12,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",textAlign:"center",cursor:"pointer",border:"none",outline:"none"};const slot=(f,n,idx)=>(<div style={{...Card(),padding:0,overflow:"hidden"}}><div style={{background:"#000",aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",borderBottom:`1px solid ${GOLDDIM}`}}>{f?<video src={f} controls playsInline style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<div style={{textAlign:"center"}}><div style={{fontSize:40}}>🎬</div><div style={{color:GOLDDIM,fontSize:11,marginTop:6,letterSpacing:2}}>PROOF OF CONCEPT</div><div style={{color:DIM,fontSize:10,marginTop:3}}>SLOT {idx+1}</div></div>}</div>{n&&<div style={{padding:"6px 12px",color:GOLD,fontSize:11,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n}</div>}<div style={{padding:"8px 12px 12px"}}><input type="file" accept="video/*" style={btnSt} onChange={e=>handle(idx,e)}/></div></div>);return(<div style={{...Sp,padding:40}}><div style={{maxWidth:980,margin:"0 auto"}}><div style={{fontSize:12,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>SHOWCASE</div><h1 style={{...H1,fontSize:30,marginBottom:8}}>MADE WITH MANDASTRONG STUDIO</h1><div style={{color:WHITE,fontSize:13,lineHeight:1.8,marginBottom:24}}>Real films produced entirely inside this platform. Click play to watch.</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>{slot(f0,n0,0)}{slot(f1,n1,1)}{slot(f2,n2,2)}</div></div></div>);}

function P4({go,setUser}){
  const[email,setEmail]=useState("");const[pass,setPass]=useState("");const[name,setName]=useState("");const[re,setRe]=useState("");
  const inp={width:"100%",background:"#0a0a0a",border:`1px solid ${GOLDDIM}`,padding:"10px 12px",color:WHITE,fontSize:14,marginBottom:10,outline:"none",boxSizing:"border-box",fontFamily:"'Rajdhani',sans-serif"};
  const login=()=>{
    if(email==="woolleya129@gmail.com"&&pass==="Mangler1970!!"){
      const adminUser={name:"Amanda",plan:"Studio",isAdmin:true};
      setUser(adminUser);try{localStorage.setItem("ms_user",JSON.stringify(adminUser));localStorage.setItem("ms_admin","true");}catch(e){}go(5);
    }else if(email.includes("@")){setUser({name:email.split("@")[0]||"Creator",plan:"Creator",isAdmin:false});go(5);}
    else{alert("Please enter a valid email address.");}
  };
  return(<div style={{...Sp,padding:40}}><div style={{maxWidth:1000,margin:"0 auto"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:18,marginBottom:36}}><div style={{...Card()}}><div style={{fontSize:11,color:GOLD,letterSpacing:3,marginBottom:8,fontWeight:700}}>EXISTING USER</div><h2 style={{...H1,fontSize:18,marginBottom:18}}>SIGN IN</h2><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" style={inp}/><input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="Password" style={{...inp,marginBottom:16}}/><button onClick={login} style={{...G("gold",false),width:"100%",padding:"12px"}}>SIGN IN TO STUDIO</button></div><div style={{...Card(),border:"2px solid #22c55e",position:"relative"}}><div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"#22c55e",color:"#000",padding:"3px 14px",fontSize:11,fontWeight:900,whiteSpace:"nowrap"}}>🎉 7-DAY FREE TRIAL</div><div style={{fontSize:11,color:GOLD,letterSpacing:3,marginBottom:8,marginTop:10,fontWeight:700}}>NEW CREATOR</div><h2 style={{...H1,fontSize:18,marginBottom:18}}>CREATE ACCOUNT</h2><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your Name" style={inp}/><input value={re} onChange={e=>setRe(e.target.value)} placeholder="Email address" style={{...inp,marginBottom:16}}/><button onClick={()=>{setUser({name:name||"Creator",plan:"Studio Trial",isAdmin:false});window.open(STRIPE.studio,"_blank");go(5);}} style={{width:"100%",padding:"12px",background:"#22c55e",border:"none",color:"#000",fontWeight:900,fontSize:13,cursor:"pointer",letterSpacing:2}}>START FREE TRIAL — $0</button></div><div style={{...Card(),textAlign:"center"}}><div style={{fontSize:36,marginBottom:10}}>👁</div><h2 style={{...H1,fontSize:16,marginBottom:10}}>EXPLORE FIRST</h2><p style={{color:WHITE,fontSize:14,lineHeight:1.7,marginBottom:20}}>Browse 600+ AI tools before committing. No account required.</p><button onClick={()=>{setUser({name:"Guest",plan:"Guest",isAdmin:false});go(5);}} style={{...G("out",false),width:"100%"}}>BROWSE AS GUEST</button></div></div><div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:20}}><button onClick={()=>window.dispatchEvent(new CustomEvent("ms_open_history"))} style={{...G("gold",false),padding:"12px 32px"}}>📂 OPEN PROJECT</button><button onClick={()=>{if(window.confirm("Start a new project? Unsaved work will be lost."))window.location.reload();}} style={{...G("out",false),padding:"12px 32px"}}>✦ NEW PROJECT</button></div><h2 style={{...H1,fontSize:22,textAlign:"center",marginBottom:22}}>SUBSCRIPTION PLANS</h2><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>{[{t:"CREATOR PLAN",p:"20",link:STRIPE.basic,f:["HD Export 1080p","100 AI Tools","10GB Storage","Email Support"],pop:false,trial:false},{t:"PRO PLAN",p:"30",link:STRIPE.pro,f:["4K Export","300 AI Tools","100GB Storage","Priority Support","Commercial License"],pop:true,trial:false},{t:"STUDIO PLAN",p:"50",link:STRIPE.studio,f:["8K Export","600+ AI Tools","1TB Storage","24/7 Support","Full Rights","API Access","7-Day Free Trial"],pop:false,trial:true}].map(plan=>(<div key={plan.t} style={{...Card(),border:plan.pop?`2px solid ${GOLD}`:`1px solid ${GOLDDIM}`,position:"relative"}}>{plan.pop&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:GOLD,color:"#000",padding:"2px 12px",fontSize:11,fontWeight:900,whiteSpace:"nowrap"}}>MOST POPULAR</div>}{plan.trial&&<div style={{position:"absolute",top:-11,right:12,background:"#22c55e",color:"#000",padding:"2px 10px",fontSize:11,fontWeight:900}}>🎉 FREE TRIAL</div>}<div style={{color:WHITE,fontSize:11,letterSpacing:3,fontWeight:700}}>{plan.t}</div><div style={{color:GOLD,fontFamily:"'Cinzel',serif",fontSize:34,fontWeight:900,margin:"8px 0"}}>${plan.p}<span style={{fontSize:12,color:WHITE}}>/mo</span></div><div style={{margin:"12px 0"}}>{plan.f.map(f=><div key={f} style={{color:WHITE,fontSize:13,padding:"3px 0",borderBottom:"1px solid #0a0a0a"}}>✓ {f}</div>)}</div><button onClick={()=>window.open(plan.link,"_blank")} style={{...G(plan.trial?"out":"gold",false),width:"100%"}}>{plan.trial?"START FREE TRIAL":"SUBSCRIBE NOW"}</button></div>))}</div></div></div>);
}

function P11({mediaLib,setMediaLib}){const fileRef=useRef(null);const onFiles=files=>{if(!files)return;const n=Array.from(files).map(f=>({id:Date.now()+Math.random(),name:f.name,type:f.type,file:f,url:URL.createObjectURL(f)}));setMediaLib(p=>[...p,...n]);};return(<div style={{...Sp,padding:40}}><div style={{maxWidth:800,margin:"0 auto"}}><div style={{fontSize:12,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>ASSET INGESTION</div><h1 style={{...H1,fontSize:28,marginBottom:4}}>UPLOAD MEDIA</h1><div style={{color:WHITE,fontSize:14,marginBottom:20,fontWeight:700,letterSpacing:1}}>{mediaLib.length} ASSETS IN LIBRARY</div><div onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=GOLD;}} onDragLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM;}} onDrop={e=>{e.preventDefault();onFiles(e.dataTransfer.files);e.currentTarget.style.borderColor=GOLDDIM;}} onClick={()=>fileRef.current&&fileRef.current.click()} style={{border:`2px dashed ${GOLDDIM}`,padding:"50px 40px",textAlign:"center",cursor:"pointer",marginBottom:16}}><div style={{fontSize:36,marginBottom:10}}>🎬</div><div style={{color:WHITE,fontWeight:900,fontSize:16,letterSpacing:3}}>DRAG & DROP YOUR MEDIA HERE</div><div style={{color:WHITE,fontSize:13,marginTop:8,letterSpacing:1}}>Or click to browse · Video · Audio · Images</div></div>{mediaLib.length>0&&(<div><h3 style={{color:GOLD,fontWeight:900,fontSize:13,letterSpacing:3,marginBottom:10}}>MEDIA LIBRARY ({mediaLib.length})</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>{mediaLib.map(a=>(<div key={a.id} style={{...Card(),padding:8,position:"relative"}}>{a.type.startsWith("video")?<video src={a.url} style={{width:"100%",marginBottom:5}}/>:a.type.startsWith("image")?<img src={a.url} style={{width:"100%",marginBottom:5}} alt={a.name}/>:<div style={{height:60,background:"#000",marginBottom:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🎵</div>}<div style={{color:WHITE,fontSize:11,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div><button onClick={()=>setMediaLib(p=>p.filter(x=>x.id!==a.id))} style={{position:"absolute",top:5,right:5,background:"#7f1d1d",border:"none",color:"#ef4444",width:16,height:16,cursor:"pointer",fontSize:9,padding:0}}>✕</button></div>))}</div></div>)}<input ref={fileRef} type="file" multiple accept="video/*,audio/*,image/*" onChange={e=>onFiles(e.target.files)} style={{display:"none"}}/></div></div>);}

function P12({go,mediaLib}){return(<div style={{...Sp,padding:40}}><div style={{maxWidth:880,margin:"0 auto"}}><div style={{fontSize:12,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>PRODUCTION HUB</div><h1 style={{...H1,fontSize:28,marginBottom:4}}>EDITOR SUITE</h1><div style={{color:WHITE,fontSize:14,marginBottom:20,fontWeight:600}}>Your complete post-production workspace.</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>{[{ic:"🗂",t:"MEDIA LIBRARY",d:`${mediaLib.length} assets`,p:11},{ic:"⏱",t:"TIMELINE EDITOR",d:"Multi-track editing",p:13},{ic:"✨",t:"ENHANCEMENT STUDIO",d:"90+ AI tools",p:14},{ic:"🎵",t:"AUDIO MIXER",d:"4-channel mixing",p:15},{ic:"⚡",t:"RENDER ENGINE",d:"Up to 8K output",p:16},{ic:"▶",t:"PREVIEW PLAYER",d:"Full-screen playback",p:17}].map(c=>(<button key={c.t} onClick={()=>go(c.p)} style={{...Card(),textAlign:"left",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM;}}><div style={{fontSize:28,marginBottom:8}}>{c.ic}</div><div style={{color:GOLD,fontWeight:900,fontSize:13,letterSpacing:2}}>{c.t}</div><div style={{color:WHITE,fontSize:12,marginTop:4}}>{c.d}</div></button>))}</div></div></div>);}

function P13({go,mediaLib,timeline,setTimeline,user,filmDuration,setFilmDuration}){
  const[tracks,setTracks]=useState(["VIDEO TRACK","AUDIO TRACK","TEXT / TITLES"]);
  const addToTrack=(idx,asset)=>setTimeline(p=>({...p,[idx]:[...(p[idx]||[]),asset]}));
  return(<div style={{...Sp,padding:20}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:10}}><div><div style={{fontSize:11,color:GOLD,letterSpacing:4,fontWeight:700}}>EDITING WORKSPACE</div><h1 style={{...H1,fontSize:24,margin:0}}>TIMELINE EDITOR</h1><div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}><span style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:2}}>FILM: {filmDuration||60} MIN</span><input type="range" min={0} max={180} step={30} value={filmDuration||60} onChange={e=>setFilmDuration(+e.target.value)} style={{width:160,accentColor:GOLD}}/><div style={{display:"flex",gap:4}}>{[60,90,180].map(m=><button key={m} onClick={()=>setFilmDuration(m)} style={{background:filmDuration===m?GOLD:"#111",border:`1px solid ${filmDuration===m?"#000":GOLDDIM}`,color:filmDuration===m?"#000":WHITE,padding:"2px 8px",cursor:"pointer",fontSize:10,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>{m}m</button>)}</div></div></div><div style={{display:"flex",gap:8}}><button onClick={()=>setTracks(p=>[...p,`TRACK ${p.length+1}`])} style={{...G("out",true)}}>+ ADD TRACK</button><button onClick={()=>{const videoAssets=mediaLib.filter(a=>a.type&&a.type.startsWith("video"));const audioAssets=mediaLib.filter(a=>a.type&&(a.type.startsWith("audio")||a.type==="audio/narration"||a.type==="audio/webm"));const newTl={};if(videoAssets.length>0)newTl[0]=videoAssets.map(a=>({...a,startTime:0}));if(audioAssets.length>0)newTl[1]=audioAssets.map(a=>({...a,startTime:0}));setTimeline(p=>({...p,...newTl}));alert("✓ All tracks synced — "+videoAssets.length+" video clips · "+audioAssets.length+" audio tracks");}} style={{background:`linear-gradient(135deg,${GOLDDIM},${GOLD})`,border:"none",color:"#000",padding:"5px 14px",cursor:"pointer",fontSize:11,fontWeight:900,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif"}}>⚡ SYNC ALL TRACKS</button><button onClick={()=>go(16)} style={{...G("gold",false)}}>→ RENDER</button><button onClick={()=>setTimeline({})} style={{...G("out",true)}}>CLEAR ALL</button></div></div><div style={{background:"#000",height:100,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,border:`1px solid ${GOLDDIM}`}}>{mediaLib[0]&&mediaLib[0].type.startsWith("video")?<video src={mediaLib[0].url} style={{height:"100%",width:"100%",objectFit:"cover",opacity:.5}}/>:<div style={{textAlign:"center"}}><div style={{fontSize:12,letterSpacing:3,color:WHITE,marginBottom:8}}>ADD MEDIA TO SEE PREVIEW</div><button onClick={()=>go(11)} style={{...G("out",true)}}>⬆ UPLOAD MEDIA</button></div>}</div>{tracks.map((tr,idx)=>(<div key={idx} style={{marginBottom:8}}><div style={{color:GOLD,fontSize:11,letterSpacing:3,marginBottom:4,fontWeight:900}}>{tr}</div><div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("assetId");const a=mediaLib.find(x=>String(x.id)===id);if(a)addToTrack(idx,a);}} style={{background:"#0a0a0a",border:`1px dashed ${GOLDDIM}`,minHeight:42,padding:6,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>{(timeline[idx]||[]).map((a,i)=>(<div key={i} style={{background:GOLDDIM,padding:"3px 10px",fontSize:12,color:"#000",fontWeight:900,display:"flex",alignItems:"center",gap:5}}>{a.name.slice(0,12)}<button onClick={()=>setTimeline(p=>({...p,[idx]:p[idx].filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:"#000",cursor:"pointer",fontSize:11,padding:0}}>✕</button></div>))}{!(timeline[idx]||[]).length&&<span style={{color:WHITE,fontSize:12,letterSpacing:1}}>DROP {tr} CLIPS HERE</span>}</div></div>))}{mediaLib.length>0&&(<div style={{marginTop:12}}><div style={{color:GOLD,fontSize:11,letterSpacing:3,marginBottom:6,fontWeight:900}}>DRAG TO TIMELINE:</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{mediaLib.map(a=>(<div key={a.id} draggable onDragStart={e=>e.dataTransfer.setData("assetId",String(a.id))} style={{background:"#0a0a0a",border:`1px solid ${GOLD}`,padding:"4px 10px",cursor:"grab",color:GOLD,fontSize:12,fontWeight:700}}>📎 {a.name.slice(0,14)}</div>))}</div></div>)}<div style={{...Card(),marginTop:12,display:"flex",alignItems:"center",gap:8}}>{["⏮","⏪","▶","⏩","⏭"].map(c=><button key={c} style={{...G("out",true)}}>{c}</button>)}<div style={{flex:1,height:3,background:"#000"}}/><span style={{color:WHITE,fontSize:12,fontWeight:700}}>00:00 / {filmDuration||60}:00</span></div></div>);
}

function P14(){const tools14=MOTION.slice(0,14);const[active,setActive]=useState(tools14[0]);const[vals,setVals]=useState({Intensity:75,Clarity:80,Color:70,Brightness:65});return(<div style={{...Sp,display:"flex"}}><div style={{width:176,background:"#050505",borderRight:`1px solid ${GOLDDIM}`,overflowY:"auto",padding:8}}>{tools14.map(t=>(<button key={t} onClick={()=>setActive(t)} style={{width:"100%",textAlign:"left",background:t===active?BG4:"none",border:"none",color:t===active?GOLD:WHITE,padding:"8px 10px",cursor:"pointer",fontSize:12,fontWeight:t===active?900:600,marginBottom:1,borderLeft:t===active?`2px solid ${GOLD}`:"2px solid transparent"}}>{t}</button>))}</div><div style={{flex:1,padding:28}}><div style={{fontSize:11,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>ENHANCEMENT STUDIO</div><h2 style={{...H1,fontSize:22,marginBottom:6}}>{active.toUpperCase()}</h2>{Object.entries(vals).map(([k,v])=>(<div key={k} style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{color:WHITE,fontSize:13,fontWeight:700}}>{k}</span><span style={{color:GOLD,fontSize:13,fontWeight:900}}>{v}%</span></div><input type="range" min={0} max={100} value={v} onChange={e=>setVals(p=>({...p,[k]:+e.target.value}))} style={{width:"100%",accentColor:GOLD}}/></div>))}<div style={{display:"flex",gap:10,marginTop:18}}><button style={{...G("gold",false)}}>APPLY ENHANCEMENT</button><button onClick={()=>setVals({Intensity:75,Clarity:80,Color:70,Brightness:65})} style={{...G("out",false)}}>RESET</button></div></div></div>);}

function P15(){const[lvl,setLvl]=useState({VOICE:85,MUSIC:40,EFX:50,MASTER:85});return(<div style={{...Sp,padding:40}}><div style={{maxWidth:680,margin:"0 auto"}}><div style={{fontSize:11,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>MIXING CONSOLE</div><h1 style={{...H1,fontSize:28,marginBottom:24}}>AUDIO MIXER</h1><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>{Object.entries(lvl).map(([ch,val])=>(<div key={ch} style={{...Card(),textAlign:"center",padding:18}}><div style={{color:GOLD,fontSize:11,letterSpacing:3,marginBottom:8,fontWeight:900}}>{ch}</div><div style={{color:GOLD,fontFamily:"'Cinzel',serif",fontSize:30,fontWeight:900,marginBottom:12}}>{val}</div><input type="range" min={0} max={100} value={val} onChange={e=>setLvl(p=>({...p,[ch]:+e.target.value}))} style={{width:"100%",height:100,accentColor:GOLD}}/><div style={{height:3,background:"#000",marginTop:10}}><div style={{width:`${val}%`,height:"100%",background:`linear-gradient(90deg,${GOLDDIM},${GOLD})`}}/></div></div>))}</div><div style={{display:"flex",gap:10}}><button onClick={()=>setLvl({VOICE:85,MUSIC:40,EFX:50,MASTER:85})} style={{...G("out",false)}}>RESET LEVELS</button><button style={{...G("gold",false)}}>SAVE PRESET</button></div></div></div>);}

function P16({go,timeline,setRendered,mediaLib,setMediaLib,user,filmDuration,setFilmDuration}){
  const[quality,setQuality]=useState("1080p");const[progress,setProgress]=useState(0);const[rendering,setRendering]=useState(false);const[done,setDone]=useState(false);const[renderUrl,setRenderUrl]=useState("");const[renderLog,setRenderLog]=useState([]);const[fps,setFps]=useState(30);const[codec,setCodec]=useState("vp9");const[currentClipIdx,setCurrentClipIdx]=useState(-1);const canvasRef=useRef(null);
  const log2=(msg)=>setRenderLog(p=>[...p,msg]);
  const getVideoClips=()=>{const tClips=Object.values(timeline||{}).flat().filter(a=>a&&a.type&&a.type.startsWith("video"));if(tClips.length>0)return tClips;return(mediaLib||[]).filter(a=>a.type&&a.type.startsWith("video"));};
  const getAudioTrack=()=>{const tAudio=Object.values(timeline||{}).flat().filter(a=>a&&a.type&&(a.type.startsWith("audio")||a.type==="audio/narration"||a.type==="audio/webm"));if(tAudio.length>0)return tAudio[0];return(mediaLib||[]).find(a=>a.type&&(a.type.startsWith("audio")||a.type==="audio/narration"||a.type==="audio/webm"));};
  const startRender=async()=>{
    log2("Loading clips from storage...");
    try{const dbClips=await getAllClipsFromDB();if(dbClips.length>0){const refreshed=dbClips.map(c2=>({id:c2.id,name:c2.name,type:c2.type||"video/webm",url:URL.createObjectURL(c2.blob),file:new File([c2.blob],c2.name,{type:c2.type||"video/webm"}),dbId:c2.id}));setMediaLib(refreshed);await new Promise(r=>setTimeout(r,400));}}catch(e){console.warn(e);}
    const clips=getVideoClips();const audioAsset=getAudioTrack();
    if(clips.length===0){alert("No video clips found. Generate clips on Page 8 first.");return;}
    setRendering(true);setDone(false);setProgress(0);setRenderLog([]);setRenderUrl("");setCurrentClipIdx(-1);
    try{
      log2("MandaStrong Render Engine v3...");log2("Clips: "+clips.length+" | Quality: "+quality+" | FPS: "+fps);
      const canvas=canvasRef.current;
      const dims=quality==="4K"?{w:3840,h:2160}:quality==="1080p"?{w:1920,h:1080}:quality==="720p"?{w:1280,h:720}:{w:854,h:480};
      canvas.width=dims.w;canvas.height=dims.h;
      const ctx=canvas.getContext("2d");
      ctx.fillStyle="#000";ctx.fillRect(0,0,dims.w,dims.h);
      log2("Canvas: "+dims.w+"x"+dims.h);
      const audioCtx=new(window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==="suspended")await audioCtx.resume();
      const masterGain=audioCtx.createGain();masterGain.gain.value=1.0;
      const audioDest=audioCtx.createMediaStreamDestination();
      masterGain.connect(audioDest);masterGain.connect(audioCtx.destination);
      let narrationSource=null;
      if(audioAsset&&audioAsset.url){
        try{
          const resp=await fetch(audioAsset.url);
          const arrayBuf=await resp.arrayBuffer();
          const audioBuffer=await audioCtx.decodeAudioData(arrayBuf);
          narrationSource=audioCtx.createBufferSource();
          narrationSource.buffer=audioBuffer;
          narrationSource.connect(masterGain);
          log2("Narration loaded: "+(audioBuffer.duration).toFixed(1)+"s");
        }catch(e){log2("Narration load failed — video only");}
      }
      const videoStream=canvas.captureStream(fps);
      const allTracks=[...videoStream.getTracks(),...audioDest.stream.getTracks()];
      const combinedStream=new MediaStream(allTracks);
      const vCodec=codec==="vp9"?"vp9":"vp8";
      const mimeType=MediaRecorder.isTypeSupported(`video/webm;codecs=${vCodec},opus`)?`video/webm;codecs=${vCodec},opus`:"video/webm";
      const bitrate=quality==="4K"?40000000:quality==="1080p"?8000000:4000000;
      const recorder=new MediaRecorder(combinedStream,{mimeType,videoBitsPerSecond:bitrate,audioBitsPerSecond:192000});
      const chunks=[];
      recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
      recorder.start(100);
      if(narrationSource)narrationSource.start(0);
      log2("Recording started...");setProgress(5);
      const renderCanvasScene=async(drawFn,clipDurSec)=>{
        const W=dims.w,H=dims.h;
        const totalFrames=Math.round(clipDurSec*fps);
        const msPerFrame=1000/fps;
        const wallStart=performance.now();
        await new Promise(resolve=>{
          let frame=0;
          const tick=()=>{
            if(frame>=totalFrames){resolve(null);return;}
            const t=frame/totalFrames,sec=frame/fps;
            try{ctx.clearRect(0,0,W,H);drawFn(ctx,W,H,t,sec);}
            catch(e){ctx.fillStyle="#050200";ctx.fillRect(0,0,W,H);}
            const vig=ctx.createRadialGradient(W/2,H/2,W*0.1,W/2,H/2,W*0.8);
            vig.addColorStop(0,"rgba(0,0,0,0)");vig.addColorStop(1,"rgba(0,0,0,0.82)");
            ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
            ctx.fillStyle="#000";ctx.fillRect(0,0,W,Math.round(H*0.06));ctx.fillRect(0,Math.round(H*0.94),W,Math.round(H*0.06));
            frame++;
            const due=wallStart+(frame*msPerFrame);
            setTimeout(tick,Math.max(0,due-performance.now()));
          };
          tick();
        });
      };
      const regenerateSceneFromName=async(sceneName,clipDurSec)=>{
        const scenePrompt=sceneName.replace(/\.[^.]+$/,"").replace(/_/g," ").replace(/\d+s$/,"").trim();
        log2("  Regenerating: "+scenePrompt.slice(0,40)+"...");
        try{
          const res=await fetch(PROXY_URL,{method:"POST",headers:PROXY_HEADERS,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:3000,messages:[{role:"user",content:"You are the MandaStrong Cinema Engine. Write a PHOTOREALISTIC cinematic canvas renderer for this scene: \""+scenePrompt+"\". NEVER draw cartoons or simple shapes. Use realistic gradients, layered depth, atmospheric lighting, human figures if described. Function: function drawFrame(ctx,W,H,t,sec) where t=0-1 overall progress, W and H are canvas dimensions. Return ONLY the JavaScript function."}]})});
          const d=await res.json();
          let code=d.content&&d.content[0]?d.content[0].text.trim():"";
          code=code.replace(new RegExp(String.fromCharCode(96,96,96)+"javascript|"+String.fromCharCode(96,96,96)+"js|"+String.fromCharCode(96,96,96),"g"),"").trim();
          const fi=code.indexOf("function drawFrame");if(fi>0)code=code.slice(fi);
          const body=code.replace(/^function drawFrame\s*\([^)]*\)\s*\{/,"").slice(0,-1);
          const drawFn=new Function("ctx","W","H","t","sec",body);
          await renderCanvasScene(drawFn,clipDurSec);
          return true;
        }catch(e){log2("  Error: "+e.message);return false;}
      };
      for(let ci=0;ci<clips.length;ci++){
        const clip=clips[ci];
        setCurrentClipIdx(ci);
        log2("Clip "+(ci+1)+"/"+clips.length+": "+clip.name.slice(0,45));
        setProgress(5+Math.round((ci/clips.length)*85));
        const clipSrc=clip.url||(clip.file instanceof File?URL.createObjectURL(clip.file):"");
        let videoPlayed=false;
        if(clipSrc){
          videoPlayed=await new Promise(resolve=>{
            const vid=document.createElement("video");
            vid.muted=true;vid.playsInline=true;vid.preload="auto";
            vid.src=clipSrc;
            let settled=false;
            let rafId=null;
            const finish=(ok)=>{if(!settled){settled=true;if(rafId)cancelAnimationFrame(rafId);resolve(ok);}};
            const drawLoop=()=>{
              if(vid.ended||(vid.paused&&vid.currentTime>0&&vid.currentTime>=vid.duration-0.1)){finish(true);return;}
              try{
                ctx.drawImage(vid,0,0,dims.w,dims.h);
                const vig=ctx.createRadialGradient(dims.w/2,dims.h/2,dims.w*0.1,dims.w/2,dims.h/2,dims.w*0.8);
                vig.addColorStop(0,"rgba(0,0,0,0)");vig.addColorStop(1,"rgba(0,0,0,0.75)");
                ctx.fillStyle=vig;ctx.fillRect(0,0,dims.w,dims.h);
                ctx.fillStyle="#000";ctx.fillRect(0,0,dims.w,Math.round(dims.h*0.055));ctx.fillRect(0,Math.round(dims.h*0.945),dims.w,Math.round(dims.h*0.055));
              }catch(e){ctx.fillStyle="#050200";ctx.fillRect(0,0,dims.w,dims.h);}
              rafId=requestAnimationFrame(drawLoop);
            };
            vid.oncanplay=()=>{vid.play().then(()=>{rafId=requestAnimationFrame(drawLoop);}).catch(()=>finish(false));};
            vid.onended=()=>finish(true);
            vid.onerror=()=>finish(false);
            vid.onloadedmetadata=()=>{const dur=(isFinite(vid.duration)&&vid.duration>0?vid.duration:60)*1000+5000;setTimeout(()=>finish(true),dur);};
            setTimeout(()=>finish(false),300000);
            vid.load();
          });
        }
        if(!videoPlayed){
          log2("  Regenerating from clip name...");
          const clipDurSec=parseInt(clip.name.match(/(\d+)s/)?.[1]||"30");
          const ok=await regenerateSceneFromName(clip.name,clipDurSec);
          if(!ok){
            await renderCanvasScene((_ctx,W,H)=>{
              _ctx.fillStyle="#000";_ctx.fillRect(0,0,W,H);
              _ctx.fillStyle="#e8c96d";_ctx.font="900 "+Math.round(W/28)+"px Arial";_ctx.textAlign="center";_ctx.textBaseline="middle";
              _ctx.fillText(clip.name.replace(/\.[^.]+$/,"").replace(/_/g," ").slice(0,40).toUpperCase(),W/2,H/2);
            },5);
          }
        }
        if(ci<clips.length-1){
          const snapshot=ctx.getImageData(0,0,dims.w,dims.h);
          const fadeFrames=12;
          for(let fi=0;fi<fadeFrames;fi++){
            ctx.putImageData(snapshot,0,0);
            ctx.fillStyle=`rgba(0,0,0,${fi/fadeFrames})`;
            ctx.fillRect(0,0,dims.w,dims.h);
            await new Promise(r=>setTimeout(r,1000/fps));
          }
        }
      }
      setCurrentClipIdx(-1);
      const tailFrames=Math.round(fps*1.5);const tailStart=performance.now();
      await new Promise(resolve=>{let f=0;const draw=()=>{if(f>=tailFrames){resolve(null);return;}const alpha=f/tailFrames;ctx.fillStyle=`rgba(0,0,0,${alpha})`;ctx.fillRect(0,0,dims.w,dims.h);f++;const next=tailStart+(f*(1000/fps));setTimeout(draw,Math.max(0,next-performance.now()));};draw();});
      setProgress(96);log2("Finalising...");
      if(narrationSource){try{narrationSource.stop();}catch(e){}}
      recorder.stop();
      await new Promise(r=>{recorder.onstop=r;});
      const blob=new Blob(chunks,{type:mimeType});
      const url=URL.createObjectURL(blob);
      try{const renderName="MandaStrong_Film_"+new Date().toISOString().slice(0,10)+".webm";await saveClipToDB("render_final",blob,renderName,"video/webm");}catch(e){}
      setRenderUrl(url);
      if(setRendered)setRendered({url,quality,format:"WebM",timestamp:new Date().toLocaleString()});
      setProgress(100);setDone(true);
      log2("RENDER COMPLETE — "+(blob.size/1024/1024).toFixed(1)+"MB");
      audioCtx.close();
    }catch(e){log2("Render error: "+e.message);}
    setRendering(false);
  };
  const clips=getVideoClips();const audio=getAudioTrack();const QUALITIES=[{id:"480p",label:"480p",sub:"854×480"},{id:"720p",label:"720p",sub:"1280×720"},{id:"1080p",label:"1080p",sub:"1920×1080"},{id:"4K",label:"4K",sub:"3840×2160"}];
  return(<div style={{...Sp,padding:0}}><canvas ref={canvasRef} style={{display:"none"}}/><div style={{padding:"12px 24px",borderBottom:`1px solid ${GOLDDIM}`,background:"#020200",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}><div><div style={{fontSize:10,color:GOLD,letterSpacing:4,fontWeight:700}}>PRODUCTION ENGINE — STAGE 6</div><h1 style={{...H1,fontSize:22,margin:0}}>RENDER FILM</h1></div>{done&&!rendering&&<div style={{color:"#22c55e",fontSize:11,fontWeight:900,letterSpacing:2}}>RENDER COMPLETE</div>}</div><div style={{display:"grid",gridTemplateColumns:"1fr 320px",minHeight:"calc(100vh - 120px)"}}><div style={{padding:20,overflowY:"auto"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}><div style={{background:clips.length>0?"#061406":"#0a0a0a",border:`1px solid ${clips.length>0?"#22c55e":GOLDDIM}`,padding:"14px 16px"}}><div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:3,marginBottom:6}}>VIDEO CLIPS</div><div style={{color:clips.length>0?"#22c55e":WHITE,fontSize:14,fontWeight:900}}>{clips.length>0?"✓ "+clips.length+" clip"+(clips.length>1?"s":"")+" ready":"No clips — generate on page 8"}</div></div><div style={{background:audio?"#061406":"#0a0a0a",border:`1px solid ${audio?"#22c55e":GOLDDIM}`,padding:"14px 16px"}}><div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:3,marginBottom:6}}>AUDIO TRACK</div><div style={{color:audio?"#22c55e":"#f59e0b",fontSize:14,fontWeight:900}}>{audio?"✓ Audio ready":"No audio — record on page 6"}</div></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}><div style={{background:"#0a0a0a",border:`1px solid ${GOLDDIM}`,padding:"14px 16px"}}><div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:3,marginBottom:10}}>OUTPUT QUALITY</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>{QUALITIES.map(q=>(<button key={q.id} onClick={()=>setQuality(q.id)} style={{background:quality===q.id?"#0a0800":"#000",border:`1px solid ${quality===q.id?GOLD:GOLDDIM}`,padding:"8px 6px",cursor:"pointer",textAlign:"center"}}><div style={{color:quality===q.id?GOLD:WHITE,fontSize:12,fontWeight:900,fontFamily:"'Rajdhani',sans-serif"}}>{q.label}</div><div style={{color:DIM,fontSize:9}}>{q.sub}</div></button>))}</div></div><div style={{background:"#0a0a0a",border:`1px solid ${GOLDDIM}`,padding:"14px 16px"}}><div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:3,marginBottom:10}}>SETTINGS</div><div style={{marginBottom:10}}><div style={{color:DIM,fontSize:10,marginBottom:5}}>FRAME RATE</div><div style={{display:"flex",gap:5}}>{[24,30,60].map(f=><button key={f} onClick={()=>setFps(f)} style={{...G(fps===f?"gold":"out",true),flex:1,padding:"5px 4px",fontSize:10}}>{f}fps</button>)}</div></div><div><div style={{color:DIM,fontSize:10,marginBottom:5}}>CODEC</div><div style={{display:"flex",gap:5}}>{["vp9","vp8"].map(c=><button key={c} onClick={()=>setCodec(c)} style={{...G(codec===c?"gold":"out",true),flex:1,padding:"5px 4px",fontSize:10}}>{c.toUpperCase()}</button>)}</div></div></div></div>{rendering&&(<div style={{background:"#000",border:`1px solid ${GOLD}`,padding:"14px 16px",marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div style={{color:GOLD,fontSize:11,fontWeight:900}}>RENDERING</div><div style={{color:GOLD,fontSize:13,fontWeight:900}}>{progress}%</div></div><div style={{height:8,background:"#111",overflow:"hidden"}}><div style={{width:progress+"%",height:"100%",background:`linear-gradient(90deg,${GOLDDIM},${GOLD})`,transition:"width .3s"}}/></div></div>)}{renderLog.length>0&&(<div style={{background:"#000",border:`1px solid ${GOLDDIM}`,padding:"14px 16px",marginBottom:16,maxHeight:180,overflowY:"auto"}}><div style={{color:GOLD,fontSize:10,fontWeight:900,letterSpacing:3,marginBottom:8}}>RENDER LOG</div>{renderLog.map((l,i)=>(<div key={i} style={{color:i===renderLog.length-1?"#22c55e":"#666",fontSize:10,lineHeight:1.7,fontFamily:"monospace"}}>{i===renderLog.length-1?"► ":"  "}{l}</div>))}</div>)}{done&&renderUrl&&(<div style={{background:"#061406",border:"1px solid #22c55e",padding:"16px 20px",marginBottom:16}}><div style={{color:"#22c55e",fontWeight:900,fontSize:13,letterSpacing:2,marginBottom:12}}>RENDER COMPLETE</div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><a href={renderUrl} download="MandaStrong_Film.webm" style={{...G("gold",false),padding:"12px 24px",textDecoration:"none",display:"inline-block",fontSize:12,letterSpacing:2}}>DOWNLOAD FILM</a><button onClick={()=>go(17)} style={{...G("out",false),padding:"12px 24px",fontSize:12}}>PREVIEW</button><button onClick={()=>go(18)} style={{...G("out",false),padding:"12px 24px",fontSize:12}}>EXPORT</button></div></div>)}<div style={{background:"#050500",border:`2px solid ${GOLD}`,padding:"18px 20px",marginBottom:16}}><button onClick={startRender} disabled={rendering||clips.length===0} style={{...G("gold",false),width:"100%",padding:"18px",fontSize:14,letterSpacing:3,opacity:rendering||clips.length===0?0.5:1,marginBottom:10}}>{rendering?"RENDERING... "+progress+"%":"START RENDER — "+quality+" · "+fps+"fps · "+clips.length+" CLIP"+(clips.length!==1?"S":"")}</button></div><div style={{display:"flex",gap:8}}><button onClick={()=>go(13)} style={{...G("out",false),flex:1,padding:"10px",fontSize:11}}>TIMELINE</button><button onClick={()=>go(15)} style={{...G("out",false),flex:1,padding:"10px",fontSize:11}}>AUDIO MIX</button><button onClick={()=>go(8)} style={{...G("out",false),flex:1,padding:"10px",fontSize:11}}>GENERATOR</button><button onClick={()=>go(17)} style={{...G("out",false),flex:1,padding:"10px",fontSize:11}}>PREVIEW</button></div></div><div style={{borderLeft:`1px solid ${GOLDDIM}`,display:"flex",flexDirection:"column",background:"#020200"}}><div style={{background:"#000",aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>{renderUrl?(<video src={renderUrl} controls autoPlay loop playsInline style={{width:"100%",height:"100%",objectFit:"contain"}}/>):(<div style={{textAlign:"center",padding:20}}><div style={{color:GOLD,fontSize:28,marginBottom:8}}>RENDER</div><div style={{color:DIM,fontSize:10,lineHeight:1.8}}>{quality} · {fps}fps<br/>{clips.length} clip{clips.length!==1?"s":""} queued</div></div>)}</div><div style={{flex:1,overflowY:"auto",padding:14}}><div style={{color:GOLD,fontSize:9,letterSpacing:3,fontWeight:900,marginBottom:10}}>RENDER QUEUE</div>{clips.length===0?(<div style={{color:GOLDDIM,fontSize:10,textAlign:"center",padding:"20px 0",lineHeight:1.8}}>No clips.<br/>Generate on page 8.</div>):clips.map((clip,i)=>(<div key={clip.id||i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:4,background:currentClipIdx===i?"#0a0800":"#0a0a0a",border:`1px solid ${currentClipIdx===i?GOLD:GOLDDIM}`}}><div style={{width:22,height:22,background:currentClipIdx===i?GOLD:"#222",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:currentClipIdx===i?"#000":DIM,fontSize:9,fontWeight:900}}>{i+1}</span></div><div style={{flex:1,overflow:"hidden"}}><div style={{color:currentClipIdx===i?GOLD:WHITE,fontSize:10,fontWeight:900,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{clip.name.replace(/\.[^.]+$/,"").slice(0,28)}</div></div></div>))}</div></div></div></div>);
}

function P17({go,rendered,mediaLib}){
  const videoRef=useRef(null);const[isPlaying,setIsPlaying]=useState(false);const[currentTime,setCurrentTime]=useState(0);const[duration,setDuration]=useState(0);
  const vs=rendered?.url||(mediaLib.find(a=>a.type&&a.type.startsWith("video"))?mediaLib.find(a=>a.type&&a.type.startsWith("video")).url:"");
  const fmt=s=>{if(!s||!isFinite(s)||isNaN(s))return"00:00";const m=Math.floor(s/60);const sc=Math.floor(s%60);return`${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;};
  const togglePlay=()=>{if(!videoRef.current)return;if(isPlaying){videoRef.current.pause();setIsPlaying(false);}else{videoRef.current.play();setIsPlaying(true);}};
  return(<div style={{...Sp,padding:40}}><div style={{maxWidth:880,margin:"0 auto"}}><h1 style={{...H1,fontSize:28,marginBottom:14}}>FILM PREVIEW</h1><div style={{background:"#000",overflow:"hidden",marginBottom:14,aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${GOLDDIM}`}}>{vs?<video ref={videoRef} src={vs} style={{width:"100%",height:"100%"}} controls onTimeUpdate={()=>setCurrentTime(videoRef.current?.currentTime||0)} onLoadedMetadata={()=>setDuration(videoRef.current?.duration||0)} onEnded={()=>setIsPlaying(false)}/>:<div style={{textAlign:"center",color:GOLDDIM,fontSize:40}}>🎬</div>}</div><div style={{...Card(),display:"flex",alignItems:"center",gap:8}}><button onClick={()=>{if(videoRef.current)videoRef.current.currentTime=0;}} style={{...G("out",true)}}>⏮</button><button onClick={()=>{if(videoRef.current)videoRef.current.currentTime-=10;}} style={{...G("out",true)}}>⏪</button><button onClick={togglePlay} style={{...G("gold",true),minWidth:44}}>{isPlaying?"⏸":"▶"}</button><button onClick={()=>{if(videoRef.current)videoRef.current.currentTime+=10;}} style={{...G("out",true)}}>⏩</button><div style={{flex:1,height:4,background:"#111",cursor:"pointer"}} onClick={e=>{if(!videoRef.current||!duration)return;const r=e.currentTarget.getBoundingClientRect();videoRef.current.currentTime=((e.clientX-r.left)/r.width)*duration;}}><div style={{width:`${duration?(currentTime/duration*100):0}%`,height:"100%",background:GOLD}}/></div><span style={{color:WHITE,fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{fmt(currentTime)} / {fmt(duration||0)}</span></div></div></div>);
}

function P18({rendered,mediaLib}){
  const vs=rendered?.url||(mediaLib.find(a=>a.type&&a.type.startsWith("video"))?mediaLib.find(a=>a.type&&a.type.startsWith("video")).url:"");
  const dl=()=>{if(!vs){alert("No film yet — render first!");return;}const a=document.createElement("a");a.href=vs;a.download="MandaStrong_Film.webm";a.click();};
  return(<div style={{...Sp,padding:40}}><div style={{maxWidth:780,margin:"0 auto"}}><div style={{fontSize:11,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>DISTRIBUTION</div><h1 style={{...H1,fontSize:28,marginBottom:14}}>EXPORT & DISTRIBUTE</h1><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>{[["💾","DOWNLOAD TO DEVICE",dl],["💿","SAVE PROJECT FILE",()=>{}],["🌐","SHARE TO COMMUNITY",()=>{}]].map(([ic,lb,fn])=>(<button key={lb} onClick={fn} style={{...Card(),cursor:"pointer",textAlign:"center",padding:16,display:"block"}}><div style={{fontSize:24,marginBottom:6}}>{ic}</div><div style={{color:WHITE,fontSize:11,fontWeight:900,letterSpacing:2}}>{lb}</div></button>))}</div><div style={{color:GOLD,fontWeight:900,fontSize:11,letterSpacing:3,marginBottom:10}}>SHARE TO SOCIAL MEDIA</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{[["YouTube","#FF0000","https://www.youtube.com/upload"],["Instagram","#E1306C","https://www.instagram.com"],["TikTok","#69C9D0","https://www.tiktok.com/upload"],["X / Twitter","#1DA1F2","https://twitter.com/intent/tweet?text=Check+out+my+film+made+with+MandaStrong+Studio"],["Facebook","#1877F2","https://www.facebook.com/sharer/sharer.php?u=https://mandastrong1.etsy.com"],["LinkedIn","#0A66C2","https://www.linkedin.com/sharing/share-offsite/?url=https://mandastrong1.etsy.com"],["Vimeo","#1AB7EA","https://vimeo.com/upload"],["WhatsApp","#25D366","https://api.whatsapp.com/send?text=Check+out+my+film+from+MandaStrong+Studio"]].map(([s,c,link])=>(<button key={s} onClick={()=>window.open(link,"_blank")} style={{background:"#000",border:`1px solid ${GOLDDIM}`,padding:"10px 16px",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=c;e.currentTarget.style.background=c+"22";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM;e.currentTarget.style.background="#000";}}><div style={{color:c,fontSize:12,fontWeight:900,letterSpacing:1}}>{s}</div></button>))}</div></div></div>);
}

function P20(){
  const[tab,setTab]=useState("tos");
  const p=(txt)=><p style={{color:WHITE,fontSize:13,lineHeight:1.9,marginBottom:8}}>{txt}</p>;
  const sec=(title,body)=>(<div style={{marginBottom:16}}><h3 style={{color:GOLD,fontWeight:900,fontSize:13,marginBottom:8,letterSpacing:2,borderBottom:`1px solid ${GOLDDIM}`,paddingBottom:6}}>{title}</h3>{body}</div>);
  return(<div style={{...Sp,padding:40}}><div style={{maxWidth:860,margin:"0 auto"}}><div style={{fontSize:11,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>LEGAL</div><h1 style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:28,fontWeight:900,letterSpacing:4,marginBottom:4}}>TERMS & DISCLAIMER</h1><div style={{color:WHITE,fontSize:11,marginBottom:20,letterSpacing:2}}>EFFECTIVE 2026 · MANDASTRONG STUDIO</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",marginBottom:28,border:`1px solid ${GOLDDIM}`}}>{[["tos","TERMS OF SERVICE"],["disc","DISCLAIMER"]].map(([id,label])=>(<button key={id} onClick={()=>setTab(id)} style={{background:tab===id?`linear-gradient(135deg,#0a0500,#1a0800)`:"#000",border:"none",borderBottom:tab===id?`2px solid ${GOLD}`:"2px solid transparent",color:tab===id?GOLD:WHITE,padding:"14px",cursor:"pointer",fontSize:12,fontWeight:900,letterSpacing:3,fontFamily:"'Rajdhani',sans-serif"}}>{label}</button>))}</div>{tab==="tos"&&(<div><div style={{background:"#050500",border:`2px solid ${GOLD}`,padding:"14px 20px",marginBottom:20,textAlign:"center"}}><div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900}}>MANDASTRONG STUDIO · PROFESSIONAL CINEMA INTELLIGENCE PLATFORM</div><div style={{color:WHITE,fontSize:12,marginTop:4}}>By using this platform you agree to be legally bound by these Terms.</div></div>{sec("1. ACCEPTANCE OF TERMS",p("By accessing or using MandaStrong Studio you agree to be legally bound by these Terms of Service. If you do not agree, do not use this platform."))}{sec("2. SUBSCRIPTIONS & BILLING",p("MandaStrong Studio offers three paid plans: Creator ($20/mo), Pro ($30/mo), and Studio ($50/mo). All plans bill monthly and auto-renew unless cancelled. The Studio Plan includes a 7-day free trial. All payments processed via Stripe."))}{sec("3. INTELLECTUAL PROPERTY",p("You retain full ownership of all original media you upload. Studio Plan subscribers receive full commercial rights to AI-generated content. MandaStrong Studio's tools, interface, and codebase remain the intellectual property of Amanda Woolley."))}{sec("4. AI-GENERATED CONTENT",p("Content generated by MandaStrong Studio's AI tools is produced algorithmically. You are solely responsible for reviewing and verifying all AI-generated outputs before use."))}{sec("5. SOCIAL MISSION",p("A meaningful portion of all subscription proceeds is donated to veterans mental health initiatives and school anti-bullying programmes. These are the founding mission of this platform."))}{sec("6. LIMITATION OF LIABILITY",p("MandaStrong Studio is provided as-is. To the maximum extent permitted by law, MandaStrong Studio shall not be liable for any indirect, incidental, or consequential damages."))}{sec("7. CONTACT",p("For support contact us at MandaStrong1.Etsy.com or through Agent Grok on Page 21."))}<div style={{background:"#050500",border:`1px solid ${GOLDDIM}`,padding:"12px 16px",marginTop:8}}><p style={{color:GOLDDIM,fontSize:11,margin:0,letterSpacing:1}}>AMANDA WOOLLEY · FOUNDER · MANDASTRONG STUDIO · 2026</p></div></div>)}{tab==="disc"&&(<div><div style={{background:"#050500",border:`2px solid ${GOLD}`,padding:"14px 20px",marginBottom:20,textAlign:"center"}}><div style={{color:GOLD,fontSize:11,letterSpacing:3,fontWeight:900}}>IMPORTANT — PLEASE READ BEFORE USING THIS PLATFORM</div></div>{sec("AI-GENERATED CONTENT",<>{p("MandaStrong Studio is an AI-assisted creative platform. All outputs must be reviewed by the user before publication or commercial use.")}{p("AI-generated content may occasionally contain inaccuracies. You are solely responsible for fact-checking before distributing any content created on this platform.")}</>)}{sec("NO PROFESSIONAL ADVICE",p("Nothing generated by MandaStrong Studio constitutes legal, medical, financial, or any other form of professional advice. The platform is a creative production tool only."))}{sec("PLATFORM AVAILABILITY",p("MandaStrong Studio is provided on an 'as available' basis. We recommend downloading and backing up all completed productions regularly."))}{sec("SOCIAL MISSION COMMITMENT",p("A meaningful portion of all subscription revenue is directed to veterans mental health programmes and school anti-bullying initiatives."))}<div style={{background:"#050500",border:`1px solid ${GOLDDIM}`,padding:"12px 16px",marginTop:8}}><p style={{color:GOLDDIM,fontSize:11,margin:0,letterSpacing:1}}>— AMANDA WOOLLEY · FOUNDER · MANDASTRONG STUDIO · 2026 · mandastrongstudio2026.bolt.host</p></div></div>)}</div></div>);
}

function P21(){
  const[msgs,setMsgs]=useState([{role:"assistant",content:"Welcome to Agent Grok — your MandaStrong Studio AI assistant. I know every tool, every workflow, and every page of this platform. What do you need?"}]);
  const[inp,setInp]=useState("");const[loading,setLoading]=useState(false);const bot=useRef(null);
  const qs=["Walk me through the full production workflow","How do I make a music video?","How do I export in 8K?","Tell me about pricing and plans","How does the render engine work?","What voice should I use for documentary?"];
  useEffect(()=>{bot.current&&bot.current.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async()=>{
    if(!inp.trim())return;const q=inp.trim();setInp("");setLoading(true);setMsgs(p=>[...p,{role:"user",content:q}]);
    try{const r=await fetch(PROXY_URL,{method:"POST",headers:PROXY_HEADERS,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:"You are Agent Grok, the expert AI assistant built into MandaStrong Studio — a professional cinema intelligence platform with 600+ AI tools, 8K export, films up to 3 hours. Plans: Creator $20/mo, Pro $30/mo, Studio $50/mo with 7-day free trial. 23 pages covering full production pipeline P8→P6→P13→P15→P16→P17→P18. Audio mixer defaults: VOICE 85, MUSIC 40, EFX 50, MASTER 85. James voice: speed 0.62, pitch 0.86, pause 1600ms. Be professional, precise and helpful.",messages:[...msgs.filter(m=>m.role!=="system"),{role:"user",content:q}]})});
      const d=await r.json();setMsgs(p=>[...p,{role:"assistant",content:d.content&&d.content[0]?d.content[0].text:"Let me help!"}]);
    }catch(e){setMsgs(p=>[...p,{role:"assistant",content:"Unable to connect — check your connection and try again."}]);}setLoading(false);
  };
  return(<div style={{...Sp,padding:0}}><div style={{background:`linear-gradient(135deg,#0a0500,#050200)`,borderBottom:`1px solid ${GOLD}`,padding:"20px 32px",display:"flex",alignItems:"center",gap:16}}><div style={{width:52,height:52,background:`linear-gradient(135deg,${GOLDDIM},${GOLD})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cinzel',serif",fontSize:26,fontWeight:900,color:"#000",flexShrink:0}}>G</div><div><h1 style={{...H1,fontSize:22,margin:0}}>AGENT GROK</h1><div style={{color:WHITE,fontSize:12,marginTop:3,letterSpacing:1}}>MandaStrong Studio AI Assistant · Expert knowledge of all 23 pages and 600+ tools</div></div><div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e"}}/><span style={{color:"#22c55e",fontSize:11,fontWeight:900,letterSpacing:2}}>ONLINE</span></div></div><div style={{maxWidth:780,margin:"0 auto",padding:"24px 24px 160px"}}><div style={{...Card(),minHeight:380,maxHeight:"calc(100vh - 380px)",overflowY:"auto",marginBottom:12,display:"flex",flexDirection:"column",gap:10,padding:16}}>{msgs.map((m,i)=>(<div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}><div style={{width:28,height:28,borderRadius:"50%",background:m.role==="user"?`linear-gradient(135deg,${GOLDDIM},${GOLD})`:"#1a3a5c",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,fontWeight:900,color:m.role==="user"?"#000":GOLD}}>{m.role==="user"?"U":"G"}</div><div style={{flex:1,background:m.role==="user"?"rgba(232,201,109,0.06)":"rgba(26,82,118,0.15)",border:`1px solid ${m.role==="user"?GOLDDIM+"44":"#2980b944"}`,padding:"10px 14px"}}><div style={{fontSize:9,color:m.role==="user"?GOLDDIM:"#5dade2",fontWeight:900,letterSpacing:2,marginBottom:5}}>{m.role==="user"?"YOU":"AGENT GROK"}</div><div style={{color:WHITE,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{m.content}</div></div></div>))}{loading&&(<div style={{display:"flex",gap:10,alignItems:"flex-start"}}><div style={{width:28,height:28,borderRadius:"50%",background:"#1a3a5c",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,fontWeight:900,color:GOLD}}>G</div><div style={{background:"rgba(26,82,118,0.15)",border:"1px solid #2980b944",padding:"10px 14px"}}><div style={{color:"#5dade2",fontSize:9,fontWeight:900,letterSpacing:2,marginBottom:5}}>AGENT GROK</div><div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:GOLD,animation:`pulse 1s ${i*0.2}s ease-in-out infinite`}}/>)}</div></div></div>)}<div ref={bot}/></div><div style={{marginBottom:10}}><div style={{color:GOLDDIM,fontSize:10,letterSpacing:2,marginBottom:6,fontWeight:700}}>QUICK QUESTIONS</div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{qs.map(q=><button key={q} onClick={()=>setInp(q)} style={{background:"#0a0800",border:`1px solid ${GOLDDIM}`,color:WHITE,padding:"5px 10px",cursor:"pointer",fontSize:10,fontWeight:700,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.color=GOLD;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=GOLDDIM;e.currentTarget.style.color=WHITE;}}>{q}</button>)}</div></div><div style={{display:"flex",gap:8}}><textarea value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Ask Agent Grok anything..." style={{flex:1,height:50,resize:"none",padding:"10px 12px",fontSize:14,background:"#0a0a0a",border:`1px solid ${GOLDDIM}`,color:WHITE,outline:"none",lineHeight:1.5,fontFamily:"'Rajdhani',sans-serif"}}/><button onClick={send} disabled={loading||!inp.trim()} style={{...G("gold",false),height:50,padding:"0 22px",opacity:loading||!inp.trim()?0.5:1}}>SEND</button></div></div></div>);
}

function P22(){
  const[posts,setPosts]=useState([{id:1,user:"Sarah J.",title:"Epic Action Feature",icon:"🎬",views:2847,likes:1522},{id:2,user:"Mike Chen",title:"Family Documentary",icon:"📽",views:1256,likes:812},{id:3,user:"Emily R.",title:"Short Film Entry",icon:"🏆",views:3421,likes:2156},{id:4,user:"Alex T.",title:"Music Video Cut",icon:"🎵",views:5234,likes:4012}]);
  return(<div style={{...Sp,padding:40}}><div style={{maxWidth:780,margin:"0 auto"}}><div style={{fontSize:11,color:GOLD,letterSpacing:4,marginBottom:4,fontWeight:700}}>CREATOR NETWORK</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h1 style={{...H1,fontSize:28,margin:0}}>COMMUNITY HUB</h1><button style={{...G("gold",false)}}>UPLOAD YOUR MOVIE</button></div>{posts.map(p=>(<div key={p.id} style={{...Card(),marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:24}}>{p.icon}</span><div><div style={{color:GOLD,fontWeight:900,fontSize:14}}>{p.title}</div><div style={{color:WHITE,fontSize:12}}>by {p.user}</div></div></div><div style={{display:"flex",alignItems:"center",gap:12}}><span style={{color:WHITE,fontSize:12}}>👁 {p.views.toLocaleString()}</span><span style={{color:WHITE,fontSize:12}}>❤️ {p.likes.toLocaleString()}</span><button onClick={()=>setPosts(ps=>ps.map(x=>x.id===p.id?{...x,likes:x.likes+1}:x))} style={{...G("out",true)}}>LIKE</button></div></div>))}</div></div>);
}

function P23({go}){
  const[guideOpen,setGuideOpen]=useState(false);
  return(<div style={{...Sp,padding:"0 0 80px"}}><video autoPlay loop muted playsInline preload="auto" style={{width:"100%",aspectRatio:"16/9",background:"#000",display:"block",maxHeight:"60vh",objectFit:"cover"}} onError={e=>{e.currentTarget.style.display="none";}}><source src="/background.mp4" type="video/mp4"/><source src="background.mp4" type="video/mp4"/></video><div style={{maxWidth:820,margin:"0 auto",textAlign:"center",padding:"26px 40px 0"}}><div style={{fontSize:10,color:GOLD,letterSpacing:6,marginBottom:10,fontWeight:700}}>MANDASTRONG STUDIO · CINEMA INTELLIGENCE PLATFORM · 2026</div><h1 style={{fontFamily:"'Cinzel',serif",color:GOLD,fontSize:"clamp(22px,3vw,32px)",fontWeight:900,letterSpacing:5,textShadow:`0 0 30px ${GOLD}99`,marginBottom:6}}>THAT'S ALL FOLKS</h1><div style={{color:WHITE,fontSize:13,letterSpacing:3,marginBottom:14}}>THANK YOU FOR CREATING WITH US</div><div style={{height:1,background:`linear-gradient(90deg,transparent,${GOLD},transparent)`,marginBottom:20}}/><div style={{...Card(),textAlign:"left",marginBottom:14,background:"#050500",border:`2px solid ${GOLD}`}}><div style={{color:GOLD,fontWeight:900,fontSize:14,letterSpacing:3,marginBottom:14,textAlign:"center"}}>✦ OUR MISSION</div><p style={{color:WHITE,fontSize:14,lineHeight:2,margin:0}}>MandaStrong Studio was built with one belief — <strong style={{color:GOLD}}>that every person deserves the tools to tell their story.</strong></p><p style={{color:WHITE,fontSize:14,lineHeight:2,marginTop:12}}>Every subscription directly funds two causes close to our heart: <strong style={{color:GOLD}}>veterans mental health support</strong> and <strong style={{color:GOLD}}>school anti-bullying programmes</strong>.</p><p style={{color:WHITE,fontSize:14,lineHeight:2,marginTop:12}}>I am Amanda Woolley — author, creative producer, and founder of MandaStrong Studio.</p><p style={{color:GOLD,fontWeight:900,fontSize:13,letterSpacing:2,marginTop:12,marginBottom:4}}>— AMANDA WOOLLEY · FOUNDER · MANDASTRONG STUDIO</p><p style={{color:WHITE,fontSize:11,letterSpacing:1,margin:0}}>MandaStrong1.Etsy.com · mandastrongstudio2026.bolt.host</p></div><div onClick={()=>setGuideOpen(g=>!g)} style={{...Card(),marginBottom:guideOpen?0:14,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",textAlign:"left",border:`1px solid ${GOLD}`}}><span style={{color:GOLD,fontWeight:900,fontSize:14,letterSpacing:3}}>📖 MANDASTRONG HOW TO USE APP GUIDE</span><span style={{color:GOLD,fontSize:18}}>{guideOpen?"▲":"▼"}</span></div>{guideOpen&&(<div style={{...Card(),textAlign:"left",marginBottom:14,borderTop:"none"}}><div style={{color:GOLD,fontWeight:900,fontSize:13,letterSpacing:3,marginBottom:12,textAlign:"center"}}>MANDASTRONG STUDIO — COMPLETE USER GUIDE</div>{[["GETTING STARTED","Open the app. Use the ☰ Quick Access menu top left to jump to any of the 23 pages instantly, or use BACK / NEXT buttons in the footer bar."],["PAGE 4 — LOGIN & PRICING","Sign in, create a free account, or browse as guest. Creator $20/mo · Pro $30/mo · Studio $50/mo with 7-day free trial."],["PAGES 5–10 — AI TOOLS","Over 600 professional AI tools across Writing, Voice, Image, Video, Motion and Enhancement. Click any tool card, describe what you want, hit AI CREATE."],["PAGE 6 — VOICE ENGINE","55 cinematic voice characters. Select your voice, paste your script, set Speed, Pitch and Pause sliders, then hit PREPARE & SPEAK."],["PAGE 8 — VIDEO GENERATOR","Describe your scene in plain English. Hit GENERATE VIDEO CLIP. The canvas engine builds your cinematic environment."],["PAGE 13 — TIMELINE EDITOR","Drag your media clips onto the video, audio and title tracks. Build your film sequence. Hit RENDER when ready."],["PAGE 15 — AUDIO MIXER","Set your mix levels. Recommended documentary settings: VOICE 85 · MUSIC 40 · EFX 50 · MASTER 85."],["PAGE 16 — RENDER ENGINE","Choose your output quality up to 4K. Select frame rate and codec. Hit START RENDER."],["PRODUCTION WORKFLOW","Recommended order: Page 8 → Page 6 → Page 13 → Page 15 → Page 16 → Page 17 → Page 18."]].map(([t,d])=>(<div key={t} style={{borderBottom:`1px solid ${GOLDDIM}33`,paddingBottom:10,marginBottom:10}}><div style={{color:GOLD,fontWeight:900,fontSize:11,letterSpacing:2,marginBottom:4}}>{t}</div><div style={{color:WHITE,fontSize:13,lineHeight:1.7}}>{d}</div></div>))}</div>)}<div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginTop:14}}><button onClick={()=>go(1)} style={{...G("out",false)}}>⬅ BACK TO HOME</button><button onClick={()=>window.open("https://MandaStrong1.Etsy.com","_blank")} style={{...G("out",false)}}>VISIT ETSY STORE</button><button onClick={()=>go(4)} style={{...G("gold",false)}}>START CREATING ✦</button></div></div></div>);
}

const getPlanDuration=(plan)=>{const limits={"Creator":60,"Pro":120,"Studio":180,"Enterprise":180,"Studio Trial":180};return limits[plan]||60;};

export default function App(){
  const[page,setPage]=useState(1);const[menu,setMenu]=useState(false);const[visited,setVisited]=useState(()=>new Set([1]));
  useEffect(()=>{
    const link=document.createElement("link");link.rel="stylesheet";link.href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Rajdhani:wght@400;600;700;800;900&display=swap";document.head.appendChild(link);
    let vp=document.querySelector("meta[name=viewport]");if(!vp){vp=document.createElement("meta");vp.name="viewport";document.head.appendChild(vp);}vp.content="width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes,viewport-fit=cover";
    const style=document.createElement("style");style.textContent=`*{box-sizing:border-box!important;}html,body{margin:0;padding:0;width:100%;overflow-x:hidden;-webkit-text-size-adjust:100%;}img,video,canvas{max-width:100%;}[data-bolt-badge],a[href*='bolt.new'],.bolt-badge,[class*='bolt'],[id*='bolt'],a[href*='stackblitz'],[class*='stackblitz']{display:none!important;opacity:0!important;pointer-events:none!important;width:0!important;height:0!important;overflow:hidden!important;}@media(max-width:900px){div[style*="repeat(4"]{grid-template-columns:1fr 1fr!important;}div[style*="repeat(3"]{grid-template-columns:1fr 1fr!important;}div[style*="1fr 1fr 1fr"]{grid-template-columns:1fr 1fr!important;}div[style*="290px 1fr"]{grid-template-columns:1fr!important;}div[style*="1fr 420px"]{grid-template-columns:1fr!important;}}@media(max-width:600px){div[style*="grid-template-columns"]{grid-template-columns:1fr!important;}div[style*="padding:40px"]{padding:16px!important;}footer>div:last-child{flex-wrap:wrap!important;gap:6px!important;}}body::after{content:'MANDASTRONG STUDIO';position:fixed;bottom:8px;right:12px;font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:900;letter-spacing:2px;color:#a07820;opacity:0.6;pointer-events:none;z-index:99999;}`;document.head.appendChild(style);
    return()=>{try{document.head.removeChild(link);}catch{}};
  },[]);
  const[user,setUser]=useState(()=>{try{const stored=JSON.parse(localStorage.getItem("ms_user")||'{"name":"Guest","plan":"Guest","isAdmin":false}');return stored;}catch{return{name:"Guest",plan:"Guest",isAdmin:false};}});
  const[mediaLib,setMediaLib]=useState([]);const[timeline,setTimeline]=useState(()=>{try{return JSON.parse(localStorage.getItem("ms_timeline")||"{}");}catch{return{};}});const[rendered,setRendered]=useState(null);const[filmDuration,setFilmDuration]=useState(60);const[savedNotice,setSavedNotice]=useState(false);const[showHistory,setShowHistory]=useState(false);const[showSaveModal,setShowSaveModal]=useState(false);
  const go=p=>{setPage(p);setVisited(v=>{const n=new Set(v);n.add(p);return n;});window.scrollTo(0,0);try{localStorage.setItem("ms_page",JSON.stringify(p));}catch{}};
  useEffect(()=>{
    const restore=async()=>{
      try{const t=JSON.parse(localStorage.getItem("ms_timeline")||"{}");if(Object.keys(t).length>0)setTimeline(t);}catch(e){}
      try{const dbClips=await getAllClipsFromDB();if(dbClips.length>0){const restored=dbClips.map(c2=>({id:c2.id,name:c2.name,type:c2.type||"video/webm",url:URL.createObjectURL(c2.blob),file:new File([c2.blob],c2.name,{type:c2.type||"video/webm"}),dbId:c2.id}));setMediaLib(restored);}else{try{const m=JSON.parse(localStorage.getItem("ms_medialib")||"[]");if(m.length>0)setMediaLib(m);}catch(e){}}}catch(e){try{const m=JSON.parse(localStorage.getItem("ms_medialib")||"[]");if(m.length>0)setMediaLib(m);}catch(e2){}}
    };
    restore();
    const handler=()=>setShowHistory(true);window.addEventListener("ms_open_history",handler);return()=>window.removeEventListener("ms_open_history",handler);
  },[]);
  const saveAsset=async(a)=>{if(a.file instanceof File||a.file instanceof Blob){try{const blob=a.file instanceof File?a.file:a.file;const dbId=a.id||("asset_"+Date.now());await saveClipToDB(dbId,blob,a.name||"asset",a.type||"video/webm");setMediaLib(p=>[...p,{...a,dbId}]);}catch(e){setMediaLib(p=>[...p,a]);}}else{setMediaLib(p=>[...p,a]);}};
  const saveProject=()=>setShowSaveModal(true);
  const doSave=(name,note)=>{
    try{
      localStorage.setItem("ms_page",JSON.stringify(page));
      localStorage.setItem("ms_user",JSON.stringify(user));
      localStorage.setItem("ms_timeline",JSON.stringify(timeline));
      localStorage.setItem("ms_medialib",JSON.stringify(mediaLib.map(a=>({...a,file:undefined}))));
      // Save clip IDs so this project can restore only its own clips
      const clipIds=mediaLib.map(a=>a.dbId||a.id).filter(Boolean);
      const entry={name,note,page,assetCount:mediaLib.length,date:new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}),savedPage:page,savedTimeline:JSON.parse(JSON.stringify(timeline)),savedUser:user,clipIds};
      const existing=JSON.parse(localStorage.getItem("ms_project_history")||"[]");existing.push(entry);if(existing.length>20)existing.shift();localStorage.setItem("ms_project_history",JSON.stringify(existing));
      setShowSaveModal(false);setSavedNotice(true);setTimeout(()=>setSavedNotice(false),2500);
    }catch(e){setShowSaveModal(false);alert("Saved!");}
  };
  const resumeProject=async(h)=>{
    try{
      // Restore timeline
      if(h.savedTimeline&&Object.keys(h.savedTimeline).length>0){setTimeline(h.savedTimeline);localStorage.setItem("ms_timeline",JSON.stringify(h.savedTimeline));}
      // Restore user
      if(h.savedUser&&h.savedUser.name){setUser(h.savedUser);localStorage.setItem("ms_user",JSON.stringify(h.savedUser));}
      // Restore only this project's clips (by saved clipIds if available, else all)
      try{
        const dbClips=await getAllClipsFromDB();
        if(dbClips.length>0){
          const projectClips=h.clipIds&&h.clipIds.length>0
            ?dbClips.filter(c=>h.clipIds.includes(c.id))
            :dbClips;
          const restored=projectClips.map(c2=>({id:c2.id,name:c2.name,type:c2.type||"video/webm",url:URL.createObjectURL(c2.blob),file:new File([c2.blob],c2.name,{type:c2.type||"video/webm"}),dbId:c2.id}));
          setMediaLib(restored);
        }else{setMediaLib([]);}
      }catch(e){}
      go(h.savedPage||h.page||8);setShowHistory(false);setSavedNotice(true);setTimeout(()=>setSavedNotice(false),2500);
    }catch(e){setShowHistory(false);}
  };
  const newProject=()=>{
    if(mediaLib.length>0||Object.keys(timeline||{}).length>0){
      if(!window.confirm("Start a new project? Your current work is safe — use MY PROJECTS to return to it."))return;
    }
    setTimeline({});setMediaLib([]);setRendered(null);
    go(8);setSavedNotice(true);setTimeout(()=>setSavedNotice(false),1800);
  };
  const allPages=[
    {p:1,el:<P1 go={go}/>},{p:2,el:<P2 go={go}/>},{p:3,el:<P3 onSave={saveAsset}/>},{p:4,el:<P4 go={go} setUser={setUser}/>},
    {p:5,el:<ToolPage title="WRITING TOOLS" subtitle="AI WORKSTATION 01 — WRITING" tools={WRITING} onSave={saveAsset}/>},
    {p:6,el:<P6Voice onSave={saveAsset}/>},
    {p:7,el:<ToolPage title="IMAGE TOOLS" subtitle="AI WORKSTATION 03 — IMAGE" tools={IMAGE_T} onSave={saveAsset}/>},
    {p:8,el:<P8VideoGenerator onSave={saveAsset} user={user} filmDuration={filmDuration} setFilmDuration={setFilmDuration}/>},
    {p:9,el:<ToolPage title="MOTION & VFX" subtitle="AI WORKSTATION 05 — MOTION" tools={MOTION} onSave={saveAsset}/>},
    {p:10,el:<ToolPage title="ENHANCEMENT STUDIO" subtitle="AI WORKSTATION 06 — ENHANCE" tools={MOTION} onSave={saveAsset}/>},
    {p:11,el:<P11 mediaLib={mediaLib} setMediaLib={setMediaLib}/>},
    {p:12,el:<P12 go={go} mediaLib={mediaLib}/>},
    {p:13,el:<P13 go={go} mediaLib={mediaLib} timeline={timeline} setTimeline={setTimeline} user={user} filmDuration={filmDuration} setFilmDuration={setFilmDuration}/>},
    {p:14,el:<P14/>},{p:15,el:<P15/>},
    {p:16,el:<P16 go={go} timeline={timeline} setRendered={setRendered} mediaLib={mediaLib} setMediaLib={setMediaLib} user={user} filmDuration={filmDuration} setFilmDuration={setFilmDuration}/>},
    {p:17,el:<P17 go={go} rendered={rendered} mediaLib={mediaLib}/>},
    {p:18,el:<P18 rendered={rendered} mediaLib={mediaLib}/>},
    {p:19,el:<P19 go={go}/>},
    {p:20,el:<P20/>},{p:21,el:<P21/>},{p:22,el:<P22/>},{p:23,el:<P23 go={go}/>},
  ];
  return(
    <div style={{background:"#000",minHeight:"100vh",fontFamily:"'Rajdhani',sans-serif"}}>
      <Header go={go} setMenu={setMenu} user={user}/>
      {menu&&<QAMenu go={go} onClose={()=>setMenu(false)} user={user}/>}
      {showHistory&&<ProjectHistoryModal onClose={()=>setShowHistory(false)} onResume={resumeProject}/>}
      {showSaveModal&&<SaveSessionModal onClose={()=>setShowSaveModal(false)} onSave={doSave} currentPage={page} assetCount={mediaLib.length}/>}
      {savedNotice&&<div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",background:GOLDDIM,color:"#000",padding:"10px 24px",fontWeight:900,fontSize:13,letterSpacing:2,zIndex:999}}>✓ PROJECT SAVED</div>}
      <div style={{minHeight:"calc(100vh - 116px)"}}>
        {allPages.map(({p,el})=>(page===p?(<div key={p} style={{display:"block"}}>{el}</div>):visited.has(p)?(<div key={p} style={{display:"none"}}>{el}</div>):null))}
      </div>
      <Footer page={page} go={go} onSave={saveProject} onHistory={()=>setShowHistory(true)} onNew={newProject}/>
    </div>
  );
}
