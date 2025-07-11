import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("Speakeasy-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("Speakeasy-theme", theme);
    set({ theme });
  },
}));
