import React from 'react';
import { Layers, Rocket, Sparkles } from 'lucide-react';
import styles from './IntakeForm.module.css';

interface ServiceTypeGateProps {
  onSelectType: (type: 'full' | 'quick') => void;
}

export function ServiceTypeGate({ onSelectType }: ServiceTypeGateProps) {
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const cardRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const focusCard = (index: number) => {
    const clamped = Math.max(0, Math.min(index, 1));
    setFocusedIndex(clamped);
    cardRefs.current[clamped]?.focus();
  };

  return (
    <div className={styles.formStep}>
      <div className={styles.groupTitle}>
        <Layers size={18} />
        <span>WHAT DO YOU NEED?</span>
      </div>
      <p className={styles.fieldHint}>Select the type of engagement to customize your scoping experience.</p>
      <div className={styles.checkboxGrid} role="radiogroup" aria-label="Service Type">
        <button
          type="button"
          ref={(el) => { cardRefs.current[0] = el; }}
          role="radio"
          aria-checked={false}
          tabIndex={focusedIndex === 0 ? 0 : -1}
          className={`${styles.checkboxCard} ${styles.step0Card} ${styles.cardSelectable}`}
          onClick={() => onSelectType('full')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); focusCard(1); }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); focusCard(1); }
          }}
        >
          <div className={styles.step0CardContent}>
            <Rocket size={22} />
            <span className={styles.step0CardTitle}>Full Project Build</span>
          </div>
          <p className={styles.step0CardDesc}>
            New website, web app, or SaaS platform from scratch with full scoping wizard.
          </p>
        </button>
        <button
          type="button"
          ref={(el) => { cardRefs.current[1] = el; }}
          role="radio"
          aria-checked={false}
          tabIndex={focusedIndex === 1 ? 0 : -1}
          className={`${styles.checkboxCard} ${styles.step0Card} ${styles.cardSelectable}`}
          onClick={() => onSelectType('quick')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); focusCard(0); }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); focusCard(0); }
          }}
        >
          <div className={styles.step0CardContent}>
            <Sparkles size={22} />
            <span className={styles.step0CardTitle}>Quick Service</span>
          </div>
          <p className={styles.step0CardDesc}>
            Add a feature to your existing site — chatbot, SEO, speed fix, payments, and more.
          </p>
        </button>
      </div>
    </div>
  );
}
