import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, ContactStatus } from '@/types/crm';
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
  };
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    const { data, error } = await supabase
      .from('contacts' as any)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Kunde inte hämta kontakter');
      console.error(error);
    } else {
      setContacts((data as unknown as DbContact[]).map(dbToContact));
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
      toast.error('Kunde inte lägga till kund');
      console.error(error);
      return null;
    }
    const newContact = dbToContact(data as unknown as DbContact);
    setContacts((prev) => [...prev, newContact]);
    return newContact;
  };

  const updateContact = async (contact: Contact) => {
    const { error } = await supabase
      .from('contacts' as any)
      .update(contactToDb(contact) as any)
      .eq('id', contact.id);

    if (error) {
      toast.error('Kunde inte uppdatera kund');
      console.error(error);
      return false;
    }
    setContacts((prev) => prev.map((c) => (c.id === contact.id ? contact : c)));
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
    };
    const dbField = dbFieldMap[field] || field;

    const { error } = await supabase
      .from('contacts' as any)
      .update({ [dbField]: value } as any)
      .eq('id', id);

    if (error) {
      console.error(error);
      setContacts((prev) => prev.map((c) => (c.id === id ? contact : c)));
    }
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase
      .from('contacts' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Kunde inte ta bort kund');
      console.error(error);
      return false;
    }
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast.success('Kund borttagen');
    return true;
  };

  return { contacts, loading, addContact, updateContact, updateField, deleteContact, refetch: fetchContacts };
}
