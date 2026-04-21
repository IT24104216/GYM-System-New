const { mockAxiosClient } = vi.hoisted(() => ({
  mockAxiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/shared/api/axiosClient', () => ({
  default: mockAxiosClient,
}));

import {
  changeAdminPassword,
  createLocker,
  createPromotion,
  deleteLocker,
  deletePromotion,
  deleteUser,
  getAdminSettings,
  getAllUsers,
  getLockerBookings,
  getLockers,
  getPlatformStats,
  getPromotions,
  updateAdminSettings,
  updateLockerBookingStatus,
  updatePromotion,
  updateUser,
} from './admin.api.js';

describe('admin.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls users and stats endpoints', () => {
    getAllUsers({ page: 1, limit: 10 });
    getPlatformStats();
    updateUser('u1', { role: 'coach' });
    deleteUser('u1');

    expect(mockAxiosClient.get).toHaveBeenCalledWith('/admin/users', { params: { page: 1, limit: 10 } });
    expect(mockAxiosClient.get).toHaveBeenCalledWith('/admin/stats');
    expect(mockAxiosClient.put).toHaveBeenCalledWith('/admin/users/u1', { role: 'coach' });
    expect(mockAxiosClient.delete).toHaveBeenCalledWith('/admin/users/u1');
  });

  it('calls promotions endpoints', () => {
    getPromotions({ status: 'ACTIVE' });
    createPromotion({ title: 'Promo' });
    updatePromotion('p1', { title: 'Updated Promo' });
    deletePromotion('p1');

    expect(mockAxiosClient.get).toHaveBeenCalledWith('/promotions/list', { params: { status: 'ACTIVE' } });
    expect(mockAxiosClient.post).toHaveBeenCalledWith('/promotions', { title: 'Promo' });
    expect(mockAxiosClient.put).toHaveBeenCalledWith('/promotions/p1', { title: 'Updated Promo' });
    expect(mockAxiosClient.delete).toHaveBeenCalledWith('/promotions/p1');
  });

  it('calls admin settings endpoints', () => {
    getAdminSettings('admin-1');
    updateAdminSettings({ fullName: 'Admin' });
    changeAdminPassword({ currentPassword: 'old', newPassword: 'new' });

    expect(mockAxiosClient.get).toHaveBeenCalledWith('/admin/settings', { params: { adminId: 'admin-1' } });
    expect(mockAxiosClient.put).toHaveBeenCalledWith('/admin/settings', { fullName: 'Admin' });
    expect(mockAxiosClient.put).toHaveBeenCalledWith('/admin/settings/password', { currentPassword: 'old', newPassword: 'new' });
  });

  it('calls lockers and booking endpoints', () => {
    getLockers({ branch: 'Colombo' });
    createLocker({ code: 'L-101' });
    deleteLocker('l1');
    getLockerBookings({ status: 'pending' });
    updateLockerBookingStatus('b1', { status: 'approved' });

    expect(mockAxiosClient.get).toHaveBeenCalledWith('/lockers/list', { params: { branch: 'Colombo' } });
    expect(mockAxiosClient.post).toHaveBeenCalledWith('/lockers/list', { code: 'L-101' });
    expect(mockAxiosClient.delete).toHaveBeenCalledWith('/lockers/list/l1');
    expect(mockAxiosClient.get).toHaveBeenCalledWith('/lockers/bookings', { params: { status: 'pending' } });
    expect(mockAxiosClient.patch).toHaveBeenCalledWith('/lockers/bookings/b1/status', { status: 'approved' });
  });
});

