import { requireNativeModule, EventEmitter } from 'expo-modules-core';

export interface DeviceDiscoveredEvent {
  name: string;
  address: string;
  isMatching: boolean;
}

export interface ConnectionChangeEvent {
  status: 'connected' | 'disconnected' | 'failed' | 'timeout';
  address: string;
  name?: string;
  errorCode?: number;
}

export interface PrintStatusEvent {
  status: 'progress' | 'success' | 'failed';
  progress?: number;
  code?: number;
}

export interface InitSdkResult {
  success: boolean;
  userId: string;
  checkDevice?: boolean;
  checkCache?: boolean;
  error?: string;
}

export interface ReceiptData {
  storeName?: string;
  subtitle?: string;
  txnId?: string;
  amount?: string;
  tip?: string;
  total?: string;
  cardType?: string;
  cardLast4?: string;
  status?: string;
  authCode?: string;
}

export interface Subscription {
  remove(): void;
}

let TinyPrinterNative: any = null;
try {
  TinyPrinterNative = requireNativeModule('TinyPrinter');
} catch (e) {
  // Graceful fallback for non-native environments or before prebuild
  console.warn('TinyPrinter native module is not linked or not supported on this platform:', e);
}

const emitter: any = TinyPrinterNative ? new EventEmitter(TinyPrinterNative) : null;

export const TinyPrinter = {
  isAvailable(): boolean {
    return !!TinyPrinterNative;
  },

  async initSdk(userId: string = 'QDX'): Promise<InitSdkResult> {
    if (!TinyPrinterNative?.initSdk) {
      return { success: false, userId, error: 'TinyPrinter native module not available' };
    }
    return await TinyPrinterNative.initSdk(userId);
  },

  checkDevice(modelName: string = 'Audio Print'): boolean {
    if (!TinyPrinterNative?.checkDevice) return false;
    return TinyPrinterNative.checkDevice(modelName);
  },

  checkCache(): boolean {
    if (!TinyPrinterNative?.checkCache) return false;
    return TinyPrinterNative.checkCache();
  },

  getPrinterPixel(modelName: string = 'Audio Print'): number {
    if (!TinyPrinterNative?.getPrinterPixel) return 384;
    return TinyPrinterNative.getPrinterPixel(modelName);
  },

  isBleEnabled(): boolean {
    if (!TinyPrinterNative?.isBleEnabled) return false;
    return TinyPrinterNative.isBleEnabled();
  },

  enableBluetooth(): boolean {
    if (!TinyPrinterNative?.enableBluetooth) return false;
    return TinyPrinterNative.enableBluetooth();
  },

  openLocationSettings(): boolean {
    if (!TinyPrinterNative?.openLocationSettings) return false;
    return TinyPrinterNative.openLocationSettings();
  },

  async startScan(): Promise<boolean> {
    if (!TinyPrinterNative?.startScan) return false;
    return await TinyPrinterNative.startScan();
  },

  stopScan(): boolean {
    if (!TinyPrinterNative?.stopScan) return false;
    return TinyPrinterNative.stopScan();
  },

  async connect(address: string, name: string): Promise<any> {
    if (!TinyPrinterNative?.connect) {
      throw new Error('TinyPrinter native module not available');
    }
    return await TinyPrinterNative.connect(address, name);
  },

  disconnect(address: string): boolean {
    if (!TinyPrinterNative?.disconnect) return false;
    return TinyPrinterNative.disconnect(address);
  },

  feedPaper(): boolean {
    if (!TinyPrinterNative?.feedPaper) return false;
    return TinyPrinterNative.feedPaper();
  },

  async printReceipt(
    receiptData: ReceiptData,
    address: string,
    name: string,
    density: number = 3
  ): Promise<{ success: boolean }> {
    if (!TinyPrinterNative?.printReceipt) {
      throw new Error('TinyPrinter native module not available');
    }
    return await TinyPrinterNative.printReceipt(receiptData, address, name, density);
  },

  async printImageBase64(
    base64Data: string,
    address: string,
    name: string,
    density: number = 3
  ): Promise<{ success: boolean }> {
    if (!TinyPrinterNative?.printImageBase64) {
      throw new Error('TinyPrinter native module not available');
    }
    return await TinyPrinterNative.printImageBase64(base64Data, address, name, density);
  },

  // Event Listeners
  addDeviceDiscoveredListener(listener: (event: DeviceDiscoveredEvent) => void): Subscription | null {
    if (!emitter) return null;
    return emitter.addListener('onDeviceDiscovered', listener);
  },

  addConnectionChangeListener(listener: (event: ConnectionChangeEvent) => void): Subscription | null {
    if (!emitter) return null;
    return emitter.addListener('onConnectionChange', listener);
  },

  addPrintStatusListener(listener: (event: PrintStatusEvent) => void): Subscription | null {
    if (!emitter) return null;
    return emitter.addListener('onPrintStatus', listener);
  },
};

export default TinyPrinter;
