/* sim:manifold — the living particle manifold (owner: sim).

   Embed in a paper with:
       chart: { kind: "sim:manifold", sim: "gov3-manifold" }

   The fifth telling, in the creative-coding tradition and modelled on the
   intelligencemanifold reference: the entire story as a living field of
   light. A pool of particles plays the systems, the people, and the agents;
   per chapter they are assigned new formation targets and migrate with
   noisy, organic motion. An edge graph grows between the systems, signal
   pulses race along it, agents leave observable light-trails, and the
   finale reorganizes the whole field into concentric strata around a
   radiant core of rules.

   Rendered with Three.js Points (dynamic CDN import, additive blending,
   vertex colours, fog over a deep navy void — the high-tech inversion of
   the collection's cream). The pointer is a gravity well: reach in and stir
   the field. Drag orbits, the wheel zooms.

   Determinism contract: the STRUCTURE (formation, edge count, signal
   density, accents) derives from (chapter, progress); individual particle
   jitter is ambient texture, like the tapestry's dust. Same chapters,
   narration, captions, transcript, and audio clock as the other engines. */

(function () {
  const S = window.VWSim;
  if (!S) return;
  const h = S.h;
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.164.1/three.module.min.js';
  const N = 6800;                       // the particle pool
  const NEDGE = 360, NSIG = 140;

  /* deterministic pseudo-random (seeded), so formations are stable across visits */
  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

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
              hint: 'plongez le pointeur dans le champ · glissez pour orbiter · molette pour zoomer',
              nowebgl: 'La 3D n’est pas disponible dans ce navigateur. La narration et la transcription restent accessibles.' }
          : { play: 'Play', pause: 'Pause', replay: 'Replay', expand: 'Expand', close: 'Close', transcript: 'Transcript', hide: 'Hide transcript', caps: 'Captions',
              hint: 'reach into the field · drag to orbit · scroll to zoom',
              nowebgl: '3D is not available in this browser. The narration and transcript remain available.' };
      },
    },
    watch: {
      loc() { this.stopAll(); this.$nextTick(() => this.primeChapter()); },
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
        scene.fog = new T.FogExp2(0x0b1124, 0.012);
        this._scene = scene;
        this._camera = new T.PerspectiveCamera(46, 16 / 9, 0.1, 600);
        this._rig = { theta: 0.6, phi: 1.12, dist: 64, target: new T.Vector3(0, 0, 0), spin: 0.018 };

        /* particle pool */
        const pos = new Float32Array(N * 3);
        const col = new Float32Array(N * 3);
        const tgt = new Float32Array(N * 3);
        const meta = new Float32Array(N * 4);          // role, speed, phase, sizeBias
        this._P = { pos, col, tgt, meta };
        const geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.BufferAttribute(pos, 3));
        geo.setAttribute('color', new T.BufferAttribute(col, 3));
        const tex = this.dotTexture();
        const mat = new T.PointsMaterial({ size: 0.9, vertexColors: true, map: tex, alphaMap: tex,
          transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
        this._points = new T.Points(geo, mat);
        scene.add(this._points);

        /* edges + signals */
        const epos = new Float32Array(NEDGE * 2 * 3);
        const egeo = new T.BufferGeometry();
        egeo.setAttribute('position', new T.BufferAttribute(epos, 3));
        this._edges = new T.LineSegments(egeo, new T.LineBasicMaterial({ color: 0x3c5da8, transparent: true, opacity: 0.34, blending: T.AdditiveBlending }));
        this._edges.frustumCulled = false;
        scene.add(this._edges);
        const spos = new Float32Array(NSIG * 3);
        const scol = new Float32Array(NSIG * 3);
        const sgeo = new T.BufferGeometry();
        sgeo.setAttribute('position', new T.BufferAttribute(spos, 3));
        sgeo.setAttribute('color', new T.BufferAttribute(scol, 3));
        this._signals = new T.Points(sgeo, new T.PointsMaterial({ size: 1.7, vertexColors: true, map: tex, alphaMap: tex,
          transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
        this._signals.frustumCulled = false;
        scene.add(this._signals);
        this._sigState = Array.from({ length: NSIG }, (_, i) => ({ e: i % NEDGE, t: Math.random(), v: 0.25 + Math.random() * 0.5 }));

        this.buildLayout();
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
        const tex = new T.CanvasTexture(cv);
        return tex;
      },

      /* ---------- the world layout (seeded, stable) ---------- */
      buildLayout() {
        const rnd = mulberry(40319);
        /* 16 system clusters scattered on a wide disc */
        this._clusters = Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2 + rnd() * 0.5;
          const r = 16 + rnd() * 22;
          return { x: Math.cos(a) * r, y: (rnd() - 0.5) * 7, z: Math.sin(a) * r, r: 2.6 + rnd() * 2.2 };
        });
        /* people: a loose arc on the west side */
        this._people = Array.from({ length: 5 }, (_, i) => ({
          x: -30 + i * 2.2, y: -2 + (i % 2) * 2.2, z: -6 + i * 3.2,
        }));
        /* edge endpoints between cluster pairs (deterministic shuffle) */
        this._edgePairs = [];
        for (let i = 0; i < NEDGE; i++) {
          const a = Math.floor(rnd() * 16), b = (a + 1 + Math.floor(rnd() * 14)) % 16;
          this._edgePairs.push([a, b]);
        }
        /* role assignment: 0 system, 1 person, 2 agent, 3 ledger, 4 friction-reserve */
        const { meta } = this._P;
        for (let i = 0; i < N; i++) {
          const u = rnd();
          const role = u < 0.66 ? 0 : u < 0.73 ? 1 : u < 0.85 ? 2 : u < 0.95 ? 3 : 4;
          meta[i * 4] = role;
          meta[i * 4 + 1] = 0.5 + rnd() * 1.4;        // speed
          meta[i * 4 + 2] = rnd() * Math.PI * 2;      // phase
          meta[i * 4 + 3] = 0.6 + rnd() * 1.3;        // size bias (via colour energy)
          /* scatter start */
          this._P.pos[i * 3] = (rnd() - 0.5) * 90;
          this._P.pos[i * 3 + 1] = (rnd() - 0.5) * 40;
          this._P.pos[i * 3 + 2] = (rnd() - 0.5) * 90;
        }
        this._roleRnd = mulberry(977);
      },

      /* per-chapter formation targets — pure function of (chapter fx, progress bucket) */
      assignTargets() {
        const fx = (this.chapter && this.chapter.fx) || { form: 'clusters' };
        const rnd = mulberry(1234 + this.ch * 71);
        const { tgt, col, meta } = this._P;
        const C = {
          system: [0.62, 0.66, 0.85], systemDim: [0.30, 0.34, 0.52], open: [0.45, 0.95, 0.55],
          person: [0.99, 0.86, 0.46], agent: [1.0, 0.55, 0.16], ledger: [0.93, 0.74, 0.25],
          core: [0.95, 0.88, 0.6], friction: [0.95, 0.25, 0.12], cream: [0.96, 0.93, 0.85],
        };
        const setC = (i, c, k) => { col[i * 3] = c[0] * k; col[i * 3 + 1] = c[1] * k; col[i * 3 + 2] = c[2] * k; };
        for (let i = 0; i < N; i++) {
          const role = meta[i * 4], bias = meta[i * 4 + 3];
          let x = 0, y = 0, z = 0;
          if (fx.form === 'manifold' || fx.form === 'healing') {
            /* concentric strata around a radiant core */
            if (role === 0 || role === 3) {
              const stratum = i % 4;
              const R = 9 + stratum * 5.5;
              const t1 = rnd() * Math.PI * 2, t2 = Math.acos(2 * rnd() - 1);
              x = R * Math.sin(t2) * Math.cos(t1); y = (R * Math.cos(t2)) * 0.55; z = R * Math.sin(t2) * Math.sin(t1);
              setC(i, role === 3 ? C.ledger : C.system, 0.85 * bias);
            } else if (role === 1) {
              const a = rnd() * Math.PI * 2;
              x = Math.cos(a) * 31; y = 2 + rnd() * 3; z = Math.sin(a) * 31;
              setC(i, C.person, 1.1 * bias);
            } else if (role === 2) {
              const stratum = i % 3;
              const R = 11 + stratum * 5.5;
              const a = rnd() * Math.PI * 2;
              x = Math.cos(a) * R; y = (rnd() - 0.5) * 6; z = Math.sin(a) * R;
              setC(i, C.agent, 1.25 * bias);
            } else {
              if (fx.form === 'healing' && i % 3 === 0) {
                x = 14 + rnd() * 3; y = 3 + rnd() * 2; z = 6 + rnd() * 3;       // the knot
                setC(i, C.friction, 1.3);
              } else {
                const t1 = rnd() * Math.PI * 2, t2 = Math.acos(2 * rnd() - 1);
                x = 4.5 * Math.sin(t2) * Math.cos(t1); y = 4.5 * Math.cos(t2); z = 4.5 * Math.sin(t2) * Math.sin(t1);
                setC(i, C.core, 1.5 * bias);                                     // the radiant core
              }
            }
          } else if (fx.form === 'ledger' && role === 3) {
            const k = rnd();
            const a = k * Math.PI * 7;
            x = 24 + Math.cos(a) * 4.5; y = -8 + k * 18; z = 14 + Math.sin(a) * 4.5;   // the golden helix
            setC(i, C.ledger, 1.25 * bias);
          } else if (fx.form === 'dialogue' && (role === 1 || role === 2)) {
            const left = role === 1;
            const t1 = rnd() * Math.PI * 2, t2 = Math.acos(2 * rnd() - 1);
            const R = 3.2;
            x = (left ? -7 : 7) + R * Math.sin(t2) * Math.cos(t1);
            y = R * Math.cos(t2); z = R * Math.sin(t2) * Math.sin(t1);
            setC(i, left ? C.person : C.agent, 1.3 * bias);
          } else if (fx.form === 'uiframe' && role === 2 && i % 2 === 0) {
            /* a constellation snaps into an interface frame */
            const k = rnd();
            if (k < 0.62) {                              // the border
              const e = Math.floor(rnd() * 4), tparam = rnd();
              const Wd = 16, Hg = 10;
              if (e === 0) { x = -Wd / 2 + tparam * Wd; y = Hg / 2; }
              else if (e === 1) { x = -Wd / 2 + tparam * Wd; y = -Hg / 2; }
              else if (e === 2) { x = -Wd / 2; y = -Hg / 2 + tparam * Hg; }
              else { x = Wd / 2; y = -Hg / 2 + tparam * Hg; }
              z = 0;
            } else {                                     // chart bars inside
              const bidx = Math.floor(rnd() * 4);
              x = -5 + bidx * 3.4 + (rnd() - 0.5);
              const hmax = [4, 7, 5, 8][bidx];
              y = -4.4 + rnd() * hmax; z = 0.4;
            }
            x -= 2; y += 1;
            setC(i, C.cream, 1.35 * bias);
          } else {
            /* default: the cluster archipelago */
            if (role === 0 || role === 3) {
              const c = this._clusters[i % 16];
              const t1 = rnd() * Math.PI * 2, t2 = Math.acos(2 * rnd() - 1);
              const rr = c.r * Math.cbrt(rnd());
              x = c.x + rr * Math.sin(t2) * Math.cos(t1);
              y = c.y + rr * Math.cos(t2) * 0.7;
              z = c.z + rr * Math.sin(t2) * Math.sin(t1);
              const opened = fx.ports && (i % 16) < 14;
              setC(i, opened ? C.open : (fx.form === 'clusters' && !fx.ports ? C.systemDim : C.system), (opened ? 1.0 : 0.7) * bias);
            } else if (role === 1) {
              const p = this._people[i % 5];
              x = p.x + (rnd() - 0.5) * 2.4; y = p.y + (rnd() - 0.5) * 2.4; z = p.z + (rnd() - 0.5) * 2.4;
              setC(i, C.person, 1.15 * bias);
            } else if (role === 2) {
              if (fx.agents) {
                const c = this._clusters[i % 16];
                const a = rnd() * Math.PI * 2;
                const orbitR = c.r + (fx.ports ? 0.8 : 2.6);
                x = c.x + Math.cos(a) * orbitR; y = c.y + (rnd() - 0.5) * 2; z = c.z + Math.sin(a) * orbitR;
                setC(i, C.agent, 1.3 * bias);
              } else {
                x = -34 + rnd() * 6; y = -14 - rnd() * 6; z = (rnd() - 0.5) * 20;   // waiting in the wings, dim
                setC(i, C.agent, 0.001);
              }
            } else {
              x = (rnd() - 0.5) * 110; y = -22 - rnd() * 10; z = (rnd() - 0.5) * 110;
              setC(i, C.systemDim, 0.12);
            }
          }
          tgt[i * 3] = x; tgt[i * 3 + 1] = y; tgt[i * 3 + 2] = z;
        }
        this._points.geometry.attributes.color.needsUpdate = true;
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
        if (this._P) this.assignTargets();
        if (this._rig) {
          const looks = { dialogue: 26, uiframe: 30, ledger: 52, manifold: 66, healing: 62 };
          this._rig.dist = looks[(this.chapter.fx || {}).form] || 64;
        }
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

      /* ---------- the field ---------- */
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
      step(dt, t) {
        const T = this._T;
        if (!T || !this._P) return;
        const { pos, tgt, meta } = this._P;
        const fx = (this.chapter && this.chapter.fx) || {};
        const settle = this.motion ? 1 : 30;                 // reduced motion: snap
        /* pointer gravity well in world space */
        let well = null;
        if (this._pw && this._pw.active) well = this._pw.point;
        for (let i = 0; i < N; i++) {
          const ix = i * 3;
          const sp = meta[i * 4 + 1] * settle;
          const ph = meta[i * 4 + 2];
          let dx = tgt[ix] - pos[ix], dy = tgt[ix + 1] - pos[ix + 1], dz = tgt[ix + 2] - pos[ix + 2];
          pos[ix] += dx * dt * sp * 0.9;
          pos[ix + 1] += dy * dt * sp * 0.9;
          pos[ix + 2] += dz * dt * sp * 0.9;
          if (this.motion) {
            /* organic wander */
            pos[ix] += Math.sin(t * 0.9 + ph + i * 0.61) * 0.012;
            pos[ix + 1] += Math.cos(t * 1.1 + ph * 2) * 0.010;
            pos[ix + 2] += Math.sin(t * 0.7 + ph * 3 + i * 0.13) * 0.012;
          }
          if (well) {
            const wx = well.x - pos[ix], wy = well.y - pos[ix + 1], wz = well.z - pos[ix + 2];
            const d2 = wx * wx + wy * wy + wz * wz;
            if (d2 < 140) {
              const f = (1 - d2 / 140) * 4.2 * dt;
              pos[ix] += wx * f; pos[ix + 1] += wy * f; pos[ix + 2] += wz * f;
            }
          }
        }
        this._points.geometry.attributes.position.needsUpdate = true;

        /* edges grow with chapter progress */
        const live = Math.round(NEDGE * (fx.edges || 0) * Math.min(1, this.progress * 2 + 0.15));
        const ep = this._edges.geometry.attributes.position.array;
        for (let e = 0; e < NEDGE; e++) {
          const [a, b] = this._edgePairs[e];
          const A = (fx.form === 'manifold' || fx.form === 'healing') ? this.strataPoint(a) : this._clusters[a];
          const B = (fx.form === 'manifold' || fx.form === 'healing') ? this.strataPoint(b) : this._clusters[b];
          const on = e < live;
          ep[e * 6] = A.x; ep[e * 6 + 1] = on ? A.y : 1e4; ep[e * 6 + 2] = A.z;
          ep[e * 6 + 3] = B.x; ep[e * 6 + 4] = on ? B.y : 1e4; ep[e * 6 + 5] = B.z;
        }
        this._edges.geometry.attributes.position.needsUpdate = true;

        /* signals race along live edges */
        const sigLive = Math.round(NSIG * (fx.signals || 0));
        const sp2 = this._signals.geometry.attributes.position.array;
        const sc = this._signals.geometry.attributes.color.array;
        this._sigState.forEach((sg, i) => {
          const on = i < sigLive && (sg.e % NEDGE) < Math.max(1, live);
          if (!on) { sp2[i * 3 + 1] = 1e4; return; }
          sg.t += dt * sg.v * (this.motion ? 1 : 0);
          if (sg.t > 1) { sg.t = 0; sg.e = (sg.e + 7) % Math.max(1, live); }
          const [a, b] = this._edgePairs[sg.e % NEDGE];
          const A = (fx.form === 'manifold' || fx.form === 'healing') ? this.strataPoint(a) : this._clusters[a];
          const B = (fx.form === 'manifold' || fx.form === 'healing') ? this.strataPoint(b) : this._clusters[b];
          sp2[i * 3] = A.x + (B.x - A.x) * sg.t;
          sp2[i * 3 + 1] = A.y + (B.y - A.y) * sg.t;
          sp2[i * 3 + 2] = A.z + (B.z - A.z) * sg.t;
          const gold = fx.trails || fx.form === 'manifold' || fx.form === 'healing';
          sc[i * 3] = gold ? 0.95 : 1.0; sc[i * 3 + 1] = gold ? 0.78 : 0.6; sc[i * 3 + 2] = gold ? 0.3 : 0.25;
        });
        this._signals.geometry.attributes.position.needsUpdate = true;
        this._signals.geometry.attributes.color.needsUpdate = true;

        /* healing sweep: late in chapter 8 the friction knot fades to core gold */
        if (fx.form === 'healing' && this.progress > 0.72) {
          const k = Math.min(1, (this.progress - 0.72) / 0.2);
          const colA = this._points.geometry.attributes.color.array;
          for (let i = 0; i < N; i++) {
            if (meta[i * 4] === 4 && i % 3 === 0) {
              colA[i * 3] = 0.95 - 0.0 * k; colA[i * 3 + 1] = 0.25 + 0.6 * k; colA[i * 3 + 2] = 0.12 + 0.4 * k;
            }
          }
          this._points.geometry.attributes.color.needsUpdate = true;
        }

        /* camera rig: slow auto-rotation + user orbit */
        const rig = this._rig;
        if (this.motion && this.playing) rig.theta += rig.spin * dt;
        const cp = new T.Vector3(
          rig.target.x + rig.dist * Math.sin(rig.phi) * Math.cos(rig.theta),
          rig.target.y + rig.dist * Math.cos(rig.phi),
          rig.target.z + rig.dist * Math.sin(rig.phi) * Math.sin(rig.theta));
        this._camera.position.lerp(cp, 0.08);
        this._camera.lookAt(rig.target);
      },
      strataPoint(i) {
        /* stable per-cluster anchor re-mapped onto the manifold strata */
        const a = (i / 16) * Math.PI * 2;
        const R = 9 + (i % 4) * 5.5;
        return { x: Math.cos(a * 2.3) * R, y: Math.sin(a * 1.7) * R * 0.4, z: Math.sin(a * 2.3) * R };
      },

      /* ---------- pointer: gravity well + orbit ---------- */
      bindPointer(el) {
        const T = this._T;
        let down = null, moved = false;
        el.style.touchAction = 'none';
        this._pw = { active: false, point: new T.Vector3() };
        const toWell = (e) => {
          const r = el.getBoundingClientRect();
          const ndc = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
          const ray = new T.Raycaster();
          ray.setFromCamera(ndc, this._camera);
          /* the well lives on the sphere of the current formation radius */
          const o = ray.ray.origin, d = ray.ray.direction;
          const tHit = -o.dot(d) ;
          this._pw.point.copy(o).addScaledVector(d, Math.max(10, tHit));
        };
        el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; moved = false; el.setPointerCapture(e.pointerId); });
        el.addEventListener('pointermove', e => {
          toWell(e);
          this._pw.active = true;
          if (!down) return;
          const dx = e.clientX - down.x, dy = e.clientY - down.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
          this._rig.theta -= dx * 0.005;
          this._rig.phi = Math.max(0.2, Math.min(Math.PI / 2.05, this._rig.phi - dy * 0.004));
          down = { x: e.clientX, y: e.clientY };
        });
        el.addEventListener('pointerup', () => { down = null; });
        el.addEventListener('pointerleave', () => { this._pw.active = false; down = null; });
        el.addEventListener('wheel', e => {
          e.preventDefault();
          this._rig.dist = Math.max(14, Math.min(150, this._rig.dist * (e.deltaY > 0 ? 1.07 : 0.93)));
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
