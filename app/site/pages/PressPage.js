/* PressPage — media background, the news release, and contacts.
   Data-driven and bilingual: data/pages/press.<locale>.json. The release body
   mirrors public/press/velocity-white-papers-press-release.md; the official PDF,
   when supplied, is linked from doc.release.pdf.href. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['press-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { doc: null, error: null, pdfReady: false }; },
    computed: {
      loadKey() { return this.store.locale || 'en'; },
    },
    watch: { loadKey: { handler: 'load', immediate: true } },
    methods: {
      async load() {
        try {
          this.doc = await window.VWLoadPageData('press', this.store.locale);
          this.pdfReady = false;
          const href = this.doc && this.doc.release && this.doc.release.pdf && this.doc.release.pdf.href;
          if (href) {
            try { this.pdfReady = (await fetch(href, { method: 'HEAD' })).ok; } catch { this.pdfReady = false; }
          }
        } catch (e) { this.error = e.message; }
      },
    },
    template: `
      <div v-if="doc">
        <section class="civic-hero">
          <div class="civic-eyebrow"><span class="dot"></span><span>{{ doc.page.eyebrow }}</span></div>
          <h1>{{ doc.page.title_lead }} <em>{{ doc.page.title_em }}</em></h1>
          <p class="lede">{{ doc.page.lede }}</p>
        </section>

        <section class="civic-section" v-if="doc.release">
          <div class="head">
            <h2>{{ doc.release.heading }}</h2>
            <div class="meta" v-if="doc.release.meta">{{ doc.release.meta }}</div>
          </div>
          <div style="max-width:64ch;padding-bottom:24px;">
            <p v-if="doc.release.coming_soon"
               style="font-family:var(--font-mono);font-size:13px;color:var(--ink-50);letter-spacing:0.02em;">
              {{ doc.release.coming_soon }}
            </p>
            <template v-else>
              <p v-if="doc.release.draft_note"
                 style="font-family:var(--font-mono);font-size:11px;color:var(--highlight);border:1px solid var(--rule);padding:8px 12px;border-radius:6px;display:inline-block;margin-bottom:8px;">
                {{ doc.release.draft_note }}
              </p>
              <h3 v-if="doc.release.title"
                  style="font-size:24px;line-height:1.2;letter-spacing:-0.01em;margin:0 0 6px;color:var(--ink);">{{ doc.release.title }}</h3>
              <p v-if="doc.release.subhead"
                 style="font-size:16px;line-height:1.55;color:var(--ink-70);margin:0 0 18px;font-style:italic;">{{ doc.release.subhead }}</p>

              <p v-for="(p,i) in (doc.release.paras || [])" :key="i"
                 style="color:var(--ink-70);font-size:15px;line-height:1.7;">{{ p }}</p>

              <blockquote v-if="doc.release.quote"
                          style="margin:18px 0;padding-left:18px;border-left:3px solid var(--accent);">
                <p style="font-size:17px;line-height:1.6;color:var(--ink);">"{{ doc.release.quote.text }}"</p>
                <footer style="font-family:var(--font-mono);font-size:11px;color:var(--ink-50);margin-top:8px;">— {{ doc.release.quote.by }}</footer>
              </blockquote>

              <p v-for="(p,i) in (doc.release.closing || [])" :key="'c'+i"
                 style="color:var(--ink-70);font-size:15px;line-height:1.7;">{{ p }}</p>

              <template v-if="(doc.release.endorsements || []).length">
                <h3 v-if="doc.release.endorsements_heading"
                    style="font-family:var(--font-mono);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-50);margin:24px 0 4px;">{{ doc.release.endorsements_heading }}</h3>
                <blockquote v-for="(q,i) in doc.release.endorsements" :key="'e'+i"
                            style="margin:14px 0;padding-left:16px;border-left:2px solid var(--rule);">
                  <p style="font-size:15px;line-height:1.6;color:var(--ink-70);">"{{ q.text }}"</p>
                  <footer style="font-family:var(--font-mono);font-size:11px;color:var(--ink-50);margin-top:6px;">— {{ q.by }}</footer>
                </blockquote>
              </template>

              <p v-if="doc.release.source" style="margin-top:18px;">
                <a :href="doc.release.source.href" target="_blank" rel="noopener"
                   style="font-family:var(--font-mono);font-size:12px;color:var(--accent);">{{ doc.release.source.label }} →</a>
              </p>

              <div v-if="doc.release.pdf" style="margin-top:18px;">
                <a v-if="pdfReady" :href="doc.release.pdf.href" download
                   style="display:inline-block;font-family:var(--font-mono);font-size:12px;padding:10px 16px;background:var(--accent);color:#fff;border-radius:8px;text-decoration:none;">
                  {{ doc.release.pdf.label }}
                </a>
                <p v-else style="font-family:var(--font-mono);font-size:11px;color:var(--ink-50);">{{ doc.release.pdf.pending_note }}</p>
              </div>
            </template>
          </div>
        </section>

        <section class="civic-section" v-if="doc.coverage && (doc.coverage.items || []).length">
          <div class="head">
            <h2>{{ doc.coverage.heading }}</h2>
          </div>
          <ul style="list-style:none;padding:0;margin:0;border-top:1px solid var(--rule);max-width:64ch;">
            <li v-for="item in doc.coverage.items" :key="item.href"
                style="padding:16px 0;border-bottom:1px solid var(--rule);">
              <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-50);margin-bottom:4px;">
                {{ item.source }}<span v-if="item.date"> · {{ item.date }}</span>
              </div>
              <a :href="item.href" target="_blank" rel="noopener"
                 style="font-weight:600;font-size:16px;line-height:1.35;color:var(--ink);text-decoration:none;">{{ item.title }} →</a>
              <p v-if="item.summary" style="color:var(--ink-70);font-size:14px;line-height:1.6;margin:6px 0 0;">{{ item.summary }}</p>
            </li>
          </ul>
        </section>

        <section class="civic-section" v-if="doc.contacts">
          <div class="head">
            <h2>{{ doc.contacts.heading }}</h2>
          </div>
          <ul style="list-style:none;padding:0;margin:0;border-top:1px solid var(--rule);max-width:64ch;">
            <li v-for="c in doc.contacts.items" :key="c.email"
                style="padding:14px 0;border-bottom:1px solid var(--rule);">
              <div style="font-weight:600;font-size:15px;">{{ c.name }}</div>
              <div v-if="c.role" style="color:var(--ink-70);font-size:13px;">{{ c.role }}</div>
              <a :href="'mailto:' + c.email" style="font-family:var(--font-mono);font-size:12px;color:var(--accent);">{{ c.email }}</a>
            </li>
          </ul>
          <p v-if="doc.contacts.substack" style="margin-top:16px;">
            <a :href="doc.contacts.substack.href" target="_blank" rel="noopener"
               style="font-family:var(--font-mono);font-size:12px;color:var(--accent);">{{ doc.contacts.substack.label }} →</a>
          </p>
        </section>

        <app-footer />
      </div>
      <div v-else-if="error" style="padding:80px 56px;color:var(--highlight);font-family:var(--font-mono);font-size:12px;">{{ error }}</div>
    `,
  };
})();
