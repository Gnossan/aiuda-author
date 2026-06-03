import { db, auth } from './auth.js'
import { collection, getDocs, doc, getDoc, setDoc, query, orderBy, limit } from 'firebase/firestore'
import { hämtaNyckel, dekryptera, visaLösenordsDialog } from './crypto.js'

// Hämta och lås upp krypteringsnyckeln om behövs
export async function säkerställNyckel() {
    if (hämtaNyckel()) return hämtaNyckel()

    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Ej inloggad')

    const ref = doc(db, 'users', uid, 'kryptering', 'nyckel')
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new Error('Ingen krypteringsnyckel hittad')

    return visaLösenordsDialog(snap.data())
}

// Hämta Mentor-projektlistan med dekrypterade namn
export async function hämtaProjektlista() {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Ej inloggad')

    const q = query(
        collection(db, 'users', uid, 'mentor_projekt'),
        orderBy('senastSparat', 'desc'),
        limit(50)
    )
    const snap = await getDocs(q)
    const nyckel = hämtaNyckel()

    const projekt = await Promise.all(snap.docs.map(async d => {
        const data = d.data()
        let namn = data.namn || ''
        let fraga = data.fraga || ''

        // Dekryptera metadata om nyckel finns
        if (nyckel && data.krypteradMetadata) {
            const meta = await dekryptera(data.krypteradMetadata)
            if (meta) { namn = meta.namn || ''; fraga = meta.fraga || '' }
        }

        return {
            id: d.id, namn, fraga,
            senastSparat: data.senastSparat?.toDate?.()?.toISOString() || null
        }
    }))

    return projekt
}

// Hämta och dekryptera ett specifikt projekt
export async function hämtaProjekt(projektId) {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Ej inloggad')

    const ref = doc(db, 'users', uid, 'mentor_projekt', projektId)
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new Error('Projekt hittades inte')

    const data = snap.data()
    const nyckel = hämtaNyckel()
    let historik = []
    let metadata = {}

    if (nyckel) {
        if (data.krypteradHistorik) {
            historik = await dekryptera(data.krypteradHistorik) || []
        }
        if (data.krypteradMetadata) {
            metadata = await dekryptera(data.krypteradMetadata) || {}
        }
    }

    return { id: snap.id, historik, metadata, ...data }
}

// Spara genererad sammanfattning och disposition till Firebase
export async function sparaAuthorData(projektId, sammanfattning, disposition) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const ref = doc(db, 'users', uid, 'mentor_projekt', projektId)
    await setDoc(ref, {
        authorSammanfattning: sammanfattning || null,
        authorDisposition: disposition || null,
        authorGenererad: new Date().toISOString()
    }, { merge: true })
}

const MENTOR_BACKEND = 'https://aiuda-mentor-backend.vercel.app'

// Generera disposition via AI
export async function genereraDisposition(projekt) {
    const token = await auth.currentUser?.getIdToken()
    if (!token) throw new Error('Ej inloggad')

    const synligHistorik = (projekt.historik || [])
        .filter(m => !m.silent && typeof m.content === 'string')
        .slice(-40)

    if (!synligHistorik.length) return null

    const systemprompt = `Du är en research-assistent som hjälper studenter strukturera sitt skrivande.`

    const dispositionsFraga = `Baserat på den här research-konversationen, skapa en disposition för en akademisk text.

Använd bara det som faktiskt finns i researchen — ingen fabricering.
Format: rubriker (##) med bullet points (-) under varje.
Om ett avsnitt saknas i researchen, ta inte med det.
Skriv på samma språk som konversationen.
Håll det koncist — max 3-4 bullets per rubrik.`

    const historikMedFraga = [
        ...synligHistorik,
        { role: 'user', content: dispositionsFraga }
    ]

    let resp
    try {
        resp = await fetch(`${MENTOR_BACKEND}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                historik: historikMedFraga,
                systemprompt,
                model: 'claude-sonnet-4-6'
            })
        })
    } catch (e) {
        throw new Error(`Nätverksfel: ${e.message}`)
    }

    if (!resp.ok) throw new Error(`Backendfel: ${resp.status}`)
    const data = await resp.json()
    return data.result?.content?.[0]?.text || null
}

// Generera research-sammanfattning via AI
export async function genereraResearchSammanfattning(projekt, onChunk) {
    const token = await auth.currentUser?.getIdToken()
    if (!token) throw new Error('Ej inloggad')

    // Bygg kontext från historiken
    const synligHistorik = (projekt.historik || [])
        .filter(m => !m.silent && typeof m.content === 'string')
        .slice(-40) // Max 40 meddelanden

    if (!synligHistorik.length) {
        return 'Projektet har ingen chatthistorik att sammanfatta.'
    }

    const systemprompt = `Du är en research-assistent som hjälper studenter sammanfatta sin research.`

    const sammanfattningsFraga = `Sammanfatta BARA det som faktiskt finns i den här research-konversationen.
Möjliga avsnitt: frågeställning, bakgrund, metod, material, resultat, diskussion, slutsats.
Inkludera BARA avsnitt som faktiskt framgår — fabricera inget.
Om ett avsnitt saknas, hoppa över det helt.
Skriv på samma språk som konversationen. Max 3-4 meningar per avsnitt.`

    // Sammanfattningsfrågan läggs till som sista user-meddelande
    const historikMedFraga = [
        ...synligHistorik,
        { role: 'user', content: sammanfattningsFraga }
    ]

    let resp
    try {
        resp = await fetch(`${MENTOR_BACKEND}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                historik: historikMedFraga,
                systemprompt,
                model: 'claude-sonnet-4-6'
            })
        })
    } catch (e) {
        throw new Error(`Nätverksfel: ${e.message}. Kontrollera att du är ansluten.`)
    }

    if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        throw new Error(`Backendfel ${resp.status}: ${text.slice(0, 100)}`)
    }
    const data = await resp.json()
    console.log('Historik-längd:', synligHistorik.length)
    console.log('data.error:', data.error)
    console.log('data.result type:', typeof data.result)
    console.log('data.result.content:', JSON.stringify(data.result?.content)?.slice(0, 200))
    return data.result?.content?.[0]?.text || `Svar saknas. error=${data.error} result=${JSON.stringify(data.result)?.slice(0,100)}`
}

// Visa projekt-picker dialog
export function visaProjektPicker(projekt, onValt) {
    const existing = document.getElementById('projekt-picker')
    existing?.remove()

    const dialog = document.createElement('div')
    dialog.id = 'projekt-picker'
    dialog.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.7);
        z-index: 9999; display: flex; align-items: center; justify-content: center;
    `

    const box = document.createElement('div')
    box.style.cssText = `
        background: #211c14; border: 1px solid #444; border-radius: 10px;
        padding: 24px; width: 440px; max-height: 70vh;
        font-family: 'DM Mono', monospace; font-size: 12px; color: #f5f0e8;
        display: flex; flex-direction: column; gap: 12px;
    `

    const rubrik = document.createElement('div')
    rubrik.style.cssText = 'font-size: 14px; font-weight: 600; color: #f0c040;'
    rubrik.textContent = 'Välj Mentor-projekt'

    const lista = document.createElement('div')
    lista.style.cssText = 'overflow-y: auto; max-height: 50vh; display: flex; flex-direction: column; gap: 6px;'

    if (!projekt.length) {
        lista.innerHTML = '<div style="opacity:0.5;padding:12px;">Inga projekt hittades.</div>'
    } else {
        projekt.forEach(p => {
            const el = document.createElement('div')
            el.style.cssText = `
                padding: 10px 14px; border: 1px solid #333; border-radius: 6px;
                cursor: pointer; transition: background 0.15s;
            `
            el.innerHTML = `
                <div style="font-weight:600;margin-bottom:3px;color:#f0c040;">
                    ${p.namn || p.fraga?.slice(0, 40) || p.id}
                </div>
                <div style="opacity:0.6;font-size:11px;">${p.fraga?.slice(0, 80) || ''}</div>
            `
            el.addEventListener('mouseover', () => el.style.background = 'rgba(240,192,64,0.08)')
            el.addEventListener('mouseout', () => el.style.background = '')
            el.addEventListener('click', () => {
                dialog.remove()
                onValt(p)
            })
            lista.appendChild(el)
        })
    }

    const avbryt = document.createElement('button')
    avbryt.textContent = 'Avbryt'
    avbryt.style.cssText = `
        padding: 8px; background: transparent; border: 1px solid #444;
        border-radius: 5px; color: #f5f0e8; cursor: pointer;
        font-family: 'DM Mono', monospace; font-size: 11px; opacity: 0.6;
    `
    avbryt.addEventListener('click', () => dialog.remove())

    box.append(rubrik, lista, avbryt)
    dialog.appendChild(box)
    document.body.appendChild(dialog)

    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.remove() })
}
