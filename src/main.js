import { skapaEditor, sättLäge } from './editor.js'
import { htmlTillMarkdown, markdownTillHtml, htmlTillWiki, wikiTillHtml, htmlTillLatex, latexTillHtml } from './converter.js'
import './style.css'

const app = document.getElementById('app')

app.innerHTML = `
  <div id="layout">
    <header id="topbar">
      <div id="topbar-left">
        <span class="logo">AI<span class="accent">u</span>da Author<sup class="tm">™</sup></span>
      </div>
      <div id="topbar-center">
        <input id="doc-title" type="text" placeholder="Dokumenttitel…" spellcheck="false">
      </div>
      <div id="topbar-right">
        <div id="view-toggle">
          <button class="view-btn active" data-view="wysiwyg">WYSIWYG</button>
          <button class="view-btn" data-view="source">Source</button>
        </div>
        <div id="format-toggle">
          <button class="format-btn active" data-format="md">MD</button>
          <button class="format-btn" data-format="wiki">Wiki</button>
          <button class="format-btn" data-format="latex">LaTeX</button>
        </div>
        <span id="word-count">0 ord</span>
        <button id="export-btn" title="Exportera">↓</button>
      </div>
    </header>

    <main id="main">
      <div id="editor-wrapper">
        <div id="editor"></div>
        <textarea id="source-view" style="display:none" spellcheck="false" placeholder="Skriv Markdown här…"></textarea>
      </div>
    </main>
  </div>
`

// Starta editorn
const editorEl = document.getElementById('editor')
const sourceEl = document.getElementById('source-view')
let aktivVy = 'wysiwyg'

const editor = skapaEditor(editorEl, (ed) => {
    const words = ed.getText().trim().split(/\s+/).filter(Boolean).length
    document.getElementById('word-count').textContent = `${words} ord`
})

// View-toggle WYSIWYG ↔ Source
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const nyVy = btn.dataset.view
        if (nyVy === aktivVy) return

        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')

        if (nyVy === 'source') {
            // WYSIWYG → Source: serialisera HTML till rätt format
            const html = editor.getHTML()
            sourceEl.value = aktivtFormat === 'wiki' ? htmlTillWiki(html)
                           : aktivtFormat === 'latex' ? htmlTillLatex(html)
                           : htmlTillMarkdown(html)
            editorEl.style.display = 'none'
            sourceEl.style.display = 'block'
            sourceEl.focus()
        } else {
            // Source → WYSIWYG: parsra till HTML
            const text = sourceEl.value
            const html = aktivtFormat === 'wiki' ? wikiTillHtml(text)
                       : aktivtFormat === 'latex' ? latexTillHtml(text)
                       : markdownTillHtml(text)
            editor.commands.setContent(html)
            sourceEl.style.display = 'none'
            editorEl.style.display = 'block'
            editor.commands.focus()
        }
        aktivVy = nyVy
    })
})

// Format-toggle MD ↔ Wiki (konverterar hela dokumentet)
let aktivtFormat = 'md'
document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const nyttFormat = btn.dataset.format
        if (nyttFormat === aktivtFormat) return

        document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        sättLäge(nyttFormat)
        const platshållare = { md: 'Markdown…', wiki: 'Wiki-syntax…', latex: 'LaTeX…' }
        sourceEl.placeholder = platshållare[nyttFormat] || 'Skriv här…'

        // Konvertera dokumentet om source är aktiv
        if (aktivVy === 'source') {
            const text = sourceEl.value
            // Parsra nuvarande format till HTML
            const html = aktivtFormat === 'wiki' ? wikiTillHtml(text)
                       : aktivtFormat === 'latex' ? latexTillHtml(text)
                       : markdownTillHtml(text)
            // Serialisera HTML till nytt format
            sourceEl.value = nyttFormat === 'wiki' ? htmlTillWiki(html)
                           : nyttFormat === 'latex' ? htmlTillLatex(html)
                           : htmlTillMarkdown(html)
        } else {
            // WYSIWYG — uppdatera bara format-läget för picker
            // (konverteringen sker vid växling till source)
        }

        aktivtFormat = nyttFormat
    })
})

// Export
document.getElementById('export-btn').addEventListener('click', () => {
    const titel = document.getElementById('doc-title').value || 'dokument'
    const md = aktivVy === 'source'
        ? sourceEl.value
        : htmlTillMarkdown(editor.getHTML())
    const blob = new Blob([md], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${titel}.md`
    a.click()
})
