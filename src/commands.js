// Formatkommandon per läge
const fmt = (fn) => (editor) => fn(editor.chain().focus()).run()

export const MD_KOMMANDON = [
    { label: 'Brödtext',      hint: 'p',      action: fmt(c => c.setParagraph()) },
    { label: '# Rubrik 1',    hint: 'h1',     action: fmt(c => c.setHeading({ level: 1 })) },
    { label: '## Rubrik 2',   hint: 'h2',     action: fmt(c => c.setHeading({ level: 2 })) },
    { label: '### Rubrik 3',  hint: 'h3',     action: fmt(c => c.setHeading({ level: 3 })) },
    { label: '**Fet**',       hint: 'bold',   action: fmt(c => c.toggleBold()) },
    { label: '*Kursiv*',      hint: 'italic', action: fmt(c => c.toggleItalic()) },
    { label: '> Citat',       hint: 'quote',  action: fmt(c => c.setBlockquote()) },
    { label: '- Lista',       hint: 'ul',     action: fmt(c => c.toggleBulletList()) },
    { label: '1. Numrerad',   hint: 'ol',     action: fmt(c => c.toggleOrderedList()) },
    { label: '--- Linje',     hint: 'hr',     action: fmt(c => c.setHorizontalRule()) },
]

export const WIKI_KOMMANDON = [
    { label: 'Brödtext',          hint: 'p',      action: fmt(c => c.setParagraph()) },
    { label: '= Rubrik 1 =',     hint: 'h1',     action: fmt(c => c.setHeading({ level: 1 })) },
    { label: '== Rubrik 2 ==',   hint: 'h2',     action: fmt(c => c.setHeading({ level: 2 })) },
    { label: '=== Rubrik 3 ===', hint: 'h3',     action: fmt(c => c.setHeading({ level: 3 })) },
    { label: "'''Fet'''",        hint: 'bold',   action: fmt(c => c.toggleBold()) },
    { label: "''Kursiv''",       hint: 'italic', action: fmt(c => c.toggleItalic()) },
    { label: '* Lista',          hint: 'ul',     action: fmt(c => c.toggleBulletList()) },
    { label: '# Numrerad',       hint: 'ol',     action: fmt(c => c.toggleOrderedList()) },
    { label: '---- Linje',       hint: 'hr',     action: fmt(c => c.setHorizontalRule()) },
]

export const LATEX_KOMMANDON = [
    { label: 'Brödtext',              hint: 'p',      action: fmt(c => c.setParagraph()) },
    { label: '\\section{}',          hint: 'h1',     action: fmt(c => c.setHeading({ level: 1 })) },
    { label: '\\subsection{}',       hint: 'h2',     action: fmt(c => c.setHeading({ level: 2 })) },
    { label: '\\subsubsection{}',    hint: 'h3',     action: fmt(c => c.setHeading({ level: 3 })) },
    { label: '\\textbf{}',           hint: 'bold',   action: fmt(c => c.toggleBold()) },
    { label: '\\textit{}',           hint: 'italic', action: fmt(c => c.toggleItalic()) },
    { label: '\\begin{quote}',       hint: 'quote',  action: fmt(c => c.setBlockquote()) },
    { label: '\\begin{itemize}',     hint: 'ul',     action: fmt(c => c.toggleBulletList()) },
    { label: '\\begin{enumerate}',   hint: 'ol',     action: fmt(c => c.toggleOrderedList()) },
    { label: '\\rule{\\textwidth}',  hint: 'hr',     action: fmt(c => c.setHorizontalRule()) },
]

// Rendera suggestions-popup
export function skapaCommandPicker(items, command) {
    const popup = document.createElement('div')
    popup.id = 'command-picker'
    popup.style.cssText = `
        position: fixed;
        background: #211c14;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 4px;
        z-index: 9999;
        min-width: 220px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        font-family: 'DM Mono', monospace;
        font-size: 12px;
    `

    let selectedIndex = 0

    function render() {
        popup.innerHTML = ''
        items.forEach((item, i) => {
            const el = document.createElement('div')
            el.style.cssText = `
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: space-between;
                color: #f5f0e8;
                background: ${i === selectedIndex ? 'rgba(240,192,64,0.15)' : 'transparent'};
            `
            el.innerHTML = `
                <span style="color:${i === selectedIndex ? '#f0c040' : '#f5f0e8'}">${item.label}</span>
                <span style="opacity:0.35;font-size:10px;">${item.hint}</span>
            `
            el.addEventListener('pointerdown', (e) => {
                e.preventDefault()
                e.stopPropagation()
                command(item)
            })
            el.addEventListener('mouseover', () => {
                selectedIndex = i
                render()
            })
            popup.appendChild(el)
        })
    }

    render()

    return {
        el: popup,
        onKeyDown(e) {
            if (e.key === 'ArrowDown') {
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1)
                render()
                return true
            }
            if (e.key === 'ArrowUp') {
                selectedIndex = Math.max(selectedIndex - 1, 0)
                render()
                return true
            }
            if (e.key === 'Enter') {
                command(items[selectedIndex])
                return true
            }
            return false
        }
    }
}
