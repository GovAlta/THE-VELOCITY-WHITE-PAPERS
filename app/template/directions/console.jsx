// Direction C — Operations Console
// Dark, dense, agentic-ops dashboard aesthetic.
// Geist (sans) + JetBrains Mono. Bloomberg/Sentry/Linear-meets-SRE-console.

const opTheme = {
  bg: '#0A0C0E',
  panel: '#13161B',
  panelHi: '#1A1E25',
  border: '#262B33',
  borderHi: '#383F4A',
  ink: '#E6E9EE',
  ink70: '#9098A3',
  ink50: '#646C77',
  ink30: '#3B424C',
  green: '#4AE39A',
  greenDim: '#1F6A48',
  amber: '#F5A623',
  amberDim: '#704C10',
  magenta: '#E94BBC',
  blue: '#5BB8FF',
  red: '#FF5C5C',
};

const opCSS = `
  .op { font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color: ${opTheme.ink}; background: ${opTheme.bg}; height: 100%; overflow: hidden; display: flex; flex-direction: column; font-size: 13.5px; }
  .op .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
  .op a { color: inherit; text-decoration: none; cursor: pointer; }
  .op *::selection { background: ${opTheme.green}; color: ${opTheme.bg}; }

  /* Top status bar (always visible) */
  .op-status { display: flex; align-items: center; justify-content: space-between; padding: 0 16px; height: 28px; background: ${opTheme.panel}; border-bottom: 1px solid ${opTheme.border}; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${opTheme.ink70}; flex: 0 0 auto; }
  .op-status .group { display: flex; gap: 18px; align-items: center; }
  .op-status .pip { display: inline-flex; align-items: center; gap: 6px; }
  .op-status .pip .dot { width: 6px; height: 6px; border-radius: 50%; background: ${opTheme.green}; box-shadow: 0 0 6px ${opTheme.green}; animation: oppulse 2.4s ease-in-out infinite; }
  .op-status .pip.amber .dot { background: ${opTheme.amber}; box-shadow: 0 0 6px ${opTheme.amber}; }
  .op-status .pip .k { color: ${opTheme.ink50}; }
  .op-status .pip .v { color: ${opTheme.ink}; }
  @keyframes oppulse { 0%,100%{opacity:1;} 50%{opacity:.45;} }
  @keyframes opscan {
    0%{transform: translateX(-100%);}
    100%{transform: translateX(100%);}
  }
  @keyframes opdash { to { stroke-dashoffset: -24; } }

  /* Navigation row */
  .op-nav { display: flex; align-items: center; justify-content: space-between; padding: 14px 22px; background: ${opTheme.bg}; border-bottom: 1px solid ${opTheme.border}; flex: 0 0 auto; }
  .op-nav .brand { display: flex; align-items: center; gap: 14px; }
  .op-nav .logomark { width: 22px; height: 22px; border: 1.5px solid ${opTheme.green}; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${opTheme.green}; position: relative; }
  .op-nav .logomark::after { content: ''; position: absolute; inset: 2px; border: 1px solid ${opTheme.greenDim}; }
  .op-nav .wordmark { font-family: 'JetBrains Mono', monospace; font-size: 14px; letter-spacing: 0.1em; }
  .op-nav .wordmark .sub { color: ${opTheme.ink50}; padding-left: 6px; }
  .op-nav .crumb { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${opTheme.ink50}; letter-spacing: 0.04em; padding-left: 14px; margin-left: 14px; border-left: 1px solid ${opTheme.border}; }
  .op-nav .crumb .here { color: ${opTheme.ink}; }
  .op-nav .links { display: flex; gap: 4px; }
  .op-nav .links a { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; padding: 5px 12px; letter-spacing: 0.04em; border: 1px solid transparent; border-radius: 3px; }
  .op-nav .links a:hover { background: ${opTheme.panel}; border-color: ${opTheme.border}; }
  .op-nav .links a.active { background: ${opTheme.panelHi}; border-color: ${opTheme.borderHi}; color: ${opTheme.green}; }
  .op-nav .cmd { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${opTheme.ink50}; padding: 4px 10px; border: 1px solid ${opTheme.border}; border-radius: 3px; background: ${opTheme.panel}; }
  .op-nav .cmd .kbd { color: ${opTheme.ink}; padding-left: 6px; }

  /* Main */
  .op-main { flex: 1 1 auto; overflow-y: auto; overflow-x: hidden; }
  .op-main::-webkit-scrollbar { width: 10px; }
  .op-main::-webkit-scrollbar-thumb { background: ${opTheme.borderHi}; border-radius: 0; }
  .op-main::-webkit-scrollbar-track { background: ${opTheme.bg}; }

  /* Landing grid */
  .op-land { display: grid; grid-template-columns: 1fr 320px; gap: 0; min-height: 100%; }
  .op-land .col-l { padding: 0; border-right: 1px solid ${opTheme.border}; }
  .op-land .col-r { background: ${opTheme.panel}; }

  /* Hero panel */
  .op-hero { padding: 32px 32px 28px; border-bottom: 1px solid ${opTheme.border}; }
  .op-hero .label { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${opTheme.green}; letter-spacing: 0.12em; margin-bottom: 14px; }
  .op-hero h1 { font-family: 'Geist', sans-serif; font-weight: 500; font-size: 38px; line-height: 1.08; letter-spacing: -0.025em; margin: 0 0 16px; max-width: 24ch; }
  .op-hero h1 .accent { color: ${opTheme.green}; }
  .op-hero p { color: ${opTheme.ink70}; font-size: 14.5px; line-height: 1.55; max-width: 64ch; margin: 0; }
  .op-hero .term { margin-top: 22px; background: ${opTheme.panel}; border: 1px solid ${opTheme.border}; border-radius: 4px; padding: 12px 14px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.7; max-width: 70ch; }
  .op-hero .term .ln { display: flex; gap: 8px; }
  .op-hero .term .ln .pr { color: ${opTheme.green}; }
  .op-hero .term .ln .o { color: ${opTheme.ink70}; }
  .op-hero .term .ln .v { color: ${opTheme.ink}; }
  .op-hero .term .ln .m { color: ${opTheme.amber}; }
  .op-hero .term .ln .c { color: ${opTheme.ink50}; }
  .op-hero .term .cur { display: inline-block; width: 8px; height: 14px; background: ${opTheme.green}; vertical-align: middle; animation: oppulse 1.1s steps(2) infinite; margin-left: 2px; }

  /* Stat grid */
  .op-statgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: ${opTheme.border}; border-bottom: 1px solid ${opTheme.border}; }
  .op-stat { background: ${opTheme.bg}; padding: 16px 18px; position: relative; overflow: hidden; }
  .op-stat::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: ${opTheme.green}; opacity: 0.5; }
  .op-stat.amber::after { background: ${opTheme.amber}; }
  .op-stat.magenta::after { background: ${opTheme.magenta}; }
  .op-stat.blue::after { background: ${opTheme.blue}; }
  .op-stat .k { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${opTheme.ink50}; margin-bottom: 6px; }
  .op-stat .v { font-family: 'Geist', sans-serif; font-weight: 500; font-size: 28px; letter-spacing: -0.02em; line-height: 1; }
  .op-stat .delta { display: flex; gap: 6px; align-items: center; margin-top: 8px; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: ${opTheme.green}; }
  .op-stat .delta.amber { color: ${opTheme.amber}; }
  .op-stat .spark { position: absolute; right: 14px; top: 14px; opacity: 0.6; }

  /* Section header */
  .op-sect { padding: 24px 32px 8px; display: flex; align-items: center; justify-content: space-between; }
  .op-sect h2 { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0; color: ${opTheme.ink70}; display: flex; align-items: center; gap: 10px; }
  .op-sect h2 .bracket { color: ${opTheme.green}; }
  .op-sect .ctl { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${opTheme.ink50}; display: flex; gap: 10px; }
  .op-sect .ctl span { padding: 2px 8px; border: 1px solid ${opTheme.border}; border-radius: 2px; cursor: pointer; }
  .op-sect .ctl span.on { color: ${opTheme.green}; border-color: ${opTheme.greenDim}; background: rgba(74,227,154,0.08); }

  /* Paper list (dense table) */
  .op-papers { padding: 0 32px 24px; }
  .op-papers .hdr, .op-papers .row { display: grid; grid-template-columns: 70px 1fr 130px 110px 100px 80px; gap: 14px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; align-items: center; }
  .op-papers .hdr { color: ${opTheme.ink50}; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; border-bottom: 1px solid ${opTheme.border}; }
  .op-papers .row { border-bottom: 1px solid ${opTheme.border}; cursor: pointer; transition: background .12s; }
  .op-papers .row:hover { background: ${opTheme.panel}; }
  .op-papers .row .id { color: ${opTheme.green}; }
  .op-papers .row .title { color: ${opTheme.ink}; font-family: 'Geist', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: -0.005em; }
  .op-papers .row .title .sub { font-family: 'Geist', sans-serif; font-size: 12.5px; color: ${opTheme.ink50}; font-weight: 400; margin-top: 2px; line-height: 1.4; }
  .op-papers .row .track { color: ${opTheme.blue}; }
  .op-papers .row .authors { color: ${opTheme.ink70}; font-family: 'Geist', sans-serif; font-size: 12px; }
  .op-papers .row .read { color: ${opTheme.ink50}; }
  .op-papers .row .pill { padding: 2px 8px; border-radius: 2px; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; text-align: center; }
  .op-papers .row .pill.published { background: rgba(74,227,154,0.12); color: ${opTheme.green}; }
  .op-papers .row .pill.forthcoming { background: rgba(245,166,35,0.12); color: ${opTheme.amber}; }
  .op-papers .row .pill.draft { background: rgba(100,108,119,0.18); color: ${opTheme.ink70}; }

  /* Right column panels */
  .op-rpanel { border-bottom: 1px solid ${opTheme.border}; padding: 18px 22px; }
  .op-rpanel .ph { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .op-rpanel .ph .t { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${opTheme.ink70}; }
  .op-rpanel .ph .live { display: inline-flex; align-items: center; gap: 5px; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${opTheme.green}; }
  .op-rpanel .ph .live .d { width: 5px; height: 5px; background: ${opTheme.green}; border-radius: 50%; animation: oppulse 1.2s ease-in-out infinite; }
  .op-rpanel .feed .e { display: grid; grid-template-columns: 56px 1fr; gap: 10px; padding: 7px 0; border-bottom: 1px dotted ${opTheme.border}; font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 1.4; }
  .op-rpanel .feed .e .ts { color: ${opTheme.ink50}; }
  .op-rpanel .feed .e .msg { color: ${opTheme.ink70}; }
  .op-rpanel .feed .e .msg .tag { color: ${opTheme.green}; }
  .op-rpanel .feed .e .msg .tag.a { color: ${opTheme.amber}; }
  .op-rpanel .feed .e .msg .tag.m { color: ${opTheme.magenta}; }
  .op-rpanel .feed .e .msg .tag.b { color: ${opTheme.blue}; }

  .op-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .op-bar .l { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${opTheme.ink50}; min-width: 88px; }
  .op-bar .track { flex: 1; height: 6px; background: ${opTheme.panelHi}; border: 1px solid ${opTheme.border}; position: relative; overflow: hidden; }
  .op-bar .track .fill { position: absolute; left: 0; top: 0; bottom: 0; background: ${opTheme.green}; }
  .op-bar .track .fill.amber { background: ${opTheme.amber}; }
  .op-bar .track .fill.blue { background: ${opTheme.blue}; }
  .op-bar .v { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: ${opTheme.ink}; min-width: 40px; text-align: right; }

  /* Index page */
  .op-indexpage { padding: 24px 32px 48px; }
  .op-indexpage .ihdr { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px solid ${opTheme.border}; }
  .op-indexpage .ihdr h1 { font-family: 'Geist', sans-serif; font-weight: 500; font-size: 30px; letter-spacing: -0.02em; margin: 0; }
  .op-indexpage .ihdr h1 .m { color: ${opTheme.green}; font-family: 'JetBrains Mono', monospace; font-size: 18px; padding-right: 10px; }
  .op-indexpage .ihdr .meta { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${opTheme.ink50}; }
  .op-indexpage .cpalette { background: ${opTheme.panel}; border: 1px solid ${opTheme.border}; border-radius: 4px; padding: 12px 14px; margin-bottom: 22px; }
  .op-indexpage .cpalette .row { display: flex; gap: 14px; align-items: center; }
  .op-indexpage .cpalette .pr { font-family: 'JetBrains Mono', monospace; color: ${opTheme.green}; font-size: 13px; }
  .op-indexpage .cpalette input { flex: 1; background: transparent; border: 0; outline: none; font-family: 'JetBrains Mono', monospace; font-size: 13.5px; color: ${opTheme.ink}; }
  .op-indexpage .cpalette input::placeholder { color: ${opTheme.ink50}; }
  .op-indexpage .cpalette .kbd { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: ${opTheme.ink50}; }
  .op-indexpage .filters { display: flex; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid ${opTheme.border}; flex-wrap: wrap; }
  .op-indexpage .chip { font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 4px 10px; border: 1px solid ${opTheme.border}; border-radius: 2px; cursor: pointer; color: ${opTheme.ink70}; }
  .op-indexpage .chip.on { color: ${opTheme.green}; border-color: ${opTheme.greenDim}; background: rgba(74,227,154,0.08); }

  /* Detail page */
  .op-doc { display: grid; grid-template-columns: 220px 1fr 280px; gap: 0; min-height: 100%; }
  .op-doc .col-toc { border-right: 1px solid ${opTheme.border}; padding: 24px 18px 32px 28px; background: ${opTheme.panel}; position: sticky; top: 0; align-self: start; }
  .op-doc .back { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${opTheme.green}; cursor: pointer; margin-bottom: 22px; display: inline-flex; gap: 6px; }
  .op-doc .toc-l { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${opTheme.ink50}; margin: 14px 0 10px; }
  .op-doc .toc-r { display: grid; grid-template-columns: 28px 1fr; gap: 8px; padding: 7px 0; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; line-height: 1.35; border-bottom: 1px dotted ${opTheme.border}; color: ${opTheme.ink70}; }
  .op-doc .toc-r .n { color: ${opTheme.green}; }
  .op-doc .toc-r:hover { color: ${opTheme.ink}; background: rgba(74,227,154,0.04); }
  .op-doc .toc-r.active { color: ${opTheme.ink}; }
  .op-doc .toc-r.active .n { color: ${opTheme.magenta}; }
  .op-doc .col-main { padding: 28px 36px 48px; }
  .op-doc .dochead .filing { display: flex; gap: 14px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${opTheme.ink50}; margin-bottom: 16px; }
  .op-doc .dochead .filing .id { color: ${opTheme.green}; }
  .op-doc .dochead .filing .track { color: ${opTheme.blue}; }
  .op-doc .dochead h1 { font-family: 'Geist', sans-serif; font-weight: 500; font-size: 36px; line-height: 1.08; letter-spacing: -0.022em; margin: 0 0 12px; }
  .op-doc .dochead .deck { font-size: 16px; color: ${opTheme.ink70}; line-height: 1.5; max-width: 64ch; margin-bottom: 22px; }
  .op-doc .abstr { background: ${opTheme.panel}; border: 1px solid ${opTheme.border}; border-left: 2px solid ${opTheme.green}; padding: 16px 20px; margin-bottom: 28px; }
  .op-doc .abstr .l { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${opTheme.green}; margin-bottom: 8px; }
  .op-doc .abstr p { margin: 0; font-size: 14.5px; line-height: 1.6; color: ${opTheme.ink}; }
  .op-doc .body h3 { font-family: 'Geist', sans-serif; font-weight: 500; font-size: 20px; letter-spacing: -0.008em; margin: 30px 0 12px; display: flex; gap: 12px; align-items: baseline; }
  .op-doc .body h3 .n { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${opTheme.green}; }
  .op-doc .body p { font-size: 14px; line-height: 1.65; margin: 0 0 14px; color: ${opTheme.ink70}; }
  .op-doc .codeblock { background: ${opTheme.bg}; border: 1px solid ${opTheme.border}; padding: 14px 16px; margin: 18px 0; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; line-height: 1.7; }
  .op-doc .codeblock .c { color: ${opTheme.ink50}; }
  .op-doc .codeblock .k { color: ${opTheme.magenta}; }
  .op-doc .codeblock .s { color: ${opTheme.green}; }
  .op-doc .codeblock .v { color: ${opTheme.blue}; }
  .op-doc .col-aside { border-left: 1px solid ${opTheme.border}; background: ${opTheme.panel}; padding: 24px 22px 32px; }

  /* Architecture */
  .op-arch { padding: 24px 32px 48px; }
  .op-arch .top { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 22px; border-bottom: 1px solid ${opTheme.border}; padding-bottom: 18px; }
  .op-arch h1 { font-family: 'Geist', sans-serif; font-weight: 500; font-size: 30px; margin: 0 0 8px; letter-spacing: -0.02em; }
  .op-arch h1 .a { color: ${opTheme.green}; }
  .op-arch .deck { font-size: 14.5px; color: ${opTheme.ink70}; line-height: 1.5; max-width: 70ch; }
  .op-arch .legend { display: flex; gap: 18px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${opTheme.ink70}; margin: 12px 0 18px; }
  .op-arch .legend .key { display: inline-flex; align-items: center; gap: 6px; }
  .op-arch .legend .dot { width: 8px; height: 8px; border-radius: 50%; }
  .op-arch .figframe { background: ${opTheme.panel}; border: 1px solid ${opTheme.border}; padding: 18px; }
  .op-arch .fhdr { display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: ${opTheme.ink50}; padding-bottom: 12px; margin-bottom: 14px; border-bottom: 1px solid ${opTheme.border}; letter-spacing: 0.06em; }
  .op-arch .fhdr .ok { color: ${opTheme.green}; }
`;

function OpStatusBar() {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    const i = setInterval(() => setT(x => x + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const time = new Date(Date.UTC(2026, 4, 22, 14, 27, (t*7) % 60));
  const ts = time.toISOString().replace('T',' ').slice(0,19);
  return (
    <div className="op-status">
      <div className="group">
        <span className="pip"><span className="dot"></span><span className="k">FABRIC</span><span className="v">OPERATIONAL</span></span>
        <span className="pip"><span className="dot"></span><span className="k">AGENTS</span><span className="v">14,228 ACTIVE</span></span>
        <span className="pip amber"><span className="dot"></span><span className="k">QUEUE</span><span className="v">3,184 PENDING</span></span>
        <span className="pip"><span className="dot"></span><span className="k">PRs OPEN</span><span className="v">6,402</span></span>
      </div>
      <div className="group">
        <span>REGION yyc-1 · yeg-2 · cmrose-1</span>
        <span>UTC {ts}</span>
      </div>
    </div>
  );
}

function OpNav({ page, setPage }) {
  return (
    <div className="op-nav">
      <div className="brand" style={{display:'flex',alignItems:'center'}}>
        <div className="logomark">V</div>
        <div className="wordmark">velocity<span className="sub">.ops</span></div>
        <div className="crumb">
          /alberta /<span className="here">{page === 'landing' ? 'overview' : page === 'index' ? 'whitepapers' : page === 'detail' ? 'whitepapers/wp' : 'architecture'}</span>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:14}}>
        <div className="links">
          <a className={page==='landing'?'active':''} onClick={()=>setPage('landing')}>Overview</a>
          <a className={page==='index'?'active':''} onClick={()=>setPage('index')}>Whitepapers</a>
          <a className={page==='arch'?'active':''} onClick={()=>setPage('arch')}>Architecture</a>
          <a>Telemetry</a>
          <a>Logs</a>
        </div>
        <div className="cmd">Search<span className="kbd">⌘K</span></div>
      </div>
    </div>
  );
}

function OpSpark({ data, color = opTheme.green, w = 60, h = 22 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const x = (i) => (i*(w-2))/(data.length-1) + 1;
  const y = (v) => h - 1 - ((v-min)/(max-min||1))*(h-2);
  const d = data.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.2"/>
    </svg>
  );
}

function OpLanding({ setPage, openPaper }) {
  const wp = window.VW.whitepapers;
  return (
    <div className="op-land">
      <div className="col-l">
        <div className="op-hero">
          <div className="label">// VELOCITY · PROGRAMME OVERVIEW</div>
          <h1>An <span className="accent">agentic operating system</span> for the Alberta technology estate.</h1>
          <p>1,400 applications. 3,800 repositories. 466 million lines of code. 27 ministries. The Velocity programme deploys a population of specialized agents — under continuous supervision — to remediate $2.1 billion in inherited application debt without freezing service to citizens.</p>
          <div className="term">
            <div className="ln"><span className="pr">$</span> <span className="o">velocity status --estate</span></div>
            <div className="ln"><span className="c">▸ indexing</span> <span className="v">3,800 / 3,800 repositories</span> <span className="m">[ok]</span></div>
            <div className="ln"><span className="c">▸ active agents</span> <span className="v">14,228</span> <span className="c">across 7 layers</span></div>
            <div className="ln"><span className="c">▸ debt remaining</span> <span className="v">$1.94B</span> <span className="m">[-7.6% YTD]</span></div>
            <div className="ln"><span className="c">▸ throughput</span> <span className="v">6.4K PRs/week</span> <span className="c">(target 9.0K)</span></div>
            <div className="ln"><span className="pr">$</span> <span className="cur"></span></div>
          </div>
        </div>

        <div className="op-statgrid">
          <div className="op-stat">
            <div className="k">applications</div>
            <div className="v">1,400</div>
            <div className="delta">▴ 12 onboarded this wk</div>
            <div className="spark"><OpSpark data={[12,14,18,22,28,35,44,55,68,82,98,116]} /></div>
          </div>
          <div className="op-stat amber">
            <div className="k">debt remaining</div>
            <div className="v">$1.94B</div>
            <div className="delta amber">▾ $160M ytd</div>
            <div className="spark"><OpSpark data={[100,98,96,94,92,90,89,88,87,86,84,82]} color={opTheme.amber} /></div>
          </div>
          <div className="op-stat magenta">
            <div className="k">agents active</div>
            <div className="v">14,228</div>
            <div className="delta">▴ peak 16,402</div>
            <div className="spark"><OpSpark data={[8,9,10,12,13,13,14,15,16,15,14,14]} color={opTheme.magenta} /></div>
          </div>
          <div className="op-stat blue">
            <div className="k">PRs / week</div>
            <div className="v">6,402</div>
            <div className="delta">▴ 92% accepted</div>
            <div className="spark"><OpSpark data={[2,3,3,4,4,5,5,5.5,6,6.3,6.5,6.4]} color={opTheme.blue} /></div>
          </div>
        </div>

        <div className="op-sect">
          <h2><span className="bracket">▌</span> WHITEPAPERS · published</h2>
          <div className="ctl">
            <span className="on">all</span>
            <span>by track</span>
            <span>by volume</span>
            <span onClick={()=>setPage('index')}>open ↗</span>
          </div>
        </div>
        <div className="op-papers">
          <div className="hdr">
            <span>ID</span>
            <span>Title</span>
            <span>Track</span>
            <span>Authors</span>
            <span>Read</span>
            <span>Status</span>
          </div>
          {wp.slice(0, 8).map(p => (
            <div className="row" key={p.id} onClick={()=>openPaper(p.id)}>
              <span className="id">VW-{p.num}</span>
              <span className="title">{p.title}<div className="sub">{p.subtitle}</div></span>
              <span className="track">{p.track}</span>
              <span className="authors">{p.authors[0]}</span>
              <span className="read">{p.reading_min}m · {p.pages}pp</span>
              <span className={'pill ' + p.status.toLowerCase()}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="col-r">
        <div className="op-rpanel">
          <div className="ph">
            <span className="t">// FABRIC TELEMETRY</span>
            <span className="live"><span className="d"></span>LIVE</span>
          </div>
          <div className="op-bar">
            <span className="l">indexing</span>
            <span className="track"><span className="fill" style={{width:'100%'}}></span></span>
            <span className="v">100%</span>
          </div>
          <div className="op-bar">
            <span className="l">analysis</span>
            <span className="track"><span className="fill blue" style={{width:'94%'}}></span></span>
            <span className="v">94%</span>
          </div>
          <div className="op-bar">
            <span className="l">migration</span>
            <span className="track"><span className="fill amber" style={{width:'37%'}}></span></span>
            <span className="v">37%</span>
          </div>
          <div className="op-bar">
            <span className="l">verification</span>
            <span className="track"><span className="fill" style={{width:'68%'}}></span></span>
            <span className="v">68%</span>
          </div>
          <div className="op-bar">
            <span className="l">rollout</span>
            <span className="track"><span className="fill blue" style={{width:'42%'}}></span></span>
            <span className="v">42%</span>
          </div>
        </div>

        <div className="op-rpanel">
          <div className="ph">
            <span className="t">// AGENT FEED</span>
            <span className="live"><span className="d"></span>STREAMING</span>
          </div>
          <div className="feed">
            <div className="e"><span className="ts">14:27:08</span><span className="msg"><span className="tag">[author]</span> opened PR #84221 · land-titles · COBOL→Go</span></div>
            <div className="e"><span className="ts">14:27:04</span><span className="msg"><span className="tag b">[verifier]</span> equivalence proven on 1,182 traces · service.income</span></div>
            <div className="e"><span className="ts">14:26:58</span><span className="msg"><span className="tag a">[review]</span> human gate triggered · novel auth pattern · ministry.health</span></div>
            <div className="e"><span className="ts">14:26:52</span><span className="msg"><span className="tag m">[ledger]</span> 412 reasoning records signed · batch 26b21f</span></div>
            <div className="e"><span className="ts">14:26:47</span><span className="msg"><span className="tag">[crawler]</span> 14 new repos discovered · ministry.education</span></div>
            <div className="e"><span className="ts">14:26:39</span><span className="msg"><span className="tag b">[verifier]</span> SAST clean · 96 changes · ministry.transportation</span></div>
            <div className="e"><span className="ts">14:26:32</span><span className="msg"><span className="tag a">[review]</span> escalated to L3 · breaking change · vital-stats</span></div>
            <div className="e"><span className="ts">14:26:21</span><span className="msg"><span className="tag">[deploy]</span> rollout 33% · canary green · drivers-licensing</span></div>
          </div>
        </div>

        <div className="op-rpanel">
          <div className="ph">
            <span className="t">// MINISTRIES · debt by</span>
            <span className="live">27 ministries</span>
          </div>
          {[
            ['Health',420,68],['Justice',310,52],['Education',280,77],['Transport.',230,44],['Service Alta.',210,71],['Energy',180,38],['Children & Families',150,82],
          ].map(([m, d, pct]) => (
            <div className="op-bar" key={m}>
              <span className="l">{m}</span>
              <span className="track"><span className="fill" style={{width: pct+'%', background: pct > 70 ? opTheme.green : pct > 50 ? opTheme.blue : opTheme.amber}}></span></span>
              <span className="v">${d}M</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OpIndex({ openPaper }) {
  const [q, setQ] = React.useState('');
  const [track, setTrack] = React.useState('All');
  const wp = window.VW.whitepapers;
  const tracks = ['All', ...window.VW.tracks];
  const filtered = wp.filter(p => {
    if (track !== 'All' && p.track !== track) return false;
    if (q && !(p.title + ' ' + p.subtitle + ' ' + p.tags.join(' ') + ' ' + p.authors.join(' ')).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  return (
    <div className="op-indexpage">
      <div className="ihdr">
        <h1><span className="m">{String(filtered.length).padStart(2,'0')}/</span>Whitepapers</h1>
        <div className="meta">SORTED · series asc · last sync 14:27:08 UTC</div>
      </div>
      <div className="cpalette">
        <div className="row">
          <span className="pr">⌘</span>
          <input placeholder="search:  title / track / author / tag …" value={q} onChange={e=>setQ(e.target.value)} />
          <span className="kbd">esc to clear</span>
        </div>
        <div className="filters">
          {tracks.map(t => (
            <span key={t} className={'chip ' + (track===t?'on':'')} onClick={()=>setTrack(t)}>{t}</span>
          ))}
        </div>
      </div>
      <div className="op-papers" style={{padding:0}}>
        <div className="hdr">
          <span>ID</span>
          <span>Title</span>
          <span>Track</span>
          <span>Authors</span>
          <span>Read</span>
          <span>Status</span>
        </div>
        {filtered.map(p => (
          <div className="row" key={p.id} onClick={()=>openPaper(p.id)}>
            <span className="id">VW-{p.num}</span>
            <span className="title">{p.title}<div className="sub">{p.subtitle}</div></span>
            <span className="track">{p.track}</span>
            <span className="authors">{p.authors[0]}</span>
            <span className="read">{p.reading_min}m · {p.pages}pp</span>
            <span className={'pill ' + p.status.toLowerCase()}>{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpDetail({ paperId, setPage }) {
  const p = window.VW.whitepapers.find(w => w.id === paperId) || window.VW.whitepapers[0];
  const [active, setActive] = React.useState(0);
  return (
    <div className="op-doc">
      <div className="col-toc">
        <div className="back" onClick={()=>setPage('index')}>← whitepapers</div>
        <div className="toc-l">// SECTIONS</div>
        {p.sections.map((s,i) => (
          <div key={i} className={'toc-r ' + (i===active?'active':'')} onClick={()=>setActive(i)}>
            <span className="n">§{s.n}</span>
            <span>{s.title}</span>
          </div>
        ))}
        <div className="toc-l" style={{marginTop:18}}>// REFERENCES</div>
        <div className="toc-r"><span className="n">↗</span><span>VW-01 · Thesis</span></div>
        <div className="toc-r"><span className="n">↗</span><span>VW-02 · Cartography</span></div>
        <div className="toc-r"><span className="n">↗</span><span>VW-06 · Cost of Carry</span></div>
        <div className="toc-l" style={{marginTop:18}}>// METADATA</div>
        <div style={{fontFamily:'JetBrains Mono',fontSize:10.5,color:opTheme.ink50,lineHeight:1.8}}>
          ID&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:opTheme.green}}>VW-{p.num}</span><br/>
          VOL&nbsp;&nbsp;&nbsp;{p.vol}<br/>
          PUB&nbsp;&nbsp;&nbsp;{p.published}<br/>
          READ&nbsp;&nbsp;{p.reading_min}m<br/>
          PAGES&nbsp;{p.pages}
        </div>
      </div>
      <div className="col-main">
        <div className="dochead">
          <div className="filing">
            <span className="id">VW-{p.num}</span>
            <span>Vol. {p.vol}</span>
            <span className="track">{p.track}</span>
            <span>{p.published}</span>
            <span style={{color:opTheme.green}}>● {p.status.toUpperCase()}</span>
          </div>
          <h1>{p.title}</h1>
          <div className="deck">{p.subtitle}</div>
        </div>
        <div className="abstr">
          <div className="l">// ABSTRACT</div>
          <p>{p.abstract}</p>
        </div>
        <div className="body">
          <h3><span className="n">§{p.sections[0].n}</span><span>{p.sections[0].title}</span></h3>
          <p>The Velocity programme operates on a working assumption that is, on inspection, controversial: that the labour bottleneck in remediating Alberta\u2019s application estate is not engineer-hours but engineer-comprehension. Engineers are not slow because they cannot type; they are slow because, on any non-trivial inherited system, the cost of safely deciding what to change dwarfs the cost of making the change itself.</p>
          <p>This shifts the optimization target. If comprehension is the constraint, then the binding question is not "how do we hire more engineers" but "how do we lower the unit cost of comprehension." Velocity\u2019s answer is to encode comprehension in machine-queryable form — symbol graphs, behavioural traces, dependency manifests, policy embeddings — and to let supervised agents perform the routine remediations against that substrate, with engineers acting as supervisors of populations of changes rather than authors of individual ones.</p>
          <div className="codeblock">
            <div><span className="c">// representative agent invocation</span></div>
            <div><span className="k">velocity</span> <span className="v">remediate</span> \\</div>
            <div>&nbsp;&nbsp;<span className="k">--repo</span> <span className="s">"ministry/land-titles"</span> \\</div>
            <div>&nbsp;&nbsp;<span className="k">--target</span> <span className="s">"cobol-to-go"</span> \\</div>
            <div>&nbsp;&nbsp;<span className="k">--autonomy</span> <span className="s">"tier-2"</span> \\</div>
            <div>&nbsp;&nbsp;<span className="k">--require-equiv</span> <span className="s">behavioural</span> \\</div>
            <div>&nbsp;&nbsp;<span className="k">--gate</span> <span className="s">human-l3</span></div>
          </div>
          <h3><span className="n">§{p.sections[1].n}</span><span>{p.sections[1].title}</span></h3>
          <p>What follows is a survey of why a human-only approach plateaus around four thousand remediations per year against an installed base whose growth rate exceeds that figure by approximately one order of magnitude. The argument is not that engineers should be replaced; it is that the unit of work must shrink.</p>
        </div>
      </div>
      <div className="col-aside">
        <div className="op-rpanel" style={{padding:0,borderBottom:'1px solid '+opTheme.border,paddingBottom:18,marginBottom:18}}>
          <div className="ph">
            <span className="t">// TELEMETRY</span>
            <span className="live"><span className="d"></span>LIVE</span>
          </div>
          <div className="op-bar"><span className="l">readers (24h)</span><span className="track"><span className="fill blue" style={{width:'62%'}}></span></span><span className="v">1,842</span></div>
          <div className="op-bar"><span className="l">avg dwell</span><span className="track"><span className="fill" style={{width:'78%'}}></span></span><span className="v">17m</span></div>
          <div className="op-bar"><span className="l">citations</span><span className="track"><span className="fill" style={{width:'34%'}}></span></span><span className="v">11</span></div>
          <div className="op-bar"><span className="l">errata</span><span className="track"><span className="fill amber" style={{width:'6%'}}></span></span><span className="v">0</span></div>
        </div>
        <div className="op-rpanel" style={{padding:0,borderBottom:'1px solid '+opTheme.border,paddingBottom:18,marginBottom:18}}>
          <div className="ph"><span className="t">// AUTHORS</span></div>
          {p.authors.map((a,i) => (
            <div key={i} style={{fontFamily:'JetBrains Mono',fontSize:11.5,padding:'5px 0',color:opTheme.ink70,borderBottom:'1px dotted '+opTheme.border}}>
              <span style={{color:opTheme.green}}>@</span>{a.toLowerCase().replace(/[^a-z0-9]+/g,'.')}
            </div>
          ))}
        </div>
        <div className="op-rpanel" style={{padding:0}}>
          <div className="ph"><span className="t">// TAGS</span></div>
          <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
            {p.tags.map(t => (
              <span key={t} style={{fontFamily:'JetBrains Mono',fontSize:10.5,padding:'3px 7px',border:'1px solid '+opTheme.border,color:opTheme.blue}}>#{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OpArch() {
  return (
    <div className="op-arch">
      <div className="top">
        <div>
          <div style={{fontFamily:'JetBrains Mono',fontSize:11,color:opTheme.green,letterSpacing:'0.12em',marginBottom:10}}>// REFERENCE · agentic operating model</div>
          <h1>The <span className="a">agent mesh</span>.</h1>
          <div className="deck">Seven layers, eighteen agent classes, one autonomy ledger. Hover any agent for throughput and class.</div>
          <div className="legend">
            <span className="key"><span className="dot" style={{background:opTheme.green}}></span>autonomous</span>
            <span className="key"><span className="dot" style={{background:opTheme.blue}}></span>verification</span>
            <span className="key"><span className="dot" style={{background:opTheme.amber}}></span>human-gated</span>
            <span className="key"><span className="dot" style={{background:opTheme.magenta}}></span>ledger</span>
          </div>
        </div>
        <div style={{fontFamily:'JetBrains Mono',fontSize:10.5,color:opTheme.ink50,textAlign:'right',lineHeight:1.7}}>
          DIAGRAM&nbsp;&nbsp;<span style={{color:opTheme.green}}>v3.2</span><br/>
          UPDATED&nbsp;2026-04-02<br/>
          AGENTS&nbsp;&nbsp;&nbsp;18 classes<br/>
          STATE&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:opTheme.green}}>● operational</span>
        </div>
      </div>
      <div className="figframe">
        <div className="fhdr">
          <span>FIG · agent mesh · live topology</span>
          <span className="ok">● 14,228 agents healthy</span>
        </div>
        <OpArchDiagram />
      </div>
    </div>
  );
}

function OpArchDiagram() {
  const layers = window.VW.architecture.layers;
  const agents = window.VW.architecture.agents;
  const [hover, setHover] = React.useState(null);
  const w = 1080;
  const layerH = 84;
  const labelW = 140;
  const innerW = w - labelW - 24;
  const total = layers.length * layerH + 24;
  const yFor = (lid) => 12 + layers.findIndex(l => l.id === lid) * layerH;
  const colorFor = (a) => {
    if (a.cls === 'verifier') return opTheme.blue;
    if (a.cls === 'human') return opTheme.amber;
    if (a.cls === 'ledger') return opTheme.magenta;
    return opTheme.green;
  };

  return (
    <svg width={w} height={total} style={{display:'block'}}>
      <defs>
        <linearGradient id="oprule" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={opTheme.border}/>
          <stop offset="0.5" stopColor={opTheme.borderHi}/>
          <stop offset="1" stopColor={opTheme.border}/>
        </linearGradient>
      </defs>
      {/* Layer rows */}
      {layers.map((l, i) => (
        <g key={l.id}>
          <line x1={labelW} y1={yFor(l.id)+layerH-4} x2={w-12} y2={yFor(l.id)+layerH-4} stroke="url(#oprule)" strokeWidth="0.5"/>
          <text x={labelW-14} y={yFor(l.id)+22} fontFamily="Geist" fontSize="15" fontWeight="500" fill={opTheme.ink} textAnchor="end">{l.label}</text>
          <text x={labelW-14} y={yFor(l.id)+38} fontFamily="JetBrains Mono" fontSize="9.5" fill={opTheme.ink50} textAnchor="end" letterSpacing="0.1em">{l.sub.toUpperCase()}</text>
          <text x={labelW-14} y={yFor(l.id)+54} fontFamily="JetBrains Mono" fontSize="9" fill={opTheme.green} textAnchor="end">LYR{String(i+1).padStart(2,'0')}</text>
        </g>
      ))}
      {/* central animated flow */}
      {layers.slice(0,-1).map((l,i) => {
        const x = labelW + 12;
        const y1 = yFor(l.id) + layerH - 14;
        const y2 = yFor(layers[i+1].id) + 10;
        return (
          <g key={'flow'+i}>
            <line x1={x} y1={y1} x2={x} y2={y2} stroke={opTheme.borderHi} strokeWidth="1"/>
            <line x1={x} y1={y1} x2={x} y2={y2} stroke={opTheme.green} strokeWidth="1" strokeDasharray="3 5" style={{animation:'opdash 1.4s linear infinite'}}/>
            <polygon points={`${x-3},${y2-5} ${x+3},${y2-5} ${x},${y2}`} fill={opTheme.green}/>
          </g>
        );
      })}

      {/* agents */}
      {layers.map(l => {
        const list = agents.filter(a => a.layer === l.id);
        const slotW = innerW / Math.max(list.length, 3) - 14;
        return list.map((a, i) => {
          const x = labelW + 22 + i*(slotW+14);
          const y = yFor(l.id) + 12;
          const h = layerH - 30;
          const c = colorFor(a);
          const isHover = hover === a.id;
          return (
            <g key={a.id} onMouseEnter={()=>setHover(a.id)} onMouseLeave={()=>setHover(null)} style={{cursor:'pointer'}}>
              <rect x={x} y={y} width={slotW} height={h} fill={opTheme.panelHi} stroke={isHover?c:opTheme.border} strokeWidth={isHover?1.2:0.8} rx="3"/>
              <circle cx={x+10} cy={y+13} r="3.5" fill={c}>
                <animate attributeName="opacity" values="1;0.35;1" dur={(2+i*0.13)+'s'} repeatCount="indefinite"/>
              </circle>
              <text x={x+20} y={y+17} fontFamily="JetBrains Mono" fontSize="9" fill={c} letterSpacing="0.08em">{a.cls.toUpperCase()}</text>
              <text x={x+10} y={y+38} fontFamily="Geist" fontSize="13" fontWeight="500" fill={opTheme.ink}>{a.label}</text>
              <text x={x+10} y={y+h-8} fontFamily="JetBrains Mono" fontSize="9.5" fill={opTheme.ink50}>{a.throughput}</text>
            </g>
          );
        });
      })}
    </svg>
  );
}

function OpApp() {
  const [page, setPage] = React.useState('landing');
  const [paperId, setPaperId] = React.useState('wp-01');
  const openPaper = (id) => { setPaperId(id); setPage('detail'); };
  return (
    <div className="op">
      <style>{opCSS}</style>
      <OpStatusBar />
      <OpNav page={page} setPage={setPage} />
      <div className="op-main" key={page}>
        {page === 'landing' && <OpLanding setPage={setPage} openPaper={openPaper} />}
        {page === 'index' && <OpIndex openPaper={openPaper} />}
        {page === 'detail' && <OpDetail paperId={paperId} setPage={setPage} />}
        {page === 'arch' && <OpArch />}
      </div>
    </div>
  );
}

window.OpApp = OpApp;
