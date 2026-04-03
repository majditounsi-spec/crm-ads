import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, ContactStatus } from '@/types/crm';
import { mockContacts } from '@/data/contactData';
import { toast } from 'sonner';

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

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contacts' as any)
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        // Fallback to local mock data if Supabase table doesn't exist or is empty
        const stored = localStorage.getItem('marketflow_contacts');
        if (stored) {
          setContacts(JSON.parse(stored));
        } else {
          setContacts(mockContacts);
          localStorage.setItem('marketflow_contacts', JSON.stringify(mockContacts));
        }
      } else {
        setContacts((data as unknown as DbContact[]).map(dbToContact));
      }
    } catch {
      // Network/connection error - use local data
      const stored = localStorage.getItem('marketflow_contacts');
      if (stored) {
        setContacts(JSON.parse(stored));
      } else {
        setContacts(mockContacts);
        localStorage.setItem('marketflow_contacts', JSON.stringify(mockContacts));
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
      // Fallback: save locally
      const newContact: Contact = { ...contact, id: `local-${Date.now()}` };
      setContacts((prev) => {
        const next = [...prev, newContact];
        localStorage.setItem('marketflow_contacts', JSON.stringify(next));
        return next;
      });
      return newContact;
    }
    const newContact = dbToContact(data as unknown as DbContact);
    setContacts((prev) => {
      const next = [...prev, newContact];
      localStorage.setItem('marketflow_contacts', JSON.stringify(next));
      return next;
    });
    return newContact;
  };

  const updateContact = async (contact: Contact) => {
    const { error } = await supabase
      .from('contacts' as any)
      .update(contactToDb(contact) as any)
      .eq('id', contact.id);

    if (error) {
      console.error(error);
      // Still save locally
    }
    setContacts((prev) => {
      const next = prev.map((c) => (c.id === contact.id ? contact : c));
      localStorage.setItem('marketflow_contacts', JSON.stringify(next));
      return next;
    });
    return true;
  };

  const updateField = async (id: string, field: keyof Contact, value: any) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;
    const updated = { ...contact, [field]: value };
    setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));

    const dbFieldMap: Record<string, string> = {
      contactPerson: 'contact_person',
      startDate: 'start_date',
      endDate: 'end_date',
      hasReport: 'has_report',
      emails: 'emails',
      googleAdsCustomerId: 'google_ads_customer_id',
    };
    // Convert emails array to comma-separated string for DB
    if (field === 'emails' && Array.isArray(value)) {
      value = (value as string[]).join(', ');
    }
    const dbField = dbFieldMap[field] || field;

    const { error } = await supabase
      .from('contacts' as any)
      .update({ [dbField]: value } as any)
      .eq('id', id);

    if (error) {
      console.error(error);
    }
    // Persist locally regardless
    const stored = contacts.map(c => c.id === id ? { ...c, [field]: value } : c);
    localStorage.setItem('marketflow_contacts', JSON.stringify(stored));
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase
      .from('contacts' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      // Still delete locally
    }
    setContacts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem('marketflow_contacts', JSON.stringify(next));
      return next;
    });
    toast.success('Kund borttagen');
    return true;
  };

  return { contacts, loading, addContact, updateContact, updateField, deleteContact, refetch: fetchContacts };
}
