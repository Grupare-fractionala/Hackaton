import { vi, describe, it, expect, beforeEach } from 'vitest';
import { addTicketToDB } from './TicketToDatabase';
import { supabase } from '../../../supabaseClient';

// Mock the entire supabase module
vi.mock('../../../supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [{ id: 1, title: 'Test' }], error: null })),
      })),
    })),
  },
}));

describe('addTicketToDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully add a ticket to the database', async () => {
    const title = 'Bug fix';
    const description = 'Broken printer';
    const department = 'IT';
    const userId = 'user-123';

    const result = await addTicketToDB(title, description, department, userId);

    expect(supabase.from).toHaveBeenCalledWith('tickets');
    expect(result).toEqual([{ id: 1, title: 'Test' }]);
  });

  it('should handle errors when adding a ticket', async () => {
    const errorMsg = 'DB error';
    
    // Override the mock for this specific test case
    supabase.from.mockImplementationOnce(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: null, error: { message: errorMsg } })),
      })),
    }));

    const result = await addTicketToDB('Title', 'Desc', 'Dept', 'User');

    expect(result).toBeNull();
  });
});
