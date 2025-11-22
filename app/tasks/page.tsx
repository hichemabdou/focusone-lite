"use client";

import { useState } from "react";

type Task = {
    id: string;
    title: string;
    completed: boolean;
    priority: "high" | "medium" | "low";
    category: string;
    dueTime?: string;
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([
        { id: "1", title: "Review Q4 financial reports", completed: false, priority: "high", category: "Finance", dueTime: "10:00 AM" },
        { id: "2", title: "Weekly team standup", completed: true, priority: "medium", category: "Work", dueTime: "11:00 AM" },
        { id: "3", title: "Gym workout", completed: false, priority: "medium", category: "Health", dueTime: "6:00 PM" },
        { id: "4", title: "Spanish lesson - Duolingo", completed: true, priority: "low", category: "Personal Dev", dueTime: "7:30 PM" },
        { id: "5", title: "Prepare presentation slides", completed: false, priority: "high", category: "Work" },
        { id: "6", title: "Grocery shopping", completed: false, priority: "low", category: "Lifestyle" },
    ]);

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    const completedCount = tasks.filter((t) => t.completed).length;
    const totalCount = tasks.length;
    const completionRate = Math.round((completedCount / totalCount) * 100);

    const toggleTask = (id: string) => {
        setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    };

    const getPriorityColor = (priority: string) => {
        if (priority === "high") return "#ef4444";
        if (priority === "medium") return "#f59e0b";
        return "#64748b";
    };

    return (
        <main className="workspace">
            <header className="control-bar">
                <div className="control-bar__left">
                    <h1 className="control-bar__title">Daily Tasks</h1>
                    <p className="control-bar__subtitle">{today}</p>
                </div>
                <div className="control-bar__right">
                    <button className="btn btn--primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Task
                    </button>
                </div>
            </header>

            <div className="tasks-container">
                {/* Progress Overview */}
                <div className="tasks-overview">
                    <div className="tasks-stat">
                        <div className="tasks-stat-value">{completedCount}/{totalCount}</div>
                        <div className="tasks-stat-label">Tasks Completed</div>
                    </div>
                    <div className="tasks-stat">
                        <div className="tasks-stat-value">{completionRate}%</div>
                        <div className="tasks-stat-label">Completion Rate</div>
                    </div>
                    <div className="tasks-stat">
                        <div className="tasks-stat-value">{tasks.filter((t) => t.priority === "high" && !t.completed).length}</div>
                        <div className="tasks-stat-label">High Priority</div>
                    </div>
                </div>

                {/* Task List */}
                <div className="tasks-list">
                    <div className="tasks-list-header">
                        <h3>Today's Tasks</h3>
                        <div className="tasks-filters">
                            <button className="tasks-filter tasks-filter--active">All</button>
                            <button className="tasks-filter">Active</button>
                            <button className="tasks-filter">Completed</button>
                        </div>
                    </div>

                    <div className="tasks-items">
                        {tasks.map((task) => (
                            <div key={task.id} className={`task-item ${task.completed ? "task-item--completed" : ""}`}>
                                <button
                                    className="task-checkbox"
                                    onClick={() => toggleTask(task.id)}
                                >
                                    {task.completed && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </button>
                                <div className="task-content">
                                    <div className="task-title">{task.title}</div>
                                    <div className="task-meta">
                                        <span className="task-category">{task.category}</span>
                                        {task.dueTime && (
                                            <>
                                                <span className="task-separator">•</span>
                                                <span className="task-time">{task.dueTime}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="task-priority"
                                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                                    title={`${task.priority} priority`}
                                ></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Add */}
                <div className="tasks-quick-add">
                    <input
                        type="text"
                        placeholder="Quick add a task..."
                        className="tasks-quick-input"
                    />
                </div>
            </div>
        </main>
    );
}
