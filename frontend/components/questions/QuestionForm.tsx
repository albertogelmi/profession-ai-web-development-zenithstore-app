'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateQuestion } from '@/hooks/useQuestions';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

const questionSchema = z.object({
  questionText: z.string()
    .min(10, 'La domanda deve contenere almeno 10 caratteri')
    .max(500, 'La domanda non può superare 500 caratteri'),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  productCode: string;
  onSuccess?: () => void;
}

export function QuestionForm({ productCode, onSuccess }: QuestionFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const createQuestion = useCreateQuestion(productCode);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: '',
    },
  });

  const onSubmit = async (data: QuestionFormData) => {
    if (!session) {
      router.push(`/login?redirect=/products/${productCode}`);
      return;
    }

    try {
      await createQuestion.mutateAsync(data);
      setShowSuccess(true);
      form.reset();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
      }, 3000);
    } catch (error: any) {
      logger.error('Failed to create question:', error);
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
          <CardTitle>Fai una Domanda</CardTitle>
          <CardDescription>
            Devi effettuare l&apos;accesso per fare una domanda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push(`/login?redirect=/products/${productCode}`)}>
            Accedi per Fare una Domanda
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showSuccess) {
    return (
      <Card className="border-success bg-success/5">
        <CardHeader>
          <CardTitle className="text-success">Domanda Inviata!</CardTitle>
          <CardDescription>
            Riceverai una notifica quando verrà pubblicata una risposta
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fai una Domanda</CardTitle>
        <CardDescription>
          Hai dubbi su questo prodotto? Chiedi e ricevi una risposta dalla community o dallo staff
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Question Field */}
            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>La tua Domanda *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ad esempio: Questo prodotto è compatibile con...?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    {field.value.length}/500 caratteri
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
              disabled={createQuestion.isPending}
              className="w-full"
            >
              {createQuestion.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Invia Domanda
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
