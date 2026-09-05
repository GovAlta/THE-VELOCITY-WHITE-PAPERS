/* sim:foundry — the rationalization, drawn as a LIVING ARCHITECTURE DIAGRAM (owner: sim).

   Embed:  chart: { kind: "sim:foundry", sim: "rationalize" }

   Not particle art. A ledger-true representation of a real ministry rebuild: 185 legacy
   applications, drawn as readable boxes, each packed with its REAL components rendered as
   type-distinct glyphs — 3,830 screens · 4,067 APIs · 2,241 data entities · 580 workflows
   · 2,693 integrations · 2,702 modules = 16,113 components, every one on screen. Agents
   execute the real pipeline (the six schema passes -> dossier -> 28 capabilities ->
   16 build-specs, then the build cadence) with named human gates; components flow along
   the real 185 -> 28 capabilities -> 16 services + 4 shared platforms join (no modulo),
   consolidating asymmetrically, and the preservation audit (94.8%, 45 named losses) is
   shown honestly. Canvas 2D: legible, fast, bloom-free. The player chassis (audio clock,
   deterministic seek, chapters, captions, i18n) is unchanged. */

(function () {
  const S = window.VWSim;
  if (!S) return;
  const h = S.h;

  /* ---------- component types: distinct colour + glyph (legend maps both) ---------- */
  const TYPES = [
    { key: 'screens', label: 'Screens', fr: 'Écrans', col: '#4aa3ff', glyph: 'screen' },
    { key: 'apis', label: 'APIs', fr: 'API', col: '#37d39b', glyph: 'api' },
    { key: 'entities', label: 'Data entities', fr: 'Entités', col: '#f6b73c', glyph: 'entity' },
    { key: 'workflows', label: 'Workflows', fr: 'Flux', col: '#b08bf6', glyph: 'workflow' },
    { key: 'integrations', label: 'Integrations', fr: 'Intégrations', col: '#28cde6', glyph: 'integration' },
    { key: 'modules', label: 'Modules', fr: 'Modules', col: '#9aa7bd', glyph: 'module' },
  ];
  /* anonymized target-service + capability-domain labels, French */
  const FR_SVC = {
    'Reporting & Analytics': 'Rapports et analytique', 'Grants & Capital Programs': 'Subventions et immobilisations',
    'Incident & Event Reporting': 'Signalement d’incidents', 'Mobile Field Inspection': 'Inspection mobile',
    'Document & Content Management': 'Gestion documentaire et de contenu', 'Applicant Eligibility Review': 'Examen de l’admissibilité',
    'Environmental & Safety Oversight': 'Surveillance environnement et sécurité', 'Data Integration (ETL)': 'Intégration des données (ETL)',
    'Payments & Financial Processing': 'Paiements et traitement financier', 'Maintenance & Work Management': 'Entretien et gestion des travaux',
    'Investigations & Compliance': 'Enquêtes et conformité', 'Regulated-Entity Safety': 'Sécurité des entités réglementées',
    'Permits & Licensing': 'Permis et licences', 'Geospatial Asset Registry': 'Registre géospatial des actifs',
    'Regulatory Case Management': 'Gestion des dossiers réglementaires', 'Capital Asset Inventory': 'Inventaire des immobilisations',
  };
  const FR_DOM = {
    'Platform & DevOps': 'Plateforme et DevOps', 'Public Safety & Incidents': 'Sécurité publique et incidents', 'Geospatial': 'Géospatial',
    'Permits & Licensing': 'Permis et licences', 'Regulated Operators': 'Exploitants réglementés', 'Field Survey': 'Relevés terrain',
    'Asset Management': 'Gestion des actifs', 'Identity & Access': 'Identité et accès', 'Data Integration': 'Intégration des données',
    'Entity Registration': 'Inscription des entités', 'Payments & Finance': 'Paiements et finances', 'Applicant Licensing': 'Délivrance aux demandeurs',
    'Capital Infrastructure': 'Infrastructure d’immobilisations', 'Maintenance & Works': 'Entretien et travaux', 'Applicant Eligibility': 'Admissibilité des demandeurs',
    'Analytics & Reporting': 'Analytique et rapports', 'Environment & Safety': 'Environnement et sécurité', 'Investigations & Compliance': 'Enquêtes et conformité',
    'Applicant Records': 'Dossiers des demandeurs', 'Land & Assets': 'Terres et actifs', 'Safety Regulation': 'Réglementation de la sécurité', 'Document & Content': 'Documents et contenu',
    'Grants & Programs': 'Subventions et programmes',
  };
  const frLabel = (s, map) => { if (!s) return s; const [base, ...rest] = String(s).split(' · '); const t = map[base] || base; return rest.length ? t + ' · ' + (FR_SVC[rest.join(' · ')] || rest.join(' · ')) : t; };
  const TI = {}; TYPES.forEach((t, i) => TI[t.key] = i);
  const PLAT = [
    { id: 'identity', label: 'Identity & Access', fr: 'Identité et accès', note: '9 sign-ons → 1', frNote: '9 authentifications → 1' },
    { id: 'integration', label: 'Integration Fabric', fr: 'Trame d’intégration', note: '2,693 links → hub', frNote: '2 693 liens → concentrateur' },
    { id: 'observability', label: 'Observability & CI/CD', fr: 'Observabilité et CI/CD', note: '133 repos → 1 pipeline', frNote: '133 dépôts → 1 pipeline' },
    { id: 'geospatial', label: 'Geospatial Platform', fr: 'Plateforme géospatiale', note: '13 GIS stacks → 1', frNote: '13 piles SIG → 1' },
  ];
  const PI = {}; PLAT.forEach((p, i) => PI[p.id] = i);

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const ez = u => { u = clamp01(u); return u * u * (3 - 2 * u); };
  const lerp = (a, b, t) => a + (b - a) * t;
  function mulberry(seed) { let a = seed >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function healthCol(hv) { const u = clamp01((hv == null ? 3 : hv) / 8); const r = Math.round(lerp(214, 70, u)), g = Math.round(lerp(70, 200, u)), b = Math.round(lerp(60, 120, u)); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
  /* fixed, well-separated categorical palette per technology family (no hashing → no collisions) */
  const TECH_COL = {
    'Java EE': '#f28e2b', '.NET': '#4e79a7', '.NET WebForms': '#8c6bb1', 'PL/SQL / Oracle': '#e15759',
    'MS Access / VBA': '#edc948', 'JavaScript / Node': '#59a14f', 'Oracle Forms / Reports': '#9c6b3f',
    'IBM DataStage (ETL)': '#46c7d6', 'Cognos / BI': '#e377c2', 'Python': '#bcbd22',
    'ColdFusion': '#8f8cff', 'Other / Mixed': '#9aa7bd',
  };
  const TECH_SHORT = {
    'Java EE': 'Java EE', '.NET': '.NET', '.NET WebForms': '.NET WebForms', 'PL/SQL / Oracle': 'PL/SQL',
    'MS Access / VBA': 'Access/VBA', 'JavaScript / Node': 'JS / Node', 'Oracle Forms / Reports': 'Oracle Forms',
    'IBM DataStage (ETL)': 'DataStage', 'Cognos / BI': 'Cognos', 'Python': 'Python', 'ColdFusion': 'ColdFusion', 'Other / Mixed': 'Other',
  };
  const FALLBACK_TECH = ['#f28e2b', '#4e79a7', '#8c6bb1', '#e15759', '#edc948', '#59a14f', '#9c6b3f', '#46c7d6', '#e377c2', '#bcbd22', '#8f8cff', '#9aa7bd'];
  function familyCol(fam) { if (TECH_COL[fam]) return TECH_COL[fam]; let h = 0; const s = String(fam || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return FALLBACK_TECH[h % FALLBACK_TECH.length]; }

  /* virtual canvas space (16:9) */
  const VW = 1600, VH = 900;

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['sim-foundry'] = {
    props: { kind: { type: String, default: '' }, sim: { type: String, default: '' }, start: { type: Number, default: 0 } },
    data() { return { dataset: null, error: null, ch: this.start || 0, playing: false, fs: false, showNarr: false, showCaps: true, progress: 0, chDur: 30, audioOk: true, ready: false, colorMode: 'type', motion: !S.prefersReducedMotion, selApp: -1 }; },
    computed: {
      loc() { return (window.VWStore && window.VWStore.locale) || 'en'; },
      chapters() { return (this.dataset && this.dataset.chapters) || []; },
      chapter() { return this.chapters[this.ch] || null; },
      captions() { return ((this.chapter && this.chapter.steps) || []).filter(s => s.do === 'caption').map(s => ({ t: s.t, text: s.text })).sort((a, b) => a.t - b.t); },
      currentCaption() { let cur = ''; for (const c of this.captions) { if (c.t <= this.progress + 1e-6) cur = S.t(c.text, this.loc); else break; } return cur; },
      narration() { return this.chapter ? S.t(this.chapter.narration, this.loc) : ''; },
      audioSrc() { const aud = this.dataset.audioSim || this.dataset.id; return this.chapter ? 'public/audio/' + this.loc + '/sims/' + aud + '/' + this.chapter.id + '.mp3' : ''; },
      timeLabel() { return S.fmtTime(this.progress * this.chDur) + ' / ' + S.fmtTime(this.chDur); },
      modeBtns() { return [['type', this.loc === 'fr' ? 'Type' : 'Type'], ['health', this.loc === 'fr' ? 'Santé' : 'Health'], ['family', this.loc === 'fr' ? 'Technologie' : 'Technology']]; },
      L() { return this.loc === 'fr' ? { play: 'Lecture', pause: 'Pause', replay: 'Rejouer', expand: 'Plein écran', close: 'Fermer', transcript: 'Transcription', hide: 'Masquer', caps: 'Sous-titres' } : { play: 'Play', pause: 'Pause', replay: 'Replay', expand: 'Expand', close: 'Close', transcript: 'Transcript', hide: 'Hide', caps: 'Captions' }; },
    },
    watch: { loc() { this.stopAll(); this.$nextTick(() => this.primeChapter()); }, ch() { this.$nextTick(() => this.primeChapter()); }, fs() { this.$nextTick(() => this.fitCanvas()); setTimeout(() => this.fitCanvas(), 70); setTimeout(() => this.fitCanvas(), 240); } },
    created() { S.loadData(this.sim).then(d => { this.dataset = d; this.$nextTick(() => this.boot()); }).catch(e => { this.error = 'Simulation "' + this.sim + '" failed to load: ' + e.message; }); },
    mounted() { this._tick = () => this.syncTick(); this._iv = setInterval(this._tick, 80); if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { window.__simPlayers = window.__simPlayers || []; window.__simPlayers.push(this); } this._onResize = () => this.fitCanvas(); window.addEventListener('resize', this._onResize); },
    beforeUnmount() { this.stopAll(); if (this._iv) clearInterval(this._iv); if (this._raf) cancelAnimationFrame(this._raf); window.removeEventListener('resize', this._onResize); if (this._esc) window.removeEventListener('keydown', this._esc); },
    methods: {
      boot() { try { this.buildModel(); this._view = { z: 1, px: 0, py: 0 }; this.fitCanvas(); this.primeChapter(); this.startLoop(); this.bindCanvas(); } catch (e) { console.error('[foundry]', e); this.error = 'render error: ' + e.message; } },
      /* virtual point under a client event, through the letterbox + pan/zoom view */
      eventToVirtual(e) { const cv = this.$refs.cv, v = this._view, s = this._scale; const r = cv.getBoundingClientRect(); const dx = (e.clientX - r.left) * (cv.width / r.width), dy = (e.clientY - r.top) * (cv.height / r.height); return { dx, dy, vx: (dx - (this._ox || 0) - v.px) / (s * v.z), vy: (dy - (this._oy || 0) - v.py) / (s * v.z) }; },
      bindCanvas() {
        const cv = this.$refs.cv; if (!cv) return; cv.style.cursor = 'grab'; cv.style.touchAction = 'none';
        let down = null, dragged = false;
        cv.addEventListener('wheel', (e) => {
          e.preventDefault(); const v = this._view, s = this._scale, ox = this._ox || 0, oy = this._oy || 0;
          const { dx, dy } = this.eventToVirtual(e); const vx = (dx - ox - v.px) / (s * v.z), vy = (dy - oy - v.py) / (s * v.z);
          const nz = clamp(v.z * (e.deltaY < 0 ? 1.18 : 1 / 1.18), 1, 14);
          v.px = dx - ox - s * nz * vx; v.py = dy - oy - s * nz * vy; v.z = nz; if (nz <= 1.001) { v.z = 1; v.px = 0; v.py = 0; }
        }, { passive: false });
        cv.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, px: this._view.px, py: this._view.py }; dragged = false; cv.style.cursor = 'grabbing'; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
        cv.addEventListener('pointermove', (e) => { if (!down) return; const r = cv.getBoundingClientRect(); const ddx = (e.clientX - down.x), ddy = (e.clientY - down.y); if (Math.abs(ddx) + Math.abs(ddy) > 4) dragged = true; this._view.px = down.px + ddx * (cv.width / r.width); this._view.py = down.py + ddy * (cv.height / r.height); });
        cv.addEventListener('pointerup', (e) => { cv.style.cursor = 'grab'; if (down && !dragged) this.tapAt(e); down = null; });
        cv.addEventListener('pointerleave', () => { down = null; cv.style.cursor = 'grab'; });
        cv.addEventListener('dblclick', () => { this._view = { z: 1, px: 0, py: 0 }; });
      },
      tapAt(e) { const M = this._M; if (!M) return; const { vx, vy } = this.eventToVirtual(e); let hit = -1; for (const a of M.apps) { if (vx >= a.x && vx <= a.x + a.w && vy >= a.y && vy <= a.y + a.h) { hit = a.i; break; } } if (hit >= 0) { this.selApp = hit; this.pause(); } else if (this.selApp >= 0) { this.selApp = -1; } },

      /* ---------------- model: lay out the whole diagram from real data ---------------- */
      buildModel() {
        const pf = this.dataset.portfolio, led = this.dataset.ledger;
        const M = this._M = {};
        M.metrics = pf.metrics;
        M.typeTotals = this.dataset.componentTotals || {};
        M.techFamilies = (pf.techFamilies || []).slice().sort((a, b) => (b.count || 0) - (a.count || 0));
        /* service label -> card index */
        M.services = pf.services.map((s, i) => ({ i, label: s.label, sourceCount: s.sourceCount || 0, screens: s.screens || 0, apis: s.apis || 0, entities: s.entities || 0 }));
        const svcIdx = {}; M.services.forEach(s => svcIdx[s.label] = s.i);
        /* layout regions (virtual) */
        const EST = { x: 26, y: 96, w: 560, h: 760 };   // estate
        const CAP = { x: 620, y: 96, w: 250, h: 760 };  // capability halos
        const TGT = { x: 904, y: 96, w: 670, h: 560 };  // service cards
        const PLT = { x: 904, y: 686, w: 670, h: 168 }; // platforms
        M.regions = { EST, CAP, TGT, PLT };

        /* service cards: 4x4 grid */
        const SCOLS = 4, SROWS = 4, scw = TGT.w / SCOLS, sch = TGT.h / SROWS;
        M.services.forEach(s => { const c = s.i % SCOLS, r = (s.i / SCOLS) | 0; s.x = TGT.x + c * scw + 6; s.y = TGT.y + r * sch + 6; s.w = scw - 12; s.h = sch - 12; s.cx = s.x + s.w / 2; s.cy = s.y + s.h / 2; });
        /* platforms: 4 bars */
        M.platforms = PLAT.map((p, i) => { const w = PLT.w / 4; return { ...p, i, x: PLT.x + i * w + 6, y: PLT.y + 10, w: w - 12, h: PLT.h - 20, cx: PLT.x + i * w + w / 2, cy: PLT.y + PLT.h / 2 }; });

        /* capability halos: 2 columns x 14 */
        M.caps = (led && led.capabilities ? led.capabilities : []).map((c, i) => {
          const col = i % 2, row = (i / 2) | 0; const cw = CAP.w / 2;
          return { id: c.id, label: c.label, target: c.target, targetKind: c.targetKind, count: c.count, x: CAP.x + col * cw + cw / 2, y: CAP.y + 26 + row * (CAP.h - 30) / 14, };
        });
        const capById = {}; M.caps.forEach(c => capById[c.id] = c);
        M.capById = capById;
        const appToCap = (led && led.appToCapability) || {};

        /* apps: grid of boxes; each packed with its real component instances */
        const ACOLS = 15, AROWS = Math.ceil(pf.apps.length / ACOLS);
        const gx = EST.w / ACOLS, gy = EST.h / AROWS;
        M.apps = []; const comps = []; let cidx = 0;
        const maxLoc = Math.max(...pf.apps.map(a => a.loc || 1));
        pf.apps.forEach((a, i) => {
          const col = i % ACOLS, row = (i / ACOLS) | 0;
          const bx = EST.x + col * gx + 2, by = EST.y + row * gy + 2, bw = gx - 4, bh = gy - 4;
          const hdr = 7, inX = bx + 1.5, inY = by + hdr, inW = bw - 3, inH = bh - hdr - 1.5;
          const svc = a.svc && svcIdx[a.svc] != null ? svcIdx[a.svc] : -1;
          const plat = (svc < 0 && a.platform) ? PI[a.platform] : -1;
          const cap = capById[appToCap[a.id]] || null;
          const app = { i, id: a.id, x: bx, y: by, w: bw, h: bh, inX, inY, inW, inH, h10: a.h, fam: a.fam, tech: a.t, ci: a.ci, svc, plat, pii: a.pii, loc: a.loc || 1, scl: Math.cbrt((a.loc || 1) / maxLoc), cidx0: cidx, counts: TYPES.map(ty => a[ty.key] || 0), capLabel: cap ? cap.label : null };
          /* component instances for this app, all six types */
          const counts = TYPES.map(t => a[t.key] || 0);
          const total = counts.reduce((x, y) => x + y, 0) || 1;
          let cols = Math.max(1, Math.round(Math.sqrt(total * inW / Math.max(1, inH))));
          let cs = Math.max(1.4, Math.min(4.4, inW / cols)); cols = Math.max(1, Math.floor(inW / cs));
          let rows = Math.ceil(total / cols); if (rows * cs > inH) cs = Math.max(1.2, inH / rows);
          /* target slot helpers */
          const tgtCard = svc >= 0 ? M.services[svc] : null;
          const tgtPlat = plat >= 0 ? M.platforms[plat] : null;
          let k = 0;
          for (let ti = 0; ti < 6; ti++) {
            for (let n = 0; n < counts[ti]; n++) {
              const cc = k % cols, cr = (k / cols) | 0;
              const hx = inX + cc * cs + cs / 2, hy = inY + cr * cs + cs / 2;
              const rnd = mulberry((i * 131 + cidx + 7) >>> 0);
              /* target position: inside the service card (or platform bar) */
              let tx, ty;
              if (tgtCard) { tx = tgtCard.x + 6 + rnd() * (tgtCard.w - 12); ty = tgtCard.y + 16 + rnd() * (tgtCard.h - 22); }
              else if (tgtPlat) { tx = tgtPlat.x + 6 + rnd() * (tgtPlat.w - 12); ty = tgtPlat.y + 6 + rnd() * (tgtPlat.h - 12); }
              else { tx = hx; ty = hy; }
              const cpx = cap ? cap.x + (rnd() - 0.5) * 26 : (CAP.x + CAP.w / 2), cpy = cap ? cap.y + (rnd() - 0.5) * 12 : CAP.y + CAP.h / 2;
              comps.push({ a: i, t: ti, hx, hy, cpx, cpy, tx, ty, stag: rnd(), lost: 0 });
              cidx++; k++;
            }
          }
          app.cidxN = cidx - app.cidx0;
          M.apps.push(app);
        });
        /* COMPACTION: legacy components converge on their destination and DISSOLVE there
           (consolidation). They do NOT tile 1:1 into the target. The clean, rebuilt
           deliverables are a separate, much smaller set (the real build-spec counts) that
           crystallises in — 16,113 legacy components → ~1,300 clean, gov-owned modules. */
        const destOf = (a) => a.svc >= 0 ? M.services[a.svc] : (a.plat >= 0 ? M.platforms[a.plat] : null);
        const inflow = {};
        comps.forEach((c) => { const a = M.apps[c.a]; const card = destOf(a); if (!card) { c.tx = c.hx; c.ty = c.hy; return; } const rnd = mulberry((c.a * 131 + c.t * 7 + 3) >>> 0); c.tx = card.cx + (rnd() - 0.5) * card.w * 0.66; c.ty = card.cy + (rnd() - 0.5) * card.h * 0.66; const key = a.svc >= 0 ? ('s' + a.svc) : ('p' + a.plat); inflow[key] = (inflow[key] || 0) + 1; });
        /* clean rebuilt deliverables per service, from the real target build-spec counts */
        M.clean = [];
        for (const s of M.services) {
          const ns = s.screens || 0, na = s.apis || 0, ne = s.entities || 0;
          const n = Math.max(6, ns + na + ne);
          s.cleanCount = n; s.inflow = inflow['s' + s.i] || 0;
          const ix = s.x + 5, iy = s.y + 20, iw = s.w - 10, ih = s.h - 30;
          let ccols = Math.max(1, Math.round(Math.sqrt(n * iw / Math.max(1, ih))));
          let cs = Math.max(2.0, Math.min(4.2, iw / ccols)); ccols = Math.max(1, Math.floor(iw / cs));
          let rows = Math.ceil(n / ccols); if (rows * cs > ih) cs = Math.max(1.5, ih / rows);
          for (let k = 0; k < n; k++) { const cc = k % ccols, cr = (k / ccols) | 0; const t = k < ns ? TI.screens : k < ns + na ? TI.apis : k < ns + na + ne ? TI.entities : TI.modules; M.clean.push({ svc: s.i, t, x: ix + cc * cs + cs / 2, y: iy + cr * cs + cs / 2, stag: k / n }); }
        }
        /* mark the 45 documented losses (deterministic spread across migrated comps) */
        const lossN = (M.metrics && M.metrics.losses) || 45; const lr = mulberry(99173);
        for (let q = 0; q < lossN; q++) { const idx = Math.floor(lr() * comps.length); if (comps[idx]) comps[idx].lost = 1; }
        /* sort components by type for batched fill */
        comps.sort((p, q) => p.t - q.t);
        M.comps = comps; M.total = comps.length;
        /* type ranges in the sorted array */
        M.typeRange = []; let s0 = 0; for (let ti = 0; ti < 6; ti++) { let e = s0; while (e < comps.length && comps[e].t === ti) e++; M.typeRange.push([s0, e]); s0 = e; }

        /* agents: a small named set, faded in only on their active chapters */
        M.agents = this.buildAgents();
      },
      buildAgents() {
        /* each agent is bound to a pipeline stage and a chapter; rendered only when active */
        const A = [];
        const mk = (label, role, chs, col) => A.push({ label, role, chs, col });
        mk('SELECTOR', 'scan', [1], '#7fd1ff'); mk('ARCHITECTURE', 'scan', [1], '#7fd1ff'); mk('SCREENS+FLOWS', 'scan', [1, 2], '#4aa3ff');
        mk('APIS', 'scan', [2], '#37d39b'); mk('DATA_MODEL', 'scan', [2], '#f6b73c'); mk('RULES', 'scan', [2], '#b08bf6'); mk('INTEGRATIONS', 'scan', [2], '#28cde6');
        mk('CONSOLIDATE', 'map', [3, 4], '#ffd166'); mk('CAPABILITY MAP', 'map', [3, 4], '#ffd166'); mk('TARGET ARCH', 'map', [4, 5], '#ffd166');
        mk('BUILD-SPEC', 'build', [5, 6], '#ff9a3c'); mk('SCHEMA → API', 'build', [6], '#ff9a3c'); mk('VUE 3 SPA', 'build', [6], '#ff9a3c');
        mk('RED · attack', 'review', [6], '#ff5d6c'); mk('BLUE · defend', 'review', [6], '#5db0ff'); mk('GREEN · test', 'review', [6], '#46d17f'); mk('YELLOW · count', 'review', [6], '#ffd54a');
        mk('VALIDATE', 'validate', [7], '#7ef0c8'); mk('PRESERVE', 'validate', [7], '#7ef0c8');
        return A;
      },

      /* ---------------- player chassis (unchanged behaviour) ---------------- */
      stopAll() { this.playing = false; const au = this.$refs.audio; if (au) { try { au.pause(); } catch (e) {} } },
      primeChapter() { if (!this.dataset || !this.chapter) return; this.stopAll(); this.progress = 0; this.ready = false; const au = this.$refs.audio; const fb = this.chapter.dur || 30; const done = (ok, dur) => { this.audioOk = ok; this.chDur = ok && isFinite(dur) && dur > 1 ? dur : fb; this.ready = true; if (this._autoplay) { this._autoplay = false; this.play(); } }; if (!au) { done(false, 0); return; } au.src = this.audioSrc; const onM = () => { cl(); done(true, au.duration); }; const onE = () => { cl(); done(false, 0); }; const cl = () => { au.removeEventListener('loadedmetadata', onM); au.removeEventListener('error', onE); }; au.addEventListener('loadedmetadata', onM); au.addEventListener('error', onE); au.load(); },
      syncTick() { if (!this.playing) return; const au = this.$refs.audio; if (this.audioOk && au) { this.progress = this.chDur ? Math.min(au.currentTime, this.chDur) / this.chDur : 0; if (au.ended) this.onEnded(); } else { this.progress = Math.min(1, this.progress + 0.0066); if (this.progress >= 1) this.onEnded(); } },
      play() { if (!this.ready) { this._autoplay = true; return; } if (this.progress >= 0.999) this.seekTo(0); this.playing = true; const au = this.$refs.audio; if (this.audioOk && au) au.play().catch(() => { this.audioOk = false; }); },
      pause() { this.playing = false; const au = this.$refs.audio; if (au) { try { au.pause(); } catch (e) {} } },
      toggle() { this.playing ? this.pause() : this.play(); },
      seekTo(frac) { const t = Math.max(0, Math.min(1, frac)) * this.chDur; const au = this.$refs.audio; if (this.audioOk && au) { try { au.currentTime = t; } catch (e) {} } this.progress = this.chDur ? t / this.chDur : 0; },
      onScrub(e) { this.seekTo(Number(e.target.value) / 1000); },
      onEnded() { this.pause(); this.progress = 1; if (this.ch < this.chapters.length - 1) { this._autoplay = true; this.ch++; } },
      go(i) { if (i === this.ch) { this.seekTo(0); return; } this.pause(); this.ch = i; },
      toggleFs() { this.fs = !this.fs; if (this.fs) { this._esc = (e) => { if (e.key === 'Escape') this.toggleFs(); }; window.addEventListener('keydown', this._esc); } else if (this._esc) { window.removeEventListener('keydown', this._esc); this._esc = null; } this.$nextTick(() => this.fitCanvas()); },
      fitCanvas() { const host = this.$refs.stage; const cv = this.$refs.cv; if (!host || !cv) return; const rect = host.getBoundingClientRect(); const w = Math.max(320, rect.width), hh = this.fs ? Math.max(240, rect.height) : w * 9 / 16, pr = Math.min(2, window.devicePixelRatio || 1); cv.style.width = w + 'px'; cv.style.height = hh + 'px'; cv.width = Math.floor(w * pr); cv.height = Math.floor(hh * pr); /* uniform-scale (contain) + letterbox so fullscreen never stretches */ const s = Math.min(cv.width / VW, cv.height / VH); this._scale = s; this._ox = (cv.width - VW * s) / 2; this._oy = (cv.height - VH * s) / 2; },
      startLoop() { let last = performance.now(); const loop = (now) => { const wall = now / 1000; this.draw(wall); this._raf = requestAnimationFrame(loop); }; this._raf = requestAnimationFrame(loop); },
      globalT() { return this.ch + clamp01(this.progress); },
      tx(en, fr) { return this.loc === 'fr' ? fr : en; },

      /* ---------------- the diagram ---------------- */
      draw(wall) {
        const cv = this.$refs.cv, M = this._M; if (!cv || !M) return; const ctx = cv.getContext('2d');
        const v = this._view || (this._view = { z: 1, px: 0, py: 0 });
        const bs = this._scale, ox = this._ox || 0, oy = this._oy || 0;
        /* fill the whole device canvas (incl. letterbox bars) with the base colour */
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#05080f'; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.imageSmoothingEnabled = true;
        /* DIAGRAM LAYER — uniform contain-scale + pan/zoom view */
        ctx.setTransform(bs * v.z, 0, 0, bs * v.z, ox + v.px, oy + v.py);
        ctx.fillStyle = '#070b16'; ctx.fillRect(0, 0, VW, VH);
        ctx.strokeStyle = 'rgba(90,120,180,0.06)'; ctx.lineWidth = 1 / v.z; ctx.beginPath(); for (let x = 0; x <= VW; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, VH); } for (let y = 0; y <= VH; y += 40) { ctx.moveTo(0, y); ctx.lineTo(VW, y); } ctx.stroke();
        const t = this.globalT(), mode = this.colorMode;
        this.drawEstate(ctx, t, mode);
        this.drawCaps(ctx, t);
        this.drawTargets(ctx, t);
        this.drawComponents(ctx, t, mode, wall);
        this.drawClean(ctx, t);
        this.drawAgents(ctx, t, wall);
        this.drawDedup(ctx, t);
        this.drawLineage(ctx, t);
        /* FIXED OVERLAYS — header, hero, drill-down, hint (screen-anchored, always readable) */
        ctx.setTransform(bs, 0, 0, bs, ox, oy);
        this.drawHeader(ctx, t);
        this.drawHero(ctx, t, wall);
        this.drawEstimate(ctx, t, wall);
        this.drawAppDetail(ctx);
        if (this.selApp < 0) { ctx.globalAlpha = v.z > 1.02 ? 0.85 : 0.55; ctx.fillStyle = '#9fb0d0'; ctx.font = '600 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'left'; const hz = this.loc === 'fr' ? ('zoom ' + v.z.toFixed(1) + '× · glisser pour déplacer · double-clic pour réinitialiser · cliquez un système') : ('zoom ' + v.z.toFixed(1) + '× · drag to pan · double-click to reset · click a system'); const hb = this.tx('scroll to zoom · drag to pan · click a system to expand it', 'molette pour zoomer · glisser pour déplacer · cliquez un système pour l’ouvrir'); ctx.fillText(v.z > 1.02 ? hz : hb, 24, VH - 10); ctx.globalAlpha = 1; }
      },
      /* click a system to pause and drill in: its old anatomy vs what it becomes rebuilt */
      drawAppDetail(ctx) {
        const M = this._M; if (this.selApp < 0 || !M) return; const a = M.apps[this.selApp];
        const PX = 270, PY = 116, PW = 1060, PH = 648, midX = PX + PW * 0.5;
        ctx.fillStyle = 'rgba(6,10,20,0.97)'; ctx.fillRect(PX, PY, PW, PH);
        ctx.strokeStyle = 'rgba(130,180,255,0.7)'; ctx.lineWidth = 1.4; ctx.strokeRect(PX + 0.5, PY + 0.5, PW - 1, PH - 1);
        ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        const total = a.counts.reduce((x, y) => x + y, 0);
        ctx.fillStyle = '#eaf1ff'; ctx.font = '700 20px "IBM Plex Mono", monospace';
        ctx.fillText(a.id + '  ·  ' + a.fam + '  ·  ' + a.loc.toLocaleString() + (this.loc === 'fr' ? ' lignes  ·  ' : ' lines  ·  ') + total + (this.loc === 'fr' ? ' composants' : ' components'), PX + 24, PY + 34);
        ctx.fillStyle = '#8ea3c8'; ctx.font = '600 11px "IBM Plex Mono", monospace';
        ctx.fillText((this.loc === 'fr' ? 'santé ' : 'health ') + (a.h10 == null ? 'n/a' : a.h10.toFixed(1)) + ' / 10' + (a.pii ? this.tx('  ·  holds personal information', '  ·  renseignements personnels') : '') + (a.ci ? '' : this.tx('  ·  no automated build', '  ·  aucune compilation automatisée')) + this.tx('        ·  click anywhere to close', '        ·  cliquez n’importe où pour fermer'), PX + 24, PY + 54);
        ctx.strokeStyle = 'rgba(120,150,210,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(midX, PY + 70); ctx.lineTo(midX, PY + PH - 20); ctx.stroke();
        /* TODAY */
        ctx.fillStyle = '#9fb0d0'; ctx.font = '700 12px "IBM Plex Mono", monospace'; ctx.fillText(this.tx('TODAY: what it is', 'AUJOURD’HUI : ce que c’est'), PX + 24, PY + 92);
        const maxC = Math.max(1, ...a.counts);
        TYPES.forEach((ty, k) => {
          const ry = PY + 124 + k * 31; this.glyph(ctx, ty.glyph, PX + 34, ry - 4, 4.2, ty.col);
          ctx.fillStyle = '#cdd9f2'; ctx.font = '600 12px "IBM Plex Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText(this.loc === 'fr' ? ty.fr : ty.label, PX + 50, ry);
          const bw = 120, bx = midX - 52 - bw; ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(bx, ry - 9, bw, 7); ctx.fillStyle = ty.col; ctx.fillRect(bx, ry - 9, bw * a.counts[k] / maxC, 7);
          ctx.fillStyle = '#e7eeff'; ctx.font = '700 12px "IBM Plex Mono", monospace'; ctx.textAlign = 'right'; ctx.fillText(String(a.counts[k]), midX - 26, ry); ctx.textAlign = 'left';
        });
        /* REBUILT */
        const rxx = midX + 24, innerW = PW * 0.5 - 48;
        ctx.fillStyle = '#9fd9bd'; ctx.font = '700 12px "IBM Plex Mono", monospace'; ctx.fillText(this.tx('REBUILT: what it becomes', 'RECONSTRUIT : ce que cela devient'), rxx, PY + 92);
        let yy = PY + 126;
        const svcL = a.svc >= 0 ? (this.loc === 'fr' ? (FR_SVC[M.services[a.svc].label] || M.services[a.svc].label) : M.services[a.svc].label) : '';
        const platL = a.plat >= 0 ? (this.loc === 'fr' ? (PLAT[a.plat].fr || PLAT[a.plat].label) : PLAT[a.plat].label) : '';
        const dest = a.svc >= 0 ? (this.tx('Service · ', 'Service · ') + svcL) : (a.plat >= 0 ? (this.tx('Shared platform · ', 'Plateforme partagée · ') + platL) : 'n/a');
        ctx.fillStyle = '#dce7ff'; ctx.font = '700 14px "IBM Plex Mono", monospace'; ctx.fillText('→ ' + this.fit(ctx, dest, innerW), rxx, yy); yy += 28;
        ctx.fillStyle = '#b9c6e2'; ctx.font = '600 12px "IBM Plex Mono", monospace'; ctx.fillText(this.tx('Capability · ', 'Capacité · ') + this.fit(ctx, this.loc === 'fr' ? frLabel(a.capLabel || 'n/a', FR_DOM) : (a.capLabel || 'n/a'), innerW - 90), rxx, yy); yy += 30;
        const note = a.plat >= 0
          ? (this.loc === 'fr'
            ? ('Ce système n’était pas un produit en soi. C’était une bibliothèque partagée, un pipeline ou un banc d’essai. Il se replie dans la plateforme ' + platL + ' et cesse d’être une chose distincte à construire, corriger et sécuriser.')
            : ('This system was never a product on its own. It was a shared library, pipeline, or test harness. It folds into the ' + PLAT[a.plat].label + ' platform and stops being a separate thing to build, patch, and secure.'))
          : (this.loc === 'fr'
            ? ('Ses ' + total + ' composants sont lus, rattachés à cette capacité et reconstruits au sein d’un seul service propre, à code source ouvert et appartenant au gouvernement. Les préoccupations dupliquées (authentification, téléversement, cartographie) sont construites une seule fois dans tout le parc, et non de nouveau ici. Ce qu’il fait est préservé; la façon dont il est construit est consolidée.')
            : ('Its ' + total + ' components are read, mapped to this capability, and rebuilt as part of one clean, open-source, government-owned service. Duplicated concerns (sign-on, file upload, mapping) are built once across the estate, not again here. What it does is preserved; how it is built is consolidated.'));
        ctx.fillStyle = '#9fb0d0'; ctx.font = '500 12px "IBM Plex Mono", monospace'; this.wrapText(ctx, note, rxx, yy, innerW, 18);
      },
      wrapText(ctx, text, x, y, maxW, lh) { const words = String(text).split(' '); let line = '', yy = y; for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = test; } if (line) ctx.fillText(line, x, yy); return yy; },
      /* ch5 "built once": duplicate implementations physically converge into one platform */
      drawDedup(ctx, t) {
        const M = this._M; if (Math.floor(t) !== 4) return; const on = ez(clamp01((t - 4) * 1.25));
        for (const pl of M.platforms) {
          const m = /^(\d+)/.exec(pl.note || ''); const n = m ? +m[1] : 8;
          ctx.strokeStyle = 'rgba(155,165,240,' + (0.3 * on) + ')'; ctx.lineWidth = 0.8;
          for (let k = 0; k < n; k++) { const a = M.apps[(pl.i * 37 + k * 13) % M.apps.length]; const sx = a.x + a.w / 2, sy = a.y + a.h / 2; const px = lerp(sx, pl.cx, on), py = lerp(sy, pl.cy, on); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(px, py); ctx.stroke(); }
          if (on > 0.3) { ctx.fillStyle = '#cbb8ff'; ctx.font = '700 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText((this.loc === 'fr' ? (pl.frNote || pl.note) : pl.note) || '', pl.cx, pl.y - 5); ctx.textAlign = 'left'; }
        }
      },
      /* hero service zoom (ch6): one fully-modelled service, named source->target rewrites,
         pipeline stage + human gates, honest preservation — the "pause any frame and name it" view */
      drawHero(ctx, t, wall) {
        const H = this.dataset.hero; if (!H || Math.floor(t) !== 5) return;
        const p = t - 5; const appear = ez(clamp01((p - 0.3) / 0.18)); if (appear <= 0.01) return;
        const PX = 150, PY = 110, PW = 1300, PH = 672;
        ctx.globalAlpha = appear; ctx.fillStyle = 'rgba(7,11,22,0.94)'; ctx.fillRect(PX, PY, PW, PH);
        ctx.strokeStyle = 'rgba(120,170,255,0.6)'; ctx.lineWidth = 1.2; ctx.strokeRect(PX + 0.5, PY + 0.5, PW - 1, PH - 1);
        ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        ctx.fillStyle = '#eaf1ff'; ctx.font = '700 19px "IBM Plex Mono", monospace';
        ctx.fillText(this.tx('REBUILD ON THE HARNESS · ', 'RECONSTRUCTION SUR LE HARNAIS · ') + H.service + (this.loc === 'fr' ? (' · 1 de ' + H.one_of + ' services') : (' · 1 of ' + H.one_of + ' services')), PX + 22, PY + 32);
        const e = H.estimates; ctx.fillStyle = '#8fd0b0'; ctx.font = '600 12px "IBM Plex Mono", monospace';
        ctx.fillText(this.loc === 'fr' ? (e.traditional_pm + ' → ' + e.ai_pm + ' personnes-mois · équipe de ' + e.team + ' · ' + e.months + ' mois · compression ' + e.compression) : (e.traditional_pm + ' → ' + e.ai_pm + ' person-months · team of ' + e.team + ' · ' + e.months + ' months · ' + e.compression + ' compression'), PX + 22, PY + 52);
        /* three-stage translation: legacy code (read) -> requirement (extracted) -> rebuilt module */
        const colY = PY + 86, rowH = 41, lx = PX + 24, mx = PX + 446, rx = PX + 838, gateX = PX + PW - 16;
        ctx.fillStyle = '#9fb0d0'; ctx.font = '700 10.5px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
        ctx.fillText(this.tx('LEGACY CODE  (read)', 'CODE HÉRITÉ  (lu)'), lx, colY - 8);
        ctx.fillText(this.tx('REQUIREMENT  (extracted)', 'EXIGENCE  (extraite)'), mx, colY - 8);
        ctx.fillText(this.tx('REBUILT MODULE  (generated)', 'MODULE RECONSTRUIT  (généré)'), rx, colY - 8);
        const rwProg = clamp01((p - 0.34) / 0.58); const done = Math.floor(rwProg * H.rewrites.length); const curF = (rwProg * H.rewrites.length) % 1;
        H.rewrites.forEach((rw, i) => {
          const ry = colY + 16 + i * rowH; const built = i < done, cur = i === done; const lit = built || cur;
          ctx.globalAlpha = appear * (lit ? 1 : 0.36); ctx.textAlign = 'left';
          ctx.fillStyle = built ? '#aeb9d2' : '#cfd9f0'; ctx.font = '600 11.5px "IBM Plex Mono", monospace';
          ctx.fillText(this.fit(ctx, rw.from, 392), lx, ry);
          this.heroArrow(ctx, mx - 52, ry - 4, mx - 10, built ? '#7ef0c8' : cur ? '#ffb454' : 'rgba(150,170,220,0.35)', cur && curF < 0.5, wall);
          ctx.fillStyle = cur ? '#ffd9a0' : '#7a8499'; ctx.font = '600 8px "IBM Plex Mono", monospace'; ctx.fillText(this.tx('read', 'lire'), mx - 50, ry - 9);
          ctx.fillStyle = built ? '#cfe3da' : cur ? '#ffffff' : '#9fb0d0'; ctx.font = '600 11px "IBM Plex Mono", monospace';
          ctx.fillText(this.fit(ctx, this.loc === 'fr' && rw.reqFr ? rw.reqFr : rw.req, 362), mx, ry);
          this.heroArrow(ctx, rx - 58, ry - 4, rx - 10, built ? '#7ef0c8' : cur ? '#ffb454' : 'rgba(150,170,220,0.35)', cur && curF >= 0.5, wall);
          ctx.fillStyle = built ? '#7ef0c8' : cur ? '#ffd9a0' : '#7a8499'; ctx.font = '700 8px "IBM Plex Mono", monospace'; ctx.fillText(this.fit(ctx, rw.stage, 50), rx - 58, ry - 9);
          ctx.fillStyle = built ? '#dff7ec' : cur ? '#ffffff' : '#9fb0d0'; ctx.font = '600 11.5px "IBM Plex Mono", monospace';
          ctx.fillText(this.fit(ctx, rw.to, gateX - rx - 96), rx, ry);
          ctx.textAlign = 'right';
          if (built) { ctx.fillStyle = '#7ef0c8'; ctx.font = '700 10px "IBM Plex Mono", monospace'; ctx.fillText('✓ ' + (H.gates[Math.min(i, H.gates.length - 1)] || 'gate'), gateX, ry); }
          else if (cur) { ctx.fillStyle = '#ffb454'; ctx.font = '700 9px "IBM Plex Mono", monospace'; ctx.fillText('agent · ' + Math.round(curF * 100) + '%', gateX, ry); }
          ctx.textAlign = 'left';
        });
        ctx.globalAlpha = appear;
        /* footer: target counts + preservation + gates */
        const fy = PY + PH - 92; ctx.strokeStyle = 'rgba(120,150,210,0.3)'; ctx.beginPath(); ctx.moveTo(PX + 20, fy); ctx.lineTo(PX + PW - 20, fy); ctx.stroke();
        const c = H.counts; ctx.fillStyle = '#cdd9f2'; ctx.font = '600 12px "IBM Plex Mono", monospace';
        ctx.fillText(this.loc === 'fr' ? ('CIBLE : ' + c.screens + ' écrans · ' + c.endpoints + ' API · ' + c.tables + ' tables · ' + c.rules + ' règles · ' + c.integrations + ' intégrations · ' + c.events + ' événements') : ('TARGET: ' + c.screens + ' screens · ' + c.endpoints + ' APIs · ' + c.tables + ' tables · ' + c.rules + ' rules · ' + c.integrations + ' integrations · ' + c.events + ' events'), PX + 24, fy + 22);
        const pr = H.preservation; ctx.fillStyle = '#8fd0b0'; ctx.font = '700 12px "IBM Plex Mono", monospace';
        ctx.fillText(pr.preserved + ' / ' + pr.total + this.tx(' capabilities preserved', ' capacités préservées'), PX + 24, fy + 44);
        ctx.fillStyle = '#ff9a9a'; ctx.font = '600 11px "IBM Plex Mono", monospace';
        ctx.fillText(this.tx('1 documented loss: ', '1 perte documentée : ') + this.fit(ctx, this.loc === 'fr' && pr.lossFr ? pr.lossFr : pr.loss, PW - 360), PX + 230, fy + 44);
        /* G-gate strip */
        let gx = PX + 24; ctx.font = '700 10px "IBM Plex Mono", monospace';
        const gdone = Math.floor(rwProg * H.gates.length);
        H.gates.forEach((g, i) => { const on = i <= gdone; ctx.fillStyle = on ? '#7ef0c8' : '#5a6478'; ctx.fillText((on ? '✓ ' : '○ ') + g, gx, fy + 66); gx += ctx.measureText('✓ ' + g).width + 16; });
        ctx.globalAlpha = 1;
      },
      drawHeader(ctx, t) {
        const M = this._M;
        const revealed = t < 1 ? Math.round(M.total * ez(clamp01(this.progress * 1.15))) : M.total;
        ctx.textBaseline = 'middle'; ctx.font = '700 18px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#e7eeff'; ctx.textAlign = 'left'; ctx.fillText('185 APPLICATIONS', 26, 30);
        ctx.fillStyle = '#9fb2d6'; ctx.font = '600 14px "IBM Plex Mono", monospace';
        ctx.fillText(revealed.toLocaleString() + (this.loc === 'fr' ? ' / 16 113 composants' : ' / 16,113 components'), 230, 30);
        /* legend — keyed to the active colour lens, so every colour on screen has a meaning */
        const mode = this.colorMode; let lx = 470; ctx.textBaseline = 'middle'; ctx.font = '600 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
        if (mode === 'health') {
          ctx.fillStyle = '#8ea3c8'; ctx.fillText(this.tx('Colour = health:', 'Couleur = santé :'), lx, 30); lx += this.loc === 'fr' ? 128 : 116;
          const gw = 150, gx = lx, grad = ctx.createLinearGradient(gx, 0, gx + gw, 0); grad.addColorStop(0, healthCol(0)); grad.addColorStop(0.5, healthCol(4)); grad.addColorStop(1, healthCol(8));
          ctx.fillStyle = grad; ctx.fillRect(gx, 24, gw, 12); ctx.fillStyle = '#cfd9f0'; ctx.fillText(this.tx('sick', 'faible'), gx, 14); ctx.textAlign = 'right'; ctx.fillText(this.tx('healthy', 'saine'), gx + gw, 14); ctx.textAlign = 'left';
          ctx.fillStyle = '#8ea3c8'; ctx.fillText(this.tx('avg ≈ 3 / 10', 'moy ≈ 3 / 10'), gx + gw + 18, 30);
        } else if (mode === 'family') {
          for (const f of M.techFamilies) { const c = familyCol(f.label), lab = (TECH_SHORT[f.label] || f.label) + ' ' + (f.count || 0); ctx.fillStyle = c; ctx.fillRect(lx, 25, 9, 9); ctx.fillStyle = '#c3d0ec'; ctx.fillText(lab, lx + 13, 30); lx += 13 + ctx.measureText(lab).width + 16; if (lx > 1576) break; }
        } else {
          for (const ty of TYPES) { const lab = (this.loc === 'fr' ? ty.fr : ty.label) + '  ' + (M.typeTotals[ty.key] || 0).toLocaleString(); this.glyph(ctx, ty.glyph, lx + 4, 30, 5, ty.col); ctx.fillStyle = '#c3d0ec'; ctx.fillText(lab, lx + 13, 30); lx += 13 + ctx.measureText(lab).width + 22; if (lx > 1576) break; }
        }
        ctx.textBaseline = 'middle';
        /* region titles */
        ctx.font = '700 12px "IBM Plex Mono", monospace'; ctx.fillStyle = '#8ea3c8'; ctx.textAlign = 'left';
        ctx.fillText(this.tx('THE ESTATE', 'LE PARC'), M.regions.EST.x, 78);
        ctx.fillText(this.tx('28 CAPABILITIES', '28 CAPACITÉS'), M.regions.CAP.x, 78);
        ctx.fillText(this.tx('16 SERVICES', '16 SERVICES'), M.regions.TGT.x, 78);
        ctx.textAlign = 'right'; ctx.fillText(this.tx('4 SHARED PLATFORMS', '4 PLATEFORMES PARTAGÉES'), M.regions.PLT.x + M.regions.PLT.w, 78);
      },
      drawEstate(ctx, t, mode) {
        const M = this._M; const scanned = clamp01((t - 1) / 1); // ch2 scan sweep
        for (const a of M.apps) {
          const present = t < 1 ? ez(clamp01(this.progress * 1.1 - a.i / M.apps.length * 0.15)) : 1;
          if (present <= 0.02) continue;
          ctx.globalAlpha = 0.5 + 0.5 * present;
          /* box frame */
          ctx.fillStyle = 'rgba(20,28,48,0.7)'; ctx.fillRect(a.x, a.y, a.w, a.h);
          let edge = 'rgba(90,120,180,0.35)';
          if (mode === 'health') edge = healthCol(a.h10);
          ctx.strokeStyle = edge; ctx.lineWidth = 0.7; ctx.strokeRect(a.x + 0.5, a.y + 0.5, a.w - 1, a.h - 1);
          /* header strip: health micro-bar + pii tick */
          ctx.fillStyle = healthCol(a.h10); ctx.fillRect(a.x + 1, a.y + 1, (a.w - 2) * clamp01((a.h10 == null ? 3 : a.h10) / 10), 2.4);
          if (a.pii) { ctx.fillStyle = '#ff6b6b'; ctx.fillRect(a.x + a.w - 4, a.y + 1, 3, 2.4); }
          /* ch2 disposition tag */
          const sc = clamp01((t - 1) * 1.4 - a.i / M.apps.length);
          if (t >= 1 && t < 3 && sc > 0.2) { ctx.fillStyle = 'rgba(120,230,170,' + (0.5 * sc) + ')'; ctx.fillRect(a.x + 1, a.y + a.h - 2.5, (a.w - 2) * sc, 1.6); }
        }
        ctx.globalAlpha = 1;
        /* ch2 scan line sweeping the estate */
        if (t >= 1 && t < 2.2) { const sx = M.regions.EST.x + M.regions.EST.w * clamp01(this.progress); ctx.strokeStyle = 'rgba(120,210,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx, M.regions.EST.y); ctx.lineTo(sx, M.regions.EST.y + M.regions.EST.h); ctx.stroke(); }
      },
      drawCaps(ctx, t) {
        const M = this._M; const on = clamp01((t - 2.5) / 1); if (on <= 0) return;
        ctx.textBaseline = 'middle'; ctx.font = '600 9px "IBM Plex Mono", monospace';
        for (const c of M.caps) {
          ctx.globalAlpha = on; ctx.fillStyle = 'rgba(40,60,110,0.5)'; ctx.strokeStyle = 'rgba(140,170,230,0.5)'; ctx.lineWidth = 0.7;
          const w = 112, hh = 16; ctx.fillRect(c.x - w / 2, c.y - hh / 2, w, hh); ctx.strokeRect(c.x - w / 2, c.y - hh / 2, w, hh);
          ctx.fillStyle = '#cdd9f2'; ctx.textAlign = 'left'; ctx.fillText((this.loc === 'fr' ? frLabel(c.label, FR_DOM) : c.label).slice(0, 22), c.x - w / 2 + 4, c.y);
        }
        ctx.globalAlpha = 1;
      },
      drawTargets(ctx, t) {
        const M = this._M; const on = clamp01((t - 4.5) / 1.2);
        ctx.textBaseline = 'alphabetic';
        for (const s of M.services) {
          const built = clamp01((t - 5) / 1.6);
          ctx.globalAlpha = on <= 0 ? 0.12 : 1;
          ctx.fillStyle = 'rgba(16,26,46,0.8)'; ctx.fillRect(s.x, s.y, s.w, s.h);
          ctx.strokeStyle = on > 0 ? 'rgba(120,180,255,0.55)' : 'rgba(80,110,170,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
          if (on > 0.05) {
            ctx.fillStyle = '#dce7ff'; ctx.font = '700 10px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
            ctx.fillText(this.fit(ctx, this.loc === 'fr' ? (FR_SVC[s.label] || s.label) : s.label, s.w - 10), s.x + 5, s.y + 13);
            ctx.fillStyle = '#8ea3c8'; ctx.font = '600 9px "IBM Plex Mono", monospace';
            ctx.fillText('← ' + s.sourceCount + (this.loc === 'fr' ? ' applis' : ' apps'), s.x + 5, s.y + s.h - 6);
            /* preservation bar */
            if (built > 0) { ctx.fillStyle = 'rgba(70,209,127,0.85)'; ctx.fillRect(s.x + 5, s.y + s.h - 12, (s.w - 10) * built * 0.948, 2.4); }
          }
        }
        /* platforms */
        const pon = clamp01((t - 4) / 1);
        for (const p of M.platforms) {
          ctx.globalAlpha = pon <= 0 ? 0.1 : 1;
          ctx.fillStyle = 'rgba(34,40,70,0.85)'; ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.strokeStyle = pon > 0 ? 'rgba(150,140,230,0.6)' : 'rgba(90,90,140,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
          if (pon > 0.05) { ctx.fillStyle = '#e3def7'; ctx.font = '700 10px "IBM Plex Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText(this.fit(ctx, this.loc === 'fr' ? (p.fr || p.label) : p.label, p.w - 10), p.x + 5, p.y + 14); ctx.fillStyle = '#a99fd0'; ctx.font = '600 8.5px "IBM Plex Mono", monospace'; ctx.fillText(this.loc === 'fr' ? (p.frNote || p.note) : p.note, p.x + 5, p.y + 27); }
        }
        /* compaction summary: 16,113 legacy → the much smaller clean, gov-owned set */
        if (t > 4.8 && M.clean) { ctx.globalAlpha = clamp01((t - 4.8) / 1); ctx.fillStyle = '#8fe0bb'; ctx.font = '700 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; const tg = M.regions.TGT; const cl = M.clean.length.toLocaleString(); ctx.fillText(this.loc === 'fr' ? ('16 113 composants hérités  →  ' + cl + ' modules propres · à code ouvert · publics') : ('16,113 legacy components  →  ' + cl + ' clean · open-source · government-owned modules'), tg.x + tg.w / 2, tg.y - 4); ctx.textAlign = 'left'; }
        ctx.globalAlpha = 1;
      },
      drawComponents(ctx, t, mode, wall) {
        const M = this._M;
        for (let ti = 0; ti < 6; ti++) {
          const [s0, e0] = M.typeRange[ti]; const tcol = TYPES[ti].col, glyph = TYPES[ti].glyph;
          for (let q = s0; q < e0; q++) {
            const c = M.comps[q]; const a = M.apps[c.a];
            const present = t < 1 ? ez(clamp01(this.progress * 1.1 - a.i / M.apps.length * 0.15 - c.t * 0.02)) : 1;
            if (present <= 0.03) continue;
            const sMap = ez(clamp01((t - 3 - c.stag * 0.6) / 1.6));
            const sBuild = ez(clamp01((t - 5 - c.stag * 0.5) / 1.0));
            const ax = lerp(c.hx, c.cpx, sMap), ay = lerp(c.hy, c.cpy, sMap);
            const px = lerp(ax, c.tx, sBuild), py = lerp(ay, c.ty, sBuild);
            /* consolidation: legacy components DISSOLVE as they reach the target (not 1:1) */
            const dissolve = c.lost ? clamp01((sBuild - 0.2) / 0.55) : clamp01((sBuild - 0.55) / 0.45);
            const alpha = present * (1 - dissolve);
            if (alpha <= 0.03) continue;
            /* colour by the active lens */
            let col = tcol;
            if (mode === 'health') col = healthCol(a.h10);
            else if (mode === 'family') col = a._fc || (a._fc = familyCol(a.fam));
            ctx.globalAlpha = alpha * (0.62 + 0.38 * present);
            this.glyph(ctx, glyph, px, py, 2.1 * (1 - 0.45 * dissolve), c.lost ? '#6a7488' : col);
          }
        }
        ctx.globalAlpha = 1;
      },
      /* the clean, compacted, gov-owned deliverables that the rebuild produces */
      drawClean(ctx, t) {
        const M = this._M; if (t < 5 || !M.clean) return;
        for (const cl of M.clean) {
          const built = clamp01((t - 5 - cl.stag * 0.4) / 1.0); if (built <= 0.02) continue;
          ctx.globalAlpha = built; this.glyph(ctx, TYPES[cl.t].glyph, cl.x, cl.y, 2.5, TYPES[cl.t].col);
        }
        ctx.globalAlpha = 1;
      },
      drawAgents(ctx, t, wall) {
        const M = this._M; const ch = Math.floor(t); const fp = t - ch;
        const active = M.agents.filter(a => a.chs.includes(ch));
        if (!active.length) return;
        ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = '700 9px "IBM Plex Mono", monospace';
        active.forEach((ag, k) => {
          const n = active.length; let x, y, tx, ty, ring = null;
          if (ag.role === 'scan') { const ai = Math.floor((((fp * 0.9) + k / n) % 1) * (M.apps.length - 1)); const a = M.apps[ai]; x = a.x + a.w / 2; y = a.y + a.h / 2; tx = x; ty = y; ring = a; }
          else if (ag.role === 'map') { const c = M.caps[k % M.caps.length]; const a = M.apps[(k * 17) % M.apps.length]; const ph = ez(((fp + k * 0.11) % 1)); x = lerp(a.x + a.w, c.x - 58, ph); y = lerp(a.y + a.h / 2, c.y, ph); tx = c.x - 58; ty = c.y; }
          else if (ag.role === 'build' || ag.role === 'review') { const s = M.services[k % M.services.length]; const ang = wall * 0.8 + k; x = s.cx + Math.cos(ang) * (s.w * 0.46); y = s.cy + Math.sin(ang) * (s.h * 0.42); tx = s.cx; ty = s.cy; }
          else { const s = M.services[Math.floor(fp * (M.services.length - 1))]; x = s.cx; y = s.cy; const a = M.apps[Math.floor((1 - fp) * (M.apps.length - 1))]; tx = a.x + a.w; ty = a.y + a.h / 2; }
          if (ring) { ctx.strokeStyle = ag.col; ctx.globalAlpha = 0.9; ctx.lineWidth = 1.3; ctx.strokeRect(ring.x - 1, ring.y - 1, ring.w + 2, ring.h + 2); ctx.globalAlpha = 1; }
          ctx.strokeStyle = ag.col; ctx.globalAlpha = 0.4; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.globalAlpha = 1;
          ctx.fillStyle = ag.col; ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.283); ctx.fill();
          const lw = ctx.measureText(ag.label).width + 8; const lxx = (x + 9 + lw > VW - 4) ? x - 9 - lw : x + 8;
          ctx.fillStyle = 'rgba(8,12,22,0.8)'; ctx.fillRect(lxx, y - 7, lw, 14); ctx.fillStyle = ag.col; ctx.fillText(ag.label, lxx + 4, y);
        });
        /* G-gates on services during build */
        if (ch === 6) { ctx.font = '700 8px "IBM Plex Mono", monospace'; const gate = fp > 0.6; for (const s of M.services) { ctx.fillStyle = gate ? '#7ef0c8' : '#7a8499'; ctx.textAlign = 'right'; ctx.fillText(gate ? this.tx('✓ G4 ARCHITECT', '✓ G4 ARCHITECTE') : 'G0…', s.x + s.w - 5, s.y + 24); } ctx.textAlign = 'left'; }
      },
      drawLineage(ctx, t) {
        if (t < 6.5) return; const M = this._M; const on = clamp01((t - 6.5) / 1);
        ctx.strokeStyle = 'rgba(120,230,180,0.18)'; ctx.lineWidth = 0.5; ctx.globalAlpha = on;
        for (let i = 0; i < M.apps.length; i += 2) { const a = M.apps[i]; const s = a.svc >= 0 ? M.services[a.svc] : (a.plat >= 0 ? M.platforms[a.plat] : null); if (!s) continue; ctx.beginPath(); ctx.moveTo(s.x, s.cy); ctx.lineTo(a.x + a.w, a.y + a.h / 2); ctx.stroke(); }
        ctx.globalAlpha = 1;
        const m = M.metrics || {}; ctx.fillStyle = '#cfe'; ctx.font = '700 13px "IBM Plex Mono", monospace'; ctx.textAlign = 'center';
        ctx.fillText(this.loc === 'fr' ? ((m.preserved || 814) + ' de ' + (m.capabilities || 859) + ' capacités préservées · ' + String(m.preserved_pct || 94.8).replace('.', ',') + ' %') : ((m.preserved || 814) + ' of ' + (m.capabilities || 859) + ' preserved · ' + (m.preserved_pct || 94.8) + '%'), VW / 2, VH - 16);
        ctx.fillStyle = '#ff8b8b'; ctx.font = '600 11px "IBM Plex Mono", monospace'; ctx.fillText((m.losses || 45) + this.tx(' documented losses · each a recorded decision', ' pertes documentées · chacune une décision consignée'), VW / 2, VH - 2);
      },

      /* ch8: a dynamic estimate — the heavy traditional effort compressing into the AI-enabled one */
      drawEstimate(ctx, t, wall) {
        if (Math.floor(t) !== 7) return; const p = t - 7; const M = this._M, m = M.metrics || {};
        const appear = ez(clamp01(p / 0.1)); if (appear <= 0.01) return;
        const PX = 348, PY = 176, PW = 904, PH = 420, cx = PX + PW / 2;
        ctx.globalAlpha = appear; ctx.fillStyle = 'rgba(7,11,22,0.94)'; ctx.fillRect(PX, PY, PW, PH);
        ctx.strokeStyle = 'rgba(120,170,255,0.55)'; ctx.lineWidth = 1.2; ctx.strokeRect(PX + 0.5, PY + 0.5, PW - 1, PH - 1);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        const fr = this.loc === 'fr';
        ctx.fillStyle = '#eaf1ff'; ctx.font = '700 19px "IBM Plex Mono", monospace'; ctx.fillText(fr ? 'L’ESTIMATION : le même programme, deux façons' : 'THE ESTIMATE: the same programme, two ways', PX + 26, PY + 36);
        const trad = 1726, ai = m.person_months_ai || 286, barX = PX + 44, barFull = PW - 320;
        const tFill = ez(clamp01((p - 0.05) / 0.32)), aFill = ez(clamp01((p - 0.4) / 0.3)), aiW = barFull * ai / trad;
        const y1 = PY + 92, y2 = PY + 168;
        ctx.fillStyle = '#cda0a0'; ctx.font = '600 12px "IBM Plex Mono", monospace'; ctx.fillText(fr ? 'LIVRAISON TRADITIONNELLE' : 'TRADITIONAL DELIVERY', barX, y1 - 12);
        ctx.fillStyle = 'rgba(225,87,89,0.16)'; ctx.fillRect(barX, y1, barFull, 30); ctx.fillStyle = 'rgba(225,87,89,0.85)'; ctx.fillRect(barX, y1, barFull * tFill, 30);
        ctx.fillStyle = '#ffe2e2'; ctx.font = '700 14px "IBM Plex Mono", monospace'; ctx.fillText(Math.round(trad * tFill).toLocaleString() + (fr ? ' personnes-mois' : ' person-months'), barX + 12, y1 + 20);
        ctx.fillStyle = '#e6b0b0'; ctx.font = '600 12px "IBM Plex Mono", monospace'; ctx.fillText(fr ? '5 à 8 ans · ≈ 53 M$ CA' : '5 to 8 years · ≈ CAD $53M', barX + barFull + 14, y1 + 20);
        ctx.fillStyle = '#8fd0b0'; ctx.font = '600 12px "IBM Plex Mono", monospace'; ctx.fillText(fr ? 'CETTE APPROCHE · ASSISTÉE PAR L’IA' : 'THIS APPROACH · AI-ENABLED', barX, y2 - 12);
        ctx.fillStyle = 'rgba(70,209,127,0.16)'; ctx.fillRect(barX, y2, aiW, 30); ctx.fillStyle = 'rgba(70,209,127,0.92)'; ctx.fillRect(barX, y2, aiW * aFill, 30);
        ctx.fillStyle = '#dfffee'; ctx.font = '700 14px "IBM Plex Mono", monospace'; ctx.fillText(Math.round(ai * aFill).toLocaleString() + (fr ? ' p.-m.' : ' PM'), barX + 8, y2 + 20);
        ctx.fillStyle = '#9fe0bd'; ctx.font = '600 12px "IBM Plex Mono", monospace'; ctx.fillText(fr ? '14 mois · ≈ 11,5 M$ CA' : '14 months · ≈ CAD $11.5M', barX + aiW + 14, y2 + 20);
        if (aFill > 0.15) { ctx.globalAlpha = appear * clamp01((p - 0.4) / 0.18); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(barX + aiW + 3, y1 + 30); ctx.lineTo(barX + aiW + 3, y2); ctx.stroke(); ctx.fillStyle = '#ffd166'; ctx.font = '700 13px "IBM Plex Mono", monospace'; ctx.fillText(fr ? '6 : 1 effort · 4,8× coût' : '6 : 1 effort · 4.8× cost', barX + aiW + 13, (y1 + y2) / 2 + 18); ctx.globalAlpha = appear; }
        const save = 41.7 * ez(clamp01((p - 0.5) / 0.32)), pulse = 1 + 0.02 * Math.sin((wall || 0) * 3);
        ctx.save(); ctx.translate(cx, PY + 268); ctx.scale(pulse, pulse); ctx.fillStyle = '#8fe0bb'; ctx.font = '700 32px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText(fr ? (save.toFixed(1).replace('.', ',') + ' M$ CA économisés') : ('CAD $' + save.toFixed(1) + 'M saved'), 0, 0); ctx.restore();
        ctx.textAlign = 'center'; ctx.fillStyle = '#bcc8e2'; ctx.font = '600 13px "IBM Plex Mono", monospace'; ctx.fillText(fr ? '185 applications  →  16 services + 4 plateformes partagées' : '185 applications  →  16 services + 4 shared platforms', cx, PY + 312);
        ctx.fillStyle = '#7e8aa0'; ctx.font = '500 11.5px "IBM Plex Mono", monospace'; ctx.fillText(fr ? 'Une répétition, exécutée en minutes pour estimer l’effort et trouver les risques avant qu’un seul système de production ne soit touché.' : 'A rehearsal, run in minutes to estimate the effort and find the risks before a single production system is touched.', cx, PY + 340);
        ctx.textAlign = 'left'; ctx.globalAlpha = 1;
      },
      /* draw a small type glyph */
      glyph(ctx, kind, x, y, r, col) {
        ctx.fillStyle = col;
        if (kind === 'screen') { ctx.fillRect(x - r, y - r * 0.7, r * 2, r * 1.4); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - r, y - r * 0.7, r * 2, r * 0.4); }
        else if (kind === 'api') { ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, 6.283); ctx.fill(); }
        else if (kind === 'entity') { ctx.fillRect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - r * 0.85, y - r * 0.2, r * 1.7, r * 0.4); }
        else if (kind === 'workflow') { ctx.fillRect(x - r, y - r * 0.35, r * 2, r * 0.7); }
        else if (kind === 'integration') { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill(); }
        else { ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.strokeRect(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6); }
      },
      heroArrow(ctx, x0, y, x1, col, pulse, wall) {
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - 4, y - 2.6); ctx.lineTo(x1 - 4, y + 2.6); ctx.closePath(); ctx.fill();
        if (pulse) { const f = ((wall || 0) * 1.7) % 1; ctx.beginPath(); ctx.arc(x0 + (x1 - x0) * f, y, 2.1, 0, 6.283); ctx.fill(); }
      },
      fit(ctx, s, w) { if (ctx.measureText(s).width <= w) return s; let r = s; while (r.length > 4 && ctx.measureText(r + '…').width > w) r = r.slice(0, -1); return r + '…'; },
    },
    render() {
      const sim = this.dataset;
      if (this.error) return h('div', { class: 'sim-fig' }, [h('div', { style: 'padding:24px;color:var(--highlight);font-size:12px;' }, this.error)]);
      if (!sim) return h('div', { class: 'sim-fig' }, [h('div', { style: 'padding:28px;text-align:center;color:var(--ink-50);font-size:12px;' }, 'Loading simulation…')]);
      const loc = this.loc;
      const chips = this.chapters.map((c, i) => h('button', { class: ['sim-chip', i === this.ch ? 'active' : '', i < this.ch ? 'done' : ''], onClick: () => this.go(i) }, (i + 1) + ' · ' + S.t(c.title, loc)));
      const modeChips = this.modeBtns.map(([k, lab]) => h('button', { class: ['sim-chip', this.colorMode === k ? 'active' : ''], onClick: () => { this.colorMode = k; } }, lab));
      return h('div', { class: 'sim-fig' }, [
        h('div', { class: ['sim-frame', this.fs ? 'sim-fs' : ''] }, [
          h('div', { class: 'sim-bar' }, [
            h('h3', { class: 'sim-title' }, S.t(sim.title, loc)),
            h('div', { class: 'sim-actions' }, [
              h('button', { class: 'sim-btn sim-primary', onClick: () => this.toggle(), disabled: !this.ready }, this.playing ? this.L.pause : (this.progress >= 0.999 && this.ch === this.chapters.length - 1 ? this.L.replay : this.L.play)),
              h('button', { class: ['sim-btn', this.showCaps ? 'on' : ''], onClick: () => { this.showCaps = !this.showCaps; } }, this.L.caps),
              h('button', { class: 'sim-btn', onClick: () => this.toggleFs() }, this.fs ? this.L.close : this.L.expand),
            ]),
          ]),
          h('div', { class: 'sim-stage', ref: 'stage', style: 'background:#070b16;' }, [
            h('canvas', { ref: 'cv', style: 'display:block;width:100%;' }),
            h('div', { class: 'fdry-modes' }, [h('span', { class: 'fdry-modelab' }, this.loc === 'fr' ? 'Couleur :' : 'Colour:'), ...modeChips]),
            h('div', { class: 'sim-caption', 'aria-live': 'polite' }, this.showCaps ? this.currentCaption : ''),
          ]),
          h('div', { class: 'sim-transport' }, [h('input', { class: 'sim-scrub', type: 'range', min: 0, max: 1000, value: Math.round(this.progress * 1000), onInput: this.onScrub, 'aria-label': 'Timeline' }), h('span', { class: 'sim-time' }, this.timeLabel)]),
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

  if (!document.getElementById('sim-foundry-styles')) { const css = `.fdry-modes{position:absolute;left:10px;top:10px;display:flex;gap:5px;align-items:center;flex-wrap:wrap;}.fdry-modelab{font-size:9.5px;letter-spacing:0.04em;text-transform:uppercase;color:#9aa3c0;font-family:var(--font-mono);}.fdry-modes .sim-chip{background:rgba(6,10,24,0.62);color:#b9c3e0;border-color:rgba(150,170,220,0.3);}.fdry-modes .sim-chip.active{background:var(--accent);color:#fff;border-color:var(--accent);}.sim-frame.sim-fs .sim-meta{display:none;}.sim-frame.sim-fs .sim-stage canvas{height:100%!important;}`; const st = document.createElement('style'); st.id = 'sim-foundry-styles'; st.textContent = css; document.head.appendChild(st); }
  if (window.VWVisuals) window.VWVisuals.registerBespoke('sim', 'foundry', 'sim-foundry');
})();
