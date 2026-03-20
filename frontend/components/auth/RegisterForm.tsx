'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Nome deve essere almeno 2 caratteri'),
    lastName: z.string().min(2, 'Cognome deve essere almeno 2 caratteri'),
    email: z.string().email('Email non valida'),
    password: z
      .string()
      .min(8, 'Password deve essere almeno 8 caratteri')
      .regex(/[a-z]/, 'Password deve contenere almeno una lettera minuscola')
      .regex(/[A-Z]/, 'Password deve contenere almeno una lettera maiuscola')
      .regex(/\d/, 'Password deve contenere almeno un numero')
      .regex(/[^a-zA-Z0-9]/, 'Password deve contenere almeno un carattere speciale'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Devi accettare i termini e condizioni',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non corrispondono',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function calculatePasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength += 30;
  if (password.length >= 12) strength += 30;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 30;
  if (/\d/.test(password)) strength += 30;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
  return Math.min(strength, 100);
}

function getPasswordStrengthLabel(strength: number): string {
  if (strength < 60) return 'Debole';
  if (strength < 90) return 'Medio';
  return 'Forte';
}

function getPasswordStrengthColor(strength: number): string {
  if (strength < 40) return 'bg-destructive';
  if (strength < 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  // Update password strength
  useState(() => {
    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/public/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Errore durante la registrazione');
        setIsLoading(false);
        return;
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Registration successful but login failed
        router.push('/login?message=Registrazione completata, effettua il login');
        return;
      }

      // Both registration and login successful
      router.push('/');
      router.refresh();
    } catch (err) {
      logger.error('Registration error:', err);
      setError('Si è verificato un errore. Riprova più tardi.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* First Name & Last Name */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nome</Label>
          <Input
            id="firstName"
            placeholder="Mario"
            {...register('firstName')}
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Cognome</Label>
          <Input
            id="lastName"
            placeholder="Rossi"
            {...register('lastName')}
            disabled={isLoading}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="nome@esempio.com"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            disabled={isLoading}
            onChange={(e) => {
              register('password').onChange(e);
              setPasswordStrength(calculatePasswordStrength(e.target.value));
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Sicurezza password:</span>
              <span className="text-xs font-medium">{getPasswordStrengthLabel(passwordStrength)}</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className={cn('h-full transition-all', getPasswordStrengthColor(passwordStrength))}
                style={{ width: `${passwordStrength}%` }}
              />
            </div>
            <div className="space-y-1">
              <PasswordRequirement met={password.length >= 8} label="Almeno 8 caratteri" />
              <PasswordRequirement met={/[a-z]/.test(password) && /[A-Z]/.test(password)} label="Lettere maiuscole e minuscole" />
              <PasswordRequirement met={/\d/.test(password)} label="Almeno un numero" />
              <PasswordRequirement met={/[^a-zA-Z0-9]/.test(password)} label="Almeno un carattere speciale" />
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Conferma Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('confirmPassword')}
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Terms & Conditions */}
      <div className="flex items-start space-x-2">
        <Controller
          name="acceptTerms"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <Checkbox
              id="acceptTerms"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isLoading}
            />
          )}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="acceptTerms"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Accetto i{' '}
            <Link href="/terms" className="font-medium text-primary hover:underline">
              Termini e Condizioni
            </Link>{' '}
            e la{' '}
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>
          </Label>
          {errors.acceptTerms && (
            <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
        onClick={() => setError(null)}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registrazione in corso...
          </>
        ) : (
          'Registrati'
        )}
      </Button>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground">
        Hai già un account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Accedi
        </Link>
      </p>
    </form>
  );
}

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="h-3 w-3 text-muted-foreground" />
      )}
      <span className={met ? 'text-green-500' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}
