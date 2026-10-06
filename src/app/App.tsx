import { PersonaProvider } from "./context/PersonaContext";
import { SessionProvider } from "./context/SessionContext";
import { WindowManagerProvider } from "./context/WindowManagerContext";
import { BiometricProvider } from "./context/BiometricContext";
import { KeyboardProvider } from "./context/KeyboardContext";
import { FrictionSettingsProvider } from "./context/FrictionSettingsContext";
import { ControlPanel } from "./components/control-panel/ControlPanel";
import { DesktopOS } from "./components/desktop/DesktopOS";
import { FrictionOverlay } from "./components/friction-app/FrictionOverlay";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

/**
 * APP CONTENT
 * 
 * Main layout: left control panel + right fake OS.
 * Screen state is now controlled via the Screen State HUD in the control panel.
 */
function AppContent() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left: Neural Interface Simulator (Control Panel) */}
      <ControlPanel />
      
      {/* Right: What the user actually sees — a normal desktop OS */}
      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="shrink-0 flex items-center justify-between"
          style={{
            height: 28,
            padding: "0 12px",
            backgroundColor: "var(--pi-ground)",
            borderBottom: "1px solid var(--pi-hairline)",
            fontFamily: "var(--pi-font)",
          }}
        >
          <span className="pi-label">The user's laptop · Windows</span>
          <span className="pi-label">Friction opens from the right edge</span>
        </div>
        <div className="flex-1 relative overflow-hidden">
          <DesktopOS />
          {/* Friction Overlay (always on top) */}
          <FrictionOverlay />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <PersonaProvider>
        <BiometricProvider>
          <SessionProvider>
            <KeyboardProvider>
              <WindowManagerProvider>
                <FrictionSettingsProvider>
                  <AppContent />
                </FrictionSettingsProvider>
              </WindowManagerProvider>
            </KeyboardProvider>
          </SessionProvider>
        </BiometricProvider>
      </PersonaProvider>
    </DndProvider>
  );
}