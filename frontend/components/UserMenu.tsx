import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from './AuthProvider';

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 hover:bg-accent">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline max-w-32 truncate">{user.email}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem disabled className="flex-col items-start">
          <div className="flex items-center gap-2 w-full">
            <User className="h-4 w-4" />
            <span className="font-medium">Account</span>
          </div>
          <span className="text-sm text-muted-foreground mt-1 truncate w-full">
            {user.email}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
