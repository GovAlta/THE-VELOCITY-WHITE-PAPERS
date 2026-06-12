/* sim:manifold — the story drawn in light (owner: sim).

   Embed in a paper with:
       chart: { kind: "sim:manifold", sim: "gov3-manifold" }

   The fifth telling. Particles are the medium, never the message: every noun
   in the narration condenses into a legible pictogram — towers of light for
   the ministry systems, walking figures for the public servants, green comets
   for the agents, a red lattice for the wall of missing interfaces — and
   every verb is a visible event timed to the words. The agent strikes the
   wall and deflects. Doors stamp gold onto the towers one by one. The audit
   ledger writes itself line by line. A public servant speaks, and the agent
   condenses out of the words.

   The dataset declares a CAST (pictogram entities, each owning a slice of the
   particle pool) and per-chapter BEATS (choreography keyed to fractions of
   the narration). The whole scene is a pure function of (chapter, progress):
   every frame re-evaluates all beats up to the playhead, so scrubbing and
   chapter jumps are exact by construction. Per-particle easing and wander are
   ambient texture on top of the deterministic structure.

   Rendered with Three.js Points (dynamic CDN import, additive blending over
   a deep navy void). Labels are billboard text sprites, rebuilt per locale.
   Drag orbits, the wheel zooms, the pointer stirs the field gently. */

(function () {
  const S = window.VWSim;
  if (!S) return;
  const h = S.h;
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.164.1/three.module.min.js';
  const NLINK = 24, NSIG = 90, NFX = 720;

  const COL = {
    system: [0.50, 0.60, 0.92], sealed: [0.66, 0.38, 0.26], open: [0.38, 0.85, 0.66],
    corp: [0.55, 0.62, 0.92], person: [0.99, 0.87, 0.55], agent: [0.30, 0.95, 0.55],
    gold: [0.98, 0.78, 0.30], red: [0.96, 0.22, 0.10], cream: [0.96, 0.93, 0.84],
    dim: [0.30, 0.36, 0.55], white: [1, 1, 1], scan: [0.45, 0.7, 1.0],
  };

  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashId(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  const ez = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
  const clamp01 = u => u < 0 ? 0 : u > 1 ? 1 : u;

  /* ---------- glyph samplers: entity-local particle layouts ----------
     Each writes n*3 floats into `local` and may fill `aux` (one float per
     particle) with a per-particle gate value the writer pass interprets. */
  const SAMPLERS = {
    tower(rnd, local, aux, c) {
      const w = c.w || 4, ht = c.ht || 7, d = c.d || 4, n = local.length / 3;
      for (let j = 0; j < n; j++) {
        const u = rnd(); let x = 0, y = 0, z = 0; aux[j] = 0;
        if (u < 0.5) {                                    // the 12 box edges, verticals favoured
          const e = rnd();
          if (e < 0.55) { const k = Math.floor(rnd() * 4); x = (k % 2 ? 1 : -1) * w / 2; z = (k < 2 ? 1 : -1) * d / 2; y = rnd() * ht; }
          else { const top = rnd() < 0.7; y = top ? ht : 0; const s = rnd() < 0.5; x = s ? (rnd() - 0.5) * w : (rnd() < 0.5 ? 1 : -1) * w / 2; z = s ? (rnd() < 0.5 ? 1 : -1) * d / 2 : (rnd() - 0.5) * d; }
        } else if (u < 0.85) {                            // window rows on the faces
          const row = 1 + Math.floor(rnd() * Math.max(2, ht - 2));
          y = row + 0.2; aux[j] = 1;
          const f = rnd();
          if (f < 0.4) { x = -w / 2 - 0.02; z = (rnd() - 0.5) * d * 0.8; }
          else if (f < 0.7) { z = -d / 2 - 0.02; x = (rnd() - 0.5) * w * 0.8; }
          else { z = d / 2 + 0.02; x = (rnd() - 0.5) * w * 0.8; }
        } else {                                          // sparse interior dust
          x = (rnd() - 0.5) * w * 0.9; y = rnd() * ht; z = (rnd() - 0.5) * d * 0.9;
        }
        local[j * 3] = x; local[j * 3 + 1] = y; local[j * 3 + 2] = z;
      }
    },
    slab(rnd, local, aux, c) {
      const w = c.w || 9, ht = c.ht || 6, d = c.d || 8, n = local.length / 3;
      for (let j = 0; j < n; j++) {
        const u = rnd(); let x, y, z; aux[j] = 0;
        if (u < 0.62) {                                   // the building block
          const e = rnd();
          if (e < 0.5) { const k = Math.floor(rnd() * 4); x = (k % 2 ? 1 : -1) * w / 2; z = (k < 2 ? 1 : -1) * d / 2; y = rnd() * ht; }
          else { x = (rnd() - 0.5) * w; z = (rnd() - 0.5) * d; y = rnd() < 0.5 ? ht : rnd() * ht; aux[j] = y > 1 && rnd() < 0.5 ? 1 : 0; }
        } else {                                          // the cloud puff above: SaaS
          const t1 = rnd() * Math.PI * 2, t2 = Math.acos(2 * rnd() - 1), rr = (w * 0.30) * Math.cbrt(rnd());
          x = rr * Math.sin(t2) * Math.cos(t1) * 1.5; y = ht + 2.4 + rr * Math.cos(t2) * 0.55; z = rr * Math.sin(t2) * Math.sin(t1);
        }
        local[j * 3] = x; local[j * 3 + 1] = y; local[j * 3 + 2] = z;
      }
    },
    person(rnd, local, aux, c) {
      const n = local.length / 3;
      for (let j = 0; j < n; j++) {
        const u = rnd(); let x, y, z; aux[j] = 0;
        if (u < 0.3) {                                    // head
          const t1 = rnd() * Math.PI * 2, t2 = Math.acos(2 * rnd() - 1), rr = 0.5 * Math.cbrt(rnd());
          x = rr * Math.sin(t2) * Math.cos(t1); y = 3.0 + rr * Math.cos(t2); z = rr * Math.sin(t2) * Math.sin(t1);
        } else if (u < 0.85) {                            // torso, tapering
          const k = rnd(); const rr = (0.62 - 0.3 * k) * Math.sqrt(rnd()); const a = rnd() * Math.PI * 2;
          y = 0.7 + k * 1.8; x = Math.cos(a) * rr; z = Math.sin(a) * rr;
        } else {                                          // base
          const a = rnd() * Math.PI * 2; const rr = 0.5 * Math.sqrt(rnd());
          y = 0.15; x = Math.cos(a) * rr; z = Math.sin(a) * rr;
        }
        local[j * 3] = x; local[j * 3 + 1] = y; local[j * 3 + 2] = z;
      }
    },
    orb(rnd, local, aux, c) {
      const r = c.r || 0.7, n = local.length / 3;
      for (let j = 0; j < n; j++) {
        const t1 = rnd() * Math.PI * 2, t2 = Math.acos(2 * rnd() - 1), rr = r * Math.pow(rnd(), 0.6);
        local[j * 3] = rr * Math.sin(t2) * Math.cos(t1);
        local[j * 3 + 1] = rr * Math.cos(t2);
        local[j * 3 + 2] = rr * Math.sin(t2) * Math.sin(t1);
        aux[j] = 0;
      }
    },
    wall(rnd, local, aux, c) {
      const len = c.len || 30, ht = c.ht || 10, n = local.length / 3;
      for (let j = 0; j < n; j++) {
        const u = rnd(); let y, z;
        if (u < 0.72) {                                   // lattice lines
          if (rnd() < 0.5) { z = (Math.floor(rnd() * 11) / 10 - 0.5) * len; y = rnd() * ht; }
          else { y = (Math.floor(rnd() * 8) / 7) * ht; z = (rnd() - 0.5) * len; }
        } else { z = (rnd() - 0.5) * len; y = rnd() * ht; }
        local[j * 3] = (rnd() - 0.5) * 0.3; local[j * 3 + 1] = y; local[j * 3 + 2] = z;
        aux[j] = rnd();                                   // drift seed for the dissolve
      }
    },
    ring(rnd, local, aux, c) {
      const r = c.r || 1.1, n = local.length / 3;
      for (let j = 0; j < n; j++) {
        const a = (j / n) * Math.PI * 2 + rnd() * 0.12;
        local[j * 3] = (rnd() - 0.5) * 0.1;               // ring in the Y-Z plane, facing -x
        local[j * 3 + 1] = Math.sin(a) * r;
        local[j * 3 + 2] = Math.cos(a) * r;
        aux[j] = 0;
      }
    },
    halo(rnd, local, aux, c) {
      const r = c.r || 1.0, n = local.length / 3;
      for (let j = 0; j < n; j++) {
        const a = (j / n) * Math.PI * 2;
        local[j * 3] = Math.cos(a) * r;                   // ring in the X-Z plane: a crown
        local[j * 3 + 1] = (rnd() - 0.5) * 0.08;
        local[j * 3 + 2] = Math.sin(a) * r;
        aux[j] = 0;
      }
    },
    ledger(rnd, local, aux, c) {
      const w = c.w || 9, ht = c.ht || 6.5, rows = 9, n = local.length / 3;
      for (let j = 0; j < n; j++) {
        const u = rnd(); let x, y; aux[j] = -1;
        if (u < 0.3) {                                    // border, always lit once formed
          const e = rnd();
          if (e < 0.5) { x = (rnd() - 0.5) * w; y = rnd() < 0.5 ? 0 : ht; }
          else { x = (rnd() < 0.5 ? -0.5 : 0.5) * w; y = rnd() * ht; }
        } else {                                          // the rows: revealed by fill
          const row = Math.floor(rnd() * rows);
          aux[j] = (row + 0.5) / rows;
          y = ht - 0.7 - row * ((ht - 1.2) / rows);
          x = -w / 2 + 0.6 + rnd() * (w - 1.2) * (0.55 + 0.45 * rnd());
        }
        local[j * 3] = x; local[j * 3 + 1] = y; local[j * 3 + 2] = (rnd() - 0.5) * 0.15;
      }
    },
    dome(rnd, local, aux, c) {
      const r = c.r || 6.5, n = local.length / 3;
      for (let j = 0; j < n; j++) {
        const u = rnd(); let t1, t2; aux[j] = 0;
        if (u < 0.42) { t1 = (Math.floor(rnd() * 8) / 8) * Math.PI * 2 + 0.02 * rnd(); t2 = rnd() * Math.PI / 2; }       // meridians
        else if (u < 0.78) { t2 = (Math.floor(rnd() * 4) / 4) * (Math.PI / 2.2) + 0.15; t1 = rnd() * Math.PI * 2; }       // parallels
        else { t1 = rnd() * Math.PI * 2; t2 = Math.acos(rnd()); }                                                          // fill
        local[j * 3] = r * Math.sin(t2) * Math.cos(t1);
        local[j * 3 + 1] = r * Math.cos(t2);
        local[j * 3 + 2] = r * Math.sin(t2) * Math.sin(t1);
      }
    },
    panel(rnd, local, aux, c) {
      const w = c.w || 7, ht = c.ht || 4.6, n = local.length / 3;
      for (let j = 0; j < n; j++) {
        const u = rnd(); let x, y; aux[j] = 0;
        if (u < 0.34) {                                   // border
          const e = rnd();
          if (e < 0.5) { x = (rnd() - 0.5) * w; y = (rnd() < 0.5 ? -0.5 : 0.5) * ht; }
          else { x = (rnd() < 0.5 ? -0.5 : 0.5) * w; y = (rnd() - 0.5) * ht; }
        } else if (u < 0.56) {                            // text rows, upper-left
          const row = Math.floor(rnd() * 3);
          y = ht * 0.32 - row * 0.55; x = -w * 0.42 + rnd() * w * 0.45;
        } else if (u < 0.82) {                            // the chart bars, lower-left
          const b = Math.floor(rnd() * 4); const hmax = [0.9, 1.6, 1.2, 1.9][b];
          x = -w * 0.4 + b * 0.8 + (rnd() - 0.5) * 0.25; y = -ht * 0.42 + rnd() * hmax;
        } else {                                          // the approve button, right
          aux[j] = 3;
          x = w * 0.26 + rnd() * w * 0.18; y = -ht * 0.18 + (rnd() - 0.5) * 0.8;
        }
        local[j * 3] = x; local[j * 3 + 1] = y; local[j * 3 + 2] = (rnd() - 0.5) * 0.12;
      }
    },
    doc(rnd, local, aux, c) {
      const w = 1.7, ht = 2.3, n = local.length / 3;
      for (let j = 0; j < n; j++) {
        const u = rnd(); let x, y; aux[j] = -1;
        if (u < 0.45) {
          const e = rnd();
          if (e < 0.5) { x = (rnd() - 0.5) * w; y = (rnd() < 0.5 ? -0.5 : 0.5) * ht; }
          else { x = (rnd() < 0.5 ? -0.5 : 0.5) * w; y = (rnd() - 0.5) * ht; }
        } else {
          const row = Math.floor(rnd() * 4); aux[j] = (row + 0.5) / 4;
          y = ht * 0.32 - row * 0.5; x = -w * 0.36 + rnd() * w * 0.72 * (0.6 + 0.4 * rnd());
        }
        local[j * 3] = x; local[j * 3 + 1] = y; local[j * 3 + 2] = (rnd() - 0.5) * 0.1;
      }
    },
    floor(rnd, local, aux, c) {
      const ex = 92, ez2 = 72, n = local.length / 3;
      for (let j = 0; j < n; j++) {
        let x, z;
        if (rnd() < 0.5) { x = (Math.floor(rnd() * 13) / 12 - 0.5) * ex; z = (rnd() - 0.5) * ez2; }
        else { z = (Math.floor(rnd() * 11) / 10 - 0.5) * ez2; x = (rnd() - 0.5) * ex; }
        local[j * 3] = x; local[j * 3 + 1] = 0; local[j * 3 + 2] = z;
        aux[j] = 0;
      }
    },
  };

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['sim-manifold'] = {
    props: {
      kind: { type: String, default: '' },
      sim: { type: String, default: '' },
      start: { type: Number, default: 0 },
    },
    data() {
      return { dataset: null, error: null, ch: this.start || 0, playing: false, fs: false, showNarr: false, showCaps: false,
               progress: 0, chDur: 30, audioOk: true, ready: false, webgl: true, motion: !S.prefersReducedMotion };
    },
    computed: {
      loc() { return (window.VWStore && window.VWStore.locale) === 'fr' ? 'fr' : 'en'; },
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
      narration() { return this.chapter ? S.t(this.chapter.narration, this.loc) : ''; },
      audioSrc() {
        const aud = this.dataset.audioSim || this.dataset.id;
        return this.chapter ? 'public/audio/' + this.loc + '/sims/' + aud + '/' + this.chapter.id + '.mp3' : '';
      },
      timeLabel() { return S.fmtTime(this.progress * this.chDur) + ' / ' + S.fmtTime(this.chDur); },
      L() {
        return this.loc === 'fr'
          ? { play: 'Lecture', pause: 'Pause', replay: 'Rejouer', expand: 'Plein écran', close: 'Fermer', transcript: 'Transcription', hide: 'Masquer la transcription', caps: 'Sous-titres',
              hint: 'glissez pour orbiter · molette pour zoomer · le champ frémit sous le pointeur',
              nowebgl: 'La 3D n’est pas disponible dans ce navigateur. La narration et la transcription restent accessibles.' }
          : { play: 'Play', pause: 'Pause', replay: 'Replay', expand: 'Expand', close: 'Close', transcript: 'Transcript', hide: 'Hide transcript', caps: 'Captions',
              hint: 'drag to orbit · scroll to zoom · the field stirs under your pointer',
              nowebgl: '3D is not available in this browser. The narration and transcript remain available.' };
      },
    },
    watch: {
      loc() { this.stopAll(); this.rebuildLabels(); this.$nextTick(() => this.primeChapter()); },
      ch() { this.$nextTick(() => this.primeChapter()); },
      fs() { this.$nextTick(() => this.fitCanvas()); },
    },
    created() {
      S.loadData(this.sim).then(d => { this.dataset = d; this.bootThree(); })
        .catch(e => { this.error = 'Simulation "' + this.sim + '" failed to load: ' + e.message; });
    },
    mounted() {
      this._tick = () => this.syncTick();
      this._iv = setInterval(this._tick, 80);
      if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
        window.__simPlayers = window.__simPlayers || [];
        window.__simPlayers.push(this);
      }
      this._onResize = () => this.fitCanvas();
      window.addEventListener('resize', this._onResize);
    },
    beforeUnmount() {
      this.stopAll();
      if (this._iv) clearInterval(this._iv);
      if (this._rafId) cancelAnimationFrame(this._rafId);
      window.removeEventListener('resize', this._onResize);
      if (this._esc) window.removeEventListener('keydown', this._esc);
      if (this._renderer) { try { this._renderer.dispose(); } catch (e) {} }
    },
    methods: {
      /* ---------- three bootstrap ---------- */
      bootThree() {
        import(/* @vite-ignore */ THREE_URL).then(T => {
          this._T = T;
          this.$nextTick(() => {
            try { this.initScene(); this.primeChapter(); this.startLoop(); }
            catch (e) { this.webgl = false; this.primeChapter(); }
          });
        }).catch(() => { this.webgl = false; this.$nextTick(() => this.primeChapter()); });
      },
      initScene() {
        const T = this._T, host = this.$refs.stage3d;
        const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setClearColor(0x0b1124, 1);
        host.appendChild(renderer.domElement);
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.width = '100%';
        this._renderer = renderer;
        const scene = new T.Scene();
        scene.fog = new T.FogExp2(0x0b1124, 0.0075);
        this._scene = scene;
        this._camera = new T.PerspectiveCamera(46, 16 / 9, 0.1, 600);
        this._user = { th: 0, ph: 0, zoom: 1 };

        this.buildWorld();

        /* the particle pool */
        const N = this._N;
        const pos = new Float32Array(N * 3);
        const col = new Float32Array(N * 3);
        const tgt = new Float32Array(N * 3);
        const spd = new Float32Array(N);
        this._P = { pos, col, tgt, spd };
        const rnd = mulberry(1879);
        for (let i = 0; i < N; i++) {
          pos[i * 3] = (rnd() - 0.5) * 110; pos[i * 3 + 1] = (rnd() - 0.5) * 50; pos[i * 3 + 2] = (rnd() - 0.5) * 110;
          spd[i] = 2.2 + rnd() * 4.2;
        }
        /* comet tails: agent orbs get a wide speed spread, slow stragglers trail */
        for (const e of this._entList) {
          if (e.kind !== 'orb') continue;
          const r2 = mulberry(hashId(e.id) ^ 77);
          for (let j = 0; j < e.n; j++) spd[e.i0 + j] = 1.2 + Math.pow(r2(), 1.6) * 9;
        }
        const geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.BufferAttribute(pos, 3));
        geo.setAttribute('color', new T.BufferAttribute(col, 3));
        const tex = this.dotTexture();
        const mat = new T.PointsMaterial({ size: 0.78, vertexColors: true, map: tex, alphaMap: tex,
          transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
        this._points = new T.Points(geo, mat);
        this._points.frustumCulled = false;
        scene.add(this._points);

        /* links (entity-to-entity threads) + signal pulses */
        const lpos = new Float32Array(NLINK * 2 * 3);
        const lcol = new Float32Array(NLINK * 2 * 3);
        const lgeo = new T.BufferGeometry();
        lgeo.setAttribute('position', new T.BufferAttribute(lpos, 3));
        lgeo.setAttribute('color', new T.BufferAttribute(lcol, 3));
        this._links = new T.LineSegments(lgeo, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, blending: T.AdditiveBlending }));
        this._links.frustumCulled = false;
        scene.add(this._links);
        const spos = new Float32Array(NSIG * 3);
        const scol = new Float32Array(NSIG * 3);
        const sgeo = new T.BufferGeometry();
        sgeo.setAttribute('position', new T.BufferAttribute(spos, 3));
        sgeo.setAttribute('color', new T.BufferAttribute(scol, 3));
        this._signals = new T.Points(sgeo, new T.PointsMaterial({ size: 1.6, vertexColors: true, map: tex, alphaMap: tex,
          transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
        this._signals.frustumCulled = false;
        scene.add(this._signals);

        this.rebuildLabels();
        this.bindPointer(renderer.domElement);
        this.fitCanvas();
      },
      dotTexture() {
        const T = this._T;
        const cv = document.createElement('canvas');
        cv.width = cv.height = 64;
        const c = cv.getContext('2d');
        const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.35, 'rgba(255,255,255,0.7)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, 64, 64);
        return new T.CanvasTexture(cv);
      },

      /* ---------- the cast: allocate pool slices, bake glyphs ---------- */
      buildWorld() {
        const cast = this.dataset.cast || [];
        this._ents = {};
        this._entList = [];
        let i0 = 0;
        for (const c of cast) {
          const n = c.kind === 'label' ? 0 : (c.n || 120);
          const local = new Float32Array(n * 3);
          const aux = new Float32Array(n);
          if (n) SAMPLERS[c.kind](mulberry(hashId(c.id)), local, aux, c);
          /* bake the static yaw into the glyph */
          if (c.ry && n) {
            const co = Math.cos(c.ry), si = Math.sin(c.ry);
            for (let j = 0; j < n; j++) {
              const x = local[j * 3], z = local[j * 3 + 2];
              local[j * 3] = x * co + z * si;
              local[j * 3 + 2] = -x * si + z * co;
            }
          }
          /* scatter cloud the glyph condenses from */
          const scat = new Float32Array(n * 3);
          const r2 = mulberry(hashId(c.id) ^ 9241);
          for (let j = 0; j < n; j++) {
            scat[j * 3] = (c.x || 0) + (r2() - 0.5) * 26;
            scat[j * 3 + 1] = (c.y || 0) + 3 + (r2() - 0.5) * 18;
            scat[j * 3 + 2] = (c.z || 0) + (r2() - 0.5) * 26;
          }
          const ent = { id: c.id, kind: c.kind, n, i0, local, aux, scat, cfg: c,
                        base: [c.x || 0, c.y || 0, c.z || 0],
                        color: COL[c.color] || COL.dim, sprite: null };
          this._ents[c.id] = ent;
          this._entList.push(ent);
          i0 += n;
        }
        this._N = i0 + NFX;
        this._fx0 = i0;
        /* reusable per-frame state objects, one per entity */
        this._st = {};
        for (const e of this._entList) this._st[e.id] = {};
        this._stLinks = [];
        this._stStreams = [];
      },

      /* ---------- labels: billboard text sprites, locale-aware ---------- */
      rebuildLabels() {
        const T = this._T;
        if (!T || !this._scene || !this._entList) return;
        for (const e of this._entList) {
          if (e.sprite) { this._scene.remove(e.sprite); e.sprite.material.map.dispose(); e.sprite.material.dispose(); e.sprite = null; }
          const text = e.cfg.label && S.t(e.cfg.label, this.loc);
          if (!text) continue;
          const cv = document.createElement('canvas');
          const ctx = cv.getContext('2d');
          ctx.font = '600 30px "IBM Plex Mono", monospace';
          const tw = Math.ceil(ctx.measureText(text.toUpperCase()).width) + 36;
          cv.width = tw; cv.height = 64;
          const c2 = cv.getContext('2d');
          c2.font = '600 30px "IBM Plex Mono", monospace';
          c2.textAlign = 'center'; c2.textBaseline = 'middle';
          c2.shadowColor = 'rgba(243,222,160,0.85)'; c2.shadowBlur = 12;
          c2.fillStyle = 'rgba(246,238,214,0.96)';
          c2.fillText(text.toUpperCase(), tw / 2, 33);
          const tex = new T.CanvasTexture(cv);
          const mat = new T.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
          const sp = new T.Sprite(mat);
          sp.userData.aspect = tw / 64;
          sp.renderOrder = 10;
          this._scene.add(sp);
          e.sprite = sp;
        }
      },

      /* ---------- the beat interpreter: state = f(chapter, progress) ---------- */
      computeState(chIdx, p) {
        const st = this._st;
        for (const e of this._entList) {
          const s = st[e.id];
          s.x = e.base[0]; s.y = e.base[1]; s.z = e.base[2];
          s.formed = e.cfg.visible ? 1 : 0;
          s.energy = e.cfg.visible ? 1 : 0;
          s.gain = 1; s.mix = 0; s.mixCol = null; s.fill = 0; s.label = 0;
          s.flare = 0; s.flareAt = null; s.sy = 1; s.btnFlare = 0; s.orbit = null;
          s.healed = 0;
        }
        this._stLinks.length = 0;
        this._stStreams.length = 0;
        this._stWave = null;
        const chs = this.chapters;
        for (let c = 0; c <= chIdx; c++) {
          const beats = chs[c] && chs[c].beats; if (!beats) continue;
          const pc = c < chIdx ? 1 : p;
          for (const b of beats) {
            if (c < chIdx && b.do === 'label' && !b.keep) continue;   // labels retire with their chapter
            const span = b.t[1] - b.t[0] || 1e-4;
            const raw = (pc - b.t[0]) / span;
            if (raw <= 0) continue;
            const latched = b.hold !== false && b.do !== 'flare';
            const f = latched ? ez(raw) : Math.sin(Math.PI * clamp01(raw)) * (raw >= 1 ? 0 : 1);
            if (!latched && raw >= 1) continue;
            this.applyBeat(st, b, f, raw);
          }
        }
        /* resolve parented entities (cast order guarantees parents first) */
        for (const e of this._entList) {
          const par = e.cfg.parent && st[e.cfg.parent];
          if (!par) continue;
          const s = st[e.id];
          const off = e.cfg.offset || [0, 0, 0];
          s.x = par.x + off[0]; s.y = par.y + off[1]; s.z = par.z + off[2];
        }
        return st;
      },
      applyBeat(st, b, f, raw) {
        const ids = b.ids || (b.id ? [b.id] : []);
        switch (b.do) {
          case 'appear':
            for (const id of ids) { const s = st[id]; if (!s) continue; s.formed = Math.max(s.formed, f); s.energy = Math.max(s.energy, f); }
            break;
          case 'fade':
            for (const id of ids) { const s = st[id]; if (!s) continue; const k = 1 - f * (b.amt == null ? 1 : b.amt); s.energy *= k; s.label *= k; }
            break;
          case 'energy':
            for (const id of ids) { const s = st[id]; if (!s) continue; s.gain = s.gain + (b.to - s.gain) * f; }
            break;
          case 'dissolve':
            for (const id of ids) { const s = st[id]; if (!s) continue; s.formed *= (1 - f); s.energy *= (1 - f * 0.85); s.label *= (1 - f); }
            break;
          case 'move': {
            const s = st[b.id]; if (!s) break;
            s.x += (b.to[0] - s.x) * f; s.y += (b.to[1] - s.y) * f; s.z += (b.to[2] - s.z) * f;
            break;
          }
          case 'path': case 'shuttle': {
            const s = st[b.id]; if (!s) break;
            let u = ez(clamp01(raw));
            if (b.do === 'shuttle') { const k = clamp01(raw) * (b.trips || 1) * 2; const seg = Math.floor(k) % 2; u = seg ? 1 - (k % 1) : (k % 1); }
            const pts = b.pts;
            const tt = u * (pts.length - 1);
            const i = Math.min(pts.length - 2, Math.floor(tt));
            const w = tt - i;
            s.x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * w;
            s.y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * w;
            s.z = pts[i][2] + (pts[i + 1][2] - pts[i][2]) * w;
            break;
          }
          case 'recolor':
            for (const id of ids) { const s = st[id]; if (!s) continue; s.mix = Math.max(s.mix, f); s.mixCol = COL[b.color] || COL.gold; }
            break;
          case 'tick': {
            const s = st[b.id]; if (!s) break;
            s.fill = Math.min(1, s.fill + f * (b.amt == null ? 1 : b.amt));
            break;
          }
          case 'label':
            for (const id of ids) { const s = st[id]; if (!s) continue; s.label = b.off ? s.label * (1 - f) : Math.max(s.label, f); }
            break;
          case 'flare':
            for (const id of ids) { const s = st[id]; if (!s) continue; s.flare = Math.max(s.flare, f); if (b.at) s.flareAt = b.at; if (b.part === 'button') s.btnFlare = Math.max(s.btnFlare, f); }
            break;
          case 'squash': {
            const s = st[b.id]; if (!s) break;
            s.sy = 1 + (b.sy - 1) * f;
            break;
          }
          case 'orbit': {
            const s = st[b.id]; if (!s) break;
            s.orbit = { r: b.r, y: b.y, speed: b.speed || 0.2, phase: b.phase || 0, f };
            break;
          }
          case 'link': {
            const A = st[b.from], Bb = st[b.to];
            if (A && Bb) this._stLinks.push({ a: A, b: Bb, draw: f, col: COL[b.color] || COL.gold, sig: !!b.signals });
            break;
          }
          case 'stream': {
            const A = st[b.from], Bb = st[b.to];
            if (A && Bb) this._stStreams.push({ a: A, b: Bb, f, col: COL[b.color] || COL.gold, dots: !!b.dots });
            break;
          }
          case 'wave': {
            const c = st[b.from];
            this._stWave = { x: c ? c.x : 0, y: c ? c.y + 3 : 3, z: c ? c.z : 0,
                             r: f * (b.r || 40), gain: Math.sin(Math.PI * Math.min(1, raw)) || (raw >= 1 ? 0 : 0),
                             col: COL[b.color] || COL.gold, heal: !!b.heal, done: raw >= 1 };
            break;
          }
        }
      },

      /* ---------- chapter lifecycle (audio is the clock) ---------- */
      stopAll() {
        this.playing = false;
        const au = this.$refs.audio; if (au) { try { au.pause(); } catch (e) {} }
      },
      primeChapter() {
        if (!this.dataset || !this.chapter) return;
        this.stopAll();
        this.progress = 0;
        this.ready = false;
        this._user.th = 0; this._user.ph = 0;
        const au = this.$refs.audio;
        const fallback = this.chapter.dur || 30;
        const done = (ok, dur) => {
          this.audioOk = ok;
          this.chDur = ok && isFinite(dur) && dur > 1 ? dur : fallback;
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
      syncTick() {
        if (!this.playing) return;
        const au = this.$refs.audio;
        if (this.audioOk && au) {
          this.progress = this.chDur ? Math.min(au.currentTime, this.chDur) / this.chDur : 0;
          if (au.ended) this.onEnded();
        } else {
          this.progress = Math.min(1, this.progress + 0.0064);
          if (this.progress >= 1) this.onEnded();
        }
      },
      play() {
        if (!this.ready) { this._autoplay = true; return; }
        if (this.progress >= 0.999) this.seekTo(0);
        this.playing = true;
        const au = this.$refs.audio;
        if (this.audioOk && au) au.play().catch(() => { this.audioOk = false; });
      },
      pause() {
        this.playing = false;
        const au = this.$refs.audio; if (au) { try { au.pause(); } catch (e) {} }
      },
      toggle() { this.playing ? this.pause() : this.play(); },
      seekTo(frac) {
        const tme = Math.max(0, Math.min(1, frac)) * this.chDur;
        const au = this.$refs.audio;
        if (this.audioOk && au) { try { au.currentTime = tme; } catch (e) {} }
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
        this.$nextTick(() => this.fitCanvas());
      },

      /* ---------- render loop ---------- */
      fitCanvas() {
        const host = this.$refs.stage3d;
        if (!host || !this._renderer) return;
        const rect = host.getBoundingClientRect();
        const w = Math.max(320, rect.width);
        const hh = this.fs ? rect.height : w * 9 / 16;
        this._renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        this._renderer.setSize(w, hh, false);
        this._renderer.domElement.style.height = hh + 'px';
        if (this._camera) { this._camera.aspect = w / hh; this._camera.updateProjectionMatrix(); }
      },
      startLoop() {
        let last = performance.now();
        const loop = (now) => {
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          this.step(dt, now / 1000);
          this._renderer.render(this._scene, this._camera);
          this._rafId = requestAnimationFrame(loop);
        };
        this._rafId = requestAnimationFrame(loop);
      },
      step(dt, wallClock) {
        const T = this._T;
        if (!T || !this._P || !this._entList) return;
        const p = this.progress;
        const st = this.computeState(this.ch, p);
        /* the story clock drives streams/signals/orbits so scrubbing stays exact;
           the wall clock only feeds ambient wander */
        const clock = p * this.chDur;
        const { pos, col, tgt, spd } = this._P;
        const wave = this._stWave;

        for (const e of this._entList) {
          const s = st[e.id];
          /* orbiting entities ride the story clock */
          if (s.orbit) {
            const o = s.orbit;
            const a = o.phase + clock * o.speed;
            const ox = Math.cos(a) * o.r, oz = Math.sin(a) * o.r;
            s.x += (ox - s.x) * o.f; s.y += (o.y - s.y) * o.f; s.z += (oz - s.z) * o.f;
          }
          let cr = e.color[0], cg = e.color[1], cb = e.color[2];
          if (s.mix > 0 && s.mixCol) {
            let m = s.mix;
            /* the healing wave converts red knots to gold as it passes */
            if (wave && wave.heal && s.mixCol === COL.red) {
              const dx = s.x - wave.x, dy = s.y - wave.y, dz = s.z - wave.z;
              if (Math.sqrt(dx * dx + dy * dy + dz * dz) < wave.r) { s.mixCol = COL.gold; }
            }
            cr += (s.mixCol[0] - cr) * m; cg += (s.mixCol[1] - cg) * m; cb += (s.mixCol[2] - cb) * m;
          }
          let en = s.energy * s.gain * (e.cfg.baseEnergy || 1) * 0.82;   // global exposure: additive blending blows out fast
          /* the wave front flashes entities as it sweeps past */
          if (wave && !wave.done && en > 0.02) {
            const dx = s.x - wave.x, dy = s.y - wave.y, dz = s.z - wave.z;
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const band = Math.abs(d - wave.r);
            if (band < 3.2) {
              const k = (1 - band / 3.2) * 0.9;
              cr += (wave.col[0] * 1.4 - cr) * k; cg += (wave.col[1] * 1.4 - cg) * k; cb += (wave.col[2] * 1.4 - cb) * k;
            }
          }
          if (s.flare > 0 && !s.flareAt) { const k = s.flare * 0.8; cr += (1.5 - cr) * k; cg += (1.4 - cg) * k; cb += (1.1 - cb) * k; }
          const fl = s.flareAt;
          const isWall = e.kind === 'wall';
          const isTower = e.kind === 'tower';
          const open = isTower && s.mixCol === COL.open ? s.mix : 0;
          for (let j = 0; j < e.n; j++) {
            const ix = (e.i0 + j) * 3;
            const lx = e.local[j * 3], ly = e.local[j * 3 + 1] * s.sy, lz = e.local[j * 3 + 2];
            let gx = s.x + lx, gy = s.y + ly, gz = s.z + lz;
            let pe = en;
            const a = e.aux[j];
            if (isWall && s.energy < 0.999 && s.formed > 0) {
              /* dissolving wall drifts upward as dust */
              const g = 1 - s.energy;
              gy += g * (6 + a * 8); gx += (a - 0.5) * g * 4;
              pe *= Math.max(0, 1 - g * 1.2);
            }
            if (e.kind === 'ledger' || e.kind === 'doc') {
              if (a >= 0) pe *= a <= s.fill ? 1 : 0.06;            // rows write in
            }
            if (isTower && a === 1) pe *= 0.55 + open * 0.9;        // windows warm when the door opens
            if (e.kind === 'panel' && a === 3 && s.btnFlare > 0) pe *= 1 + s.btnFlare * 2.5;
            const f = s.formed;
            const wx = f * gx + (1 - f) * e.scat[j * 3];
            const wy = f * gy + (1 - f) * e.scat[j * 3 + 1];
            const wz = f * gz + (1 - f) * e.scat[j * 3 + 2];
            tgt[ix] = wx; tgt[ix + 1] = wy; tgt[ix + 2] = wz;
            let pr = cr * pe, pg = cg * pe, pb = cb * pe;
            if (fl) {
              const dx = wx - fl[0], dy = wy - fl[1], dz = wz - fl[2];
              const d2 = dx * dx + dy * dy + dz * dz;
              if (d2 < 30) { const k = (1 - d2 / 30) * s.flare; pr += 1.4 * k; pg += 0.7 * k; pb += 0.4 * k; }
            }
            col[ix] = pr; col[ix + 1] = pg; col[ix + 2] = pb;
          }
          /* the label rides its entity; constant screen size via distance scaling */
          if (e.sprite) {
            const dy = e.cfg.labelDy != null ? e.cfg.labelDy : 6;
            e.sprite.position.set(s.x, s.y + dy * (s.sy < 1 ? s.sy + 0.3 : 1), s.z);
            const dCam = this._camera.position.distanceTo(e.sprite.position);
            let hgt = dCam * 0.028;
            const asp = e.sprite.userData.aspect || 4;
            if (hgt * asp > dCam * 0.5) hgt = dCam * 0.5 / asp;     // very long labels shrink to fit
            e.sprite.scale.set(hgt * asp, hgt, 1);
            e.sprite.material.opacity += (Math.min(1, s.label) * 0.95 - e.sprite.material.opacity) * Math.min(1, dt * 6);
          }
        }

        /* fx pool: streams of light between entities */
        const streams = this._stStreams;
        const per = streams.length ? Math.floor(NFX / streams.length) : 0;
        for (let q = 0; q < NFX; q++) {
          const ix = (this._fx0 + q) * 3;
          const si = per ? Math.floor(q / per) : -1;
          if (si < 0 || si >= streams.length) { tgt[ix + 1] = -60; col[ix] = col[ix + 1] = col[ix + 2] = 0; pos[ix + 1] = -60; continue; }
          const sgm = streams[si];
          const jj = q - si * per;
          const u = ((jj / per) + clock * 0.22) % 1;
          const mx = (sgm.a.x + sgm.b.x) / 2, mz = (sgm.a.z + sgm.b.z) / 2;
          const my = Math.max(sgm.a.y, sgm.b.y) / 2 + 4.5;
          const iu = 1 - u;
          const bx = iu * iu * sgm.a.x + 2 * iu * u * mx + u * u * sgm.b.x;
          const by = iu * iu * (sgm.a.y + 2.4) + 2 * iu * u * my + u * u * (sgm.b.y + 2.4);
          const bz = iu * iu * sgm.a.z + 2 * iu * u * mz + u * u * sgm.b.z;
          tgt[ix] = bx; tgt[ix + 1] = by; tgt[ix + 2] = bz;
          pos[ix] = bx; pos[ix + 1] = by; pos[ix + 2] = bz;     // streams place exactly, no easing
          const gate = sgm.dots ? (jj % 5 === 0 ? 1.6 : 0.12) : 0.8;
          const k = sgm.f * gate;
          col[ix] = sgm.col[0] * k; col[ix + 1] = sgm.col[1] * k; col[ix + 2] = sgm.col[2] * k;
        }

        /* particle easing toward targets + ambient wander + pointer stir */
        const settle = this.motion ? 1 : 30;
        let well = null;
        if (this._pw && this._pw.active) well = this._pw.point;
        const fxStart = this._fx0 * 3;
        for (let i = 0; i < this._fx0; i++) {
          const ix = i * 3;
          const sp = spd[i] * settle;
          pos[ix] += (tgt[ix] - pos[ix]) * Math.min(1, dt * sp);
          pos[ix + 1] += (tgt[ix + 1] - pos[ix + 1]) * Math.min(1, dt * sp);
          pos[ix + 2] += (tgt[ix + 2] - pos[ix + 2]) * Math.min(1, dt * sp);
          if (this.motion) {
            pos[ix] += Math.sin(wallClock * 0.9 + i * 0.61) * 0.009;
            pos[ix + 1] += Math.cos(wallClock * 1.1 + i * 1.7) * 0.007;
            pos[ix + 2] += Math.sin(wallClock * 0.7 + i * 0.13) * 0.009;
          }
          if (well) {
            const wx = well.x - pos[ix], wy = well.y - pos[ix + 1], wz = well.z - pos[ix + 2];
            const d2 = wx * wx + wy * wy + wz * wz;
            if (d2 < 34) { const f = (1 - d2 / 34) * 1.6 * dt; pos[ix] += wx * f; pos[ix + 1] += wy * f; pos[ix + 2] += wz * f; }
          }
        }
        this._points.geometry.attributes.position.needsUpdate = true;
        this._points.geometry.attributes.color.needsUpdate = true;

        /* links: deliberate threads between entities */
        const lp = this._links.geometry.attributes.position.array;
        const lc = this._links.geometry.attributes.color.array;
        const links = this._stLinks;
        for (let li = 0; li < NLINK; li++) {
          const o = li * 6;
          if (li >= links.length) { lp[o + 1] = -90; lp[o + 4] = -90; continue; }
          const lk = links[li];
          const ax = lk.a.x, ay = lk.a.y + 2.2, az = lk.a.z;
          const bx2 = ax + (lk.b.x - ax) * lk.draw, by2 = ay + (lk.b.y + 2.2 - ay) * lk.draw, bz2 = az + (lk.b.z - az) * lk.draw;
          lp[o] = ax; lp[o + 1] = ay; lp[o + 2] = az;
          lp[o + 3] = bx2; lp[o + 4] = by2; lp[o + 5] = bz2;
          const lw = 0.8 * Math.min(1, lk.a.energy, lk.b.energy);    // a thread dies with its endpoints
          for (let q = 0; q < 2; q++) { lc[o + q * 3] = lk.col[0] * lw; lc[o + q * 3 + 1] = lk.col[1] * lw; lc[o + q * 3 + 2] = lk.col[2] * lw; }
        }
        this._links.geometry.attributes.position.needsUpdate = true;
        this._links.geometry.attributes.color.needsUpdate = true;

        /* signal pulses race the signal-enabled links, on the story clock */
        const sigLinks = links.filter(l => l.sig && l.draw > 0.95 && Math.min(l.a.energy, l.b.energy) > 0.3);
        const sp2 = this._signals.geometry.attributes.position.array;
        const sc2 = this._signals.geometry.attributes.color.array;
        for (let q = 0; q < NSIG; q++) {
          if (!sigLinks.length) { sp2[q * 3 + 1] = -90; continue; }
          const lk = sigLinks[q % sigLinks.length];
          const u = ((q * 0.137) + clock * 0.16) % 1;
          sp2[q * 3] = lk.a.x + (lk.b.x - lk.a.x) * u;
          sp2[q * 3 + 1] = lk.a.y + 2.2 + (lk.b.y - lk.a.y) * u;
          sp2[q * 3 + 2] = lk.a.z + (lk.b.z - lk.a.z) * u;
          sc2[q * 3] = lk.col[0] * 1.3; sc2[q * 3 + 1] = lk.col[1] * 1.3; sc2[q * 3 + 2] = lk.col[2] * 1.3;
        }
        this._signals.geometry.attributes.position.needsUpdate = true;
        this._signals.geometry.attributes.color.needsUpdate = true;

        /* scripted camera + user orbit offsets */
        const cam = this.chapter && this.chapter.cam;
        let th = 0.8, ph = 1.1, d = 60, tg = [0, 3, 0];
        if (cam && cam.length) {
          let k0 = cam[0], k1 = cam[cam.length - 1];
          for (let i = 0; i < cam.length - 1; i++) {
            if (p >= cam[i].t && p <= cam[i + 1].t) { k0 = cam[i]; k1 = cam[i + 1]; break; }
          }
          const span = (k1.t - k0.t) || 1;
          const w = ez(clamp01((p - k0.t) / span));
          th = k0.th + (k1.th - k0.th) * w;
          ph = k0.ph + (k1.ph - k0.ph) * w;
          d = k0.d + (k1.d - k0.d) * w;
          tg = [0, 1, 2].map(i => k0.tg[i] + (k1.tg[i] - k0.tg[i]) * w);
        }
        /* user offsets decay gently while playing */
        if (this.playing && this.motion) { this._user.th *= (1 - dt * 0.25); this._user.ph *= (1 - dt * 0.25); }
        th += this._user.th; ph = Math.max(0.25, Math.min(1.45, ph + this._user.ph));
        d = Math.max(12, Math.min(160, d * this._user.zoom));
        const cp = new T.Vector3(
          tg[0] + d * Math.sin(ph) * Math.cos(th),
          tg[1] + d * Math.cos(ph),
          tg[2] + d * Math.sin(ph) * Math.sin(th));
        this._camera.position.lerp(cp, Math.min(1, dt * 5));
        const look = this._lookV || (this._lookV = new T.Vector3());
        look.lerp(new T.Vector3(tg[0], tg[1], tg[2]), Math.min(1, dt * 5));
        this._camera.lookAt(look);
        /* wide shots need fatter points to stay exposed */
        const dist = this._camera.position.distanceTo(look);
        this._points.material.size = Math.max(0.62, Math.min(1.2, 0.5 + dist * 0.0062));
      },

      /* ---------- pointer: gentle stir + orbit + zoom ---------- */
      bindPointer(el) {
        const T = this._T;
        let down = null;
        el.style.touchAction = 'none';
        this._pw = { active: false, point: new T.Vector3() };
        const toWell = (e) => {
          const r = el.getBoundingClientRect();
          const ndc = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
          const ray = new T.Raycaster();
          ray.setFromCamera(ndc, this._camera);
          const o = ray.ray.origin, dvec = ray.ray.direction;
          const tHit = -o.dot(dvec);
          this._pw.point.copy(o).addScaledVector(dvec, Math.max(10, tHit));
        };
        el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); });
        el.addEventListener('pointermove', e => {
          toWell(e);
          this._pw.active = true;
          if (!down) return;
          const dx = e.clientX - down.x, dy = e.clientY - down.y;
          this._user.th -= dx * 0.005;
          this._user.ph -= dy * 0.004;
          down = { x: e.clientX, y: e.clientY };
        });
        el.addEventListener('pointerup', () => { down = null; });
        el.addEventListener('pointerleave', () => { this._pw.active = false; down = null; });
        el.addEventListener('wheel', e => {
          e.preventDefault();
          this._user.zoom = Math.max(0.3, Math.min(2.4, this._user.zoom * (e.deltaY > 0 ? 1.07 : 0.93)));
        }, { passive: false });
      },
    },

    render() {
      const sim = this.dataset;
      if (this.error) return h('div', { class: 'sim-fig' }, [h('div', { style: 'padding:24px;color:var(--highlight);font-size:12px;' }, this.error)]);
      if (!sim) return h('div', { class: 'sim-fig' }, [h('div', { style: 'padding:28px;text-align:center;color:var(--ink-50);font-size:12px;' }, 'Loading simulation…')]);
      const loc = this.loc;
      const chips = this.chapters.map((c, i) => h('button', {
        class: ['sim-chip', i === this.ch ? 'active' : '', i < this.ch ? 'done' : ''],
        onClick: () => this.go(i), 'aria-pressed': i === this.ch ? 'true' : 'false',
      }, (i + 1) + ' · ' + S.t(c.title, loc)));

      return h('div', { class: 'sim-fig' }, [
        h('div', { class: ['sim-frame', this.fs ? 'sim-fs' : ''] }, [
          h('div', { class: 'sim-bar' }, [
            h('h3', { class: 'sim-title' }, S.t(sim.title, loc)),
            h('div', { class: 'sim-actions' }, [
              h('button', { class: 'sim-btn sim-primary', onClick: () => this.toggle(), disabled: !this.ready }, this.playing ? this.L.pause : (this.progress >= 0.999 && this.ch === this.chapters.length - 1 ? this.L.replay : this.L.play)),
              h('button', { class: ['sim-btn', this.showCaps ? 'on' : ''], onClick: () => { this.showCaps = !this.showCaps; }, 'aria-pressed': this.showCaps ? 'true' : 'false' }, this.L.caps),
              h('button', { class: 'sim-btn', onClick: () => this.toggleFs() }, this.fs ? this.L.close : this.L.expand),
            ]),
          ]),
          h('div', { class: 'sim-stage', style: 'background:#0b1124;' }, [
            h('div', { ref: 'stage3d', style: 'width:100%;' }),
            !this.webgl ? h('div', { style: 'padding:48px 24px;text-align:center;color:#9aa3c0;font-size:13px;' }, this.L.nowebgl) : null,
            h('div', { class: 'sim3-hint', style: 'background:rgba(11,17,36,0.7);color:#9aa3c0;' }, this.L.hint),
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

  if (window.VWVisuals) window.VWVisuals.registerBespoke('sim', 'manifold', 'sim-manifold');
})();
