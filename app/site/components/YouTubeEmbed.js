/* YouTubeEmbed — a labelled figure that embeds a YouTube video.

   It mirrors the image figure (fno, title, caption, alt) but carries a video
   URL instead of a generated image, so there is no generation prompt. Paste any
   of the three standard YouTube link formats:
     - standard:  https://www.youtube.com/watch?v=VIDEOID
     - short:     https://youtu.be/VIDEOID
     - embed:     https://www.youtube.com/embed/VIDEOID
   An optional start time (t= / start= / #t=) is preserved. The video is embedded
   through youtube-nocookie.com (privacy-enhanced mode).

   In dev edit mode the title, caption, URL, and alt text become click-to-edit.
   Nothing is generated; the embed is just the link the author pasted. */

(function () {
  window.VWComponents = window.VWComponents || {};

  function videoId(u) {
    if (!u) return '';
    const s = String(u).trim();
    let m = s.match(/youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{6,})/);
    if (m) return m[1];
    m = s.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
    if (m) return m[1];
    m = s.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
    if (m) return m[1];
    if (/^[A-Za-z0-9_-]{6,}$/.test(s)) return s;          // bare id
    return '';
  }

  function startSeconds(u) {
    if (!u) return 0;
    const s = String(u);
    const m = s.match(/[?&#](?:t|start)=(\d+h)?(\d+m)?(\d+s?)?/);
    if (!m) return 0;
    if (/^\d+s?$/.test(m[0].split('=')[1] || '')) {
      const plain = (m[0].split('=')[1] || '').replace('s', '');
      if (/^\d+$/.test(plain)) return parseInt(plain, 10);
    }
    const h = m[1] ? parseInt(m[1], 10) : 0;
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const sec = m[3] ? parseInt(m[3], 10) : 0;
    return h * 3600 + min * 60 + sec;
  }

  window.VWComponents['youtube-embed'] = {
    props: {
      fno:     { type: String, default: 'FIG.' },
      title:   { type: String, default: '' },
      caption: { type: String, default: '' },
      url:     { type: String, default: '' },
      alt:     { type: String, default: '' },
      block:   { type: Object, default: null },
    },
    setup() { return { edit: window.VWEdit || null }; },
    computed: {
      editing() { return !!(this.edit && this.edit.enabled); },
      src()     { return (this.block && this.block.url != null) ? this.block.url : this.url; },
      label()   { return ((this.block && this.block.alt) || this.alt || 'Embedded YouTube video'); },
      vid()     { return videoId(this.src); },
      embedSrc() {
        if (!this.vid) return '';
        const start = startSeconds(this.src);
        const q = 'rel=0' + (start ? '&start=' + start : '');
        return 'https://www.youtube-nocookie.com/embed/' + this.vid + '?' + q;
      },
    },
    template: `
      <figure class="cd-figure">
        <editable-text v-if="block && (editing || block.fno)" tag="div" cls="fno" :obj="block" field="fno" />
        <div class="fno" v-else-if="!block && fno">{{ fno }}</div>

        <editable-text v-if="block && (editing || block.title)" tag="div" cls="ftitle" :obj="block" field="title" />
        <div class="ftitle" v-else-if="!block && title">{{ title }}</div>

        <div v-if="embedSrc" class="vw-yt">
          <iframe :src="embedSrc" :title="label" loading="lazy"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerpolicy="strict-origin-when-cross-origin"
                  allowfullscreen></iframe>
        </div>
        <div v-else class="vw-img-empty">No video yet. Paste a YouTube link below.</div>

        <editable-text v-if="block && (editing || block.caption)" tag="div" cls="fcaption" :obj="block" field="caption" />
        <div class="fcaption" v-else-if="!block && caption">{{ caption }}</div>

        <div v-if="editing && block" class="vw-img-edit">
          <label>YouTube link (standard, short, or embed URL)</label>
          <editable-text tag="div" cls="vw-img-field" :obj="block" field="url" />
          <label>Alt text (accessibility; describes the video)</label>
          <editable-text tag="div" cls="vw-img-field" :obj="block" field="alt" />
          <span class="vw-gen-hint" v-if="src && !vid">That does not look like a YouTube link. Use a watch, youtu.be, or embed URL.</span>
        </div>
      </figure>
    `,
  };
})();
