/* sim:three — the 3D spatial simulation engine (owner: sim).

   Embed in a paper with:
       chart: { kind: "sim:three", sim: "gov3-3d" }

   The third visualization engine for the same narrated stories: a real 3D
   environment (Three.js, dynamically imported from the CDN at mount — no
   bundler, no import map; core module only). Buildings and gates are simple
   geometry in the papers' palette, people and the Legislature are billboards
   of the gpt-image-2 sprites, agents are glowing orbs. The camera is
   directed per chapter (dolly, crane, orbit) and the viewer can take over at
   any time: drag to orbit, scroll to zoom.

   The educational layer is the point. Actors with a `learn` entry carry a
   pulsing hotspot; clicking pauses the ride and opens a sidebar with the
   glossary definition (data/glossary.json, bilingual), a factoid drawn from
   the other papers, and links to read further — simulating the future state
   where a live AI joins the briefing with pre-generated content.

   Chapters, narration, captions, transcript, and the audio-is-the-master-
   clock transport are identical to sim:player and sim:iso; audioSim shares
   another simulation's narration files. GSAP tweens a plain world state; the
   render loop copies state onto the Three objects each frame. */

(function () {
  const S = window.VWSim;
  if (!S) return;
  const h = S.h, PAL = S.PAL;
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.164.1/three.module.min.js';
  const SPRITE_DIR = 'public/images/sims/gov3-iso/';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- state ---------- */
  function baseState(sim) {
    const st = { cam: clone((sim.stage && sim.stage.cam) || { pos: [0, 26, 34], look: [0, 0, 0] }), actors: {}, links: {}, counts: {} };
    (sim.actors || []).forEach(a => {
      if (a.kind === 'link') { st.links[a.id] = { draw: 0, a: 1 }; return; }
      st.actors[a.id] = { x: a.x || 0, z: a.z || 0, y: a.y || 0, a: a.on ? 1 : 0, s: 1, tint: 0, marks: {} };
    });
    return st;
  }
  function applySteps(st, steps) {
    (steps || []).forEach(sp => {
      const ids = sp.id ? [sp.id] : (sp.ids || []);
      switch (sp.do) {
        case 'show': ids.forEach(id => { if (st.actors[id]) st.actors[id].a = 1; else if (st.links[id]) st.links[id].a = 1; }); break;
        case 'hide': ids.forEach(id => { if (st.actors[id]) st.actors[id].a = 0; else if (st.links[id]) { st.links[id].a = 0; st.links[id].draw = 0; } }); break;
        case 'move': ids.forEach(id => { const a = st.actors[id]; if (a) { if (sp.x != null) a.x = sp.x; if (sp.z != null) a.z = sp.z; if (sp.y != null) a.y = sp.y; } }); break;
        case 'cam': st.cam = { pos: sp.pos ? sp.pos.slice() : st.cam.pos, look: sp.look ? sp.look.slice() : st.cam.look }; break;
        case 'tint': ids.forEach(id => { if (st.actors[id]) st.actors[id].tint = sp.to != null ? sp.to : 1; }); break;
        case 'mark': ids.forEach(id => { if (st.actors[id]) st.actors[id].marks[sp.m] = sp.on ? 1 : 0; }); break;
        case 'count': ids.forEach(id => { st.counts[id] = sp.to; }); break;
        case 'draw': ids.forEach(id => { if (st.links[id]) st.links[id].draw = 1; }); break;
        default: break;
      }
    });
    return st;
  }

  /* ====================== the component ====================== */
  window.VWComponents = window.VWComponents || {};
  window.VWComponents['sim-three'] = {
    props: {
      kind: { type: String, default: '' },
      sim: { type: String, default: '' },
      start: { type: Number, default: 0 },
    },
    data() {
      return { dataset: null, error: null, ch: this.start || 0, playing: false, fs: false, showNarr: false, showCaps: false,
               progress: 0, chDur: 30, audioOk: true, ready: false, animated: S.gsapOK(), webgl: true,
               panel: null };       // the open learn panel { title, short, long, factoid, cite, papers:[{id,label}] }
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
      stateAtStart() {
        if (!this.dataset) return null;
        const st = baseState(this.dataset);
        for (let i = 0; i < this.ch; i++) applySteps(st, this.chapters[i].steps);
        return st;
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
              hint: 'glissez pour orbiter · molette pour zoomer · cliquez ⓘ pour apprendre', resume: 'Reprendre la lecture', closePanel: 'Fermer',
              readPaper: 'Lire le livre blanc', future: "Dans une version future, un agent d'IA participera à cette présentation en direct : vous pourrez discuter avec chaque élément.",
              nowebgl: 'La 3D n’est pas disponible dans ce navigateur. La narration et la transcription restent accessibles.' }
          : { play: 'Play', pause: 'Pause', replay: 'Replay', expand: 'Expand', close: 'Close', transcript: 'Transcript', hide: 'Hide transcript', caps: 'Captions',
              hint: 'drag to orbit · scroll to zoom · click ⓘ to learn', resume: 'Resume playback', closePanel: 'Close',
              readPaper: 'Read the paper', future: 'In a future release, a live AI agent will join this briefing: you will chat with any element you see.',
              nowebgl: '3D is not available in this browser. The narration and transcript remain available.' };
      },
    },
    watch: {
      loc() { this.stopAll(); this.panel = null; this.$nextTick(() => { if (this._T) this.buildWorld(); this.primeChapter(); }); },
      ch() { this.panel = null; this.$nextTick(() => { if (this._T) this.buildWorld(); this.primeChapter(); }); },
      fs() { this.$nextTick(() => this.fitCanvas()); },
    },
    created() {
      Promise.all([
        S.loadData(this.sim),
        fetch('data/glossary.json').then(r => r.json()).catch(() => ({ terms: [] })),
      ]).then(([d, g]) => {
        this.dataset = d;
        this._glossary = {};
        (g.terms || []).forEach(t => { this._glossary[t.id] = t; });
        this.bootThree();
      }).catch(e => { this.error = 'Simulation "' + this.sim + '" failed to load: ' + e.message; });
    },
    mounted() {
      this._tick = () => this.syncTick();
      if (typeof gsap !== 'undefined') gsap.ticker.add(this._tick);
      else this._iv = setInterval(this._tick, 120);
      this._onResize = () => this.fitCanvas();
      window.addEventListener('resize', this._onResize);
      if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
        window.__simPlayers = window.__simPlayers || [];
        window.__simPlayers.push(this);
      }
    },
    beforeUnmount() {
      this.stopAll();
      if (typeof gsap !== 'undefined' && this._tick) gsap.ticker.remove(this._tick);
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
            try { this.initScene(); this.buildWorld(); this.primeChapter(); this.startLoop(); }
            catch (e) { this.webgl = false; this.primeChapter(); }
          });
        }).catch(() => { this.webgl = false; this.$nextTick(() => this.primeChapter()); });
      },
      initScene() {
        const T = this._T, host = this.$refs.stage3d;
        const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
        renderer.setClearColor(0xf7f4ed, 1);
        host.appendChild(renderer.domElement);
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.width = '100%';
        this._renderer = renderer;
        const scene = new T.Scene();
        scene.fog = new T.Fog(0xf7f4ed, 70, 150);
        this._scene = scene;
        this._camera = new T.PerspectiveCamera(42, 16 / 9, 0.1, 400);
        scene.add(new T.HemisphereLight(0xfffaf0, 0xcfc8b8, 1.05));
        const sun = new T.DirectionalLight(0xfff4e0, 1.5);
        sun.position.set(-30, 50, 20);
        scene.add(sun);
        /* ground: a big soft plane + grid lines */
        const ground = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshLambertMaterial({ color: 0xf3efe5 }));
        ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02;
        scene.add(ground);
        const grid = new T.GridHelper(160, 80, 0xd8d1c2, 0xe6e0d2);
        grid.position.y = 0;
        scene.add(grid);
        this._worldGroup = new T.Group();
        scene.add(this._worldGroup);
        this._flowGroup = new T.Group();
        scene.add(this._flowGroup);
        this._linkGroup = new T.Group();
        scene.add(this._linkGroup);
        this._raycaster = new T.Raycaster();
        this._orbit = { dT: 0, dP: 0, dD: 1 };          // user offsets over the scripted camera
        this.bindPointer(renderer.domElement);
        this.fitCanvas();
      },
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

      /* ---------- text + sprite helpers ---------- */
      texSprite(text, opt) {
        const T = this._T, o = Object.assign({ size: 26, pad: 12, color: '#3D3E45', bg: 'rgba(247,244,237,0.92)', stroke: '#B8AE99', bold: false, mono: true }, opt || {});
        const cv = document.createElement('canvas');
        const ctx = cv.getContext('2d');
        const font = (o.bold ? '700 ' : '') + o.size + 'px ' + (o.mono ? 'ui-monospace, monospace' : 'system-ui, sans-serif');
        ctx.font = font;
        const tw = Math.ceil(ctx.measureText(text).width);
        cv.width = tw + o.pad * 2; cv.height = o.size + o.pad * 2;
        const c2 = cv.getContext('2d');
        if (o.bg) {
          c2.fillStyle = o.bg;
          c2.beginPath(); c2.roundRect(1, 1, cv.width - 2, cv.height - 2, (cv.height - 2) / 2); c2.fill();
          if (o.stroke) { c2.strokeStyle = o.stroke; c2.lineWidth = 2; c2.stroke(); }
        }
        if (o.key) { c2.fillStyle = o.key; c2.beginPath(); c2.roundRect(o.pad - 2, o.pad - 2, 10, cv.height - 2 * o.pad + 4, 3); c2.fill(); }
        c2.font = font; c2.fillStyle = o.color; c2.textAlign = 'center'; c2.textBaseline = 'middle';
        c2.fillText(text, cv.width / 2 + (o.key ? 6 : 0), cv.height / 2 + 1);
        const tex = new T.CanvasTexture(cv);
        tex.anisotropy = 4;
        const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: true }));
        const k = (o.world || 0.015);
        sp.scale.set(cv.width * k, cv.height * k, 1);
        return sp;
      },
      imgSprite(key, hWorld) {
        const T = this._T;
        const tex = new T.TextureLoader().load(SPRITE_DIR + key + '.png', t => {
          const asp = t.image.width / t.image.height;
          sp.scale.set(hWorld * asp, hWorld, 1);
        });
        tex.colorSpace = T.SRGBColorSpace;
        const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true }));
        sp.scale.set(hWorld, hWorld, 1);
        sp.center.set(0.5, 0);                       // anchor at the feet
        return sp;
      },

      /* ---------- world construction ---------- */
      mat(color, opt) {
        const T = this._T;
        return new T.MeshLambertMaterial(Object.assign({ color: new T.Color(color), transparent: true }, opt || {}));
      },
      buildWorld() {
        const T = this._T;
        if (!T) return;
        const W = this._worldGroup;
        while (W.children.length) { W.remove(W.children[0]); }
        while (this._flowGroup.children.length) this._flowGroup.remove(this._flowGroup.children[0]);
        while (this._linkGroup.children.length) this._linkGroup.remove(this._linkGroup.children[0]);
        this._nodes = {};
        const loc = this.loc;
        (this.dataset.actors || []).forEach(a => {
          if (a.kind === 'link') return;
          const g = new T.Group();
          g.userData.actor = a.id;
          const label = S.t(a.label, loc);
          if (a.kind === 'block') {
            const m = this.mat(a.color || '#e9e2cf');
            const box = new T.Mesh(new T.BoxGeometry(a.w || 3, a.h || 3, a.d || 3), m);
            box.position.y = (a.h || 3) / 2;
            g.add(box);
            const edges = new T.LineSegments(new T.EdgesGeometry(box.geometry), new T.LineBasicMaterial({ color: 0x8a8273, transparent: true }));
            edges.position.copy(box.position);
            g.add(edges);
            if (a.door) {
              const door = new T.Mesh(new T.PlaneGeometry((a.w || 3) * 0.28, (a.h || 3) * 0.42),
                new T.MeshBasicMaterial({ color: new T.Color(a.door), transparent: true }));
              door.position.set(0, (a.h || 3) * 0.21, (a.d || 3) / 2 + 0.03);
              door.userData.isDoor = true;
              g.add(door);
            }
            g.userData.tintTargets = [m];
          } else if (a.kind === 'gate') {
            const col = this.mat(a.color || '#e9e2cf');
            const p1 = new T.Mesh(new T.BoxGeometry(0.9, a.h || 6, 0.9), col);
            const p2 = p1.clone();
            p1.position.set(-(a.w || 4) / 2, (a.h || 6) / 2, 0);
            p2.position.set((a.w || 4) / 2, (a.h || 6) / 2, 0);
            const lintel = new T.Mesh(new T.BoxGeometry((a.w || 4) + 1.8, 0.9, 1.2), col);
            lintel.position.y = (a.h || 6) + 0.45;
            const banner = new T.Mesh(new T.PlaneGeometry((a.w || 4) + 1.2, 1.1), new T.MeshBasicMaterial({ color: 0x1a3a6e, transparent: true }));
            banner.position.set(0, (a.h || 6) - 0.2, 0.65);
            g.add(p1, p2, lintel, banner);
          } else if (a.kind === 'orb') {
            const core = new T.Mesh(new T.SphereGeometry(a.r || 0.85, 24, 18),
              new T.MeshStandardMaterial({ color: 0xd97a2b, emissive: 0xb85c12, emissiveIntensity: 0.55, transparent: true }));
            core.position.y = (a.hover != null ? a.hover : 1.6);
            const ring = new T.Mesh(new T.TorusGeometry((a.r || 0.85) * 1.5, 0.06, 10, 40), this.mat('#f7f4ed'));
            ring.rotation.x = Math.PI / 2;
            ring.position.y = core.position.y;
            g.add(core, ring);
            g.userData.bob = true;
          } else if (a.kind === 'bb') {
            g.add(this.imgSprite(a.sprite, a.hWorld || 4));
          } else if (a.kind === 'zone') {
            const plane = new T.Mesh(new T.PlaneGeometry(a.w || 10, a.d || 8),
              new T.MeshBasicMaterial({ color: new T.Color(a.color || '#1A3A6E'), transparent: true, opacity: 0.06 }));
            plane.rotation.x = -Math.PI / 2;
            plane.position.y = 0.02;
            g.add(plane);
            if (label) {
              const ls = this.texSprite(label.toUpperCase(), { size: 30, bold: true, color: '#5E5F66', world: 0.02 });
              ls.position.set(0, 0.4, -(a.d || 8) / 2 + 0.6);
              g.add(ls);
            }
          } else if (a.kind === 'pill') {
            const ps = this.texSprite(S.t(a.label, loc), { size: 30, color: a.text || '#3D3E45', bg: a.fill || 'rgba(239,234,217,0.95)', stroke: a.strokeC || '#B8AE99', key: a.keyColor || null, world: 0.016 });
            ps.position.y = a.hWorld != null ? a.hWorld : 2.2;
            g.add(ps);
          } else if (a.kind === 'tlabel') {
            const ts = this.texSprite(S.t(a.label, loc), { size: a.size || 34, bold: true, color: a.color || '#5E5F66', bg: null, stroke: null, world: 0.021 });
            ts.position.y = a.hWorld != null ? a.hWorld : 3;
            g.add(ts);
            g.userData.countable = a.countable || false;
            g.userData.labelOpts = { size: a.size || 34, bold: true, color: a.color || '#5E5F66', bg: null, stroke: null, world: 0.021 };
          }
          /* learn hotspot */
          if (a.learn) {
            const hs = this.texSprite('ⓘ', { size: 34, bold: true, color: '#ffffff', bg: 'rgba(178,63,21,0.95)', stroke: '#ffffff', world: 0.016, mono: false });
            hs.position.y = (a.hotspotY != null ? a.hotspotY : (a.h || 4) + 1.4);
            hs.userData.hotspot = true;
            g.add(hs);
            g.userData.learn = true;
          }
          /* marks (badge, lock, shield, bubble) as sprites above the actor */
          g.userData.markSprites = {};
          ['lock', 'shield', 'badge', 'bubble'].forEach(mk => {
            if (!(a.marks || []).includes(mk)) return;
            const glyph = mk === 'lock' ? '🔒' : mk === 'shield' ? '✓' : mk === 'badge' ? 'ID' : '…';
            const colr = mk === 'shield' ? 'rgba(47,122,63,0.95)' : mk === 'badge' ? 'rgba(26,58,110,0.95)' : mk === 'bubble' ? 'rgba(255,255,255,0.96)' : 'rgba(61,62,69,0.95)';
            const ms = this.texSprite(glyph, { size: 30, bold: true, color: mk === 'bubble' ? '#5E5F66' : '#fff', bg: colr, stroke: '#fff', world: 0.015, mono: false });
            ms.position.y = (a.markY != null ? a.markY : (a.h || 3) + 0.9);
            ms.material.opacity = 0;
            g.add(ms);
            g.userData.markSprites[mk] = ms;
          });
          if (label && a.kind !== 'zone' && a.kind !== 'pill' && a.kind !== 'tlabel') {
            const ls = this.texSprite(label, { size: 26, color: '#3D3E45', world: 0.014 });
            ls.position.set(0, a.labelY != null ? a.labelY : 0.65, (a.d ? a.d / 2 : 0.6) + 1.2);
            g.add(ls);
          }
          g.position.set(a.x || 0, a.y || 0, a.z || 0);
          W.add(g);
          this._nodes[a.id] = g;
        });
        /* links: progressive 3D lines between actors */
        this._linkNodes = {};
        (this.dataset.actors || []).filter(a => a.kind === 'link').forEach(a => {
          const T2 = this._T;
          const geo = new T2.BufferGeometry();
          const N = 40;
          geo.setAttribute('position', new T2.BufferAttribute(new Float32Array((N + 1) * 3), 3));
          const line = new T2.Line(geo, new T2.LineBasicMaterial({ color: 0x3d3e45, transparent: true }));
          line.userData = { frm: a.frm, to: a.to, arc: a.arc != null ? a.arc : 3, N };
          this._linkGroup.add(line);
          this._linkNodes[a.id] = line;
        });
      },
      actorById(id) { return (this.dataset.actors || []).find(a => a.id === id); },
      anchorOf(id) {
        const g = this._nodes[id], a = this.actorById(id), st = this.W && this.W.actors[id];
        if (!g || !st) return null;
        const y = (a.kind === 'orb') ? (a.hover != null ? a.hover : 1.6) : (a.h || 3) * 0.55;
        return new this._T.Vector3(st.x, st.y + y, st.z);
      },

      /* ---------- render loop: state -> three ---------- */
      startLoop() {
        const loop = () => {
          this.applyState();
          if (this._renderer && this._scene && this._camera) this._renderer.render(this._scene, this._camera);
          this._rafId = requestAnimationFrame(loop);
        };
        this._rafId = requestAnimationFrame(loop);
      },
      applyState() {
        const T = this._T, W = this.W;
        if (!T || !W) return;
        const now = performance.now() / 1000;
        Object.keys(this._nodes || {}).forEach(id => {
          const g = this._nodes[id], st = W.actors[id];
          if (!st) return;
          g.position.set(st.x, st.y + (g.userData.bob && st.a > 0.5 ? Math.sin(now * 2.2 + st.x) * 0.12 : 0), st.z);
          g.scale.setScalar(Math.max(0.001, st.s));
          g.visible = st.a > 0.01;
          g.traverse(o => {
            if (o.material && !o.userData.hotspot && !(o.material.userData && o.material.userData.markFixed)) {
              if (o.userData.isMark) return;
              o.material.opacity = st.a * (o.userData.baseOpacity != null ? o.userData.baseOpacity : 1);
            }
          });
          /* tint: legacy building -> refreshed (cream walls, green door) */
          (g.userData.tintTargets || []).forEach(m => {
            const a = this.actorById(id);
            if (a && a.tintTo) m.color.lerpColors(new T.Color(a.color || '#e9e2cf'), new T.Color(a.tintTo), st.tint);
          });
          g.traverse(o => { if (o.userData.isDoor) o.material.opacity = st.a * st.tint; });
          /* marks */
          Object.entries(g.userData.markSprites || {}).forEach(([mk, ms]) => {
            ms.userData.isMark = true;
            ms.material.opacity = st.a * (st.marks[mk] || 0);
          });
          /* hotspot pulse */
          g.traverse(o => { if (o.userData.hotspot) { o.material.opacity = st.a * (0.7 + 0.3 * Math.sin(now * 3)); } });
          /* countable text refresh */
          if (g.userData.countable) {
            const v = W.counts[id];
            if (v != null && g.userData.lastCount !== v) {
              g.userData.lastCount = v;
              const old = g.children.find(c => c.isSprite && !c.userData.hotspot);
              const ts = this.texSprite(String(v), g.userData.labelOpts);
              ts.position.copy(old.position);
              g.remove(old);
              g.add(ts);
            }
          }
        });
        /* links */
        Object.entries(this._linkNodes || {}).forEach(([id, line]) => {
          const st = W.links[id];
          if (!st) return;
          line.visible = st.draw > 0.005 && st.a > 0.01;
          if (!line.visible) return;
          line.material.opacity = st.a;
          const p0 = this.anchorOf(line.userData.frm), p1 = this.anchorOf(line.userData.to);
          if (!p0 || !p1) { line.visible = false; return; }
          const mid = p0.clone().lerp(p1, 0.5); mid.y += line.userData.arc;
          const pos = line.geometry.attributes.position;
          const N = line.userData.N;
          for (let i = 0; i <= N; i++) {
            const u = i / N, v = 1 - u;
            pos.setXYZ(i,
              v * v * p0.x + 2 * v * u * mid.x + u * u * p1.x,
              v * v * p0.y + 2 * v * u * mid.y + u * u * p1.y,
              v * v * p0.z + 2 * v * u * mid.z + u * u * p1.z);
          }
          pos.needsUpdate = true;
          line.geometry.setDrawRange(0, Math.max(2, Math.round(N * st.draw)) + 1);
        });
        /* flow dots */
        (this._dots || []).forEach(d => {
          if (!d.mesh) return;
          d.mesh.visible = d.a > 0.02;
          if (!d.mesh.visible) return;
          const p0 = this.anchorOf(d.from), p1 = this.anchorOf(d.to);
          if (!p0 || !p1) return;
          const mid = p0.clone().lerp(p1, 0.5); mid.y += (d.arc != null ? d.arc : 2.5);
          const u = d.t, v = 1 - u;
          d.mesh.position.set(
            v * v * p0.x + 2 * v * u * mid.x + u * u * p1.x,
            v * v * p0.y + 2 * v * u * mid.y + u * u * p1.y,
            v * v * p0.z + 2 * v * u * mid.z + u * u * p1.z);
          d.mesh.material.opacity = d.a;
        });
        /* camera: scripted rig + user orbit offsets */
        const cam = W.cam;
        const look = new T.Vector3(cam.look[0], cam.look[1], cam.look[2]);
        let pos = new T.Vector3(cam.pos[0], cam.pos[1], cam.pos[2]);
        const ob = this._orbit;
        if (ob && (Math.abs(ob.dT) > 1e-4 || Math.abs(ob.dP) > 1e-4 || Math.abs(ob.dD - 1) > 1e-4)) {
          const off = pos.clone().sub(look);
          const sph = new T.Spherical().setFromVector3(off);
          sph.theta += ob.dT;
          sph.phi = Math.max(0.15, Math.min(Math.PI / 2.05, sph.phi + ob.dP));
          sph.radius = Math.max(6, Math.min(120, sph.radius * ob.dD));
          pos = look.clone().add(new T.Vector3().setFromSpherical(sph));
        }
        this._camera.position.copy(pos);
        this._camera.lookAt(look);
      },

      /* ---------- pointer: orbit + raycast learn ---------- */
      bindPointer(el) {
        let down = null, moved = false;
        el.style.touchAction = 'none';
        el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; moved = false; el.setPointerCapture(e.pointerId); });
        el.addEventListener('pointermove', e => {
          if (!down) return;
          const dx = e.clientX - down.x, dy = e.clientY - down.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
          this._orbit.dT -= dx * 0.005;
          this._orbit.dP -= dy * 0.004;
          down = { x: e.clientX, y: e.clientY };
        });
        el.addEventListener('pointerup', e => {
          if (down && !moved) this.onPick(e, el);
          down = null;
        });
        el.addEventListener('wheel', e => {
          e.preventDefault();
          this._orbit.dD = Math.max(0.25, Math.min(4, this._orbit.dD * (e.deltaY > 0 ? 1.07 : 0.93)));
        }, { passive: false });
      },
      onPick(e, el) {
        const T = this._T;
        if (!T || !this._camera) return;
        const r = el.getBoundingClientRect();
        const p = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        this._raycaster.setFromCamera(p, this._camera);
        const hits = this._raycaster.intersectObjects(this._worldGroup.children, true);
        for (const hit of hits) {
          let o = hit.object;
          while (o && !o.userData.actor) o = o.parent;
          if (o && o.userData.learn && o.visible) { this.openPanel(o.userData.actor); return; }
        }
      },
      openPanel(actorId) {
        const a = this.actorById(actorId);
        if (!a || !a.learn) return;
        const loc = this.loc;
        const gl = a.learn.term ? this._glossary[a.learn.term] : null;
        const gloc = gl ? (gl[loc] || gl.en) : null;
        const inv = (window.VWStore && window.VWStore.papers) || [];
        const papers = (a.learn.papers || []).map(pid => {
          const p = inv.find(x => x.id === pid);
          const i18n = p && p.i18n && p.i18n[loc];
          return { id: pid, label: (i18n && i18n.title) || (p && p.title) || pid };
        });
        this.wasPlaying = this.playing;
        this.pause();
        this.panel = {
          title: S.t(a.learn.title || a.label, loc),
          short: gloc ? gloc.short : '',
          long: gloc ? gloc.long : '',
          factoid: S.t(a.learn.factoid, loc),
          cite: S.t(a.learn.cite, loc),
          papers,
        };
      },
      closePanel(resume) {
        this.panel = null;
        if (resume || this.wasPlaying) { this.wasPlaying = false; this.play(); }
      },

      /* ---------- chapter lifecycle (audio is the clock) ---------- */
      stopAll() {
        this.playing = false;
        const au = this.$refs.audio; if (au) { try { au.pause(); } catch (e) {} }
        if (this._tl) { try { this._tl.kill(); } catch (e) {} this._tl = null; }
        (this._dots || []).forEach(d => { if (d.mesh) this._flowGroup.remove(d.mesh); });
        this._dots = [];
      },
      primeChapter() {
        if (!this.dataset || !this.chapter) return;
        this.stopAll();
        this.progress = 0;
        this.ready = false;
        this.W = clone(this.stateAtStart);
        if (!this.animated || !this.webgl) applySteps(this.W, this.chapter.steps);
        if (this._orbit) { this._orbit.dT = 0; this._orbit.dP = 0; this._orbit.dD = 1; }
        const au = this.$refs.audio;
        const fallback = this.chapter.dur || 30;
        const done = (ok, dur) => {
          this.audioOk = ok;
          this.chDur = ok && isFinite(dur) && dur > 1 ? dur : fallback;
          if (this.animated && this.webgl) this.buildTimeline();
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
      buildTimeline() {
        const D = this.chDur, W = this.W;
        const tl = gsap.timeline({ paused: true });
        const simTrack = clone(this.stateAtStart);
        const steps = (this.chapter.steps || []).slice().sort((a, b) => (a.t || 0) - (b.t || 0));
        steps.forEach(sp => {
          const pos = Math.max(0, Math.min(1, sp.t || 0)) * D;
          const dur = Math.min(sp.dur != null ? sp.dur : 1.0, Math.max(0.1, D - pos));
          const ease = sp.ease || 'power2.inOut';
          const ir = pos === 0;
          const ids = sp.id ? [sp.id] : (sp.ids || []);
          if (sp.do === 'show' || sp.do === 'hide') {
            const to = sp.do === 'show' ? 1 : 0;
            ids.forEach((id, i) => {
              const at = pos + (sp.stagger || 0) * i;
              if (!W.actors[id] && W.links[id]) {
                const lf = simTrack.links[id] || { a: 1, draw: 0 };
                tl.fromTo(W.links[id], { a: lf.a, draw: lf.draw }, { a: to, draw: to === 0 ? 0 : lf.draw, duration: dur, ease: 'power1.inOut', immediateRender: ir }, at);
                if (simTrack.links[id]) { simTrack.links[id].a = to; if (to === 0) simTrack.links[id].draw = 0; }
                return;
              }
              const tgt = W.actors[id]; if (!tgt) return;
              const tr = simTrack.actors[id] || { a: 0, x: tgt.x, y: tgt.y, z: tgt.z };
              if (sp.fx === 'rise') {
                tl.fromTo(tgt, { a: tr.a, y: tr.y - (sp.dist || 4) }, { a: to, y: tr.y + 0, duration: dur, ease, immediateRender: ir }, at);
              } else if (sp.fx === 'drop') {
                tl.fromTo(tgt, { a: tr.a, y: tr.y + (sp.dist || 14) }, { a: to, y: 0, duration: dur, ease: 'bounce.out', immediateRender: ir }, at);
              } else if (sp.fx === 'slide') {
                const dx = (sp.dir && sp.dir[0] != null ? sp.dir[0] : 30), dz = (sp.dir && sp.dir[1] != null ? sp.dir[1] : 0);
                tl.fromTo(tgt, { a: tr.a, x: tr.x + dx, z: tr.z + dz }, { a: to, x: tr.x, z: tr.z, duration: dur, ease, immediateRender: ir }, at);
              } else if (sp.fx === 'sink') {
                tl.fromTo(tgt, { a: tr.a, y: tr.y }, { a: to, y: tr.y - (sp.dist || 5), duration: dur, ease: 'power2.in', immediateRender: ir }, at);
              } else if (sp.fx === 'pop') {
                tl.fromTo(tgt, { a: tr.a, s: 0.3 }, { a: to, s: 1, duration: dur, ease: 'back.out(1.7)', immediateRender: ir }, at);
              } else {
                tl.fromTo(tgt, { a: tr.a }, { a: to, duration: dur, ease: 'power1.inOut', immediateRender: ir }, at);
              }
              if (simTrack.actors[id]) simTrack.actors[id].a = to;
            });
          } else if (sp.do === 'move') {
            ids.forEach(id => {
              const tgt = W.actors[id]; if (!tgt) return;
              const tr = simTrack.actors[id];
              const to = { x: sp.x != null ? sp.x : tr.x, z: sp.z != null ? sp.z : tr.z, y: sp.y != null ? sp.y : tr.y };
              tl.fromTo(tgt, { x: tr.x, z: tr.z, y: tr.y }, { x: to.x, z: to.z, y: to.y, duration: dur, ease, immediateRender: ir }, pos);
              Object.assign(tr, to);
            });
          } else if (sp.do === 'cam') {
            const from = clone(simTrack.cam);
            const to = { pos: sp.pos ? sp.pos.slice() : from.pos, look: sp.look ? sp.look.slice() : from.look };
            const proxy = { k: 0 };
            tl.fromTo(proxy, { k: 0 }, { k: 1, duration: dur, ease, immediateRender: false, onUpdate: () => {
              for (let i = 0; i < 3; i++) {
                W.cam.pos[i] = from.pos[i] + (to.pos[i] - from.pos[i]) * proxy.k;
                W.cam.look[i] = from.look[i] + (to.look[i] - from.look[i]) * proxy.k;
              }
            } }, pos);
            simTrack.cam = to;
          } else if (sp.do === 'pulse') {
            ids.forEach((id, i) => {
              const tgt = W.actors[id]; if (!tgt) return;
              tl.to(tgt, { s: sp.amt || 1.18, duration: 0.32, yoyo: true, repeat: (sp.n || 2) * 2 - 1, ease: 'sine.inOut' }, pos + (sp.stagger || 0) * i);
            });
          } else if (sp.do === 'tint') {
            ids.forEach((id, i) => {
              const tgt = W.actors[id]; if (!tgt) return;
              tl.fromTo(tgt, { tint: simTrack.actors[id] ? simTrack.actors[id].tint : 0 }, { tint: sp.to != null ? sp.to : 1, duration: dur, ease: 'power1.inOut', immediateRender: ir }, pos + (sp.stagger || 0) * i);
              if (simTrack.actors[id]) simTrack.actors[id].tint = sp.to != null ? sp.to : 1;
            });
          } else if (sp.do === 'mark') {
            ids.forEach((id, i) => {
              const tgt = W.actors[id]; if (!tgt) return;
              const proxy = { v: (simTrack.actors[id] && simTrack.actors[id].marks[sp.m]) || 0 };
              tl.fromTo(proxy, { v: proxy.v }, { v: sp.on ? 1 : 0, duration: Math.min(0.5, dur), immediateRender: ir,
                onUpdate: () => { tgt.marks[sp.m] = proxy.v; } }, pos + (sp.stagger || 0) * i);
              if (simTrack.actors[id]) simTrack.actors[id].marks[sp.m] = sp.on ? 1 : 0;
            });
          } else if (sp.do === 'count') {
            const id = ids[0];
            const proxy = { v: sp.from != null ? sp.from : (simTrack.counts[id] || 0) };
            tl.to(proxy, { v: sp.to, duration: dur, ease: 'power1.out', onUpdate: () => { W.counts[id] = (sp.pre || '') + Math.round(proxy.v) + (sp.post || ''); } }, pos);
            simTrack.counts[id] = sp.to;
          } else if (sp.do === 'draw') {
            ids.forEach(id => {
              const tgt = W.links[id]; if (!tgt) return;
              tl.fromTo(tgt, { draw: simTrack.links[id] ? simTrack.links[id].draw : 0 }, { draw: 1, duration: dur, ease, immediateRender: ir }, pos);
              if (simTrack.links[id]) simTrack.links[id].draw = 1;
            });
          } else if (sp.do === 'flow') {
            const T = this._T;
            const n = sp.n || 3, travel = sp.travel || 1.8;
            const span = Math.min(sp.span != null ? sp.span : 6, D - pos);
            const reps = Math.max(0, Math.floor((span - travel) / travel));
            for (let i = 0; i < n; i++) {
              const mesh = new T.Mesh(new T.SphereGeometry(sp.r || 0.32, 12, 10),
                new T.MeshBasicMaterial({ color: new T.Color(sp.color || '#D97A2B'), transparent: true, opacity: 0 }));
              this._flowGroup.add(mesh);
              const d = { from: sp.from, to: sp.to, t: 0, a: 0, arc: sp.arc, mesh };
              this._dots.push(d);
              tl.fromTo(d, { t: 0 }, { t: 1, duration: travel, ease: 'none', repeat: reps, immediateRender: false,
                onUpdate: () => { d.a = d.t < 0.1 ? d.t / 0.1 : d.t > 0.9 ? (1 - d.t) / 0.1 : 1; } }, pos + i * (travel / n));
            }
          }
        });
        tl.set({}, {}, D);
        this._tl = tl;
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
        /* ease user orbit offsets back while playing, so the directed camera resumes */
        const ob = this._orbit;
        if (ob) { ob.dT *= 0.965; ob.dP *= 0.965; ob.dD = 1 + (ob.dD - 1) * 0.965; }
      },
      play() {
        if (!this.ready) { this._autoplay = true; return; }
        if (this.panel) this.panel = null;
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
        this.$nextTick(() => this.fitCanvas());
      },
      openPaper(id) { location.href = '/paper/' + id; },
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

      const panel = this.panel ? h('div', { class: 'sim3-panel' }, [
        h('button', { class: 'sim3-x', onClick: () => this.closePanel(false), 'aria-label': this.L.closePanel }, '×'),
        h('div', { class: 'sim3-kicker' }, 'ⓘ'),
        h('h4', {}, this.panel.title),
        this.panel.short ? h('p', { class: 'sim3-short' }, this.panel.short) : null,
        this.panel.long ? h('p', { class: 'sim3-long' }, this.panel.long) : null,
        this.panel.factoid ? h('blockquote', { class: 'sim3-quote' }, [
          h('span', {}, this.panel.factoid),
          this.panel.cite ? h('cite', {}, this.panel.cite) : null,
        ]) : null,
        this.panel.papers && this.panel.papers.length ? h('div', { class: 'sim3-links' },
          this.panel.papers.map(p => h('a', { href: '/paper/' + p.id }, this.L.readPaper + ' · ' + p.label + ' →'))) : null,
        h('p', { class: 'sim3-future' }, this.L.future),
        h('button', { class: 'sim-btn sim-primary', style: 'margin-top:10px;', onClick: () => this.closePanel(true) }, this.L.resume),
      ]) : null;

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
          h('div', { class: 'sim-stage' }, [
            h('div', { ref: 'stage3d', style: 'width:100%;' }),
            !this.webgl ? h('div', { style: 'padding:48px 24px;text-align:center;color:var(--ink-50);font-size:13px;' }, this.L.nowebgl) : null,
            h('div', { class: 'sim3-hint' }, this.L.hint),
            h('div', { class: 'sim-caption', 'aria-live': 'polite' }, this.showCaps ? this.currentCaption : ''),
            panel,
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

  /* panel + hint styles for the 3D engine */
  if (!document.getElementById('sim3-styles')) {
    const css = `
      .sim3-hint { position: absolute; left: 12px; top: 10px; font-size: 10.5px; color: var(--ink-50);
        background: rgba(247,244,237,0.88); padding: 4px 11px; border-radius: 99px; pointer-events: none; }
      .sim3-panel { position: absolute; right: 12px; top: 12px; bottom: 12px; width: 300px; max-width: 78%;
        background: #fff; border: 1px solid var(--rule-strong); border-radius: 10px; padding: 16px 18px;
        overflow-y: auto; z-index: 6; box-shadow: 0 12px 40px rgba(0,0,0,0.18); font-family: var(--font-sans, system-ui); }
      .sim3-panel h4 { margin: 2px 0 8px; font-size: 17px; color: var(--accent); }
      .sim3-kicker { font-size: 13px; color: var(--highlight); font-weight: 700; }
      .sim3-x { position: absolute; top: 8px; right: 10px; border: none; background: none; font-size: 18px; cursor: pointer; color: var(--ink-50); }
      .sim3-short { font-size: 13.5px; font-weight: 600; color: var(--ink); margin: 0 0 8px; line-height: 1.5; }
      .sim3-long { font-size: 12.5px; color: var(--ink-70); margin: 0 0 10px; line-height: 1.6; }
      .sim3-quote { margin: 10px 0; padding: 9px 12px; border-left: 3px solid var(--highlight);
        background: var(--paper-alt); font-size: 12.5px; line-height: 1.55; color: var(--ink-70); font-style: italic; }
      .sim3-quote cite { display: block; margin-top: 6px; font-style: normal; font-size: 10.5px; color: var(--ink-50); font-family: var(--font-mono); }
      .sim3-links { display: flex; flex-direction: column; gap: 5px; margin: 8px 0; }
      .sim3-links a { font-size: 12px; color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
      .sim3-future { font-size: 11px; color: var(--ink-50); border-top: 1px dashed var(--rule); padding-top: 8px; margin: 10px 0 0; line-height: 1.5; }
      @media (max-width: 680px) { .sim3-panel { width: 240px; } }
    `;
    const style = document.createElement('style');
    style.id = 'sim3-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  if (window.VWVisuals) window.VWVisuals.registerBespoke('sim', 'three', 'sim-three');
})();
