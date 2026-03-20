import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductImages } from '@/components/products/ProductImages';
import { ProductInfo } from '@/components/products/ProductInfo';
import { ProductActions } from '@/components/products/ProductActions';
import { ProductDetailTabs } from '@/components/products/ProductDetailTabs';
import { getProductStock } from '@/lib/product';
import { logger } from '@/lib/logger';

interface ProductPageProps {
  params: Promise<{
    productCode: string;
  }>;
}

// Fetch product data on server
async function getProduct(productCode: string) {
  try {
    const baseUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/products/${productCode}`, {
      cache: 'no-store', // Always fetch fresh data for product details
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    
    const product = data.data || data.product || data;
    
    if (!product || !product.name) {
      logger.error('Invalid product data structure:', data);
      return null;
    }
    
    return product;
  } catch (error) {
    logger.error('Failed to fetch product:', error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productCode } = await params;
  const product = await getProduct(productCode);

  if (!product) {
    return {
      title: 'Prodotto Non Trovato | ZenithStore',
    };
  }

  return {
    title: `${product.name} | ZenithStore`,
    description: product.description || `Acquista ${product.name} su ZenithStore`,
    keywords: [product.name, product.categoryName, 'e-commerce', 'shopping online'].filter(Boolean),
    openGraph: {
      title: product.name,
      description: product.description,
      type: 'website',
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productCode } = await params;
  const product = await getProduct(productCode);

  if (!product) {
    notFound();
  }

  // Mock images array (in production, this would come from product.images or similar)
  const images = product.imageUrl ? [product.imageUrl] : [];

  const actualStock = getProductStock(product);
  const specifications = {
    'Codice Prodotto': product.productCode || product.code || productCode,
    'Categoria': product.categoryName || 'N/A',
    'Disponibilit\u00e0': actualStock > 0
      ? `${actualStock} unit\u00e0` 
      : 'Non disponibile',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left Column - Images */}
        <div>
          <ProductImages images={images} productName={product.name} />
        </div>

        {/* Right Column - Info and Actions */}
        <div className="space-y-8">
          <ProductInfo product={product} specifications={specifications} />
          <ProductActions product={product} />
        </div>
      </div>

      {/* Product Details Tabs - Reviews, Questions, Description */}
      <div className="mt-12">
        <ProductDetailTabs productCode={productCode} product={product} />
      </div>
    </div>
  );
}
