const {useState,useEffect}=React;
const {TopNav,Footer,Card,InfoCard,NoticeCard,Button,Badge,SectionHeading,Banner,Icon}=window.FletcherMossDesignSystem_7e4605;

const NAV=[
  {label:'About',href:'#about'},{label:'Sessions',href:'#sessions'},{label:'Noticeboard',href:'#noticeboard'},
  {label:'Weather',href:'#weather'},{label:'Join',href:'#join'},{label:'Location',href:'#location'},
  {label:'Singles League',href:'#league'},{label:'Pairings',href:'#pairings'},
];

function Home({onNavigate,imgBase='../../assets/'}){
  const [temp,setTemp]=useState('16°C');
  const [conditions,setConditions]=useState('Partly cloudy');
  const [rain,setRain]=useState('20%');
  useEffect(()=>{ /* static demo values — the real page fetches open-meteo live */ },[]);

  return (
    <div style={{fontFamily:'var(--font-body)',background:'var(--gradient-page)'}}>
      <TopNav logo={imgBase+'logo/fletcher-moss-logo.png'} title="Fletcher Moss Social Tennis Club" subtitle="Didsbury Social Tennis" links={[...NAV,{label:'Singles League',href:'#',onClick:()=>onNavigate?.('league')}]} active="About"/>

      <div style={{position:'relative',height:620,overflow:'hidden'}}>
        <img src={imgBase+'imagery/courts-drone-aerial.jpg'} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
        <div style={{position:'absolute',inset:0,background:'var(--gradient-hero-scrim)'}}/>
        <div style={{position:'relative',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:20,gap:22}}>
          <Badge tone="weather" icon={<Icon name="cloud-sun" size={14}/>}>{temp} · {conditions} · {rain} rain</Badge>
          <h1 style={{fontFamily:'var(--font-display)',fontWeight:600,fontSize:'var(--text-4xl)',color:'#fff',maxWidth:820,lineHeight:'var(--leading-tight)',textShadow:'0 2px 20px rgba(0,0,0,.45)'}}>Free social tennis, right in the heart of Didsbury</h1>
          <p style={{fontSize:'var(--text-lg)',color:'rgba(255,255,255,.92)',maxWidth:560}}>Community-run, all abilities welcome — just turn up and play.</p>
          <div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center'}}>
            <Button as="a" href="#about" variant="inverse" size="lg">Learn more</Button>
            <Button as="a" href="#join" variant="primary" size="lg">Join now</Button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:'var(--container-max)',margin:'-64px auto 0',padding:'0 30px 100px',position:'relative'}}>

        <section id="about" style={{marginBottom:88}}>
          <SectionHeading kicker="Who we are" title="Free social tennis in Didsbury"/>
          <Card style={{marginBottom:24}}>
            <div style={{display:'flex',alignItems:'center',gap:24,flexWrap:'wrap',marginBottom:16}}>
              <h3 style={{fontFamily:'var(--font-display)',color:'var(--text-heading)',fontSize:'var(--text-lg)',flex:1,minWidth:200,margin:0}}>About us</h3>
              <img src={imgBase+'logo/mcractive-logo.jpg'} style={{height:56}}/>
            </div>
            <p style={{color:'var(--text-muted)',fontSize:'var(--text-base)',lineHeight:'var(--leading-normal)',margin:0}}>
              Community-run tennis organised by volunteers who give their time freely, supported by <a href="https://mcractive.com/" style={{color:'var(--text-link)',fontWeight:600}}>McrActive</a> to provide accessible tennis for Didsbury and South Manchester. An inclusive, friendly environment where fun and social connection are at the heart of every session.
            </p>
          </Card>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:20}}>
            <InfoCard title="Sociable & inclusive" icon={<Icon name="users" color="var(--green-700)"/>}>Warm, friendly atmosphere where everyone's welcome. Random partnering keeps things fresh and helps you meet new people.</InfoCard>
            <InfoCard title="Beautiful location" icon={<Icon name="trees" color="var(--green-700)"/>}>Set in the lovely surroundings of Fletcher Moss Park — a great way to exercise, unwind, and enjoy the outdoors.</InfoCard>
            <InfoCard title="No fees or contracts" icon={<Icon name="banknote" color="var(--green-700)"/>}>No membership fees or contracts. Just a small contribution towards balls every few months to keep things running.</InfoCard>
            <InfoCard title="Your first session" icon={<Icon name="sparkles" color="var(--green-700)"/>}>Just turn up, introduce yourself and you'll be paired up straight away. We rotate partners so you'll play with everyone.</InfoCard>
          </div>
        </section>

        <section id="sessions" style={{marginBottom:88}}>
          <SectionHeading kicker="When we play" title="Session times"/>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
            {[['Monday','6:00 – 8:00 PM'],['Thursday','6:00 – 8:00 PM'],['Saturday','11:00 AM – 2:00 PM']].map(([d,t])=>(
              <Card key={d} style={{textAlign:'center'}}><div style={{fontFamily:'var(--font-display)',fontWeight:600,fontSize:'var(--text-lg)',color:'var(--text-heading)'}}>{d}</div><div style={{color:'var(--text-muted)',marginTop:6}}>{t}</div></Card>
            ))}
          </div>
        </section>

        <section id="noticeboard" style={{marginBottom:88}}>
          <SectionHeading kicker="What's on" title="Noticeboard"/>
          <NoticeCard empty>No current updates — check back soon!</NoticeCard>
          <div style={{textAlign:'right',marginTop:12}}><Button variant="ghost" size="sm">Admin</Button></div>
        </section>

        <section id="weather" style={{marginBottom:88}}>
          <SectionHeading kicker="Before you head out" title="Court weather check"/>
          <div style={{background:'var(--gradient-sky)',borderRadius:'var(--radius-xl)',padding:36,color:'#fff',textAlign:'center',boxShadow:'var(--shadow-md)'}}>
            <div style={{fontFamily:'var(--font-display)',fontWeight:600,fontSize:'var(--text-xl)'}}>Didsbury conditions</div>
            <p style={{opacity:.9,marginTop:6}}>Check the weather before heading to the courts.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,marginTop:24}}>
              {[['Temperature',temp],['Conditions',conditions],['Rain chance',rain]].map(([l,v])=>(
                <div key={l} style={{background:'rgba(255,255,255,.16)',backdropFilter:'blur(var(--blur-glass))',border:'1px solid rgba(255,255,255,.3)',borderRadius:'var(--radius-md)',padding:'18px 12px'}}>
                  <div style={{fontSize:'var(--text-xs)',opacity:.85,marginBottom:8}}>{l}</div><div style={{fontSize:'var(--text-xl)',fontWeight:700,fontFamily:'var(--font-display)'}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{marginBottom:88}}>
          <SectionHeading kicker="Getting involved" title="How it works"/>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:20,marginBottom:24}}>
            <InfoCard title="Join the WhatsApp group" icon={<Icon name="message-circle" color="var(--green-700)"/>}>All coordination happens via WhatsApp. Scan the QR code below to request access.</InfoCard>
            <InfoCard title="£10 contribution" icon={<Icon name="banknote" color="var(--green-700)"/>}>Payment covers new tennis balls, collected every 3–6 months as needed.</InfoCard>
          </div>
          <Card style={{background:'var(--gold-100)',boxShadow:'var(--shadow-sm)'}}>
            <p style={{margin:0,color:'var(--brown-800)',lineHeight:'var(--leading-normal)'}}><strong>Skill level:</strong> we welcome intermediate to advanced players. Beginners are advised to get some lessons first to feel comfortable with the basics before requesting to join.</p>
            <p style={{margin:'14px 0 0',color:'var(--brown-800)',lineHeight:'var(--leading-normal)'}}><strong>Risk assessment:</strong> while organisers conduct informal safety checks before each session, all participants play at their own risk and are responsible for their own safety.</p>
          </Card>
        </section>

        <section id="join" style={{marginBottom:88,textAlign:'center'}}>
          <SectionHeading kicker="Ready to play?" title="Join our WhatsApp group"/>
          <p style={{color:'var(--text-muted)',maxWidth:520,margin:'0 auto 20px',lineHeight:'var(--leading-normal)'}}>All session updates, cancellations and banter happen on WhatsApp. Scan the code below to request access — we'll get you on court as soon as possible.</p>
          <img src={imgBase+'imagery/court-shot-night.jpg'} style={{width:220,height:220,objectFit:'cover',borderRadius:'var(--radius-lg)',boxShadow:'var(--shadow-lg)',marginBottom:20}}/>
          <div><Button variant="whatsapp" size="lg" icon={<Icon name="message-circle" size={18}/>}>Tap to join via WhatsApp</Button></div>
        </section>

        <section id="location">
          <SectionHeading kicker="Find us" title="Fletcher Moss Park tennis courts"/>
          <p style={{textAlign:'center',color:'var(--text-muted)',marginBottom:24}}>Didsbury, Manchester M20 2SW</p>
          <div style={{position:'relative',height:340,borderRadius:'var(--radius-xl)',overflow:'hidden',boxShadow:'var(--shadow-lg)'}}>
            <img src={imgBase+'imagery/park-path-autumn.jpg'} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(21,43,12,.25),rgba(21,43,12,.55))',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',color:'#fff',textAlign:'center',padding:20}}>
              <h3 style={{fontFamily:'var(--font-display)',fontSize:'var(--text-2xl)',margin:0}}>Play at Fletcher Moss</h3>
              <p style={{marginTop:10,fontSize:'var(--text-md)'}}>Beautiful outdoor courts in the heart of Didsbury</p>
            </div>
          </div>
        </section>
      </div>

      <Footer logo={imgBase+'logo/fletcher-moss-logo.png'} partnerLogo={imgBase+'logo/mcractive-logo.jpg'} name="Fletcher Moss Social Tennis Club"
        address={<>Fletcher Moss Park<br/>Didsbury, Manchester<br/>M20 2SW, United Kingdom</>}
        sessions={<>Monday 6:00 – 8:00 PM<br/>Thursday 6:00 – 8:00 PM<br/>Saturday 11:00 AM – 2:00 PM</>}/>
    </div>
  );
}
window.Home=Home;
