import { useAuth } from '@/hooks/useAuth';
import { useWhiteLabel } from '@/hooks/useWhiteLabel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { useState } from 'react';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { config } = useWhiteLabel();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch {
      setIsGoogleLoading(false);
      setError('Kunde inte logga in med Google');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'login') {
      const result = await signInWithEmail(email, password);
      if (result.error) {
        setError(result.error === 'Invalid login credentials' ? 'Fel e-post eller lösenord' : result.error);
      }
    } else {
      if (password.length < 6) {
        setError('Lösenordet måste vara minst 6 tecken');
        setIsLoading(false);
        return;
      }
      const result = await signUpWithEmail(email, password, name);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Konto skapat! Kolla din e-post för att verifiera kontot.');
        setMode('login');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Header gradient */}
          <div className="h-32 bg-gradient-to-br from-primary to-violet-600 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20 overflow-hidden">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-white font-heading font-bold text-2xl">
                  {config.companyName.charAt(0)}
                </span>
              )}
            </div>
            <h1 className="text-white font-heading font-bold text-lg mt-2 relative z-10">
              {config.companyName}
            </h1>
          </div>

          <CardContent className="pt-6 pb-8 px-8 space-y-5">
            <div className="text-center">
              <h2 className="font-heading font-semibold text-lg">
                {mode === 'login' ? 'Välkommen tillbaka' : 'Skapa konto'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === 'login' ? 'Logga in för att fortsätta' : 'Fyll i dina uppgifter'}
              </p>
            </div>

            {/* Google button */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              variant="outline"
              className="w-full h-11 rounded-xl gap-3 text-sm font-medium hover:bg-muted/50 transition-all hover:shadow-md"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              Fortsätt med Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">eller</span>
              </div>
            </div>

            {/* Email/password form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {mode === 'register' && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Namn"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="E-postadress"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 rounded-xl"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Lösenord"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="pl-10 h-11 rounded-xl"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center bg-destructive/10 rounded-lg py-2 px-3">{error}</p>
              )}
              {success && (
                <p className="text-sm text-emerald-600 text-center bg-emerald-50 rounded-lg py-2 px-3">{success}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl font-medium"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === 'login' ? (
                  'Logga in'
                ) : (
                  'Skapa konto'
                )}
              </Button>
            </form>

            {/* Toggle mode */}
            <p className="text-sm text-center text-muted-foreground">
              {mode === 'login' ? (
                <>Har du inget konto?{' '}
                  <button
                    onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                    className="text-primary font-medium hover:underline"
                  >
                    Skapa konto
                  </button>
                </>
              ) : (
                <>Har du redan ett konto?{' '}
                  <button
                    onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                    className="text-primary font-medium hover:underline"
                  >
                    Logga in
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {config.companyName} · {config.subtitle}
        </p>
      </motion.div>
    </div>
  );
}
