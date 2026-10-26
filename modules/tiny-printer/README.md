# TinyPrinter Expo Native Module

Expo native module integrating Chinese-vendor Bluetooth thermal receipt printers (`bleLib1.jar`, `bleLib2.jar`, `bleLib3.jar`) for SE Pay.

## Features
- **Offline Cloud Authorization Bypass:** Injects model rights and JSON definitions into `SPUtils` to bypass the unreachable cloud authentication server (`120.27.29.129:6000`).
- **Dual BLE Scanning:** Combines vendor `scanDevice` with Android native `BluetoothLeScanner` (`SCAN_MODE_LOW_LATENCY`).
- **GATT Service Lifecycle:** Declares and binds `cn.com.heaton.blelibrary.ble.BluetoothLeService` for reliable BLE connection.
- **Monochrome Raster Rendering:** Produces high-contrast 384px (58mm @ 200 DPI) thermal bitmaps on-device.
- **Connection Watchdog:** 15s timeout safeguard preventing hanging connection promises.

## Complete Integration Guide
See [`docs/BLUETOOTH_PRINTER_INTEGRATION.md`](../../docs/BLUETOOTH_PRINTER_INTEGRATION.md) for full architectural documentation, reverse-engineered bytecode details, and troubleshooting notes.
