import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Calendar, ChevronDown } from 'lucide-react';
import Header from '../components/Header';
import CalendarPanel from '../components/CalendarPanel';
import AiPanel from '../components/AiPanel';
import TaskCard from '../components/TaskCard';
import { tasks as initialTasks } from '../data/tasks';
import './Today.css';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export default function Today() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('due');

  const counts = {
    all: tasks.length,
    progress: tasks.filter((t) => t.done > 0).length,
    new: tasks.filter((t) => t.done === 0).length,
  };

  const visible = useMemo(() => {
    const list = tasks.filter((t) =>
      filter === 'all' ? true : filter === 'progress' ? t.done > 0 : t.done === 0
    );
    return [...list].sort((a, b) =>
      sort === 'priority' ? PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] : a.dueRank - b.dueRank
    );
  }, [tasks, filter, sort]);

  const tabs = [
    ['all', 'All tasks'],
    ['progress', 'In progress'],
    ['new', 'Not started'],
  ];

  return (
    <>
      <Header />
      <main className="page today">
        <section className="today__hero">
          <h1 className="serif">A little progress, every day.</h1>
          <p>Three tasks. One small step at a time. You’ve got this.</p>
        </section>

        <div className="today__layout">
          <aside>
            <CalendarPanel plannedCount={tasks.length} />
            <AiPanel onSubmit={(text) => console.log('AI request:', text)} />
          </aside>

          <section>
            <div className="today__title">
              <h2 className="serif">Your tasks</h2>
              <span>{tasks.length} active</span>
            </div>

            <div className="filters">
              {tabs.map(([key, label]) => (
                <button
                  key={key}
                  className={`filters__tab${filter === key ? ' is-active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label} <span>{counts[key]}</span>
                </button>
              ))}
              <i className="filters__divider" />
              <button className={`filters__tab${sort === 'priority' ? ' is-active' : ''}`} onClick={() => setSort('priority')}>
                <Flag size={14} /> Priority
              </button>
              <button className={`filters__tab${sort === 'due' ? ' is-active' : ''}`} onClick={() => setSort('due')}>
                <Calendar size={14} /> Due date
              </button>
              <label className="filters__sort">
                Sort: {sort === 'due' ? 'Due date' : 'Priority'}
                <ChevronDown size={16} />
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort tasks">
                  <option value="due">Due date</option>
                  <option value="priority">Priority</option>
                </select>
              </label>
            </div>

            <div className="today__grid">
              {visible.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onOpen={(task) => navigate(`/focus/${task.id}`)}
                  onEdit={(task) => console.log('edit', task.id)}
                  onDelete={(task) => setTasks((all) => all.filter((x) => x.id !== task.id))}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}