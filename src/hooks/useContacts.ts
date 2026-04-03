import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, ContactStatus } from '@/types/crm';
import { mockContacts } from '@/data/contactData';
import { toast } from 'sonner';

const STORAGE_KEY = 'marketflow_contacts';

interface DbContact {
  id: string;
  name: string;
  website: string;
  platform: string;
  budget: number;
  rating: number;
  contact_person: string;
  seller: string;
  service: string;
  status: string;
  start_date: string;
  end_date: string;
  comment: string;
  has_report: boolean;
  created_at: string;
  phone: string;
  emails: string;
  google_ads_customer_id: string;
}

function parseEmails(raw: string): string[] {
  if (!raw) return [];
  return raw.split(',').map(e => e.trim()).filter(Boolean);
}

function dbToContact(row: DbContact): Contact {
  return {
    id: row.id,
    name: row.name,
    website: row.website,
    platform: row.platform,
    budget: row.budget,
    rating: row.rating,
    contactPerson: row.contact_person,
    seller: row.seller,
    service: row.service,
    status: row.status as ContactStatus,
    startDate: row.start_date,
    endDate: row.end_date,
    comment: row.comment,
    hasReport: row.has_report,
    phone: row.phone,
    emails: parseEmails(row.emails),
    googleAdsCustomerId: row.google_ads_customer_id,
  };
}

function contactToDb(c: Omit<Contact, 'id'>) {
  return {
    name: c.name,
    website: c.website,
    platform: c.platform,
    budget: c.budget,
    rating: c.rating,
    contact_person: c.contactPerson,
    seller: c.seller,
    service: c.service,
    status: c.status,
    start_date: c.startDate,
    end_date: c.endDate,
    comment: c.comment,
    has_report: c.hasReport,
    phone: c.phone,
    emails: c.emails.join(', '),
    google_ads_customer_id: c.googleAdsCustomerId,
  };
}

function saveLocal(contacts: Contact[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch {}
}

function loadLocal(): Contact[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contacts' as any)
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = (data as unknown as DbContact[]).map(dbToContact);
        setContacts(mapped);
        saveLocal(mapped);
      } else {
        // Supabase empty or errored - use localStorage fallback
        const local = loadLocal();
        if (local && local.length > 0) {
          setContacts(local);
        } else {
          setContacts(mockContacts);
          saveLocal(mockContacts);
        }
      }
    } catch {
      const local = loadLocal();
      if (local && local.length > 0) {
        setContacts(local);
      } else {
        setContacts(mockContacts);
        saveLocal(mockContacts);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = async (contact: Omit<Contact, 'id'>) => {
    const { data, error } = await supabase
      .from('contacts' as any)
      .insert(contactToDb(contact) as any)
      .select()
      .single();

    if (error) {
      const newContact: Contact = { ...contact, id: `local-${Date.now()}` };
      setContacts(prev => {
        const next = [...prev, newContact];
        saveLocal(next);
        return next;
      });
      toast.warning('Sparad lokalt (ingen Supabase-anslutning)');
      return newContact;
    }
    const newContact = dbToContact(data as unknown as DbContact);
    setContacts(prev => {
      const next = [...prev, newContact];
      saveLocal(next);
      return next;
    });
    toast.success('Kund tillagd');
    return newContact;
  };

  const updateContact = async (contact: Contact) => {
    // Update state and localStorage immediately
    setContacts(prev => {
      const next = prev.map(c => c.id === contact.id ? contact : c);
      saveLocal(next);
      return next;
    });

    // Then sync to Supabase
    const { error } = await supabase
      .from('contacts' as any)
      .update(contactToDb(contact) as any)
      .eq('id', contact.id);

    if (error) {
      console.error('Supabase update failed:', error.message);
    }
    return true;
  };

  const updateField = async (id: string, field: keyof Contact, value: any) => {
    // Update state and localStorage atomically using the setter's prev
    setContacts(prev => {
      const next = prev.map(c => c.id === id ? { ...c, [field]: value } : c);
      saveLocal(next);
      return next;
    });

    // Build the DB field name and value
    const dbFieldMap: Record<string, string> = {
      contactPerson: 'contact_person',
      startDate: 'start_date',
      endDate: 'end_date',
      hasReport: 'has_report',
      emails: 'emails',
      googleAdsCustomerId: 'google_ads_customer_id',
    };
    let dbValue = value;
    if (field === 'emails' && Array.isArray(value)) {
      dbValue = (value as string[]).join(', ');
    }
    const dbField = dbFieldMap[field] || field;

    const { error } = await supabase
      .from('contacts' as any)
      .update({ [dbField]: dbValue } as any)
      .eq('id', id);

    if (error) {
      console.error('Supabase field update failed:', error.message);
    }
  };

  const deleteContact = async (id: string) => {
    // Update state and localStorage first
    setContacts(prev => {
      const next = prev.filter(c => c.id !== id);
      saveLocal(next);
      return next;
    });

    // Then sync to Supabase
    const { error } = await supabase
      .from('contacts' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete failed:', error.message);
    }
    toast.success('Kund borttagen');
    return true;
  };

  return { contacts, loading, addContact, updateContact, updateField, deleteContact, refetch: fetchContacts };
}
