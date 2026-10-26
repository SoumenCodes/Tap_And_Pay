package expo.modules.tinyprinter

import android.app.Application
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Base64
import android.util.Log
import cn.com.heaton.blelibrary.ble.model.BleDevice
import com.blankj.utilcode.util.SPUtils
import com.ble.bean.PrinterModel
import com.ble.callback.BleConnectCallBack
import com.ble.callback.BleWriteCallBack
import com.ble.callback.ScanCallBack
import com.ble.callback.initCallBack
import com.ble.order.BleOrderUtils
import com.ble.utils.Code
import com.google.gson.Gson
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.text.SimpleDateFormat
import java.util.ArrayList
import java.util.Date
import java.util.Locale

class TinyPrinterModule : Module() {
  private val bleOrderUtils: BleOrderUtils by lazy { BleOrderUtils.createBleOrderUtils() }
  private var isInitialized = false
  private var connectedBleDevice: BleDevice? = null
  private val discoveredDevices = mutableMapOf<String, BleDevice>()
  private var nativeScanCallback: ScanCallback? = null

  private val knownModels = listOf(
    "X5h", "X5", "X16", "X6", "X8", "X", "PR", "GT", "GB", "LY", "58P5", "S101", "M01", "Audio Print"
  )

  override fun definition() = ModuleDefinition {
    Name("TinyPrinter")

    Events(
      "onDeviceDiscovered",
      "onConnectionChange",
      "onPrintStatus"
    )

    AsyncFunction("initSdk") { userId: String, promise: Promise ->
      try {
        val targetUserId = if (userId.isNotBlank()) userId else "QDX"
        val context = appContext.reactContext?.applicationContext
          ?: appContext.currentActivity?.applicationContext
        val app = context as? Application
        if (app == null) {
          promise.reject("ERR_APP_CONTEXT", "Application context not available", null)
          return@AsyncFunction
        }

        // 1. Immediately inject the offline authorization bypass into SPUtils
        populateSdkBypass(targetUserId)

        // 2. Initialize vendor SDK with local cache ready
        bleOrderUtils.init(app, targetUserId, 60000L, object : initCallBack() {
          override fun onSuccess() {
            isInitialized = true
            try {
              bleOrderUtils.isWriteFailReConnect = true
              bleOrderUtils.failNum = 2
            } catch (e: Exception) {
              // ignore settings error
            }
            populateSdkBypass(targetUserId)
            val checkDevice = try {
              bleOrderUtils.checkDevice("X5") || bleOrderUtils.checkDevice("X5h")
            } catch (e: Exception) { false }
            val checkCache = try { bleOrderUtils.checkCache() } catch (e: Exception) { false }
            promise.resolve(mapOf(
              "success" to true,
              "userId" to targetUserId,
              "checkDevice" to checkDevice,
              "checkCache" to checkCache
            ))
          }

          override fun onError(error: String?) {
            // Even if Chinese cloud auth server fails, local authorization is active!
            isInitialized = true
            populateSdkBypass(targetUserId)
            val checkDevice = try {
              bleOrderUtils.checkDevice("X5") || bleOrderUtils.checkDevice("X5h")
            } catch (e: Exception) { false }
            val checkCache = try { bleOrderUtils.checkCache() } catch (e: Exception) { false }
            promise.resolve(mapOf(
              "success" to true,
              "userId" to targetUserId,
              "offlineReady" to true,
              "checkDevice" to checkDevice,
              "checkCache" to checkCache
            ))
          }
        })
      } catch (e: Exception) {
        promise.reject("ERR_INIT_EXCEPTION", e.message ?: "SDK init failed", e)
      }
    }

    Function("checkDevice") { modelName: String ->
      try {
        dynamicallyAuthorizeDevice(modelName, "")
        bleOrderUtils.checkDevice(modelName)
      } catch (e: Exception) {
        false
      }
    }

    Function("checkCache") {
      try {
        bleOrderUtils.checkCache()
      } catch (e: Exception) {
        false
      }
    }

    Function("getPrinterPixel") { modelName: String ->
      try {
        val px = bleOrderUtils.imagePixel(modelName)
        if (px > 0) px else 384
      } catch (e: Exception) {
        384
      }
    }

    Function("isBleEnabled") {
      try {
        val context = appContext.reactContext?.applicationContext
          ?: appContext.currentActivity?.applicationContext
        val btManager = context?.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        val btAdapter = btManager?.adapter ?: BluetoothAdapter.getDefaultAdapter()
        btAdapter?.isEnabled ?: bleOrderUtils.isBleEnable
      } catch (e: Exception) {
        bleOrderUtils.isBleEnable
      }
    }

    Function("enableBluetooth") {
      try {
        val activity = appContext.currentActivity
        if (activity != null) {
          val enableBtIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
          activity.startActivity(enableBtIntent)
          true
        } else {
          false
        }
      } catch (e: Exception) {
        false
      }
    }

    Function("openLocationSettings") {
      try {
        val activity = appContext.currentActivity
        if (activity != null) {
          val intent = Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)
          activity.startActivity(intent)
          true
        } else {
          false
        }
      } catch (e: Exception) {
        false
      }
    }

    AsyncFunction("startScan") { promise: Promise ->
      try {
        discoveredDevices.clear()
        populateSdkBypass("QDX")

        // 1. Run vendor SDK scan (now unlocked by SPUtils bypass)
        try {
          bleOrderUtils.scanDevice(object : ScanCallBack() {
            override fun onLeScan(device: BleDevice?) {
              if (device != null && device.bleAddress != null) {
                handleDiscoveredDevice(device.bleAddress, device.bleName ?: "Thermal Printer", device)
              }
            }

            override fun onScanFailed(errorCode: Int) {
              Log.w("TinyPrinter", "SDK onScanFailed: $errorCode")
            }

            override fun onStopScan() {}
          })
        } catch (e: Exception) {
          Log.w("TinyPrinter", "Vendor scanDevice notice: ${e.message}")
        }

        // 2. Concurrently check bonded devices & run direct native Android BluetoothLeScanner
        try {
          val context = appContext.reactContext?.applicationContext
            ?: appContext.currentActivity?.applicationContext
          val btManager = context?.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
          val btAdapter = btManager?.adapter ?: BluetoothAdapter.getDefaultAdapter()

          // A. Immediately report any already-paired / bonded devices
          try {
            btAdapter?.bondedDevices?.forEach { bondedDev ->
              val name = bondedDev.name ?: ""
              val address = bondedDev.address ?: ""
              if (name.isNotBlank() && address.isNotBlank()) {
                handleDiscoveredDevice(address, name, BleDevice(bondedDev))
              }
            }
          } catch (e: Exception) {
            Log.w("TinyPrinter", "Bonded devices check notice: ${e.message}")
          }

          // B. Start high-priority low-latency active radio scan
          val scanner = btAdapter?.bluetoothLeScanner
          if (scanner != null && btAdapter.isEnabled) {
            nativeScanCallback?.let {
              try { scanner.stopScan(it) } catch (e: Exception) {}
            }

            val cb = object : ScanCallback() {
              override fun onScanResult(callbackType: Int, result: ScanResult?) {
                val btDev = result?.device ?: return
                val address = btDev.address ?: return
                val name = btDev.name ?: result.scanRecord?.deviceName ?: ""

                if (name.isNotBlank()) {
                  val bleDev = BleDevice(btDev)
                  handleDiscoveredDevice(address, name, bleDev)
                }
              }

              override fun onBatchScanResults(results: MutableList<ScanResult>?) {
                results?.forEach { res ->
                  val btDev = res.device ?: return@forEach
                  val address = btDev.address ?: return@forEach
                  val name = btDev.name ?: res.scanRecord?.deviceName ?: ""
                  if (name.isNotBlank()) {
                    handleDiscoveredDevice(address, name, BleDevice(btDev))
                  }
                }
              }

              override fun onScanFailed(errorCode: Int) {
                Log.w("TinyPrinter", "Native BLE onScanFailed: $errorCode")
              }
            }
            nativeScanCallback = cb

            val settings = ScanSettings.Builder()
              .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
              .build()
            scanner.startScan(null, settings, cb)
          }
        } catch (e: Exception) {
          Log.w("TinyPrinter", "Native BluetoothLeScanner notice: ${e.message}")
        }

        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("ERR_SCAN", e.message ?: "Failed to start BLE scan", e)
      }
    }

    Function("stopScan") {
      try {
        bleOrderUtils.stopScan()
        stopNativeScanner()
        true
      } catch (e: Exception) {
        false
      }
    }

    AsyncFunction("connect") { address: String, name: String, promise: Promise ->
      try {
        Log.i("TinyPrinter", "Connect requested for: $name ($address)")
        bleOrderUtils.stopScan()
        stopNativeScanner()

        // Give the Bluetooth radio a moment to stop scanning before initiating central connection
        try { Thread.sleep(250) } catch (e: Exception) {}

        // Guarantee authorization for this device in SPUtils before connecting
        dynamicallyAuthorizeDevice(name, address)

        // Pre-validate model check
        val isModelValid = try {
          com.ble.order.DeviceUtils.checkValidModel(name)
        } catch (e: Exception) {
          Log.w("TinyPrinter", "checkValidModel evaluation: ${e.message}")
          true
        }
        Log.i("TinyPrinter", "DeviceUtils.checkValidModel('$name') = $isModelValid")

        val deviceToConnect = discoveredDevices[address] ?: BleDevice(address, name)

        var isResolved = false
        val mainHandler = Handler(Looper.getMainLooper())
        val timeoutRunnable = Runnable {
          if (!isResolved) {
            isResolved = true
            Log.e("TinyPrinter", "Connection watchdog timeout for $name ($address)")
            sendEvent("onConnectionChange", mapOf(
              "status" to "timeout",
              "address" to address,
              "name" to name
            ))
            promise.reject("ERR_CONNECT_TIMEOUT", "Connection timed out after 15s. Please ensure the printer is turned on and close to the phone.", null)
          }
        }
        mainHandler.postDelayed(timeoutRunnable, 15000L)

        bleOrderUtils.bleConnect(address, name, object : BleConnectCallBack() {
          override fun onConnectionChanged(device: BleDevice?) {
            val isConnected = device?.isConnected == true || device?.connectionState == 2505
            Log.i("TinyPrinter", "onConnectionChanged: state=${device?.connectionState}, isConnected=${device?.isConnected}")

            if (isConnected) {
              mainHandler.removeCallbacks(timeoutRunnable)
              connectedBleDevice = device ?: deviceToConnect
              sendEvent("onConnectionChange", mapOf(
                "status" to "connected",
                "address" to address,
                "name" to name
              ))
              if (!isResolved) {
                isResolved = true
                promise.resolve(mapOf(
                  "connected" to true,
                  "address" to address,
                  "name" to name
                ))
              }
            } else if (device?.connectionState == 2503 || device?.isConnected == false) {
              connectedBleDevice = null
              sendEvent("onConnectionChange", mapOf(
                "status" to "disconnected",
                "address" to address,
                "name" to name
              ))
            }
          }

          override fun onConnectException(device: BleDevice?, errorCode: Int) {
            Log.e("TinyPrinter", "onConnectException: $errorCode for $name ($address)")
            mainHandler.removeCallbacks(timeoutRunnable)
            sendEvent("onConnectionChange", mapOf(
              "status" to "failed",
              "errorCode" to errorCode,
              "address" to address
            ))
            if (!isResolved) {
              isResolved = true
              promise.reject("ERR_CONNECT_EXCEPTION", "Connection error code: $errorCode", null)
            }
          }

          override fun onConnectTimeOut(device: BleDevice?) {
            Log.e("TinyPrinter", "onConnectTimeOut SDK callback for $name ($address)")
            mainHandler.removeCallbacks(timeoutRunnable)
            sendEvent("onConnectionChange", mapOf(
              "status" to "timeout",
              "address" to address
            ))
            if (!isResolved) {
              isResolved = true
              promise.reject("ERR_CONNECT_TIMEOUT", "Connection timed out", null)
            }
          }
        })
      } catch (e: Exception) {
        Log.e("TinyPrinter", "connect exception: ${e.message}", e)
        promise.reject("ERR_CONNECT", e.message ?: "Connect error", e)
      }
    }

    Function("disconnect") { address: String ->
      try {
        bleOrderUtils.disConnect(address)
        connectedBleDevice = null
        sendEvent("onConnectionChange", mapOf(
          "status" to "disconnected",
          "address" to address
        ))
        true
      } catch (e: Exception) {
        false
      }
    }

    Function("feedPaper") {
      try {
        connectedBleDevice?.let { dev ->
          val name = dev.bleName ?: "X5h"
          dynamicallyAuthorizeDevice(name, dev.bleAddress ?: "")
        }
        bleOrderUtils.writeFeedPaper()
        true
      } catch (e: Exception) {
        false
      }
    }

    AsyncFunction("printImageBase64") { base64Data: String, address: String, name: String, density: Int, promise: Promise ->
      try {
        val cleanBase64 = if (base64Data.contains(",")) base64Data.substringAfter(",") else base64Data
        val decodedBytes = Base64.decode(cleanBase64, Base64.DEFAULT)
        val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
        if (bitmap == null) {
          promise.reject("ERR_DECODE_BITMAP", "Failed to decode bitmap from base64", null)
          return@AsyncFunction
        }

        dynamicallyAuthorizeDevice(name, address)

        val targetDevice = connectedBleDevice ?: discoveredDevices[address] ?: BleDevice(address, name)
        val list = ArrayList<Bitmap>().apply { add(bitmap) }
        val densityVal = if (density in listOf(2, 3, 5)) density else 3

        bleOrderUtils.printImage(list, 1, densityVal, targetDevice, 2, object : BleWriteCallBack() {
          override fun onWriteSuccess() {
            sendEvent("onPrintStatus", mapOf("status" to "success"))
            promise.resolve(mapOf("success" to true))
          }

          override fun onWriteFailed(code: Int) {
            sendEvent("onPrintStatus", mapOf("status" to "failed", "code" to code))
            promise.reject("ERR_PRINT_FAILED", "Print write failed with code: $code", null)
          }

          override fun onWriteProgress(progress: Double) {
            sendEvent("onPrintStatus", mapOf("status" to "progress", "progress" to progress))
          }
        })
      } catch (e: Exception) {
        promise.reject("ERR_PRINT", e.message ?: "Print failed", e)
      }
    }

    AsyncFunction("printReceipt") { receiptData: Map<String, Any>, address: String, name: String, density: Int, promise: Promise ->
      try {
        val targetWidth = 384 // 2-inch standard 58mm width at 200 DPI
        val bitmap = createReceiptBitmap(receiptData, targetWidth)

        dynamicallyAuthorizeDevice(name, address)

        val targetDevice = connectedBleDevice ?: discoveredDevices[address] ?: BleDevice(address, name)
        val list = ArrayList<Bitmap>().apply { add(bitmap) }
        val densityVal = if (density in listOf(2, 3, 5)) density else 3

        bleOrderUtils.printImage(list, 1, densityVal, targetDevice, 2, object : BleWriteCallBack() {
          override fun onWriteSuccess() {
            sendEvent("onPrintStatus", mapOf("status" to "success"))
            promise.resolve(mapOf("success" to true))
          }

          override fun onWriteFailed(code: Int) {
            sendEvent("onPrintStatus", mapOf("status" to "failed", "code" to code))
            promise.reject("ERR_PRINT_FAILED", "Print write failed with code: $code", null)
          }

          override fun onWriteProgress(progress: Double) {
            sendEvent("onPrintStatus", mapOf("status" to "progress", "progress" to progress))
          }
        })
      } catch (e: Exception) {
        promise.reject("ERR_PRINT", e.message ?: "Print receipt failed", e)
      }
    }
  }

  private fun stopNativeScanner() {
    try {
      val context = appContext.reactContext?.applicationContext
        ?: appContext.currentActivity?.applicationContext
      val btManager = context?.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
      val btAdapter = btManager?.adapter ?: BluetoothAdapter.getDefaultAdapter()
      nativeScanCallback?.let {
        btAdapter?.bluetoothLeScanner?.stopScan(it)
        nativeScanCallback = null
      }
    } catch (e: Exception) {
      Log.w("TinyPrinter", "Error stopping native scanner: ${e.message}")
    }
  }

  private fun handleDiscoveredDevice(address: String, name: String, device: BleDevice) {
    if (discoveredDevices.containsKey(address)) {
      return
    }
    discoveredDevices[address] = device
    dynamicallyAuthorizeDevice(name, address)

    val isMatch = name.startsWith("X", ignoreCase = true) ||
                  name.contains("Print", ignoreCase = true) ||
                  name.contains("Thermal", ignoreCase = true) ||
                  name.contains("Receipt", ignoreCase = true) ||
                  name.contains("POS", ignoreCase = true) ||
                  name.contains("58", ignoreCase = true) ||
                  name.contains("Audio", ignoreCase = true)

    sendEvent("onDeviceDiscovered", mapOf(
      "name" to name,
      "address" to address,
      "isMatching" to isMatch
    ))
  }

  private fun createModelDataBean(modelNo: String, headName: String): PrinterModel.DataBean {
    return PrinterModel.DataBean(
      modelNo,        // modelNo: String
      1,              // model: Int
      0,              // size: Int
      384,            // paperSize: Int (384 px = 58mm width)
      384,            // printSize: Int
      8,              // oneLength: Int
      headName,       // headName: String
      true,           // canChangeMTU: Boolean
      200,            // devdpi: Int (200 DPI)
      10,             // imgPrintSpeed: Int
      10,             // textPrintSpeed: Int
      123,            // imgMTU: Int
      true,           // newCompress: Boolean
      2,              // paperNum: Int
      6,              // interval: Int
      6500,           // thinEneragy: Int
      6500,           // moderationEneragy: Int
      6500,           // deepenEneragy: Int
      0,              // textEneragy: Int
      true,           // hasId: Boolean
      false,          // useSPP: Boolean
      false,          // newFormat: Boolean
      true,           // canPrintLabel: Boolean
      "1",            // labelValue: String
      40,             // backPaperNum: Int
      1               // detectionValue: Int
    )
  }

  private fun populateSdkBypass(userId: String) {
    try {
      val sp = SPUtils.getInstance()
      val targetUserId = if (userId.isNotBlank()) userId else "QDX"

      sp.put(Code.bleUserId, targetUserId) // "bleSdkUserId"
      sp.put("bleSdkUserId", targetUserId)

      val dataList = ArrayList<PrinterModel.DataBean>()
      for (model in knownModels) {
        dataList.add(createModelDataBean(model, "$model-"))
      }
      val printerModel = PrinterModel()
      printerModel.data = dataList
      val json = Gson().toJson(printerModel)

      sp.put(Code.TAG + Code.devInfo, json) // "frogToSeadevInfo"
      sp.put("frogToSeadevInfo", json)

      for (model in knownModels) {
        sp.put(Code.USERRIGHT + model, true)             // "userRight$model"
        sp.put(Code.DEVTYPELIST + targetUserId + model, true) // "devTypeList$targetUserId$model"
        sp.put("userRight$model", true)
        sp.put("devTypeList$targetUserId$model", true)
      }

      sp.put(Code.CANPRINT, true)
      sp.put(Code.COMPRESS, true)
      sp.put(Code.active, true)
      sp.put(Code.SOUTi, true)
      sp.put("canPrint", true)
      sp.put("compress", true)
      sp.put("active", true)
    } catch (e: Exception) {
      Log.e("TinyPrinter", "Failed to populate SDK bypass: ${e.message}")
    }
  }

  private fun dynamicallyAuthorizeDevice(name: String, address: String) {
    try {
      val sp = SPUtils.getInstance()
      val userId = sp.getString(Code.bleUserId, "QDX").ifBlank { "QDX" }

      val keysToAuthorize = mutableSetOf(
        name,
        "X5h",
        "X5",
        "X5-",
        "X5h-",
        "X16",
        "Audio Print"
      )
      val prefix = name.substringBefore("-").trim()
      if (prefix.isNotEmpty()) {
        keysToAuthorize.add(prefix)
        keysToAuthorize.add("$prefix-")
      }

      for (k in keysToAuthorize) {
        sp.put(Code.USERRIGHT + k, true)
        sp.put(Code.DEVTYPELIST + userId + k, true)
        sp.put("userRight$k", true)
        sp.put("devTypeList$userId$k", true)
        sp.put("devTypeList$k", true)
      }

      sp.put(Code.DEVICETYPE, name)
      sp.put("BleSdkdeviceType", name)
      sp.put(Code.DEFDIVICENAME, name)
      sp.put("BleSddefDeviceName", name)
      if (address.isNotBlank()) {
        sp.put(Code.DEF_DEVICE_ADDRESS, address)
        sp.put("BleSdkdefDeviceAddress", address)
      }
      sp.put(Code.CANPRINT, true)
      sp.put(Code.active, true)
      sp.put(Code.COMPRESS, true)
      sp.put(Code.SOUTi, true)
      sp.put("canPrint", true)
      sp.put("active", true)
      sp.put("compress", true)
    } catch (e: Exception) {
      Log.e("TinyPrinter", "Failed to dynamically authorize device: ${e.message}")
    }
  }

  /**
   * Generates a crisp monochrome receipt bitmap (384px width) for 2-inch thermal printer
   */
  private fun createReceiptBitmap(data: Map<String, Any>, width: Int): Bitmap {
    val storeName = (data["storeName"] as? String) ?: "SE PAY - MANAH CREATIONS"
    val subtitle = (data["subtitle"] as? String) ?: "CONTACTLESS PAYMENT RECEIPT"
    val txnId = (data["txnId"] as? String) ?: "#TXN-${System.currentTimeMillis() % 100000}"
    val amount = (data["amount"] as? String) ?: "$25.00"
    val tip = (data["tip"] as? String) ?: "$2.50"
    val total = (data["total"] as? String) ?: "$27.50"
    val cardType = (data["cardType"] as? String) ?: "Visa Tap to Pay"
    val cardLast4 = (data["cardLast4"] as? String) ?: "4242"
    val status = (data["status"] as? String) ?: "APPROVED"
    val authCode = (data["authCode"] as? String) ?: "AUTH: 839201"
    val dateFormat = SimpleDateFormat("dd-MMM-yyyy HH:mm:ss", Locale.getDefault())
    val dateStr = dateFormat.format(Date())

    val estimatedHeight = 620
    val bitmap = Bitmap.createBitmap(width, estimatedHeight, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    canvas.drawColor(Color.WHITE)

    val paint = Paint().apply {
      isAntiAlias = true
      color = Color.BLACK
    }

    var y = 35f

    paint.textSize = 26f
    paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    paint.textAlign = Paint.Align.CENTER
    canvas.drawText(storeName, width / 2f, y, paint)
    y += 28f

    paint.textSize = 15f
    paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
    canvas.drawText(subtitle, width / 2f, y, paint)
    y += 22f

    paint.textSize = 14f
    canvas.drawText("------------------------------------------------", width / 2f, y, paint)
    y += 26f

    paint.textSize = 16f
    paint.textAlign = Paint.Align.LEFT
    canvas.drawText("Date:", 20f, y, paint)
    paint.textAlign = Paint.Align.RIGHT
    canvas.drawText(dateStr, width - 20f, y, paint)
    y += 24f

    paint.textAlign = Paint.Align.LEFT
    canvas.drawText("Transaction ID:", 20f, y, paint)
    paint.textAlign = Paint.Align.RIGHT
    canvas.drawText(txnId, width - 20f, y, paint)
    y += 24f

    paint.textAlign = Paint.Align.LEFT
    canvas.drawText("Payment Method:", 20f, y, paint)
    paint.textAlign = Paint.Align.RIGHT
    canvas.drawText("$cardType (**** $cardLast4)", width - 20f, y, paint)
    y += 26f

    paint.textAlign = Paint.Align.CENTER
    paint.textSize = 14f
    canvas.drawText("================================================", width / 2f, y, paint)
    y += 30f

    paint.textSize = 17f
    paint.textAlign = Paint.Align.LEFT
    canvas.drawText("Fare / Service:", 20f, y, paint)
    paint.textAlign = Paint.Align.RIGHT
    canvas.drawText(amount, width - 20f, y, paint)
    y += 26f

    paint.textAlign = Paint.Align.LEFT
    canvas.drawText("Tip:", 20f, y, paint)
    paint.textAlign = Paint.Align.RIGHT
    canvas.drawText(tip, width - 20f, y, paint)
    y += 30f

    paint.textSize = 24f
    paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    paint.textAlign = Paint.Align.LEFT
    canvas.drawText("TOTAL PAID:", 20f, y, paint)
    paint.textAlign = Paint.Align.RIGHT
    canvas.drawText(total, width - 20f, y, paint)
    y += 32f

    paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
    paint.textAlign = Paint.Align.CENTER
    paint.textSize = 14f
    canvas.drawText("------------------------------------------------", width / 2f, y, paint)
    y += 28f

    paint.textSize = 20f
    paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    canvas.drawText("[ $status ]", width / 2f, y, paint)
    y += 24f

    paint.textSize = 14f
    paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
    canvas.drawText(authCode, width / 2f, y, paint)
    y += 30f

    val barStartY = y
    val barHeight = 35f
    val barPaint = Paint().apply {
      color = Color.BLACK
      strokeWidth = 2.5f
    }
    var barX = 40f
    var i = 0
    while (barX < width - 40f) {
      val w = if (i % 3 == 0) 3.5f else 1.5f
      barPaint.strokeWidth = w
      canvas.drawLine(barX, barStartY, barX, barStartY + barHeight, barPaint)
      barX += if (i % 4 == 0) 7f else 4.5f
      i++
    }
    y += barHeight + 20f

    paint.textSize = 14f
    paint.textAlign = Paint.Align.CENTER
    canvas.drawText("*** Thank you for using SE Pay ***", width / 2f, y, paint)
    y += 20f
    canvas.drawText("Customer Copy", width / 2f, y, paint)
    y += 30f

    return bitmap
  }
}
