import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createTicket, getTickets, respondToTicket } from './ticketApi';
import { supabase } from '@/supabaseClient';

// Mock Supabase
const mockOrder = vi.fn(() => Promise.resolve({ data: [], error: null }));
const mockEq = vi.fn(() => ({
  select: vi.fn(() => Promise.resolve({ data: [], error: null })),
}));
const mockSelect = vi.fn(() => ({
  order: mockOrder,
}));

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      update: vi.fn(() => ({
        eq: mockEq,
      })),
    })),
  },
}));

// Mock addTicketToDB
vi.mock('./TicketToDatabase', () => ({
  addTicketToDB: vi.fn(() => Promise.resolve([{ id: 'supabase-id' }])),
}));

describe('ticketApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTickets', () => {
    it('should fetch tickets from Supabase', async () => {
      const mockTickets = [{ id: 1, title: 'Supabase Ticket' }];
      mockOrder.mockResolvedValueOnce({ data: mockTickets, error: null });

      const result = await getTickets();

      expect(result).toEqual(mockTickets);
      expect(supabase.from).toHaveBeenCalledWith('tickets');
    });

    it('should throw if Supabase fetch fails', async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: new Error('Fetch failed') });

      await expect(getTickets()).rejects.toThrow('Fetch failed');
    });
  });

  describe('createTicket', () => {
    it('should use Supabase', async () => {
      const ticketData = { subject: 'Test', description: 'Test desc', category: 'Tehnic' };
      const result = await createTicket(ticketData);

      expect(result).toEqual({ id: 'supabase-id' });
    });

    it('should throw when Supabase fails', async () => {
      const { addTicketToDB } = await import('./TicketToDatabase');
      addTicketToDB.mockResolvedValueOnce(null);

      const ticketData = { subject: 'Test', description: 'Test desc', category: 'Tehnic' };
      await expect(createTicket(ticketData)).rejects.toThrow('Failed to create ticket in Supabase');
    });
  });

  describe('respondToTicket', () => {
    it('should update ticket in Supabase', async () => {
      const mockUpdatedTicket = { id: 'T1', status: 'In lucru' };
      mockEq.mockReturnValueOnce({
        select: vi.fn(() => Promise.resolve({ data: [mockUpdatedTicket], error: null })),
      });

      const payload = { ticketId: 'T1', action: 'take', message: 'Taking it' };
      const result = await respondToTicket(payload);

      expect(result).toEqual(mockUpdatedTicket);
      expect(supabase.from).toHaveBeenCalledWith('tickets');
    });

    it('should throw if Supabase update fails', async () => {
      mockEq.mockReturnValueOnce({
        select: vi.fn(() => Promise.resolve({ data: null, error: new Error('Update failed') })),
      });

      const payload = { ticketId: 'T1', action: 'take' };
      await expect(respondToTicket(payload)).rejects.toThrow('Update failed');
    });
  });
});
