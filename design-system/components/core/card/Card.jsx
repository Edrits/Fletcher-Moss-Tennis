import React from 'react';

const cardBase={
  background:'var(--surface-card)',
  borderRadius:'var(--radius-lg)',
  boxShadow:'var(--shadow-sm)',
  transition:'transform var(--duration-base) var(--ease-standard),box-shadow var(--duration-base) var(--ease-standard)',
};

export function Card({children,hoverable=true,padding=24,style,...rest}){
  const [hover,setHover]=React.useState(false);
  return React.createElement('div',{
    ...rest,
    onMouseEnter:()=>hoverable&&setHover(true),
    onMouseLeave:()=>hoverable&&setHover(false),
    style:{...cardBase,padding,transform:hover?'translateY(-3px)':'none',boxShadow:hover?'var(--shadow-md)':'var(--shadow-sm)',...style},
  },children);
}

export function InfoCard({title,icon,children,style}){
  return React.createElement(Card,{padding:26,style:{display:'flex',flexDirection:'column',gap:10,...style}},
    React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
      icon,
      React.createElement('h3',{style:{fontFamily:'var(--font-display)',fontWeight:600,fontSize:'var(--text-md)',color:'var(--text-heading)',margin:0}},title)
    ),
    React.createElement('p',{style:{margin:0,color:'var(--text-muted)',fontSize:'var(--text-sm)',lineHeight:'var(--leading-normal)'}},children)
  );
}

export function NoticeCard({children,empty=false}){
  return React.createElement('div',{style:{
    background:'var(--gradient-gold)',
    border:'1px solid var(--border-subtle)',
    borderRadius:'var(--radius-lg)',
    padding:28,
    boxShadow:'var(--shadow-sm)',
  }},
    React.createElement('div',{style:{
      background:'var(--surface-card)',
      borderRadius:'var(--radius-md)',
      padding:24,
      minHeight:120,
      whiteSpace:'pre-wrap',
      fontSize:'var(--text-base)',
      lineHeight:'var(--leading-normal)',
      color:empty?'var(--brown-600)':'var(--text-body)',
      fontStyle:empty?'italic':'normal',
      textAlign:empty?'center':'left',
      boxShadow:'var(--shadow-inset)',
    }},children)
  );
}
