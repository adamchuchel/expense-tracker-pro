# 💎 Výdaje Pro - Profesionální správa skupinových financí

Progressive Web App s pokročilými funkcemi pro sledování skupinových výdajů, multi-měnou, grafy a vyrovnáváním dluhů.

## ✨ Kompletní seznam funkcí

### 📊 Základní funkce
- ✅ Přidávání výdajů a příjmů
- ✅ Automatický výpočet bilance
- ✅ Optimalizované vyrovnání dluhů
- ✅ Offline PWA aplikace
- ✅ Google Sheets synchronizace
- ✅ Moderní mobilní UI

### 🚀 Pro funkce
- 👥 **Neomezené skupiny** - Oddělené skupiny pro akce/měsíce
- 🏷️ **Vlastní kategorie** - Upravitelný číselník s emoji
- 💰 **Flexibilní dělení** - Rovnoměrně nebo vlastní částky
- 💱 **Multi-měna** - 6 měn s automatickým přepočtem
- 🏦 **ČNB API integrace** - Aktuální kurzy z České národní banky
- 📅 **Datum a čas** - Zpětné i budoucí zadávání
- 💵 **Evidence příjmů** - Sledování příjmů členů
- 📝 **Poznámky** - K výdajům i příjmům
- 📊 **Interaktivní grafy** - Koláčový graf a časová osa (Chart.js)
- ✅ **Vyrovnání dluhů** - Označování dluhů jako vyrovnáno

## 🎯 Srovnání s Basic verzí

| Funkce | Basic | **Pro** |
|--------|-------|---------|
| Výdaje & Bilance | ✅ | ✅ |
| Offline & Sync | ✅ | ✅ |
| Skupiny | ❌ | ✅ |
| Vlastní kategorie | ❌ | ✅ |
| Flexibilní dělení | ❌ | ✅ |
| Multi-měna + ČNB | ❌ | ✅ |
| Datum/čas zpětně | ❌ | ✅ |
| Příjmy | ❌ | ✅ |
| Grafy | ❌ | ✅ |
| Vyrovnání dluhů | ❌ | ✅ |

## 🚀 Rychlý start

### 1. Nasazení
```bash
# GitHub Pages
1. Forknout/stáhnout repository
2. Nahrát na GitHub
3. Settings → Pages → Source: main
4. Získej URL
```

### 2. Konfigurace
```bash
# Google Sheets API
1. Vytvoř Google tabulku
2. Google Cloud Console → Nový projekt
3. Enable Google Sheets API
4. Vytvoř API klíč
5. Vlož do aplikace (tab Nastavení)
```

### 3. Instalace na iPhone
```bash
Safari → URL → Sdílet → Přidat na plochu
```

## 📖 Dokumentace

- **[NAVOD-PRO.md](NAVOD-PRO.md)** - Kompletní návod ke všem funkcím
- **[QUICK-START.md](QUICK-START.md)** - Rychlý setup checklist

## 💡 Příklady použití

### Skupinová cesta
```javascript
Skupina: "Thajsko 2025"
Členové: Adam, Petra, Honza

Výdaj #1:
- Popis: "Hotel 3 noci"
- Částka: 15000 THB
- Měna: THB → auto přepočet 9,750 Kč
- Platil: Adam
- Rozdělení: Rovnoměrně (3,250 Kč/os)
- Poznámka: "Pláž Patong, skvělý hotel!"

Výdaj #2:
- Popis: "Taxi z letiště"
- Částka: 800 THB
- Platil: Petra
- Rozdělení: Vlastní
  * Adam: 400 THB (s batohem)
  * Petra: 300 THB
  * Honza: 100 THB (jen malý kufr)

→ Bilance: Graf ukazuje 60% na ubytování
→ Vyrovnání: Petra → Adam: 2,100 Kč
```

### Měsíční domácnost
```javascript
Skupina: "Leden 2025"

Výdaj: Nájem 15,000 Kč (rovnoměrně)
Výdaj: Elektřina 2,000 Kč (rovnoměrně)
Příjem: Adam - vrácení za internet 500 Kč

→ Konec měsíce: Bilance + vyrovnání
→ Únor: Nová skupina, čistý start
```

## 🛠️ Technologie

- **Frontend:** Vanilla JavaScript (žádné frameworky)
- **Styling:** CSS3 Custom Properties, Playfair Display + Work Sans
- **Charts:** Chart.js 4.4.0
- **Storage:** LocalStorage (offline-first)
- **API:** Google Sheets API v4, ČNB kurzy
- **PWA:** Service Worker, Manifest

## 🎨 Design

**Přístup:** Elegantní dark theme s důrazem na čitelnost a použitelnost
- **Barvy:** Tmavé pozadí (#0f172a) s modrými akcenty (#3b82f6)
- **Typography:** Playfair Display (nadpisy) + Work Sans (tělo)
- **Layout:** Mobile-first, responzivní design
- **Animace:** Smooth přechody, hover efekty
- **Icons:** Unicode emoji pro univerzální podporu

## 📱 Použití

### Základní workflow
1. Vytvoř skupinu (např. "Thajsko 2025")
2. Přidej členy
3. Nastav vlastní kategorie
4. Přidávej výdaje (i v různých měnách)
5. Sleduj bilanci v reálném čase
6. Analyzuj grafy
7. Vyrovnej dluhy a oznaovač je

### Pokročilé funkce
- **Vlastní dělení:** Každý člen může mít jinou částku
- **Zpětné zadávání:** Zapomněl jsi na výdaj? Zadej ho s včerejším datem
- **Multi-měna:** Cestuj a plať v lokální měně, vše se přepočte
- **Poznámky:** Přidej context k výdajům
- **Grafy:** Analyzuj kde utrácíš nejvíc

## 🔒 Bezpečnost & Privacy

- ✅ Všechna data lokálně v zařízení
- ✅ Sync pouze na vyžádání (Google Sheets)
- ✅ API klíč chráněn HTTP referrer restrictions
- ✅ Žádné tracky, žádné analytiky
- ✅ Open source - můžeš zkontrolovat kód

## 🌍 Multi-měna

**Podporované měny:**
- 🇨🇿 CZK (Koruna česká)
- 🇪🇺 EUR (Euro)
- 🇺🇸 USD (Americký dolar)
- 🇬🇧 GBP (Britská libra)
- 🇹🇭 THB (Thajský baht)
- 🇵🇱 PLN (Polský zlotý)

**Zdroj kurzů:** ČNB (Česká národní banka)
- Automatická aktualizace při připojení
- Fallback kurzy při offline režimu
- Zobrazení použitého kurzu při zadávání

## 📊 Grafy a statistiky

### Koláčový graf - Kategorie
- Podíl jednotlivých kategorií
- Barevné odlišení
- Procenta a částky v CZK
- Interaktivní tooltips

### Čárový graf - Časová osa
- Vývoj výdajů v čase
- Denní agregace
- Trendové analýzy
- Zvýraznění špiček

### Statistické karty
- Průměrný výdaj
- Top kategorie
- Nejvíce utrácel
- Celkový počet transakcí

## 🎯 Use cases

### 🌴 Dovolená
```
Skupina: "Bali 2025"
- Výdaje v IDR (rupie)
- Vlastní dělení (různé pobyty)
- Fotky účtenek v poznámkách
- Graf: Nejvíc na ubytování
```

### 🏠 Sdílené bydlení
```
Měsíční skupiny: "Leden", "Únor"...
- Nájem, energie (rovnoměrně)
- Nákupy (kdo co koupil)
- Příjmy (vrácení peněz)
- Vyrovnání na konci měsíce
```

### 🎉 Event
```
Skupina: "Narozeniny Jana"
- Dárky, večeře, výzdoba
- Různé částky pro různé lidi
- Poznámky co kdo dal
- Finální vyrovnání
```

### 👨‍👩‍👧 Rodinné výdaje
```
Skupina: "Rodina 2025"
- Kategorie: Jídlo, Škola, Sport...
- Příjmy obou rodičů
- Měsíční statistiky
- Rozpočtové plánování
```

## 🔧 Customizace

### Změna vzhledu
```css
/* styles.css */
:root {
    --primary: #3b82f6;  /* Změň hlavní barvu */
    --bg-dark: #0f172a;  /* Změň pozadí */
}
```

### Přidání měny
```javascript
// app.js - updateCurrencyConversion()
// Přidej novou měnu do seznamu
```

### Vlastní kategorie
-直ně v UI (tab Nastavení)
- Emoji podpora
- Neomezený počet

## 🤝 Přispění

Pull requesty jsou vítány! Pro větší změny otevři issue.

## 📜 Licence

MIT - Použij jak chceš!

## 🙏 Credits

- **Design:** Inspirováno moderními fintech aplikacemi
- **Charts:** Chart.js
- **Kurzy:** ČNB API
- **Fonts:** Google Fonts (Playfair Display, Work Sans)
- **Icons:** Unicode Emoji

---

## 📞 Podpora

Máš problém nebo nápad na novou funkci?
- Otevři issue v GitHubu
- Zkontroluj [NAVOD-PRO.md](NAVOD-PRO.md)

---

**Vytvořeno s 💎 pro profesionály, kteří chtějí mít finance pod kontrolou**

*Verze: 2.0.0 Pro*
