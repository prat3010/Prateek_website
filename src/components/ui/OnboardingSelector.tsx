'use client';

import React from 'react';
import { m } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { Code, Briefcase, Sparkles, Building2 } from 'lucide-react';
import ComicPanel from './ComicPanel';
import styles from './OnboardingSelector.module.css';

export default function OnboardingSelector() {
  const { isNoir, setAudience } = useTheme();

  const handleSelect = (choice: 'developer' | 'business') => {
    setAudience(choice);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      }
    },
  };

  return (
    <div className={styles.wrapper}>
      {/* Dynamic Background Effects matching active theme */}
      {!isNoir && <div className={styles.azureBlobContainer}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
      </div>}

      <m.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={styles.container}
      >
        <m.div variants={itemVariants} className={styles.header}>
          <h1 className={styles.title}>
            {isNoir ? 'IDENTIFY_YOURSELF:' : 'Who are you here as?'}
          </h1>
          <p className={styles.subtitle}>
            {isNoir 
              ? 'SELECT ARCHETYPE TO DECRYPT CORRESPONDING RECORDS' 
              : 'Choose a perspective to customize your experience.'}
          </p>
        </m.div>

        <div className={styles.grid}>
          {/* Card 1: Hiring a Developer */}
          <m.div 
            variants={itemVariants} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={styles.cardContainer}
            onClick={() => handleSelect('developer')}
          >
            <ComicPanel tilt={-1} className={styles.choiceCard} staticDots>
              <div className={styles.cardContent}>
                <div className={`${styles.iconWrapper} ${styles.devIcon}`}>
                  <Code size={36} />
                </div>
                <h2 className={styles.cardTitle}>Hiring a Developer</h2>
                <p className={styles.cardDesc}>
                  Inspect coding competencies, system architectures, detailed technical case reviews, and export my software engineering resume.
                </p>
                <div className={styles.cardMeta}>
                  <span>Targeted for recruiters, engineering managers, & CTOs</span>
                </div>
                <button className={styles.actionBtn}>
                  <span>{isNoir ? 'MOUNT_DEV_DOSSIER' : 'Explore Engineering Mode'}</span>
                  <Sparkles size={16} />
                </button>
              </div>
            </ComicPanel>
          </m.div>

          {/* Card 2: Need a Website */}
          <m.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={styles.cardContainer}
            onClick={() => handleSelect('business')}
          >
            <ComicPanel tilt={1} className={styles.choiceCard} staticDots>
              <div className={styles.cardContent}>
                <div className={`${styles.iconWrapper} ${styles.bizIcon}`}>
                  <Building2 size={36} />
                </div>
                <h2 className={styles.cardTitle}>Need a Website</h2>
                <p className={styles.cardDesc}>
                  Explore freelance services, outcomes, custom web applications, design optimization rates, and generate service quotations.
                </p>
                <div className={styles.cardMeta}>
                  <span>Targeted for business owners, startups, & creators</span>
                </div>
                <button className={styles.actionBtn}>
                  <span>{isNoir ? 'LOAD_BUSINESS_PROPOSAL' : 'Explore Partner Mode'}</span>
                  <Briefcase size={16} />
                </button>
              </div>
            </ComicPanel>
          </m.div>
        </div>
      </m.div>
    </div>
  );
}
