import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit2, ChevronDown, Plus } from 'lucide-react';
import { CreateProjectDialog } from './CreateProjectDialog';

interface Project {
  id: string;
  name: string;
  dateRange: string;
}

// Mock data - in a real app this would come from the backend
const initialProjects: Project[] = [
  { id: '1', name: 'Home Renovation Project', dateRange: '1-6-2023 - 30-9-2023' },
  { id: '2', name: 'Kitchen Remodel', dateRange: '15-10-2023 - 15-12-2023' },
  { id: '3', name: 'Bathroom Upgrade', dateRange: '1-1-2024 - 28-2-2024' },
];

export function ProjectTitleHeader() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [currentProject, setCurrentProject] = useState<Project>(projects[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentProject.name);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleSaveEdit = () => {
    const updatedProject = { ...currentProject, name: editValue };
    setCurrentProject(updatedProject);
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === currentProject.id ? updatedProject : p)
    );
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(currentProject.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleProjectSelect = (project: Project) => {
    setCurrentProject(project);
    setEditValue(project.name);
  };

  const handleAddNewProject = () => {
    setShowCreateDialog(true);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prevProjects => [...prevProjects, newProject]);
    setCurrentProject(newProject);
    setEditValue(newProject.name);
    setShowCreateDialog(false);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          {isEditing ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              className="text-3xl font-semibold tracking-tight h-auto border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          ) : (
            <h1 className="text-3xl font-semibold tracking-tight">{currentProject.name}</h1>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <ChevronDown className="h-8 w-8 text-2xl font-bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              {projects.length > 0 ? (
                <>
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => handleProjectSelect(project)}
                      className="flex flex-col items-start p-3 cursor-pointer"
                    >
                      <div className="text-2xl font-semibold tracking-tight">{project.name}</div>
                      <div className="text-sm text-muted-foreground">{project.dateRange}</div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem
                    onClick={handleAddNewProject}
                    className="flex items-center gap-2 p-3 cursor-pointer border-t"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-2xl font-semibold tracking-tight">Add new project</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={handleAddNewProject}
                  className="flex items-center gap-2 p-3 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-2xl font-semibold tracking-tight">Add new project</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="ml-4">
          <p className="text-muted-foreground leading-7">{currentProject.dateRange}</p>
        </div>
      </div>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}
