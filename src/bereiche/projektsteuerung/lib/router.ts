import { useEffect, useState } from 'react';
export type ProjektTab = 'beteiligte' | 'beauftragungen' | 'fristen' | 'protokolle';
export type Route =
  | { view: 'projekte' | 'fristen' }
  | { view: 'projekt'; projektId: string; tab: ProjektTab };
const TABS: ProjektTab[] = ['beteiligte', 'beauftragungen', 'fristen', 'protokolle'];
export function routeLesen(hash: string): Route {
  const teile = hash.replace(/^#\/?/, '').split('/');
  if (teile[1] === 'projekt' && teile[2]) {
    try {
      return {
        view: 'projekt',
        projektId: decodeURIComponent(teile[2]),
        tab: TABS.includes(teile[3] as ProjektTab) ? (teile[3] as ProjektTab) : 'beteiligte',
      };
    } catch {
      return { view: 'projekte' };
    }
  }
  return { view: teile[1] === 'fristen' ? 'fristen' : 'projekte' };
}
export function routeHash(r: Route) {
  return r.view === 'projekt'
    ? `#/projektsteuerung/projekt/${encodeURIComponent(r.projektId)}/${r.tab}`
    : `#/projektsteuerung/${r.view}`;
}
export function useRoute(): [Route, (r: Route) => void] {
  const [r, setR] = useState(() => routeLesen(location.hash));
  useEffect(() => {
    const fn = () => setR(routeLesen(location.hash));
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  return [
    r,
    (r) => {
      location.hash = routeHash(r);
    },
  ];
}
