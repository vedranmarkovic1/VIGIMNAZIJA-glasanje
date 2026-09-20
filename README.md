# Sistem elektronskog glasanja — Učenički parlament Šeste beogradske gimnazije

Kompletna veb aplikacija za Učenički parlament **Šesta beogradska gimnazija** inspirisana dizajnerskim jezikom i standardima portala **e-Uprave Republike Srbije** (`euprava.gov.rs`).

## 🏛️ Karakteristike aplikacije

- **Dizajn inspirisan e-Upravom**: Zvanična korporativno plava paleta (tamno teget zaglavlja `#081729` / `#0b2240`, kraljevska plava `#004b87`, ledeno plava podloga `#f0f6fc`, kartice visokog kontrasta, trobojka Republike Srbije).
- **Kompletna kontrola uloga i dozvola**:
  1. **Korisnička podrška (Support)**: Super-admin, upravljanje svim korisnicima, promena uloga, registracija učenika, pristup svim modulima.
  2. **Predsednik parlamenta i zamenici**: Kreiranje klasičnih i višestrukih glasanja, otključavanje i zatvaranje glasanja uživo, uvid u rezultate, registracija novih učenika.
  3. **Zapisničar**: Uvid u rezultate (`/scores`), statistiku, grafikone i generisanje zvaničnih PDF zapisnika.
  4. **Nastavnik-saradnik**: Nadzor sednice, pristup rezultatima i zapisnicima.
  5. **Učenik**: Pristup biralištu, glasanje sa sprečavanjem dvostrukog glasanja, lična arhiva učešća sa sekundama ubačenog glasa.
- **Simulacija u realnom vremenu bez osvežavanja (No Refresh UI)**:
  - Čim predsedavajući otključa glasanje na tabli, učenicima na ekranu automatski iskače upečatljiv obaveštajni modal sa zvučnim signalom i direktnim prelaskom na glasanje.
- **Praćenje prisustva uživo ("Uživo na sistemu")**:
  - Vidžet u zaglavlju sa pulsirajućim indikatorom, tačnim brojem prisutnih članova i raspodelom uloga (npr. Predsednik, Zapisničar, Učenici).
- **Zvanični PDF zapisnik o glasanju**:
  - Formatiran kao pravni akt sa zaglavljem Gimnazije, delovodnim brojem, 4 obavezne sekcije (Opšte informacije, Vremenski zapisnik sa sekundama trajanja, Kvorum i odziv, Zvanični rezultati) i svojeručnim potpisima za Predsednika, Zapisničara i Nastavnika-saradnika.
- **Registracija i prva prijava (`must_change_password`)**:
  - Automatsko generisanje korisničkih imena i privremenih lozinki. Sistem pri prvoj prijavi sa privremenom lozinkom obavezno prikazuje modal za postavljanje nove trajne lozinke.
- **Brzi Role Switcher**:
  - Diskretan lebdeći test panel u donjem desnom uglu za brzu promenu korisnika jednim klikom i testiranje scenarija.

---

## 🚀 Pokretanje aplikacije

U razvojnom okruženju:
```bash
npm run dev
```

Izrada produkcijske verzije:
```bash
npm run build
```

Pregled produkcijske verzije:
```bash
npm run preview
```

---

## 🔑 Demo nalozi za testiranje

| Uloga | Korisničko ime | Lozinka | Opis |
|---|---|---|---|
| **Predsednik** | `predsednik` | `password123` | Mihailo Savić (IV-2) |
| **Korisnička podrška** | `podrska` | `password123` | Petar Jovanović (Super-admin) |
| **Učenik (aktivan)** | `stefan.djordjevic` | `password123` | Stefan Đorđević (IV-3) |
| **Učenik (privremena lozinka)** | `milena.bozic` | `TempP@ss2026` | Testira obaveznu promenu lozinke |
| **Zapisničar** | `zapisnicar` | `password123` | Jelena Todorović (III-2) |
| **Nastavnik-saradnik** | `prof.branka` | `password123` | Prof. dr Branka Milić |
