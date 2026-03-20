'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RatingStars } from './RatingStars';
import { useCreateReview } from '@/hooks/useReviews';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Seleziona un voto da 1 a 5 stelle').max(5),
  title: z.string().min(5, 'Il titolo deve contenere almeno 5 caratteri').max(100, 'Il titolo non può superare 100 caratteri'),
  comment: z.string().min(20, 'La recensione deve contenere almeno 20 caratteri').max(1000, 'La recensione non può superare 1000 caratteri'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  productCode: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productCode, onSuccess }: ReviewFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const createReview = useCreateReview(productCode);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: '',
      comment: '',
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    if (!session) {
      router.push(`/login?redirect=/products/${productCode}`);
      return;
    }

    try {
      await createReview.mutateAsync(data);
      setShowSuccess(true);
      form.reset();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
      }, 3000);
    } catch (error: any) {
      logger.error('Failed to create review:', error);
      // Show error from API if available
      if (error.message) {
        form.setError('root', { message: error.message });
      } else {
        form.setError('root', { message: 'Si è verificato un errore. Riprova più tardi.' });
      }
    }
  };

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scrivi una Recensione</CardTitle>
          <CardDescription>
            Devi effettuare l&apos;accesso per lasciare una recensione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push(`/login?redirect=/products/${productCode}`)}>
            Accedi per Recensire
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showSuccess) {
    return (
      <Card className="border-success bg-success/5">
        <CardHeader>
          <CardTitle className="text-success">Recensione Pubblicata!</CardTitle>
          <CardDescription>
            Grazie per aver condiviso la tua opinione
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scrivi una Recensione</CardTitle>
        <CardDescription>
          Condividi la tua esperienza con questo prodotto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Rating Field */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valutazione *</FormLabel>
                  <FormControl>
                    <div>
                      <RatingStars
                        rating={field.value}
                        size="lg"
                        interactive
                        onChange={field.onChange}
                      />
                      {field.value > 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {field.value} {field.value === 1 ? 'stella' : 'stelle'}
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Riassumi la tua esperienza"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comment Field */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recensione *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrivi la tua esperienza con questo prodotto..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    {field.value.length}/1000 caratteri
                  </p>
                </FormItem>
              )}
            />

            {/* Error Message */}
            {form.formState.errors.root && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={createReview.isPending}
              className="w-full"
            >
              {createReview.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Pubblica Recensione
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
