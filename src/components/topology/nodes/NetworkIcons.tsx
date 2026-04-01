import React from 'react';

export const CiscoRouter = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 200 120" 
    className={className}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Base Shadow */}
    <ellipse cx="100" cy="95" rx="85" ry="25" fill="black" fillOpacity="0.15" />
    
    {/* 3D Puck Bottom */}
    <ellipse cx="100" cy="75" rx="80" ry="35" fill="url(#routerGradientSide)" />
    
    {/* 3D Puck Top Surface */}
    <ellipse cx="100" cy="65" rx="80" ry="35" fill="url(#routerGradientTop)" stroke="#0969da" strokeWidth="2" />
    
    {/* Arrows logic (4 arrows) */}
    <g transform="translate(100, 65)">
      {/* North Arrow */}
      <path d="M-5 -25 L5 -25 L0 -35 Z" fill="white" />
      <path d="M-2 -10 L-2 -25 L2 -25 L2 -10 Z" fill="white" />
      
      {/* South Arrow */}
      <path d="M-5 25 L5 25 L0 35 Z" fill="white" />
      <path d="M-2 10 L-2 25 L2 25 L2 10 Z" fill="white" />
      
      {/* West Arrow */}
      <path d="M-25 -5 L-25 5 L-35 0 Z" fill="white" />
      <path d="M-10 -2 L-25 -2 L-25 2 L-10 2 Z" fill="white" />
      
      {/* East Arrow */}
      <path d="M25 -5 L25 5 L35 0 Z" fill="white" />
      <path d="M10 -2 L25 -2 L25 2 L10 2 Z" fill="white" />
    </g>

    <defs>
      <linearGradient id="routerGradientTop" x1="100" y1="30" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0a84ff" />
        <stop offset="1" stopColor="#005ecb" />
      </linearGradient>
      <linearGradient id="routerGradientSide" x1="100" y1="40" x2="100" y2="110" gradientUnits="userSpaceOnUse">
        <stop stopColor="#005ecb" />
        <stop offset="1" stopColor="#003d85" />
      </linearGradient>
    </defs>
  </svg>
);

export const CiscoSwitch = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 200 120" 
    className={className}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Base Shadow */}
    <rect x="25" y="85" width="150" height="25" fill="black" fillOpacity="0.1" rx="4" />
    
    {/* 3D Box Side */}
    <rect x="20" y="45" width="160" height="50" fill="url(#switchGradientSide)" rx="4" />
    
    {/* 3D Box Top */}
    <path d="M20 45 L40 25 L180 25 L160 45 Z" fill="url(#switchGradientTop)" stroke="#0969da" strokeWidth="1" />
    <rect x="20" y="45" width="160" height="40" fill="url(#switchGradientFront)" stroke="#0969da" strokeWidth="1" rx="4" />
    
    {/* Arrows (Horizontal pattern) */}
    <g transform="translate(100, 65)">
      {/* Left-to-Right Arrow */}
      <path d="M-30 -10 L20 -10 L20 -14 L30 -8 L20 -2 L20 -6 L-30 -6 Z" fill="white" />
      {/* Right-to-Left Arrow */}
      <path d="M30 10 L-20 10 L-20 14 L-30 8 L-20 2 L-20 6 L30 6 Z" fill="white" />
    </g>

    <defs>
      <linearGradient id="switchGradientTop" x1="100" y1="20" x2="100" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0a84ff" />
        <stop offset="1" stopColor="#005ecb" />
      </linearGradient>
      <linearGradient id="switchGradientFront" x1="100" y1="45" x2="100" y2="85" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0a84ff" />
        <stop offset="1" stopColor="#005ecb" />
      </linearGradient>
      <linearGradient id="switchGradientSide" x1="20" y1="65" x2="180" y2="65" gradientUnits="userSpaceOnUse">
        <stop stopColor="#003d85" />
        <stop offset="1" stopColor="#005ecb" />
      </linearGradient>
    </defs>
  </svg>
);

export const CiscoPC = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 200 120" 
    className={className}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Monitor Base */}
    <rect x="80" y="80" width="40" height="10" fill="#545b64" rx="2" />
    <rect x="95" y="70" width="10" height="15" fill="#31363f" />
    
    {/* Monitor Screen */}
    <rect x="50" y="25" width="100" height="60" fill="url(#pcGradientScreen)" stroke="#0969da" strokeWidth="2" rx="4" />
    <rect x="55" y="30" width="90" height="45" fill="#0d1117" rx="2" />
    
    {/* Screen Glare */}
    <path d="M55 30 L90 30 L55 60 Z" fill="white" fillOpacity="0.05" />
    
    {/* Tower next to monitor */}
    <rect x="150" y="30" width="25" height="70" fill="url(#pcGradientTower)" stroke="#0969da" strokeWidth="1" rx="2" />
    <circle cx="162.5" cy="40" r="2" fill="#0a84ff" />
    <rect x="155" y="50" width="15" height="2" fill="#31363f" />
    <rect x="155" y="55" width="15" height="2" fill="#31363f" />

    <defs>
      <linearGradient id="pcGradientScreen" x1="100" y1="20" x2="100" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0d1117" />
        <stop offset="1" stopColor="#1f2328" />
      </linearGradient>
      <linearGradient id="pcGradientTower" x1="162.5" y1="30" x2="162.5" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#545b64" />
        <stop offset="1" stopColor="#31363f" />
      </linearGradient>
    </defs>
  </svg>
);
