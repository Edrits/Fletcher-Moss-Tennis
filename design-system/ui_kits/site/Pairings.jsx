const {useState}=React;
const {TopNav,Footer,Card,Button,Badge,SectionHeading,TextField,Icon}=window.FletcherMossDesignSystem_7e4605;

const DEFAULT_PLAYERS=['Alex','Sam','Priya','Jordan','Chris','Nina','Owen','Maya','Ravi','Tom'];

function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function Pairings({onNavigate,imgBase='../../assets/'}){
  const [raw,setRaw]=useState(DEFAULT_PLAYERS.join('\n'));
  const [courts,setCourts]=useState(null);
  const [sitting,setSitting]=useState([]);

  function generate(){
    const players=shuffle(raw.split('\n').map(s=>s.trim()).filter(Boolean));
    const perCourt=4;
    const numCourts=Math.floor(players.length/perCourt);
    const playing=players.slice(0,numCourts*perCourt);
    const sit=players.slice(numCourts*perCourt);
    const cs=[];
    for(let i=0;i<numCourts;i++){
      const four=playing.slice(i*4,i*4+4);
      cs.push({court:i+1,teamA:[four[0],four[1]],teamB:[four[2],four[3]]});
    }
    setCourts(cs);setSitting(sit);
  }

  return (
    <div style={{fontFamily:'var(--font-body)',background:'var(--gradient-page)',minHeight:'100vh'}}>
      <TopNav logo={imgBase+'logo/fletcher-moss-logo.png'} title="Fletcher Moss Social Tennis Club" subtitle="Court Pairings" links={[{label:'Home',href:'#',onClick:()=>onNavigate?.('home')}]} active=""/>

      <div style={{maxWidth:'var(--container-narrow)',margin:'0 auto',padding:'56px 24px 100px'}}>
        <SectionHeading kicker="Session tool" title="Generate tonight's pairings" align="left"/>

        <Card style={{marginBottom:24}}>
          <h3 style={{fontFamily:'var(--font-display)',color:'var(--text-heading)',marginTop:0,fontSize:'var(--text-md)'}}>Who's playing tonight?</h3>
          <p style={{color:'var(--text-muted)',fontSize:'var(--text-sm)',marginTop:0}}>One name per line. We'll randomise courts and rotate anyone sitting out.</p>
          <TextField multiline value={raw} onChange={e=>setRaw(e.target.value)} style={{minHeight:160,fontFamily:'var(--font-body)'}}/>
          <Button variant="primary" size="lg" icon={<Icon name="shuffle" size={18}/>} onClick={generate} style={{width:'100%',justifyContent:'center'}}>Generate pairings</Button>
        </Card>

        {courts&&(
          <>
            {sitting.length>0?(
              <div style={{background:'var(--gold-100)',border:'1px solid var(--gold-300)',borderRadius:'var(--radius-md)',padding:'12px 16px',marginBottom:20,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <span style={{fontSize:'var(--text-2xs)',fontWeight:700,letterSpacing:'var(--tracking-wider)',textTransform:'uppercase',color:'var(--color-sub)'}}>Sitting out</span>
                {sitting.map(p=><Badge key={p} tone="sub">{p}</Badge>)}
              </div>
            ):(
              <div style={{background:'var(--green-50)',border:'1px solid var(--green-200)',borderRadius:'var(--radius-md)',padding:'12px 16px',marginBottom:20,color:'var(--green-800)',fontWeight:600,fontSize:'var(--text-sm)'}}>Everyone's on a court tonight.</div>
            )}
            {courts.map(c=>(
              <Card key={c.court} style={{marginBottom:14,padding:0,overflow:'hidden'}}>
                <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',gap:8}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:'var(--green-600)'}}/>
                  <span style={{fontSize:'var(--text-2xs)',fontWeight:800,letterSpacing:'var(--tracking-wider)',textTransform:'uppercase',color:'var(--text-muted)'}}>Court {c.court}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 38px 1fr',alignItems:'center',padding:'16px 14px',gap:8}}>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'var(--text-muted)',textAlign:'center',marginBottom:2}}>Team A</div>
                    {c.teamA.map(p=><div key={p} style={{background:'var(--green-50)',border:'1px solid var(--green-200)',color:'var(--green-800)',borderRadius:7,padding:8,fontWeight:600,fontSize:13,textAlign:'center'}}>{p}</div>)}
                  </div>
                  <div style={{textAlign:'center'}}><span style={{display:'inline-block',width:30,height:30,borderRadius:'50%',border:'2px solid var(--border-strong)',fontSize:9,fontWeight:900,color:'var(--text-muted)',lineHeight:'26px'}}>VS</span></div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'var(--text-muted)',textAlign:'center',marginBottom:2}}>Team B</div>
                    {c.teamB.map(p=><div key={p} style={{background:'var(--green-50)',border:'1px solid var(--green-200)',color:'var(--green-800)',borderRadius:7,padding:8,fontWeight:600,fontSize:13,textAlign:'center'}}>{p}</div>)}
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      <Footer logo={imgBase+'logo/fletcher-moss-logo.png'} partnerLogo={imgBase+'logo/mcractive-logo.jpg'} name="Fletcher Moss Social Tennis Club"
        address={<>Fletcher Moss Park<br/>Didsbury, Manchester<br/>M20 2SW</>}
        sessions={<>Monday 6:00 – 8:00 PM<br/>Thursday 6:00 – 8:00 PM<br/>Saturday 11:00 AM – 2:00 PM</>}/>
    </div>
  );
}
window.Pairings=Pairings;
