/* BlockRenderer — dispatches a single content block from a paper's
   blocks[] array to the right component or markup.

   Block types accepted (set in data/papers/wp-NN.json):
     - section_heading   { n, title }
     - paragraph         { text }
     - dropcap_paragraph { letter, text }
     - pullquote         { text, cite }
     - keystat           { label, value, body }
     - figure            { fno, title, caption, chart, image }
     - sidenote          { label, value }
     - tag_row           { tags, label? }
     - related           {}  (uses paper.related from store)
     - audio             { src, label }
     - presentation      { presentation_ref }  (resolves to paper.presentations[ref])
*/

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['block-renderer'] = {
    props: {
      block: { type: Object, required: true },
      paper: { type: Object, required: true },
    },
    emits: ['open'],
    computed: {
      resolvedPresentation() {
        if (this.block.type !== 'presentation') return null;
        const ref = this.block.presentation_ref;
        const list = this.paper.embedded_presentations || [];
        return list.find(p => p.id === ref) || null;
      },
    },
    template: `
      <template v-if="block.type === 'section_heading'">
        <h2 :id="'sec-' + block.n" class="body-section-heading">
          <span class="n" aria-hidden="true">§{{ block.n }}</span>
          <editable-text tag="span" :obj="block" field="title" />
        </h2>
      </template>

      <template v-else-if="block.type === 'paragraph'">
        <editable-text tag="p" :obj="block" field="text" :html="true" />
      </template>

      <template v-else-if="block.type === 'dropcap_paragraph'">
        <p class="dropcap-para"><editable-text tag="span" :obj="block" field="text" :html="true" /></p>
      </template>

      <pull-quote v-else-if="block.type === 'pullquote'"
                  :block="block"
                  :text="block.text" :cite="block.cite || ''" />

      <key-stat v-else-if="block.type === 'keystat'"
                :block="block"
                :label="block.label || ''"
                :value="block.value"
                :body="block.body || ''" />

      <paper-figure v-else-if="block.type === 'figure'"
                    :block="block"
                    :fno="block.fno || 'FIG.'"
                    :title="block.title || ''"
                    :caption="block.caption || ''"
                    :chart="block.chart || null"
                    :image="block.image || null" />

      <data-table v-else-if="block.type === 'table'"
                  :block="block"
                  :title="block.title || ''"
                  :columns="block.columns || []"
                  :rows="block.rows || []"
                  :caption="block.caption || ''"
                  :source="block.source || ''" />

      <side-note v-else-if="block.type === 'sidenote'"
                 :label="block.label || 'Note'"
                 :value="block.value" />

      <tag-row v-else-if="block.type === 'tag_row'"
               :label="block.label || 'Tags'"
               :tags="block.tags || []" />

      <related-papers v-else-if="block.type === 'related'"
                      :current="paper.id"
                      @open="$emit('open', $event)" />

      <audio-player v-else-if="block.type === 'audio'"
                    :src="block.src"
                    :label="block.label || 'Listen'" />

      <presentation-player v-else-if="block.type === 'presentation' && resolvedPresentation"
                           :presentation="resolvedPresentation"
                           :compact="block.compact === true" />

      <pre v-else style="font-family:var(--font-mono);font-size:11px;color:var(--ink-50);">
{{ 'Unknown block: ' + block.type }}
      </pre>
    `,
  };
})();
