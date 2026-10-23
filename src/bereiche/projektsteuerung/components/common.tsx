import { useState, type ReactNode } from 'react';
import { Badge, Modal } from '../../../shared/ui';
import { useToast } from '../../../shared/toast';
import { Icon } from '../../../shared/icons';
import { useStore } from '../store/store';
import type { Projekt } from '../domain/types';
import { ampel, AMPEL_TEXT } from '../domain/fristen';

export function Feld({
  label,
  value,
  onChange,
  type = 'text',
  full = false,
  multiline = false,
  placeholder = '',
  hint,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  type?: string;
  full?: boolean;
  multiline?: boolean;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      {multiline ? (
        <textarea
          className="textarea"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          className="input"
          aria-label={label}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}{' '}
      {hint ? <span className="hint">{hint}</span> : null}
    </label>
  );
}
export function Auswahl<T extends string>({
  label,
  value,
  onChange,
  options,
  full = false,
}: {
  label: string;
  value: T;
  onChange: (s: T) => void;
  options: { value: T; label: string }[];
  full?: boolean;
}) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      <span>{label}</span>
      <select
        className="select"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export const optionen = (xs: string[]) => xs.map((value) => ({ value, label: value }));
export function Ampel({
  termin,
  erledigt = false,
  erforderlich = true,
}: {
  termin: string;
  erledigt?: boolean;
  erforderlich?: boolean;
}) {
  const a = ampel(termin, erledigt, erforderlich);
  const ton =
    a === 'ueberfaellig'
      ? 'red'
      : a === 'faellig' || a === 'ohne_termin'
        ? 'orange'
        : a === 'erledigt'
          ? 'green'
          : a === 'geplant'
            ? 'blue'
            : '';
  return <Badge ton={ton}>{AMPEL_TEXT[a]}</Badge>;
}
export function DialogAktionen({
  onClose,
  onSave,
  label = 'Speichern',
}: {
  onClose: () => void;
  onSave: () => void;
  label?: string;
}) {
  return (
    <>
      <button className="btn" onClick={onClose}>
        Abbrechen
      </button>
      <button className="btn btn-primary" onClick={onSave}>
        {label}
      </button>
    </>
  );
}
export function IconButton({
  name,
  label,
  onClick,
  disabled = false,
}: {
  name: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="btn-icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={name} size={15} />
    </button>
  );
}
export function GewerkTabs({
  p,
  value,
  onChange,
}: {
  p: Projekt;
  value: string;
  onChange: (g: string) => void;
}) {
  const [dialog, setDialog] = useState(false);
  return (
    <>
      <div className="tabs ps-gewerke">
        <button className={value === '' ? 'active' : ''} onClick={() => onChange('')}>
          Alle Gewerke
        </button>
        {p.gewerke.map((g) => (
          <button key={g} className={value === g ? 'active' : ''} onClick={() => onChange(g)}>
            {g}
          </button>
        ))}
        <button
          onClick={() => setDialog(true)}
          title="Gewerke verwalten"
          aria-label="Gewerke verwalten"
        >
          <Icon name="einstellungen" size={14} />
        </button>
      </div>
      {dialog ? <GewerkeDialog p={p} onClose={() => setDialog(false)} onChange={onChange} /> : null}
    </>
  );
}
function GewerkeDialog({
  p,
  onClose,
  onChange,
}: {
  p: Projekt;
  onClose: () => void;
  onChange: (s: string) => void;
}) {
  const { projekt } = useStore();
  const toast = useToast();
  const [alt, setAlt] = useState('');
  const [name, setName] = useState('');
  const speichern = () => {
    const n = name.trim();
    if (!n || ['__proto__', 'constructor', 'prototype'].includes(n))
      return toast('Bitte einen gültigen Gewerkname eingeben.');
    if (p.gewerke.some((g) => g !== alt && g.toLowerCase() === n.toLowerCase()))
      return toast('Dieses Gewerk besteht bereits.');
    if (
      projekt(p.id, (x) => {
        if (alt) {
          x.gewerke = x.gewerke.map((g) => (g === alt ? n : g));
          x.kontakte.forEach((k) => {
            if (k.gewerk === alt) k.gewerk = n;
          });
          x.beauftragungen.forEach((b) => {
            if (b.gewerk === alt) b.gewerk = n;
          });
          x.fristen.forEach((f) => {
            if (f.gewerk === alt) f.gewerk = n;
          });
          if (x.gewerkTermine[alt]) {
            x.gewerkTermine[n] = x.gewerkTermine[alt];
            if (alt !== n) delete x.gewerkTermine[alt];
          }
        } else x.gewerke.push(n);
      })
    ) {
      onChange(n);
      setName('');
      setAlt('');
    }
  };
  return (
    <Modal
      titel="Gewerke verwalten"
      onClose={onClose}
      footer={
        <button className="btn" onClick={onClose}>
          Schließen
        </button>
      }
    >
      <div className="stack">
        <div className="form-grid">
          <Auswahl
            label="Gewerk"
            value={alt}
            onChange={(s) => {
              setAlt(s);
              setName(s);
            }}
            options={[{ value: '', label: 'Neues Gewerk' }, ...optionen(p.gewerke)]}
          />
          <Feld label="Bezeichnung" value={name} onChange={setName} />
        </div>
        <div className="row wrap">
          <button className="btn btn-primary" onClick={speichern}>
            {alt ? 'Umbenennen' : 'Gewerk anlegen'}
          </button>
          {alt ? (
            <button
              className="btn"
              onClick={() => {
                const benutzt = [...p.kontakte, ...p.beauftragungen, ...p.fristen].some(
                  (k) => k.gewerk === alt,
                );
                if (benutzt)
                  return toast(
                    'Das Gewerk wird noch verwendet. Ordnen Sie die Einträge zuerst einem anderen Gewerk zu.',
                  );
                if (
                  projekt(p.id, (x) => {
                    x.gewerke = x.gewerke.filter((g) => g !== alt);
                    delete x.gewerkTermine[alt];
                  })
                ) {
                  setAlt('');
                  setName('');
                  onChange('');
                }
              }}
            >
              Leeres Gewerk entfernen
            </button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
export function DateiKnopf({
  accept,
  onFile,
  children,
  multiple = false,
}: {
  accept: string;
  onFile: (files: File[]) => void;
  children: ReactNode;
  multiple?: boolean;
}) {
  return (
    <label className="btn btn-outline ps-datei">
      <Icon name="importieren" size={14} />
      {children}
      <input
        type="file"
        aria-label={typeof children === 'string' ? children : 'Datei auswählen'}
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          const fs = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (fs.length) onFile(fs);
        }}
      />
    </label>
  );
}
