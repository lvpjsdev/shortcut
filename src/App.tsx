import React, { useState } from 'react';
import { ShortcutInput } from './ShortcutInput';
import './App.css';

export default function App() {
  const [shortcut, setShortcut] = useState('');
  return (
    <div style={{ padding: 40 }}>
      <h2>Ввод сочетания клавиш</h2>
      <ShortcutInput
        value={shortcut}
        modifiers={['Control', 'Alt', 'Shift', 'CapsLock', 'Meta']}
        onChange={setShortcut}
      />
      <div style={{ marginTop: 24 }}>
        <b>Текущее сочетание:</b> {shortcut || 'нет'}
      </div>
    </div>
  );
}
