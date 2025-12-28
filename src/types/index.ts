export type UserRole = 'funcionaria' | 'gerente' | 'administrador';

export type ClosingStatus = 'ok' | 'atencao' | 'pendente' | 'aprovado';

export interface Store {
  id: string;
  name: string;
  code: string;
  unit: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeId?: string;
  createdAt: Date;
}

export interface CashClosing {
  id: string;
  date: Date;
  storeId: string;
  storeName: string;
  expectedValue: number;
  countedValue: number;
  difference: number;
  status: ClosingStatus;
  observations?: string;
  createdBy: string;
  createdByName: string;
  validatedBy?: string;
  validatedByName?: string;
  validatedAt?: Date;
  createdAt: Date;
}

export interface DailyReport {
  date: Date;
  closings: CashClosing[];
  totalExpected: number;
  totalCounted: number;
  totalDifference: number;
  okCount: number;
  attentionCount: number;
  pendingCount: number;
}
