import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './Panel.css';

export default function Panel({ icon: Icon, title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="panel">
      <button className="panel__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon size={18} color="var(--sage)" />
        <span>{title}</span>
        <ChevronDown size={18} className={open ? '' : 'is-closed'} />
      </button>
      {open && <div className="panel__body">{children}</div>}
    </section>
  );
}
