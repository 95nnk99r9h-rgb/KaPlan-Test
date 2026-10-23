import { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Modal,
  Search,
} from '../../../shared/ui';
import { Icon } from '../../../shared/icons';
import { useToast } from '../../../shared/toast';
import { formatDate, today } from '../../../shared/dates';
import { dateiLaden } from '../../../shared/xlsx';
import { useStore } from '../store/store';
import { protokollDateiLesen } from '../store/validierung';
import {
  TYPEN,
  TN_STATUS,
  uid,
  type Projekt,
  type Protokoll,
  type ProtokollEintrag,
  type Logo,
  type Kontakt,
} from '../domain/types';
import {
  folgeprotokoll,
  fuehrerNachziehen,
  neuerEintrag,
  neuerTeilnehmer,
  neuesProtokoll,
  protokollEntfernen,
  reihe,
  verweiseBereinigen,
  vollerText,
} from '../domain/protokolle';
import { aufgaben } from '../domain/fristen';
import {
  dateiname,
  jsonLaden,
  logoQuelle,
  protokollDruck,
  protokollHtml,
  protokollText,
  DRUCK_STIL,
} from '../domain/export';
import { standardLogos } from '../domain/vorlagen';
import {
  Ampel,
  Auswahl,
  DateiKnopf,
  DialogAktionen,
  Feld,
  IconButton,
  optionen,
} from '../components/common';

type Ansicht = 'archiv' | 'editor' | 'aufgaben' | 'druck';
type Import = { protokolle: Protokoll[]; logos?: Logo[] };
type DateiHandle = {
  name: string;
  createWritable: () => Promise<{
    write: (text: string) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

export function Protokolle({ p }: { p: Projekt }) {
  const { data, projekt, fehler } = useStore();
  const toast = useToast();
  const [id, setId] = useState(() => sessionStorage.getItem(`ps-protokoll-${p.id}`) || '');
  const [ansicht, setAnsicht] = useState<Ansicht>(() =>
    sessionStorage.getItem(`ps-protokoll-${p.id}`) ? 'editor' : 'archiv',
  );
  const [del, setDel] = useState<Protokoll | null>(null),
    [importDaten, setImport] = useState<Import | null>(null),
    [teilnehmer, setTeilnehmer] = useState(false),
    [logoDialog, setLogoDialog] = useState(false);
  const [dateiStatus, setDateiStatus] = useState<Record<string, { name: string; stand: string }>>(
    {},
  );
  const handles = useRef(new Map<string, DateiHandle>()),
    input = useRef<HTMLInputElement>(null);
  const prot = p.protokolle.find((x) => x.id === id);
  const offen = aufgaben(p.protokolle).filter((a) => a.eintrag.status !== 'erledigt').length;
  useEffect(() => {
    sessionStorage.removeItem(`ps-protokoll-${p.id}`);
  }, [p.id]);
  const oeffnen = (pr: Protokoll) => {
    setId(pr.id);
    setAnsicht('editor');
  };
  const neu = () => {
    const pr = neuesProtokoll(p.name, data.einstellungen.bearbeiter);
    if (
      projekt(p.id, (x) => {
        x.protokolle.push(pr);
      })
    )
      oeffnen(pr);
  };
  const update = (fn: (pr: Protokoll) => void) => {
    if (!prot) return;
    projekt(p.id, (x) => {
      const pr = x.protokolle.find((a) => a.id === prot.id);
      if (!pr) throw new Error('Protokoll nicht gefunden.');
      fn(pr);
      if (x.protokolle.some((a) => a.id !== pr.id && a.serie === pr.serie && a.nr === pr.nr))
        throw new Error('Diese Protokollnummer ist in der Reihe bereits vergeben.');
      fuehrerNachziehen(pr);
      pr.updated = Date.now();
    });
  };
  const folge = (pr: Protokoll) => {
    if (reihe(p.protokolle, pr.serie).at(-1)?.id !== pr.id)
      return toast('Öffnen Sie für die Fortschreibung das letzte Protokoll dieser Reihe.');
    let neu: Protokoll | undefined;
    if (
      projekt(p.id, (x) => {
        const vorgaenger = x.protokolle.find((a) => a.id === pr.id)!;
        neu = folgeprotokoll(vorgaenger);
        x.protokolle.push(neu);
      }) &&
      neu
    ) {
      oeffnen(neu);
      toast(
        'Folgeprotokoll angelegt. Informationen, Festlegungen und offene Aufgaben wurden übernommen.',
      );
    }
  };
  const importieren = async (files: File[]) => {
    try {
      const kombi: Import = { protokolle: [] };
      const ids = new Set<string>();
      for (const file of files) {
        if (file.size > 20_000_000)
          throw new Error('Die Protokolldatei ist zu groß (maximal 20 MB).');
        const d = protokollDateiLesen(JSON.parse(await file.text()));
        for (const pr of d.protokolle) {
          if (ids.has(pr.id))
            throw new Error(
              'Mehrere Dateien enthalten dasselbe Protokoll. Bitte einzeln importieren.',
            );
          ids.add(pr.id);
          kombi.protokolle.push(pr);
        }
        if (d.logos) kombi.logos = d.logos;
      }
      setImport(kombi);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Datei konnte nicht gelesen werden.');
    }
  };
  const speichern = async (serie: string, saveAs = false) => {
    const protocols = reihe(p.protokolle, serie);
    if (!protocols.length) return;
    const stand = JSON.stringify({ protocols, logos: p.logos }),
      name = `${dateiname(p.name)}_${dateiname(protocols[0].art)}_${serie.slice(-6)}.protokoll`;
    const text = JSON.stringify(
      {
        format: 'protokoll-tool',
        version: 2,
        serie,
        gespeichert: new Date().toISOString(),
        protocols,
        logos: p.logos,
      },
      null,
      2,
    );
    const picker = (
      window as Window & { showSaveFilePicker?: (o: unknown) => Promise<DateiHandle> }
    ).showSaveFilePicker;
    if (picker) {
      try {
        let h = saveAs ? undefined : handles.current.get(serie);
        if (!h)
          h = await picker({
            suggestedName: dateiStatus[serie]?.name || name,
            types: [
              { description: 'Protokollreihe', accept: { 'application/json': ['.protokoll'] } },
            ],
          });
        const w = await h.createWritable();
        await w.write(text);
        await w.close();
        handles.current.set(serie, h);
        setDateiStatus((s) => ({ ...s, [serie]: { name: h.name, stand } }));
        toast('Protokollreihe gespeichert.');
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        toast('Dateispeicherung nicht verfügbar. Die Reihe wird heruntergeladen.');
      }
    }
    dateiLaden(new Blob([text], { type: 'application/json' }), name);
    setDateiStatus((s) => ({ ...s, [serie]: { name, stand } }));
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (e.key.toLowerCase() === 's' && prot) {
        e.preventDefault();
        void speichern(prot.serie, e.shiftKey);
      }
      if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        input.current?.click();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });
  const serien = [...new Set(p.protokolle.map((pr) => pr.serie))];
  return (
    <div className="stack">
      <input
        ref={input}
        type="file"
        aria-label="Protokolldateien auswählen"
        accept=".protokoll,.json"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length) void importieren(files);
        }}
      />
      <div className="row-between wrap">
        <div className="segmented ps-ansichten">
          {(
            [
              { id: 'archiv', label: 'Protokollreihen' },
              { id: 'editor', label: 'Bearbeiten' },
              { id: 'aufgaben', label: `Aufgaben${offen ? ' (' + offen + ')' : ''}` },
              { id: 'druck', label: 'Druckansicht' },
            ] as { id: Ansicht; label: string }[]
          ).map((v) => (
            <button
              key={v.id}
              className={ansicht === v.id ? 'active' : ''}
              disabled={(v.id === 'editor' || v.id === 'druck') && !prot}
              onClick={() => setAnsicht(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <span className={`small ${fehler ? 'danger' : 'muted'}`} role="status">
          {fehler ? 'Speichern fehlgeschlagen' : 'Automatisch im Browser gespeichert'}
        </span>
      </div>
      <div className="row wrap">
        <button className="btn btn-primary" onClick={neu}>
          <Icon name="plus" size={14} /> Neue Protokollreihe
        </button>
        <button className="btn btn-outline" onClick={() => input.current?.click()}>
          Datei öffnen
        </button>
        <button
          className="btn btn-outline"
          onClick={() =>
            jsonLaden(
              {
                format: 'protokoll-tool',
                version: 2,
                protocols: p.protokolle,
                logos: p.logos,
                exported: new Date().toISOString(),
              },
              `${dateiname(p.name)}_Protokolle_${today()}.json`,
            )
          }
          disabled={!p.protokolle.length}
        >
          Alle Reihen sichern
        </button>
        <button className="btn btn-outline" onClick={() => setLogoDialog(true)}>
          Protokolllogos
        </button>
      </div>
      {ansicht === 'archiv' ? (
        <>
          {serien.length ? (
            serien.map((s) => {
              const ps = reihe(p.protokolle, s),
                letztes = ps.at(-1)!;
              return (
                <Card key={s}>
                  <CardHeader
                    titel={letztes.art || 'Besprechung'}
                    sub={`${ps.length} Protokolle · ${letztes.projekt}`}
                    actions={
                      <button className="btn btn-sm btn-outline" onClick={() => void speichern(s)}>
                        Reihe speichern
                      </button>
                    }
                  />
                  <table className="table table-stack ps-table">
                    <thead>
                      <tr>
                        <th>Datum</th>
                        <th>Protokoll</th>
                        <th>Aufgaben</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {[...ps].reverse().map((pr) => (
                        <tr key={pr.id}>
                          <td>{formatDate(pr.datum)}</td>
                          <td>
                            <strong>
                              {pr.art} Nr. {pr.nr}
                            </strong>
                            {id === pr.id ? (
                              <div>
                                <Badge ton="blue">Geöffnet</Badge>
                              </div>
                            ) : null}
                          </td>
                          <td>
                            {
                              aufgaben(p.protokolle).filter(
                                (a) => a.protokoll.id === pr.id && a.eintrag.status !== 'erledigt',
                              ).length
                            }{' '}
                            offen
                          </td>
                          <td className="actions">
                            <button className="btn btn-sm" onClick={() => oeffnen(pr)}>
                              Öffnen
                            </button>
                            <button
                              className="btn btn-sm"
                              disabled={pr.id !== letztes.id}
                              onClick={() => folge(pr)}
                            >
                              Folgeprotokoll
                            </button>
                            <IconButton
                              name="loeschen"
                              label={`Protokoll ${pr.nr} löschen`}
                              onClick={() => setDel(pr)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              );
            })
          ) : (
            <Card>
              <EmptyState
                icon="plan"
                titel="Noch keine Protokolle"
                text="Erstellen Sie eine Protokollreihe oder öffnen Sie eine .protokoll- oder JSON-Datei aus dem bisherigen Tool."
              />
            </Card>
          )}
        </>
      ) : null}
      {prot && (ansicht === 'editor' || ansicht === 'druck') ? (
        <div className="row-between wrap">
          <div>
            <strong>
              {prot.art} Nr. {prot.nr}
            </strong>
            <div className="small muted">
              {dateiStatus[prot.serie]
                ? `${dateiStatus[prot.serie].name}${dateiStatus[prot.serie].stand !== JSON.stringify({ protocols: reihe(p.protokolle, prot.serie), logos: p.logos }) ? ' · Datei nicht aktuell' : ''}`
                : 'Noch keine Protokolldatei gespeichert'}
            </div>
          </div>
          <div className="row wrap">
            <button className="btn btn-outline" onClick={() => void speichern(prot.serie)}>
              Datei speichern
            </button>
            <button className="btn btn-outline" onClick={() => void speichern(prot.serie, true)}>
              Speichern unter
            </button>
            <button
              className="btn btn-primary"
              disabled={reihe(p.protokolle, prot.serie).at(-1)?.id !== prot.id}
              onClick={() => folge(prot)}
            >
              Folgeprotokoll anlegen
            </button>
          </div>
        </div>
      ) : null}
      {ansicht === 'editor' && prot ? (
        <ProtokollEditor
          key={prot.id}
          pr={prot}
          update={update}
          onKontakte={() => setTeilnehmer(true)}
        />
      ) : null}
      {ansicht === 'aufgaben' ? <AufgabenListe p={p} onOpen={oeffnen} /> : null}
      {ansicht === 'druck' && prot ? (
        <>
          <div className="row wrap">
            <button className="btn btn-primary" onClick={() => protokollDruck(prot, p.logos)}>
              Drucken / PDF speichern
            </button>
            <button
              className="btn btn-outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(protokollText(prot));
                  toast('Protokolltext kopiert.');
                } catch {
                  dateiLaden(
                    new Blob([protokollText(prot)], { type: 'text/plain;charset=utf-8' }),
                    `${dateiname(prot.art)}_${prot.nr}.txt`,
                  );
                  toast('Text als Datei heruntergeladen.');
                }
              }}
            >
              Als Text kopieren
            </button>
          </div>
          <iframe
            className="ps-druckvorschau"
            title="Protokoll-Druckvorschau"
            srcDoc={`<!doctype html><html lang="de"><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:30px;color:#1d1d1f;background:white;margin:0;font-size:13px}h1{font-size:28px;margin:0}h2{font-size:14px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{padding:7px;border-bottom:1px solid #ddd;text-align:left}p{margin:8px 0}${DRUCK_STIL}</style></head><body>${protokollHtml(prot, p.logos)}</body></html>`}
          />
        </>
      ) : null}
      {teilnehmer && prot ? (
        <KontaktAuswahl
          kontakte={p.kontakte}
          vorhanden={prot.teilnehmer.map((t) => t.name)}
          onClose={() => setTeilnehmer(false)}
          onSave={(ks) => {
            update((pr) => {
              ks.forEach((k) =>
                pr.teilnehmer.push({
                  ...neuerTeilnehmer(),
                  name: k.name,
                  funktion: k.funktion,
                  firma: k.firma,
                  kuerzel: k.kuerzel,
                }),
              );
            });
            setTeilnehmer(false);
          }}
        />
      ) : null}
      {del ? (
        <ConfirmDialog
          titel="Protokoll löschen?"
          text={`${del.art} Nr. ${del.nr} wird gelöscht. Übernommene Inhalte in Folgeprotokollen bleiben erhalten.`}
          onClose={() => setDel(null)}
          onConfirm={() => {
            if (
              projekt(p.id, (x) => {
                x.protokolle = protokollEntfernen(x.protokolle, del.id);
              })
            ) {
              if (id === del.id) {
                setId('');
                setAnsicht('archiv');
              }
            }
          }}
        />
      ) : null}
      {importDaten ? (
        <Modal
          titel="Protokolle importieren"
          wide
          onClose={() => setImport(null)}
          sub={`${importDaten.protokolle.length} Protokolle erkannt`}
          footer={
            <DialogAktionen
              label="Importieren"
              onClose={() => setImport(null)}
              onSave={() => {
                if (
                  projekt(p.id, (x) => {
                    for (const pr of importDaten.protokolle) {
                      const i = x.protokolle.findIndex((a) => a.id === pr.id);
                      if (i < 0) x.protokolle.push(pr);
                      else x.protokolle[i] = pr;
                    }
                    if (importDaten.logos) x.logos = importDaten.logos;
                    verweiseBereinigen(x.protokolle);
                  })
                ) {
                  oeffnen(importDaten.protokolle.at(-1)!);
                  setImport(null);
                  toast('Protokolle importiert.');
                }
              }}
            />
          }
        >
          <div className="stack">
            <p>
              Die Protokolle werden diesem Projekt zugeordnet.{' '}
              {
                importDaten.protokolle.filter((pr) => p.protokolle.some((a) => a.id === pr.id))
                  .length
              }{' '}
              vorhandene Protokolle mit gleicher Kennung werden ersetzt. Die Projektbezeichnung
              innerhalb des Protokolls bleibt aus der Datei erhalten.
              {importDaten.logos ? ' Die Logos aus der Datei werden übernommen.' : ''}
            </p>
            <div className="ps-import-vorschau">
              <table className="table table-stack">
                <thead>
                  <tr>
                    <th>Projekt</th>
                    <th>Protokoll</th>
                    <th>Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {importDaten.protokolle.map((pr) => (
                    <tr key={pr.id}>
                      <td>{pr.projekt}</td>
                      <td>
                        {pr.art} Nr. {pr.nr}
                      </td>
                      <td>{formatDate(pr.datum)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      ) : null}
      {logoDialog ? <LogosDialog p={p} onClose={() => setLogoDialog(false)} /> : null}
    </div>
  );
}

function ProtokollEditor({
  pr,
  update,
  onKontakte,
}: {
  pr: Protokoll;
  update: (fn: (pr: Protokoll) => void) => void;
  onKontakte: () => void;
}) {
  const [del, setDel] = useState<{ titel: string; fn: (p: Protokoll) => void } | null>(null);
  const [ursprung, setUrsprung] = useState<string[]>([]);
  const head =
    (
      key:
        | 'projekt'
        | 'art'
        | 'datum'
        | 'beginn'
        | 'ende'
        | 'ort'
        | 'fuehrer'
        | 'naechster'
        | 'verteiler'
        | 'hinweis',
    ) =>
    (s: string) =>
      update((p) => {
        p[key] = s;
      });
  const eintrag = (tid: string, eid: string, fn: (e: ProtokollEintrag) => void) =>
    update((p) => {
      const e = p.tops.find((t) => t.id === tid)!.eintraege.find((e) => e.id === eid)!;
      fn(e);
    });
  return (
    <div className="stack">
      <Card>
        <CardHeader titel="Kopfdaten" />
        <div className="card-pad form-grid">
          <Feld label="Projekt im Protokoll" value={pr.projekt} onChange={head('projekt')} />
          <Feld label="Besprechung" value={pr.art} onChange={head('art')} />
          <Feld
            label="Protokollnummer"
            type="number"
            value={String(pr.nr)}
            onChange={(s) => {
              const n = Number(s);
              if (Number.isSafeInteger(n) && n > 0)
                update((p) => {
                  p.nr = n;
                });
            }}
            hint="Folgeprotokolle werden automatisch fortlaufend nummeriert."
          />
          <Feld label="Datum" type="date" value={pr.datum} onChange={head('datum')} />
          <Feld label="Beginn" type="time" value={pr.beginn} onChange={head('beginn')} />
          <Feld label="Ende" type="time" value={pr.ende} onChange={head('ende')} />
          <Feld label="Ort" value={pr.ort} onChange={head('ort')} />
          <Feld label="Protokollführer" value={pr.fuehrer} onChange={head('fuehrer')} />
          <Feld
            label="Nächster Termin"
            type="date"
            value={pr.naechster}
            onChange={head('naechster')}
          />
          <Feld label="Zusätzlicher Verteiler" value={pr.verteiler} onChange={head('verteiler')} />
        </div>
      </Card>
      <Card>
        <CardHeader
          titel="Teilnehmer"
          actions={
            <>
              <button className="btn btn-sm btn-outline" onClick={onKontakte}>
                Aus Beteiligtenliste
              </button>
              <button
                className="btn btn-sm"
                onClick={() =>
                  update((p) => {
                    p.teilnehmer.push(neuerTeilnehmer());
                  })
                }
              >
                Teilnehmer hinzufügen
              </button>
            </>
          }
        />
        <div className="card-pad stack">
          {pr.teilnehmer.map((t) => (
            <div key={t.id} className="ps-teilnehmer">
              <Feld
                label="Name"
                value={t.name}
                onChange={(s) =>
                  update((p) => {
                    const x = p.teilnehmer.find((x) => x.id === t.id)!;
                    if (x.auto) p.fuehrer = s;
                    else x.name = s;
                  })
                }
              />
              <Feld
                label="Funktion"
                value={t.funktion}
                onChange={(s) =>
                  update((p) => {
                    p.teilnehmer.find((x) => x.id === t.id)!.funktion = s;
                  })
                }
              />
              <Feld
                label="Firma"
                value={t.firma}
                onChange={(s) =>
                  update((p) => {
                    p.teilnehmer.find((x) => x.id === t.id)!.firma = s;
                  })
                }
              />
              <Feld
                label="Kürzel"
                value={t.kuerzel}
                onChange={(s) =>
                  update((p) => {
                    p.teilnehmer.find((x) => x.id === t.id)!.kuerzel = s;
                  })
                }
              />
              <Auswahl
                label="Teilnahmestatus"
                value={t.status}
                onChange={(s) =>
                  update((p) => {
                    p.teilnehmer.find((x) => x.id === t.id)!.status = s;
                  })
                }
                options={optionen(TN_STATUS) as { value: typeof t.status; label: string }[]}
              />
              {t.auto ? (
                <span className="small muted">Protokollführer</span>
              ) : (
                <IconButton
                  name="loeschen"
                  label={`Teilnehmer ${t.name || 'ohne Namen'} entfernen`}
                  onClick={() =>
                    update((p) => {
                      p.teilnehmer = p.teilnehmer.filter((x) => x.id !== t.id);
                    })
                  }
                />
              )}
            </div>
          ))}
        </div>
      </Card>
      <div className="row-between wrap">
        <h2>Tagesordnung</h2>
        <button
          className="btn btn-outline"
          onClick={() =>
            update((p) => {
              p.tops.push({ id: uid('top'), titel: 'Neuer Tagesordnungspunkt', eintraege: [] });
            })
          }
        >
          TOP hinzufügen
        </button>
      </div>
      {pr.tops.map((top, ti) => (
        <Card key={top.id}>
          <div className="card-header ps-top-head">
            <strong>TOP {ti + 1}</strong>
            <input
              className="input"
              aria-label={`Titel TOP ${ti + 1}`}
              value={top.titel}
              onChange={(e) =>
                update((p) => {
                  p.tops.find((t) => t.id === top.id)!.titel = e.target.value;
                })
              }
            />
            <div className="row">
              <IconButton
                name="hoch"
                label={`TOP ${ti + 1} nach oben`}
                disabled={ti === 0}
                onClick={() =>
                  update((p) => {
                    [p.tops[ti - 1], p.tops[ti]] = [p.tops[ti], p.tops[ti - 1]];
                  })
                }
              />
              <IconButton
                name="runter"
                label={`TOP ${ti + 1} nach unten`}
                disabled={ti === pr.tops.length - 1}
                onClick={() =>
                  update((p) => {
                    [p.tops[ti], p.tops[ti + 1]] = [p.tops[ti + 1], p.tops[ti]];
                  })
                }
              />
              <IconButton
                name="loeschen"
                label={`TOP ${ti + 1} löschen`}
                onClick={() =>
                  setDel({
                    titel: `TOP ${ti + 1} samt allen Einträgen löschen?`,
                    fn: (p) => {
                      p.tops = p.tops.filter((t) => t.id !== top.id);
                    },
                  })
                }
              />
            </div>
          </div>
          {top.eintraege.map((e, ei) => (
            <div key={e.id} className={`ps-eintrag ps-typ-${e.typ}`}>
              <div className="row-between wrap">
                <div className="row">
                  <strong>
                    {ti + 1}.{ei + 1}
                  </strong>
                  <div className="segmented">
                    {(['I', 'F', 'A'] as const).map((typ) => (
                      <button
                        key={typ}
                        title={TYPEN[typ]}
                        disabled={!!e.carriedTo}
                        className={e.typ === typ ? 'active' : ''}
                        onClick={() =>
                          eintrag(top.id, e.id, (e) => {
                            e.typ = typ;
                          })
                        }
                      >
                        {typ} · {TYPEN[typ]}
                      </button>
                    ))}
                  </div>
                </div>
                <IconButton
                  name="loeschen"
                  label={`Eintrag ${ti + 1}.${ei + 1} löschen`}
                  disabled={!!e.carriedTo}
                  onClick={() =>
                    setDel({
                      titel: `Eintrag ${ti + 1}.${ei + 1} löschen?`,
                      fn: (p) => {
                        const t = p.tops.find((t) => t.id === top.id)!;
                        t.eintraege = t.eintraege.filter((x) => x.id !== e.id);
                      },
                    })
                  }
                />
              </div>
              {e.carriedTo ? (
                <div className="ps-ursprung">
                  <p className="ps-pre">{vollerText(e)}</p>
                  <p className="small muted">
                    Im Folgeprotokoll weitergeführt. Bitte dort bearbeiten.
                  </p>
                </div>
              ) : (
                <>
                  {e.vor && !ursprung.includes(e.id) ? (
                    <div className="ps-ursprung">
                      <p className="ps-pre">{e.text || 'Ohne Text'}</p>
                      <button
                        className="btn btn-sm"
                        onClick={() => setUrsprung((xs) => [...xs, e.id])}
                      >
                        Ursprungstext korrigieren
                      </button>
                    </div>
                  ) : (
                    <Feld
                      label={`Inhalt ${ti + 1}.${ei + 1}`}
                      value={e.text}
                      multiline
                      full
                      onChange={(s) =>
                        eintrag(top.id, e.id, (e) => {
                          e.text = s;
                        })
                      }
                    />
                  )}{' '}
                  {e.vor ? (
                    <Feld
                      label={`Ergänzung ${ti + 1}.${ei + 1}`}
                      value={e.zusatz}
                      multiline
                      full
                      onChange={(s) =>
                        eintrag(top.id, e.id, (e) => {
                          e.zusatz = s;
                        })
                      }
                      hint="Ergänzungen werden im Druck blau hervorgehoben."
                    />
                  ) : null}
                  <div className="form-grid">
                    <label className="field">
                      <span>{e.typ === 'A' ? 'Verantwortlich' : 'Beteiligt (optional)'}</span>
                      <input
                        className="input"
                        aria-label={`Verantwortlich ${ti + 1}.${ei + 1}`}
                        list="ps-kuerzel"
                        value={e.wer}
                        onChange={(v) =>
                          eintrag(top.id, e.id, (e) => {
                            e.wer = v.target.value;
                          })
                        }
                      />
                    </label>
                    {e.typ === 'A' ? (
                      <>
                        <Feld
                          label={`Termin ${ti + 1}.${ei + 1}`}
                          type="date"
                          value={e.termin}
                          onChange={(s) =>
                            eintrag(top.id, e.id, (e) => {
                              e.termin = s;
                            })
                          }
                        />
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={e.status === 'erledigt'}
                            onChange={(v) =>
                              eintrag(top.id, e.id, (e) => {
                                e.status = v.target.checked ? 'erledigt' : 'offen';
                              })
                            }
                          />{' '}
                          Erledigt
                        </label>
                        <Ampel termin={e.termin} erledigt={e.status === 'erledigt'} />
                      </>
                    ) : null}
                  </div>
                </>
              )}
              <div className="small muted">
                {e.herkunft ? `Übernommen aus ${e.herkunft}` : 'Neu in diesem Protokoll'}
              </div>
            </div>
          ))}
          <div className="card-pad row wrap">
            {(['I', 'F', 'A'] as const).map((typ) => (
              <button
                key={typ}
                className="btn btn-outline"
                onClick={() =>
                  update((p) => {
                    p.tops.find((t) => t.id === top.id)!.eintraege.push(neuerEintrag(typ));
                  })
                }
              >
                + {TYPEN[typ]}
              </button>
            ))}
          </div>
        </Card>
      ))}
      <datalist id="ps-kuerzel">
        {[...new Set(pr.teilnehmer.flatMap((t) => [t.kuerzel, t.name]).filter(Boolean))].map(
          (s) => (
            <option key={s} value={s} />
          ),
        )}
      </datalist>
      <Card>
        <CardHeader titel="Abschluss" />
        <div className="card-pad">
          <Feld
            label="Hinweis am Protokollende"
            value={pr.hinweis}
            onChange={head('hinweis')}
            multiline
            full
          />
        </div>
      </Card>
      {del ? (
        <ConfirmDialog
          titel={del.titel}
          text="Der Eintrag wird aus diesem Protokoll entfernt."
          onClose={() => setDel(null)}
          onConfirm={() => update(del.fn)}
        />
      ) : null}
    </div>
  );
}

function AufgabenListe({ p, onOpen }: { p: Projekt; onOpen: (p: Protokoll) => void }) {
  const { projekt } = useStore();
  const [suche, setSuche] = useState(''),
    [status, setStatus] = useState('offen'),
    [wer, setWer] = useState(''),
    [spaet, setSpaet] = useState(false);
  const tasks = aufgaben(p.protokolle)
    .filter(
      (a) =>
        (status === 'alle' || a.eintrag.status === status) &&
        (!wer || a.eintrag.wer === wer) &&
        (!spaet ||
          (a.eintrag.status !== 'erledigt' && a.eintrag.termin && a.eintrag.termin < today())) &&
        [a.eintrag.wer, vollerText(a.eintrag)]
          .join(' ')
          .toLowerCase()
          .includes(suche.toLowerCase()),
    )
    .sort((a, b) => (a.eintrag.termin || '9999').localeCompare(b.eintrag.termin || '9999'));
  return (
    <Card>
      <CardHeader titel="Aufgaben über alle Protokollreihen" />
      <div className="card-pad row wrap">
        <Search value={suche} onChange={setSuche} placeholder="Aufgabe oder Verantwortliche …" />
        <select
          className="select"
          aria-label="Aufgabenstatus"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="offen">Offen</option>
          <option value="erledigt">Erledigt</option>
          <option value="alle">Alle</option>
        </select>
        <select
          className="select"
          aria-label="Verantwortliche filtern"
          value={wer}
          onChange={(e) => setWer(e.target.value)}
        >
          <option value="">Alle Verantwortlichen</option>
          {[
            ...new Set(
              aufgaben(p.protokolle)
                .map((a) => a.eintrag.wer)
                .filter(Boolean),
            ),
          ]
            .sort((a, b) => a.localeCompare(b, 'de'))
            .map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
        </select>
        <label className="checkbox">
          <input type="checkbox" checked={spaet} onChange={(e) => setSpaet(e.target.checked)} /> Nur
          überfällig
        </label>
      </div>
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
              <tr key={a.eintrag.id}>
                <td>
                  <div className="ps-pre">{vollerText(a.eintrag)}</div>
                  <div className="small muted">
                    {a.protokoll.art} {a.protokoll.nr} · {a.nummer}
                  </div>
                </td>
                <td>{a.eintrag.wer}</td>
                <td>
                  {formatDate(a.eintrag.termin)}
                  <div>
                    <Ampel termin={a.eintrag.termin} erledigt={a.eintrag.status === 'erledigt'} />
                  </div>
                </td>
                <td className="actions">
                  <button
                    className="btn btn-sm"
                    onClick={() =>
                      projekt(p.id, (x) => {
                        const pr = x.protokolle.find((pr) => pr.id === a.protokoll.id)!;
                        const e = pr.tops
                          .flatMap((t) => t.eintraege)
                          .find((e) => e.id === a.eintrag.id)!;
                        e.status = e.status === 'erledigt' ? 'offen' : 'erledigt';
                        pr.updated = Date.now();
                      })
                    }
                  >
                    {a.eintrag.status === 'erledigt' ? 'Wieder öffnen' : 'Erledigt'}
                  </button>
                  <button className="btn btn-sm" onClick={() => onOpen(a.protokoll)}>
                    Protokoll öffnen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState titel="Keine Aufgaben für diese Auswahl" />
      )}
    </Card>
  );
}
function KontaktAuswahl({
  kontakte,
  vorhanden,
  onClose,
  onSave,
}: {
  kontakte: Kontakt[];
  vorhanden: string[];
  onClose: () => void;
  onSave: (ks: Kontakt[]) => void;
}) {
  const [ids, setIds] = useState<string[]>([]),
    [suche, setSuche] = useState('');
  const ks = kontakte.filter((k) => !vorhanden.includes(k.name));
  return (
    <Modal
      titel="Teilnehmer aus Beteiligtenliste"
      onClose={onClose}
      footer={
        <DialogAktionen
          label={`${ids.length} Teilnehmer übernehmen`}
          onClose={onClose}
          onSave={() => onSave(ks.filter((k) => ids.includes(k.id)))}
        />
      }
    >
      <div className="stack">
        <Search value={suche} onChange={setSuche} placeholder="Kontakt suchen" />
        <div className="ps-import-vorschau stack">
          {ks
            .filter((k) =>
              [k.name, k.firma, k.funktion].join(' ').toLowerCase().includes(suche.toLowerCase()),
            )
            .map((k) => (
              <label className="checkbox" key={k.id}>
                <input
                  type="checkbox"
                  checked={ids.includes(k.id)}
                  onChange={(e) =>
                    setIds((xs) =>
                      e.target.checked ? [...xs, k.id] : xs.filter((x) => x !== k.id),
                    )
                  }
                />
                <span>
                  <strong>{k.name}</strong>
                  <span className="small muted">
                    {' '}
                    · {k.funktion} · {k.firma}
                  </span>
                </span>
              </label>
            ))}
        </div>
        {!ks.length ? <p className="muted">Keine weiteren Kontakte verfügbar.</p> : null}
      </div>
    </Modal>
  );
}
async function logoLesen(file: File): Promise<Logo> {
  if (file.size > 5_000_000) throw new Error('Ein Logo darf höchstens 5 MB groß sein.');
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type))
    throw new Error('Bitte eine Bilddatei als Logo auswählen.');
  const url = URL.createObjectURL(file);
  try {
    const bild = new Image();
    bild.src = url;
    await bild.decode();
    if (!bild.width || !bild.height) throw new Error('Ungültiges Bild.');
    const skala = Math.min(1, 800 / bild.width, 240 / bild.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bild.width * skala));
    canvas.height = Math.max(1, Math.round(bild.height * skala));
    canvas.getContext('2d')!.drawImage(bild, 0, 0, canvas.width, canvas.height);
    return { name: file.name, src: canvas.toDataURL('image/png') };
  } finally {
    URL.revokeObjectURL(url);
  }
}
function LogosDialog({ p, onClose }: { p: Projekt; onClose: () => void }) {
  const { projekt } = useStore(),
    toast = useToast();
  return (
    <Modal
      titel="Logos im Protokollkopf"
      onClose={onClose}
      footer={
        <button className="btn" onClick={onClose}>
          Schließen
        </button>
      }
    >
      <div className="stack">
        {p.logos.map((l, i) => (
          <div key={`${i}-${l.name}`} className="row-between">
            <img className="ps-logo-preview" src={logoQuelle(l)} alt={l.name} />
            <div className="row">
              <IconButton
                name="hoch"
                label={`Logo ${l.name} nach vorne`}
                disabled={i === 0}
                onClick={() =>
                  projekt(p.id, (x) => {
                    [x.logos[i - 1], x.logos[i]] = [x.logos[i], x.logos[i - 1]];
                  })
                }
              />
              <IconButton
                name="loeschen"
                label={`Logo ${l.name} entfernen`}
                onClick={() =>
                  projekt(p.id, (x) => {
                    x.logos.splice(i, 1);
                  })
                }
              />
            </div>
          </div>
        ))}
        <DateiKnopf
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          multiple
          onFile={async (fs) => {
            try {
              const logos: Logo[] = [];
              for (const f of fs) logos.push(await logoLesen(f));
              projekt(p.id, (x) => {
                x.logos.push(...logos);
              });
            } catch (e) {
              toast((e as Error).message);
            }
          }}
        >
          Logo hinzufügen
        </DateiKnopf>
        <button
          className="btn btn-outline"
          onClick={() =>
            projekt(p.id, (x) => {
              x.logos = standardLogos();
            })
          }
        >
          Standardlogos wiederherstellen
        </button>
      </div>
    </Modal>
  );
}
