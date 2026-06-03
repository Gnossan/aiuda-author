import { skapaEditor, sättLäge } from './editor.js'
import { htmlTillMarkdown, markdownTillHtml, htmlTillWiki, wikiTillHtml, htmlTillLatex, latexTillHtml } from './converter.js'
import { loggaIn, loggaUt, onAuth } from './auth.js'
import { hämtaProjektlista, visaProjektPicker, säkerställNyckel, hämtaProjekt, genereraResearchSammanfattning, genereraDisposition, sparaAuthorData } from './mentor.js'
import './style.css'

let aktivAnvändare = null

const app = document.getElementById('app')

app.innerHTML = `
  <div id="login-vy" style="display:none;position:fixed;inset:0;background:var(--bg);z-index:9999;flex-direction:column;align-items:center;justify-content:center;gap:24px;">
    <div style="font-size:32px;font-weight:500;letter-spacing:-0.02em;">AI<span style="color:#f0c040;">u</span>da Author<sup style="font-size:12px;opacity:0.5;vertical-align:super;">™</sup></div>
    <div style="font-size:13px;opacity:0.5;letter-spacing:0.1em;text-transform:uppercase;">Write deeper. Structure better.</div>
    <button id="login-btn" style="padding:12px 28px;background:#f0c040;color:#1a1610;border:none;border-radius:6px;cursor:pointer;font-family:'DM Mono',monospace;font-size:13px;font-weight:600;margin-top:16px;">Logga in med Google →</button>
  </div>

  <div id="layout" style="display:none">
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
        <button id="bg-btn" title="Byt bakgrund">◐</button>
        <span id="word-count">0 ord</span>
        <button id="open-btn" title="Öppna fil">↑</button>
        <input type="file" id="file-input" accept=".md,.txt,.wiki,.tex" style="display:none">
        <button id="export-btn" title="Exportera">↓</button>
        <span id="user-info" style="font-size:11px;opacity:0.4;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>
        <button id="logout-btn" title="Logga ut" style="background:transparent;border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:4px;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;opacity:0.4;transition:opacity 0.15s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.4">↩</button>
      </div>
    </header>

    <main id="main">
      <div class="page-margin" id="left-panel">
        <div id="left-panel-content" style="padding:16px;height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:12px;">
          <div style="font-size:10px;opacity:0.4;letter-spacing:0.1em;text-transform:uppercase;">Disposition</div>
          <div id="disposition" style="font-size:11px;line-height:1.8;opacity:0.7;">
            <span style="opacity:0.4;font-style:italic;">Välj ett Mentor-projekt för att generera disposition.</span>
          </div>
        </div>
      </div>
      <div id="editor-wrapper">
        <div id="editor"></div>
        <textarea id="source-view" style="display:none" spellcheck="false" placeholder="Skriv Markdown här…"></textarea>
      </div>
      <div class="page-margin" id="right-panel">
        <div id="right-panel-content" style="padding:16px;height:100%;overflow-y:auto;">
          <button id="välj-projekt-btn" style="
            width:100%;padding:10px;background:rgba(240,192,64,0.1);
            border:1px solid rgba(240,192,64,0.3);border-radius:6px;
            color:#f0c040;font-family:'DM Mono',monospace;font-size:11px;
            cursor:pointer;letter-spacing:0.05em;
          ">＋ Välj Mentor-projekt</button>
          <div id="research-sammanfattning" style="margin-top:12px;font-size:11px;line-height:1.7;opacity:0.8;"></div>
        </div>
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

// Bakgrundsfärg-toggle
const BAKGRUNDER = [
    { bg: '#1a1610', text: '#f5f0e8', border: '#333', name: 'mörk' },
    { bg: '#f0ede8', text: '#1a1610', border: '#ccc', name: 'grå' },
    { bg: '#ffffff', text: '#1a1610', border: '#ddd', name: 'vit' },
]
let bgIndex = 0

document.getElementById('bg-btn').addEventListener('click', () => {
    bgIndex = (bgIndex + 1) % BAKGRUNDER.length
    const { bg, text, border } = BAKGRUNDER[bgIndex]
    document.documentElement.style.setProperty('--bg', bg)
    document.documentElement.style.setProperty('--text', text)
    document.documentElement.style.setProperty('--border', border)
    document.documentElement.style.setProperty('--surface', bg)
    document.documentElement.style.setProperty('--muted', text + '80')
})

// Öppna fil
document.getElementById('open-btn').addEventListener('click', () => {
    document.getElementById('file-input').click()
})

document.getElementById('file-input').addEventListener('change', (e) => {
    const fil = e.target.files[0]
    if (!fil) return

    const reader = new FileReader()
    reader.onload = (ev) => {
        const text = ev.target.result
        const ext = fil.name.split('.').pop().toLowerCase()

        // Detektera format från filtyp
        const format = ext === 'tex' ? 'latex' : ext === 'wiki' ? 'wiki' : 'md'

        // Sätt aktivt format
        document.querySelectorAll('.format-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.format === format)
        })
        sättLäge(format)
        aktivtFormat = format

        // Ladda innehållet
        const html = format === 'wiki' ? wikiTillHtml(text)
                   : format === 'latex' ? latexTillHtml(text)
                   : markdownTillHtml(text)

        editor.commands.setContent(html)

        // Sätt dokumenttitel från filnamn
        const titel = fil.name.replace(/\.[^.]+$/, '')
        document.getElementById('doc-title').value = titel

        // Visa source om man föredrar det
        if (aktivVy === 'source') {
            sourceEl.value = text
        }
    }
    reader.readAsText(fil)
    e.target.value = '' // Tillåt att öppna samma fil igen
})

// Höger panel — Mentor-projekt
document.getElementById('välj-projekt-btn').addEventListener('click', async () => {
    try {
        await säkerställNyckel()
        const projekt = await hämtaProjektlista()
        visaProjektPicker(projekt, async (valt) => {
            const sammanfattEl = document.getElementById('research-sammanfattning')
            sammanfattEl.innerHTML = `
                <div style="color:#f0c040;font-weight:600;margin-bottom:8px;">
                    ${valt.namn || valt.fraga?.slice(0,40) || valt.id}
                </div>
                <div style="opacity:0.5;font-size:10px;margin-bottom:12px;">${valt.fraga || ''}</div>
                <div style="opacity:0.4;font-style:italic;">⏳ Genererar sammanfattning…</div>
            `
            let aktivtProjektId = valt.id

            function visaAuthorData(namn, fraga, sammanfattning, disposition, genererad) {
                const disposEl = document.getElementById('disposition')
                const åldersText = genererad
                    ? `<span style="opacity:0.3;font-size:10px;">Genererad ${new Date(genererad).toLocaleDateString('sv-SE')}</span>`
                    : ''

                sammanfattEl.innerHTML = `
                    <div style="color:#f0c040;font-weight:600;margin-bottom:4px;">
                        ${namn || fraga?.slice(0,40) || valt.id}
                    </div>
                    <div style="opacity:0.5;font-size:10px;margin-bottom:4px;">${fraga || ''}</div>
                    ${åldersText}
                    <button id="regenerera-btn" style="display:block;margin:8px 0 12px;padding:4px 10px;
                        background:transparent;border:1px solid rgba(240,192,64,0.3);border-radius:4px;
                        color:#f0c040;font-family:'DM Mono',monospace;font-size:10px;cursor:pointer;opacity:0.7;">
                        ↺ Generera om
                    </button>
                    <pre class="panel-text">${sammanfattning || '–'}</pre>
                `
                disposEl.innerHTML = disposition
                    ? `<pre class="panel-text">${disposition}</pre>`
                    : '<span style="opacity:0.4;font-style:italic;">Ingen disposition.</span>'

                document.getElementById('regenerera-btn').addEventListener('click', () => {
                    genereraOm(aktivtProjektId, namn, fraga)
                })
            }

            async function genereraOm(projektId, namn, fraga) {
                const disposEl = document.getElementById('disposition')
                sammanfattEl.innerHTML = `
                    <div style="color:#f0c040;font-weight:600;margin-bottom:8px;">${namn || fraga?.slice(0,40)}</div>
                    <span style="opacity:0.4;font-style:italic;">⏳ Genererar…</span>
                `
                disposEl.innerHTML = '<span style="opacity:0.4;font-style:italic;">⏳ Genererar disposition…</span>'
                try {
                    const projektData = await hämtaProjekt(projektId)
                    const [sammanfattning, disposition] = await Promise.all([
                        genereraResearchSammanfattning(projektData),
                        genereraDisposition(projektData)
                    ])
                    await sparaAuthorData(projektId, sammanfattning, disposition)
                    visaAuthorData(namn, fraga, sammanfattning, disposition, new Date().toISOString())
                } catch (e) {
                    sammanfattEl.innerHTML += `<div style="color:#ff6b6b;margin-top:8px;">Fel: ${e.message}</div>`
                }
            }

            try {
                const projektData = await hämtaProjekt(valt.id)
                const sparad = projektData.authorSammanfattning

                if (sparad) {
                    // Visa sparad version direkt
                    visaAuthorData(
                        valt.namn, valt.fraga,
                        projektData.authorSammanfattning,
                        projektData.authorDisposition,
                        projektData.authorGenererad
                    )
                } else {
                    // Ingen sparad — generera direkt första gången
                    await genereraOm(valt.id, valt.namn, valt.fraga)
                }
            } catch (e) {
                sammanfattEl.innerHTML += `<div style="color:#ff6b6b;margin-top:8px;">Fel: ${e.message}</div>`
            }
        })
    } catch (e) {
        console.error(e)
    }
})

// Auth
onAuth((user) => {
    aktivAnvändare = user
    const loginVy = document.getElementById('login-vy')
    const layout = document.getElementById('layout')
    const userInfo = document.getElementById('user-info')

    if (user) {
        loginVy.style.display = 'none'
        layout.style.display = 'flex'
        if (userInfo) userInfo.textContent = user.displayName || user.email
    } else {
        loginVy.style.display = 'flex'
        layout.style.display = 'none'
    }
})

document.getElementById('login-btn')?.addEventListener('click', loggaIn)
document.getElementById('logout-btn')?.addEventListener('click', loggaUt)

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
