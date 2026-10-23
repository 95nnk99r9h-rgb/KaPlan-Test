import { App } from './App';
import { StoreProvider } from './store/store';
import './projektsteuerung.css';
export function BereichProjektsteuerung() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}
