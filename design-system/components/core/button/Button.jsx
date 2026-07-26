import React from 'react';

const base={
  fontFamily:'var(--font-display)',
  fontWeight:600,
  border:'none',
  borderRadius:'var(--radius-sm)',
  cursor:'pointer',
  display:'inline-flex',
  alignItems:'center',
  justifyContent:'center',
  gap:8,
  transition:'transform var(--duration-fast) var(--ease-standard),box-shadow var(--duration-fast) var(--ease-standard),background var(--duration-fast) var(--ease-standard)',
  textDecoration:'none',
};

const sizes={
  sm:{padding:'8px 16px',fontSize:'var(--text-xs)'},
  md:{padding:'12px 24px',fontSize:'var(--text-sm)'},
  lg:{padding:'15px 30px',fontSize:'var(--text-base)'},
};

const variants={
  primary:{background:'var(--green-600)',color:'var(--text-on-dark)',boxShadow:'var(--shadow-sm)'},
  secondary:{background:'transparent',color:'var(--green-900)',border:'1.5px solid var(--green-900)'},
  inverse:{background:'rgba(250,249,245,.96)',color:'var(--green-900)',boxShadow:'var(--shadow-sm)'},
  whatsapp:{background:'var(--color-whatsapp)',color:'var(--text-on-dark)',boxShadow:'var(--shadow-sm)'},
  ghost:{background:'transparent',color:'var(--green-700)',padding:0},
};

const hoverBg={primary:'var(--green-700)',whatsapp:'#1f7d59',inverse:'#fff',secondary:'var(--green-900)'};

export function Button({children,variant='primary',size='md',as:Tag='button',icon,style,...rest}){
  const [hover,setHover]=React.useState(false);
  const v=variants[variant]||variants.primary;
  const s=variant==='ghost'?{}:sizes[size];
  const hoverStyle=hover?(variant==='secondary'?{background:'var(--green-900)',color:'var(--text-on-dark)'}:variant==='ghost'?{textDecoration:'underline'}:{background:hoverBg[variant],transform:'translateY(-2px)',boxShadow:'var(--shadow-md)'}):{};
  return React.createElement(Tag,{
    ...rest,
    onMouseEnter:()=>setHover(true),
    onMouseLeave:()=>setHover(false),
    style:{...base,...s,...v,...hoverStyle,...style},
  },icon,children);
}
