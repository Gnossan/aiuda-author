# AIuda Author™ — Produktvision

**Datum:** 2026-06-01  
**Status:** Tidig utveckling

---

## Kärnfilosofi

**AI stödjer tänkandet — ersätter det inte.**

**AI:s åtkomstmodell:**
- **Vänster panel** (disposition + chatt) — läs- och skrivåtkomst
- **Höger panel** (research-sammanfattning) — läs- och skrivåtkomst
- **Skrivytan** (studentens text) — enbart läsåtkomst

AI kan läsa studentens text för att ge feedback, men kan aldrig skriva i den.

AIuda Author är designat för att lärare och kursledare ska *tillåta* studenter att använda det. Det innebär att AI aldrig genererar löpande text. Studenten skriver själv. AI hjälper med struktur, feedback och de mekaniska delarna av skrivprocesset.

---

## Vad AI får göra

### ✅ Disposition
Baserat på research-frågan och källorna från Mentor analyserar AI och föreslår en möjlig struktur — rubriker, avsnitt, logisk ordning. Studenten beslutar vad de vill använda.

### ✅ Skrivtips och feedback
AI kommenterar det studenten skrivit:
- "Det här avsnittet saknar ett konkret exempel"
- "Argumentet är inte underbyggt"
- "Röda tråden tappas här"
- Ställer motfrågor: "Har du övervägt X-perspektivet?"

AI genererar *aldrig* ersättningstext — bara frågor och kommentarer.

### ✅ Idéer och förslag
AI kan lyfta fram vinklar och perspektiv som kanske inte täcks, baserat på research. Studenten väljer om och hur de vill använda dem.

### ✅ Notapparat och fotnoter
AI formaterar fotnoter korrekt utifrån vald referensstil. Kan föreslå var i texten en fotnot borde sitta — men studenten skriver vad fotnoten ska säga.

### ✅ Litteraturlista
AI genererar automatisk litteraturlista från källloggen i Mentor i vald stil:
- APA
- Chicago
- Harvard
- Vancouver
- Oxford

Källloggen i Mentor → formaterad litteraturlista i Author.

---

## Vad AI inte får göra

### ❌ Generera löpande text
AI skriver inte meningar, stycken eller avsnitt åt studenten.

### ❌ Omformulera studentens text
AI föreslår inte alternativa formuleringar — det är studentens röst.

---

## Transparenslogg

Varje AI-interaktion loggas:
- Vilken typ av hjälp begärdes (disposition, feedback, notat)
- Tidpunkt
- Vad studenten faktiskt använde

Läraren kan begära loggen för att se hur AI användes i uppsatsen. Det bygger förtroende och möjliggör pedagogisk uppföljning.

---

## Integration med Mentor

- **Källlogg** → litteraturlista (automatisk, formaterad)
- **Research-fråga** → grund för dispositionsförslag
- **Sessionslogg** → kontext för feedback ("du har forskat om X — täcker texten det?")

---

## Skrivmiljö

- **Hybrid editor** — Markdown-genvägar renderas direkt (som Notion)
- **Fokusläge** — ren skrivyta utan distraktioner
- **Framtida vyer** — disposition-vy, feedback-vy, export-vy

---

## Målgrupp

- Gymnasie- och högskolestudenter
- Akademiska skribenter
- Forskare som vill gå från Mentor-research till skriven text
- Alla kurser där läraren vill tillåta AI-stöd men inte AI-genererad text

---

## Export

- `.md` (Markdown)
- `.docx` (Word)
- `.pdf`

---

## Opponenten

En AI-opponent som på begäran granskar arbetet kritiskt — inte för att skriva om det, utan för att hitta svagheter.

### Uppgift
Opponenten har tillgång till samma Mentor-projekt som skrivarbetet bygger på och kan:
- Identifiera var det **pågående skrivarbetet** behöver åtgärdas (logikbrister, glapp, ej täckt av research)
- Hitta svagheter i **frågeställning** (för bred, för smal, oklar)
- Granska **metod** (håller den för det den påstår?)
- Ifrågasätta **resultat** (stöds de av underlaget?)
- Utmana **slutsats** (är den välgrundad? Fabriceras något?)
- Peka på **intern inkonsekvens** — påståenden som motsäger varandra

Opponenten ger aldrig färdiga omformuleringar. Den ställer frågor och pekar ut problemen — studenten löser dem.

### Tillgång
Samma åtkomstmodell som övrig AI:
- Läsåtkomst till skrivytan
- Läs-/skrivåtkomst till vänster panel (feedback visas där)
- Åtkomst till Mentor-projektet för att jämföra research mot text

### Status lights (idé — ej beslutad)
Möjlig visuell indikator per avsnitt i texten — grön/gul/röd baserat på opponentens bedömning. Kräver genomtänkt UX för att inte uppmuntra "jaga grönt" istället för kritiskt tänkande.

---

## Roadmap — på begäran

Funktioner som inte är med i MVP men som kan läggas till vid efterfrågan:

| Funktion | Issue | Kommentar |
|---|---|---|
| Export-dropdown (.html, .tex, .wiki) | #2 | Konverterarna finns, bara UI |
| LaTeX-trigger-övervägande | #3 | \\ vs / som picker-trigger |
| Matematiksymboler (KaTeX/MathJax) | #4 | Viktigt för matematik/fysik/ekonometri |
| Fotnots-editor | — | Studenter behöver fotnots-hantering |
| Versionshistorik | — | Se hur texten förändrats över tid |
| Kommentarer och feedback | — | Lärare kommenterar studenttexten |
| Realtidssamarbete | — | Flera skriver samtidigt |
| Mobiloptimering | — | Begränsad skrivyta, annorlunda UX |

## Kryptering och nyckelhantering

Author delar krypteringsnyckel med Mentor — ett lösenord för hela AIuda-ekosystemet.

**Flöde vid inloggning:**
1. Användaren loggar in med Google (Firebase Auth)
2. Author hämtar `wrappedKey` från `users/{uid}/kryptering/nyckel` i Firebase
3. Användaren anger sitt AIuda-lösenord → PBKDF2 härleder nyckeln
4. Nyckeln används för att:
   - Dekryptera Mentor-data (höger panel: projekt, sources, sammanfattningar)
   - Kryptera Authors egna dokument vid sparning

**Konsekvens:** Authors dokument är åtkomliga från valfri enhet med rätt lösenord — samma löfte som Mentor ger.

## Sidpaneler

### Amend — komplettera från Mentor

En **Amend-knapp** i höger panel hämtar nytt material från Mentor-projektet och kompletterar den befintliga research-sammanfattningen.

Användningsfall: studenten har fortsatt sin research i Mentor efter att sammanfattningen genererades. Amend uppdaterar höger panel med det som tillkommit — utan att skriva om det som redan finns.

```
Mentor (uppdaterad research) ──→ Amend ──→ Höger panel (kompletteras)
```

---

### Höger panel — Mentor-integration

**Tekniskt:**
- Hämtar data direkt från Firebase (ingen plugin krävs — Author är webbapp)
- Kräver AIuda-lösenordet för dekryptering

**AI-genererad research-sammanfattning:**
AI läser projektets innehåll (chatthistorik, sessionsloggar, anteckningar, källor) och genererar en strukturerad sammanfattning av det som faktiskt finns.

Möjliga avsnitt: frågeställning, bakgrund, metod, material, resultat, diskussion, slutsats — men **bara de avsnitt som faktiskt framgår av researchen**. Saknas ett avsnitt genereras det inte. Studenten måste fylla luckan själv.

Exempel: om projektet har tydlig frågeställning och källor men ingen slutsats → AI presenterar frågeställning och källor, noterar att slutsats saknas — skriver ingenting dit.

**Syfte:** Fungerar som spegel — visar studenten vad researchen faktiskt täcker och var det finns gap att fylla i texten.

### Vänster panel — Disposition och AI-chatt

**Disposition:**
Parallellt med eller direkt efter att höger panel är klar genererar AI en disposition — rubriker och bulletlists baserade på samma research. Samma princip: bara det som faktiskt finns i researchen, inga fabricerade avsnitt.

Dispositionen är ett förslag, inte ett facit. Studenten väljer vad de vill använda.

**AI-chatt:**
I vänster panel chattar studenten med AI om skrivprocessen:
- "Hur bör jag strukturera metodavsnittet?"
- "Vad saknas i mitt argument?"
- "Ge feedback på den här meningen"
- "Vilka perspektiv har jag inte täckt?"

AI svarar med frågor, tips och feedback — skriver aldrig löpande text åt studenten.

## Vad som återstår att besluta

- Betalmodell (Web Store vs Stripe)
- Referenshanteringsformat per ämnesområde
- Hur AI-assistansen presenteras utan att uppmuntra copy-paste
