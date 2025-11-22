"use client";

import { useState } from "react";

type Appointment = {
    id: string;
    title: string;
    provider: string;
    date: string;
    time: string;
    type: "checkup" | "specialist" | "dental" | "vision" | "other";
    status: "upcoming" | "completed" | "cancelled";
};

export default function HealthAppointments() {
    const [appointments] = useState<Appointment[]>([
        {
            id: "1",
            title: "Annual Physical",
            provider: "Dr. Sarah Johnson",
            date: "2024-12-05",
            time: "10:00 AM",
            type: "checkup",
            status: "upcoming",
        },
        {
            id: "2",
            title: "Dental Cleaning",
            provider: "Dr. Michael Chen",
            date: "2024-11-30",
            time: "2:00 PM",
            type: "dental",
            status: "upcoming",
        },
        {
            id: "3",
            title: "Eye Exam",
            provider: "Dr. Emily Rodriguez",
            date: "2024-11-15",
            time: "11:30 AM",
            type: "vision",
            status: "completed",
        },
    ]);

    const upcomingAppointments = appointments.filter((apt) => apt.status === "upcoming");
    const completedAppointments = appointments.filter((apt) => apt.status === "completed");

    const getAppointmentIcon = (type: string) => {
        switch (type) {
            case "checkup":
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                );
            case "dental":
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                );
            case "vision":
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                );
            default:
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                );
        }
    };

    return (
        <div className="health-appointments">
            {/* Quick Stats */}
            <div className="appointments-summary">
                <div className="appointment-stat">
                    <div className="appointment-stat__value">{upcomingAppointments.length}</div>
                    <div className="appointment-stat__label">Upcoming</div>
                </div>
                <div className="appointment-stat">
                    <div className="appointment-stat__value">{completedAppointments.length}</div>
                    <div className="appointment-stat__label">This Month</div>
                </div>
                <div className="appointment-stat">
                    <div className="appointment-stat__value">2</div>
                    <div className="appointment-stat__label">Overdue Checkups</div>
                </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="appointments-section">
                <div className="appointments-header">
                    <h3>Upcoming Appointments</h3>
                    <button className="btn btn--sm btn--primary">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Schedule Appointment
                    </button>
                </div>

                {upcomingAppointments.length > 0 ? (
                    <div className="appointments-list">
                        {upcomingAppointments.map((appointment) => (
                            <div key={appointment.id} className="appointment-card">
                                <div className={`appointment-icon appointment-icon--${appointment.type}`}>
                                    {getAppointmentIcon(appointment.type)}
                                </div>
                                <div className="appointment-content">
                                    <div className="appointment-title">{appointment.title}</div>
                                    <div className="appointment-provider">{appointment.provider}</div>
                                    <div className="appointment-meta">
                                        <span className="appointment-date">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            {new Date(appointment.date).toLocaleDateString("en-US", {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                        <span className="appointment-time">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            {appointment.time}
                                        </span>
                                    </div>
                                </div>
                                <div className="appointment-actions">
                                    <button className="appointment-action">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="appointments-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <p>No upcoming appointments</p>
                        <button className="btn btn--sm btn--ghost">Schedule your first appointment</button>
                    </div>
                )}
            </div>

            {/* Health Reminders */}
            <div className="health-reminders">
                <h3>Recommended Checkups</h3>
                <div className="reminders-list">
                    <div className="reminder-item reminder-item--warning">
                        <div className="reminder-icon">⚠️</div>
                        <div className="reminder-content">
                            <div className="reminder-title">Annual Physical Overdue</div>
                            <div className="reminder-message">It's been 14 months since your last checkup</div>
                        </div>
                        <button className="btn btn--sm btn--ghost">Schedule</button>
                    </div>
                    <div className="reminder-item">
                        <div className="reminder-icon">📋</div>
                        <div className="reminder-content">
                            <div className="reminder-title">Dental Cleaning Due Soon</div>
                            <div className="reminder-message">Recommended every 6 months</div>
                        </div>
                        <button className="btn btn--sm btn--ghost">Schedule</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
