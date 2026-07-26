import React from 'react';

export function SectionHeading({kicker,title,align='center',inverse=false,style}){
  return React.createElement('div',{style:{textAlign:align,marginBottom:'var(--space-8)',...style}},
    kicker&&React.createElement('div',{style:{
      fontFamily:'var(--font-body)',fontWeight:700,fontSize:'var(--text-2xs)',
      letterSpacing:'var(--tracking-wider)',textTransform:'uppercase',
      color:inverse?'var(--text-on-dark-muted)':'var(--green-600)',marginBottom:10,
    }},kicker),
    React.createElement('h2',{style:{
      fontFamily:'var(--font-display)',fontWeight:600,fontSize:'var(--text-2xl)',
      lineHeight:'var(--leading-tight)',color:inverse?'var(--text-on-dark)':'var(--text-heading)',margin:0,
    }},title)
  );
}
