import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export default function Logo({ className = "", size = "md", showText = true }: LogoProps) {
  let dimensions = "h-12 w-12";
  if (size === "sm") dimensions = "h-8 w-8";
  if (size === "md") dimensions = "h-14 w-14";
  if (size === "lg") dimensions = "h-28 w-28";
  if (size === "xl") dimensions = "h-44 w-44";

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* High-Fidelity SVG Implementation of the Official "Sahabat Sampah Duta" Emblem Logo */}
      <svg
        className={`filter drop-shadow-md select-none transition-all duration-300 hover:scale-105 ${dimensions}`}
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Definitions for Gradients and Masks */}
        <defs>
          <linearGradient id="goldCoins" x1="390" y1="280" x2="450" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="50%" stopColor="#FFB300" />
            <stop offset="100%" stopColor="#FF8F00" />
          </linearGradient>
          <linearGradient id="mainLeaf" x1="140" y1="200" x2="210" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#81C784" />
            <stop offset="60%" stopColor="#388E3C" />
            <stop offset="100%" stopColor="#1B5E20" />
          </linearGradient>
          <linearGradient id="trashBin" x1="210" y1="180" x2="290" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#26C6DA" />
            <stop offset="50%" stopColor="#00ACC1" />
            <stop offset="100%" stopColor="#006064" />
          </linearGradient>
          <linearGradient id="skySun" x1="390" y1="100" x2="430" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFEE58" />
            <stop offset="100%" stopColor="#F57F17" />
          </linearGradient>
        </defs>

        {/* 1. Housing Frame & Sweeping Arch (Dark Blue: #0B4C8C) */}
        {/* Outer arch that sweeps from top-left, curves around left, and merges into the cradling hand at the bottom */}
        <path
          d="M 230 40 
             C 140 50, 95 130, 95 240
             C 95 310, 140 380, 220 400
             C 280 415, 380 410, 440 330
             C 410 390, 310 425, 230 420
             C 135 410, 70 320, 70 240
             C 70 120, 130 30, 250 25
             C 270 24, 280 26, 280 26 
             Z"
          fill="#0B4C8C"
        />

        {/* House Roof (Dark Blue) */}
        <path
          d="M 250 70 
             L 450 220 
             L 425 240 
             L 250 110 
             L 155 180 
             C 155 180, 185 110, 250 70 Z"
          fill="#0B4C8C"
        />
        
        {/* Chimney */}
        <rect x="382" y="140" width="28" height="50" fill="#0B4C8C" />
        <ellipse cx="396" cy="140" rx="14" ry="4" fill="#073B6E" />

        {/* 4 Windows in a 2x2 grid in the upper attic */}
        <g fill="#0B4C8C">
          <rect x="234" y="142" width="12" height="12" rx="2" />
          <rect x="254" y="142" width="12" height="12" rx="2" />
          <rect x="234" y="162" width="12" height="12" rx="2" />
          <rect x="254" y="162" width="12" height="12" rx="2" />
        </g>

        {/* 2. Shiny Yellow Sun in the top-right corner */}
        <circle cx="415" cy="115" r="22" fill="url(#skySun)" />
        {/* Sun Rays */}
        <g stroke="#F57F17" strokeWidth="4" strokeLinecap="round">
          <line x1="415" y1="80" x2="415" y2="65" />
          <line x1="415" y1="150" x2="415" y2="165" />
          <line x1="380" y1="115" x2="365" y2="115" />
          <line x1="450" y1="115" x2="465" y2="115" />
          <line x1="390" y1="90" x2="379" y2="79" />
          <line x1="440" y1="140" x2="451" y2="151" />
          <line x1="440" y1="90" x2="451" y2="79" />
          <line x1="390" y1="140" x2="379" y2="151" />
        </g>

        {/* 3. Deep Green Leaf on the Left side inside the house */}
        <path
          d="M 215 330 
             C 140 330, 110 240, 130 170
             C 130 170, 195 200, 215 320 
             Z"
          fill="url(#mainLeaf)"
        />
        {/* Leaf central vein and side ribs in light white/green */}
        <path
          d="M 130 170 C 160 220, 190 270, 215 320"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* 4. Deep Blue Rubbish/Trash Bag sitting on the Right (behind the coins) */}
        <path
          d="M 335 340 
             C 320 300, 312 255, 345 255
             C 375 255, 372 300, 395 340 
             Z"
          fill="#0D3F75"
        />
        {/* Bag Knot / Tie detailing */}
        <path
          d="M 345 255 
             C 335 240, 355 240, 345 255 
             Z"
          fill="#092E57"
          stroke="#0D3F75"
          strokeWidth="2.5"
        />
        <path
          d="M 341 254 C 330 248, 335 240, 341 254 Z M 349 254 C 360 248, 355 240, 349 254 Z"
          fill="#0B4C8C"
        />

        {/* 5. Teal/Cyan Trash Bin with Lid (Center-Right overlay) */}
        {/* Body */}
        <path
          d="M 226 220 
             L 236 335 
             C 237 342, 242 346, 248 346 
             L 282 346 
             C 288 346, 293 342, 294 335 
             L 304 220 
             Z"
          fill="url(#trashBin)"
        />
        {/* Bin Lid */}
        <rect x="218" y="210" width="94" height="12" rx="6" fill="#00ACC1" />
        {/* Lid Handle */}
        <path
          d="M 245 210
             C 245 198, 285 198, 285 210"
          stroke="#00ACC1"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Recycle/Arrow Loop symbol in white on trash bin */}
        <g stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
          {/* Circular three-arrow loop simplified */}
          <path d="M 265 255 L 255 272 L 275 272 Z" />
          <path d="M 252 272 A 12 12 0 1 1 278 272" />
        </g>

        {/* 6. Gold Stack of Coins in bottom right foreground */}
        {/* Back Stack coin cylinder 1 */}
        <path d="M 372 315 m -25 0 a 25 10 0 1 0 50 0 v 15 a 25 10 0 1 1 -50 0 Z" fill="#D84315" opacity="0.15" />
        <ellipse cx="372" cy="315" rx="22" ry="7" fill="#FFB305" stroke="#FF8F00" strokeWidth="2.5" />
        <path d="M 350 315 v 12 c 0 3.8, 9.8 7, 22 7 s 22 -3.2, 22 -7 v -12" fill="none" stroke="#FF8F00" strokeWidth="2.5" />

        {/* Back Stack coin cylinder 2 (slightly offset) */}
        <path d="M 372 333 m -25 0 a 25 10 0 1 0 50 0 v 15 a 25 10 0 1 1 -50 0 Z" fill="#D84315" opacity="0.15" />
        <ellipse cx="372" cy="333" rx="22" ry="7" fill="#FFB305" stroke="#FF8F00" strokeWidth="2.5" />
        <path d="M 350 333 v 12 c 0 3.8, 9.8 7, 22 7 s 22 -3.2, 22 -7 v -12" fill="none" stroke="#FF8F00" strokeWidth="2.5" />

        {/* Front prominent gold coin circle with "Rp" symbol */}
        <circle cx="335" cy="350" r="28" fill="url(#goldCoins)" stroke="#F57F17" strokeWidth="3" />
        <circle cx="335" cy="350" r="22" fill="#FFE082" opacity="0.5" />
        {/* Inner Border */}
        <circle cx="335" cy="350" r="23" fill="none" stroke="#FFB300" strokeWidth="1.5" strokeDasharray="4 2" />
        <text
          x="335"
          y="358"
          fill="#E65100"
          fontFamily="system-ui"
          fontSize="21"
          fontWeight="1000"
          textAnchor="middle"
        >
          Rp
        </text>

        {/* 7. Beautiful Open Caring Hand in Dark Blue at bottom base (#0B4C8C) */}
        {/* This hand holds and cradles the assets perfectly */}
        <path
          d="M 120 330 
             C 120 330, 160 380, 240 380
             C 270 380, 310 365, 345 365
             C 375 365, 415 390, 445 345
             C 415 410, 320 425, 230 420
             C 170 415, 120 380, 120 330 
             Z"
          fill="#0B4C8C"
        />
        {/* Elegant hand finger crease contours for aesthetic depth */}
        <path
          d="M 235 390 C 275 392, 335 385, 370 375"
          stroke="#07325C"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 195 380 C 245 385, 305 375, 340 370"
          stroke="#07325C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      {/* TEXT SECTION: Rendered in HTML/CSS with Precise typography to look clean, professional and matching */}
      {showText && (
        <div className="mt-4 flex flex-col items-center">
          {/* "Sahabat" */}
          <h2 className="font-sans font-black tracking-tight text-[#083A6F] text-2xl uppercase leading-none md:text-3xl">
            Sahabat
          </h2>
          
          {/* "Sampah" with inline SVG leaf on 'h' equivalent */}
          <div className="flex items-center justify-center gap-1.5 mt-0.5 relative">
            <h3 className="font-sans font-extrabold text-[#00A2AC] text-4xl tracking-tight leading-none md:text-5xl">
              Sampah
            </h3>
            {/* Organic Floating Green Leaf on the letter 'h' */}
            <span className="absolute -right-5 top-0 rotate-12 scale-100 shrink-0">
              <svg width="22" height="22" viewBox="0 0 30 30" fill="none">
                <path d="M2 28 C12 28, 26 18, 28 2 C28 10, 24 22, 10 26 Z" fill="#3CA642" />
                <path d="M2.5 27.5 Q16 16 28 2" stroke="#1B5E20" strokeWidth="2" />
              </svg>
            </span>
          </div>

          {/* Navy capsule button containing cursive script "Duta" flanked by leaves */}
          <div className="mt-4 flex items-center justify-center gap-2.5">
            {/* Leaf Left */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="-rotate-45">
              <path d="M2 22 C8 22, 18 16, 22 2 C22 8, 18 18, 8 20 Z" fill="#3CA642" />
            </svg>

            {/* Dark Blue Pill Capsule for Duta with golden font feel */}
            <span className="bg-[#0B4C8C] text-white px-8 py-1 rounded-full text-sm font-sans font-black uppercase tracking-[0.2em] shadow-sm border border-blue-900/40 inline-block font-mono">
              ★ DUTA ★
            </span>

            {/* Leaf Right */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="rotate-45">
              <path d="M22 22 C16 22, 6 16, 2 2 C2 8, 6 18, 16 20 Z" fill="#3CA642" />
            </svg>
          </div>

          {/* Subtitle details */}
          <div className="mt-4 w-full max-w-[280px] border-t border-b border-[#3CA642]/40 py-1 flex items-center justify-center gap-2">
            <span className="text-[10px] font-sans font-black text-[#083A6F] tracking-widest uppercase">
              Bank Sampah Pondok Duta
            </span>
          </div>

          {/* RT Badge / Pill in golden-yellow */}
          <div className="mt-2 bg-[#FFB300] text-[#083A6F] px-4.5 py-1 rounded-lg text-[10px] font-sans font-black uppercase tracking-wider shadow-inner">
            RT 06 RW 14 DEPOK
          </div>

          {/* Sweeping crescent lines & double-leaf below */}
          <div className="mt-3.5 flex flex-col items-center w-full max-w-[260px]">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#0B4C8C]/50 to-transparent" />
            {/* Slogan */}
            <p className="text-[9px] font-sans text-slate-500 font-bold tracking-normal italic mt-1.5">
              "Sampah Jadi Manfaat, Lingkungan Jadi Sehat"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
