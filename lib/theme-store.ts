export type Theme = "dark" | "light";

const listeners = new Set<() => void>();

export function getThemeSnapshot(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

export function getThemeServerSnapshot(): Theme {
  return "dark";
}

export function subscribeTheme(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("avla-theme", theme);
  listeners.forEach((l) => l());
}
