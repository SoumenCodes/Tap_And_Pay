type PaymentResetListener = () => void;
const resetListeners: Set<PaymentResetListener> = new Set();

let paymentNeedsReset = false;

export const paymentSession = {
  /**
   * Called when a payment is successfully completed or finished.
   * Marks that payment state must be reset and notifies active listeners.
   */
  markPaymentCompleted: () => {
    paymentNeedsReset = true;
    resetListeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.warn('⚠️ Error in payment reset listener:', err);
      }
    });
  },

  /**
   * Check and consume whether a reset is needed (returns true and clears flag).
   */
  consumePaymentReset: (): boolean => {
    const should = paymentNeedsReset;
    paymentNeedsReset = false;
    return should;
  },

  /**
   * Listen for immediate reset events (e.g. from mounted screens).
   */
  onReset: (listener: PaymentResetListener): (() => void) => {
    resetListeners.add(listener);
    return () => {
      resetListeners.delete(listener);
    };
  },
};
