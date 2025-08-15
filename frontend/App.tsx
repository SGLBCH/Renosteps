import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProjectProvider } from './contexts/ProjectContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ProjectProvider>
      <ErrorBoundary>
        <div className="h-screen overflow-hidden text-foreground" style={{ backgroundColor: '#F9F7F3' }}>
          <div className="flex h-full">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block flex-shrink-0">
              <ErrorBoundary>
                <Sidebar 
                  collapsed={sidebarCollapsed} 
                  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
                />
              </ErrorBoundary>
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden fixed top-4 left-4 z-50"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <ErrorBoundary>
                  <Sidebar collapsed={false} onToggleCollapse={() => {}} />
                </ErrorBoundary>
              </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <MainContent />
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </ProjectProvider>
  );
}
