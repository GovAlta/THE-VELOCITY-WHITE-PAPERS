// Direction B — Field Manual
// Editorial whitepaper / archival report aesthetic.
// Spectral (serif) + Space Grotesk (sans) + JetBrains Mono.
// Newsprint cream paper with ink-and-red-pen markup.

const fmTheme = {
  paper: '#ECE5CF',
  paperAlt: '#E2D9BD',
  paperDeep: '#D8CDA8',
  ink: '#1A1410',
  ink70: '#3F362C',
  ink50: '#6E6450',
  rule: '#C8BD99',
  ruleStrong: '#A89B73',
  red: '#A8331E',
  teal: '#2E5C5C',
};

const fmCSS = `
  .fm { font-family: 'Spectral', Georgia, serif; color: ${fmTheme.ink}; background: ${fmTheme.paper}; height: 100%; overflow: hidden; display: flex; flex-direction: column;
    background-image: repeating-linear-gradient(0deg, rgba(26,20,16,0.018) 0px, rgba(26,20,16,0.018) 1px, transparent 1px, transparent 3px);
  }
  .fm .sans { font-family: 'Space Grotesk', sans-serif; }
  .fm .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
  .fm .caps { font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; letter-spacing: 0.14em; font-size: 11px; }
  .fm a { color: inherit; text-decoration: none; cursor: pointer; }
  .fm *::selection { background: ${fmTheme.red}; color: ${fmTheme.paper}; }

  .fm-nav { display: flex; align-items: center; justify-content: space-between; padding: 12px 36px; border-bottom: 2px solid ${fmTheme.ink}; background: ${fmTheme.paper}; flex: 0 0 auto; }
  .fm-nav .brand-row { display: flex; align-items: center; gap: 18px; }
  .fm-nav .seal { width: 28px; height: 28px; border: 1.5px solid ${fmTheme.ink}; display: flex; align-items: center; justify-content: center; font-family: 'Spectral', serif; font-weight: 600; font-size: 12px; }
  .fm-nav .name { font-family: 'Spectral', serif; font-weight: 600; font-size: 18px; letter-spacing: -0.005em; }
  .fm-nav .sub { font-family: 'Space Grotesk', sans-serif; font-size: 10.5px; color: ${fmTheme.ink50}; text-transform: uppercase; letter-spacing: 0.18em; margin-left: 8px; padding-left: 12px; border-left: 1px solid ${fmTheme.rule}; }
  .fm-nav .links { display: flex; gap: 22px; font-family: 'Space Grotesk', sans-serif; font-size: 13px; }
  .fm-nav .links a { padding: 6px 0; border-bottom: 2px solid transparent; }
  .fm-nav .links a.active { border-bottom-color: ${fmTheme.red}; color: ${fmTheme.red}; }
  .fm-nav .ref { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: ${fmTheme.ink50}; }

  .fm-main { flex: 1 1 auto; overflow-y: auto; overflow-x: hidden; }
  .fm-main::-webkit-scrollbar { width: 10px; }
  .fm-main::-webkit-scrollbar-thumb { background: ${fmTheme.ruleStrong}; }
  .fm-main::-webkit-scrollbar-track { background: ${fmTheme.paper}; }

  /* Nameplate */
  .fm-name { padding: 32px 56px 24px; border-bottom: 1px solid ${fmTheme.ink}; position: relative; }
  .fm-name .row1 { display: flex; justify-content: space-between; align-items: flex-end; font-family: 'Space Grotesk', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; color: ${fmTheme.ink50}; margin-bottom: 18px; }
  .fm-name .row1 .stamp { color: ${fmTheme.red}; border: 1px solid ${fmTheme.red}; padding: 3px 8px; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.1em; }
  .fm-name h1.plate { font-family: 'Spectral', serif; font-weight: 400; font-size: 86px; line-height: 0.95; letter-spacing: -0.025em; margin: 0; }
  .fm-name h1.plate em { font-style: italic; color: ${fmTheme.red}; }
  .fm-name .underplate { display: flex; justify-content: space-between; margin-top: 14px; align-items: flex-end; }
  .fm-name .strap { font-family: 'Spectral', serif; font-style: italic; font-size: 18px; max-width: 60ch; color: ${fmTheme.ink70}; line-height: 1.35; }
  .fm-name .filing { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${fmTheme.ink50}; text-align: right; line-height: 1.5; }

  /* Stats bar — looks like a legend */
  .fm-stats { display: grid; grid-template-columns: repeat(6, 1fr); border-bottom: 2px solid ${fmTheme.ink}; background: ${fmTheme.paperAlt}; }
  .fm-stats .cell { padding: 16px 18px; border-right: 1px solid ${fmTheme.rule}; }
  .fm-stats .cell:last-child { border-right: 0; }
  .fm-stats .cell .l { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: ${fmTheme.ink50}; }
  .fm-stats .cell .v { font-family: 'Spectral', serif; font-size: 26px; font-weight: 500; letter-spacing: -0.01em; margin-top: 2px; }

  /* Section heads with §number */
  .fm-secthead { padding: 36px 56px 12px; display: flex; align-items: baseline; gap: 18px; }
  .fm-secthead .sec { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${fmTheme.red}; letter-spacing: 0.08em; }
  .fm-secthead h2 { font-family: 'Spectral', serif; font-weight: 500; font-size: 24px; margin: 0; letter-spacing: -0.005em; flex: 1; }
  .fm-secthead .rule { flex: 1; border-bottom: 1px solid ${fmTheme.ruleStrong}; transform: translateY(-6px); }
  .fm-secthead .more { font-family: 'Space Grotesk', sans-serif; font-size: 11px; color: ${fmTheme.ink50}; text-transform: uppercase; letter-spacing: 0.12em; cursor: pointer; }
  .fm-secthead .more:hover { color: ${fmTheme.red}; }

  /* Dispatch — big featured article like a magazine lead */
  .fm-dispatch { padding: 0 56px 24px; display: grid; grid-template-columns: 1fr 320px; gap: 36px; }
  .fm-dispatch .lead { border-top: 4px solid ${fmTheme.ink}; padding-top: 18px; }
  .fm-dispatch .lead .kicker { font-family: 'Space Grotesk', sans-serif; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${fmTheme.red}; margin-bottom: 10px; }
  .fm-dispatch .lead h3 { font-family: 'Spectral', serif; font-weight: 400; font-size: 42px; line-height: 1.04; letter-spacing: -0.012em; margin: 0 0 16px; cursor: pointer; }
  .fm-dispatch .lead .deck { font-family: 'Spectral', serif; font-style: italic; font-size: 18px; line-height: 1.42; color: ${fmTheme.ink70}; margin-bottom: 18px; }
  .fm-dispatch .lead .byline { font-family: 'Space Grotesk', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: ${fmTheme.ink50}; display: flex; gap: 18px; }
  .fm-dispatch .marg { border-top: 1px solid ${fmTheme.ink}; padding-top: 14px; }
  .fm-dispatch .marg .l { font-family: 'Space Grotesk', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: ${fmTheme.ink50}; margin-bottom: 12px; }
  .fm-dispatch .marg .quote { font-family: 'Spectral', serif; font-style: italic; font-size: 17px; line-height: 1.4; padding-bottom: 14px; border-bottom: 1px dotted ${fmTheme.rule}; }
  .fm-dispatch .marg .attrib { font-family: 'Space Grotesk', sans-serif; font-size: 10.5px; color: ${fmTheme.ink50}; margin-top: 10px; }
  .fm-dispatch .marg .keystats { margin-top: 18px; display: flex; flex-direction: column; gap: 10px; }
  .fm-dispatch .marg .keystats .row { display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; padding: 6px 0; border-bottom: 1px dotted ${fmTheme.rule}; }
  .fm-dispatch .marg .keystats .row span:first-child { color: ${fmTheme.ink50}; text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; }
  .fm-dispatch .marg .keystats .row span:last-child { color: ${fmTheme.ink}; }

  /* Index list — citation entries */
  .fm-list { padding: 0 56px 24px; }
  .fm-list .entry { padding: 22px 0; border-bottom: 1px solid ${fmTheme.rule}; display: grid; grid-template-columns: 40px 1fr 200px; gap: 24px; cursor: pointer; transition: background .12s; }
  .fm-list .entry:hover { background: ${fmTheme.paperAlt}; }
  .fm-list .entry:hover .num { color: ${fmTheme.red}; }
  .fm-list .entry .num { font-family: 'Spectral', serif; font-style: italic; font-size: 30px; color: ${fmTheme.ink50}; line-height: 1; padding-top: 4px; }
  .fm-list .entry .body { }
  .fm-list .entry h4 { font-family: 'Spectral', serif; font-weight: 500; font-size: 22px; line-height: 1.15; margin: 0 0 6px; letter-spacing: -0.005em; }
  .fm-list .entry .sub { font-family: 'Spectral', serif; font-style: italic; font-size: 14.5px; line-height: 1.45; color: ${fmTheme.ink70}; max-width: 64ch; margin-bottom: 10px; }
  .fm-list .entry .cite { font-family: 'Space Grotesk', sans-serif; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.1em; color: ${fmTheme.ink50}; display: flex; gap: 14px; flex-wrap: wrap; }
  .fm-list .entry .cite .author { color: ${fmTheme.teal}; }
  .fm-list .entry .meta { text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: ${fmTheme.ink50}; line-height: 1.7; }
  .fm-list .entry .meta .status { display: inline-block; padding: 2px 8px; border: 1px solid currentColor; margin-top: 6px; }
  .fm-list .entry .meta .status.published { color: ${fmTheme.teal}; }
  .fm-list .entry .meta .status.forthcoming { color: ${fmTheme.red}; }
  .fm-list .entry .meta .status.draft { color: ${fmTheme.ink50}; }

  /* Colophon footer */
  .fm-colophon { padding: 40px 56px 56px; border-top: 4px solid ${fmTheme.ink}; background: ${fmTheme.paperAlt}; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 32px; }
  .fm-colophon h5 { font-family: 'Spectral', serif; font-weight: 500; font-size: 18px; margin: 0 0 12px; }
  .fm-colophon p { font-family: 'Spectral', serif; font-size: 13.5px; line-height: 1.55; color: ${fmTheme.ink70}; margin: 0; }
  .fm-colophon ul { padding: 0; margin: 0; list-style: none; }
  .fm-colophon li { font-family: 'Spectral', serif; font-size: 13px; padding: 5px 0; border-bottom: 1px dotted ${fmTheme.rule}; cursor: pointer; }
  .fm-colophon li:hover { color: ${fmTheme.red}; font-style: italic; }
  .fm-colophon .lbl { font-family: 'Space Grotesk', sans-serif; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.16em; color: ${fmTheme.ink50}; margin-bottom: 8px; }

  /* Index page */
  .fm-indexpage { padding: 32px 56px 64px; }
  .fm-indexpage .h { display: grid; grid-template-columns: 1fr 320px; gap: 36px; align-items: end; border-bottom: 2px solid ${fmTheme.ink}; padding-bottom: 22px; margin-bottom: 0; }
  .fm-indexpage .h h1 { font-family: 'Spectral', serif; font-weight: 400; font-size: 64px; line-height: 1; margin: 0; letter-spacing: -0.02em; }
  .fm-indexpage .h h1 em { font-style: italic; }
  .fm-indexpage .h .right { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${fmTheme.ink50}; text-align: right; line-height: 1.7; }
  .fm-indexpage .controls { display: flex; gap: 12px; align-items: center; padding: 16px 0; border-bottom: 1px solid ${fmTheme.rule}; }
  .fm-indexpage .controls input { flex: 1; border: 0; border-bottom: 1px solid ${fmTheme.rule}; background: transparent; outline: none; font-family: 'Spectral', serif; font-style: italic; font-size: 17px; padding: 6px 0; color: ${fmTheme.ink}; }
  .fm-indexpage .controls input::placeholder { color: ${fmTheme.ink50}; }
  .fm-indexpage .controls .chiprow { display: flex; gap: 4px; flex-wrap: wrap; }
  .fm-indexpage .controls .chip { font-family: 'Space Grotesk', sans-serif; font-size: 11px; padding: 5px 10px; border: 1px solid ${fmTheme.rule}; cursor: pointer; text-transform: uppercase; letter-spacing: 0.1em; }
  .fm-indexpage .controls .chip.on { background: ${fmTheme.ink}; color: ${fmTheme.paper}; border-color: ${fmTheme.ink}; }
  .fm-indexpage .volgroup { padding-top: 28px; }
  .fm-indexpage .volgroup .vh { display: flex; align-items: baseline; gap: 16px; margin-bottom: 8px; }
  .fm-indexpage .volgroup .vh .roman { font-family: 'Spectral', serif; font-style: italic; font-size: 32px; color: ${fmTheme.red}; }
  .fm-indexpage .volgroup .vh .vlbl { font-family: 'Space Grotesk', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: ${fmTheme.ink50}; }

  /* Detail page */
  .fm-doc { display: grid; grid-template-columns: 240px 1fr 240px; gap: 0; min-height: 100%; }
  .fm-doc .gutter-l { padding: 36px 16px 36px 56px; border-right: 1px solid ${fmTheme.rule}; position: sticky; top: 0; align-self: start; }
  .fm-doc .back { font-family: 'Space Grotesk', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: ${fmTheme.ink50}; cursor: pointer; margin-bottom: 24px; }
  .fm-doc .back:hover { color: ${fmTheme.red}; }
  .fm-doc .tocl { font-family: 'Space Grotesk', sans-serif; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.16em; color: ${fmTheme.ink50}; margin: 18px 0 10px; }
  .fm-doc .tocrow { display: grid; grid-template-columns: 20px 1fr; gap: 8px; padding: 7px 0; border-bottom: 1px dotted ${fmTheme.rule}; cursor: pointer; }
  .fm-doc .tocrow .n { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: ${fmTheme.red}; }
  .fm-doc .tocrow .t { font-family: 'Spectral', serif; font-size: 13.5px; line-height: 1.3; }
  .fm-doc .tocrow:hover .t, .fm-doc .tocrow.active .t { font-style: italic; }
  .fm-doc .col-main { padding: 36px 48px 64px; }
  .fm-doc .docheader { border-bottom: 4px solid ${fmTheme.ink}; padding-bottom: 22px; margin-bottom: 28px; }
  .fm-doc .docheader .filing { display: flex; gap: 16px; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; color: ${fmTheme.ink50}; margin-bottom: 14px; }
  .fm-doc .docheader .filing .stamp { color: ${fmTheme.red}; border: 1px solid ${fmTheme.red}; padding: 2px 6px; }
  .fm-doc .docheader h1 { font-family: 'Spectral', serif; font-weight: 400; font-size: 52px; line-height: 1.02; letter-spacing: -0.02em; margin: 0 0 12px; }
  .fm-doc .docheader .deck { font-family: 'Spectral', serif; font-style: italic; font-size: 20px; line-height: 1.4; color: ${fmTheme.ink70}; max-width: 56ch; }
  .fm-doc .abstr { background: ${fmTheme.paperAlt}; padding: 22px 26px; border-left: 4px solid ${fmTheme.red}; margin-bottom: 32px; }
  .fm-doc .abstr .ab-lbl { font-family: 'Space Grotesk', sans-serif; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.16em; color: ${fmTheme.red}; margin-bottom: 10px; font-weight: 500; }
  .fm-doc .abstr p { font-family: 'Spectral', serif; font-size: 15.5px; line-height: 1.55; margin: 0; }
  .fm-doc .body h3 { font-family: 'Spectral', serif; font-weight: 500; font-size: 20px; letter-spacing: -0.003em; margin: 32px 0 12px; display: flex; gap: 14px; align-items: baseline; border-bottom: 1px solid ${fmTheme.rule}; padding-bottom: 8px; }
  .fm-doc .body h3 .n { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${fmTheme.red}; letter-spacing: 0.08em; }
  .fm-doc .body p { font-family: 'Spectral', serif; font-size: 15px; line-height: 1.65; margin: 0 0 14px; column-gap: 28px; }
  .fm-doc .body .dropcap { font-family: 'Spectral', serif; font-size: 64px; line-height: 0.85; float: left; padding: 8px 10px 0 0; color: ${fmTheme.red}; font-weight: 500; }
  .fm-doc .body .footnoteref { color: ${fmTheme.red}; font-family: 'JetBrains Mono', monospace; font-size: 10px; vertical-align: super; }
  .fm-doc .pull { padding: 22px 0; border-top: 2px solid ${fmTheme.ink}; border-bottom: 2px solid ${fmTheme.ink}; margin: 28px 0; font-family: 'Spectral', serif; font-style: italic; font-size: 22px; line-height: 1.35; letter-spacing: -0.005em; }
  .fm-doc .gutter-r { padding: 36px 36px 36px 16px; border-left: 1px solid ${fmTheme.rule}; }
  .fm-doc .marg-block { margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1px dotted ${fmTheme.rule}; }
  .fm-doc .marg-block .l { font-family: 'Space Grotesk', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: ${fmTheme.ink50}; margin-bottom: 8px; }
  .fm-doc .marg-block .v { font-family: 'Spectral', serif; font-size: 14px; line-height: 1.4; }
  .fm-doc .marg-block .note { font-family: 'Spectral', serif; font-style: italic; font-size: 12.5px; line-height: 1.5; color: ${fmTheme.ink70}; }
  .fm-doc .marg-block .fn-num { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${fmTheme.red}; margin-right: 6px; }

  /* Architecture (manual style) */
  .fm-archpage { padding: 32px 56px 64px; }
  .fm-archpage .top { display: grid; grid-template-columns: 1fr 280px; gap: 36px; border-bottom: 2px solid ${fmTheme.ink}; padding-bottom: 24px; }
  .fm-archpage h1 { font-family: 'Spectral', serif; font-weight: 400; font-size: 56px; line-height: 1.02; letter-spacing: -0.02em; margin: 0 0 12px; }
  .fm-archpage h1 em { font-style: italic; color: ${fmTheme.red}; }
  .fm-archpage .deck { font-family: 'Spectral', serif; font-style: italic; font-size: 18px; line-height: 1.4; color: ${fmTheme.ink70}; max-width: 60ch; }
  .fm-archpage .fig-caps { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: ${fmTheme.ink50}; line-height: 1.7; }
  .fm-archpage .fig-caps .red { color: ${fmTheme.red}; }
  .fm-archpage .figframe { margin: 28px 0; border: 1px solid ${fmTheme.ink}; padding: 16px; background: ${fmTheme.paperAlt}; }
  .fm-archpage .figframe .fcap { display: flex; justify-content: space-between; font-family: 'Space Grotesk', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: ${fmTheme.ink50}; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid ${fmTheme.rule}; }
  .fm-archpage .fnote { font-family: 'Spectral', serif; font-style: italic; font-size: 13px; color: ${fmTheme.ink70}; margin-top: 10px; text-align: center; }
`;

function FMNav({ page, setPage }) {
  return (
    <div className="fm-nav">
      <div className="brand-row">
        <div className="seal">V</div>
        <div className="name">The Velocity Whitepapers</div>
        <div className="sub">A series · Office of the Chief Information Officer · Government of Alberta</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:24}}>
        <div className="links">
          <a className={page==='landing'?'active':''} onClick={()=>setPage('landing')}>Dispatch</a>
          <a className={page==='index'?'active':''} onClick={()=>setPage('index')}>Catalogue</a>
          <a className={page==='arch'?'active':''} onClick={()=>setPage('arch')}>Reference Diagram</a>
          <a>Errata</a>
        </div>
        <div className="ref">FILING · 026.Q2 · ISSUE 4</div>
      </div>
    </div>
  );
}

function FMLanding({ setPage, openPaper }) {
  const wp = window.VW.whitepapers;
  const featured = wp.find(p => p.id === 'wp-03') || wp[2];
  const recent = wp.slice(0, 6);
  return (
    <React.Fragment>
      <div className="fm-name">
        <div className="row1">
          <span>The Velocity Whitepapers · Volumes I–V · MMXXVI</span>
          <span className="stamp">FOR PUBLIC RELEASE</span>
        </div>
        <h1 className="plate">A field manual for <em>clearing the debt</em>.</h1>
        <div className="underplate">
          <div className="strap">A working programme to remediate $2.1 billion of inherited application debt across the Government of Alberta — by deploying populations of supervised, accountable agents against a 466-million-line estate.</div>
          <div className="filing">
            FILE · OCIO/V/2026<br/>
            PRINT RUN · DIGITAL<br/>
            CLASSIFICATION · PUBLIC
          </div>
        </div>
      </div>

      <div className="fm-stats">
        <div className="cell"><div className="l">Applications</div><div className="v">1,400</div></div>
        <div className="cell"><div className="l">Repositories</div><div className="v">3,800</div></div>
        <div className="cell"><div className="l">Lines of code</div><div className="v">466 M</div></div>
        <div className="cell"><div className="l">Ministries</div><div className="v">27</div></div>
        <div className="cell"><div className="l">Carry, annual</div><div className="v">$340 M</div></div>
        <div className="cell"><div className="l">Debt, total</div><div className="v">$2.1 B</div></div>
      </div>

      <div className="fm-secthead">
        <div className="sec">§ I.</div>
        <h2>Featured dispatch</h2>
        <div className="rule"></div>
        <div className="more" onClick={()=>openPaper(featured.id)}>Read full →</div>
      </div>
      <div className="fm-dispatch">
        <div className="lead">
          <div className="kicker">Whitepaper № {featured.num} · {featured.track}</div>
          <h3 onClick={()=>openPaper(featured.id)}>{featured.title}</h3>
          <div className="deck">{featured.subtitle}</div>
          <div className="byline">
            <span>{featured.authors.join(' · ')}</span>
            <span>{featured.published}</span>
            <span>{featured.reading_min} min · {featured.pages} pp</span>
          </div>
        </div>
        <div className="marg">
          <div className="l">From the abstract</div>
          <div className="quote">"A reference architecture for an agent mesh that respects ministry sovereignty, policy boundaries, and security baselines."</div>
          <div className="attrib">— Velocity Architecture Council</div>
          <div className="keystats">
            <div className="row"><span>Agent classes</span><span>5</span></div>
            <div className="row"><span>Autonomy tiers</span><span>4</span></div>
            <div className="row"><span>Cited papers</span><span>11</span></div>
            <div className="row"><span>Errata</span><span>0</span></div>
          </div>
        </div>
      </div>

      <div className="fm-secthead">
        <div className="sec">§ II.</div>
        <h2>The catalogue</h2>
        <div className="rule"></div>
        <div className="more" onClick={()=>setPage('index')}>All papers →</div>
      </div>
      <div className="fm-list">
        {recent.map((p, i) => (
          <div className="entry" key={p.id} onClick={()=>openPaper(p.id)}>
            <div className="num">{p.num}</div>
            <div className="body">
              <h4>{p.title}</h4>
              <div className="sub">{p.subtitle}</div>
              <div className="cite">
                <span className="author">{p.authors[0]}{p.authors[1] ? ' et al.' : ''}</span>
                <span>({p.published.slice(0,4)})</span>
                <span>Vol. {p.vol}, § {p.num}</span>
                <span>{p.track}</span>
                <span>{p.tags.join(' · ')}</span>
              </div>
            </div>
            <div className="meta">
              {p.reading_min} min · {p.pages} pp<br/>
              <span className={'status ' + p.status.toLowerCase()}>{p.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="fm-colophon">
        <div>
          <h5>Colophon</h5>
          <p>The Velocity Whitepapers are produced quarterly by the Office of the Chief Information Officer of the Government of Alberta. They document a continuing programme of agent-led remediation of the provincial application estate. Set in Spectral and Space Grotesk. Public release; reproduction encouraged with attribution.</p>
        </div>
        <div>
          <div className="lbl">By volume</div>
          <ul>
            <li>Vol. I · Foundations</li>
            <li>Vol. II · Architecture</li>
            <li>Vol. III · Modernization</li>
            <li>Vol. IV · Infrastructure</li>
            <li>Vol. V · Operations</li>
          </ul>
        </div>
        <div>
          <div className="lbl">Working groups</div>
          <ul>
            <li>Architecture Council</li>
            <li>Provenance &amp; Trust</li>
            <li>Measurement Cell</li>
            <li>Pattern Library</li>
          </ul>
        </div>
        <div>
          <div className="lbl">Filing</div>
          <ul>
            <li>OCIO/V/2026</li>
            <li>Issue 4 · Q2</li>
            <li>ISSN 2926-4422</li>
            <li>velocity.alberta.ca</li>
          </ul>
        </div>
      </div>
    </React.Fragment>
  );
}

function FMIndex({ openPaper }) {
  const [q, setQ] = React.useState('');
  const [track, setTrack] = React.useState('All');
  const wp = window.VW.whitepapers;
  const tracks = ['All', ...window.VW.tracks];
  const filtered = wp.filter(p => {
    if (track !== 'All' && p.track !== track) return false;
    if (q && !(p.title + ' ' + p.subtitle + ' ' + p.tags.join(' ')).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const byVol = filtered.reduce((acc, p) => { (acc[p.vol] = acc[p.vol] || []).push(p); return acc; }, {});

  return (
    <div className="fm-indexpage">
      <div className="h">
        <h1>The complete <em>catalogue</em></h1>
        <div className="right">
          {filtered.length} OF {wp.length} ENTRIES<br/>
          5 VOLUMES · 9 TRACKS<br/>
          UPDATED 2026-07-22
        </div>
      </div>
      <div className="controls">
        <input placeholder="Search across titles, authors, tags…" value={q} onChange={e=>setQ(e.target.value)} />
        <div className="chiprow">
          {tracks.map(t => (
            <div key={t} className={'chip ' + (track===t?'on':'')} onClick={()=>setTrack(t)}>{t}</div>
          ))}
        </div>
      </div>
      {Object.keys(byVol).map(v => (
        <div className="volgroup" key={v}>
          <div className="vh">
            <span className="roman">Volume {v}</span>
            <span className="vlbl">{byVol[v].length} {byVol[v].length===1?'paper':'papers'}</span>
          </div>
          <div className="fm-list" style={{padding:0}}>
            {byVol[v].map(p => (
              <div className="entry" key={p.id} onClick={()=>openPaper(p.id)}>
                <div className="num">{p.num}</div>
                <div className="body">
                  <h4>{p.title}</h4>
                  <div className="sub">{p.subtitle}</div>
                  <div className="cite">
                    <span className="author">{p.authors[0]}</span>
                    <span>{p.published}</span>
                    <span>{p.track}</span>
                    <span>{p.tags.join(' · ')}</span>
                  </div>
                </div>
                <div className="meta">
                  {p.reading_min} min · {p.pages} pp<br/>
                  <span className={'status ' + p.status.toLowerCase()}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FMDetail({ paperId, setPage }) {
  const p = window.VW.whitepapers.find(w => w.id === paperId) || window.VW.whitepapers[0];
  const [active, setActive] = React.useState(0);
  return (
    <div className="fm-doc">
      <div className="gutter-l">
        <div className="back" onClick={()=>setPage('index')}>← Catalogue</div>
        <div className="tocl">In this paper</div>
        {p.sections.map((s, i) => (
          <div key={i} className={'tocrow ' + (i===active?'active':'')} onClick={()=>setActive(i)}>
            <span className="n">§{s.n}</span>
            <span className="t">{s.title}</span>
          </div>
        ))}
        <div className="tocl" style={{marginTop:24}}>References</div>
        <div className="tocrow"><span className="n">①</span><span className="t" style={{fontStyle:'italic',fontSize:12}}>Velocity Working Group (2026). The Thesis. Vol. I § 01.</span></div>
        <div className="tocrow"><span className="n">②</span><span className="t" style={{fontStyle:'italic',fontSize:12}}>Treasury Board Analytics (2025). Carry Index v0.3.</span></div>
        <div className="tocrow"><span className="n">③</span><span className="t" style={{fontStyle:'italic',fontSize:12}}>OCIO (2024). Estate Inventory, 2024 Edition.</span></div>
      </div>
      <div className="col-main">
        <div className="docheader">
          <div className="filing">
            <span className="stamp">№ {p.num}</span>
            <span>Vol. {p.vol}</span>
            <span>{p.track}</span>
            <span>{p.published}</span>
            <span>{p.reading_min} min · {p.pages} pp</span>
          </div>
          <h1>{p.title}</h1>
          <div className="deck">{p.subtitle}</div>
        </div>
        <div className="abstr">
          <div className="ab-lbl">Abstract</div>
          <p>{p.abstract}</p>
        </div>
        <div className="body">
          <h3><span className="n">§ {p.sections[0].n}</span><span>{p.sections[0].title}</span></h3>
          <p><span className="dropcap">A</span>lberta\u2019s technology estate carries the trace of every administration that built it. Forms 6i screens from the late nineties sit beside Java services written for the 2010 census; PowerBuilder applications still process land titles on a Tuesday morning. None of this is unusual — every large public-sector estate looks similar — and none of it is, by itself, a crisis<span className="footnoteref">¹</span>. The crisis is in the differential: the rate at which new code arrives, paired with the rate at which old code is retired.</p>
          <p>The Carry Index, in its current draft form<span className="footnoteref">²</span>, places the province\u2019s annual unrecognized maintenance burden at three hundred and forty million dollars. This figure does not appear on any balance sheet, but it does appear in the operating budgets of every ministry, distributed across line items whose original justifications no longer reflect the work being done.</p>
          <div className="pull">"The crisis is not in the legacy. The crisis is in the differential between arrival and retirement."</div>
          <p>This paper argues that the differential can only be closed by changing the unit of remediation work. Today, that unit is the engineer-week. We propose it become the agent-hour, supervised by the engineer-week. The remainder of the paper describes how.</p>
          <h3><span className="n">§ {p.sections[1].n}</span><span>{p.sections[1].title}</span></h3>
          <p>The traditional remediation cycle is, in essence, an apprenticeship model: an engineer is assigned to a system, develops contextual understanding over a period of months, makes a series of high-confidence changes, and is reassigned. The constraint is not labour but comprehension<span className="footnoteref">³</span>. Comprehension does not parallelize gracefully in humans, and the systems requiring remediation are themselves growing in number faster than comprehension can be transferred.</p>
        </div>
      </div>
      <div className="gutter-r">
        <div className="marg-block">
          <div className="l">Authors</div>
          {p.authors.map((a,i) => <div className="v" key={i}>{a}</div>)}
        </div>
        <div className="marg-block">
          <div className="l">Tags</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {p.tags.map(t => <span key={t} style={{fontFamily:'Space Grotesk',fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',padding:'3px 8px',border:'1px solid '+fmTheme.rule,color:fmTheme.ink70}}>{t}</span>)}
          </div>
        </div>
        <div className="marg-block">
          <div className="l">Footnotes</div>
          <div className="note"><span className="fn-num">①</span>The province\u2019s situation is, by international comparison, unremarkable in kind and unusual only in scale.</div>
          <div className="note" style={{marginTop:10}}><span className="fn-num">②</span>See Whitepaper № 06, "The Cost of Carry," for the full derivation.</div>
          <div className="note" style={{marginTop:10}}><span className="fn-num">③</span>This claim is developed further in § 03.</div>
        </div>
        <div className="marg-block">
          <div className="l">Figure 1.1</div>
          <div className="v" style={{marginBottom:10,fontSize:13}}>Estate composition by vintage</div>
          <FMMiniBars />
        </div>
      </div>
    </div>
  );
}

function FMMiniBars() {
  // Stacked bar of vintage. 1990s, 2000s, 2010s, 2020s.
  const data = [
    {era: '1990s', pct: 22, color: fmTheme.red},
    {era: '2000s', pct: 31, color: fmTheme.ruleStrong},
    {era: '2010s', pct: 34, color: fmTheme.teal},
    {era: '2020s', pct: 13, color: fmTheme.ink},
  ];
  return (
    <div style={{marginTop:4}}>
      <div style={{display:'flex',height:14,marginBottom:6,border:'1px solid '+fmTheme.ink}}>
        {data.map(d => <div key={d.era} style={{width: d.pct+'%', background: d.color}}></div>)}
      </div>
      {data.map(d => (
        <div key={d.era} style={{display:'flex',justifyContent:'space-between',fontFamily:'JetBrains Mono',fontSize:10.5,padding:'3px 0',borderBottom:'1px dotted '+fmTheme.rule,color:fmTheme.ink70}}>
          <span><span style={{display:'inline-block',width:8,height:8,background:d.color,marginRight:6,verticalAlign:'middle'}}></span>{d.era}</span>
          <span>{d.pct}%</span>
        </div>
      ))}
    </div>
  );
}

function FMArch() {
  return (
    <div className="fm-archpage">
      <div className="top">
        <div>
          <div style={{fontFamily:'Space Grotesk',fontSize:11,textTransform:'uppercase',letterSpacing:'0.16em',color:fmTheme.ink50,marginBottom:14}}>
            Reference Diagram · The Agentic Operating Model
          </div>
          <h1>The <em>arrangement</em> of agents.</h1>
          <div className="deck">A blueprint of how Velocity\u2019s agents are layered, contracted, and held accountable to one another. Read top-to-bottom: discovery feeds analysis, analysis feeds planning, planning is executed, execution is verified, verification is gated, gates are deployed.</div>
        </div>
        <div className="fig-caps">
          PLATE 1<br/>
          REVISION 03<br/>
          DATE 2026-04-02<br/>
          DRAWN BY ARCH-COUNCIL<br/>
          <span className="red">CHECKED BY OCIO</span>
        </div>
      </div>
      <div className="figframe">
        <div className="fcap">
          <span>Plate 1 · The agent layers</span>
          <span>Scale 1:1 · ink on cream</span>
        </div>
        <FMArchDiagram />
        <div className="fnote">Figure 1. Solid arrows denote artifact flow; dashed arrows denote feedback for retraining and reprioritization. Red components are human-gated.</div>
      </div>
    </div>
  );
}

function FMArchDiagram() {
  const layers = window.VW.architecture.layers;
  const agents = window.VW.architecture.agents;
  const [hover, setHover] = React.useState(null);
  const w = 1000;
  const layerH = 78;
  const labelW = 150;
  const innerW = w - labelW - 20;
  const total = layers.length * layerH + 20;
  const yFor = (lid) => 10 + layers.findIndex(l => l.id === lid) * layerH;
  const cls = (a) => a.cls === 'human' || a.cls === 'ledger' ? fmTheme.red : (a.cls === 'verifier' ? fmTheme.teal : fmTheme.ink);

  return (
    <svg width={w} height={total} style={{display:'block', background: fmTheme.paper}}>
      {/* horizontal layer rules — heavy at top */}
      {layers.map((l, i) => (
        <g key={l.id}>
          <line x1={0} y1={yFor(l.id)} x2={w} y2={yFor(l.id)} stroke={fmTheme.ink} strokeWidth={i===0?1.5:0.5} strokeDasharray={i===0?'':'2 2'}/>
          <text x={labelW-12} y={yFor(l.id)+20} fontFamily="Spectral" fontStyle="italic" fontSize="16" fill={fmTheme.ink} textAnchor="end">{l.label}</text>
          <text x={labelW-12} y={yFor(l.id)+36} fontFamily="Space Grotesk" fontSize="10" fill={fmTheme.ink50} textAnchor="end" letterSpacing="0.14em">{l.sub.toUpperCase()}</text>
          <text x={6} y={yFor(l.id)+20} fontFamily="JetBrains Mono" fontSize="10" fill={fmTheme.red}>§{String(i+1).padStart(2,'0')}</text>
        </g>
      ))}
      <line x1={0} y1={total-10} x2={w} y2={total-10} stroke={fmTheme.ink} strokeWidth="1.5"/>
      {/* vertical center flow */}
      {layers.slice(0,-1).map((l,i) => {
        const y1 = yFor(l.id) + layerH - 8;
        const y2 = yFor(layers[i+1].id) + 4;
        return <line key={'v'+i} x1={labelW+12} y1={y1} x2={labelW+12} y2={y2} stroke={fmTheme.ink} strokeWidth="0.5"/>;
      })}
      {/* feedback arc on right */}
      <path d={`M ${w-30} ${yFor('verify')+30} Q ${w-6} ${yFor('verify')+30} ${w-6} ${yFor('plan')+30} L ${w-30} ${yFor('plan')+30}`} fill="none" stroke={fmTheme.red} strokeWidth="0.7" strokeDasharray="3 2"/>
      <text x={w-8} y={yFor('plan')-2} fontFamily="JetBrains Mono" fontSize="9" fill={fmTheme.red} textAnchor="end">feedback</text>

      {/* agents */}
      {layers.map(l => {
        const list = agents.filter(a => a.layer === l.id);
        const sw = innerW / Math.max(list.length, 3) - 14;
        return list.map((a, i) => {
          const x = labelW + 16 + i*(sw+14);
          const y = yFor(l.id) + 12;
          const h = layerH - 30;
          const c = cls(a);
          const isHover = hover === a.id;
          return (
            <g key={a.id} onMouseEnter={()=>setHover(a.id)} onMouseLeave={()=>setHover(null)} style={{cursor:'pointer'}}>
              <rect x={x} y={y} width={sw} height={h} fill={fmTheme.paper} stroke={c} strokeWidth={isHover?1.5:0.8}/>
              <line x1={x} y1={y+18} x2={x+sw} y2={y+18} stroke={c} strokeWidth="0.5"/>
              <text x={x+sw/2} y={y+13} fontFamily="Space Grotesk" fontSize="9" fill={c} textAnchor="middle" letterSpacing="0.1em">{a.cls.toUpperCase()}</text>
              <text x={x+sw/2} y={y+34} fontFamily="Spectral" fontSize="13" fill={fmTheme.ink} textAnchor="middle">{a.label}</text>
              <text x={x+sw/2} y={y+h-6} fontFamily="JetBrains Mono" fontSize="9.5" fill={fmTheme.ink50} textAnchor="middle">{a.throughput}</text>
            </g>
          );
        });
      })}
    </svg>
  );
}

function FMApp() {
  const [page, setPage] = React.useState('landing');
  const [paperId, setPaperId] = React.useState('wp-01');
  const openPaper = (id) => { setPaperId(id); setPage('detail'); };
  return (
    <div className="fm">
      <style>{fmCSS}</style>
      <FMNav page={page} setPage={setPage} />
      <div className="fm-main" key={page}>
        {page === 'landing' && <FMLanding setPage={setPage} openPaper={openPaper} />}
        {page === 'index' && <FMIndex openPaper={openPaper} />}
        {page === 'detail' && <FMDetail paperId={paperId} setPage={setPage} />}
        {page === 'arch' && <FMArch />}
      </div>
    </div>
  );
}

window.FMApp = FMApp;
