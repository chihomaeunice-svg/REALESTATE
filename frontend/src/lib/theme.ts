const THEMES = ["meridian", "terracotta", "coastal", "forest", "monochrome"] as const;

export type ThemeName = (typeof THEMES)[number];

const requested = import.meta.env.VITE_THEME;

export const THEME: ThemeName = (THEMES as readonly string[]).includes(requested ?? "")
  ? (requested as ThemeName)
  : "meridian";

export const LISTING_GRID_CLASS = {
  meridian: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
  terracotta: "grid grid-cols-1 gap-6 lg:grid-cols-2",
  coastal: "grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3",
  forest: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
  monochrome: "flex flex-col",
}[THEME];
