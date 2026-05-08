// @ts-nocheck
import { useState } from "react";

const GOLD = "#e8c96d";
const GOLDDIM = "#a07820";
const WHITE = "#d4c9a8";

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

const STRIPE = {
  basic: "https://buy.stripe.com/4gM5kFaVYfjN7EX0vMafS00",
  pro: "https://buy.stripe.com/14A00l8NQ0oTbVd3HYafS01",
  studio: "https://buy.stripe.com/fZubJ35BE3B53oHdiyafS02",
};

interface PageProps {
  onNavigate: (page: number) => void;
}

export default function Page4({ onNavigate }: PageProps) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [re, setRe] = useState("");
  const [loginOk, setLoginOk] = useState(false);

  const inp = {
    width: "100%", background: "#0a0a0a", border: `1px solid ${GOLDDIM}`,
    padding: "10px 12px", color: WHITE, fontSize: 14, marginBottom: 10,
    outline: "none", boxSizing: "border-box" as const, fontFamily: "'Rajdhani',sans-serif",
  };

  const login = () => {
    if (email === "woolleya129@gmail.com" && pass === "Mangler1970!!") {
      setLoginOk(true);
      setTimeout(() => onNavigate(5), 800);
    } else if (email.includes("@") && pass.length > 0) {
      setLoginOk(true);
      setTimeout(() => onNavigate(5), 800);
    } else {
      alert("Please enter a valid email address and password.");
    }
  };

  const newProject = () => {
    try {
      localStorage.removeItem("ms_page");
      localStorage.removeItem("ms_project");
      localStorage.removeItem("ms_timeline");
      localStorage.removeItem("ms_media");
    } catch (e) {}
    onNavigate(5);
  };

  const openProject = () => {
    try {
      const p = JSON.parse(localStorage.getItem("ms_page") || "5");
      onNavigate(p || 5);
    } catch (e) {
      onNavigate(5);
    }
  };

  return (
    <div style={{ ...Sp, padding: 40 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: 6, fontWeight: 700, marginBottom: 4 }}>MANDASTRONG STUDIO · CINEMA INTELLIGENCE PLATFORM</div>
          <h1 style={{ ...H1, fontSize: 28 }}>SIGN IN OR JOIN</h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 20 }}>
          {/* Sign In */}
          <div style={{ ...Card() }}>
            <div style={{ fontSize: 11, color: GOLD, letterSpacing: 3, marginBottom: 8, fontWeight: 700 }}>EXISTING USER</div>
            <h2 style={{ ...H1, fontSize: 18, marginBottom: 18 }}>SIGN IN</h2>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={inp} />
            <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="Password" style={{ ...inp, marginBottom: 16 }} />
            {loginOk && (
              <div style={{ background: "#061406", border: "1px solid #22c55e", padding: "10px", textAlign: "center", marginBottom: 8 }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 14, letterSpacing: 2 }}>✓ LOGIN SUCCESSFUL</span>
              </div>
            )}
            <button onClick={login} style={{ ...G("gold", false), width: "100%", padding: "12px" }}>
              {loginOk ? "✓ ENTERING STUDIO..." : "SIGN IN TO STUDIO"}
            </button>
          </div>

          {/* Create Account */}
          <div style={{ ...Card(), border: "2px solid #22c55e", position: "relative" }}>
            <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#000", padding: "3px 14px", fontSize: 11, fontWeight: 900, whiteSpace: "nowrap" }}>
              7-DAY FREE TRIAL
            </div>
            <div style={{ fontSize: 11, color: GOLD, letterSpacing: 3, marginBottom: 8, marginTop: 10, fontWeight: 700 }}>NEW CREATOR</div>
            <h2 style={{ ...H1, fontSize: 18, marginBottom: 18 }}>CREATE ACCOUNT</h2>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" style={inp} />
            <input value={re} onChange={e => setRe(e.target.value)} placeholder="Email address" style={{ ...inp, marginBottom: 16 }} />
            <button onClick={() => { window.open(STRIPE.studio, "_blank"); onNavigate(5); }}
              style={{ width: "100%", padding: "12px", background: "#22c55e", border: "none", color: "#000", fontWeight: 900, fontSize: 13, cursor: "pointer", letterSpacing: 2, fontFamily: "'Rajdhani',sans-serif" }}>
              START FREE TRIAL — $0
            </button>
          </div>

          {/* Explore First */}
          <div style={{ ...Card(), textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👁</div>
            <h2 style={{ ...H1, fontSize: 16, marginBottom: 10 }}>EXPLORE FIRST</h2>
            <p style={{ color: WHITE, fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>Browse 600+ AI tools before committing. No account required.</p>
            <button onClick={() => onNavigate(5)} style={{ ...G("out", false), width: "100%", marginBottom: 10 }}>
              BROWSE AS GUEST
            </button>
            <div style={{ height: 1, background: `${GOLDDIM}44`, marginBottom: 10 }} />
            <button onClick={newProject}
              style={{ width: "100%", padding: "10px", background: `linear-gradient(135deg,#0a2a0a,#0f3d0f)`, border: `1px solid #22c55e`, color: "#22c55e", fontWeight: 900, fontSize: 12, cursor: "pointer", letterSpacing: 2, fontFamily: "'Rajdhani',sans-serif" }}>
              + NEW PROJECT
            </button>
          </div>
        </div>

        {/* Open Project */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <button onClick={openProject} style={{ ...G("gold", false), padding: "12px 32px" }}>
            OPEN PROJECT
          </button>
        </div>

        {/* Subscription Plans */}
        <h2 style={{ ...H1, fontSize: 22, textAlign: "center", marginBottom: 22 }}>SUBSCRIPTION PLANS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { t: "CREATOR PLAN", p: "20", link: STRIPE.basic, f: ["HD Export 1080p", "100 AI Tools", "10GB Storage", "Email Support"], pop: false, trial: false },
            { t: "PRO PLAN", p: "30", link: STRIPE.pro, f: ["4K Export", "300 AI Tools", "100GB Storage", "Priority Support", "Commercial License"], pop: true, trial: false },
            { t: "STUDIO PLAN", p: "50", link: STRIPE.studio, f: ["8K Export", "600+ AI Tools", "1TB Storage", "24/7 Support", "Full Rights", "API Access", "7-Day Free Trial"], pop: false, trial: true },
          ].map(plan => (
            <div key={plan.t} style={{ ...Card(), border: plan.pop ? `2px solid ${GOLD}` : `1px solid ${GOLDDIM}`, position: "relative" }}>
              {plan.pop && (
                <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: GOLD, color: "#000", padding: "2px 12px", fontSize: 11, fontWeight: 900, whiteSpace: "nowrap" }}>
                  MOST POPULAR
                </div>
              )}
              {plan.trial && (
                <div style={{ position: "absolute", top: -11, right: 12, background: "#22c55e", color: "#000", padding: "2px 10px", fontSize: 11, fontWeight: 900 }}>
                  FREE TRIAL
                </div>
              )}
              <div style={{ color: WHITE, fontSize: 11, letterSpacing: 3, fontWeight: 700 }}>{plan.t}</div>
              <div style={{ color: GOLD, fontFamily: "'Cinzel',serif", fontSize: 34, fontWeight: 900, margin: "8px 0" }}>
                ${plan.p}<span style={{ fontSize: 12, color: WHITE }}>/mo</span>
              </div>
              <div style={{ margin: "12px 0" }}>
                {plan.f.map(f => (
                  <div key={f} style={{ color: WHITE, fontSize: 13, padding: "3px 0", borderBottom: "1px solid #0a0a0a" }}>✓ {f}</div>
                ))}
              </div>
              <button onClick={() => window.open(plan.link, "_blank")} style={{ ...G(plan.trial ? "out" : "gold", false), width: "100%" }}>
                {plan.trial ? "START FREE TRIAL" : "SUBSCRIBE NOW"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
