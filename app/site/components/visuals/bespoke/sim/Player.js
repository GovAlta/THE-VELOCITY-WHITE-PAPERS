/* sim:player — the narrated simulation player (owner: sim).

   Embed in a paper with:
       chart: { kind: "sim:player", sim: "gov3" }

   Reads data/sims/<sim>.json. The dataset declares everything: the actors
   (simple geometric shapes positioned in a 1920x1080 world), the chapters
   (bilingual narration, per-chapter audio, timed steps), and the camera moves.
   The engine renders the world as one SVG, builds a GSAP timeline per chapter,
   and slaves the timeline to the narration audio clock so voice and motion
   stay in sync at any seek position. All step times are fractions (0..1) of
   the chapter, scaled to the real audio duration at runtime.

   Step actions: show, hide, move, cam, pulse, glow, flow, count, draw, caption.
   Actor kinds: zone, box, sys, agent, person, disc, pill, link, ui, layer, label.

   Without GSAP (or with prefers-reduced-motion) each chapter renders as its
   finished storyboard frame, with the same audio, captions, and transcript. */

(function () {
  const S = window.VWSim;
  if (!S) return;
  const h = S.h, PAL = S.PAL;

  /* ---------- geometry defaults per actor kind ---------- */
  const DIM = {
    zone:   { w: 400, h: 220 },
    box:    { w: 190, h: 64 },
    sys:    { w: 84,  h: 60 },
    agent:  { w: 32,  h: 32 },
    person: { w: 32,  h: 52 },
    disc:   { w: 160, h: 160 },
    pill:   { w: 110, h: 26 },
    ui:     { w: 260, h: 170 },
    layer:  { w: 560, h: 40 },
    label:  { w: 10,  h: 10 },
    link:   { w: 0,   h: 0 },
  };
  function dims(a) {
    const d = DIM[a.kind] || DIM.box;
    const w = a.w != null ? a.w : (a.kind === 'disc' && a.r != null ? a.r * 2 : d.w);
    const hh = a.h != null ? a.h : (a.kind === 'disc' && a.r != null ? a.r * 2 : d.h);
    return { w, h: hh };
  }
  function centerOf(a) {
    if (a.kind === 'link') return { x: (a.x1 + a.x2) / 2, y: (a.y1 + a.y2) / 2 };
    const d = dims(a);
    if (a.kind === 'agent' || a.kind === 'disc') return { x: a.x, y: a.y };   // these are centre-positioned
    if (a.kind === 'person') return { x: a.x, y: a.y + d.h / 2 };
    return { x: a.x + d.w / 2, y: a.y + d.h / 2 };
  }

  /* ---------- state model ---------- */
  function baseState(sim) {
    const st = { cam: Object.assign({ x: S.VB_W / 2, y: S.VB_H / 2, z: 1 }, (sim.stage && sim.stage.cam) || {}), actors: {}, parts: {}, counts: {}, drawn: {} };
    (sim.actors || []).forEach(a => {
      st.actors[a.id] = { x: 0, y: 0, o: a.on ? 1 : 0 };   // x,y are CSS-transform offsets over the markup position
      (a.parts || []).forEach(p => { st.parts[a.id + '.' + p] = 0; });
    });
    return st;
  }
  function applySteps(st, steps, sim) {
    (steps || []).forEach(sp => {
      const ids = sp.id ? [sp.id] : (sp.ids || []);
      switch (sp.do) {
        case 'show': ids.forEach(id => { if (id.includes('.')) st.parts[id] = 1; else if (st.actors[id]) st.actors[id].o = 1; }); break;
        case 'hide': ids.forEach(id => { if (id.includes('.')) st.parts[id] = 0; else if (st.actors[id]) st.actors[id].o = 0; }); break;
        case 'move': ids.forEach(id => { const a = st.actors[id]; if (a) { a.x = sp.x != null ? sp.x : a.x; a.y = sp.y != null ? sp.y : a.y; } }); break;
        case 'cam': st.cam = { x: sp.x != null ? sp.x : st.cam.x, y: sp.y != null ? sp.y : st.cam.y, z: sp.z != null ? sp.z : st.cam.z }; break;
        case 'count': ids.forEach(id => { st.counts[id] = sp.to; }); break;
        case 'draw': ids.forEach(id => { st.drawn[id] = 1; }); break;
        default: break;
      }
    });
    return st;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- SVG drawing (one function per actor kind) ---------- */
  function txt(x, y, str, o) {
    return h('text', Object.assign({ x, y, 'dominant-baseline': 'central', fill: PAL.ink }, o || {}), str);
  }
  function drawActor(a, loc, st) {
    const d = dims(a), col = a.color || PAL.ink;
    const label = S.t(a.label, loc), sub = S.t(a.sub, loc);
    const kids = [];
    const part = (name, nodes, extra) => h('g', Object.assign({ 'data-part': name, style: 'opacity:' + (st.parts[a.id + '.' + name] || 0) + ';' }, extra || {}), nodes);

    if (a.kind === 'zone') {
      kids.push(h('rect', { width: d.w, height: d.h, rx: 16, fill: a.fill || 'rgba(26,58,110,0.045)', stroke: a.stroke || PAL.rule, 'stroke-width': 1.6, 'stroke-dasharray': '3 6', 'data-glow': '' }));
      kids.push(txt(20, 28, (label || '').toUpperCase(), { 'font-size': 19, 'font-weight': 700, 'letter-spacing': '0.07em', fill: a.labelColor || PAL.ink50, 'font-family': 'var(--font-mono)' }));
    } else if (a.kind === 'box') {
      kids.push(h('rect', { width: d.w, height: d.h, rx: 11, fill: '#fff', stroke: PAL.ruleStrong, 'stroke-width': 1.5, 'data-glow': '' }));
      kids.push(h('rect', { width: d.w, height: 8, rx: 4, fill: col }));
      const lines = S.wrap(label, Math.max(8, Math.floor((d.w - 24) / 9.6))).slice(0, 2);
      const y0 = d.h / 2 + 4 - (lines.length - 1) * 11 - (sub ? 7 : 0);
      lines.forEach((ln, i) => kids.push(txt(d.w / 2, y0 + i * 22, ln, { 'text-anchor': 'middle', 'font-size': 17.5, 'font-weight': 600 })));
      if (sub) kids.push(txt(d.w / 2, d.h - 15, sub, { 'text-anchor': 'middle', 'font-size': 12, fill: PAL.ink50, 'font-family': 'var(--font-mono)' }));
    } else if (a.kind === 'sys') {
      kids.push(h('rect', { width: d.w, height: d.h, rx: 8, fill: '#fcfaf4', stroke: a.stroke || PAL.gray, 'stroke-width': 1.4, 'data-glow': '' }));
      kids.push(h('line', { x1: 12, y1: 18, x2: d.w - 12, y2: 18, stroke: PAL.rule, 'stroke-width': 3 }));
      kids.push(h('line', { x1: 12, y1: 31, x2: d.w - 26, y2: 31, stroke: PAL.rule, 'stroke-width': 3 }));
      kids.push(h('line', { x1: 12, y1: 44, x2: d.w - 18, y2: 44, stroke: PAL.rule, 'stroke-width': 3 }));
      if (label) kids.push(txt(d.w / 2, d.h + 15, label, { 'text-anchor': 'middle', 'font-size': 12.5, fill: PAL.ink50, 'font-family': 'var(--font-mono)' }));
      kids.push(part('lock', [
        h('rect', { x: d.w - 21, y: -9, width: 18, height: 14, rx: 3, fill: PAL.ink70 }),
        h('path', { d: 'M' + (d.w - 16.5) + ',-9 v-4 a4.5,4.5 0 0 1 9,0 v4', fill: 'none', stroke: PAL.ink70, 'stroke-width': 2.6 }),
      ]));
      kids.push(part('port', [
        h('circle', { cx: d.w / 2, cy: d.h, r: 8.5, fill: PAL.green, stroke: '#fff', 'stroke-width': 2.6 }),
        h('circle', { cx: d.w / 2, cy: d.h, r: 3, fill: '#fff' }),
      ]));
      kids.push(part('shield', [
        h('path', { d: 'M' + (d.w - 12) + ',-12 l9,3.4 v7 c0,5.6 -4,9.3 -9,11 c-5,-1.7 -9,-5.4 -9,-11 v-7 z', fill: PAL.green, stroke: '#fff', 'stroke-width': 1.8 }),
        h('path', { d: 'M' + (d.w - 16.4) + ',-3 l3.2,3.2 l6,-6.2', fill: 'none', stroke: '#fff', 'stroke-width': 2.3, 'stroke-linecap': 'round' }),
      ]));
    } else if (a.kind === 'agent') {
      const r = a.r || 16;
      kids.push(h('circle', { r: r, fill: a.color || PAL.agent, stroke: '#fff', 'stroke-width': 3, 'data-glow': '' }));
      kids.push(h('circle', { r: r * 0.42, fill: 'rgba(255,255,255,0.88)' }));
      kids.push(h('circle', { cy: -r - 5.5, r: 3.2, fill: a.color || PAL.agent }));
      if (label) kids.push(txt(0, r + 16, label, { 'text-anchor': 'middle', 'font-size': 12.5, fill: PAL.ink70, 'font-family': 'var(--font-mono)' }));
      kids.push(part('badge', [
        h('rect', { x: r - 4, y: -r - 13, width: 28, height: 18, rx: 4, fill: PAL.ink, stroke: '#fff', 'stroke-width': 1.8 }),
        h('circle', { cx: r + 3.5, cy: -r - 4, r: 2.8, fill: '#fff' }),
        h('rect', { x: r + 9, y: -r - 7, width: 11, height: 2.6, rx: 1.3, fill: '#fff' }),
        h('rect', { x: r + 9, y: -r - 2.2, width: 8, height: 2.6, rx: 1.3, fill: '#fff' }),
      ]));
    } else if (a.kind === 'person') {
      const col2 = a.color || PAL.teal;
      kids.push(h('circle', { cx: 0, cy: 9, r: 9.5, fill: col2, 'data-glow': '' }));
      kids.push(h('path', { d: 'M-14,52 v-15 a14,14 0 0 1 28,0 v15 z', fill: col2 }));
      if (label) kids.push(txt(0, 67, label, { 'text-anchor': 'middle', 'font-size': 12.5, fill: PAL.ink70, 'font-family': 'var(--font-mono)' }));
      /* The bubble floats fully ABOVE the head (y -46..-16) with a short tail
         pointing down toward it, so it never covers a neighbouring agent. */
      kids.push(part('bubble', [
        h('path', { d: 'M21,-46 h58 a9,9 0 0 1 9,9 v12 a9,9 0 0 1 -9,9 h-42 l-11,12 v-12 h-5 a9,9 0 0 1 -9,-9 v-12 a9,9 0 0 1 9,-9 z', fill: '#fff', stroke: PAL.ruleStrong, 'stroke-width': 1.5 }),
        h('line', { x1: 28, y1: -37, x2: 72, y2: -37, stroke: PAL.rule, 'stroke-width': 3.2 }),
        h('line', { x1: 28, y1: -27, x2: 60, y2: -27, stroke: PAL.rule, 'stroke-width': 3.2 }),
      ]));
    } else if (a.kind === 'disc') {
      const r = a.r || 80;
      kids.push(h('circle', { r, fill: a.fill || 'rgba(26,58,110,0.07)', stroke: col, 'stroke-width': 2.4, 'data-glow': '' }));
      kids.push(h('circle', { r: r - 11, fill: 'none', stroke: col, 'stroke-width': 1, 'stroke-dasharray': '2 6', opacity: 0.7 }));
      const lines = S.wrap(label, 15).slice(0, 3);
      const y0 = -(lines.length - 1) * 13;
      lines.forEach((ln, i) => kids.push(txt(0, y0 + i * 26, ln, { 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: col })));
      /* the sub sits BELOW the disc — long phrases never collide with the rings */
      if (sub) kids.push(txt(0, r + 18, sub, { 'text-anchor': 'middle', 'font-size': 13, fill: PAL.ink50, 'font-family': 'var(--font-mono)' }));
    } else if (a.kind === 'pill') {
      const w = a.w || Math.max(70, label.length * 8 + 24);
      kids.push(h('rect', { width: w, height: 26, rx: 13, fill: a.fill || PAL.paperAlt, stroke: a.stroke || PAL.ruleStrong, 'stroke-width': 1.2, 'data-glow': '' }));
      kids.push(txt(w / 2, 13, label, { 'text-anchor': 'middle', 'font-size': 13, fill: a.textColor || PAL.ink70, 'font-family': 'var(--font-mono)' }));
    } else if (a.kind === 'ui') {
      kids.push(h('rect', { width: d.w, height: d.h, rx: 13, fill: '#fff', stroke: PAL.ink, 'stroke-width': 1.8, 'data-glow': '' }));
      kids.push(h('rect', { width: d.w, height: 26, rx: 13, fill: PAL.ink }));
      kids.push(h('rect', { x: 0, y: 13, width: d.w, height: 13, fill: PAL.ink }));
      [0, 1, 2].forEach(i => kids.push(h('circle', { cx: 15 + i * 14, cy: 13, r: 3.6, fill: 'rgba(255,255,255,0.6)' })));
      kids.push(h('line', { x1: 16, y1: 44, x2: d.w - 16, y2: 44, stroke: PAL.rule, 'stroke-width': 4.4 }));
      kids.push(h('line', { x1: 16, y1: 58, x2: d.w - 52, y2: 58, stroke: PAL.rule, 'stroke-width': 4.4 }));
      const bw = (d.w - 86) / 4;
      [0.5, 0.85, 0.65, 1].forEach((v, i) => kids.push(h('rect', { x: 16 + i * (bw + 7), y: d.h - 24 - 54 * v, width: bw, height: 54 * v, rx: 3.5, fill: i === 3 ? PAL.rust : PAL.accentSoft })));
      kids.push(h('circle', { cx: d.w - 30, cy: 62, r: 13, fill: 'none', stroke: PAL.rust, 'stroke-width': 1.9 }));
      kids.push(h('rect', { x: d.w - 33, y: 54, width: 6, height: 11, rx: 3, fill: PAL.rust }));
      kids.push(h('line', { x1: d.w - 30, y1: 67, x2: d.w - 30, y2: 72, stroke: PAL.rust, 'stroke-width': 1.9 }));
      if (label) kids.push(txt(d.w / 2, d.h + 17, label, { 'text-anchor': 'middle', 'font-size': 12.5, fill: PAL.ink50, 'font-family': 'var(--font-mono)' }));
    } else if (a.kind === 'layer') {
      kids.push(h('rect', { width: d.w, height: d.h, rx: 10, fill: a.fill || '#fff', stroke: col, 'stroke-width': 1.6, 'data-glow': '' }));
      kids.push(h('rect', { width: 8, height: d.h, rx: 4, fill: col }));
      kids.push(txt(22, d.h / 2, label, { 'font-size': 16.5, 'font-weight': 600, fill: PAL.ink }));
      if (sub) kids.push(txt(d.w - 16, d.h / 2, sub, { 'text-anchor': 'end', 'font-size': 12, fill: PAL.ink50, 'font-family': 'var(--font-mono)' }));
    } else if (a.kind === 'label') {
      const lines = S.wrap(label, a.wrap || 40);
      lines.forEach((ln, i) => kids.push(txt(0, i * ((a.size || 16) + 6), ln, {
        'text-anchor': a.anchor || 'middle', 'font-size': a.size || 16, 'font-weight': a.weight || 600,
        fill: col, 'font-family': a.mono ? 'var(--font-mono)' : 'inherit', 'data-count': a.countable ? '' : undefined,
      })));
    } else if (a.kind === 'link') {
      const mx = (a.x1 + a.x2) / 2 + (a.curve || 0) * ((a.y2 - a.y1) ? 1 : 0);
      const my = (a.y1 + a.y2) / 2 + (a.curve || 0);
      const dpath = 'M' + a.x1 + ',' + a.y1 + ' Q' + mx + ',' + my + ' ' + a.x2 + ',' + a.y2;
      kids.push(h('path', { d: dpath, fill: 'none', stroke: col, 'stroke-width': a.width || 2.2, 'stroke-dasharray': a.dashed ? '6 7' : 'none', 'marker-end': a.arrow ? 'url(#sim-arrow)' : undefined, 'data-link': '' }));
    }
    /* Outer g: static placement via the SVG transform attribute (never touched
       by GSAP). Inner g[data-anim]: the animation target — GSAP x/y/scale and
       opacity live on its inline style, composing OVER the outer placement. */
    const ax = st.actors[a.id] || { x: 0, y: 0, o: 1 };
    const innerStyle = 'opacity:' + ax.o + ';' + ((ax.x || ax.y) ? 'transform: translate(' + ax.x + 'px,' + ax.y + 'px);' : '');
    return h('g', { 'data-sim': a.id, transform: a.kind === 'link' ? undefined : 'translate(' + (a.x || 0) + ',' + (a.y || 0) + ')' }, [
      h('g', { 'data-anim': '', style: innerStyle }, kids),
    ]);
  }

  /* ====================== the component ====================== */
  window.VWComponents = window.VWComponents || {};
  window.VWComponents['sim-player'] = {
    props: {
      kind: { type: String, default: '' },
      sim: { type: String, default: '' },
      start: { type: Number, default: 0 },
    },
    data() {
      return { dataset: null, error: null, ch: this.start || 0, playing: false, fs: false, showNarr: false, showCaps: false,
               progress: 0, chDur: 30, audioOk: true, ready: false, animated: S.gsapOK() };
    },
    computed: {
      loc() { return (window.VWStore && window.VWStore.locale) === 'fr' ? 'fr' : 'en'; },
      simObj() { return this.dataset; },
      chapters() { return (this.dataset && this.dataset.chapters) || []; },
      chapter() { return this.chapters[this.ch] || null; },
      captions() {
        return ((this.chapter && this.chapter.steps) || []).filter(s => s.do === 'caption')
          .map(s => ({ t: s.t, text: s.text })).sort((a, b) => a.t - b.t);
      },
      currentCaption() {
        let cur = '';
        for (const c of this.captions) { if (c.t <= this.progress + 1e-6) cur = S.t(c.text, this.loc); else break; }
        return cur;
      },
      stateAtStart() {
        if (!this.dataset) return null;
        const st = baseState(this.dataset);
        for (let i = 0; i < this.ch; i++) applySteps(st, this.chapters[i].steps, this.dataset);
        return st;
      },
      renderState() {
        if (!this.dataset) return null;
        const st = clone(this.stateAtStart);
        if (!this.animated && this.chapter) applySteps(st, this.chapter.steps, this.dataset);   // static storyboard: chapter end state
        return st;
      },
      viewBox() {
        const c = (this.renderState && this.renderState.cam) || { x: S.VB_W / 2, y: S.VB_H / 2, z: 1 };
        const vw = S.VB_W / c.z, vh = S.VB_H / c.z;
        return (c.x - vw / 2) + ' ' + (c.y - vh / 2) + ' ' + vw + ' ' + vh;
      },
      narration() { return this.chapter ? S.t(this.chapter.narration, this.loc) : ''; },
      audioSrc() { return this.chapter ? 'public/audio/' + this.loc + '/sims/' + this.dataset.id + '/' + this.chapter.id + '.mp3' : ''; },
      timeLabel() { return S.fmtTime(this.progress * this.chDur) + ' / ' + S.fmtTime(this.chDur); },
      L() {
        return this.loc === 'fr'
          ? { play: 'Lecture', pause: 'Pause', replay: 'Rejouer', expand: 'Plein écran', close: 'Fermer', transcript: 'Transcription', hide: 'Masquer la transcription', caps: 'Sous-titres', chapter: 'Chapitre', staticNote: 'Mode storyboard (animation désactivée)' }
          : { play: 'Play', pause: 'Pause', replay: 'Replay', expand: 'Expand', close: 'Close', transcript: 'Transcript', hide: 'Hide transcript', caps: 'Captions', chapter: 'Chapter', staticNote: 'Storyboard mode (animation off)' };
      },
    },
    watch: {
      loc() { this.stopAll(); this.$nextTick(() => this.primeChapter()); },
      ch() { this.$nextTick(() => this.primeChapter()); },
    },
    created() {
      S.loadData(this.sim).then(d => { this.dataset = d; this.$nextTick(() => this.primeChapter()); })
        .catch(e => { this.error = 'Simulation "' + this.sim + '" failed to load: ' + e.message; });
    },
    mounted() {
      this._tick = () => this.syncTick();
      if (typeof gsap !== 'undefined') gsap.ticker.add(this._tick);
      else this._iv = setInterval(this._tick, 120);
      /* local-only hook for the screenshot QA harness (scripts/screenshot-sim.mjs) */
      if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
        window.__simPlayers = window.__simPlayers || [];
        window.__simPlayers.push(this);
      }
    },
    beforeUnmount() {
      this.stopAll();
      if (typeof gsap !== 'undefined' && this._tick) gsap.ticker.remove(this._tick);
      if (this._iv) clearInterval(this._iv);
      if (this._esc) window.removeEventListener('keydown', this._esc);
    },
    methods: {
      /* ---------- chapter lifecycle ---------- */
      actorById(id) { return (this.dataset.actors || []).find(a => a.id === id); },
      el(id) {
        const root = this.$refs.svg;
        if (!root) return null;
        if (id.includes('.')) {
          const [aid, part] = id.split('.');
          return root.querySelector('[data-sim="' + aid + '"] [data-part="' + part + '"]');
        }
        return root.querySelector('[data-sim="' + id + '"] > [data-anim]');
      },
      els(sp) { return (sp.id ? [sp.id] : (sp.ids || [])).map(id => this.el(id)).filter(Boolean); },
      stopAll() {
        this.playing = false;
        const au = this.$refs.audio; if (au) { try { au.pause(); } catch (e) {} }
        if (this._tl) { try { this._tl.kill(); } catch (e) {} this._tl = null; }
        const ov = this.$refs.overlay; if (ov) while (ov.firstChild) ov.removeChild(ov.firstChild);
      },
      primeChapter() {
        if (!this.dataset || !this.chapter) return;
        this.stopAll();
        this.progress = 0;
        this.ready = false;
        const au = this.$refs.audio;
        const fallback = this.chapter.dur || 30;
        const done = (ok, dur) => {
          this.audioOk = ok;
          this.chDur = ok && isFinite(dur) && dur > 1 ? dur : fallback;
          if (this.animated) this.buildTimeline();
          this.ready = true;
          if (this._autoplay) { this._autoplay = false; this.play(); }
        };
        if (!au) { done(false, 0); return; }
        au.src = this.audioSrc;
        const onMeta = () => { cleanup(); done(true, au.duration); };
        const onErr = () => { cleanup(); done(false, 0); };
        const cleanup = () => { au.removeEventListener('loadedmetadata', onMeta); au.removeEventListener('error', onErr); };
        au.addEventListener('loadedmetadata', onMeta);
        au.addEventListener('error', onErr);
        au.load();
      },

      /* ---------- timeline construction (animated mode) ---------- */
      buildTimeline() {
        const D = this.chDur;
        const tl = gsap.timeline({ paused: true });
        const sim = this.dataset;
        const simState = clone(this.stateAtStart);            // evolves as we lay tweens, so "from" values chain correctly
        const camProxy = Object.assign({}, simState.cam);
        const applyCam = () => {
          const vw = S.VB_W / camProxy.z, vh = S.VB_H / camProxy.z;
          const svg = this.$refs.svg;
          if (svg) svg.setAttribute('viewBox', (camProxy.x - vw / 2) + ' ' + (camProxy.y - vh / 2) + ' ' + vw + ' ' + vh);
        };
        const steps = (this.chapter.steps || []).slice().sort((a, b) => (a.t || 0) - (b.t || 0));
        steps.forEach(sp => {
          const pos = Math.max(0, Math.min(1, sp.t || 0)) * D;
          const dur = Math.min(sp.dur != null ? sp.dur : 0.8, Math.max(0.1, D - pos));
          const ease = sp.ease || 'power2.inOut';
          if (sp.do === 'show' || sp.do === 'hide') {
            const to = sp.do === 'show' ? 1 : 0;
            this.els(sp).forEach((el, i) => {
              const idStr = (sp.id || sp.ids[i]);
              const from = idStr.includes('.') ? (simState.parts[idStr] || 0) : (simState.actors[idStr] ? simState.actors[idStr].o : 0);
              const stag = (sp.stagger || 0) * i;
              if (sp.fx === 'rise' && !idStr.includes('.')) {
                const ax = simState.actors[idStr] || { x: 0, y: 0 };
                tl.fromTo(el, { autoAlpha: from, x: ax.x, y: ax.y + 16 }, { autoAlpha: to, x: ax.x, y: ax.y, duration: dur, ease, immediateRender: pos === 0 }, pos + stag);
              } else if (sp.fx === 'pop') {
                tl.fromTo(el, { autoAlpha: from, scale: 0.55, transformOrigin: '50% 50%' }, { autoAlpha: to, scale: 1, duration: dur, ease: 'back.out(1.8)', immediateRender: pos === 0 }, pos + stag);
              } else {
                tl.fromTo(el, { autoAlpha: from }, { autoAlpha: to, duration: dur, ease: 'power1.inOut', immediateRender: pos === 0 }, pos + stag);
              }
              if (idStr.includes('.')) simState.parts[idStr] = to; else if (simState.actors[idStr]) simState.actors[idStr].o = to;
            });
          } else if (sp.do === 'move') {
            this.els(sp).forEach((el) => {
              const idStr = sp.id || sp.ids[0];
              const a = simState.actors[idStr] || { x: 0, y: 0 };
              const tx = sp.x != null ? sp.x : a.x, tyy = sp.y != null ? sp.y : a.y;
              tl.fromTo(el, { x: a.x, y: a.y }, { x: tx, y: tyy, duration: dur, ease, immediateRender: pos === 0 }, pos);
              a.x = tx; a.y = tyy;
            });
          } else if (sp.do === 'cam') {
            const from = Object.assign({}, simState.cam);
            const to = { x: sp.x != null ? sp.x : from.x, y: sp.y != null ? sp.y : from.y, z: sp.z != null ? sp.z : from.z };
            tl.fromTo(camProxy, { x: from.x, y: from.y, z: from.z }, { x: to.x, y: to.y, z: to.z, duration: dur, ease, onUpdate: applyCam, immediateRender: pos === 0 }, pos);
            simState.cam = to;
          } else if (sp.do === 'pulse') {
            this.els(sp).forEach((el, i) => {
              tl.to(el, { scale: sp.amt || 1.14, transformOrigin: '50% 50%', duration: 0.3, yoyo: true, repeat: (sp.n || 2) * 2 - 1, ease: 'sine.inOut' }, pos + (sp.stagger || 0) * i);
            });
          } else if (sp.do === 'glow') {
            this.els(sp).forEach((el, i) => {
              const shape = el.querySelector('[data-glow]') || el;
              tl.to(shape, { attr: { stroke: sp.color || PAL.rust, 'stroke-width': 3 }, duration: 0.35, yoyo: true, repeat: (sp.n || 2) * 2 - 1, ease: 'sine.inOut' }, pos + (sp.stagger || 0) * i);
            });
          } else if (sp.do === 'flow') {
            this.addFlow(tl, sp, pos, simState);
          } else if (sp.do === 'count') {
            const el = this.el(sp.id), tEl = el && (el.querySelector('[data-count]') || el.querySelector('text'));
            if (tEl) {
              const proxy = { v: sp.from != null ? sp.from : (simState.counts[sp.id] || 0) };
              tl.to(proxy, { v: sp.to, duration: dur, ease: 'power1.out', onUpdate: () => { tEl.textContent = (sp.pre || '') + Math.round(proxy.v) + (sp.post || ''); } }, pos);
              simState.counts[sp.id] = sp.to;
            }
          } else if (sp.do === 'draw') {
            this.els(sp).forEach((el) => {
              const p = el.querySelector('[data-link]');
              if (!p) return;
              const len = p.getTotalLength ? p.getTotalLength() : 600;
              tl.set(el, { autoAlpha: 1 }, pos);
              tl.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: dur, ease, immediateRender: pos === 0 }, pos);
              simState.actors[sp.id] && (simState.actors[sp.id].o = 1);
              simState.drawn[sp.id] = 1;
            });
          }
        });
        tl.set({}, {}, D);    // pin the timeline length to the audio length
        this._tl = tl;
      },
      /* moving dots between two actors, looping inside a time window */
      addFlow(tl, sp, pos, simState) {
        const ov = this.$refs.overlay;
        const A = this.actorById(sp.from), B = this.actorById(sp.to);
        if (!ov || !A || !B) return;
        const sa = simState.actors[A.id] || { x: 0, y: 0 }, sb = simState.actors[B.id] || { x: 0, y: 0 };
        const ca = centerOf(A), cb = centerOf(B);
        const p0 = { x: ca.x + sa.x, y: ca.y + sa.y }, p1 = { x: cb.x + sb.x, y: cb.y + sb.y };
        const mid = { x: (p0.x + p1.x) / 2 + (sp.curve || 0), y: (p0.y + p1.y) / 2 + (sp.curveY != null ? sp.curveY : -40) };
        const n = sp.n || 3, travel = sp.travel || 1.7;
        const span = Math.min(sp.span != null ? sp.span : 6, this.chDur - pos);
        const reps = Math.max(0, Math.floor((span - travel) / travel));
        for (let i = 0; i < n; i++) {
          const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          dot.setAttribute('r', String(sp.r || 5.5));
          dot.setAttribute('fill', sp.color || PAL.agent);
          dot.setAttribute('stroke', '#fff');
          dot.setAttribute('stroke-width', '1.6');
          dot.setAttribute('opacity', '0');
          ov.appendChild(dot);
          const proxy = { t: 0 };
          tl.fromTo(proxy, { t: 0 }, {
            t: 1, duration: travel, ease: 'none', repeat: reps,
            onUpdate: () => {
              const u = proxy.t, v = 1 - u;
              const x = v * v * p0.x + 2 * v * u * mid.x + u * u * p1.x;
              const y = v * v * p0.y + 2 * v * u * mid.y + u * u * p1.y;
              dot.setAttribute('transform', 'translate(' + x + ',' + y + ')');
              dot.setAttribute('opacity', String(u < 0.1 ? u / 0.1 : u > 0.9 ? (1 - u) / 0.1 : 1));
            },
          }, pos + i * (travel / n));
        }
      },

      /* ---------- transport ---------- */
      syncTick() {
        if (!this.playing) return;
        const au = this.$refs.audio;
        if (this.audioOk && au) {
          const ct = Math.min(au.currentTime, this.chDur);
          if (this._tl) this._tl.time(ct, false);
          this.progress = this.chDur ? ct / this.chDur : 0;
          if (au.ended) this.onEnded();
        } else if (this._tl) {
          this.progress = this.chDur ? this._tl.time() / this.chDur : 0;
          if (this._tl.time() >= this.chDur - 0.02) this.onEnded();
        } else {
          this.progress = Math.min(1, this.progress + 0.12 / this.chDur);
          if (this.progress >= 1) this.onEnded();
        }
      },
      play() {
        if (!this.ready) { this._autoplay = true; return; }
        if (this.progress >= 0.999) this.seekTo(0);
        this.playing = true;
        const au = this.$refs.audio;
        if (this.audioOk && au) { au.play().catch(() => { this.audioOk = false; if (this._tl) this._tl.play(); }); }
        else if (this._tl) this._tl.play();
      },
      pause() {
        this.playing = false;
        const au = this.$refs.audio; if (au) { try { au.pause(); } catch (e) {} }
        if (this._tl && !this.audioOk) this._tl.pause();
      },
      toggle() { this.playing ? this.pause() : this.play(); },
      seekTo(frac) {
        const tme = Math.max(0, Math.min(1, frac)) * this.chDur;
        const au = this.$refs.audio;
        if (this.audioOk && au) { try { au.currentTime = tme; } catch (e) {} }
        if (this._tl) this._tl.time(tme, false);
        this.progress = this.chDur ? tme / this.chDur : 0;
      },
      onScrub(e) { this.seekTo(Number(e.target.value) / 1000); },
      onEnded() {
        this.pause();
        this.progress = 1;
        if (this.ch < this.chapters.length - 1) { this._autoplay = true; this.ch++; }
      },
      go(i) { if (i === this.ch) { this.seekTo(0); return; } this.pause(); this.ch = i; },
      toggleFs() {
        this.fs = !this.fs;
        if (this.fs) { this._esc = (e) => { if (e.key === 'Escape') this.toggleFs(); }; window.addEventListener('keydown', this._esc); }
        else if (this._esc) { window.removeEventListener('keydown', this._esc); this._esc = null; }
      },
    },

    render() {
      const sim = this.dataset;
      if (this.error) return h('div', { class: 'sim-fig' }, [h('div', { style: 'padding:24px;color:var(--highlight);font-size:12px;' }, this.error)]);
      if (!sim) return h('div', { class: 'sim-fig' }, [h('div', { style: 'padding:28px;text-align:center;color:var(--ink-50);font-size:12px;' }, 'Loading simulation…')]);
      const st = this.renderState, loc = this.loc;

      /* Paint order: regions and connectors under structure, structure under
         interfaces and labels, people and agents always on top — so an agent
         crossing a gateway is never hidden behind it. Stable within a rank. */
      const RANK = { zone: 0, link: 1, layer: 2, box: 3, sys: 3, disc: 3, label: 4, ui: 5, pill: 6, person: 7, agent: 8 };
      const world = (sim.actors || [])
        .map((a, i) => ({ a, i }))
        .sort((m, n) => ((RANK[m.a.kind] != null ? RANK[m.a.kind] : 3) - (RANK[n.a.kind] != null ? RANK[n.a.kind] : 3)) || (m.i - n.i))
        .map(({ a }) => drawActor(a, loc, st));
      const svg = h('svg', {
        ref: 'svg', class: 'sim-svg', viewBox: this.viewBox, preserveAspectRatio: 'xMidYMid meet',
        role: 'img', 'aria-label': this.narration,
        key: 'ch' + this.ch + ':' + loc,                       // re-render per chapter/locale, GSAP owns it in between
      }, [
        h('defs', {}, [
          h('marker', { id: 'sim-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, [
            h('path', { d: 'M0 0 L10 5 L0 10 z', fill: PAL.ink70 }),
          ]),
        ]),
        h('g', {}, world),
        h('g', { ref: 'overlay' }),
      ]);

      const chips = this.chapters.map((c, i) => h('button', {
        class: ['sim-chip', i === this.ch ? 'active' : '', i < this.ch ? 'done' : ''],
        onClick: () => this.go(i), 'aria-pressed': i === this.ch ? 'true' : 'false',
      }, (i + 1) + ' · ' + S.t(c.title, loc)));

      return h('div', { class: 'sim-fig' }, [
        h('div', { class: ['sim-frame', this.fs ? 'sim-fs' : ''] }, [
          h('div', { class: 'sim-bar' }, [
            h('h3', { class: 'sim-title' }, S.t(sim.title, loc)),
            h('span', { class: 'sim-spacer' }),
            h('button', { class: 'sim-btn sim-primary', onClick: () => this.toggle(), disabled: !this.ready }, this.playing ? this.L.pause : (this.progress >= 0.999 && this.ch === this.chapters.length - 1 ? this.L.replay : this.L.play)),
            h('button', { class: ['sim-btn', this.showCaps ? 'on' : ''], onClick: () => { this.showCaps = !this.showCaps; }, 'aria-pressed': this.showCaps ? 'true' : 'false' }, this.L.caps),
            h('button', { class: 'sim-btn', onClick: () => this.toggleFs() }, this.fs ? this.L.close : this.L.expand),
          ]),
          h('div', { class: 'sim-stage' }, [
            svg,
            !this.animated ? h('div', { class: 'sim-static-note' }, this.L.staticNote) : null,
            h('div', { class: 'sim-caption', 'aria-live': 'polite' }, this.showCaps ? this.currentCaption : ''),
          ]),
          h('div', { class: 'sim-transport' }, [
            h('input', { class: 'sim-scrub', type: 'range', min: 0, max: 1000, value: Math.round(this.progress * 1000), onInput: this.onScrub, 'aria-label': 'Timeline' }),
            h('span', { class: 'sim-time' }, this.timeLabel),
          ]),
          h('div', { class: 'sim-chapters', role: 'tablist' }, chips),
          h('div', { class: 'sim-meta' }, [
            h('div', { class: 'sim-meta-title' }, (this.ch + 1) + ' · ' + S.t(this.chapter && this.chapter.title, loc)),
            h('div', { class: 'sim-meta-blurb' }, S.t(sim.blurb, loc)),
            h('button', { class: 'sim-btn', style: 'margin-top:8px;', onClick: () => { this.showNarr = !this.showNarr; } }, this.showNarr ? this.L.hide : this.L.transcript),
            this.showNarr ? h('p', { class: 'sim-narr' }, this.narration) : null,
          ]),
          h('audio', { ref: 'audio', preload: 'metadata' }),
          h('span', { class: 'sim-sr' }, this.narration),
        ]),
      ]);
    },
  };

  if (window.VWVisuals) window.VWVisuals.registerBespoke('sim', 'player', 'sim-player');
})();
