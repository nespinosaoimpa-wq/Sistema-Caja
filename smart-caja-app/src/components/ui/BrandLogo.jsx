'use client'

import React from 'react'

export default function BrandLogo({ 
  size = 36, 
  showText = true, 
  textSize = '1.35rem',
  style = {},
  className = '' 
}) {
  return (
    <div 
      className={className} 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: size > 30 ? '10px' : '8px', 
        textDecoration: 'none',
        ...style 
      }}
    >
      {/* Isotype */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 512 512" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, borderRadius: `${Math.round(size * 0.23)}px` }}
      >
        <defs>
          <radialGradient id={`bgGlow-${size}`} cx="50%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#142642" />
            <stop offset="60%" stopColor="#0B1526" />
            <stop offset="100%" stopColor="#060C17" />
          </radialGradient>

          <linearGradient id={`borderGrad-${size}`} x1="64" y1="32" x2="448" y2="480" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.75" />
            <stop offset="40%" stopColor="#00E59B" stopOpacity="0.3" />
            <stop offset="80%" stopColor="#0F766E" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.55" />
          </linearGradient>

          <linearGradient id={`tealGrad-${size}`} x1="140" y1="120" x2="372" y2="392" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="45%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#00E59B" />
          </linearGradient>

          <linearGradient id={`bladeGrad-${size}`} x1="180" y1="120" x2="350" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="50%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>

          <filter id={`shadow-${size}`} x="80" y="80" width="352" height="352" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#00E59B" floodOpacity="0.32" />
          </filter>

          <radialGradient id={`centerGlow-${size}`} cx="50%" cy="50%" r="35%">
            <stop offset="0%" stopColor="#00E59B" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00E59B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Squircle Container */}
        <rect x="20" y="20" width="472" height="472" rx="118" fill={`url(#bgGlow-${size})`} />
        <rect x="20" y="20" width="472" height="472" rx="118" stroke={`url(#borderGrad-${size})`} strokeWidth="8" />

        {/* Ambient Backlight */}
        <circle cx="256" cy="256" r="160" fill={`url(#centerGlow-${size})`} />

        {/* Central Glyph */}
        <g filter={`url(#shadow-${size})`}>
          {/* Top Wing */}
          <path 
            d="M 208 132 H 328 C 356.7 132 380 155.3 380 184 C 380 208.2 363.8 228.6 341.6 234.6 L 256 258 C 238.3 263 226 279.1 226 297.5 V 300 H 174 V 294 C 174 256.4 200.5 224 237.6 213.5 L 322 189.5 C 326 188.4 328 185.8 328 184 C 328 181.8 326.2 180 324 180 H 208 C 194.7 180 184 169.3 184 156 C 184 142.7 194.7 132 208 132 Z"
            fill={`url(#bladeGrad-${size})`}
          />

          {/* Bottom Wing */}
          <path 
            d="M 304 380 H 184 C 155.3 380 132 356.7 132 328 C 132 303.8 148.2 283.4 170.4 277.4 L 256 254 C 273.7 249 286 232.9 286 214.5 V 212 H 338 V 218 C 338 255.6 311.5 288 274.4 298.5 L 190 322.5 C 186 323.6 184 326.2 184 328 C 184 330.2 185.8 332 188 332 H 304 C 317.3 332 328 342.7 328 356 C 328 369.3 317.3 380 304 380 Z"
            fill={`url(#tealGrad-${size})`}
          />

          {/* Center Connection Node */}
          <circle cx="256" cy="256" r="24" fill="#5EEAD4" />
          <circle cx="256" cy="256" r="14" fill="#091322" />
          <circle cx="256" cy="256" r="7" fill="#5EEAD4" />
        </g>
      </svg>

      {/* Brand Typography */}
      {showText && (
        <span 
          style={{ 
            fontFamily: 'var(--font-headline, Outfit, sans-serif)', 
            fontSize: textSize, 
            fontWeight: 800, 
            letterSpacing: '0.02em', 
            color: '#FFFFFF',
            lineHeight: 1,
            whiteSpace: 'nowrap'
          }}
        >
          Smart <span style={{ color: '#2DD4BF' }}>Caja</span>
        </span>
      )}
    </div>
  )
}
