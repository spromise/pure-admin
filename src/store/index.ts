import type { App } from "vue";
import { createPinia } from "pinia";

import { useHoneypotStore } from "./modules/sm2Honeypot";

export const useHoneypotStoreHook = () => {
  return useHoneypotStore(store);
};
const store = createPinia();

export function setupStore(app: App<Element>) {
  app.use(store);
}

export { store };
