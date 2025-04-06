import { ProductMapper } from '../product.mapper';
import { ProductDto } from '@/domain/dtos';
import { Product } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('ProductMapper', () => {
  const mockProduct = {
    id: 'test-id',
    name: 'Test Product',
    slug: 'test-product',
    category: 'Test Category',
    images: ['test-image.jpg'],
    brand: 'Test Brand',
    description: 'Test Description',
    stock: 10,
    price: '10.00',
    rating: '4.5',
    numReviews: 100,
    isFeatured: false,
    banner: null,
    createdAt: new Date(),
  };

  describe('toDto', () => {
    it('should convert Product to CartitemDto', () => {
      const result = ProductMapper.toDto(mockProduct);

      expect(result).toEqual({
        id: mockProduct.id,
        name: mockProduct.name,
        slug: mockProduct.slug,
        category: mockProduct.category,
        images: mockProduct.images,
        brand: mockProduct.brand,
        description: mockProduct.description,
        stock: mockProduct.stock,
        price: Number(mockProduct.price),
        rating: Number(mockProduct.rating),
        numReviews: mockProduct.numReviews,
        isFeatured: mockProduct.isFeatured,
        banner: mockProduct.banner,
        createdAt: mockProduct.createdAt,
      });
    });
  });

  describe('toPrisma', () => {
    it('should convert CartitemDto to Prisma Product data', () => {
      const productDto: ProductDto = {
        id: 'test-id',
        name: 'Test Product',
        slug: 'test-product',
        category: 'Test Category',
        images: ['test-image.jpg'],
        brand: 'Test Brand',
        description: 'Test Description',
        stock: 10,
        price: 10.00,
        rating: 4.5,
        numReviews: 100,
        isFeatured: false,
        banner: null,
        createdAt: new Date(),
      };

      const result = ProductMapper.toPrisma(productDto);

      expect(result).toEqual({
        name: productDto.name,
        slug: productDto.slug,
        category: productDto.category,
        images: productDto.images,
        brand: productDto.brand,
        description: productDto.description,
        stock: productDto.stock,
        price: new Decimal(productDto.price),
        rating: new Decimal(productDto.rating),
        numReviews: productDto.numReviews,
        isFeatured: productDto.isFeatured,
        banner: productDto.banner,
      });
    });
  });
});
