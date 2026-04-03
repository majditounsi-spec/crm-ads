import { useState, useCallback } from 'react';

export interface FortnoxInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  vat: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  description: string;
  sourceType: 'getaccept' | 'manual' | 'project';
  sourceId?: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface FortnoxConfig {
  clientId: string;
  clientSecret: string;
  connected: boolean;
  companyName: string;
}

const STORAGE_KEY = 'marketflow_fortnox_invoices';
const CONFIG_KEY = 'marketflow_fortnox_config';

const sampleInvoices: FortnoxInvoice[] = [
  {
    id: 'fn-1', invoiceNumber: '2026-001', customerName: 'TechStart AB', customerEmail: 'anna@techstart.se',
    amount: 45000, vat: 11250, totalAmount: 56250, status: 'paid', dueDate: '2026-04-20',
    createdAt: '2026-03-21', paidAt: '2026-04-15', description: 'SEO Paket - Q2 2026',
    sourceType: 'getaccept', sourceId: 'ga-1',
    items: [{ description: 'SEO Optimering Q2', quantity: 1, unitPrice: 45000, total: 45000 }],
  },
  {
    id: 'fn-2', invoiceNumber: '2026-002', customerName: 'DataVision AB', customerEmail: 'maria@datavision.se',
    amount: 180000, vat: 45000, totalAmount: 225000, status: 'sent', dueDate: '2026-04-30',
    createdAt: '2026-02-16', description: 'Webb & SEO Årsavtal',
    sourceType: 'getaccept', sourceId: 'ga-5',
    items: [
      { description: 'Webbdesign & Utveckling', quantity: 1, unitPrice: 120000, total: 120000 },
      { description: 'SEO Årspaket', quantity: 1, unitPrice: 60000, total: 60000 },
    ],
  },
];

function loadInvoices(): FortnoxInvoice[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return sampleInvoices;
}

function saveInvoices(invoices: FortnoxInvoice[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

function loadConfig(): FortnoxConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { clientId: '', clientSecret: '', connected: false, companyName: '' };
}

function saveConfig(config: FortnoxConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

let invoiceCounter = 3;

export function useFortnox() {
  const [invoices, setInvoicesState] = useState<FortnoxInvoice[]>(loadInvoices);
  const [config, setConfigState] = useState<FortnoxConfig>(loadConfig);

  const setInvoices = useCallback((updater: FortnoxInvoice[] | ((prev: FortnoxInvoice[]) => FortnoxInvoice[])) => {
    setInvoicesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveInvoices(next);
      return next;
    });
  }, []);

  const connect = useCallback((clientId: string, clientSecret: string, companyName: string) => {
    const newConfig = { clientId, clientSecret, connected: true, companyName };
    setConfigState(newConfig);
    saveConfig(newConfig);
    setInvoices(sampleInvoices);
  }, [setInvoices]);

  const disconnect = useCallback(() => {
    const newConfig = { clientId: '', clientSecret: '', connected: false, companyName: '' };
    setConfigState(newConfig);
    saveConfig(newConfig);
  }, []);

  const createInvoiceFromDeal = useCallback((deal: {
    id: string; name: string; company: string; value: number;
    recipientEmail: string; recipientName: string; tags: string[];
  }) => {
    const invoiceNumber = `2026-${String(invoiceCounter++).padStart(3, '0')}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const newInvoice: FortnoxInvoice = {
      id: `fn-${Date.now()}`,
      invoiceNumber,
      customerName: deal.company,
      customerEmail: deal.recipientEmail,
      amount: deal.value,
      vat: deal.value * 0.25,
      totalAmount: deal.value * 1.25,
      status: 'draft',
      dueDate: dueDate.toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      description: deal.name,
      sourceType: 'getaccept',
      sourceId: deal.id,
      items: [{ description: deal.name, quantity: 1, unitPrice: deal.value, total: deal.value }],
    };

    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  }, [setInvoices]);

  const createManualInvoice = useCallback((data: {
    customerName: string; customerEmail: string; description: string;
    items: InvoiceItem[];
  }) => {
    const invoiceNumber = `2026-${String(invoiceCounter++).padStart(3, '0')}`;
    const amount = data.items.reduce((s, i) => s + i.total, 0);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const newInvoice: FortnoxInvoice = {
      id: `fn-${Date.now()}`,
      invoiceNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      amount,
      vat: amount * 0.25,
      totalAmount: amount * 1.25,
      status: 'draft',
      dueDate: dueDate.toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      description: data.description,
      sourceType: 'manual',
      items: data.items,
    };

    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  }, [setInvoices]);

  const updateInvoiceStatus = useCallback((id: string, status: FortnoxInvoice['status']) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === id ? { ...inv, status, ...(status === 'paid' ? { paidAt: new Date().toISOString().split('T')[0] } : {}) } : inv
    ));
  }, [setInvoices]);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  }, [setInvoices]);

  const isAlreadyInvoiced = useCallback((sourceId: string) => {
    return invoices.some(inv => inv.sourceId === sourceId);
  }, [invoices]);

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0);
  const totalOutstanding = invoices.filter(i => ['sent', 'draft'].includes(i.status)).reduce((s, i) => s + i.totalAmount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.totalAmount, 0);

  return {
    invoices, config, connect, disconnect,
    createInvoiceFromDeal, createManualInvoice, updateInvoiceStatus, deleteInvoice,
    isAlreadyInvoiced, totalRevenue, totalOutstanding, totalOverdue,
  };
}
