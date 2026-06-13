/* sim:lumen — Government 3.0 as a cathedral of light (owner: sim).

   Embed in a paper with:
       chart: { kind: "sim:lumen", sim: "gov3-lumen" }

   The sixth telling, and the one that leans hardest on Three.js itself. The
   estate is a field of dark, opaque MONOLITHS on a black reflecting floor.
   Augmentation transmutes the stone: each system CRYSTALLISES from rock into a
   faceted gem light can pass through — opacity becoming observability, made
   literal. Agents are motes of green light; delegated identity is a golden
   ring; the audit ledger inscribes itself in a glass slab; the rules core
   ignites at the centre; and a golden wave heals the system's own friction.

   Rendering is hand-rolled because the engines load Three's CORE module only
   from the CDN (no bundler, no import map — the postprocessing/controls addons
   bare-import 'three' and cannot resolve). So the signature look is built from
   core primitives:
     - a multi-pass BLOOM + ACES tonemap + vignette pipeline (WebGLRenderTarget
       + fullscreen-quad ShaderMaterial, HDR half-float targets);
     - a custom CRYSTAL GLSL material that morphs opaque stone -> fresnel glass;
     - a planar REFLECTION floor (the scene re-rendered from a mirrored camera
       into a target, sampled in screen space);
     - raycast interaction: click a crystal to pause and learn what it is.

   Determinism contract (shared with the sibling engines): the scene state is a
   pure function of (chapter, progress) via a beat interpreter, so scrubbing and
   chapter jumps are exact. Narration, captions, transcript and the
   audio-is-the-master-clock transport are identical; audioSim shares gov3's
   MP3s. Degrades to a still + transcript without WebGL / with reduced motion. */

(function () {
  const S = window.VWSim;
  if (!S) return;
  const h = S.h;
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.164.1/three.module.min.js';
  const NFX = 900, NLINK = 28, NSIG = 130;

  /* HDR-ish palette: emissive values may exceed 1 to drive the bloom. */
  const COL = {
    stone: [0.05, 0.07, 0.12], sealed: [0.55, 0.16, 0.10], glass: [0.42, 0.82, 1.15], open: [0.40, 1.05, 0.80],
    agent: [0.32, 1.45, 0.70], person: [1.45, 0.96, 0.48], gold: [1.55, 1.08, 0.42], red: [1.7, 0.28, 0.12],
    core: [1.95, 1.30, 0.62], scan: [0.45, 0.95, 1.7], white: [1.7, 1.7, 1.7], glassDim: [0.18, 0.34, 0.5],
  };
  const ez = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
  const clamp01 = u => u < 0 ? 0 : u > 1 ? 1 : u;
  function hashId(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['sim-lumen'] = {
    props: { kind: { type: String, default: '' }, sim: { type: String, default: '' }, start: { type: Number, default: 0 } },
    data() {
      return { dataset: null, error: null, ch: this.start || 0, playing: false, fs: false, showNarr: false, showCaps: false,
               progress: 0, chDur: 30, audioOk: true, ready: false, webgl: true, motion: !S.prefersReducedMotion, panel: null };
    },
    computed: {
      loc() { return (window.VWStore && window.VWStore.locale) === 'fr' ? 'fr' : 'en'; },
      chapters() { return (this.dataset && this.dataset.chapters) || []; },
      chapter() { return this.chapters[this.ch] || null; },
      captions() {
        return ((this.chapter && this.chapter.steps) || []).filter(s => s.do === 'caption')
          .map(s => ({ t: s.t, text: s.text })).sort((a, b) => a.t - b.t);
      },
      currentCaption() { let cur = ''; for (const c of this.captions) { if (c.t <= this.progress + 1e-6) cur = S.t(c.text, this.loc); else break; } return cur; },
      narration() { return this.chapter ? S.t(this.chapter.narration, this.loc) : ''; },
      audioSrc() { const aud = this.dataset.audioSim || this.dataset.id; return this.chapter ? 'public/audio/' + this.loc + '/sims/' + aud + '/' + this.chapter.id + '.mp3' : ''; },
      timeLabel() { return S.fmtTime(this.progress * this.chDur) + ' / ' + S.fmtTime(this.chDur); },
      L() {
        return this.loc === 'fr'
          ? { play: 'Lecture', pause: 'Pause', replay: 'Rejouer', expand: 'Plein écran', close: 'Fermer', transcript: 'Transcription', hide: 'Masquer la transcription', caps: 'Sous-titres',
              hint: 'glissez pour orbiter · molette pour zoomer · cliquez un cristal pour apprendre', resume: 'Reprendre', closePanel: 'Fermer', readPaper: 'Lire',
              nowebgl: 'La 3D n’est pas disponible dans ce navigateur. La narration et la transcription restent accessibles.' }
          : { play: 'Play', pause: 'Pause', replay: 'Replay', expand: 'Expand', close: 'Close', transcript: 'Transcript', hide: 'Hide transcript', caps: 'Captions',
              hint: 'drag to orbit · scroll to zoom · click a crystal to learn', resume: 'Resume', closePanel: 'Close', readPaper: 'Read',
              nowebgl: '3D is not available in this browser. The narration and transcript remain available.' };
      },
    },
    watch: {
      loc() { this.stopAll(); this.panel = null; this.loadGlossary(); this.rebuildLabels(); this.$nextTick(() => this.primeChapter()); },
      ch() { this.panel = null; this.$nextTick(() => this.primeChapter()); },
      fs() { this.$nextTick(() => this.fitCanvas()); },
    },
    created() {
      this.loadGlossary();
      S.loadData(this.sim).then(d => { this.dataset = d; this.bootThree(); })
        .catch(e => { this.error = 'Simulation "' + this.sim + '" failed to load: ' + e.message; });
    },
    mounted() {
      this._tick = () => this.syncTick();
      this._iv = setInterval(this._tick, 80);
      if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { window.__simPlayers = window.__simPlayers || []; window.__simPlayers.push(this); }
      this._onResize = () => this.fitCanvas();
      window.addEventListener('resize', this._onResize);
    },
    beforeUnmount() {
      this._dead = true;
      this.stopAll();
      if (this._iv) clearInterval(this._iv);
      if (this._rafId) cancelAnimationFrame(this._rafId);
      window.removeEventListener('resize', this._onResize);
      if (this._esc) window.removeEventListener('keydown', this._esc);
      if (this._renderer) { try { this._renderer.dispose(); } catch (e) {} }
    },
    methods: {
      loadGlossary() {
        if (this._glossary) return;
        fetch('data/glossary.json').then(r => r.json()).then(g => { this._glossary = {}; (g.terms || []).forEach(t => { this._glossary[t.id] = t; }); }).catch(() => { this._glossary = {}; });
      },

      /* ---------- bootstrap ---------- */
      bootThree() {
        import(/* @vite-ignore */ THREE_URL).then(T => {
          this._T = T;
          this._waitHost(0);
        }).catch(() => { this.webgl = false; this.$nextTick(() => this.primeChapter()); });
      },
      /* the figure may be mounted but its stage element not yet laid out (it is
         far down the page / lazily revealed). Wait for the host before init. */
      _waitHost(n) {
        if (this._inited || this._dead) return;
        const host = this.$refs.stage3d;
        if (host && host.getBoundingClientRect) {
          this._inited = true;
          try { this.initScene(); this.primeChapter(); this.startLoop(); }
          catch (e) { console.error('LUMEN_INIT_FAIL', e && e.stack || e); this.webgl = false; try { this.primeChapter(); } catch (e2) {} }
          return;
        }
        if (n > 600) return;                       // ~give up after a while; user isn't viewing
        setTimeout(() => this._waitHost(n + 1), 100);
      },
      initScene() {
        const T = this._T, host = this.$refs.stage3d;
        const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setClearColor(0x05060d, 1);
        renderer.outputColorSpace = T.LinearSRGBColorSpace;   // we do our own tonemap + sRGB encode in composite
        renderer.autoClear = true;
        host.appendChild(renderer.domElement);
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.width = '100%';
        this._renderer = renderer;

        const scene = new T.Scene();
        scene.fog = new T.FogExp2(0x05060d, 0.011);
        this._scene = scene;
        this._camera = new T.PerspectiveCamera(48, 16 / 9, 0.1, 800);
        this._reflectCam = new T.PerspectiveCamera(48, 16 / 9, 0.1, 800);
        this._user = { th: 0, ph: 0, zoom: 1 };
        this._lookV = new T.Vector3(0, 5, 0);
        this._clock = 0;

        /* a single key light direction for stone shading */
        this._lightDir = new T.Vector3(0.4, 1.0, 0.6).normalize();

        this.buildTargets(16, 9);
        this.buildQuad();
        this.buildWorld();
        this.buildStreams();
        this.rebuildLabels();
        this.bindPointer(renderer.domElement);
        this.fitCanvas();
      },

      /* ---------- render targets + fullscreen quad (hand-rolled post) ---------- */
      buildTargets(w, hh) {
        const T = this._T;
        const HF = T.HalfFloatType;
        const mk = (ww, hhh, depth) => new T.WebGLRenderTarget(Math.max(2, ww), Math.max(2, hhh), { type: HF, depthBuffer: !!depth, magFilter: T.LinearFilter, minFilter: T.LinearFilter });
        this._sceneRT = mk(w, hh, true);
        this._reflectRT = mk(Math.round(w * 0.6), Math.round(hh * 0.6), true);
        const bw = Math.round(w * 0.5), bh = Math.round(hh * 0.5);
        this._brightRT = mk(bw, bh, false);
        this._blurA = mk(bw, bh, false);
        this._blurB = mk(bw, bh, false);
      },
      buildQuad() {
        const T = this._T;
        this._quadScene = new T.Scene();
        this._quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this._quad = new T.Mesh(new T.PlaneGeometry(2, 2), null);
        this._quadScene.add(this._quad);

        const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
        this._mBright = new T.ShaderMaterial({
          uniforms: { tDiffuse: { value: null }, uThresh: { value: 0.85 } },
          vertexShader: vs,
          fragmentShader: 'uniform sampler2D tDiffuse; uniform float uThresh; varying vec2 vUv;\n' +
            'void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(0.2126,0.7152,0.0722));\n' +
            'float k = max(0.0, l - uThresh) / max(l, 1e-4); gl_FragColor = vec4(c * k, 1.0); }',
        });
        this._mBlur = new T.ShaderMaterial({
          uniforms: { tDiffuse: { value: null }, uDir: { value: new T.Vector2() } },
          vertexShader: vs,
          fragmentShader: 'uniform sampler2D tDiffuse; uniform vec2 uDir; varying vec2 vUv;\n' +
            'void main(){ vec3 s = vec3(0.0);\n' +
            ' s += texture2D(tDiffuse, vUv).rgb * 0.227027;\n' +
            ' s += texture2D(tDiffuse, vUv + uDir*1.3846).rgb * 0.316216;\n' +
            ' s += texture2D(tDiffuse, vUv - uDir*1.3846).rgb * 0.316216;\n' +
            ' s += texture2D(tDiffuse, vUv + uDir*3.2308).rgb * 0.070270;\n' +
            ' s += texture2D(tDiffuse, vUv - uDir*3.2308).rgb * 0.070270;\n' +
            ' gl_FragColor = vec4(s, 1.0); }',
        });
        this._mComposite = new T.ShaderMaterial({
          uniforms: { tScene: { value: null }, tBloom: { value: null }, uBloom: { value: 1.15 }, uVig: { value: 1.15 } },
          vertexShader: vs,
          fragmentShader:
            'uniform sampler2D tScene; uniform sampler2D tBloom; uniform float uBloom; uniform float uVig; varying vec2 vUv;\n' +
            'vec3 aces(vec3 x){ const float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.0,1.0); }\n' +
            'void main(){ vec3 col = texture2D(tScene, vUv).rgb + texture2D(tBloom, vUv).rgb * uBloom;\n' +
            ' col = aces(col);\n' +
            ' vec2 q = vUv - 0.5; float v = smoothstep(0.95, 0.30, length(q) * uVig); col *= mix(0.35, 1.0, v);\n' +
            ' col = pow(col, vec3(1.0/2.2));\n' +
            ' gl_FragColor = vec4(col, 1.0); }',
        });
      },
      renderPass(mat, target) { this._quad.material = mat; this._renderer.setRenderTarget(target || null); this._renderer.render(this._quadScene, this._quadCam); },

      /* ---------- the world ---------- */
      crystalGeo() {
        if (this._cgeo) return this._cgeo;
        const T = this._T;
        const g = new T.IcosahedronGeometry(1, 0).toNonIndexed();
        g.computeVertexNormals();    // non-indexed -> flat facets
        this._cgeo = g; return g;
      },
      crystalMat() {
        const T = this._T;
        return new T.ShaderMaterial({
          side: T.DoubleSide, fog: true,
          uniforms: {
            uProgress: { value: 0 }, uEnergy: { value: 0 }, uFlare: { value: 0 }, uTime: { value: 0 },
            uMix: { value: 0 }, uMixCol: { value: new T.Color() }, uFlareCol: { value: new T.Color(1.7, 1.7, 1.7) },
            uBase: { value: new T.Color(COL.stone[0], COL.stone[1], COL.stone[2]) },
            uGlass: { value: new T.Color(COL.glass[0], COL.glass[1], COL.glass[2]) },
            uLight: { value: this._lightDir.clone() }, fogColor: { value: new T.Color(0x05060d) }, fogDensity: { value: 0.011 },
          },
          vertexShader:
            'varying vec3 vN; varying vec3 vWorld; varying vec3 vView; varying float vFog;\n' +
            'void main(){ vN = normalize(mat3(modelMatrix) * normal);\n' +
            ' vec4 wp = modelMatrix * vec4(position,1.0); vWorld = wp.xyz;\n' +
            ' vec4 mv = modelViewMatrix * vec4(position,1.0); vView = -mv.xyz;\n' +
            ' vFog = -mv.z; gl_Position = projectionMatrix * mv; }',
          fragmentShader:
            'uniform float uProgress, uEnergy, uFlare, uTime, uMix; uniform vec3 uMixCol, uFlareCol, uBase, uGlass, uLight, fogColor; uniform float fogDensity;\n' +
            'varying vec3 vN; varying vec3 vWorld; varying vec3 vView; varying float vFog;\n' +
            'void main(){ vec3 N = normalize(vN); vec3 V = normalize(vView);\n' +
            ' float ndl = max(0.0, dot(N, normalize(uLight)));\n' +
            ' vec3 stone = uBase * (0.14 + 0.45*ndl);\n' +                                  // opaque legacy rock, darker
            ' float fres = pow(1.0 - max(0.0, dot(N, V)), 2.4);\n' +
            ' float strata = 0.5 + 0.5*sin(vWorld.y*0.9 + uTime*0.7);\n' +                  // internal light bands
            ' vec3 inner = uGlass * (0.45 + 0.85*strata);\n' +
            ' vec3 glass = inner + uGlass * fres * 2.6 + vec3(0.15,0.35,0.55);\n' +         // luminous interior + bright fresnel edge
            ' float spark = pow(max(0.0, sin(dot(N, vec3(12.0,7.0,5.0)) + uTime*1.3)), 18.0);\n' +
            ' glass += vec3(0.9,1.1,1.3) * spark * 1.6;\n' +
            ' vec3 col = mix(stone, glass, smoothstep(0.0,1.0,uProgress));\n' +
            ' col += uGlass * fres * uProgress * 0.6;\n' +                                  // edge glow scales with how glassy it is
            ' col = mix(col, uMixCol * (0.4 + 0.9*fres + 0.4), uMix);\n' +                  // recolor (sealed / friction)
            ' col *= (0.55 + 0.85*uEnergy);\n' +
            ' col += uFlareCol * uFlare * (0.5 + fres);\n' +
            ' float f = 1.0 - exp(-fogDensity*fogDensity*vFog*vFog); col = mix(col, fogColor, clamp(f,0.0,1.0));\n' +
            ' gl_FragColor = vec4(col, 1.0); }',
        });
      },
      emissiveMat(colArr, opacity) {
        const T = this._T;
        return new T.ShaderMaterial({
          transparent: opacity != null, side: T.DoubleSide, depthWrite: opacity == null,
          uniforms: { uCol: { value: new T.Color(colArr[0], colArr[1], colArr[2]) }, uEnergy: { value: 1 }, uFlare: { value: 0 }, uTime: { value: 0 }, uOpacity: { value: opacity == null ? 1 : opacity } },
          vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = -mv.xyz; gl_Position = projectionMatrix*mv; }',
          fragmentShader: 'uniform vec3 uCol; uniform float uEnergy, uFlare, uTime, uOpacity; varying vec3 vN; varying vec3 vV;\n' +
            'void main(){ vec3 N=normalize(vN); vec3 V=normalize(vV); float fres = pow(1.0-max(0.0,dot(N,V)),2.0);\n' +
            ' float pulse = 0.85 + 0.15*sin(uTime*3.0);\n' +
            ' vec3 col = uCol * uEnergy * pulse * (0.7 + 0.8*fres) + uCol*uFlare*1.6;\n' +
            ' gl_FragColor = vec4(col, uOpacity); }',
        });
      },
      coreMat() {
        const T = this._T;
        return new T.ShaderMaterial({
          side: T.DoubleSide,
          uniforms: { uCol: { value: new T.Color(COL.core[0], COL.core[1], COL.core[2]) }, uEnergy: { value: 0 }, uTime: { value: 0 } },
          vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=-mv.xyz; vP=position; gl_Position=projectionMatrix*mv; }',
          fragmentShader: 'uniform vec3 uCol; uniform float uEnergy, uTime; varying vec3 vN; varying vec3 vV; varying vec3 vP;\n' +
            'void main(){ vec3 N=normalize(vN); vec3 V=normalize(vV); float fres=pow(1.0-max(0.0,dot(N,V)),1.5);\n' +
            ' float facet = 0.6 + 0.4*sin(dot(normalize(vP), vec3(9.0,6.0,4.0)) + uTime*1.6);\n' +
            ' float beat = 0.8 + 0.2*sin(uTime*2.2);\n' +
            ' vec3 col = uCol * uEnergy * beat * (0.7 + 1.3*fres) * facet;\n' +
            ' gl_FragColor = vec4(col, 1.0); }',
        });
      },
      slabMat() {
        const T = this._T;
        return new T.ShaderMaterial({
          side: T.DoubleSide, transparent: true,
          uniforms: { uFill: { value: 0 }, uEnergy: { value: 1 }, uTime: { value: 0 }, uCol: { value: new T.Color(COL.gold[0], COL.gold[1], COL.gold[2]) } },
          vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=-mv.xyz; gl_Position=projectionMatrix*mv; }',
          fragmentShader: 'uniform float uFill, uEnergy, uTime; uniform vec3 uCol; varying vec2 vUv; varying vec3 vN; varying vec3 vV;\n' +
            'void main(){ vec3 N=normalize(vN); vec3 V=normalize(vV); float fres=pow(1.0-max(0.0,dot(N,V)),2.0);\n' +
            ' float rows = 14.0; float ry = floor(vUv.y*rows); float line = smoothstep(0.12,0.0,abs(fract(vUv.y*rows)-0.5)-0.18);\n' +
            ' float filled = step(1.0 - uFill, vUv.y);\n' +                                  // rows write bottom-up
            ' float len = 0.35 + 0.5*fract(sin(ry*12.9)*43758.5);\n' +
            ' float ink = line * step(vUv.x, len) * filled;\n' +
            ' vec3 glassy = uCol*0.16 + uCol*fres*0.9;\n' +
            ' vec3 col = (glassy + uCol*ink*1.8) * uEnergy;\n' +
            ' float a = 0.30 + 0.55*fres + ink*0.6; gl_FragColor = vec4(col, clamp(a,0.0,1.0)); }',
        });
      },
      paneMat() {
        const T = this._T;
        return new T.ShaderMaterial({
          side: T.DoubleSide, transparent: true, depthWrite: false,
          uniforms: { uForm: { value: 0 }, uFlare: { value: 0 }, uTime: { value: 0 }, uCol: { value: new T.Color(0.7, 0.92, 1.3) } },
          vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=-mv.xyz; gl_Position=projectionMatrix*mv; }',
          fragmentShader: 'uniform float uForm, uFlare, uTime; uniform vec3 uCol; varying vec2 vUv; varying vec3 vN; varying vec3 vV;\n' +
            'void main(){ vec2 p = vUv;\n' +
            ' float border = max(smoothstep(0.04,0.0,min(p.x,1.0-p.x)), smoothstep(0.04,0.0,min(p.y,1.0-p.y)));\n' +
            ' float rows = step(p.x,0.5)*step(0.55,p.y)*smoothstep(0.06,0.0,abs(fract(p.y*8.0)-0.5)-0.2);\n' +
            ' float barH = 0.10 + 0.30*fract(sin(floor(p.x*5.0)*7.3)*43758.5);\n' +
            ' float bars = step(p.y, 0.15+barH)*step(0.04,p.y)*step(p.x,0.55)*step(fract(p.x*5.0),0.7);\n' +
            ' float btn = step(0.62,p.x)*step(p.x,0.92)*step(0.10,p.y)*step(p.y,0.28);\n' +
            ' float ink = clamp(border + rows + bars*0.8 + btn*(0.6+uFlare), 0.0, 1.5);\n' +
            ' float reveal = smoothstep(uForm-0.25, uForm, 1.0 - p.y);\n' +                  // assembles top-down
            ' vec3 col = uCol * ink * (1.0 + uFlare*1.5);\n' +
            ' float a = ink * reveal * 0.95; gl_FragColor = vec4(col, a); }',
        });
      },
      floorMat() {
        const T = this._T;
        return new T.ShaderMaterial({
          uniforms: { tReflect: { value: this._reflectRT.texture }, uRes: { value: new T.Vector2(16, 9) }, uReflect: { value: 0.5 }, uTime: { value: 0 } },
          vertexShader: 'varying vec3 vW; void main(){ vec4 wp = modelMatrix*vec4(position,1.0); vW = wp.xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
          fragmentShader: 'uniform sampler2D tReflect; uniform vec2 uRes; uniform float uReflect, uTime; varying vec3 vW;\n' +
            'void main(){ vec2 suv = gl_FragCoord.xy / uRes;\n' +
            ' vec3 refl = texture2D(tReflect, suv).rgb;\n' +
            ' float d = length(vW.xz);\n' +
            ' float grid = smoothstep(0.04,0.0,abs(fract(vW.x*0.25)-0.5)-0.47) + smoothstep(0.04,0.0,abs(fract(vW.z*0.25)-0.5)-0.47);\n' +
            ' float gfade = exp(-d*0.025);\n' +
            ' vec3 base = vec3(0.015,0.02,0.035);\n' +
            ' float fade = exp(-d*0.018);\n' +
            ' vec3 col = base + refl * uReflect * fade + vec3(0.05,0.09,0.16) * grid * gfade * 0.5;\n' +
            ' gl_FragColor = vec4(col, 1.0); }',
        });
      },

      buildWorld() {
        const T = this._T;
        const root = new T.Group(); this._scene.add(root); this._root = root;
        this._ents = {}; this._entList = [];
        const cast = this.dataset.cast || [];

        /* floor */
        this._floorMat = this.floorMat();
        const floor = new T.Mesh(new T.PlaneGeometry(260, 260), this._floorMat);
        floor.rotation.x = -Math.PI / 2; floor.position.y = 0; floor.renderOrder = -1;
        root.add(floor); this._floor = floor;

        for (const c of cast) {
          if (c.kind === 'floor') { this._ents[c.id] = { id: c.id, kind: 'floor', cfg: c, mesh: floor, base: [0, 0, 0] }; this._entList.push(this._ents[c.id]); continue; }
          let mesh = null, mat = null;
          if (c.kind === 'crystal') {
            mat = this.crystalMat();
            mat.uniforms.uGlass.value.setRGB(COL.glass[0], COL.glass[1], COL.glass[2]);
            mesh = new T.Mesh(this.crystalGeo(), mat);
            mesh.scale.set(c.w, c.ht / 2, c.w);
            mesh.rotation.y = c.yaw || 0;
          } else if (c.kind === 'core') {
            mat = this.coreMat();
            mesh = new T.Mesh(new T.IcosahedronGeometry(c.r || 4, 1), mat);
          } else if (c.kind === 'slab') {
            mat = this.slabMat();
            mesh = new T.Mesh(new T.BoxGeometry(c.w, c.ht, c.d || 1.2), mat);
            mesh.rotation.y = c.yaw || 0;
          } else if (c.kind === 'pane') {
            mat = this.paneMat();
            mesh = new T.Mesh(new T.PlaneGeometry(c.w, c.ht), mat);
            mesh.rotation.y = c.yaw || 0;
          } else if (c.kind === 'orb') {
            mat = this.emissiveMat(COL[c.color] || COL.agent);
            mesh = new T.Mesh(new T.IcosahedronGeometry(c.r || 0.7, 1), mat);
          } else if (c.kind === 'mote') {
            mat = this.emissiveMat(COL[c.color] || COL.person);
            mesh = new T.Mesh(new T.SphereGeometry(c.r || 0.5, 12, 12), mat);
          } else if (c.kind === 'ring') {
            mat = this.emissiveMat(COL[c.color] || COL.gold);
            mesh = new T.Mesh(new T.TorusGeometry(c.r || 1.5, 0.10, 10, 40), mat);
            mesh.rotation.x = Math.PI / 2;
          } else if (c.kind === 'label') {
            this._ents[c.id] = { id: c.id, kind: 'label', cfg: c, sprite: null, base: [c.x || 0, c.y || 0, c.z || 0] };
            this._entList.push(this._ents[c.id]); continue;
          }
          if (!mesh) continue;
          mesh.position.set(c.x || 0, c.y || 0, c.z || 0);
          mesh.visible = !!c.cfg;   // placeholder; visibility driven each frame
          if (c.learn) { mesh.userData.learn = true; mesh.userData.actor = c; }
          root.add(mesh);
          const ent = { id: c.id, kind: c.kind, cfg: c, mesh, mat, base: [c.x || 0, c.y || 0, c.z || 0], colName: c.color || null };
          this._ents[c.id] = ent; this._entList.push(ent);
        }

        /* pulse rings (speech, ch5) — a small reusable pool */
        this._pulseRings = [];
        for (let i = 0; i < 4; i++) {
          const m = this.emissiveMat(COL.person, 0.0);
          const r = new T.Mesh(new T.TorusGeometry(1, 0.05, 8, 48), m);
          r.rotation.x = Math.PI / 2; r.visible = false; root.add(r);
          this._pulseRings.push(r);
        }
      },

      buildStreams() {
        const T = this._T;
        const tex = this.dotTexture();
        /* streams of light along beziers between entities */
        const spos = new Float32Array(NFX * 3), scol = new Float32Array(NFX * 3);
        const sgeo = new T.BufferGeometry();
        sgeo.setAttribute('position', new T.BufferAttribute(spos, 3));
        sgeo.setAttribute('color', new T.BufferAttribute(scol, 3));
        this._streams = new T.Points(sgeo, new T.PointsMaterial({ size: 0.9, vertexColors: true, map: tex, alphaMap: tex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true }));
        this._streams.frustumCulled = false; this._root.add(this._streams);
        /* links + signal pulses */
        const lpos = new Float32Array(NLINK * 2 * 3), lcol = new Float32Array(NLINK * 2 * 3);
        const lgeo = new T.BufferGeometry();
        lgeo.setAttribute('position', new T.BufferAttribute(lpos, 3));
        lgeo.setAttribute('color', new T.BufferAttribute(lcol, 3));
        this._links = new T.LineSegments(lgeo, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7, blending: T.AdditiveBlending }));
        this._links.frustumCulled = false; this._root.add(this._links);
        const sgpos = new Float32Array(NSIG * 3), sgcol = new Float32Array(NSIG * 3);
        const siggeo = new T.BufferGeometry();
        siggeo.setAttribute('position', new T.BufferAttribute(sgpos, 3));
        siggeo.setAttribute('color', new T.BufferAttribute(sgcol, 3));
        this._sig = new T.Points(siggeo, new T.PointsMaterial({ size: 1.5, vertexColors: true, map: tex, alphaMap: tex, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
        this._sig.frustumCulled = false; this._root.add(this._sig);
      },
      dotTexture() {
        const T = this._T;
        const cv = document.createElement('canvas'); cv.width = cv.height = 64;
        const c = cv.getContext('2d');
        const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, 64, 64);
        return new T.CanvasTexture(cv);
      },

      /* ---------- labels (billboard sprites, distance-scaled) ---------- */
      rebuildLabels() {
        const T = this._T;
        if (!T || !this._scene || !this._entList) return;
        for (const e of this._entList) {
          if (e.kind !== 'label' && !(e.cfg && e.cfg.label)) continue;
          if (e.sprite) { this._scene.remove(e.sprite); e.sprite.material.map.dispose(); e.sprite.material.dispose(); e.sprite = null; }
          const text = e.cfg.label && S.t(e.cfg.label, this.loc);
          if (!text) continue;
          const cv = document.createElement('canvas');
          const ctx = cv.getContext('2d'); ctx.font = '700 32px "IBM Plex Mono", monospace';
          const tw = Math.ceil(ctx.measureText(text.toUpperCase()).width) + 36;
          cv.width = tw; cv.height = 60;
          const c2 = cv.getContext('2d'); c2.font = '700 32px "IBM Plex Mono", monospace';
          c2.textAlign = 'center'; c2.textBaseline = 'middle';
          c2.shadowColor = 'rgba(120,180,255,0.8)'; c2.shadowBlur = 14;
          c2.fillStyle = 'rgba(232,242,255,0.97)'; c2.fillText(text.toUpperCase(), tw / 2, 31);
          const tex = new T.CanvasTexture(cv);
          const mat = new T.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false });
          const sp = new T.Sprite(mat); sp.userData.aspect = tw / 60; sp.renderOrder = 20;
          this._scene.add(sp); e.sprite = sp;
        }
      },

      /* ---------- beat interpreter: state = f(chapter, progress) ---------- */
      computeState(chIdx, p) {
        const st = this._st || (this._st = {});
        for (const e of this._entList) {
          const s = st[e.id] || (st[e.id] = {});
          s.x = e.base[0]; s.y = e.base[1]; s.z = e.base[2];
          s.formed = e.cfg.visible ? 1 : 0; s.energy = e.cfg.visible ? 1 : 0;
          s.gain = 1; s.crystal = 0; s.mix = 0; s.mixCol = null; s.flare = 0; s.flareCol = null;
          s.fill = 0; s.form = 0; s.dissolve = 0; s.label = 0; s.orbit = null; s.healed = 0;
        }
        this._stStreams = []; this._stLinks = []; this._stWave = null; this._stPulse = null;
        const chs = this.chapters;
        for (let c = 0; c <= chIdx; c++) {
          const beats = chs[c] && chs[c].beats; if (!beats) continue;
          const pc = c < chIdx ? 1 : p;
          for (const b of beats) {
            if (c < chIdx && b.do === 'label' && !b.keep) continue;        // labels retire with their chapter
            const span = b.t[1] - b.t[0] || 1e-4;
            const raw = (pc - b.t[0]) / span;
            if (raw <= 0) continue;
            const transient = b.hold === false || b.do === 'flare' || b.do === 'strike' || b.do === 'stream' || b.do === 'wave' || b.do === 'pulse' || b.do === 'link';
            if (transient && raw >= 1 && (b.do === 'flare' || b.do === 'strike' || b.do === 'stream' || b.do === 'pulse')) continue;
            const f = transient ? (b.do === 'link' || b.do === 'wave' ? clamp01(raw) : Math.sin(Math.PI * clamp01(raw))) : ez(clamp01(raw));
            this.applyBeat(st, b, f, raw);
          }
        }
        /* parented entities follow their parent */
        for (const e of this._entList) {
          const par = e.cfg.parent && st[e.cfg.parent]; if (!par) continue;
          const s = st[e.id]; const off = e.cfg.offset || [0, 0, 0];
          s.x = par.x + off[0]; s.y = par.y + off[1]; s.z = par.z + off[2];
          if (e.kind === 'ring') s.energy = Math.max(s.energy, par.energy ? 1 : s.energy);
        }
        return st;
      },
      applyBeat(st, b, f, raw) {
        const ids = b.ids || (b.id ? [b.id] : []);
        switch (b.do) {
          case 'appear': case 'ignite': for (const id of ids) { const s = st[id]; if (!s) continue; s.formed = Math.max(s.formed, f); s.energy = Math.max(s.energy, f); if (b.do === 'ignite') s.gain = Math.max(s.gain, f * 1.6); } break;
          case 'keep': break;
          case 'fade': for (const id of ids) { const s = st[id]; if (!s) continue; const k = 1 - f * (b.amt == null ? 1 : b.amt); s.energy *= k; s.label *= k; } break;
          case 'energy': for (const id of ids) { const s = st[id]; if (!s) continue; s.gain = s.gain + (b.to - s.gain) * f; } break;
          case 'dissolve': for (const id of ids) { const s = st[id]; if (!s) continue; s.formed *= (1 - f); s.dissolve = Math.max(s.dissolve, f); s.label *= (1 - f); } break;
          case 'morph': for (const id of ids) { const s = st[id]; if (!s) continue; s.crystal = Math.max(s.crystal, f); } break;
          case 'inscribe': { const s = st[b.id]; if (s) s.fill = Math.min(1, s.fill + f * (b.to == null ? 1 : b.to)); break; }
          case 'move': { const s = st[b.id]; if (!s) break; s.x += (b.to[0] - s.x) * f; s.y += (b.to[1] - s.y) * f; s.z += (b.to[2] - s.z) * f; break; }
          case 'path': case 'shuttle': {
            const s = st[b.id]; if (!s) break;
            let u = ez(clamp01(raw));
            if (b.do === 'shuttle') { const k = clamp01(raw) * (b.trips || 1) * 2; const seg = Math.floor(k) % 2; u = seg ? 1 - (k % 1) : (k % 1); }
            const pts = b.pts, tt = u * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(tt)), w = tt - i;
            s.x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * w; s.y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * w; s.z = pts[i][2] + (pts[i + 1][2] - pts[i][2]) * w;
            if (b.dots) this._stStreams.push({ trail: s, color: COL[b.color] || COL.person, dots: true, f: 0.8, self: true });
            break;
          }
          case 'recolor': for (const id of ids) { const s = st[id]; if (!s) continue; s.mix = Math.max(s.mix, f); s.mixCol = b.color || 'gold'; } break;
          case 'strike': for (const id of ids) { const s = st[id]; if (!s) continue; s.flare = Math.max(s.flare, f); s.flareCol = 'red'; } break;
          case 'flare': for (const id of ids) { const s = st[id]; if (!s) continue; s.flare = Math.max(s.flare, f); if (b.color) s.flareCol = b.color; } break;
          case 'label': for (const id of ids) { const s = st[id]; if (!s) continue; s.label = b.off ? s.label * (1 - f) : Math.max(s.label, f); } break;
          case 'orbit': { const s = st[b.id]; if (s) s.orbit = { r: b.r, y: b.y, speed: b.speed || 0.2, phase: b.phase || 0, f }; break; }
          case 'pulse': { const s = st[b.id]; if (s) this._stPulse = { x: s.x, y: s.y, z: s.z, raw: clamp01(raw), r: b.r || 8 }; break; }
          case 'link': { const A = st[b.from], B = st[b.to]; if (A && B) this._stLinks.push({ a: A, b: B, draw: f, col: b.color || 'gold', sig: !!b.signals }); break; }
          case 'stream': { const A = st[b.from], B = st[b.to]; if (A && B) this._stStreams.push({ a: A, b: B, f, color: b.color || 'gold', dots: !!b.dots }); break; }
          case 'wave': { const c = st[b.from]; this._stWave = { x: c ? c.x : 0, y: c ? c.y : 4, z: c ? c.z : 0, r: f * (b.r || 40), col: b.color || 'gold', heal: !!b.heal, done: raw >= 1 }; break; }
          default: break;
        }
      },

      /* ---------- transport (audio = master clock) ---------- */
      stopAll() { this.playing = false; const au = this.$refs.audio; if (au) { try { au.pause(); } catch (e) {} } },
      primeChapter() {
        if (!this.dataset || !this.chapter) return;
        this.stopAll(); this.progress = 0; this.ready = false; this._user.th = 0; this._user.ph = 0;
        const au = this.$refs.audio; const fallback = this.chapter.dur || 30;
        const done = (ok, dur) => { this.audioOk = ok; this.chDur = ok && isFinite(dur) && dur > 1 ? dur : fallback; this.ready = true; if (this._autoplay) { this._autoplay = false; this.play(); } };
        if (!au) { done(false, 0); return; }
        au.src = this.audioSrc;
        const onMeta = () => { cleanup(); done(true, au.duration); };
        const onErr = () => { cleanup(); done(false, 0); };
        const cleanup = () => { au.removeEventListener('loadedmetadata', onMeta); au.removeEventListener('error', onErr); };
        au.addEventListener('loadedmetadata', onMeta); au.addEventListener('error', onErr); au.load();
      },
      syncTick() {
        if (!this.playing) return;
        const au = this.$refs.audio;
        if (this.audioOk && au) { this.progress = this.chDur ? Math.min(au.currentTime, this.chDur) / this.chDur : 0; if (au.ended) this.onEnded(); }
        else { this.progress = Math.min(1, this.progress + 0.0064); if (this.progress >= 1) this.onEnded(); }
      },
      play() { if (!this.ready) { this._autoplay = true; return; } if (this.progress >= 0.999) this.seekTo(0); this.playing = true; const au = this.$refs.audio; if (this.audioOk && au) au.play().catch(() => { this.audioOk = false; }); },
      pause() { this.playing = false; const au = this.$refs.audio; if (au) { try { au.pause(); } catch (e) {} } },
      toggle() { this.playing ? this.pause() : this.play(); },
      seekTo(frac) { const tme = Math.max(0, Math.min(1, frac)) * this.chDur; const au = this.$refs.audio; if (this.audioOk && au) { try { au.currentTime = tme; } catch (e) {} } this.progress = this.chDur ? tme / this.chDur : 0; },
      onScrub(e) { this.seekTo(Number(e.target.value) / 1000); },
      onEnded() { this.pause(); this.progress = 1; if (this.ch < this.chapters.length - 1) { this._autoplay = true; this.ch++; } },
      go(i) { if (i === this.ch) { this.seekTo(0); return; } this.pause(); this.ch = i; },
      toggleFs() { this.fs = !this.fs; if (this.fs) { this._esc = (e) => { if (e.key === 'Escape') this.toggleFs(); }; window.addEventListener('keydown', this._esc); } else if (this._esc) { window.removeEventListener('keydown', this._esc); this._esc = null; } this.$nextTick(() => this.fitCanvas()); },

      /* ---------- render loop ---------- */
      fitCanvas() {
        const host = this.$refs.stage3d; if (!host || !this._renderer) return;
        const rect = host.getBoundingClientRect();
        const w = Math.max(320, rect.width); const hh = this.fs ? rect.height : w * 9 / 16;
        const pr = Math.min(2, window.devicePixelRatio || 1);
        this._renderer.setPixelRatio(pr); this._renderer.setSize(w, hh, false);
        this._renderer.domElement.style.height = hh + 'px';
        const pw = Math.round(w * pr), ph = Math.round(hh * pr);
        this._sceneRT.setSize(pw, ph); this._reflectRT.setSize(Math.round(pw * 0.6), Math.round(ph * 0.6));
        this._brightRT.setSize(Math.round(pw * 0.5), Math.round(ph * 0.5)); this._blurA.setSize(Math.round(pw * 0.5), Math.round(ph * 0.5)); this._blurB.setSize(Math.round(pw * 0.5), Math.round(ph * 0.5));
        this._floorMat.uniforms.uRes.value.set(pw, ph);
        if (this._camera) { this._camera.aspect = w / hh; this._camera.updateProjectionMatrix(); this._reflectCam.aspect = w / hh; this._reflectCam.updateProjectionMatrix(); }
      },
      startLoop() {
        let last = performance.now();
        const loop = (now) => {
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          this._clock += dt;
          this.step(dt);
          this.renderFrame();
          this._rafId = requestAnimationFrame(loop);
        };
        this._rafId = requestAnimationFrame(loop);
      },
      step(dt) {
        const T = this._T; if (!T || !this._entList) return;
        const p = this.progress; const clock = p * this.chDur; const t = this._clock;
        const st = this.computeState(this.ch, p);
        const wave = this._stWave;

        for (const e of this._entList) {
          const s = st[e.id];
          if (s.orbit) { const o = s.orbit; const a = o.phase + clock * o.speed; const ox = Math.cos(a) * o.r, oz = Math.sin(a) * o.r; s.x += (ox - s.x) * o.f; s.y += (o.y - s.y) * o.f; s.z += (oz - s.z) * o.f; }
          if (e.kind === 'label') {
            if (e.sprite) {
              const dy = e.cfg.labelDy != null ? e.cfg.labelDy : 4;
              e.sprite.position.set(s.x, s.y + dy, s.z);
              const dCam = this._camera.position.distanceTo(e.sprite.position);
              let hgt = dCam * 0.03; const asp = e.sprite.userData.aspect || 4;
              if (hgt * asp > dCam * 0.62) hgt = dCam * 0.62 / asp;
              e.sprite.scale.set(hgt * asp, hgt, 1);
              e.sprite.material.opacity += (Math.min(1, s.label) * 0.96 - e.sprite.material.opacity) * Math.min(1, dt * 6);
            }
            continue;
          }
          if (e.kind === 'floor') continue;
          const m = e.mesh; if (!m) continue;
          const vis = s.formed > 0.01 || s.energy > 0.01;
          m.visible = vis; if (!vis) continue;
          m.position.set(s.x, s.y, s.z);
          const u = m.material.uniforms;
          if (u && u.uTime) u.uTime.value = t;
          if (e.kind === 'crystal') {
            u.uProgress.value = s.crystal; u.uEnergy.value = s.energy * s.gain; u.uFlare.value = s.flare;
            /* healing wave converts red friction to gold as it passes */
            let mixCol = s.mixCol;
            if (wave && wave.heal && mixCol === 'red') { const dx = s.x - wave.x, dz = s.z - wave.z; if (Math.sqrt(dx * dx + dz * dz) < wave.r) mixCol = 'gold'; }
            u.uMix.value = s.mix; if (mixCol) { const c = COL[mixCol] || COL.gold; u.uMixCol.value.setRGB(c[0], c[1], c[2]); }
            if (s.flareCol) { const c = COL[s.flareCol] || COL.white; u.uFlareCol.value.setRGB(c[0], c[1], c[2]); } else u.uFlareCol.value.setRGB(COL.white[0], COL.white[1], COL.white[2]);
            const sc = m.scale; m.scale.set(e.cfg.w, e.cfg.ht / 2 * s.formed, e.cfg.w);
          } else if (e.kind === 'core') {
            u.uEnergy.value = s.energy * s.gain * 1.4;
            const k = 0.3 + 0.7 * ez(s.formed); m.scale.setScalar(k);
          } else if (e.kind === 'slab') {
            u.uFill.value = s.fill; u.uEnergy.value = s.energy * s.gain;
            const k = ez(s.formed); m.scale.set(1, k, 1);
          } else if (e.kind === 'pane') {
            u.uForm.value = Math.max(s.formed, 0.0001); u.uFlare.value = s.flare;
            m.material.opacity = 1; m.scale.set(1 - s.dissolve * 0.1, 1, 1);
          } else if (e.kind === 'orb' || e.kind === 'mote') {
            u.uEnergy.value = s.energy * s.gain; u.uFlare.value = s.flare;
            const k = 0.4 + 0.6 * ez(s.formed); m.scale.setScalar(k);
          } else if (e.kind === 'ring') {
            u.uEnergy.value = s.energy; u.uFlare.value = s.flare;
            m.scale.setScalar(0.5 + 0.5 * ez(s.formed));
          }
        }

        /* speech pulse rings (ch5) */
        const pulse = this._stPulse;
        for (let i = 0; i < this._pulseRings.length; i++) {
          const r = this._pulseRings[i];
          if (!pulse) { r.visible = false; continue; }
          const phase = (pulse.raw * 1.8 + i * 0.25) % 1;
          r.visible = true; r.position.set(pulse.x, pulse.y, pulse.z);
          const rad = 0.5 + phase * pulse.r; r.scale.set(rad, rad, 1);
          r.material.uniforms.uEnergy.value = 1.2; r.material.uniforms.uOpacity.value = (1 - phase) * 0.7;
        }

        this.updateStreams(clock);
        this.updateCamera(dt, p);
      },

      updateStreams(clock) {
        const streams = this._stStreams || [];
        const sp = this._streams.geometry.attributes.position.array, sc = this._streams.geometry.attributes.color.array;
        const per = streams.length ? Math.floor(NFX / streams.length) : 0;
        for (let q = 0; q < NFX; q++) {
          const ix = q * 3; const si = per ? Math.floor(q / per) : -1;
          if (si < 0 || si >= streams.length) { sp[ix + 1] = -900; sc[ix] = sc[ix + 1] = sc[ix + 2] = 0; continue; }
          const sgm = streams[si]; const jj = q - si * per;
          const col = sgm.color;
          if (sgm.self && sgm.trail) {              // a trailing comet tail behind a moving entity
            const u = (jj / per); const back = u * 2.2;
            sp[ix] = sgm.trail.x - 0; sp[ix + 1] = sgm.trail.y + 0.2 - back * 0.0; sp[ix + 2] = sgm.trail.z - back;
            const k = (1 - u) * 0.7; sc[ix] = col[0] * k; sc[ix + 1] = col[1] * k; sc[ix + 2] = col[2] * k; continue;
          }
          const a = sgm.a, b = sgm.b; const u = ((jj / per) + clock * 0.22) % 1;
          const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, my = Math.max(a.y, b.y) / 2 + 5.0;
          const iu = 1 - u;
          sp[ix] = iu * iu * a.x + 2 * iu * u * mx + u * u * b.x;
          sp[ix + 1] = iu * iu * (a.y + 1.0) + 2 * iu * u * my + u * u * (b.y + 1.0);
          sp[ix + 2] = iu * iu * a.z + 2 * iu * u * mz + u * u * b.z;
          const gate = sgm.dots ? (jj % 5 === 0 ? 1.5 : 0.1) : 0.8; const k = sgm.f * gate;
          sc[ix] = col[0] * k; sc[ix + 1] = col[1] * k; sc[ix + 2] = col[2] * k;
        }
        this._streams.geometry.attributes.position.needsUpdate = true; this._streams.geometry.attributes.color.needsUpdate = true;

        /* links + signal pulses */
        const links = this._stLinks || [];
        const lp = this._links.geometry.attributes.position.array, lc = this._links.geometry.attributes.color.array;
        for (let li = 0; li < NLINK; li++) {
          const o = li * 6;
          if (li >= links.length) { lp[o + 1] = -900; lp[o + 4] = -900; continue; }
          const lk = links[li]; const col = COL[lk.col] || COL.gold;
          const ax = lk.a.x, ay = lk.a.y, az = lk.a.z;
          const bx = ax + (lk.b.x - ax) * lk.draw, by = ay + (lk.b.y - ay) * lk.draw, bz = az + (lk.b.z - az) * lk.draw;
          lp[o] = ax; lp[o + 1] = ay; lp[o + 2] = az; lp[o + 3] = bx; lp[o + 4] = by; lp[o + 5] = bz;
          const w = Math.min(1, lk.a.energy != null ? lk.a.energy : 1, lk.b.energy != null ? lk.b.energy : 1);
          for (let k = 0; k < 2; k++) { lc[o + k * 3] = col[0] * w; lc[o + k * 3 + 1] = col[1] * w; lc[o + k * 3 + 2] = col[2] * w; }
        }
        this._links.geometry.attributes.position.needsUpdate = true; this._links.geometry.attributes.color.needsUpdate = true;
        const sigLinks = links.filter(l => l.sig && l.draw > 0.95);
        const gp = this._sig.geometry.attributes.position.array, gc = this._sig.geometry.attributes.color.array;
        for (let q = 0; q < NSIG; q++) {
          if (!sigLinks.length) { gp[q * 3 + 1] = -900; continue; }
          const lk = sigLinks[q % sigLinks.length]; const col = COL[lk.col] || COL.gold;
          const u = ((q * 0.137) + clock * 0.18) % 1;
          gp[q * 3] = lk.a.x + (lk.b.x - lk.a.x) * u; gp[q * 3 + 1] = lk.a.y + (lk.b.y - lk.a.y) * u; gp[q * 3 + 2] = lk.a.z + (lk.b.z - lk.a.z) * u;
          gc[q * 3] = col[0]; gc[q * 3 + 1] = col[1]; gc[q * 3 + 2] = col[2];
        }
        this._sig.geometry.attributes.position.needsUpdate = true; this._sig.geometry.attributes.color.needsUpdate = true;
      },

      updateCamera(dt, p) {
        const T = this._T; const cam = this.chapter && this.chapter.cam;
        let th = 0.8, ph = 1.2, d = 60, tg = [0, 5, 0];
        if (cam && cam.length) {
          let k0 = cam[0], k1 = cam[cam.length - 1];
          for (let i = 0; i < cam.length - 1; i++) { if (p >= cam[i].t && p <= cam[i + 1].t) { k0 = cam[i]; k1 = cam[i + 1]; break; } }
          const span = (k1.t - k0.t) || 1; const w = ez(clamp01((p - k0.t) / span));
          th = k0.th + (k1.th - k0.th) * w; ph = k0.ph + (k1.ph - k0.ph) * w; d = k0.d + (k1.d - k0.d) * w;
          tg = [0, 1, 2].map(i => k0.tg[i] + (k1.tg[i] - k0.tg[i]) * w);
        }
        if (this.playing && this.motion) { this._user.th *= (1 - dt * 0.3); this._user.ph *= (1 - dt * 0.3); }
        th += this._user.th; ph = Math.max(0.25, Math.min(1.45, ph + this._user.ph)); d = Math.max(14, Math.min(180, d * this._user.zoom));
        const cp = new T.Vector3(tg[0] + d * Math.sin(ph) * Math.cos(th), tg[1] + d * Math.cos(ph), tg[2] + d * Math.sin(ph) * Math.sin(th));
        this._camera.position.lerp(cp, Math.min(1, dt * 5));
        this._lookV.lerp(new T.Vector3(tg[0], tg[1], tg[2]), Math.min(1, dt * 5));
        this._camera.lookAt(this._lookV);
      },

      renderFrame() {
        const T = this._T, r = this._renderer; if (!r) return;
        /* 1. planar reflection: mirror the camera across y=0, render to reflectRT (floor hidden) */
        const c = this._camera, rc = this._reflectCam;
        rc.position.set(c.position.x, -c.position.y, c.position.z);
        rc.up.set(0, -1, 0);
        rc.lookAt(this._lookV.x, -this._lookV.y, this._lookV.z);
        rc.updateMatrixWorld();
        this._floor.visible = false;
        r.setRenderTarget(this._reflectRT); r.clear(); r.render(this._scene, rc);
        this._floor.visible = true;

        /* 2. main scene -> sceneRT (HDR) */
        r.setRenderTarget(this._sceneRT); r.clear(); r.render(this._scene, c);

        /* 3. bloom: bright-pass -> blur (ping-pong) */
        this._mBright.uniforms.tDiffuse.value = this._sceneRT.texture; this.renderPass(this._mBright, this._brightRT);
        const texel = 1 / Math.max(2, this._brightRT.width);
        const texelY = 1 / Math.max(2, this._brightRT.height);
        let src = this._brightRT;
        for (let i = 0; i < 2; i++) {
          this._mBlur.uniforms.tDiffuse.value = src.texture; this._mBlur.uniforms.uDir.value.set(texel * (1 + i), 0); this.renderPass(this._mBlur, this._blurA);
          this._mBlur.uniforms.tDiffuse.value = this._blurA.texture; this._mBlur.uniforms.uDir.value.set(0, texelY * (1 + i)); this.renderPass(this._mBlur, this._blurB);
          src = this._blurB;
        }
        /* 4. composite -> screen */
        this._mComposite.uniforms.tScene.value = this._sceneRT.texture; this._mComposite.uniforms.tBloom.value = this._blurB.texture;
        this.renderPass(this._mComposite, null);
        r.setRenderTarget(null);
      },

      /* ---------- pointer: orbit + zoom + raycast learn ---------- */
      bindPointer(el) {
        const T = this._T; let down = null, moved = false; el.style.touchAction = 'none';
        this._ray = new T.Raycaster();
        el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; moved = false; el.setPointerCapture(e.pointerId); });
        el.addEventListener('pointermove', e => {
          if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
          this._user.th -= dx * 0.005; this._user.ph -= dy * 0.004; down = { x: e.clientX, y: e.clientY };
        });
        el.addEventListener('pointerup', e => { if (!moved) this.tryPick(e, el); down = null; });
        el.addEventListener('pointerleave', () => { down = null; });
        el.addEventListener('wheel', e => { e.preventDefault(); this._user.zoom = Math.max(0.3, Math.min(2.6, this._user.zoom * (e.deltaY > 0 ? 1.07 : 0.93))); }, { passive: false });
      },
      tryPick(e, el) {
        const T = this._T; const rect = el.getBoundingClientRect();
        const ndc = new T.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        this._ray.setFromCamera(ndc, this._camera);
        const hits = this._ray.intersectObjects(this._root.children, true);
        for (const hit of hits) { const o = hit.object; if (o && o.userData && o.userData.learn && o.visible) { this.openPanel(o.userData.actor); return; } }
      },
      openPanel(a) {
        if (!a || !a.learn) return; this.pause(); const loc = this.loc;
        const gl = a.learn.term ? (this._glossary && this._glossary[a.learn.term]) : null;
        const papers = (a.learn.papers || []).map(pid => ({ id: pid, label: pid })).slice(0, 3);
        this.panel = {
          title: gl ? S.t(gl[loc] && gl[loc].term ? gl[loc].term : gl.term, loc) || (gl[loc] && gl[loc].term) : S.t(a.label, loc),
          short: gl ? (gl[loc] ? gl[loc].short : gl.short) : '',
          long: gl ? (gl[loc] ? gl[loc].long : gl.long) : '',
          factoid: S.t(a.learn.factoid, loc), cite: S.t(a.learn.cite, loc), papers,
        };
      },
      closePanel() { this.panel = null; },
    },

    render() {
        try {
        const sim = this.dataset;
        if (this.error) return h('div', { class: 'sim-fig' }, [h('div', { style: 'padding:24px;color:var(--highlight);font-size:12px;' }, this.error)]);
        if (!sim) return h('div', { class: 'sim-fig' }, [h('div', { style: 'padding:28px;text-align:center;color:var(--ink-50);font-size:12px;' }, 'Loading simulation…')]);
        const loc = this.loc;
        const chips = this.chapters.map((c, i) => h('button', { class: ['sim-chip', i === this.ch ? 'active' : '', i < this.ch ? 'done' : ''], onClick: () => this.go(i), 'aria-pressed': i === this.ch ? 'true' : 'false' }, (i + 1) + ' · ' + S.t(c.title, loc)));
        const panel = this.panel ? h('div', { class: 'sim3-panel' }, [
          h('button', { class: 'sim3-x', onClick: () => this.closePanel() }, '✕'),
          h('h4', {}, this.panel.title),
          this.panel.short ? h('p', { class: 'sim3-short' }, this.panel.short) : null,
          this.panel.long ? h('p', { class: 'sim3-long' }, this.panel.long) : null,
          this.panel.factoid ? h('blockquote', { class: 'sim3-quote' }, [h('span', {}, this.panel.factoid), this.panel.cite ? h('cite', {}, this.panel.cite) : null]) : null,
          this.panel.papers && this.panel.papers.length ? h('div', { class: 'sim3-links' }, this.panel.papers.map(p => h('a', { href: '/paper/' + p.id }, this.L.readPaper + ' · ' + p.label + ' →'))) : null,
          h('button', { class: 'sim-btn sim-primary', style: 'margin-top:10px;', onClick: () => { this.closePanel(); this.play(); } }, this.L.resume),
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
            h('div', { class: 'sim-stage', style: 'background:#05060d;' }, [
              h('div', { ref: 'stage3d', style: 'width:100%;' }),
              !this.webgl ? h('div', { style: 'padding:48px 24px;text-align:center;color:#9aa3c0;font-size:13px;' }, this.L.nowebgl) : null,
              h('div', { class: 'sim3-hint', style: 'background:rgba(5,6,13,0.7);color:#9aa3c0;' }, this.L.hint),
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
        } catch (e) { console.error('LUMEN_RENDER_FAIL', e && e.stack || e); return h('div', { class: 'sim-fig' }, [h('div', { style: 'padding:24px;color:#b00;font-size:12px;' }, 'render: ' + (e && e.message))]); }
    },
  };

  /* panel + hint styles (shared visual language with sim:three) */
  if (!document.getElementById('sim-lumen-styles')) {
    const css = `
      .sim3-hint { position: absolute; left: 10px; top: 10px; font-size: 10px; letter-spacing: 0.03em; padding: 4px 9px; border-radius: 6px; pointer-events: none; font-family: var(--font-mono); }
      .sim3-panel { position: absolute; right: 12px; top: 12px; bottom: 12px; width: 310px; max-width: 80%; overflow-y: auto;
        background: rgba(9,12,24,0.92); border: 1px solid rgba(120,160,230,0.35); border-radius: 10px; padding: 16px 16px 14px; color: #dfe6f5; backdrop-filter: blur(3px); }
      .sim3-panel h4 { margin: 2px 24px 8px 0; font-size: 17px; color: #a9c6ff; font-family: var(--font-serif, Georgia, serif); }
      .sim3-x { position: absolute; right: 10px; top: 10px; background: none; border: none; color: #7e8bb0; font-size: 14px; cursor: pointer; }
      .sim3-short { font-size: 13px; line-height: 1.5; color: #eef2fb; }
      .sim3-long { font-size: 12px; line-height: 1.55; color: #b9c2da; margin-top: 6px; }
      .sim3-quote { margin: 12px 0 0; padding: 9px 11px; border-left: 2px solid #c79a3a; background: rgba(199,154,58,0.08); font-size: 12px; line-height: 1.5; color: #ecd9ad; }
      .sim3-quote cite { display: block; margin-top: 5px; font-style: normal; font-size: 10.5px; color: #b89968; }
      .sim3-links { display: flex; flex-direction: column; gap: 5px; margin-top: 10px; }
      .sim3-links a { font-size: 11.5px; color: #9ec0ff; text-decoration: none; }
      .sim3-links a:hover { text-decoration: underline; }
      @media (max-width: 680px) { .sim3-panel { width: 240px; } }
    `;
    const style = document.createElement('style'); style.id = 'sim-lumen-styles'; style.textContent = css; document.head.appendChild(style);
  }

  if (window.VWVisuals) window.VWVisuals.registerBespoke('sim', 'lumen', 'sim-lumen');
})();
