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
  budget: {
    getSummary: vi.fn(),
    createExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
    updateBudget: vi.fn(),
  },
  projects: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteProject: vi.fn(),
  },
  contractors: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteContractor: vi.fn(),
  },
};
