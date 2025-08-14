import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskCard } from './TaskCard';
import type { Task } from './TaskCardsView';

// Mock the backend client
vi.mock('~backend/client', () => ({
  default: {
    tasks: {
      deleteTask: vi.fn(),
      completeTask: vi.fn(),
      createSubtask: vi.fn(),
      updateSubtask: vi.fn(),
      deleteSubtask: vi.fn(),
    },
  },
}));

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the TaskDialog component
vi.mock('./TaskDialog', () => ({
  TaskDialog: ({ task, onTaskSaved }: any) => (
    <button onClick={() => onTaskSaved?.(task)}>Edit Task</button>
  ),
}));

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test description',
  category: 'kitchen',
  priority: 'high',
  status: 'in-progress',
  progress: 50,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  subtasks: [
    {
      id: 'subtask-1',
      taskId: 'task-1',
      title: 'Test Subtask 1',
      completed: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'subtask-2',
      taskId: 'task-1',
      title: 'Test Subtask 2',
      completed: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
};

const mockProps = {
  task: mockTask,
  onTaskUpdated: vi.fn(),
  onTaskDeleted: vi.fn(),
  onSubtaskUpdated: vi.fn(),
  onSubtaskAdded: vi.fn(),
  onSubtaskDeleted: vi.fn(),
  onError: vi.fn(),
};

describe('TaskCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task information correctly', () => {
    render(<TaskCard {...mockProps} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('kitchen')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('displays subtasks correctly', () => {
    render(<TaskCard {...mockProps} />);

    expect(screen.getByText('Subtasks (1/2)')).toBeInTheDocument();
    expect(screen.getByText('Test Subtask 1')).toBeInTheDocument();
    expect(screen.getByText('Test Subtask 2')).toBeInTheDocument();
  });

  it('shows completed subtasks with strikethrough', () => {
    render(<TaskCard {...mockProps} />);

    const completedSubtask = screen.getByText('Test Subtask 2');
    expect(completedSubtask).toHaveClass('line-through');
  });

  it('displays priority badge with correct variant', () => {
    render(<TaskCard {...mockProps} />);

    const priorityBadge = screen.getByText('High');
    expect(priorityBadge).toBeInTheDocument();
  });

  it('shows progress bar with correct value', () => {
    render(<TaskCard {...mockProps} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('displays formatted dates', () => {
    render(<TaskCard {...mockProps} />);

    expect(screen.getByText(/Jan 1, 2024 - Jan 31, 2024/)).toBeInTheDocument();
  });

  it('calls onTaskDeleted when delete button is clicked', async () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<TaskCard {...mockProps} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockProps.onTaskDeleted).toHaveBeenCalledWith('task-1');
    });

    confirmSpy.mockRestore();
  });

  it('does not delete task when confirmation is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<TaskCard {...mockProps} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockProps.onTaskDeleted).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('calls onTaskUpdated when complete button is clicked', async () => {
    render(<TaskCard {...mockProps} />);

    const completeButton = screen.getByRole('button', { title: 'Mark as completed' });
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockProps.onTaskUpdated).toHaveBeenCalledWith('task-1', {
        status: 'completed',
        progress: 100,
      });
    });
  });

  it('does not show complete button for completed tasks', () => {
    const completedTask = { ...mockTask, status: 'completed' as const };
    render(<TaskCard {...mockProps} task={completedTask} />);

    const completeButton = screen.queryByRole('button', { title: 'Mark as completed' });
    expect(completeButton).not.toBeInTheDocument();
  });

  it('toggles subtask completion when checkbox is clicked', async () => {
    render(<TaskCard {...mockProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    const firstSubtaskCheckbox = checkboxes[0];

    fireEvent.click(firstSubtaskCheckbox);

    await waitFor(() => {
      expect(mockProps.onSubtaskUpdated).toHaveBeenCalledWith('task-1', 'subtask-1', {
        completed: true,
      });
    });
  });

  it('shows add subtask form when add button is clicked', async () => {
    render(<TaskCard {...mockProps} />);

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter subtask title')).toBeInTheDocument();
    });
  });

  it('handles task without subtasks', () => {
    const taskWithoutSubtasks = { ...mockTask, subtasks: [] };
    render(<TaskCard {...mockProps} task={taskWithoutSubtasks} />);

    expect(screen.getByText('Subtasks (0/0)')).toBeInTheDocument();
  });

  it('handles task without description', () => {
    const taskWithoutDescription = { ...mockTask, description: undefined };
    render(<TaskCard {...mockProps} task={taskWithoutDescription} />);

    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });

  it('handles task without dates', () => {
    const taskWithoutDates = { ...mockTask, startDate: undefined, endDate: undefined };
    render(<TaskCard {...mockProps} task={taskWithoutDates} />);

    expect(screen.queryByText(/Jan 1, 2024/)).not.toBeInTheDocument();
  });

  it('shows expand/collapse for many subtasks', () => {
    const taskWithManySubtasks = {
      ...mockTask,
      subtasks: [
        ...mockTask.subtasks!,
        {
          id: 'subtask-3',
          taskId: 'task-1',
          title: 'Test Subtask 3',
          completed: false,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    };

    render(<TaskCard {...mockProps} task={taskWithManySubtasks} />);

    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });
});
