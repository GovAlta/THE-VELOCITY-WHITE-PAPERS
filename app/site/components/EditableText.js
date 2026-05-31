/* EditableText — a text region that renders normally and, in dev edit mode,
   becomes editable when you click into it.

   Three states:
     - edit mode off            -> rendered, not interactive (the public view).
     - edit mode on, idle        -> rendered, clickable (hover affordance).
     - edit mode on, active      -> contenteditable showing the RAW SOURCE.

   Editing operates on source, so spaces, line breaks, and markdown all behave.
   On blur the source is committed and the element re-renders, so clicking off a
   paragraph shows the rendered markdown immediately. Read rendering runs an
   inline-markdown pass for html fields (**bold**, *italic*, `code`, links, and
   newlines), and existing inline HTML in a field passes through unchanged.

   Usage:
     <editable-text tag="p"   :obj="block" field="text" :html="true" />
     <editable-text tag="span" :obj="paper" field="title" /> */

(function () {
  function mdInline(src) {
    if (src == null) return '';
    let s = String(src);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
    s = s.replace(/\n/g, '<br>');
    return s;
  }
  window.VWmd = mdInline;

  window.VWComponents = window.VWComponents || {};

  window.VWComponents['editable-text'] = {
    props: {
      obj:   { type: Object, required: true },
      field: { type: String, required: true },
      html:  { type: Boolean, default: false },
      tag:   { type: String, default: 'span' },
      cls:   { type: String, default: '' },
    },
    setup() { return { edit: window.VWEdit || null }; },
    data() { return { active: false }; },
    computed: {
      value() { return this.obj[this.field] != null ? this.obj[this.field] : ''; },
      editable() { return !!(this.edit && this.edit.enabled); },
      rendered() { return this.html ? mdInline(this.value) : this.value; },
    },
    watch: {
      /* If edit mode is switched off while this region is active, drop back to
         the rendered view. */
      editable(on) { if (!on) this.active = false; },
    },
    methods: {
      enter() {
        if (!this.editable || this.active) return;
        this.active = true;
        this.$nextTick(() => {
          const el = this.$refs.el;
          if (!el) return;
          el.textContent = this.value;          // raw source, uncontrolled while typing
          el.focus();
          const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
          const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        });
      },
      commit(e) {
        const next = e.target.innerText;
        this.active = false;
        if (next !== this.value) {
          this.obj[this.field] = next;
          if (this.edit) this.edit.markDirty();
        }
      },
    },
    template: `
      <component :is="tag" v-if="active" ref="el"
                 contenteditable="true" spellcheck="true"
                 :class="['vw-editable', cls]" @blur="commit"></component>
      <component :is="tag" v-else-if="html"
                 :class="[cls, editable ? 'vw-editable-idle' : '']"
                 @click="enter" v-html="rendered"></component>
      <component :is="tag" v-else
                 :class="[cls, editable ? 'vw-editable-idle' : '']"
                 @click="enter">{{ value }}</component>
    `,
  };
})();
