import type { Transaction } from '../types';

let transactions: Transaction[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

export function getTransactions(): Transaction[] {
  return [...transactions];
}

export function addTransaction(tx: Transaction): void {
  // Prepend so latest appears first
  transactions = [tx, ...transactions.filter((t) => t.id !== tx.id)];
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Error notifying transaction listener:', err);
    }
  });
}

export function subscribeTransactions(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
