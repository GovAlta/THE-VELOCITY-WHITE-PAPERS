/* ManualPage — operator's manual: the steps a human and an AI take to populate
   and run this CMS. English (the operating language for the tooling); the
   bilingual part is the reader-facing paper content. Static page.

   Reader-visible prose here follows style-guide/00: plain declarative sentences,
   no em dashes, no "not X" constructions, no banned vocabulary. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['manual-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    template: `
      <div v-if="store.ready" class="civic-doc-page">
        <section class="civic-hero">
          <div class="civic-eyebrow"><span class="dot"></span><span>Operator's manual</span><span>·</span><span>Local authoring</span></div>
          <h1>How this platform is built and run</h1>
          <p class="lede">The Velocity White Papers are a static, bilingual, open-source site. Vue runs from a CDN, the content is JSON, images and audio are files, and GitHub Pages serves the result. There is no backend in production. You author locally through a dev-only editor, and the published site stays read-only. This page sets out how to fill it and ship it.</p>
        </section>

        <section class="civic-section"><div class="head"><h2>Who does what</h2></div></section>
        <div class="manual-body">
          <p>The human is the architect, the author, and the reviewer. You decide the collection, the order, the argument of each paper, and the voice. You accept or reject every AI suggestion. Nothing the AI produces reaches a file without your sign-off.</p>
          <p>The AI drafts, refines, translates, and generates assets, always as proposals. It scaffolds a body from your raw material, tightens prose against the style guides, translates a paper into the other language, and produces imagery and narration. It never invents facts, and it never publishes on its own.</p>
        </div>

        <section class="civic-section"><div class="head"><h2>Start the editor</h2></div></section>
        <div class="manual-body">
          <p>From <code>app/site</code>, run <code>npm run edit</code>. This serves the site at <code>127.0.0.1:5173</code> and turns editing on. The gate is local-only, so the public site can never be edited. The server reads <code>.env</code> for the Vertex service account (Claude), the OpenAI key (images), and the ElevenLabs key (audio). Open the site and click <strong>Edit</strong> in the toolbar.</p>
          <p>Run <code>npm run dev</code> for a read-only preview with no editor. Run <code>npm run preview</code> to serve the site through the same server without turning editing on.</p>
        </div>

        <section class="civic-section"><div class="head"><h2>The life of a paper</h2><div class="meta">add, draft, refine, assets, translate, publish</div></div></section>
        <div class="manual-body">
          <ol class="manual-steps">
            <li><strong>Add it to the collection.</strong> On the Index at <code>#/index</code> in edit mode, use <strong>+ Add paper</strong> and give it an id, a title, and a tier. The number and the sequence are derived from order position. Reorder with the up and down controls and the numbering follows. <code>data/papers.json</code> is generated, so you never edit it by hand.</li>
            <li><strong>Draft the body.</strong> Build from scratch, or paste a rough Markdown draft and let the AI fill the paper schema: sections, paragraphs, TL;DR, and metadata. When the source is mixed, the source hierarchy applies. Your prose is the spine, the code is the technical ground truth, and transcripts are third-order and never quoted verbatim.</li>
            <li><strong>Refine the prose.</strong> Use <strong>AI</strong> on a paragraph, <strong>Revise §</strong> on a section, or <strong>Revise paper</strong>. Pick style guides or give direction, choose Sonnet for speed or Opus for the heavier passes, then accept or reject each change. The guides apply to the prose the AI generates. They leave your own wording alone.</li>
            <li><strong>Generate the imagery.</strong> On each figure or slide, write an image prompt and click <strong>Generate</strong> or <strong>Regenerate</strong>. The image is produced from the prompt and saved with a metadata sidecar, and the inspector shows the prompt that made it.</li>
            <li><strong>Generate the narration.</strong> In the TL;DR slide editor, write each slide's narration and click <strong>Generate narration</strong>. The full-paper audio comes from the script through <code>npm run generate:audio</code>.</li>
            <li><strong>Translate and build the other language.</strong> Set the canonical primary locale, then use <strong>Translate</strong>. It clones the structure into the target language, translates every string, and regenerates the target images and audio. The target is overwritten. A sync chip shows when a translation falls behind its source.</li>
            <li><strong>Publish.</strong> Set the paper's status to Published. It then appears on the home page and counts in the sequence. Save, then commit and push.</li>
          </ol>
        </div>

        <section class="civic-section"><div class="head"><h2>What the editor changes</h2></div></section>
        <div class="manual-body">
          <p>In edit mode you click any heading, paragraph, abstract, title, caption, or narration to edit its source, and the Markdown renders when you click off. You reorder, insert, and delete blocks. You reorder, add, and delete TL;DR slides. You edit figure prompts and captions. You edit paper metadata such as tier, status, read time, and tags. The contents menu reorders sections by drag and renumbers them. The Guides panel lets you curate the editable style guides. Save writes back to the JSON through the local edit-server.</p>
        </div>

        <section class="civic-section"><div class="head"><h2>Voice and substance</h2></div></section>
        <div class="manual-body">
          <p>Two disciplines govern every reader-visible string. Substance comes first. Every claim traces to a source, every number says what it measures, and nothing is invented. Voice comes second. Match the author's exemplar, which is flowing, first person, and specific. Treat the style rules as a list of things to avoid adding. Do not use them to flatten the author's own sentences. When the author wrote the words, the words stand, and the AI fixes only what is wrong.</p>
        </div>

        <section class="civic-section"><div class="head"><h2>How it is stored and shipped</h2></div></section>
        <div class="manual-body">
          <p>Each paper is two JSON files, <code>&lt;id&gt;.en.json</code> and <code>&lt;id&gt;.fr.json</code>, under <code>data/papers</code>. The inventory <code>data/papers.json</code> and the numbers are generated from <code>data/order.json</code> and the primary files, so they cannot drift. Images and audio live under <code>public</code>. You work locally, commit, and push to GitHub, and GitHub Pages serves the static result. Secrets, internal source material, and recordings stay out of the repository.</p>
        </div>

        <app-footer />
      </div>
      <div v-else style="padding:80px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">Loading…</div>
    `,
  };
})();
