import { useState, useEffect, useCallback, useMemo, useRef, useContext } from "react";
import { AuthContext } from "./auth-context";
import { AnalyticsPage } from "./analytics-page";

// ============================================================
// MARE CALMO — App di supporto all'ansia da prestazione
// ============================================================

const themes = {
  notte: {
    name: "notte", bgPrimary: "#1A2E3E", bgSecondary: "#2A3E52",
    bgGradientTop: "#3A5A7E", bgGradientBottom: "#1A2E3E",
    seaDeep: "#2A4A6E", seaMid: "#4A7A9E", seaLight: "#6A9ABE",
    sand: "#E8D4B8", palm: "#7AB87A", rock: "#8A9AAA",
    accentSoft: "#E8A88A", accentGlow: "#F0B8A0",
    textPrimary: "#F5F7FF", textSecondary: "#D8E5FF", textMuted: "#A8C0E8",
    cardBg: "#1F3345", cardBorder: "rgba(255,255,255,0.1)",
    cardShadow: "0 8px 24px rgba(0,0,0,0.4)", particleColor: "rgba(150,180,255,0.15)",
  },
  alba: {
    name: "alba", bgPrimary: "#F8F5F0", bgSecondary: "#EEE8E0",
    bgGradientTop: "#D8E8F0", bgGradientBottom: "#F8F5F0",
    seaDeep: "#4A7A98", seaMid: "#6A9ABB", seaLight: "#8ABBDD",
    sand: "#E0D0B8", palm: "#7AA878", rock: "#8A9AAA",
    accentSoft: "#D89070", accentGlow: "#E8A888",
    textPrimary: "#2A3040", textSecondary: "#4A5A70", textMuted: "#7A8A9A",
    cardBg: "#FFFEF8", cardBorder: "rgba(0,0,0,0.08)",
    cardShadow: "0 6px 20px rgba(0,0,0,0.06)", particleColor: "rgba(150,150,150,0.08)",
  },
};

const EVENT_WEIGHTS = { check_in: 0.02, micro_action: 0.05, reflection: 0.01 };
const EMA_ALPHA = 0.3;
function ema(prev, curr, alpha = EMA_ALPHA) { return alpha * curr + (1 - alpha) * prev; }
function discretizeVisual(g) {
  if (g < 0.2) return "small"; if (g < 0.4) return "medium";
  if (g < 0.6) return "grown"; if (g < 0.8) return "large"; return "adult";
}
function discretizeSea(s) {
  if (s < 0.3) return { label: "neutro", light: 0.4, waveSpeed: 0.5, particles: false };
  if (s < 0.5) return { label: "luminoso", light: 0.55, waveSpeed: 0.4, particles: false };
  if (s < 0.7) return { label: "calmo", light: 0.7, waveSpeed: 0.3, particles: true };
  if (s < 0.85) return { label: "molto calmo", light: 0.85, waveSpeed: 0.2, particles: true };
  return { label: "armonioso", light: 1.0, waveSpeed: 0.15, particles: true };
}

const copingStrategies = [
  { trigger: "high_anxiety", title: "Respirazione 4-4-4", description: "Inspira per 4 secondi, trattieni per 4, espira per 4. Ripeti 3 volte.", source: "Ma et al., 2017" },
  { trigger: "high_anxiety", title: "Grounding 5-4-3-2-1", description: "Nota 5 cose che vedi, 4 che tocchi, 3 che senti, 2 che odori, 1 che gusti.", source: "Bhandari, 2019" },
  { trigger: "low_energy", title: "Micro-movimento", description: "Alzati, fai 5 respiri profondi e stira le braccia verso l'alto per 30 secondi.", source: "Ratey, 2008" },
  { trigger: "low_energy", title: "Compassione verso te stesso", description: "Scrivi una cosa che ti diresti se fossi il tuo migliore amico.", source: "Neff, 2003" },
  { trigger: "neutral", title: "Micro-riflessione", description: "Cosa ti ha dato energia oggi? Anche una cosa piccolissima conta.", source: "Fredrickson, 2001" },
];
const empatheticMessages = {
  high: ["Quello che senti è reale, ed è umano. L'ansia da prestazione non definisce chi sei.", "Sentire pressione non significa essere deboli. Stai affrontando qualcosa di impegnativo.", "È normale sentirsi così. Il fatto che tu sia qui a riconoscerlo è già un passo importante."],
  medium: ["Oggi c'è un po' di agitazione, ed è comprensibile. Non devi fare nulla di straordinario.", "Anche nei giorni medi, prenderti un momento per te ha valore.", "Non serve che ogni giorno sia perfetto. Stai andando bene."],
  low: ["Oggi sembra un giorno più tranquillo. Goditelo, te lo meriti.", "La calma è movimento. Stai facendo il tuo percorso.", "Che bello avere un momento di pace. Resta qui quanto vuoi."],
};
const reflectionPrompts = [
  "Cosa diresti a un amico che si sente come te oggi?",
  "C'è qualcosa di piccolo che puoi fare per te stesso in questo momento?",
  "Cosa ti ha dato energia questa settimana, anche solo per un attimo?",
  "Se l'ansia potesse parlarti, cosa ti direbbe? E cosa le risponderesti?",
  "Qual è una cosa che hai fatto bene di recente, anche se piccola?",
  "Come ti sentiresti se ti concedessi di non essere perfetto oggi?",
];

// ============================================================
// IMPROVED FISH SVG — 3 variants with gradients
// ============================================================
function FishBody({ color, accent, variant, id }) {
  if (variant === 1) {
    return (
      <g>
        <defs>
          <radialGradient id={`fg-${id}`} cx="40%" cy="35%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
            <stop offset="100%" stopColor={color} stopOpacity="0.9" />
          </radialGradient>
        </defs>
        {/* Round tropical */}
        <ellipse cx="0" cy="0" rx="16" ry="14" fill={`url(#fg-${id})`} />
        <path d="M-16,-1 Q-27,-10 -24,0 Q-27,10 -16,1" fill={color} opacity="0.8" />
        <path d="M5,-13 Q9,-19 3,-14" fill={color} opacity="0.5" />
        <path d="M-3,13 Q-7,19 -1,14" fill={color} opacity="0.4" />
        <ellipse cx="7" cy="-3" rx="4" ry="4" fill="rgba(255,255,255,0.88)" />
        <circle cx="8.2" cy="-3.2" r="2.2" fill="#1a1a2e" />
        <circle cx="9" cy="-4" r="0.7" fill="rgba(255,255,255,0.8)" />
        <path d="M-8,1 Q-3,4 2,1" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.7" />
        <path d="M-6,4 Q-1,6.5 4,4" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      </g>
    );
  }
  if (variant === 2) {
    return (
      <g>
        <defs>
          <linearGradient id={`fg-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.75" />
            <stop offset="50%" stopColor={accent} stopOpacity="0.95" />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {/* Slim elegant */}
        <path d="M-24,0 Q-12,-12 8,-9 Q20,-5 24,0 Q20,5 8,9 Q-12,12 -24,0 Z" fill={`url(#fg-${id})`} />
        <path d="M-24,0 Q-35,-9 -32,0 Q-35,9 -24,0" fill={color} opacity="0.7" />
        <path d="M10,-9 Q16,-16 12,-8" fill={color} opacity="0.4" />
        <ellipse cx="14" cy="-2" rx="3.5" ry="3.2" fill="rgba(255,255,255,0.88)" />
        <circle cx="15" cy="-2.3" r="1.8" fill="#1a1a2e" />
        <circle cx="15.6" cy="-3" r="0.5" fill="rgba(255,255,255,0.7)" />
        <path d="M-12,0 Q-5,3 2,0" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
      </g>
    );
  }
  // Default — chubby cute
  return (
    <g>
      <defs>
        <radialGradient id={`fg-${id}`} cx="55%" cy="40%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="0" rx="22" ry="12" fill={`url(#fg-${id})`} />
      <path d="M-22,0 Q-34,-10 -30,0 Q-34,10 -22,0" fill={color} opacity="0.8" />
      <path d="M7,-11 Q12,-18 6,-12" fill={color} opacity="0.45" />
      <path d="M-1,11 Q-6,17 0,12" fill={color} opacity="0.35" />
      <ellipse cx="11" cy="-3" rx="4.2" ry="4.2" fill="rgba(255,255,255,0.9)" />
      <circle cx="12.2" cy="-3.2" r="2.3" fill="#1a1a2e" />
      <circle cx="13" cy="-4" r="0.8" fill="rgba(255,255,255,0.75)" />
      <path d="M-13,1.5 Q-6,5 1,1.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
      <path d="M-11,4.5 Q-4,7.5 3,4.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
    </g>
  );
}

// Animated fish wrapper: positions using SVG x/y attributes (not CSS transform)
// so the swim animation doesn't conflict with positioning
function SwimmingFish({ startX, startY, color, accent, size, variant, duration, distance, flipX, delay, id }) {
  const animId = `swim-${id}`;
  const d = distance || 50;
  const dur = duration || 16;
  const yWobble = 6 + (variant || 0) * 2;
  const scaleX = flipX ? -size : size;
  const scaleY = size;

  return (
    <>
      <style>{`
        @keyframes ${animId} {
          0%   { transform: translate(${startX}px, ${startY}px) scale(${scaleX}, ${scaleY}); }
          20%  { transform: translate(${startX + d * 0.35}px, ${startY - yWobble}px) scale(${scaleX}, ${scaleY}); }
          50%  { transform: translate(${startX + d}px, ${startY + yWobble * 0.4}px) scale(${scaleX}, ${scaleY}); }
          80%  { transform: translate(${startX + d * 0.6}px, ${startY + yWobble * 0.7}px) scale(${scaleX}, ${scaleY}); }
          100% { transform: translate(${startX}px, ${startY}px) scale(${scaleX}, ${scaleY}); }
        }
      `}</style>
      <g style={{
        animation: `${animId} ${dur}s ease-in-out ${delay || 0}s infinite backwards`,
        willChange: "transform",
      }}>
        <FishBody color={color} accent={accent} variant={variant} id={id} />
      </g>
    </>
  );
}

function Bubbles({ count, theme }) {
  const bubbles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      cx: 30 + Math.random() * 340,
      delay: Math.random() * 12,
      dur: 7 + Math.random() * 9,
      r: 1.2 + Math.random() * 2.5,
    })), [count]);
  return <>
    {bubbles.map((b, i) => (
      <circle key={i} cx={b.cx} r={b.r}
        fill={theme.particleColor} stroke={theme.particleColor} strokeWidth="0.3"
        style={{ animation: `bubbleRise ${b.dur}s ease-in ${b.delay}s infinite` }} />
    ))}
  </>;
}

function Seaweed({ x, color, h }) {
  const height = h || 150;
  return (
    <g>
      <path d={`M${x},400 Q${x + 12},${400 - height * 0.35} ${x},${400 - height * 0.6} Q${x - 10},${400 - height * 0.82} ${x + 3},${400 - height}`}
        fill="none" stroke={color} strokeWidth="4.5" strokeLinecap="round" opacity="0.4"
        style={{ animation: "seaweedSway 7s ease-in-out infinite", transformOrigin: `${x}px 400px` }} />
      <path d={`M${x + 9},400 Q${x + 19},${400 - height * 0.28} ${x + 9},${400 - height * 0.52} Q${x + 1},${400 - height * 0.72} ${x + 11},${400 - height * 0.85}`}
        fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.25"
        style={{ animation: "seaweedSway 8.5s ease-in-out 0.7s infinite", transformOrigin: `${x + 9}px 400px` }} />
      <ellipse cx={x + 2} cy={400 - height * 0.5} rx="5" ry="2.5" fill={color} opacity="0.18"
        transform={`rotate(-20 ${x + 2} ${400 - height * 0.5})`} />
    </g>
  );
}

// ============================================================
// ISLAND SVG
// ============================================================
function IslandSVG({ theme, lanternGlow, dayCount }) {
  const hasPlant = dayCount >= 3;
  const hasBench = dayCount >= 7;
  return (
    <svg viewBox="0 0 400 360" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", maxWidth: "55vw", height: "auto", display: "block", margin: "0 auto" }}>
      <defs>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
        </filter>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>
      <ellipse cx="200" cy="290" rx="210" ry="26" fill={theme.seaLight} opacity="0.25" filter="url(#softGlow)" />
      <ellipse cx="200" cy="287" rx="185" ry="20" fill={theme.seaMid} opacity="0.15" />
      {/* Gentle ripples */}
      <path d="M70,290 Q120,283 170,290 Q220,297 270,290 Q320,285 350,290" fill="none" stroke={theme.seaLight} strokeWidth="1.5" opacity="0.12" filter="url(#softGlow)" />
      <path d="M90,298 Q150,292 210,298 Q270,305 330,298" fill="none" stroke={theme.seaLight} strokeWidth="1" opacity="0.08" filter="url(#softGlow)" />
      <path d="M60,305 Q130,300 200,305 Q270,310 340,305" fill="none" stroke={theme.seaLight} strokeWidth="0.6" opacity="0.08" />

      {/* Main sand — layered for depth, LARGER */}
      <ellipse cx="200" cy="262" rx="170" ry="52" fill={theme.sand} opacity="0.4" />
      <ellipse cx="198" cy="257" rx="162" ry="48" fill={theme.sand} opacity="0.7" />
      <ellipse cx="196" cy="252" rx="154" ry="44" fill={theme.sand} />
      {/* Sand texture — fine lines with more detail */}
      <path d="M110,252 Q150,247 200,252 Q250,257 290,252" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
      <path d="M120,260 Q170,255 220,260 Q270,265 300,260" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
      <path d="M130,268 Q180,265 230,268 Q280,272 320,268" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.4" />
      {/* Sand highlight */}
      <ellipse cx="180" cy="245" rx="85" ry="22" fill="rgba(255,255,255,0.08)" />
      {/* Sand ripples */}
      <path d="M150,270 Q180,268 210,270" fill="none" stroke={theme.seaMid} strokeWidth="0.4" opacity="0.08" />
      <path d="M160,275 Q200,273 240,275" fill="none" stroke={theme.seaMid} strokeWidth="0.3" opacity="0.05" />

      {/* Rocks cluster — larger and more organic */}
      <ellipse cx="105" cy="250" rx="32" ry="22" fill={theme.rock} opacity="0.7" filter="url(#softGlow)" />
      <ellipse cx="114" cy="243" rx="26" ry="16" fill={theme.rock} opacity="0.6" filter="url(#softGlow)" />
      <ellipse cx="98" cy="258" rx="18" ry="12" fill={theme.rock} opacity="0.5" />
      <ellipse cx="132" cy="252" rx="14" ry="10" fill={theme.rock} opacity="0.45" />
      <ellipse cx="125" cy="265" rx="10" ry="7" fill={theme.rock} opacity="0.35" />
      {/* Rock highlights and details */}
      <ellipse cx="112" cy="238" rx="12" ry="6" fill="rgba(255,255,255,0.08)" />
      <ellipse cx="102" cy="258" rx="6" ry="3" fill="rgba(255,255,255,0.05)" />
      <ellipse cx="135" cy="248" rx="5" ry="2" fill="rgba(255,255,255,0.04)" />

      {/* Palm tree — curved trunk with visible bark, LARGER */}
      <path d="M264,256 Q275,200 260,155 Q254,132 262,110" fill="none" stroke="#5C4033" strokeWidth="11" strokeLinecap="round" />
      <path d="M264,256 Q275,200 260,155 Q254,132 262,110" fill="none" stroke="#7B6B5F" strokeWidth="8" strokeLinecap="round" />
      <path d="M264,256 Q275,200 260,155 Q254,132 262,110" fill="none" stroke="#9B8B7F" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      {/* Bark texture more detailed */}
      {[250, 230, 210, 190, 170, 150, 130].map((y, i) => (
        <path key={i} d={`M${259 + (i % 2) * 3},${y} Q${267 + (i % 2)},${y - 3} ${262 - (i % 2) * 2},${y}`}
          fill="none" stroke="#5C4033" strokeWidth="0.9" opacity={0.3 - i * 0.02} />
      ))}

      {/* Palm canopy — lush, layered, ENLARGED */}
      {/* Right leaves - bigger spread */}
      <path d="M260,108 Q298,78 345,100" fill="none" stroke="#596B55" strokeWidth="6" strokeLinecap="round" />
      <path d="M260,108 Q305,65 352,85" fill="none" stroke={theme.palm} strokeWidth="5" strokeLinecap="round" />
      <path d="M260,108 Q290,60 335,75" fill="none" stroke={theme.palm} strokeWidth="4.5" strokeLinecap="round" opacity="0.85" />
      <path d="M260,108 Q280,82 320,95" fill="none" stroke={theme.palm} strokeWidth="3.5" strokeLinecap="round" opacity="0.65" />
      {/* Left leaves - bigger spread */}
      <path d="M260,108 Q222,78 175,100" fill="none" stroke="#596B55" strokeWidth="6" strokeLinecap="round" />
      <path d="M260,108 Q215,65 168,85" fill="none" stroke={theme.palm} strokeWidth="5" strokeLinecap="round" />
      <path d="M260,108 Q230,60 185,75" fill="none" stroke={theme.palm} strokeWidth="4.5" strokeLinecap="round" opacity="0.85" />
      <path d="M260,108 Q240,82 200,95" fill="none" stroke={theme.palm} strokeWidth="3.5" strokeLinecap="round" opacity="0.65" />
      {/* Drooping leaf tips */}
      <path d="M345,100 Q352,108 350,115" fill="none" stroke={theme.palm} strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      <path d="M175,100 Q168,108 170,115" fill="none" stroke={theme.palm} strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      {/* Animated leaves - more leafy */}
      <path d="M260,109 Q295,85 330,98" fill="none" stroke={theme.palm} strokeWidth="3" strokeLinecap="round" opacity="0.45"
        style={{ animation: "leafSway 5s ease-in-out infinite", transformOrigin: "260px 109px" }} />
      <path d="M260,109 Q225,85 190,98" fill="none" stroke={theme.palm} strokeWidth="3" strokeLinecap="round" opacity="0.4"
        style={{ animation: "leafSway 6.5s ease-in-out 1.2s infinite", transformOrigin: "260px 109px" }} />
      {/* Extra animated leaves */}
      <path d="M260,110 Q288,75 325,85" fill="none" stroke={theme.palm} strokeWidth="2.5" strokeLinecap="round" opacity="0.35"
        style={{ animation: "leafSway 7s ease-in-out 0.6s infinite", transformOrigin: "260px 110px" }} />
      <path d="M260,110 Q232,75 195,85" fill="none" stroke={theme.palm} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"
        style={{ animation: "leafSway 7.5s ease-in-out 1.8s infinite", transformOrigin: "260px 110px" }} />
      {/* Coconuts - more and larger */}
      <circle cx="256" cy="120" r="5.5" fill="#6A4520" opacity="0.82" />
      <circle cx="266" cy="117" r="5" fill="#5A3A18" opacity="0.75" />
      <circle cx="261" cy="128" r="4" fill="#7A5428" opacity="0.6" />
      <circle cx="272" cy="124" r="3.5" fill="#6B4A20" opacity="0.5" />

      {/* Lantern post — more detailed and larger */}
      <rect x="168" y="208" width="5.5" height="44" rx="2.5" fill="#6B5545" />
      <rect x="168" y="206" width="5.5" height="5" rx="1.5" fill="#4A3A2A" />
      {/* Lantern body */}
      <rect x="160" y="192" width="21" height="20" rx="6" fill={theme.accentSoft} opacity="0.9" />
      <rect x="163" y="195" width="15" height="14" rx="4" fill={theme.accentGlow} opacity="0.3" />
      {/* Lantern top detail */}
      <path d="M164,192 Q170.5,186 177,192" fill="none" stroke={theme.accentSoft} strokeWidth="1.8" opacity="0.75" />
      <circle cx="170.5" cy="188" r="2" fill={theme.accentSoft} opacity="0.5" />
      {lanternGlow && (
        <>
          <circle cx="170.5" cy="202" r="38" fill={theme.accentGlow} opacity="0.08" style={{ animation: "lanternPulse 4s ease-in-out infinite" }} />
          <circle cx="170.5" cy="202" r="22" fill={theme.accentGlow} opacity="0.18" style={{ animation: "lanternPulse 3s ease-in-out 0.3s infinite" }} />
          <circle cx="170.5" cy="202" r="10" fill={theme.accentGlow} opacity="0.4" style={{ animation: "lanternPulse 2.5s ease-in-out 0.6s infinite" }} />
        </>
      )}

      {/* Shells and starfish - MORE DETAILS and larger */}
      {/* Large seashell */}
      <ellipse cx="235" cy="266" rx="7" ry="4.5" fill="#D4C4B8" opacity="0.65" transform="rotate(-15 235 266)" filter="url(#softGlow)" />
      <path d="M231,266 L237,266 M233,264 L239,268" stroke="#C4B4A0" strokeWidth="0.4" opacity="0.4" />
      {/* Medium shells */}
      <ellipse cx="160" cy="263" rx="5.5" ry="3.5" fill="#C4B4A8" opacity="0.5" transform="rotate(12 160 263)" filter="url(#softGlow)" />
      <ellipse cx="250" cy="261" rx="4" ry="2.5" fill="#B9A898" opacity="0.4" transform="rotate(-8 250 261)" />
      {/* Small shells scattered */}
      <circle cx="220" cy="270" r="1.8" fill="#D4C4B8" opacity="0.35" />
      <ellipse cx="180" cy="268" rx="2" ry="1.2" fill="#C4B4A0" opacity="0.3" transform="rotate(20 180 268)" />
      <circle cx="270" cy="269" r="1.5" fill="#B9A898" opacity="0.25" />
      
      {/* Starfish - larger and more details */}
      <g transform="translate(245,272) rotate(25) scale(0.72)" opacity="0.5" filter="url(#softGlow)">
        <path d="M0,-10 L2.5,-2.5 L10,-2.5 L3.5,2.5 L6,10 L0,5 L-6,10 L-3.5,2.5 L-10,-2.5 L-2.5,-2.5 Z" fill={theme.accentSoft} />
        <circle cx="0" cy="0" r="2" fill="rgba(255,255,255,0.3)" />
      </g>
      {/* Another starfish */}
      <g transform="translate(125,270) rotate(-40) scale(0.55)" opacity="0.35">
        <path d="M0,-8 L2,-2 L8,-2 L3,2 L5,8 L0,4 L-5,8 L-3,2 L-8,-2 L-2,-2 Z" fill={theme.rock} opacity="0.6" />
      </g>
      
      {/* Pebbles - more scattered */}
      <circle cx="195" cy="273" r="2.5" fill={theme.rock} opacity="0.25" />
      <circle cx="215" cy="275" r="1.8" fill={theme.rock} opacity="0.2" />
      <circle cx="180" cy="274" r="1.5" fill={theme.rock} opacity="0.18" />
      <circle cx="260" cy="276" r="1.2" fill={theme.rock} opacity="0.15" />
      <circle cx="145" cy="271" r="2" fill={theme.rock} opacity="0.22" />

      {/* Sand flowers/decorative plants - scattered */}
      <g opacity="0.4">
        <circle cx="155" cy="250" r="1.2" fill="#D9A89A" />
        <circle cx="151" cy="248" r="0.8" fill="#E8B8A8" />
        <circle cx="159" cy="248" r="0.8" fill="#E8B8A8" />
        <circle cx="153" cy="246" r="0.7" fill="#E8B8A8" />
        <circle cx="157" cy="246" r="0.7" fill="#E8B8A8" />
      </g>

      {/* Progressive: small plant (day 3+) */}
      {hasPlant && (
        <g style={{ animation: "fadeSlideIn 1s ease" }}>
          <line x1="140" y1="258" x2="140" y2="232" stroke="#7B9B7F" strokeWidth="2.8" strokeLinecap="round" />
          <ellipse cx="132" cy="232" rx="9" ry="6" fill="#8BAB8F" opacity="0.7" />
          <ellipse cx="148" cy="236" rx="8" ry="5" fill="#7B9B7F" opacity="0.65" />
          <ellipse cx="140" cy="225" rx="7" ry="4.5" fill="#9BBB9F" opacity="0.6" />
          <ellipse cx="145" cy="238" rx="5" ry="3" fill="#8BAB8F" opacity="0.4" />
        </g>
      )}

      {/* Progressive: wooden bench (day 7+) */}
      {hasBench && (
        <g style={{ animation: "fadeSlideIn 1s ease 0.3s both" }} opacity="0.65">
          <rect x="285" y="245" width="36" height="4.5" rx="2" fill="#7B6555" />
          <rect x="289" y="249.5" width="3.5" height="13" rx="1" fill="#6B5545" />
          <rect x="312" y="249.5" width="3.5" height="13" rx="1" fill="#6B5545" />
          {/* Back rest */}
          <rect x="287" y="238" width="32" height="3" rx="1.5" fill="#7B6555" opacity="0.8" />
          <rect x="313" y="238" width="3.5" height="10" rx="1" fill="#6B5545" opacity="0.6" />
          {/* Bench shadow */}
          <ellipse cx="301" cy="263" rx="20" ry="2" fill="rgba(0,0,0,0.12)" />
        </g>
      )}
    </svg>
  );
}


// ============================================================
// PAGES
// ============================================================

function OnboardingPage({ theme, onComplete }) {
  const [step, setStep] = useState(0);
  const steps = [
    { text: "Il mare rappresenta il tuo stato interiore.", sub: "Ogni onda, ogni riflesso racconta qualcosa di te." },
    { text: "Sull'isola puoi fermarti ad ascoltarti.", sub: "Pochi minuti, senza giudizio, senza fretta." },
    { text: "Non ci sono punteggi. Solo osservazione.", sub: "Il tempo conta più dell'intensità." },
  ];
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(180deg, ${theme.bgGradientTop} 0%, ${theme.bgGradientBottom}99 100%)`, padding: 32, transition: "all 0.8s ease", backgroundAttachment: "fixed" }}>
      <div key={step} style={{ animation: "fadeSlideIn 0.8s ease", textAlign: "center", maxWidth: 340 }}>
        <div style={{ fontSize: 48, marginBottom: 32, opacity: 0.6 }}>
          {step === 0 ? "🌊" : step === 1 ? "🏝" : "🐟"}
        </div>
        <h2 style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 22, fontWeight: 600, color: theme.textPrimary, lineHeight: 1.6, marginBottom: 12 }}>
          {steps[step].text}
        </h2>
        <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 15, color: theme.textSecondary, lineHeight: 1.7 }}>
          {steps[step].sub}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 48 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i === step ? theme.accentSoft : theme.textMuted, opacity: i === step ? 1 : 0.3, transition: "all 0.5s ease" }} />
        ))}
      </div>
      <button onClick={() => (step < 2 ? setStep(step + 1) : onComplete())} style={{
        marginTop: 40, padding: "14px 40px", borderRadius: 50, border: "none",
        background: theme.accentSoft, color: "#fff", fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
        fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease",
        boxShadow: `0 4px 20px ${theme.accentSoft}44`,
      }}>
        {step < 2 ? "Avanti" : "Entra nel mare"}
      </button>
    </div>
  );
}

function SeaPage({ theme, fishData, seaState, onGoToIsland, onGoToProgress, onGoToAnalytics }) {
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef(null);
  const [resetToken] = useState(() => Math.random());
  
  const musicURL = theme.name === "notte" 
    ? "/music/ambient night.mp3"
    : "/music/morning vibes.mp3";
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = musicURL;
      if (isPlayingMusic) {
        audioRef.current.play().catch(() => console.log("Riproduzione bloccata"));
      } else {
        audioRef.current.pause();
      }
    }
  }, [theme.name, musicURL, isPlayingMusic]);
  
  const toggleMusic = () => {
    if (isPlayingMusic) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(() => console.log("Riproduzione bloccata"));
    }
    setIsPlayingMusic(!isPlayingMusic);
  };
  
  const seaInfo = discretizeSea(seaState);
  const fishVisuals = useMemo(() => {
    const palette = [
      { body: "#C9968A", accent: "#DEB5A8" },
      { body: "#7B9B99", accent: "#9EB5AF" },
      { body: "#D4B8A4", accent: "#E5D0C2" },
    ];
    return fishData.map((f, i) => {
      const stage = discretizeVisual(f.growth);
      const sMap = { small: 0.7, medium: 0.9, grown: 1.1, large: 1.3, adult: 1.5 };
      return { ...f, i, color: palette[i % 3].body, accent: palette[i % 3].accent, size: sMap[stage], variant: i % 3, stage };
    });
  }, [fishData]);

  return (
    <div style={{
      minHeight: "100vh", position: "relative", overflow: "hidden",
      background: `linear-gradient(180deg, ${theme.bgGradientTop} 0%, ${theme.seaLight} 45%, ${theme.seaMid} 70%, ${theme.seaDeep} 100%)`,
      transition: "all 0.8s ease",
    }}>
      {/* Audio element nascosto */}
      <audio 
        ref={audioRef} 
        loop 
        volume="0.3"
      />

      {/* Title + logo top-left */}
      <div style={{ position: "absolute", top: 12, left: 16, zIndex: 20, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <img src="/images/logo pw.png" alt="Logo" style={{ width: 160, height: 70, marginBottom: 16, filter: theme.name === "alba" ? "brightness(1)" : "brightness(1) drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 0, fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 13, color: theme.name === "alba" ? theme.textPrimary : theme.textSecondary, letterSpacing: 1.5, fontWeight: 500, textShadow: "0 1px 6px rgba(0,0,0,0.3)" }}>
          <span>Respira</span>
          <span style={{ margin: "0 10px", fontSize: 6, opacity: 0.5, lineHeight: 1 }}>●</span>
          <span>Pensa</span>
          <span style={{ margin: "0 10px", fontSize: 6, opacity: 0.5, lineHeight: 1 }}>●</span>
          <span>Ascolta</span>
        </div>
      </div>

      {/* ORIZZONTE button centered + mantra below */}
      <div style={{ position: "absolute", top: 72, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 15 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <button onClick={onGoToProgress} style={{
            background: `${theme.cardBg}33`, border: `1px solid ${theme.textMuted}30`,
            borderRadius: 50, padding: "8px 24px", color: theme.textPrimary,
            fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 13, fontWeight: 500,
            cursor: "pointer", backdropFilter: "blur(12px)", transition: "all 0.3s ease",
            textShadow: "0 1px 6px rgba(0,0,0,0.3)",
          }}>
            Orizzonte
          </button>
          <button onClick={onGoToAnalytics} style={{
            background: `${theme.cardBg}33`, border: `1px solid ${theme.textMuted}30`,
            borderRadius: 50, padding: "8px 24px", color: theme.textPrimary,
            fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 13, fontWeight: 500,
            cursor: "pointer", backdropFilter: "blur(12px)", transition: "all 0.3s ease",
            textShadow: "0 1px 6px rgba(0,0,0,0.3)",
          }}>
            Analisi
          </button>
        </div>
        <h1 style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 20, fontWeight: 600, color: theme.textPrimary, margin: 0, textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}>
          Mare Calmo
        </h1>
      </div>

      {/* Clouds */}
      <div style={{ position: "absolute", top: 15, left: 0, right: 0, height: 80, zIndex: 3 }}>
        <div style={{ position: "absolute", top: 18, left: "10%", width: 90, height: 25, background: theme.textPrimary, opacity: 0.05, borderRadius: 20, animation: "cloudDrift 40s linear infinite" }} />
        <div style={{ position: "absolute", top: 45, left: "55%", width: 65, height: 18, background: theme.textPrimary, opacity: 0.035, borderRadius: 15, animation: "cloudDrift 50s linear 6s infinite" }} />
        <div style={{ position: "absolute", top: 30, left: "78%", width: 50, height: 14, background: theme.textPrimary, opacity: 0.025, borderRadius: 12, animation: "cloudDrift 55s linear 12s infinite" }} />
      </div>

      {/* Light ray */}
      <div style={{
        position: "absolute", top: 0, left: "28%", width: "44%", height: "50%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%)",
        clipPath: "polygon(30% 0%, 70% 0%, 88% 100%, 12% 100%)", zIndex: 2,
      }} />

      {/* Wave layers */}
      {[
        { top: "33%", color: theme.seaLight, opacity: 0.4, dur: 14, delay: 0 },
        { top: "40%", color: theme.seaMid, opacity: 0.45, dur: 18, delay: 2 },
        { top: "48%", color: theme.seaDeep, opacity: 0.3, dur: 22, delay: 4 },
      ].map((w, wi) => (
        <svg key={wi} viewBox="0 0 800 60" preserveAspectRatio="none" style={{
          position: "absolute", top: w.top, left: 0, width: "100%", height: 50, zIndex: 6 + wi,
        }}>
          <path d="M0,30 Q100,10 200,30 Q300,50 400,30 Q500,10 600,30 Q700,50 800,30 L800,60 L0,60 Z"
            fill={w.color} opacity={w.opacity}
            style={{ animation: `waveShift ${w.dur}s ease-in-out ${w.delay}s infinite` }} />
        </svg>
      ))}

      {/* Fish & underwater */}
      <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", top: "22%", left: 0, width: "100%", height: "65%", zIndex: 10 }}>
        <Seaweed x={45} color={theme.seaLight} h={140} />
        <Seaweed x={340} color={theme.seaMid} h={115} />
        <Seaweed x={185} color={theme.seaLight} h={85} />
        <ellipse cx="200" cy="395" rx="220" ry="18" fill={theme.sand} opacity="0.1" />
        <Bubbles count={10} theme={theme} />

        {/* Main fish */}
        {fishVisuals.map((fv) => (
          <SwimmingFish key={`${fv.i}-${resetToken}`} id={`main-${fv.i}`}
            startX={55 + fv.i * 115} startY={140 + (fv.i % 2) * 65 + fv.i * 12}
            color={fv.color} accent={fv.accent} size={fv.size} variant={fv.variant}
            duration={15 + fv.i * 4} distance={40 + fv.i * 12}
            flipX={fv.i % 2 === 0} delay={fv.i * 1.5} />
        ))}

        {/* Small background fish */}
        <SwimmingFish id="bg1" startX={25} startY={280}
          color={theme.seaLight} accent={theme.seaMid} size={0.4} variant={1}
          duration={22} distance={28} flipX={false} delay={4} />
        <SwimmingFish id="bg2" startX={310} startY={305}
          color={theme.seaMid} accent={theme.seaLight} size={0.35} variant={2}
          duration={26} distance={22} flipX={true} delay={7} />
      </svg>

      {/* Go to island */}
      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center", zIndex: 20 }}>
        <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 12, color: "#D0DAE5", marginBottom: 12, textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>
          Il mare ti aspetta
        </p>
        <button onClick={onGoToIsland} style={{
          padding: "16px 36px", borderRadius: 50, border: `1px solid ${theme.accentSoft}55`,
          background: `${theme.accentSoft}28`, color: "#FFFFFF",
          fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 16, fontWeight: 500,
          cursor: "pointer", backdropFilter: "blur(15px)", transition: "all 0.4s ease",
          boxShadow: `0 4px 30px ${theme.accentSoft}22`, textShadow: "0 1px 6px rgba(0,0,0,0.2)",
        }}>
          Vai sull'isola
        </button>
        <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 10, color: "#D0DAE5", marginTop: 16, margin: "16px auto 0", textAlign: "center", maxWidth: 300, lineHeight: 1.5 }}>
          Questa app non sostituisce un professionista della salute mentale. Se senti di aver bisogno di supporto, parlane con qualcuno di cui ti fidi.
        </p>
      </div>
      
      {/* Bottone musica */}
      <button onClick={toggleMusic} style={{
        position: "fixed", top: 20, right: 70, zIndex: 50, width: 40, height: 40, borderRadius: "50%",
        border: `1px solid ${theme.cardBorder}`, background: `${theme.cardBg}cc`, backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18,
        transition: "all 0.4s ease",
      }} title={isPlayingMusic ? "Spegni musica" : "Accendi musica"}>
        {isPlayingMusic ? "🎵" : "🔇"}
      </button>
      
      <audio ref={audioRef} loop volume="0.3" />
    </div>
  );
}

function IslandPage({ theme, onSubmit, onBack, dayCount }) {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(3);
  const [anxiety, setAnxiety] = useState(3);
  const [energy, setEnergy] = useState(2);
  const [note, setNote] = useState("");
  const [showToolkit, setShowToolkit] = useState(false);
  const moodEmojis = ["😌", "🙂", "😐", "😟", "😣"];
  const energyLabels = ["Bassa", "Media", "Alta"];

  const questions = [
    { label: "Come ti senti oggi?", render: () => (
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 24 }}>
        {moodEmojis.map((e, i) => (
          <button key={i} onClick={() => setMood(i + 1)} style={{
            fontSize: 30, background: mood === i + 1 ? `${theme.accentSoft}33` : "transparent",
            border: mood === i + 1 ? `2px solid ${theme.accentSoft}` : "2px solid transparent",
            borderRadius: 16, padding: "10px 12px", cursor: "pointer",
            transition: "all 0.3s ease", transform: mood === i + 1 ? "scale(1.15)" : "scale(1)",
          }}>{e}</button>
        ))}
      </div>
    )},
    { label: "Quanta pressione senti oggi?", render: () => (
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <input type="range" min="1" max="5" value={anxiety} onChange={(e) => setAnxiety(Number(e.target.value))}
          style={{ width: "80%", maxWidth: 260, accentColor: theme.accentSoft, height: 6 }} />
        <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 260, margin: "8px auto 0", fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 12, color: theme.textSecondary }}>
          <span>Poca</span><span>Tanta</span>
        </div>
        <div style={{ marginTop: 16, fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 28, color: theme.textPrimary, fontWeight: 600 }}>{anxiety}/5</div>
      </div>
    )},
    { label: "Com'è la tua energia?", render: () => (
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
        {energyLabels.map((l, i) => (
          <button key={i} onClick={() => setEnergy(i + 1)} style={{
            padding: "12px 24px", borderRadius: 50,
            border: energy === i + 1 ? `2px solid ${theme.accentSoft}` : `1px solid ${theme.cardBorder}`,
            background: energy === i + 1 ? `${theme.accentSoft}22` : theme.cardBg,
            color: energy === i + 1 ? theme.accentSoft : theme.textSecondary,
            fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 14, fontWeight: 500,
            cursor: "pointer", transition: "all 0.3s ease",
          }}>{l}</button>
        ))}
      </div>
    )},
    { label: "Vuoi lasciare un pensiero?", render: () => (
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Scrivi quello che senti... (opzionale)"
          style={{ width: "85%", maxWidth: 300, height: 100, padding: 16, borderRadius: 20,
            border: `1px solid ${theme.cardBorder}`, background: theme.cardBg, color: theme.textPrimary,
            fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 14, lineHeight: 1.7, resize: "none", outline: "none" }} />
      </div>
    )},
  ];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      background: `linear-gradient(180deg, ${theme.bgGradientTop} 0%, ${theme.seaMid}40 40%, ${theme.seaDeep}50 100%)`,
      position: "relative", transition: "all 0.8s ease",
    }}>
      <button onClick={onBack} style={{ position: "absolute", top: 20, left: 20, background: "none", border: "none", color: theme.textSecondary, fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 14, cursor: "pointer", zIndex: 30 }}>
        ← Torna al mare
      </button>

      {/* Toolkit centered */}
      <div style={{ position: "absolute", top: 20, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 20 }}>
        <button onClick={() => setShowToolkit(true)} style={{
          background: `${theme.cardBg}aa`, border: `1px solid ${theme.textMuted}25`,
          borderRadius: 50, padding: "8px 20px",
          color: theme.textSecondary, fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 13, fontWeight: 500,
          cursor: "pointer", backdropFilter: "blur(12px)", transition: "all 0.3s ease",
        }}>
          🧰 Strumenti
        </button>
      </div>

      <div style={{ marginTop: 0, width: "100%", maxWidth: "50vw", zIndex: 5, margin: "0 auto" }}>
        <IslandSVG theme={theme} lanternGlow={step > 0} dayCount={dayCount} />
      </div>

      <div key={step} style={{ animation: "fadeSlideIn 0.6s ease", textAlign: "center", padding: "20px 24px", marginTop: -220, zIndex: 15, position: "relative", background: `${theme.cardBg}dd`, borderRadius: 24, maxWidth: 380, margin: "-220px auto 0", backdropFilter: "blur(8px)" }}>
        <h2 style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 20, fontWeight: 500, color: theme.textPrimary, marginBottom: 4 }}>
          {questions[step].label}
        </h2>
        {questions[step].render()}
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 28 }}>
        {questions.map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: i <= step ? theme.accentSoft : theme.textMuted, opacity: i <= step ? 1 : 0.2, transition: "all 0.4s ease" }} />
        ))}
      </div>

      <button onClick={() => step < 3 ? setStep(step + 1) : onSubmit({ mood, anxiety, energy, note })}
        style={{
          marginTop: 22, marginBottom: 40, padding: "14px 36px", borderRadius: 50, border: "none",
          background: step < 3 ? `${theme.textPrimary}15` : theme.accentSoft,
          color: step < 3 ? theme.textPrimary : "#fff", fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
          fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease", backdropFilter: "blur(10px)",
        }}>
        {step < 3 ? "Continua" : "Torna al mare"}
      </button>

      {showToolkit && (
        <div onClick={() => setShowToolkit(false)} style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.3s ease",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: theme.cardBg, borderRadius: 24, padding: 28, maxWidth: 340, width: "90%", boxShadow: theme.cardShadow }}>
            <h3 style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 18, fontWeight: 600, color: theme.textPrimary, marginTop: 0, marginBottom: 20 }}>
              Cassetta degli strumenti
            </h3>
            {["Respirazione 4-4-4", "Grounding 5-4-3-2-1", "Scrittura libera", "Una cosa piccola oggi"].map((t, i) => (
              <div key={i} style={{ padding: "12px 16px", borderRadius: 16, background: theme.bgSecondary, marginBottom: 8, cursor: "pointer", fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 14, color: theme.textSecondary, transition: "all 0.3s ease" }}>
                {["🌬", "🖐", "✍️", "🌱"][i]} {t}
              </div>
            ))}
            <button onClick={() => setShowToolkit(false)} style={{ marginTop: 16, width: "100%", padding: 12, borderRadius: 50, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textSecondary, fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 13, cursor: "pointer" }}>
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SupportPage({ theme, checkInData, onReturn }) {
  const level = checkInData.anxiety >= 4 ? "high" : checkInData.anxiety >= 2 ? "medium" : "low";
  const empathy = empatheticMessages[level][Math.floor(Math.random() * empatheticMessages[level].length)];
  const trigger = checkInData.anxiety >= 4 ? "high_anxiety" : checkInData.energy <= 1 ? "low_energy" : "neutral";
  const strategies = copingStrategies.filter((s) => s.trigger === trigger);
  const strategy = strategies[Math.floor(Math.random() * strategies.length)] || copingStrategies[4];
  const reflection = reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)];
  const sections = [
    { icon: "💬", title: "Ti ascolto", content: empathy },
    { icon: "🌿", title: strategy.title, content: strategy.description, source: strategy.source },
    { icon: "🪞", title: "Uno spunto", content: reflection },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(180deg, ${theme.bgGradientTop}, ${theme.bgPrimary})`, padding: 24, transition: "all 0.8s ease" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${theme.accentGlow}33, transparent)`, animation: "lanternPulse 3s ease-in-out infinite", marginBottom: 20 }} />
      {sections.map((s, i) => (
        <div key={i} style={{ animation: `fadeSlideIn 0.7s ease ${i * 0.4}s both`, background: theme.cardBg, borderRadius: 24, padding: "22px 24px", maxWidth: 360, width: "100%", marginBottom: 14, border: `1px solid ${theme.cardBorder}`, boxShadow: theme.cardShadow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <span style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 14, fontWeight: 600, color: theme.accentSoft, letterSpacing: 0.5 }}>{s.title}</span>
          </div>
          <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 15, color: theme.textPrimary, lineHeight: 1.7, margin: 0 }}>{s.content}</p>
          {s.source && <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 11, color: theme.textSecondary, marginTop: 10, marginBottom: 0, fontStyle: "italic" }}>Fonte: {s.source}</p>}
        </div>
      ))}
      <button onClick={onReturn} style={{ marginTop: 20, padding: "14px 36px", borderRadius: 50, border: `1px solid ${theme.accentSoft}44`, background: `${theme.accentSoft}18`, color: theme.textPrimary, fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 15, fontWeight: 500, cursor: "pointer", animation: "fadeSlideIn 0.7s ease 1.2s both", backdropFilter: "blur(10px)" }}>
        Torna al mare
      </button>
      <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 10, color: theme.textSecondary, marginTop: 24, textAlign: "center", maxWidth: 300, animation: "fadeSlideIn 0.7s ease 1.5s both" }}>
        Questa app non sostituisce un professionista della salute mentale. Se senti di aver bisogno di supporto, parlane con qualcuno di cui ti fidi.
      </p>
    </div>
  );
}

function ProgressPage({ theme, checkIns, fishData, seaState, onBack }) {
  const seaInfo = discretizeSea(seaState);
  const [showDetail, setShowDetail] = useState(false);
  const avgAnxiety = checkIns.length > 0 ? (checkIns.reduce((a, c) => a + c.anxiety, 0) / checkIns.length).toFixed(1) : "—";
  const narratives = [];
  if (checkIns.length === 0) narratives.push("Il tuo mare è appena nato. Fai il primo check-in per iniziare il percorso.");
  else if (checkIns.length < 3) narratives.push("Stai muovendo i primi passi. Continua a tornare, senza fretta.");
  else {
    const recent = checkIns.slice(-5);
    const ra = recent.reduce((a, c) => a + c.anxiety, 0) / recent.length;
    if (ra >= 3.5) narratives.push("Ci sono stati giorni più tesi di recente. È normale, e il fatto che tu sia qui conta.");
    else if (ra >= 2) narratives.push("Il tuo mare ha avuto onde e calme. Stai imparando a navigarle.");
    else narratives.push("In questo periodo il mare è stato più calmo. Stai trovando il tuo ritmo.");
    narratives.push(`Hai fatto ${checkIns.length} check-in finora.`);
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${theme.bgGradientTop} 0%, ${theme.seaLight}44 40%, ${theme.bgPrimary} 100%)`, padding: "80px 24px 40px", transition: "all 0.8s ease" }}>
      <button onClick={onBack} style={{ position: "fixed", top: 20, left: 20, background: "none", border: "none", color: theme.textSecondary, fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 14, cursor: "pointer", zIndex: 20 }}>
        ← Torna al mare
      </button>
      <h2 style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 22, fontWeight: 600, color: theme.textPrimary, textAlign: "center", marginBottom: 8 }}>Il tuo orizzonte</h2>
      <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 13, color: theme.textSecondary, textAlign: "center", letterSpacing: 1, marginBottom: 32 }}>
        {seaInfo.label === "neutro" ? "Inizio del viaggio" : `Mare ${seaInfo.label}`}
      </p>

      <div style={{ width: "100%", maxWidth: 380, margin: "0 auto 28px", height: 120, borderRadius: 24, overflow: "hidden", position: "relative", background: `linear-gradient(180deg, ${theme.bgGradientTop}, ${theme.seaMid})` }}>
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
          <path d="M0,70 Q50,55 100,65 Q150,75 200,60 Q250,50 300,65 Q350,75 400,60 L400,120 L0,120 Z" fill={theme.seaLight} opacity="0.6" style={{ animation: "waveShift 15s ease-in-out infinite" }} />
          <path d="M0,80 Q50,70 100,78 Q150,86 200,75 Q250,68 300,78 Q350,86 400,72 L400,120 L0,120 Z" fill={theme.seaDeep} opacity="0.5" style={{ animation: "waveShift 20s ease-in-out 2s infinite" }} />
          {fishData.map((f, i) => <circle key={i} cx={100 + i * 80} cy={85 + (i % 2) * 10} r={3 + f.growth * 4} fill={theme.accentSoft} opacity="0.7" />)}
        </svg>
      </div>

      {narratives.map((n, i) => (
        <p key={i} style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 15, color: theme.textPrimary, textAlign: "center", lineHeight: 1.7, maxWidth: 340, margin: "0 auto 8px", animation: `fadeSlideIn 0.6s ease ${i * 0.2}s both` }}>{n}</p>
      ))}

      <div style={{ maxWidth: 380, margin: "28px auto 0" }}>
        {fishData.map((f, i) => {
          const stage = discretizeVisual(f.growth);
          const labels = { small: "Appena arrivato", medium: "Sta crescendo", grown: "Si fa vedere", large: "Nuota con sicurezza", adult: "Completamente a casa" };
          return (
            <div key={i} style={{ background: theme.cardBg, borderRadius: 20, padding: "16px 20px", marginBottom: 10, border: `1px solid ${theme.cardBorder}`, display: "flex", alignItems: "center", gap: 14, animation: `fadeSlideIn 0.5s ease ${0.4 + i * 0.15}s both` }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${theme.accentSoft}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="-30 -18 60 36" width="34" height="26">
                  <FishBody color={theme.accentSoft} accent={theme.accentGlow} variant={i % 3} id={`prog-${i}`} />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 14, fontWeight: 600, color: theme.textPrimary, margin: 0, textTransform: "capitalize" }}>{f.dimension}</p>
                <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 12, color: theme.textSecondary, margin: "2px 0 0" }}>{labels[stage]}</p>
              </div>
              <div style={{ width: 60, height: 6, borderRadius: 3, background: theme.bgSecondary, overflow: "hidden" }}>
                <div style={{ width: `${f.growth * 100}%`, height: "100%", borderRadius: 3, background: theme.accentSoft, transition: "width 0.8s ease" }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button onClick={() => setShowDetail(!showDetail)} style={{ background: "none", border: `1px solid ${theme.cardBorder}`, borderRadius: 50, padding: "10px 20px", color: theme.textMuted, fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 13, cursor: "pointer" }}>
          {showDetail ? "Nascondi dettagli" : "Vedi nel dettaglio"}
        </button>
      </div>

      {showDetail && checkIns.length > 0 && (
        <div style={{ maxWidth: 380, margin: "20px auto 0", animation: "fadeSlideIn 0.5s ease" }}>
          <div style={{ background: theme.cardBg, borderRadius: 20, padding: 20, border: `1px solid ${theme.cardBorder}` }}>
            <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 13, color: theme.textSecondary, margin: "0 0 12px" }}>Ultimi check-in</p>
            <svg viewBox="0 0 320 80" style={{ width: "100%", height: 80 }}>
              {checkIns.slice(-10).map((c, i, arr) => {
                const x = (i / Math.max(arr.length - 1, 1)) * 300 + 10;
                const y = 70 - (c.anxiety / 5) * 60;
                return (
                  <g key={i}>
                    {i > 0 && <line x1={((i - 1) / Math.max(arr.length - 1, 1)) * 300 + 10} y1={70 - (arr[i - 1].anxiety / 5) * 60} x2={x} y2={y} stroke={theme.accentSoft} strokeWidth="2" strokeLinecap="round" opacity="0.6" />}
                    <circle cx={x} cy={y} r="4" fill={theme.accentSoft} />
                  </g>
                );
              })}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
              <span>Meno recente</span><span>Più recente</span>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 20 }}>
              <div>
                <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 11, color: theme.textMuted, margin: 0 }}>Ansia media</p>
                <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 20, fontWeight: 600, color: theme.textPrimary, margin: "4px 0 0" }}>{avgAnxiety}</p>
              </div>
              <div>
                <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 11, color: theme.textMuted, margin: 0 }}>Check-in totali</p>
                <p style={{ fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", fontSize: 20, fontWeight: 600, color: theme.textPrimary, margin: "4px 0 0" }}>{checkIns.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const auth = useContext(AuthContext);
  const [themeName, setThemeName] = useState("notte");
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [page, setPage] = useState("onboarding");
  const [checkIns, setCheckIns] = useState([]);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [fishData, setFishData] = useState([
    { dimension: "studio", growth: 0.05 },
    { dimension: "lavoro", growth: 0.02 },
    { dimension: "benessere", growth: 0.03 },
  ]);
  const [seaState, setSeaState] = useState(0.15);
  const [seaKey, setSeaKey] = useState(0);
  const theme = themes[themeName];

  const handleCheckIn = useCallback((data) => {
    const newCheckIn = { ...data, timestamp: Date.now() };
    const newCheckIns = [...checkIns, newCheckIn];
    setCheckIns(newCheckIns);
    setLastCheckIn(newCheckIn);
    const newFish = fishData.map((f) => {
      const gd = EVENT_WEIGHTS.check_in + (data.note ? EVENT_WEIGHTS.reflection : 0);
      const smoothed = ema(f.growth, gd);
      return { ...f, growth: Math.min(f.growth + smoothed, 1.0) };
    });
    setFishData(newFish);
    const ci = Math.min(newCheckIns.length / 14, 1.0);
    const avgG = newFish.reduce((a, f) => a + f.growth, 0) / newFish.length;
    const raw = 0.4 * avgG + 0.3 * ci + 0.2 * 0.5 + 0.1 * 0.3;
    const smoothedSea = ema(seaState, raw, 0.1);
    setSeaState(Math.max(seaState, smoothedSea));
    setPage("support");
  }, [checkIns, fishData, seaState]);

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }
        input[type="range"] { -webkit-appearance: none; background: transparent; }
        input[type="range"]::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; background: ${theme.bgSecondary}; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: ${theme.accentSoft}; margin-top: -8px; cursor: pointer; box-shadow: 0 2px 8px ${theme.accentSoft}44; }
        textarea:focus { border-color: ${theme.accentSoft}66 !important; }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes waveShift { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-20px); } }
        @keyframes bubbleRise { 0% { cy: 380; opacity: 0; } 10% { opacity: 0.45; } 85% { opacity: 0.15; } 100% { cy: 30; opacity: 0; } }
        @keyframes seaweedSway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(3.5deg); } }
        @keyframes lanternPulse { 0%, 100% { opacity: 0.15; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.08); } }
        @keyframes leafSway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(5deg); } }
        @keyframes cloudDrift { 0% { transform: translateX(0); } 100% { transform: translateX(150px); } }
      `}</style>

      {page !== "onboarding" && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 50,
          display: "flex", gap: 12, alignItems: "center",
        }}>
          {/* Email dell'utente loggato */}
          {auth.user && (
            <div style={{
              padding: "8px 14px", borderRadius: 50,
              background: `${theme.cardBg}cc`, backdropFilter: "blur(10px)",
              border: `1px solid ${theme.cardBorder}`,
              fontSize: 12, color: theme.textMuted,
              fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
              maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              📧 {auth.user.email}
            </div>
          )}

          {/* Button logout */}
          <button onClick={() => auth.logout()} style={{
            width: 40, height: 40, borderRadius: "50%",
            border: `1px solid ${theme.cardBorder}`, background: `${theme.cardBg}cc`, backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16,
            transition: "all 0.4s ease",
          }} title="Logout">
            🔓
          </button>

          {/* Button musica */}
          <button onClick={() => setMusicEnabled(!musicEnabled)} style={{
            width: 40, height: 40, borderRadius: "50%",
            border: `1px solid ${theme.cardBorder}`, background: `${theme.cardBg}cc`, backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16,
            transition: "all 0.4s ease",
            opacity: musicEnabled ? 1 : 0.6,
          }} title={musicEnabled ? "Disattiva musica" : "Attiva musica"}>
            {musicEnabled ? "🎵" : "🔇"}
          </button>

          {/* Button tema */}
          <button onClick={() => setThemeName(themeName === "notte" ? "alba" : "notte")} style={{
            width: 40, height: 40, borderRadius: "50%",
            border: `1px solid ${theme.cardBorder}`, background: `${theme.cardBg}cc`, backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18,
            transition: "all 0.4s ease",
          }} title={themeName === "notte" ? "Passa all'alba" : "Passa alla notte"}>
            {themeName === "notte" ? "🌅" : "🌙"}
          </button>
        </div>
      )}

      {page === "onboarding" && <OnboardingPage theme={theme} onComplete={() => { setSeaKey(k => k + 1); setPage("sea"); }} />}
      {page === "sea" && <SeaPage key={seaKey} theme={theme} fishData={fishData} seaState={seaState} onGoToIsland={() => setPage("island")} onGoToProgress={() => setPage("progress")} onGoToAnalytics={() => setPage("analytics")} />}
      {page === "island" && <IslandPage theme={theme} onSubmit={handleCheckIn} onBack={() => { setSeaKey(k => k + 1); setPage("sea"); }} dayCount={checkIns.length} />}
      {page === "support" && lastCheckIn && <SupportPage theme={theme} checkInData={lastCheckIn} onReturn={() => { setSeaKey(k => k + 1); setPage("sea"); }} />}
      {page === "progress" && <ProgressPage theme={theme} checkIns={checkIns} fishData={fishData} seaState={seaState} onBack={() => { setSeaKey(k => k + 1); setPage("sea"); }} />}
      {page === "analytics" && <AnalyticsPage theme={theme} onBack={() => { setSeaKey(k => k + 1); setPage("sea"); }} />}
    </div>
  );
}
