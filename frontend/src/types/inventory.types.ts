export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type InventoryMovementType =
  | 'order_shipment'
  | 'manual_adjustment'
  | 'restock'
  | 'return_restock';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  stock_quantity: number;
  price: number;
  is_active: boolean;
  category_name: string | null;
  stock_status: StockStatus;
}

export interface InventorySummary {
  total_products: number;
  in_stock_count?: number;
  out_of_stock_count: number;
  low_stock_count: number;
  total_stock_units: number;
}

export interface InventoryOverviewData {
  summary: InventorySummary;
  inventory: InventoryItem[];
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string | null;
  order_id: string | null;
  order_number: string | null;
  movement_type: InventoryMovementType;
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  notes: string | null;
  created_at: string;
  performed_by: {
    id: string;
    full_name: string;
  } | null;
}

export interface ManualStockAdjustmentPayload {
  product_id: string;
  quantity_change: number;
  notes: string;
}

export interface ManualStockAdjustmentResponse {
  message: string;
  movement: {
    id: string;
    product_id: string;
    movement_type: InventoryMovementType;
    quantity_change: number;
    previous_stock: number;
    new_stock: number;
    notes: string;
    created_at: string;
  };
}

export interface InventoryQueryParams {
  page?: number;
  limit?: number;
  status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  category?: string;
  search?: string;
}

export interface MovementQueryParams {
  page?: number;
  limit?: number;
  product_id?: string;
  movement_type?: InventoryMovementType;
}
