import { useState } from 'react';
import { Modal, Callout } from '../../../shared/ui';
import { useToast } from '../../../shared/toast';
import { tabelleLesen } from '../../../shared/xlsxLesen';
import { checklistenImport } from '../domain/import';
import type { Projekt } from '../domain/types';
import { useStore } from '../store/store';
import { DateiKnopf, DialogAktionen } from './common';

export function ChecklistenImport({ p }: { p: Projekt }) {
  const [daten, setDaten] = useState<ReturnType<typeof checklistenImport> | null>(null);
  const toast = useToast();
  const { projekt } = useStore();
  return (
    <>
      <DateiKnopf
        accept=".xlsx,.csv"
        onFile={async (fs) => {
          try {
            if (fs[0].size > 15_000_000) throw new Error('Die Datei ist zu groß (maximal 15 MB).');
            setDaten(checklistenImport(await tabelleLesen(fs[0])));
          } catch (e) {
            toast((e as Error).message);
          }
        }}
      >
        Checkliste importieren
      </DateiKnopf>
      {daten ? (
        <Modal
          titel="Checkliste übernehmen"
          wide
          sub={`${daten.beauftragungen.length} Beauftragungen und ${daten.fristen.length} Fristen erkannt`}
          onClose={() => setDaten(null)}
          footer={
            <DialogAktionen
              label="Checkliste übernehmen"
              onClose={() => setDaten(null)}
              onSave={() => {
                if (
                  projekt(p.id, (x) => {
                    for (const b of daten.beauftragungen) {
                      const i = x.beauftragungen.findIndex(
                        (a) => a.gewerk === b.gewerk && a.leistung === b.leistung,
                      );
                      if (i >= 0) x.beauftragungen[i] = { ...b, id: x.beauftragungen[i].id };
                      else x.beauftragungen.push(b);
                    }
                    for (const f of daten.fristen) {
                      const i = x.fristen.findIndex(
                        (a) => a.gewerk === f.gewerk && a.titel === f.titel,
                      );
                      if (i >= 0) x.fristen[i] = { ...f, id: x.fristen[i].id };
                      else x.fristen.push(f);
                    }
                    for (const e of [...daten.beauftragungen, ...daten.fristen])
                      if (!x.gewerke.includes(e.gewerk)) x.gewerke.push(e.gewerk);
                  })
                ) {
                  toast('Checkliste übernommen. Fristanzeigen finden Sie unter Fristen.');
                  setDaten(null);
                }
              }}
            />
          }
        >
          <div className="stack">
            <Callout>
              Einträge mit gleichem Gewerk und gleicher Bezeichnung werden durch den Stand der Datei
              ersetzt, einschließlich Status, Namen und Terminen. Andere Einträge bleiben erhalten.
              Die Fristen werden auf der Seite „Fristen“ geführt.
            </Callout>
            <div className="ps-import-vorschau">
              <table className="table table-stack">
                <thead>
                  <tr>
                    <th>Gewerk</th>
                    <th>Bezeichnung</th>
                    <th>Zielseite</th>
                  </tr>
                </thead>
                <tbody>
                  {daten.beauftragungen.map((b) => (
                    <tr key={b.id}>
                      <td>{b.gewerk}</td>
                      <td>{b.leistung}</td>
                      <td>Beauftragungen</td>
                    </tr>
                  ))}
                  {daten.fristen.map((f) => (
                    <tr key={f.id}>
                      <td>{f.gewerk}</td>
                      <td>{f.titel}</td>
                      <td>Fristen{f.termin ? ` · ${f.termin}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
