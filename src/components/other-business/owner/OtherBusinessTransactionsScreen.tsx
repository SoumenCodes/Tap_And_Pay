import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import HeaderBar from '../../common/HeaderBar';

export interface SalonEmployeeItem {
  id: string;
  name: string;
  empId: string;
  avatar: any;
  role: string;
  isOnline: boolean;
}

export const SALON_EMPLOYEES: SalonEmployeeItem[] = [
  {
    id: 'emp_01',
    name: 'Soumen Sen',
    empId: '93821048',
    avatar: require('../../../../assets/emp_avatar_1.png'),
    role: 'Crown Cuts Barber',
    isOnline: true,
  },
  {
    id: 'emp_02',
    name: 'Liam Hemsworth',
    empId: '93822048',
    avatar: require('../../../../assets/emp_avatar_2.png'),
    role: 'Senior Barber',
    isOnline: true,
  },
  {
    id: 'emp_04',
    name: 'Jack Robinson',
    empId: '93823048',
    avatar: require('../../../../assets/emp_avatar_4.png'),
    role: 'Stylist & Colorist',
    isOnline: true,
  },
  {
    id: 'emp_03',
    name: 'Sarah Jenkins',
    empId: '93824048',
    avatar: require('../../../../assets/emp_avatar_3.png'),
    role: 'Junior Stylist',
    isOnline: false,
  },
];

export interface OtherBusinessShiftTxn {
  id: string;
  service: string;
  time: string;
  method: 'card' | 'tap_and_go';
  amount: number;
  verification: string;
}

export interface OtherBusinessShiftRecord {
  id: string;
  dateKey: string;
  dateText: string;
  timeRange: string;
  status: 'paid' | 'unpaid';
  paidDate?: string;
  totalAmount: number;
  txnsCount: number;
  cardTxns: number;
  cardAmount: number;
  tapTxns: number;
  tapAmount: number;
  transactions: OtherBusinessShiftTxn[];
}

// Generate realistic mock shifts for any employee
const generateShiftsForEmployee = (empId: string): OtherBusinessShiftRecord[] => [
  {
    id: `26102026/${empId}/537384`,
    dateKey: '26102026',
    dateText: '26 Oct 2026',
    timeRange: '07:30 AM – 05:00 PM',
    status: 'paid',
    paidDate: '30 Oct 2026',
    totalAmount: 485.0,
    txnsCount: 14,
    cardTxns: 9,
    cardAmount: 320.0,
    tapTxns: 5,
    tapAmount: 165.0,
    transactions: [
      { id: '#CC-5384-01', service: 'Full Beard Groom & Fade', time: '07:45 AM', method: 'card', amount: 45.0, verification: 'AUTH_OK_#92841' },
      { id: '#CC-5384-02', service: 'Classic Cut & Wash', time: '08:30 AM', method: 'card', amount: 40.0, verification: 'AUTH_OK_#92842' },
      { id: '#CC-5384-03', service: 'Hot Towel Shave', time: '09:15 AM', method: 'tap_and_go', amount: 35.0, verification: 'AUTH_OK_#92843' },
      { id: '#CC-5384-04', service: 'Executive Haircut & Style', time: '10:00 AM', method: 'card', amount: 50.0, verification: 'AUTH_OK_#92844' },
      { id: '#CC-5384-05', service: 'Buzz Cut & Lineup', time: '10:45 AM', method: 'tap_and_go', amount: 30.0, verification: 'AUTH_OK_#92845' },
      { id: '#CC-5384-06', service: 'Fade & Styling Clay', time: '11:30 AM', method: 'card', amount: 42.0, verification: 'AUTH_OK_#92846' },
      { id: '#CC-5384-07', service: 'Beard Trim & Oil', time: '12:15 PM', method: 'tap_and_go', amount: 25.0, verification: 'AUTH_OK_#92847' },
      { id: '#CC-5384-08', service: 'Skin Fade & Shampoo', time: '01:00 PM', method: 'card', amount: 45.0, verification: 'AUTH_OK_#92848' },
      { id: '#CC-5384-09', service: 'Junior Cut', time: '01:45 PM', method: 'tap_and_go', amount: 30.0, verification: 'AUTH_OK_#92849' },
      { id: '#CC-5384-10', service: 'Deluxe Shave & Facemask', time: '02:30 PM', method: 'card', amount: 55.0, verification: 'AUTH_OK_#92850' },
      { id: '#CC-5384-11', service: 'Mustache Styling', time: '03:15 PM', method: 'tap_and_go', amount: 45.0, verification: 'AUTH_OK_#92851' },
      { id: '#CC-5384-12', service: 'Precision Beard Sculpting', time: '03:45 PM', method: 'card', amount: 28.0, verification: 'AUTH_OK_#92852' },
      { id: '#CC-5384-13', service: 'Neck Cleanup & Tonic', time: '04:15 PM', method: 'card', amount: 20.0, verification: 'AUTH_OK_#92853' },
      { id: '#CC-5384-14', service: 'Classic Scissor Cut', time: '04:45 PM', method: 'card', amount: 35.0, verification: 'AUTH_OK_#92854' },
    ],
  },
  {
    id: `25102026/${empId}/537383`,
    dateKey: '25102026',
    dateText: '25 Oct 2026',
    timeRange: '05:30 PM – 02:00 AM',
    status: 'paid',
    paidDate: '30 Oct 2026',
    totalAmount: 390.0,
    txnsCount: 11,
    cardTxns: 7,
    cardAmount: 250.0,
    tapTxns: 4,
    tapAmount: 140.0,
    transactions: [
      { id: '#CC-5383-01', service: 'Evening Haircut Special', time: '05:45 PM', method: 'card', amount: 45.0, verification: 'AUTH_OK_#92701' },
      { id: '#CC-5383-02', service: 'Beard Trim & Sculpt', time: '06:30 PM', method: 'card', amount: 35.0, verification: 'AUTH_OK_#92702' },
      { id: '#CC-5383-03', service: 'Fade & Styling Gel', time: '07:15 PM', method: 'tap_and_go', amount: 40.0, verification: 'AUTH_OK_#92703' },
      { id: '#CC-5383-04', service: 'Classic Men Cut', time: '08:00 PM', method: 'card', amount: 35.0, verification: 'AUTH_OK_#92704' },
      { id: '#CC-5383-05', service: 'Hot Towel Deluxe', time: '09:00 PM', method: 'tap_and_go', amount: 30.0, verification: 'AUTH_OK_#92705' },
      { id: '#CC-5383-06', service: 'Executive Styling', time: '10:00 PM', method: 'card', amount: 50.0, verification: 'AUTH_OK_#92706' },
      { id: '#CC-5383-07', service: 'Full Groom Combo', time: '11:00 PM', method: 'card', amount: 55.0, verification: 'AUTH_OK_#92707' },
      { id: '#CC-5383-08', service: 'Late Cut & Lineup', time: '11:45 PM', method: 'tap_and_go', amount: 35.0, verification: 'AUTH_OK_#92708' },
      { id: '#CC-5383-09', service: 'Beard Lineup', time: '12:30 AM', method: 'tap_and_go', amount: 35.0, verification: 'AUTH_OK_#92709' },
      { id: '#CC-5383-10', service: 'Quick Scissor Cut', time: '01:15 AM', method: 'card', amount: 30.0, verification: 'AUTH_OK_#92710' },
    ],
  },
  {
    id: `24102026/${empId}/537382`,
    dateKey: '24102026',
    dateText: '24 Oct 2026',
    timeRange: '08:00 AM – 04:30 PM',
    status: 'unpaid',
    totalAmount: 240.0,
    txnsCount: 8,
    cardTxns: 5,
    cardAmount: 150.0,
    tapTxns: 3,
    tapAmount: 90.0,
    transactions: [
      { id: '#CC-5382-01', service: 'Morning Beard Trim', time: '08:15 AM', method: 'card', amount: 25.0, verification: 'AUTH_OK_#92601' },
      { id: '#CC-5382-02', service: 'Classic Fade', time: '09:00 AM', method: 'card', amount: 35.0, verification: 'AUTH_OK_#92602' },
      { id: '#CC-5382-03', service: 'Haircut & Shampoo', time: '10:00 AM', method: 'tap_and_go', amount: 35.0, verification: 'AUTH_OK_#92603' },
      { id: '#CC-5382-04', service: 'Hot Towel Clean', time: '11:30 AM', method: 'card', amount: 30.0, verification: 'AUTH_OK_#92604' },
      { id: '#CC-5382-05', service: 'Lineup & Mustache', time: '01:00 PM', method: 'tap_and_go', amount: 25.0, verification: 'AUTH_OK_#92605' },
      { id: '#CC-5382-06', service: 'Executive Haircut', time: '02:15 PM', method: 'card', amount: 40.0, verification: 'AUTH_OK_#92606' },
      { id: '#CC-5382-07', service: 'Beard Sculpting', time: '03:15 PM', method: 'tap_and_go', amount: 30.0, verification: 'AUTH_OK_#92607' },
      { id: '#CC-5382-08', service: 'Neck Clean & Shave', time: '04:00 PM', method: 'card', amount: 20.0, verification: 'AUTH_OK_#92608' },
    ],
  },
  {
    id: `23102026/${empId}/537381`,
    dateKey: '23102026',
    dateText: '23 Oct 2026',
    timeRange: '09:00 AM – 06:00 PM',
    status: 'paid',
    paidDate: '30 Oct 2026',
    totalAmount: 410.0,
    txnsCount: 12,
    cardTxns: 8,
    cardAmount: 270.0,
    tapTxns: 4,
    tapAmount: 140.0,
    transactions: [],
  },
  {
    id: `22102026/${empId}/537380`,
    dateKey: '22102026',
    dateText: '22 Oct 2026',
    timeRange: '08:30 AM – 05:30 PM',
    status: 'paid',
    paidDate: '30 Oct 2026',
    totalAmount: 365.0,
    txnsCount: 10,
    cardTxns: 6,
    cardAmount: 220.0,
    tapTxns: 4,
    tapAmount: 145.0,
    transactions: [],
  },
  {
    id: `21102026/${empId}/537379`,
    dateKey: '21102026',
    dateText: '21 Oct 2026',
    timeRange: '08:00 AM – 04:30 PM',
    status: 'paid',
    paidDate: '30 Oct 2026',
    totalAmount: 315.0,
    txnsCount: 9,
    cardTxns: 6,
    cardAmount: 210.0,
    tapTxns: 3,
    tapAmount: 105.0,
    transactions: [],
  },
  {
    id: `20102026/${empId}/537378`,
    dateKey: '20102026',
    dateText: '20 Oct 2026',
    timeRange: '09:00 AM – 05:00 PM',
    status: 'paid',
    paidDate: '30 Oct 2026',
    totalAmount: 380.0,
    txnsCount: 11,
    cardTxns: 7,
    cardAmount: 240.0,
    tapTxns: 4,
    tapAmount: 140.0,
    transactions: [],
  },
  {
    id: `19102026/${empId}/537377`,
    dateKey: '19102026',
    dateText: '19 Oct 2026',
    timeRange: '08:30 AM – 05:00 PM',
    status: 'paid',
    paidDate: '23 Oct 2026',
    totalAmount: 340.0,
    txnsCount: 10,
    cardTxns: 6,
    cardAmount: 210.0,
    tapTxns: 4,
    tapAmount: 130.0,
    transactions: [],
  },
  {
    id: `18102026/${empId}/537376`,
    dateKey: '18102026',
    dateText: '18 Oct 2026',
    timeRange: '09:00 AM – 06:00 PM',
    status: 'paid',
    paidDate: '23 Oct 2026',
    totalAmount: 430.0,
    txnsCount: 13,
    cardTxns: 8,
    cardAmount: 270.0,
    tapTxns: 5,
    tapAmount: 160.0,
    transactions: [],
  },
  {
    id: `17102026/${empId}/537375`,
    dateKey: '17102026',
    dateText: '17 Oct 2026',
    timeRange: '08:00 AM – 04:30 PM',
    status: 'paid',
    paidDate: '23 Oct 2026',
    totalAmount: 365.0,
    txnsCount: 11,
    cardTxns: 7,
    cardAmount: 235.0,
    tapTxns: 4,
    tapAmount: 130.0,
    transactions: [],
  },
  {
    id: `16102026/${empId}/537374`,
    dateKey: '16102026',
    dateText: '16 Oct 2026',
    timeRange: '09:00 AM – 03:00 PM',
    status: 'unpaid',
    totalAmount: 120.0,
    txnsCount: 5,
    cardTxns: 3,
    cardAmount: 75.0,
    tapTxns: 2,
    tapAmount: 45.0,
    transactions: [],
  },
  {
    id: `15102026/${empId}/537373`,
    dateKey: '15102026',
    dateText: '15 Oct 2026',
    timeRange: '08:30 AM – 05:00 PM',
    status: 'paid',
    paidDate: '23 Oct 2026',
    totalAmount: 390.0,
    txnsCount: 12,
    cardTxns: 8,
    cardAmount: 260.0,
    tapTxns: 4,
    tapAmount: 130.0,
    transactions: [],
  },
];

interface OtherBusinessTransactionsScreenProps {
  businessName?: string;
  userName?: string;
  initialEmpId?: string;
  onSelectShift?: (shift: OtherBusinessShiftRecord) => void;
}

type ShiftFilterType = 'all' | 'paid' | 'unpaid';

export default function OtherBusinessTransactionsScreen({
  businessName = 'Crown Cuts',
  userName = 'Soumen Sen',
  initialEmpId,
  onSelectShift,
}: OtherBusinessTransactionsScreenProps) {
  // Find employee matching initialEmpId or default to first
  const initialEmployee = useMemo(() => {
    if (initialEmpId) {
      const match = SALON_EMPLOYEES.find((e) => e.empId === initialEmpId);
      if (match) return match;
    }
    return SALON_EMPLOYEES[0];
  }, [initialEmpId]);

  const [selectedEmployee, setSelectedEmployee] = useState<SalonEmployeeItem>(initialEmployee);
  const [isEmployeeModalVisible, setIsEmployeeModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ShiftFilterType>('all');
  const [dateRangeText, setDateRangeText] = useState('20–26 Oct 2026');

  // Modal for Viewing Shift Sales/Trips (fallback if not navigated via onSelectShift)
  const [selectedShiftForDetails, setSelectedShiftForDetails] = useState<OtherBusinessShiftRecord | null>(null);

  const handleShiftPress = (shift: OtherBusinessShiftRecord) => {
    if (onSelectShift) {
      onSelectShift(shift);
    } else {
      setSelectedShiftForDetails(shift);
    }
  };

  // Generate shifts for the active employee
  const employeeShifts = useMemo(() => {
    return generateShiftsForEmployee(selectedEmployee.empId);
  }, [selectedEmployee.empId]);

  // Overall totals across the 12 shifts
  const shiftStats = useMemo(() => {
    const totalCount = employeeShifts.length;
    const paidList = employeeShifts.filter((s) => s.status === 'paid');
    const unpaidList = employeeShifts.filter((s) => s.status === 'unpaid');

    const totalAmount = employeeShifts.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const paidAmount = paidList.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const unpaidAmount = unpaidList.reduce((acc, curr) => acc + curr.totalAmount, 0);

    return {
      totalCount,
      paidCount: paidList.length,
      unpaidCount: unpaidList.length,
      totalAmount,
      paidAmount,
      unpaidAmount,
    };
  }, [employeeShifts]);

  // Filter shifts based on filterType pill and search query
  const filteredShifts = useMemo(() => {
    return employeeShifts.filter((shift) => {
      // Pill tab filter
      if (filterType === 'paid' && shift.status !== 'paid') return false;
      if (filterType === 'unpaid' && shift.status !== 'unpaid') return false;

      // Search query filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchId = shift.id.toLowerCase().includes(query);
        const matchDate = shift.dateText.toLowerCase().includes(query);
        const matchTime = shift.timeRange.toLowerCase().includes(query);
        const matchAmount = shift.totalAmount.toString().includes(query);
        if (!matchId && !matchDate && !matchTime && !matchAmount) return false;
      }

      return true;
    });
  }, [employeeShifts, filterType, searchQuery]);

  // Handle Export / Print Shift Summary PDF
  const handleExportShiftReport = async (shift: OtherBusinessShiftRecord) => {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0F172A; }
              .header { border-bottom: 2px dashed #E2E8F0; padding-bottom: 16px; margin-bottom: 16px; text-align: center; }
              .title { font-size: 22px; font-weight: 800; margin: 0; color: #0F172A; }
              .sub { font-size: 13px; color: #64748B; margin-top: 4px; }
              .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; margin-top: 8px; background: #ECFDF5; color: #059669; }
              .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px; margin: 16px 0; }
              .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
              .label { color: #64748B; }
              .val { font-weight: 600; color: #0F172A; }
              .table { width: 100%; border-collapse: collapse; margin-top: 14px; }
              .table th { text-align: left; background: #F1F5F9; padding: 8px; font-size: 11px; color: #475569; }
              .table td { padding: 8px; border-bottom: 1px solid #F1F5F9; font-size: 12px; }
              .footer { text-align: center; font-size: 11px; color: #94A3B8; margin-top: 24px; border-top: 1px dashed #E2E8F0; padding-top: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">${businessName}</h1>
              <p class="sub">Shift Audit Report • Employee: ${selectedEmployee.name} (${selectedEmployee.empId})</p>
              <div class="badge">${shift.status === 'paid' ? `● PAID (${shift.paidDate || 'Settled'})` : '● UNPAID / AWAITING'}</div>
            </div>

            <div class="card">
              <div class="row"><span class="label">Shift ID:</span><span class="val">${shift.id}</span></div>
              <div class="row"><span class="label">Date & Time:</span><span class="val">${shift.dateText} • ${shift.timeRange}</span></div>
              <div class="row"><span class="label">Total Collected:</span><span class="val" style="font-weight: 800; font-size: 16px; color: #059669;">$${shift.totalAmount.toFixed(2)} AUD</span></div>
              <div class="row"><span class="label">Card Transactions:</span><span class="val">${shift.cardTxns} txns ($${shift.cardAmount.toFixed(2)})</span></div>
              <div class="row"><span class="label">Tap & Go Transactions:</span><span class="val">${shift.tapTxns} txns ($${shift.tapAmount.toFixed(2)})</span></div>
            </div>

            <h3>Transactions (${shift.transactions.length})</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>TXN ID</th>
                  <th>Service</th>
                  <th>Time</th>
                  <th>Method</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${
                  shift.transactions.length > 0
                    ? shift.transactions
                        .map(
                          (t) => `
                        <tr>
                          <td>${t.id}</td>
                          <td>${t.service}</td>
                          <td>${t.time}</td>
                          <td>${t.method === 'card' ? 'Card' : 'Tap & Go'}</td>
                          <td style="font-weight: bold;">$${t.amount.toFixed(2)}</td>
                        </tr>
                      `
                        )
                        .join('')
                    : '<tr><td colspan="5" style="text-align: center; color: #94A3B8;">No individual line items stored for this shift.</td></tr>'
                }
              </tbody>
            </table>

            <div class="footer">
              <p>Generated by SE Pay Terminal • ${businessName}</p>
              <p>Thank you!</p>
            </div>
          </body>
        </html>
      `;

      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
      const fileName = `Shift_${shift.id.replace(/\//g, '_')}.pdf`;
      const targetUri = `${FileSystem.cacheDirectory}${fileName}`;

      if (base64) {
        await FileSystem.writeAsStringAsync(targetUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        await FileSystem.copyAsync({ from: uri, to: targetUri });
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(targetUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Shift Report ${shift.id}`,
          UTI: '.pdf',
        });
      } else {
        Alert.alert('Report Saved', `Shift report saved to ${targetUri}`);
      }
    } catch (err) {
      console.error('Error exporting shift report:', err);
      Alert.alert('Export Error', 'Unable to generate shift PDF report.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Screen Title: Centered "Shift History" */}
      <HeaderBar title="Shift History" showBack={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. SELECT EMPLOYEE SECTION ── */}
        <View style={styles.employeeSectionHeaderRow}>
          <Text style={styles.employeeSectionTitle}>SELECT EMPLOYEE</Text>
          <View style={styles.totalEmployeesBadge}>
            <Text style={styles.totalEmployeesBadgeText}>{SALON_EMPLOYEES.length} Total</Text>
          </View>
        </View>

        {/* Selected Employee Card with Dropdown Button */}
        <TouchableOpacity
          style={styles.selectedEmployeeCard}
          activeOpacity={0.85}
          onPress={() => setIsEmployeeModalVisible(true)}
        >
          <View style={styles.employeeAvatarWrap}>
            <Image source={selectedEmployee.avatar} style={styles.employeeAvatarImg} />
          </View>

          <Text style={styles.employeeNameText}>{selectedEmployee.name}</Text>

          <View style={styles.empIdBadge}>
            <Text style={styles.empIdBadgeText}>{selectedEmployee.empId}</Text>
          </View>

          <View style={styles.spacer} />

          <View style={styles.chevronCircle}>
            <Ionicons name="chevron-down" size={15} color="#475569" />
          </View>
        </TouchableOpacity>

        {/* ── 2. SEARCH BAR & DATE RANGE ROW ── */}
        <View style={styles.searchDateRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={16} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Shift ID..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearBtn}
              >
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.dateFilterButton}
            activeOpacity={0.8}
            onPress={() => {
              setDateRangeText((prev) =>
                prev === '20–26 Oct 2026' ? 'All Dates' : '20–26 Oct 2026'
              );
            }}
          >
            <Ionicons name="calendar-outline" size={16} color="#0F172A" />
            <Text style={styles.dateFilterText}>{dateRangeText}</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. FILTER PILLS (All, Paid, Unpaid) ── */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === 'all' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => setFilterType('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                filterType === 'all' ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
            >
              All Shifts ({shiftStats.totalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === 'paid' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => setFilterType('paid')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                filterType === 'paid' ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
            >
              Paid Shifts ({shiftStats.paidCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === 'unpaid' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => setFilterType('unpaid')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                filterType === 'unpaid' ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
            >
              Unpaid Shifts ({shiftStats.unpaidCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 4. TOTAL SHIFT COLLECTIONS CARD ── */}
        <View style={styles.collectionsCard}>
          {/* Top Gold Gradient Accent Line */}
          <LinearGradient
            colors={[
              'rgba(251, 191, 36, 0.1)',
              '#FBBF24',
              '#F59E0B',
              '#FBBF24',
              'rgba(251, 191, 36, 0.1)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.cardTopAccent}
          />

          <Text style={styles.collectionsTitle}>TOTAL SHIFT COLLECTIONS</Text>

          {/* Large Amount */}
          <View style={styles.mainAmountRow}>
            <Text style={styles.mainAmountWhole}>
              ${shiftStats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Text>
            <Text style={styles.mainAmountCents}>.00</Text>
          </View>

          {/* Dual-color ratio bar: Green (~90.6%) & Amber (~9.4%) */}
          <View style={styles.ratioProgressBarContainer}>
            <View
              style={[
                styles.ratioProgressGreen,
                { flex: Math.max(1, Math.round(shiftStats.paidAmount)) },
              ]}
            />
            <View
              style={[
                styles.ratioProgressAmber,
                { flex: Math.max(1, Math.round(shiftStats.unpaidAmount)) },
              ]}
            />
          </View>

          {/* Two Metric Summary Boxes */}
          <View style={styles.metricBoxesRow}>
            {/* Box 1: Settled / Paid */}
            <View style={styles.metricBoxPaid}>
              <View style={styles.metricBoxHeaderRow}>
                <View style={styles.bulletPaid} />
                <Text style={styles.metricBoxTitle}>Settled / Paid</Text>
              </View>
              <Text style={styles.metricBoxAmountPaid}>
                ${shiftStats.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.metricBoxSubtext}>
                {shiftStats.paidCount} shifts completed
              </Text>
            </View>

            {/* Box 2: Pending / Unpaid */}
            <View style={styles.metricBoxUnpaid}>
              <View style={styles.metricBoxHeaderRow}>
                <View style={styles.bulletUnpaid} />
                <Text style={styles.metricBoxTitle}>Pending / Unpaid</Text>
              </View>
              <Text style={styles.metricBoxAmountUnpaid}>
                ${shiftStats.unpaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.metricBoxSubtext}>
                {shiftStats.unpaidCount} shifts awaiting
              </Text>
            </View>
          </View>
        </View>

        {/* ── 5. SHIFT RECORDS SECTION ── */}
        <Text style={styles.recordsSectionTitle}>SHIFT RECORDS</Text>

        {/* Shift Records List */}
        {filteredShifts.map((shift) => {
          const isUnpaid = shift.status === 'unpaid';

          return (
            <TouchableOpacity
              key={shift.id}
              style={[styles.shiftCard, isUnpaid && styles.shiftCardUnpaid]}
              activeOpacity={0.88}
              onPress={() => handleShiftPress(shift)}
            >
              {/* Card Header: Shift ID + Status Badge */}
              <View style={styles.cardHeaderRow}>
                <Text
                  style={[styles.shiftIdText, isUnpaid && styles.shiftIdTextUnpaid]}
                  numberOfLines={1}
                >
                  {shift.id}
                </Text>

                {isUnpaid ? (
                  <View style={styles.unpaidBadge}>
                    <View style={styles.unpaidDot} />
                    <Text style={styles.unpaidBadgeText}>UNPAID</Text>
                  </View>
                ) : (
                  <View style={styles.paidBadge}>
                    <View style={styles.paidDot} />
                    <Text style={styles.paidBadgeText}>
                      PAID{shift.paidDate ? ` on ${shift.paidDate}` : ''}
                    </Text>
                  </View>
                )}
              </View>

              {/* Date and Time Row + View Button */}
              <View style={styles.cardMiddleRow}>
                <View style={styles.cardMiddleInfoCol}>
                  <Text style={styles.shiftDateRangeText}>
                    {shift.dateText} • {shift.timeRange}
                  </Text>

                  {/* Txns Badge + Total / Pending Amount */}
                  <View style={styles.txnsAndTotalRow}>
                    <View style={[styles.txnsPill, isUnpaid && styles.txnsPillUnpaid]}>
                      <Text style={[styles.txnsPillText, isUnpaid && styles.txnsPillTextUnpaid]}>
                        {shift.txnsCount} Txns
                      </Text>
                    </View>

                    <Text style={styles.amountLabelText}>
                      {isUnpaid ? 'Pending: ' : 'Total: '}
                      <Text style={[styles.amountValueText, isUnpaid && styles.pendingAmountValueText]}>
                        ${shift.totalAmount.toFixed(2)}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* View > Button */}
                <TouchableOpacity
                  style={[styles.viewTripsButton, isUnpaid && styles.viewTripsButtonUnpaid]}
                  onPress={() => handleShiftPress(shift)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.viewTripsButtonText,
                      isUnpaid && styles.viewTripsButtonTextUnpaid,
                    ]}
                  >
                    View
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={13}
                    color={isUnpaid ? '#D97706' : '#2563EB'}
                  />
                </TouchableOpacity>
              </View>

              {/* Bottom Row: Breakdown Pills (Card & Tap & Go) */}
              <View style={styles.breakdownRow}>
                {/* Card Pill */}
                <View style={[styles.breakdownPill, isUnpaid && styles.breakdownPillUnpaid]}>
                  <Ionicons
                    name="card-outline"
                    size={12}
                    color={isUnpaid ? '#B45309' : '#475569'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.breakdownLabel}>Card: </Text>
                  <Text style={styles.breakdownValue}>
                    {shift.cardTxns} txns • ${shift.cardAmount.toFixed(2)}
                  </Text>
                </View>

                {/* Tap & Go Pill */}
                <View style={[styles.breakdownPill, isUnpaid && styles.breakdownPillUnpaid]}>
                  <MaterialCommunityIcons
                    name="contactless-payment"
                    size={13}
                    color={isUnpaid ? '#B45309' : '#475569'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.breakdownLabel}>Tap & Go: </Text>
                  <Text style={styles.breakdownValue}>
                    {shift.tapTxns} txns • ${shift.tapAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredShifts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Feather name="search" size={32} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Shifts Found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search criteria</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── EMPLOYEE SELECTOR MODAL ── */}
      <Modal
        visible={isEmployeeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEmployeeModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsEmployeeModalVisible(false)}
        >
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Employee</Text>
                <Text style={styles.modalSubtitle}>
                  Filter shifts and collections by team member
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEmployeeModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.employeeOptionsList}>
              {SALON_EMPLOYEES.map((employee) => {
                const isSelected = selectedEmployee.id === employee.id;

                return (
                  <TouchableOpacity
                    key={employee.id}
                    style={[
                      styles.employeeOptionItem,
                      isSelected && styles.employeeOptionItemSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedEmployee(employee);
                      setIsEmployeeModalVisible(false);
                    }}
                  >
                    <Image source={employee.avatar} style={styles.optionAvatar} />

                    <View style={styles.optionInfo}>
                      <View style={styles.optionNameRow}>
                        <Text style={styles.optionName}>{employee.name}</Text>
                        <View
                          style={[
                            styles.optionStatusPill,
                            !employee.isOnline && styles.optionStatusPillOff,
                          ]}
                        >
                          <View
                            style={[
                              styles.optionStatusDot,
                              !employee.isOnline && styles.optionStatusDotOff,
                            ]}
                          />
                          <Text
                            style={[
                              styles.optionStatusText,
                              !employee.isOnline && styles.optionStatusTextOff,
                            ]}
                          >
                            {employee.isOnline ? 'Online' : 'Offline'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.optionMetaRow}>
                        <Text style={styles.optionRole}>{employee.role}</Text>
                        <Text style={styles.optionDot}>•</Text>
                        <Text style={styles.optionEmpId}>EMP ID: {employee.empId}</Text>
                      </View>
                    </View>

                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color="#D97706" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── SHIFT SALES / TRIPS DETAILS MODAL ── */}
      <Modal
        visible={!!selectedShiftForDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedShiftForDetails(null)}
      >
        {selectedShiftForDetails && (
          <View style={styles.detailsModalRoot}>
            <View style={styles.detailsHeader}>
              <TouchableOpacity
                onPress={() => setSelectedShiftForDetails(null)}
                style={styles.detailsBackBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-back" size={24} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.detailsHeaderTitle}>Shift Sales Details</Text>
              <TouchableOpacity
                onPress={() => handleExportShiftReport(selectedShiftForDetails)}
                style={styles.detailsExportBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="share-2" size={19} color="#D97706" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.detailsScrollView}
              contentContainerStyle={styles.detailsScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Shift Banner Summary */}
              <View style={styles.detailsSummaryCard}>
                <View style={styles.detailsSummaryTop}>
                  <View>
                    <Text style={styles.detailsShiftIdLabel}>SHIFT ID</Text>
                    <Text style={styles.detailsShiftIdText}>{selectedShiftForDetails.id}</Text>
                  </View>
                  <View
                    style={[
                      styles.detailsStatusBadge,
                      selectedShiftForDetails.status === 'unpaid' && styles.detailsStatusBadgeUnpaid,
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailsStatusText,
                        selectedShiftForDetails.status === 'unpaid' && styles.detailsStatusTextUnpaid,
                      ]}
                    >
                      {selectedShiftForDetails.status === 'paid' ? 'PAID / SETTLED' : 'UNPAID'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsMetaDivider} />

                <View style={styles.detailsMetaRow}>
                  <View style={styles.detailsMetaCol}>
                    <Text style={styles.detailsMetaLabel}>EMPLOYEE</Text>
                    <Text style={styles.detailsMetaValue}>{selectedEmployee.name}</Text>
                  </View>
                  <View style={styles.detailsMetaCol}>
                    <Text style={styles.detailsMetaLabel}>DATE</Text>
                    <Text style={styles.detailsMetaValue}>{selectedShiftForDetails.dateText}</Text>
                  </View>
                  <View style={styles.detailsMetaCol}>
                    <Text style={styles.detailsMetaLabel}>TOTAL SALES</Text>
                    <Text style={styles.detailsTotalAmount}>
                      ${selectedShiftForDetails.totalAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payment Methods Breakdown Card */}
              <View style={styles.detailsBreakdownCard}>
                <View style={styles.detailsBreakdownCol}>
                  <View style={styles.detailsIconRow}>
                    <Ionicons name="card-outline" size={14} color="#2563EB" />
                    <Text style={styles.detailsMethodTitle}>Card Sales</Text>
                  </View>
                  <Text style={styles.detailsMethodAmount}>
                    ${selectedShiftForDetails.cardAmount.toFixed(2)}
                  </Text>
                  <Text style={styles.detailsMethodSub}>
                    {selectedShiftForDetails.cardTxns} transactions
                  </Text>
                </View>

                <View style={styles.detailsVerticalDivider} />

                <View style={styles.detailsBreakdownCol}>
                  <View style={styles.detailsIconRow}>
                    <MaterialCommunityIcons name="contactless-payment" size={16} color="#EA580C" />
                    <Text style={styles.detailsMethodTitle}>Tap & Go</Text>
                  </View>
                  <Text style={styles.detailsMethodAmount}>
                    ${selectedShiftForDetails.tapAmount.toFixed(2)}
                  </Text>
                  <Text style={styles.detailsMethodSub}>
                    {selectedShiftForDetails.tapTxns} transactions
                  </Text>
                </View>
              </View>

              {/* Transactions Title */}
              <View style={styles.transactionsHeaderRow}>
                <Text style={styles.transactionsSectionTitle}>Shift Line Items / Sales</Text>
                <Text style={styles.transactionsCountBadge}>
                  {selectedShiftForDetails.transactions.length > 0
                    ? `${selectedShiftForDetails.transactions.length} Txns`
                    : `${selectedShiftForDetails.txnsCount} Txns`}
                </Text>
              </View>

              {/* Transactions List */}
              {selectedShiftForDetails.transactions.map((txn) => (
                <View key={txn.id} style={styles.detailsTxnCard}>
                  <View style={styles.detailsTxnTop}>
                    <View>
                      <Text style={styles.detailsTxnService}>{txn.service}</Text>
                      <Text style={styles.detailsTxnId}>{txn.id} • {txn.time}</Text>
                    </View>
                    <Text style={styles.detailsTxnAmount}>${txn.amount.toFixed(2)}</Text>
                  </View>

                  <View style={styles.detailsTxnBottom}>
                    <View style={styles.detailsTxnMethodBadge}>
                      {txn.method === 'card' ? (
                        <Ionicons name="card-outline" size={12} color="#2563EB" />
                      ) : (
                        <MaterialCommunityIcons name="flash" size={12} color="#D97706" />
                      )}
                      <Text
                        style={[
                          styles.detailsTxnMethodText,
                          txn.method === 'card' ? { color: '#2563EB' } : { color: '#D97706' },
                        ]}
                      >
                        {txn.method === 'card' ? 'Chip Card' : 'Tap & Go'}
                      </Text>
                    </View>

                    <View style={styles.detailsSettledBadge}>
                      <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                      <Text style={styles.detailsSettledText}>Settled</Text>
                    </View>
                  </View>
                </View>
              ))}

              {selectedShiftForDetails.transactions.length === 0 && (
                <View style={styles.noTxnsCard}>
                  <Ionicons name="receipt-outline" size={32} color="#CBD5E1" />
                  <Text style={styles.noTxnsTitle}>Archived Shift Summary</Text>
                  <Text style={styles.noTxnsSub}>
                    Total ${selectedShiftForDetails.totalAmount.toFixed(2)} reconciled across{' '}
                    {selectedShiftForDetails.txnsCount} sales.
                  </Text>
                </View>
              )}

              {/* Export Button */}
              <TouchableOpacity
                style={styles.exportFullBtn}
                activeOpacity={0.85}
                onPress={() => handleExportShiftReport(selectedShiftForDetails)}
              >
                <Feather name="printer" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.exportFullBtnText}>Export Shift Audit (PDF)</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },

  /* 1. Select Employee Section */
  employeeSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  employeeSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  totalEmployeesBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  totalEmployeesBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  selectedEmployeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  employeeAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginRight: 9,
  },
  employeeAvatarImg: {
    width: '100%',
    height: '100%',
  },
  employeeNameText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  empIdBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  empIdBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  spacer: {
    flex: 1,
  },
  chevronCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 2. Search & Date Filter */
  searchDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 11,
    paddingHorizontal: 11,
    height: 39,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 11,
    paddingHorizontal: 11,
    height: 39,
    gap: 5,
  },
  dateFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* 3. Filter Pills */
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#2563EB',
  },
  filterPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillTextInactive: {
    color: '#334155',
  },

  /* 4. TOTAL SHIFT COLLECTIONS CARD */
  collectionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 13,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 13,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  collectionsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
    marginTop: 1,
    marginBottom: 3,
  },
  mainAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 9,
  },
  mainAmountWhole: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  mainAmountCents: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 1,
  },
  ratioProgressBarContainer: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 11,
  },
  ratioProgressGreen: {
    backgroundColor: '#10B981',
    height: '100%',
  },
  ratioProgressAmber: {
    backgroundColor: '#F59E0B',
    height: '100%',
  },
  metricBoxesRow: {
    flexDirection: 'row',
    gap: 9,
  },
  metricBoxPaid: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 11,
    padding: 10,
  },
  metricBoxUnpaid: {
    flex: 1,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 11,
    padding: 10,
  },
  metricBoxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  bulletPaid: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  bulletUnpaid: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
    marginRight: 4,
  },
  metricBoxTitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  metricBoxAmountPaid: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: -0.3,
  },
  metricBoxAmountUnpaid: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: -0.3,
  },
  metricBoxSubtext: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 1,
  },

  /* 5. SHIFT RECORDS SECTION */
  recordsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 9,
    paddingHorizontal: 2,
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  shiftCardUnpaid: {
    borderColor: '#FDE68A',
    borderWidth: 1.2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  shiftIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  shiftIdTextUnpaid: {
    color: '#B45309',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    gap: 3.5,
  },
  paidDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: '#10B981',
  },
  paidBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    gap: 3.5,
  },
  unpaidDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: '#F59E0B',
  },
  unpaidBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D97706',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  cardMiddleInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  shiftDateRangeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  txnsAndTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txnsPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  txnsPillUnpaid: {
    backgroundColor: '#FEF3C7',
  },
  txnsPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  txnsPillTextUnpaid: {
    color: '#92400E',
  },
  amountLabelText: {
    fontSize: 11,
    color: '#64748B',
  },
  amountValueText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  pendingAmountValueText: {
    color: '#D97706',
  },
  viewTripsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 7,
    gap: 2,
  },
  viewTripsButtonUnpaid: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  viewTripsButtonText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  viewTripsButtonTextUnpaid: {
    color: '#D97706',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 7,
  },
  breakdownPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  breakdownPillUnpaid: {
    backgroundColor: '#FFFDF7',
    borderColor: '#FDE68A',
  },
  breakdownLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  breakdownValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },

  /* 6. Employee Selection Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  employeeOptionsList: {
    gap: 10,
  },
  employeeOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  employeeOptionItemSelected: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A',
  },
  optionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  optionStatusPillOff: {
    backgroundColor: '#F1F5F9',
  },
  optionStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  optionStatusDotOff: {
    backgroundColor: '#94A3B8',
  },
  optionStatusText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#15803D',
  },
  optionStatusTextOff: {
    color: '#64748B',
  },
  optionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  optionRole: {
    fontSize: 11.5,
    color: '#64748B',
  },
  optionDot: {
    marginHorizontal: 4,
    color: '#CBD5E1',
    fontSize: 10,
  },
  optionEmpId: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#D97706',
  },

  /* 7. Shift Sales Details Modal */
  detailsModalRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailsBackBtn: {
    padding: 4,
  },
  detailsHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailsExportBtn: {
    padding: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
  },
  detailsScrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  detailsScrollContent: {
    padding: 16,
  },
  detailsSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  detailsSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsShiftIdLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  detailsShiftIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  detailsStatusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailsStatusBadgeUnpaid: {
    backgroundColor: '#FFFBEB',
  },
  detailsStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  detailsStatusTextUnpaid: {
    color: '#D97706',
  },
  detailsMetaDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  detailsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsMetaCol: {
    flex: 1,
  },
  detailsMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  detailsMetaValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  detailsTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  detailsBreakdownCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  detailsBreakdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailsIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  detailsMethodTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  detailsMethodAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailsMethodSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  detailsVerticalDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
  },
  transactionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionsSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  transactionsCountBadge: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D97706',
  },
  detailsTxnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
  },
  detailsTxnTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsTxnService: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailsTxnId: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  detailsTxnAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailsTxnBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  detailsTxnMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsTxnMethodText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailsSettledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsSettledText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  noTxnsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  noTxnsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  noTxnsSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  exportFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exportFullBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
