import type { GeleseneTabelle } from '../../../shared/xlsxLesen';
import { datumLesen } from '../../../shared/xlsxLesen';
import { uid, type Kontakt, type Beauftragung, type Frist, type Erforderlich } from './types';
import { CHECKLISTE } from './vorlagen';
import { gueltigesDatum } from './fristen';

const norm = (s: string) => s.toLocaleLowerCase('de').replace(/\s+/g, ' ').trim();
const wert = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
const jaNein = (s: string): Erforderlich =>
  norm(s) === 'ja' ? 'ja' : norm(s) === 'nein' ? 'nein' : 'offen';
const datum = (s: string) => {
  const d = datumLesen(s) || '';
  if (!gueltigesDatum(d)) throw new Error(`Ungültiges Datum in der Checkliste: ${s}`);
  return d;
};
const GRUPPEN = [
  'Projektmanagement',
  'Projektsteuerung',
  'Anlagenverantwortliche/Ansprechpartner',
  'Betrieb',
  'Inbetriebnahmeverantwortliche',
  'Bau AN',
  'Bauüberwachung',
  'Entwurfs-/Genehmigungsplanung',
  'Planlaufmanagement',
  'Ausführungsplanung Verkehrsanlage',
  'Ausführungsplanung Oberleitungsanlage',
  'Ausführungsplanung EEA',
  'Planprüfung',
  'Bauvorlagenberechtigte',
  'Gutachter',
  'BIM Beratung',
  'Weitere',
  'Anwohner',
];
export const leererKontakt = (): Kontakt => ({
  id: uid('kontakt'),
  name: '',
  funktion: '',
  gewerk: 'Übergreifend',
  firma: '',
  telefon: '',
  mobil: '',
  email: '',
  strasse: '',
  plz: '',
  ort: '',
  kuerzel: '',
  bemerkung: '',
});
/** Erkennt sowohl die gruppierte Referenzliste als auch den flachen KaPlan-Export. */
export function kontakteImport(tabellen: GeleseneTabelle[]): Kontakt[] {
  const t = tabellen.find((t) =>
    t.zeilen.some(
      (r) => r.some((s) => norm(s) === 'name') && r.some((s) => /e-?mail/.test(norm(s))),
    ),
  );
  if (!t) throw new Error('Keine Kontaktliste mit den Spalten Name und E-Mail gefunden.');
  const kopf = t.zeilen.findIndex(
    (r) => r.some((s) => norm(s) === 'name') && r.some((s) => /e-?mail/.test(norm(s))),
  );
  const h = t.zeilen[kopf].map(norm);
  const col = (...xs: string[]) => h.findIndex((s) => xs.includes(s));
  const cols = {
    name: col('name'),
    funktion: col('funktion', 'zuständigkeit'),
    firma: col('firma', 'unternehmen'),
    gewerk: col('gewerk', 'gruppe'),
    telefon: col('telefon', 'tel. mobil', 'tel.', 'telefon / mobil'),
    mobil: col('mobil'),
    email: col('e-mail', 'email'),
    strasse: col('straße', 'strasse'),
    plz: col('plz'),
    ort: col('ort'),
    kuerzel: col('kürzel'),
    bemerkung: col('bemerkung'),
  };
  let gewerk = 'Übergreifend',
    firma = '';
  const out: Kontakt[] = [];
  for (const r of t.zeilen.slice(kopf + 1)) {
    const name = wert(r, cols.name);
    if (!name) continue;
    if (cols.gewerk < 0 && r.filter((s) => s.trim()).length === 1) {
      if (GRUPPEN.includes(name)) {
        gewerk = name;
        firma = '';
        continue;
      }
      if (/gmbh|\bag\b|ingenieur|consult|stadtverwaltung|bundesamt|rail|\bsub\b/i.test(name)) {
        firma = name;
        continue;
      }
    }
    const k = leererKontakt();
    for (const key of Object.keys(cols) as (keyof typeof cols)[]) k[key] = wert(r, cols[key]);
    k.gewerk = k.gewerk || gewerk;
    k.firma = k.firma || firma;
    out.push(k);
  }
  if (!out.length) throw new Error('Keine Kontakte gefunden.');
  return out;
}
export function checklistenImport(tabellen: GeleseneTabelle[]): {
  beauftragungen: Beauftragung[];
  fristen: Frist[];
} {
  const t = tabellen.find((t) =>
    t.zeilen.some(
      (r) =>
        r.some((s) => norm(s) === 'erforderlich?') && r.some((s) => norm(s).includes('beauftragt')),
    ),
  );
  if (!t)
    throw new Error('Keine Checkliste mit Erforderlich? und Beauftragt / Eingereicht? gefunden.');
  const start = t.zeilen.findIndex((r) => r.some((s) => norm(s) === 'erforderlich?'));
  const h = t.zeilen[start].map(norm),
    col = (s: string) => h.indexOf(s);
  const b = col('erforderlich?'),
    c = h.findIndex((s) => s.includes('beauftragt')),
    f = col('frist'),
    bem = col('bemerkung');
  const gewerke = new Set(CHECKLISTE.map((v) => v.gewerk));
  let gewerk = 'Übergreifend';
  const beauftragungen: Beauftragung[] = [],
    fristen: Frist[] = [];
  for (const r of t.zeilen.slice(start + 1)) {
    const titel = wert(r, 0);
    if (!titel) continue;
    if (
      gewerke.has(titel) ||
      (!wert(r, c) &&
        !wert(r, 3) &&
        !wert(r, f) &&
        !wert(r, bem) &&
        !['ja', 'nein'].includes(norm(wert(r, b))))
    ) {
      gewerk = titel;
      continue;
    }
    const erforderlich = jaNein(wert(r, b)),
      status = norm(wert(r, c)) === 'ja' ? ('erledigt' as const) : ('offen' as const);
    const frist = wert(r, f);
    const vorlage = CHECKLISTE.find((v) => v.gewerk === gewerk && v.name === titel);
    if (vorlage?.art === 'frist' || /anzeige/i.test(titel) || frist) {
      const wochen = /(\d+)\s*Wochen?\s*vor/i.exec(frist),
        tage = /(\d+)\s*Tage?\s*vor/i.exec(frist);
      const explizit =
        frist
          .split(/\n/)
          .map((s) => datum(s.trim()))
          .find(Boolean) || '';
      fristen.push({
        id: uid('frist'),
        gewerk,
        titel,
        erforderlich,
        status,
        bezug: /Abnahme/i.test(frist)
          ? 'abnahme'
          : /Baubeginn/i.test(frist)
            ? 'baubeginn'
            : (vorlage?.bezug ?? 'fest'),
        tageVorher: wochen
          ? Number(wochen[1]) * 7
          : tage
            ? Number(tage[1])
            : (vorlage?.tageVorher ?? 0),
        termin: explizit,
        eingereichtAm: datum(wert(r, 4)),
        kontaktId: '',
        verantwortlich: wert(r, 3),
        bemerkung: wert(r, bem),
        quelltext: frist,
      });
    } else
      beauftragungen.push({
        id: uid('auftrag'),
        gewerk,
        leistung: titel,
        erforderlich,
        status,
        kontaktId: '',
        auftragnehmer: wert(r, 3),
        datum: datum(wert(r, 4)),
        bemerkung: wert(r, bem),
      });
  }
  if (!beauftragungen.length && !fristen.length) throw new Error('Keine Einträge gefunden.');
  return { beauftragungen, fristen };
}
