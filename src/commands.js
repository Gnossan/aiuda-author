// Formatkommandon per läge
export const MD_KOMMANDON = [
    { label: 'Brödtext',      hint: 'p',      action: (editor) => editor.chain().focus().setParagraph().run() },
    { label: '# Rubrik 1',    hint: 'h1',     action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: '## Rubrik 2',   hint: 'h2',     action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: '### Rubrik 3',  hint: 'h3',     action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: '**Fet text**',  hint: 'bold',   action: (editor) => editor.chain().focus().toggleBold().run() },
    { label: '*Kursiv*',      hint: 'italic', action: (editor) => editor.chain().focus().toggleItalic().run() },
    { label: '> Citat',       hint: 'quote',  action: (editor) => editor.chain().focus().toggleBlockquote().run() },
    { label: '- Lista',       hint: 'ul',     action: (editor) => editor.chain().focus().toggleBulletList().run() },
    { label: '1. Numrerad',   hint: 'ol',     action: (editor) => editor.chain().focus().toggleOrderedList().run() },
    { label: '--- Linje',     hint: 'hr',     action: (editor) => editor.chain().focus().setHorizontalRule().run() },
]

export const WIKI_KOMMANDON = [
    { label: 'Brödtext',            hint: 'p',  action: (editor) => editor.chain().focus().setParagraph().run() },
    { label: '= Rubrik 1 =',       hint: 'h1', action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: '== Rubrik 2 ==',     hint: 'h2', action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: '=== Rubrik 3 ===',   hint: 'h3', action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "'''Fet'''",          hint: 'bold',   action: (editor) => editor.chain().focus().toggleBold().run() },
    { label: "''Kursiv''",         hint: 'italic', action: (editor) => editor.chain().focus().toggleItalic().run() },
    { label: '* Lista',            hint: 'ul',     action: (editor) => editor.chain().focus().toggleBulletList().run() },
    { label: '# Numrerad',         hint: 'ol',     action: (editor) => editor.chain().focus().toggleOrderedList().run() },
    { label: '----  Linje',        hint: 'hr',     action: (editor) => editor.chain().focus().setHorizontalRule().run() },
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
            el.addEventListener('mousedown', (e) => {
                e.preventDefault()
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
