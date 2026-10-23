import { useState } from 'react';
import { Badge, Card, EmptyState, Modal, Search } from '../../../shared/ui';
import { useToast } from '../../../shared/toast';
import { Icon } from '../../../shared/icons';
import { useStore } from '../store/store';
import { neuesProjekt } from '../domain/vorlagen';
import { ampel, aufgaben, fristDatum } from '../domain/fristen';
import type { Projekt } from '../domain/types';
import type { Route } from '../lib/router';
import { Auswahl, DialogAktionen, Feld } from '../components/common';

export function Projekte({ navigate }: { navigate: (r: Route) => void }) {
  const { data, projekt } = useStore();
  const [suche, setSuche] = useState(''),
    [dialog, setDialog] = useState(false);
  const ps = data.projekte.filter((p) =>
    [p.name, p.nummer, p.beschreibung].join(' ').toLowerCase().includes(suche.toLowerCase()),
  );
  return (
    <div className="stack">
      <div className="row-between wrap">
        <Search value={suche} onChange={setSuche} placeholder="Projekt, Nummer …" />
        <button className="btn btn-primary" onClick={() => setDialog(true)}>
          <Icon name="plus" size={14} /> Neues Projekt
        </button>
      </div>
      {ps.length ? (
        <div className="grid grid-2">
          {ps.map((p) => {
            const offen = p.fristen.filter(
              (f) => f.status !== 'erledigt' && f.erforderlich !== 'nein',
            );
            const spaet =
              offen.filter((f) => ampel(fristDatum(f, p)) === 'ueberfaellig').length +
              aufgaben(p.protokolle).filter(
                (a) =>
                  a.eintrag.status !== 'erledigt' && ampel(a.eintrag.termin) === 'ueberfaellig',
              ).length;
            return (
              <Card key={p.id}>
                <div className="card-pad">
                  <div className="row-between">
                    <div>
                      <div className="mono tertiary">{p.nummer || 'Ohne Projektnummer'}</div>
                      <h2>
                        <button
                          className="ps-link"
                          onClick={() =>
                            navigate({ view: 'projekt', projektId: p.id, tab: 'beteiligte' })
                          }
                        >
                          {p.name}
                        </button>
                      </h2>
                    </div>
                    <button
                      className={`btn-icon stern ${p.markiert ? 'aktiv' : ''}`}
                      aria-label={`${p.name} ${p.markiert ? 'entmarkieren' : 'markieren'}`}
                      onClick={() =>
                        projekt(p.id, (x) => {
                          x.markiert = !x.markiert;
                        })
                      }
                    >
                      {p.markiert ? '★' : '☆'}
                    </button>
                  </div>
                  {p.beschreibung ? (
                    <p className="small muted" style={{ marginTop: 6 }}>
                      {p.beschreibung}
                    </p>
                  ) : null}
                  <div className="row wrap" style={{ marginTop: 16 }}>
                    <Badge
                      ton={p.status === 'aktiv' ? 'green' : p.status === 'pausiert' ? 'orange' : ''}
                    >
                      {p.status === 'aktiv'
                        ? 'Aktiv'
                        : p.status === 'pausiert'
                          ? 'Pausiert'
                          : 'Abgeschlossen'}
                    </Badge>
                    <span className="small muted">{p.kontakte.length} Kontakte</span>
                    <span className="small muted">{p.protokolle.length} Protokolle</span>
                    {spaet ? (
                      <Badge ton="red">{spaet} überfällig</Badge>
                    ) : (
                      <span className="small muted">{offen.length} offene Fristen</span>
                    )}
                  </div>
                  <button
                    className="btn btn-outline"
                    style={{ marginTop: 18 }}
                    onClick={() =>
                      navigate({ view: 'projekt', projektId: p.id, tab: 'beteiligte' })
                    }
                  >
                    Projekt öffnen <Icon name="chevron" size={13} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="projekt"
            titel={data.projekte.length ? 'Kein Projekt gefunden' : 'Projektsteuerung starten'}
            text="Legen Sie ein Projekt an. Beauftragungen und Fristen werden aus der Checklistenstruktur vorbelegt."
            action={
              <button className="btn btn-primary" onClick={() => setDialog(true)}>
                Neues Projekt
              </button>
            }
          />
        </Card>
      )}
      {dialog ? (
        <ProjektDialog
          onClose={() => setDialog(false)}
          onCreated={(p) => navigate({ view: 'projekt', projektId: p.id, tab: 'beteiligte' })}
        />
      ) : null}
    </div>
  );
}
export function ProjektDialog({
  p,
  onClose,
  onCreated,
}: {
  p?: Projekt;
  onClose: () => void;
  onCreated?: (p: Projekt) => void;
}) {
  const { mutate } = useStore(),
    toast = useToast();
  const [v, setV] = useState(() => (p ? structuredClone(p) : neuesProjekt()));
  const [vorlagen, setVorlagen] = useState(true);
  const speichern = () => {
    if (!v.name.trim()) return toast('Bitte einen Projektnamen eingeben.');
    const neu = { ...v, name: v.name.trim() };
    if (!p && !vorlagen) {
      neu.beauftragungen = [];
      neu.fristen = [];
    }
    if (
      mutate((d) => {
        if (p) {
          const i = d.projekte.findIndex((x) => x.id === p.id);
          if (i < 0) throw new Error('Projekt nicht gefunden.');
          const aktuell = d.projekte[i];
          d.projekte[i] = {
            ...aktuell,
            name: neu.name,
            nummer: neu.nummer,
            beschreibung: neu.beschreibung,
            status: neu.status,
            markiert: neu.markiert,
            baubeginn: neu.baubeginn,
            abnahme: neu.abnahme,
          };
        } else d.projekte.push(neu);
      })
    ) {
      toast(p ? 'Projekt gespeichert.' : 'Projekt angelegt.');
      onClose();
      if (!p) onCreated?.(neu);
    }
  };
  return (
    <Modal
      titel={p ? 'Projekt bearbeiten' : 'Neues Projekt'}
      onClose={onClose}
      footer={
        <DialogAktionen
          onClose={onClose}
          onSave={speichern}
          label={p ? 'Speichern' : 'Projekt anlegen'}
        />
      }
    >
      <div className="form-grid">
        <Feld
          label="Projektname"
          required
          full
          value={v.name}
          onChange={(name) => setV((v) => ({ ...v, name }))}
        />
        <Feld
          label="Projektnummer"
          value={v.nummer}
          onChange={(nummer) => setV((v) => ({ ...v, nummer }))}
        />
        <Auswahl
          label="Projektstatus"
          value={v.status}
          onChange={(status) => setV((v) => ({ ...v, status }))}
          options={[
            { value: 'aktiv', label: 'Aktiv' },
            { value: 'pausiert', label: 'Pausiert' },
            { value: 'abgeschlossen', label: 'Abgeschlossen' },
          ]}
        />
        <Feld
          label="Beschreibung"
          full
          multiline
          value={v.beschreibung}
          onChange={(beschreibung) => setV((v) => ({ ...v, beschreibung }))}
        />
        <Feld
          label="Baubeginn"
          type="date"
          value={v.baubeginn}
          onChange={(baubeginn) => setV((v) => ({ ...v, baubeginn }))}
        />
        <Feld
          label="Abnahme"
          type="date"
          value={v.abnahme}
          onChange={(abnahme) => setV((v) => ({ ...v, abnahme }))}
        />
        <label className="checkbox full">
          <input
            type="checkbox"
            checked={v.markiert}
            onChange={(e) => setV((v) => ({ ...v, markiert: e.target.checked }))}
          />{' '}
          Projekt in der Seitenleiste anzeigen
        </label>
        {!p ? (
          <label className="checkbox full">
            <input
              type="checkbox"
              checked={vorlagen}
              onChange={(e) => setVorlagen(e.target.checked)}
            />{' '}
            Beauftragungen und Fristen aus der Checklistenstruktur anlegen
          </label>
        ) : null}
      </div>
    </Modal>
  );
}
