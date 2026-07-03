type ThemeVariant = 'noir' | 'light';
type AboutFallbacks = Record<string, Record<ThemeVariant, {
  bio: string;
  facts: string[];
}>>;

export const ABOUT_FALLBACKS: AboutFallbacks = {
  business: {
    noir: {
      bio: "They talk about design and code like separate puzzles. I don't. My name is Prateeq Sharma. I'm a technology partner who turns business concepts into high-end, responsive web platforms. With a background in Commerce and expert software engineering skills, I design custom admin portals, optimize performance, and integrate secure payment setups to maximize your bottom line. We build with precision and zero overhead, delivering results that actually matter.",
      facts: [
        "Tailored custom websites with zero middleware bloat.",
        "Delivering working products directly into your hands.",
        "Search rankings optimized. Loading speeds accelerated.",
        "Serving clients worldwide from code-locked chambers.",
      ],
    },
    light: {
      bio: "Hey there! I'm Prateeq Sharma — a freelance developer and technology partner who builds clean, high-performance websites and custom tools. Coming from a Commerce background, I don't just write code; I design systems that solve actual business problems, optimize load speeds for better search rankings, and integrate AI automations to save your team hours of manual work. Let's collaborate to build something your customers will love.",
      facts: [
        "SERVICE // 1-on-1 direct freelance partnership",
        "SPEED // High-velocity feature shipping",
        "VALUE // ROI-focused, search-optimized pages",
        "LOCATION // Operating globally, based in India",
      ],
    },
  },
  developer: {
    noir: {
      bio: "They stare at screens, praying to a god of syntax and semicolons. I don't. My name is Prateeq Sharma. I transitioned from a background in Commerce to software engineering when I realized that code + AI is the ultimate leverage to solve complex business and technical problems. Now, I bring ideas out of the dark and into reality at warp speed. While traditional coders get lost in legacy frameworks, I combine solid system logic with AI orchestration to build fast, polished applications. In this city, the real superpower isn't memorizing boilerplate code. It's having the vision to design, the skill to build, and the tools to make it happen before the rain stops.",
      facts: [
        'Co-piloted by neural shadows and synthetic ghosts.',
        'Raising apps out of the ether before the ink dries.',
        'Orchestrating virtual puppets and raw prototype grids.',
        'Based in India, forging code to survive the digital decay.',
      ],
    },
    light: {
      bio: "Hey there! I'm Prateeq Sharma — a product-minded developer and builder who crafts high-performance web applications and digital experiences. Transitioning from a Commerce background, I realized that combining business logic with software and modern AI orchestration is the fastest way to turn complex requirements into shipped products. I focus on delivering velocity, architectural precision, and high-impact results.",
      facts: [
        'SYSTEM // Co-piloted by state-of-the-art AI systems',
        'VELOCITY // Prompt-to-app builder at supersonic speed',
        'ENGINE // Master of AI orchestration & prototyping',
        'LOCATION // Based in India, building future-proof experiences',
      ],
    },
  },
};
