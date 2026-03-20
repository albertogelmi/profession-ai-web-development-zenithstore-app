'use client';

import { useState } from 'react';
import { useReviews, Review } from '@/hooks/useReviews';
import { RatingStars } from './RatingStars';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/products/Pagination';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { User } from 'lucide-react';

interface ReviewsListProps {
  productCode: string;
}

function ReviewSkeleton() {
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
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

export function ReviewsList({ productCode }: ReviewsListProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'recent' | 'rating_high' | 'rating_low'>('recent');
  
  const { data, isLoading, error } = useReviews(productCode, page, 10, sortBy);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
        <p className="text-destructive">
          Si è verificato un errore durante il caricamento delle recensioni.
        </p>
      </div>
    );
  }

  const reviews = data?.reviews || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header with Sort */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {data?.total ? `${data.total} Recensioni` : 'Recensioni'}
          </h3>
          {data?.averageRating && (
            <div className="mt-1 flex items-center gap-2">
              <RatingStars rating={data.averageRating} size="sm" />
              <span className="text-sm text-muted-foreground">
                Media: {data.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Più Recenti</SelectItem>
            <SelectItem value="rating_high">Voto: Alto → Basso</SelectItem>
            <SelectItem value="rating_low">Voto: Basso → Alto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <ReviewSkeleton key={i} />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {review.customerName || `Cliente #${review.customerId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(review.createdAt), {
                            addSuffix: true,
                            locale: it,
                          })}
                        </p>
                      </div>
                    </div>
                    <RatingStars rating={review.rating} size="sm" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {review.title && (
                    <h4 className="font-semibold">{review.title}</h4>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {review.comment}
                  </p>
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
          <p className="text-muted-foreground">
            Nessuna recensione disponibile per questo prodotto.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sii il primo a lasciare una recensione!
          </p>
        </div>
      )}
    </div>
  );
}
