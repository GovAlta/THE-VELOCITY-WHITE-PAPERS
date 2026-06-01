/* DataTable — a labelled data table for tabular facts (findings, inventories).

   Render-only in the public view. In dev edit mode (a block object is passed),
   the title, caption, source, every header, and every cell become click-to-edit,
   and controls appear to add or delete rows and columns. Cells that look numeric
   (counts, percentages) are right-aligned and kept on one line; text cells wrap. */

(function () {
  window.VWComponents = window.VWComponents || {};

  const NUM = /^\$?\d[\d,]*(?:\.\d+)?%?\+?$/;

  window.VWComponents['data-table'] = {
    props: {
      title:   { type: String, default: '' },
      columns: { type: Array,  default: () => [] },
      rows:    { type: Array,  default: () => [] },
      caption: { type: String, default: '' },
      source:  { type: String, default: '' },
      block:   { type: Object, default: null },
    },
    setup() { return { edit: window.VWEdit || null }; },
    computed: {
      editing() { return !!(this.edit && this.edit.enabled && this.block); },
      /* When a block is present, edit it in place so changes persist; otherwise
         fall back to the plain props (public render). */
      src() {
        return this.block || { title: this.title, columns: this.columns, rows: this.rows, caption: this.caption, source: this.source };
      },
      cols() { return this.src.columns || []; },
      data() { return this.src.rows || []; },
      numCols() {
        const first = this.data[0] || [];
        return this.cols.map((_, i) => NUM.test(String(first[i] == null ? '' : first[i]).trim()));
      },
    },
    methods: {
      md() { if (this.edit) this.edit.markDirty(); },
      addRow() { this.src.rows.push(new Array(this.cols.length).fill('')); this.md(); },
      delRow(i) { this.src.rows.splice(i, 1); this.md(); },
      addCol() { this.src.columns.push('Column'); this.src.rows.forEach((r) => r.push('')); this.md(); },
      delCol(j) { this.src.columns.splice(j, 1); this.src.rows.forEach((r) => r.splice(j, 1)); this.md(); },
    },
    template: `
      <figure class="cd-table">
        <editable-text v-if="editing" tag="div" cls="ftitle" :obj="src" field="title" />
        <div class="ftitle" v-else-if="src.title">{{ src.title }}</div>

        <div class="cd-table-scroll">
          <table>
            <thead>
              <tr>
                <th v-for="(c, i) in cols" :key="i" :class="{ num: numCols[i] }">
                  <editable-text v-if="editing" tag="span" :obj="src.columns" :field="i" />
                  <template v-else>{{ c }}</template>
                  <button v-if="editing" type="button" class="cd-col-del" @click="delCol(i)" :aria-label="'Delete column ' + (i + 1)">✕</button>
                </th>
                <th v-if="editing" class="cd-rowctl" aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, ri) in data" :key="ri">
                <td v-for="(cell, ci) in r" :key="ci" :class="{ num: numCols[ci] }">
                  <editable-text v-if="editing" tag="span" :obj="r" :field="ci" />
                  <template v-else>{{ cell }}</template>
                </td>
                <td v-if="editing" class="cd-rowctl">
                  <button type="button" class="vw-del" @click="delRow(ri)" :aria-label="'Delete row ' + (ri + 1)">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="editing" class="cd-table-edit">
          <button type="button" class="vw-gen-btn" @click="addRow">+ row</button>
          <button type="button" class="vw-gen-btn" @click="addCol">+ column</button>
        </div>

        <figcaption v-if="editing" class="fcaption">
          <editable-text tag="span" :obj="src" field="caption" />
          <editable-text tag="span" cls="cd-table-src" :obj="src" field="source" />
        </figcaption>
        <figcaption class="fcaption" v-else-if="src.caption || src.source">
          <span v-if="src.caption">{{ src.caption }}</span>
          <span v-if="src.source" class="cd-table-src">{{ src.source }}</span>
        </figcaption>
      </figure>
    `,
  };
})();
