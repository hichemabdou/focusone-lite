"use client";

import { useEffect } from "react";

export default function KeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + K: Focus search
      if (modKey && event.key === "k") {
        event.preventDefault();
        const searchInput = document.querySelector(
          '.workspace__search input[type="text"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Cmd/Ctrl + N: Open goal composer
      if (modKey && event.key === "n") {
        event.preventDefault();
        const addButton = document.querySelector(
          '.workspace__panel-actions button[type="button"]'
        ) as HTMLButtonElement;
        if (addButton) {
          addButton.click();
        } else {
          // Trigger custom event for goal composer
          window.dispatchEvent(new Event("open-goal-composer"));
        }
      }

      // Cmd/Ctrl + ,: Open settings
      if (modKey && event.key === ",") {
        event.preventDefault();
        const settingsButton = document.querySelector(
          '.workspace__account-settings button[aria-label="Workspace settings"]'
        ) as HTMLButtonElement;
        if (settingsButton) {
          settingsButton.click();
        }
      }

      // Cmd/Ctrl + /: Show keyboard shortcuts help
      if (modKey && event.key === "/") {
        event.preventDefault();
        const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
        const modKeyName = isMac ? "Cmd" : "Ctrl";
        alert(
          `Keyboard Shortcuts:\n\n` +
            `${modKeyName} + K → Focus search\n` +
            `${modKeyName} + N → Create new goal\n` +
            `${modKeyName} + , → Open settings\n` +
            `${modKeyName} + / → Show this help\n` +
            `Esc → Close modals/panels`
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null; // This component doesn't render anything
}
