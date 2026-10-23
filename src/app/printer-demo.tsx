import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import TinyPrinter, {
  DeviceDiscoveredEvent,
  ConnectionChangeEvent,
  PrintStatusEvent,
} from '../../modules/tiny-printer';

interface BlePrinterDevice {
  name: string;
  address: string;
  isMatching: boolean;
}

export default function PrinterDemoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // SDK State
  const [sdkStatus, setSdkStatus] = useState<string>('Ready');
  const [isSdkReady, setIsSdkReady] = useState<boolean>(true);
  const [sdkCacheValid, setSdkCacheValid] = useState<boolean>(false);
  const [modelSupported, setModelSupported] = useState<boolean>(false);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  // BLE Scan & Connection State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [devices, setDevices] = useState<BlePrinterDevice[]>([]);
  const [connectingAddress, setConnectingAddress] = useState<string | null>(null);
  const [connectedDevice, setConnectedDevice] = useState<BlePrinterDevice | null>(null);

  // Printing State
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printProgress, setPrintProgress] = useState<number>(0);
  const [printDensity, setPrintDensity] = useState<number>(3); // 2: light, 3: normal, 5: dark
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sample Receipt Data
  const receiptData = {
    storeName: 'SE PAY - SOUMEN',
    subtitle: 'CONTACTLESS PAYMENT RECEIPT',
    txnId: '#TXN-98421',
    amount: '$25.00',
    tip: '$2.50',
    total: '$27.50',
    cardType: 'Visa Tap to Pay',
    cardLast4: '4242',
    status: 'APPROVED',
    authCode: 'AUTH: 839201',
  };

  // Auto-init SDK on start
  const handleInitSdk = useCallback(async () => {
    try {
      const res = await TinyPrinter.initSdk('QDX');
      if (res.success) {
        setIsSdkReady(true);
        setSdkStatus('Authorized');
        setSdkCacheValid(!!res.checkCache);
        setModelSupported(!!res.checkDevice);
      } else {
        setSdkStatus('Offline Ready');
        setSdkCacheValid(!!res.checkCache);
      }
    } catch {
      setSdkStatus('Ready');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleInitSdk();
    }, 100);
    return () => clearTimeout(timer);
  }, [handleInitSdk]);

  // Set up BLE listeners
  useEffect(() => {
    const subDevice = TinyPrinter.addDeviceDiscoveredListener((event: DeviceDiscoveredEvent) => {
      setDevices((prev) => {
        if (prev.some((d) => d.address === event.address)) {
          return prev;
        }
        const newList = [...prev, event];
        return newList.sort((a, b) => (b.isMatching ? 1 : 0) - (a.isMatching ? 1 : 0));
      });
    });

    const subConn = TinyPrinter.addConnectionChangeListener((event: ConnectionChangeEvent) => {
      if (event.status === 'connected') {
        setConnectedDevice({
          name: event.name || 'Thermal Printer',
          address: event.address,
          isMatching: true,
        });
        setConnectingAddress(null);
        setStatusMessage('Connected to printer!');
      } else if (event.status === 'disconnected') {
        setConnectedDevice(null);
        setConnectingAddress(null);
        setStatusMessage('Printer disconnected');
      } else if (event.status === 'failed' || event.status === 'timeout') {
        setConnectingAddress(null);
        setStatusMessage('Connection failed. Please retry.');
      }
    });

    const subPrint = TinyPrinter.addPrintStatusListener((event: PrintStatusEvent) => {
      if (event.status === 'progress' && event.progress !== undefined) {
        setPrintProgress(Math.round(event.progress * 100));
      } else if (event.status === 'success') {
        setIsPrinting(false);
        setPrintProgress(100);
        setStatusMessage('Receipt printed successfully! 🎉');
      } else if (event.status === 'failed') {
        setIsPrinting(false);
        setStatusMessage('Print failed. Please check paper and retry.');
      }
    });

    return () => {
      subDevice?.remove();
      subConn?.remove();
      subPrint?.remove();
    };
  }, []);

  // Request Android Bluetooth & Location Permissions and verify hardware state
  const requestBlePermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      const apiLevel = Platform.Version as number;
      if (apiLevel >= 31) {
        // Android 12+ requires BLUETOOTH_SCAN, BLUETOOTH_CONNECT, and ACCESS_FINE_LOCATION
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        const scanOk = granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED;
        const connectOk = granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;

        if (!scanOk || !connectOk) {
          Alert.alert(
            'Permissions Required',
            'Nearby Devices (Bluetooth) permission is required to scan and connect to thermal printers. Please allow permissions in Settings.'
          );
          return false;
        }
      } else {
        // Android 11 and below requires ACCESS_FINE_LOCATION
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission Needed',
            message: 'Android requires Location access to discover nearby Bluetooth devices.',
            buttonPositive: 'Allow',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }

      // Check if Bluetooth is actually switched ON
      const btEnabled = TinyPrinter.isBleEnabled();
      if (!btEnabled) {
        Alert.alert(
          'Bluetooth is Turned Off',
          'Please turn ON Bluetooth to search for and connect to thermal printers.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Turn On Bluetooth',
              onPress: () => {
                TinyPrinter.enableBluetooth();
              },
            },
          ]
        );
        return false;
      }

      return true;
    } catch (e: any) {
      console.warn('Permission request error:', e);
      return false;
    }
  };

  // BLE Scan
  const handleStartScan = async () => {
    const hasPerms = await requestBlePermissions();
    if (!hasPerms) {
      setStatusMessage('Please enable Bluetooth to scan for printers');
      return;
    }

    setDevices([]);
    setIsScanning(true);
    setStatusMessage('Scanning for nearby thermal printers...');
    try {
      await TinyPrinter.startScan();
      setTimeout(() => {
        TinyPrinter.stopScan();
        setIsScanning(false);
      }, 12000);
    } catch (e: any) {
      setIsScanning(false);
      Alert.alert(
        'Bluetooth Scan',
        'Could not scan. Please ensure Bluetooth and Location (GPS) are turned ON in phone settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => TinyPrinter.openLocationSettings() },
        ]
      );
    }
  };

  const handleStopScan = () => {
    TinyPrinter.stopScan();
    setIsScanning(false);
  };

  // Connect to Device
  const handleConnect = async (device: BlePrinterDevice) => {
    try {
      handleStopScan();
      setConnectingAddress(device.address);
      setStatusMessage(`Connecting to ${device.name}...`);
      await TinyPrinter.connect(device.address, device.name);
    } catch (e: any) {
      setConnectingAddress(null);
      Alert.alert('Connection Failed', e.message);
    }
  };

  // Disconnect
  const handleDisconnect = () => {
    if (connectedDevice) {
      TinyPrinter.disconnect(connectedDevice.address);
      setConnectedDevice(null);
      setStatusMessage('Disconnected');
    }
  };

  // Feed Paper
  const handleFeedPaper = () => {
    if (!connectedDevice) {
      Alert.alert('Not Connected', 'Please connect to the printer first.');
      return;
    }
    TinyPrinter.feedPaper();
    setStatusMessage('Paper feed command sent');
  };

  // Print Test Receipt
  const handlePrintReceipt = async () => {
    if (!connectedDevice) {
      Alert.alert('Connect Printer', 'Please tap "Find & Connect Printer" first.');
      return;
    }

    try {
      setIsPrinting(true);
      setPrintProgress(15);
      setStatusMessage('Sending receipt to printer...');
      const res = await TinyPrinter.printReceipt(
        receiptData,
        connectedDevice.address,
        connectedDevice.name,
        printDensity
      );
      if (res.success) {
        setStatusMessage('Receipt printed successfully! 🎉');
      }
    } catch (e: any) {
      setIsPrinting(false);
      setStatusMessage(`Print error: ${e.message}`);
      Alert.alert('Print Error', e.message);
    }
  };

  // Toggle density
  const cycleDensity = () => {
    if (printDensity === 2) setPrintDensity(3);
    else if (printDensity === 3) setPrintDensity(5);
    else setPrintDensity(2);
  };

  const densityLabel = printDensity === 2 ? 'Light' : printDensity === 5 ? 'Dark' : 'Normal';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 6 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Printer Test Demo</Text>
          <Text style={styles.headerSubtitle}>58mm Mini Thermal Receipt Printer</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            connectedDevice ? styles.statusPillConnected : styles.statusPillDisconnected,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: connectedDevice ? '#10B981' : '#94A3B8' },
            ]}
          />
          <Text
            style={[
              styles.statusPillText,
              { color: connectedDevice ? '#065F46' : '#64748B' },
            ]}
          >
            {connectedDevice ? 'Connected' : 'Offline'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Printer Connection Box */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Bluetooth Printer</Text>
          </View>

          {connectedDevice ? (
            <View style={styles.connectedRow}>
              <View style={styles.connectedIcon}>
                <Feather name="printer" size={24} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.connectedDeviceName}>{connectedDevice.name}</Text>
                <Text style={styles.connectedDeviceMac}>{connectedDevice.address}</Text>
                <Text style={styles.connectedReadyText}>✓ Ready to print</Text>
              </View>
              <TouchableOpacity style={styles.btnSmallOutline} onPress={handleDisconnect}>
                <Text style={styles.btnSmallOutlineText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.notConnectedBox}>
              <TouchableOpacity
                style={styles.connectBigBtn}
                onPress={isScanning ? handleStopScan : handleStartScan}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isScanning ? ['#EF4444', '#DC2626'] : ['#1E293B', '#0F172A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.connectBigBtnGradient}
                >
                  {isScanning ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.connectBigBtnText}>Scanning... Tap to Stop</Text>
                    </>
                  ) : (
                    <>
                      <Feather name="bluetooth" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.connectBigBtnText}>{'Find & Connect Thermal Printer'}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Scanned Devices List */}
              {devices.length > 0 && (
                <View style={styles.devicesList}>
                  <Text style={styles.devicesListHeader}>Nearby Printers Found:</Text>
                  {devices.map((device) => {
                    const isConnecting = connectingAddress === device.address;
                    return (
                      <TouchableOpacity
                        key={device.address}
                        style={[
                          styles.deviceItem,
                          device.isMatching && styles.deviceItemMatch,
                        ]}
                        onPress={() => handleConnect(device)}
                        disabled={isConnecting}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.deviceItemName}>{device.name}</Text>
                            {device.isMatching && (
                              <View style={styles.recommendedBadge}>
                                <Text style={styles.recommendedBadgeText}>Client Model</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.deviceItemAddress}>{device.address}</Text>
                        </View>
                        <View style={styles.tapToConnectBadge}>
                          {isConnecting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.tapToConnectText}>Connect</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Step 2: Receipt Preview Box */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Sample Receipt</Text>
          </View>

          {/* Clean Receipt Visual */}
          <View style={styles.receiptContainer}>
            <Text style={styles.receiptBrand}>SE PAY</Text>
            <Text style={styles.receiptSubText}>Payment Receipt</Text>
            <View style={styles.receiptDivider} />

            <View style={styles.receiptLine}>
              <Text style={styles.receiptMuted}>Order ID</Text>
              <Text style={styles.receiptBold}>{receiptData.txnId}</Text>
            </View>
            <View style={styles.receiptLine}>
              <Text style={styles.receiptMuted}>Payment Method</Text>
              <Text style={styles.receiptBold}>{receiptData.cardType}</Text>
            </View>
            <View style={styles.receiptLine}>
              <Text style={styles.receiptMuted}>Card Number</Text>
              <Text style={styles.receiptBold}>•••• {receiptData.cardLast4}</Text>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptLine}>
              <Text style={styles.receiptMuted}>Amount</Text>
              <Text style={styles.receiptBold}>{receiptData.amount}</Text>
            </View>
            <View style={styles.receiptLine}>
              <Text style={styles.receiptMuted}>Tip</Text>
              <Text style={styles.receiptBold}>{receiptData.tip}</Text>
            </View>
            <View style={[styles.receiptLine, { marginTop: 4 }]}>
              <Text style={styles.receiptTotalLabel}>TOTAL</Text>
              <Text style={styles.receiptTotalValue}>{receiptData.total}</Text>
            </View>

            <View style={styles.receiptDivider} />
            <Text style={styles.receiptApproved}>✓ APPROVED</Text>
            <Text style={styles.receiptFooter}>Thank you for your business!</Text>
          </View>
        </View>

        {/* Status Alert Banner */}
        {statusMessage && (
          <View style={styles.statusBanner}>
            <Feather name="info" size={16} color="#D97706" />
            <Text style={styles.statusBannerText}>{statusMessage}</Text>
          </View>
        )}

        {/* Step 3: Print Action & Controls */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Print Controls</Text>
          </View>

          {/* Big Print Button */}
          <TouchableOpacity
            style={[
              styles.bigPrintButton,
              (!connectedDevice || isPrinting) && styles.bigPrintButtonDisabled,
            ]}
            onPress={handlePrintReceipt}
            disabled={!connectedDevice || isPrinting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                connectedDevice
                  ? ['#F59E0B', '#D97706', '#B45309']
                  : ['#94A3B8', '#64748B']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bigPrintButtonGradient}
            >
              {isPrinting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 10 }} />
                  <Text style={styles.bigPrintButtonText}>Printing... {printProgress}%</Text>
                </>
              ) : (
                <>
                  <Feather name="printer" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
                  <Text style={styles.bigPrintButtonText}>
                    {connectedDevice ? '🖨️ Print Receipt Now' : 'Connect Printer to Print'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Utility Buttons: Feed Paper & Density */}
          <View style={styles.utilityRow}>
            <TouchableOpacity
              style={[styles.utilityBtn, !connectedDevice && { opacity: 0.5 }]}
              onPress={handleFeedPaper}
              disabled={!connectedDevice}
            >
              <MaterialCommunityIcons name="format-vertical-align-bottom" size={18} color="#0F172A" />
              <Text style={styles.utilityBtnText}>Feed Paper</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.utilityBtn} onPress={cycleDensity}>
              <Feather name="sliders" size={16} color="#0F172A" />
              <Text style={styles.utilityBtnText}>Density: {densityLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Collapsible Diagnostics Section */}
        <TouchableOpacity
          style={styles.diagToggle}
          onPress={() => setShowDiagnostics(!showDiagnostics)}
        >
          <Text style={styles.diagToggleText}>
            {showDiagnostics ? '▲ Hide SDK Details' : '▼ View SDK & Account Info'}
          </Text>
        </TouchableOpacity>

        {showDiagnostics && (
          <View style={styles.diagCard}>
            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>Authorized User ID:</Text>
              <Text style={styles.diagValue}>QDX</Text>
            </View>
            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>Target Printer Model:</Text>
              <Text style={styles.diagValue}>Thermal Printer (X5 / X5h 58mm)</Text>
            </View>
            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>SDK Status:</Text>
              <Text style={[styles.diagValue, { color: isSdkReady ? '#059669' : '#DC2626' }]}>
                {sdkStatus}
              </Text>
            </View>
            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>SDK Cache / Model:</Text>
              <Text style={styles.diagValue}>
                {sdkCacheValid ? 'Cache OK' : 'No Cache'} • {modelSupported ? 'Model Verified' : 'Standard Mode'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusPillConnected: {
    backgroundColor: '#ECFDF5',
  },
  statusPillDisconnected: {
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    gap: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  connectedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedDeviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  connectedDeviceMac: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  connectedReadyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  btnSmallOutline: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFFFF',
  },
  btnSmallOutlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  notConnectedBox: {
    gap: 10,
  },
  connectBigBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  connectBigBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  connectBigBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  devicesList: {
    gap: 8,
    marginTop: 4,
  },
  devicesListHeader: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deviceItemMatch: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  deviceItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  recommendedBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deviceItemAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tapToConnectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  tapToConnectText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  receiptContainer: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  receiptBrand: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  receiptSubText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  receiptDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 2,
  },
  receiptMuted: {
    fontSize: 11,
    color: '#64748B',
  },
  receiptBold: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  receiptTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  receiptTotalValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  receiptApproved: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  receiptFooter: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 4,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  bigPrintButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  bigPrintButtonDisabled: {
    opacity: 0.7,
  },
  bigPrintButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  bigPrintButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  utilityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  utilityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  utilityBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  diagToggle: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  diagToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  diagCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  diagLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  diagValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
});
