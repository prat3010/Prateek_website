import React from 'react';
import { Layers, Rocket, Sparkles } from 'lucide-react';
import styles from './IntakeForm.module.css';

interface ServiceTypeGateProps {
  onSelectType: (type: 'full' | 'quick') => void;
}

export function ServiceTypeGate({ onSelectType }: ServiceTypeGateProps) {
  return (
    <div className={styles.formStep}>
      <div className={styles.groupTitle}>
        <Layers size={18} />
        <span>WHAT DO YOU NEED?</span>
      </div>
      <p className={styles.fieldHint}>Select the type of engagement to customize your scoping experience.</p>
      <div className={styles.checkboxGrid} role="radiogroup" aria-label="Service Type">
        <label
          className={`${styles.checkboxCard} ${styles.step0Card} ${styles.cardSelectable}`}
          onClick={() => onSelectType('full')}
        >
          <div className={styles.step0CardContent}>
            <Rocket size={22} />
            <span className={styles.step0CardTitle}>Full Project Build</span>
          </div>
          <p className={styles.step0CardDesc}>
            New website, web app, or SaaS platform from scratch with full scoping wizard.
          </p>
        </label>
        <label
          className={`${styles.checkboxCard} ${styles.step0Card} ${styles.cardSelectable}`}
          onClick={() => onSelectType('quick')}
        >
          <div className={styles.step0CardContent}>
            <Sparkles size={22} />
            <span className={styles.step0CardTitle}>Quick Service</span>
          </div>
          <p className={styles.step0CardDesc}>
            Add a feature to your existing site — chatbot, SEO, speed fix, payments, and more.
          </p>
        </label>
      </div>
    </div>
  );
}
