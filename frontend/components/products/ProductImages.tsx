'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductImagesProps {
  images: string[];
  productName: string;
}

export function ProductImages({ images, productName }: ProductImagesProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Use placeholder if no images
  const displayImages = images.length > 0 ? images : ['/placeholder-product.svg'];

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        <div className="relative h-full w-full">
          {displayImages[selectedIndex].startsWith('http') ? (
            <img
              src={displayImages[selectedIndex]}
              alt={`${productName} - Image ${selectedIndex + 1}`}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground">Nessuna immagine disponibile</span>
            </div>
          )}
        </div>

        {/* Navigation Arrows - Only show if multiple images */}
        {displayImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
              onClick={handlePrevious}
              aria-label="Immagine precedente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
              onClick={handleNext}
              aria-label="Immagine successiva"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-md border-2 transition-all hover:border-primary',
                selectedIndex === index ? 'border-primary ring-2 ring-primary' : 'border-transparent'
              )}
              aria-label={`Visualizza immagine ${index + 1}`}
            >
              {image.startsWith('http') ? (
                <img
                  src={image}
                  alt={`${productName} - Thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                  No img
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
