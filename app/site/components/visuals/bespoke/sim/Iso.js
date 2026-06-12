/* sim:iso — the isometric game-board simulation engine (owner: sim).

   Embed in a paper with:
       chart: { kind: "sim:iso", sim: "gov3-iso" }

   The second visualization engine for the same narrated stories: a tile-based
   axonometric game board in the Age-of-Empires tradition. Buildings, people,
   and agents are gpt-image-2 sprites (chroma-keyed to transparency by
   scripts/gen-iso-sprites.mjs); the board, zones, marks, pills, and arrows are
   crisp vector drawing on canvas. Chapters, narration, captions, transcript,
   and the audio-is-the-master-clock transport are identical to sim:player —
   a dataset can set audioSim to share another simulation's narration files.

   GSAP tweens a plain world-state object (never the DOM); a depth-sorted
   canvas loop draws whatever the state says. fromTo + immediateRender-at-zero
   keeps every seek position exact. Degrades to a static storyboard per
   chapter without GSAP / with prefers-reduced-motion. */

(function () {
  const S = window.VWSim;
  if (!S) return;
  const h = S.h, PAL = S.PAL;
  const TW = 76, TH = 38;               // tile diamond, design units
  const DW = 1280, DH = 720;            // design space mapped onto the canvas

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- state ---------- */
  function baseState(sim) {
    const st = { cam: Object.assign({ gx: 10, gy: 7, z: 1 }, (sim.board && sim.board.cam) || {}), actors: {}, links: {}, counts: {} };
    (sim.actors || []).forEach(a => {
      if (a.kind === 'link') { st.links[a.id] = { draw: 0, a: 1 }; return; }
      st.actors[a.id] = { gx: a.gx, gy: a.gy, a: a.on ? 1 : 0, s: 1, sprite: a.sprite || null, marks: {} };
    });
    return st;
  }
  function applySteps(st, steps) {
    (steps || []).forEach(sp => {
      const ids = sp.id ? [sp.id] : (sp.ids || []);
      switch (sp.do) {
        case 'show': ids.forEach(id => { if (st.actors[id]) st.actors[id].a = 1; else if (st.links[id]) st.links[id].a = 1; }); break;
        case 'hide': ids.forEach(id => { if (st.actors[id]) st.actors[id].a = 0; else if (st.links[id]) st.links[id].a = 0; }); break;
        case 'move': ids.forEach(id => { const a = st.actors[id]; if (a) { if (sp.gx != null) a.gx = sp.gx; if (sp.gy != null) a.gy = sp.gy; } }); break;
        case 'cam': st.cam = { gx: sp.gx != null ? sp.gx : st.cam.gx, gy: sp.gy != null ? sp.gy : st.cam.gy, z: sp.z != null ? sp.z : st.cam.z }; break;
        case 'swap': ids.forEach(id => { if (st.actors[id]) st.actors[id].sprite = sp.sprite; }); break;
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
  window.VWComponents['sim-iso'] = {
    props: {
      kind: { type: String, default: '' },
      sim: { type: String, default: '' },
      start: { type: Number, default: 0 },
    },
    data() {
      return { dataset: null, error: null, ch: this.start || 0, playing: false, fs: false, showNarr: false,
               progress: 0, chDur: 30, audioOk: true, ready: false, animated: S.gsapOK(), assetsReady: false };
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
          ? { play: 'Lecture', pause: 'Pause', replay: 'Rejouer', expand: 'Plein écran', close: 'Fermer', transcript: 'Transcription', hide: 'Masquer la transcription', staticNote: 'Mode storyboard (animation désactivée)' }
          : { play: 'Play', pause: 'Pause', replay: 'Replay', expand: 'Expand', close: 'Close', transcript: 'Transcript', hide: 'Hide transcript', staticNote: 'Storyboard mode (animation off)' };
      },
    },
    watch: {
      loc() { this.stopAll(); this.$nextTick(() => this.primeChapter()); },
      ch() { this.$nextTick(() => this.primeChapter()); },
      fs() { this.$nextTick(() => this.fitCanvas()); },
    },
    created() {
      S.loadData(this.sim).then(d => {
        this.dataset = d;
        this.loadAssets(d);
        this.$nextTick(() => { this.fitCanvas(); this.primeChapter(); });
      }).catch(e => { this.error = 'Simulation "' + this.sim + '" failed to load: ' + e.message; });
    },
    mounted() {
      this._tick = () => this.syncTick();
      if (typeof gsap !== 'undefined') gsap.ticker.add(this._tick);
      else this._iv = setInterval(this._tick, 120);
      this._raf = () => { this.draw(); this._rafId = requestAnimationFrame(this._raf); };
      this._rafId = requestAnimationFrame(this._raf);
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
    },
    methods: {
      /* ---------- assets ---------- */
      loadAssets(sim) {
        const dir = 'public/images/sims/' + sim.id + '/';
        this._imgs = {}; this._manifest = {};
        fetch(dir + 'manifest.json').then(r => r.json()).then(man => {
          this._manifest = man || {};
          const keys = Object.keys(sim.sprites || {});
          let left = keys.length;
          keys.forEach(k => {
            const im = new Image();
            im.onload = () => { if (--left <= 0) this.assetsReady = true; };
            im.onerror = () => { if (--left <= 0) this.assetsReady = true; };
            im.src = dir + k + '.png';
            this._imgs[k] = im;
          });
          if (!keys.length) this.assetsReady = true;
        }).catch(() => { this.assetsReady = true; });
      },
      actorById(id) { return (this.dataset.actors || []).find(a => a.id === id); },

      /* ---------- chapter lifecycle (audio is the clock) ---------- */
      stopAll() {
        this.playing = false;
        const au = this.$refs.audio; if (au) { try { au.pause(); } catch (e) {} }
        if (this._tl) { try { this._tl.kill(); } catch (e) {} this._tl = null; }
        this._dots = [];
      },
      primeChapter() {
        if (!this.dataset || !this.chapter) return;
        this.stopAll();
        this.progress = 0;
        this.ready = false;
        this.W = clone(this.stateAtStart);
        if (!this.animated) applySteps(this.W, this.chapter.steps);      // static storyboard: end state
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
      buildTimeline() {
        const D = this.chDur, W = this.W;
        const tl = gsap.timeline({ paused: true });
        const sim = { actors: W.actors };           // tween targets are the live state objects
        const simTrack = clone(this.stateAtStart);  // chains "from" values across sequential steps
        this._dots = [];
        const steps = (this.chapter.steps || []).slice().sort((a, b) => (a.t || 0) - (b.t || 0));
        steps.forEach(sp => {
          const pos = Math.max(0, Math.min(1, sp.t || 0)) * D;
          const dur = Math.min(sp.dur != null ? sp.dur : 0.8, Math.max(0.1, D - pos));
          const ease = sp.ease || 'power2.inOut';
          const ir = pos === 0;
          const ids = sp.id ? [sp.id] : (sp.ids || []);
          if (sp.do === 'show' || sp.do === 'hide') {
            const to = sp.do === 'show' ? 1 : 0;
            ids.forEach((id, i) => {
              if (!W.actors[id] && W.links[id]) {
                const lt = W.links[id];
                tl.fromTo(lt, { a: simTrack.links[id] ? simTrack.links[id].a : 1 }, { a: to, duration: dur, ease: 'power1.inOut', immediateRender: ir }, pos + (sp.stagger || 0) * i);
                if (simTrack.links[id]) simTrack.links[id].a = to;
                return;
              }
              const tgt = W.actors[id]; if (!tgt) return;
              const from = simTrack.actors[id] ? simTrack.actors[id].a : 0;
              const at = pos + (sp.stagger || 0) * i;
              if (sp.fx === 'pop') {
                tl.fromTo(tgt, { a: from, s: 0.4 }, { a: to, s: 1, duration: dur, ease: 'back.out(1.8)', immediateRender: ir }, at);
              } else if (sp.fx === 'rise') {
                const g = simTrack.actors[id] || { gx: tgt.gx, gy: tgt.gy };
                tl.fromTo(tgt, { a: from, gy: g.gy + 0.45, gx: g.gx }, { a: to, gy: g.gy, gx: g.gx, duration: dur, ease, immediateRender: ir }, at);
              } else {
                tl.fromTo(tgt, { a: from }, { a: to, duration: dur, ease: 'power1.inOut', immediateRender: ir }, at);
              }
              if (simTrack.actors[id]) simTrack.actors[id].a = to;
            });
          } else if (sp.do === 'move') {
            ids.forEach(id => {
              const tgt = W.actors[id]; if (!tgt) return;
              const g = simTrack.actors[id];
              const to = { gx: sp.gx != null ? sp.gx : g.gx, gy: sp.gy != null ? sp.gy : g.gy };
              tl.fromTo(tgt, { gx: g.gx, gy: g.gy }, { gx: to.gx, gy: to.gy, duration: dur, ease, immediateRender: ir }, pos);
              g.gx = to.gx; g.gy = to.gy;
            });
          } else if (sp.do === 'cam') {
            const from = Object.assign({}, simTrack.cam);
            const to = { gx: sp.gx != null ? sp.gx : from.gx, gy: sp.gy != null ? sp.gy : from.gy, z: sp.z != null ? sp.z : from.z };
            tl.fromTo(W.cam, { gx: from.gx, gy: from.gy, z: from.z }, { gx: to.gx, gy: to.gy, z: to.z, duration: dur, ease, immediateRender: ir }, pos);
            simTrack.cam = to;
          } else if (sp.do === 'pulse') {
            ids.forEach((id, i) => {
              const tgt = W.actors[id]; if (!tgt) return;
              tl.to(tgt, { s: sp.amt || 1.16, duration: 0.3, yoyo: true, repeat: (sp.n || 2) * 2 - 1, ease: 'sine.inOut' }, pos + (sp.stagger || 0) * i);
            });
          } else if (sp.do === 'swap') {
            ids.forEach((id, i) => {
              const tgt = W.actors[id]; if (!tgt) return;
              const at = pos + (sp.stagger || 0) * i;
              /* a sprite swap is a quick dip-and-pop, scrub-safe via two tweens on alpha around the set point */
              const proxy = { k: 0 };
              tl.fromTo(proxy, { k: 0 }, { k: 1, duration: Math.max(0.35, dur), ease: 'power1.inOut', immediateRender: false,
                onUpdate: () => { tgt.sprite = proxy.k >= 0.5 ? sp.sprite : (simTrack.actors[id] || {}).sprite || tgt.sprite; },
              }, at);
              tl.fromTo(tgt, { s: 1 }, { s: 1.18, duration: 0.22, yoyo: true, repeat: 1, immediateRender: false }, at + Math.max(0.35, dur) / 2 - 0.22);
            });
            ids.forEach(id => { if (simTrack.actors[id]) simTrack.actors[id].sprite = sp.sprite; });
          } else if (sp.do === 'mark') {
            ids.forEach((id, i) => {
              const tgt = W.actors[id]; if (!tgt) return;
              const proxy = { v: (simTrack.actors[id] && simTrack.actors[id].marks[sp.m]) || 0 };
              tl.fromTo(proxy, { v: proxy.v }, { v: sp.on ? 1 : 0, duration: Math.min(0.5, dur), ease: 'power1.inOut', immediateRender: ir,
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
            const n = sp.n || 3, travel = sp.travel || 1.8;
            const span = Math.min(sp.span != null ? sp.span : 6, D - pos);
            const reps = Math.max(0, Math.floor((span - travel) / travel));
            for (let i = 0; i < n; i++) {
              const dot = { from: sp.from, to: sp.to, t: 0, a: 0, color: sp.color || PAL.agent, r: sp.r || 5 };
              this._dots.push(dot);
              tl.fromTo(dot, { t: 0 }, { t: 1, duration: travel, ease: 'none', repeat: reps, immediateRender: false,
                onUpdate: () => { dot.a = dot.t < 0.1 ? dot.t / 0.1 : dot.t > 0.9 ? (1 - dot.t) / 0.1 : 1; } }, pos + i * (travel / n));
            }
          }
        });
        tl.set({}, {}, D);
        this._tl = tl;
      },

      /* ---------- transport (identical model to sim:player) ---------- */
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

      /* ---------- canvas rendering ---------- */
      fitCanvas() {
        const cv = this.$refs.canvas; if (!cv) return;
        const rect = cv.parentElement.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const wpx = Math.max(320, rect.width);
        const hpx = this.fs ? rect.height : wpx * 9 / 16;
        cv.width = Math.round(wpx * dpr); cv.height = Math.round(hpx * dpr);
        cv.style.height = hpx + 'px';
        this._dpr = dpr; this._w = wpx; this._h = hpx;
      },
      proj(gx, gy) {
        const W = this.W, k = (this._w / DW) * (W ? W.cam.z : 1);
        const isoX = (gx - gy) * TW / 2, isoY = (gx + gy) * TH / 2;
        const cIsoX = (W.cam.gx - W.cam.gy) * TW / 2, cIsoY = (W.cam.gx + W.cam.gy) * TH / 2;
        return { x: (isoX - cIsoX) * k + this._w / 2, y: (isoY - cIsoY) * k + this._h * 0.52, k };
      },
      anchorOf(id) {
        const a = this.actorById(id), st = this.W.actors[id];
        if (!a || !st) return null;
        const p = this.proj(st.gx, st.gy);
        if (a.kind === 'sprite') {
          const spec = (this.dataset.sprites || {})[st.sprite] || { h: 2 };
          p.y -= spec.h * TH * p.k * 0.45;     // mid-body anchor for links and flows
        }
        return p;
      },
      draw() {
        const cv = this.$refs.canvas, sim = this.dataset;
        if (!cv || !sim || !this.W) return;
        const ctx = cv.getContext('2d');
        const dpr = this._dpr || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, this._w, this._h);
        const W = this.W, board = sim.board || { cols: 20, rows: 14 };
        const loc = this.loc;

        /* ground tiles */
        for (let gx = 0; gx < board.cols; gx++) {
          for (let gy = 0; gy < board.rows; gy++) {
            const p = this.proj(gx + 0.5, gy + 0.5);
            const tw = TW * p.k, th = TH * p.k;
            if (p.x < -tw || p.x > this._w + tw || p.y < -th || p.y > this._h + th) continue;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - th / 2); ctx.lineTo(p.x + tw / 2, p.y); ctx.lineTo(p.x, p.y + th / 2); ctx.lineTo(p.x - tw / 2, p.y); ctx.closePath();
            ctx.fillStyle = (gx + gy) % 2 ? '#f3efe5' : '#f7f4ed';
            ctx.fill();
            ctx.strokeStyle = 'rgba(184,174,153,0.28)'; ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        const labelJobs = [];           // all text paints LAST so no sprite can cover it
        /* zones: tinted iso rectangles + corner label */
        (sim.actors || []).filter(a => a.kind === 'zone').forEach(a => {
          const st = W.actors[a.id]; if (!st || st.a <= 0.01) return;
          ctx.globalAlpha = st.a;
          const c = [[a.gx, a.gy], [a.gx + a.w, a.gy], [a.gx + a.w, a.gy + a.h], [a.gx, a.gy + a.h]].map(q => this.proj(q[0], q[1]));
          ctx.beginPath(); ctx.moveTo(c[0].x, c[0].y); c.slice(1).forEach(q => ctx.lineTo(q.x, q.y)); ctx.closePath();
          ctx.fillStyle = a.fill || 'rgba(26,58,110,0.06)'; ctx.fill();
          ctx.setLineDash([4, 6]); ctx.strokeStyle = PAL.ruleStrong; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);
          const lp = this.proj(a.gx + 0.3, a.gy + 0.3);
          labelJobs.push({ kind: 'zone', x: lp.x, y: lp.y, k: c[0].k, a: st.a, text: S.t(a.label, loc).toUpperCase() });
          ctx.globalAlpha = 1;
        });
        /* links (under sprites) */
        (sim.actors || []).filter(a => a.kind === 'link').forEach(a => {
          const st = W.links[a.id]; if (!st || st.draw <= 0.005 || (st.a != null && st.a <= 0.01)) return;
          const p0 = this.anchorOf(a.frm), p1 = this.anchorOf(a.to);
          if (!p0 || !p1) return;
          const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 + (a.curve || -40) * p0.k };
          const N = 36, M = Math.max(2, Math.round(N * st.draw));
          ctx.beginPath();
          for (let i = 0; i <= M; i++) {
            const u = (i / N), v = 1 - u;
            const x = v * v * p0.x + 2 * v * u * mid.x + u * u * p1.x;
            const y = v * v * p0.y + 2 * v * u * mid.y + u * u * p1.y;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.globalAlpha = st.a != null ? st.a : 1;
          ctx.strokeStyle = a.color || PAL.ink70; ctx.lineWidth = 1.8; ctx.stroke();
          if (st.draw > 0.97) {                                   // arrowhead
            const u = 1, v = 0;
            const dx = p1.x - mid.x, dy = p1.y - mid.y, ang = Math.atan2(dy, dx);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p1.x - 9 * Math.cos(ang - 0.42), p1.y - 9 * Math.sin(ang - 0.42));
            ctx.lineTo(p1.x - 9 * Math.cos(ang + 0.42), p1.y - 9 * Math.sin(ang + 0.42));
            ctx.closePath(); ctx.fillStyle = a.color || PAL.ink70; ctx.fill();
          }
          ctx.globalAlpha = 1;
        });
        /* sprites, depth-sorted */
        const sprites = (sim.actors || []).filter(a => a.kind === 'sprite')
          .map(a => ({ a, st: W.actors[a.id] }))
          .filter(x => x.st && x.st.a > 0.01)
          .sort((m, n) => (m.st.gx + m.st.gy) - (n.st.gx + n.st.gy));
        sprites.forEach(({ a, st }) => {
          const p = this.proj(st.gx, st.gy);
          const spec = (sim.sprites || {})[st.sprite] || { h: 2 };
          const man = (this._manifest || {})[st.sprite] || { w: 1, h: 1 };
          const hp = spec.h * TH * p.k * st.s;
          const wp = hp * (man.w / man.h);
          ctx.globalAlpha = st.a;
          /* ground shadow */
          ctx.beginPath(); ctx.ellipse(p.x, p.y, wp * 0.34, Math.max(3, hp * 0.07), 0, 0, 7);
          ctx.fillStyle = 'rgba(40,35,25,0.16)'; ctx.fill();
          const img = (this._imgs || {})[st.sprite];
          if (img && img.complete && img.naturalWidth) ctx.drawImage(img, p.x - wp / 2, p.y - hp, wp, hp);
          else { ctx.fillStyle = 'rgba(26,58,110,0.15)'; ctx.fillRect(p.x - wp / 2, p.y - hp, wp, hp); }
          this.drawMarks(ctx, a, st, p, wp, hp);
          const ldx = (a.labelDx || 0) * p.k, ldy = (a.labelDy || 0) * p.k;
          if (a.label) labelJobs.push({ kind: 'sprite', x: p.x + ldx, y: p.y + 4 * p.k + ldy, k: p.k, a: st.a, text: S.t(a.label, loc) });
          if (a.sub && st.a > 0.5) labelJobs.push({ kind: 'sub', x: p.x + ldx, y: p.y + 5.5 * p.k + 15 * Math.max(0.8, p.k) + ldy, k: p.k, a: st.a, text: S.t(a.sub, loc) });
          ctx.globalAlpha = 1;
        });
        /* the deferred text pass: sprite labels, subs, and zone headings on top */
        labelJobs.forEach(j => {
          ctx.globalAlpha = Math.min(1, j.a);
          if (j.kind === 'zone') {
            ctx.font = '700 ' + Math.max(9, 12 * j.k) + 'px var(--font-mono, monospace)';
            const tw2 = ctx.measureText(j.text).width;
            ctx.fillStyle = 'rgba(247,244,237,0.8)';
            ctx.fillRect(j.x - 4, j.y - 8, tw2 + 8, 16);
            ctx.fillStyle = PAL.ink50; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(j.text, j.x, j.y);
          } else if (j.kind === 'sprite') {
            ctx.font = Math.max(9, 11.5 * j.k) + 'px var(--font-mono, monospace)';
            const tw2 = ctx.measureText(j.text).width;
            ctx.fillStyle = 'rgba(247,244,237,0.88)';
            ctx.fillRect(j.x - tw2 / 2 - 4, j.y, tw2 + 8, 14 * Math.max(0.8, j.k));
            ctx.fillStyle = PAL.ink70; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(j.text, j.x, j.y + 1.5 * j.k);
          } else {
            ctx.font = Math.max(8, 10.5 * j.k) + 'px var(--font-mono, monospace)';
            ctx.fillStyle = PAL.ink50; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(j.text, j.x, j.y);
          }
          ctx.globalAlpha = 1;
        });
        /* pills + labels (above sprites) */
        (sim.actors || []).filter(a => a.kind === 'pill' || a.kind === 'label').forEach(a => {
          const st = W.actors[a.id]; if (!st || st.a <= 0.01) return;
          const p = this.proj(st.gx, st.gy);
          p.y += (a.dy || 0) * (this._w / DW);
          ctx.globalAlpha = st.a;
          if (a.kind === 'label') {
            const txt = a.countable ? (W.counts[a.id] != null ? String(W.counts[a.id]) : S.t(a.label, loc)) : S.t(a.label, loc);
            ctx.font = '700 ' + Math.max(10, (a.size || 14) * p.k) + 'px var(--font-mono, monospace)';
            ctx.fillStyle = a.color || PAL.ink50; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(txt, p.x, p.y);
          } else {
            const txt = S.t(a.label, loc);
            ctx.font = Math.max(9, 11.5 * p.k) + 'px var(--font-mono, monospace)';
            const tw2 = Math.max(a.w ? a.w * p.k : 0, ctx.measureText(txt).width + 18 + (a.color ? 16 : 0));
            const hh = 21 * Math.max(0.8, p.k);
            const sc = st.s || 1;
            ctx.save();
            ctx.translate(p.x, p.y); ctx.scale(sc, sc);
            ctx.beginPath();
            const rr = hh / 2;
            ctx.roundRect(-tw2 / 2, -hh / 2, tw2, hh, rr);
            ctx.fillStyle = a.fill || PAL.paperAlt; ctx.fill();
            ctx.strokeStyle = a.stroke || PAL.ruleStrong; ctx.lineWidth = 1.1; ctx.stroke();
            if (a.color) {                                          // platform-list colour key
              ctx.fillStyle = a.color;
              ctx.beginPath(); ctx.roundRect(-tw2 / 2 + 5, -hh / 2 + 5, 6, hh - 10, 2); ctx.fill();
            }
            ctx.fillStyle = a.text || PAL.ink70; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(txt, a.color ? 4 : 0, 0.5);
            ctx.restore();
          }
          ctx.globalAlpha = 1;
        });
        /* flow dots on top */
        (this._dots || []).forEach(d => {
          if (d.a <= 0.02) return;
          const p0 = this.anchorOf(d.from), p1 = this.anchorOf(d.to);
          if (!p0 || !p1) return;
          const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 - 46 * p0.k };
          const u = d.t, v = 1 - u;
          const x = v * v * p0.x + 2 * v * u * mid.x + u * u * p1.x;
          const y = v * v * p0.y + 2 * v * u * mid.y + u * u * p1.y;
          ctx.globalAlpha = d.a;
          ctx.beginPath(); ctx.arc(x, y, d.r * p0.k, 0, 7);
          ctx.fillStyle = d.color; ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke();
          ctx.globalAlpha = 1;
        });
      },
      drawMarks(ctx, a, st, p, wp, hp) {
        const k = p.k, m = st.marks || {};
        const topX = p.x + wp * 0.3, topY = p.y - hp * 0.92;
        if (m.lock > 0.02) {
          ctx.globalAlpha = st.a * m.lock;
          ctx.fillStyle = PAL.ink70;
          ctx.beginPath(); ctx.roundRect(topX - 7 * k, topY, 14 * k, 11 * k, 2.5 * k); ctx.fill();
          ctx.strokeStyle = PAL.ink70; ctx.lineWidth = 2 * k;
          ctx.beginPath(); ctx.arc(topX, topY, 4.5 * k, Math.PI, 0); ctx.stroke();
          ctx.globalAlpha = st.a;
        }
        if (m.shield > 0.02) {
          ctx.globalAlpha = st.a * m.shield;
          ctx.fillStyle = PAL.green; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4 * k;
          ctx.beginPath();
          ctx.moveTo(topX, topY - 2 * k); ctx.lineTo(topX + 7 * k, topY + 1 * k); ctx.lineTo(topX + 7 * k, topY + 6 * k);
          ctx.quadraticCurveTo(topX + 7 * k, topY + 12 * k, topX, topY + 15 * k);
          ctx.quadraticCurveTo(topX - 7 * k, topY + 12 * k, topX - 7 * k, topY + 6 * k);
          ctx.lineTo(topX - 7 * k, topY + 1 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8 * k;
          ctx.beginPath(); ctx.moveTo(topX - 3 * k, topY + 6 * k); ctx.lineTo(topX - 0.5 * k, topY + 8.5 * k); ctx.lineTo(topX + 3.5 * k, topY + 3.5 * k); ctx.stroke();
          ctx.globalAlpha = st.a;
        }
        if (m.port > 0.02) {
          ctx.globalAlpha = st.a * m.port;
          ctx.beginPath(); ctx.arc(p.x, p.y + 2 * k, 6 * k, 0, 7);
          ctx.fillStyle = PAL.green; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * k; ctx.stroke();
          ctx.beginPath(); ctx.arc(p.x, p.y + 2 * k, 2 * k, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
          ctx.globalAlpha = st.a;
        }
        if (m.badge > 0.02) {
          ctx.globalAlpha = st.a * m.badge;
          const bx = p.x - 11 * k, by = p.y - hp - 18 * k;
          ctx.fillStyle = PAL.ink; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4 * k;
          ctx.beginPath(); ctx.roundRect(bx, by, 22 * k, 14 * k, 3 * k); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(bx + 5.5 * k, by + 7 * k, 2.2 * k, 0, 7); ctx.fill();
          ctx.fillRect(bx + 9.5 * k, by + 4 * k, 8 * k, 2 * k);
          ctx.fillRect(bx + 9.5 * k, by + 8 * k, 6 * k, 2 * k);
          ctx.globalAlpha = st.a;
        }
        if (m.bubble > 0.02) {
          ctx.globalAlpha = st.a * m.bubble;
          const bw = 56 * k, bh = 26 * k, bx = p.x + 8 * k, by = p.y - hp - bh - 10 * k;
          ctx.fillStyle = '#fff'; ctx.strokeStyle = PAL.ruleStrong; ctx.lineWidth = 1.3 * k;
          ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8 * k); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx + 12 * k, by + bh); ctx.lineTo(bx + 6 * k, by + bh + 9 * k); ctx.lineTo(bx + 22 * k, by + bh); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = PAL.rule; ctx.lineWidth = 2.6 * k;
          ctx.beginPath(); ctx.moveTo(bx + 9 * k, by + 9 * k); ctx.lineTo(bx + bw - 12 * k, by + 9 * k); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx + 9 * k, by + 17 * k); ctx.lineTo(bx + bw - 22 * k, by + 17 * k); ctx.stroke();
          ctx.globalAlpha = st.a;
        }
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
            h('span', { class: 'sim-spacer' }),
            h('button', { class: 'sim-btn sim-primary', onClick: () => this.toggle(), disabled: !this.ready }, this.playing ? this.L.pause : (this.progress >= 0.999 && this.ch === this.chapters.length - 1 ? this.L.replay : this.L.play)),
            h('button', { class: 'sim-btn', onClick: () => this.toggleFs() }, this.fs ? this.L.close : this.L.expand),
          ]),
          h('div', { class: 'sim-stage' }, [
            h('canvas', { ref: 'canvas', style: 'display:block;width:100%;', role: 'img', 'aria-label': this.narration }),
            !this.animated ? h('div', { class: 'sim-static-note' }, this.L.staticNote) : null,
            h('div', { class: 'sim-caption', 'aria-live': 'polite' }, this.currentCaption),
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

  if (window.VWVisuals) window.VWVisuals.registerBespoke('sim', 'iso', 'sim-iso');
})();
