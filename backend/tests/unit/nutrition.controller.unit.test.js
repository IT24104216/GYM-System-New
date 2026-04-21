import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../src/shared/errors/AppError.js';

const findMock = vi.fn();

vi.mock('../../src/modules/nutrition/nutrition.model.js', () => ({
  NutritionFood: {
    find: (...args) => findMock(...args),
  },
}));

import { searchNutritionFoods } from '../../src/modules/nutrition/nutrition.controller.js';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('nutrition.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes AppError to next when query is missing', async () => {
    const req = { query: {} };
    const res = {};
    const next = vi.fn();

    searchNutritionFoods(req, res, next);
    await flush();

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
    expect(next.mock.calls[0][0].message).toBe('Query is required');
  });

  it('returns mapped food rows with startsWith + fallback', async () => {
    findMock
      .mockImplementationOnce(() => ({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve([
              { _id: '1', name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, source: 'db' },
            ]),
          }),
        }),
      }))
      .mockImplementationOnce(() => ({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve([
              { _id: '2', name: 'Pineapple', calories: 50, protein: 0.5, carbs: 13, fat: 0.1, source: 'db' },
            ]),
          }),
        }),
      }));

    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const req = { query: { q: 'apple', limit: 2 } };
    const res = { status, json };
    const next = vi.fn();

    searchNutritionFoods(req, res, next);
    await flush();

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledTimes(1);
    expect(json.mock.calls[0][0].data).toHaveLength(2);
    expect(json.mock.calls[0][0].data[0]).toMatchObject({ id: '1', name: 'Apple' });
    expect(json.mock.calls[0][0].data[1]).toMatchObject({ id: '2', name: 'Pineapple' });
    expect(next).not.toHaveBeenCalled();
  });
});
