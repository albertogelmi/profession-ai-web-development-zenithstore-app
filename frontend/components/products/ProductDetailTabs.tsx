'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { QuestionsList } from '@/components/questions/QuestionsList';
import { QuestionForm } from '@/components/questions/QuestionForm';
import { Separator } from '@/components/ui/separator';
import { useReviews } from '@/hooks/useReviews';
import { useQuestions } from '@/hooks/useQuestions';

interface ProductDetailTabsProps {
  productCode: string;
  product: {
    name: string;
    description?: string;
  };
}

export function ProductDetailTabs({ productCode, product }: ProductDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('description');
  
  // Fetch counts for tabs
  const { data: reviewsData } = useReviews(productCode, 1, 1);
  const { data: questionsData } = useQuestions(productCode, 1, 1);

  const reviewCount = reviewsData?.total || 0;
  const questionCount = questionsData?.total || 0;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="description">Descrizione</TabsTrigger>
        <TabsTrigger value="reviews">
          Recensioni {reviewCount > 0 && `(${reviewCount})`}
        </TabsTrigger>
        <TabsTrigger value="questions">
          Domande {questionCount > 0 && `(${questionCount})`}
        </TabsTrigger>
      </TabsList>

      {/* Description Tab */}
      <TabsContent value="description" className="mt-6">
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-2xl font-bold">Informazioni sul Prodotto</h2>
            {product.description ? (
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Nessuna descrizione disponibile per questo prodotto.
              </p>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Reviews Tab */}
      <TabsContent value="reviews" className="mt-6">
        <div className="space-y-8">
          {/* Review Form */}
          <ReviewForm productCode={productCode} />
          
          <Separator />
          
          {/* Reviews List */}
          <ReviewsList productCode={productCode} />
        </div>
      </TabsContent>

      {/* Questions Tab */}
      <TabsContent value="questions" className="mt-6">
        <div className="space-y-8">
          {/* Question Form */}
          <QuestionForm productCode={productCode} />
          
          <Separator />
          
          {/* Questions List */}
          <QuestionsList productCode={productCode} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
