import {
  DATEN_VERSION,
  type Daten,
  type Projekt,
  type Kontakt,
  type Beauftragung,
  type Frist,
  type Protokoll,
  type Logo,
  type ProtokollEintrag,
} from '../domain/types';
import { gueltigesDatum } from '../domain/fristen';
import { verweiseBereinigen } from '../domain/protokolle';

export function objekt(x: unknown): Record<string, unknown> {
  if (!x || typeof x !== 'object' || Array.isArray(x)) throw new Error('Ungültiges Datenformat.');
  return x as Record<string, unknown>;
}
const text = (x: unknown) => (typeof x === 'string' ? x : '');
const id = (x: unknown) => {
  if (typeof x !== 'string' || !x.trim()) throw new Error('Kennung fehlt.');
  return x;
};
const datum = (x: unknown) => {
  const s = text(x);
  if (!gueltigesDatum(s)) throw new Error(`Ungültiges Datum: ${s}`);
  return s;
};
const liste = (x: unknown): unknown[] => {
  if (!Array.isArray(x)) throw new Error('Eine erforderliche Liste fehlt.');
  return x;
};
function wahl<T extends string>(x: unknown, werte: readonly T[], ersatz: T): T {
  return werte.includes(x as T) ? (x as T) : ersatz;
}
function eindeutig<T extends { id: string }>(items: T[]): T[] {
  if (new Set(items.map((x) => x.id)).size !== items.length)
    throw new Error('Doppelte Kennungen in der Datei.');
  return items;
}
export function logosLesen(x: unknown): Logo[] {
  return liste(x)
    .map(objekt)
    .map((l) => {
      const src = text(l.src);
      if (
        !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(src) &&
        !['protokoll-logos/db.png', 'protokoll-logos/mc.png'].includes(src)
      )
        throw new Error(
          'Das Logoformat wird nicht unterstützt. Bitte PNG, JPG oder WebP verwenden.',
        );
      return { name: text(l.name), src };
    });
}
export function protokollLesen(x: unknown): Protokoll {
  const p = objekt(x);
  if (typeof p.nr !== 'number' && typeof p.nr !== 'string')
    throw new Error('Protokollnummer fehlt.');
  const nr = Number(p.nr);
  if (!Number.isInteger(nr) || nr < 1) throw new Error('Ungültige Protokollnummer.');
  const eintrag = (x: unknown): ProtokollEintrag => {
    const e = objekt(x);
    if (!['I', 'F', 'A'].includes(text(e.typ))) throw new Error('Unbekannter Protokolleintrag.');
    const vor = e.vor ? objekt(e.vor) : null;
    return {
      id: id(e.id),
      typ: e.typ as ProtokollEintrag['typ'],
      text: text(e.text),
      zusatz: text(e.zusatz),
      wer: text(e.wer),
      termin: datum(e.termin),
      status: wahl(e.status, ['offen', 'erledigt'], 'offen'),
      herkunft: text(e.herkunft),
      carriedTo: text(e.carriedTo) || null,
      ...(vor
        ? {
            vor: {
              typ: wahl(vor.typ, ['I', 'F', 'A'], 'I'),
              text: text(vor.text),
              wer: text(vor.wer),
              termin: datum(vor.termin),
              status: wahl(vor.status, ['offen', 'erledigt'], 'offen'),
            },
          }
        : {}),
    };
  };
  return {
    id: id(p.id),
    serie: text(p.serie) || `pa:${text(p.projekt)}|${text(p.art)}`,
    projekt: text(p.projekt),
    art: text(p.art),
    nr,
    datum: datum(p.datum),
    beginn: text(p.beginn),
    ende: text(p.ende),
    ort: text(p.ort),
    fuehrer: text(p.fuehrer),
    naechster: datum(p.naechster),
    verteiler: text(p.verteiler),
    hinweis: text(p.hinweis),
    updated: typeof p.updated === 'number' && Number.isFinite(p.updated) ? p.updated : 0,
    teilnehmer: eindeutig(
      liste(p.teilnehmer ?? [])
        .map(objekt)
        .map((t) => ({
          id: id(t.id),
          name: text(t.name),
          funktion: text(t.funktion),
          firma: text(t.firma),
          kuerzel: text(t.kuerzel),
          status: wahl(
            t.status,
            ['anwesend', 'entschuldigt', 'abwesend', 'nur Verteiler'],
            'anwesend',
          ),
          ...(t.auto === 'fuehrer' ? { auto: 'fuehrer' as const } : {}),
        })),
    ),
    tops: eindeutig(
      liste(p.tops)
        .map(objekt)
        .map((t) => ({
          id: id(t.id),
          titel: text(t.titel),
          ...(typeof t.vorTitel === 'string' ? { vorTitel: t.vorTitel } : {}),
          eintraege: eindeutig(liste(t.eintraege).map(eintrag)),
        })),
    ),
  };
}
export function protokollDateiLesen(x: unknown): { protokolle: Protokoll[]; logos?: Logo[] } {
  const o = objekt(x);
  if (o.bereich && o.bereich !== 'projektsteuerung')
    throw new Error('Die Datei gehört zu einem anderen Bereich.');
  if (typeof o.version === 'number' && o.version > 2)
    throw new Error('Diese Protokolldatei stammt aus einer neueren Fassung.');
  const list = o.protocols ?? (o.protocol ? [o.protocol] : o.tops ? [o] : null);
  const protokolle = eindeutig(liste(list).map(protokollLesen));
  if (!protokolle.length) throw new Error('Die Datei enthält keine Protokolle.');
  return { protokolle, ...(Array.isArray(o.logos) ? { logos: logosLesen(o.logos) } : {}) };
}
export function datenLesen(x: unknown): Daten {
  const d = objekt(x);
  if (d.bereich !== 'projektsteuerung' || d.version !== DATEN_VERSION)
    throw new Error('Keine unterstützte Sicherung der Projektsteuerung (Fassung 1).');
  const projekte = eindeutig(
    liste(d.projekte).map((x): Projekt => {
      const p = objekt(x);
      const kontakte = eindeutig(
        liste(p.kontakte)
          .map(objekt)
          .map(
            (k): Kontakt => ({
              id: id(k.id),
              name: text(k.name),
              funktion: text(k.funktion),
              gewerk: text(k.gewerk),
              firma: text(k.firma),
              telefon: text(k.telefon),
              mobil: text(k.mobil),
              email: text(k.email),
              strasse: text(k.strasse),
              plz: text(k.plz),
              ort: text(k.ort),
              kuerzel: text(k.kuerzel),
              bemerkung: text(k.bemerkung),
            }),
          ),
      );
      const beauftragungen = eindeutig(
        liste(p.beauftragungen)
          .map(objekt)
          .map(
            (b): Beauftragung => ({
              id: id(b.id),
              gewerk: text(b.gewerk),
              leistung: text(b.leistung),
              erforderlich: wahl(b.erforderlich, ['ja', 'nein', 'offen'], 'offen'),
              status: wahl(b.status, ['offen', 'in_bearbeitung', 'erledigt'], 'offen'),
              kontaktId: text(b.kontaktId),
              auftragnehmer: text(b.auftragnehmer),
              datum: datum(b.datum),
              bemerkung: text(b.bemerkung),
            }),
          ),
      );
      const fristen = eindeutig(
        liste(p.fristen)
          .map(objekt)
          .map((f): Frist => {
            if (
              typeof f.tageVorher !== 'number' ||
              !Number.isInteger(f.tageVorher) ||
              Math.abs(f.tageVorher) > 36500
            )
              throw new Error('Ungültiger Fristabstand.');
            return {
              id: id(f.id),
              gewerk: text(f.gewerk),
              titel: text(f.titel),
              erforderlich: wahl(f.erforderlich, ['ja', 'nein', 'offen'], 'offen'),
              status: wahl(f.status, ['offen', 'in_bearbeitung', 'erledigt'], 'offen'),
              bezug: wahl(f.bezug, ['fest', 'baubeginn', 'abnahme'], 'fest'),
              tageVorher: f.tageVorher,
              termin: datum(f.termin),
              eingereichtAm: datum(f.eingereichtAm),
              kontaktId: text(f.kontaktId),
              verantwortlich: text(f.verantwortlich),
              bemerkung: text(f.bemerkung),
              quelltext: text(f.quelltext),
            };
          }),
      );
      const gewerkTermine: Projekt['gewerkTermine'] = {};
      Object.entries(objekt(p.gewerkTermine ?? {})).forEach(([k, v]) => {
        if (['__proto__', 'constructor', 'prototype'].includes(k))
          throw new Error('Ungültiges Gewerk.');
        const t = objekt(v);
        gewerkTermine[k] = { baubeginn: datum(t.baubeginn), abnahme: datum(t.abnahme) };
      });
      const protokolle = eindeutig(liste(p.protokolle).map(protokollLesen));
      verweiseBereinigen(protokolle);
      const gewerke = [
        ...new Set(
          [
            ...liste(p.gewerke).map(text),
            ...kontakte.map((k) => k.gewerk),
            ...beauftragungen.map((b) => b.gewerk),
            ...fristen.map((f) => f.gewerk),
          ].filter(Boolean),
        ),
      ];
      if (gewerke.some((g) => ['__proto__', 'constructor', 'prototype'].includes(g)))
        throw new Error('Ungültiger Gewerkname.');
      return {
        id: id(p.id),
        name: text(p.name),
        nummer: text(p.nummer),
        beschreibung: text(p.beschreibung),
        status: wahl(p.status, ['aktiv', 'pausiert', 'abgeschlossen'], 'aktiv'),
        markiert: p.markiert === true,
        baubeginn: datum(p.baubeginn),
        abnahme: datum(p.abnahme),
        gewerke,
        gewerkTermine,
        kontakte,
        beauftragungen,
        fristen,
        protokolle,
        logos: logosLesen(p.logos ?? []),
      };
    }),
  );
  const e = objekt(d.einstellungen);
  return {
    version: DATEN_VERSION,
    bereich: 'projektsteuerung',
    projekte,
    einstellungen: {
      bearbeiter: text(e.bearbeiter),
      farbmodus: wahl(e.farbmodus, ['standard', 'kontrast'], 'standard'),
    },
  };
}
