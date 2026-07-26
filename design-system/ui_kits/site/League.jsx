const {useState}=React;
const {TopNav,Footer,Card,Button,Badge,SectionHeading,Select,TextField,Icon}=window.FletcherMossDesignSystem_7e4605;

const NAV=[{label:'Home',href:'#'}];

const BOXES=[
  {name:'Box A',players:[
    {name:'Alex R.',pts:9,played:4},{name:'Sam T.',pts:7,played:4},{name:'Priya K.',pts:6,played:3},{name:'Jordan M.',pts:4,played:4},
  ]},
  {name:'Box B',players:[
    {name:'Chris L.',pts:8,played:3},{name:'Nina F.',pts:6,played:3},{name:'Owen D.',pts:5,played:4},{name:'Maya S.',pts:3,played:3},
  ]},
];

function League({onNavigate,imgBase='../../assets/'}){
  const [adminOpen,setAdminOpen]=useState(false);
  const [box,setBox]=useState('');
  const [submitted,setSubmitted]=useState(false);

  return (
    <div style={{fontFamily:'var(--font-body)',background:'var(--gradient-page)',minHeight:'100vh'}}>
      <TopNav logo={imgBase+'logo/fletcher-moss-logo.png'} title="Fletcher Moss Social Tennis Club" subtitle="FMST Singles League" links={[{label:'Home',href:'#',onClick:()=>onNavigate?.('home')}]} active=""/>

      <div style={{maxWidth:'var(--container-max)',margin:'0 auto',padding:'56px 30px 100px'}}>
        <SectionHeading kicker="Season standings" title="FMST Singles League" align="left"/>
        <p style={{color:'var(--text-muted)',marginTop:-20,marginBottom:32}}>Points: <strong>3</strong> for a win · <strong>1</strong> for playing · <strong>0</strong> for a no-show. Walkovers count as wins.</p>

        <div style={{textAlign:'right',marginBottom:24}}>
          <Button variant="secondary" size="sm" icon={<Icon name="shield" size={14}/>} onClick={()=>setAdminOpen(o=>!o)}>Admin portal</Button>
        </div>

        {adminOpen&&(
          <Card style={{marginBottom:32,background:'var(--gold-100)'}}>
            <h3 style={{fontFamily:'var(--font-display)',color:'var(--brown-800)',marginTop:0}}>Admin — player & match management</h3>
            <TextField label="Admin password" type="password" placeholder="Enter admin password"/>
            <p style={{fontSize:'var(--text-xs)',color:'var(--text-muted)'}}>Edit player names, undo match results, or reset the league from here (demo — not wired to live data).</p>
          </Card>
        )}

        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:24,marginBottom:48}}>
          {BOXES.map(b=>(
            <Card key={b.name}>
              <h3 style={{fontFamily:'var(--font-display)',color:'var(--text-heading)',borderBottom:'1px solid var(--border-subtle)',paddingBottom:10,marginTop:0}}>{b.name}</h3>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'var(--text-sm)'}}>
                <thead><tr style={{background:'var(--green-50)'}}>
                  <th style={{textAlign:'left',padding:10,color:'var(--green-800)'}}>Player</th>
                  <th style={{textAlign:'right',padding:10,color:'var(--green-800)'}}>Played</th>
                  <th style={{textAlign:'right',padding:10,color:'var(--green-800)'}}>Points</th>
                </tr></thead>
                <tbody>
                  {b.players.sort((a,c)=>c.pts-a.pts).map(p=>(
                    <tr key={p.name}><td style={{padding:10,borderBottom:'1px solid var(--border-subtle)'}}>{p.name}</td>
                      <td style={{padding:10,textAlign:'right',borderBottom:'1px solid var(--border-subtle)'}}>{p.played}</td>
                      <td style={{padding:10,textAlign:'right',borderBottom:'1px solid var(--border-subtle)',fontWeight:700,color:'var(--green-700)'}}>{p.pts}</td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
        </div>

        <Card style={{background:'var(--green-50)'}}>
          <h3 style={{fontFamily:'var(--font-display)',color:'var(--text-heading)',marginTop:0}}>Submit match result</h3>
          {submitted?(
            <p style={{color:'var(--green-700)',fontWeight:600}}>Result submitted — thanks! Standings update on save.</p>
          ):(
            <form onSubmit={e=>{e.preventDefault();setSubmitted(true);}} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={{gridColumn:'1/-1'}}><Select label="League" placeholder="Select league…" value={box} onChange={e=>setBox(e.target.value)} options={BOXES.map(b=>({value:b.name,label:b.name}))}/></div>
              <Select label="Player 1" placeholder="Select league first" options={box?BOXES.find(b=>b.name===box).players.map(p=>({value:p.name,label:p.name})):[]}/>
              <Select label="Player 2" placeholder="Select league first" options={box?BOXES.find(b=>b.name===box).players.map(p=>({value:p.name,label:p.name})):[]}/>
              <div style={{gridColumn:'1/-1'}}><Button variant="primary" size="md" as="button" type="submit">Submit result</Button></div>
            </form>
          )}
        </Card>
      </div>

      <Footer logo={imgBase+'logo/fletcher-moss-logo.png'} partnerLogo={imgBase+'logo/mcractive-logo.jpg'} name="Fletcher Moss Social Tennis Club"
        address={<>Fletcher Moss Park<br/>Didsbury, Manchester<br/>M20 2SW</>}
        sessions={<>Monday 6:00 – 8:00 PM<br/>Thursday 6:00 – 8:00 PM<br/>Saturday 11:00 AM – 2:00 PM</>}/>
    </div>
  );
}
window.League=League;
