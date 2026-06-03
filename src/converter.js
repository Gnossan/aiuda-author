import { marked } from 'marked'
import TurndownService from 'turndown'

const turndown = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
})

// WYSIWYG (HTML) → Markdown
export function htmlTillMarkdown(html) {
    return turndown.turndown(html)
}

// Markdown → HTML
export function markdownTillHtml(md) {
    return marked.parse(md)
}

// HTML → Wiki-syntax (MediaWiki)
export function htmlTillWiki(html) {
    const div = document.createElement('div')
    div.innerHTML = html

    function nodeToWiki(node) {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent

        const children = () => Array.from(node.childNodes).map(nodeToWiki).join('')

        switch (node.nodeName) {
            case 'H1': return `= ${children()} =\n\n`
            case 'H2': return `== ${children()} ==\n\n`
            case 'H3': return `=== ${children()} ===\n\n`
            case 'H4': return `==== ${children()} ====\n\n`
            case 'P':  return `${children()}\n\n`
            case 'STRONG': case 'B': return `'''${children()}'''`
            case 'EM': case 'I':     return `''${children()}''`
            case 'BLOCKQUOTE':       return `<blockquote>${children()}</blockquote>\n\n`
            case 'UL': return Array.from(node.children).map(li => `* ${li.textContent.trim()}`).join('\n') + '\n\n'
            case 'OL': return Array.from(node.children).map((li, i) => `# ${li.textContent.trim()}`).join('\n') + '\n\n'
            case 'LI': return children()
            case 'HR': return '----\n\n'
            case 'BR': return '\n'
            case 'A':  return `[${node.href} ${children()}]`
            default:   return children()
        }
    }

    return Array.from(div.childNodes).map(nodeToWiki).join('')
        .replace(/\n{3,}/g, '\n\n')  // max ett tomt radmellanrum
        .trim()
}

// HTML → LaTeX
export function htmlTillLatex(html) {
    const div = document.createElement('div')
    div.innerHTML = html

    function nodeToLatex(node) {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent

        const children = () => Array.from(node.childNodes).map(nodeToLatex).join('')

        switch (node.nodeName) {
            case 'H1': return `\\section{${children()}}\n\n`
            case 'H2': return `\\subsection{${children()}}\n\n`
            case 'H3': return `\\subsubsection{${children()}}\n\n`
            case 'H4': return `\\paragraph{${children()}}\n\n`
            case 'P':  return `${children()}\n\n`
            case 'STRONG': case 'B': return `\\textbf{${children()}}`
            case 'EM': case 'I':     return `\\textit{${children()}}`
            case 'BLOCKQUOTE': return `\\begin{quote}\n${children()}\\end{quote}\n\n`
            case 'UL': return `\\begin{itemize}\n${Array.from(node.children).map(li => `  \\item ${li.textContent.trim()}`).join('\n')}\n\\end{itemize}\n\n`
            case 'OL': return `\\begin{enumerate}\n${Array.from(node.children).map(li => `  \\item ${li.textContent.trim()}`).join('\n')}\n\\end{enumerate}\n\n`
            case 'HR': return `\\noindent\\rule{\\textwidth}{0.4pt}\n\n`
            case 'BR': return '\\\\\n'
            default:   return children()
        }
    }

    const body = Array.from(div.childNodes).map(nodeToLatex).join('').trim()
    return `\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage[swedish]{babel}\n\n\\begin{document}\n\n${body}\n\n\\end{document}`
}

// LaTeX → HTML (grundläggande parser)
export function latexTillHtml(latex) {
    // Ta bort preamble och document-omslutning
    let text = latex
        .replace(/\\documentclass.*?\n/g, '')
        .replace(/\\usepackage.*?\n/g, '')
        .replace(/\\begin\{document\}/g, '')
        .replace(/\\end\{document\}/g, '')
        .trim()

    return text
        .replace(/\\section\{(.+?)\}/g, '<h1>$1</h1>')
        .replace(/\\subsection\{(.+?)\}/g, '<h2>$1</h2>')
        .replace(/\\subsubsection\{(.+?)\}/g, '<h3>$1</h3>')
        .replace(/\\paragraph\{(.+?)\}/g, '<h4>$1</h4>')
        .replace(/\\textbf\{(.+?)\}/g, '<strong>$1</strong>')
        .replace(/\\textit\{(.+?)\}/g, '<em>$1</em>')
        .replace(/\\begin\{quote\}([\s\S]+?)\\end\{quote\}/g, '<blockquote>$1</blockquote>')
        .replace(/\\begin\{itemize\}([\s\S]+?)\\end\{itemize\}/g, (_, items) =>
            '<ul>' + items.replace(/\\item (.+)/g, '<li>$1</li>') + '</ul>')
        .replace(/\\begin\{enumerate\}([\s\S]+?)\\end\{enumerate\}/g, (_, items) =>
            '<ol>' + items.replace(/\\item (.+)/g, '<li>$1</li>') + '</ol>')
        .replace(/\\noindent\\rule\{[^}]+\}\{[^}]+\}/g, '<hr>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>').replace(/$/, '</p>')
}

// Wiki-syntax → HTML (grundläggande parser)
export function wikiTillHtml(wiki) {
    let html = wiki
        .replace(/^==== (.+?) ====$/gm, '<h4>$1</h4>')
        .replace(/^=== (.+?) ===$/gm, '<h3>$1</h3>')
        .replace(/^== (.+?) ==$/gm, '<h2>$1</h2>')
        .replace(/^= (.+?) =$/gm, '<h1>$1</h1>')
        .replace(/'''(.+?)'''/g, '<strong>$1</strong>')
        .replace(/''(.+?)''/g, '<em>$1</em>')
        .replace(/^\* (.+)$/gm, '<li>$1</li>')
        .replace(/^# (.+)$/gm, '<li>$1</li>')
        .replace(/^----$/gm, '<hr>')
        .replace(/\n\n/g, '</p><p>')

    // Wrap i paragrafer
    html = '<p>' + html + '</p>'
    return html
}
