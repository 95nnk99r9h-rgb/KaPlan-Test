import assert from 'node:assert/strict';
import { neuesProjekt, leereDaten } from '../src/bereiche/projektsteuerung/domain/vorlagen';
import {
  ampel,
  aufgaben,
  fristDatum,
  gueltigesDatum,
} from '../src/bereiche/projektsteuerung/domain/fristen';
import {
  neuesProtokoll,
  neuerEintrag,
  folgeprotokoll,
  protokollEntfernen,
} from '../src/bereiche/projektsteuerung/domain/protokolle';
import { checklistenImport, kontakteImport } from '../src/bereiche/projektsteuerung/domain/import';
import {
  datenLesen,
  protokollDateiLesen,
  logosLesen,
} from '../src/bereiche/projektsteuerung/store/validierung';
import { routeHash, routeLesen } from '../src/bereiche/projektsteuerung/lib/router';

let anzahl = 0;
function test(name: string, fn: () => void) {
  fn();
  anzahl++;
  console.log(`OK ${name}`);
}
test('Checkliste trennt 73 Beauftragungen und 21 Fristen', () => {
  const p = neuesProjekt();
  assert.equal(p.beauftragungen.length, 73);
  assert.equal(p.fristen.length, 21);
  assert.ok(p.beauftragungen.every((b) => !/Anzeige/i.test(b.leistung)));
  assert.equal(p.kontakte.length, 0);
  assert.ok(p.fristen.every((f) => f.erforderlich === 'offen' && f.termin === ''));
});
test('Fristberechnung über Jahres- und Schaltjahresgrenzen, Gewerke und Überschreibungen', () => {
  const p = neuesProjekt();
  p.baubeginn = '2026-03-13';
  p.abnahme = '2026-10-30';
  const eigv = p.fristen.find((f) => f.gewerk === 'VA' && f.titel === 'EIGV-Anzeige')!;
  const baubeginn = p.fristen.find((f) => f.gewerk === 'VA' && f.titel === 'Baubeginnanzeige')!;
  assert.equal(fristDatum(eigv, p), '2026-01-02');
  assert.equal(fristDatum(baubeginn, p), '2026-02-13');
  assert.equal(
    fristDatum({ ...baubeginn, tageVorher: 14 }, { ...p, baubeginn: '2028-03-10' }),
    '2028-02-25',
  );
  p.gewerkTermine.VA = { baubeginn: '2026-04-10', abnahme: '' };
  assert.equal(fristDatum(baubeginn, p), '2026-03-13');
  assert.equal(fristDatum({ ...baubeginn, termin: '2027-01-02' }, p), '2027-01-02');
  assert.equal(fristDatum({ ...baubeginn, gewerk: 'LST' }, { ...p, baubeginn: '' }), '');
  assert.equal(fristDatum({ ...baubeginn, tageVorher: -7 }, p), '2026-04-17');
});
test('Erledigte und nicht erforderliche Fristen sind nie überfällig', () => {
  assert.equal(ampel('2026-01-01', true, true, '2026-10-23'), 'erledigt');
  assert.equal(ampel('2026-01-01', false, false, '2026-10-23'), 'entfaellt');
  assert.equal(ampel('', false, true, '2026-10-23'), 'ohne_termin');
  assert.equal(ampel('2026-10-23', false, true, '2026-10-23'), 'faellig');
  assert.equal(ampel('2026-10-22', false, true, '2026-10-23'), 'ueberfaellig');
});
test('Folgeprotokolle übernehmen Informationen, Festlegungen und offene Aufgaben einmal', () => {
  const p = neuesProtokoll('Test', 'Anna Beispiel');
  const a = neuerEintrag('A');
  a.text = 'Offene Aufgabe';
  a.zusatz = 'Ergänzt';
  a.wer = 'AB';
  a.termin = '2026-11-01';
  const fertig = neuerEintrag('A');
  fertig.status = 'erledigt';
  p.tops[0].eintraege = [neuerEintrag('I'), neuerEintrag('F'), a, fertig];
  p.naechster = '2026-11-15';
  const next = folgeprotokoll(p);
  assert.equal(next.nr, 2);
  assert.equal(next.serie, p.serie);
  assert.equal(next.datum, '2026-11-15');
  assert.equal(next.tops[0].eintraege.length, 3);
  assert.equal(next.tops[0].eintraege[2].text, 'Offene Aufgabe\nErgänzt');
  assert.equal(next.tops[0].eintraege[2].vor?.text, 'Offene Aufgabe\nErgänzt');
  assert.equal(aufgaben([p, next]).filter((a) => a.eintrag.status === 'offen').length, 1);
  assert.equal(p.teilnehmer.length, 1);
  assert.equal(next.teilnehmer[0].auto, 'fuehrer');
  const third = folgeprotokoll(next);
  const rest = protokollEntfernen([p, next, third], next.id);
  assert.equal(aufgaben(rest).filter((a) => a.eintrag.status === 'offen').length, 1);
  assert.equal(p.tops[0].eintraege[2].carriedTo, third.id);
  const last = protokollEntfernen(rest, third.id);
  assert.equal(aufgaben(last).filter((a) => a.eintrag.status === 'offen').length, 1);
  assert.equal(p.tops[0].eintraege[2].carriedTo, null);
});
test('Checklistenimport erhält feste Quelldaten und trennt Anzeigen', () => {
  const d = checklistenImport([
    {
      name: 'Checkliste',
      zeilen: [
        [
          'Name',
          'Erforderlich?',
          'Beauftragt / Eingereicht?',
          'Name',
          'eingereicht am:',
          'Frist',
          'Bemerkung',
        ],
        ['VA'],
        ['Planer', 'Ja', 'Ja', 'Beispielfirma', '', '', 'Notiz'],
        ['Baubeginnanzeige', 'Ja', 'Nein', '', '', '4 Wochen vor Baubeginn\n13.2.26', 'Bedingung'],
        ['KIB', 'Nein'],
        ['EIGV-Anzeige', 'Nein', '', '', '', '10 Wochen vor Baubeginn'],
      ],
    },
  ]);
  assert.equal(d.beauftragungen.length, 1);
  assert.equal(d.fristen.length, 2);
  assert.equal(d.fristen[0].termin, '2026-02-13');
  assert.equal(d.fristen[0].tageVorher, 28);
  assert.equal(d.fristen[1].erforderlich, 'nein');
  assert.equal(d.beauftragungen[0].auftragnehmer, 'Beispielfirma');
});
test('Beteiligtenimport erkennt Gruppen, Firmen, Anschrift und flachen Export', () => {
  const ks = kontakteImport([
    {
      name: 'Beteiligte',
      zeilen: [
        ['Projektname'],
        ['Name', 'Zuständigkeit', 'Tel.\nMobil', 'E-Mail', 'Straße', 'Plz', 'Ort'],
        ['Projektmanagement'],
        ['Firma GmbH'],
        ['Anna Beispiel', 'PL', '01234', 'a@example.org', 'Weg 1', '01234', 'Ort'],
      ],
    },
  ]);
  assert.equal(ks[0].gewerk, 'Projektmanagement');
  assert.equal(ks[0].firma, 'Firma GmbH');
  assert.equal(ks[0].plz, '01234');
  const flat = kontakteImport([
    {
      name: 'Export',
      zeilen: [
        ['Gewerk', 'Funktion', 'Name', 'Firma', 'Telefon', 'E-Mail'],
        ['VA', 'BVB', 'Beispiel', 'Firma', '0123', 'x@example.org'],
      ],
    },
  ]);
  assert.equal(flat[0].gewerk, 'VA');
  assert.equal(flat[0].funktion, 'BVB');
});
test('Sicherungen werden validiert, ohne andere Bereiche zu akzeptieren', () => {
  const d = leereDaten();
  const p = neuesProjekt();
  p.name = 'Projekt';
  p.protokolle.push(neuesProtokoll('Projekt'));
  d.projekte.push(p);
  assert.deepEqual(datenLesen(JSON.parse(JSON.stringify(d))), d);
  assert.throws(() => datenLesen({ ...d, bereich: 'baubetrieb' }));
  assert.throws(() => datenLesen({ ...d, version: 999 }));
  assert.throws(() => datenLesen({ ...d, projekte: [p, p] }));
  assert.throws(() => datenLesen({ ...d, projekte: [{ ...p, kontakte: {} }] }));
  assert.throws(() => datenLesen({ ...d, projekte: [{ ...p, baubeginn: '2026-02-31' }] }));
});
test('Alte Protokolldateien und Reihen bleiben importierbar', () => {
  const p = neuesProtokoll('Alt');
  const next = folgeprotokoll(p);
  const d = protokollDateiLesen({ format: 'protokoll-tool', version: 2, protocols: [p, next] });
  assert.equal(d.protokolle.length, 2);
  assert.equal(protokollDateiLesen({ protocol: p }).protokolle[0].id, p.id);
  assert.equal(protokollDateiLesen(p).protokolle[0].serie, p.serie);
  assert.throws(() => protokollDateiLesen({ protocols: [{ id: 'bad', tops: 'kein Array' }] }));
  assert.throws(() => logosLesen([{ name: 'test', src: 'javascript:alert(1)' }]));
});
test('Kalenderdaten und Projektadressen sind robust', () => {
  assert.equal(gueltigesDatum('2026-02-31'), false);
  assert.equal(gueltigesDatum('2028-02-29'), true);
  assert.equal(gueltigesDatum(''), true);
  const r = { view: 'projekt' as const, projektId: 'Projekt ü / 1', tab: 'fristen' as const };
  assert.deepEqual(routeLesen(routeHash(r)), r);
  assert.deepEqual(routeLesen('#/projektsteuerung/projekt/%XX/fristen'), { view: 'projekte' });
});
console.log(`${anzahl} Fachtests erfolgreich.`);
