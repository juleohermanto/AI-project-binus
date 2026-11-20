import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Pause, Play, Volume2 } from 'lucide-react';
import Header from '../components/Header';
import Plant from '../components/Plant';
import { tasks } from '../data/tasks';
import './Focus.css';

const STEP_SECONDS = 10 * 60;
const pad = (n) => String(n).padStart(2, '0');

function useBrownNoise(on) {
  useEffect(() => {
    if (!on) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0.4;
    src.connect(gain).connect(ctx.destination);
    src.start();
    return () => { src.stop(); ctx.close(); };
  }, [on]);
}

export default function Focus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const task = tasks.find((t) => t.id === id) ?? tasks[0];
  const total = task.steps.length;

  const [current, setCurrent] = useState(task.done);
  const [seconds, setSeconds] = useState(STEP_SECONDS);
  const [running, setRunning] = useState(true);
  const [noise, setNoise] = useState(false);
  useBrownNoise(noise);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  const completeStep = () => {
    if (current + 1 >= total) return navigate('/');
    setCurrent(current + 1);
    setSeconds(STEP_SECONDS);
  };

  const start = Math.max(0, current - 1);
  const visible = task.steps.slice(start, current + 2).map((s, i) => ({ ...s, index: start + i }));
  const label = { done: 'Completed', current: 'Your next small step', next: 'Up next' };

  return (
    <>
      <Header locked={running} />
      <main className="focus page">
        <div className="focus__grid">
          <section className="focus__stage">
            <div className="focus__plant">
              <Plant variant={task.plant ?? task.id} size={350} />
            </div>
            <div className="focus__timer">{pad(Math.floor(seconds / 60))}:{pad(seconds % 60)}</div>
            <div className="progress"><span style={{ width: `${(1 - seconds / STEP_SECONDS) * 100}%` }} /></div>
            <div className="focus__buttons">
              <button className="btn btn--primary" onClick={() => setRunning(!running)}>
                {running ? <Pause size={16} /> : <Play size={16} />} {running ? 'Pause' : 'Resume'}
              </button>
              <button className="btn" onClick={completeStep}><Check size={16} /> Complete step</button>
            </div>
          </section>

          <section className="focus__steps">
            <div className="focus__chips">
              <span className="chip focus__mode">FOCUS MODE</span>
              <span className={`chip focus__priority focus__priority--${task.priority}`}>
                <i /> {task.priority[0].toUpperCase() + task.priority.slice(1)} priority
              </span>
            </div>
            <h1 className="serif">{task.focusTitle ?? task.title}</h1>
            <p className="focus__sub">One small step at a time. Navigation unlocks when you pause.</p>

            <div className="focus__count">
              <span>STEP <b>{current + 1}</b> OF {total}</span>
              <span>{current} / {total} completed</span>
            </div>
            <div className="progress"><span style={{ width: `${(current / total) * 100}%` }} /></div>

            <ol className="timeline">
              {visible.map((s) => {
                const status = s.index < current ? 'done' : s.index === current ? 'current' : 'next';
                return (
                  <li key={s.index} className={`timeline__item is-${status}`}>
                    <span className="timeline__marker">
                      {status === 'done' && <Check size={18} />}
                      {status === 'current' && <i />}
                    </span>
                    <div className="timeline__card">
                      <small>{label[status]}</small>
                      <h3>{s.title}</h3>
                      {status === 'current' && s.desc && <p>{s.desc}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <footer className="focus__footer">
          <Volume2 size={14} />
          <span>Brown Noise</span>
          <button
            role="switch"
            aria-checked={noise}
            aria-label="Brown noise"
            className={`switch${noise ? ' is-on' : ''}`}
            onClick={() => setNoise(!noise)}
          />
        </footer>
      </main>
    </>
  );
}