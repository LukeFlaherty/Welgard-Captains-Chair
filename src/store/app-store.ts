import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

interface AppState {
  theme: "light" | "dark" | "system";
  sidebarOpen: boolean;
  setTheme: (theme: AppState["theme"]) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        theme: "system",
        sidebarOpen: true,
        setTheme: (theme) => set({ theme }),
        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      }),
      { name: "app-store" }
    ),
    { name: "AppStore" }
  )
);
