/* PeriodicTable — BESPOKE visual for wp-08 (The Well-Built Harness).

   Periodic table of ~95 security controls across 16 categories. The source of
   truth lives in technical-reference/harness/index.html; this bespoke
   component carries a condensed version inline so the visual is self-contained.

   Bilingual: category names and tile names carry an EN and an FR label.
   Reads window.VWStore.locale (reactive). Tile symbols (O2, JWT, CSP, etc.)
   stay the same in both locales because they are short technical handles.

   Registered as a figure chart via chart.kind = "wp08-periodic".
*/

(function () {
  window.VWComponents = window.VWComponents || {};
  if (window.VWVisuals) {
    window.VWVisuals.registerReusable('wp08-periodic', 'wp08-periodic');
  }

  // Tile builder so we keep the data table compact.
  const t = (sym, en, fr, whereEn, whereFr) => ({
    sym,
    name: { en, fr },
    where: { en: whereEn, fr: whereFr || whereEn },
  });

  const CATEGORIES = [
    { id: 'AuthN', name: { en: 'Authentication', fr: 'Authentification' },
      accent: '#1e3a8a', tint: '#eef3ff', border: '#c7d4ff', tiles: [
        t('O2',   'OAuth 2.0',         'OAuth 2.0',          'Google via Passport', 'Google via Passport'),
        t('OIDC', 'OpenID Connect',    'OpenID Connect',     'Microsoft Entra ID',  'Microsoft Entra ID'),
        t('JWT',  'RS256 JWT',         'JWT RS256',          'alg pinned',          'alg verrouillé'),
        t('Rfr',  'Refresh rotation',  'Rotation refresh',   '7d, old revoked',     '7j, l’ancien révoqué'),
        t('tid',  'Tenant verify',     'Vérif. tenant',      'tid claim check',     'vérification du claim tid'),
        t('OSt',  'OAuth state',       'État OAuth',         '10 min cookie',       'cookie de 10 min'),
        t('Red',  'Safe redirect',     'Redirection sûre',   'safeRedirect util',   'utilitaire safeRedirect'),
      ]},
    { id: 'AuthZ', name: { en: 'Authorization', fr: 'Autorisation' },
      accent: '#155e75', tint: '#ecfeff', border: '#a5f3fc', tiles: [
        t('RBAC', '6-tier roles',  'Rôles à 6 niveaux',  'viewer → super_admin',   'viewer → super_admin'),
        t('Az',   'authorize MW',  'Intergiciel authorize', 'per-route check',    'vérif. par route'),
        t('Grd',  'Router guards', 'Gardes de routeur',  'Vue Router beforeEach',  'Vue Router beforeEach'),
        t('M19',  'CHECK 019',     'CHECK 019',          'DB role constraint',     'contrainte rôle BD'),
      ]},
    { id: 'Tok', name: { en: 'Tokens / Cookies', fr: 'Jetons / Cookies' },
      accent: '#065f46', tint: '#ecfdf5', border: '#a7f3d0', tiles: [
        t('Ho',  'httpOnly',         'httpOnly',           'JS cannot read', 'JS ne peut pas lire'),
        t('Sec', 'Secure flag',      'Drapeau Secure',     'production only', 'production uniquement'),
        t('SSL', 'SameSite=Lax',     'SameSite=Lax',       'OAuth-compatible', 'compatible OAuth'),
        t('15m', 'Access TTL',       'TTL accès',          'short window',   'fenêtre courte'),
        t('7d',  'Refresh TTL',      'TTL refresh',        '7 days',         '7 jours'),
        t('NoLS','No localStorage',  'Pas de localStorage', 'invariant',      'invariant'),
        t('Mem', 'CSRF in memory',   'CSRF en mémoire',    'never persisted', 'jamais persisté'),
      ]},
    { id: 'CSRF', name: { en: 'CSRF', fr: 'CSRF' },
      accent: '#9f1239', tint: '#fff1f2', border: '#fecdd3', tiles: [
        t('Ds',  'Double-submit',   'Double soumission',  'cookie vs header', 'cookie vs en-tête'),
        t('tSE', 'timingSafeEqual', 'timingSafeEqual',    'constant time',    'temps constant'),
        t('Hdr', 'X-CSRF-Token',    'X-CSRF-Token',       'request header',   'en-tête de requête'),
        t('Glb', 'Global mount',    'Montage global',     '/api + /api/v1',   '/api + /api/v1'),
        t('Exm', 'Exempt list',     'Liste d’exemptions', 'OAuth + refresh',  'OAuth + refresh'),
        t('Rtr', 'Auto retry',      'Réessai auto',       'axios on 403',     'axios sur 403'),
      ]},
    { id: 'Inj', name: { en: 'Injection / XSS', fr: 'Injection / XSS' },
      accent: '#7c2d12', tint: '#fff7ed', border: '#fed7aa', tiles: [
        t('DP',   'DOMPurify',       'DOMPurify',          'every v-html',        'tout v-html'),
        t('PSQL', 'Parameterised',   'Paramétrée',         'pg.Pool $1, $2',      'pg.Pool $1, $2'),
        t('Zod',  'Zod schemas',     'Schémas Zod',        'body, params, query', 'corps, paramètres, requête'),
        t('Esc',  'Vue escaping',    'Échappement Vue',    'auto on mustache',    'auto sur moustache'),
        t('CT',   'Content-Type',    'Content-Type',       '415 on mismatch',     '415 si désaccord'),
        t('BL',   'Body limits',     'Limites de corps',   '1 MB default',        '1 Mo par défaut'),
      ]},
    { id: 'Hdr', name: { en: 'Security headers', fr: 'En-têtes de sécurité' },
      accent: '#1e40af', tint: '#eff6ff', border: '#bfdbfe', tiles: [
        t('CSP',  'Content-Security', 'Content-Security',  'helmet directives', 'directives helmet'),
        t('HSTS', 'Strict-Transport', 'Strict-Transport',  '1y + preload',      '1 an + preload'),
        t('PP',   'Permissions',      'Permissions',       'camera, mic, geo off', 'caméra, micro, géo coupés'),
        t('COEP', 'Cross-Origin EP',  'Cross-Origin EP',   'credentialless',    'sans justificatifs'),
        t('XFO',  'frame-ancestors',  'frame-ancestors',   'none',              'aucun'),
        t('XCT',  'X-Content-Type',   'X-Content-Type',    'nosniff',           'nosniff'),
        t('RP',   'Referrer-Policy',  'Referrer-Policy',   'strict-origin',     'strict-origin'),
      ]},
    { id: 'Rate', name: { en: 'Rate / DoS', fr: 'Débit / DoS' },
      accent: '#92400e', tint: '#fffbeb', border: '#fde68a', tiles: [
        t('API',  '200 / 15m',   '200 / 15min',  'baseline /api',     'base /api'),
        t('Auth', '30 / 15m',    '30 / 15min',   'login + SSO',       'login + SSO'),
        t('AI',   '60 / 1h',     '60 / 1h',      'AI endpoints',      'endpoints IA'),
        t('Bc',   '60 / 1h',     '60 / 1h',      'broadcast fan-out', 'diffusion'),
        t('RA',   'Retry-After', 'Retry-After',  'RFC 6585',          'RFC 6585'),
        t('Rd',   'Redis store', 'Magasin Redis', 'horizontal scale', 'mise à l’échelle horizontale'),
      ]},
    { id: 'Net', name: { en: 'Network / CORS', fr: 'Réseau / CORS' },
      accent: '#4c1d95', tint: '#f5f3ff', border: '#ddd6fe', tiles: [
        t('AL',  'Origin allow',    'Liste d’origines', 'CORS_ORIGIN env',    'env CORS_ORIGIN'),
        t('Cr',  'Credentials',     'Justificatifs',    'cookies travel',     'cookies voyagent'),
        t('TP',  'trust proxy',     'trust proxy',      'real client IP',     'vraie IP client'),
        t('gz',  'compression',     'compression',      'SSE excluded',       'SSE exclu'),
        t('TLS', 'TLS termination', 'Terminaison TLS',  'at load balancer',   'au répartiteur'),
      ]},
    { id: 'Up', name: { en: 'File upload', fr: 'Téléversement' },
      accent: '#a16207', tint: '#fefce8', border: '#fde047', tiles: [
        t('Mag',  'Magic bytes',     'Octets magiques',  'content sniff',      'reniflage du contenu'),
        t('MIME', 'MIME allowlist',  'Liste MIME',       'jpg, png, webp, pdf', 'jpg, png, webp, pdf'),
        t('UUID', 'UUID rename',     'Renommage UUID',   'no path traversal',  'pas de traversée de chemin'),
        t('10M',  '10 MB cap',       'Plafond 10 Mo',    'multer limit',       'limite multer'),
        t('Scn',  'Scanner adapter', 'Adaptateur scanner', 'clamav, defender', 'clamav, defender'),
        t('Sto',  'Store adapter',   'Adaptateur stockage', 's3, blob',         's3, blob'),
      ]},
    { id: 'Log', name: { en: 'Logging / audit', fr: 'Journaux / audit' },
      accent: '#0f766e', tint: '#f0fdfa', border: '#99f6e4', tiles: [
        t('WJ',  'Winston JSON',   'Winston JSON',     'production format', 'format production'),
        t('CID', 'Correlation-id', 'ID de corrélation', 'cross-line join',  'jointure inter-lignes'),
        t('Slw', 'Slow-req warn',  'Avertissement lent', '>1s gets warn',   '>1s passe en warn'),
        t('Au',  'audit_log',      'audit_log',        'every mutation',    'chaque mutation'),
        t('Rdr', 'PII redactor',   'Caviardage RP',    'log boundary',      'frontière des journaux'),
        t('Sev', 'Security event', 'Événement sécurité', 'client audit ping', 'ping d’audit client'),
      ]},
    { id: 'Sec', name: { en: 'Secrets / crypto', fr: 'Secrets / crypto' },
      accent: '#831843', tint: '#fdf2f8', border: '#fbcfe8', tiles: [
        t('RSA', 'RSA-2048',         'RSA-2048',           '4 PEM key pairs',     '4 paires de clés PEM'),
        t('KV',  'Secrets manager',  'Gestionnaire de secrets', 'AKV, ASM, GSM',  'AKV, ASM, GSM'),
        t('Env', 'Zod env',          'Env Zod',            'startup validation',  'validation au démarrage'),
        t('Plc', 'Placeholder gate', 'Garde marqueur',     'rejects in prod',     'rejette en prod'),
        t('DKG', 'Dev-key guard',    'Garde clé dev',      'Dockerfile check',    'vérif. Dockerfile'),
        t('Rot', 'Key rotation',     'Rotation des clés',  '15m natural rollover', 'rollover naturel 15min'),
      ]},
    { id: 'DB', name: { en: 'Database', fr: 'Base de données' },
      accent: '#1d4ed8', tint: '#eff6ff', border: '#93c5fd', tiles: [
        t('Pl',  'pg.Pool',           'pg.Pool',            'single pool',       'piscine unique'),
        t('St',  'statement_timeout', 'statement_timeout',  'runaway query cap', 'plafond requête'),
        t('SSL', 'SSL on Postgres',   'SSL sur Postgres',   'sslmode=require',   'sslmode=require'),
        t('Mig', 'Idempotent SQL',    'SQL idempotent',     'IF NOT EXISTS',     'IF NOT EXISTS'),
        t('Sm',  'schema_migration',  'schema_migration',   'applied tracker',   'suivi des migrations'),
        t('Pg',  'pgcrypto opt-in',   'pgcrypto en option', 'sensitive columns', 'colonnes sensibles'),
      ]},
    { id: 'Sup', name: { en: 'Supply chain', fr: 'Chaîne d’approvisionnement' },
      accent: '#b45309', tint: '#fffbeb', border: '#fcd34d', tiles: [
        t('nA',  'npm audit',      'npm audit',         'per package tree',  'par arborescence'),
        t('OSV', 'osv-scan',       'osv-scan',          'cross-ecosystem',   'multi-écosystème'),
        t('Ov',  'overrides',      'overrides',         'pinned CVE fixes',  'correctifs CVE épinglés'),
        t('Lc',  'license-check',  'license-check',     'GPL/AGPL guard',    'garde GPL/AGPL'),
        t('Dc',  'depcheck',       'depcheck',          'unused/missing',    'inutilisé/manquant'),
        t('Pin', 'Pinned base img', 'Image de base épinglée', 'node:20-alpine', 'node:20-alpine'),
        t('TH',  'TruffleHog',     'TruffleHog',        'history secrets',   'secrets dans l’historique'),
      ]},
    { id: 'DR', name: { en: 'Resilience', fr: 'Résilience' },
      accent: '#065f46', tint: '#ecfdf5', border: '#6ee7b7', tiles: [
        t('Bk',  'backup.sh',         'backup.sh',          'pg_dump cron',     'cron pg_dump'),
        t('Rs',  'restore.sh',        'restore.sh',         'prod guard',       'garde prod'),
        t('RTO', 'RTO 4h',            'RTO 4h',             'documented',       'documenté'),
        t('RPO', 'RPO 24h',           'RPO 24h',            'daily snapshot',   'instantané quotidien'),
        t('Liv', 'liveness',          'vivacité',           '/health/liveness', '/health/liveness'),
        t('Rdy', 'readiness',         'disponibilité',      'DB-aware probe',   'sonde liée à la BD'),
        t('GS',  'Graceful shutdown', 'Arrêt gracieux',     'WS, HTTP, pool',   'WS, HTTP, pool'),
      ]},
    { id: 'Test', name: { en: 'Tests / evals', fr: 'Tests / évals' },
      accent: '#5b21b6', tint: '#f5f3ff', border: '#c4b5fd', tiles: [
        t('Vt',  'Vitest x773',     'Vitest x773',      '81 suites',       '81 suites'),
        t('Sup', 'Supertest',       'Supertest',        'HTTP integration', 'intégration HTTP'),
        t('Pw',  'Playwright',      'Playwright',       'end-to-end',       'bout en bout'),
        t('Ax',  'Axe',             'Axe',              'a11y violations',  'violations a11y'),
        t('Lh',  'Lighthouse CI',   'Lighthouse CI',    'perf + a11y gates', 'portes perf + a11y'),
        t('FR',  'FR coverage',     'Couverture FR',    'mechanical gate',  'porte mécanique'),
        t('NFR', 'NFR coverage',    'Couverture NFR',   'mechanical gate',  'porte mécanique'),
        t('MIg', 'Migration idem',  'Migration idem',   'twice = same',     'deux fois = pareil'),
      ]},
    { id: 'AI', name: { en: 'AI safety', fr: 'Sécurité IA' },
      accent: '#9d174d', tint: '#fdf2f8', border: '#f9a8d4', tiles: [
        t('Abs', 'Provider iface',   'Interface fournisseur', 'swap at config',  'permutation à la config'),
        t('Grd', 'System guardrails', 'Garde-fous système',   'prompt injection', 'injection de prompt'),
        t('Rdr', 'PII redactor',     'Caviardage RP',         'before LLM call',  'avant appel LLM'),
        t('Yt',  'Yellowteam',       'Équipe jaune',          '12-rule audit',    'audit en 12 règles'),
        t('Bt',  'Blueteam',         'Équipe bleue',          'ASVS L2 + CAS',    'ASVS N2 + CAS'),
        t('Rt',  'Redteam',          'Équipe rouge',          'recon + planner',  'recon + planificateur'),
        t('Gt',  'Greenteam',        'Équipe verte',          '30 hygiene checks', '30 vérifs hygiène'),
      ]},
  ];

  const I18N = {
    en: {
      sr_summary: (n, c) => 'A periodic table of ' + n + ' security controls across ' + c + ' categories.',
      controls: 'controls',
      close: 'Close',
      implemented_at: 'Implemented at',
      hint: 'Full implementation notes for every control live in the harness reference page.',
      modal_eyebrow: 'control',
    },
    fr: {
      sr_summary: (n, c) => 'Un tableau périodique de ' + n + ' contrôles de sécurité sur ' + c + ' catégories.',
      controls: 'contrôles',
      close: 'Fermer',
      implemented_at: 'Implémenté à',
      hint: 'Les notes de mise en œuvre complètes vivent dans la page de référence du harnais.',
      modal_eyebrow: 'contrôle',
    },
  };

  function totalControls() {
    return CATEGORIES.reduce((n, c) => n + c.tiles.length, 0);
  }

  window.VWComponents['wp08-periodic'] = {
    props: {
      slide:  { type: Object, default: () => ({}) },
      config: { type: Object, default: () => ({}) },
    },
    data() {
      return {
        categories: CATEGORIES,
        total: totalControls(),
        selected: null,
      };
    },
    computed: {
      locale() {
        const l = (window.VWStore && window.VWStore.locale) || 'en';
        return l === 'fr' ? 'fr' : 'en';
      },
      t() { return I18N[this.locale]; },
    },
    methods: {
      open(cat, tile) { this.selected = { cat, tile }; },
      close() { this.selected = null; },
    },
    template: `
      <figure class="wp08-periodic" role="img"
              :aria-label="t.sr_summary(total, categories.length)">
        <div class="wp08-periodic-legend">
          <span v-for="cat in categories" :key="'lg-'+cat.id"
                class="wp08-periodic-chip"
                :style="{ borderColor: cat.accent, color: cat.accent }">
            <strong class="mono">{{ cat.id }}</strong>
            <span>{{ cat.name[locale] }}</span>
            <span class="ct">·&nbsp;{{ cat.tiles.length }}</span>
          </span>
        </div>
        <div class="wp08-periodic-grid">
          <div v-for="cat in categories" :key="cat.id" class="wp08-periodic-col">
            <div class="wp08-periodic-head" :style="{ background: cat.accent }">
              <div class="mono">{{ cat.id }}</div>
              <div class="nm">{{ cat.name[locale] }}</div>
              <div class="ct">{{ cat.tiles.length }} {{ t.controls }}</div>
            </div>
            <button v-for="(tile, i) in cat.tiles" :key="cat.id + '-' + i"
                    type="button"
                    class="wp08-periodic-tile"
                    :style="{ background: cat.tint, borderColor: cat.border }"
                    @click="open(cat, tile)"
                    :aria-label="tile.name[locale] + ', ' + cat.name[locale] + ', ' + tile.where[locale]">
              <div class="row">
                <span class="mono num">{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="mono cid" :style="{ color: cat.accent }">{{ cat.id }}</span>
              </div>
              <div class="sym" :style="{ color: cat.accent }">{{ tile.sym }}</div>
              <div class="nm">{{ tile.name[locale] }}</div>
              <div class="where">{{ tile.where[locale] }}</div>
            </button>
          </div>
        </div>

        <div class="wp08-periodic-totals">
          <div><strong>{{ total }}</strong> {{ t.controls }} · <strong>{{ categories.length }}</strong></div>
        </div>

        <div v-if="selected" class="wp08-periodic-modal" role="dialog" aria-modal="true" @click.self="close">
          <div class="wp08-periodic-modal-card" :style="{ borderColor: selected.cat.accent }">
            <header :style="{ background: selected.cat.accent }">
              <div class="mono">{{ selected.cat.id }} · {{ selected.cat.name[locale] }}</div>
              <button type="button" @click="close" :aria-label="t.close">×</button>
            </header>
            <div class="body">
              <div class="big" :style="{ color: selected.cat.accent }">{{ selected.tile.sym }}</div>
              <h4>{{ selected.tile.name[locale] }}</h4>
              <p class="where">{{ t.implemented_at }}: <span class="mono">{{ selected.tile.where[locale] }}</span></p>
              <p class="hint">{{ t.hint }}</p>
            </div>
          </div>
        </div>
      </figure>
    `,
  };
})();
