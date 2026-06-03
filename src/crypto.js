// Krypto-lager för Author — identisk med Mentor
// AES-256-GCM + PBKDF2 nyckelhantering

let krypteringsNyckel = null

export function hämtaNyckel() { return krypteringsNyckel }
export function sättNyckel(k) { krypteringsNyckel = k }

function base64TillBuffer(base64) {
    const bin = atob(base64)
    return Uint8Array.from(bin, c => c.charCodeAt(0))
}

export async function dekryptera(payload) {
    if (!krypteringsNyckel) return null
    try {
        const iv   = base64TillBuffer(payload.iv)
        const data = base64TillBuffer(payload.data)
        const dec  = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, krypteringsNyckel, data)
        return JSON.parse(new TextDecoder().decode(dec))
    } catch { return null }
}

export async function importeraNyckelMedLösenord(lösenord, nyckelData) {
    const salt       = base64TillBuffer(nyckelData.salt)
    const iv         = base64TillBuffer(nyckelData.iv)
    const wrappedKey = base64TillBuffer(nyckelData.wrappedKey)

    const keyMaterial = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(lösenord), 'PBKDF2', false, ['deriveKey']
    )
    const wrappingKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' },
        keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['unwrapKey']
    )
    return crypto.subtle.unwrapKey(
        'raw', wrappedKey, wrappingKey,
        { name: 'AES-GCM', iv }, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
    )
}

// Visa lösenordsdialog och returnera upplåst nyckel
export function visaLösenordsDialog(wrappedKeyData) {
    return new Promise((resolve, reject) => {
        const overlay = document.createElement('div')
        overlay.style.cssText = `
            position:fixed;inset:0;background:rgba(0,0,0,0.8);
            z-index:9999;display:flex;align-items:center;justify-content:center;
        `
        overlay.innerHTML = `
            <div style="background:#1a1610;border:1px solid #333;border-radius:10px;
                        padding:28px;width:340px;font-family:'DM Mono',monospace;
                        font-size:12px;color:#f5f0e8;line-height:1.7;">
                <div style="color:#f0c040;font-weight:600;margin-bottom:10px;font-size:13px;">
                    🔐 Av sekretesskäl är dina projekt krypterade.
                </div>
                <p style="opacity:0.7;margin-bottom:16px;font-size:11px;">
                    Ange ditt AIuda-lösenord för att läsa dina Mentor-projekt.
                </p>
                <input id="author-pwd" type="password" placeholder="Ditt lösenord"
                    style="width:100%;padding:9px;background:#2a2218;border:1px solid #444;
                           border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;
                           margin-bottom:8px;box-sizing:border-box;">
                <div id="author-pwd-fel" style="color:#ff6b6b;font-size:11px;
                                                margin-bottom:8px;display:none;">
                    Fel lösenord — försök igen
                </div>
                <button id="author-pwd-ok" style="width:100%;padding:10px;background:#f0c040;
                    color:#1a1610;border:none;border-radius:6px;cursor:pointer;
                    font-weight:600;font-family:inherit;margin-bottom:8px;">
                    Lås upp →
                </button>
                <button id="author-pwd-avbryt" style="width:100%;padding:8px;
                    background:transparent;color:#f5f0e8;border:1px solid #444;
                    border-radius:6px;cursor:pointer;font-family:inherit;
                    font-size:11px;opacity:0.5;">
                    Avbryt
                </button>
            </div>
        `
        document.body.appendChild(overlay)

        const input = overlay.querySelector('#author-pwd')
        setTimeout(() => input.focus(), 50)

        overlay.querySelector('#author-pwd-ok').addEventListener('click', async () => {
            const lösenord = input.value
            if (!lösenord) return
            try {
                const nyckel = await importeraNyckelMedLösenord(lösenord, wrappedKeyData)
                sättNyckel(nyckel)
                overlay.remove()
                resolve(nyckel)
            } catch {
                overlay.querySelector('#author-pwd-fel').style.display = 'block'
                input.value = ''
                input.focus()
            }
        })

        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') overlay.querySelector('#author-pwd-ok').click()
        })

        overlay.querySelector('#author-pwd-avbryt').addEventListener('click', () => {
            overlay.remove()
            reject(new Error('Avbrutet'))
        })
    })
}
