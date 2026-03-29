import { describe, it, expect } from 'vitest';
import { addTicketToDB } from './TicketToDatabase';
import { supabase } from '../../../supabaseClient';

describe('Supabase Integration Tests', () => {
  it('should insert a ticket into the real database and verify it exists', async () => {
    const testTitle = `Test Ticket ${Date.now()}`;
    const testDescription = 'Integration test entry - kept in database intentionally';
    const testDepartment = 'Tehnic';

    console.log('Inserting ticket into real database...');
    const result = await addTicketToDB(testTitle, testDescription, testDepartment, null);

    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].title).toBe(testTitle);
    expect(result[0].status).toBe('Deschis');

    const ticketId = result[0].id;
    console.log(`Ticket inserted with ID: ${ticketId}`);

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data.title).toBe(testTitle);
    expect(data.department).toBe(testDepartment);
    console.log('Ticket verified in database:', data);
    console.log(`Ticket with ID ${ticketId} left in the database intentionally.`);
  });

  it('should insert a ticket for HR department and verify department is saved correctly', async () => {
    const testTitle = `HR Ticket ${Date.now()}`;
    const testDescription = 'HR department integration test';
    const testDepartment = 'HR';

    const result = await addTicketToDB(testTitle, testDescription, testDepartment, null);

    expect(result).not.toBeNull();
    expect(result[0].department).toBe('HR');
    expect(result[0].status).toBe('Deschis');
    console.log(`HR ticket inserted with ID: ${result[0].id}`);
  });

  it('should insert a ticket for Administrativ department', async () => {
    const testTitle = `Admin Ticket ${Date.now()}`;
    const testDescription = 'Administrativ department integration test';
    const testDepartment = 'Administrativ';

    const result = await addTicketToDB(testTitle, testDescription, testDepartment, null);

    expect(result).not.toBeNull();
    expect(result[0].department).toBe('Administrativ');
    expect(result[0].title).toBe(testTitle);
    console.log(`Admin ticket inserted with ID: ${result[0].id}`);
  });

  it('should insert multiple tickets and verify all appear in the database', async () => {
    const timestamp = Date.now();
    const tickets = [
      { title: `Bulk Ticket A ${timestamp}`, description: 'First bulk ticket', department: 'Tehnic' },
      { title: `Bulk Ticket B ${timestamp}`, description: 'Second bulk ticket', department: 'HR' },
    ];

    const results = await Promise.all(
      tickets.map((t) => addTicketToDB(t.title, t.description, t.department, null))
    );

    expect(results[0]).not.toBeNull();
    expect(results[1]).not.toBeNull();
    expect(results[0][0].title).toBe(tickets[0].title);
    expect(results[1][0].title).toBe(tickets[1].title);
    console.log(`Bulk tickets inserted: ${results[0][0].id}, ${results[1][0].id}`);
  });

  it('should verify that all tickets in the database have required fields', async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data.length).toBeGreaterThan(0);

    for (const ticket of data) {
      expect(ticket).toHaveProperty('id');
      expect(ticket).toHaveProperty('title');
      expect(ticket).toHaveProperty('description');
      expect(ticket).toHaveProperty('department');
      expect(ticket).toHaveProperty('status');
      expect(ticket).toHaveProperty('created_at');
    }

    console.log(`Verified ${data.length} most recent tickets have all required fields.`);
  });

  it('should insert a ticket with a long description', async () => {
    const longDescription = 'A'.repeat(500);
    const testTitle = `Long Desc Ticket ${Date.now()}`;

    const result = await addTicketToDB(testTitle, longDescription, 'Tehnic', null);

    expect(result).not.toBeNull();
    expect(result[0].description).toBe(longDescription);
    console.log(`Long description ticket inserted with ID: ${result[0].id}`);
  });

  it('should insert a ticket and confirm status defaults to Deschis', async () => {
    const testTitle = `Status Check Ticket ${Date.now()}`;

    const result = await addTicketToDB(testTitle, 'Checking default status', 'HR', null);

    expect(result).not.toBeNull();
    expect(result[0].status).toBe('Deschis');
    console.log(`Status verified as 'Deschis' for ticket ID: ${result[0].id}`);
  });
});
