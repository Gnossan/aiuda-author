import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { InputRule } from '@tiptap/core'

// Wiki-format input rules
const WikiHeading1 = new InputRule({
    find: /^= (.+) =$\n/,
    handler: ({ state, range, match }) => {
        const { tr } = state
        tr.replaceWith(range.from, range.to,
            state.schema.nodes.heading.create({ level: 1 },
                state.schema.text(match[1])))
    }
})

const WikiHeading2 = new InputRule({
    find: /^== (.+) ==$\n/,
    handler: ({ state, range, match }) => {
        const { tr } = state
        tr.replaceWith(range.from, range.to,
            state.schema.nodes.heading.create({ level: 2 },
                state.schema.text(match[1])))
    }
})

export function skapaEditor(element, onUpdate) {
    return new Editor({
        element,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Placeholder.configure({
                placeholder: 'Börja skriva… (# Rubrik, ## Underrubrik, **fet**, *kursiv*, = Wiki rubrik =)',
            }),
            CharacterCount,
        ],
        inputRules: [WikiHeading1, WikiHeading2],
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
}
