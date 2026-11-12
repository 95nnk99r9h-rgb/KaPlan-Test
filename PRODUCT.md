# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Fachleute von Mailänder Consult, die Bahn-Infrastrukturprojekte betreuen. Sie arbeiten im Büro am
Schreibtisch, mit KaPlan neben Excel und Outlook; Telefon oder Tablet dienen nur zum Nachsehen
(bestätigt am 12.11.2026).

Je Bereich hat die Arbeit einen eigenen Zuschnitt:

* **Planlaufmanagement** – führt Pläne, Planverzeichnisse und Planpakete durch ihre Prozessketten
  (Prüfung, Freigabe, Genehmigung, Versand), hält Soll- und Ist-Termine nach und erinnert die
  Zuständigen. Wer am Rechner sitzt, ist dabei stets das Planlaufmanagement (PLM).
* **Baubetriebsplanung** – verfolgt die baubetrieblichen Anmeldungen von Sperrpausen eines
  Projekts durch die Phasen SKM, MKM, KM und KKM, mit Terminfristen und Nachhak-Terminen.
* **Projektsteuerung** – führt Projektbeteiligtenliste, Beauftragungen nach Gewerken, Fristen und
  Besprechungsprotokolle mit Fortschreibung offener Aufgaben.

Externe Beteiligte – Auftraggeber, Fachplaner, Prüfer – bedienen KaPlan nicht selbst. Sie
erhalten, was daraus entsteht: Erinnerungs-E-Mails, Excel- und PDF-Auszüge, Protokolle.

## Product Purpose

KaPlan vereint drei Arbeitsfelder der Projektbetreuung in einer Anwendung – Planlaufmanagement,
Baubetriebsplanung und Projektsteuerung –, als drei Bereiche, die unabhängig voneinander arbeiten.
Es übernimmt, was zuvor in Excel-Listen (Planliste, Beteiligtenliste, Checkliste) und im
Protokollwerkzeug `MCProtokoll.html` lag.

Drei Dinge soll KaPlan leisten (bestätigt am 12.11.2026; eine Rangfolge untereinander ist nicht
festgelegt):

1. **Keine Frist geht verloren.** KaPlan kennt die tatsächlichen Abläufe – VVBau-Prozessketten,
   Richtlinienfristen je Fahrplanjahr, Checklisten –, rechnet Soll-Termine selbst und zeigt, was
   fällig ist und wer am Zug ist.
2. **Lückenloser Nachweis.** Wer wann was erledigt oder freigegeben hat, Statusverläufe und
   Protokolle sind belastbar dokumentiert und lassen sich für Auftraggeber und Prüfungen ausgeben.
3. **Einheitliche Arbeitsweise.** Alle Projekte werden nach denselben Workflows, Vorlagen und
   Begriffen geführt.

Erfolg heißt: Kein fälliger Schritt, keine Terminfrist und keine offene Aufgabe verstreicht
unbemerkt; jeder Stand lässt sich später belegen; Projekte werden gleich geführt, unabhängig davon,
wer sie betreut.

## Positioning

Die Abläufe des Fachs sind eingebaut, nicht nachgebaut: KaPlan bringt die Prozessketten, Phasen,
Funktionen und Checklisten mit, nach denen das Team arbeitet, und rechnet daraus Termine und
Zuständigkeiten – nach dem Gewerk des Plans, mit der Funktion im Vordergrund, nicht der Person.
Eine allgemeine Aufgabenverwaltung oder eine Excel-Liste müsste all das erst nachbilden.

KaPlan ist dabei kein Regelwerksprüfer: Vorbelegte Fristen sind Erfahrungswerte oder
gekennzeichnete Platzhalter, die das Team pflegt und bestätigt.

## Operating Context

* **Arbeitsplatz:** Büro, Desktop-Browser, KaPlan neben Excel und Outlook. Als PWA installierbar;
  nach dem ersten Aufruf auch ohne Netz nutzbar.
* **Daten heute:** je Bereich getrennt im `localStorage` des Browsers – ohne Anmeldung, ohne
  Rechte, je Arbeitsplatz ein eigener Stand. Weitergabe und Umzug über JSON-Sicherungen
  (**Sicherung** und **Einspielen**), je Bereich einzeln.
* **Was hineinkommt:** Excel- und CSV-Listen (Planliste, Funktionen mit Personen,
  Projektbeteiligtenliste, Checkliste) sowie `.protokoll`- und JSON-Dateien des früheren
  Protokollwerkzeugs.
* **Was hinausgeht:** Excel-Arbeitsmappen, PDF über den Druckdialog des Browsers, vorbereitete
  E-Mails (Outlook über `mailto:`, Outlook im Web, Zwischenablage), gedruckte Protokolle.
* **Wiederkehrende Arbeit:** Fristen sichten, erinnern und mahnen, Schritte erledigen oder Status
  wechseln, Termine nachhaken, Besprechungen protokollieren und im Folgeprotokoll fortschreiben.
* **Fachlicher Rahmen:** VVBau-Prozessketten; Fristen laut Richtlinie je Fahrplanjahr; Anzeigen
  wie EIGV-Anzeige, Baubeginnanzeige und Anzeige der Abnahme; Gewerke wie EEA, KIB, LST, OLA, OSE,
  TK und VA.
* **Auslieferung:** statische Website ohne Server; das README beschreibt die Veröffentlichung
  über GitHub Pages.

## Capabilities and Constraints

**Umfang.** Was die drei Bereiche im Einzelnen können, beschreibt `README.md`; jede Route, Aktion
und Meldung belegt `docs/INVENTAR.md`. Die Baubetriebsplanung ist ein erster Entwurf (auf dem
Startbildschirm als „Erster Entwurf“ gekennzeichnet); ihre offenen fachlichen Fragen stehen in
`docs/BAUBETRIEB_RUECKFRAGEN.md`.

**Dauerhaft und verbindlich** (bestätigt am 12.11.2026):

* **Nichts von fremden Servern.** Keine extern geladenen Schriften, Skripte oder Analysedienste;
  KaPlan läuft vollständig aus eigenen Dateien, auch ohne Netz.
* **Excel, Outlook und PDF bleiben.** Importe, Exporte, vorbereitete E-Mails und Druck gehören
  fest zum Arbeitsablauf und dürfen nicht wegfallen.
* **Die Datenbank kommt.** Ein gemeinsamer Datenbestand mit Anmeldung ist fest geplant; die
  Gestaltung denkt den Mehrbenutzerbetrieb mit. Bis dahin gilt der heutige Stand: lokale Daten,
  keine Anmeldung.

**Im Repository festgelegt** (`CLAUDE.md`):

* Die Oberfläche ist deutsch.
* Sie bleibt bis etwa 400 px Breite bedienbar.
* Der Farbmodus `kontrast` funktioniert weiter.
* Gestaltet wird über die Design-Tokens in `src/shared/global.css`.
* Keine neuen Laufzeitabhängigkeiten ohne Rückfrage; Router, Excel-Import und -Export, PDF-Druck
  und Icons sind bewusst selbst geschrieben.
* Die Bereiche greifen nicht aufeinander zu; jeder hat eigenen Datenbestand, eigene Einstellungen
  und eigenen Router.

**Begriffe.** Die Oberfläche spricht die Sprache des Fachs: Kürzel wie PLM, BVB, SKM oder KKM und
die Kürzel der Gewerke bleiben, wie das Team sie verwendet. Die Begriffe der Anwendung sind bewusst
gewählt und weichen teils vom Lastenheft ab – etwa „Sperrzeit“ statt „Bauzeit“ und „Maßnahmenart“
statt „Anmeldungs-Art“ (`docs/BAUBETRIEB_RUECKFRAGEN.md`).

**Kein Regelwerksersatz.** Vorbelegte Fristen sind Erfahrungswerte (Planlaufmanagement),
Platzhalter (Baubetriebsplanung) oder Projektvorlagen aus der Checkliste (Projektsteuerung). Die
Baubetriebsplanung kennzeichnet ihre Platzhalter, bis sie geändert oder als „Geprüft“ bestätigt
sind.

**Offen:**

* **Marke.** KaPlan-Logos sowie Wortmarke und Hausfarbe von Mailänder Consult sind heutiger Stand,
  aber nicht als dauerhaft bindend bestätigt.
* **Rangfolge der drei Zwecke** untereinander.
* **Zuschnitt der Datenbank.** Zeitpunkt, Rechte je Rolle, automatischer Mailversand und
  Dateiablage stehen im README als Ausblick, nicht als Beschluss.
* **Anrede.** Die Texte sind überwiegend unpersönlich gehalten, die Projektsteuerung siezt,
  vereinzelt steht „du“. Eine einheitliche Anrede ist nicht festgelegt.
* **Zielstufe der Barrierefreiheit** (siehe „Accessibility & Inclusion“).

## Brand Commitments

Als dauerhaft bindend ist die Marke nicht bestätigt (siehe „Offen“). Heutiger Stand:

* **Name:** KaPlan; die Bereiche heißen Planlaufmanagement, Baubetriebsplanung und
  Projektsteuerung.
* **Absender:** Mailänder Consult – Wortmarke in der Kopfzeile, Hausfarbe als Akzent (`--accent`
  in `src/shared/global.css`).
* **Sprache:** deutsch, in den Begriffen des Fachs.

## Evidence on Hand

**Vorhanden:**

* **Fachliche Inhalte im Code:** die Prozessketten „VVBau ohne Prüfstatik“, „VVBau mit
  Prüfstatik“ und „VVBau STE“ sowie 15 Funktionen (`src/bereiche/planlauf/domain/seed.ts`); die
  Standard-Workflows SKM, MKM, KM und KKM (`src/bereiche/baubetrieb/domain/workflow.ts`); die
  Checklistenstruktur mit 73 Beauftragungen und 21 Fristen
  (`src/bereiche/projektsteuerung/domain/vorlagen.ts`).
* **Demodaten:** Planlaufmanagement und Baubetriebsplanung starten mit Beispieldaten (Personen mit
  `example.de`-Adressen, Einträge mit dem Zusatz „(Muster)“); die Projektsteuerung startet leer.
* **Bildmarken:** `public/logos/` (Logo der Startseite, je ein Logo für Planlaufmanagement und
  Baubetriebsplanung, Symbol `Logo.png`), App-Symbole unter `public/icons/`, Wortmarke
  `public/mailaender-consult.svg`, Logos für Protokolle unter `public/protokoll-logos/`.
* **Dokumentation und Prüfstand:** `README.md`, `docs/INVENTAR.md`, `docs/PRUEFUNG.md` (Fachtests
  und Bedienprüfungen bei 1440 px und 400 px Breite), `tests/projektsteuerung.test.ts`.

**Nicht vorhanden – und nicht zu erfinden:**

* Echte Kontakt- und Projektdaten. Sie sind bewusst nicht im Repository (`README.md`,
  `CLAUDE.md`); künftige Arbeit setzt auch in Beispielen und Abbildungen keine ein.
* Nutzerstimmen, Nutzungszahlen, Referenzen.
* Bildschirmfotos oder anderes Bildmaterial der Anwendung.
* Ein eigenes Logo der Projektsteuerung; sie zeigt das Logo der Startseite.
* Die Quelldateien, auf die sich die Dokumentation bezieht: das Lastenheft der
  Baubetriebsplanung, `Checkliste_Hp_Aalen_West.xlsx` und `MCProtokoll.html`.
* Die ausgeschriebene Bedeutung mancher Kürzel: Wofür SKM steht, ist selbst noch Rückfrage
  (`docs/BAUBETRIEB_RUECKFRAGEN.md`, A1). Kürzel werden nicht auf Verdacht ausgeschrieben.
* Geprüfte Regelwerksfristen (siehe „Kein Regelwerksersatz“).

## Product Principles

Aus den Antworten vom 12.11.2026 abgeleitet:

1. **Fälliges zuerst.** Was überfällig oder fällig ist und wer am Zug ist, steht vor allem
   anderen.
2. **Jeder Stand ist belegbar.** Was erledigt, freigegeben oder geändert wurde, bleibt mit Datum
   nachvollziehbar und lässt sich weitergeben.
3. **Ein Vorgehen für alle Projekte.** Gleiche Workflows, Vorlagen und Begriffe; Abweichungen im
   Einzelfall sind möglich und als solche gekennzeichnet.
4. **Die Sprache des Fachs.** Begriffe, Kürzel und Abläufe so, wie das Team sie verwendet; die
   Funktion steht vor der Person.
5. **Aus eigener Kraft.** KaPlan lädt nichts von fremden Servern und fügt sich in Excel, Outlook
   und PDF ein, statt sie zu ersetzen.

## Accessibility & Inclusion

* **Rot-Grün-Sehschwäche:** Jeder Bereich hat den Schalter „Farbmodus für Rot-Grün-Sehschwäche“
  (`kontrast`); die Einstellung gilt je Bereich. Der Modus ersetzt die Ampelfarben durch
  Farbtöne, die sich auch bei Rot-Grün-Sehschwäche unterscheiden, und erhöht die Kontraste. Er
  muss weiter funktionieren (`CLAUDE.md`).
* **Schmale Bildschirme:** bedienbar bis etwa 400 px Breite (`CLAUDE.md`).
* **Sprache:** deutsch; Datumsangaben in der Form TT.MM.JJJJ.
* **Offen:** Eine Zielstufe, etwa nach WCAG, ist nicht festgelegt.
