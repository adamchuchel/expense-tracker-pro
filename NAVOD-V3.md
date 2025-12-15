# 🚀 Expense Tracker v3.0 - Kompletní Návod

## ✨ CO JE NOVÉHO

### Real-time synchronizace s Google Sheets
- **Centrální databáze** - všechna data v jednom Google Sheet
- **Okamžitá synchronizace** - všichni vidí změny hned
- **Nezávislé skupiny** - každý má své + sdílené
- **Pozvánky do skupin** - pozveš kamaráda jeho emailem

### Správně navržená architektura
```
Aplikace → Apps Script API → Google Sheets Databáze
```

---

## 📋 INSTALACE - KROK ZA KROKEM

### 🔧 ČÁST 1: Google Cloud Console (5 minut)

#### 1. Otevři existující projekt
- Máš už projekt z předchozí verze ✅
- Použiješ stejný Client ID ✅

#### 2. Client ID máš připravený
```
TEN_CLIENT_ID_CO_UZ_MAS.apps.googleusercontent.com
```

---

### 📊 ČÁST 2: Google Sheets (3 minuty)

#### 1. Vytvoř novou tabulku
- Jdi na: https://docs.google.com/spreadsheets
- Nový list
- Název: **"Expense Tracker Database"**

#### 2. Vytvoř 4 listy s těmito názvy:

**List 1: "users"**
```
A: user_id
B: email  
C: name
D: picture
E: created_at
```

**List 2: "groups"**
```
A: group_id
B: name
C: owner_email
D: created_at
```

**List 3: "group_members"**
```
A: group_id
B: member_email
C: member_name
D: role
E: joined_at
```

**List 4: "transactions"**
```
A: transaction_id
B: group_id
C: type
D: description
E: amount
F: currency
G: amount_czk
H: paid_by
I: split_between
J: category
K: note
L: date
M: created_by
N: created_at
```

#### 3. Formátuj hlavičky (volitelné)
- Tučné písmo (Ctrl+B)
- Modrá barva (#3b82f6)
- Freeze row 1

---

### ⚙️ ČÁST 3: Apps Script (5 minut)

#### 1. Otevři Apps Script
- V tabulce: **Extensions → Apps Script**

#### 2. Vlož backend kód
- Smaž výchozí kód
- Zkopíruj obsah `apps-script.gs`
- Vlož do editoru
- **Ulož** (Ctrl+S)

#### 3. Deploy
1. **Deploy → New deployment**
2. Typ: **Web app**
3. Nastavení:
   - Description: "v3.0"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. **Deploy**
5. **Authorize** (stejně jako minule)
6. **Zkopíruj Web App URL:**
   ```
   https://script.google.com/macros/s/AKfy...abc123.../exec
   ```

---

### 💻 ČÁST 4: Aplikace (2 minuty)

#### 1. Uprav auth.js
Otevři `auth.js` a na řádku 3:

```javascript
const GOOGLE_CLIENT_ID = 'TVŮJ_CLIENT_ID.apps.googleusercontent.com';
```

Vlož svůj Client ID z ČÁSTI 1.

#### 2. Nahraj na GitHub
1. Jdi na: https://github.com/adamchuchel/expense-tracker-pro
2. Nahraď VŠECHNY soubory novými:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `auth.js`
   - `manifest.json`
   - `sw.js`
   - ikony (pokud chceš)

3. Commit: "v3.0 - Real-time sync with database"

---

### ✅ ČÁST 5: První spuštění (3 minuty)

#### 1. Otevři aplikaci
```
https://adamchuchel.github.io/expense-tracker-pro/
```

#### 2. Přihlaš se
- Klikni "Sign in with Google"
- Vyber svůj účet
- ✅ Jsi přihlášen!

#### 3. Nastav Apps Script URL
1. **Tab Nastavení** (⚙️)
2. **Google Apps Script URL**
3. Vlož URL z ČÁSTI 3
4. **Klikni "Uložit URL"**
5. **Klikni "Test připojení"**
6. Mělo by vypsat: ✅ Expense Tracker API v3.0

#### 4. Vytvoř první skupinu
1. **Klikni na "Výchozí skupina"** (nahoře)
2. **+ Nová skupina**
3. Název: např. "Thajsko 2025"
4. **Vytvořit**

#### 5. Přidej výdaj
1. **Tab "Přidat"**
2. Vyplň formulář
3. **Přidat výdaj**

#### 6. Zkontroluj Google Sheets
- Otevři tabulku
- List **"transactions"** → měl by tam být tvůj výdaj!
- List **"groups"** → tvoje skupina
- List **"group_members"** → ty jako člen

---

## 👥 JAK PŘIDAT KAMARÁDY

### Způsob 1: Pozvi do existující skupiny (WIP)

**Poznámka:** Funkce pozvánky ještě není v UI, ale backend je připraven.

Prozatím:
1. Otevři Google Sheet
2. List **"group_members"**
3. Ručně přidej řádek:
   ```
   group_id: [ID skupiny z listu groups]
   member_email: kamarad@email.com
   member_name: Jméno Kamaráda
   role: member
   joined_at: 2025-12-14T09:00:00
   ```

### Způsob 2: Kamarád si vytvoří svou skupinu
1. Pošli mu link na aplikaci
2. Přihlásí se svým Google účtem
3. Vytvoří si vlastní skupinu
4. Přidá své výdaje
5. Všichni členové skupiny je vidí

---

## 🔄 JAK TO FUNGUJE

### Synchronizace
- **Automatická** - při každém přidání výdaje
- **Manuální** - tlačítko ⟳ (načte nejnovější data)
- **Real-time** - všichni vidí změny okamžitě

### Databáze
```
users → všichni registrovaní uživatelé
groups → všechny skupiny
group_members → kdo je ve které skupině
transactions → všechny výdaje a příjmy
```

### Oprávnění
- **Owner** - může mazat skupinu, pozvat členy
- **Member** - může přidávat výdaje, vidět bilanci

---

## 🎯 POUŽITÍ

### Základní workflow:

1. **Přihlásíš se** → Google OAuth
2. **Vytvoříš skupinu** → např. "Víkend v horách"
3. **Pozvešš kamarády** → jejich emaily
4. **Přidáváš výdaje** → všichni je vidí
5. **Tab Bilance** → kdo komu dluží
6. **Vyrovnáte** → označíš jako vyrovnáno

### Pro kamarády:
1. **Dostanou link** → https://adamchuchel.github.io/expense-tracker-pro/
2. **Přihlásí se** → svým Google účtem
3. **Vidí skupinu** → automaticky (jsou v group_members)
4. **Přidávají výdaje** → ty je vidíš okamžitě

---

## 🐛 ŘEŠENÍ PROBLÉMŮ

### Nepřihlásí mě to
→ Zkontroluj Client ID v `auth.js`
→ Musí být správně zadaný

### Apps Script test nefunguje
→ URL musí končit na `/exec`
→ "Who has access" = Anyone
→ Zkus znovu Authorize

### Synchronizace nefunguje
→ Zkontroluj Apps Script URL v Nastavení
→ Zkontroluj Console (F12) - tam jsou errory
→ Zkus Test připojení

### Nevidím skupinu kamaráda
→ Musíš být přidán v `group_members`
→ Zkontroluj v Google Sheets

### Data se neukládají
→ Zkontroluj, že listy v Sheets mají správné názvy
→ Zkontroluj, že sloupce jsou správně pojmenované

---

## 📊 STRUKTURA DAT

### users
```csv
user_id, email, name, picture, created_at
uuid-123, adam@email.com, Adam, https://..., 2025-12-14T...
```

### groups
```csv
group_id, name, owner_email, created_at
uuid-456, Thajsko 2025, adam@email.com, 2025-12-14T...
```

### group_members
```csv
group_id, member_email, member_name, role, joined_at
uuid-456, adam@email.com, Adam, owner, 2025-12-14T...
uuid-456, petra@email.com, Petra, member, 2025-12-14T...
```

### transactions
```csv
transaction_id, group_id, type, description, amount, currency, amount_czk, paid_by, split_between, category, note, date, created_by, created_at
uuid-789, uuid-456, expense, Večeře, 800, CZK, 800, adam@email.com, [{"person":"adam@..."},{"person":"petra@..."}], Jídlo, Skvělá restaurace, 2025-12-14T19:00, adam@email.com, 2025-12-14T...
```

---

## 🎉 HOTOVO!

Teď máš:
- ✅ Real-time synchronizaci
- ✅ Centrální databázi v Google Sheets
- ✅ Nezávislé skupiny
- ✅ Google přihlášení
- ✅ Správně navržený backend

**Užij si to! 🚀**

---

## 📝 POZNÁMKY

### Co funguje:
- ✅ Google přihlášení
- ✅ Vytváření skupin
- ✅ Přidávání výdajů/příjmů
- ✅ Synchronizace do Sheets
- ✅ Načítání dat ze Sheets
- ✅ Multi-měna
- ✅ Grafy (basic)
- ✅ Bilance

### Co ještě chybí (můžeme dodělat):
- ⏳ UI pro pozvánky do skupin (backend ready)
- ⏳ Mazání transakcí (backend ready)
- ⏳ Editace skupin
- ⏳ Real-time refresh (auto každých 30s)
- ⏳ Push notifikace

---

Máš otázku? Něco nefunguje? Dej vědět! 😊
