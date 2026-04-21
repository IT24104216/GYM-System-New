import { formatTrend, getMonthRange, toUserDto } from '../../src/modules/admin/admin.utils.js';

describe('admin.utils', () => {
  it('maps user document to admin UI DTO', () => {
    const dto = toUserDto({
      _id: 'u1',
      branchUserId: 'CC0001',
      branch: 'Colombo Central',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'dietitian',
      status: 'active',
      createdAt: '2026-03-21T00:00:00.000Z',
      roleChangedAt: null,
    });

    expect(dto.id).toBe('u1');
    expect(dto.role).toBe('Dietician');
    expect(dto.status).toBe('Active');
    expect(dto.avatar).toBe('JD');
  });

  it('builds month ranges in chronological order', () => {
    const range = getMonthRange(3, new Date('2026-03-21T00:00:00.000Z'));
    expect(range).toHaveLength(3);
    expect(range[0].key).toBe('2026-01');
    expect(range[1].key).toBe('2026-02');
    expect(range[2].key).toBe('2026-03');
  });

  it('formats trend percentages', () => {
    expect(formatTrend(120, 100)).toBe('+20.0%');
    expect(formatTrend(80, 100)).toBe('-20.0%');
    expect(formatTrend(50, 0)).toBe('+0%');
  });
});
