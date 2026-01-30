import { lazy } from "react";

// preload.ts
let mainScreenPromise: Promise<any> | null = null;

export const preloadMainScreen = () => {
  if (!mainScreenPromise) mainScreenPromise = import("../MainScreen");
  return mainScreenPromise;
};

export const MainScreenLazy = lazy(() => {
  return preloadMainScreen();
});
