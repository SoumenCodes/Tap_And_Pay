import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Share,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';
import HeaderBar from '../../common/HeaderBar';
import { useConfirmModal } from '../../../context/ConfirmModalContext';
import {
  shiftService,
  ShiftDetailsData,
  ShiftDetailsTransactionItem,
} from '../../../services/shiftService';
import { receiptService } from '../../../services/receiptService';
import { animatedGifService } from '../../../services/animatedGifService';
import { getAssetDataUri, normalizeImageUrl } from '../../../utils/assetUtils';
import {
  formatSydneyToUserDate,
  formatSydneyToUserTime,
  formatSydneyToUserDateTime,
  formatShiftRecordTime,
} from '../../../utils/dateUtils';

function getExportFilename(prefix: string, bizName: string, ext: string): string {
  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${prefix}_${sanitize(bizName)}_${Date.now()}.${ext}`;
}

interface OtherBusinessShiftDetailsScreenProps {
  shiftId: string;
  onBack: () => void;
  businessName?: string;
  userName?: string;
}

type TxnFilterType = 'all' | 'card' | 'tap';

export default function OtherBusinessShiftDetailsScreen({
  shiftId = '13',
  onBack,
  businessName = 'Business',
  userName = 'Staff Member',
}: OtherBusinessShiftDetailsScreenProps) {
  const router = useRouter();
  const { showAlert } = useConfirmModal();

  // Share Modal & Off-screen Capture States
  const [selectedTxnForShare, setSelectedTxnForShare] = useState<ShiftDetailsTransactionItem | null>(null);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const shareReceiptCardRef = useRef<View>(null);
  const shareAdCardRef = useRef<View>(null);

  // API State
  const [shiftDetails, setShiftDetails] = useState<ShiftDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TxnFilterType>('all');

  // Fetch shift details from live API (GET /api/shift/history/details/:id)
  const fetchShiftDetails = useCallback(
    async (methodFilter?: string, isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setErrorMessage(null);

        const methodParam = methodFilter !== undefined ? methodFilter : filterType;
        const res = await shiftService.getShiftDetails(shiftId, {
          method: methodParam !== 'all' ? methodParam : undefined,
        });

        if (res?.data) {
          setShiftDetails(res.data);
        }
      } catch (err: any) {
        console.warn('Failed to load shift details:', err?.message || err);
        setErrorMessage(err?.message || 'Unable to load shift details.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [shiftId, filterType]
  );

  // Initial load
  useEffect(() => {
    let isMounted = true;
    shiftService
      .getShiftDetails(shiftId)
      .then((res) => {
        if (isMounted && res?.data) {
          setShiftDetails(res.data);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          console.warn('Failed to load shift details:', err?.message || err);
          setErrorMessage(err?.message || 'Unable to load shift details.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [shiftId]);

  const handleRefresh = () => {
    fetchShiftDetails(filterType, true);
  };

  const handleFilterChange = (newFilter: TxnFilterType) => {
    setFilterType(newFilter);
    fetchShiftDetails(newFilter);
  };

  // Convert shift start_at & end_at from Australia/Sydney to user device local time
  const shiftTime = useMemo(() => {
    if (!shiftDetails?.shift_info) {
      return { dateText: '--', timeRangeText: '--' };
    }
    return formatShiftRecordTime({
      start_at: shiftDetails.shift_info.start_at,
      end_at: shiftDetails.shift_info.end_at,
      time_range: shiftDetails.shift_info.time_range,
      session_date: shiftDetails.shift_info.session_date,
    });
  }, [
    shiftDetails?.shift_info?.start_at,
    shiftDetails?.shift_info?.end_at,
    shiftDetails?.shift_info?.time_range,
    shiftDetails?.shift_info?.session_date,
  ]);

  // Filter transactions by search query locally
  const filteredTransactions = useMemo(() => {
    const list = shiftDetails?.transactions || [];
    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter((txn) => {
      const matchId = (txn.transaction_id || '').toLowerCase().includes(query);
      const matchMethod = (txn.payment_method || '').toLowerCase().includes(query);
      const matchAmount = (txn.amount_formatted || txn.amount?.toString() || '').toLowerCase().includes(query);
      const matchDate = (txn.date || '').toLowerCase().includes(query);
      const matchPickup = (txn.pickup_location || txn.receipt?.pickup_location || '').toLowerCase().includes(query);
      const matchDrop = (txn.drop_location || txn.receipt?.drop_location || '').toLowerCase().includes(query);
      return matchId || matchMethod || matchAmount || matchDate || matchPickup || matchDrop;
    });
  }, [shiftDetails?.transactions, searchQuery]);

  // Group transactions by user's local date (e.g. "31 Oct 2026")
  const groupedTransactions = useMemo(() => {
    const groups: { [dateStr: string]: { txns: ShiftDetailsTransactionItem[]; total: number } } = {};

    filteredTransactions.forEach((txn) => {
      const groupDate = formatSydneyToUserDate(txn.date) || txn.date.split(' ')[0] || 'Transactions';
      if (!groups[groupDate]) {
        groups[groupDate] = { txns: [], total: 0 };
      }
      groups[groupDate].txns.push(txn);
      groups[groupDate].total += txn.amount || 0;
    });

    return Object.entries(groups).map(([date, data]) => ({
      date,
      transactions: data.txns,
      total: data.total,
    }));
  }, [filteredTransactions]);

  // Helper for whole and cents display
  const formatAmountParts = (amount?: number) => {
    if (amount === undefined || amount === null) {
      return { whole: '0', cents: '.00' };
    }
    const whole = Math.floor(amount).toLocaleString('en-US');
    const cents = (amount % 1).toFixed(2).split('.')[1] || '00';
    return { whole, cents: `.${cents}` };
  };

  // Memoized details for the selected transaction for sharing
  const selectedShareDetails = useMemo(() => {
    if (!selectedTxnForShare) return null;
    const r = selectedTxnForShare.receipt;
    const isTaxi = Boolean(
      shiftDetails?.is_taxi_service ||
      r?.taxi_number ||
      shiftDetails?.user_type_key?.includes('taxi')
    );
    const biz = r?.business_name || shiftDetails?.header?.business_name || shiftDetails?.business_name || businessName;
    const logo = normalizeImageUrl(r?.business_logo || shiftDetails?.header?.logo_url);
    const abnVal = r?.abn || shiftDetails?.header?.abn || '19113303849';
    const phoneVal = r?.phone_no || r?.phone || shiftDetails?.header?.phone || '9113303849';
    const taxiNo = r?.taxi_number || r?.taxi_no || shiftDetails?.header?.taxi_no || shiftDetails?.user?.taxi_no || '';
    const dcNo = r?.dc_number || shiftDetails?.header?.dc_number || shiftDetails?.user?.dc_number || '';
    const staff = shiftDetails?.user?.name || userName;
    const staffCode = shiftDetails?.user?.code || shiftDetails?.user?.emp_id || '';
    const pickup = r?.pickup_location || selectedTxnForShare.pickup_location || '';
    const dropoff = r?.drop_location || selectedTxnForShare.drop_location || '';
    const hasRoute = Boolean(pickup || dropoff);
    const numAmount = r?.amount !== undefined ? Number(r.amount) : Number(selectedTxnForShare.amount);
    const formattedWhole = Math.floor(numAmount).toLocaleString('en-US');
    const formattedCents = ((numAmount % 1) * 100).toFixed(0).padStart(2, '0');
    const isCash = (selectedTxnForShare.payment_method || '').toLowerCase().includes('cash');
    const isTap = (selectedTxnForShare.payment_method || '').toLowerCase().includes('tap');
    const brand = (r?.card_brand || (isCash ? 'CASH' : isTap ? 'TAP & GO' : 'VISA')).toUpperCase();
    const payId = r?.payment_id || selectedTxnForShare.transaction_id;
    const dt = formatSydneyToUserDateTime(r?.date_time || selectedTxnForShare.date) || selectedTxnForShare.date;
    const bk = r?.payment_break_down;
    const hasBk = Boolean(bk && (bk.base_amount !== undefined || bk.payable_amount !== undefined));
    const bkBase = bk?.base_amount !== undefined ? Number(bk.base_amount) : (bk?.payable_amount !== undefined && bk?.service_fee !== undefined ? Number(bk.payable_amount) - Number(bk.service_fee) : null);
    const bkFee = bk?.service_fee !== undefined ? Number(bk.service_fee) : 0;
    const bkTotal = bk?.payable_amount !== undefined ? Number(bk.payable_amount) : numAmount;
    const hasAd = Boolean(r?.ad_banner && r?.banner_image_url);
    const banner = normalizeImageUrl(r?.banner_image_url);

    return {
      isTaxi,
      biz,
      logo,
      abnVal,
      phoneVal,
      taxiNo,
      dcNo,
      staff,
      staffCode,
      pickup,
      dropoff,
      hasRoute,
      numAmount,
      formattedWhole,
      formattedCents,
      isCash,
      isTap,
      brand,
      payId,
      dt,
      hasBk,
      bkBase,
      bkFee,
      bkTotal,
      hasAd,
      banner,
    };
  }, [selectedTxnForShare, shiftDetails, businessName, userName]);

  // Generate dynamic, rich HTML for individual receipt matching live template
  const generateDynamicReceiptHtml = async (txn: ShiftDetailsTransactionItem) => {
    let taxiLogoUri: string | null = null;
    let sePayLogoUri: string | null = null;
    try {
      taxiLogoUri = await getAssetDataUri(
        require('../../../../assets/taxi-logo.png'),
        'image/png'
      );
    } catch {
      // ignore
    }
    try {
      sePayLogoUri = await getAssetDataUri(
        require('../../../../assets/SE-pay-logo-gif.gif'),
        'image/gif'
      );
    } catch {
      // ignore
    }

    const r = txn.receipt;
    const isTaxi = Boolean(
      shiftDetails?.is_taxi_service ||
      r?.taxi_number ||
      shiftDetails?.user_type_key?.includes('taxi')
    );
    const biz = r?.business_name || shiftDetails?.header?.business_name || shiftDetails?.business_name || businessName;
    const logoUrl = normalizeImageUrl(r?.business_logo || shiftDetails?.header?.logo_url);
    const abnVal = r?.abn || shiftDetails?.header?.abn || '19113303849';
    const phoneVal = r?.phone_no || r?.phone || shiftDetails?.header?.phone || '9113303849';
    const taxiNo = r?.taxi_number || r?.taxi_no || shiftDetails?.header?.taxi_no || shiftDetails?.user?.taxi_no || '';
    const dcNo = r?.dc_number || shiftDetails?.header?.dc_number || shiftDetails?.user?.dc_number || '';
    const staff = shiftDetails?.user?.name || userName;
    const staffCode = shiftDetails?.user?.code || shiftDetails?.user?.emp_id || '';
    const pickup = r?.pickup_location || txn.pickup_location || '';
    const dropoff = r?.drop_location || txn.drop_location || '';
    const hasRoute = Boolean(pickup || dropoff);
    const numAmount = r?.amount !== undefined ? Number(r.amount) : Number(txn.amount);
    const formattedWhole = Math.floor(numAmount).toLocaleString('en-US');
    const formattedCents = ((numAmount % 1) * 100).toFixed(0).padStart(2, '0');
    const isCash = (txn.payment_method || '').toLowerCase().includes('cash');
    const isTap = (txn.payment_method || '').toLowerCase().includes('tap');
    const brand = (r?.card_brand || (isCash ? 'CASH' : isTap ? 'TAP & GO' : 'VISA')).toUpperCase();
    const payId = r?.payment_id || txn.transaction_id;
    const dt = formatSydneyToUserDateTime(r?.date_time || txn.date) || txn.date;
    const bk = r?.payment_break_down;
    const hasBk = Boolean(bk && (bk.base_amount !== undefined || bk.payable_amount !== undefined));
    const bkBase = bk?.base_amount !== undefined ? Number(bk.base_amount) : (bk?.payable_amount !== undefined && bk?.service_fee !== undefined ? Number(bk.payable_amount) - Number(bk.service_fee) : null);
    const bkFee = bk?.service_fee !== undefined ? Number(bk.service_fee) : 0;
    const bkTotal = bk?.payable_amount !== undefined ? Number(bk.payable_amount) : numAmount;
    const hasAd = Boolean(r?.ad_banner && r?.banner_image_url);
    const bannerUrl = normalizeImageUrl(r?.banner_image_url);
    const paymentMethodLabel = r?.payment_method || txn.payment_method || 'Card';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - ${biz}</title>
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @page { size: A4 portrait; margin: 8mm 12mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0; padding: 0; background-color: #FFFFFF; color: #0F172A;
      display: flex; justify-content: center; align-items: center; width: 100%;
    }
    .page-container {
      width: 100%; max-width: 480px; margin: 0 auto; height: 100vh; max-height: 278mm;
      display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid;
    }
    .receipt-card, .receipt-card-70 {
      width: 100%; max-width: 480px; margin: 0 auto; background: #FFFDF7;
      border: 1.5px solid #FEF08A; border-radius: 20px; padding: 16px 20px 14px; text-align: center;
    }
    .receipt-card-70 { flex: 1; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; margin: 0 auto 10px; }
    .logo-badge {
      width: 46px; height: 46px; background: #FEF9C3; border: 1.2px solid #FDE047; border-radius: 12px;
      margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 4px;
    }
    .logo-badge img { width: 100%; height: 100%; object-fit: contain; }
    .biz-name { font-size: 16.5px; font-weight: 800; color: #0F172A; margin-bottom: 2px; }
    .tax-invoice-heading { font-size: 16px; font-weight: 900; color: #0F172A; letter-spacing: 2px; margin: 2px 0 4px; text-transform: uppercase; }
    .biz-meta { font-size: 10.5px; color: #64748B; font-weight: 600; }
    .total-paid-label { font-size: 10.5px; font-weight: 800; color: #94A3B8; letter-spacing: 0.8px; margin-top: 10px; }
    .amount { font-size: 34px; font-weight: 900; color: #0F172A; margin: 1px 0 3px; }
    .dollar { font-size: 20px; color: #D97706; vertical-align: baseline; }
    .decimal { font-size: 22px; font-weight: 800; }
    .paid-badge {
      display: inline-flex; align-items: center; background: #ECFDF5; border: 1px solid #A7F3D0;
      color: #059669; font-size: 10.5px; font-weight: 800; padding: 2px 9px; border-radius: 12px;
    }
    .paid-dot { width: 6px; height: 6px; border-radius: 50%; background: #10B981; margin-right: 4px; }
    .divider { height: 1px; background: #F1F5F9; margin: 9px 0; }
    .route-row { display: flex; justify-content: space-between; align-items: center; padding: 0 4px; text-align: left; }
    .route-col { flex: 1; }
    .route-col.right { text-align: right; }
    .route-label { font-size: 9.5px; font-weight: 700; color: #94A3B8; letter-spacing: 0.5px; }
    .route-val { font-size: 12px; font-weight: 700; color: #0F172A; margin-top: 1px; }
    .arrow { font-size: 16px; color: #F59E0B; padding: 0 6px; }
    .breakdown-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 8px 10px; margin: 4px 0; }
    .breakdown-hdr { font-size: 9.5px; font-weight: 800; color: #64748B; letter-spacing: 0.5px; text-align: left; margin-bottom: 4px; }
    .breakdown-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; color: #64748B; }
    .breakdown-val { font-weight: 700; color: #0F172A; }
    .breakdown-row.total { font-weight: 800; color: #0F172A; font-size: 12px; margin-top: 3px; }
    .breakdown-divider { height: 1px; background: #E2E8F0; margin: 4px 0; }
    .breakdown-total-val { font-weight: 900; color: #D97706; }
    .meta-list { text-align: left; display: flex; flex-direction: column; gap: 7px; padding: 0 2px; }
    .meta-row { display: flex; justify-content: space-between; align-items: center; }
    .meta-label { font-size: 10px; color: #94A3B8; font-weight: 500; }
    .meta-value { font-size: 12px; font-weight: 700; color: #0F172A; margin-top: 1px; }
    .pill-card { background: #EFF6FF; border: 1px solid #DBEAFE; color: #2563EB; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
    .pill-cash-tag { background: #ECFDF5; border: 1px solid #A7F3D0; color: #059669; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
    .pill-brand { background: #EFF6FF; border: 1px solid #BFDBFE; color: #1D4ED8; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px; }
    .pill-brand-cash { background: #ECFDF5; border: 1px solid #A7F3D0; color: #059669; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px; }
    .footer { margin-top: 10px; padding-top: 8px; border-top: 1px solid #F1F5F9; text-align: center; }
    .thank-you { font-size: 10px; font-weight: 800; letter-spacing: 0.5px; margin: 0 0 2px; color: #0F172A; }
    .powered-by { font-size: 8px; color: #94A3B8; font-weight: 700; letter-spacing: 1.2px; margin: 0 0 3px; }
    .se-pay-gif-logo { display: block; margin: 0 auto; width: 95px; height: auto; object-fit: contain; }
    .ad-banner-30 { height: 29%; background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 8px 12px 10px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
    .ad-tag-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .ad-tag { font-size: 8.5px; font-weight: 800; color: #94A3B8; letter-spacing: 0.8px; text-transform: uppercase; }
    .ad-provider { font-size: 8.5px; font-weight: 700; color: #D97706; letter-spacing: 0.5px; }
    .ad-img-box { flex: 1; width: 100%; height: calc(100% - 16px); border-radius: 12px; overflow: hidden; background: #0F172A; }
    .ad-img-box img { width: 100%; height: 100%; object-fit: cover; display: block; }
  </style>
</head>
<body>
  ${hasAd && bannerUrl ? `
  <div class="page-container">
    <div class="receipt-card-70">
      <div class="logo-badge">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : taxiLogoUri ? `<img src="${taxiLogoUri}" alt="Taxi" />` : `<div style="font-size: 22px;">🚕</div>`}
      </div>
      <div class="biz-name">${biz}</div>
      <div class="tax-invoice-heading">TAX INVOICE</div>
      <div class="biz-meta">ABN: ${abnVal} • PH: ${phoneVal}</div>
      ${isTaxi ? `<div class="biz-meta">TAXI NO.: ${taxiNo}${dcNo ? ' &nbsp;&nbsp; DC: ' + dcNo : ''}</div>` : `<div class="biz-meta">EMP: ${staff}${staffCode ? ' (' + staffCode + ')' : ''}</div>`}

      <div class="total-paid-label">TOTAL PAID (INC GST)</div>
      <div class="amount"><span class="dollar">$</span>${formattedWhole}<span class="decimal">.${formattedCents}</span></div>
      <div><span class="paid-badge"><span class="paid-dot"></span>PAID</span></div>

      <div class="divider"></div>

      ${hasRoute ? `
      <div class="route-row">
        <div class="route-col"><div class="route-label">PICKUP</div><div class="route-val">${pickup || '--'}</div></div>
        <div class="arrow">→</div>
        <div class="route-col right"><div class="route-label">DROP OFF</div><div class="route-val">${dropoff || '--'}</div></div>
      </div>
      <div class="divider"></div>
      ` : ''}

      ${hasBk && bkBase !== null ? `
      <div class="breakdown-box">
        <div class="breakdown-hdr">PAYMENT BREAKDOWN</div>
        <div class="breakdown-row"><span>Base Amount</span><span class="breakdown-val">$${Number(bkBase).toFixed(2)}</span></div>
        <div class="breakdown-row"><span>Service Fee</span><span class="breakdown-val">$${Number(bkFee).toFixed(2)}</span></div>
        <div class="breakdown-divider"></div>
        <div class="breakdown-row total"><span>Total (INC GST)</span><span class="breakdown-total-val">$${Number(bkTotal).toFixed(2)}</span></div>
      </div>
      <div class="divider"></div>
      ` : ''}

      <div class="meta-list">
        <div class="meta-row">
          <div><div class="meta-label">Date & Time</div><div class="meta-value">${dt}</div></div>
          <div class="${isCash ? 'pill-cash-tag' : 'pill-card'}">${isCash ? '💵 Cash' : isTap ? '⚡ Tap & Go' : '💳 Card'}</div>
        </div>
        <div class="meta-row">
          <div><div class="meta-label">Payment Method</div><div class="meta-value">${paymentMethodLabel}</div></div>
          <div class="${isCash ? 'pill-brand-cash' : 'pill-brand'}">${brand}</div>
        </div>
        <div class="meta-row">
          <div><div class="meta-label">${isCash ? 'Receipt ID' : 'Payment ID'}</div><div class="meta-value">${payId}</div></div>
        </div>
      </div>

      <div class="footer">
        <div class="thank-you">THANK YOU FOR CHOOSING ${biz.toUpperCase()}</div>
        <div class="powered-by">POWERED BY</div>
        ${sePayLogoUri ? `<img class="se-pay-gif-logo" src="${sePayLogoUri}" alt="SE PAY" />` : '<div style="font-weight: 800; font-size: 12px; color: #0F172A;">SE PAY</div>'}
      </div>
    </div>

    <!-- 30% Advertisement Banner -->
    <div class="ad-banner-30">
      <div class="ad-tag-row"><span class="ad-tag">SPONSORED ADVERTISEMENT</span><span class="ad-provider">SE PAY SPECIAL OFFER</span></div>
      <div class="ad-img-box"><img src="${bannerUrl}" alt="Promotion" /></div>
    </div>
  </div>
  ` : `
  <div class="receipt-card">
    <div class="logo-badge">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : taxiLogoUri ? `<img src="${taxiLogoUri}" alt="Taxi" />` : `<div style="font-size: 22px;">🚕</div>`}
    </div>
    <div class="biz-name">${biz}</div>
    <div class="tax-invoice-heading">TAX INVOICE</div>
    <div class="biz-meta">ABN: ${abnVal} • PH: ${phoneVal}</div>
    ${isTaxi ? `<div class="biz-meta">TAXI NO.: ${taxiNo}${dcNo ? ' &nbsp;&nbsp; DC: ' + dcNo : ''}</div>` : `<div class="biz-meta">EMP: ${staff}${staffCode ? ' (' + staffCode + ')' : ''}</div>`}

    <div class="total-paid-label">TOTAL PAID (INC GST)</div>
    <div class="amount"><span class="dollar">$</span>${formattedWhole}<span class="decimal">.${formattedCents}</span></div>
    <div><span class="paid-badge"><span class="paid-dot"></span>PAID</span></div>

    <div class="divider"></div>

    ${hasRoute ? `
    <div class="route-row">
      <div class="route-col"><div class="route-label">PICKUP</div><div class="route-val">${pickup || '--'}</div></div>
      <div class="arrow">→</div>
      <div class="route-col right"><div class="route-label">DROP OFF</div><div class="route-val">${dropoff || '--'}</div></div>
    </div>
    <div class="divider"></div>
    ` : ''}

    ${hasBk && bkBase !== null ? `
    <div class="breakdown-box">
      <div class="breakdown-hdr">PAYMENT BREAKDOWN</div>
      <div class="breakdown-row"><span>Base Amount</span><span class="breakdown-val">$${Number(bkBase).toFixed(2)}</span></div>
      <div class="breakdown-row"><span>Service Fee</span><span class="breakdown-val">$${Number(bkFee).toFixed(2)}</span></div>
      <div class="breakdown-divider"></div>
      <div class="breakdown-row total"><span>Total (INC GST)</span><span class="breakdown-total-val">$${Number(bkTotal).toFixed(2)}</span></div>
    </div>
    <div class="divider"></div>
    ` : ''}

    <div class="meta-list">
      <div class="meta-row">
        <div><div class="meta-label">Date & Time</div><div class="meta-value">${dt}</div></div>
        <div class="${isCash ? 'pill-cash-tag' : 'pill-card'}">${isCash ? '💵 Cash' : isTap ? '⚡ Tap & Go' : '💳 Card'}</div>
      </div>
      <div class="meta-row">
        <div><div class="meta-label">Payment Method</div><div class="meta-value">${paymentMethodLabel}</div></div>
        <div class="${isCash ? 'pill-brand-cash' : 'pill-brand'}">${brand}</div>
      </div>
      <div class="meta-row">
        <div><div class="meta-label">${isCash ? 'Receipt ID' : 'Payment ID'}</div><div class="meta-value">${payId}</div></div>
      </div>
    </div>

    <div class="footer">
      <div class="thank-you">THANK YOU FOR CHOOSING ${biz.toUpperCase()}</div>
      <div class="powered-by">POWERED BY</div>
      ${sePayLogoUri ? `<img class="se-pay-gif-logo" src="${sePayLogoUri}" alt="SE PAY" />` : '<div style="font-weight: 800; font-size: 12px; color: #0F172A;">SE PAY</div>'}
    </div>
  </div>
  `}
</body>
</html>
    `;
  };

  // Reprint Receipt via native print dialog
  const handleReprint = async (txn: ShiftDetailsTransactionItem) => {
    try {
      setIsPrinting(true);
      const html = await generateDynamicReceiptHtml(txn);
      await Print.printAsync({ html });
    } catch (error) {
      console.warn('Print error or canceled:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  // Open Share format selection modal for a transaction
  const handleShare = (txn: ShiftDetailsTransactionItem) => {
    setSelectedTxnForShare(txn);
    setIsShareModalVisible(true);
  };

  // 1. Share as High-Resolution PNG Image
  const handleSharePhoto = async () => {
    if (!selectedTxnForShare) return;
    setIsShareModalVisible(false);
    try {
      setIsSharing(true);
      if (!shareReceiptCardRef.current) {
        throw new Error('Receipt view is not ready');
      }

      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const base64Image = await captureRef(shareReceiptCardRef, {
        format: 'png',
        quality: 1.0,
        result: 'base64',
      });

      const bizName =
        selectedTxnForShare.receipt?.business_name ||
        shiftDetails?.header?.business_name ||
        businessName;
      const filename = getExportFilename('Receipt_Card', bizName, 'png');
      const targetUri = `${baseDir}${filename}`;

      await FileSystem.writeAsStringAsync(targetUri, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(targetUri);
          if (fileInfo.exists) {
            await Sharing.shareAsync(targetUri, {
              mimeType: 'image/png',
              dialogTitle: `Share Receipt Image - ${bizName}`,
              UTI: 'public.png',
            });
            return;
          }
        } catch (shareAsyncErr) {
          console.warn('Sharing.shareAsync (image) failed, falling back to Share.share:', shareAsyncErr);
        }
      }

      const localDateTime =
        formatSydneyToUserDateTime(selectedTxnForShare.receipt?.date_time || selectedTxnForShare.date) ||
        selectedTxnForShare.date;
      const pickup = selectedTxnForShare.pickup_location || selectedTxnForShare.receipt?.pickup_location;
      const drop = selectedTxnForShare.drop_location || selectedTxnForShare.receipt?.drop_location;
      const routeInfo = pickup || drop ? `\nRoute: ${pickup || '--'} to ${drop || '--'}` : '';
      const shareMsg = `Receipt: ${bizName}\nTransaction: ${selectedTxnForShare.transaction_id}\nAmount: ${selectedTxnForShare.amount_formatted}\nMethod: ${selectedTxnForShare.payment_method}\nDate: ${localDateTime}${routeInfo}`;
      await Share.share(
        Platform.OS === 'ios'
          ? {
              title: `Receipt Image - ${bizName}`,
              message: shareMsg,
              url: targetUri,
            }
          : {
              title: `Receipt Image - ${bizName}`,
              message: shareMsg,
            }
      );
    } catch (error) {
      console.error('Error sharing receipt image:', error);
      showAlert({
        title: 'Share Receipt',
        message: 'Could not generate receipt image. Please try sharing as PDF.',
        type: 'danger',
      });
    } finally {
      setIsSharing(false);
    }
  };

  // 2. Share as Animated Card (GIF: 4s Receipt + 4s Ad Banner)
  const handleShareAnimatedGif = async () => {
    if (!selectedTxnForShare) return;
    setIsShareModalVisible(false);
    try {
      setIsSharing(true);

      if (!shareReceiptCardRef.current || !shareAdCardRef.current) {
        throw new Error('Receipt or Ad view is not ready');
      }

      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const bannerImageUrl = normalizeImageUrl(selectedTxnForShare.receipt?.banner_image_url);

      if (bannerImageUrl) {
        try {
          await Image.prefetch(bannerImageUrl);
        } catch (e) {
          console.warn('Ad banner prefetch error:', e);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 200));

      const receiptBase64 = await captureRef(shareReceiptCardRef, {
        format: 'png',
        quality: 1.0,
        result: 'base64',
      });

      const adBase64 = await captureRef(shareAdCardRef, {
        format: 'png',
        quality: 1.0,
        result: 'base64',
      });

      const bizName =
        selectedTxnForShare.receipt?.business_name ||
        shiftDetails?.header?.business_name ||
        businessName;
      const filename = getExportFilename('Animated_Receipt', bizName, 'gif');
      const targetUri = `${baseDir}${filename}`;

      await animatedGifService.createAndSaveAnimatedGif(targetUri, {
        receiptBase64Png: receiptBase64,
        adBannerBase64Png: adBase64,
        receiptDelaySec: 4.0,
        adDelaySec: 4.0,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(targetUri);
          if (fileInfo.exists) {
            await Sharing.shareAsync(targetUri, {
              mimeType: 'image/gif',
              dialogTitle: `Share Animated Receipt - ${bizName}`,
              UTI: 'com.compuserve.gif',
            });
            return;
          }
        } catch (shareAsyncErr) {
          console.warn('Sharing.shareAsync (gif) failed, falling back to Share.share:', shareAsyncErr);
        }
      }

      const localDateTime =
        formatSydneyToUserDateTime(selectedTxnForShare.receipt?.date_time || selectedTxnForShare.date) ||
        selectedTxnForShare.date;
      const shareMsg = `Receipt: ${bizName}\nTransaction: ${selectedTxnForShare.transaction_id}\nAmount: ${selectedTxnForShare.amount_formatted}\nMethod: ${selectedTxnForShare.payment_method}\nDate: ${localDateTime}`;
      await Share.share(
        Platform.OS === 'ios'
          ? {
              title: `Animated Receipt - ${bizName}`,
              message: shareMsg,
              url: targetUri,
            }
          : {
              title: `Animated Receipt - ${bizName}`,
              message: shareMsg,
            }
      );
    } catch (error) {
      console.error('Error sharing animated receipt:', error);
      showAlert({
        title: 'Share Receipt',
        message: 'Could not generate animated receipt. Please try sharing as Image or PDF.',
        type: 'danger',
      });
    } finally {
      setIsSharing(false);
    }
  };

  // 3. Share as PDF Document
  const handleSharePdf = async () => {
    if (!selectedTxnForShare) return;
    setIsShareModalVisible(false);
    try {
      setIsSharing(true);

      const html = await generateDynamicReceiptHtml(selectedTxnForShare);
      const { uri, base64 } = await Print.printToFileAsync({
        html,
        base64: true,
      });

      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const bizName =
        selectedTxnForShare.receipt?.business_name ||
        shiftDetails?.header?.business_name ||
        businessName;
      const filename = getExportFilename('Receipt', bizName, 'pdf');
      const targetUri = `${baseDir}${filename}`;

      if (base64) {
        await FileSystem.writeAsStringAsync(targetUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (uri) {
        try {
          await FileSystem.copyAsync({ from: uri, to: targetUri });
        } catch {
          const b64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await FileSystem.writeAsStringAsync(targetUri, b64, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        try {
          await Sharing.shareAsync(targetUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Share Receipt - ${bizName}`,
            UTI: 'com.adobe.pdf',
          });
          return;
        } catch (shareErr) {
          console.warn('Sharing.shareAsync failed, trying Share.share:', shareErr);
        }
      }

      const localDateTime =
        formatSydneyToUserDateTime(selectedTxnForShare.receipt?.date_time || selectedTxnForShare.date) ||
        selectedTxnForShare.date;
      const pickup = selectedTxnForShare.pickup_location || selectedTxnForShare.receipt?.pickup_location;
      const drop = selectedTxnForShare.drop_location || selectedTxnForShare.receipt?.drop_location;
      const routeInfo = pickup || drop ? `\nRoute: ${pickup || '--'} to ${drop || '--'}` : '';
      const shareMsg = `Receipt: ${bizName}\nTransaction: ${selectedTxnForShare.transaction_id}\nAmount: ${selectedTxnForShare.amount_formatted}\nMethod: ${selectedTxnForShare.payment_method}\nDate: ${localDateTime}${routeInfo}`;
      await Share.share(
        Platform.OS === 'ios'
          ? {
              title: `Receipt ${selectedTxnForShare.transaction_id}`,
              message: shareMsg,
              url: targetUri,
            }
          : {
              title: `Receipt ${selectedTxnForShare.transaction_id}`,
              message: shareMsg,
            }
      );
    } catch (error) {
      console.error('Error sharing receipt:', error);
      showAlert({
        title: 'Error',
        message: 'Unable to share receipt.',
        type: 'danger',
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Open full digital receipt screen
  const handleOpenReceipt = (txn: ShiftDetailsTransactionItem) => {
    const payId = txn.receipt?.payment_id || txn.transaction_id;
    if (txn.receipt && payId) {
      receiptService.setCachedReceipt(payId, txn.receipt);
    }
    const isCash = (txn.payment_method || '').toLowerCase().includes('cash');
    const isTap = (txn.payment_method || '').toLowerCase().includes('tap');
    router.push({
      pathname: '/(tabs)/receipt-details',
      params: {
        paymentId: payId,
        amount: String(txn.amount),
        method: isCash ? 'cash' : isTap ? 'tap' : 'card',
        cardBrand: txn.receipt?.card_brand || '',
        pickup: txn.pickup_location || txn.receipt?.pickup_location || '',
        dropoff: txn.drop_location || txn.receipt?.drop_location || '',
        taxiNumber: txn.receipt?.taxi_number || txn.receipt?.taxi_no || '',
        dcNumber: txn.receipt?.dc_number || '',
        abn: txn.receipt?.abn || '',
        phone: txn.receipt?.phone_no || '',
        dateStr: txn.receipt?.date_time || txn.date,
      },
    });
  };

  // Generate HTML for full Shift Slip
  const getShiftSlipHtml = () => {
    const staffName = shiftDetails?.user?.name || userName;
    const staffEmpId = shiftDetails?.user?.code || shiftDetails?.user?.emp_id || '';
    const displayShiftCode =
      shiftDetails?.shift_info?.display_shift_id || shiftDetails?.display_shift_id || shiftId;
    const isPaid = Boolean(shiftDetails?.shift_info?.is_paid);
    const paidDate = shiftDetails?.shift_info?.paid_date;
    const totalAmount = shiftDetails?.metrics?.total?.amount_formatted || '$0.00';
    const cardAmount = shiftDetails?.metrics?.card?.amount_formatted || '$0.00';
    const cardCount = shiftDetails?.metrics?.card?.count ?? 0;
    const tapAmount = shiftDetails?.metrics?.tap_and_go?.amount_formatted || '$0.00';
    const tapCount = shiftDetails?.metrics?.tap_and_go?.count ?? 0;
    const txns = shiftDetails?.transactions || [];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111827; }
            .header { text-align: center; border-bottom: 2px dashed #E5E7EB; padding-bottom: 16px; margin-bottom: 16px; }
            .title { font-size: 22px; font-weight: bold; margin: 0; color: #0F172A; }
            .sub { color: #64748B; font-size: 13px; margin-top: 4px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; margin-top: 8px; background: ${isPaid ? '#ECFDF5' : '#FFFBEB'}; color: ${isPaid ? '#059669' : '#D97706'}; }
            .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px; margin: 16px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
            .label { color: #64748B; }
            .val { font-weight: 600; color: #0F172A; }
            .table { width: 100%; border-collapse: collapse; margin-top: 14px; }
            .table th { text-align: left; background: #F1F5F9; padding: 8px; font-size: 11px; color: #475569; }
            .table td { padding: 8px; border-bottom: 1px solid #F1F5F9; font-size: 12px; }
            .footer { text-align: center; font-size: 11px; color: #94A3B8; margin-top: 24px; border-top: 1px dashed #E5E7EB; padding-top: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${businessName}</h1>
            <p class="sub">Shift Tally Slip • Terminal #537384</p>
            <div class="badge">${isPaid ? `● PAID${paidDate ? ` on ${paidDate}` : ''}` : '● UNPAID'}</div>
          </div>

          <div class="card">
            <div class="row"><span class="label">Shift ID:</span><span class="val">${displayShiftCode}</span></div>
            <div class="row"><span class="label">Employee:</span><span class="val">${staffName}${staffEmpId ? ` (${staffEmpId})` : ''}</span></div>
            <div class="row"><span class="label">Time:</span><span class="val">${shiftTime.dateText} • ${shiftTime.timeRangeText}</span></div>
            <div class="row"><span class="label">Total Collections:</span><span class="val" style="font-size: 16px; font-weight: 800; color: #059669;">${totalAmount} AUD</span></div>
            <div class="row"><span class="label">Card Sales (${cardCount} txns):</span><span class="val">${cardAmount}</span></div>
            <div class="row"><span class="label">Tap & Go Sales (${tapCount} txns):</span><span class="val">${tapAmount}</span></div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>TXN ID</th>
                <th>Time</th>
                <th>Method</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${txns.map(
                (t) => `
                <tr>
                  <td>${t.transaction_id}</td>
                  <td>${formatSydneyToUserTime(t.date)}</td>
                  <td>${t.payment_method}</td>
                  <td style="font-weight: bold;">${t.amount_formatted}</td>
                </tr>
              `
              ).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>SE PAY SECURED TERMINAL PAYMENT</p>
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;
  };

  // Reprint Shift Slip
  const handleReprintShiftSlip = async () => {
    try {
      await Print.printAsync({
        html: getShiftSlipHtml(),
      });
    } catch (error) {
      console.warn('Print shift slip canceled or failed:', error);
    }
  };

  // Share Shift Report
  const handleShareShiftReport = async () => {
    try {
      const html = getShiftSlipHtml();
      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const displayShiftCode =
        shiftDetails?.shift_info?.display_shift_id || shiftDetails?.display_shift_id || shiftId;
      const fileName = `Shift_Report_${displayShiftCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.pdf`;
      const targetUri = `${baseDir}${fileName}`;

      if (base64) {
        await FileSystem.writeAsStringAsync(targetUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (uri) {
        try {
          await FileSystem.copyAsync({ from: uri, to: targetUri });
        } catch {
          const b64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await FileSystem.writeAsStringAsync(targetUri, b64, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        try {
          await Sharing.shareAsync(targetUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Share Shift Report`,
            UTI: 'com.adobe.pdf',
          });
          return;
        } catch (shareErr) {
          console.warn('Sharing.shareAsync report failed, trying Share.share:', shareErr);
        }
      }

      const shareMsg = `Shift Report: ${businessName}\nShift: ${displayShiftCode}\nTime: ${shiftTime.dateText} • ${shiftTime.timeRangeText}\nTotal: ${shiftDetails?.metrics?.total?.amount_formatted || '$0.00'}`;
      await Share.share(
        Platform.OS === 'ios'
          ? {
              title: `Shift Report - ${displayShiftCode}`,
              message: shareMsg,
              url: targetUri,
            }
          : {
              title: `Shift Report - ${displayShiftCode}`,
              message: shareMsg,
            }
      );
    } catch (error) {
      console.error('Error sharing shift report:', error);
      showAlert({
        title: 'Error',
        message: 'Unable to share shift report.',
        type: 'danger',
      });
    }
  };

  const headerTitle =
    shiftDetails?.shift_info?.display_shift_id || shiftDetails?.display_shift_id || shiftId;

  // Breakdown metrics numbers
  const totalParts = formatAmountParts(shiftDetails?.metrics?.total?.amount);
  const cardParts = formatAmountParts(shiftDetails?.metrics?.card?.amount);
  const tapParts = formatAmountParts(shiftDetails?.metrics?.tap_and_go?.amount);

  const isPaid = Boolean(shiftDetails?.shift_info?.is_paid);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar with Back Button and Shift ID */}
      <HeaderBar
        title={headerTitle}
        showBack={true}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#D97706"
            colors={['#D97706']}
          />
        }
      >
        {/* Error State Banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchShiftDetails()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Indicator */}
        {isLoading && !isRefreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D97706" />
            <Text style={styles.loadingText}>Loading shift details...</Text>
          </View>
        )}

        {!isLoading && (
          <>
            {/* ── 1. EMPLOYEE & SHIFT SUMMARY CARD ── */}
            <View style={styles.employeeSummaryCard}>
              {/* Top Row: Avatar + Name + EMP ID */}
              <View style={styles.employeeTopRow}>
                {shiftDetails?.user?.avatar ? (
                  <Image source={{ uri: shiftDetails.user.avatar }} style={styles.employeeAvatar} />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={styles.initialsAvatarText}>
                      {shiftDetails?.user?.initials || 'EM'}
                    </Text>
                  </View>
                )}

                <View style={styles.employeeNameCol}>
                  <Text style={styles.employeeNameText}>
                    {shiftDetails?.user?.name || userName}
                  </Text>
                  {(shiftDetails?.user?.code || shiftDetails?.user?.emp_id) && (
                    <Text style={styles.empIdLabel}>
                      EMP ID:{' '}
                      <Text style={styles.empIdValue}>
                        {shiftDetails?.user?.code || shiftDetails?.user?.emp_id}
                      </Text>
                    </Text>
                  )}
                </View>
              </View>

              {/* Middle Row: Shift ID + Paid / Unpaid Badge */}
              <View style={styles.shiftIdStatusRow}>
                <Text style={styles.shiftIdCode}>{headerTitle}</Text>

                {isPaid ? (
                  <View style={styles.paidBadge}>
                    <View style={styles.paidDot} />
                    <Text style={styles.paidBadgeText}>
                      PAID{shiftDetails?.shift_info?.paid_date ? ` on ${shiftDetails.shift_info.paid_date}` : ''}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.unpaidBadge}>
                    <View style={styles.unpaidDot} />
                    <Text style={styles.unpaidBadgeText}>UNPAID</Text>
                  </View>
                )}
              </View>

              {/* Bottom Row: Shift Date & Time & Range (User Timezone) */}
              <Text style={styles.shiftMetaText}>
                {shiftTime.dateText} • {shiftTime.timeRangeText}
              </Text>
            </View>

            {/* ── 2. METRICS CARD (TOTAL, CARD, TAP & GO) ── */}
            <View style={styles.metricsCard}>
              {/* Column 1: TOTAL */}
              <View style={styles.metricColumn}>
                <View style={styles.metricLabelRow}>
                  <View style={styles.bulletTotal} />
                  <Text style={styles.metricColumnTitleTotal}>TOTAL</Text>
                </View>
                <View style={styles.metricAmountRow}>
                  <Text style={styles.metricDollarGold}>$</Text>
                  <Text style={styles.metricAmountTotal}>{totalParts.whole}</Text>
                  <Text style={styles.metricAmountCents}>{totalParts.cents}</Text>
                </View>
                <Text style={styles.metricSubtext}>
                  {shiftDetails?.metrics?.total?.count ?? 0} Txns
                </Text>
              </View>

              <View style={styles.columnDivider} />

              {/* Column 2: CARD */}
              <View style={styles.metricColumn}>
                <View style={styles.metricLabelRow}>
                  <Ionicons name="card-outline" size={12} color="#2563EB" />
                  <Text style={styles.metricColumnTitleCard}>CARD</Text>
                </View>
                <View style={styles.metricAmountRow}>
                  <Text style={styles.metricDollarBlue}>$</Text>
                  <Text style={styles.metricAmountCard}>{cardParts.whole}</Text>
                  <Text style={styles.metricAmountCents}>{cardParts.cents}</Text>
                </View>
                <Text style={styles.metricSubtext}>
                  {shiftDetails?.metrics?.card?.count ?? 0} Txns
                </Text>
              </View>

              <View style={styles.columnDivider} />

              {/* Column 3: TAP & GO */}
              <View style={styles.metricColumn}>
                <View style={styles.metricLabelRow}>
                  <View style={styles.bulletTap} />
                  <Text style={styles.metricColumnTitleTap}>TAP & GO</Text>
                </View>
                <View style={styles.metricAmountRow}>
                  <Text style={styles.metricDollarOrange}>$</Text>
                  <Text style={styles.metricAmountTap}>{tapParts.whole}</Text>
                  <Text style={styles.metricAmountCents}>{tapParts.cents}</Text>
                </View>
                <Text style={styles.metricSubtext}>
                  {shiftDetails?.metrics?.tap_and_go?.count ?? 0} Txns
                </Text>
              </View>
            </View>

            {/* ── 3. SEARCH BAR ── */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={16} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search TXN ID, amount..."
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

            {/* ── 4. SEGMENTED FILTER PILLS (All, Card, Tap & Go) ── */}
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentTab,
                  filterType === 'all' && styles.segmentTabActive,
                ]}
                onPress={() => handleFilterChange('all')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentTabText,
                    filterType === 'all' && styles.segmentTabTextActive,
                  ]}
                >
                  All ({shiftDetails?.filters?.tabs?.all?.count ?? shiftDetails?.metrics?.total?.count ?? 0})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentTab,
                  filterType === 'card' && styles.segmentTabActive,
                ]}
                onPress={() => handleFilterChange('card')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentTabText,
                    filterType === 'card' && styles.segmentTabTextActive,
                  ]}
                >
                  Card ({shiftDetails?.filters?.tabs?.card?.count ?? shiftDetails?.metrics?.card?.count ?? 0})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentTab,
                  filterType === 'tap' && styles.segmentTabActive,
                ]}
                onPress={() => handleFilterChange('tap')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentTabText,
                    filterType === 'tap' && styles.segmentTabTextActive,
                  ]}
                >
                  Tap & Go ({shiftDetails?.filters?.tabs?.tap_and_go?.count ?? shiftDetails?.metrics?.tap_and_go?.count ?? 0})
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── 5. GROUPED TRANSACTION LIST ── */}
            {groupedTransactions.map((group) => (
              <View key={group.date} style={styles.dateGroupContainer}>
                {/* Date Group Header */}
                <View style={styles.dateGroupHeaderRow}>
                  <Text style={styles.dateGroupTitle}>{group.date}</Text>
                  <View style={styles.dateGroupTotalRow}>
                    <Text style={styles.dateGroupCurrency}>$</Text>
                    <Text style={styles.dateGroupTotalValue}>
                      {Math.floor(group.total).toLocaleString('en-US')}
                    </Text>
                    <Text style={styles.dateGroupCents}>
                      .{((group.total % 1) * 100).toFixed(0).padStart(2, '0')}
                    </Text>
                  </View>
                </View>

                {/* Transaction Cards */}
                {group.transactions.map((txn: ShiftDetailsTransactionItem) => {
                  const isCard = (txn.payment_method || '').toLowerCase().includes('card');
                  const isCash = (txn.payment_method || '').toLowerCase().includes('cash');
                  const formattedTime = formatSydneyToUserTime(txn.date) || txn.date;
                  const pickupLoc = txn.pickup_location || txn.receipt?.pickup_location;
                  const dropLoc = txn.drop_location || txn.receipt?.drop_location;
                  const hasRoute = Boolean(pickupLoc || dropLoc);
                  const breakdown = txn.receipt?.payment_break_down;

                  return (
                    <TouchableOpacity
                      key={String(txn.id)}
                      style={styles.txnCard}
                      activeOpacity={0.85}
                      onPress={() => handleOpenReceipt(txn)}
                    >
                      {/* Top Row: ID + Time + Method Chip + Amount */}
                      <View style={styles.txnTopRow}>
                        <View style={styles.txnIdTimeGroup}>
                          <Text style={styles.txnIdText}>{txn.transaction_id}</Text>
                          <Text style={styles.txnTimeText}>{formattedTime}</Text>

                          {isCash ? (
                            <View style={styles.chipCash}>
                              <MaterialCommunityIcons name="cash" size={12} color="#059669" />
                              <Text style={styles.chipCashText}>Cash</Text>
                            </View>
                          ) : isCard ? (
                            <View style={styles.chipCard}>
                              <Ionicons name="card-outline" size={11} color="#2563EB" />
                              <Text style={styles.chipCardText}>Card</Text>
                            </View>
                          ) : (
                            <View style={styles.chipTap}>
                              <MaterialCommunityIcons name="contactless-payment" size={12} color="#D97706" />
                              <Text style={styles.chipTapText}>Tap & Go</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.txnAmountGroup}>
                          <Text style={styles.txnAmountCurrency}>$</Text>
                          <Text style={styles.txnAmountWhole}>
                            {Math.floor(txn.amount).toLocaleString('en-US')}
                          </Text>
                          <Text style={styles.txnAmountCents}>
                            .{((txn.amount % 1) * 100).toFixed(0).padStart(2, '0')}
                          </Text>
                        </View>
                      </View>

                      {/* Route Row: pickup → drop (shown only when available, e.g. taxi trips) */}
                      {hasRoute && (
                        <View style={styles.routeBox}>
                          <View style={styles.routePinsCol}>
                            <View style={styles.bluePin} />
                            <View style={styles.verticalRouteLine} />
                            <View style={styles.orangePin} />
                          </View>
                          <View style={styles.routeTextsCol}>
                            <Text style={styles.routeAddressText} numberOfLines={1}>
                              {pickupLoc || '--'}
                            </Text>
                            <Text style={[styles.routeAddressText, { marginTop: 7 }]} numberOfLines={1}>
                              {dropLoc || '--'}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Payment Breakdown Badge */}
                      {breakdown && (breakdown.base_amount !== undefined || breakdown.service_fee !== undefined) && (
                        <View style={styles.txnBreakdownRow}>
                          <Text style={styles.txnBreakdownText}>
                            Base: ${Number(breakdown.base_amount ?? (Number(breakdown.payable_amount ?? txn.amount) - Number(breakdown.service_fee ?? 0))).toFixed(2)} • Fee: ${Number(breakdown.service_fee ?? 0).toFixed(2)}
                          </Text>
                        </View>
                      )}

                      {/* Bottom Row: Settlement Verification + Action Buttons */}
                      <View style={styles.txnBottomRow}>
                        <View style={styles.verificationGroup}>
                          <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                          <Text style={styles.verificationText}>Settled • Successful</Text>
                        </View>

                        <View style={styles.txnActionsRow}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleReprint(txn)}
                            activeOpacity={0.7}
                            disabled={isPrinting}
                          >
                            <Feather name="printer" size={11} color="#334155" />
                            <Text style={styles.actionButtonText}>Reprint</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleShare(txn)}
                            activeOpacity={0.7}
                            disabled={isSharing}
                          >
                            <Feather name="share" size={11} color="#334155" />
                            <Text style={styles.actionButtonText}>Share</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {filteredTransactions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Feather name="search" size={28} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Transactions Found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Try adjusting your search criteria' : 'No transactions recorded for this filter'}
                </Text>
              </View>
            )}

            {/* ── 6. BOTTOM ACTION BUTTONS ── */}
            {/* <View style={styles.bottomButtonsRow}>
              <TouchableOpacity
                style={styles.reprintSlipBtn}
                onPress={handleReprintShiftSlip}
                activeOpacity={0.85}
              >
                <Feather name="printer" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.reprintSlipBtnText}>Reprint Shift Slip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareReportBtn}
                onPress={handleShareShiftReport}
                activeOpacity={0.85}
              >
                <Feather name="share" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.shareReportBtnText}>Share Report</Text>
              </TouchableOpacity>
            </View> */}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── HIDDEN OFFSCREEN CARDS FOR HIGH-RESOLUTION PNG & GIF CAPTURE ── */}
      {selectedShareDetails && (
        <View style={styles.hiddenOffscreenContainer} pointerEvents="none" collapsable={false}>
          {/* Main Receipt Card to Capture */}
          <View ref={shareReceiptCardRef} collapsable={false} style={styles.shareReceiptCard}>
            <View style={styles.shareBadgeWrap}>
              {selectedShareDetails.logo ? (
                <Image
                  source={{ uri: selectedShareDetails.logo }}
                  style={styles.shareLogoImage}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require('../../../../assets/taxi-logo.png')}
                  style={styles.shareLogoImage}
                  resizeMode="contain"
                />
              )}
            </View>

            <Text style={styles.shareBizName}>{selectedShareDetails.biz}</Text>
            <Text style={styles.shareTaxInvoiceHeading}>TAX INVOICE</Text>
            <Text style={styles.shareBizMeta}>
              ABN: {selectedShareDetails.abnVal} • PH: {selectedShareDetails.phoneVal}
            </Text>
            {selectedShareDetails.isTaxi ? (
              <Text style={styles.shareBizMeta}>
                TAXI NO.: {selectedShareDetails.taxiNo || '--'}
                {selectedShareDetails.dcNo ? `   DC: ${selectedShareDetails.dcNo}` : ''}
              </Text>
            ) : (
              <Text style={styles.shareBizMeta}>
                EMP: {selectedShareDetails.staff}
                {selectedShareDetails.staffCode ? ` (${selectedShareDetails.staffCode})` : ''}
              </Text>
            )}

            <View style={styles.shareAmountSection}>
              <Text style={styles.shareTotalPaidLabel}>TOTAL PAID (INC GST)</Text>
              <View style={styles.shareAmountWrap}>
                <Text style={styles.shareDollarSign}>$ </Text>
                <Text style={styles.shareAmountInt}>{selectedShareDetails.formattedWhole}</Text>
                <Text style={styles.shareAmountDec}>.{selectedShareDetails.formattedCents}</Text>
              </View>
              <View style={styles.sharePaidBadge}>
                <View style={styles.shareGreenDot} />
                <Text style={styles.sharePaidText}>PAID</Text>
              </View>
            </View>

            <View style={styles.shareCardDivider} />

            {selectedShareDetails.hasRoute && (
              <>
                <View style={styles.shareRouteSection}>
                  <View style={styles.shareRouteCol}>
                    <Text style={styles.shareRouteLabel}>PICKUP</Text>
                    <Text style={styles.shareRouteVal} numberOfLines={1}>
                      {selectedShareDetails.pickup || '--'}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#F59E0B" style={{ marginHorizontal: 6 }} />
                  <View style={[styles.shareRouteCol, { alignItems: 'flex-end' }]}>
                    <Text style={[styles.shareRouteLabel, { textAlign: 'right' }]}>DROP OFF</Text>
                    <Text style={[styles.shareRouteVal, { textAlign: 'right' }]} numberOfLines={1}>
                      {selectedShareDetails.dropoff || '--'}
                    </Text>
                  </View>
                </View>
                <View style={styles.shareCardDivider} />
              </>
            )}

            {selectedShareDetails.hasBk && selectedShareDetails.bkBase !== null && (
              <>
                <View style={styles.shareBreakdownBox}>
                  <Text style={styles.shareBreakdownHdr}>PAYMENT BREAKDOWN</Text>
                  <View style={styles.shareBreakdownRow}>
                    <Text style={styles.shareBreakdownLbl}>Base Amount</Text>
                    <Text style={styles.shareBreakdownVal}>${Number(selectedShareDetails.bkBase).toFixed(2)}</Text>
                  </View>
                  <View style={styles.shareBreakdownRow}>
                    <Text style={styles.shareBreakdownLbl}>Service Fee</Text>
                    <Text style={styles.shareBreakdownVal}>${Number(selectedShareDetails.bkFee).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.shareCardDivider, { marginVertical: 4 }]} />
                  <View style={styles.shareBreakdownRow}>
                    <Text style={[styles.shareBreakdownLbl, { fontWeight: '700', color: '#0F172A' }]}>Total (INC GST)</Text>
                    <Text style={[styles.shareBreakdownVal, { color: '#D97706', fontWeight: '800' }]}>${Number(selectedShareDetails.bkTotal).toFixed(2)}</Text>
                  </View>
                </View>
                <View style={styles.shareCardDivider} />
              </>
            )}

            <View style={styles.shareMetaList}>
              <View style={styles.shareMetaRow}>
                <View>
                  <Text style={styles.shareMetaLabel}>Date & Time</Text>
                  <Text style={styles.shareMetaValue}>{selectedShareDetails.dt}</Text>
                </View>
                <View style={selectedShareDetails.isCash ? styles.chipCash : styles.chipCard}>
                  <Text style={selectedShareDetails.isCash ? styles.chipCashText : styles.chipCardText}>
                    {selectedShareDetails.isCash ? '💵 Cash' : selectedShareDetails.isTap ? '⚡ Tap & Go' : '💳 Card'}
                  </Text>
                </View>
              </View>

              <View style={styles.shareMetaRow}>
                <View>
                  <Text style={styles.shareMetaLabel}>Payment Method</Text>
                  <Text style={styles.shareMetaValue}>
                    {selectedTxnForShare?.receipt?.payment_method || selectedTxnForShare?.payment_method || 'Card'}
                  </Text>
                </View>
                <View style={selectedShareDetails.isCash ? styles.chipCash : styles.chipCard}>
                  <Text style={selectedShareDetails.isCash ? styles.chipCashText : styles.chipCardText}>
                    {selectedShareDetails.brand}
                  </Text>
                </View>
              </View>

              <View style={styles.shareMetaRow}>
                <View>
                  <Text style={styles.shareMetaLabel}>
                    {selectedShareDetails.isCash ? 'Receipt ID' : 'Payment ID'}
                  </Text>
                  <Text style={styles.shareMetaValue}>{selectedShareDetails.payId}</Text>
                </View>
              </View>
            </View>

            <View style={styles.shareFooter}>
              <Text style={styles.shareThankYou}>
                THANK YOU FOR CHOOSING {selectedShareDetails.biz.toUpperCase()}
              </Text>
              <Text style={styles.sharePoweredBy}>POWERED BY</Text>
              <Image
                source={require('../../../../assets/SE-pay-logo-gif.gif')}
                style={styles.shareSePayLogo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Ad Banner Card for Animated GIF */}
          {selectedShareDetails.hasAd && selectedShareDetails.banner && (
            <View ref={shareAdCardRef} collapsable={false} style={styles.shareAdBannerCard}>
              <View style={styles.shareAdCardHeader}>
                <View style={styles.shareAdSponsoredPill}>
                  <Ionicons name="sparkles" size={11} color="#92400E" style={{ marginRight: 4 }} />
                  <Text style={styles.shareAdSponsoredPillText}>SPONSORED ADVERTISEMENT</Text>
                </View>
                <Text style={styles.shareAdBrandText}>SE PAY</Text>
              </View>

              <View style={styles.shareAdImageWrap}>
                <Image
                  source={{ uri: selectedShareDetails.banner }}
                  style={styles.shareAdImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.shareAdFooter}>
                <Text style={styles.shareAdFooterThank}>
                  THANK YOU FOR CHOOSING {selectedShareDetails.biz.toUpperCase()}
                </Text>
                <Text style={styles.shareAdFooterPowered}>POWERED BY SE PAY</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── SHARE FORMAT SELECTION MODAL ── */}
      <Modal
        visible={isShareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsShareModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsShareModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />

                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalTitle}>Share Receipt</Text>
                    <Text style={styles.modalSubtitle}>Select your preferred format to share</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setIsShareModalVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="x" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Option 1: Share as Image (PNG) */}
                <TouchableOpacity
                  style={styles.modalOptionCard}
                  activeOpacity={0.75}
                  onPress={handleSharePhoto}
                  disabled={isSharing}
                >
                  <View style={[styles.modalOptionIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="image-outline" size={24} color="#D97706" />
                  </View>
                  <View style={styles.modalOptionTextWrap}>
                    <View style={styles.modalOptionTitleRow}>
                      <Text style={styles.modalOptionTitle}>Share as Image (PNG)</Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* Option 2: Animated Card (GIF) when ad_banner is true */}
                {selectedShareDetails?.hasAd && selectedShareDetails?.banner && (
                  <TouchableOpacity
                    style={styles.modalOptionCard}
                    activeOpacity={0.75}
                    onPress={handleShareAnimatedGif}
                    disabled={isSharing}
                  >
                    <View style={[styles.modalOptionIconBox, { backgroundColor: '#F3E8FF' }]}>
                      <Ionicons name="film-outline" size={24} color="#9333EA" />
                    </View>
                    <View style={styles.modalOptionTextWrap}>
                      <View style={styles.modalOptionTitleRow}>
                        <Text style={styles.modalOptionTitle}>Share Animated Card</Text>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}

                {/* Option 3: PDF Document */}
                <TouchableOpacity
                  style={styles.modalOptionCard}
                  activeOpacity={0.75}
                  onPress={handleSharePdf}
                  disabled={isSharing}
                >
                  <View style={[styles.modalOptionIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="document-text-outline" size={24} color="#2563EB" />
                  </View>
                  <View style={styles.modalOptionTextWrap}>
                    <View style={styles.modalOptionTitleRow}>
                      <Text style={styles.modalOptionTitle}>Share as PDF Document</Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsShareModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    paddingTop: 10,
    paddingBottom: 24,
  },

  /* 1. Employee Summary Card */
  employeeSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    padding: 13,
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  employeeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  initialsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 9,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  initialsAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
  },
  employeeNameCol: {
    flex: 1,
  },
  employeeNameText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  empIdLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  empIdValue: {
    fontWeight: '700',
    color: '#D97706',
  },
  shiftIdStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shiftIdCode: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    gap: 4,
  },
  paidDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    gap: 4,
  },
  unpaidDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
  },
  unpaidBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  shiftMetaText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },

  /* 2. Metrics Card */
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  columnDivider: {
    width: 1,
    height: '65%',
    backgroundColor: '#F1F5F9',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  bulletTotal: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D97706',
  },
  bulletTap: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EA580C',
  },
  metricColumnTitleTotal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.2,
  },
  metricColumnTitleCard: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.2,
  },
  metricColumnTitleTap: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
    letterSpacing: 0.2,
  },
  metricAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricDollarGold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  metricDollarBlue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  metricDollarOrange: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  metricAmountTotal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricAmountCard: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2563EB',
  },
  metricAmountTap: {
    fontSize: 17,
    fontWeight: '800',
    color: '#EA580C',
  },
  metricAmountCents: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  metricSubtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },

  /* 3. Search Bar */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 2,
  },

  /* 4. Segmented Control */
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  /* 5. Grouped Transactions */
  dateGroupContainer: {
    marginBottom: 14,
  },
  dateGroupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dateGroupTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  dateGroupTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  dateGroupCurrency: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D97706',
  },
  dateGroupTotalValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateGroupCents: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  txnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 11,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  txnTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txnIdTimeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txnIdText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  txnTimeText: {
    fontSize: 11,
    color: '#64748B',
  },
  chipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    gap: 3,
  },
  chipCardText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#2563EB',
  },
  chipTap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    gap: 2,
  },
  chipTapText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#D97706',
  },
  txnAmountGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  txnAmountCurrency: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D97706',
  },
  txnAmountWhole: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  txnAmountCents: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  txnBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 7,
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    marginBottom: 8,
    gap: 8,
  },
  routePinsCol: {
    alignItems: 'center',
    paddingTop: 3,
  },
  bluePin: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2563EB',
  },
  verticalRouteLine: {
    width: 1.5,
    height: 16,
    backgroundColor: '#CBD5E1',
    marginVertical: 2,
  },
  orangePin: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F59E0B',
  },
  routeTextsCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  routeAddressText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#334155',
    lineHeight: 15,
  },
  verificationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  verificationText: {
    fontSize: 10.5,
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
    gap: 3,
  },
  actionButtonText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#334155',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* 6. Bottom Action Buttons */
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  reprintSlipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  reprintSlipBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  shareReportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  shareReportBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Loading & Error States */
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DC2626',
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Transaction Chips & Breakdown */
  chipCash: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    gap: 3,
  },
  chipCashText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#059669',
  },
  txnBreakdownRow: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  txnBreakdownText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
  },

  /* Hidden Offscreen Container for PNG / GIF capture */
  hiddenOffscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: -1,
    opacity: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  shareReceiptCard: {
    width: 350,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  shareBadgeWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF9C3',
    borderWidth: 1.2,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 4,
    marginBottom: 6,
  },
  shareLogoImage: {
    width: '100%',
    height: '100%',
  },
  shareBizName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  shareTaxInvoiceHeading: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 2,
    marginTop: 2,
    marginBottom: 2,
  },
  shareBizMeta: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  shareAmountSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  shareTotalPaidLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  shareAmountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 1,
  },
  shareDollarSign: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D97706',
  },
  shareAmountInt: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
  },
  shareAmountDec: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  sharePaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    marginTop: 2,
  },
  shareGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  sharePaidText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  shareCardDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 7,
  },
  shareRouteSection: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  shareRouteCol: {
    flex: 1,
  },
  shareRouteLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  shareRouteVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  shareBreakdownBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 8,
    marginVertical: 3,
  },
  shareBreakdownHdr: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  shareBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 1,
  },
  shareBreakdownLbl: {
    fontSize: 10,
    color: '#64748B',
  },
  shareBreakdownVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  shareMetaList: {
    width: '100%',
    marginTop: 2,
    gap: 5,
  },
  shareMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareMetaLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '500',
  },
  shareMetaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  shareFooter: {
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
    width: '100%',
  },
  shareThankYou: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.4,
    marginBottom: 2,
    textAlign: 'center',
  },
  sharePoweredBy: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  shareSePayLogo: {
    width: 85,
    height: 22,
  },

  /* Sponsored Ad Banner Card for GIF */
  shareAdBannerCard: {
    width: 350,
    height: 520,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 14,
    justifyContent: 'space-between',
    marginTop: 14,
  },
  shareAdCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareAdSponsoredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  shareAdSponsoredPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  shareAdBrandText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 1,
  },
  shareAdImageWrap: {
    flex: 1,
    marginVertical: 10,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareAdImage: {
    width: '100%',
    height: '100%',
  },
  shareAdFooter: {
    alignItems: 'center',
  },
  shareAdFooterThank: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  shareAdFooterPowered: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },

  /* Share Format Selection Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  modalOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  modalOptionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalOptionTextWrap: {
    flex: 1,
  },
  modalOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
});
