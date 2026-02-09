import { Store, User, CashClosing } from '@/types';

export const mockStores: Store[] = [
  { id: '1', name: 'Joalheria Centro', code: 'JC001', unit: 'Shopping Center', createdAt: new Date('2024-01-01') },
  { id: '2', name: 'Joalheria Norte', code: 'JN002', unit: 'Shopping Norte', createdAt: new Date('2024-01-01') },
  { id: '3', name: 'Joalheria Sul', code: 'JS003', unit: 'Galeria Sul', createdAt: new Date('2024-02-15') },
];

export const mockUsers: User[] = [
  { id: '1', name: 'Maria Silva', email: 'maria@closerflow.com', role: 'funcionaria', storeId: '1', createdAt: new Date('2024-01-01') },
  { id: '2', name: 'Ana Santos', email: 'ana@closerflow.com', role: 'funcionaria', storeId: '2', createdAt: new Date('2024-01-01') },
  { id: '3', name: 'Carlos Oliveira', email: 'carlos@closerflow.com', role: 'gerente', storeId: '1', createdAt: new Date('2024-01-01') },
  { id: '4', name: 'Roberto Costa', email: 'roberto@closerflow.com', role: 'administrador', createdAt: new Date('2024-01-01') },
];

export const mockClosings: CashClosing[] = [
  {
    id: '1',
    date: new Date(),
    storeId: '1',
    storeName: 'Joalheria Centro',
    initialValue: 500,
    expectedValue: 15420.50,
    countedValue: 15420.50,
    difference: 0,
    status: 'aprovado',
    createdBy: '1',
    createdByName: 'Maria Silva',
    validatedBy: '3',
    validatedByName: 'Carlos Oliveira',
    validatedAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: '2',
    date: new Date(),
    storeId: '2',
    storeName: 'Joalheria Norte',
    initialValue: 300,
    expectedValue: 8950.00,
    countedValue: 8920.00,
    difference: -30.00,
    status: 'atencao',
    observations: 'Diferença de R$ 30,00 a menos. Verificar recibos.',
    createdBy: '2',
    createdByName: 'Ana Santos',
    createdAt: new Date(),
  },
  {
    id: '3',
    date: new Date(Date.now() - 86400000),
    storeId: '1',
    storeName: 'Joalheria Centro',
    initialValue: 400,
    expectedValue: 12300.00,
    countedValue: 12300.00,
    difference: 0,
    status: 'aprovado',
    createdBy: '1',
    createdByName: 'Maria Silva',
    validatedBy: '3',
    validatedByName: 'Carlos Oliveira',
    validatedAt: new Date(Date.now() - 86400000),
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: '4',
    date: new Date(Date.now() - 86400000),
    storeId: '3',
    storeName: 'Joalheria Sul',
    initialValue: 200,
    expectedValue: 5670.00,
    countedValue: 5670.00,
    difference: 0,
    status: 'ok',
    createdBy: '1',
    createdByName: 'Maria Silva',
    createdAt: new Date(Date.now() - 86400000),
  },
];

export const TOLERANCE_LIMIT = 10; // R$ 10,00 de tolerância
