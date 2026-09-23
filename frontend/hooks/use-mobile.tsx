import * as React from "react";

const MEDIUM_BREAKPOINT = 600; // Material M3: compact -> medium
const EXPANDED_BREAKPOINT = 840; // Material M3: medium -> expanded

export type DeviceClass = "compact" | "medium" | "expanded";

function getDeviceClass(width: number): DeviceClass {
  if (width >= EXPANDED_BREAKPOINT) return "expanded";
  if (width >= MEDIUM_BREAKPOINT) return "medium";
  return "compact";
}

/** Material-style window size class: compact = phone, medium/expanded = tablet. */
export function useDeviceClass(): DeviceClass {
  const [deviceClass, setDeviceClass] = React.useState<DeviceClass>("compact");

  React.useEffect(() => {
    const update = () => setDeviceClass(getDeviceClass(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return deviceClass;
}

/** Back-compat: true only for phone-width (compact) screens. */
export function useIsMobile() {
  return useDeviceClass() === "compact";
}
