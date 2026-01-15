import '../ui/navigation-arrows.js';

class ThoughtViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.page = 0;
  }

  set frameSvg(v) { this._frameSvg = v; this.render(); }
  set data(v) { this._data = v; this.page = 0; this.render(); }
  set config(v) { this._config = v; }

  connectedCallback() {
    this._onKey = (e) => {
      if (!this.isConnected) return;
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    };
    document.addEventListener('keydown', this._onKey);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKey);
  }

  render() {
    if (!this._frameSvg || !this._data) return;

    const thoughts = this._data.thoughts || [];
    const item = thoughts[this.page];

    this.shadowRoot.innerHTML = `
      <style>
        .wrap{position:relative;width:min(900px,92vw);}
        .frame{width:100%;height:auto;display:block;}
        .content{position:absolute;left:18%;right:15%;top:22%;bottom:25%;
          overflow-y:auto; overflow-x:hidden; padding:0 20px 0 0;
          font-family:Georgia,serif;color:#1f1f1f; line-height:1.6;
          animation:fade .25s ease-out;
          scrollbar-width: thin; scrollbar-color: #ffd700 rgba(0,0,0,0.05);}
        
        .content::-webkit-scrollbar {width: 6px;}
        .content::-webkit-scrollbar-track {background: rgba(0,0,0,0.05);}
        .content::-webkit-scrollbar-thumb {background-color: #ffd700; border-radius: 10px;}

        .nav{position:absolute;left:50%;bottom:6%;transform:translateX(-50%);
          display:flex;gap:14px;align-items:center;background:rgba(255,255,255,.86);
          padding:8px 14px;border-radius:999px;}
        .count{font:12px system-ui;color:#555;min-width:64px;text-align:center;}
        @keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      </style>
      <div class="wrap">
        <div class="frame">${this._frameSvg}</div>
        <div class="content">
          <h2>${item?.title ?? ''}</h2>
          <p><em>${item?.date ?? ''}</em></p>
          <div>${item?.content ?? ''}</div>
        </div>
        <div class="nav">
          <navigation-arrows></navigation-arrows>
          <div class="count">${this.page + 1} / ${thoughts.length}</div>
        </div>
      </div>
    `;

    const arrows = this.shadowRoot.querySelector('navigation-arrows');
    arrows.setAttribute('can-prev', String(this.page > 0));
    arrows.setAttribute('can-next', String(this.page < thoughts.length - 1));

    arrows.addEventListener('prev', () => this.prev());
    arrows.addEventListener('next', () => this.next());
  }

  prev() {
    if (this.page > 0) { this.page--; this.render(); }
  }

  next() {
    const thoughts = this._data?.thoughts || [];
    if (this.page < thoughts.length - 1) { this.page++; this.render(); }
  }
}

customElements.define('thought-viewer', ThoughtViewer);
