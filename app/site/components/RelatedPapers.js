/* RelatedPapers — the previous / next pager at the foot of every article.

   Driven by the collection order (store.papers, sorted by paper number), not by
   a hand-curated list, so the links are always consistent. Previous points at
   the paper before this one; Next at the paper after. On the first paper the
   Previous slot links Home (the library); on the last paper the Next slot does
   the same. Registered as 'related-papers' for backwards compatibility with the
   `related` block. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['related-papers'] = {
    props: {
      current: { type: String, default: '' },   // id of the paper being read
    },
    emits: ['open'],
    setup() {
      return { store: window.VWStore };
    },
    computed: {
      ordered() {
        return (this.store.papers || []).slice().sort((a, b) =>
          String(a.num || '').localeCompare(String(b.num || ''), undefined, { numeric: true }));
      },
      idx() { return this.ordered.findIndex((p) => p.id === this.current); },
      prev() { return this.idx > 0 ? this.ordered[this.idx - 1] : null; },
      next() { return (this.idx > -1 && this.idx < this.ordered.length - 1) ? this.ordered[this.idx + 1] : null; },
      fr() { return this.store.locale === 'fr'; },
    },
    methods: {
      titleOf(p) { const i = p && p.i18n && p.i18n[this.store.locale]; return (i && i.title) || (p && p.title) || ''; },
      tierLabel(t) { const m = this.store.t.ui && this.store.t.ui.tier_labels; return (m && m[t]) || t; },
    },
    template: `
      <nav class="cd-pager" :aria-label="fr ? 'Navigation entre les articles' : 'Article navigation'">
        <a v-if="prev" class="cd-pager-link prev" :href="'/paper/' + prev.id"
           @click.prevent="$emit('open', prev.id)"
           :aria-label="(fr ? 'Précédent : ' : 'Previous: ') + titleOf(prev)">
          <span class="dir" aria-hidden="true">{{ fr ? '← Précédent' : '← Previous' }}</span>
          <span class="ref" aria-hidden="true">№ {{ prev.num }} · {{ tierLabel(prev.tier) }}</span>
          <span class="t">{{ titleOf(prev) }}</span>
        </a>
        <a v-else class="cd-pager-link prev is-home" href="/"
           :aria-label="fr ? 'Retour à la bibliothèque' : 'Back to the library'">
          <span class="dir" aria-hidden="true">{{ fr ? '← Accueil' : '← Home' }}</span>
          <span class="t">{{ fr ? 'La bibliothèque' : 'The library' }}</span>
        </a>

        <a v-if="next" class="cd-pager-link next" :href="'/paper/' + next.id"
           @click.prevent="$emit('open', next.id)"
           :aria-label="(fr ? 'Suivant : ' : 'Next: ') + titleOf(next)">
          <span class="dir" aria-hidden="true">{{ fr ? 'Suivant →' : 'Next →' }}</span>
          <span class="ref" aria-hidden="true">№ {{ next.num }} · {{ tierLabel(next.tier) }}</span>
          <span class="t">{{ titleOf(next) }}</span>
        </a>
        <a v-else class="cd-pager-link next is-home" href="/"
           :aria-label="fr ? 'Retour à la bibliothèque' : 'Back to the library'">
          <span class="dir" aria-hidden="true">{{ fr ? 'Accueil →' : 'Home →' }}</span>
          <span class="t">{{ fr ? 'La bibliothèque' : 'The library' }}</span>
        </a>
      </nav>
    `,
  };
})();
