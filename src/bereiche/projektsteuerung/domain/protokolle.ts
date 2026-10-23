import { today } from '../../../shared/dates';
import {
  uid,
  type Protokoll,
  type ProtokollEintrag,
  type Teilnehmer,
  type EintragTyp,
} from './types';

export const HINWEIS =
  'Einwände oder Ergänzungen zu diesem Protokoll bitte innerhalb von 7 Kalendertagen nach Erhalt schriftlich mitteilen. Andernfalls gilt das Protokoll als anerkannt.';
export const neuerTeilnehmer = (): Teilnehmer => ({
  id: uid('tn'),
  name: '',
  funktion: '',
  firma: '',
  kuerzel: '',
  status: 'anwesend',
});
export const neuerEintrag = (typ: EintragTyp): ProtokollEintrag => ({
  id: uid('eintrag'),
  typ,
  text: '',
  zusatz: '',
  wer: '',
  termin: '',
  status: 'offen',
  herkunft: '',
  carriedTo: null,
});
export function neuesProtokoll(projekt: string, fuehrer = ''): Protokoll {
  const p: Protokoll = {
    id: uid('protokoll'),
    serie: uid('reihe'),
    projekt,
    art: 'Baubesprechung',
    nr: 1,
    datum: today(),
    beginn: '',
    ende: '',
    ort: '',
    fuehrer,
    naechster: '',
    verteiler: '',
    hinweis: HINWEIS,
    teilnehmer: [],
    tops: [{ id: uid('top'), titel: 'Allgemeines', eintraege: [] }],
    updated: Date.now(),
  };
  fuehrerNachziehen(p);
  return p;
}
export function fuehrerNachziehen(p: Protokoll) {
  const name = p.fuehrer.trim();
  let t = p.teilnehmer.find((t) => t.auto === 'fuehrer');
  if (!name) {
    p.teilnehmer = p.teilnehmer.filter((t) => !t.auto);
    return;
  }
  if (!t) {
    t = p.teilnehmer.find((t) => t.name.trim() === name);
    if (!t) {
      t = {
        ...neuerTeilnehmer(),
        funktion: 'Projektsteuerung',
        firma: 'Mailänder Consult',
        kuerzel: 'PS',
      };
      p.teilnehmer.push(t);
    }
    t.auto = 'fuehrer';
  }
  t.name = name;
}
export const vollerText = (e: ProtokollEintrag) =>
  [e.text, e.zusatz]
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
export const reihe = (ps: Protokoll[], serie: string) =>
  ps.filter((p) => p.serie === serie).sort((a, b) => a.nr - b.nr || a.updated - b.updated);
/** Verändert den Vorgänger nur innerhalb einer Store-Transaktion. */
export function folgeprotokoll(vor: Protokoll): Protokoll {
  const neu = neuesProtokoll(vor.projekt, vor.fuehrer);
  Object.assign(neu, {
    serie: vor.serie,
    art: vor.art,
    nr: vor.nr + 1,
    datum: vor.naechster || today(),
    ort: vor.ort,
    verteiler: vor.verteiler,
    hinweis: vor.hinweis,
  });
  neu.teilnehmer = vor.teilnehmer.map((t) => ({
    ...t,
    id: uid('tn'),
    status: t.status === 'nur Verteiler' ? t.status : 'anwesend',
  }));
  neu.tops = vor.tops.map((t, ti) => ({
    id: uid('top'),
    titel: t.titel,
    vorTitel: t.titel,
    eintraege: t.eintraege.flatMap((e, ei) => {
      if (e.typ === 'A' && (e.status === 'erledigt' || e.carriedTo)) return [];
      if (e.typ === 'A') e.carriedTo = neu.id;
      const text = vollerText(e);
      return [
        {
          ...e,
          id: uid('eintrag'),
          text,
          zusatz: '',
          carriedTo: null,
          herkunft: e.herkunft || `Prot. ${vor.nr}, Pkt. ${ti + 1}.${ei + 1}`,
          vor: { typ: e.typ, text, wer: e.wer, termin: e.termin, status: e.status },
        },
      ];
    }),
  }));
  return neu;
}
export function verweiseBereinigen(ps: Protokoll[]) {
  const ids = new Set(ps.map((p) => p.id));
  ps.forEach((p) =>
    p.tops.forEach((t) =>
      t.eintraege.forEach((e) => {
        if (e.carriedTo && !ids.has(e.carriedTo)) e.carriedTo = null;
      }),
    ),
  );
}
/** Entfernt auch ein mittleres Protokoll, ohne fortgeschriebene Aufgaben zu verdoppeln. */
export function protokollEntfernen(ps: Protokoll[], id: string): Protokoll[] {
  const entfernt = ps.find((p) => p.id === id);
  if (!entfernt) return ps;
  ps.forEach((p) =>
    p.tops.forEach((t, ti) =>
      t.eintraege.forEach((e, ei) => {
        if (e.carriedTo !== id) return;
        const herkunft = e.herkunft || `Prot. ${p.nr}, Pkt. ${ti + 1}.${ei + 1}`;
        const folge = entfernt.tops
          .flatMap((t) => t.eintraege)
          .find((a) => a.herkunft === herkunft);
        e.carriedTo = folge?.carriedTo ?? null;
      }),
    ),
  );
  const neu = ps.filter((p) => p.id !== id);
  verweiseBereinigen(neu);
  return neu;
}
export const istNeu = (
  e: ProtokollEintrag,
  ...keys: ('typ' | 'text' | 'wer' | 'termin' | 'status')[]
) => (!e.vor ? !e.herkunft : keys.some((k) => e[k] !== e.vor?.[k]));
