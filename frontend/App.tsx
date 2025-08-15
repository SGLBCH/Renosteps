import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProjectProvider } from './contexts/ProjectContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppInner() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
