import { useState, useCallback } from 'react';

export interface GetAcceptDeal {
  id: string;
  name: string;
  company: string;
  value: number;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'rejected' | 'expired';
  recipientEmail: string;
  recipientName: string;
  createdAt: string;
  expiresAt: string;
  signedAt?: string;
  documentUrl?: string;
  tags: string[];
}

interface GetAcceptConfig {
  apiKey: string;
  entityId: string;
  connected: boolean;
}

const STORAGE_KEY = 'marketflow_getaccept';
const CONFIG_KEY = 'marketflow_getaccept_config';

const sampleDeals: GetAcceptDeal[] = [
  { id: 'ga-1', name: 'SEO Paket - Q2 2026', company: 'TechStart AB', value: 45000, status: 'signed', recipientEmail: 'anna@techstart.se', recipientName: 'Anna Karlsson', createdAt: '2026-03-15', expiresAt: '2026-04-15', signedAt: '2026-03-20', tags: ['SEO', 'Kvartalsavtal'] },
  { id: 'ga-2', name: 'Google Ads Kampanj', company: 'Nordic Food AB', value: 85000, status: 'sent', recipientEmail: 'erik@nordicfood.se', recipientName: 'Erik Svensson', createdAt: '2026-03-28', expiresAt: '2026-04-28', tags: ['Google ADS', 'Ny kund'] },
  { id: 'ga-3', name: 'Meta + SEO Bundle', company: 'FashionBrand Stockholm', value: 120000, status: 'viewed', recipientEmail: 'lisa@fashionbrand.se', recipientName: 'Lisa Berg', createdAt: '2026-03-30', expiresAt: '2026-04-30', tags: ['META', 'SEO', 'Bundle'] },
  { id: 'ga-4', name: 'Film/Foto Produktion', company: 'GreenEnergy AB', value: 65000, status: 'draft', recipientEmail: 'johan@greenenergy.se', recipientName: 'Johan Nilsson', createdAt: '2026-04-01', expiresAt: '2026-05-01', tags: ['Film/Foto'] },
  { id: 'ga-5', name: 'Webb & SEO Årsavtal', company: 'DataVision AB', value: 180000, status: 'signed', recipientEmail: 'maria@datavision.se', recipientName: 'Maria Lindberg', createdAt: '2026-02-10', expiresAt: '2026-03-10', signedAt: '2026-02-15', tags: ['WEBB', 'SEO', 'Årsavtal'] },
  { id: 'ga-6', name: 'Google Ads Optimering', company: 'HealthPlus AB', value: 35000, status: 'rejected', recipientEmail: 'peter@healthplus.se', recipientName: 'Peter Holm', createdAt: '2026-03-01', expiresAt: '2026-03-31', tags: ['Google ADS'] },
  { id: 'ga-7', name: 'Social Media Paket', company: 'BuildPro Nordic', value: 55000, status: 'sent', recipientEmail: 'sara@buildpro.se', recipientName: 'Sara Ekström', createdAt: '2026-04-02', expiresAt: '2026-05-02', tags: ['META', 'Content'] },
  { id: 'ga-8', name: 'Komplett Mediabyrå-paket', company: 'SportLife Sverige', value: 250000, status: 'viewed', recipientEmail: 'anders@sportlife.se', recipientName: 'Anders Jonsson', createdAt: '2026-04-01', expiresAt: '2026-05-15', tags: ['Google ADS', 'META', 'SEO', 'Film/Foto'] },
];

function loadDeals(): GetAcceptDeal[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  saveDeals(sampleDeals);
  return sampleDeals;
}

function saveDeals(deals: GetAcceptDeal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  } catch (e) {
    console.error('Failed to save deals:', e);
  }
}

function loadConfig(): GetAcceptConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { apiKey: '', entityId: '', connected: false };
}

function saveConfig(config: GetAcceptConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save GetAccept config:', e);
  }
}

export function useGetAccept() {
  const [deals, setDealsState] = useState<GetAcceptDeal[]>(loadDeals);
  const [config, setConfigState] = useState<GetAcceptConfig>(loadConfig);

  const setDeals = useCallback((updater: GetAcceptDeal[] | ((prev: GetAcceptDeal[]) => GetAcceptDeal[])) => {
    setDealsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveDeals(next);
      return next;
    });
  }, []);

  const connect = useCallback((apiKey: string, entityId: string) => {
    const newConfig = { apiKey, entityId, connected: true };
    setConfigState(newConfig);
    saveConfig(newConfig);
    // Load sample deals on connect
    setDeals(sampleDeals);
  }, [setDeals]);

  const disconnect = useCallback(() => {
    const newConfig = { apiKey: '', entityId: '', connected: false };
    setConfigState(newConfig);
    saveConfig(newConfig);
  }, []);

  const syncDeals = useCallback(() => {
    // Simulate sync - in real app this would call GetAccept API
    setDeals(sampleDeals);
  }, [setDeals]);

  const updateDealStatus = useCallback((id: string, status: GetAcceptDeal['status']) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, status, ...(status === 'signed' ? { signedAt: new Date().toISOString().split('T')[0] } : {}) } : d));
  }, [setDeals]);

  const deleteDeal = useCallback((id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id));
  }, [setDeals]);

  const addDeal = useCallback((deal: Omit<GetAcceptDeal, 'id'>) => {
    const newDeal: GetAcceptDeal = { ...deal, id: `ga-${Date.now()}` };
    setDeals(prev => [newDeal, ...prev]);
    return newDeal;
  }, [setDeals]);

  const getSignedDeals = useCallback(() => {
    return deals.filter(d => d.status === 'signed');
  }, [deals]);

  const getPendingDeals = useCallback(() => {
    return deals.filter(d => ['sent', 'viewed'].includes(d.status));
  }, [deals]);

  return { deals, config, connect, disconnect, syncDeals, updateDealStatus, deleteDeal, addDeal, getSignedDeals, getPendingDeals };
}
