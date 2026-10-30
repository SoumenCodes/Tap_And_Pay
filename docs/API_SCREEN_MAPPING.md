# SE PAY - API & Screen Mapping Architecture

Comprehensive mapping between application screens, backend endpoints, and the 5 supported user roles.

---

## 1. Supported User Types & Roles

| Role Key (`user_type_key`) | Role Label | Scope & Description |
| :--- | :--- | :--- |
| `other_business` | **Other Business (Company)** | Owner/Admin of non-taxi businesses (Salon, Retail, Services). Manages employees, monitors sales & revenue. |
| `other_business_employee` | **Business Employee** | Staff member under Other Business. Accepts card/tap-and-go sales, tracks own shifts. |
| `taxi_business` | **Taxi Fleet Business** | Fleet operator managing taxi vehicles, drivers, fleet revenue, and shifts. |
| `taxi_owner` | **Taxi Owner Driver** | Independent owner-operator managing own taxi vehicle and accepting rides/fares. |
| `taxi_business_driver` | **Normal Driver** | Driver assigned to a vehicle under a Taxi Fleet Business. |

---

## 2. API Endpoints by Screen Matrix

### A. Authentication & Onboarding
| Screen Name | File Path | User Types | HTTP Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **Login** | `src/app/login.tsx` | All 5 Roles | `POST` | `/api/login` | ✅ Live | Authenticates user; returns JWT token, user profile, and `user_type_key`. |
| **Forgot Password** | `src/app/forgot-password.tsx` | All 5 Roles | `POST` | `/api/forgot-password` | ✅ Live | Sends 6-digit OTP to registered mobile or email. |
| **Verify OTP** | `src/app/forgot-password.tsx` | All 5 Roles | `POST` | `/api/verify-otp` | ✅ Live | Validates OTP and returns temporary reset token. |
| **Reset Password** | `src/app/forgot-password.tsx` | All 5 Roles | `POST` | `/api/reset-password` | ✅ Live | Updates password using reset token. |

---

### B. Dashboards (`src/app/(tabs)/index.tsx`)
| Screen Name | Component Path | User Types | HTTP Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **Other Business Dashboard** | `src/components/other-business/owner/OtherBusinessDashboard.tsx` | `other_business` | `GET` | `/api/user/dashboard` | ✅ Live | Revenue (Card / Tap & Go), active employees summary & list, header details. |
| **Employee Dashboard** | `src/components/other-business/employee/OtherBusinessEmployeeDashboard.tsx` | `other_business_employee` | `GET` | `/api/user/dashboard` | ✅ Live | Personal shift status, revenue (Card / Tap & Go), recent transactions list. |
| **Taxi Fleet Dashboard** | `src/components/taxi/business/TaxiBusinessDashboard.tsx` | `taxi_business` | `GET` | `/api/user/dashboard` | ⏳ Pending Contract | Fleet revenue, active drivers on/off shift summary & list. |
| **Taxi Owner Dashboard** | `src/components/taxi/owner/TaxiOwnerDashboard.tsx` | `taxi_owner` | `GET` | `/api/user/dashboard` | ⏳ Pending Contract | Single-vehicle revenue, active shift tally, ride triggers. |
| **Taxi Driver Dashboard** | `src/components/taxi/driver/TaxiDriverDashboard.tsx` | `taxi_business_driver` | `GET` | `/api/user/dashboard` | ⏳ Pending Contract | Driver active shift revenue, vehicle assignment status. |

---

### C. Profiles & Settings (`src/app/(tabs)/profile.tsx`)
| Screen Name | Component Path | User Types | HTTP Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **User Profile** | All 5 Profile Screens (`src/components/*/profile/`) | All 5 Roles | `GET` | `/api/user/profile` | ✅ Live | Fetches user info, business details, bank details, and active session revenue. |
| **Bank Details** | Profile Bank Modal | All 5 Roles | `GET` | `/api/user/bank-details` | ✅ Live | Current bank account name, BSB, masked account number, approval status. |
| **Update Bank** | Profile Bank Edit Modal | All 5 Roles | `POST` | `/api/user/update-bank-details` | ✅ Live | Submits updated bank details for admin approval. |
| **Logout** | All Profile Screens | All 5 Roles | `POST` | `/api/logout` | ✅ Live | Invalidates active user session and clears stored tokens. |

---

### D. Employee Management (Other Business)
| Screen Name | Component Path | User Types | HTTP Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **Manage Employees** | `src/components/other-business/owner/ManageEmployeeScreen.tsx` | `other_business` | `GET` | `/api/employees/list` | ✅ Live | Paginated/searchable list of employees under business. |
| **Employee Details** | `src/components/other-business/owner/EmployeeDetailsScreen.tsx` | `other_business` | `GET` | `/api/employee/detail/:id` | ✅ Live | Full employee profile, photo, shifts, and contact details. |
| **Add Employee** | `src/components/other-business/owner/AddEmployeeScreen.tsx` | `other_business` | `POST` | `/api/employees/add` | ✅ Live | Creates new employee (multipart/form-data with profile photo). |
| **Edit Employee** | `src/components/other-business/owner/AddEmployeeScreen.tsx` | `other_business` | `POST` | `/api/employee/edit/:id` | ✅ Live | Updates employee details and/or photo. |

---

### E. Driver Management (Taxi Fleet)
| Screen Name | Component Path | User Types | HTTP Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **Manage Drivers** | `src/components/taxi/business/ManageDriverScreen.tsx` | `taxi_business` | `GET` | `/api/drivers/list` | ✅ Live | Searchable list of drivers under taxi company. |
| **Driver Details** | `src/components/taxi/business/DriverDetailsScreen.tsx` | `taxi_business` | `GET` | `/api/drivers/detail/:id` | ✅ Live | Driver profile, taxi assignment, documents (DL front/rear, photo). |
| **Add Driver** | `src/components/taxi/business/AddDriverScreen.tsx` | `taxi_business` | `POST` | `/api/drivers/add` | ✅ Live | Registers new driver with DL & profile documents. |
| **Edit Driver** | `src/components/taxi/business/AddDriverScreen.tsx` | `taxi_business` | `POST` | `/api/driver/update-profile/:id` | ✅ Live | Updates driver profile, license, and vehicle assignments. |

---

### F. Transactions, Sales & Shifts
| Screen Name | File Path | User Types | HTTP Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **Create Sale / Tap to Pay** | `src/app/(tabs)/tap-to-pay.tsx` | All Roles | Native / Stripe | Stripe Terminal SDK | ✅ Live | Processes in-person card payments (Stripe Tap to Pay). |
| **Receipt Details** | `src/app/(tabs)/receipt-details.tsx` | All Roles | Local / Print | Local Document Generator | ✅ Live | Generates formatted receipt image and PDF slip for sharing/printing. |
| **Start Shift** | Dashboard buttons | All Roles | `POST` | `/api/shift/start` | ✅ Live | Starts work shift; records device ID, start timestamp, generates shift ID. |
| **End Shift** | Dashboard buttons | All Roles | `POST` | `/api/shift/end` | ✅ Live | Closes work session; sends shift_session_id and user_id, updates shift state. |
| **Transactions & Shifts** | `src/app/(tabs)/transactions.tsx` | All Roles | `GET` | `/api/shifts` or `/api/transactions` | ⏳ Pending Contract | Shift logs, transaction records, and settlement tallies. |

---

## 3. Maintenance Guidelines

1. **Before adding a new screen**: Check this matrix to ensure the endpoint contract is defined.
2. **When backend releases an endpoint**:
   - Create a typed service in `src/services/`.
   - Update this file with the route, method, payload parameters, and integration status.
3. **Keep contracts strict**: No hardcoded mocks as fallbacks once an endpoint is marked `✅ Live`.
