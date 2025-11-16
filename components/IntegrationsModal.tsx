"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

type Props = {
  open: boolean;
  onClose(): void;
};

type ResultState = { status: "success" | "error"; message: string } | null;

export default function IntegrationsModal({ open, onClose }: Props) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [gmailUser, setGmailUser] = useState("");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [rememberSender, setRememberSender] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<ResultState>(null);

  const SENDER_STORAGE_KEY = "focusone_gmail_sender";

  useEffect(() => {
    if (!open) return;
    try {
      const raw = window.localStorage.getItem(SENDER_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { gmailUser?: string; fromEmail?: string };
      setGmailUser(saved.gmailUser ?? "");
      setFromEmail(saved.fromEmail ?? "");
      setRememberSender(true);
    } catch {
      /* ignore */
    }
  }, [open]);

  useEffect(() => {
    if (!rememberSender) {
      window.localStorage.removeItem(SENDER_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      SENDER_STORAGE_KEY,
      JSON.stringify({ gmailUser: gmailUser.trim(), fromEmail: fromEmail.trim() })
    );
  }, [rememberSender, gmailUser, fromEmail]);

  useEffect(() => {
    if (!testResult) return;
    const timer = window.setTimeout(() => setTestResult(null), 5000);
    return () => window.clearTimeout(timer);
  }, [testResult]);

  const sendTestReminder = async () => {
    if (!testEmail.trim()) {
      setTestResult({ status: "error", message: "Add an email address first." });
      return;
    }
    setSendingTest(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/notifications/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail.trim(),
          gmailUser: gmailUser.trim() || undefined,
          gmailAppPassword: gmailAppPassword.trim() || undefined,
          fromEmail: fromEmail.trim() || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to send the reminder.");
      }
      setTestResult({ status: "success", message: payload.message ?? `Reminder sent to ${testEmail.trim()}` });
    } catch (error) {
      setTestResult({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to send the reminder.",
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Notifications & integrations">
      <div className="integrations">
        <section className="integrations__section">
          <header>
            <h4>Email reminders</h4>
            <p>We will email you when goals drift or wrap up. Toggle the preview state below.</p>
          </header>
          <label className="integrations__toggle">
            <input type="checkbox" checked={emailAlerts} onChange={() => setEmailAlerts((prev) => !prev)} />
            <span>Overdue goal alerts</span>
          </label>
          <label className="integrations__toggle">
            <input type="checkbox" checked={weeklyDigest} onChange={() => setWeeklyDigest((prev) => !prev)} />
            <span>Monday weekly digest</span>
          </label>
        </section>

        <section className="integrations__section">
          <header>
            <h4>Google reminders</h4>
            <p>Use a Gmail account (app password) to email overdue goal nudges directly from Focus.One.</p>
          </header>
          <label className="integrations__field">
            <span>Send test to</span>
            <input
              type="email"
              className="field"
              placeholder="you@example.com"
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
            />
          </label>
          <div className="integrations__grid">
            <label className="integrations__field">
              <span>Gmail user</span>
              <input
                type="email"
                className="field"
                placeholder="your.gmail@gmail.com"
                value={gmailUser}
                onChange={(event) => setGmailUser(event.target.value)}
              />
            </label>
            <label className="integrations__field">
              <span>App password</span>
              <input
                type="password"
                className="field"
                placeholder="16-character Google app password"
                value={gmailAppPassword}
                onChange={(event) => setGmailAppPassword(event.target.value)}
              />
            </label>
          </div>
          <label className="integrations__field">
            <span>Send from (optional)</span>
            <input
              type="email"
              className="field"
              placeholder="alerts@focus.one"
              value={fromEmail}
              onChange={(event) => setFromEmail(event.target.value)}
            />
          </label>
          <label className="integrations__toggle">
            <input
              type="checkbox"
              checked={rememberSender}
              onChange={() => setRememberSender((prev) => !prev)}
            />
            <span>Remember Gmail user/from (this device only)</span>
          </label>
          <p className="integrations__hint">
            Use a Google <em>app password</em> (Account ➜ Security ➜ App Passwords). It is never stored or sent anywhere
            else—only this one request.
          </p>
          <div className="integrations__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={sendTestReminder}
              disabled={sendingTest}
            >
              {sendingTest ? "Sending…" : "Send test reminder"}
            </button>
          </div>
          {testResult && (
            <div
              role="status"
              aria-live="assertive"
              className={[
                "integrations__toast",
                testResult.status === "error" ? "is-error" : "is-success",
              ].join(" ")}
            >
              {testResult.message}
            </div>
          )}
          <p className="integrations__hint">
            Optionally define <code>GMAIL_USER</code>, <code>GMAIL_APP_PASSWORD</code>, and <code>NOTIFICATIONS_FROM_EMAIL</code>{" "}
            in <code>.env.local</code> to avoid entering credentials here. Leaving everything blank falls back to{" "}
            <code>NOTIFICATIONS_TEST_RECIPIENT</code>.
          </p>
        </section>

        <section className="integrations__section">
          <header>
            <h4>Calendar sync</h4>
            <p>Connect Google Calendar to map goal milestones to events.</p>
          </header>
          <button
            type="button"
            className={["btn", "integrations__connect", calendarConnected ? "is-connected" : ""].join(" ")}
            onClick={() => setCalendarConnected((prev) => !prev)}
          >
            {calendarConnected ? "Disconnect Google Calendar" : "Connect Google Calendar"}
          </button>
          <p className="integrations__hint">Other calendar providers (Outlook, iCloud) are on the roadmap.</p>
        </section>

        <section className="integrations__section">
          <header>
            <h4>Multi-user access</h4>
            <p>Workspace accounts with Google sign-in and team sharing launch later.</p>
          </header>
          <button type="button" className="btn">
            Enable Google sign-in (coming soon)
          </button>
        </section>
      </div>
    </Modal>
  );
}

