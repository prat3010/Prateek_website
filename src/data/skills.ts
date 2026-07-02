export interface Skill {
  name: string;
  name_business?: string;
  icon: string;
  description: string;
  description_business?: string;
  category: 'orchestration' | 'logic' | 'product' | 'dynamic';
  color: string;
  level?: string;
  prereq?: string;
  status?: 'legendary' | 'mastered' | 'quest';
  projects?: { title: string; id: string }[];
}
export type SkillCategory = Skill['category'];



