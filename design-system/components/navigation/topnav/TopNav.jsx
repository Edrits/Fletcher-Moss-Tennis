import React,{useState} from 'react';

export function TopNav({logo,title,subtitle,links=[],homeHref,active}){
  const [open,setOpen]=useState(false);
  return React.createElement('header',{style:{
    background:'linear-gradient(160deg,rgba(21,43,12,.97),rgba(45,80,22,.94))',
    padding:'12px 30px',boxShadow:'var(--shadow-md)',position:'sticky',top:0,zIndex:1000,
    fontFamily:'var(--font-display)',
  }},
    React.createElement('div',{style:{maxWidth:'var(--container-max)',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',gap:20}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:18,minWidth:0}},
        logo&&React.createElement('img',{src:logo,alt:title,style:{width:64,height:64,borderRadius:'50%',boxShadow:'var(--shadow-sm)',flexShrink:0}}),
        React.createElement('div',{style:{minWidth:0}},
          React.createElement('div',{style:{color:'var(--text-on-dark)',fontWeight:700,fontSize:'var(--text-md)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},title),
          subtitle&&React.createElement('div',{style:{color:'var(--text-on-dark-muted)',fontSize:'var(--text-xs)',fontWeight:500,whiteSpace:'nowrap'}},subtitle)
        )
      ),
      React.createElement('nav',{className:'fm-nav-desktop',style:{display:'flex',gap:22,alignItems:'center'}},
        links.map(l=>React.createElement('a',{key:l.label,href:l.href,style:{
          color:'var(--text-on-dark)',textDecoration:'none',fontWeight:600,fontSize:'var(--text-sm)',
          opacity:active===l.label?1:.82,borderBottom:active===l.label?'2px solid var(--text-on-dark)':'2px solid transparent',paddingBottom:2,
        }},l.label))
      ),
      React.createElement('button',{className:'fm-hamburger','aria-label':'Open menu',onClick:()=>setOpen(o=>!o),style:{
        display:'none',flexDirection:'column',gap:5,background:'none',border:'none',cursor:'pointer',padding:8,
      }},[0,1,2].map(i=>React.createElement('span',{key:i,style:{width:24,height:2,background:'#fff',borderRadius:2,display:'block'}})))
    ),
    open&&React.createElement('nav',{style:{display:'flex',flexDirection:'column',background:'rgba(21,43,12,.98)',position:'absolute',top:'100%',left:0,right:0}},
      links.map(l=>React.createElement('a',{key:l.label,href:l.href,onClick:()=>setOpen(false),style:{
        color:'#fff',textDecoration:'none',fontWeight:600,padding:'16px 25px',borderBottom:'1px solid rgba(255,255,255,.1)',
      }},l.label))
    ),
    React.createElement('style',null,'@media(max-width:900px){.fm-nav-desktop{display:none!important}.fm-hamburger{display:flex!important}}')
  );
}
