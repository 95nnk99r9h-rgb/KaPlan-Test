# Prüfung des Lieferstands

Stand: 23.10.2026. Grundlage ist der bereitgestellte Hauptzweig. Der mitgelieferte
`gh-pages`-Build entsprach bereits dem ursprünglichen `app/`-Ordner.

## Automatisierte Fachprüfungen

`npm test`: neun erfolgreich durchgeführte Tests in `tests/projektsteuerung.test.ts`.

- Checklistenstruktur: 73 Beauftragungen und 21 Fristen, leere neue Kontaktbestände.
- Fristberechnung mit Projektterminen, Gewerkabweichungen, manuellen Terminen,
  fehlenden Bezugsterminen und Kalendergrenzen.
- Ampel für offene, erledigte und nicht erforderliche Einträge.
- Folgeprotokolle: I/F und offene A übernehmen, Aufgaben einmal zählen,
  Löschreferenzen bei mittleren und letzten Protokollen behandeln.
- Checklisten- und Beteiligtenimport mit Datenübernahme und Gruppenerkennung.
- Sicherungsvalidierung, ältere Protokolldateien und fehlerhafte Eingaben.
- Kalenderdaten und Hash-Routen einschließlich ungültiger Adressen.

`npm run typecheck` und der Produktionsbuild mit `npm run build:upload` sind erfolgreich.
Der Build enthält alle drei Bereiche und ist unter `app/` enthalten. Vite meldet lediglich
die Größe des gemeinsamen JavaScript-Pakets als Optimierungshinweis; der Build bricht nicht ab.
Es wurden keine zusätzlichen Laufzeitabhängigkeiten ergänzt.

## Bedienprüfungen im Browser

Prüfung des Produktionsbuilds mit Headless Chromium, Desktopbreite 1440 px und
Telefonbreite 400 px. 15 reguläre sowie acht ergänzende Prüfabläufe erfolgreich:

1. Projekt mit Checklistenstruktur anlegen.
2. Kontakt mit Funktion, Firma, Kürzel und Gewerk anlegen.
3. Original-Beteiligtenliste importieren und erneuten Import ohne Dubletten prüfen.
4. Excel-Export herunterladen und als XLSX öffnen (zwölf Kontaktspalten).
5. Relative VA-Frist aus dem Baubeginn berechnen.
6. Original-Checkliste mit 73 Beauftragungen und 21 Fristen importieren.
7. Protokoll mit Protokollführer, Teilnehmer aus Beteiligtenliste, I/F/A und Folgeprotokoll.
8. Aufgabe nach Fortschreibung nur einmal anzeigen und als erledigt markieren.
9. Druckvorschau mit Logos und blau hervorgehobenen Ergänzungen.
10. Protokollreihe herunterladen und Browserbestand nach Neuladen prüfen.
11. Zweites Projekt mit eigenem Bestand anlegen.
12. Gespeicherte Protokolldatei in das zweite Projekt einlesen.
13. Gesamtsicherung exportieren und wiederherstellen.
14. Alle vier Projektseiten bei 400 px ohne seitlichen Seitenüberlauf.
15. Planlaufmanagement und Baubetriebsplanung öffnen; getrennte Speicherbestände erhalten.
16. Gesamten Repository-Ordner unter einem neuen URL-Unterverzeichnis starten, inklusive
    automatischer Weiterleitung zur fertigen Anwendung unter `app/`.
17. Ungültige Sicherung zurückweisen, ohne den Bestand zu ersetzen.
18. Fehlgeschlagenen Speichervorgang simulieren; letzte Änderung wird nicht übernommen.
19. Defekten lokalen JSON-Bestand erkennen und vor Überschreiben schützen.
20. Bereich durch gültige Sicherung wiederherstellen.
21. KaPlan-Kontrastmodus aktivieren.
22. Protokolllogos umsortieren und Standardlogos wiederherstellen.
23. PDF-Druckaktion prüfen: Dokument wird mit Inhalten erzeugt und der Druckpfad aufgerufen.

Im regulären Ablauf traten keine JavaScript-Laufzeitfehler auf. Die finale Mobilnavigation
wurde zusätzlich auf vollständig sichtbare Schaltflächen geprüft. Die Protokollausgabe wurde
als A4-PDF gerendert. Die ursprünglichen 36 Quelldateien des Planlaufmanagements und
24 Quelldateien der Baubetriebsplanung sind bytegleich erhalten.

## Grenzen dieses Prüfstands

Eine Veröffentlichung im neuen GitHub-Repository wurde nicht vorgenommen. Safari, Firefox,
mobile Betriebssysteme und native Betriebssystem-Dateidialoge wurden nicht separat getestet.
PDF wird über den Druckdialog des jeweiligen Browsers gespeichert. Die Daten bleiben wie im
Ausgangsprojekt lokal im Browser; ein gemeinsamer Serverbestand ist nicht Bestandteil dieses Stands.
Die neuen Projektsteuerungsabläufe wurden geprüft; dies ersetzt keinen vollständigen Fachabnahmetest
aller bestehenden Planlauf- und Baubetriebsfunktionen.
