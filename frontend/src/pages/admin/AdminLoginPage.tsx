import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { loginFormSchema, type LoginFormValues } from '../../schemas/auth.schema';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const AdminLoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Identifiants invalides ou compte inactif.';
      setAuthError(message);
    }
  };

  const handlePreloadAdmin = () => {
    setValue('email', 'admin@aromarose.ma', { shouldValidate: true });
    setValue('password', 'SuperAdmin2026!Secure', { shouldValidate: true });
  };

  const handlePreloadStaff = () => {
    setValue('email', 'staff@aromarose.ma', { shouldValidate: true });
    setValue('password', 'StaffOperator2026!', { shouldValidate: true });
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            src="/images/logo.webp"
            alt="Aroma Rose"
            className="h-16 w-auto object-contain mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          />
          <span className="text-[0.68rem] uppercase tracking-editorial text-charcoal/60 font-sans font-semibold block">
            Portail Opérateurs & Administration
          </span>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-sand-border rounded p-8 shadow-card">
          <div className="mb-6">
            <h2 className="text-xl font-serif text-charcoal">Connexion Sécurisée</h2>
            <p className="text-xs text-charcoal/60 font-sans mt-1">
              Réservé au personnel habilité de la Maison Aroma Rose.
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-3.5 bg-rose-soft/80 border border-rose/40 rounded flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-burgundy shrink-0 mt-0.5" />
              <p className="text-xs text-burgundy font-sans leading-relaxed">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label="Adresse E-mail"
              type="email"
              placeholder="operateur@aromarose.ma"
              autoComplete="email"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••••••"
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="pt-2">
              <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                Se Connecter
              </Button>
            </div>
          </form>

          {/* Quick-fill helper in development */}
          <div className="mt-8 pt-6 border-t border-sand-border/70 text-center">
            <span className="text-[0.65rem] uppercase tracking-editorial text-charcoal/40 font-semibold block mb-3">
              Comptes Démonstration / Test
            </span>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handlePreloadAdmin}
                className="text-[0.7rem] uppercase tracking-editorial px-2.5 py-1 rounded bg-canvas border border-sand-border hover:border-burgundy text-charcoal/80 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-burgundy" /> Admin
              </button>
              <button
                type="button"
                onClick={handlePreloadStaff}
                className="text-[0.7rem] uppercase tracking-editorial px-2.5 py-1 rounded bg-canvas border border-sand-border hover:border-burgundy text-charcoal/80 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-rose" /> Staff
              </button>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs font-sans text-charcoal/60 hover:text-burgundy transition-colors uppercase tracking-editorial"
          >
            ← Retourner à la boutique publique
          </a>
        </div>
      </div>
    </div>
  );
};

