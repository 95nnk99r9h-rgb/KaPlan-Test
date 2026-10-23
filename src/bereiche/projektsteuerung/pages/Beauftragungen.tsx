import { useState } from 'react';
import {
  Badge,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Modal,
  Search,
} from '../../../shared/ui';
import { useToast } from '../../../shared/toast';
import { formatDate, today } from '../../../shared/dates';
import { Icon } from '../../../shared/icons';
import { ERFORDERLICH, uid, type Beauftragung, type Projekt, type Status } from '../domain/types';
import { auftraegeExcel } from '../domain/export';
import { useStore } from '../store/store';
import {
  Auswahl,
  DialogAktionen,
  Feld,
  GewerkTabs,
  IconButton,
  optionen,
} from '../components/common';
import { ChecklistenImport } from '../components/ChecklistenImport';

const ZUSTAND: { value: Status; label: string }[] = [
  { value: 'offen', label: 'Nicht beauftragt' },
  { value: 'in_bearbeitung', label: 'In Abstimmung' },
  { value: 'erledigt', label: 'Beauftragt' },
];
export function Beauftragungen({ p }: { p: Projekt }) {
  const { projekt } = useStore();
  const [g, setG] = useState(''),
    [suche, setSuche] = useState(''),
    [filter, setFilter] = useState('alle');
  const [edit, setEdit] = useState<Beauftragung | null>(null),
    [del, setDel] = useState<Beauftragung | null>(null);
  const rows = p.beauftragungen.filter(
    (b) =>
      (!g || b.gewerk === g) &&
      (filter === 'alle' ||
        (filter === 'offen' && b.erforderlich !== 'nein' && b.status !== 'erledigt') ||
        (filter === 'erledigt' && b.status === 'erledigt') ||
        (filter === 'entfaellt' && b.erforderlich === 'nein')) &&
      [b.leistung, b.auftragnehmer, b.bemerkung, p.kontakte.find((k) => k.id === b.kontaktId)?.name]
        .join(' ')
        .toLowerCase()
        .includes(suche.toLowerCase()),
  );
  return (
    <div className="stack">
      <GewerkTabs p={p} value={g} onChange={setG} />
      <div className="row-between wrap">
        <div className="row wrap">
          <Search value={suche} onChange={setSuche} placeholder="Leistung, Auftragnehmer …" />
          <select
            className="select"
            aria-label="Beauftragungen filtern"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="alle">Alle Status</option>
            <option value="offen">Offene Beauftragungen</option>
            <option value="erledigt">Beauftragt</option>
            <option value="entfaellt">Nicht erforderlich</option>
          </select>
        </div>
        <div className="row wrap">
          <ChecklistenImport p={p} />
          <button className="btn btn-outline" onClick={() => auftraegeExcel(p)}>
            Excel (alle)
          </button>
          <button
            className="btn btn-primary"
            onClick={() =>
              setEdit({
                id: uid('auftrag'),
                gewerk: g || 'Übergreifend',
                leistung: '',
                erforderlich: 'offen',
                status: 'offen',
                kontaktId: '',
                auftragnehmer: '',
                datum: '',
                bemerkung: '',
              })
            }
          >
            <Icon name="plus" size={14} /> Beauftragung anlegen
          </button>
        </div>
      </div>
      <Card>
        <CardHeader
          titel="Beauftragungen"
          sub={`${rows.length} Einträge · ${p.beauftragungen.filter((b) => b.erforderlich !== 'nein' && b.status !== 'erledigt').length} offen oder zu klären`}
        />
        {rows.length ? (
          <table className="table table-stack ps-table">
            <thead>
              <tr>
                <th>Gewerk / Leistung</th>
                <th>Erforderlich?</th>
                <th>Beauftragung</th>
                <th>Auftragnehmer / Kontakt</th>
                <th>Bemerkung</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className={b.erforderlich === 'nein' ? 'ps-entfaellt' : ''}>
                  <td>
                    <div className="small muted">{b.gewerk}</div>
                    <strong>{b.leistung}</strong>
                  </td>
                  <td>
                    <select
                      className="select"
                      aria-label={`Erforderlich ${b.gewerk} ${b.leistung}`}
                      value={b.erforderlich}
                      onChange={(e) =>
                        projekt(p.id, (x) => {
                          x.beauftragungen.find((a) => a.id === b.id)!.erforderlich = e.target
                            .value as Beauftragung['erforderlich'];
                        })
                      }
                    >
                      {ERFORDERLICH.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="select"
                      aria-label={`Status ${b.gewerk} ${b.leistung}`}
                      value={b.status}
                      onChange={(e) =>
                        projekt(p.id, (x) => {
                          const a = x.beauftragungen.find((a) => a.id === b.id)!;
                          a.status = e.target.value as Status;
                          if (a.status === 'erledigt' && !a.datum) a.datum = today();
                        })
                      }
                    >
                      {ZUSTAND.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {b.datum ? <div className="small muted">{formatDate(b.datum)}</div> : null}
                  </td>
                  <td>
                    {b.auftragnehmer || '–'}
                    {b.kontaktId ? (
                      <div className="small muted">
                        {p.kontakte.find((k) => k.id === b.kontaktId)?.name}
                      </div>
                    ) : null}
                  </td>
                  <td className="small ps-pre">{b.bemerkung}</td>
                  <td className="actions">
                    <IconButton
                      name="bearbeiten"
                      label={`${b.gewerk} ${b.leistung} bearbeiten`}
                      onClick={() => setEdit(b)}
                    />
                    <IconButton
                      name="loeschen"
                      label={`${b.gewerk} ${b.leistung} löschen`}
                      onClick={() => setDel(b)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState titel="Keine Beauftragungen für diese Auswahl" />
        )}
      </Card>
      {edit ? <BeauftragungDialog p={p} b={edit} onClose={() => setEdit(null)} /> : null}
      {del ? (
        <ConfirmDialog
          titel="Beauftragung löschen?"
          text={`${del.gewerk} · ${del.leistung} wird entfernt.`}
          onClose={() => setDel(null)}
          onConfirm={() =>
            projekt(p.id, (x) => {
              x.beauftragungen = x.beauftragungen.filter((b) => b.id !== del.id);
            })
          }
        />
      ) : null}
      <div className="small muted">
        <Badge ton="blue">Vorlage</Badge> Die Checklistenstruktur ist vorbelegt. Legen Sie je
        Projekt fest, welche Leistungen erforderlich sind.
      </div>
    </div>
  );
}
function BeauftragungDialog({
  p,
  b,
  onClose,
}: {
  p: Projekt;
  b: Beauftragung;
  onClose: () => void;
}) {
  const [f, setF] = useState({ ...b });
  const { projekt } = useStore(),
    toast = useToast();
  const set = (k: keyof Beauftragung) => (v: string) => setF((f) => ({ ...f, [k]: v }));
  const speichern = () => {
    if (!f.leistung.trim()) return toast('Bitte eine Leistung oder Funktion eingeben.');
    if (
      projekt(p.id, (x) => {
        const i = x.beauftragungen.findIndex((b) => b.id === f.id);
        const neu = { ...f, leistung: f.leistung.trim() };
        if (i < 0) x.beauftragungen.push(neu);
        else x.beauftragungen[i] = neu;
      })
    )
      onClose();
  };
  return (
    <Modal
      titel="Beauftragung bearbeiten"
      onClose={onClose}
      footer={<DialogAktionen onClose={onClose} onSave={speichern} />}
    >
      <div className="form-grid">
        <Auswahl
          label="Gewerk"
          value={f.gewerk}
          onChange={set('gewerk')}
          options={optionen(p.gewerke)}
        />
        <Feld label="Leistung / Funktion" value={f.leistung} onChange={set('leistung')} required />
        <Auswahl
          label="Erforderlich?"
          value={f.erforderlich}
          onChange={set('erforderlich')}
          options={ERFORDERLICH}
        />
        <Auswahl label="Status" value={f.status} onChange={set('status')} options={ZUSTAND} />
        <Feld label="Auftragnehmer" value={f.auftragnehmer} onChange={set('auftragnehmer')} />
        <Auswahl
          label="Kontakt aus Beteiligtenliste"
          value={f.kontaktId}
          onChange={(v) => {
            const k = p.kontakte.find((k) => k.id === v);
            setF((f) => ({
              ...f,
              kontaktId: v,
              auftragnehmer: f.auftragnehmer || k?.firma || k?.name || '',
            }));
          }}
          options={[
            { value: '', label: 'Keine Zuordnung' },
            ...p.kontakte.map((k) => ({
              value: k.id,
              label: `${k.name} · ${k.funktion} (${k.gewerk})`,
            })),
          ]}
        />
        <Feld label="Beauftragt am" type="date" value={f.datum} onChange={set('datum')} />
        <Feld label="Bemerkung" full multiline value={f.bemerkung} onChange={set('bemerkung')} />
      </div>
    </Modal>
  );
}
