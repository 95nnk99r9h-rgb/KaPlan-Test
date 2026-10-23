import { uid, type Projekt, type Beauftragung, type Frist, type Daten } from './types';

/** Struktur aus Checkliste_Hp_Aalen_West.xlsx; ohne Personen und historische Bearbeitungsstände. */
export const GEWERKE = [
  'Übergreifend',
  'EEA/50Hz',
  'KIB',
  'KTB',
  'VA',
  'LST',
  'Oberbau',
  'OLA',
  'TK',
  'Erdung',
  'Gutachten',
  'Bauüberwachung',
];
export const CHECKLISTE: {
  gewerk: string;
  name: string;
  art: 'frist' | 'beauftragung';
  bezug?: 'baubeginn' | 'abnahme';
  tageVorher?: number;
}[] = [
  {
    gewerk: 'EEA/50Hz',
    name: 'Planer',
    art: 'beauftragung',
  },
  {
    gewerk: 'EEA/50Hz',
    name: 'Planprüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'EEA/50Hz',
    name: 'BVB',
    art: 'beauftragung',
  },
  {
    gewerk: 'EEA/50Hz',
    name: 'Bau AN',
    art: 'beauftragung',
  },
  {
    gewerk: 'EEA/50Hz',
    name: 'Abnahmeprüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'EEA/50Hz',
    name: 'IBV',
    art: 'beauftragung',
  },
  {
    gewerk: 'EEA/50Hz',
    name: 'EIGV-Anzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 70,
  },
  {
    gewerk: 'EEA/50Hz',
    name: 'Baubeginnanzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 14,
  },
  {
    gewerk: 'EEA/50Hz',
    name: 'Anzeige der Abnahme',
    art: 'frist',
    bezug: 'abnahme',
    tageVorher: 14,
  },
  {
    gewerk: 'KIB',
    name: 'Planer',
    art: 'beauftragung',
  },
  {
    gewerk: 'KIB',
    name: 'Prüfstatiker / bautechnischer Prüfung',
    art: 'beauftragung',
  },
  {
    gewerk: 'KIB',
    name: 'Fachtechnischer Prüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'KIB',
    name: 'BVB',
    art: 'beauftragung',
  },
  {
    gewerk: 'KIB',
    name: 'Bau AN',
    art: 'beauftragung',
  },
  {
    gewerk: 'KIB',
    name: 'Abnahmeprüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'KIB',
    name: 'IBV',
    art: 'beauftragung',
  },
  {
    gewerk: 'KIB',
    name: 'EIGV-Anzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 70,
  },
  {
    gewerk: 'KIB',
    name: 'Baubeginnanzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 14,
  },
  {
    gewerk: 'KIB',
    name: 'Anzeige der Abnahme',
    art: 'frist',
    bezug: 'abnahme',
    tageVorher: 14,
  },
  {
    gewerk: 'KTB',
    name: 'Planer',
    art: 'beauftragung',
  },
  {
    gewerk: 'KTB',
    name: 'BVB',
    art: 'beauftragung',
  },
  {
    gewerk: 'KTB',
    name: 'Bau AN',
    art: 'beauftragung',
  },
  {
    gewerk: 'KTB',
    name: 'IBV',
    art: 'beauftragung',
  },
  {
    gewerk: 'KTB',
    name: 'EIGV-Anzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 70,
  },
  {
    gewerk: 'KTB',
    name: 'Baubeginnanzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 14,
  },
  {
    gewerk: 'VA',
    name: 'Planer',
    art: 'beauftragung',
  },
  {
    gewerk: 'VA',
    name: 'Prüfstatiker / bautechnischer Prüfung',
    art: 'beauftragung',
  },
  {
    gewerk: 'VA',
    name: 'Fachtechnischer Prüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'VA',
    name: 'BVB',
    art: 'beauftragung',
  },
  {
    gewerk: 'VA',
    name: 'Bau AN',
    art: 'beauftragung',
  },
  {
    gewerk: 'VA',
    name: 'IBV',
    art: 'beauftragung',
  },
  {
    gewerk: 'VA',
    name: 'EIGV-Anzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 70,
  },
  {
    gewerk: 'VA',
    name: 'TSI-Prüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'VA',
    name: 'Baubeginnanzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 28,
  },
  {
    gewerk: 'LST',
    name: 'Planer',
    art: 'beauftragung',
  },
  {
    gewerk: 'LST',
    name: 'Planprüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'LST',
    name: 'Prüfstatiker',
    art: 'beauftragung',
  },
  {
    gewerk: 'LST',
    name: 'BVB',
    art: 'beauftragung',
  },
  {
    gewerk: 'LST',
    name: 'Bau AN',
    art: 'beauftragung',
  },
  {
    gewerk: 'LST',
    name: 'Abnahmeprüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'LST',
    name: 'IBV',
    art: 'beauftragung',
  },
  {
    gewerk: 'LST',
    name: 'EIGV-Anzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 70,
  },
  {
    gewerk: 'LST',
    name: 'Baubeginnanzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 14,
  },
  {
    gewerk: 'LST',
    name: 'Anzeige der Abnahme',
    art: 'frist',
    bezug: 'abnahme',
    tageVorher: 14,
  },
  {
    gewerk: 'Oberbau',
    name: 'Planer',
    art: 'beauftragung',
  },
  {
    gewerk: 'Oberbau',
    name: 'Planprüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'Oberbau',
    name: 'Prüfstatiker',
    art: 'beauftragung',
  },
  {
    gewerk: 'Oberbau',
    name: 'BVB',
    art: 'beauftragung',
  },
  {
    gewerk: 'Oberbau',
    name: 'Bau AN',
    art: 'beauftragung',
  },
  {
    gewerk: 'Oberbau',
    name: 'Abnahmeprüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'Oberbau',
    name: 'IBV',
    art: 'beauftragung',
  },
  {
    gewerk: 'Oberbau',
    name: 'EIGV-Anzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 70,
  },
  {
    gewerk: 'Oberbau',
    name: 'Baubeginnanzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 14,
  },
  {
    gewerk: 'Oberbau',
    name: 'Anzeige der Abnahme',
    art: 'frist',
    bezug: 'abnahme',
    tageVorher: 14,
  },
  {
    gewerk: 'OLA',
    name: 'Planer',
    art: 'beauftragung',
  },
  {
    gewerk: 'OLA',
    name: 'Planprüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'OLA',
    name: 'Prüfstatiker',
    art: 'beauftragung',
  },
  {
    gewerk: 'OLA',
    name: 'BVB',
    art: 'beauftragung',
  },
  {
    gewerk: 'OLA',
    name: 'Bau AN',
    art: 'beauftragung',
  },
  {
    gewerk: 'OLA',
    name: 'Abnahmeprüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'OLA',
    name: 'IBV',
    art: 'beauftragung',
  },
  {
    gewerk: 'OLA',
    name: 'EIGV-Anzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 70,
  },
  {
    gewerk: 'OLA',
    name: 'Baubeginnanzeige',
    art: 'frist',
    bezug: 'baubeginn',
    tageVorher: 14,
  },
  {
    gewerk: 'OLA',
    name: 'Anzeige der Abnahme',
    art: 'frist',
    bezug: 'abnahme',
    tageVorher: 14,
  },
  {
    gewerk: 'TK',
    name: 'Planer',
    art: 'beauftragung',
  },
  {
    gewerk: 'TK',
    name: 'Planprüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'TK',
    name: 'Fachspezialist',
    art: 'beauftragung',
  },
  {
    gewerk: 'TK',
    name: 'BVB',
    art: 'beauftragung',
  },
  {
    gewerk: 'TK',
    name: 'Bau AN',
    art: 'beauftragung',
  },
  {
    gewerk: 'TK',
    name: 'Abnahmeprüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'TK',
    name: 'IBV',
    art: 'beauftragung',
  },
  {
    gewerk: 'TK',
    name: 'Anzeige der Abnahme',
    art: 'frist',
    bezug: 'abnahme',
    tageVorher: 14,
  },
  {
    gewerk: 'Erdung',
    name: 'Planer',
    art: 'beauftragung',
  },
  {
    gewerk: 'Erdung',
    name: 'Planprüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'Erdung',
    name: 'BVB',
    art: 'beauftragung',
  },
  {
    gewerk: 'Erdung',
    name: 'Bau AN',
    art: 'beauftragung',
  },
  {
    gewerk: 'Erdung',
    name: 'Abnahmeprüfer',
    art: 'beauftragung',
  },
  {
    gewerk: 'Erdung',
    name: 'IBV',
    art: 'beauftragung',
  },
  {
    gewerk: 'Erdung',
    name: 'Anzeige der Abnahme',
    art: 'frist',
    bezug: 'abnahme',
    tageVorher: 14,
  },
  {
    gewerk: 'Gutachten',
    name: 'Geotechnischer Gutachter',
    art: 'beauftragung',
  },
  {
    gewerk: 'Gutachten',
    name: 'Wasserrechtlicher Gutachter',
    art: 'beauftragung',
  },
  {
    gewerk: 'Gutachten',
    name: 'Schal- und Erschütterungsgutachter',
    art: 'beauftragung',
  },
  {
    gewerk: 'Gutachten',
    name: 'Verkehrsgutachter',
    art: 'beauftragung',
  },
  {
    gewerk: 'Gutachten',
    name: 'Kampfmittelgutachter',
    art: 'beauftragung',
  },
  {
    gewerk: 'Bauüberwachung',
    name: 'Leitende BÜW',
    art: 'beauftragung',
  },
  {
    gewerk: 'Bauüberwachung',
    name: 'BÜW KIB',
    art: 'beauftragung',
  },
  {
    gewerk: 'Bauüberwachung',
    name: 'BÜW Fahrbahn',
    art: 'beauftragung',
  },
  {
    gewerk: 'Bauüberwachung',
    name: 'BÜW LST',
    art: 'beauftragung',
  },
  {
    gewerk: 'Bauüberwachung',
    name: 'BÜW 50Hz',
    art: 'beauftragung',
  },
  {
    gewerk: 'Bauüberwachung',
    name: 'BÜW TK',
    art: 'beauftragung',
  },
  {
    gewerk: 'Bauüberwachung',
    name: 'UBÜ - Naturschutz',
    art: 'beauftragung',
  },
  {
    gewerk: 'Bauüberwachung',
    name: 'UBÜ - Immsionsschutz',
    art: 'beauftragung',
  },
  {
    gewerk: 'Bauüberwachung',
    name: 'UBÜ - Abfall & Boden',
    art: 'beauftragung',
  },
  {
    gewerk: 'Bauüberwachung',
    name: 'Sicherungsfirma',
    art: 'beauftragung',
  },
];
export function standardBeauftragungen(): Beauftragung[] {
  return CHECKLISTE.filter((v) => v.art === 'beauftragung').map((v) => ({
    id: uid('auftrag'),
    gewerk: v.gewerk,
    leistung: v.name,
    erforderlich: 'offen',
    status: 'offen',
    kontaktId: '',
    auftragnehmer: '',
    datum: '',
    bemerkung: '',
  }));
}
export function standardFristen(): Frist[] {
  return CHECKLISTE.filter((v) => v.art === 'frist').map((v) => ({
    id: uid('frist'),
    gewerk: v.gewerk,
    titel: v.name,
    erforderlich: 'offen',
    status: 'offen',
    bezug: v.bezug!,
    tageVorher: v.tageVorher!,
    termin: '',
    eingereichtAm: '',
    kontaktId: '',
    verantwortlich: '',
    bemerkung: '',
    quelltext: 'Vorlage: Checkliste Hp Aalen-West. Projektbezogen anpassen.',
  }));
}
export function standardLogos() {
  return [
    { name: 'DB InfraGO', src: 'protokoll-logos/db.png' },
    { name: 'Mailänder Consult', src: 'protokoll-logos/mc.png' },
  ];
}
export function neuesProjekt(): Projekt {
  return {
    id: uid('projekt'),
    name: '',
    nummer: '',
    beschreibung: '',
    status: 'aktiv',
    markiert: true,
    baubeginn: '',
    abnahme: '',
    gewerke: [...GEWERKE],
    gewerkTermine: {},
    kontakte: [],
    beauftragungen: standardBeauftragungen(),
    fristen: standardFristen(),
    protokolle: [],
    logos: standardLogos(),
  };
}
export function leereDaten(): Daten {
  return {
    version: 1,
    bereich: 'projektsteuerung',
    projekte: [],
    einstellungen: { bearbeiter: '', farbmodus: 'standard' },
  };
}
