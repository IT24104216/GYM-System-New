# TEST EVIDENCE + COMMAND MAP

## What Each Test Type Means
- **Smoke tests**: quick checks of critical app paths (app starts, key protected routes, basic validation). Purpose: catch major breakages fast.
- **Unit tests**: test small isolated logic/functions/modules (validation, mappers, utils, services). Purpose: verify logic correctness at code-unit level.
- **Integration tests**: test connected behavior across layers (route -> middleware -> controller -> DB/test DB). Purpose: verify real API flow and security rules together.

## Coverage Summary
- Total files: **68**
- Total test cases/checks: **217**
- Backend Smoke: **3** files, **10** checks
- Backend Integration: **8** files, **39** tests
- Backend Unit: **21** files, **88** tests
- Frontend Tests: **36** files, **80** tests

## Backend
Run backend commands from: `c:\Users\madhu\gympro-client\backend`

### Backend Smoke Tests

#### `test/dietitian-slot.validation.smoke.js`  |  Test Cases: **4**
- Run: `cmd /c node test/dietitian-slot.validation.smoke.js`
- Save: `cmd /c node test/dietitian-slot.validation.smoke.js > evidence/test-dietitian-slot-validation-smoke-js-output.txt 2>&1`

#### `test/ownership-guards.smoke.js`  |  Test Cases: **4**
- Run: `cmd /c node test/ownership-guards.smoke.js`
- Save: `cmd /c node test/ownership-guards.smoke.js > evidence/test-ownership-guards-smoke-js-output.txt 2>&1`

#### `test/security-routes.smoke.js`  |  Test Cases: **2**
- Run: `cmd /c node test/security-routes.smoke.js`
- Save: `cmd /c node test/security-routes.smoke.js > evidence/test-security-routes-smoke-js-output.txt 2>&1`

### Backend Integration Tests

#### `tests/integration/access-matrix.test.js`  |  Test Cases: **3**
- Run: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/access-matrix.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/access-matrix.test.js --reporter=verbose > evidence/tests-integration-access-matrix-test-js-output.txt 2>&1`

#### `tests/integration/admin.test.js`  |  Test Cases: **6**
- Run: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/admin.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/admin.test.js --reporter=verbose > evidence/tests-integration-admin-test-js-output.txt 2>&1`

#### `tests/integration/auth.test.js`  |  Test Cases: **4**
- Run: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/auth.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/auth.test.js --reporter=verbose > evidence/tests-integration-auth-test-js-output.txt 2>&1`

#### `tests/integration/coach.test.js`  |  Test Cases: **6**
- Run: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/coach.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/coach.test.js --reporter=verbose > evidence/tests-integration-coach-test-js-output.txt 2>&1`

#### `tests/integration/dietitian.test.js`  |  Test Cases: **6**
- Run: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/dietitian.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/dietitian.test.js --reporter=verbose > evidence/tests-integration-dietitian-test-js-output.txt 2>&1`

#### `tests/integration/mealplans.test.js`  |  Test Cases: **6**
- Run: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/mealplans.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/mealplans.test.js --reporter=verbose > evidence/tests-integration-mealplans-test-js-output.txt 2>&1`

#### `tests/integration/ownership.test.js`  |  Test Cases: **2**
- Run: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/ownership.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/ownership.test.js --reporter=verbose > evidence/tests-integration-ownership-test-js-output.txt 2>&1`

#### `tests/integration/workouts.test.js`  |  Test Cases: **6**
- Run: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/workouts.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.config.js tests/integration/workouts.test.js --reporter=verbose > evidence/tests-integration-workouts-test-js-output.txt 2>&1`

### Backend Unit Tests

#### `tests/unit/admin.utils.unit.test.js`  |  Test Cases: **3**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/admin.utils.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/admin.utils.unit.test.js --reporter=verbose > evidence/tests-unit-admin-utils-unit-test-js-output.txt 2>&1`

#### `tests/unit/auth.utils.unit.test.js`  |  Test Cases: **5**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/auth.utils.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/auth.utils.unit.test.js --reporter=verbose > evidence/tests-unit-auth-utils-unit-test-js-output.txt 2>&1`

#### `tests/unit/auth.validation.unit.test.js`  |  Test Cases: **6**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/auth.validation.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/auth.validation.unit.test.js --reporter=verbose > evidence/tests-unit-auth-validation-unit-test-js-output.txt 2>&1`

#### `tests/unit/authorizeRoles.unit.test.js`  |  Test Cases: **3**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/authorizeRoles.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/authorizeRoles.unit.test.js --reporter=verbose > evidence/tests-unit-authorizeroles-unit-test-js-output.txt 2>&1`

#### `tests/unit/coachScheduling.utils.unit.test.js`  |  Test Cases: **6**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/coachScheduling.utils.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/coachScheduling.utils.unit.test.js --reporter=verbose > evidence/tests-unit-coachscheduling-utils-unit-test-js-output.txt 2>&1`

#### `tests/unit/coachScheduling.validation.unit.test.js`  |  Test Cases: **4**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/coachScheduling.validation.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/coachScheduling.validation.unit.test.js --reporter=verbose > evidence/tests-unit-coachscheduling-validation-unit-test-js-output.txt 2>&1`

#### `tests/unit/dietitian.validation.unit.test.js`  |  Test Cases: **6**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/dietitian.validation.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/dietitian.validation.unit.test.js --reporter=verbose > evidence/tests-unit-dietitian-validation-unit-test-js-output.txt 2>&1`

#### `tests/unit/dietitianScheduling.utils.unit.test.js`  |  Test Cases: **6**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/dietitianScheduling.utils.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/dietitianScheduling.utils.unit.test.js --reporter=verbose > evidence/tests-unit-dietitianscheduling-utils-unit-test-js-output.txt 2>&1`

#### `tests/unit/mealplans.mapper.unit.test.js`  |  Test Cases: **3**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/mealplans.mapper.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/mealplans.mapper.unit.test.js --reporter=verbose > evidence/tests-unit-mealplans-mapper-unit-test-js-output.txt 2>&1`

#### `tests/unit/mealplans.search.utils.unit.test.js`  |  Test Cases: **2**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/mealplans.search.utils.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/mealplans.search.utils.unit.test.js --reporter=verbose > evidence/tests-unit-mealplans-search-utils-unit-test-js-output.txt 2>&1`

#### `tests/unit/mealplans.service.unit.test.js`  |  Test Cases: **5**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/mealplans.service.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/mealplans.service.unit.test.js --reporter=verbose > evidence/tests-unit-mealplans-service-unit-test-js-output.txt 2>&1`

#### `tests/unit/mealplans.validation.unit.test.js`  |  Test Cases: **5**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/mealplans.validation.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/mealplans.validation.unit.test.js --reporter=verbose > evidence/tests-unit-mealplans-validation-unit-test-js-output.txt 2>&1`

#### `tests/unit/notifications.service.unit.test.js`  |  Test Cases: **4**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/notifications.service.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/notifications.service.unit.test.js --reporter=verbose > evidence/tests-unit-notifications-service-unit-test-js-output.txt 2>&1`

#### `tests/unit/nutrition.controller.unit.test.js`  |  Test Cases: **2**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/nutrition.controller.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/nutrition.controller.unit.test.js --reporter=verbose > evidence/tests-unit-nutrition-controller-unit-test-js-output.txt 2>&1`

#### `tests/unit/progress.validation.unit.test.js`  |  Test Cases: **3**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/progress.validation.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/progress.validation.unit.test.js --reporter=verbose > evidence/tests-unit-progress-validation-unit-test-js-output.txt 2>&1`

#### `tests/unit/promotions.validation.unit.test.js`  |  Test Cases: **4**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/promotions.validation.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/promotions.validation.unit.test.js --reporter=verbose > evidence/tests-unit-promotions-validation-unit-test-js-output.txt 2>&1`

#### `tests/unit/roles.unit.test.js`  |  Test Cases: **3**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/roles.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/roles.unit.test.js --reporter=verbose > evidence/tests-unit-roles-unit-test-js-output.txt 2>&1`

#### `tests/unit/workouts.mapper.unit.test.js`  |  Test Cases: **2**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/workouts.mapper.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/workouts.mapper.unit.test.js --reporter=verbose > evidence/tests-unit-workouts-mapper-unit-test-js-output.txt 2>&1`

#### `tests/unit/workouts.service.unit.test.js`  |  Test Cases: **6**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/workouts.service.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/workouts.service.unit.test.js --reporter=verbose > evidence/tests-unit-workouts-service-unit-test-js-output.txt 2>&1`

#### `tests/unit/workouts.session.utils.unit.test.js`  |  Test Cases: **5**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/workouts.session.utils.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/workouts.session.utils.unit.test.js --reporter=verbose > evidence/tests-unit-workouts-session-utils-unit-test-js-output.txt 2>&1`

#### `tests/unit/workouts.validation.unit.test.js`  |  Test Cases: **5**
- Run: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/workouts.validation.unit.test.js --reporter=verbose`
- Save: `cmd /c npx vitest run --config .\\vitest.unit.config.js tests/unit/workouts.validation.unit.test.js --reporter=verbose > evidence/tests-unit-workouts-validation-unit-test-js-output.txt 2>&1`

### Backend Full Suite Shortcuts
- Smoke all: `cmd /c npm test`
- API integration all: `cmd /c npm run test:api`
- Unit all: `cmd /c npm run test:unit`

## Frontend
Run frontend commands from project root: `c:\Users\madhu\gympro-client`

### Frontend Unit/Component/Hook Tests

#### `frontend/src/app/router/ProtectedRoute.test.jsx`  |  Test Cases: **4**
- Run: `cmd /c npm run test:ui -- frontend/src/app/router/ProtectedRoute.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/app/router/ProtectedRoute.test.jsx > backend/evidence/frontend-src-app-router-protectedroute-test-jsx-output.txt 2>&1`

#### `frontend/src/features/admin/api/admin.api.test.js`  |  Test Cases: **4**
- Run: `cmd /c npm run test:ui -- frontend/src/features/admin/api/admin.api.test.js`
- Save: `cmd /c npm run test:ui -- frontend/src/features/admin/api/admin.api.test.js > backend/evidence/frontend-src-features-admin-api-admin-api-test-js-output.txt 2>&1`

#### `frontend/src/features/admin/pages/AdminFaqs.test.jsx`  |  Test Cases: **1**
- Run: `cmd /c npm run test:ui -- frontend/src/features/admin/pages/AdminFaqs.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/admin/pages/AdminFaqs.test.jsx > backend/evidence/frontend-src-features-admin-pages-adminfaqs-test-jsx-output.txt 2>&1`

#### `frontend/src/features/admin/pages/AdminLockers.test.jsx`  |  Test Cases: **2**
- Run: `cmd /c npm run test:ui -- frontend/src/features/admin/pages/AdminLockers.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/admin/pages/AdminLockers.test.jsx > backend/evidence/frontend-src-features-admin-pages-adminlockers-test-jsx-output.txt 2>&1`

#### `frontend/src/features/admin/pages/AdminPromotions.test.jsx`  |  Test Cases: **2**
- Run: `cmd /c npm run test:ui -- frontend/src/features/admin/pages/AdminPromotions.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/admin/pages/AdminPromotions.test.jsx > backend/evidence/frontend-src-features-admin-pages-adminpromotions-test-jsx-output.txt 2>&1`

#### `frontend/src/features/admin/pages/AdminSettings.test.jsx`  |  Test Cases: **2**
- Run: `cmd /c npm run test:ui -- frontend/src/features/admin/pages/AdminSettings.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/admin/pages/AdminSettings.test.jsx > backend/evidence/frontend-src-features-admin-pages-adminsettings-test-jsx-output.txt 2>&1`

#### `frontend/src/features/admin/pages/AdminUsers.test.jsx`  |  Test Cases: **2**
- Run: `cmd /c npm run test:ui -- frontend/src/features/admin/pages/AdminUsers.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/admin/pages/AdminUsers.test.jsx > backend/evidence/frontend-src-features-admin-pages-adminusers-test-jsx-output.txt 2>&1`

#### `frontend/src/features/auth/model/AuthContext.test.jsx`  |  Test Cases: **2**
- Run: `cmd /c npm run test:ui -- frontend/src/features/auth/model/AuthContext.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/auth/model/AuthContext.test.jsx > backend/evidence/frontend-src-features-auth-model-authcontext-test-jsx-output.txt 2>&1`

#### `frontend/src/features/auth/pages/LoginPage.test.jsx`  |  Test Cases: **2**
- Run: `cmd /c npm run test:ui -- frontend/src/features/auth/pages/LoginPage.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/auth/pages/LoginPage.test.jsx > backend/evidence/frontend-src-features-auth-pages-loginpage-test-jsx-output.txt 2>&1`

#### `frontend/src/features/auth/pages/RegisterPage.test.jsx`  |  Test Cases: **2**
- Run: `cmd /c npm run test:ui -- frontend/src/features/auth/pages/RegisterPage.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/auth/pages/RegisterPage.test.jsx > backend/evidence/frontend-src-features-auth-pages-registerpage-test-jsx-output.txt 2>&1`

#### `frontend/src/features/coach/api/coach.api.test.js`  |  Test Cases: **4**
- Run: `cmd /c npm run test:ui -- frontend/src/features/coach/api/coach.api.test.js`
- Save: `cmd /c npm run test:ui -- frontend/src/features/coach/api/coach.api.test.js > backend/evidence/frontend-src-features-coach-api-coach-api-test-js-output.txt 2>&1`

#### `frontend/src/features/coach/pages/CoachClients.test.jsx`  |  Test Cases: **2**
- Run: `cmd /c npm run test:ui -- frontend/src/features/coach/pages/CoachClients.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/coach/pages/CoachClients.test.jsx > backend/evidence/frontend-src-features-coach-pages-coachclients-test-jsx-output.txt 2>&1`

#### `frontend/src/features/coach/pages/CoachDashboard.test.jsx`  |  Test Cases: **1**
- Run: `cmd /c npm run test:ui -- frontend/src/features/coach/pages/CoachDashboard.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/coach/pages/CoachDashboard.test.jsx > backend/evidence/frontend-src-features-coach-pages-coachdashboard-test-jsx-output.txt 2>&1`

#### `frontend/src/features/coach/pages/CoachScheduling.test.jsx`  |  Test Cases: **2**
- Run: `cmd /c npm run test:ui -- frontend/src/features/coach/pages/CoachScheduling.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/coach/pages/CoachScheduling.test.jsx > backend/evidence/frontend-src-features-coach-pages-coachscheduling-test-jsx-output.txt 2>&1`

#### `frontend/src/features/coach/pages/CoachWorkoutPlans.test.jsx`  |  Test Cases: **1**
- Run: `cmd /c npm run test:ui -- frontend/src/features/coach/pages/CoachWorkoutPlans.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/coach/pages/CoachWorkoutPlans.test.jsx > backend/evidence/frontend-src-features-coach-pages-coachworkoutplans-test-jsx-output.txt 2>&1`

#### `frontend/src/features/dietitian/components/DietitianAppointmentsTable.test.jsx`  |  Test Cases: **1**
- Run: `cmd /c npm run test:ui -- frontend/src/features/dietitian/components/DietitianAppointmentsTable.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/dietitian/components/DietitianAppointmentsTable.test.jsx > backend/evidence/frontend-src-features-dietitian-components-dietitianappointmentstable-test-jsx-output.txt 2>&1`

#### `frontend/src/features/dietitian/components/DietitianTimeSlotsPanel.test.jsx`  |  Test Cases: **1**
- Run: `cmd /c npm run test:ui -- frontend/src/features/dietitian/components/DietitianTimeSlotsPanel.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/dietitian/components/DietitianTimeSlotsPanel.test.jsx > backend/evidence/frontend-src-features-dietitian-components-dietitiantimeslotspanel-test-jsx-output.txt 2>&1`

#### `frontend/src/features/dietitian/hooks/useDietitianDashboardData.test.js`  |  Test Cases: **2**
- Run: `cmd /c npm run test:ui -- frontend/src/features/dietitian/hooks/useDietitianDashboardData.test.js`
- Save: `cmd /c npm run test:ui -- frontend/src/features/dietitian/hooks/useDietitianDashboardData.test.js > backend/evidence/frontend-src-features-dietitian-hooks-usedietitiandashboarddata-test-js-output.txt 2>&1`

#### `frontend/src/features/dietitian/pages/DietitianClients.test.jsx`  |  Test Cases: **1**
- Run: `cmd /c npm run test:ui -- frontend/src/features/dietitian/pages/DietitianClients.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/dietitian/pages/DietitianClients.test.jsx > backend/evidence/frontend-src-features-dietitian-pages-dietitianclients-test-jsx-output.txt 2>&1`

#### `frontend/src/features/dietitian/pages/DietitianMealPlans.test.jsx`  |  Test Cases: **2**
- Run: `cmd /c npm run test:ui -- frontend/src/features/dietitian/pages/DietitianMealPlans.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/dietitian/pages/DietitianMealPlans.test.jsx > backend/evidence/frontend-src-features-dietitian-pages-dietitianmealplans-test-jsx-output.txt 2>&1`

#### `frontend/src/features/dietitian/utils/dietitianDashboard.utils.test.js`  |  Test Cases: **5**
- Run: `cmd /c npm run test:ui -- frontend/src/features/dietitian/utils/dietitianDashboard.utils.test.js`
- Save: `cmd /c npm run test:ui -- frontend/src/features/dietitian/utils/dietitianDashboard.utils.test.js > backend/evidence/frontend-src-features-dietitian-utils-dietitiandashboard-utils-test-js-output.txt 2>&1`

#### `frontend/src/features/dietitian/utils/mealPlanStorage.test.js`  |  Test Cases: **3**
- Run: `cmd /c npm run test:ui -- frontend/src/features/dietitian/utils/mealPlanStorage.test.js`
- Save: `cmd /c npm run test:ui -- frontend/src/features/dietitian/utils/mealPlanStorage.test.js > backend/evidence/frontend-src-features-dietitian-utils-mealplanstorage-test-js-output.txt 2>&1`

#### `frontend/src/features/user/components/CalorieTooltip.test.jsx`  |  Test Cases: **3**
- Run: `cmd /c npm run test:ui -- frontend/src/features/user/components/CalorieTooltip.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/user/components/CalorieTooltip.test.jsx > backend/evidence/frontend-src-features-user-components-calorietooltip-test-jsx-output.txt 2>&1`

#### `frontend/src/features/user/components/MealPlanRiskMonitorCard.test.jsx`  |  Test Cases: **3**
- Run: `cmd /c npm run test:ui -- frontend/src/features/user/components/MealPlanRiskMonitorCard.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/user/components/MealPlanRiskMonitorCard.test.jsx > backend/evidence/frontend-src-features-user-components-mealplanriskmonitorcard-test-jsx-output.txt 2>&1`

#### `frontend/src/features/user/components/UserPromotionsPopup.test.jsx`  |  Test Cases: **2**
- Run: `cmd /c npm run test:ui -- frontend/src/features/user/components/UserPromotionsPopup.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/user/components/UserPromotionsPopup.test.jsx > backend/evidence/frontend-src-features-user-components-userpromotionspopup-test-jsx-output.txt 2>&1`

#### `frontend/src/features/user/hooks/useUserMealPlanData.test.js`  |  Test Cases: **3**
- Run: `cmd /c npm run test:ui -- frontend/src/features/user/hooks/useUserMealPlanData.test.js`
- Save: `cmd /c npm run test:ui -- frontend/src/features/user/hooks/useUserMealPlanData.test.js > backend/evidence/frontend-src-features-user-hooks-useusermealplandata-test-js-output.txt 2>&1`

#### `frontend/src/features/user/pages/UserCoaches.test.jsx`  |  Test Cases: **1**
- Run: `cmd /c npm run test:ui -- frontend/src/features/user/pages/UserCoaches.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/user/pages/UserCoaches.test.jsx > backend/evidence/frontend-src-features-user-pages-usercoaches-test-jsx-output.txt 2>&1`

#### `frontend/src/features/user/pages/UserCoachFeedbacks.test.jsx`  |  Test Cases: **1**
- Run: `cmd /c npm run test:ui -- frontend/src/features/user/pages/UserCoachFeedbacks.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/user/pages/UserCoachFeedbacks.test.jsx > backend/evidence/frontend-src-features-user-pages-usercoachfeedbacks-test-jsx-output.txt 2>&1`

#### `frontend/src/features/user/pages/UserDietitians.test.jsx`  |  Test Cases: **1**
- Run: `cmd /c npm run test:ui -- frontend/src/features/user/pages/UserDietitians.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/user/pages/UserDietitians.test.jsx > backend/evidence/frontend-src-features-user-pages-userdietitians-test-jsx-output.txt 2>&1`

#### `frontend/src/features/user/pages/UserMealPlan.test.jsx`  |  Test Cases: **1**
- Run: `cmd /c npm run test:ui -- frontend/src/features/user/pages/UserMealPlan.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/user/pages/UserMealPlan.test.jsx > backend/evidence/frontend-src-features-user-pages-usermealplan-test-jsx-output.txt 2>&1`

#### `frontend/src/features/user/pages/UserProfile.test.jsx`  |  Test Cases: **1**
- Run: `cmd /c npm run test:ui -- frontend/src/features/user/pages/UserProfile.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/user/pages/UserProfile.test.jsx > backend/evidence/frontend-src-features-user-pages-userprofile-test-jsx-output.txt 2>&1`

#### `frontend/src/features/user/pages/UserWorkouts.test.jsx`  |  Test Cases: **1**
- Run: `cmd /c npm run test:ui -- frontend/src/features/user/pages/UserWorkouts.test.jsx`
- Save: `cmd /c npm run test:ui -- frontend/src/features/user/pages/UserWorkouts.test.jsx > backend/evidence/frontend-src-features-user-pages-userworkouts-test-jsx-output.txt 2>&1`

#### `frontend/src/features/user/utils/mealRiskScoring.test.js`  |  Test Cases: **5**
- Run: `cmd /c npm run test:ui -- frontend/src/features/user/utils/mealRiskScoring.test.js`
- Save: `cmd /c npm run test:ui -- frontend/src/features/user/utils/mealRiskScoring.test.js > backend/evidence/frontend-src-features-user-utils-mealriskscoring-test-js-output.txt 2>&1`

#### `frontend/src/features/user/utils/userMealPlan.utils.test.js`  |  Test Cases: **3**
- Run: `cmd /c npm run test:ui -- frontend/src/features/user/utils/userMealPlan.utils.test.js`
- Save: `cmd /c npm run test:ui -- frontend/src/features/user/utils/userMealPlan.utils.test.js > backend/evidence/frontend-src-features-user-utils-usermealplan-utils-test-js-output.txt 2>&1`

#### `frontend/src/shared/config/navConfig.test.js`  |  Test Cases: **3**
- Run: `cmd /c npm run test:ui -- frontend/src/shared/config/navConfig.test.js`
- Save: `cmd /c npm run test:ui -- frontend/src/shared/config/navConfig.test.js > backend/evidence/frontend-src-shared-config-navconfig-test-js-output.txt 2>&1`

#### `frontend/src/shared/utils/storage.test.js`  |  Test Cases: **4**
- Run: `cmd /c npm run test:ui -- frontend/src/shared/utils/storage.test.js`
- Save: `cmd /c npm run test:ui -- frontend/src/shared/utils/storage.test.js > backend/evidence/frontend-src-shared-utils-storage-test-js-output.txt 2>&1`

### Frontend Full Suite Shortcut
- All frontend tests: `cmd /c npm run test:ui`
- Save all frontend output: `cmd /c npm run test:ui > backend/evidence/frontend-full-output.txt 2>&1`
