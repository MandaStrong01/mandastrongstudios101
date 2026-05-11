import { useState, useRef, useEffect } from 'react';
import { X, Send, ChevronRight } from 'lucide-react';

const GOLD = "#e8c96d";
const GOLDDIM = "#a07820";
const WHITE = "#d4c9a8";
const DIM = "#666655";
const GREEN = "#22c55e";

interface QA {
  keywords: string[];
  answer: string;
  followUps?: string[];
}

const KB: QA[] = [
  {
    keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greetings"],
    answer: "Good day. I am Agent Grok — your dedicated MandaStrong Studio production assistant. I have full knowledge of every tool, workflow, and feature across all 23 pages. How may I assist your production today?",
    followUps: ["How do I get started?", "What tools are available?", "Tell me about pricing"],
  },
  {
    keywords: ["get started", "start", "begin", "new", "first time", "how do i use"],
    answer: "The recommended workflow begins on Page 1 (Home) → Page 5 (Writing Tools) to develop your script → Page 8 (Video Generator) to create scenes → Page 6 (Voice Engine) for narration → Page 13 (Timeline) to assemble → Page 16 (Render Engine) to produce your final film → Page 18 (Export) to distribute. Use SAVE PROJECT in the footer at any time — your work restores exactly where you left off.",
    followUps: ["Tell me about the Voice Engine", "How does the timeline work?", "What render quality can I use?"],
  },
  {
    keywords: ["price", "plan", "cost", "subscription", "creator", "pro", "studio", "enterprise", "trial", "free"],
    answer: "MandaStrong Studio offers three plans:\n\n• Creator — $20/mo · 1080p render · Full tool access\n• Pro — $30/mo · 4K render · Priority processing\n• Studio — $50/mo · 8K render · Films up to 3 hours · 7-day free trial included\n\nAll plans include 600+ AI tools, unlimited projects, and cloud saves. The Studio 7-day free trial gives you full access to test everything risk-free.",
    followUps: ["How do I sign up?", "What tools are on Page 3?", "How long can my film be?"],
  },
  {
    keywords: ["voice", "speech", "narrate", "narrator", "james", "speak", "tts", "text to speech", "pitch", "rate"],
    answer: "The Voice Engine is on Page 6. It features 54 professional voice characters — filter by gender, age, and origin. Key settings:\n\n• PITCH slider adjusts tone depth\n• RATE slider controls speaking pace\n• PAUSE adds natural breathing gaps\n• MOOD slider across 14 emotional registers\n\nFor documentary narration, hit APPLY JAMES SETTINGS (pitch 0.86, rate 0.62, pause 1600ms). Always use PREPARE & SPEAK — it AI-formats your script for optimal delivery before speaking.",
    followUps: ["How do I use the Music Video Studio?", "Tell me about the timeline", "How does audio mixing work?"],
  },
  {
    keywords: ["video generator", "scene", "generate video", "clip", "canvas", "render scene", "page 8"],
    answer: "The Video Generator is on Page 8. Describe any scene in natural language — the more detail you give, the better the result. Include: lighting conditions, mood, camera angle (wide, close-up, aerial), time of day, characters, and setting.\n\nYou can upload a reference image to match a specific visual style. Claude writes a custom canvas renderer for each unique prompt. Every generated clip is automatically saved to your Media Library on Page 11.",
    followUps: ["How do I add clips to the timeline?", "Tell me about the Storyboard", "What is the film duration limit?"],
  },
  {
    keywords: ["music video", "music video studio", "track", "song", "artist", "genre"],
    answer: "Music Video Studio is inside Page 6. It is a 4-step production wizard:\n\n1. Track details — title, artist, genre, mood, tempo, upload your audio\n2. Visual style — video style, colour grade, effects, edit style\n3. Scene description — describe your visual concept in detail\n4. Generate, download, and share to all platforms\n\nThe system syncs your visuals to the beat of your uploaded audio automatically.",
    followUps: ["Tell me about the Voice Engine", "How do I export to social media?", "What colour grades are available?"],
  },
  {
    keywords: ["script", "writing", "logline", "treatment", "screenplay", "dialogue", "character", "episode", "arc", "page 5"],
    answer: "Writing Tools are on Page 5 with 50+ professional formats:\n\n• Loglines and one-pagers\n• Feature film treatments and full screenplays\n• Episode arcs and series bibles\n• Character profiles and backstories\n• Scene rewrites and dialogue polish\n• Documentary scripts and narration\n\nHit AI CREATE to generate any format instantly. Every script can be fed directly into the Voice Engine on Page 6.",
    followUps: ["How do I use the Voice Engine?", "Tell me about AI Tools Hub", "How does Page 3 work?"],
  },
  {
    keywords: ["ai tools", "tools hub", "600", "page 3", "writing tools", "image tools", "vfx", "enhancement"],
    answer: "The AI Tools Hub on Page 3 gives you access to 600+ industry-grade AI tools across four categories:\n\n• Writing — scripts, treatments, loglines, dialogue, character development\n• Image — generation, style transfer, upscaling, background removal\n• Motion & VFX — motion graphics, transitions, titles, colour grading\n• Enhancement — upscale, sharpen, denoise, stabilise footage\n\nClick any tool to open it in a full modal with prompt fields and AI output.",
    followUps: ["Tell me about Image Tools", "What VFX tools are available?", "How do Enhancement tools work?"],
  },
  {
    keywords: ["storyboard", "shot", "plan", "sequence", "page 12"],
    answer: "The Storyboard is on Page 12. Build a complete shot-by-shot visual plan:\n\n• Assign clips or generated images to storyboard cells\n• Add shot type, camera angle, and production notes to each cell\n• Drag to reorder shots and restructure your sequence\n• Hit POPULATE TIMELINE FROM STORYBOARD to auto-arrange everything in the Timeline Editor\n\nThis is the professional pre-production step before committing to your final edit.",
    followUps: ["Tell me about the Timeline Editor", "How does the Video Generator work?", "What is the Asset Manager?"],
  },
  {
    keywords: ["timeline", "edit", "track", "assemble", "sync", "page 13"],
    answer: "The Timeline Editor is on Page 13. It has four dedicated tracks:\n\n• VIDEO — your generated and uploaded clips\n• VOICE — narration from the Voice Engine\n• MUSIC — background scores and soundtracks\n• EFFECTS — ambient sound and audio effects\n\nHit SYNC ALL TRACKS to auto-populate from your Media Library. Set your film duration (1–180 minutes). Once your timeline is locked, proceed to Page 16 to render.",
    followUps: ["How does the Render Engine work?", "Tell me about the Audio Mixer", "How do I export my film?"],
  },
  {
    keywords: ["colour", "color", "grade", "lut", "tone", "temperature", "page 14"],
    answer: "Colour Grade is on Page 14. Professional tools include:\n\n• LUT presets — Cinematic Teal & Orange, Film Noir, Golden Hour, Arctic Blue, and more\n• Manual tone, contrast, and colour temperature adjustment\n• Apply grading to the entire timeline or individual clips\n• Preview before committing to any grade\n\nRecommended starting grade for documentary: Cinematic Teal & Orange with slight desaturation.",
    followUps: ["Tell me about the Audio Mixer", "How does the Render Engine work?", "What export formats are available?"],
  },
  {
    keywords: ["audio", "mixer", "mix", "volume", "efx", "sound", "page 15"],
    answer: "The Audio Mixer is on Page 15 with professional mix presets:\n\n• Documentary mix — VOICE 85, MUSIC 40, EFX 50, MASTER 85\n• Music video mix — MUSIC 75, VOICE 60, EFX 40, MASTER 85\n• Custom — set each fader independently\n\nSave your mix as a preset for future projects. The final mix is baked into your rendered output on Page 16.",
    followUps: ["How does the Render Engine work?", "Tell me about Colour Grade", "How do I export?"],
  },
  {
    keywords: ["render", "rendering", "quality", "1080", "4k", "8k", "vp9", "codec", "page 16"],
    answer: "The Render Engine is on Page 16. Quality options by plan:\n\n• Creator — 1080p HD\n• Pro — 4K Ultra HD\n• Studio — 8K Cinema (films up to 3 hours)\n\nVP9 codec delivers superior quality at smaller file sizes versus H.264. The engine automatically detects and re-generates any missing clips before final render. Hit START RENDER when your timeline is locked and your mix is approved.",
    followUps: ["How do I export and distribute?", "Tell me about the Timeline", "What plan do I need for 4K?"],
  },
  {
    keywords: ["export", "distribute", "share", "youtube", "tiktok", "instagram", "facebook", "vimeo", "whatsapp", "download", "page 18"],
    answer: "Export & Distribute is on Page 18. After rendering you can:\n\n• Download the completed film file directly\n• Share one-click to YouTube, TikTok, Instagram, Facebook, LinkedIn, Vimeo, and WhatsApp\n• All social shares are formatted for each platform's optimal specs\n\nYour rendered film is also saved to your project history for re-download at any time.",
    followUps: ["Tell me about the Render Engine", "How does the Timeline work?", "Tell me about pricing plans"],
  },
  {
    keywords: ["upload", "media", "library", "asset", "file", "page 11"],
    answer: "The Asset Manager is on Page 11. It is your central media library:\n\n• Upload via drag-and-drop or the UPLOAD FILES button\n• Supported formats: MP4, MOV, WebM (video) · JPG, PNG, WebP (image) · MP3, WAV (audio) · PDF\n• Preview any asset inline\n• Rename, organise, and delete as needed\n• All generated clips from Page 8 are auto-saved here\n\nAssets from the library can be pulled directly into the Storyboard and Timeline.",
    followUps: ["Tell me about the Storyboard", "How does the Timeline work?", "How does the Video Generator save clips?"],
  },
  {
    keywords: ["tutorial", "learn", "guide", "how to", "lesson", "page 19"],
    answer: "Tutorials are on Page 19 — 12 step-by-step production lessons covering every part of the platform. Click any tutorial to expand and watch inline. Each includes expert pro tips for that specific workflow stage. The complete platform guide is also available on Page 23.",
    followUps: ["Tell me about the full platform workflow", "How do I get started?", "Where is the How-To Guide?"],
  },
  {
    keywords: ["save", "project", "history", "restore", "load", "my projects"],
    answer: "Hit SAVE PROJECT in the footer from any page to save your entire session — timeline, media library, settings, and current page. MY PROJECTS restores your work exactly where you left off, including your timeline arrangement and all uploaded assets. Projects are stored securely to your account.",
    followUps: ["How do I get started?", "Tell me about the Timeline", "Tell me about Asset Manager"],
  },
  {
    keywords: ["mission", "about", "amanda", "manda", "founder", "humanity", "bullying", "children", "social skills", "etsy", "causes", "donate"],
    answer: "MandaStrong Studio was founded by Amanda Woolley with a clear mission: technology should serve humanity, and art should serve truth.\n\nWe stand for three causes:\n\n• Humanity First — storytelling as a force for connection and compassion\n• Advocate Against Bullying — every child deserves safety and confidence\n• Social Skills in Children — empathy and communication are lifelong tools\n\nEvery purchase from MandaStrong1.Etsy.com is donated directly to these causes. Visit Page 23 to read the full mission statement.",
    followUps: ["How do I visit the Etsy store?", "Tell me about the platform", "How do I get started?"],
  },
  {
    keywords: ["etsy", "store", "shop", "buy", "purchase", "donate", "manda1"],
    answer: "Manda's Etsy store is at MandaStrong1.Etsy.com. Every single purchase — 100% of proceeds — is donated directly to causes that support humanity, advocate against bullying, and build social skills in children. Your purchase is not just a product. It is a contribution to a better world.",
    followUps: ["Tell me about our mission", "How do I get started on the platform?"],
  },
  {
    keywords: ["page 1", "home", "dashboard", "enter studio"],
    answer: "Page 1 is your home base. Hit ENTER STUDIO to begin. The dashboard gives you a quick overview of your recent work and fast access to all major tools. Returning users are taken straight back to their last active project.",
    followUps: ["How do I get started?", "Tell me about Quick Access (Page 2)", "What tools are on Page 3?"],
  },
  {
    keywords: ["preview", "watch", "playback", "review", "page 17"],
    answer: "Page 17 is the full film preview — watch your rendered film before final export. Review chapters, check audio sync, and approve your cut. If anything needs adjustment, return to the Timeline (Page 13) or Audio Mixer (Page 15) before re-rendering.",
    followUps: ["How do I export my film?", "Tell me about the Audio Mixer", "How does re-rendering work?"],
  },
  {
    keywords: ["workflow", "documentary", "short film", "production", "pipeline"],
    answer: "Recommended production workflows:\n\nDocumentary:\nPage 8 (scenes) → Page 6 (James narration) → Page 13 (timeline) → Page 15 (audio mix) → Page 16 (render) → Page 18 (export)\n\nShort Film:\nPage 5 (script) → Page 8 (scenes) → Page 6 (voice) → Page 13 (timeline) → Page 16 (render) → Page 18 (export)\n\nMusic Video:\nPage 6 → Music Video Studio → 4 steps → generate → download and share",
    followUps: ["Tell me about the Voice Engine", "How does the Timeline work?", "Tell me about Page 8"],
  },
];

const SUGGESTIONS = [
  "How do I get started?",
  "Tell me about pricing",
  "How does the Voice Engine work?",
  "What tools are available?",
  "How does the timeline work?",
  "Tell me about the mission",
];

function getResponse(input: string): { answer: string; followUps: string[] } {
  const lower = input.toLowerCase();
  let best: QA | null = null;
  let bestScore = 0;

  for (const qa of KB) {
    let score = 0;
    for (const kw of qa.keywords) {
      if (lower.includes(kw)) score += kw.length > 4 ? 3 : 1;
    }
    if (score > bestScore) { bestScore = score; best = qa; }
  }

  if (best && bestScore > 0) {
    return { answer: best.answer, followUps: best.followUps || [] };
  }

  return {
    answer: "I am here to assist with any aspect of MandaStrong Studio — tools, workflow, voice settings, timeline, render quality, export, pricing, or our mission. Could you rephrase your question or choose one of the options below?",
    followUps: ["How do I get started?", "Tell me about pricing", "What tools are available?"],
  };
}

interface GrokChatProps {
  onNavigate?: (page: number) => void;
}

export default function GrokChat({ onNavigate }: GrokChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; followUps?: string[] }>>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bot.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setInput('');
    setMessages(prev => [...prev, { text: text.trim(), isUser: true }]);
    setTyping(true);
    const delay = 500 + Math.min(text.length * 12, 900);
    setTimeout(() => {
      const { answer, followUps } = getResponse(text.trim());
      setTyping(false);
      setMessages(prev => [...prev, { text: answer, isUser: false, followUps }]);
    }, delay);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        aria-label="Agent Grok"
        style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 9000,
          width: 56, height: 56,
          background: isOpen ? '#0a0800' : `linear-gradient(135deg,${GOLDDIM},${GOLD})`,
          border: `2px solid ${GOLD}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isOpen ? 'none' : `0 0 28px ${GOLD}55`,
          transition: 'all .2s',
          borderRadius: 0,
        }}
      >
        {isOpen
          ? <X size={20} color={GOLD} />
          : <span style={{ fontFamily: "'Cinzel',serif", fontSize: 22, fontWeight: 900, color: '#000', lineHeight: 1 }}>G</span>
        }
      </button>

      {/* Unread badge when closed and has messages */}
      {!isOpen && messages.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 68, left: 58, zIndex: 9001,
          background: GREEN, borderRadius: '50%', width: 16, height: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 900, color: '#000',
        }}>
          {messages.filter(m => !m.isUser).length}
        </div>
      )}

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 8990, backdropFilter: 'blur(2px)' }}
          />

          {/* Chat panel */}
          <div style={{
            position: 'fixed', bottom: 92, left: 24, zIndex: 9000,
            width: 'min(420px, calc(100vw - 48px))',
            maxHeight: 580,
            background: '#050500',
            border: `2px solid ${GOLD}`,
            display: 'flex', flexDirection: 'column',
            fontFamily: "'Rajdhani',sans-serif",
            boxShadow: `0 8px 60px ${GOLD}22, 0 2px 20px rgba(0,0,0,.8)`,
          }}>

            {/* Header */}
            <div style={{
              background: `linear-gradient(135deg,#0d0a00,#0a0800)`,
              borderBottom: `1px solid ${GOLDDIM}66`,
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36,
                background: `linear-gradient(135deg,${GOLDDIM},${GOLD})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: `0 0 12px ${GOLD}44`,
              }}>
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 17, fontWeight: 900, color: '#000' }}>G</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: GOLD, fontWeight: 900, fontSize: 14, letterSpacing: 3 }}>AGENT GROK</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                  <span style={{ color: GREEN, fontSize: 9, fontWeight: 900, letterSpacing: 2 }}>ONLINE · MANDASTRONG STUDIO ASSISTANT</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', opacity: .6, transition: 'opacity .15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '.6')}>
                <X size={16} color={GOLD} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 6px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 260 }}>

              {/* Welcome */}
              {messages.length === 0 && (
                <div style={{ background: '#0a0800', border: `1px solid ${GOLDDIM}55`, padding: '14px 16px' }}>
                  <div style={{ color: GREEN, fontSize: 10, fontWeight: 900, letterSpacing: 2, marginBottom: 8 }}>AGENT GROK · STUDIO ASSISTANT</div>
                  <p style={{ color: WHITE, fontSize: 13, lineHeight: 1.75, margin: '0 0 14px' }}>
                    Good day. I have complete knowledge of every tool, workflow, and feature across all 23 pages of MandaStrong Studio. Ask me anything.
                  </p>
                  <div style={{ color: DIM, fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>QUICK START</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => sendMessage(s)} style={{
                        background: 'transparent', border: `1px solid ${GOLDDIM}55`, color: WHITE,
                        padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                        fontFamily: "'Rajdhani',sans-serif", letterSpacing: 1,
                        transition: 'border-color .15s, color .15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = GOLDDIM + '55'; e.currentTarget.style.color = WHITE; }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message history */}
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isUser ? 'flex-end' : 'flex-start', gap: 6 }}>
                  <div style={{
                    background: msg.isUser ? `linear-gradient(135deg,${GOLDDIM}22,${GOLD}11)` : '#0a0800',
                    border: `1px solid ${msg.isUser ? GOLDDIM + '88' : GOLDDIM + '44'}`,
                    padding: '11px 14px',
                    maxWidth: '90%',
                  }}>
                    <div style={{ color: msg.isUser ? GOLD : GREEN, fontSize: 9, fontWeight: 900, letterSpacing: 2, marginBottom: 6 }}>
                      {msg.isUser ? 'YOU' : 'AGENT GROK'}
                    </div>
                    <p style={{ color: WHITE, fontSize: 13, lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>{msg.text}</p>
                  </div>
                  {/* Follow-up suggestions */}
                  {!msg.isUser && msg.followUps && msg.followUps.length > 0 && i === messages.length - 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignSelf: 'stretch' }}>
                      {msg.followUps.map(f => (
                        <button key={f} onClick={() => sendMessage(f)} style={{
                          background: 'transparent', border: `1px solid ${GOLDDIM}33`,
                          color: DIM, padding: '5px 10px', cursor: 'pointer',
                          fontSize: 11, fontWeight: 700, fontFamily: "'Rajdhani',sans-serif",
                          letterSpacing: 1, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
                          transition: 'border-color .15s, color .15s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = GOLDDIM; e.currentTarget.style.color = WHITE; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = GOLDDIM + '33'; e.currentTarget.style.color = DIM; }}>
                          <ChevronRight size={10} />
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div style={{ background: '#0a0800', border: `1px solid ${GOLDDIM}44`, padding: '11px 16px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: 900, letterSpacing: 2 }}>AGENT GROK</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(d => (
                      <div key={d} style={{
                        width: 5, height: 5, borderRadius: '50%', background: GOLD,
                        animation: `pulse 1.2s ease-in-out ${d * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bot} />
            </div>

            {/* Input */}
            <div style={{ borderTop: `1px solid ${GOLDDIM}55`, padding: '10px 12px', display: 'flex', gap: 8, background: '#070600' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about any tool, workflow, or feature..."
                disabled={typing}
                style={{
                  flex: 1, padding: '10px 13px', background: '#0a0800',
                  border: `1px solid ${GOLDDIM}66`, color: WHITE, fontSize: 13,
                  outline: 'none', fontFamily: "'Rajdhani',sans-serif",
                  transition: 'border-color .15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                onBlur={e => (e.currentTarget.style.borderColor = GOLDDIM + '66')}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || typing}
                style={{
                  background: input.trim() && !typing ? `linear-gradient(135deg,${GOLDDIM},${GOLD})` : '#0a0800',
                  border: `1px solid ${input.trim() && !typing ? GOLD : GOLDDIM + '44'}`,
                  color: input.trim() && !typing ? '#000' : GOLDDIM,
                  padding: '0 15px', cursor: input.trim() && !typing ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', transition: 'all .15s',
                  boxShadow: input.trim() && !typing ? `0 0 12px ${GOLD}33` : 'none',
                }}
              >
                <Send size={15} />
              </button>
            </div>

            {/* Footer */}
            <div style={{ padding: '6px 14px 8px', borderTop: `1px solid ${GOLDDIM}22`, textAlign: 'center' }}>
              <span style={{ color: DIM, fontSize: 9, letterSpacing: 2, fontWeight: 700 }}>MANDASTRONG STUDIO · ALL 23 PAGES · FULL KNOWLEDGE BASE</span>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: .3; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </>
  );
}
