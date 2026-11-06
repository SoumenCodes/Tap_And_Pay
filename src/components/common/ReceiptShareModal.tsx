import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Image,
  Platform,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import { animatedGifService } from '../../services/animatedGifService';
import {
  UnifiedReceiptInput,
  formatReceiptAmount,
  generateReceiptHtml,
  getExportFilename,
} from '../../services/receiptExportService';
import { normalizeImageUrl } from '../../utils/assetUtils';

export interface ReceiptShareModalProps {
  visible: boolean;
  onClose: () => void;
  receiptInput: UnifiedReceiptInput | null;
}

export default function ReceiptShareModal({
  visible,
  onClose,
  receiptInput,
}: ReceiptShareModalProps) {
  const { showAlert } = useConfirmModal();
  const [isSharing, setIsSharing] = useState(false);
  const [sharingFormat, setSharingFormat] = useState<'photo' | 'gif' | 'pdf' | null>(null);

  const sharingLabels: Record<string, string> = {
    photo: 'Generating Image…',
    gif: 'Creating Animated Card…',
    pdf: 'Preparing PDF…',
  };

  const receiptCardRef = useRef<View>(null);
  const adBannerCardRef = useRef<View>(null);

  if (!receiptInput) {
    return null;
  }

  const { whole, cents } = formatReceiptAmount(receiptInput.amount);
  const biz = receiptInput.businessName || 'Business';
  const logoUrl = normalizeImageUrl(receiptInput.businessLogo);
  const abnVal = receiptInput.abn || '19113303849';
  const phoneVal = receiptInput.phone || '9113303849';
  const isTaxi = Boolean(receiptInput.isTaxi || receiptInput.taxiNumber);
  const taxiNo = receiptInput.taxiNumber || '';
  const dcNo = receiptInput.dcNumber || '';
  const staff = receiptInput.staffName || 'Staff Member';
  const staffCode = receiptInput.staffEmpId || '';
  const pickup = receiptInput.pickup || '';
  const dropoff = receiptInput.dropoff || '';
  const hasRoute = Boolean(pickup || dropoff);
  const isCash = (receiptInput.paymentMethod || '').toLowerCase().includes('cash');
  const isTap = (receiptInput.paymentMethod || '').toLowerCase().includes('tap');
  const cardBrand = (receiptInput.cardBrand || (isCash ? 'CASH' : isTap ? 'TAP & GO' : 'VISA')).toUpperCase();
  const paymentMethodLabel = receiptInput.paymentMethod || (isCash ? 'Cash' : isTap ? 'Tap & Go' : 'Card');
  const payId = receiptInput.paymentId || '--';
  const dt = receiptInput.dateTime || new Date().toLocaleString();

  const bk = receiptInput.breakdown;
  const hasBk = Boolean(bk && (bk.base_amount !== undefined || bk.payable_amount !== undefined));
  const bkBase =
    bk?.base_amount !== undefined
      ? Number(bk.base_amount)
      : bk?.payable_amount !== undefined && bk?.service_fee !== undefined
      ? Number(bk.payable_amount) - Number(bk.service_fee)
      : null;
  const bkFee = bk?.service_fee !== undefined ? Number(bk.service_fee) : 0;
  const bkTotal =
    bk?.payable_amount !== undefined ? Number(bk.payable_amount) : Number(receiptInput.amount) || 0;

  const hasAd = Boolean(receiptInput.hasAdBanner && receiptInput.bannerImageUrl);
  const bannerUrl = normalizeImageUrl(receiptInput.bannerImageUrl);

  // 1. Share as Image (PNG)
  const handleSharePhoto = async () => {
    try {
      setIsSharing(true);
      setSharingFormat('photo');

      if (!receiptCardRef.current) {
        throw new Error('Receipt view is not ready');
      }

      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const base64Image = await captureRef(receiptCardRef, {
        format: 'png',
        quality: 1.0,
        result: 'base64',
      });

      const filename = getExportFilename('Receipt_Card', biz, 'png');
      const targetUri = `${baseDir}${filename}`;

      await FileSystem.writeAsStringAsync(targetUri, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(targetUri);
          if (fileInfo.exists) {
            onClose();
            await Sharing.shareAsync(targetUri, {
              mimeType: 'image/png',
              dialogTitle: `Share Receipt Image - ${biz}`,
              UTI: 'public.png',
            });
            return;
          }
        } catch (shareAsyncErr) {
          console.warn('Sharing.shareAsync (image) failed, falling back to Share.share:', shareAsyncErr);
        }
      }

      const routeInfo = hasRoute ? `\nRoute: ${pickup || '--'} to ${dropoff || '--'}` : '';
      const shareMsg = `Receipt: ${biz}\nAmount: ${receiptInput.amountFormatted || `$${whole}.${cents}`}\nMethod: ${paymentMethodLabel}\nDate: ${dt}${routeInfo}`;
      onClose();
      await Share.share(
        Platform.OS === 'ios'
          ? {
              title: `Receipt Image - ${biz}`,
              message: shareMsg,
              url: targetUri,
            }
          : {
              title: `Receipt Image - ${biz}`,
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
      onClose();
    } finally {
      setIsSharing(false);
      setSharingFormat(null);
    }
  };

  // 2. Share as Animated Card (GIF)
  const handleShareAnimatedGif = async () => {
    try {
      setIsSharing(true);
      setSharingFormat('gif');

      if (!receiptCardRef.current || !adBannerCardRef.current) {
        throw new Error('Receipt or Ad view is not ready');
      }

      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;

      if (bannerUrl) {
        try {
          await Image.prefetch(bannerUrl);
        } catch (e) {
          console.warn('Ad banner prefetch error:', e);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 200));

      const receiptBase64 = await captureRef(receiptCardRef, {
        format: 'png',
        quality: 1.0,
        result: 'base64',
      });

      const adBase64 = await captureRef(adBannerCardRef, {
        format: 'png',
        quality: 1.0,
        result: 'base64',
      });

      const filename = getExportFilename('Animated_Receipt', biz, 'gif');
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
            onClose();
            await Sharing.shareAsync(targetUri, {
              mimeType: 'image/gif',
              dialogTitle: `Share Animated Receipt - ${biz}`,
              UTI: 'com.compuserve.gif',
            });
            return;
          }
        } catch (shareAsyncErr) {
          console.warn('Sharing.shareAsync (gif) failed, falling back to Share.share:', shareAsyncErr);
        }
      }

      const shareMsg = `Animated Receipt: ${biz}\nAmount: ${receiptInput.amountFormatted || `$${whole}.${cents}`}\nMethod: ${paymentMethodLabel}\nDate: ${dt}`;
      onClose();
      await Share.share(
        Platform.OS === 'ios'
          ? {
              title: `Animated Receipt - ${biz}`,
              message: shareMsg,
              url: targetUri,
            }
          : {
              title: `Animated Receipt - ${biz}`,
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
      onClose();
    } finally {
      setIsSharing(false);
      setSharingFormat(null);
    }
  };

  // 3. Share as PDF Document
  const handleSharePdf = async () => {
    try {
      setIsSharing(true);
      setSharingFormat('pdf');

      const html = await generateReceiptHtml(receiptInput);
      const { uri, base64 } = await Print.printToFileAsync({
        html,
        base64: true,
      });

      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const filename = getExportFilename('Receipt', biz, 'pdf');
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
          onClose();
          await Sharing.shareAsync(targetUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Share Receipt - ${biz}`,
            UTI: 'com.adobe.pdf',
          });
          return;
        } catch (shareErr) {
          console.warn('Sharing.shareAsync failed, trying Share.share:', shareErr);
        }
      }

      const routeInfo = hasRoute ? `\nRoute: ${pickup || '--'} to ${dropoff || '--'}` : '';
      const shareMsg = `Receipt: ${biz}\nAmount: ${receiptInput.amountFormatted || `$${whole}.${cents}`}\nMethod: ${paymentMethodLabel}\nDate: ${dt}${routeInfo}`;
      onClose();
      await Share.share(
        Platform.OS === 'ios'
          ? {
              title: `Receipt - ${biz}`,
              message: shareMsg,
              url: targetUri,
            }
          : {
              title: `Receipt - ${biz}`,
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
      onClose();
    } finally {
      setIsSharing(false);
      setSharingFormat(null);
    }
  };

  return (
    <>
      {/* ── HIDDEN OFFSCREEN CARDS FOR HIGH-RESOLUTION PNG & GIF CAPTURE ── */}
      <View style={styles.hiddenOffscreenContainer} pointerEvents="none" collapsable={false}>
        {/* Main Receipt Card to Capture */}
        <View ref={receiptCardRef} collapsable={false} style={styles.shareReceiptCard}>
          <View style={styles.shareBadgeWrap}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={styles.shareLogoImage}
                resizeMode="contain"
              />
            ) : (
              <Image
                source={require('../../../assets/taxi-logo.png')}
                style={styles.shareLogoImage}
                resizeMode="contain"
              />
            )}
          </View>

          <Text style={styles.shareBizName}>{biz}</Text>
          <Text style={styles.shareTaxInvoiceHeading}>TAX INVOICE</Text>
          <Text style={styles.shareBizMeta}>
            ABN: {abnVal} • PH: {phoneVal}
          </Text>
          {isTaxi ? (
            <Text style={styles.shareBizMeta}>
              TAXI NO.: {taxiNo || '--'}
              {dcNo ? `   DC: ${dcNo}` : ''}
            </Text>
          ) : (
            <Text style={styles.shareBizMeta}>
              EMP: {staff}
              {staffCode ? ` (${staffCode})` : ''}
            </Text>
          )}
          {receiptInput.address ? (
            <Text style={styles.shareBizMeta}>{receiptInput.address}</Text>
          ) : null}

          <View style={styles.shareAmountSection}>
            <Text style={styles.shareTotalPaidLabel}>TOTAL PAID (INC GST)</Text>
            <View style={styles.shareAmountWrap}>
              <Text style={styles.shareDollarSign}>$ </Text>
              <Text style={styles.shareAmountInt}>{whole}</Text>
              <Text style={styles.shareAmountDec}>.{cents}</Text>
            </View>
            <View style={styles.sharePaidBadge}>
              <View style={styles.shareGreenDot} />
              <Text style={styles.sharePaidText}>PAID</Text>
            </View>
          </View>

          <View style={styles.shareCardDivider} />

          {hasRoute && (
            <>
              <View style={styles.shareRouteSection}>
                <View style={styles.shareRouteCol}>
                  <Text style={styles.shareRouteLabel}>PICKUP</Text>
                  <Text style={styles.shareRouteVal} numberOfLines={1}>
                    {pickup || '--'}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#F59E0B" style={{ marginHorizontal: 6 }} />
                <View style={[styles.shareRouteCol, { alignItems: 'flex-end' }]}>
                  <Text style={[styles.shareRouteLabel, { textAlign: 'right' }]}>DROP OFF</Text>
                  <Text style={[styles.shareRouteVal, { textAlign: 'right' }]} numberOfLines={1}>
                    {dropoff || '--'}
                  </Text>
                </View>
              </View>
              <View style={styles.shareCardDivider} />
            </>
          )}

          {hasBk && bkBase !== null && (
            <>
              <View style={styles.shareBreakdownBox}>
                <Text style={styles.shareBreakdownHdr}>PAYMENT BREAKDOWN</Text>
                <View style={styles.shareBreakdownRow}>
                  <Text style={styles.shareBreakdownLbl}>Base Amount</Text>
                  <Text style={styles.shareBreakdownVal}>${Number(bkBase).toFixed(2)}</Text>
                </View>
                <View style={styles.shareBreakdownRow}>
                  <Text style={styles.shareBreakdownLbl}>Service Fee</Text>
                  <Text style={styles.shareBreakdownVal}>${Number(bkFee).toFixed(2)}</Text>
                </View>
                <View style={[styles.shareCardDivider, { marginVertical: 4 }]} />
                <View style={styles.shareBreakdownRow}>
                  <Text style={[styles.shareBreakdownLbl, { fontWeight: '700', color: '#0F172A' }]}>
                    Total (INC GST)
                  </Text>
                  <Text style={[styles.shareBreakdownVal, { color: '#D97706', fontWeight: '800' }]}>
                    ${Number(bkTotal).toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.shareCardDivider} />
            </>
          )}

          <View style={styles.shareMetaList}>
            <View style={styles.shareMetaRow}>
              <View>
                <Text style={styles.shareMetaLabel}>Date & Time</Text>
                <Text style={styles.shareMetaValue}>{dt}</Text>
              </View>
              <View style={isCash ? styles.chipCash : styles.chipCard}>
                <Text style={isCash ? styles.chipCashText : styles.chipCardText}>
                  {isCash ? '💵 Cash' : isTap ? '⚡ Tap & Go' : '💳 Card'}
                </Text>
              </View>
            </View>

            <View style={styles.shareMetaRow}>
              <View>
                <Text style={styles.shareMetaLabel}>Payment Method</Text>
                <Text style={styles.shareMetaValue}>{paymentMethodLabel}</Text>
              </View>
              <View style={isCash ? styles.chipCash : styles.chipCard}>
                <Text style={isCash ? styles.chipCashText : styles.chipCardText}>{cardBrand}</Text>
              </View>
            </View>

            <View style={styles.shareMetaRow}>
              <View>
                <Text style={styles.shareMetaLabel}>
                  {isCash ? 'Receipt ID' : 'Payment ID'}
                </Text>
                <Text style={styles.shareMetaValue}>{payId}</Text>
              </View>
            </View>
          </View>

          <View style={styles.shareFooter}>
            <Text style={styles.shareThankYou}>
              THANK YOU FOR CHOOSING {isTaxi && taxiNo ? `TAXI ${taxiNo}` : biz.toUpperCase()}
            </Text>
            <Text style={styles.sharePoweredBy}>POWERED BY</Text>
            <Image
              source={require('../../../assets/SE-pay-logo-gif.gif')}
              style={styles.shareSePayLogo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Ad Banner Card for Animated GIF */}
        {hasAd && bannerUrl && (
          <View ref={adBannerCardRef} collapsable={false} style={styles.shareAdBannerCard}>
            <View style={styles.shareAdCardHeader}>
              <View style={styles.shareAdSponsoredPill}>
                <Ionicons name="sparkles" size={11} color="#92400E" style={{ marginRight: 4 }} />
                <Text style={styles.shareAdSponsoredPillText}>SPONSORED ADVERTISEMENT</Text>
              </View>
              <Text style={styles.shareAdBrandText}>SE PAY</Text>
            </View>

            <View style={styles.shareAdImageWrap}>
              <Image
                source={{ uri: bannerUrl }}
                style={styles.shareAdImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.shareAdFooter}>
              <Text style={styles.shareAdFooterThank}>
                THANK YOU FOR CHOOSING {isTaxi && taxiNo ? `TAXI ${taxiNo}` : biz.toUpperCase()}
              </Text>
              <Text style={styles.shareAdFooterPowered}>POWERED BY SE PAY</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── SHARE FORMAT SELECTION MODAL ── */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={isSharing ? undefined : onClose}
      >
        <TouchableWithoutFeedback onPress={isSharing ? undefined : onClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />

                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalTitle}>Share Receipt</Text>
                    <Text style={styles.modalSubtitle}>
                      {isSharing && sharingFormat
                        ? sharingLabels[sharingFormat]
                        : 'Select your preferred format to share'}
                    </Text>
                  </View>
                  {!isSharing && (
                    <TouchableOpacity
                      style={styles.modalCloseBtn}
                      onPress={onClose}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="x" size={20} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Option 1: Share as Image (PNG) */}
                <TouchableOpacity
                  style={[
                    styles.modalOptionCard,
                    isSharing && sharingFormat === 'photo' && styles.modalOptionCardActive,
                    isSharing && sharingFormat !== 'photo' && styles.modalOptionCardDisabled,
                  ]}
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
                  {isSharing && sharingFormat === 'photo' ? (
                    <ActivityIndicator size="small" color="#D97706" />
                  ) : (
                    <Feather name="chevron-right" size={18} color="#94A3B8" />
                  )}
                </TouchableOpacity>

                {/* Option 2: Animated Card (GIF) when ad_banner is true */}
                {hasAd && bannerUrl && (
                  <TouchableOpacity
                    style={[
                      styles.modalOptionCard,
                      isSharing && sharingFormat === 'gif' && styles.modalOptionCardActive,
                      isSharing && sharingFormat !== 'gif' && styles.modalOptionCardDisabled,
                    ]}
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
                    {isSharing && sharingFormat === 'gif' ? (
                      <ActivityIndicator size="small" color="#9333EA" />
                    ) : (
                      <Feather name="chevron-right" size={18} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                )}

                {/* Option 3: PDF Document */}
                <TouchableOpacity
                  style={[
                    styles.modalOptionCard,
                    isSharing && sharingFormat === 'pdf' && styles.modalOptionCardActive,
                    isSharing && sharingFormat !== 'pdf' && styles.modalOptionCardDisabled,
                  ]}
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
                  {isSharing && sharingFormat === 'pdf' ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <Feather name="chevron-right" size={18} color="#94A3B8" />
                  )}
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  style={[styles.modalCancelBtn, isSharing && { opacity: 0.4 }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                  disabled={isSharing}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
  modalOptionCardActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#93C5FD',
  },
  modalOptionCardDisabled: {
    opacity: 0.4,
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
