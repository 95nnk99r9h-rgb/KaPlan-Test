import { addDays, today } from '../../../shared/dates';
import type { Frist, Projekt, ProtokollEintrag, Protokoll } from './types';

/** Expliziter Termin hat Vorrang; fehlt ein Bezugstermin, wird kein Datum erfunden. */
export function fristDatum(f: Frist, p: Projekt): string {
  if (f.termin) return f.termin;
  if (f.bezug === 'fest') return '';
  const basis = p.gewerkTermine[f.gewerk]?.[f.bezug] || p[f.bezug];
  return basis ? addDays(basis, -f.tageVorher) : '';
}
export function fristRegel(f: Frist): string {
  if (f.bezug === 'fest') return 'Fester Termin';
  const tage = Math.abs(f.tageVorher);
  const abstand = tage % 7 === 0 ? `${tage / 7} Wochen` : `${tage} Tage`;
  return `${abstand} ${f.tageVorher < 0 ? 'nach' : 'vor'} ${f.bezug === 'baubeginn' ? 'Baubeginn' : 'Abnahme'}`;
}
export function ampel(
  termin: string,
  erledigt = false,
  erforderlich = true,
  heute = today(),
): 'erledigt' | 'entfaellt' | 'ohne_termin' | 'ueberfaellig' | 'faellig' | 'geplant' {
  if (!erforderlich) return 'entfaellt';
  if (erledigt) return 'erledigt';
  if (!termin) return 'ohne_termin';
  if (termin < heute) return 'ueberfaellig';
  return termin <= addDays(heute, 14) ? 'faellig' : 'geplant';
}
export interface Aufgabe {
  protokoll: Protokoll;
  eintrag: ProtokollEintrag;
  nummer: string;
}
export function aufgaben(protokolle: Protokoll[]): Aufgabe[] {
  const ids = new Set(protokolle.map((p) => p.id));
  return protokolle.flatMap((p) =>
    p.tops.flatMap((t, ti) =>
      t.eintraege.flatMap((e, ei) =>
        e.typ === 'A' && !(e.carriedTo && ids.has(e.carriedTo))
          ? [{ protokoll: p, eintrag: e, nummer: `${ti + 1}.${ei + 1}` }]
          : [],
      ),
    ),
  );
}
export const AMPEL_TEXT = {
  erledigt: 'Erledigt',
  entfaellt: 'Nicht erforderlich',
  ohne_termin: 'Termin fehlt',
  ueberfaellig: 'Überfällig',
  faellig: 'In 14 Tagen fällig',
  geplant: 'Geplant',
};
export function gueltigesDatum(s: string): boolean {
  if (!s) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
