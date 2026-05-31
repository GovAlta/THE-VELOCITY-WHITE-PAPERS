/* ManualPage — operator's manual: the end-to-end steps a human and an AI take
   to populate and run this CMS. Written in English (the operating language for
   the tooling); reader-facing paper content is the bilingual part. Static page,
   no data dependency beyond the store for the nav/locale chrome. */

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
          <p class="lede">The Velocity White Papers are a static, bilingual, open-source site: Vue from a CDN, content as JSON, images and audio as files, served from GitHub Pages. There is no backend in production. Authoring happens locally through a dev-only editor; the published site is read-only. This page is the field manual for filling it and shipping it.</p>
        </section>

        <section class="civic-section"><div class="head"><h2>Who does what</h2></div></section>
        <div class="manual-body">
          <p><strong>The human is the architect, author, and reviewer.</strong> You decide the collection, the order, the argument of each paper, and the voice. You accept or reject every AI suggestion. Nothing the AI produces reaches a file without your sign-off.</p>
          <p><strong>The AI drafts, refines, translates, and generates assets — always as proposals.</strong> It scaffolds a body from your raw material, tightens prose against the style guides, translates a paper into the other language, and generates imagery and narration. It never invents facts and never publishes on its own.</p>
        </div>

        <section class="civic-section"><div class="head"><h2>Start the editor</h2></div></section>
        <div class="manual-body">
          <p>From <code>app/site</code>, run <code>npm run edit</code>. This serves the site at <code>127.0.0.1:5173</code> <em>and</em> turns on editing (the gate is local-only, so the public site can never be edited). It needs <code>.env</code> with the Vertex service account (Claude), the OpenAI key (images), and the ElevenLabs key (audio). Open the site, click <strong>Edit</strong> in the bottom-right toolbar.</p>
          <p>Use <code>npm run dev</code> for a plain read-only preview (no editor), and <code>npm run preview</code> to run the server without enabling editing.</p>
        </div>

        <section class="civic-section"><div class="head"><h2>The life of a paper</h2><div class="meta">add → draft → refine → assets → translate → publish</div></div></section>
        <div class="manual-body">
          <ol class="manual-steps">
            <li><strong>Add it to the collection.</strong> On the Index (<code>#/index</code>) in edit mode, use <strong>+ Add paper</strong> (id, title, tier). The number and sequence are <em>derived</em> from order position — reorder with the ↑ ↓ controls and the numbering follows. <code>data/papers.json</code> is generated; you never edit it by hand.</li>
            <li><strong>Draft the body.</strong> Build from scratch, or paste a rough Markdown draft and let the AI fill the paper schema (sections, paragraphs, TL;DR, metadata) — see <em>Draft from Markdown</em>. When the source is mixed (your prose + code + transcripts), the source hierarchy applies: your prose is the spine, the code is technical ground truth, transcripts are third-order and never quoted verbatim.</li>
            <li><strong>Refine the prose.</strong> Use <strong>AI</strong> on a paragraph, <strong>Revise §</strong> on a section, or <strong>Revise paper</strong> — pick style guides and/or give direction, choose Sonnet (fast) or Opus (stronger), then accept or reject each change. The guides are a filter on generated prose, not a license to rewrite your voice.</li>
            <li><strong>Generate imagery.</strong> On each figure or slide, write an image prompt and click <strong>Generate</strong> (or <strong>Regenerate</strong>). Images are produced from the prompt and saved with a metadata sidecar; the inspector shows the prompt that made each one.</li>
            <li><strong>Generate narration.</strong> In the TL;DR slide editor, write each slide's narration and click <strong>Generate narration</strong>. The full-paper audio is produced from the script via <code>npm run generate:audio</code>.</li>
            <li><strong>Translate &amp; build the other language.</strong> Set the canonical <strong>primary locale</strong>, then use <strong>Translate</strong>: it clones the structure into the target language, translates every string, and regenerates the target images (matched to the source) and audio. It overwrites the target; a sync chip shows when a translation is behind its source.</li>
            <li><strong>Publish.</strong> Set the paper's <strong>status</strong> to Published. It then appears on the home page and counts in the sequence. Save, then commit and push.</li>
          </ol>
        </div>

        <section class="civic-section"><div class="head"><h2>What the editor lets you change</h2></div></section>
        <div class="manual-body">
          <p>In edit mode: click any heading, paragraph, abstract, title, caption, or narration to edit its source (Markdown renders on blur); reorder, insert, and delete blocks; reorder, add, and delete TL;DR slides; edit figure prompts and captions; edit paper metadata (tier, status, read time, tags). The contents menu reorders sections by drag, and renumbers automatically. Curate the editable style guides through the <strong>Guides</strong> panel. Save writes back to the JSON through the local edit-server.</p>
        </div>

        <section class="civic-section"><div class="head"><h2>Voice and substance</h2></div></section>
        <div class="manual-body">
          <p>Two disciplines govern every reader-visible string. <strong>Substance</strong>: every claim traces to a source, every number says what it measures, no invented facts. <strong>Voice</strong>: match the author's exemplar — flowing, first-person, specific — and treat the style rules as a list of things <em>not</em> to add, never as a reason to flatten the author's own sentences. When the author wrote the words, the words win; the AI fixes only what is wrong.</p>
        </div>

        <section class="civic-section"><div class="head"><h2>How it is stored and shipped</h2></div></section>
        <div class="manual-body">
          <p>Each paper is two JSON files, <code>&lt;id&gt;.en.json</code> and <code>&lt;id&gt;.fr.json</code>, under <code>data/papers</code>. The inventory <code>data/papers.json</code> and the numbers are generated from <code>data/order.json</code> plus the primary files, so they cannot drift. Images and audio live under <code>public/</code>. You work locally, commit, and push to GitHub; GitHub Pages serves the static result. Secrets, internal source material, and recordings stay out of the repository.</p>
        </div>

        <app-footer />
      </div>
      <div v-else style="padding:80px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">Loading…</div>
    `,
  };
})();
