"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useCustomization } from "./CustomizationContext";
import Modal from "./Modal";
import { CUSTOMIZATION_PANEL_EVENT, CustomizationFocus } from "./customizationEvents";

type Prefs = {
  weeklyDigest: boolean;
  overdueEmails: boolean;
  calendarSync: boolean;
};

const PREFS_STORAGE = "focusone_custom_prefs_v1";

type CustomizationPanelProps = {
  renderTrigger?: (openPanel: () => void) => ReactNode;
};

export default function CustomizationPanel({ renderTrigger }: CustomizationPanelProps) {
  const [open, setOpen] = useState(false);
  const [focusSection, setFocusSection] = useState<CustomizationFocus | null>(null);
  const {
    categories,
    priorities,
    statuses,
    addCategory,
    updateCategory,
    deleteCategory,
    updatePriority,
    updateStatus,
    resetToDefaults,
  } = useCustomization();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");
  const [prefs, setPrefs] = useState<Prefs>(() => {
    if (typeof window === "undefined") {
      return { weeklyDigest: true, overdueEmails: true, calendarSync: false };
    }
    try {
      const stored = window.localStorage.getItem(PREFS_STORAGE);
      if (!stored) return { weeklyDigest: true, overdueEmails: true, calendarSync: false };
      const parsed = JSON.parse(stored) as Prefs;
      return {
        weeklyDigest: Boolean(parsed.weeklyDigest),
        overdueEmails: Boolean(parsed.overdueEmails),
        calendarSync: Boolean(parsed.calendarSync),
      };
    } catch {
      return { weeklyDigest: true, overdueEmails: true, calendarSync: false };
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFS_STORAGE, JSON.stringify(prefs));
    } catch {}
  }, [prefs]);

  const categoriesRef = useRef<HTMLDivElement>(null);
  const prioritiesRef = useRef<HTMLDivElement>(null);
  const statusesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ focus?: CustomizationFocus }>).detail;
      const focus = detail?.focus ?? null;
      setFocusSection(focus);
      setOpen(true);
      if (focus) {
        requestAnimationFrame(() => {
          const target =
            focus === "categories" ? categoriesRef.current : focus === "priorities" ? prioritiesRef.current : statusesRef.current;
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };
    window.addEventListener(CUSTOMIZATION_PANEL_EVENT, handleOpen as EventListener);
    return () => window.removeEventListener(CUSTOMIZATION_PANEL_EVENT, handleOpen as EventListener);
  }, []);

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName("");
      setNewCategoryColor("#3b82f6");
    }
  };

  const togglePref = (key: keyof Prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderDefaultTrigger = () => (
    <button
      type="button"
      className="btn btn--icon"
      onClick={() => setOpen(true)}
      aria-label="Customize colors and categories"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </button>
  );

  const trigger = renderTrigger ? renderTrigger(() => setOpen(true)) : renderDefaultTrigger();

  return (
    <>
      {trigger}

      <Modal open={open} onClose={() => setOpen(false)} title="Customize Categories & Colors">
        <div className="customization-panel">
          {/* Categories */}
          <section
            ref={categoriesRef}
            className={["customization-section", focusSection === "categories" ? "customization-section--focus" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            <h4 className="customization-section__title">Categories</h4>
            <p className="customization-section__hint">Add, remove, or customize category colors</p>
            
            <div className="customization-list">
              {categories.map((cat) => (
                <div key={cat.id} className="customization-item">
                  <input
                    type="text"
                    className="field customization-item__name"
                    value={cat.name}
                    onChange={(e) => updateCategory(cat.id, { name: e.target.value.toUpperCase() })}
                  />
                  <input
                    type="color"
                    className="customization-item__color"
                    value={cat.color}
                    onChange={(e) => updateCategory(cat.id, { color: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() => deleteCategory(cat.id)}
                    disabled={categories.length <= 1}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <div className="customization-add">
              <input
                type="text"
                className="field"
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <input
                type="color"
                className="customization-item__color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
              />
              <button type="button" className="btn btn--primary" onClick={handleAddCategory}>
                Add
              </button>
            </div>
          </section>

          {/* Priorities */}
          <section
            ref={prioritiesRef}
            className={["customization-section", focusSection === "priorities" ? "customization-section--focus" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            <h4 className="customization-section__title">Priorities</h4>
            <p className="customization-section__hint">Customize priority colors</p>
            
            <div className="customization-list">
              {priorities.map((pri) => (
                <div key={pri.id} className="customization-item">
                  <span className="customization-item__label">
                    {pri.name.charAt(0).toUpperCase() + pri.name.slice(1)}
                  </span>
                  <input
                    type="color"
                    className="customization-item__color"
                    value={pri.color}
                    onChange={(e) => updatePriority(pri.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Statuses */}
          <section
            ref={statusesRef}
            className={["customization-section", focusSection === "statuses" ? "customization-section--focus" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            <h4 className="customization-section__title">Statuses</h4>
            <p className="customization-section__hint">Customize status colors</p>
            
            <div className="customization-list">
              {statuses.map((st) => (
                <div key={st.id} className="customization-item">
                  <span className="customization-item__label">
                    {st.name === "in-progress" ? "In Progress" : st.name.charAt(0).toUpperCase() + st.name.slice(1)}
                  </span>
                  <input
                    type="color"
                    className="customization-item__color"
                    value={st.color}
                    onChange={(e) => updateStatus(st.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="customization-section">
            <h4 className="customization-section__title">Notifications & integrations</h4>
            <p className="customization-section__hint">Stubs for upcoming reminders and calendar sync.</p>
            <div className="customization-switches">
              <label>
                <input
                  type="checkbox"
                  checked={prefs.overdueEmails}
                  onChange={() => togglePref("overdueEmails")}
                />
                <span>
                  <strong>Overdue email alerts</strong>
                  <small>Get nudges when goals need attention.</small>
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={prefs.weeklyDigest}
                  onChange={() => togglePref("weeklyDigest")}
                />
                <span>
                  <strong>Weekly digest</strong>
                  <small>Summary of wins every Monday.</small>
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={prefs.calendarSync}
                  onChange={() => togglePref("calendarSync")}
                />
                <span>
                  <strong>Calendar sync</strong>
                  <small>Prep for Google Calendar integration.</small>
                </span>
              </label>
            </div>
          </section>

          <div className="customization-actions">
            <button type="button" className="btn" onClick={resetToDefaults}>
              Reset to Defaults
            </button>
            <button type="button" className="btn btn--primary" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

