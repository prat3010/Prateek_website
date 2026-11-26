import type { ResumeData } from '@/data/resume';
import type { SystemStats } from '../useSystemTelemetry';

export interface ConsoleLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'link' | 'image';
  command?: string;
  imageUrl?: string;
  href?: string;
  streaming?: boolean;
}

export interface AIChatSessionState {
  isActive: boolean;
  history: { role: string; content: string }[];
}


export interface ProjectSummary {
  title: string;
  tags: string[];
}


export interface UseTerminalCommandsOptions {
  projects: ProjectSummary[];
  profileData: ResumeData;
  isNoir: boolean;
  stats: SystemStats;
  setActiveGame: (game: 'none' | 'snake' | 'pathfinder') => void;
  isMatrixActive: boolean;
  setIsMatrixActive: React.Dispatch<React.SetStateAction<boolean>>;
  isTelemetryCollapsed?: boolean;
  toggleTelemetry?: (forceState?: boolean) => void;
  onCommandExecuted?: () => void;
}

