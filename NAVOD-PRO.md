# 💎 Výdaje Pro - Kompletní návod

## 🎯 Co je nového v Pro verzi?

### ✨ Nové funkce:
1. **👥 Skupiny** - Oddělené skupiny pro různé akce/měsíce
2. **🏷️ Vlastní kategorie** - Upravitelný číselník kategorií
3. **💰 Flexibilní dělení** - Rovnoměrně NEBO vlastní částky pro každého
4. **💱 Multi-měna** - Výdaje v různých měnách s automatickým přepočtem
5. **🏦 ČNB API** - Automatické kurzy z České národní banky
6. **📅 Datum a čas** - Zpětné i budoucí zadávání výdajů
7. **💵 Příjmy** - Evidence příjmů členů skupiny
8. **📝 Poznámky** - Dodatečné informace k transakcím
9. **📊 Grafy** - Vizualizace výdajů (koláč, časová osa)
10. **✅ Vyrovnání dluhů** - Označení dluhů jako vyrovnáno

---

## 🚀 Rychlý start (stejné jako u základní verze)

### 1. Nasazení na GitHub Pages
```
1. github.com → New repository → "expense-tracker-pro"
2. Upload všechny soubory
3. Settings → Pages → Source: main → Save
4. Počkej 2 min → získej URL
```

### 2. Google Sheets API
```
1. Vytvoř Google tabulku
2. console.cloud.google.com → nový projekt
3. Enable Google Sheets API
4. Vytvoř API klíč
```

### 3. Nastavení aplikace
```
1. Otevři URL aplikace
2. Tab "Nastavení" → zadej Sheet ID + API klíč
3. Přidej účastníky
```

---

## 💡 Nové funkce - Jak používat

### 👥 Skupiny

**Co to je:**
Oddělené skupiny pro různé akce, měsíce nebo projekty.

**Jak používat:**
1. Klikni na "Výchozí skupina" v hlavičce
2. Klikni "+ Nová skupina"
3. Zadej název (např. "Thajsko 2025", "Leden 2025", "Vikend v horách")
4. Skupina se vytvoří s kopií členů z aktuální skupiny
5. Přepínání mezi skupinami: klikni na název → vyber skupinu

**Tipy:**
- Každá skupina má vlastní:
  - Výdaje a příjmy
  - Bilanci
  - Statistiky
- Můžeš vytvořit neomezeně skupin
- Smazání skupiny: klikni na 🗑️ vedle názvu

**Příklady použití:**
- **Měsíčně:** "Leden 2025", "Únor 2025"...
- **Podle akcí:** "Thajsko", "Víkend v Krkonoších"
- **Podle projektů:** "Rekonstrukce bytu", "Svatba"

---

### 🏷️ Vlastní kategorie

**Co to je:**
Upravitelný číselník kategorií výdajů.

**Jak používat:**
1. Tab "Nastavení"
2. Sekce "Kategorie výdajů"
3. Přidat novou:
   - Zadej název (např. "Ubytování")
   - Zadej emoji (např. 🏠)
   - Klikni "Přidat"
4. Odebrat: klikni "Odebrat" u kategorie

**Výchozí kategorie:**
- 🍕 Jídlo
- 🚗 Doprava
- 🏠 Ubytování
- 🎉 Zábava
- 🛒 Nákupy
- 📦 Ostatní

**Tipy:**
- Používej emoji pro lepší přehlednost
- Vytvoř si kategorie podle potřeby
- Nemůžeš odebrat, pokud máš jen 1 kategorii

---

### 💰 Flexibilní dělení výdajů

**Co to je:**
Možnost rozdělit výdaj buď rovnoměrně, nebo vlastní částky.

**Režim 1: Rovnoměrně (výchozí)**
- Částka se rozdělí rovnoměrně mezi zaškrtnuté osoby
- Např. 900 Kč mezi 3 lidi = 300 Kč na osobu

**Režim 2: Vlastní částky**
- Můžeš zadat přesnou částku pro každého
- Např. Adam 500 Kč, Petra 300 Kč, Honza 100 Kč

**Jak používat:**
1. Při přidávání výdaje
2. Sekce "Rozdělit mezi"
3. Přepni mezi "Rovnoměrně" / "Vlastní částky"
4. V režimu "Vlastní částky" zadej částku pro každého

**Příklad použití:**
```
Výdaj: 900 Kč večeře
Platil: Adam

Rovnoměrně (3 lidi):
→ Adam: -300 Kč
→ Petra: -300 Kč  
→ Honza: -300 Kč

Vlastní:
Adam: 500 Kč (měl dražší jídlo)
Petra: 300 Kč
Honza: 100 Kč (jen polévka)
```

---

### 💱 Multi-měna s ČNB kurzy

**Co to je:**
Možnost platit v různých měnách s automatickým přepočtem.

**Podporované měny:**
- CZK (koruny české)
- EUR (euro)
- USD (americký dolar)
- GBP (britská libra)
- THB (thajský baht)
- PLN (polský zlotý)

**Jak používat:**
1. Při přidávání výdaje
2. Vyber měnu z rozbalovacího menu
3. Zadej částku v dané měně
4. Aplikace automaticky přepočte na CZK

**Automatický kurz:**
- Aplikace stahuje aktuální kurzy z ČNB
- Kurzy se aktualizují při připojení k internetu
- Zobrazuje se i kurz použitý pro přepočet

**Příklad:**
```
Výdaj v Thajsku:
Částka: 500 THB
Měna: THB
Kurz ČNB: 0.65 Kč/THB

Přepočet: 500 × 0.65 = 325 Kč
```

**Tip:** 
V bilanci a grafech je vše zobrazeno v CZK, takže můžeš míchat měny bez problémů!

---

### 📅 Datum a čas výdajů

**Co to je:**
Možnost zadat výdaj s přesným datem a časem - i zpětně nebo do budoucna.

**Jak používat:**
1. Při přidávání výdaje
2. Pole "Datum" a "Čas"
3. Vyber libovolné datum/čas
4. Výchozí = aktuální čas

**Použití:**
- **Zpětně:** Zapomněl jsi zadat výdaj včera → nastav včerejší datum
- **Do budoucna:** Rezervace hotelu za měsíc → nastav budoucí datum
- **Přesný čas:** Pro lepší třídění transakcí

**Příklad:**
```
Dnes je 15.12.2025, ale chceš zadat:
- Večeři z 10.12.2025 → nastav 10.12. + 19:30
- Rezervaci na 5.1.2026 → nastav 5.1. + čas
```

---

### 💵 Příjmy

**Co to je:**
Evidence příjmů jednotlivých členů skupiny.

**Jak používat:**
1. Tab "Přidat"
2. Přepni z "Výdaj" na "Příjem"
3. Vyplň:
   - Popis (např. "Vrácení peněz za benzín")
   - Částka
   - Měna (podporuje multi-měnu)
   - Datum a čas
   - Komu (vyber člena)
   - Poznámka (volitelné)
4. Klikni "Přidat příjem"

**Vliv na bilanci:**
- Příjem zvyšuje bilanci člena
- Např. Adam měl bilanci -500 Kč, dostal příjem 500 Kč → bilance 0 Kč

**Příklady použití:**
- Vrácení peněz
- Výplata/mzda
- Dar
- Prodej věci

**V přehledu:**
- Příjmy jsou označeny fialově 💵
- V grafech se nezobrazují (jen výdaje)
- V bilanci se započítávají

---

### 📝 Poznámky k transakcím

**Co to je:**
Možnost přidat dodatečné informace k výdaji nebo příjmu.

**Jak používat:**
1. Při přidávání výdaje/příjmu
2. Pole "Poznámka (volitelné)"
3. Zadej libovolný text

**Příklady:**
```
Výdaj: Večeře v restauraci
Poznámka: "U Fleku, skvělé pivo, doporučuji!"

Výdaj: Taxi
Poznámka: "Bolt, z letiště do hotelu"

Příjem: Vrácení peněz
Poznámka: "Za nákup z minulého týdne"
```

**Zobrazení:**
- V seznamu výdajů pod hlavními informacemi
- Kurzívou, šedá barva
- Viditelné i po synchronizaci do Google Sheets

---

### 📊 Grafy a statistiky

**Co to je:**
Vizualizace výdajů pomocí grafů a přehledů.

**Kde najdeš:**
Tab "Statistiky"

**Typy grafů:**

1. **Koláčový graf - Výdaje podle kategorií**
   - Zobrazuje podíl každé kategorie na celkových výdajích
   - Barevně odlišené kategorie
   - Procenta a částky v CZK

2. **Čára - Časový vývoj**
   - Zobrazuje výdaje v čase
   - Vidíš trendy (kdy jste nejvíc utráceli)
   - Každý bod = den s výdaji

**Statistické karty:**
- 📈 **Průměrný výdaj** - průměr na jeden výdaj
- 🏆 **Top kategorie** - kategorie s nejvyššími výdaji
- 👤 **Nejvíce utratil** - člen s nejvíce zaplaceným
- 📅 **Počet výdajů** - celkový počet transakcí

**Filtrování:**
- **Celkem** - všechny výdaje skupiny
- **Tento měsíc** - jen výdaje z aktuálního měsíce
- **Tento týden** - jen výdaje z posledních 7 dní

**Tipy:**
- Používej grafy pro analýzu utrácení
- Změň časový rozsah pro detailnější pohled
- Koláčový graf ti ukáže, kam jdou největší peníze

---

### ✅ Vyrovnání dluhů

**Co to je:**
Možnost označit dluh jako "vyrovnáno" po zaplacení.

**Jak používat:**
1. Tab "Bilance"
2. Sekce "Vyrovnání dluhů"
3. Vidíš seznam: "Kdo → Komu: částka"
4. Klikni "✓ Vyrovnáno" u dluh, který byl zaplacen
5. Potvr díkci
6. Dluh se přeškrtne a označí jako vyrovnáno

**Co se stane:**
- Dluh zůstane vidět (pro historii)
- Přeškrtne se
- Ukládá se datum vyrovnání
- Nové výdaje mohou vytvořit nové dluhy

**Příklad:**
```
Stav před:
Petra → Adam: 500 Kč [✓ Vyrovnáno]

Petra pošle Adamovi 500 Kč → klikne "Vyrovnáno"

Stav po:
Petra → Adam: 500 Kč [vyrovnáno, přeškrtnuto]
```

**Důležité:**
- Vyrovnání NEODEBÍRÁ výdaje!
- Jen označuje, že dluh byl zaplacen
- Historie zůstává zachována

---

## 🎓 Pokročilé tipy

### Workflow pro skupinovou cestu

1. **Před cestou:**
   - Vytvoř skupinu "Thajsko 2025"
   - Přidej všechny účastníky
   - Nastav vlastní kategorie (Ubytování, Jídlo, Výlety...)

2. **Během cesty:**
   - Každý přidává výdaje průběžně
   - Používej správnou měnu (THB)
   - Přidávej poznámky (kde to bylo, co to bylo)
   - Fotky účtenek (můžeš mít v poznámce link)

3. **Po cestě:**
   - Tab "Bilance" → vidíš kdo komu dluží
   - Vyrovnání dluhů pomocí bankovních převodů
   - Označuj dluhy jako vyrovnané
   - Tab "Statistiky" → analýza utrácení

### Měsíční skupiny

```
Leden 2025:
- Nájem
- Energie
- Internet
- Nákupy

→ Na konci měsíce: Bilance a vyrovnání

Únor 2025:
- Nová skupina
- Stejný proces
```

### Kombinace funkcí

**Příklad: Složitý výdaj**
```
Popis: "Společný nákup + večeře"
Částka: 2500 THB
Měna: THB (auto přepočet na CZK)
Datum: Zpětně (včera)
Platil: Adam
Rozdělení: Vlastní částky
  - Adam: 1000 THB (koupil víc věcí)
  - Petra: 1000 THB
  - Honza: 500 THB (nebyl na večeři)
Kategorie: Jídlo
Poznámka: "Tesco + restaurace U moře"

→ Aplikace:
- Přepočte THB na CZK
- Rozdělí podle vlastních částek
- Uloží s datem včera
- Zobrazí v grafech pod kategorií "Jídlo"
```

---

## 🔧 Řešení problémů

### Kurzy se neaktualizují
→ Zkontroluj internetové připojení
→ ČNB API může být dočasně nedostupné
→ Aplikace používá záložní kurzy

### Graf se nezobrazuje
→ Zkontroluj, že máš nějaké výdaje
→ Zkus změnit časový rozsah
→ Obnovstránku (F5)

### Vlastní částky nesedí
→ Součet vlastních částek by měl odpovídat celkové částce
→ Aplikace tě upozorní při rozdílu
→ Můžeš pokračovat i s rozdílem

### Synchronizace nefunguje
→ Každá skupina má vlastní list v Google Sheets
→ List se jmenuje podle názvu skupiny
→ Zkontroluj, že existuje list s názvem skupiny

---

## 📊 Google Sheets formát

**Pro každou skupinu se vytvoří list s tímto formátem:**

| Datum | Typ | Popis | Částka | Měna | Částka CZK | Kdo/Komu | Rozdělení | Kategorie | Poznámka |
|-------|-----|-------|--------|------|------------|----------|-----------|-----------|----------|
| 15.12. 18:30 | Výdaj | Večeře | 500 | THB | 325 | Adam | Rovnoměrně: Adam, Petra | Jídlo | U moře |
| 16.12. 10:00 | Příjem | Vrácení | 100 | CZK | 100 | Petra | | | Za včera |

**Výhody:**
- Můžeš exportovat do Excel
- Sdílet s účetním
- Dělat vlastní analýzy
- Záloha dat

---

## 🎯 Srovnání verzí

| Funkce | Basic | Pro |
|--------|-------|-----|
| Přidávání výdajů | ✅ | ✅ |
| Výpočet bilance | ✅ | ✅ |
| Offline režim | ✅ | ✅ |
| Google Sheets sync | ✅ | ✅ |
| **Skupiny** | ❌ | ✅ |
| **Vlastní kategorie** | ❌ | ✅ |
| **Flexibilní dělení** | ❌ | ✅ |
| **Multi-měna** | ❌ | ✅ |
| **ČNB kurzy** | ❌ | ✅ |
| **Datum/čas zpětně** | ❌ | ✅ |
| **Příjmy** | ❌ | ✅ |
| **Poznámky** | ❌ | ✅ |
| **Grafy** | ❌ | ✅ |
| **Vyrovnání dluhů** | ❌ | ✅ |

---

## 💎 Proč Výdaje Pro?

**Pro náročné uživatele:**
- Pokročilé funkce
- Profesionální vzhled
- Detailní statistiky
- Flexibilní nastavení

**Pro skupinové cesty:**
- Různé měny
- Vlastní dělení
- Poznámky a historie

**Pro dlouhodobé používání:**
- Měsíční skupiny
- Kategorie na míru
- Grafy a trendy

**Stále zdarma:**
- Žádné poplatky
- Žádné limity
- Pod tvou kontrolou

---

**Užij si profesionální správu financí! 💎✨**
