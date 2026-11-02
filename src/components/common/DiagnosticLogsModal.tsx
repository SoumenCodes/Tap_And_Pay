import React, { useState, useSyncExternalStore } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appLogger, LogEntry } from '../../services/appLogger';

interface DiagnosticLogsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DiagnosticLogsModal: React.FC<DiagnosticLogsModalProps> = ({ visible, onClose }) => {
  const logs = useSyncExternalStore(appLogger.subscribe, appLogger.getLogsSnapshot);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      await appLogger.shareLogs();
    } finally {
      setIsSharing(false);
    }
  };

  const handleClear = async () => {
    await appLogger.clearLogs();
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'ERROR':
        return '#EF4444';
      case 'WARN':
        return '#F59E0B';
      case 'DEBUG':
        return '#64748B';
      case 'INFO':
      default:
        return '#2563EB';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Ionicons name="terminal-outline" size={22} color="#0F172A" style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle}>Diagnostic Logs</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{logs.length}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.shareBtn]}
            onPress={handleShare}
            disabled={isSharing}
            activeOpacity={0.8}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="share-social-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.shareBtnText}>Share Log File</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.clearBtn]}
            onPress={handleClear}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Log Stream */}
        <ScrollView style={styles.logsList} contentContainerStyle={styles.logsContent}>
          {logs.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No logs recorded in this session yet.</Text>
            </View>
          ) : (
            logs.map((log) => {
              const levelColor = getLevelColor(log.level);
              return (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logCardHeader}>
                    <View style={[styles.levelTag, { backgroundColor: `${levelColor}15` }]}>
                      <Text style={[styles.levelText, { color: levelColor }]}>{log.level}</Text>
                    </View>
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagText}>{log.tag}</Text>
                    </View>
                    <Text style={styles.timestampText}>
                      {log.timestamp.slice(11, 19)}
                    </Text>
                  </View>

                  <Text style={styles.messageText}>{log.message}</Text>

                  {log.data !== undefined && (
                    <View style={styles.dataWrap}>
                      <Text style={styles.dataText} selectable>
                        {typeof log.data === 'object'
                          ? JSON.stringify(log.data, null, 2)
                          : String(log.data)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA',
  },
  closeBtn: {
    padding: 4,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  clearBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  logsList: {
    flex: 1,
  },
  logsContent: {
    padding: 12,
    gap: 8,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  levelTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  timestampText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 'auto',
    fontVariant: ['tabular-nums'],
  },
  messageText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
    fontWeight: '500',
  },
  dataWrap: {
    marginTop: 6,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    padding: 8,
  },
  dataText: {
    fontSize: 11,
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
