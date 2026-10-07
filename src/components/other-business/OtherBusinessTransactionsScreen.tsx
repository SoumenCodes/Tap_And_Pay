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
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import HeaderBar from '../common/HeaderBar';
import {
  MOCK_BUSINESS_TRANSACTIONS,
  MOCK_BUSINESS_STATS,
} from '../../data/mockBusinessTransactions';
import { BusinessTransaction } from '../../types/businessTransaction';

interface OtherBusinessTransactionsScreenProps {
  businessName?: string;
  userName?: string;
}

type TxnFilterType = 'all' | 'card' | 'tap_and_go';

export default function OtherBusinessTransactionsScreen({
  businessName = 'Crown Cuts',
  userName = 'Soumen',
}: OtherBusinessTransactionsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TxnFilterType>('all');
  const [dateRangeText, setDateRangeText] = useState('20–26 Oct 2026');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return MOCK_BUSINESS_TRANSACTIONS.filter((txn) => {
      if (filterType === 'card' && txn.method !== 'card') return false;
      if (filterType === 'tap_and_go' && txn.method !== 'tap_and_go') return false;

      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchId = txn.id.toLowerCase().includes(query);
        const matchAmount = txn.amount.toString().includes(query);
        const matchVerification = txn.verification.toLowerCase().includes(query);
        if (!matchId && !matchAmount && !matchVerification) return false;
      }

      return true;
    });
  }, [filterType, searchQuery]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: { txns: BusinessTransaction[]; total: number } } = {};

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

  // Generate HTML for receipt
  const getReceiptHtml = (txn: BusinessTransaction) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111827; text-align: center; }
            .header { border-bottom: 2px dashed #E5E7EB; padding-bottom: 16px; margin-bottom: 16px; }
            .title { font-size: 22px; font-weight: bold; margin: 0; color: #0F172A; }
            .subtitle { font-size: 13px; color: #64748B; margin-top: 4px; }
            .abn { font-size: 11px; color: #94A3B8; margin-top: 2px; }
            .amount-box { margin: 20px 0; padding: 16px; background: #F8FAFC; border-radius: 12px; }
            .amount { font-size: 32px; font-weight: 800; color: #0F172A; margin: 4px 0; }
            .status { color: #10B981; font-weight: 700; font-size: 13px; }
            .details { text-align: left; margin: 16px 0; font-size: 13px; border-bottom: 1px dashed #E5E7EB; padding-bottom: 16px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .label { color: #64748B; }
            .value { font-weight: 600; color: #1E293B; }
            .footer { font-size: 11px; color: #94A3B8; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${businessName}</h1>
            <p class="subtitle">${userName}'s Business</p>
            <p class="abn">ABN: 62 458 123 800 • PH: 0400 555 320</p>
          </div>

          <div class="amount-box">
            <div class="status">● PAID / SETTLED</div>
            <div class="amount">$${txn.amount.toFixed(2)} AUD</div>
            <div style="font-size: 12px; color: #64748B;">${txn.method === 'card' ? 'Chip & PIN Card' : 'Contactless Tap & Go'}</div>
          </div>

          <div class="details">
            <div class="row"><span class="label">Transaction ID:</span><span class="value">${txn.id}</span></div>
            <div class="row"><span class="label">Date & Time:</span><span class="value">${txn.date}, ${txn.time}</span></div>
            <div class="row"><span class="label">Verification:</span><span class="value">${txn.verification}</span></div>
            <div class="row"><span class="label">Terminal ID:</span><span class="value">${txn.terminalId || '#537384'}</span></div>
          </div>

          <div class="footer">
            <p>SE PAY SECURED TERMINAL PAYMENT</p>
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;
  };

  // Reprint Receipt via native print dialog
  const handleReprint = async (txn: BusinessTransaction) => {
    try {
      await Print.printAsync({
        html: getReceiptHtml(txn),
      });
    } catch (error) {
      console.warn('Print error or canceled:', error);
    }
  };

  // Share Receipt via native sheet (WhatsApp, Email, etc.)
  const handleShare = async (txn: BusinessTransaction) => {
    try {
      const html = getReceiptHtml(txn);
      const { uri, base64 } = await Print.printToFileAsync({
        html,
        base64: true,
      });

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
          title: `Receipt ${txn.id} - ${businessName}`,
          message: `Receipt from ${businessName}\nTransaction: ${txn.id}\nAmount: $${txn.amount.toFixed(2)} AUD\nDate: ${txn.date}, ${txn.time}\nStatus: Settled`,
        });
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      try {
        await Share.share({
          title: `Receipt ${txn.id} - ${businessName}`,
          message: `Receipt from ${businessName}\nTransaction: ${txn.id}\nAmount: $${txn.amount.toFixed(2)} AUD\nDate: ${txn.date}, ${txn.time}\nStatus: Settled`,
        });
      } catch (fallbackError) {
        console.error('Fallback share error:', fallbackError);
        Alert.alert('Error', 'Unable to open share menu. Please try again.');
      }
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Common Header Bar */}
      <HeaderBar title="Transactions History" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Merchant Card (Crown Cuts / Soumen's Business) */}
        <View style={styles.merchantCard}>
          <View style={styles.crownBadgeWrap}>
            <Image
              source={require('../../../assets/crown_cuts_badge_hd.png')}
              style={styles.crownImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.merchantInfo}>
            <Text style={styles.merchantName}>{businessName}</Text>
            <Text style={styles.merchantSub}>{userName}&apos;s Business</Text>
          </View>
        </View>

        {/* Search & Date Filter Row */}
        <View style={styles.searchDateRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={17} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search TXN ID, amount.."
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
                style={styles.clearButton}
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

        {/* 3 Metric Stat Boxes */}
        <View style={styles.metricsCard}>
          {/* Column 1: TOTAL */}
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelRow}>
              <View style={styles.bulletTotal} />
              <Text style={styles.metricColumnTitleTotal}>TOTAL</Text>
            </View>
            <View style={styles.metricAmountRow}>
              <Text style={styles.metricAmountTotal}>
                ${Math.floor(MOCK_BUSINESS_STATS.totalAmount)}
              </Text>
              <Text style={styles.metricAmountCents}>.00</Text>
            </View>
            <Text style={styles.metricSubtext}>
              {MOCK_BUSINESS_STATS.totalCount} Transaction
            </Text>
          </View>

          <View style={styles.columnDivider} />

          {/* Column 2: CARD */}
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelRow}>
              <Ionicons name="card-outline" size={13} color="#2563EB" />
              <Text style={styles.metricColumnTitleCard}>CARD</Text>
            </View>
            <View style={styles.metricAmountRow}>
              <Text style={styles.metricAmountCard}>
                ${Math.floor(MOCK_BUSINESS_STATS.cardAmount)}
              </Text>
              <Text style={styles.metricAmountCents}>.00</Text>
            </View>
            <Text style={styles.metricSubtext}>{MOCK_BUSINESS_STATS.cardCount} Txns</Text>
          </View>

          <View style={styles.columnDivider} />

          {/* Column 3: TAP & GO */}
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelRow}>
              <View style={styles.bulletTap} />
              <Text style={styles.metricColumnTitleTap}>TAP & GO</Text>
            </View>
            <View style={styles.metricAmountRow}>
              <Text style={styles.metricAmountTap}>
                ${Math.floor(MOCK_BUSINESS_STATS.tapAndGoAmount)}
              </Text>
              <Text style={styles.metricAmountCents}>.00</Text>
            </View>
            <Text style={styles.metricSubtext}>
              {MOCK_BUSINESS_STATS.tapAndGoCount} Txns
            </Text>
          </View>
        </View>

        {/* Segmented Filter Pills */}
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
              All ({MOCK_BUSINESS_STATS.totalCount})
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
              Card ({MOCK_BUSINESS_STATS.cardCount})
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
              Tap & Go ({MOCK_BUSINESS_STATS.tapAndGoCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grouped Transaction List */}
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

            {/* Transaction Cards */}
            {group.transactions.map((txn) => {
              const isCard = txn.method === 'card';

              return (
                <View key={txn.id} style={styles.txnCard}>
                  {/* Top Row: ID + Time + Method Chip + Amount */}
                  <View style={styles.txnTopRow}>
                    <View style={styles.txnIdTimeGroup}>
                      <Text style={styles.txnIdText}>{txn.id}</Text>
                      <Text style={styles.txnTimeText}>{txn.time}</Text>

                      {isCard ? (
                        <View style={styles.chipCard}>
                          <Ionicons name="card-outline" size={12} color="#2563EB" />
                          <Text style={styles.chipCardText}>Card</Text>
                        </View>
                      ) : (
                        <View style={styles.chipTap}>
                          <MaterialCommunityIcons name="flash" size={12} color="#D97706" />
                          <Text style={styles.chipTapText}>Tap & Go</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.txnAmountGroup}>
                      <Text style={styles.txnAmountCurrency}>$</Text>
                      <Text style={styles.txnAmountWhole}>
                        {Math.floor(txn.amount)}
                      </Text>
                      <Text style={styles.txnAmountCents}>
                        .{((txn.amount % 1) * 100).toFixed(0).padStart(2, '0')}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Row: Settlement Verification + Action Buttons */}
                  <View style={styles.txnBottomRow}>
                    <View style={styles.verificationGroup}>
                      <Ionicons name="checkmark-circle-outline" size={15} color="#10B981" />
                      <Text style={styles.verificationText}>{txn.verification}</Text>
                    </View>

                    <View style={styles.txnActionsRow}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleReprint(txn)}
                        activeOpacity={0.7}
                      >
                        <Feather name="printer" size={12} color="#334155" />
                        <Text style={styles.actionButtonText}>Reprint</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleShare(txn)}
                        activeOpacity={0.7}
                      >
                        <Feather name="share" size={12} color="#334155" />
                        <Text style={styles.actionButtonText}>Share</Text>
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

        <View style={{ height: 40 }} />
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  merchantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  crownBadgeWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  crownImage: {
    width: 32,
    height: 32,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  merchantSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  searchDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 2,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 6,
  },
  dateFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  columnDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#F1F5F9',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  bulletTotal: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  bulletTap: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EA580C',
  },
  metricColumnTitleTotal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  metricColumnTitleCard: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  metricColumnTitleTap: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  metricAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricAmountTotal: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricAmountCard: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2563EB',
  },
  metricAmountTap: {
    fontSize: 19,
    fontWeight: '800',
    color: '#EA580C',
  },
  metricAmountCents: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metricSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
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
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  dateGroupTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  dateGroupCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  dateGroupTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateGroupCents: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  txnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  txnTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  txnIdTimeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txnIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  txnTimeText: {
    fontSize: 12,
    color: '#64748B',
  },
  chipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  chipCardText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  chipTap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  chipTapText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  txnAmountGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  txnAmountCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  txnAmountWhole: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  txnAmountCents: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  txnBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  verificationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  verificationText: {
    fontSize: 11,
    color: '#475569',
  },
  txnActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
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
});
