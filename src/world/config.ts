import { contextBridge, ipcRenderer } from "electron";

// Safe defaults so `window.desktopConfig.get()` never returns undefined,
// even before the main process has answered. The web client reads this
// (e.g. windowState / customFrame) during its very first render; if it were
// undefined the read would throw and the window would stay blank.
const DEFAULT_CONFIG: DesktopConfig = {
  firstLaunch: false,
  customFrame: true,
  minimiseToTray: true,
  startMinimisedToTray: false,
  spellchecker: true,
  hardwareAcceleration: true,
  discordRpc: true,
  windowState: { x: 0, y: 0, width: 0, height: 0, isMaximised: false },
};

let config: DesktopConfig = DEFAULT_CONFIG;

// Pull the real configuration synchronously at preload time (before any page
// script executes), falling back to defaults if the main process is not ready.
try {
  const initial = ipcRenderer.sendSync("getConfigSync") as DesktopConfig | undefined;
  if (initial) config = initial;
} catch {
  // keep DEFAULT_CONFIG
}

// Keep in sync with later updates pushed from the main process.
ipcRenderer.on("config", (_, data) => (config = data));

contextBridge.exposeInMainWorld("desktopConfig", {
  get: () => config,
  set: (config: DesktopConfig) => ipcRenderer.send("config", config),
  getAutostart() {
    return ipcRenderer.invoke("getAutostart") as Promise<boolean>;
  },
  setAutostart(value: boolean) {
    return ipcRenderer.invoke("setAutostart", value) as Promise<boolean>;
  },
});
