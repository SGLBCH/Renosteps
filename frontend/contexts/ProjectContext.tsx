import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import backend from '~backend/client';
import type { Project as BackendProject } from '~backend/projects/types';

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

// Helper function to format date range
function formatDateRange(startDate: Date, endDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.getDate()}-${start.getMonth() + 1}-${start.getFullYear()} - ${end.getDate()}-${end.getMonth() + 1}-${end.getFullYear()}`;
}

// Helper function to convert backend project to frontend project
function convertBackendProject(backendProject: BackendProject): Project {
  return {
    id: backendProject.id,
    name: backendProject.name,
    dateRange: formatDateRange(backendProject.startDate, backendProject.endDate),
  };
}

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Load projects from backend
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const response = await backend.projects.list();
        const convertedProjects = response.projects.map(convertBackendProject);
        setProjects(convertedProjects);

        // Always ensure we have a current project selected
        if (convertedProjects.length > 0) {
          // Try to get saved project from localStorage
          const savedProjectId = localStorage.getItem('currentProjectId');
          let projectToSelect: Project | null = null;

          if (savedProjectId) {
            // Find the saved project
            projectToSelect = convertedProjects.find(p => p.id === savedProjectId) || null;
          }

          // If no saved project found or saved project doesn't exist, select the first one
          if (!projectToSelect) {
            projectToSelect = convertedProjects[0];
          }

          // Set the current project
          setCurrentProjectState(projectToSelect);
          localStorage.setItem('currentProjectId', projectToSelect.id);
        } else {
          // No projects available, clear current project and localStorage
          setCurrentProjectState(null);
          localStorage.removeItem('currentProjectId');
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
        // On error, still try to set loading to false and clear current project
        setCurrentProjectState(null);
        localStorage.removeItem('currentProjectId');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const setCurrentProject = (project: Project) => {
    setCurrentProjectState(project);
    localStorage.setItem('currentProjectId', project.id);
  };

  const addProject = (project: Project) => {
    setProjects(prev => {
      const newProjects = [project, ...prev];
      
      // If this is the first project, automatically select it
      if (prev.length === 0) {
        setCurrentProjectState(project);
        localStorage.setItem('currentProjectId', project.id);
      }
      
      return newProjects;
    });
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
