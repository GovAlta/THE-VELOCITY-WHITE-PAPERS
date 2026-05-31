/* PaperCard — a single card in the library grid. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['paper-card'] = {
    props: { paper: { type: Object, required: true } },
    emits: ['open'],
    computed: {
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
        if (this.paper.tier) parts.push(this.paper.tier);
        parts.push(this.paper.title || '');
        if (this.paper.status) parts.push(this.paper.status);
        if (this.paper.reading_min) parts.push(this.paper.reading_min + ' minute read');
        return parts.join(', ');
      },
    },
    template: `
      <a :href="'#/paper/' + paper.id"
         class="civic-card"
         :class="{ 'is-architecture': paper.category === 'architecture' }"
         :aria-label="paperLabel"
         @click.prevent="$emit('open', paper.id)">
        <div class="head" aria-hidden="true">
          <span class="num">{{ paper.category === 'architecture' ? paper.num : '№ ' + paper.num }}</span>
          <span>{{ paper.tier }}</span>
        </div>
        <h3>{{ paper.title }}</h3>
        <div class="sub">{{ paper.subtitle }}</div>
        <div class="foot" aria-hidden="true">
          <span class="status" :class="statusClass">{{ paper.status }}</span>
          <span v-if="paper.reading_min">{{ paper.reading_min }} min</span>
          <span v-if="paper.repo">repo ✓</span>
        </div>
      </a>
    `,
  };
})();
