import { Routes, Route } from 'react-router-dom';
import Today from './pages/Today';
import Focus from './pages/Focus';
import Subscriptions from './pages/Subscriptions';
import Garden from './pages/Garden';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Today />} />
      <Route path="/focus/:id" element={<Focus />} />
      <Route path="/garden" element={<Garden />} />
      <Route path="/subscriptions" element={<Subscriptions />} />
    </Routes>
  );
}