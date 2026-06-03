import { Editor, Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { MD_KOMMANDON, WIKI_KOMMANDON, LATEX_KOMMANDON, skapaCommandPicker } from './commands.js'

let aktivtLäge = 'md'  // 'md' eller 'wiki'

export function sättLäge(läge) {
    aktivtLäge = läge
}

// Extension som lyssnar på # (MD) eller = (Wiki) och visar kommandopicker
const CommandPicker = Extension.create({
    name: 'commandPicker',

    addProseMirrorPlugins() {
        let popup = null
        let picker = null

        const stängPicker = () => {
            if (popup) {
                popup.remove()
                popup = null
                picker = null
            }
        }

        // Global stängning vid klick/scroll utanför
        document.addEventListener('pointerdown', (e) => {
            if (popup && !popup.contains(e.target)) stängPicker()
        })
        document.addEventListener('scroll', () => { if (popup) stängPicker() }, true)

        return [
            new Plugin({
                key: new PluginKey('commandPicker'),
                props: {
                    handleKeyDown(view, event) {
                        // Öppna picker vid # (MD) eller = (Wiki)
                        const trigger = aktivtLäge === 'md' ? '#'
                                     : aktivtLäge === 'wiki' ? '='
                                     : '\\'
                        if (event.key === trigger && !event.ctrlKey && !event.metaKey) {
                            const kommandon = aktivtLäge === 'md' ? MD_KOMMANDON
                                           : aktivtLäge === 'wiki' ? WIKI_KOMMANDON
                                           : LATEX_KOMMANDON
                            const { top, left } = view.coordsAtPos(view.state.selection.from)

                            picker = skapaCommandPicker(kommandon, (item) => {
                                stängPicker()
                                item.action(view._tiptapEditor)
                            })
                            picker.el.style.left = `${Math.min(left, window.innerWidth - 240)}px`
                            picker.el.style.top = `${top + 24}px`
                            document.body.appendChild(picker.el)
                            popup = picker.el

                            // Global lyssnare hanterar stängning

                            return true  // Förhindra att tecknet skrivs in
                        }

                        // Navigera picker med piltangenter
                        if (picker && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
                            if (event.key === 'Escape') { stängPicker(); return true }
                            return picker.onKeyDown(event)
                        }

                        return false
                    },
                    handleTextInput(view) {
                        // Stäng picker om användaren skriver något annat
                        if (picker) stängPicker()
                        return false
                    }
                }
            })
        ]
    }
})

export function skapaEditor(element, onUpdate) {
    const editor = new Editor({
        element,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Placeholder.configure({
                placeholder: 'Börja skriva… Tryck # (MD) eller = (Wiki) för formatkommandon',
            }),
            CharacterCount,
            CommandPicker,
        ],
        editorProps: {
            attributes: {
                class: 'aiuda-editor',
                spellcheck: 'true',
            },
        },
        onUpdate({ editor }) {
            if (onUpdate) onUpdate(editor)
        },
    })

    // Gör editor tillgänglig för CommandPicker
    editor.view._tiptapEditor = editor

    return editor
}
