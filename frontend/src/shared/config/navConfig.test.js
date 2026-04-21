import { NAV_CONFIG } from './navConfig.js';
import { ROLES, ROUTES } from '@/shared/utils/constants';

describe('NAV_CONFIG', () => {
  it('contains entries for all supported roles', () => {
    expect(NAV_CONFIG[ROLES.USER]).toBeTruthy();
    expect(NAV_CONFIG[ROLES.ADMIN]).toBeTruthy();
    expect(NAV_CONFIG[ROLES.COACH]).toBeTruthy();
    expect(NAV_CONFIG[ROLES.DIETITIAN]).toBeTruthy();
  });

  it('has expected key routes configured', () => {
    const userPaths = NAV_CONFIG[ROLES.USER].map((item) => item.path);
    const adminPaths = NAV_CONFIG[ROLES.ADMIN].map((item) => item.path);

    expect(userPaths).toContain(ROUTES.USER_DASHBOARD);
    expect(userPaths).toContain(ROUTES.USER_WORKOUTS);
    expect(adminPaths).toContain(ROUTES.ADMIN_DASHBOARD);
    expect(adminPaths).toContain(ROUTES.ADMIN_USERS);
  });

  it('ensures each nav item has label, path, and icon', () => {
    Object.values(NAV_CONFIG).forEach((items) => {
      items.forEach((item) => {
        expect(item.label).toBeTruthy();
        expect(item.path).toBeTruthy();
        expect(item.icon).toBeTruthy();
      });
    });
  });
});
