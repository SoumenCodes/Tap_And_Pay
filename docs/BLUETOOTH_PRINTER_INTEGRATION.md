# Bluetooth Thermal Printer Integration Guide

## Overview
This document contains the complete technical architecture, reverse-engineered vendor mechanics, offline cloud authentication bypass, and troubleshooting guide for the **Tiny Printer Bluetooth Thermal Printer** integration in SE Pay.

---

## 1. Supported Hardware
* **Primary Target:** `X5h-2152` (Cat / Mini Thermal Receipt Printer, 58mm paper width)
* **Print Resolution:** 200 DPI (384 pixels printable raster line width)
* **Communication Protocol:** Bluetooth Low Energy (BLE) GATT (Transport LE)
* **Also Compatible with:** `X5`, `X16`, `GB01`, `GB02`, `GT01`, `GT02`, `GT08`, `LY01`, `LY02`, `58P5`, `S101`, and related Chinese OEM mini thermal printer families.

---

## 2. Architecture & Components

```
┌────────────────────────────────────────────────────────┐
│               React Native / Expo UI                   │
│             (src/app/printer-demo.tsx)                 │
└──────────────────────────┬─────────────────────────────┘
                           │ TypeScript Calls & Listeners
┌──────────────────────────▼─────────────────────────────┐
│              TinyPrinter Expo Module                   │
│            (modules/tiny-printer/index.ts)             │
└──────────────────────────┬─────────────────────────────┘
                           │ JNI / Expo Kotlin DSL
┌──────────────────────────▼─────────────────────────────┐
│                 TinyPrinterModule.kt                   │
│   (modules/tiny-printer/android/.../TinyPrinterModule) │
│                                                        │
│  • Dual BLE Scanner (Vendor + Low-Latency Native)      │
│  • Offline SPUtils SDK Bypass Injector                 │
│  • 384px Monochrome Canvas Receipt Generator           │
│  • Watchdog Timer & Settling Delay Manager             │
└────────────┬─────────────────────────────┬─────────────┘
             │ Pre-Populates Auth          │ Calls SDK
┌────────────▼─────────────┐ ┌─────────────▼─────────────┐
│    com.blankj SPUtils    │ │   Vendor SDK JAR Libraries │
│  (SharedPreferences Map) │ │ (bleLib1, bleLib2, bleLib3)│
└──────────────────────────┘ └─────────────┬─────────────┘
                                           │ Binds Service
                             ┌─────────────▼─────────────┐
                             │    BluetoothLeService     │
                             │ (cn.com.heaton.blelibrary)│
                             └─────────────┬─────────────┘
                                           │ connectGatt (LE)
                             ┌─────────────▼─────────────┐
                             │    X5h-2152 Hardware      │
                             └───────────────────────────┘
```

---

## 3. Reverse-Engineered SDK Mechanics & Critical Fixes

### A. The AndroidManifest Service Requirement
* **Class:** `cn.com.heaton.blelibrary.ble.BluetoothLeService extends android.app.Service`
* **Mechanism:** When `bleOrderUtils.init()` runs, the library executes:
  ```java
  context.bindService(new Intent(context, BluetoothLeService.class), mServiceConnection, Context.BIND_AUTO_CREATE);
  ```
* **Failure Mode:** If `BluetoothLeService` is **not** registered in `AndroidManifest.xml`, Android silently refuses to bind the service. `Ble.getInstance().getBleService()` remains `null`. When `connect()` is called, it checks:
  ```java
  BluetoothLeService service = Ble.getInstance().getBleService();
  if (service == null) return false; // SILENTLY ABORTS
  ```
* **Required Declaration:** Both `modules/tiny-printer/android/src/main/AndroidManifest.xml` and `android/app/src/main/AndroidManifest.xml` must include:
  ```xml
  <service
      android:name="cn.com.heaton.blelibrary.ble.BluetoothLeService"
      android:exported="false" />
  ```

### B. Offline Cloud Authentication Lock Bypass
* **Mechanism:** The vendor SDK’s `init()` attempts an HTTP call to a hardcoded Chinese cloud server:
  `http://120.27.29.129:6000/devInfo?act=checkSdk`
  Outside of China, this connection fails or times out. When unauthorized, `DeviceUtils.checkValidModel()` and `DeviceUtils.scanShow()` return `false`, causing `blueConnect()` and `printImage()` to silently drop all requests or throw `"Device not activated"`.
* **The Bypass:** We pre-populate `SPUtils` (SharedPreferences) locally in `populateSdkBypass()` and `dynamicallyAuthorizeDevice()` with:
  1. `Code.bleUserId` (`"bleSdkUserId"`) $\rightarrow$ `"QDX"`
  2. `Code.TAG + Code.devInfo` (`"frogToSeadevInfo"`) $\rightarrow$ Valid serialized `PrinterModel` JSON with 384px print size, 200 DPI.
  3. `Code.USERRIGHT + model` (`"userRight" + model`) $\rightarrow$ `true`
  4. `Code.DEVTYPELIST + userId + model` (`"devTypeList" + userId + model`) $\rightarrow$ `true`
  5. `Code.CANPRINT` (`"canPrint"`), `Code.active` (`"active"`), `Code.COMPRESS` (`"compress"`) $\rightarrow$ `true`
  6. `Code.DEVICETYPE` (`"BleSdkdeviceType"`) $\rightarrow$ device name
  7. `Code.DEF_DEVICE_ADDRESS` (`"BleSdkdefDeviceAddress"`) $\rightarrow$ device MAC address

### C. Model Prefix Ordering Rule
* In `com.ble.order.getPrintMode`, the SDK iterates through configured models and tests:
  ```java
  name.startsWith(dataBean.getModelNo())
  ```
* If `"X5"` is placed before `"X5h"` in the models list, `"X5h-2152".startsWith("X5")` evaluates to `true`, erroneously selecting the default `"X5"` profile instead of the specific `"X5h"` profile.
* **Rule:** Specific / longer prefixes must **always** precede shorter prefixes:
  ```kotlin
  listOf("X5h", "X5", "X16", "X6", "X8", "X", ...)
  ```

### D. Dual BLE Scanner & Radio Settling
* The scanner runs both vendor `scanDevice()` and Android's native `BluetoothLeScanner` configured with `ScanSettings.SCAN_MODE_LOW_LATENCY`.
* When initiating a connection, `stopScan()` must be called first, followed by a **250ms settling pause** (`Thread.sleep(250)`) before calling `bleConnect()`. This prevents the phone's Bluetooth controller from choking while transitioning out of high-duty scan mode.
* A **15-second watchdog timer** guards the connection promise so the UI never hangs if the printer is powered off mid-connection.

---

## 4. Module API Reference

### Methods (`TinyPrinter`)
```typescript
import TinyPrinter from '@/modules/tiny-printer';

// Initialize the vendor SDK with offline authorization bypass
await TinyPrinter.initSdk('QDX');

// Start high-priority BLE scan
await TinyPrinter.startScan();

// Stop active BLE scan
TinyPrinter.stopScan();

// Connect to a discovered printer
await TinyPrinter.connect(address, name);

// Disconnect from the active printer
TinyPrinter.disconnect(address);

// Mechanically feed thermal paper
TinyPrinter.feedPaper();

// Print receipt bitmap from structured data
await TinyPrinter.printReceipt(receiptData, address, name, density);

// Print custom Base64 image
await TinyPrinter.printImageBase64(base64Png, address, name, density);

// Check if Bluetooth is turned on
const enabled: boolean = TinyPrinter.isBleEnabled();

// Request OS prompt to turn on Bluetooth
TinyPrinter.enableBluetooth();

// Open Location Settings (required for BLE on Android <= 11)
TinyPrinter.openLocationSettings();
```

### Event Listeners
```typescript
// Discovered printer in scan
TinyPrinter.addDeviceDiscoveredListener((event: DeviceDiscoveredEvent) => {
  // event.name, event.address, event.isMatching
});

// Connection state changed
TinyPrinter.addConnectionChangeListener((event: ConnectionChangeEvent) => {
  // event.status: 'connected' | 'disconnected' | 'failed' | 'timeout'
});

// Print progress & status
TinyPrinter.addPrintStatusListener((event: PrintStatusEvent) => {
  // event.status: 'progress' | 'success' | 'failed'
  // event.progress: 0.0 - 1.0
});
```

---

## 5. Building the Standalone APK

Because this module uses custom native Android libraries (`.jar` and `.so`), it cannot run in Expo Go. It must be built as a standalone APK:

```powershell
# In the android directory:
cd android
./gradlew assembleRelease

# Output APK path:
# android/app/build/outputs/apk/release/app-release.apk
```

### Verify APK Signature:
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\36.0.0\apksigner.bat" verify --verbose android/app/build/outputs/apk/release/app-release.apk
```
Must report: `Verifies` and `Verified using v2 scheme: true`.

---

## 6. ProGuard & R8 Configuration
The following rules in `android/app/proguard-rules.pro` ensure the vendor SDK is not stripped or obfuscated during release builds:
```proguard
-keep class com.ble.** { *; }
-keep class cn.com.heaton.blelibrary.** { *; }
-keep class org.opencv.** { *; }
-keep class com.blankj.utilcode.** { *; }
-keep class com.lzy.okgo.** { *; }
```
