import {
  createPromotionSchema,
  promotionQuerySchema,
  publicPromotionQuerySchema,
  updatePromotionSchema,
} from '../../src/modules/promotions/promotions.validation.js';

describe('promotions.validation schemas', () => {
  it('accepts valid create payload', () => {
    const result = createPromotionSchema.safeParse({
      title: 'Summer Promo',
      placement: 'Dashboard Hero',
      target: 'All Users',
      budget: 1500,
      startDate: '2026-03-21',
      endDate: '2026-04-21',
      link: 'https://example.com/promo',
      description: 'Limited-time offer',
    });

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('DRAFT');
  });

  it('rejects create payload when endDate is before startDate', () => {
    const result = createPromotionSchema.safeParse({
      title: 'Invalid Date Promo',
      placement: 'Promotions Page',
      target: 'Members',
      budget: 1000,
      startDate: '2026-05-10',
      endDate: '2026-05-01',
    });

    expect(result.success).toBe(false);
  });

  it('validates update payload url and date ordering', () => {
    const badLink = updatePromotionSchema.safeParse({ link: 'not-a-url' });
    const badDates = updatePromotionSchema.safeParse({
      startDate: '2026-06-10',
      endDate: '2026-06-01',
    });

    expect(badLink.success).toBe(false);
    expect(badDates.success).toBe(false);
  });

  it('applies query defaults', () => {
    const adminQuery = promotionQuerySchema.safeParse({});
    const publicQuery = publicPromotionQuerySchema.safeParse({});

    expect(adminQuery.success).toBe(true);
    expect(publicQuery.success).toBe(true);
    expect(adminQuery.data.limit).toBe(100);
    expect(publicQuery.data.limit).toBe(3);
  });
});
