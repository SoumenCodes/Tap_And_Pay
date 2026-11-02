import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  tag: string;
  message: string;
  data?: any;
}

const MAX_MEMORY_LOGS = 300;
const memoryLogs: LogEntry[] = [];
let logsSnapshot: LogEntry[] = [];
const logFilePath = `${FileSystem.documentDirectory || ''}sepay_debug_logs.txt`;

type LogListener = () => void;
const listeners = new Set<LogListener>();

function formatData(data: any): string {
  if (data === undefined || data === null) return '';
  if (typeof data === 'string') return data;
  if (data instanceof Error) {
    return `${data.name}: ${data.message}\nStack: ${data.stack || 'none'}`;
  }
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

async function appendToFile(text: string): Promise<void> {
  try {
    if (!FileSystem.documentDirectory) return;
    const fileInfo = await FileSystem.getInfoAsync(logFilePath);
    if (fileInfo.exists) {
      // Append text
      const existing = await FileSystem.readAsStringAsync(logFilePath);
      // Keep last ~500KB to prevent infinite file growth
      const trimmed = existing.length > 500000 ? existing.slice(-250000) : existing;
      await FileSystem.writeAsStringAsync(logFilePath, `${trimmed}\n${text}`);
    } else {
      await FileSystem.writeAsStringAsync(logFilePath, text);
    }
  } catch {
    // Fail silently so logging never crashes the app
  }
}

function addLog(level: LogEntry['level'], tag: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const entry: LogEntry = {
    id,
    timestamp,
    level,
    tag,
    message,
    data,
  };

  memoryLogs.push(entry);
  if (memoryLogs.length > MAX_MEMORY_LOGS) {
    memoryLogs.shift();
  }
  logsSnapshot = [...memoryLogs];

  // Console output
  const prefix = `[${timestamp}] [${level}] [${tag}] ${message}`;
  if (level === 'ERROR') {
    console.error(prefix, data !== undefined ? data : '');
  } else if (level === 'WARN') {
    console.warn(prefix, data !== undefined ? data : '');
  } else {
    console.log(prefix, data !== undefined ? data : '');
  }

  // Append formatted log line to file
  const formattedDataStr = data !== undefined ? `\nData: ${formatData(data)}` : '';
  const line = `[${timestamp}] [${level}] [${tag}] ${message}${formattedDataStr}`;
  appendToFile(line).catch(() => {});

  listeners.forEach((listener) => {
    try {
      listener();
    } catch {}
  });
}

export const appLogger = {
  log: (tag: string, message: string, data?: any) => addLog('INFO', tag, message, data),
  info: (tag: string, message: string, data?: any) => addLog('INFO', tag, message, data),
  warn: (tag: string, message: string, data?: any) => addLog('WARN', tag, message, data),
  error: (tag: string, message: string, data?: any) => addLog('ERROR', tag, message, data),
  debug: (tag: string, message: string, data?: any) => addLog('DEBUG', tag, message, data),

  getLogs: (): LogEntry[] => [...memoryLogs],
  getLogsSnapshot: (): LogEntry[] => logsSnapshot,

  getLogsAsText: (): string => {
    if (memoryLogs.length === 0) return 'No logs recorded yet.';
    return memoryLogs
      .map((l) => {
        const d = l.data !== undefined ? `\nData: ${formatData(l.data)}` : '';
        return `[${l.timestamp}] [${l.level}] [${l.tag}] ${l.message}${d}`;
      })
      .join('\n\n----------------------------------------\n\n');
  },

  clearLogs: async (): Promise<void> => {
    memoryLogs.length = 0;
    logsSnapshot = [];
    listeners.forEach((listener) => {
      try {
        listener();
      } catch {}
    });
    try {
      if (FileSystem.documentDirectory) {
        await FileSystem.writeAsStringAsync(logFilePath, `--- LOGS CLEARED AT ${new Date().toISOString()} ---\n`);
      }
    } catch {}
  },

  getLogFilePath: (): string => logFilePath,

  /**
   * Share the log file or log text using device native share sheet (WhatsApp, Email, Drive, etc.)
   */
  shareLogs: async (): Promise<void> => {
    const logsText = appLogger.getLogsAsText();
    try {
      // 1. Ensure file exists on disk
      if (FileSystem.documentDirectory) {
        await FileSystem.writeAsStringAsync(logFilePath, logsText);
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(logFilePath, {
            mimeType: 'text/plain',
            dialogTitle: 'Share SE PAY Debug Logs',
            UTI: 'public.plain-text',
          });
          return;
        }
      }

      // 2. Fallback to standard React Native share
      await Share.share({
        title: 'SE PAY Debug Logs',
        message: logsText,
      });
    } catch (err: any) {
      console.warn('Could not share log file directly, falling back to Share.share:', err);
      try {
        await Share.share({
          title: 'SE PAY Debug Logs',
          message: logsText,
        });
      } catch (innerErr) {
        console.error('Failed to share logs:', innerErr);
      }
    }
  },

  subscribe: (listener: LogListener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
