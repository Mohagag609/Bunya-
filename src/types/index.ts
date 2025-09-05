// Type definitions for the Estate Manager application

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  name: string;
  building: string;
  floor: number;
  area: number;
  price: number;
  status: 'available' | 'sold' | 'reserved';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Partner {
  id: string;
  name: string;
  phone: string;
  email?: string;
  percentage: number;
  groupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  code: string;
  customerId: string;
  unitId: string;
  totalPrice: number;
  maintenanceDeposit: number;
  discountAmount: number;
  downPayment: number;
  type: string;
  count: number;
  extraAnnual: number;
  start: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Installment {
  id: string;
  contractId: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Safe {
  id: string;
  name: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: string;
  fromSafeId: string;
  toSafeId: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Voucher {
  id: string;
  type: 'receipt' | 'payment';
  amount: number;
  description: string;
  date: string;
  safeId: string;
  linkedRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Broker {
  id: string;
  name: string;
  phone: string;
  email?: string;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrokerDue {
  id: string;
  brokerId: string;
  contractId: string;
  amount: number;
  status: 'pending' | 'paid';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerDebt {
  id: string;
  partnerId: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnitPartner {
  id: string;
  unitId: string;
  partnerId: string;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: Record<string, any>;
  timestamp: string;
  userId?: string;
}

export interface Settings {
  key: string;
  theme: 'dark' | 'light';
  font: number;
  pass?: string;
}

export interface KeyVal {
  key: string;
  value: any;
}

// Application State
export interface AppState {
  customers: Customer[];
  units: Unit[];
  partners: Partner[];
  unitPartners: UnitPartner[];
  contracts: Contract[];
  installments: Installment[];
  partnerDebts: PartnerDebt[];
  safes: Safe[];
  transfers: Transfer[];
  auditLog: AuditLog[];
  vouchers: Voucher[];
  brokerDues: BrokerDue[];
  brokers: Broker[];
  partnerGroups: PartnerGroup[];
  settings: Settings;
  keyval: KeyVal[];
  locked: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// UI State
export interface UIState {
  currentView: string;
  currentParam: string | null;
  loading: boolean;
  error: string | null;
  notification: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    show: boolean;
  };
}

// Navigation
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  view: string;
  count?: number;
}

// Chart data
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Table column
export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'status';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

// Filter options
export interface FilterOptions {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}