import React from 'react';

export function Footer({logo,partnerLogo,name,address,sessions}){
  return React.createElement('footer',{style:{
    background:'var(--gradient-band-green)',color:'var(--text-on-dark)',textAlign:'center',padding:'56px 20px',
  }},
    React.createElement('div',{style:{maxWidth:'var(--container-narrow)',margin:'0 auto'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',gap:36,flexWrap:'wrap',marginBottom:28}},
        logo&&React.createElement('img',{src:logo,style:{height:96,borderRadius:'50%',boxShadow:'var(--shadow-md)'}}),
        partnerLogo&&React.createElement('img',{src:partnerLogo,style:{height:70,filter:'brightness(0) invert(1)',opacity:.9}})
      ),
      React.createElement('p',{style:{fontFamily:'var(--font-display)',fontWeight:600,fontSize:'var(--text-md)',opacity:.95}},name),
      React.createElement('div',{style:{display:'flex',justifyContent:'center',gap:56,flexWrap:'wrap',marginTop:26,paddingTop:26,borderTop:'1px solid rgba(255,255,255,.18)'}},
        React.createElement('div',null,
          React.createElement('h4',{style:{fontSize:'var(--text-2xs)',opacity:.65,marginBottom:8,textTransform:'uppercase',letterSpacing:'var(--tracking-wider)'}},'Location'),
          React.createElement('p',{style:{opacity:.9,lineHeight:'var(--leading-normal)'}},address)
        ),
        React.createElement('div',null,
          React.createElement('h4',{style:{fontSize:'var(--text-2xs)',opacity:.65,marginBottom:8,textTransform:'uppercase',letterSpacing:'var(--tracking-wider)'}},'Sessions'),
          React.createElement('p',{style:{opacity:.9,lineHeight:'var(--leading-normal)'}},sessions)
        )
      )
    )
  );
}
