import React from 'react';

const fieldStyle={
  width:'100%',padding:'12px 14px',border:'1.5px solid var(--border-strong)',
  borderRadius:'var(--radius-sm)',fontSize:'var(--text-sm)',fontFamily:'var(--font-body)',
  color:'var(--text-body)',background:'var(--paper-0)',transition:'border-color var(--duration-fast) var(--ease-standard)',outline:'none',
};

export function TextField({label,type='text',placeholder,value,onChange,multiline,style}){
  const Tag=multiline?'textarea':'input';
  const [focus,setFocus]=React.useState(false);
  return React.createElement('label',{style:{display:'block',marginBottom:'var(--space-4)'}},
    label&&React.createElement('span',{style:{display:'block',fontWeight:600,fontSize:'var(--text-xs)',color:'var(--text-heading)',marginBottom:6,fontFamily:'var(--font-display)'}},label),
    React.createElement(Tag,{
      type:multiline?undefined:type,placeholder,value,onChange,
      onFocus:()=>setFocus(true),onBlur:()=>setFocus(false),
      style:{...fieldStyle,minHeight:multiline?140:undefined,resize:multiline?'vertical':undefined,
        borderColor:focus?'var(--color-focus)':'var(--border-strong)',...style},
    })
  );
}
