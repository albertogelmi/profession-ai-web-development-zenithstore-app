'use client';

import { useState } from 'react';
import { useQuestions } from '@/hooks/useQuestions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/products/Pagination';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { User, MessageCircle, CheckCircle2 } from 'lucide-react';

interface QuestionsListProps {
  productCode: string;
}

function QuestionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

export function QuestionsList({ productCode }: QuestionsListProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuestions(productCode, page, 10);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
        <p className="text-destructive">
          Si è verificato un errore durante il caricamento delle domande.
        </p>
      </div>
    );
  }

  const questions = data?.questions || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">
          {data?.total ? `${data.total} Domande e Risposte` : 'Domande e Risposte'}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Hai dubbi su questo prodotto? Chiedi alla community!
        </p>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <QuestionSkeleton key={i} />
          ))}
        </div>
      ) : questions.length > 0 ? (
        <>
          <div className="space-y-4">
            {questions.map((question) => (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {question.customerName || `Cliente #${question.customerId}`}
                        </p>
                        {question.answerText && (
                          <Badge variant="outline" className="gap-1 border-success text-success">
                            <CheckCircle2 className="h-3 w-3" />
                            Risposta
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(question.createdAt), {
                          addSuffix: true,
                          locale: it,
                        })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Question */}
                  <div>
                    <p className="font-medium">Domanda:</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {question.questionText}
                    </p>
                  </div>

                  {/* Answer */}
                  {question.answerText ? (
                    <div className="rounded-md bg-muted/50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">
                          {question.answeredByName || 'Staff ZenithStore'}
                        </p>
                        {question.answeredAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(question.answeredAt), {
                              addSuffix: true,
                              locale: it,
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground">
                        {question.answerText}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        In attesa di risposta...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            Nessuna domanda ancora per questo prodotto.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sii il primo a fare una domanda!
          </p>
        </div>
      )}
    </div>
  );
}
