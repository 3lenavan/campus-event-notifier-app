import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEvent, approveEvent, rejectEvent, listApprovedEvents, getPendingEvents } from '../services/eventsService';
import { getLS, setLS } from '../lib/localStorage';
import { getEventPolicy } from '../lib/eventPolicy';

// Mock the dependencies
vi.mock('../lib/localStorage');
vi.mock('../lib/eventPolicy');

describe('Moderation Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  describe('Event Creation with Moderation', () => {
    it('should create approved event when moderation is off', async () => {
      const mockPolicy = {
        enabledGlobal: true,
        enabledByClub: {},
        moderationMode: 'off' as const,
        limits: {
          maxPerClubPerDay: 3,
          userCooldownMinutes: 60,
          allowImages: true,
          maxImageMB: 5,
          maxTitleLen: 100,
          maxDescLen: 500,
        },
      };

      vi.mocked(getEventPolicy).mockResolvedValue(mockPolicy);
      vi.mocked(getLS).mockResolvedValue([]);
      vi.mocked(setLS).mockResolvedValue(undefined);

      const eventInput = {
        title: 'Test Event',
        description: 'Test Description',
        clubId: 'test-club',
        dateISO: '2024-12-25T14:30:00Z',
        location: 'Test Location',
      };

      const result = await createEvent(eventInput, 'user123');

      expect(result.status).toBe('approved');
      expect(result.title).toBe('Test Event');
      expect(result.clubId).toBe('test-club');
    });

    it('should create pending event when moderation is enabled', async () => {
      const mockPolicy = {
        enabledGlobal: true,
        enabledByClub: {},
        moderationMode: 'clubModerator' as const,
        limits: {
          maxPerClubPerDay: 3,
          userCooldownMinutes: 60,
          allowImages: true,
          maxImageMB: 5,
          maxTitleLen: 100,
          maxDescLen: 500,
        },
      };

      vi.mocked(getEventPolicy).mockResolvedValue(mockPolicy);
      vi.mocked(getLS).mockResolvedValue([]);
      vi.mocked(setLS).mockResolvedValue(undefined);

      const eventInput = {
        title: 'Test Event',
        description: 'Test Description',
        clubId: 'test-club',
        dateISO: '2024-12-25T14:30:00Z',
        location: 'Test Location',
      };

      const result = await createEvent(eventInput, 'user123');

      expect(result.status).toBe('pending');
      expect(result.title).toBe('Test Event');
      expect(result.clubId).toBe('test-club');
    });
  });

  describe('Event Approval', () => {
    it('should approve pending event and make it appear in approved listings', async () => {
      const pendingEvent = {
        id: 'event-123',
        title: 'Test Event',
        description: 'Test Description',
        clubId: 'test-club',
        dateISO: '2024-12-25T14:30:00Z',
        location: 'Test Location',
        createdBy: 'user123',
        createdAt: Date.now(),
        status: 'pending' as const,
      };

      const allEvents = [pendingEvent];
      vi.mocked(getLS).mockResolvedValue(allEvents);
      vi.mocked(setLS).mockResolvedValue(undefined);

      await approveEvent('event-123');

      // Verify the event was updated
      expect(setLS).toHaveBeenCalledWith('events', [
        {
          ...pendingEvent,
          status: 'approved',
        },
      ]);
    });

    it('should throw error when approving non-existent event', async () => {
      vi.mocked(getLS).mockResolvedValue([]);

      await expect(approveEvent('non-existent')).rejects.toThrow('Event not found');
    });

    it('should make approved events appear in approved listings', async () => {
      const events = [
        {
          id: 'event-1',
          title: 'Approved Event',
          description: 'Description',
          clubId: 'test-club',
          dateISO: '2024-12-25T14:30:00Z',
          location: 'Location',
          createdBy: 'user123',
          createdAt: Date.now(),
          status: 'approved' as const,
        },
        {
          id: 'event-2',
          title: 'Pending Event',
          description: 'Description',
          clubId: 'test-club',
          dateISO: '2024-12-25T14:30:00Z',
          location: 'Location',
          createdBy: 'user123',
          createdAt: Date.now(),
          status: 'pending' as const,
        },
        {
          id: 'event-3',
          title: 'Rejected Event',
          description: 'Description',
          clubId: 'test-club',
          dateISO: '2024-12-25T14:30:00Z',
          location: 'Location',
          createdBy: 'user123',
          createdAt: Date.now(),
          status: 'rejected' as const,
        },
      ];

      vi.mocked(getLS).mockResolvedValue(events);

      const approvedEvents = await listApprovedEvents();

      expect(approvedEvents).toHaveLength(1);
      expect(approvedEvents[0].id).toBe('event-1');
      expect(approvedEvents[0].status).toBe('approved');
    });
  });

  describe('Event Rejection', () => {
    it('should reject event with moderation note', async () => {
      const pendingEvent = {
        id: 'event-123',
        title: 'Test Event',
        description: 'Test Description',
        clubId: 'test-club',
        dateISO: '2024-12-25T14:30:00Z',
        location: 'Test Location',
        createdBy: 'user123',
        createdAt: Date.now(),
        status: 'pending' as const,
      };

      const allEvents = [pendingEvent];
      vi.mocked(getLS).mockResolvedValue(allEvents);
      vi.mocked(setLS).mockResolvedValue(undefined);

      const moderationNote = 'Inappropriate content';
      await rejectEvent('event-123', moderationNote);

      // Verify the event was updated
      expect(setLS).toHaveBeenCalledWith('events', [
        {
          ...pendingEvent,
          status: 'rejected',
          moderationNote,
        },
      ]);
    });

    it('should throw error when rejecting non-existent event', async () => {
      vi.mocked(getLS).mockResolvedValue([]);

      await expect(rejectEvent('non-existent', 'Reason')).rejects.toThrow('Event not found');
    });

    it('should never show rejected events in approved listings', async () => {
      const events = [
        {
          id: 'event-1',
          title: 'Approved Event',
          description: 'Description',
          clubId: 'test-club',
          dateISO: '2024-12-25T14:30:00Z',
          location: 'Location',
          createdBy: 'user123',
          createdAt: Date.now(),
          status: 'approved' as const,
        },
        {
          id: 'event-2',
          title: 'Rejected Event',
          description: 'Description',
          clubId: 'test-club',
          dateISO: '2024-12-25T14:30:00Z',
          location: 'Location',
          createdBy: 'user123',
          createdAt: Date.now(),
          status: 'rejected' as const,
          moderationNote: 'Inappropriate content',
        },
      ];

      vi.mocked(getLS).mockResolvedValue(events);

      const approvedEvents = await listApprovedEvents();

      expect(approvedEvents).toHaveLength(1);
      expect(approvedEvents[0].id).toBe('event-1');
      expect(approvedEvents[0].status).toBe('approved');
    });
  });

  describe('Pending Events Management', () => {
    it('should get pending events for a specific club', async () => {
      const events = [
        {
          id: 'event-1',
          title: 'Pending Event 1',
          description: 'Description',
          clubId: 'club-1',
          dateISO: '2024-12-25T14:30:00Z',
          location: 'Location',
          createdBy: 'user123',
          createdAt: Date.now(),
          status: 'pending' as const,
        },
        {
          id: 'event-2',
          title: 'Pending Event 2',
          description: 'Description',
          clubId: 'club-1',
          dateISO: '2024-12-25T14:30:00Z',
          location: 'Location',
          createdBy: 'user123',
          createdAt: Date.now(),
          status: 'pending' as const,
        },
        {
          id: 'event-3',
          title: 'Approved Event',
          description: 'Description',
          clubId: 'club-1',
          dateISO: '2024-12-25T14:30:00Z',
          location: 'Location',
          createdBy: 'user123',
          createdAt: Date.now(),
          status: 'approved' as const,
        },
        {
          id: 'event-4',
          title: 'Pending Event Other Club',
          description: 'Description',
          clubId: 'club-2',
          dateISO: '2024-12-25T14:30:00Z',
          location: 'Location',
          createdBy: 'user123',
          createdAt: Date.now(),
          status: 'pending' as const,
        },
      ];

      vi.mocked(getLS).mockResolvedValue(events);

      const pendingEvents = await getPendingEvents('club-1');

      expect(pendingEvents).toHaveLength(2);
      expect(pendingEvents[0].id).toBe('event-1');
      expect(pendingEvents[1].id).toBe('event-2');
      expect(pendingEvents.every(event => event.status === 'pending')).toBe(true);
      expect(pendingEvents.every(event => event.clubId === 'club-1')).toBe(true);
    });

    it('should return empty array when no pending events for club', async () => {
      const events = [
        {
          id: 'event-1',
          title: 'Approved Event',
          description: 'Description',
          clubId: 'club-1',
          dateISO: '2024-12-25T14:30:00Z',
          location: 'Location',
          createdBy: 'user123',
          createdAt: Date.now(),
          status: 'approved' as const,
        },
      ];

      vi.mocked(getLS).mockResolvedValue(events);

      const pendingEvents = await getPendingEvents('club-1');

      expect(pendingEvents).toHaveLength(0);
    });
  });

  describe('Moderation Workflow Integration', () => {
    it('should complete full moderation workflow: create -> approve -> appear in listings', async () => {
      // Step 1: Create pending event
      const mockPolicy = {
        enabledGlobal: true,
        enabledByClub: {},
        moderationMode: 'clubModerator' as const,
        limits: {
          maxPerClubPerDay: 3,
          userCooldownMinutes: 60,
          allowImages: true,
          maxImageMB: 5,
          maxTitleLen: 100,
          maxDescLen: 500,
        },
      };

      vi.mocked(getEventPolicy).mockResolvedValue(mockPolicy);
      vi.mocked(getLS).mockResolvedValue([]);
      vi.mocked(setLS).mockResolvedValue(undefined);

      const eventInput = {
        title: 'Test Event',
        description: 'Test Description',
        clubId: 'test-club',
        dateISO: '2024-12-25T14:30:00Z',
        location: 'Test Location',
      };

      const createdEvent = await createEvent(eventInput, 'user123');
      expect(createdEvent.status).toBe('pending');

      // Step 2: Approve the event
      const allEvents = [createdEvent];
      vi.mocked(getLS).mockResolvedValue(allEvents);
      
      await approveEvent(createdEvent.id);

      // Step 3: Verify it appears in approved listings
      const updatedEvents = [{
        ...createdEvent,
        status: 'approved' as const,
      }];
      vi.mocked(getLS).mockResolvedValue(updatedEvents);

      const approvedEvents = await listApprovedEvents();
      expect(approvedEvents).toHaveLength(1);
      expect(approvedEvents[0].id).toBe(createdEvent.id);
      expect(approvedEvents[0].status).toBe('approved');
    });

    it('should complete rejection workflow: create -> reject -> never appear in listings', async () => {
      // Step 1: Create pending event
      const mockPolicy = {
        enabledGlobal: true,
        enabledByClub: {},
        moderationMode: 'clubModerator' as const,
        limits: {
          maxPerClubPerDay: 3,
          userCooldownMinutes: 60,
          allowImages: true,
          maxImageMB: 5,
          maxTitleLen: 100,
          maxDescLen: 500,
        },
      };

      vi.mocked(getEventPolicy).mockResolvedValue(mockPolicy);
      vi.mocked(getLS).mockResolvedValue([]);
      vi.mocked(setLS).mockResolvedValue(undefined);

      const eventInput = {
        title: 'Test Event',
        description: 'Test Description',
        clubId: 'test-club',
        dateISO: '2024-12-25T14:30:00Z',
        location: 'Test Location',
      };

      const createdEvent = await createEvent(eventInput, 'user123');
      expect(createdEvent.status).toBe('pending');

      // Step 2: Reject the event
      const allEvents = [createdEvent];
      vi.mocked(getLS).mockResolvedValue(allEvents);
      
      const moderationNote = 'Inappropriate content';
      await rejectEvent(createdEvent.id, moderationNote);

      // Step 3: Verify it never appears in approved listings
      const updatedEvents = [{
        ...createdEvent,
        status: 'rejected' as const,
        moderationNote,
      }];
      vi.mocked(getLS).mockResolvedValue(updatedEvents);

      const approvedEvents = await listApprovedEvents();
      expect(approvedEvents).toHaveLength(0);
    });
  });
});
