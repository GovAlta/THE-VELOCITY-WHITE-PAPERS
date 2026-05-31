/* PaperDownloads — JSON + Markdown download for a paper.
   The JSON is the paper's own data file (browser fetches and re-saves).
   The Markdown is generated client-side from the JSON blocks. */

(function () {
  window.VWComponents = window.VWComponents || {};

  function blocksToMarkdown(paper) {
    const lines = [];
    lines.push('# ' + (paper.title || ''));
    if (paper.subtitle) lines.push('\n_' + paper.subtitle + '_\n');
    if (paper.authors && paper.authors.length) lines.push('\n**Authors:** ' + paper.authors.join(', '));
    if (paper.published) lines.push('\n**Published:** ' + paper.published);
    if (paper.tier)      lines.push('\n**Tier:** ' + paper.tier);
    if (paper.status)    lines.push('\n**Status:** ' + paper.status);
    if (paper.repo)      lines.push('\n**Repository:** ' + paper.repo);
    if (paper.abstract) {
      lines.push('\n## Abstract\n');
      lines.push(paper.abstract);
    }
    for (const b of (paper.blocks || [])) {
      if (b.type === 'section_heading') lines.push('\n## §' + (b.n || '') + ' ' + (b.title || ''));
      else if (b.type === 'paragraph' || b.type === 'dropcap_paragraph') {
        lines.push('\n' + String(b.text || '').replace(/<[^>]+>/g, ''));
      }
      else if (b.type === 'pullquote') lines.push('\n> ' + (b.text || '') + (b.cite ? '  \n> — ' + b.cite : ''));
      else if (b.type === 'keystat') {
        lines.push('\n**' + (b.label || 'Key statistic') + ': ' + b.value + '**  ');
        if (b.body) lines.push((b.body || '').replace(/<[^>]+>/g, ''));
      }
      else if (b.type === 'figure') {
        lines.push('\n_Figure ' + (b.fno || '') + (b.title ? ' — ' + b.title : '') + '_');
        if (b.caption) lines.push('\n' + b.caption);
      }
      else if (b.type === 'sidenote') lines.push('\n> **' + (b.label || 'Note') + '** — ' + (b.value || ''));
      else if (b.type === 'tag_row' && (b.tags || []).length) lines.push('\n**Tags:** ' + b.tags.join(', '));
    }
    return lines.join('\n');
  }

  function download(name, mime, content) {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.VWComponents['paper-downloads'] = {
    props: { paper: { type: Object, required: true } },
    setup() { return { store: window.VWStore }; },
    methods: {
      downloadJSON() {
        download(
          this.paper.id + '.' + (this.store.locale || 'en') + '.json',
          'application/json',
          JSON.stringify(this.paper, null, 2)
        );
      },
      downloadMD() {
        download(
          this.paper.id + '.' + (this.store.locale || 'en') + '.md',
          'text/markdown',
          blocksToMarkdown(this.paper)
        );
      },
    },
    template: `
      <div class="paper-downloads">
        <span class="pd-lbl">{{ store.locale === 'fr' ? 'Télécharger' : 'Download' }}</span>
        <button class="pd-btn" @click="downloadMD">Markdown</button>
        <button class="pd-btn" @click="downloadJSON">JSON</button>
      </div>
    `,
  };
})();
