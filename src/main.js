import { skapaEditor } from './editor.js'
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
        <span id="word-count">0 ord</span>
        <button id="export-btn" title="Exportera">↓</button>
      </div>
    </header>

    <main id="main">
      <div id="editor-wrapper">
        <div id="editor"></div>
      </div>
    </main>
  </div>
`

// Starta editorn
const editorEl = document.getElementById('editor')
const editor = skapaEditor(editorEl, (ed) => {
    const words = ed.getText().trim().split(/\s+/).filter(Boolean).length
    document.getElementById('word-count').textContent = `${words} ord`
})

// Export-knapp (markdown för nu)
document.getElementById('export-btn').addEventListener('click', () => {
    const titel = document.getElementById('doc-title').value || 'dokument'
    const text = editor.storage.markdown?.getMarkdown?.() || editor.getText()
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${titel}.md`
    a.click()
})
