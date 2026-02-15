/**
 * reminderStorage.ts
 * 
 * LocalStorage utility for managing celestial event reminders
 */

export interface Reminder {
    eventId: string;
    eventName: string;
    eventDate: string;
    reminderSet: boolean;
    dateSet: string;
}

const STORAGE_KEY = 'celestialEventReminders';

/**
 * Get all reminders from localStorage
 */
export function getReminders(): Reminder[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch (error) {
        console.error('Error reading reminders from localStorage:', error);
        return [];
    }
}

/**
 * Save a reminder to localStorage
 */
export function saveReminder(reminder: Omit<Reminder, 'reminderSet' | 'dateSet'>): void {
    try {
        const reminders = getReminders();

        // Remove existing reminder for this event if any
        const filtered = reminders.filter(r => r.eventId !== reminder.eventId);

        // Add new reminder
        const newReminder: Reminder = {
            ...reminder,
            reminderSet: true,
            dateSet: new Date().toISOString(),
        };

        filtered.push(newReminder);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Error saving reminder to localStorage:', error);
    }
}

/**
 * Remove a reminder from localStorage
 */
export function removeReminder(eventId: string): void {
    try {
        const reminders = getReminders();
        const filtered = reminders.filter(r => r.eventId !== eventId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Error removing reminder from localStorage:', error);
    }
}

/**
 * Check if a reminder is set for an event
 */
export function isReminderSet(eventId: string): boolean {
    const reminders = getReminders();
    return reminders.some(r => r.eventId === eventId && r.reminderSet);
}

/**
 * Get count of active reminders
 */
export function getReminderCount(): number {
    return getReminders().filter(r => r.reminderSet).length;
}
