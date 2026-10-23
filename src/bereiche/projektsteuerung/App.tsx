import { useEffect, useState } from 'react';
import { Icon } from '../../shared/icons';
import { KaPlanLogo, MailaenderLogo } from '../../shared/logos';
import { Callout, Card, ConfirmDialog, EmptyState, Modal } from '../../shared/ui';
import { useToast } from '../../shared/toast';
import { BereichWechsel } from '../../shell/BereichWechsel';
import { today } from '../../shared/dates';
import { useStore, SPEICHER_KEY } from './store/store';
import { datenLesen } from './store/validierung';
import { useRoute, type ProjektTab, type Route } from './lib/router';
import { Projekte, ProjektDialog } from './pages/Projekte';
import { Kontakte } from './pages/Kontakte';
import { Beauftragungen } from './pages/Beauftragungen';
import { Fristen } from './pages/Fristen';
import { Protokolle } from './pages/Protokolle';
import { ampel, aufgaben, fristDatum } from './domain/fristen';
import { jsonLaden } from './domain/export';
import type { Daten } from './domain/types';
import { DateiKnopf, DialogAktionen, Feld } from './components/common';

const TABS: { id: ProjektTab; label: string }[] = [
  { id: 'beteiligte', label: 'Projektbeteiligtenliste' },
  { id: 'beauftragungen', label: 'Beauftragungen' },
  { id: 'fristen', label: 'Fristen' },
  { id: 'protokolle', label: 'Protokolle' },
];
export function App() {
  const { data, fehler, gesperrt, mutate, ersetzen } = useStore();
  const toast = useToast();
  const [route, navigate] = useRoute();
  const [menu, setMenu] = useState(false),
    [edit, setEdit] = useState(false),
    [del, setDel] = useState(false),
    [settings, setSettings] = useState(false),
    [sicherung, setSicherung] = useState<Daten | null>(null);
  const p =
    route.view === 'projekt' ? data.projekte.find((p) => p.id === route.projektId) : undefined;
  const gehe = (r: Route) => {
    navigate(r);
    setMenu(false);
    setEdit(false);
    setDel(false);
  };
  useEffect(() => {
    document.documentElement.dataset.farbmodus = data.einstellungen.farbmodus;
  }, [data.einstellungen.farbmodus]);
  const spaet = data.projekte.reduce(
    (n, p) =>
      n +
      p.fristen.filter(
        (f) =>
          f.status !== 'erledigt' &&
          f.erforderlich !== 'nein' &&
          ampel(fristDatum(f, p)) === 'ueberfaellig',
      ).length +
      aufgaben(p.protokolle).filter(
        (a) => a.eintrag.status !== 'erledigt' && ampel(a.eintrag.termin) === 'ueberfaellig',
      ).length,
    0,
  );
  const nav = (label: string, icon: string, r: Route, aktiv: boolean, badge?: number) => (
    <button key={label} className={`nav-item ${aktiv ? 'active' : ''}`} onClick={() => gehe(r)}>
      <span className="nav-icon">
        <Icon name={icon} size={16} />
      </span>
      <span className="nav-label">{label}</span>
      {badge ? <span className="nav-badge alert">{badge}</span> : null}
    </button>
  );
  return (
    <div className="app ps-app">
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <button className="sidebar-brand" onClick={() => gehe({ view: 'projekte' })}>
          <div className="ps-brand">
            <KaPlanLogo variante="Startseite" width="100%" />
            <span>Projektsteuerung</span>
          </div>
        </button>
        {nav('Projekte', 'projekt', { view: 'projekte' }, route.view === 'projekte')}
        {nav('Fristen & Aufgaben', 'frist', { view: 'fristen' }, route.view === 'fristen', spaet)}
        <div className="nav-group-label">Markierte Projekte</div>
        {data.projekte
          .filter((p) => p.markiert)
          .map((x) =>
            nav(
              x.name,
              'projekt',
              { view: 'projekt', projektId: x.id, tab: 'beteiligte' },
              p?.id === x.id,
            ),
          )}
        <div className="sidebar-footer">
          <button className="bearbeiter" onClick={() => setSettings(true)}>
            <Icon name="person" size={16} />
            <strong>{data.einstellungen.bearbeiter || 'Name & Einstellungen'}</strong>
          </button>
          <div className="sicherung-knoepfe">
            <button
              className="btn btn-sm btn-outline"
              disabled={gesperrt}
              onClick={() => jsonLaden(data, `KaPlan_Projektsteuerung_${today()}.json`)}
            >
              <Icon name="export" size={12} /> Sicherung
            </button>
            <DateiKnopf
              accept=".json"
              onFile={async (fs) => {
                try {
                  if (fs[0].size > 20_000_000)
                    throw new Error('Die Sicherung ist zu groß (maximal 20 MB).');
                  setSicherung(datenLesen(JSON.parse(await fs[0].text())));
                } catch (e) {
                  toast((e as Error).message);
                }
              }}
            >
              Einspielen
            </DateiKnopf>
          </div>
          Daten werden lokal im Browser gespeichert.
          <BereichWechsel />
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button className="btn-icon menu-toggle" aria-label="Menü" onClick={() => setMenu(!menu)}>
            <Icon name="menu" size={18} />
          </button>
          <div className="topbar-title">
            <h1>{p?.name || (route.view === 'fristen' ? 'Fristen & Aufgaben' : 'Projekte')}</h1>
            <div className="sub">
              {p ? `${p.nummer ? p.nummer + ' · ' : ''}Projektarbeitsbereich` : 'Projektsteuerung'}
            </div>
          </div>
          <div className="topbar-logo">
            <MailaenderLogo height={34} />
          </div>
        </header>
        <div className="content">
          <div className="content-inner">
            <div className="stack">
              {fehler ? (
                <Callout ton="error">
                  <p>{fehler}</p>
                  {gesperrt ? (
                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        try {
                          const raw = localStorage.getItem(SPEICHER_KEY);
                          if (raw)
                            jsonLaden(
                              { rohbestand: raw },
                              `Projektsteuerung_Rohdaten_${today()}.json`,
                            );
                        } catch {
                          toast('Rohdaten konnten nicht gelesen werden.');
                        }
                      }}
                    >
                      Rohdaten herunterladen
                    </button>
                  ) : null}
                </Callout>
              ) : null}
              {route.view === 'projekte' ? <Projekte navigate={gehe} /> : null}
              {route.view === 'fristen' ? <Fristen navigate={gehe} /> : null}
              {route.view === 'projekt' ? (
                p ? (
                  <div className="stack" key={p.id}>
                    <div className="row-between wrap">
                      <button
                        className="btn btn-outline"
                        onClick={() => gehe({ view: 'projekte' })}
                      >
                        <Icon name="zurueck" size={13} /> Projekte
                      </button>
                      <div className="row wrap">
                        <button className="btn btn-outline" onClick={() => setEdit(true)}>
                          Projekt bearbeiten
                        </button>
                        <button className="btn btn-outline" onClick={() => setDel(true)}>
                          Projekt löschen
                        </button>
                      </div>
                    </div>
                    <div className="tabs ps-projekt-tabs">
                      {TABS.map((t) => (
                        <button
                          key={t.id}
                          className={route.tab === t.id ? 'active' : ''}
                          onClick={() => gehe({ view: 'projekt', projektId: p.id, tab: t.id })}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    {route.tab === 'beteiligte' ? (
                      <Kontakte p={p} />
                    ) : route.tab === 'beauftragungen' ? (
                      <Beauftragungen p={p} />
                    ) : route.tab === 'fristen' ? (
                      <Fristen p={p} navigate={gehe} />
                    ) : (
                      <Protokolle p={p} />
                    )}
                  </div>
                ) : (
                  <Card>
                    <EmptyState
                      titel="Projekt nicht gefunden"
                      action={
                        <button className="btn" onClick={() => gehe({ view: 'projekte' })}>
                          Zu den Projekten
                        </button>
                      }
                    />
                  </Card>
                )
              ) : null}
            </div>
          </div>
        </div>
      </main>
      {menu ? (
        <div
          className="overlay"
          style={{ zIndex: 80, background: 'rgba(0,0,0,.18)' }}
          onClick={() => setMenu(false)}
        />
      ) : null}
      {edit && p ? <ProjektDialog p={p} onClose={() => setEdit(false)} /> : null}
      {del && p ? (
        <ConfirmDialog
          titel="Projekt vollständig löschen?"
          text={`„${p.name}“ samt Kontakten, Beauftragungen, Fristen und Protokollen wird aus der Projektsteuerung gelöscht. Sichern Sie den Bestand bei Bedarf vorher.`}
          onClose={() => setDel(false)}
          onConfirm={() => {
            if (
              mutate((d) => {
                d.projekte = d.projekte.filter((x) => x.id !== p.id);
              })
            ) {
              toast('Projekt gelöscht.');
              gehe({ view: 'projekte' });
            }
          }}
        />
      ) : null}
      {sicherung ? (
        <Modal
          titel="Sicherung einspielen"
          onClose={() => setSicherung(null)}
          footer={
            <DialogAktionen
              label="Bestand ersetzen"
              onClose={() => setSicherung(null)}
              onSave={() => {
                if (ersetzen(sicherung)) {
                  setSicherung(null);
                  gehe({ view: 'projekte' });
                  toast('Sicherung eingespielt.');
                }
              }}
            />
          }
        >
          <div className="stack">
            <p>
              Die Sicherung enthält <strong>{sicherung.projekte.length} Projekte</strong>. Sie
              ersetzt den gesamten Datenbestand der Projektsteuerung. Planlaufmanagement und
              Baubetriebsplanung bleiben erhalten.
            </p>
            <button
              className="btn btn-outline"
              disabled={gesperrt}
              onClick={() => jsonLaden(data, `Projektsteuerung_vor_Import_${today()}.json`)}
            >
              Aktuellen Bestand vorher sichern
            </button>
          </div>
        </Modal>
      ) : null}
      {settings ? <Einstellungen onClose={() => setSettings(false)} /> : null}
    </div>
  );
}
function Einstellungen({ onClose }: { onClose: () => void }) {
  const { data, mutate } = useStore();
  const [name, setName] = useState(data.einstellungen.bearbeiter),
    [kontrast, setKontrast] = useState(data.einstellungen.farbmodus === 'kontrast');
  return (
    <Modal
      titel="Persönliche Einstellungen"
      onClose={onClose}
      footer={
        <DialogAktionen
          onClose={onClose}
          onSave={() => {
            if (
              mutate((d) => {
                d.einstellungen = {
                  bearbeiter: name.trim(),
                  farbmodus: kontrast ? 'kontrast' : 'standard',
                };
              })
            )
              onClose();
          }}
        />
      }
    >
      <div className="stack">
        <Feld
          label="Name"
          value={name}
          onChange={setName}
          hint="Wird bei neuen Protokollen als Protokollführer vorgeschlagen."
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={kontrast}
            onChange={(e) => setKontrast(e.target.checked)}
          />{' '}
          Farbmodus für Rot-Grün-Sehschwäche
        </label>
      </div>
    </Modal>
  );
}
