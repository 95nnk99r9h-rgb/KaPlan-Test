import { useState } from 'react';
import { Card, CardHeader, ConfirmDialog, EmptyState, Modal, Search } from '../../../shared/ui';
import { Icon } from '../../../shared/icons';
import { useToast } from '../../../shared/toast';
import { tabelleLesen } from '../../../shared/xlsxLesen';
import { useStore } from '../store/store';
import type { Kontakt, Projekt } from '../domain/types';
import { kontakteImport, leererKontakt } from '../domain/import';
import { kontakteExcel, kontakteDruck } from '../domain/export';
import {
  Auswahl,
  DateiKnopf,
  DialogAktionen,
  Feld,
  GewerkTabs,
  IconButton,
  optionen,
} from '../components/common';

export function Kontakte({ p }: { p: Projekt }) {
  const { projekt } = useStore(),
    toast = useToast();
  const [gewerk, setGewerk] = useState(''),
    [suche, setSuche] = useState('');
  const [edit, setEdit] = useState<Kontakt | null>(null),
    [loeschen, setLoeschen] = useState<Kontakt | null>(null),
    [importiert, setImportiert] = useState<Kontakt[] | null>(null);
  const sichtbar = p.kontakte
    .filter(
      (k) =>
        (!gewerk || k.gewerk === gewerk) &&
        Object.values(k).join(' ').toLowerCase().includes(suche.toLowerCase()),
    )
    .sort(
      (a, b) =>
        a.gewerk.localeCompare(b.gewerk, 'de') ||
        a.funktion.localeCompare(b.funktion, 'de') ||
        a.name.localeCompare(b.name, 'de'),
    );
  const importieren = async (fs: File[]) => {
    try {
      if (fs[0].size > 15_000_000) throw new Error('Die Datei ist zu groß (maximal 15 MB).');
      setImportiert(kontakteImport(await tabelleLesen(fs[0])));
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <div className="stack">
      <GewerkTabs p={p} value={gewerk} onChange={setGewerk} />
      <div className="row-between wrap">
        <Search value={suche} onChange={setSuche} placeholder="Name, Funktion, Firma …" />
        <div className="row wrap">
          <DateiKnopf accept=".xlsx,.csv" onFile={importieren}>
            Excel-Import
          </DateiKnopf>
          <button
            className="btn btn-outline"
            onClick={() => kontakteExcel(p, sichtbar)}
            disabled={!sichtbar.length}
          >
            Excel
          </button>
          <button
            className="btn btn-outline"
            onClick={() => kontakteDruck(p, sichtbar)}
            disabled={!sichtbar.length}
          >
            Drucken / PDF
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setEdit({ ...leererKontakt(), gewerk: gewerk || 'Übergreifend' })}
          >
            <Icon name="plus" size={14} /> Kontakt anlegen
          </button>
        </div>
      </div>
      <Card>
        <CardHeader
          titel="Projektbeteiligtenliste"
          sub={`${sichtbar.length} von ${p.kontakte.length} Kontakten · Export umfasst die aktuelle Auswahl`}
        />
        {sichtbar.length ? (
          <table className="table table-stack ps-table">
            <thead>
              <tr>
                <th>Gewerk / Funktion</th>
                <th>Name / Firma</th>
                <th>Kontakt</th>
                <th>Anschrift</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sichtbar.map((k) => (
                <tr key={k.id}>
                  <td>
                    <span className="small muted">{k.gewerk}</span>
                    <div>
                      <strong>{k.funktion || 'Ohne Funktion'}</strong>
                    </div>
                  </td>
                  <td>
                    <strong>{k.name}</strong>
                    <div className="small muted">{k.firma}</div>
                    {k.kuerzel ? <span className="badge">{k.kuerzel}</span> : null}
                  </td>
                  <td>
                    {k.email ? (
                      <div>
                        <a href={`mailto:${encodeURIComponent(k.email)}`}>{k.email}</a>
                      </div>
                    ) : null}
                    <div>{[k.telefon, k.mobil].filter(Boolean).join(' · ')}</div>
                    {k.bemerkung ? <div className="small muted">{k.bemerkung}</div> : null}
                  </td>
                  <td className="small">
                    {k.strasse}
                    <br />
                    {k.plz} {k.ort}
                  </td>
                  <td className="actions">
                    <IconButton
                      name="bearbeiten"
                      label={`Kontakt ${k.name} bearbeiten`}
                      onClick={() => setEdit(k)}
                    />
                    <IconButton
                      name="loeschen"
                      label={`Kontakt ${k.name} löschen`}
                      onClick={() => setLoeschen(k)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon="adressbuch"
            titel="Noch keine Kontakte für diese Auswahl"
            text="Kontakte mit Funktion anlegen oder Ihre Excel-Liste importieren."
          />
        )}
      </Card>
      {edit ? <KontaktDialog p={p} kontakt={edit} onClose={() => setEdit(null)} /> : null}
      {loeschen ? (
        <ConfirmDialog
          titel="Kontakt löschen?"
          text={`${loeschen.name} wird aus der Beteiligtenliste entfernt. Der Name bleibt in bereits zugeordneten Beauftragungen und Fristen als Text erhalten. Bestehende Protokolle bleiben erhalten.`}
          onClose={() => setLoeschen(null)}
          onConfirm={() =>
            projekt(p.id, (x) => {
              x.kontakte = x.kontakte.filter((k) => k.id !== loeschen.id);
              x.beauftragungen.forEach((b) => {
                if (b.kontaktId === loeschen.id) {
                  b.kontaktId = '';
                  b.auftragnehmer =
                    b.auftragnehmer || [loeschen.firma, loeschen.name].filter(Boolean).join(' · ');
                }
              });
              x.fristen.forEach((f) => {
                if (f.kontaktId === loeschen.id) {
                  f.kontaktId = '';
                  f.verantwortlich = f.verantwortlich || loeschen.name;
                }
              });
            })
          }
        />
      ) : null}
      {importiert ? (
        <Modal
          titel="Kontakte importieren"
          sub={`${importiert.length} Kontakte erkannt. Bestehende Kontakte bleiben erhalten.`}
          wide
          onClose={() => setImportiert(null)}
          footer={
            <DialogAktionen
              onClose={() => setImportiert(null)}
              label="Kontakte hinzufügen"
              onSave={() => {
                let n = 0;
                const ok = projekt(p.id, (x) => {
                  const keys = new Set(
                    x.kontakte.map((k) =>
                      [k.name, k.firma, k.email, k.gewerk, k.funktion].join('|').toLowerCase(),
                    ),
                  );
                  importiert.forEach((k) => {
                    const key = [k.name, k.firma, k.email, k.gewerk, k.funktion]
                      .join('|')
                      .toLowerCase();
                    if (keys.has(key)) return;
                    keys.add(key);
                    x.kontakte.push(k);
                    if (!x.gewerke.includes(k.gewerk)) x.gewerke.push(k.gewerk);
                    n++;
                  });
                });
                if (ok) {
                  toast(`${n} Kontakte importiert; Dubletten übersprungen.`);
                  setImportiert(null);
                }
              }}
            />
          }
        >
          <div className="ps-import-vorschau">
            <table className="table table-stack">
              <thead>
                <tr>
                  <th>Gewerk</th>
                  <th>Funktion</th>
                  <th>Name</th>
                  <th>Firma</th>
                </tr>
              </thead>
              <tbody>
                {importiert.map((k) => (
                  <tr key={k.id}>
                    <td>{k.gewerk}</td>
                    <td>{k.funktion}</td>
                    <td>{k.name}</td>
                    <td>{k.firma}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small muted">
            Gewerk und Funktion können Sie anschließend an jedem Kontakt bearbeiten.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}
function KontaktDialog({
  p,
  kontakt,
  onClose,
}: {
  p: Projekt;
  kontakt: Kontakt;
  onClose: () => void;
}) {
  const { projekt } = useStore(),
    toast = useToast();
  const [k, setK] = useState({ ...kontakt });
  const set = (key: keyof Kontakt) => (value: string) => setK((k) => ({ ...k, [key]: value }));
  const speichern = () => {
    if (!k.name.trim()) return toast('Bitte einen Namen eingeben.');
    if (k.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k.email))
      return toast('Bitte eine gültige E-Mail-Adresse eingeben.');
    if (
      projekt(p.id, (x) => {
        const i = x.kontakte.findIndex((c) => c.id === k.id);
        const neu = { ...k, name: k.name.trim() };
        if (i < 0) x.kontakte.push(neu);
        else x.kontakte[i] = neu;
      })
    )
      onClose();
  };
  return (
    <Modal
      titel={p.kontakte.some((x) => x.id === k.id) ? 'Kontakt bearbeiten' : 'Kontakt anlegen'}
      onClose={onClose}
      footer={<DialogAktionen onClose={onClose} onSave={speichern} />}
    >
      <div className="form-grid">
        <Feld label="Name" value={k.name} onChange={set('name')} required />
        <Auswahl
          label="Gewerk"
          value={k.gewerk}
          onChange={set('gewerk')}
          options={optionen(p.gewerke)}
        />
        <Feld
          label="Funktion"
          value={k.funktion}
          onChange={set('funktion')}
          placeholder="z. B. Bauvorlagenberechtigter"
        />
        <Feld label="Firma" value={k.firma} onChange={set('firma')} />
        <Feld label="Telefon" value={k.telefon} onChange={set('telefon')} />
        <Feld label="Mobil" value={k.mobil} onChange={set('mobil')} />
        <Feld label="E-Mail" type="email" value={k.email} onChange={set('email')} />
        <Feld label="Kürzel" value={k.kuerzel} onChange={set('kuerzel')} />
        <Feld label="Straße" value={k.strasse} onChange={set('strasse')} full />
        <Feld label="PLZ" value={k.plz} onChange={set('plz')} />
        <Feld label="Ort" value={k.ort} onChange={set('ort')} />
        <Feld label="Bemerkung" value={k.bemerkung} onChange={set('bemerkung')} full multiline />
      </div>
    </Modal>
  );
}
