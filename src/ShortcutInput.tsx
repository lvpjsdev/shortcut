import React, { useRef, useState } from 'react';
import styles from './ShortcutInput.module.css';

type ShortcutInputProps = {
  value: string;
  modifiers: string[];
  onChange: (value: string) => void;
};

function normalizeKey(key: string, isNonModLetter?: boolean) {
  if (key === ' ') return 'Space';
  if (isNonModLetter && key.length === 1 && /[a-zA-Z]/.test(key))
    return key.toUpperCase();
  if (key.length === 1) return key.toLowerCase();
  return key[0].toUpperCase() + key.slice(1);
}

function parseShortcut(keys: string[], modifiers: string[]) {
  const mods = keys.filter((k) => modifiers.includes(k));
  const nonMods = keys.filter((k) => !modifiers.includes(k));
  return { mods, nonMods };
}

function formatShortcut(keys: string[], modifiers: string[]) {
  const { mods, nonMods } = parseShortcut(keys, modifiers);
  return [...mods, ...nonMods].map(key => normalizeKey(key, false)).join('+');
}

function isValidShortcut(keys: string[], modifiers: string[]) {
  const { mods, nonMods } = parseShortcut(keys, modifiers);
  return mods.length >= 1 && nonMods.length === 1;
}

// Компонент Chip для отображения "чипов"
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className={styles.chip}>{children}</span>
  );
}

export const ShortcutInput: React.FC<ShortcutInputProps> = ({
  value,
  modifiers,
  onChange,
}) => {
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState<string[]>([]);
  const [lastValid, setLastValid] = useState<string>(value || '');
  const containerRef = useRef<HTMLDivElement>(null);



  function handleFocus() {
    setFocused(true);
    setPressed([]);
  }

  function handleBlur() {
    setFocused(false);
    setPressed([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const key = e.key;
    if (pressed.includes(key)) return;

    const isModifier = modifiers.includes(key);
    let nextPressed: string[];
    if (isModifier) {
      nextPressed = [...pressed, key];
    } else {
      // Убираем все предыдущие не-модификаторы и добавляем только текущий
      nextPressed = [...pressed.filter((k) => modifiers.includes(k)), key];
    }

    // Синхронизация CapsLock
    if (modifiers.includes('CapsLock')) {
      const capsState = e.getModifierState && e.getModifierState('CapsLock');
      const hasCaps = nextPressed.includes('CapsLock');
      if (capsState && !hasCaps) {
        nextPressed = [...nextPressed, 'CapsLock'];
      } else if (!capsState && hasCaps) {
        nextPressed = nextPressed.filter((k) => k !== 'CapsLock');
      }
    }
    setPressed(nextPressed);

    if (isValidShortcut(nextPressed, modifiers)) {
      const shortcut = formatShortcut(nextPressed, modifiers);
      setLastValid(shortcut);
      onChange(shortcut);
    }
  }

  function handleKeyUp(e: React.KeyboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const key = e.key;
    let nextPressed = pressed;

    // Если отпущена модификаторная клавиша (кроме CapsLock) — удаляем её
    if (modifiers.includes(key) && key !== 'CapsLock') {
      nextPressed = nextPressed.filter((k) => k !== key);
    } else {
      nextPressed = nextPressed.filter((k) => k !== key);
    }

    // Синхронизация CapsLock
    if (modifiers.includes('CapsLock')) {
      const capsState = e.getModifierState && e.getModifierState('CapsLock');
      const hasCaps = nextPressed.includes('CapsLock');
      if (capsState && !hasCaps) {
        nextPressed = [...nextPressed, 'CapsLock'];
      } else if (!capsState && hasCaps) {
        nextPressed = nextPressed.filter((k) => k !== 'CapsLock');
      }
    }

    if (isValidShortcut(nextPressed, modifiers)) {
      setPressed(nextPressed);
    } else if (lastValid) {
      // Очищаем pressed, value уже отображается как чип
      setPressed([]);
    } else {
      setPressed(nextPressed);
      if (!isValidShortcut(nextPressed, modifiers)) {
        onChange('');
      }
    }
  }

  // Получаем активные модификаторы и не-модификаторы
  const { mods: pressedMods, nonMods: pressedNonMods } = parseShortcut(
    pressed,
    modifiers
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={focused ? `${styles.container} ${styles.containerFocused}` : styles.container}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-label="Поле ввода сочетания клавиш"
      role="textbox"
      aria-multiline="false"
      aria-activedescendant={undefined}
      aria-invalid={!isValidShortcut(pressed, modifiers) && pressed.length > 0}
    >
      {/* Показываем только нажатые модификаторы */}
      {pressedMods.map((mod) => (
        <Chip key={mod}>{normalizeKey(mod)}</Chip>
      ))}
      {/* Показываем не-модификаторную нажатую клавишу (если есть) */}
      {pressedNonMods.map((key) => (
        <Chip key={key}>{normalizeKey(key, true)}</Chip>
      ))}
      {/* Плейсхолдер если ничего не выбрано */}
      {pressed.length === 0 && !value && (
        <span className={styles.placeholder}>
          Введите сочетание…
        </span>
      )}
      {/* Если есть value и не идет ввод — показываем как chips */}
      {pressed.length === 0 &&
        value &&
        value.split('+').map((key, idx, arr) => {
          // Если это последний элемент и это буква, показываем в верхнем регистре
          const isNonModLetter =
            idx === arr.length - 1 &&
            key.length === 1 &&
            /[a-zA-Zа-яА-Я]/.test(key);
          return <Chip key={key}>{normalizeKey(key, isNonModLetter)}</Chip>;
        })}
    </div>
  );
};
