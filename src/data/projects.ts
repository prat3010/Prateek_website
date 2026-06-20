export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  tags: string[];
  liveUrl: string;
  githubUrl: string;
  color: string;
  isLive: boolean;
  status: 'live' | 'soon' | 'personal';
}

