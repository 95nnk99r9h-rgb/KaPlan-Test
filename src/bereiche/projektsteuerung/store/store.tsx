import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Daten, Projekt } from '../domain/types';
import { leereDaten } from '../domain/vorlagen';
import { datenLesen } from './validierung';
import { useToast } from '../../../shared/toast';

export const SPEICHER_KEY = 'kaplan-projektsteuerung.data.v1';
function laden(): { data: Daten; fehler: string } {
  try {
    const raw = localStorage.getItem(SPEICHER_KEY);
    return { data: raw ? datenLesen(JSON.parse(raw)) : leereDaten(), fehler: '' };
  } catch {
    return {
      data: leereDaten(),
      fehler:
        'Der gespeicherte Bestand konnte nicht gelesen werden. Er bleibt unverändert. Laden Sie eine gültige Sicherung über „Einspielen“. Vorhandene Rohdaten können Sie vorher herunterladen.',
    };
  }
}
interface Store {
  data: Daten;
  fehler: string;
  gesperrt: boolean;
  mutate: (fn: (d: Daten) => void) => boolean;
  projekt: (id: string, fn: (p: Projekt) => void) => boolean;
  ersetzen: (d: Daten) => boolean;
}
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [start] = useState(laden);
  const [data, setData] = useState(start.data);
  const aktuell = useRef(data);
  const [fehler, setFehler] = useState(start.fehler);
  const [gesperrt, setGesperrt] = useState(!!start.fehler);
  const toast = useToast();
  function speichern(d: Daten) {
    try {
      localStorage.setItem(SPEICHER_KEY, JSON.stringify(d));
      aktuell.current = d;
      setData(d);
      setFehler('');
      setGesperrt(false);
      return true;
    } catch {
      setFehler(
        'Speichern fehlgeschlagen. Die letzte Änderung wurde nicht übernommen. Prüfen Sie den freien Browserspeicher und sichern Sie Ihren Bestand.',
      );
      toast('Änderung konnte nicht gespeichert werden.');
      return false;
    }
  }
  const mutate = (fn: (d: Daten) => void) => {
    if (gesperrt) {
      toast('Bitte zuerst den gespeicherten Bestand wiederherstellen.');
      return false;
    }
    const neu = structuredClone(aktuell.current);
    try {
      fn(neu);
      return speichern(neu);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Änderung nicht möglich.');
      return false;
    }
  };
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SPEICHER_KEY) {
        const r = laden();
        if (r.fehler) {
          setFehler(r.fehler);
          setGesperrt(true);
        } else {
          aktuell.current = r.data;
          setData(r.data);
          setFehler('');
          setGesperrt(false);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return (
    <Context.Provider
      value={{
        data,
        fehler,
        gesperrt,
        mutate,
        projekt: (id, fn) =>
          mutate((d) => {
            const p = d.projekte.find((p) => p.id === id);
            if (!p) throw new Error('Projekt nicht gefunden.');
            fn(p);
          }),
        ersetzen: (d) => speichern(datenLesen(d)),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const s = useContext(Context);
  if (!s) throw new Error('Projektsteuerung: Store fehlt.');
  return s;
}
