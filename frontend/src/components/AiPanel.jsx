import { useState } from 'react';
import { Sparkles, Mic, Send } from 'lucide-react';
import Panel from './Panel';
import './AiPanel.css';

export default function AiPanel({ onSubmit }) {
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return;
    onSubmit?.(text.trim()); // hook up your AI task-breakdown call here
    setText('');
  };

  return (
    <Panel icon={Sparkles} title="AI assistant">
      <div className="ai">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex: I’m presenting to the team tomorrow, but the slides aren’t ready. The collaboration proposal needs polishing this week, and my desk is a mess."
        />
        <div className="ai__actions">
          <button className="ai__mic" aria-label="Dictate"><Mic size={14} /></button>
          <button className="ai__send" aria-label="Send" onClick={send}><Send size={13} /></button>
        </div>
      </div>
    </Panel>
  );
}
