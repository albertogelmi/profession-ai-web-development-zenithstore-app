'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password attuale richiesta'),
    newPassword: z.string().min(8, 'Password deve essere almeno 8 caratteri'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Le password non corrispondono',
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

function calculatePasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/\d/.test(password)) strength += 25;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 25;
  return strength;
}

function getPasswordStrengthLabel(strength: number): string {
  if (strength < 40) return 'Debole';
  if (strength < 70) return 'Medio';
  return 'Forte';
}

function getPasswordStrengthColor(strength: number): string {
  if (strength < 40) return 'bg-destructive';
  if (strength < 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const newPassword = watch('newPassword', '');
  const passwordStrength = calculatePasswordStrength(newPassword);

  const passwordRequirements = [
    {
      label: 'Almeno 8 caratteri',
      met: newPassword.length >= 8,
    },
    {
      label: 'Lettere maiuscole e minuscole',
      met: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    },
    {
      label: 'Almeno un numero',
      met: /\d/.test(newPassword),
    },
    {
      label: 'Almeno un carattere speciale',
      met: /[^a-zA-Z0-9]/.test(newPassword),
    },
  ];

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/backend/customers/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante cambio password');
      }

      // Success: logout and redirect to login
      await signOut({ redirect: false });
      router.push('/login?message=Password cambiata con successo. Effettua il login con la nuova password.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante cambio password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambia Password</CardTitle>
        <CardDescription>
          Aggiorna la tua password. Verrai disconnesso dopo il cambio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password Attuale</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                {...register('currentPassword')}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nuova Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                {...register('newPassword')}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sicurezza password:</span>
                  <span
                    className={cn(
                      'font-medium',
                      passwordStrength < 40 && 'text-destructive',
                      passwordStrength >= 40 &&
                        passwordStrength < 70 &&
                        'text-yellow-600',
                      passwordStrength >= 70 && 'text-green-600'
                    )}
                  >
                    {getPasswordStrengthLabel(passwordStrength)}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      getPasswordStrengthColor(passwordStrength)
                    )}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>

                <div className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {req.met ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span
                        className={cn(
                          req.met ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Conferma Nuova Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cambia Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
