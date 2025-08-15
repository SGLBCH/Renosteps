import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Project {
  id: string;
  name: string;
  dateRange: string;
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  setCurrentProject: (project: Project) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

// Mock data - in a real app this would come from the backend
const initialProjects: Project[] = [
  { id: '1', name: 'Home Renovation Project', dateRange: '1-6-2023 - 30-9-2023' },
  { id: '2', name: 'Kitchen Remodel', dateRange: '15-10-2023 - 15-12-2023' },
  { id: '3', name: 'Bathroom Upgrade', dateRange: '1-1-2024 - 28-2-2024' },
];

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize with first project
  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      setCurrentProjectState(projects[0]);
    }
    setLoading(false);
  }, [projects, currentProject]);

  const setCurrentProject = (project: Project) => {
    setCurrentProjectState(project);
    // In a real app, you might want to persist this to localStorage
    localStorage.setItem('currentProjectId', project.id);
  };

  const addProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => 
      prev.map(p => p.id === projectId ? { ...p, ...updates } : p)
    );
    
    // Update current project if it's the one being updated
    if (currentProject?.id === projectId) {
      setCurrentProjectState(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Load saved project from localStorage on mount
  useEffect(() => {
    const savedProjectId = localStorage.getItem('currentProjectId');
    if (savedProjectId) {
      const savedProject = projects.find(p => p.id === savedProjectId);
      if (savedProject) {
        setCurrentProjectState(savedProject);
      }
    }
  }, [projects]);

  return (
    <ProjectContext.Provider value={{
      currentProject,
      projects,
      setCurrentProject,
      addProject,
      updateProject,
      loading
    }}>
      {children}
    </ProjectContext.Provider>
  );
}
