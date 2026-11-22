import { NavLink } from 'react-router-dom';
import { Leaf, HelpCircle, Settings, User, Lock } from 'lucide-react';
import './Header.css';

const links = [
  { to: '/', label: 'Today', end: true },
  { to: '/garden', label: 'My garden' },
  { to: '/subscriptions', label: 'Subscriptions' },
];

export default function Header({ locked = false }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo"><Leaf size={20} /></span>
        <span className="header__name">tumbuh</span>
        <span className="header__tagline">Room for one small step</span>
      </div>

      <nav className={`header__nav${locked ? ' is-locked' : ''}`}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            tabIndex={locked ? -1 : 0}
            onClick={(e) => locked && e.preventDefault()}
            className={({ isActive }) => `header__link${isActive ? ' is-active' : ''}`}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="header__right">
        {locked ? (
          <div className="header__lock"><Lock size={14} /> Pause to navigate</div>
        ) : (
          <span className="header__date">{today}</span>
        )}
        <button className="header__icon" aria-label="Help"><HelpCircle size={18} /></button>
        <button className="header__icon" aria-label="Settings"><Settings size={18} /></button>
        <button className="header__account"><User size={14} /> Account</button>
      </div>
    </header>
  );
}