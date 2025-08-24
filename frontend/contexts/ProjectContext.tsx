import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useBackend } from '../components/AuthenticatedBackend';
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

// Enhanced error analysis for project operations
function analyzeProjectError(error: any, operation: string): string {
  console.group(`🔍 Project Error Analysis - ${operation}`);
  console.log('Raw error:', error);
  console.log('Error type:', typeof error);
  console.log('Error constructor:', error?.constructor?.name);
  
  // Network-level errors
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    console.log('❌ NETWORK ERROR: Cannot reach backend for project operations');
    console.groupEnd();
    return `Backend service is not available. Please ensure the backend is running.`;
  }

  // HTTP status errors
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    console.log(`❌ HTTP ERROR: Status ${status} during ${operation}`);
    console.groupEnd();
    return `Server error (${status}) during ${operation}. Please try again.`;
  }

  // Timeout errors
  if (error.message.includes('timeout')) {
    console.log('❌ TIMEOUT ERROR: Project operation timed out');
    console.groupEnd();
    return `Request timed out during ${operation}. Please try again.`;
  }

  // Authentication errors
  if (error.message.includes('Unauthorized') || error.message.includes('401')) {
    console.log('❌ AUTH ERROR: Unauthorized project operation');
    console.groupEnd();
    return `Authentication required for ${operation}. Please log in again.`;
  }

  console.log('❌ UNKNOWN ERROR during project operation');
  console.groupEnd();
  return `An error occurred during ${operation}. Please try again.`;
}

// Check if backend is available for projects
async function checkProjectBackendHealth(backend: any): Promise<boolean> {
  try {
    console.log('🏥 Checking project backend health...');
    
    // Try to make a simple request to check if backend is available
    await backend.projects.list();
    console.log('✅ Project backend is responding');
    return true;
  } catch (error) {
    // If we get a proper API error (like auth error), the backend is running
    if (error && typeof error === 'object' && 'message' in error && !error.message.includes('Failed to fetch')) {
      console.log('✅ Project backend is responding (got API error as expected)');
      return true;
    }
    
    // If we get network errors, the backend is not available
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log('❌ Project backend health check failed - service not available');
      return false;
    }
    
    // Other errors might indicate the backend is running but has issues
    console.log('⚠️ Project backend health check uncertain:', error);
    return true; // Assume it's available and let the actual calls handle errors
  }
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
        
        // Check if backend is available first
        const isBackendAvailable = await checkProjectBackendHealth(backend);
        if (!isBackendAvailable) {
          console.log('❌ Backend not available for projects - using empty state');
          setProjects([]);
          setCurrentProjectState(null);
          localStorage.removeItem('currentProjectId');
          console.groupEnd();
          return;
        }
        
        const startTime = performance.now();
        const response = await backend.projects.list();
        const endTime = performance.now();
        
        console.log(`✅ Projects loaded in ${(endTime - startTime).toFixed(2)}ms`);
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
        
        const errorMessage = analyzeProjectError(error, 'project_loading');
        console.log('Analyzed error:', errorMessage);
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
