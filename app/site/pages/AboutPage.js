/* AboutPage — open source, license, methodology, contact.
   Content is data-driven and bilingual: data/pages/about.<locale>.json, loaded
   per locale and reloaded when the locale changes.

   Editable in dev edit mode (npm run edit): every reader-visible string is an
   <editable-text> bound to the loaded doc, and the in-page Save button writes
   the whole doc back to data/pages/about.<locale>.json through the same
   /api/save-json endpoint the papers use. Outside edit mode it renders plainly. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['about-page'] = {
    setup() { return { store: window.VWStore, edit: window.VWEdit || null }; },
    data() { return { doc: null, error: null, saving: false, saveMsg: '' }; },
    computed: {
      loadKey() { return this.store.locale || 'en'; },
      editing() { return !!(this.edit && this.edit.enabled); },
    },
    watch: { loadKey: { handler: 'load', immediate: true } },
    methods: {
      async load() {
        try { this.doc = await window.VWLoadPageData('about', this.store.locale); this.saveMsg = ''; }
        catch (e) { this.error = e.message; }
      },
      async save() {
        if (!this.edit || !this.doc || this.saving) return;
        // A field being edited is a contenteditable that only commits on blur;
        // blur it first so the latest keystrokes make it into the doc.
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        await this.$nextTick();
        this.saving = true; this.saveMsg = '';
        const locale = this.store.locale || 'en';
        const path = 'data/pages/about.' + locale + '.json';
        const r = await this.edit._writeJson(path, this.doc);
        this.saving = false;
        if (r && r.ok) { this.saveMsg = 'Saved ' + path; if (this.edit) this.edit.dirty = false; }
        else { this.saveMsg = (this.edit && this.edit.status) || 'Save failed. Run "npm run edit".'; }
      },
    },
    template: `
      <div v-if="doc">
        <div v-if="editing" style="position:fixed;left:20px;bottom:20px;z-index:50;display:flex;flex-direction:column;gap:6px;align-items:flex-start;">
          <span v-if="saveMsg" style="font-family:var(--font-mono);font-size:10px;color:var(--ink-70);background:var(--paper,#fff);padding:3px 7px;border:1px solid var(--rule);border-radius:4px;">{{ saveMsg }}</span>
          <button @click="save" :disabled="saving" aria-label="Save the About page"
                  style="font-family:var(--font-mono);font-size:12px;padding:10px 16px;border:none;background:var(--accent);color:#fff;border-radius:8px;cursor:pointer;">
            {{ saving ? 'Saving…' : 'Save About page' }}
          </button>
        </div>

        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <editable-text tag="span" :obj="doc" field="eyebrow" />
          </div>
          <h1><editable-text tag="span" :obj="doc" field="title_lead" /> <em><editable-text tag="span" :obj="doc" field="title_em" /></em></h1>
          <editable-text tag="p" cls="lede" :obj="doc" field="lede" :html="true" />
          <editable-text v-if="doc.disclaimer != null" tag="p" cls="about-disclaimer" :obj="doc" field="disclaimer" :html="true" />
          <audio-player v-if="doc.audio && doc.audio.src" :src="doc.audio.src"
                        :label="(store.t.ui && store.t.ui.narration) || 'Narration'" />
        </section>

        <section v-if="doc.created" class="civic-section">
          <div class="head">
            <h2><editable-text tag="span" :obj="doc.created" field="heading" /></h2>
            <div class="meta"><editable-text tag="span" :obj="doc.created" field="meta" /></div>
          </div>
          <div class="about-method">
            <div class="about-prose">
              <editable-text v-for="(p, i) in doc.created.paras" :key="i" tag="p" :obj="doc.created.paras" :field="i" :html="true" />
            </div>
            <aside v-if="doc.created.images && doc.created.images.length" class="about-figs" aria-label="Photographs from the walks">
              <img v-for="(img, i) in doc.created.images" :key="i" :src="img.src" :alt="img.alt" loading="lazy" />
              <editable-text v-if="doc.created.images_caption != null" tag="p" cls="about-figs-cap" :obj="doc.created" field="images_caption" />
            </aside>
          </div>
        </section>

        <section v-if="doc.tools" class="civic-section">
          <div class="head">
            <h2><editable-text tag="span" :obj="doc.tools" field="heading" /></h2>
            <div class="meta"><editable-text tag="span" :obj="doc.tools" field="meta" /></div>
          </div>
          <div style="padding-bottom:24px;max-width:60ch;color:var(--ink-70);font-size:15px;line-height:1.7;">
            <editable-text v-for="(p, i) in doc.tools.paras" :key="i" tag="p" :obj="doc.tools.paras" :field="i" :html="true" />
          </div>
        </section>

        <section v-if="doc.platform" class="civic-section">
          <div class="head">
            <h2><editable-text tag="span" :obj="doc.platform" field="heading" /></h2>
            <div class="meta"><editable-text tag="span" :obj="doc.platform" field="meta" /></div>
          </div>
          <div style="padding-bottom:24px;max-width:60ch;color:var(--ink-70);font-size:15px;line-height:1.7;">
            <editable-text v-for="(p, i) in doc.platform.paras" :key="i" tag="p" :obj="doc.platform.paras" :field="i" :html="true" />
          </div>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2><editable-text tag="span" :obj="doc.use" field="heading" /></h2>
            <div class="meta"><editable-text tag="span" :obj="doc.use" field="meta" /></div>
          </div>
          <div style="padding-bottom:24px;max-width:60ch;color:var(--ink-70);font-size:15px;line-height:1.7;">
            <editable-text v-for="(p, i) in doc.use.paras" :key="i" tag="p" :obj="doc.use.paras" :field="i" :html="true" />
          </div>
        </section>

        <section v-if="doc.living" class="civic-section">
          <div class="head">
            <h2><editable-text tag="span" :obj="doc.living" field="heading" /></h2>
            <div class="meta"><editable-text tag="span" :obj="doc.living" field="meta" /></div>
          </div>
          <div style="padding-bottom:24px;max-width:60ch;color:var(--ink-70);font-size:15px;line-height:1.7;">
            <editable-text v-for="(p, i) in doc.living.paras" :key="i" tag="p" :obj="doc.living.paras" :field="i" :html="true" />
          </div>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2><editable-text tag="span" :obj="doc.also" field="heading" /></h2>
            <div class="meta"><editable-text tag="span" :obj="doc.also" field="meta" /></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding-bottom:24px;">
            <a v-for="c in doc.also.cards" :key="c.href" :href="editing ? null : c.href" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head"><span class="num">→</span><editable-text tag="span" :obj="c" field="tag" /></div>
              <h3><editable-text tag="span" :obj="c" field="title" /></h3>
            </a>
          </div>
        </section>

        <app-footer />
      </div>
      <div v-else-if="error" style="padding:80px 56px;color:var(--highlight);font-family:var(--font-mono);font-size:12px;">{{ error }}</div>
    `,
  };
})();
