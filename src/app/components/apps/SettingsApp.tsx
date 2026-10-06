/**
 * SETTINGS APP
 * 
 * System preferences panel with toggles, sliders, and various controls.
 * Simulates macOS System Settings with a Friction twist.
 */

import { useState } from "react";
import { useFrictionSettings } from "../../context/FrictionSettingsContext";
import { Wifi, Bluetooth, Monitor, Moon, Bell, Shield, Palette, Volume2, Keyboard, Mouse, Zap } from "lucide-react";

import { NO_AUTOFILL } from "@/app/lib/noAutofill";
interface SettingSection {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const SECTIONS: SettingSection[] = [
  { id: "general", name: "General", icon: <Monitor size={16} /> },
  { id: "appearance", name: "Appearance", icon: <Palette size={16} /> },
  { id: "notifications", name: "Notifications", icon: <Bell size={16} /> },
  { id: "sound", name: "Sound", icon: <Volume2 size={16} /> },
  { id: "focus", name: "Focus", icon: <Moon size={16} /> },
  { id: "wifi", name: "Wi-Fi", icon: <Wifi size={16} /> },
  { id: "bluetooth", name: "Bluetooth", icon: <Bluetooth size={16} /> },
  { id: "keyboard", name: "Keyboard", icon: <Keyboard size={16} /> },
  { id: "mouse", name: "Mouse", icon: <Mouse size={16} /> },
  { id: "security", name: "Security", icon: <Shield size={16} /> },
  { id: "friction", name: "Friction", icon: <Zap size={16} /> },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative cursor-pointer"
      style={{
        width: "44px",
        height: "24px",
        borderRadius: "12px",
        backgroundColor: checked ? "#34c759" : "#e0e0e0",
        transition: "background-color 0.2s ease",
        border: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "2px",
          left: checked ? "22px" : "2px",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s ease",
        }}
      />
    </button>
  );
}

function Slider({ value, onChange, min = 0, max = 100 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-3 w-full">
      <input {...NO_AUTOFILL}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 cursor-pointer"
        style={{ accentColor: "#007aff" }}
      />
      <span className="text-xs w-8 text-right" style={{ color: "#666" }}>{value}</span>
    </div>
  );
}

export function SettingsApp() {
  const [section, setSection] = useState("general");
  const [settings, setSettings] = useState({
    darkMode: true,
    autoUpdate: true,
    wifi: true,
    bluetooth: true,
    doNotDisturb: false,
    notifications: true,
    sounds: true,
    haptics: true,
    volume: 65,
    brightness: 80,
    keyRepeatSpeed: 70,
    mouseSpeed: 50,
    // Friction-specific (the rest of the Friction settings live in FrictionSettingsContext)
    frictionSensitivity: 60,
    recoveryDuration: 15,
    appearance: "dark" as "dark" | "light" | "auto",
    accentColor: "#ff9f0a",
  });

  const friction = useFrictionSettings();
  const update = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderContent = () => {
    switch (section) {
      case "general":
        return (
          <div className="space-y-6">
            <h2 className="text-lg" style={{ color: "#202124" }}>General</h2>
            <SettingRow label="Automatic Updates" description="Keep your system up to date">
              <Toggle checked={settings.autoUpdate} onChange={(v) => update("autoUpdate", v)} />
            </SettingRow>
            <SettingRow label="Dark Mode" description="Use dark appearance system-wide">
              <Toggle checked={settings.darkMode} onChange={(v) => update("darkMode", v)} />
            </SettingRow>
          </div>
        );
      case "appearance":
        return (
          <div className="space-y-6">
            <h2 className="text-lg" style={{ color: "#202124" }}>Appearance</h2>
            <div className="space-y-3">
              <div className="text-sm" style={{ color: "#333" }}>Theme</div>
              <div className="flex gap-3">
                {(["light", "dark", "auto"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => update("appearance", mode)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer"
                    style={{
                      border: settings.appearance === mode ? "2px solid #007aff" : "2px solid #e0e0e0",
                      backgroundColor: mode === "dark" ? "#1a1a1a" : mode === "light" ? "#f5f5f5" : "linear-gradient(135deg, #f5f5f5 50%, #1a1a1a 50%)",
                      width: "80px",
                      height: "60px",
                    }}
                  >
                    <span className="text-xs capitalize" style={{ color: settings.appearance === mode ? "#007aff" : "#666" }}>{mode}</span>
                  </button>
                ))}
              </div>
            </div>
            <SettingRow label="Accent Color" description="Highlight color for buttons and controls">
              <div className="flex gap-2">
                {["#007aff", "#ff9f0a", "#34c759", "#ff3b30", "#af52de", "#ff2d55"].map(color => (
                  <button
                    key={color}
                    onClick={() => update("accentColor", color)}
                    className="w-6 h-6 rounded-full cursor-pointer"
                    style={{
                      backgroundColor: color,
                      border: settings.accentColor === color ? "2px solid #fff" : "none",
                      boxShadow: settings.accentColor === color ? `0 0 0 2px ${color}` : "none",
                    }}
                  />
                ))}
              </div>
            </SettingRow>
            <SettingRow label="Display Brightness">
              <Slider value={settings.brightness} onChange={(v) => update("brightness", v)} />
            </SettingRow>
          </div>
        );
      case "notifications":
        return (
          <div className="space-y-6">
            <h2 className="text-lg" style={{ color: "#202124" }}>Notifications</h2>
            <SettingRow label="Allow Notifications" description="Show notifications on screen">
              <Toggle checked={settings.notifications} onChange={(v) => update("notifications", v)} />
            </SettingRow>
            <SettingRow label="Do Not Disturb" description="Silence all notifications">
              <Toggle checked={settings.doNotDisturb} onChange={(v) => update("doNotDisturb", v)} />
            </SettingRow>
            <SettingRow label="Play Sound for Notifications">
              <Toggle checked={settings.sounds} onChange={(v) => update("sounds", v)} />
            </SettingRow>
          </div>
        );
      case "sound":
        return (
          <div className="space-y-6">
            <h2 className="text-lg" style={{ color: "#202124" }}>Sound</h2>
            <SettingRow label="Output Volume">
              <Slider value={settings.volume} onChange={(v) => update("volume", v)} />
            </SettingRow>
            <SettingRow label="Play Sound Effects">
              <Toggle checked={settings.sounds} onChange={(v) => update("sounds", v)} />
            </SettingRow>
            <SettingRow label="Haptic Feedback">
              <Toggle checked={settings.haptics} onChange={(v) => update("haptics", v)} />
            </SettingRow>
          </div>
        );
      case "focus":
        return (
          <div className="space-y-6">
            <h2 className="text-lg" style={{ color: "#202124" }}>Focus Modes</h2>
            <SettingRow label="Do Not Disturb" description="Silence calls and notifications">
              <Toggle checked={settings.doNotDisturb} onChange={(v) => update("doNotDisturb", v)} />
            </SettingRow>
            <div className="p-4 rounded-lg" style={{ backgroundColor: "#f8f0e3", border: "1px solid #e8d5b5" }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} style={{ color: "#ff9f0a" }} />
                <span className="text-sm" style={{ color: "#8b6914" }}>Friction Deep Work Mode</span>
              </div>
              <p className="text-xs" style={{ color: "#a0894d" }}>
                When active, Friction manages your focus environment automatically. Notifications are silenced and ambient cues guide your cognitive state.
              </p>
            </div>
          </div>
        );
      case "wifi":
        return (
          <div className="space-y-6">
            <h2 className="text-lg" style={{ color: "#202124" }}>Wi-Fi</h2>
            <SettingRow label="Wi-Fi" description={settings.wifi ? "Connected to FrictionNet-5G" : "Off"}>
              <Toggle checked={settings.wifi} onChange={(v) => update("wifi", v)} />
            </SettingRow>
            {settings.wifi && (
              <div className="space-y-2">
                <div className="text-sm mb-2" style={{ color: "#666" }}>Available Networks</div>
                {["FrictionNet-5G", "NeighborWifi", "CoffeeShop_Free", "5G-Guest"].map((network, i) => (
                  <div key={network} className="flex items-center justify-between px-3 py-2 rounded" style={{ backgroundColor: i === 0 ? "#e8f5e9" : "#f5f5f5" }}>
                    <div className="flex items-center gap-2">
                      <Wifi size={14} style={{ color: i === 0 ? "#34c759" : "#999" }} />
                      <span className="text-sm" style={{ color: "#333" }}>{network}</span>
                    </div>
                    {i === 0 && <span className="text-xs" style={{ color: "#34c759" }}>Connected</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "bluetooth":
        return (
          <div className="space-y-6">
            <h2 className="text-lg" style={{ color: "#202124" }}>Bluetooth</h2>
            <SettingRow label="Bluetooth" description={settings.bluetooth ? "On" : "Off"}>
              <Toggle checked={settings.bluetooth} onChange={(v) => update("bluetooth", v)} />
            </SettingRow>
            {settings.bluetooth && (
              <div className="space-y-2">
                <div className="text-sm mb-2" style={{ color: "#666" }}>Devices</div>
                {[
                  { name: "AirPods Pro", status: "Connected", emoji: "🎧" },
                  { name: "Magic Keyboard", status: "Connected", emoji: "⌨️" },
                  { name: "Magic Mouse", status: "Not Connected", emoji: "🖱️" },
                ].map(device => (
                  <div key={device.name} className="flex items-center justify-between px-3 py-2 rounded" style={{ backgroundColor: "#f5f5f5" }}>
                    <div className="flex items-center gap-2">
                      <span>{device.emoji}</span>
                      <span className="text-sm" style={{ color: "#333" }}>{device.name}</span>
                    </div>
                    <span className="text-xs" style={{ color: device.status === "Connected" ? "#34c759" : "#999" }}>{device.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "keyboard":
        return (
          <div className="space-y-6">
            <h2 className="text-lg" style={{ color: "#202124" }}>Keyboard</h2>
            <SettingRow label="Key Repeat Speed">
              <Slider value={settings.keyRepeatSpeed} onChange={(v) => update("keyRepeatSpeed", v)} />
            </SettingRow>
          </div>
        );
      case "mouse":
        return (
          <div className="space-y-6">
            <h2 className="text-lg" style={{ color: "#202124" }}>Mouse & Trackpad</h2>
            <SettingRow label="Tracking Speed">
              <Slider value={settings.mouseSpeed} onChange={(v) => update("mouseSpeed", v)} />
            </SettingRow>
          </div>
        );
      case "security":
        return (
          <div className="space-y-6">
            <h2 className="text-lg" style={{ color: "#202124" }}>Security & Privacy</h2>
            <div className="p-4 rounded-lg" style={{ backgroundColor: "#e8f5e9" }}>
              <div className="flex items-center gap-2 mb-1">
                <Shield size={16} style={{ color: "#34c759" }} />
                <span className="text-sm" style={{ color: "#2e7d32" }}>Your system is protected</span>
              </div>
              <p className="text-xs" style={{ color: "#4caf50" }}>FileVault is on. Firewall is active.</p>
            </div>
          </div>
        );
      case "friction":
        return (
          <div className="space-y-6">
            <h2 className="text-lg" style={{ color: "#202124" }}>Friction</h2>
            <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} style={{ color: "#ffa726" }} />
                <span className="text-sm" style={{ color: "#ffa726" }}>Friction</span>
              </div>
              <p className="text-xs" style={{ color: "#888" }}>Steps in when you are tired or losing focus.</p>
            </div>
            <SettingRow label="Turn on Friction" description="Turns every effect below on or off">
              <Toggle checked={friction.frictionEnabled} onChange={(v) => friction.update("frictionEnabled", v)} />
            </SettingRow>
            <SettingRow label="Side panel" description="The panel on the right edge of the screen">
              <Toggle checked={friction.frictionOverlay} onChange={(v) => friction.update("frictionOverlay", v)} />
            </SettingRow>
            <div className="text-sm mt-4 mb-2" style={{ color: "#666" }}>Effects</div>
            <SettingRow label="Moss" description="Covers the screen after an interruption so you can pick up where you left off">
              <Toggle checked={friction.digitalMoss} onChange={(v) => friction.update("digitalMoss", v)} />
            </SettingRow>
            <SettingRow label="Task done flash" description="Shows the next task when you finish one">
              <Toggle checked={friction.tactileStrike} onChange={(v) => friction.update("tactileStrike", v)} />
            </SettingRow>
            <SettingRow label="Darken when tired" description="The screen darkens as you get tired, then locks">
              <Toggle checked={friction.progressiveVignette} onChange={(v) => friction.update("progressiveVignette", v)} />
            </SettingRow>
            <SettingRow label="Warm tint" description="Warms the screen colors as you tire">
              <Toggle checked={friction.taperAmbient} onChange={(v) => friction.update("taperAmbient", v)} />
            </SettingRow>
            <SettingRow label="Breathing guide" description="A slow pulse on the task card when focus is low">
              <Toggle checked={friction.breathingVisualizer} onChange={(v) => friction.update("breathingVisualizer", v)} />
            </SettingRow>
            <div className="text-sm mt-4 mb-2" style={{ color: "#666" }}>Tuning</div>
            <SettingRow label="Sensitivity" description="How quickly Friction steps in">
              <Slider value={settings.frictionSensitivity} onChange={(v) => update("frictionSensitivity", v)} />
            </SettingRow>
            <SettingRow label="Break length (min)" description="How long a suggested break lasts">
              <Slider value={settings.recoveryDuration} onChange={(v) => update("recoveryDuration", v)} min={5} max={30} />
            </SettingRow>
            <SettingRow label="Lock at fatigue (%)" description="Fatigue level that locks the screen">
              <Slider value={friction.interceptThreshold} onChange={(v) => friction.update("interceptThreshold", v)} min={80} max={100} />
            </SettingRow>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="size-full flex" style={{ backgroundColor: "#ffffff" }}>
      {/* Sidebar */}
      <div className="w-56 border-r overflow-y-auto" style={{ borderColor: "#e5e5e5", backgroundColor: "#f9f9f9" }}>
        <div className="p-3">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-left cursor-pointer mb-0.5"
              style={{
                backgroundColor: section === s.id ? "#e8e8e8" : "transparent",
                color: section === s.id ? "#000" : "#555",
              }}
            >
              <span style={{ color: section === s.id ? "#007aff" : "#999" }}>{s.icon}</span>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: "#f0f0f0" }}>
      <div>
        <div className="text-sm" style={{ color: "#333" }}>{label}</div>
        {description && <div className="text-xs mt-0.5" style={{ color: "#999" }}>{description}</div>}
      </div>
      {children}
    </div>
  );
}
