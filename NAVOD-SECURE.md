# 🔒 Výdaje - Zabezpečená Verze - Kompletní Návod

## 🎯 Co je nového?

### ✅ Zabezpečení:
- **Google OAuth přihlášení** - přihlášení přes Google účet
- **Soukromá data** - vidíš jen ty a lidé, kterým dáš přístup
- **Apps Script backend** - bezpečné API bez klíčů v kódu
- **Žádné veřejné API klíče** - všechno je zabezpečené

### ✅ Opravené UI problémy:
- **Sticky navigace** - horní menu a dolní menu zůstávají na místě
- **Responzivní pro všechny iPhony** - od SE až po Pro Max
- **Viditelné notifikace** - vždy nahoře (z-index 9999)
- **Fungující přepínač Výdaj/Příjem** - různé formuláře
- **Nativní iOS picker pro částku** - celá čísla (bez haléřů)
- **Větší touch targets** - min. 44px (Apple guidelines)
- **Safe area support** - pro notch/Dynamic Island

### ✅ Všechny původní funkce:
- Skupiny, kategorie, multi-měna
- Flexibilní dělení, grafy, statistiky
- Vyrovnání dluhů, offline režim

---

## 🚀 Instalace - Krok za krokem

### ČÁST 1: Google Cloud Console (10 minut)

#### 1. Vytvoř OAuth Client ID

1. **Jdi na:** https://console.cloud.google.com
2. **Vytvoř nový projekt:**
   - Klikni na dropdown projektu (nahoře)
   - "New Project"
   - Název: "Expense Tracker Secure"
   - Create

3. **Konfigurace OAuth Consent Screen:**
   - V levém menu: **APIs & Services** → **OAuth consent screen**
   - User Type: **External**
   - Klikni **Create**
   - Vyplň:
     - App name: "Výdaje - Zabezpečené"
     - User support email: tvůj email
     - Developer contact: tvůj email
   - Klikni **Save and Continue**
   - Scopes: jen **Skip** (nechej prázdné)
   - Test users: **Skip**
   - Summary: **Back to Dashboard**

4. **Vytvoř OAuth Client ID:**
   - V levém menu: **Credentials**
   - Klikni **+ CREATE CREDENTIALS**
   - Vyber: **OAuth client ID**
   - Application type: **Web application**
   - Name: "Expense Tracker Web"
   - Authorized JavaScript origins:
     - Klikni **+ ADD URI**
     - Vlož: `https://adamchuchel.github.io`
   - Authorized redirect URIs: **nechej prázdné**
   - Klikni **Create**

5. **Zkopíruj Client ID:**
   - Objeví se dialog s Client ID
   - Vypadá: `123456789-abc...xyz.apps.googleusercontent.com`
   - **ZKOPÍRUJ SI HO** - budeš ho potřebovat!

---

### ČÁST 2: Google Apps Script (5 minut)

#### 1. Vytvoř Google tabulku

1. **Jdi na:** https://docs.google.com/spreadsheets
2. **Nový list** (zelené +)
3. **Pojmenuj:** "Výdaje - 2025"

#### 2. Vytvoř Apps Script

1. **V tabulce:** Extensions → Apps Script
2. **Smaž vše** v editoru (výchozí kód)
3. **Zkopíruj obsah souboru `apps-script.gs`** (z této složky)
4. **Vlož** do editoru
5. **Ulož:** Ctrl+S nebo ikona diskety
6. **Pojmenuj projekt:** "Expense Tracker Backend"

#### 3. Nasazení (Deploy)

1. **Klikni:** Deploy → New deployment
2. **Typ:** Vyber ikonu "ozubeného kolečka" → **Web app**
3. **Nastavení:**
   - Description: "v1"
   - Execute as: **Me** (tvůj email)
   - Who has access: **Anyone**
4. **Klikni:** Deploy
5. **Autorizace:**
   - Objeví se: "Authorization required"
   - Klikni **Authorize access**
   - Vyber svůj Google účet
   - Pokud varování "Google hasn't verified this app":
     - Klikni **Advanced**
     - Klikni **Go to [název projektu] (unsafe)**
   - Klikni **Allow**

6. **Zkopíruj Web App URL:**
   - Vypadá: `https://script.google.com/macros/s/AKfy...abc123.../exec`
   - **ZKOPÍRUJ SI HO** - budeš ho potřebovat!

---

### ČÁST 3: Upravení kódu aplikace (3 minuty)

#### 1. Uprav auth.js

Otevři soubor `auth.js` a na řádku 3 nahraď:

```javascript
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
```

**Za:**
```javascript
const GOOGLE_CLIENT_ID = 'TVŮJ_CLIENT_ID.apps.googleusercontent.com';
```

(Vlož Client ID z ČÁSTI 1, krok 5)

---

### ČÁST 4: Nahrání na GitHub (5 minut)

#### 1. Aktualizuj repository

1. **Jdi na:** https://github.com/adamchuchel/expense-tracker-pro
2. **Klikni na každý soubor** a nahraď ho novým:
   - `index.html` → nahraď
   - `styles.css` → nahraď
   - `app.js` → nahraď
   - `auth.js` → nahraď (s tvým Client ID!)
   - `manifest.json` → nahraď
   - Přidej nový: `apps-script.gs` (pro dokumentaci)

**NEBO jednodušeji:**

1. **Smaž všechny staré soubory** z repository
2. **Upload všechny nové** najednou (drag & drop)
3. **Commit:** "Update to secure version"

#### 2. Počkej na GitHub Pages

- GitHub Pages se automaticky aktualizuje (1-2 minuty)
- URL zůstane stejné: `https://adamchuchel.github.io/expense-tracker-pro/`

---

### ČÁST 5: První spuštění (3 minuty)

#### 1. Otevři aplikaci

1. **Jdi na:** `https://adamchuchel.github.io/expense-tracker-pro/`
2. **Měl bys vidět** přihlašovací obrazovku s tlačítkem "Sign in with Google"

#### 2. Přihlaš se

1. **Klikni** na "Sign in with Google"
2. **Vyber** svůj Google účet
3. **Aplikace se načte** - jsi přihlášen!

#### 3. Nastav Apps Script URL

1. **Klikni** na tab "Nastavení" (⚙️ úplně vpravo)
2. **Sekce "Google Apps Script URL"**
3. **Vlož** URL z ČÁSTI 2, krok 6
4. **Klikni** "Uložit URL"
5. **Klikni** "Test připojení"
6. **Mělo by vypsat:** ✅ Připojeno: Apps Script funguje!

#### 4. Přidej členy a vyzkoušej

1. **Nastavení** → Účastníci skupiny
2. **Smaž** "Osoba 2", "Osoba 3"
3. **Přidej** své kamarády
4. **Tab "Přidat"** → přidej testovací výdaj
5. **Klikni ⟳** (sync button) → data se zkopírují do Google Sheets!

---

## 📱 Instalace na iPhone

1. **Otevři v Safari:** `https://adamchuchel.github.io/expense-tracker-pro/`
2. **Přihlaš se** Google účtem
3. **Tlačítko Sdílet** 📤 (dole uprostřed)
4. **"Přidat na plochu"**
5. **Pojmenuj:** "Výdaje" 💎
6. **Přidat**

**Hotovo!** Máš aplikaci na ploše s ikonou! 🎉

---

## 👥 Přidání dalších uživatelů do skupiny

### Způsob 1: Sdílení Google tabulky

1. **Otevři tabulku** (kde běží Apps Script)
2. **Klikni "Sdílet"**
3. **Přidej emaily** kamarádů
4. **Oprávnění:** Editor (aby mohli přidávat data)
5. **Pošli**

### Způsob 2: Link na aplikaci

1. **Pošli kamarádům** link: `https://adamchuchel.github.io/expense-tracker-pro/`
2. **Řekni jim:**
   - Přihlaš se Google účtem
   - Tab Nastavení → vlož Apps Script URL (pošli jim ho)
   - Přidat na plochu

---

## 🔒 Jak zabezpečení funguje

### Co je zabezpečené:

1. **Přihlášení:**
   - Musíš se přihlásit Google účtem
   - Bez přihlášení = žádný přístup k aplikaci

2. **Data:**
   - Uložená lokálně v zařízení
   - Synchronizace jen s tvou Google tabulkou
   - Apps Script běží pod tvým účtem

3. **Přístup k tabulce:**
   - Jen lidé, kterým ty dáš přístup
   - Přes Google sdílení (kontroluješ koho přidáš)

### Kdo vidí co:

- **Ty:** Všechno (jsi vlastník tabulky)
- **Kamarádi se sdílenou tabulkou:** Všechny výdaje skupiny
- **Ostatní:** Nic (potřebují přístup k tabulce)

---

## 🎯 Použití

### Základní workflow:

1. **Otevřeš aplikaci** → automaticky přihlášen (po prvním přihlášení)
2. **Přidáš výdaj** → klikneš ⟳ → data v Google Sheets
3. **Kamarád přidá výdaj** → klikne ⟳ → vidíš v Sheets
4. **Tab Bilance** → vidíš kdo komu dluží
5. **Vyrovnáte dluhy** → označíš jako vyrovnáno

### Tipy:

- **Offline režim:** Data se ukládají lokálně, sync až když budeš online
- **Více zařízení:** Přihlaš se na více zařízeních (mobil, tablet)
- **Skupiny:** Vytvoř skupinu pro každou akci/měsíc
- **Export:** Z Google Sheets → File → Download → Excel

---

## ⚙️ Opravené UI problémy

### Co je nového:

✅ **Sticky navigace:**
- Horní menu zůstává nahoře při scrollu
- Dolní menu zůstává dole

✅ **Responzivita:**
- Optimalizováno pro všechny velikosti iPhonů
- Správné zalamování textu
- Větší touch targety (44px minimum)

✅ **Notifikace:**
- Z-index 9999 - vždy viditelné
- Umístění pod hlavičkou
- Neskrývají se za elementy

✅ **Přepínač Výdaj/Příjem:**
- Kliknutím se změní formulář
- Různá pole pro výdaj vs. příjem
- Vizuálně odlišené

✅ **iOS Native Picker:**
- Nativní rolovací ciferník pro částku
- Pouze celá čísla (bez haléřů)
- `inputmode="numeric"` pro správnou klávesnici

✅ **Safe Area:**
- Podpora pro iPhone s notch
- Správné odsazení pro Dynamic Island
- `env(safe-area-inset-*)`

---

## 🐛 Řešení problémů

### Aplikace nejde nahrát na GitHub
→ Ujisti se, že soubory jsou v ROOT složce (ne v podsložce)
→ Přejmenuj repository pokud potřeba

### "Sign in with Google" tlačítko se nezobrazuje
→ Zkontroluj Client ID v `auth.js`
→ Zkontroluj Authorized JavaScript origins v Google Console
→ Musí být: `https://adamchuchel.github.io`

### Apps Script test nefunguje
→ Zkontroluj, že Apps Script je nasazený (Deploy)
→ "Who has access" musí být "Anyone"
→ URL končí na `/exec` (ne `/dev`)

### Sync nefunguje
→ Test připojení musí fungovat nejdřív
→ Zkontroluj, že jsi přihlášen
→ Zkontroluj internet

### Notifikace nejsou vidět
→ Obnovit stránku (Ctrl+F5)
→ CSS je správně načtený?

---

## 📊 Rozdíly oproti staré verzi

| Funkce | Stará | **Nová (Secure)** |
|--------|-------|-------------------|
| Přihlášení | ❌ | ✅ Google OAuth |
| API klíč v kódu | ❌ Veřejný | ✅ Žádný |
| Backend | Sheets API | ✅ Apps Script |
| Sticky menu | ❌ | ✅ |
| Responzivita | Částečně | ✅ Optimalizováno |
| Notifikace viditelné | ❌ | ✅ Z-index 9999 |
| Přepínač Výdaj/Příjem | ❌ Nefunkční | ✅ Funguje |
| iOS Picker | ❌ | ✅ Nativní |
| Bezpečnost | Nízká | ✅ Vysoká |

---

## 💡 Časté otázky

**Q: Můžu použít bez Google účtu?**
A: Ne, Google přihlášení je povinné pro zabezpečení.

**Q: Vidí Google moje výdaje?**
A: Ne, data jsou jen v tvé tabulce a lokálně v zařízení.

**Q: Kolik to stojí?**
A: 0 Kč. Všechno zdarma (Google Sheets, Apps Script, GitHub Pages).

**Q: Můžu to použít offline?**
A: Ano, data se ukládají lokálně. Sync funguje až když jsi online.

**Q: Jak přidám kamaráda?**
A: Sdílej Google tabulku s jeho emailem + pošli mu link na aplikaci.

**Q: Můžu mít více skupin?**
A: Ano, neomezený počet skupin v aplikaci.

**Q: Funguje na Androidu?**
A: Ano, v Chrome → Menu → Přidat na plochu.

---

## 🎉 Hotovo!

Teď máš:
- ✅ Zabezpečenou aplikaci s Google přihlášením
- ✅ Opravené UI problémy
- ✅ Apps Script backend
- ✅ Všechny původní funkce
- ✅ Responzivní design
- ✅ Nativní iOS prvky

**Užij si to! 💎🚀**
