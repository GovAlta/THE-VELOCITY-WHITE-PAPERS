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
    template: `
      <nav class="cd-pager" :aria-label="fr ? 'Navigation entre les articles' : 'Article navigation'">
        <a v-if="prev" class="cd-pager-link prev" :href="'#/paper/' + prev.id"
           @click.prevent="$emit('open', prev.id)"
           :aria-label="(fr ? 'Précédent : ' : 'Previous: ') + prev.title">
          <span class="dir" aria-hidden="true">{{ fr ? '← Précédent' : '← Previous' }}</span>
          <span class="ref" aria-hidden="true">№ {{ prev.num }} · {{ prev.tier }}</span>
          <span class="t">{{ prev.title }}</span>
        </a>
        <a v-else class="cd-pager-link prev is-home" href="#/"
           :aria-label="fr ? 'Retour à la bibliothèque' : 'Back to the library'">
          <span class="dir" aria-hidden="true">{{ fr ? '← Accueil' : '← Home' }}</span>
          <span class="t">{{ fr ? 'La bibliothèque' : 'The library' }}</span>
        </a>

        <a v-if="next" class="cd-pager-link next" :href="'#/paper/' + next.id"
           @click.prevent="$emit('open', next.id)"
           :aria-label="(fr ? 'Suivant : ' : 'Next: ') + next.title">
          <span class="dir" aria-hidden="true">{{ fr ? 'Suivant →' : 'Next →' }}</span>
          <span class="ref" aria-hidden="true">№ {{ next.num }} · {{ next.tier }}</span>
          <span class="t">{{ next.title }}</span>
        </a>
        <a v-else class="cd-pager-link next is-home" href="#/"
           :aria-label="fr ? 'Retour à la bibliothèque' : 'Back to the library'">
          <span class="dir" aria-hidden="true">{{ fr ? 'Accueil →' : 'Home →' }}</span>
          <span class="t">{{ fr ? 'La bibliothèque' : 'The library' }}</span>
        </a>
      </nav>
    `,
  };
})();
