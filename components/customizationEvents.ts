export type CustomizationFocus = "categories" | "priorities" | "statuses";

export const CUSTOMIZATION_PANEL_EVENT = "focusone:open-customization-panel";

export function openCustomizationPanel(focus: CustomizationFocus) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CUSTOMIZATION_PANEL_EVENT, { detail: { focus } }));
}

