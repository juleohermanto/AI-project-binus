import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Panel from './Panel';
import './CalendarPanel.css';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function CalendarPanel({ plannedCount = 0 }) {
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const offset = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // week starts Monday
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const isToday = (d) => d === now.getDate() && view.m === now.getMonth() && view.y === now.getFullYear();
  const shift = (n) => setView(({ y, m }) => {
    const d = new Date(y, m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const label = new Date(view.y, view.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Panel icon={Calendar} title="Calendar">
      <div className="cal__nav">
        <strong>{label}</strong>
        <div>
          <button onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
          <button onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="cal__grid">
        {WEEKDAYS.map((d, i) => <span key={i} className="cal__dow">{d}</span>)}
        {cells.map((d, i) => (
          <span key={i} className={`cal__day${d && isToday(d) ? ' is-today' : ''}`}>
            {d}
            {d && isToday(d) && plannedCount > 0 && <i className="cal__dot" />}
          </span>
        ))}
      </div>
      <div className="cal__foot">
        <span>Today</span>
        <span>{plannedCount} tasks planned</span>
      </div>
    </Panel>
  );
}
