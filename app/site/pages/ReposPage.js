/* ReposPage — public repositories, data-driven and bilingual from data/repos.json
   (store.reposDoc). The list, the categories, the count, and each repo's paper
   link are all derived from that one file; nothing here is hardcoded by quantity
   or name. A repo may link to a paper, and a paper may have more than one repo. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['repos-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    computed: {
      loc() { return this.store.locale || 'en'; },
      doc() { return this.store.reposDoc || { page: {}, categories: [], repos: [] }; },
      pg() { return this.doc.page || {}; },
      categories() { return this.doc.categories || []; },
      repos() { return this.doc.repos || []; },
      requestEmail() { return this.pg.request_email || ''; },
    },
    methods: {
      tx(node) { if (!node) return ''; if (typeof node === 'string') return node; return node[this.loc] || node.en || ''; },
      reposByCat(id) { return this.repos.filter(r => r.category === id); },
      catLicense(cat) { return cat.license || ''; },
      statusClass(r) { return !r.available ? 'soon' : (r.private ? 'private' : 'published'); },
      statusText(r) { return this.tx(!r.available ? this.pg.soon : (r.private ? this.pg.private : this.pg.live)); },
      paperTitle(r) {
        const p = r.paper && this.store.paperById[r.paper];
        if (!p) return '';
        const i = p.i18n && p.i18n[this.loc];
        return (i && i.title) || p.title || '';
      },
      openPaper(id) { if (id) this.$emit('navigate', { page: 'paper', id }); },
    },
    template: `
      <div v-if="store.ready">
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ tx(pg.eyebrow) }}</span>
            <span>·</span>
            <span>{{ repos.length }} {{ tx(pg.repos_word) }}</span>
          </div>
          <h1>{{ tx(pg.title_lead) }} <em>{{ tx(pg.title_em) }}</em></h1>
          <p class="lede">{{ tx(pg.lede) }}</p>
        </section>

        <section class="civic-section" v-for="cat in categories" :key="cat.id" v-show="reposByCat(cat.id).length">
          <div class="head">
            <h2>{{ tx(cat.label) }}</h2>
            <div class="meta">{{ reposByCat(cat.id).length }} {{ tx(pg.repos_word) }}</div>
          </div>
          <p class="repo-cat-note" v-if="cat.note">{{ tx(cat.note) }}</p>
          <ul class="repo-list">
            <li v-for="(r, i) in reposByCat(cat.id)" :key="r.id" :class="{ 'is-unavailable': !r.available }">
              <div class="repo-num">№ {{ i + 1 }}</div>
              <div class="repo-body">
                <a v-if="r.available && !r.private" class="repo-slug" :href="r.url" target="_blank" rel="noopener">{{ r.name }}</a>
                <span v-else class="repo-slug" :class="{ 'repo-slug-pending': !r.available }">{{ r.name }}</span>
                <div class="repo-title" v-if="paperTitle(r)">{{ paperTitle(r) }}</div>
                <div class="repo-desc">{{ tx(r.description) }}</div>
                <div class="repo-meta">
                  <span v-if="catLicense(cat)">{{ catLicense(cat) }}</span>
                  <span class="repo-status" :class="statusClass(r)">{{ statusText(r) }}</span>
                  <a v-if="r.available && r.private && requestEmail" class="repo-request" :href="'mailto:' + requestEmail">{{ tx(pg.request) }}</a>
                </div>
              </div>
              <button v-if="r.paper" class="repo-link" @click="openPaper(r.paper)">
                {{ tx(pg.read) }}
              </button>
            </li>
          </ul>
        </section>

        <div v-if="!repos.length" style="color:var(--ink-50);font-family:var(--font-mono);padding:24px 56px;">
          {{ tx(pg.empty) }}
        </div>

        <app-footer />
      </div>
      <div v-else style="padding:80px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">
        {{ (store.t.ui && store.t.ui.loading_library) || 'Loading…' }}
      </div>
    `,
  };
})();
