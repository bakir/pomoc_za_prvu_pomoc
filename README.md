# Prva pomoć — vježba pitanja

Web aplikacija za vježbanje pitanja iz prve pomoći, pripremljena za polaganje ispita (npr. vozačka dozvola). Pitanja su bazirana na zvaničnom katalogu Ministarstva za odgoj i obrazovanje Kantona Sarajevo.

**Živa verzija:** https://bakir.github.io/pomoc_za_prvu_pomoc/

---

## Šta aplikacija radi

Aplikacija vas vodi kroz pitanja sa višestrukim izborom odgovora. Za svako pitanje trebate tačno odgovoriti **3 puta** da biste ga smatrali savladanim. Napredak se automatski čuva u vašem pregledniku, pa možete nastaviti gdje ste stali i nakon osvježavanja stranice.

U bazi je **100 pitanja**.

---

## Kako koristiti aplikaciju

### Odgovaranje na pitanja

1. Pročitajte pitanje i odaberite jedan od ponuđenih odgovora (klikom ili tastaturom).
2. Nakon odgovora vidite povratnu informaciju:
   - **✅ TAČNO!** — odgovorili ste ispravno i napredak se povećava.
   - **❌ NETAČNO!** — pogrešan odgovor; napredak se ne mijenja.
3. Pritisnite **Dalje (Enter)** ili tipku **Enter** da pređete na sljedeće pitanje.

Iznad pitanja piše:

- **Pitanje X od 100** — koji ste broj pitanja trenutno na
- **Tačno odgovoreno: 0/3** — koliko puta ste već tačno odgovorili na to pitanje (cilj je 3/3)

Kada tačno odgovorite na sva pitanja po 3 puta, pojavi se poruka čestitke.

### Tastatura (prečice)

| Tipka | Akcija |
|-------|--------|
| `1` | Prvi odgovor |
| `2` | Drugi odgovor |
| `3` | Treći odgovor |
| `4` | Provjeri tačan odgovor (bez povećanja napretka) |
| `Enter` | Nastavi na sljedeće pitanje (nakon odgovora) |

> Prečice rade samo bez pritisnutih tipki Ctrl, Cmd ili Alt.

### Provjera tačnog odgovora

Ispod odgovora nalazi se dugme **„Provjeri tačan odgovor (4)”** (ili tipka `4`). Otkriva ispravan odgovor i prikaže zelenu oznaku kao kod tačnog odgovora, ali **ne povećava** brojač „Tačno odgovoreno”. Korisno za učenje kada ne znate odgovor.

---

## Traka sa alatima (gore lijevo)

### `?` — Lista pitanja

Otvara bočni panel sa svim pitanjima poredanim po broju. Za svako pitanje vidite:

- kratki pregled teksta
- traku napretka (0/3, 1/3, 2/3, 3/3)
- trenutno aktivno pitanje (označeno plavom bojom)

Klikom na bilo koje pitanje možete odmah skočiti na njega.

Na mobilnim uređajima panel se otvara kao izvlačni meni s lijeve strane.

### `i` — Informacije

- **GitHub repozitorij** — izvorni kod projekta
- **Katalog pitanja (PDF)** — zvanična stranica Ministarstva s PDF katalogom pitanja

### `⚙` — Postavke

| Opcija | Opis |
|--------|------|
| **Miješaj pitanja** | Pitanja se prikazuju nasumičnim redom umjesto 1, 2, 3… |
| **Miješaj odgovore** | Redoslijed odgovora unutar svakog pitanja se miješa |
| **Resetuj napredak** | Briše sav sačuvani napredak i počinje ispočetka |

---

## Kolačići i privatnost

Aplikacija koristi **kolačiće** isključivo za pohranu vašeg napretka u kvizu. Podaci ostaju u vašem pregledniku i ne dijele se s trećim stranama. Postavke (miješanje pitanja/odgovora) čuvaju se lokalno u pregledniku.

---

## Pokretanje lokalno (za developere)

### Preduvjeti

- [Node.js](https://nodejs.org/) (preporučeno LTS)

### Instalacija i pokretanje

```bash
git clone https://github.com/bakir/pomoc_za_prvu_pomoc.git
cd pomoc_za_prvu_pomoc
npm install
npm run dev
```

Aplikacija je dostupna na `http://localhost:5173/pomoc_za_prvu_pomoc/` (putanja zavisi od `base` u `vite.config.js`).

### Ostale naredbe

```bash
npm run build    # produkcijska verzija u folder dist/
npm run preview  # pregled produkcijske verzije lokalno
npm run deploy   # objava na GitHub Pages
```

---

## Struktura projekta

```
pomoc_za_prvu_pomoc/
├── public/
│   └── questions.json      # baza pitanja
├── src/
│   ├── App.jsx             # glavna logika i sučelje
│   ├── cookies.js          # pohrana napretka u kolačićima
│   ├── index.css           # stilovi
│   └── main.jsx            # ulazna tačka
├── index.html
├── vite.config.js
└── package.json
```

---

## Izvor pitanja

Pitanja su usklađena sa zvaničnim katalogom:

- [Obavještenje — Novi katalog pitanja za polaganje prve pomoći](https://mo.ks.gov.ba/sed-obavhestenja/obavjestenje-novi-katalog-pitanja-za-polaganje-prve-pomoci) (Ministarstvo za odgoj i obrazovanje KS)

---

## Licenca

MIT — pogledajte datoteku [LICENSE](LICENSE).
