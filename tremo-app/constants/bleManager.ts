import { BleManager } from 'react-native-ble-plx';

export const bleManager = new BleManager();

// import { BleManager, State, Device } from 'react-native-ble-plx';

// // Export the BleManager instance so it can be used in components
// export let bleManager = new BleManager();

// export const initBle = () => {
//   // Listen for Bluetooth state changes
//   bleManager.onStateChange((state) => {
//     console.log('Bluetooth state:', state);

//     if (state === State.PoweredOn) {
//       // Bluetooth is on — start scanning
//       scanForDevices();
//     } else if (state === State.PoweredOff) {
//       // Bluetooth is off — stop scanning
//       bleManager.stopDeviceScan();
//     }
//   }, true); // 'true' triggers the callback immediately with current state
// };

// /**
//  * Scan for Arduino Nano33 BLE device
//  */
// export const scanForDevices = () => {
//   console.log('Scanning for Arduino...');
//   bleManager.startDeviceScan(null, null, (error, device: Device | null) => {
//     if (error) {
//       console.error('Scan error:', error);
//       return;
//     }

//     if (device?.name === 'Nano33BLE') {
//       console.log('Found device:', device.id);

//       // Stop scanning once device is found
//       bleManager.stopDeviceScan();

//       // Connect to the device
//       connectToDevice(device);
//     }
//   });

//   // Optionally stop scanning after 10 seconds
//   setTimeout(() => bleManager.stopDeviceScan(), 10000);
// };

// /**
//  * Connect to the BLE device
//  */
// export const connectToDevice = async (device: Device) => {
//   try {
//     const connectedDevice = await device.connect();
//     console.log('Connected to:', connectedDevice.id);

//     // Discover services and characteristics
//     await connectedDevice.discoverAllServicesAndCharacteristics();
//     console.log('Services discovered!');

//     return connectedDevice;
//   } catch (err) {
//     console.error('Connection error:', err);
//     throw err;
//   }
// };

// /**
//  * Reset BLE manager (optional: call when app resumes or after toggling Bluetooth)
//  */
// export const resetBleManager = () => {
//   bleManager.destroy();
//   bleManager = new BleManager();
//   initBle();
// };

// // Initialize BLE on app start
// initBle();