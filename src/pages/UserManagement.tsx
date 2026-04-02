import { useState } from 'react';
import {
  Users, Shield, Mail, Plus, Trash2, UserCheck, UserX, Crown,
  Eye, Edit, Search, ChevronDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

type Role = 'admin' | 'manager' | 'member' | 'viewer';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: Role;
  active: boolean;
  lastLogin?: string;
  permissions: {
    contacts: boolean;
    projects: boolean;
    billing: boolean;
    settings: boolean;
    googleAds: boolean;
    reports: boolean;
  };
}

const roleConfig: Record<Role, { label: string; className: string; icon: any }> = {
  admin: { label: 'Admin', className: 'bg-red-500/10 text-red-600 border-red-500/20', icon: Crown },
  manager: { label: 'Chef', className: 'bg-violet-500/10 text-violet-600 border-violet-500/20', icon: Shield },
  member: { label: 'Medarbetare', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: UserCheck },
  viewer: { label: 'Läsare', className: 'bg-slate-500/10 text-slate-600 border-slate-500/20', icon: Eye },
};

const STORAGE_KEY = 'marketflow_team_members';

function loadMembers(): TeamMember[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveMembers(members: TeamMember[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

export default function UserManagement() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>(() => {
    const stored = loadMembers();
    // Ensure current user is always in the list as admin
    if (user && !stored.find(m => m.email === user.email)) {
      const withUser: TeamMember[] = [{
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: 'admin',
        active: true,
        lastLogin: new Date().toISOString(),
        permissions: { contacts: true, projects: true, billing: true, settings: true, googleAds: true, reports: true },
      }, ...stored];
      saveMembers(withUser);
      return withUser;
    }
    return stored;
  });

  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('member');

  const updateMembers = (updated: TeamMember[]) => {
    setMembers(updated);
    saveMembers(updated);
  };

  const handleInvite = () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Ange en giltig e-postadress');
      return;
    }
    if (members.find(m => m.email === newEmail)) {
      toast.error('Denna användare finns redan');
      return;
    }

    const member: TeamMember = {
      id: String(Date.now()),
      email: newEmail,
      name: newName || newEmail.split('@')[0],
      avatarUrl: '',
      role: newRole,
      active: true,
      permissions: {
        contacts: true,
        projects: true,
        billing: newRole === 'admin' || newRole === 'manager',
        settings: newRole === 'admin',
        googleAds: newRole !== 'viewer',
        reports: true,
      },
    };

    updateMembers([...members, member]);
    setInviteOpen(false);
    setNewEmail('');
    setNewName('');
    setNewRole('member');
    toast.success(`Inbjudan skickad till ${member.name}`);
  };

  const removeMember = (id: string) => {
    updateMembers(members.filter(m => m.id !== id));
    toast.success('Användare borttagen');
  };

  const toggleActive = (id: string) => {
    updateMembers(members.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  const updateRole = (id: string, role: Role) => {
    updateMembers(members.map(m => m.id === id ? {
      ...m,
      role,
      permissions: {
        contacts: true,
        projects: true,
        billing: role === 'admin' || role === 'manager',
        settings: role === 'admin',
        googleAds: role !== 'viewer',
        reports: true,
      },
    } : m));
    toast.success('Roll uppdaterad');
  };

  const updatePermission = (id: string, perm: keyof TeamMember['permissions'], value: boolean) => {
    updateMembers(members.map(m => m.id === id ? {
      ...m,
      permissions: { ...m.permissions, [perm]: value },
    } : m));
  };

  const filtered = members.filter(m => {
    if (!search) return true;
    const s = search.toLowerCase();
    return m.name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s);
  });

  const adminCount = members.filter(m => m.role === 'admin').length;
  const activeCount = members.filter(m => m.active).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Användare & Team</h1>
          <p className="text-muted-foreground">{activeCount} aktiva av {members.length} användare</p>
        </div>
        <Button className="rounded-xl gap-2" onClick={() => setInviteOpen(true)}>
          <Plus className="h-4 w-4" /> Bjud in användare
        </Button>
      </motion.div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(roleConfig).map(([key, cfg]) => {
          const count = members.filter(m => m.role === key).length;
          return (
            <motion.div key={key} variants={item}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{cfg.label}</p>
                      <p className="text-xl font-heading font-bold mt-1">{count}</p>
                    </div>
                    <div className={`p-2 rounded-xl ${cfg.className}`}>
                      <cfg.icon className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Search */}
      <motion.div variants={item} className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Sök användare..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
      </motion.div>

      {/* User list */}
      <div className="space-y-3">
        {filtered.map((member) => {
          const rc = roleConfig[member.role];
          const isCurrentUser = user?.email === member.email;
          return (
            <motion.div key={member.id} variants={item}>
              <Card className={`overflow-hidden transition-all hover:shadow-md ${!member.active ? 'opacity-50' : ''}`}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {member.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{member.name}</p>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5">Du</Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${rc.className}`}>
                          {rc.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>

                    {/* Role selector */}
                    <Select value={member.role} onValueChange={(v) => updateRole(member.id, v as Role)}
                      disabled={isCurrentUser}>
                      <SelectTrigger className="w-36 h-8 rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleConfig).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-1.5">
                              <cfg.icon className="h-3 w-3" /> {cfg.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Active toggle */}
                    <Switch checked={member.active} disabled={isCurrentUser}
                      onCheckedChange={() => toggleActive(member.id)} />

                    {/* Edit permissions */}
                    <Button variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => setEditMember(member)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>

                    {/* Delete */}
                    {!isCurrentUser && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ta bort {member.name}?</AlertDialogTitle>
                            <AlertDialogDescription>Användaren förlorar all åtkomst till systemet.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => removeMember(member.id)}>Ta bort</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {members.length === 0 && (
        <motion.div variants={item} className="text-center py-16">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-lg">Inga användare</h3>
          <p className="text-muted-foreground text-sm mt-1">Bjud in teammedlemmar för att komma igång.</p>
        </motion.div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Bjud in användare</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-postadress *</Label>
              <Input value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="namn@foretag.se" className="mt-1" type="email" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Namn</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Förnamn Efternamn" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roll</Label>
              <Select value={newRole} onValueChange={v => setNewRole(v as Role)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <cfg.icon className="h-3.5 w-3.5" /> {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role description */}
            <div className="border rounded-xl p-3 bg-muted/20">
              <p className="text-xs text-muted-foreground">
                {newRole === 'admin' && 'Full åtkomst till alla funktioner inkl. inställningar och fakturering.'}
                {newRole === 'manager' && 'Kan hantera kontakter, projekt och se rapporter. Ingen åtkomst till systeminställningar.'}
                {newRole === 'member' && 'Kan arbeta med kontakter och projekt. Begränsad åtkomst till fakturering.'}
                {newRole === 'viewer' && 'Kan bara se data, inte redigera. Perfekt för kunder eller externa parter.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Avbryt</Button>
            <Button onClick={handleInvite} className="gap-2">
              <Mail className="h-4 w-4" /> Skicka inbjudan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!editMember} onOpenChange={open => { if (!open) setEditMember(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Behörigheter: {editMember?.name}
            </DialogTitle>
          </DialogHeader>
          {editMember && (
            <div className="space-y-3 pt-2">
              {[
                { key: 'contacts' as const, label: 'Kontakter', desc: 'Se och redigera kundregister' },
                { key: 'projects' as const, label: 'Projekt', desc: 'Hantera projekt och uppgifter' },
                { key: 'billing' as const, label: 'Fakturering', desc: 'Se och skapa fakturor' },
                { key: 'settings' as const, label: 'Inställningar', desc: 'Ändra systeminställningar och white-label' },
                { key: 'googleAds' as const, label: 'Google Ads', desc: 'Se och synka Google Ads-data' },
                { key: 'reports' as const, label: 'Rapporter', desc: 'Generera och exportera rapporter' },
              ].map(perm => (
                <div key={perm.key} className="flex items-center justify-between p-3 border rounded-xl">
                  <div>
                    <p className="text-sm font-medium">{perm.label}</p>
                    <p className="text-xs text-muted-foreground">{perm.desc}</p>
                  </div>
                  <Switch
                    checked={editMember.permissions[perm.key]}
                    onCheckedChange={checked => {
                      const updated = { ...editMember, permissions: { ...editMember.permissions, [perm.key]: checked } };
                      setEditMember(updated);
                      updateMembers(members.map(m => m.id === editMember.id ? updated : m));
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setEditMember(null)}>Klar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
