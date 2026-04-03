import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

interface DbInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  vat: number;
  total_amount: number;
  status: string;
  due_date: string;
  created_at: string;
  paid_at: string | null;
  description: string;
  source_type: string;
  source_id: string | null;
  items: InvoiceItem[];
}

function dbToInvoice(row: DbInvoice): FortnoxInvoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    amount: Number(row.amount),
    vat: Number(row.vat),
    totalAmount: Number(row.total_amount),
    status: row.status as FortnoxInvoice['status'],
    dueDate: row.due_date,
    createdAt: row.created_at?.split('T')[0] || '',
    paidAt: row.paid_at || undefined,
    description: row.description,
    sourceType: row.source_type as FortnoxInvoice['sourceType'],
    sourceId: row.source_id || undefined,
    items: Array.isArray(row.items) ? row.items : [],
  };
}

function invoiceToDb(inv: Omit<FortnoxInvoice, 'id'>) {
  return {
    invoice_number: inv.invoiceNumber,
    customer_name: inv.customerName,
    customer_email: inv.customerEmail,
    amount: inv.amount,
    vat: inv.vat,
    total_amount: inv.totalAmount,
    status: inv.status,
    due_date: inv.dueDate,
    paid_at: inv.paidAt || null,
    description: inv.description,
    source_type: inv.sourceType,
    source_id: inv.sourceId || null,
    items: JSON.stringify(inv.items),
  };
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

function saveLocal(invoices: FortnoxInvoice[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch {}
}

function loadLocal(): FortnoxInvoice[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

function loadConfig(): FortnoxConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { clientId: '', clientSecret: '', connected: false, companyName: '' };
}

function saveConfig(config: FortnoxConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {}
}

function getNextInvoiceNumber(invoices: FortnoxInvoice[]): string {
  const year = new Date().getFullYear();
  let maxNum = 0;
  for (const inv of invoices) {
    const match = inv.invoiceNumber.match(/^\d{4}-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `${year}-${String(maxNum + 1).padStart(3, '0')}`;
}

export function useFortnox() {
  const [invoices, setInvoicesState] = useState<FortnoxInvoice[]>([]);
  const [config, setConfigState] = useState<FortnoxConfig>(loadConfig);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('invoices' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = (data as unknown as DbInvoice[]).map(dbToInvoice);
        setInvoicesState(mapped);
        saveLocal(mapped);
      } else {
        const local = loadLocal();
        if (local && local.length > 0) {
          setInvoicesState(local);
        } else {
          setInvoicesState(sampleInvoices);
          saveLocal(sampleInvoices);
        }
      }
    } catch {
      const local = loadLocal();
      if (local && local.length > 0) {
        setInvoicesState(local);
      } else {
        setInvoicesState(sampleInvoices);
        saveLocal(sampleInvoices);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const setInvoices = useCallback((updater: FortnoxInvoice[] | ((prev: FortnoxInvoice[]) => FortnoxInvoice[])) => {
    setInvoicesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveLocal(next);
      return next;
    });
  }, []);

  const connect = useCallback((clientId: string, clientSecret: string, companyName: string) => {
    const newConfig = { clientId, clientSecret, connected: true, companyName };
    setConfigState(newConfig);
    saveConfig(newConfig);
    fetchInvoices();
  }, [fetchInvoices]);

  const disconnect = useCallback(() => {
    const newConfig = { clientId: '', clientSecret: '', connected: false, companyName: '' };
    setConfigState(newConfig);
    saveConfig(newConfig);
  }, []);

  const createInvoiceFromDeal = useCallback(async (deal: {
    id: string; name: string; company: string; value: number;
    recipientEmail: string; recipientName: string; tags: string[];
  }) => {
    const currentInvoices = loadLocal() || invoices;
    const invoiceNumber = getNextInvoiceNumber(currentInvoices);
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

    // Try Supabase first
    const { data, error } = await supabase
      .from('invoices' as any)
      .insert(invoiceToDb(newInvoice) as any)
      .select()
      .single();

    if (!error && data) {
      const dbInvoice = dbToInvoice(data as unknown as DbInvoice);
      setInvoices(prev => [dbInvoice, ...prev]);
      return dbInvoice;
    }
    // Fallback to local
    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  }, [invoices, setInvoices]);

  const createManualInvoice = useCallback(async (data: {
    customerName: string; customerEmail: string; description: string;
    items: InvoiceItem[];
  }) => {
    const currentInvoices = loadLocal() || invoices;
    const invoiceNumber = getNextInvoiceNumber(currentInvoices);
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

    const { data: dbData, error } = await supabase
      .from('invoices' as any)
      .insert(invoiceToDb(newInvoice) as any)
      .select()
      .single();

    if (!error && dbData) {
      const dbInvoice = dbToInvoice(dbData as unknown as DbInvoice);
      setInvoices(prev => [dbInvoice, ...prev]);
      return dbInvoice;
    }
    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  }, [invoices, setInvoices]);

  const updateInvoiceStatus = useCallback(async (id: string, status: FortnoxInvoice['status']) => {
    const paidAt = status === 'paid' ? new Date().toISOString().split('T')[0] : undefined;

    setInvoices(prev => prev.map(inv =>
      inv.id === id ? { ...inv, status, ...(paidAt ? { paidAt } : {}) } : inv
    ));

    const dbUpdates: Record<string, any> = { status };
    if (paidAt) dbUpdates.paid_at = paidAt;

    const { error } = await supabase
      .from('invoices' as any)
      .update(dbUpdates as any)
      .eq('id', id);
    if (error) console.error('Supabase invoice update failed:', error.message);
  }, [setInvoices]);

  const deleteInvoice = useCallback(async (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));

    const { error } = await supabase
      .from('invoices' as any)
      .delete()
      .eq('id', id);
    if (error) console.error('Supabase invoice delete failed:', error.message);
  }, [setInvoices]);

  const isAlreadyInvoiced = useCallback((sourceId: string) => {
    return invoices.some(inv => inv.sourceId === sourceId);
  }, [invoices]);

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0);
  const totalOutstanding = invoices.filter(i => ['sent', 'draft'].includes(i.status)).reduce((s, i) => s + i.totalAmount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.totalAmount, 0);

  return {
    invoices, loading, config, connect, disconnect,
    createInvoiceFromDeal, createManualInvoice, updateInvoiceStatus, deleteInvoice,
    isAlreadyInvoiced, totalRevenue, totalOutstanding, totalOverdue, refetch: fetchInvoices,
  };
}
