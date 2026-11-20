import { useState } from 'react';
import { Check } from 'lucide-react';
import Header from '../components/Header';
import './Subscriptions.css';

const plans = [
  {
    id: 'seed', tag: 'Current plan', name: 'Seed', tagline: 'A gentle place to begin.',
    monthly: 0, note: 'Free forever', cta: 'Your current plan', current: true,
    features: ['Unlimited tasks and small steps', 'Calendar and priority filters', '10 AI task breakdowns / month'],
  },
  {
    id: 'grow', tag: 'Most popular', name: 'Grow', tagline: 'More clarity, a little every day.',
    monthly: 8, cta: 'Choose Grow', featured: true,
    features: ['Everything in Seed', 'Unlimited AI task breakdowns', 'Smart scheduling and reminders'],
  },
  {
    id: 'flourish', tag: 'Go further', name: 'Flourish', tagline: 'Room for your bigger picture.',
    monthly: 14, cta: 'Choose Flourish',
    features: ['Everything in Grow', 'Advanced progress insights', 'Priority support and early access'],
  },
];

const money = (n) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export default function Subscriptions() {
  const [yearly, setYearly] = useState(false);

  return (
    <>
      <Header />
      <main className="page subs">
        <div className="subs__inner">
          <h1 className="serif">A little support for your next chapter.</h1>
          <p className="subs__lead">Choose the space you need to turn big thoughts into small, doable steps.</p>

          <div className="subs__bar">
            <div>
              <small>YOUR MEMBERSHIP</small>
              <p>Free plan · No payment method required</p>
            </div>
            <div className="toggle" role="group" aria-label="Billing period">
              <button className={!yearly ? 'is-on' : ''} onClick={() => setYearly(false)}>Monthly</button>
              <button className={yearly ? 'is-on' : ''} onClick={() => setYearly(true)}>Yearly · save 20%</button>
            </div>
          </div>

          <div className="plans">
            {plans.map((p) => {
              const price = yearly ? p.monthly * 0.8 : p.monthly;
              return (
                <article key={p.id} className={`plan${p.featured ? ' is-featured' : ''}`}>
                  <span className="chip plan__tag">{p.tag}</span>
                  <h2 className="serif">{p.name}</h2>
                  <p className="plan__tagline">{p.tagline}</p>
                  <div className="plan__price">
                    <strong className="serif">{money(price)}</strong>
                    <span>/ month</span>
                  </div>
                  <small className="plan__note">{p.note ?? (yearly ? 'Billed yearly' : 'Billed monthly')}</small>
                  <ul>
                    {p.features.map((f) => (
                      <li key={f}><Check size={14} /> {f}</li>
                    ))}
                  </ul>
                  <button className={`btn${p.featured ? ' btn--primary' : ''}`} disabled={p.current}>{p.cta}</button>
                </article>
              );
            })}
          </div>

          <div className="subs__faq">
            <div>
              <h2 className="serif">Your pace. Your plan.</h2>
              <p>Start free and upgrade whenever you’re ready.</p>
            </div>
            <div>
              <h3>Can I change my plan?</h3>
              <p>Yes. Upgrade or downgrade whenever your needs change.</p>
            </div>
            <div>
              <h3>What happens if I cancel?</h3>
              <p>Your paid features stay available until your billing period ends.</p>
            </div>
          </div>

          <div className="subs__fine">
            <span>All prices in USD. Cancel anytime.</span>
            <span>Need a hand? Visit Help in the header.</span>
          </div>
        </div>
      </main>
    </>
  );
}
