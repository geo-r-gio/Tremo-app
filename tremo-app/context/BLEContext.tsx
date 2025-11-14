// src/context/BLEContext.tsx
import React, { createContext, useContext, useState } from "react";
import { Device, BleManager } from "react-native-ble-plx";

interface BLEContextType {
  device: Device | null;
  setDevice: (device: Device | null) => void;
  bleManager: BleManager;
  connected: boolean;
  setConnected: (value: boolean) => void;
}

const BLEContext = createContext<BLEContextType | undefined>(undefined);

export const BLEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [connected, setConnected] = useState(false);
  const bleManager = new BleManager();

  return (
    <BLEContext.Provider value={{ device, setDevice, bleManager, connected, setConnected }}>
      {children}
    </BLEContext.Provider>
  );
};

export const useBLE = () => {
  const context = useContext(BLEContext);
  if (!context) throw new Error("useBLE must be used within BLEProvider");
  return context;
};