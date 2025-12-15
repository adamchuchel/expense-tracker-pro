# 🏢 FAMILY Organization - Verze 4.0

## ✨ CO JE NOVÉHO

### 🏢 FAMILY Organizace
- **Automatické členství** - kdo se přihlásí = člen FAMILY
- **Sdílená organizace** - všichni členové vidí navzájem
- **Neomezené skupiny** - každý si vytváří kolik chce

### 📬 Systém pozvánek
- **Pozvi emailem** - zadáš email, druhý dostane pozvánku
- **Přijmi/Odmítni** - každý kontroluje co přijme
- **Notifikace** - vidíš kolik máš pozvánek

### 👥 Správa skupin
- **Pozvat člena** - kdokoliv z FAMILY může pozvat
- **Odebrat člena** - owner může odebrat (kromě sebe)
- **Smazat skupinu** - owner může smazat (nevratné!)

---

## 📊 GOOGLE SHEETS - NOVÁ STRUKTURA

### Vytvoř 5 listů:

**List 1: "organization_members"**
```
A: user_email
B: user_name
C: picture
D: joined_at
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
E: invited_by
F: joined_at
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

**List 5: "invitations"**
```
A: invitation_id
B: group_id
C: group_name
D: invited_email
E: invited_by
F: invited_by_name
G: status
H: created_at
```

---

## ⚙️ INSTALACE

### 1. Apps Script

1. **Otevři svou Google tabulku** (tu s 5 listy)
2. **Extensions → Apps Script**
3. **Smaž starý kód**
4. **Zkopíruj** obsah `apps-script.gs`
5. **Vlož** do editoru
6. **Ulož** (Ctrl+S)

### 2. Deploy (NOVÝ!)

**DŮLEŽITÉ:** Musíš udělat NOVÝ deployment!

1. **Deploy → Manage deployments**
2. **Pokud máš starý:**
   - Klikni na ikonu **koše** (smaž starý)
3. **Deploy → New deployment**
4. Typ: **Web app**
5. Nastavení:
   - Description: "v4.0 FAMILY"
   - Execute as: **Me**
   - Who has access: **Anyone**
6. **Deploy**
7. **Authorize** (znovu)
8. **Zkopíruj nové URL**

### 3. Aplikace

1. **Uprav `auth.js`:**
   ```javascript
   const GOOGLE_CLIENT_ID = 'TVŮJ_CLIENT_ID.apps.googleusercontent.com';
   ```

2. **Nahraj na GitHub:**
   - Všechny soubory z v4 (nahraď staré)
   - Commit: "v4.0 FAMILY Organization"

3. **Počkej 1-2 minuty**

### 4. Nastavení v aplikaci

1. **Přihlásit se**
2. **Tab Nastavení**
3. **Apps Script URL** → vlož NOVÉ URL
4. **Uložit URL**
5. **Test připojení** → mělo by vypsat: ✅ FAMILY

---

## 🚀 JAK TO FUNGUJE

### První přihlášení (TY):

1. **Přihlásíš se** → automaticky člen FAMILY
2. **Vytvoříš skupinu** "Thajsko 2025"
3. **Pozvešš Michala:**
   - Tab Nastavení
   - Správa skupiny
   - Zadáš: `michal.michalek97@gmail.com`
   - Poslat pozvánku
4. ✅ Michal dostane pozvánku

### Michal se přihlásí:

1. **Přihlásí se** → automaticky člen FAMILY
2. **Tab "Pozvánky"** → vidí pozvánku od tebe
3. **Klikne "Přijmout"**
4. **Vidí skupinu "Thajsko"** v dropdownu
5. **Přidá výdaj** → ty ho vidíš okamžitě
6. **Může si vytvořit vlastní skupiny**
7. **Může pozvat tebe** do své skupiny

---

## 👥 POZVÁNKY - JAK NA TO

### Pozvat člena:

1. **Vyber skupinu** (dropdown nahoře)
2. **Tab "Nastavení"**
3. **Správa aktuální skupiny**
4. **"Pozvat člena"**
5. **Zadej email** (musí být člen FAMILY)
6. **Poslat pozvánku**

### Přijmout pozvánku:

1. **Tab "Pozvánky"** (📬)
2. **Vidíš čekající pozvánky**
3. **Klikni "Přijmout"**
4. **Skupina se objeví** v dropdownu
5. **Můžeš přidávat výdaje**

### Odmítnout pozvánku:

1. **Tab "Pozvánky"**
2. **Klikni "Odmítnout"**
3. **Pozvánka zmizí**

---

## 🗑️ SPRÁVA SKUPIN

### Odebrat člena (pouze owner):

1. **Vyber skupinu**
2. **Tab "Nastavení"**
3. **Správa skupiny**
4. **U člena klikni "Odebrat"**
5. **Potvrdíš**
6. ✅ Člen už nevidí skupinu

### Smazat skupinu (pouze owner):

1. **Vyber skupinu**
2. **Tab "Nastavení"**
3. **Správa skupiny**
4. **Scroll dolů → "Nebezpečná zóna"**
5. **"Smazat skupinu"**
6. **Potvrdíš 2x** (je to NEVRATNÉ!)
7. ✅ Skupina i všechny výdaje smazány

---

## 📊 JAK VYPADAJÍ DATA

### organization_members
```csv
adam.chuchel@gmail.com, Adam Chuchel, https://..., 2025-12-15T...
michal.michalek97@gmail.com, Michal Michalek, https://..., 2025-12-15T...
```

### groups
```csv
uuid-123, Thajsko 2025, adam.chuchel@gmail.com, 2025-12-15T...
uuid-456, Víkend v horách, michal.michalek97@gmail.com, 2025-12-15T...
```

### group_members
```csv
uuid-123, adam.chuchel@gmail.com, Adam, owner, adam.chuchel@gmail.com, 2025-12-15T...
uuid-123, michal.michalek97@gmail.com, Michal, member, adam.chuchel@gmail.com, 2025-12-15T...
```

### invitations
```csv
uuid-789, uuid-123, Thajsko 2025, michal.michalek97@gmail.com, adam.chuchel@gmail.com, Adam, pending, 2025-12-15T...
```

---

## 🎯 USE CASES

### Use Case 1: Rodinné výdaje

**Adam vytvoří skupinu "Domácnost - Prosinec"**
- Pozve: manželka@email.com
- Manželka přijme → vidí skupinu
- Oba přidávají výdaje
- Tab Bilance → kdo komu dluží
- Konec měsíce → vyrovnají

### Use Case 2: Výlet s kamarády

**Michal vytvoří "Víkend v Krkonoších"**
- Pozve: adam@..., petra@..., honza@...
- Všichni přijmou
- Přidávají výdaje během víkendu
- Michal vidí real-time co kdo přidal
- Po výletu → Tab Bilance → vyrovnání

### Use Case 3: Dlouhodobá skupina

**Adam vytvoří "Thajsko 2025"**
- Pozve kamarády
- 3 měsíce přidávání výdajů
- Kdokoliv může přidat kdykoliv
- Všichni vidí real-time
- Konec cesty → vyrovnání

---

## 🎉 FUNKCE

### Co funguje:

- ✅ FAMILY organizace
- ✅ Automatické členství
- ✅ Systém pozvánek
- ✅ Přijmout/Odmítnout
- ✅ Správa skupin
- ✅ Odebrat členy
- ✅ Smazat skupiny
- ✅ Neomezené skupiny
- ✅ Real-time synchronizace
- ✅ Multi-měna
- ✅ Grafy
- ✅ Vyrovnání dluhů

### Co je nové oproti v3:

| Funkce | v3 | v4 FAMILY |
|--------|-----|-----------|
| Organizace | ❌ | ✅ FAMILY |
| Automatické členství | ❌ | ✅ |
| Systém pozvánek | ❌ | ✅ |
| Správa skupin | ❌ | ✅ |
| Odebrat členy | ❌ | ✅ |
| Smazat skupiny | ❌ | ✅ |
| Tab Pozvánky | ❌ | ✅ |

---

## 🐛 ŘEŠENÍ PROBLÉMŮ

### Nemůžu pozvat člena
→ Zkontroluj email (musí být správný)
→ Člen už je ve skupině?
→ Člen už má pending pozvánku?

### Pozvánka se nezobrazuje
→ Pozvaný se přihlásil?
→ Klikni na Tab "Pozvánky"
→ Zkus ⟳ (sync)

### Nemůžu smazat skupinu
→ Jsi owner?
→ Zkontroluj v Nastavení → Správa skupiny

### Apps Script vrací chybu
→ Zkontroluj že máš všech 5 listů
→ Zkontroluj názvy listů (case sensitive!)
→ Zkontroluj sloupce

---

## 💡 TIPY

### Pro nejlepší zkušenost:

1. **Pošli kamarádům link** hned
2. **Všichni se přihlásí** (automaticky FAMILY)
3. **Vytvoř skupinu**
4. **Pozvi všechny najednou**
5. **Čekej než přijmou**
6. **Pak přidávejte výdaje**

### Organizace:

- **Vytvoř skupinu pro každou akci**
- **Konec akce = vyrovnání**
- **Pak můžeš smazat** (nebo nechej pro historii)
- **Nová akce = nová skupina**

---

## 🎊 HOTOVO!

Teď máš:
- ✅ FAMILY organizaci
- ✅ Systém pozvánek
- ✅ Správu skupin
- ✅ Automatické členství
- ✅ Neomezené skupiny
- ✅ Real-time sync

**Užij si to s FAMILY! 🏢💎**

---

Máš otázku? Něco nefunguje? Dej vědět! 😊
