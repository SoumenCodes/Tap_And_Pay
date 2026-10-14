import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import HeaderBar from '../common/HeaderBar';
import { ShiftRecord, ShiftTransaction } from '../../types/shift';

interface ShiftDetailsScreenProps {
  shift: ShiftRecord;
  onBack: () => void;
}

type TxnFilterType = 'all' | 'card' | 'tap_and_go';

export default function ShiftDetailsScreen({ shift, onBack }: ShiftDetailsScreenProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TxnFilterType>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return shift.transactions.filter((txn) => {
      // Filter by method
      if (filterType === 'card' && txn.method !== 'card') return false;
      if (filterType === 'tap_and_go' && txn.method !== 'tap_and_go') return false;

      // Filter by search
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchId = txn.id.toLowerCase().includes(query);
        const matchPickup = txn.pickup.toLowerCase().includes(query);
        const matchDropoff = txn.dropoff.toLowerCase().includes(query);
        const matchAmount = txn.amount.toString().includes(query);
        if (!matchId && !matchPickup && !matchDropoff && !matchAmount) return false;
      }

      return true;
    });
  }, [shift.transactions, filterType, searchQuery]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: { txns: ShiftTransaction[]; total: number } } = {};

    filteredTransactions.forEach((txn) => {
      if (!groups[txn.date]) {
        groups[txn.date] = { txns: [], total: 0 };
      }
      groups[txn.date].txns.push(txn);
      groups[txn.date].total += txn.amount;
    });

    return Object.entries(groups).map(([date, data]) => ({
      date,
      transactions: data.txns,
      total: data.total,
    }));
  }, [filteredTransactions]);

  // Generate HTML for full shift slip
  const getShiftSlipHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111827; }
            .header { text-align: center; border-bottom: 2px dashed #E5E7EB; padding-bottom: 16px; margin-bottom: 16px; }
            .title { font-size: 20px; font-weight: bold; margin: 0; }
            .sub { color: #6B7280; font-size: 13px; margin-top: 4px; }
            .shift-id { font-family: monospace; font-weight: bold; font-size: 14px; margin-top: 6px; }
            .meta-box { background: #F9FAFB; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 13px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .row:last-child { margin-bottom: 0; }
            .label { color: #6B7280; }
            .value { font-weight: 600; }
            .stat-grid { display: flex; gap: 8px; margin-bottom: 16px; }
            .stat-box { flex: 1; border: 1px solid #E5E7EB; border-radius: 8px; padding: 10px; text-align: center; }
            .stat-val { font-size: 16px; font-weight: bold; }
            .stat-lbl { font-size: 11px; color: #6B7280; margin-top: 2px; }
            .trips-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
            .trips-table th { background: #F3F4F6; padding: 8px; text-align: left; }
            .trips-table td { padding: 8px; border-bottom: 1px solid #F3F4F6; }
            .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${shift.businessName}</h1>
            <p class="sub">DRIVER SHIFT SETTLEMENT SLIP</p>
            <div class="shift-id">SHIFT: ${shift.id}</div>
          </div>

          <div class="meta-box">
            <div class="row"><span class="label">Driver Name:</span><span class="value">${shift.driverName}</span></div>
            <div class="row"><span class="label">Taxi Number:</span><span class="value">${shift.taxiNumber}</span></div>
            <div class="row"><span class="label">Date & Time:</span><span class="value">${shift.dateText} (${shift.timeRange})</span></div>
            <div class="row"><span class="label">Duration:</span><span class="value">${shift.duration}</span></div>
            <div class="row"><span class="label">Status:</span><span class="value" style="color: #059669;">${shift.status.toUpperCase()}${shift.paidDate ? ' (' + shift.paidDate + ')' : ''}</span></div>
          </div>

          <div class="stat-grid">
            <div class="stat-box">
              <div class="stat-val" style="color: #D97706;">$${shift.totalAmount.toFixed(2)}</div>
              <div class="stat-lbl">TOTAL (${shift.tripsCount} trips)</div>
            </div>
            <div class="stat-box">
              <div class="stat-val" style="color: #2563EB;">$${shift.cardAmount.toFixed(2)}</div>
              <div class="stat-lbl">CARD (${shift.cardCount} txns)</div>
            </div>
            <div class="stat-box">
              <div class="stat-val" style="color: #EA580C;">$${shift.tapAndGoAmount.toFixed(2)}</div>
              <div class="stat-lbl">TAP & GO (${shift.tapAndGoCount} txns)</div>
            </div>
          </div>

          <h3>Trip Records</h3>
          <table class="trips-table">
            <thead>
              <tr>
                <th>TXN ID</th>
                <th>Time</th>
                <th>Method</th>
                <th>Route</th>
                <th style="text-align: right;">Fare</th>
              </tr>
            </thead>
            <tbody>
              ${shift.transactions
        .map(
          (t) => `
                <tr>
                  <td><b>${t.id}</b></td>
                  <td>${t.time}</td>
                  <td>${t.method === 'card' ? 'Card' : 'Tap & Go'}</td>
                  <td>${t.pickup} &rarr; ${t.dropoff}</td>
                  <td style="text-align: right; font-weight: bold;">$${t.amount.toFixed(2)}</td>
                </tr>
              `
        )
        .join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>SE PAY SECURED TERMINAL PAYMENT SYSTEM</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
  };

  // Reprint Shift Slip (Print directly via native print dialog)
  const handleReprintShiftSlip = async () => {
    try {
      setIsExporting(true);
      await Print.printAsync({
        html: getShiftSlipHtml(),
      });
    } catch (error) {
      console.warn('Print canceled or failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Share Report (Generate PDF in scoped cache & share via native sheet)
  const handleShareReport = async () => {
    try {
      setIsExporting(true);
      const html = getShiftSlipHtml();
      const { uri, base64 } = await Print.printToFileAsync({
        html,
        base64: true,
      });

      const fileName = `shift_report_${Date.now()}.pdf`;
      const targetUri = `${FileSystem.cacheDirectory}${fileName}`;

      if (base64) {
        await FileSystem.writeAsStringAsync(targetUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        await FileSystem.copyAsync({
          from: uri,
          to: targetUri,
        });
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(targetUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Shift Report - ${shift.id}`,
          UTI: '.pdf',
        });
      } else {
        await Share.share({
          title: `Shift Report - ${shift.id}`,
          message: `Shift Report for ${shift.driverName} (${shift.taxiNumber})\nShift ID: ${shift.id}\nDate: ${shift.dateText} (${shift.timeRange})\nTotal: $${shift.totalAmount.toFixed(2)} (${shift.tripsCount} trips)\nCard: $${shift.cardAmount.toFixed(2)} (${shift.cardCount} txns)\nTap & Go: $${shift.tapAndGoAmount.toFixed(2)} (${shift.tapAndGoCount} txns)`,
        });
      }
    } catch (error) {
      console.error('Error sharing shift report:', error);
      try {
        await Share.share({
          title: `Shift Report - ${shift.id}`,
          message: `Shift Report for ${shift.driverName} (${shift.taxiNumber})\nShift ID: ${shift.id}\nDate: ${shift.dateText} (${shift.timeRange})\nTotal: $${shift.totalAmount.toFixed(2)} (${shift.tripsCount} trips)\nCard: $${shift.cardAmount.toFixed(2)} (${shift.cardCount} txns)\nTap & Go: $${shift.tapAndGoAmount.toFixed(2)} (${shift.tapAndGoCount} txns)`,
        });
      } catch {
        Alert.alert('Error', 'Unable to open share menu. Please try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Single trip reprint
  const handleReprintTrip = async (txn: ShiftTransaction) => {
    try {
      await Print.printAsync({
        html: `
          <html>
            <body style="font-family: sans-serif; padding: 20px; text-align: center;">
              <h2>${shift.businessName}</h2>
              <p>Taxi: ${shift.taxiNumber} | Driver: ${shift.driverName}</p>
              <hr/>
              <p><b>${txn.id}</b> - ${txn.time}</p>
              <p>${txn.pickup} &rarr; ${txn.dropoff}</p>
              <p style="font-size: 24px; font-weight: bold;">$${txn.amount.toFixed(2)}</p>
              <p>${txn.verification}</p>
              <hr/>
              <p>SE PAY VERIFIED TRANSACTION</p>
            </body>
          </html>
        `,
      });
    } catch (error) {
      console.warn('Print trip error:', error);
    }
  };

  // Single trip share
  const handleShareTrip = async (txn: ShiftTransaction) => {
    try {
      const html = `
        <html>
          <body style="font-family: sans-serif; padding: 20px; text-align: center;">
            <h2>${shift.businessName}</h2>
            <p>Taxi: ${shift.taxiNumber} | Driver: ${shift.driverName}</p>
            <hr/>
            <p><b>${txn.id}</b> - ${txn.time}</p>
            <p>${txn.pickup} &rarr; ${txn.dropoff}</p>
            <p style="font-size: 24px; font-weight: bold;">$${txn.amount.toFixed(2)}</p>
            <p>${txn.verification}</p>
            <hr/>
            <p>SE PAY DIGITAL RECEIPT</p>
          </body>
        </html>
      `;

      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
      const fileName = `receipt_${txn.id.replace('#', '')}_${Date.now()}.pdf`;
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
          dialogTitle: `Share Receipt ${txn.id}`,
          UTI: '.pdf',
        });
      } else {
        await Share.share({
          title: `Receipt ${txn.id}`,
          message: `Taxi Trip Receipt (${shift.businessName})\nTXN: ${txn.id}\nFare: $${txn.amount.toFixed(2)}\nRoute: ${txn.pickup} to ${txn.dropoff}`,
        });
      }
    } catch (error) {
      console.error('Share trip error:', error);
      try {
        await Share.share({
          title: `Receipt ${txn.id}`,
          message: `Taxi Trip Receipt (${shift.businessName})\nTXN: ${txn.id}\nFare: $${txn.amount.toFixed(2)}\nRoute: ${txn.pickup} to ${txn.dropoff}`,
        });
      } catch {
        // ignore
      }
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Common Header Bar with Shift ID Title */}
      <HeaderBar
        title={shift.id}
        showBack
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── TOP SHIFT SUMMARY CARD (Matching Image 2) ── */}
        <View style={styles.topCard}>
          {/* Driver Photo, Name and Taxi / DC Numbers */}
          <View style={styles.driverProfileRow}>
            <Image
              source={require('../../../assets/emp_avatar_1.png')}
              style={styles.driverPhoto}
            />
            <View style={styles.driverInfoCol}>
              <Text style={styles.driverNameText}>{shift.driverName}</Text>
              <Text style={styles.taxiDcMetaText}>
                Taxi No.: <Text style={styles.taxiNumberHighlight}>{shift.taxiNumber}</Text>
                {' '}| DC 93821048
              </Text>
            </View>
          </View>

          {/* Shift ID & Paid Badge */}
          <View style={styles.shiftIdBadgeRow}>
            <Text style={styles.shiftCodeText}>{shift.id}</Text>

            {shift.status === 'paid' ? (
              <View style={styles.paidBadge}>
                <View style={styles.paidBadgeDot} />
                <Text style={styles.paidBadgeText}>
                  PAID{shift.paidDate ? ` on ${shift.paidDate}` : ''}
                </Text>
              </View>
            ) : (
              <View style={styles.unpaidBadge}>
                <View style={styles.unpaidBadgeDot} />
                <Text style={styles.unpaidBadgeText}>UNPAID</Text>
              </View>
            )}
          </View>

          {/* Date, Time Range & Duration */}
          <Text style={styles.shiftTimeRangeText}>
            {shift.dateText} • {shift.timeRange} • {shift.duration}
          </Text>
        </View>

        {/* ── 3 METRIC STAT BOXES ── */}
        <View style={styles.metricsCard}>
          {/* Column 1: TOTAL */}
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelRow}>
              <View style={styles.bulletTotal} />
              <Text style={styles.metricColumnTitleTotal}>TOTAL</Text>
            </View>
            <View style={styles.metricAmountRow}>
              <Text style={styles.metricDollarTotal}>$</Text>
              <Text style={styles.metricAmountTotal}>{Math.floor(shift.totalAmount)}</Text>
              <Text style={styles.metricAmountCents}>.00</Text>
            </View>
            <Text style={styles.metricSubtext}>{shift.tripsCount} Trips</Text>
          </View>

          <View style={styles.columnDivider} />

          {/* Column 2: CARD */}
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelRow}>
              <Ionicons name="card-outline" size={13} color="#2563EB" />
              <Text style={styles.metricColumnTitleCard}>CARD</Text>
            </View>
            <View style={styles.metricAmountRow}>
              <Text style={styles.metricDollarCard}>$</Text>
              <Text style={styles.metricAmountCard}>{Math.floor(shift.cardAmount)}</Text>
              <Text style={styles.metricAmountCents}>.00</Text>
            </View>
            <Text style={styles.metricSubtext}>{shift.cardCount} txns</Text>
          </View>

          <View style={styles.columnDivider} />

          {/* Column 3: TAP & GO */}
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelRow}>
              <Ionicons name="flash-outline" size={13} color="#D97706" />
              <Text style={styles.metricColumnTitleTap}>TAP & GO</Text>
            </View>
            <View style={styles.metricAmountRow}>
              <Text style={styles.metricDollarTap}>$</Text>
              <Text style={styles.metricAmountTap}>{Math.floor(shift.tapAndGoAmount)}</Text>
              <Text style={styles.metricAmountCents}>.00</Text>
            </View>
            <Text style={styles.metricSubtext}>{shift.tapAndGoCount} txns</Text>
          </View>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={17} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search TXN ID, destination, fare..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── SEGMENTED FILTER PILLS ── */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              filterType === 'all' && styles.segmentTabActive,
            ]}
            onPress={() => setFilterType('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentTabText,
                filterType === 'all' && styles.segmentTabTextActive,
              ]}
            >
              All ({shift.tripsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              filterType === 'card' && styles.segmentTabActive,
            ]}
            onPress={() => setFilterType('card')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentTabText,
                filterType === 'card' && styles.segmentTabTextActive,
              ]}
            >
              Card ({shift.cardCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              filterType === 'tap_and_go' && styles.segmentTabActive,
            ]}
            onPress={() => setFilterType('tap_and_go')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentTabText,
                filterType === 'tap_and_go' && styles.segmentTabTextActive,
              ]}
            >
              Tap & Go ({shift.tapAndGoCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── DATE GROUPS & TRANSACTION CARDS ── */}
        {groupedTransactions.map((group) => (
          <View key={group.date} style={styles.dateGroupContainer}>
            {/* Date Group Header */}
            <View style={styles.dateGroupHeaderRow}>
              <Text style={styles.dateGroupTitle}>{group.date}</Text>
              <View style={styles.dateGroupTotalRow}>
                <Text style={styles.dateGroupCurrency}>$</Text>
                <Text style={styles.dateGroupTotalValue}>
                  {Math.floor(group.total)}
                </Text>
                <Text style={styles.dateGroupCents}>
                  .{((group.total % 1) * 100).toFixed(0).padStart(2, '0')}
                </Text>
              </View>
            </View>

            {/* List of Trip Cards in this Date */}
            {group.transactions.map((txn) => {
              const isCard = txn.method === 'card';

              return (
                <View key={txn.id} style={styles.tripCard}>
                  {/* Top Row: TXN ID + Time + Method Capsule + Amount */}
                  <View style={styles.tripTopRow}>
                    <View style={styles.tripIdTimeGroup}>
                      <Text style={styles.tripIdText}>{txn.id}</Text>
                      <Text style={styles.tripTimeText}>{txn.time}</Text>

                      {isCard ? (
                        <View style={styles.chipCard}>
                          <Ionicons name="card-outline" size={11} color="#2563EB" style={{ marginRight: 3 }} />
                          <Text style={styles.chipCardText}>Card</Text>
                        </View>
                      ) : (
                        <View style={styles.chipTap}>
                          <Ionicons name="flash" size={11} color="#D97706" style={{ marginRight: 3 }} />
                          <Text style={styles.chipTapText}>Tap & Go</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.tripAmountGroup}>
                      <Text style={styles.tripAmountCurrency}>$</Text>
                      <Text style={styles.tripAmountWhole}>
                        {Math.floor(txn.amount)}
                      </Text>
                      <Text style={styles.tripAmountCents}>
                        .{((txn.amount % 1) * 100).toFixed(0).padStart(2, '0')}
                      </Text>
                    </View>
                  </View>

                  {/* Route Box (Blue Pin -> Orange Pin with connecting line) */}
                  <View style={styles.routeBox}>
                    <View style={styles.routePinsCol}>
                      <View style={styles.bluePin} />
                      <View style={styles.verticalRouteLine} />
                      <View style={styles.orangePin} />
                    </View>

                    <View style={styles.routeTextsCol}>
                      <Text style={styles.addressText}>{txn.pickup}</Text>
                      <Text style={[styles.addressText, { marginTop: 10 }]}>{txn.dropoff}</Text>
                    </View>
                  </View>

                  {/* Card Footer: Status & Action Buttons */}
                  <View style={styles.tripFooterRow}>
                    <View style={styles.verificationGroup}>
                      <Ionicons name="checkmark-circle-outline" size={15} color="#10B981" />
                      <Text style={styles.verificationText}>{txn.verification}</Text>
                    </View>

                    <View style={styles.tripActionButtonsRow}>
                      <TouchableOpacity
                        style={styles.tripActionButton}
                        onPress={() => handleReprintTrip(txn)}
                        activeOpacity={0.7}
                      >
                        <Feather name="printer" size={11} color="#334155" style={{ marginRight: 4 }} />
                        <Text style={styles.tripActionText}>Reprint</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.tripActionButton}
                        onPress={() => handleShareTrip(txn)}
                        activeOpacity={0.7}
                      >
                        <Feather name="share-2" size={11} color="#334155" style={{ marginRight: 4 }} />
                        <Text style={styles.tripActionText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {filteredTransactions.length === 0 && (
          <View style={styles.emptyContainer}>
            <Feather name="search" size={32} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Transactions Found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search criteria</Text>
          </View>
        )}

        <View style={{ height: 16 }} />

        {/* ── BOTTOM ACTION BUTTONS (Matching Image 2) ── */}
        <View style={styles.bottomButtonsWrap}>
          <TouchableOpacity
            style={styles.reprintSlipButton}
            onPress={handleReprintShiftSlip}
            disabled={isExporting}
            activeOpacity={0.88}
          >
            {isExporting ? (
              <ActivityIndicator color="#0F172A" size="small" />
            ) : (
              <>
                <Feather name="printer" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.reprintSlipText} numberOfLines={1}>Reprint Shift Slip</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareReportButton}
            onPress={handleShareReport}
            disabled={isExporting}
            activeOpacity={0.88}
          >
            <Feather name="share" size={16} color="#0A3977" style={{ marginRight: 6 }} />
            <Text style={styles.shareReportText} numberOfLines={1}>Share Report</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Math.max(insets.bottom, 24) }} />
      </ScrollView>
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },

  /* Top Summary Card */
  topCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  driverProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverPhoto: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  driverInfoCol: {
    flex: 1,
  },
  driverNameText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  taxiDcMetaText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  taxiNumberHighlight: {
    color: '#D97706',
    fontWeight: '700',
  },
  shiftIdBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  shiftCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  shiftTimeRangeText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  paidBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  paidBadgeText: {
    color: '#059669',
    fontSize: 9.5,
    fontWeight: '800',
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  unpaidBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
  },
  unpaidBadgeText: {
    color: '#D97706',
    fontSize: 9.5,
    fontWeight: '800',
  },

  /* Metrics Card (3 Columns) */
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  columnDivider: {
    width: 1,
    height: '75%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  bulletTotal: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D97706',
  },
  metricColumnTitleTotal: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  metricColumnTitleCard: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  metricColumnTitleTap: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  metricAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  metricDollarTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },
  metricDollarCard: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  metricDollarTap: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },
  metricAmountTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricAmountCard: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricAmountTap: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricAmountCents: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  metricSubtext: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },

  /* Search Bar */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
  },

  /* Segmented Pills */
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentTabActive: {
    backgroundColor: '#2563EB',
  },
  segmentTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTabTextActive: {
    color: '#FFFFFF',
  },

  /* Date Groups & Trip Cards */
  dateGroupContainer: {
    marginBottom: 16,
  },
  dateGroupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  dateGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateGroupTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  dateGroupCurrency: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  dateGroupTotalValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateGroupCents: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },

  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tripTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tripIdTimeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  tripTimeText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  chipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chipCardText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  chipTap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chipTapText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  tripAmountGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tripAmountCurrency: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
  },
  tripAmountWhole: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  tripAmountCents: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Route Box */
  routeBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  routePinsCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    marginRight: 8,
    paddingVertical: 2,
  },
  bluePin: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#2563EB',
  },
  verticalRouteLine: {
    width: 1.5,
    height: 14,
    backgroundColor: '#CBD5E1',
    marginVertical: 2,
  },
  orangePin: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#D97706',
  },
  routeTextsCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  addressText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Trip Footer */
  tripFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verificationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  verificationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  tripActionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tripActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tripActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },

  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* Bottom Actions */
  bottomButtonsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  reprintSlipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBF24',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  reprintSlipText: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '700',
  },
  shareReportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  shareReportText: {
    color: '#0A3977',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
