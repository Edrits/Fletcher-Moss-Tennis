import React,{useEffect,useRef} from 'react';

/**
 * Icon wraps the Lucide icon set (CDN substitution — the source codebase has
 * no icon font/SVG set, only emoji). Requires the Lucide UMD script to be
 * loaded on the page: <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
 */
export function Icon({name,size=20,strokeWidth=1.75,color='currentColor',style}){
  const ref=useRef(null);
  useEffect(()=>{
    if(window.lucide&&ref.current){
      ref.current.innerHTML='';
      window.lucide.createIcons({icons:window.lucide.icons,nameAttr:'data-lucide'});
    }
  },[name]);
  return React.createElement('i',{ref,'data-lucide':name,style:{width:size,height:size,display:'inline-flex',color,strokeWidth,...style}});
}
