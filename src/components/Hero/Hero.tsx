import HeroClient from './HeroClient';
import styles from './Hero.module.css';

interface HeroProps {
  taglines: {
    standard: string[];
    noir: string[];
  };
}

// Server Component — renders the section landmark in the initial HTML payload.
// All interactive/theme-dependent content is delegated to HeroClient.
export default function Hero({ taglines }: HeroProps) {
  return (
    <section id="home" className={styles.hero} aria-label="Hero">
      <HeroClient taglines={taglines} />
    </section>
  );
}
