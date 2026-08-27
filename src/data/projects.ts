export interface CaseStudyChallenge {
  challenge: string;
  solution: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  description_business?: string;
  longDescription_business?: string;
  image: string;
  tags: string[];
  liveUrl: string;
  githubUrl: string;
  color: string;
  isLive: boolean;
  status: 'live' | 'soon' | 'personal';
  ctaLabel?: string;
  category?: 'ai' | 'scoping' | 'workspace' | 'systems' | 'fullstack' | 'mobile' | 'simulation';
  systemRole?: string;
  telemetryBadge?: string;
  architectureHighlights?: string[];
  challenges?: CaseStudyChallenge[];
  keyDeliverables?: string[];
}

