import { Pencil, Trash2 } from 'lucide-react';
import Plant from './Plant';
import './TaskCard.css';

export default function TaskCard({ task, onOpen, onEdit, onDelete }) {
  const total = task.steps.length;
  const stop = (fn) => (e) => { e.stopPropagation(); fn?.(task); };

  return (
    <article
      className="task-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(task)}
    >
      <div className="task-card__art" style={{ '--accent': task.accent }}>
        <Plant variant={task.plant ?? task.id} size={130} />
      </div>

      <div className="task-card__top">
        <span className="chip task-card__cat">{task.category}</span>
        <div className="task-card__actions">
          <button aria-label="Edit task" onClick={stop(onEdit)}><Pencil size={15} /></button>
          <button aria-label="Delete task" onClick={stop(onDelete)}><Trash2 size={15} /></button>
        </div>
      </div>

      <h3 className="task-card__title">{task.title}</h3>
      <p className="task-card__desc">{task.desc}</p>

      <div className="task-card__meta">
        <span>{task.minutes} min · {task.due}</span>
        <span>{task.done} / {total} steps</span>
      </div>
      <div className="progress"><span style={{ width: `${(task.done / total) * 100}%` }} /></div>

      <p className="task-card__next">Next: {task.next}</p>
    </article>
  );
}