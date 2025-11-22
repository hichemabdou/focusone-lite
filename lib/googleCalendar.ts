import { google } from "googleapis";

export const getGoogleCalendarClient = (accessToken: string) => {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.calendar({ version: "v3", auth });
};

export type GoogleCalendarEvent = {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    description?: string;
    htmlLink?: string;
};

export const listEvents = async (
    accessToken: string,
    timeMin: string,
    timeMax: string
): Promise<GoogleCalendarEvent[]> => {
    try {
        const calendar = getGoogleCalendarClient(accessToken);
        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: "startTime",
        });
        return (response.data.items as GoogleCalendarEvent[]) || [];
    } catch (error) {
        console.error("Error listing calendar events:", error);
        return [];
    }
};

export const createEvent = async (
    accessToken: string,
    event: {
        summary: string;
        description?: string;
        start: { dateTime?: string; date?: string };
        end: { dateTime?: string; date?: string };
    }
): Promise<GoogleCalendarEvent | null> => {
    try {
        const calendar = getGoogleCalendarClient(accessToken);
        const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: event,
        });
        return response.data as GoogleCalendarEvent;
    } catch (error) {
        console.error("Error creating calendar event:", error);
        return null;
    }
};

export const updateEvent = async (
    accessToken: string,
    eventId: string,
    event: {
        summary?: string;
        description?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
    }
): Promise<GoogleCalendarEvent | null> => {
    try {
        const calendar = getGoogleCalendarClient(accessToken);
        const response = await calendar.events.patch({
            calendarId: "primary",
            eventId,
            requestBody: event,
        });
        return response.data as GoogleCalendarEvent;
    } catch (error) {
        console.error("Error updating calendar event:", error);
        return null;
    }
};

export const deleteEvent = async (accessToken: string, eventId: string): Promise<boolean> => {
    try {
        const calendar = getGoogleCalendarClient(accessToken);
        await calendar.events.delete({
            calendarId: "primary",
            eventId,
        });
        return true;
    } catch (error) {
        console.error("Error deleting calendar event:", error);
        return false;
    }
};
