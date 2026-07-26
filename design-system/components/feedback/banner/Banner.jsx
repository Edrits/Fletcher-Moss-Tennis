import React from 'react';

const tones={
  alert:{background:'var(--color-alert-bg)',color:'#5c2418',border:'1px solid #e3bcb1'},
  notice:{background:'var(--gold-100)',color:'var(--brown-800)',border:'1px solid var(--gold-300)'},
};

export function Banner({tone='alert',icon,children,onClose}){
  return React.createElement('div',{style:{
    display:'flex',alignItems:'center',gap:12,justifyContent:'center',
    padding:'14px 20px',fontWeight:600,fontSize:'var(--text-sm)',fontFamily:'var(--font-body)',
    borderRadius:'var(--radius-sm)',...tones[tone],
  }},icon,React.createElement('span',null,children),
    onClose&&React.createElement('button',{onClick:onClose,style:{background:'none',border:'none',cursor:'pointer',color:'inherit',marginLeft:8,display:'flex'}},'✕')
  );
}
