import React from 'react';

export function Select({label,options=[],value,onChange,placeholder}){
  return React.createElement('label',{style:{display:'block',marginBottom:'var(--space-4)'}},
    label&&React.createElement('span',{style:{display:'block',fontWeight:600,fontSize:'var(--text-xs)',color:'var(--text-heading)',marginBottom:6,fontFamily:'var(--font-display)'}},label),
    React.createElement('select',{value,onChange,style:{
      width:'100%',padding:'12px 14px',border:'1.5px solid var(--border-strong)',borderRadius:'var(--radius-sm)',
      fontSize:'var(--text-sm)',fontFamily:'var(--font-body)',color:'var(--text-body)',background:'var(--paper-0)',outline:'none',
    }},
      placeholder&&React.createElement('option',{value:''},placeholder),
      options.map(o=>React.createElement('option',{key:o.value,value:o.value},o.label))
    )
  );
}
