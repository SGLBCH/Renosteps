import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useBackend } from '../components/AuthenticatedBackend';
import { http } from '../lib/http';
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
  removeProject: (projectId: string) => void;
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
  const backend = useBackend();

  // Load projects from backend
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        
        console.group('📁 Loading Projects');
        console.log('Starting project load...');
        
        // Check if backend is available first using the centralized health check
        const isBackendAvailable = await http.isBackendHealthy();
        if (!isBackendAvailable) {
          console.log('❌ Backend not available for projects - using empty state');
          setProjects([]);
          setCurrentProjectState(null);
          localStorage.removeItem('currentProjectId');
          console.groupEnd();
          return;
        }
        
        // Use the centralized HTTP client with built-in retry and timeout
        const response = await http.request(
          () => backend.projects.list(),
          'project loading'
        );
        
        console.log('✅ Projects loaded successfully');
        console.log('Projects count:', response.projects?.length || 0);
        
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
            console.log('Saved project found:', !!projectToSelect);
          }

          // If no saved project found or saved project doesn't exist, select the first one
          if (!projectToSelect) {
            projectToSelect = convertedProjects[0];
            console.log('Selected first project as default');
          }

          // Set the current project
          setCurrentProjectState(projectToSelect);
          localStorage.setItem('currentProjectId', projectToSelect.id);
          console.log('Current project set:', projectToSelect.name);
        } else {
          // No projects available, clear current project and localStorage
          console.log('No projects available');
          setCurrentProjectState(null);
          localStorage.removeItem('currentProjectId');
        }
        
        console.groupEnd();
      } catch (error) {
        console.group('❌ Project Loading Failed');
        console.error('Raw project loading error:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to load projects';
        console.log('Error message:', errorMessage);
        console.groupEnd();
        
        // On error, still try to set loading to false and clear current project
        setCurrentProjectState(null);
        localStorage.removeItem('currentProjectId');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [backend]);

  const setCurrentProject = (project: Project) => {
    console.log('🎯 Setting current project:', project.name);
    setCurrentProjectState(project);
    localStorage.setItem('currentProjectId', project.id);
  };

  const addProject = (project: Project) => {
    console.log('➕ Adding new project:', project.name);
    setProjects(prev => {
      const newProjects = [project, ...prev];
      
      // If this is the first project, automatically select it
      if (prev.length === 0) {
        console.log('First project added - auto-selecting');
        setCurrentProjectState(project);
        localStorage.setItem('currentProjectId', project.id);
      }
      
      return newProjects;
    });
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    console.log('✏️ Updating project:', projectId, updates);
    setProjects(prev => 
      prev.map(p => p.id === projectId ? { ...p, ...updates } : p)
    );
    
    // Update current project if it's the one being updated
    if (currentProject?.id === projectId) {
      setCurrentProjectState(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const removeProject = (projectId: string) => {
    console.log('🗑️ Removing project:', projectId);
    setProjects(prev => {
      const newProjects = prev.filter(p => p.id !== projectId);
      
      // If the deleted project was the current project, select a new one
      if (currentProject?.id === projectId) {
        if (newProjects.length > 0) {
          // Select the first available project
          const newCurrentProject = newProjects[0];
          console.log('Selecting new current project:', newCurrentProject.name);
          setCurrentProjectState(newCurrentProject);
          localStorage.setItem('currentProjectId', newCurrentProject.id);
        } else {
          // No projects left
          console.log('No projects remaining');
          setCurrentProjectState(null);
          localStorage.removeItem('currentProjectId');
        }
      }
      
      return newProjects;
    });
  };

  return (
    <ProjectContext.Provider value={{
      currentProject,
      projects,
      setCurrentProject,
      addProject,
      updateProject,
      removeProject,
      loading
    }}>
      {children}
    </ProjectContext.Provider>
  );
}
