import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  formatDateToYMD,
  formatYMDToDisplay,
  formatDateRangeDisplay,
  getTodayYMD,
  getYesterdayYMD,
  getLast7DaysYMD,
  getThisMonthYMD,
  parseYMDToDate,
} from '../../utils/dateUtils';

export interface DateRangePickerModalProps {
  visible: boolean;
  initialStartDate?: string | null;
  initialEndDate?: string | null;
  onClose: () => void;
  onApply: (startDate: string | null, endDate: string | null, label: string) => void;
}

type PresetKey = 'all' | 'today' | 'yesterday' | 'last7' | 'this_month' | 'custom';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function determineInitialPreset(start?: string | null, end?: string | null): PresetKey {
  if (!start && !end) return 'all';
  const today = getTodayYMD();
  const yesterday = getYesterdayYMD();
  const last7 = getLast7DaysYMD();
  const thisMonth = getThisMonthYMD();

  if (start === today && end === today) return 'today';
  if (start === yesterday && end === yesterday) return 'yesterday';
  if (start === last7.startDate && end === last7.endDate) return 'last7';
  if (start === thisMonth.startDate && end === thisMonth.endDate) return 'this_month';
  return 'custom';
}

function DateRangePickerContent({
  initialStartDate,
  initialEndDate,
  onClose,
  onApply,
}: Omit<DateRangePickerModalProps, 'visible'>) {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>(() =>
    determineInitialPreset(initialStartDate, initialEndDate)
  );
  const [tempStartDate, setTempStartDate] = useState<string | null>(initialStartDate || null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(initialEndDate || null);

  // Calendar View month & year initialized from starting date
  const [viewYear, setViewYear] = useState<number>(() => {
    const refDate = parseYMDToDate(initialStartDate || '') || new Date();
    return refDate.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const refDate = parseYMDToDate(initialStartDate || '') || new Date();
    return refDate.getMonth();
  });

  // Handle Preset selection
  const handleSelectPreset = (preset: PresetKey) => {
    setSelectedPreset(preset);

    if (preset === 'all') {
      setTempStartDate(null);
      setTempEndDate(null);
    } else if (preset === 'today') {
      const today = getTodayYMD();
      setTempStartDate(today);
      setTempEndDate(today);
      const d = parseYMDToDate(today);
      if (d) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    } else if (preset === 'yesterday') {
      const yesterday = getYesterdayYMD();
      setTempStartDate(yesterday);
      setTempEndDate(yesterday);
      const d = parseYMDToDate(yesterday);
      if (d) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    } else if (preset === 'last7') {
      const { startDate, endDate } = getLast7DaysYMD();
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      const d = parseYMDToDate(endDate);
      if (d) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    } else if (preset === 'this_month') {
      const { startDate, endDate } = getThisMonthYMD();
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      const d = parseYMDToDate(endDate);
      if (d) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Day click logic
  const handleDayPress = (dayStr: string) => {
    setSelectedPreset('custom');

    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(dayStr);
      setTempEndDate(null);
    } else if (tempStartDate && !tempEndDate) {
      if (dayStr < tempStartDate) {
        setTempEndDate(tempStartDate);
        setTempStartDate(dayStr);
      } else {
        setTempEndDate(dayStr);
      }
    }
  };

  // Build calendar weeks grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  let firstDayIndex = new Date(viewYear, viewMonth, 1).getDay() - 1;
  if (firstDayIndex === -1) firstDayIndex = 6;

  const allCalendarDays: ({ day: number; dateStr: string } | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    allCalendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(viewYear, viewMonth, d);
    allCalendarDays.push({
      day: d,
      dateStr: formatDateToYMD(dateObj),
    });
  }

  // Chunk into rows of 7
  const calendarWeeks: ({ day: number; dateStr: string } | null)[][] = [];
  for (let i = 0; i < allCalendarDays.length; i += 7) {
    const week = allCalendarDays.slice(i, i + 7);
    while (week.length < 7) {
      week.push(null);
    }
    calendarWeeks.push(week);
  }

  // Handle Apply
  const handleApply = () => {
    let finalLabel = 'All Dates';

    if (tempStartDate && tempEndDate) {
      if (selectedPreset === 'today') {
        finalLabel = 'Today';
      } else if (selectedPreset === 'yesterday') {
        finalLabel = 'Yesterday';
      } else if (selectedPreset === 'last7') {
        finalLabel = 'Last 7 Days';
      } else if (selectedPreset === 'this_month') {
        finalLabel = 'This Month';
      } else {
        finalLabel = formatDateRangeDisplay(tempStartDate, tempEndDate);
      }
      onApply(tempStartDate, tempEndDate, finalLabel);
    } else if (tempStartDate && !tempEndDate) {
      finalLabel = formatYMDToDisplay(tempStartDate);
      onApply(tempStartDate, tempStartDate, finalLabel);
    } else {
      onApply(null, null, 'All Dates');
    }
    onClose();
  };

  const handleReset = () => {
    handleSelectPreset('all');
    onApply(null, null, 'All Dates');
    onClose();
  };

  const todayStr = getTodayYMD();

  return (
    <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Filter by Date Range</Text>
          <Text style={styles.subtitle}>Select a preset or custom date range</Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Presets */}
        <View style={styles.presetsWrap}>
          <TouchableOpacity
            style={[
              styles.presetChip,
              selectedPreset === 'all' && styles.presetChipActive,
            ]}
            onPress={() => handleSelectPreset('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.presetChipText,
                selectedPreset === 'all' && styles.presetChipTextActive,
              ]}
            >
              All Dates
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.presetChip,
              selectedPreset === 'today' && styles.presetChipActive,
            ]}
            onPress={() => handleSelectPreset('today')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.presetChipText,
                selectedPreset === 'today' && styles.presetChipTextActive,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.presetChip,
              selectedPreset === 'yesterday' && styles.presetChipActive,
            ]}
            onPress={() => handleSelectPreset('yesterday')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.presetChipText,
                selectedPreset === 'yesterday' && styles.presetChipTextActive,
              ]}
            >
              Yesterday
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.presetChip,
              selectedPreset === 'last7' && styles.presetChipActive,
            ]}
            onPress={() => handleSelectPreset('last7')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.presetChipText,
                selectedPreset === 'last7' && styles.presetChipTextActive,
              ]}
            >
              Last 7 Days
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.presetChip,
              selectedPreset === 'this_month' && styles.presetChipActive,
            ]}
            onPress={() => handleSelectPreset('this_month')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.presetChipText,
                selectedPreset === 'this_month' && styles.presetChipTextActive,
              ]}
            >
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Range Display Banner */}
        <View style={styles.rangeDisplayCard}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateBlockLabel}>FROM</Text>
            <Text style={styles.dateBlockValue}>
              {tempStartDate ? formatYMDToDisplay(tempStartDate) : '--'}
            </Text>
          </View>

          <View style={styles.rangeArrowWrap}>
            <Ionicons name="arrow-forward" size={16} color="#94A3B8" />
          </View>

          <View style={styles.dateBlock}>
            <Text style={styles.dateBlockLabel}>TO</Text>
            <Text style={styles.dateBlockValue}>
              {tempEndDate
                ? formatYMDToDisplay(tempEndDate)
                : tempStartDate
                ? formatYMDToDisplay(tempStartDate)
                : '--'}
            </Text>
          </View>
        </View>

        {/* Interactive Month Calendar */}
        <View style={styles.calendarContainer}>
          {/* Calendar Month & Nav */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.monthNavBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={18} color="#0F172A" />
            </TouchableOpacity>

            <Text style={styles.monthNavTitle}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.monthNavBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Weekdays Row */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((wd) => (
              <View key={wd} style={styles.weekdayCol}>
                <Text style={styles.weekdayText}>{wd}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Weeks */}
          <View style={styles.calendarWeeksContainer}>
            {calendarWeeks.map((week, weekIdx) => (
              <View key={`week-${weekIdx}`} style={styles.weekRow}>
                {week.map((item, colIdx) => {
                  if (!item) {
                    return <View key={`empty-${weekIdx}-${colIdx}`} style={styles.dayCellContainer} />;
                  }

                  const hasRange = Boolean(
                    tempStartDate && tempEndDate && tempStartDate < tempEndDate
                  );
                  const isStart = tempStartDate === item.dateStr;
                  const isEnd = hasRange ? tempEndDate === item.dateStr : isStart;
                  const isInRange = Boolean(
                    hasRange &&
                    tempStartDate &&
                    tempEndDate &&
                    item.dateStr > tempStartDate &&
                    item.dateStr < tempEndDate
                  );
                  const isToday = item.dateStr === todayStr;

                  return (
                    <TouchableOpacity
                      key={item.dateStr}
                      style={styles.dayCellContainer}
                      onPress={() => handleDayPress(item.dateStr)}
                      activeOpacity={0.7}
                    >
                      {/* Range Ribbon Background */}
                      {hasRange && (
                        <>
                          {isInRange && (
                            <View
                              style={[
                                styles.rangeRibbon,
                                colIdx === 0 && styles.rangeRibbonLeftRounded,
                                colIdx === 6 && styles.rangeRibbonRightRounded,
                              ]}
                            />
                          )}
                          {isStart && <View style={styles.rangeRibbonStart} />}
                          {isEnd && <View style={styles.rangeRibbonEnd} />}
                        </>
                      )}

                      {/* Day Circle */}
                      <View
                        style={[
                          styles.dayCircle,
                          (isStart || (hasRange && isEnd)) && styles.dayCircleSelected,
                          isToday && !isStart && !isEnd && styles.dayCircleToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isToday && styles.dayTextToday,
                            (isStart || (hasRange && isEnd)) && styles.dayTextSelected,
                            isInRange && styles.dayTextInRange,
                          ]}
                        >
                          {item.day}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleReset}
          activeOpacity={0.75}
        >
          <Text style={styles.resetBtnText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.applyBtn}
          onPress={handleApply}
          activeOpacity={0.85}
        >
          <Text style={styles.applyBtnText}>Apply Filter</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

export default function DateRangePickerModal({
  visible,
  initialStartDate,
  initialEndDate,
  onClose,
  onApply,
}: DateRangePickerModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <DateRangePickerContent
          key={`${initialStartDate || ''}-${initialEndDate || ''}`}
          initialStartDate={initialStartDate}
          initialEndDate={initialEndDate}
          onClose={onClose}
          onApply={onApply}
        />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#92400E',
    fontWeight: '700',
  },
  rangeDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 14,
  },
  dateBlock: {
    flex: 1,
  },
  dateBlockLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  dateBlockValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  rangeArrowWrap: {
    paddingHorizontal: 8,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthNavTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  monthNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  weekdayCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  calendarWeeksContainer: {
    gap: 4,
  },
  weekRow: {
    flexDirection: 'row',
    height: 40,
  },
  dayCellContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  rangeRibbon: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 0,
    right: 0,
    backgroundColor: '#FEF3C7',
  },
  rangeRibbonLeftRounded: {
    borderTopLeftRadius: 17,
    borderBottomLeftRadius: 17,
  },
  rangeRibbonRightRounded: {
    borderTopRightRadius: 17,
    borderBottomRightRadius: 17,
  },
  rangeRibbonStart: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: '50%',
    right: 0,
    backgroundColor: '#FEF3C7',
  },
  rangeRibbonEnd: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 0,
    right: '50%',
    backgroundColor: '#FEF3C7',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  dayCircleSelected: {
    backgroundColor: '#D97706',
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: '#D97706',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },
  dayTextToday: {
    color: '#D97706',
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextInRange: {
    color: '#92400E',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  resetBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
