import React from 'react';

const tones={
  neutral:{background:'var(--paper-100)',color:'var(--ink-700)',border:'1px solid var(--border-subtle)'},
  active:{background:'var(--green-900)',color:'var(--text-on-dark)'},
  sub:{background:'var(--color-sub-bg)',color:'var(--color-sub)',border:'1px solid #eccc9a'},
  success:{background:'var(--green-50)',color:'var(--green-800)',border:'1px solid var(--green-200)'},
  weather:{background:'rgba(255,255,255,.2)',color:'var(--text-on-dark)',border:'1px solid rgba(255,255,255,.4)',backdropFilter:'blur(var(--blur-glass))'},
};

export function Badge({children,tone='neutral',icon,style}){
  return React.createElement('span',{style:{
    display:'inline-flex',alignItems:'center',gap:6,
    fontFamily:'var(--font-body)',fontWeight:600,fontSize:'var(--text-2xs)',
    letterSpacing:'var(--tracking-wide)',textTransform:'uppercase',
    padding:'6px 14px',borderRadius:'var(--radius-pill)',
    ...tones[tone],...style,
  }},icon,children);
}
