import { useState, useRef } from 'react';
import { X, Upload, Sparkles, ImagePlus, Send, Loader2, Download, RefreshCw } from 'lucide-react';

const CLAUDE_ENDPOINT = "https://njqfexhltjwpgvctmyaw.supabase.co/functions/v1/claude-proxy";

interface AIToolModalProps {
  toolName: string;
  onClose: () => void;
  onOpenAssetPage: (mode: 'upload' | 'create') => void;
}

function detectMode(toolName: string): 'video' | 'image' | 'audio' | 'text' {
  const n = toolName.toLowerCase();
  if (n.includes('video') || n.includes('scene') || n.includes('film') || n.includes('motion') || n.includes('animator') || n.includes('reel') || n.includes('trailer') || n.includes('switcher')) return 'video';
  if (n.includes('image') || n.includes('photo') || n.includes('art') || n.includes('storyboard') || n.includes('concept') || n.includes('design') || n.includes('poster') || n.includes('thumbnail') || n.includes('frame') || n.includes('color') || n.includes('lut') || n.includes('grain') || n.includes('blur') || n.includes('glow') || n.includes('glitch') || n.includes('texture') || n.includes('sharpen')) return 'image';
  if (n.includes('audio') || n.includes('sound') || n.includes('music') || n.includes('voice') || n.includes('speech') || n.includes('foley') || n.includes('mix') || n.includes('reverb') || n.includes('score') || n.includes('composer') || n.includes('mastering')) return 'audio';
  return 'text';
}

function buildPrompt(toolName: string, prompt: string, mode: string): string {
  if (mode === 'video') {
    return `You are a professional film director at MandaStrong Studio. Tool: "${toolName}".\n\nUser description: ${prompt}\n\nGenerate a COMPLETE PRODUCTION-READY video prompt package:\n\n1. OPTIMISED VIDEO PROMPT\n2. SCENE BREAKDOWN (5-8 shots)\n3. CAMERA DIRECTIONS\n4. LIGHTING & COLOUR GRADE\n5. AUDIO NOTES\n6. DURATION ESTIMATE\n7. DIRECTOR'S NOTES\n\nMake it specific, cinematic and immediately production-ready.`;
  }
  if (mode === 'image') {
    return `You are a professional visual artist at MandaStrong Studio. Tool: "${toolName}".\n\nUser description: ${prompt}\n\nGenerate a COMPLETE IMAGE PROMPT PACKAGE:\n\n1. OPTIMISED PROMPT\n2. STYLE & MEDIUM\n3. LIGHTING & COLOUR PALETTE\n4. COMPOSITION & FRAMING\n5. NEGATIVE PROMPT\n6. ASPECT RATIO & RESOLUTION\n7. STYLE REFERENCES\n\nBe specific, artistic, and immediately usable in any image AI generator.`;
  }
  if (mode === 'audio') {
    return `You are a professional sound designer at MandaStrong Studio. Tool: "${toolName}".\n\nUser description: ${prompt}\n\nGenerate a COMPLETE AUDIO PRODUCTION PACKAGE:\n\n1. AUDIO DESCRIPTION & MOOD\n2. INSTRUMENTS / SOUND ELEMENTS\n3. TEMPO & RHYTHM\n4. FREQUENCY NOTES\n5. MIX DIRECTIONS\n6. REFERENCE TRACKS\n7. TECHNICAL SPECS\n\nBe specific and production-ready.`;
  }
  return `You are a professional at MandaStrong Studio cinema AI platform. Tool: "${toolName}".\n\nUser request: ${prompt}\n\nGenerate complete, detailed, professional, production-ready content. Be specific and thorough.`;
}

function getPlaceholder(toolName: string): string {
  const n = toolName.toLowerCase();
  if (n.includes('video') || n.includes('scene')) return 'Describe the scene, mood, camera movement, lighting, and any subjects...';
  if (n.includes('image') || n.includes('art') || n.includes('design')) return 'Describe the visual — style, colours, composition, subjects, atmosphere...';
  if (n.includes('script') || n.includes('story') || n.includes('dialogue')) return 'Describe the genre, tone, characters, and story beats you want...';
  if (n.includes('voice') || n.includes('speech') || n.includes('narrat')) return 'Enter the text to speak, or describe the voice style and content...';
  if (n.includes('sound') || n.includes('audio') || n.includes('music') || n.includes('score')) return 'Describe the mood, instruments, tempo, genre, and feeling you want...';
  return `Describe exactly what you want ${toolName} to generate...`;
}

export default function AIToolModal({ toolName, onClose, onOpenAssetPage }: AIToolModalProps) {
  const [view, setView] = useState<'options' | 'generate'>('options');
  const [prompt, setPrompt] = useState('');
  const [refImage, setRefImage] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const mode = detectMode(toolName);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setRefImage(f);
    setRefPreview(URL.createObjectURL(f));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setResult('');
    try {
      const aiPrompt = buildPrompt(toolName, prompt, mode);
      const res = await fetch(CLAUDE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1800, messages: [{ role: 'user', content: aiPrompt }] })
      });
      const d = await res.json();
      const txt = d.content && d.content[0] ? d.content[0].text : 'Generated!';
      setResult(txt);
    } catch {
      setResult('Connection error — check your internet and try again.');
    }
    setGenerating(false);
  };

  const handleReset = () => {
    setPrompt('');
    setRefImage(null);
    setRefPreview('');
    setResult('');
  };

  if (view === 'options') {
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:900, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
        <div style={{ width:'min(600px,95vw)', background:'#050505', border:'1px solid #e8c96d', padding:26 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontFamily:"'Cinzel',serif", color:'#e8c96d', letterSpacing:4, textTransform:'uppercase', margin:0, fontSize:16 }}>{toolName}</h2>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#e8c96d', fontSize:20, cursor:'pointer' }}>✕</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <button
              onClick={() => setView('generate')}
              style={{ background:'linear-gradient(135deg,#a07820,#e8c96d)', border:'none', color:'#000', padding:'20px 12px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:10, fontFamily:"'Rajdhani',sans-serif", fontWeight:900 }}
            >
              <Sparkles style={{ width:32, height:32 }} />
              <div>
                <div style={{ fontSize:13, letterSpacing:2, textTransform:'uppercase' }}>Generate</div>
                <div style={{ fontSize:10, fontWeight:400, marginTop:3, opacity:0.7 }}>Text prompt only</div>
              </div>
            </button>

            <button
              onClick={() => onOpenAssetPage('upload')}
              style={{ background:'transparent', border:'1px solid #a07820', color:'#e8c96d', padding:'20px 12px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:10, fontFamily:"'Rajdhani',sans-serif", fontWeight:900 }}
            >
              <Upload style={{ width:32, height:32 }} />
              <div>
                <div style={{ fontSize:13, letterSpacing:2, textTransform:'uppercase' }}>Upload</div>
                <div style={{ fontSize:10, fontWeight:400, marginTop:3, opacity:0.7 }}>Use existing media</div>
              </div>
            </button>

            <button
              onClick={() => onOpenAssetPage('create')}
              style={{ background:'transparent', border:'1px solid #a07820', color:'#e8c96d', padding:'20px 12px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:10, fontFamily:"'Rajdhani',sans-serif", fontWeight:900 }}
            >
              <ImagePlus style={{ width:32, height:32 }} />
              <div>
                <div style={{ fontSize:13, letterSpacing:2, textTransform:'uppercase' }}>Create</div>
                <div style={{ fontSize:10, fontWeight:400, marginTop:3, opacity:0.7 }}>Open asset studio</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:900, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'min(640px,95vw)', background:'#050505', border:'1px solid #e8c96d', maxHeight:'92vh', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ borderBottom:'1px solid #a07820', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h2 style={{ fontFamily:"'Cinzel',serif", color:'#e8c96d', letterSpacing:4, textTransform:'uppercase', margin:0, fontSize:15 }}>{toolName}</h2>
            <p style={{ color:'#a07820', fontSize:11, margin:'3px 0 0', letterSpacing:1 }}>AI GENERATION — IMAGE UPLOAD OPTIONAL</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button
              onClick={() => { setView('options'); handleReset(); }}
              style={{ background:'none', border:'1px solid #a07820', color:'#e8c96d', padding:'4px 12px', cursor:'pointer', fontSize:11, fontWeight:900, letterSpacing:1, fontFamily:"'Rajdhani',sans-serif" }}
            >
              BACK
            </button>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#e8c96d', fontSize:20, cursor:'pointer' }}>✕</button>
          </div>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:'20px' }}>
          {/* Prompt */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', color:'#e8c96d', fontSize:11, fontWeight:900, letterSpacing:3, textTransform:'uppercase', marginBottom:6, fontFamily:"'Rajdhani',sans-serif" }}>
              Your Prompt <span style={{ color:'#e8c96d' }}>*</span>
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={getPlaceholder(toolName)}
              rows={4}
              style={{ width:'100%', background:'#000', border:'1px solid #a07820', padding:'9px 12px', color:'#d4c9a8', fontSize:14, outline:'none', resize:'none', boxSizing:'border-box', lineHeight:1.6, fontFamily:"'Rajdhani',sans-serif" }}
            />
          </div>

          {/* Optional reference image */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', color:'#a07820', fontSize:11, fontWeight:900, letterSpacing:3, textTransform:'uppercase', marginBottom:6, fontFamily:"'Rajdhani',sans-serif" }}>
              Reference Image <span style={{ color:'#666', fontWeight:400, textTransform:'none', letterSpacing:0, fontSize:10 }}>(optional)</span>
            </label>
            <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display:'none' }} onChange={handleImagePick} />
            {refPreview ? (
              <div style={{ position:'relative', display:'inline-block' }}>
                <img src={refPreview} alt="reference" style={{ height:100, borderRadius:4, objectFit:'cover', border:'1px solid #a07820' }} />
                <button
                  onClick={() => { setRefImage(null); setRefPreview(''); }}
                  style={{ position:'absolute', top:-8, right:-8, background:'#000', border:'1px solid #a07820', borderRadius:'50%', color:'#e8c96d', cursor:'pointer', padding:'2px 5px', fontSize:10 }}
                >
                  ✕
                </button>
                <p style={{ color:'#666', fontSize:10, margin:'4px 0 0' }}>{refImage?.name}</p>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', border:'1px dashed #a07820', background:'none', color:'#a07820', fontSize:12, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", letterSpacing:1 }}
              >
                <ImagePlus style={{ width:14, height:14 }} />
                ADD REFERENCE IMAGE (OPTIONAL)
              </button>
            )}
          </div>

          {/* Result */}
          {result && (
            <div style={{ background:'#0a0800', border:'1px solid #a07820', padding:16, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ color:'#e8c96d', fontSize:11, fontWeight:900, letterSpacing:3, fontFamily:"'Rajdhani',sans-serif" }}>RESULT</span>
                <button
                  onClick={handleReset}
                  style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', color:'#a07820', cursor:'pointer', fontSize:11, fontFamily:"'Rajdhani',sans-serif" }}
                >
                  <RefreshCw style={{ width:12, height:12 }} /> RESET
                </button>
              </div>
              <pre style={{ fontSize:13, color:'#d4c9a8', whiteSpace:'pre-wrap', fontFamily:"'Rajdhani',sans-serif", lineHeight:1.7, margin:0 }}>{result}</pre>
              <button style={{ marginTop:12, display:'flex', alignItems:'center', gap:6, background:'none', border:'1px solid #a07820', color:'#e8c96d', padding:'6px 14px', cursor:'pointer', fontSize:11, fontWeight:900, letterSpacing:2, fontFamily:"'Rajdhani',sans-serif" }}>
                <Download style={{ width:12, height:12 }} /> SAVE TO ASSETS
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ flexShrink:0, borderTop:'1px solid #a07820', padding:16, display:'flex', gap:10 }}>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:(!prompt.trim()||generating)?'#111':'linear-gradient(135deg,#a07820,#e8c96d)', border:'none', color:(!prompt.trim()||generating)?'#555':'#000', fontWeight:900, padding:'13px', cursor:(!prompt.trim()||generating)?'not-allowed':'pointer', fontSize:13, letterSpacing:2, fontFamily:"'Rajdhani',sans-serif" }}
          >
            {generating ? (
              <><Loader2 style={{ width:14, height:14, animation:'spin 1s linear infinite' }} /> GENERATING...</>
            ) : (
              <><Send style={{ width:14, height:14 }} /> GENERATE WITH AI ✦</>
            )}
          </button>
          {result && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{ display:'flex', alignItems:'center', gap:6, border:'1px solid #a07820', background:'none', color:'#e8c96d', padding:'13px 16px', cursor:generating?'not-allowed':'pointer', fontSize:12, fontWeight:900, letterSpacing:1, fontFamily:"'Rajdhani',sans-serif" }}
            >
              <RefreshCw style={{ width:13, height:13 }} /> REDO
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
