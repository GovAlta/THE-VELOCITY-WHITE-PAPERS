/* PaperDownloads — JSON + Markdown download for a paper.
   The JSON is the paper's own data file (browser fetches and re-saves).
   The Markdown is generated client-side from the JSON blocks. Shared export
   helpers live in components/_lib/export.js (window.VWExport). */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['paper-downloads'] = {
    props: { paper: { type: Object, required: true } },
    setup() { return { store: window.VWStore }; },
    methods: {
      downloadJSON() {
        window.VWExport.download(
          this.paper.id + '.' + (this.store.locale || 'en') + '.json',
          'application/json',
          JSON.stringify(this.paper, null, 2)
        );
      },
      downloadMD() {
        window.VWExport.download(
          this.paper.id + '.' + (this.store.locale || 'en') + '.md',
          'text/markdown',
          window.VWExport.blocksToMarkdown(this.paper)
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
