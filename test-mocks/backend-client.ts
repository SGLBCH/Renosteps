import { vi } from 'vitest';

// Mock backend client for frontend tests
export default {
  tasks: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteTask: vi.fn(),
    completeTask: vi.fn(),
    get: vi.fn(),
    createSubtask: vi.fn(),
    updateSubtask: vi.fn(),
    deleteSubtask: vi.fn(),
  },
};
