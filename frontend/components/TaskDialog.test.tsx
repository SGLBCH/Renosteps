import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskDialog } from './TaskDialog';
import type { Task } from './TaskCardsView';

// Mock the backend client
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock('~backend/client', () => ({
  default: {
    tasks: {
      create: mockCreate,
      update: mockUpdate,
    },
  },
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock date-fns format function
vi.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    if (formatStr === 'PPP') {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return date.toString();
  },
}));

const mockTask: Task = {
  id: 'task-1',
  title: 'Existing Task',
  description: 'Existing description',
  category: 'kitchen',
  priority: 'high',
  status: 'in-progress',
  progress: 75,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('TaskDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ task: mockTask });
    mockUpdate.mockResolvedValue({ task: mockTask });
  });

  it('renders create dialog when no task is provided', () => {
    render(<TaskDialog />);

    const trigger = screen.getByRole('button', { name: /add task/i });
    expect(trigger).toBeInTheDocument();
  });

  it('renders edit dialog when task is provided', () => {
    render(<TaskDialog task={mockTask} />);

    const trigger = screen.getByRole('button');
    expect(trigger).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', async () => {
    render(<TaskDialog />);

    const trigger = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });
  });

  it('populates form with task data when editing', async () => {
    render(<TaskDialog task={mockTask} />);

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
    });
  });

  it('creates new task when form is submitted', async () => {
    const onTaskCreated = vi.fn();
    render(<TaskDialog onTaskCreated={onTaskCreated} />);

    const trigger = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    // Fill in required fields
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        title: 'New Task',
        description: undefined,
        category: 'kitchen',
        priority: 'medium',
        status: 'not-started',
        progress: 0,
        startDate: undefined,
        endDate: undefined,
      });
    });

    expect(onTaskCreated).toHaveBeenCalledWith(mockTask);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Task created',
      description: 'The task has been successfully created.',
    });
  });

  it('updates existing task when form is submitted', async () => {
    const onTaskSaved = vi.fn();
    render(<TaskDialog task={mockTask} onTaskSaved={onTaskSaved} />);

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue('Existing Task');
    fireEvent.change(titleInput, { target: { value: 'Updated Task' } });

    const submitButton = screen.getByRole('button', { name: /update task/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        id: 'task-1',
        title: 'Updated Task',
        description: 'Existing description',
        category: 'kitchen',
        priority: 'high',
        status: 'in-progress',
        progress: 75,
        startDate: mockTask.startDate,
        endDate: mockTask.endDate,
      });
    });

    expect(onTaskSaved).toHaveBeenCalledWith(mockTask);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Task updated',
      description: 'The task has been successfully updated.',
    });
  });

  it('validates required fields', async () => {
    render(<TaskDialog />);

    const trigger = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /create task/i });
    expect(submitButton).toBeDisabled();

    // Fill in title to enable submit
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Valid Title' } });

    expect(submitButton).not.toBeDisabled();
  });

  it('updates progress slider', async () => {
    render(<TaskDialog />);

    const trigger = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Progress: 0%')).toBeInTheDocument();
    });

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '75' } });

    expect(screen.getByText('Progress: 75%')).toBeInTheDocument();
  });

  it('handles category selection', async () => {
    render(<TaskDialog />);

    const trigger = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    // The category select should have kitchen as default
    expect(screen.getByDisplayValue('Kitchen')).toBeInTheDocument();
  });

  it('handles priority selection', async () => {
    render(<TaskDialog />);

    const trigger = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    // The priority select should have medium as default
    expect(screen.getByDisplayValue('Medium')).toBeInTheDocument();
  });

  it('handles status selection', async () => {
    render(<TaskDialog />);

    const trigger = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    // The status select should have not-started as default
    expect(screen.getByDisplayValue('Not Started')).toBeInTheDocument();
  });

  it('closes dialog on cancel', async () => {
    render(<TaskDialog />);

    const trigger = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockCreate.mockRejectedValue(new Error('API Error'));

    render(<TaskDialog />);

    const trigger = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to save the task. Please try again.',
        variant: 'destructive',
      });
    });
  });
});
