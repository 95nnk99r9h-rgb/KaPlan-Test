/** Eigenständiger Datenbestand der Projektsteuerung. Datumswerte sind lokale Kalendertage. */
export const DATEN_VERSION = 1;
export type Erforderlich = 'offen' | 'ja' | 'nein';
export type Status = 'offen' | 'in_bearbeitung' | 'erledigt';
export type ProjektStatus = 'aktiv' | 'pausiert' | 'abgeschlossen';
export interface Kontakt {
  id: string;
  name: string;
  funktion: string;
  gewerk: string;
  firma: string;
  telefon: string;
  mobil: string;
  email: string;
  strasse: string;
  plz: string;
  ort: string;
  kuerzel: string;
  bemerkung: string;
}
export interface Beauftragung {
  id: string;
  gewerk: string;
  leistung: string;
  erforderlich: Erforderlich;
  status: Status;
  kontaktId: string;
  auftragnehmer: string;
  datum: string;
  bemerkung: string;
}
export type FristBezug = 'fest' | 'baubeginn' | 'abnahme';
export interface Frist {
  id: string;
  gewerk: string;
  titel: string;
  erforderlich: Erforderlich;
  status: Status;
  bezug: FristBezug;
  tageVorher: number;
  termin: string;
  eingereichtAm: string;
  kontaktId: string;
  verantwortlich: string;
  bemerkung: string;
  quelltext: string;
}
export type EintragTyp = 'I' | 'F' | 'A';
export interface Teilnehmer {
  id: string;
  name: string;
  funktion: string;
  firma: string;
  kuerzel: string;
  status: 'anwesend' | 'entschuldigt' | 'abwesend' | 'nur Verteiler';
  auto?: 'fuehrer';
}
export interface ProtokollEintrag {
  id: string;
  typ: EintragTyp;
  text: string;
  zusatz: string;
  wer: string;
  termin: string;
  status: 'offen' | 'erledigt';
  herkunft: string;
  carriedTo: string | null;
  vor?: Pick<ProtokollEintrag, 'typ' | 'text' | 'wer' | 'termin' | 'status'>;
}
export interface Top {
  id: string;
  titel: string;
  vorTitel?: string;
  eintraege: ProtokollEintrag[];
}
/** Feldnamen des mitgelieferten MCProtokoll-Tools bleiben für den Dateiaustausch erhalten. */
export interface Protokoll {
  id: string;
  serie: string;
  projekt: string;
  art: string;
  nr: number;
  datum: string;
  beginn: string;
  ende: string;
  ort: string;
  fuehrer: string;
  naechster: string;
  verteiler: string;
  hinweis: string;
  teilnehmer: Teilnehmer[];
  tops: Top[];
  updated: number;
}
export interface Logo {
  name: string;
  src: string;
}
export interface Projekt {
  id: string;
  name: string;
  nummer: string;
  beschreibung: string;
  status: ProjektStatus;
  markiert: boolean;
  baubeginn: string;
  abnahme: string;
  gewerke: string[];
  gewerkTermine: Record<string, { baubeginn: string; abnahme: string }>;
  kontakte: Kontakt[];
  beauftragungen: Beauftragung[];
  fristen: Frist[];
  protokolle: Protokoll[];
  logos: Logo[];
}
export interface Daten {
  version: number;
  bereich: 'projektsteuerung';
  projekte: Projekt[];
  einstellungen: { bearbeiter: string; farbmodus: 'standard' | 'kontrast' };
}
export const ERFORDERLICH: { value: Erforderlich; label: string }[] = [
  { value: 'offen', label: 'Zu klären' },
  { value: 'ja', label: 'Ja' },
  { value: 'nein', label: 'Nein' },
];
export const STATUS: { value: Status; label: string }[] = [
  { value: 'offen', label: 'Offen' },
  { value: 'in_bearbeitung', label: 'In Bearbeitung' },
  { value: 'erledigt', label: 'Erledigt' },
];
export const TN_STATUS: Teilnehmer['status'][] = [
  'anwesend',
  'entschuldigt',
  'abwesend',
  'nur Verteiler',
];
export const TYPEN: Record<EintragTyp, string> = {
  I: 'Information',
  F: 'Festlegung',
  A: 'Aufgabe',
};
export const uid = (prefix = 'ps') =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
