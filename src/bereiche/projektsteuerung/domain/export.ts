import { dateiLaden, xlsxErzeugen, type Blatt, type Zelle } from '../../../shared/xlsx';
import { druckeHtml, html } from '../../../shared/print';
import { formatDate, today } from '../../../shared/dates';
import { aufgaben, fristDatum, fristRegel } from './fristen';
import { istNeu, vollerText } from './protokolle';
import {
  STATUS,
  ERFORDERLICH,
  type Projekt,
  type Kontakt,
  type Protokoll,
  type ProtokollEintrag,
  type Logo,
} from './types';

export const dateiname = (s: string) =>
  s.replace(/[^\p{L}\p{N}_.-]+/gu, '_').slice(0, 100) || 'Projekt';
export function jsonLaden(x: unknown, name: string) {
  dateiLaden(new Blob([JSON.stringify(x, null, 2)], { type: 'application/json' }), name);
}
const status = (s: string) => STATUS.find((x) => x.value === s)?.label ?? s;
const erforderlich = (s: string) => ERFORDERLICH.find((x) => x.value === s)?.label ?? s;
function blatt(name: string, kopf: string[], zeilen: Zelle[][]): Blatt {
  return {
    name,
    zeilen: [
      kopf.map((wert) => ({ wert, stil: { fett: true, fuellung: '24456E', farbe: 'FFFFFF' } })),
      ...zeilen,
    ],
    fixierteZeilen: 1,
    querformat: true,
  };
}
export const KONTAKT_KOPF = [
  'Gewerk',
  'Funktion',
  'Name',
  'Firma',
  'Telefon',
  'Mobil',
  'E-Mail',
  'Straße',
  'PLZ',
  'Ort',
  'Kürzel',
  'Bemerkung',
];
export const kontaktZeilen = (ks: Kontakt[]) =>
  ks.map((k) => [
    k.gewerk,
    k.funktion,
    k.name,
    k.firma,
    k.telefon,
    k.mobil,
    k.email,
    k.strasse,
    k.plz,
    k.ort,
    k.kuerzel,
    k.bemerkung,
  ]);
export function kontakteExcel(p: Projekt, ks = p.kontakte) {
  dateiLaden(
    xlsxErzeugen([blatt('Projektbeteiligtenliste', KONTAKT_KOPF, kontaktZeilen(ks))]),
    `${dateiname(p.name)}_Projektbeteiligte.xlsx`,
  );
}
const kopf = (p: Projekt, t: string) =>
  `<div class="kopf"><h1>${html(t)}</h1><div class="meta">${html(p.nummer)} · ${html(p.name)} · Stand ${formatDate(today())}</div></div>`;
function tabelle(k: string[], rows: (string | number)[][]) {
  return `<table><thead><tr>${k.map((s) => `<th>${html(s)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${html(v).replace(/\n/g, '<br>')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
export function kontakteDruck(p: Projekt, ks = p.kontakte) {
  druckeHtml(
    'Projektbeteiligtenliste',
    kopf(p, 'Projektbeteiligtenliste') +
      tabelle(
        ['Gewerk / Funktion', 'Name / Firma', 'Telefon / Mobil', 'E-Mail', 'Anschrift'],
        ks.map((k) => [
          `${k.gewerk}\n${k.funktion}`,
          `${k.name}\n${k.firma}`,
          [k.telefon, k.mobil].filter(Boolean).join('\n'),
          k.email,
          `${k.strasse}\n${k.plz} ${k.ort}`,
        ]),
      ),
    'td{overflow-wrap:anywhere}',
  );
}
export function auftraegeExcel(p: Projekt) {
  dateiLaden(
    xlsxErzeugen([
      blatt(
        'Beauftragungen',
        [
          'Gewerk',
          'Leistung / Funktion',
          'Erforderlich?',
          'Status',
          'Auftragnehmer',
          'Kontakt',
          'Beauftragt am',
          'Bemerkung',
        ],
        p.beauftragungen.map((b) => [
          b.gewerk,
          b.leistung,
          erforderlich(b.erforderlich),
          status(b.status),
          b.auftragnehmer,
          p.kontakte.find((k) => k.id === b.kontaktId)?.name ?? '',
          { wert: b.datum, datum: !!b.datum },
          b.bemerkung,
        ]),
      ),
    ]),
    `${dateiname(p.name)}_Beauftragungen.xlsx`,
  );
}
export function fristenExcel(p: Projekt) {
  dateiLaden(
    xlsxErzeugen([
      blatt(
        'Fristen',
        [
          'Gewerk',
          'Frist',
          'Erforderlich?',
          'Status',
          'Termin',
          'Regel',
          'Manueller Termin',
          'Eingereicht am',
          'Verantwortlich',
          'Bemerkung',
          'Quelle',
        ],
        p.fristen.map((f) => [
          f.gewerk,
          f.titel,
          erforderlich(f.erforderlich),
          status(f.status),
          { wert: fristDatum(f, p), datum: !!fristDatum(f, p) },
          fristRegel(f),
          { wert: f.termin, datum: !!f.termin },
          { wert: f.eingereichtAm, datum: !!f.eingereichtAm },
          p.kontakte.find((k) => k.id === f.kontaktId)?.name || f.verantwortlich,
          f.bemerkung,
          f.quelltext,
        ]),
      ),
      blatt(
        'Protokollaufgaben',
        ['Protokoll', 'Nr.', 'Punkt', 'Aufgabe', 'Verantwortlich', 'Termin', 'Status'],
        aufgaben(p.protokolle).map((a) => [
          a.protokoll.art,
          a.protokoll.nr,
          a.nummer,
          vollerText(a.eintrag),
          a.eintrag.wer,
          { wert: a.eintrag.termin, datum: !!a.eintrag.termin },
          a.eintrag.status === 'erledigt' ? 'Erledigt' : 'Offen',
        ]),
      ),
    ]),
    `${dateiname(p.name)}_Fristen.xlsx`,
  );
}
export const logoQuelle = (l: Logo) =>
  l.src.startsWith('data:') ? l.src : `${import.meta.env.BASE_URL}${l.src}`;
const attr = (s: string) => html(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
function druckText(e: ProtokollEintrag) {
  let out = '';
  if (!e.vor && !e.herkunft) out = `<span class="neu">${html(e.text)}</span>`;
  else if (!e.vor || e.text === e.vor.text) out = html(e.text);
  else if (e.vor.text && e.text.startsWith(e.vor.text))
    out = html(e.vor.text) + `<span class="neu">${html(e.text.slice(e.vor.text.length))}</span>`;
  else out = `<span class="neu">${html(e.text)}</span>`;
  return out + (e.zusatz.trim() ? `<br><span class="neu">${html(e.zusatz.trim())}</span>` : '');
}
export const DRUCK_STIL = `@page{size:A4 portrait;margin:16mm 13mm}body{font-size:10pt} .prot-head{display:flex;justify-content:space-between;gap:20px}.prot-logos{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.prot-logos img{max-width:125px;max-height:30px;object-fit:contain}.prot-meta{display:flex;gap:20px;flex-wrap:wrap;border-block:1px solid #c7c7cc;padding:12px 0;margin:18px 0}.prot-meta span{display:block;font-size:10px;color:#6e6e73}.neu{color:#1846c4}.prot-content{white-space:pre-wrap;overflow-wrap:anywhere}.prot-from{font-size:9px;color:#6e6e73}.prot-top{background:#f2f2f7;font-weight:600}.prot-footer{margin-top:20px;white-space:pre-wrap}.prot-note{font-size:10px;color:#6e6e73;margin-top:14px}.prot-table{table-layout:fixed}.prot-table th{font-size:10px;overflow-wrap:anywhere}.prot-table td{overflow-wrap:anywhere}.prot-table th:first-child{width:38px}.prot-table th:nth-child(3){width:35px}.prot-table th:nth-child(4){width:100px}.prot-table th:last-child{width:78px}thead{display:table-header-group}tr{break-inside:avoid}td{vertical-align:top}`;
export function protokollHtml(p: Protokoll, logos: Logo[]): string {
  const n = (e: ProtokollEintrag, ...keys: ('typ' | 'wer' | 'termin' | 'status')[]) =>
    istNeu(e, ...keys) ? 'neu' : '';
  return `<div class="prot-head"><div><h1>Protokoll</h1><div>${html(p.art)} Nr. ${p.nr}</div><div>${html(p.projekt)}</div></div><div class="prot-logos">${logos.map((l) => `<img src="${attr(logoQuelle(l))}" alt="${attr(l.name)}">`).join('')}</div></div>
  <div class="prot-meta">${[
    ['Datum', formatDate(p.datum)],
    ['Zeit', [p.beginn, p.ende].filter(Boolean).join(' – ')],
    ['Ort', p.ort],
    ['Protokollführer', p.fuehrer],
  ]
    .map(([k, v]) => `<div><span>${k}</span>${html(v) || '–'}</div>`)
    .join('')}</div>
  <h2>Teilnehmer und Verteiler</h2>${tabelle(
    ['Name', 'Funktion', 'Firma', 'Kürzel', 'Status'],
    p.teilnehmer
      .filter((t) => t.name || t.firma)
      .map((t) => [t.name, t.funktion, t.firma, t.kuerzel, t.status]),
  )}
  ${p.verteiler ? `<p>Zusätzlicher Verteiler: ${html(p.verteiler)}</p>` : ''}<p class="prot-note">I Information · F Festlegung · A Aufgabe. <span class="neu">Neue und geänderte Angaben sind blau.</span></p>
  <table class="prot-table"><thead><tr><th>Nr.</th><th>Inhalt</th><th>Typ</th><th>Verantwortlich</th><th>Termin</th></tr></thead><tbody>${p.tops.map((t, ti) => `<tr class="prot-top ${t.vorTitel !== t.titel ? 'neu' : ''}"><td>${ti + 1}</td><td colspan="4">${html(t.titel)}</td></tr>${t.eintraege.map((e, ei) => `<tr><td class="${n(e)}">${ti + 1}.${ei + 1}</td><td><div class="prot-content">${druckText(e)}</div>${e.herkunft ? `<div class="prot-from">${html(e.herkunft)}</div>` : ''}</td><td class="${n(e, 'typ')}">${e.typ}</td><td class="${n(e, 'wer')}">${html(e.wer)}</td><td class="${n(e, 'termin', 'status')}">${e.typ === 'A' ? (e.status === 'erledigt' ? 'erledigt' : e.termin ? formatDate(e.termin) : 'offen') : ''}</td></tr>`).join('')}`).join('')}</tbody></table>
  <div class="prot-footer">${p.naechster ? `<p>Nächster Termin: ${formatDate(p.naechster)}</p>` : ''}<p>Aufgestellt: ${html(p.fuehrer)}, ${formatDate(p.datum)}</p><p class="prot-note">${html(p.hinweis)}</p></div>`;
}
export function protokollDruck(p: Protokoll, logos: Logo[]) {
  druckeHtml(html(`${p.art} ${p.nr}`), protokollHtml(p, logos), DRUCK_STIL);
}
export function protokollText(p: Protokoll) {
  return [
    `PROTOKOLL – ${p.art} Nr. ${p.nr}`,
    `Projekt: ${p.projekt}`,
    `Datum: ${formatDate(p.datum)} · ${p.beginn} – ${p.ende}`,
    `Ort: ${p.ort}`,
    `Protokollführer: ${p.fuehrer}`,
    '',
    'Teilnehmer:',
    ...p.teilnehmer.map(
      (t) => `${t.name} · ${t.funktion} · ${t.firma} · ${t.kuerzel} · ${t.status}`,
    ),
    `Verteiler: ${p.verteiler}`,
    '',
    ...p.tops.flatMap((t, ti) => [
      `TOP ${ti + 1}: ${t.titel}`,
      ...t.eintraege.map(
        (e, ei) =>
          `${ti + 1}.${ei + 1} [${e.typ}] ${vollerText(e)}${e.wer ? ` | ${e.wer}` : ''}${e.typ === 'A' ? ` | ${e.status === 'erledigt' ? 'erledigt' : formatDate(e.termin)}` : ''}`,
      ),
    ]),
    `Nächster Termin: ${formatDate(p.naechster)}`,
    p.hinweis,
  ].join('\n');
}
