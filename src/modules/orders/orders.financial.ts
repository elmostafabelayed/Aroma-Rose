/**
 * Authoritative SQL expressions for financial and operational metrics.
 * Shared across Executive Dashboard, Reports & Analytics, and Order Services
 * to ensure absolute financial correctness and prevent formula drift.
 */
export const FINANCIAL_SQL = {
  /**
   * Collected Revenue: Money actually collected and settled.
   * Strictly requires payment_status = 'paid' AND status != 'cancelled'.
   * Never assumes delivered = collected if payment_status is unpaid or refunded.
   */
  COLLECTED_REVENUE: `COALESCE(sum(CASE WHEN payment_status = 'paid' AND status != 'cancelled' THEN total_amount ELSE 0 END), 0)::numeric(12,2)`,

  /**
   * Gross Order Value: Total sales value of all valid, non-cancelled orders.
   */
  GROSS_ORDER_VALUE: `COALESCE(sum(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0)::numeric(12,2)`,

  /**
   * Pipeline Order Value: Unpaid orders in pre-shipment pipeline (pending, confirmed, processing).
   */
  PIPELINE_ORDER_VALUE: `COALESCE(sum(CASE WHEN status IN ('pending', 'confirmed', 'processing') AND payment_status = 'unpaid' THEN total_amount ELSE 0 END), 0)::numeric(12,2)`,

  /**
   * Pending Collection: All valid unpaid orders awaiting cash collection (including pipeline and in-transit).
   * Excludes cancelled and refunded orders.
   */
  PENDING_COLLECTION: `COALESCE(sum(CASE WHEN payment_status = 'unpaid' AND status != 'cancelled' THEN total_amount ELSE 0 END), 0)::numeric(12,2)`,

  /**
   * In-Transit Value: Value of physically shipped orders with delivery carrier not yet collected.
   * Excludes paid, refunded, or cancelled orders.
   */
  IN_TRANSIT_VALUE: `COALESCE(sum(CASE WHEN status = 'shipped' AND payment_status = 'unpaid' THEN total_amount ELSE 0 END), 0)::numeric(12,2)`,

  /**
   * Delivered Awaiting Remittance (Delivered Uncollected Value):
   * Orders delivered to customer by carrier, but COD cash has not yet been remitted to / collected by merchant.
   * Excludes paid, refunded, or cancelled orders.
   */
  DELIVERED_UNCOLLECTED_VALUE: `COALESCE(sum(CASE WHEN status = 'delivered' AND payment_status = 'unpaid' THEN total_amount ELSE 0 END), 0)::numeric(12,2)`,

  /**
   * Average Order Value (AOV): Gross order value divided by non-cancelled orders.
   */
  AVERAGE_ORDER_VALUE: `COALESCE(avg(CASE WHEN status != 'cancelled' THEN total_amount END), 0)::numeric(12,2)`,
};

