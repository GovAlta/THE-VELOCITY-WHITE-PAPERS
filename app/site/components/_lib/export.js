/* export.js — shared paper export helpers (window.VWExport).

   Used by PaperDownloads (single paper, on the paper page) and IndexTable
   (per-row Markdown + "Download all" zip, on the index). The Markdown is
   generated client-side from the paper JSON blocks so people can take the text
   away and analyze it with their own tools. No media is bundled — figures and
   videos are reduced to their captions/alt text and a link. */

(function () {
  const W = window;

  /* Locale-aware export labels + enumerated-value maps. Mirrors the binding
     French standard in docs/fr-style-guide.md §4 (and site.json's tier/track/
     status label maps). Keeping it self-contained means the Markdown export is
     correct for whichever locale is being exported, regardless of the caller's
     current UI locale. */
  const EXPORT_I18N = {
    en: {
      no: 'No.', authors: 'Authors', published: 'Published', tier: 'Tier', track: 'Track',
      status: 'Status', reading: 'Reading', repository: 'Repository', tags: 'Tags',
      abstract: 'Abstract', related: 'Related papers', video: 'Video', figure: 'Figure',
      keystat: 'Key statistic', note: 'Note', min: 'min',
      tier_labels: {}, track_labels: {}, status_labels: {},
    },
    fr: {
      no: 'Numéro', authors: 'Auteurs', published: 'Publié le', tier: 'Niveau', track: 'Volet',
      status: 'Statut', reading: 'Temps de lecture', repository: 'Dépôt', tags: 'Mots-clés',
      abstract: 'Résumé', related: 'Documents connexes', video: 'Vidéo', figure: 'Figure',
      keystat: 'Statistique clé', note: 'Note', min: 'min',
      tier_labels: { 'Conceptual': 'Conceptuel', 'Technical': 'Technique', 'Policy & People': 'Politiques et personnes' },
      track_labels: {
        'Defining the Problem': 'Définir le problème',
        'Engineering the Solution': 'Concevoir la solution',
        'Human and Change Management': 'Gestion des personnes et du changement',
        'Technical Appendix': 'Annexe technique',
        'Building the Systems': 'Bâtir les systèmes',
      },
      status_labels: { 'Published': 'Publié', 'Forthcoming': 'À venir', 'Draft': 'Ébauche', 'Placeholder': 'Réservé' },
    },
    es: {
      no: 'N.º', authors: 'Autores', published: 'Publicado', tier: 'Nivel', track: 'Eje',
      status: 'Estado', reading: 'Tiempo de lectura', repository: 'Repositorio', tags: 'Palabras clave',
      abstract: 'Resumen', related: 'Documentos relacionados', video: 'Vídeo', figure: 'Figura',
      keystat: 'Dato clave', note: 'Nota', min: 'min',
      tier_labels: { 'Conceptual': 'Conceptual', 'Technical': 'Técnico', 'Policy & People': 'Políticas y personas' },
      track_labels: {
        'Defining the Problem': 'Definir el problema',
        'Engineering the Solution': 'Diseñar la solución',
        'Human and Change Management': 'Gestión de personas y del cambio',
        'Technical Appendix': 'Anexo técnico',
        'Building the Systems': 'Construir los sistemas',
      },
      status_labels: { 'Published': 'Publicado', 'Forthcoming': 'Próximamente', 'Draft': 'Borrador', 'Placeholder': 'Reservado' },
    },
  };

  function stripHtml(s) { return String(s == null ? '' : s).replace(/<[^>]+>/g, ''); }
  function cell(s) { return stripHtml(s).replace(/\r?\n+/g, ' ').replace(/\|/g, '\\|').trim(); }

  function blocksToMarkdown(paper, loc) {
    const T = EXPORT_I18N[loc] || EXPORT_I18N.en;
    const map = (m, v) => (m && m[v]) || v;
    /* Tags are English slugs in the data; for the exported locale, display the
       label from that locale's ui.tag_labels (single source of truth in
       site.json), falling back to the slug when unmapped. */
    const tagMap = (W.VWStore && W.VWStore.site && W.VWStore.site.i18n
      && W.VWStore.site.i18n[loc] && W.VWStore.site.i18n[loc].ui
      && W.VWStore.site.i18n[loc].ui.tag_labels) || {};
    const tagList = (arr) => (arr || []).map((t) => tagMap[t] || t).join(', ');
    const L = [];
    L.push('# ' + (paper.title || ''));
    if (paper.subtitle) L.push('\n_' + stripHtml(paper.subtitle) + '_');

    const meta = [];
    if (paper.num) meta.push('**' + T.no + '** ' + paper.num);
    if (paper.authors && paper.authors.length) meta.push('**' + T.authors + ':** ' + paper.authors.join(', '));
    if (paper.published) meta.push('**' + T.published + ':** ' + paper.published);
    if (paper.tier) meta.push('**' + T.tier + ':** ' + map(T.tier_labels, paper.tier));
    if (paper.track) meta.push('**' + T.track + ':** ' + map(T.track_labels, paper.track));
    if (paper.status) meta.push('**' + T.status + ':** ' + map(T.status_labels, paper.status));
    if (paper.reading_min) meta.push('**' + T.reading + ':** ' + paper.reading_min + ' ' + T.min);
    if (paper.repo) meta.push('**' + T.repository + ':** ' + paper.repo);
    if (meta.length) L.push('\n' + meta.join('  \n'));
    if (paper.tags && paper.tags.length) L.push('\n**' + T.tags + ':** ' + tagList(paper.tags));
    if (paper.abstract) { L.push('\n## ' + T.abstract + '\n'); L.push(stripHtml(paper.abstract)); }

    for (const b of (paper.blocks || [])) {
      switch (b.type) {
        case 'section_heading':
          L.push('\n## §' + (b.n || '') + ' ' + (b.title || '')); break;
        case 'paragraph':
        case 'dropcap_paragraph':
          L.push('\n' + stripHtml(b.text)); break;
        case 'pullquote':
          L.push('\n> ' + stripHtml(b.text) + (b.cite ? '  \n> — ' + stripHtml(b.cite) : '')); break;
        case 'keystat':
          L.push('\n**' + (b.label || T.keystat) + ': ' + (b.value != null ? b.value : '') + '**');
          if (b.body) L.push('\n' + stripHtml(b.body));
          break;
        case 'sidenote':
          L.push('\n> **' + (b.label || T.note) + '** — ' + stripHtml(b.value)); break;
        case 'figure': {
          const cap = b.caption ? stripHtml(b.caption) : '';
          const alt = (b.image && b.image.alt) ? stripHtml(b.image.alt) : '';
          L.push('\n_' + T.figure + ' ' + (b.fno || '') + (b.title ? ' — ' + b.title : '') + '_');
          if (cap) L.push('\n' + cap);
          if (alt && alt !== cap) L.push('\n<!-- image: ' + alt + ' -->');
          break;
        }
        case 'table': {
          if (b.title) L.push('\n### ' + b.title);
          const cols = b.columns || [];
          if (cols.length) {
            L.push('\n| ' + cols.map(cell).join(' | ') + ' |');
            L.push('| ' + cols.map(() => '---').join(' | ') + ' |');
            for (const row of (b.rows || [])) L.push('| ' + (row || []).map(cell).join(' | ') + ' |');
          }
          break;
        }
        case 'youtube': {
          const label = b.caption ? stripHtml(b.caption) : (b.title || T.video);
          L.push('\n**' + T.video + ':** ' + label + (b.url ? ' — ' + b.url : '')); break;
        }
        case 'tag_row':
          if ((b.tags || []).length) L.push('\n**' + T.tags + ':** ' + tagList(b.tags)); break;
        case 'related':
          if ((paper.related || []).length) L.push('\n**' + T.related + ':** ' + paper.related.join(', ')); break;
        default: break;
      }
    }
    return L.join('\n') + '\n';
  }

  function download(name, mime, content) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function fetchPaper(id, loc) {
    const r = await fetch('data/papers/' + id + '.' + (loc || 'en') + '.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + id);
    return r.json();
  }

  /* Lazily load JSZip from a CDN, only when "Download all" is first clicked. */
  let _zipP = null;
  function ensureJSZip() {
    if (W.JSZip) return Promise.resolve(W.JSZip);
    if (_zipP) return _zipP;
    _zipP = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      s.onload = () => resolve(W.JSZip);
      s.onerror = () => { _zipP = null; reject(new Error('Could not load the zip library.')); };
      document.head.appendChild(s);
    });
    return _zipP;
  }

  /* Build and download a zip of every paper's JSON + generated Markdown for the
     given locale. `papers` is the index list (needs id + num). No media. */
  async function downloadAll(papers, loc) {
    const JSZip = await ensureJSZip();
    const zip = new JSZip();
    const root = 'velocity-whitepapers-' + (loc || 'en');
    const folder = zip.folder(root);
    const docs = await Promise.all((papers || []).map(async (p) => {
      try { return { num: p.num, id: p.id, doc: await fetchPaper(p.id, loc) }; }
      catch (e) { return null; }
    }));
    let n = 0;
    for (const r of docs.filter(Boolean)) {
      const base = (r.num ? r.num + '-' : '') + r.id;
      folder.file(base + '.json', JSON.stringify(r.doc, null, 2));
      folder.file(base + '.md', blocksToMarkdown(r.doc, loc));
      n++;
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    download(root + '.zip', 'application/zip', blob);
    return n;
  }

  W.VWExport = { blocksToMarkdown, download, fetchPaper, ensureJSZip, downloadAll };
})();
