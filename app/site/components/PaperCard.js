/* PaperCard — a single card in the library grid. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['paper-card'] = {
    props: { paper: { type: Object, required: true } },
    emits: ['open'],
    setup() { return { store: window.VWStore }; },
    computed: {
      i18n() { return (this.paper.i18n && this.paper.i18n[this.store.locale]) || null; },
      title() { return (this.i18n && this.i18n.title) || this.paper.title; },
      subtitle() { return (this.i18n && this.i18n.subtitle) || this.paper.subtitle; },
      tierLabel() {
        const map = this.store.t.ui && this.store.t.ui.tier_labels;
        return (map && map[this.paper.tier]) || this.paper.tier;
      },
      statusClass() {
        const s = (this.paper.status || '').toLowerCase();
        if (s === 'published') return '';
        if (s === 'forthcoming') return 'forthcoming';
        if (s === 'draft' || s === 'placeholder') return 'draft';
        return '';
      },
      paperLabel() {
        const parts = [];
        if (this.paper.num) parts.push('Paper ' + this.paper.num);
        if (this.paper.tier) parts.push(this.tierLabel);
        parts.push(this.title || '');
        if (this.paper.status) parts.push(this.paper.status);
        if (this.paper.reading_min) parts.push(this.paper.reading_min + ' minute read');
        return parts.join(', ');
      },
    },
    template: `
      <a :href="'/paper/' + paper.id"
         class="civic-card"
         :class="{ 'is-architecture': paper.category === 'architecture' }"
         :aria-label="paperLabel"
         @click.prevent="$emit('open', paper.id)">
        <div class="head" aria-hidden="true">
          <span class="num">{{ paper.category === 'architecture' ? paper.num : '№ ' + paper.num }}</span>
          <span>{{ tierLabel }}</span>
        </div>
        <h3>{{ title }}</h3>
        <div class="sub">{{ subtitle }}</div>
        <div class="foot" aria-hidden="true">
          <span class="status" :class="statusClass">{{ paper.status }}</span>
          <span v-if="paper.reading_min">{{ paper.reading_min }} min</span>
          <span v-if="paper.repo">repo ✓</span>
        </div>
      </a>
    `,
  };
})();
