/* sim:tapestry — the woven chronicle engine (owner: sim).

   Embed in a paper with:
       chart: { kind: "sim:tapestry", sim: "gov3-tap" }

   The fourth telling: the story as one continuous embroidered tapestry in
   the Bayeux tradition, eight gpt-image-2 panels stitched into a single
   cloth. The camera travels along the fabric as the narration plays; each
   panel weaves itself into existence, thread column by thread column, as its
   chapter begins. Two interactions belong to this engine alone:

   - THE LENS. Move the pointer over the cloth and a magnifying glass
     reveals the engineer's underdrawing beneath the embroidery — a second,
     composition-matched image generated as an edit of each panel. Art
     above, engineering beneath.
   - THE MARGINALIA. Gold medallions sit in the margins of each panel;
     opening one unfolds a parchment annotation with a line from the
     collection and a link to the paper it came from.

   No GSAP: every visual state is derived from (chapter, progress, clock),
   so any seek renders exactly its frame. Same chapters, narration, captions,
   transcript, and audio clock as the other engines (audioSim shares gov3's
   recordings). Under prefers-reduced-motion the weave is instant and the
   ambient motes and shimmer are off; the lens and marginalia remain. */

(function () {
  const S = window.VWSim;
  if (!S) return;
  const h = S.h;
  const PW = 1536, PH = 1024, GUT = 70;     // panel size + woven seam gutter

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['sim-tapestry'] = {
    props: {
      kind: { type: String, default: '' },
      sim: { type: String, default: '' },
      start: { type: Number, default: 0 },
    },
    data() {
      return { dataset: null, error: null, ch: this.start || 0, playing: false, fs: false, showNarr: false, showCaps: false,
               progress: 0, chDur: 30, audioOk: true, ready: false, motion: !S.prefersReducedMotion,
               note: null };       // open marginalia { x, y (canvas px), text, paper }
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
              hint: 'passez la loupe sur l’étoffe · ouvrez les médaillons dorés', read: 'Lire le livre blanc →' }
          : { play: 'Play', pause: 'Pause', replay: 'Replay', expand: 'Expand', close: 'Close', transcript: 'Transcript', hide: 'Hide transcript', caps: 'Captions',
              hint: 'hold the lens over the cloth · open the gold medallions', read: 'Read the paper →' };
      },
    },
    watch: {
      loc() { this.stopAll(); this.note = null; this.$nextTick(() => this.primeChapter()); },
      ch() { this.note = null; this.preload(); this.$nextTick(() => this.primeChapter()); },
      fs() { this.$nextTick(() => this.fitCanvas()); },
    },
    created() {
      S.loadData(this.sim).then(d => {
        this.dataset = d;
        this._imgs = {};
        this.preload();
        this.$nextTick(() => { this.fitCanvas(); this.primeChapter(); });
      }).catch(e => { this.error = 'Simulation "' + this.sim + '" failed to load: ' + e.message; });
    },
    mounted() {
      this._tick = () => this.syncTick();
      this._iv = setInterval(this._tick, 80);
      this._motes = Array.from({ length: 42 }, (_, i) => ({
        x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.7,
        vx: 0.004 + Math.random() * 0.01, vy: -0.002 - Math.random() * 0.006, p: Math.random() * 7,
      }));
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
      if (this._iv) clearInterval(this._iv);
      if (this._rafId) cancelAnimationFrame(this._rafId);
      window.removeEventListener('resize', this._onResize);
      if (this._esc) window.removeEventListener('keydown', this._esc);
    },
    methods: {
      /* ---------- assets ---------- */
      img(key) {
        if (!this._imgs[key]) {
          const im = new Image();
          im.src = 'public/images/sims/' + this.dataset.id + '/' + key + '.jpg';
          this._imgs[key] = im;
        }
        return this._imgs[key];
      },
      preload() {
        if (!this.dataset) return;
        for (let i = Math.max(0, this.ch - 1); i <= Math.min(this.chapters.length - 1, this.ch + 1); i++) {
          this.img(this.chapters[i].panel);
          this.img(this.chapters[i].under);
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
          this.progress = Math.min(1, this.progress + 0.08 / this.chDur * (80 / 80) * 0.08 * 12.5);
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

      /* ---------- canvas ---------- */
      fitCanvas() {
        const cv = this.$refs.canvas; if (!cv) return;
        const rect = cv.parentElement.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = Math.max(320, rect.width);
        const hh = this.fs ? rect.height : w * 9 / 16;
        cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr);
        cv.style.height = hh + 'px';
        this._dpr = dpr; this._w = w; this._h = hh;
      },
      /* linen ground, generated once */
      linen() {
        if (this._linen) return this._linen;
        const cv = document.createElement('canvas');
        cv.width = 256; cv.height = 256;
        const c = cv.getContext('2d');
        c.fillStyle = '#efe7d4'; c.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 256; i += 3) {
          c.strokeStyle = 'rgba(190,178,150,' + (0.05 + (i % 9 === 0 ? 0.06 : 0)) + ')';
          c.beginPath(); c.moveTo(0, i); c.lineTo(256, i); c.stroke();
          c.strokeStyle = 'rgba(205,195,170,0.05)';
          c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 256); c.stroke();
        }
        this._linen = cv;
        return cv;
      },
      /* camera: world-x of the view centre, derived purely from (ch, progress) */
      camera() {
        const stripX = i => i * (PW + GUT);
        const centre = i => stripX(i) + PW / 2;
        const p = this.progress;
        const travel = 0.085;                                 // first 8.5% of a chapter arrives from the previous panel
        let cx;
        if (this.ch > 0 && p < travel) {
          const k = 0.5 - 0.5 * Math.cos((p / travel) * Math.PI);   // ease in-out
          cx = centre(this.ch - 1) + (centre(this.ch) - centre(this.ch - 1)) * k;
        } else {
          const k = Math.max(0, (p - travel) / (1 - travel));
          cx = centre(this.ch) + Math.sin(k * Math.PI) * PW * 0.045;   // gentle drift within the panel
        }
        const zoom = 1.10 - 0.05 * Math.max(0, (p - travel) / (1 - travel));   // slow Ken Burns out
        return { cx, zoom };
      },
      worldTransform() {
        const { cx, zoom } = this.camera();
        const s = (this._h / PH) * zoom;
        return { s, ox: this._w / 2 - cx * s, oy: (this._h - PH * s) / 2 };
      },
      reveal(i) {
        if (i < this.ch) return 1;
        if (i > this.ch) return 0;
        if (!this.motion) return 1;
        const secs = this.progress * this.chDur;
        return Math.max(0, Math.min(1, secs / 3.2));
      },
      draw() {
        const cv = this.$refs.canvas, sim = this.dataset;
        if (!cv || !sim || !this._w) return;
        const ctx = cv.getContext('2d');
        const dpr = this._dpr || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const W = this._w, H = this._h;
        const now = performance.now() / 1000;
        const { s, ox, oy } = this.worldTransform();

        /* the linen ground (covers the full stage) */
        const pat = ctx.createPattern(this.linen(), 'repeat');
        ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(120,100,60,0.05)'; ctx.fillRect(0, 0, W, 14);
        ctx.fillRect(0, H - 14, W, 14);

        /* panels with the weave reveal */
        this.chapters.forEach((c, i) => {
          const px = i * (PW + GUT);
          const sx = px * s + ox;
          if (sx > W + 60 || sx + PW * s < -60) return;
          const im = this.img(c.panel);
          const rev = this.reveal(i);
          if (im.complete && im.naturalWidth && rev > 0) {
            const COLS = 26;
            const colW = PW / COLS;
            const full = Math.floor(rev * COLS);
            ctx.save();
            ctx.beginPath();
            ctx.rect(sx, oy, full * colW * s, PH * s);
            ctx.clip();
            ctx.drawImage(im, sx, oy, PW * s, PH * s);
            ctx.restore();
            const fpart = rev * COLS - full;
            if (fpart > 0 && full < COLS) {                    // the column being woven right now
              ctx.save();
              ctx.globalAlpha = fpart;
              ctx.beginPath();
              ctx.rect(sx + full * colW * s, oy, colW * s, PH * s);
              ctx.clip();
              ctx.drawImage(im, sx, oy, PW * s, PH * s);
              ctx.restore();
              ctx.globalAlpha = 1;
              if (this.motion) {                               // the working thread
                ctx.strokeStyle = 'rgba(178,63,21,0.65)';
                ctx.lineWidth = 1.4;
                const tx = sx + (full + fpart) * colW * s;
                ctx.beginPath(); ctx.moveTo(tx, oy); ctx.lineTo(tx, oy + PH * s); ctx.stroke();
              }
            }
          }
          /* stitched seam after each panel */
          const seamX = sx + PW * s + (GUT / 2) * s;
          ctx.strokeStyle = 'rgba(122,106,74,0.5)';
          ctx.lineWidth = Math.max(1, 2 * s);
          ctx.setLineDash([7 * s, 6 * s]);
          ctx.beginPath(); ctx.moveTo(seamX, oy + 8 * s); ctx.lineTo(seamX, oy + (PH - 8) * s); ctx.stroke();
          ctx.setLineDash([]);
          /* marginalia medallions (only on woven cloth) */
          if (rev > 0.95) {
            (c.marginalia || []).forEach((m, mi) => {
              const mx = sx + m.u * PW * s, my = oy + m.v * PH * s;
              const pul = this.motion ? 1 + 0.06 * Math.sin(now * 2.4 + mi * 2) : 1;
              const r = 13 * Math.max(0.7, s / (H / PH)) * pul;
              const open = this.note && this.note.key === i + ':' + mi;
              ctx.beginPath(); ctx.arc(mx, my, r, 0, 7);
              ctx.fillStyle = open ? '#B23F15' : '#caa748'; ctx.fill();
              ctx.lineWidth = 2; ctx.strokeStyle = '#7a6432'; ctx.stroke();
              ctx.beginPath(); ctx.arc(mx, my, r * 0.62, 0, 7);
              ctx.strokeStyle = 'rgba(255,250,235,0.85)'; ctx.lineWidth = 1.2; ctx.stroke();
              ctx.fillStyle = '#fffaf0';
              ctx.font = '700 ' + Math.round(r * 1.05) + 'px serif';
              ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText('✦', mx, my + 0.5);
              m._sx = mx; m._sy = my; m._sr = r * 1.6;        // hit area, canvas px
            });
          }
        });

        /* gold dust motes */
        if (this.motion) {
          this._motes.forEach(mt => {
            mt.x += mt.vx / 60; mt.y += mt.vy / 60;
            if (mt.x > 1.02) mt.x = -0.02;
            if (mt.y < -0.02) mt.y = 1.02;
            ctx.beginPath();
            ctx.arc(mt.x * W, mt.y * H, mt.r, 0, 7);
            ctx.fillStyle = 'rgba(202,167,72,' + (0.10 + 0.12 * Math.abs(Math.sin(now + mt.p))) + ')';
            ctx.fill();
          });
          /* a slow shimmer travelling across the cloth */
          const shx = ((now * 26) % (W + 600)) - 300;
          const gr = ctx.createLinearGradient(shx - 130, 0, shx + 130, H);
          gr.addColorStop(0, 'rgba(255,252,240,0)');
          gr.addColorStop(0.5, 'rgba(255,252,240,0.05)');
          gr.addColorStop(1, 'rgba(255,252,240,0)');
          ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
        }

        /* THE LENS: the engineering beneath the embroidery */
        const pt = this._pointer;
        if (pt && pt.inside) {
          const R = Math.min(96, W * 0.14), MAG = 1.45;
          ctx.save();
          ctx.beginPath(); ctx.arc(pt.x, pt.y, R, 0, 7); ctx.clip();
          ctx.fillStyle = '#f4ecd8'; ctx.fillRect(pt.x - R, pt.y - R, R * 2, R * 2);
          this.chapters.forEach((c, i) => {
            if (this.reveal(i) <= 0) return;
            const un = this.img(c.under);
            if (!un.complete || !un.naturalWidth) return;
            const px = i * (PW + GUT);
            /* magnify around the pointer: scale world by MAG anchored at the lens centre */
            const sx = (px * s + ox - pt.x) * MAG + pt.x;
            ctx.drawImage(un, sx, (oy - pt.y) * MAG + pt.y, PW * s * MAG, PH * s * MAG);
          });
          ctx.restore();
          ctx.beginPath(); ctx.arc(pt.x, pt.y, R, 0, 7);
          ctx.lineWidth = 5; ctx.strokeStyle = '#caa748'; ctx.stroke();
          ctx.beginPath(); ctx.arc(pt.x, pt.y, R + 4.5, 0, 7);
          ctx.lineWidth = 1.6; ctx.strokeStyle = '#7a6432'; ctx.stroke();
          const ha = Math.PI * 0.78;                          // the handle
          ctx.beginPath();
          ctx.moveTo(pt.x + Math.cos(ha) * (R + 5), pt.y + Math.sin(ha) * (R + 5));
          ctx.lineTo(pt.x + Math.cos(ha) * (R + 34), pt.y + Math.sin(ha) * (R + 34));
          ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.strokeStyle = '#7a6432'; ctx.stroke();
        }
      },

      /* ---------- pointer: lens + marginalia ---------- */
      onMove(e) {
        const cv = this.$refs.canvas; if (!cv) return;
        const r = cv.getBoundingClientRect();
        this._pointer = { x: e.clientX - r.left, y: e.clientY - r.top, inside: true };
      },
      onLeave() { if (this._pointer) this._pointer.inside = false; },
      onClick(e) {
        const cv = this.$refs.canvas; if (!cv || !this.dataset) return;
        const r = cv.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        for (let i = 0; i < this.chapters.length; i++) {
          for (let mi = 0; mi < (this.chapters[i].marginalia || []).length; mi++) {
            const m = this.chapters[i].marginalia[mi];
            if (m._sx == null) continue;
            if (Math.hypot(x - m._sx, y - m._sy) <= (m._sr || 20)) {
              const key = i + ':' + mi;
              if (this.note && this.note.key === key) { this.note = null; return; }
              this.note = {
                key,
                x: Math.min(Math.max(12, m._sx - 130), this._w - 272),
                y: Math.min(Math.max(12, m._sy + 18), this._h - 150),
                text: S.t(m.note, this.loc),
                paper: m.paper || null,
              };
              return;
            }
          }
        }
        this.note = null;
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

      const note = this.note ? h('div', { class: 'simtap-note', style: 'left:' + this.note.x + 'px;top:' + this.note.y + 'px;' }, [
        h('button', { class: 'simtap-x', onClick: () => { this.note = null; }, 'aria-label': this.L.close }, '×'),
        h('p', {}, this.note.text),
        this.note.paper ? h('a', { href: '/paper/' + this.note.paper }, this.L.read) : null,
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
            h('canvas', {
              ref: 'canvas', style: 'display:block;width:100%;cursor:none;', role: 'img', 'aria-label': this.narration,
              onPointermove: this.onMove, onPointerleave: this.onLeave, onClick: this.onClick,
            }),
            h('div', { class: 'sim3-hint' }, this.L.hint),
            h('div', { class: 'sim-caption', 'aria-live': 'polite' }, this.showCaps ? this.currentCaption : ''),
            note,
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

  if (!document.getElementById('simtap-styles')) {
    const css = `
      .simtap-note { position: absolute; width: 260px; z-index: 6; padding: 13px 15px 11px;
        background: linear-gradient(175deg, #fbf6e7, #f2e9d0); border: 1px solid #cdb98a; border-radius: 3px;
        box-shadow: 0 10px 30px rgba(80,60,20,0.25), inset 0 0 24px rgba(180,150,80,0.12);
        font-family: var(--font-serif, Georgia, serif); }
      .simtap-note p { margin: 0 0 8px; font-size: 13px; line-height: 1.55; color: #4a3c22; font-style: italic; }
      .simtap-note a { font-size: 11.5px; color: #7a3414; font-family: var(--font-mono); text-decoration: underline; text-underline-offset: 2px; }
      .simtap-x { position: absolute; top: 4px; right: 7px; border: none; background: none; font-size: 16px; cursor: pointer; color: #7a6432; }
    `;
    const style = document.createElement('style');
    style.id = 'simtap-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  if (window.VWVisuals) window.VWVisuals.registerBespoke('sim', 'tapestry', 'sim-tapestry');
})();
