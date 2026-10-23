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
import { Icon } from '../../../shared/icons';
import { formatDate, today } from '../../../shared/dates';
import { useStore } from '../store/store';
import { uid, ERFORDERLICH, STATUS, type Frist, type Projekt } from '../domain/types';
import { ampel, aufgaben, fristDatum, fristRegel } from '../domain/fristen';
import { fristenExcel } from '../domain/export';
import {
  Auswahl,
  Ampel,
  DialogAktionen,
  Feld,
  GewerkTabs,
  IconButton,
  optionen,
} from '../components/common';
import { ChecklistenImport } from '../components/ChecklistenImport';
import type { Route } from '../lib/router';

export function Fristen({ p, navigate }: { p?: Projekt; navigate: (r: Route) => void }) {
  const { data, projekt } = useStore();
  const [g, setG] = useState(''),
    [suche, setSuche] = useState(''),
    [filter, setFilter] = useState('offen');
  const [edit, setEdit] = useState<Frist | null>(null),
    [del, setDel] = useState<Frist | null>(null),
    [termine, setTermine] = useState(false);
  const projekte = p ? [p] : data.projekte;
  const passt = (termin: string, erledigt: boolean, erforderlich: boolean, text: string) => {
    const a = ampel(termin, erledigt, erforderlich);
    if (!text.toLowerCase().includes(suche.toLowerCase())) return false;
    if (filter === 'alle') return true;
    if (filter === 'offen') return !erledigt && erforderlich;
    if (filter === 'erledigt') return erledigt;
    return a === filter;
  };
  const rows = projekte
    .flatMap((p) =>
      p.fristen
        .filter(
          (f) =>
            (!g || f.gewerk === g) &&
            passt(
              fristDatum(f, p),
              f.status === 'erledigt',
              f.erforderlich !== 'nein',
              [
                p.name,
                f.gewerk,
                f.titel,
                f.verantwortlich,
                f.bemerkung,
                p.kontakte.find((k) => k.id === f.kontaktId)?.name,
              ].join(' '),
            ),
        )
        .map((f) => ({ p, f, datum: fristDatum(f, p) })),
    )
    .sort((a, b) => (a.datum || '9999').localeCompare(b.datum || '9999'));
  const tasks = projekte.flatMap((p) =>
    aufgaben(p.protokolle)
      .filter(
        (a) =>
          !g &&
          passt(
            a.eintrag.termin,
            a.eintrag.status === 'erledigt',
            true,
            [p.name, a.eintrag.text, a.eintrag.zusatz, a.eintrag.wer].join(' '),
          ),
      )
      .map((a) => ({ ...a, p })),
  );
  return (
    <div className="stack">
      {p ? <GewerkTabs p={p} value={g} onChange={setG} /> : null}
      <div className="row-between wrap">
        <div className="row wrap">
          <Search
            value={suche}
            onChange={setSuche}
            placeholder="Frist, Gewerk, Verantwortliche …"
          />
          <select
            aria-label="Fristen filtern"
            className="select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {[
              { value: 'offen', label: 'Offene Fristen' },
              { value: 'alle', label: 'Alle Status' },
              { value: 'ueberfaellig', label: 'Überfällig' },
              { value: 'faellig', label: 'In 14 Tagen fällig' },
              { value: 'ohne_termin', label: 'Termin fehlt' },
              { value: 'erledigt', label: 'Erledigt' },
              { value: 'entfaellt', label: 'Nicht erforderlich' },
            ].map((o) => (
              <option value={o.value} key={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {p ? (
          <div className="row wrap">
            <button className="btn btn-outline" onClick={() => setTermine(true)}>
              Bezugstermine
            </button>
            <ChecklistenImport p={p} />
            <button className="btn btn-outline" onClick={() => fristenExcel(p)}>
              Excel (alle)
            </button>
            <button
              className="btn btn-primary"
              onClick={() =>
                setEdit({
                  id: uid('frist'),
                  gewerk: g || 'Übergreifend',
                  titel: '',
                  erforderlich: 'ja',
                  status: 'offen',
                  bezug: 'fest',
                  tageVorher: 0,
                  termin: '',
                  eingereichtAm: '',
                  kontaktId: '',
                  verantwortlich: '',
                  bemerkung: '',
                  quelltext: '',
                })
              }
            >
              <Icon name="plus" size={14} /> Frist anlegen
            </button>
          </div>
        ) : null}
      </div>
      <Card>
        <CardHeader
          titel="Fristen"
          sub={`${rows.length} Einträge · Anzeigen und weitere Projektfristen`}
        />
        {rows.length ? (
          <table className="table table-stack ps-table">
            <thead>
              <tr>
                <th>Frist / Gewerk</th>
                <th>Termin</th>
                <th>Status</th>
                <th>Verantwortlich</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p: pr, f, datum }) => (
                <tr key={f.id}>
                  <td>
                    {!p ? (
                      <button
                        className="ps-link small"
                        onClick={() =>
                          navigate({ view: 'projekt', projektId: pr.id, tab: 'fristen' })
                        }
                      >
                        {pr.name}
                      </button>
                    ) : null}
                    <div className="small muted">{f.gewerk}</div>
                    <strong>{f.titel}</strong>
                    {f.erforderlich === 'offen' ? (
                      <div>
                        <Badge ton="orange">Erforderlichkeit klären</Badge>
                      </div>
                    ) : null}
                    {f.bemerkung ? <div className="small muted ps-pre">{f.bemerkung}</div> : null}
                  </td>
                  <td>
                    <strong>{formatDate(datum)}</strong>
                    <div className="small muted">{fristRegel(f)}</div>
                    {f.termin && f.bezug !== 'fest' ? (
                      <div className="small muted">Manuell festgelegt</div>
                    ) : null}
                    {!datum && f.bezug !== 'fest' ? (
                      <div className="small muted">
                        {f.bezug === 'baubeginn' ? 'Baubeginn' : 'Abnahme'} fehlt
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <Ampel
                      termin={datum}
                      erledigt={f.status === 'erledigt'}
                      erforderlich={f.erforderlich !== 'nein'}
                    />
                    {f.status === 'in_bearbeitung' ? (
                      <div className="small muted">In Bearbeitung</div>
                    ) : null}
                    {f.eingereichtAm ? (
                      <div className="small muted">Eingereicht {formatDate(f.eingereichtAm)}</div>
                    ) : null}
                  </td>
                  <td>
                    {pr.kontakte.find((k) => k.id === f.kontaktId)?.name || f.verantwortlich || '–'}
                  </td>
                  <td className="actions">
                    <button
                      className="btn btn-sm"
                      disabled={f.erforderlich === 'nein'}
                      onClick={() =>
                        projekt(pr.id, (x) => {
                          const a = x.fristen.find((a) => a.id === f.id)!;
                          a.status = f.status === 'erledigt' ? 'offen' : 'erledigt';
                          if (a.status === 'erledigt' && !a.eingereichtAm)
                            a.eingereichtAm = today();
                        })
                      }
                    >
                      {f.status === 'erledigt' ? 'Wieder öffnen' : 'Erledigt'}
                    </button>
                    {p ? (
                      <>
                        <IconButton
                          name="bearbeiten"
                          label={`${f.gewerk} ${f.titel} bearbeiten`}
                          onClick={() => setEdit(f)}
                        />
                        <IconButton
                          name="loeschen"
                          label={`${f.gewerk} ${f.titel} löschen`}
                          onClick={() => setDel(f)}
                        />
                      </>
                    ) : (
                      <button
                        className="btn btn-sm"
                        onClick={() =>
                          navigate({ view: 'projekt', projektId: pr.id, tab: 'fristen' })
                        }
                      >
                        Zum Projekt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState icon="frist" titel="Keine Fristen für diese Auswahl" />
        )}
      </Card>
      {!g ? (
        <Card>
          <CardHeader
            titel="Aufgaben aus Protokollen"
            sub={`${tasks.length} Aufgaben · fortgeschriebene Aufgaben erscheinen nur im letzten Protokoll`}
          />
          {tasks.length ? (
            <table className="table table-stack ps-table">
              <thead>
                <tr>
                  <th>Aufgabe</th>
                  <th>Verantwortlich</th>
                  <th>Termin</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tasks.map((a) => (
                  <tr key={`${a.p.id}-${a.eintrag.id}`}>
                    <td>
                      <strong>{a.eintrag.text || 'Ohne Text'}</strong>
                      <div className="small muted ps-pre">{a.eintrag.zusatz}</div>
                      <div className="small muted">
                        {a.p.name} · {a.protokoll.art} {a.protokoll.nr} · {a.nummer}
                      </div>
                    </td>
                    <td>{a.eintrag.wer || '–'}</td>
                    <td>
                      {formatDate(a.eintrag.termin)}
                      <div>
                        <Ampel
                          termin={a.eintrag.termin}
                          erledigt={a.eintrag.status === 'erledigt'}
                        />
                      </div>
                    </td>
                    <td className="actions">
                      <button
                        className="btn btn-sm"
                        onClick={() =>
                          projekt(a.p.id, (x) => {
                            const e = x.protokolle
                              .find((p) => p.id === a.protokoll.id)!
                              .tops.flatMap((t) => t.eintraege)
                              .find((e) => e.id === a.eintrag.id)!;
                            e.status = e.status === 'erledigt' ? 'offen' : 'erledigt';
                          })
                        }
                      >
                        {a.eintrag.status === 'erledigt' ? 'Wieder öffnen' : 'Erledigt'}
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => {
                          sessionStorage.setItem(`ps-protokoll-${a.p.id}`, a.protokoll.id);
                          navigate({ view: 'projekt', projektId: a.p.id, tab: 'protokolle' });
                        }}
                      >
                        Zum Protokoll
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState titel="Keine Protokollaufgaben für diese Auswahl" />
          )}
        </Card>
      ) : null}
      {p ? (
        <p className="small muted">
          Fristregeln stammen aus Ihrer Checkliste und sind pro Eintrag anpassbar. Ein manuell
          gesetzter Termin hat Vorrang vor der Berechnung. Bezugstermine können je Gewerk abweichen.
        </p>
      ) : null}
      {p && edit ? <FristDialog p={p} f={edit} onClose={() => setEdit(null)} /> : null}
      {p && del ? (
        <ConfirmDialog
          titel="Frist löschen?"
          text={`${del.gewerk} · ${del.titel} wird entfernt.`}
          onClose={() => setDel(null)}
          onConfirm={() =>
            projekt(p.id, (x) => {
              x.fristen = x.fristen.filter((f) => f.id !== del.id);
            })
          }
        />
      ) : null}
      {p && termine ? <Bezugstermine p={p} onClose={() => setTermine(false)} /> : null}
    </div>
  );
}
function FristDialog({ p, f, onClose }: { p: Projekt; f: Frist; onClose: () => void }) {
  const [v, setV] = useState({ ...f });
  const { projekt } = useStore(),
    toast = useToast();
  const set = (k: keyof Frist) => (s: string) => setV((v) => ({ ...v, [k]: s }));
  const speichern = () => {
    if (!v.titel.trim()) return toast('Bitte eine Bezeichnung eingeben.');
    if (!Number.isInteger(v.tageVorher) || Math.abs(v.tageVorher) > 36500)
      return toast('Bitte einen gültigen Abstand in ganzen Tagen eingeben.');
    if (
      projekt(p.id, (x) => {
        const i = x.fristen.findIndex((f) => f.id === v.id);
        const neu = { ...v, titel: v.titel.trim() };
        if (i < 0) x.fristen.push(neu);
        else x.fristen[i] = neu;
      })
    )
      onClose();
  };
  return (
    <Modal
      titel="Frist bearbeiten"
      onClose={onClose}
      footer={<DialogAktionen onClose={onClose} onSave={speichern} />}
    >
      <div className="form-grid">
        <Feld label="Bezeichnung" value={v.titel} onChange={set('titel')} required />
        <Auswahl
          label="Gewerk"
          value={v.gewerk}
          onChange={set('gewerk')}
          options={optionen(p.gewerke)}
        />
        <Auswahl
          label="Erforderlich?"
          value={v.erforderlich}
          onChange={set('erforderlich')}
          options={ERFORDERLICH}
        />
        <Auswahl label="Status" value={v.status} onChange={set('status')} options={STATUS} />
        <Auswahl
          label="Fristbezug"
          value={v.bezug}
          onChange={set('bezug')}
          options={[
            { value: 'fest', label: 'Fester Termin' },
            { value: 'baubeginn', label: 'Baubeginn' },
            { value: 'abnahme', label: 'Abnahme' },
          ]}
        />
        {v.bezug !== 'fest' ? (
          <Feld
            label="Kalendertage vorher"
            type="number"
            value={String(v.tageVorher)}
            onChange={(s) => setV((v) => ({ ...v, tageVorher: Number(s) }))}
            hint="14 Tage = 2 Wochen. Negative Werte liegen nach dem Bezugstermin."
          />
        ) : null}
        <Feld
          label={v.bezug === 'fest' ? 'Termin' : 'Termin manuell (optional)'}
          type="date"
          value={v.termin}
          onChange={set('termin')}
          hint={
            v.bezug !== 'fest'
              ? `Berechnet ohne Überschreibung: ${formatDate(fristDatum({ ...v, termin: '' }, p))}. Feld leeren, um die Berechnung zu verwenden.`
              : undefined
          }
        />
        <Feld
          label="Eingereicht am"
          type="date"
          value={v.eingereichtAm}
          onChange={set('eingereichtAm')}
        />
        <Auswahl
          label="Kontakt aus Beteiligtenliste"
          value={v.kontaktId}
          onChange={set('kontaktId')}
          options={[
            { value: '', label: 'Keine Zuordnung' },
            ...p.kontakte.map((k) => ({ value: k.id, label: `${k.name} · ${k.funktion}` })),
          ]}
        />
        <Feld
          label="Verantwortlich (Freitext)"
          value={v.verantwortlich}
          onChange={set('verantwortlich')}
        />
        <Feld label="Bemerkung" full multiline value={v.bemerkung} onChange={set('bemerkung')} />
        {v.quelltext ? <div className="full small muted">Quelle: {v.quelltext}</div> : null}
      </div>
    </Modal>
  );
}
function Bezugstermine({ p, onClose }: { p: Projekt; onClose: () => void }) {
  const { projekt } = useStore();
  const [daten, setDaten] = useState({
    baubeginn: p.baubeginn,
    abnahme: p.abnahme,
    gewerkTermine: structuredClone(p.gewerkTermine),
  });
  return (
    <Modal
      titel="Bezugstermine"
      wide
      onClose={onClose}
      footer={
        <DialogAktionen
          onClose={onClose}
          onSave={() => {
            if (projekt(p.id, (x) => Object.assign(x, daten))) onClose();
          }}
        />
      }
    >
      <div className="stack">
        <div className="form-grid">
          <Feld
            label="Baubeginn des Projekts"
            type="date"
            value={daten.baubeginn}
            onChange={(baubeginn) => setDaten((d) => ({ ...d, baubeginn }))}
          />
          <Feld
            label="Abnahme des Projekts"
            type="date"
            value={daten.abnahme}
            onChange={(abnahme) => setDaten((d) => ({ ...d, abnahme }))}
          />
        </div>
        <p className="small muted">
          Leere Gewerktermine verwenden den Projekttermin. Abweichende Termine wirken nur auf
          berechnete Fristen des jeweiligen Gewerks.
        </p>
        {p.gewerke
          .filter((g) => g !== 'Übergreifend')
          .map((g) => (
            <div className="ps-bezug" key={g}>
              <strong>{g}</strong>
              {(['baubeginn', 'abnahme'] as const).map((key) => (
                <Feld
                  key={key}
                  label={`${key === 'baubeginn' ? 'Baubeginn' : 'Abnahme'} ${g}`}
                  type="date"
                  value={daten.gewerkTermine[g]?.[key] ?? ''}
                  onChange={(s) =>
                    setDaten((d) => ({
                      ...d,
                      gewerkTermine: {
                        ...d.gewerkTermine,
                        [g]: {
                          baubeginn: d.gewerkTermine[g]?.baubeginn ?? '',
                          abnahme: d.gewerkTermine[g]?.abnahme ?? '',
                          [key]: s,
                        },
                      },
                    }))
                  }
                />
              ))}
            </div>
          ))}
      </div>
    </Modal>
  );
}
