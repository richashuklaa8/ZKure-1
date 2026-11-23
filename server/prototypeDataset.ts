/** Synthetic India-focused fixtures. These are not real policies, providers, or claims. */
export const prototypePatients = [
  { id: 'PAT-DEMO-01', name: 'Aarav Nair', city: 'Kochi', state: 'Kerala', insurer: 'BharatSure Health (Demo)', policy: 'DEMO-BSH-2026-001', plan: 'Essential Family Floater', limitInr: 300000, spentInr: 34500, validTill: '2027-12-31' },
  { id: 'PAT-DEMO-02', name: 'Priya Kulkarni', city: 'Pune', state: 'Maharashtra', insurer: 'Niramaya Health Assurance (Demo)', policy: 'DEMO-NHA-2026-014', plan: 'Standard Individual Cover', limitInr: 500000, spentInr: 112400, validTill: '2027-11-30' },
  { id: 'PAT-DEMO-03', name: 'Zoya Khan', city: 'Hyderabad', state: 'Telangana', insurer: 'BharatSure Health (Demo)', policy: 'DEMO-BSH-2026-022', plan: 'SeniorCare Plus', limitInr: 1000000, spentInr: 480000, validTill: '2028-03-31' },
  { id: 'PAT-DEMO-04', name: 'Ravi Prasad', city: 'Varanasi', state: 'Uttar Pradesh', insurer: 'Sahyog Arogya Mutual (Demo)', policy: 'DEMO-SAM-2026-009', plan: 'Community Health Cover', limitInr: 500000, spentInr: 0, validTill: '2027-09-30' },
  { id: 'PAT-DEMO-05', name: 'Meera Iyer', city: 'Chennai', state: 'Tamil Nadu', insurer: 'Niramaya Health Assurance (Demo)', policy: 'DEMO-NHA-2026-027', plan: 'Family Floater Plus', limitInr: 1500000, spentInr: 265000, validTill: '2028-01-31' }
] as const;

export const prototypeHospitals = [
  { id: 'HSP-DEMO-01', name: 'Sahyadri Community Hospital (Demo)', city: 'Pune, Maharashtra' },
  { id: 'HSP-DEMO-02', name: 'Malabar Care Centre (Demo)', city: 'Kozhikode, Kerala' },
  { id: 'HSP-DEMO-03', name: 'Deccan Multispeciality (Demo)', city: 'Hyderabad, Telangana' },
  { id: 'HSP-DEMO-04', name: 'Kashi Seva Hospital (Demo)', city: 'Varanasi, Uttar Pradesh' },
  { id: 'HSP-DEMO-05', name: 'Chennai South Medical Centre (Demo)', city: 'Chennai, Tamil Nadu' }
] as const;

export const prototypeCases = [
  { id: 'DCLM-DEMO-001', patientId: 'PAT-DEMO-01', hospitalId: 'HSP-DEMO-02', careType: 'Day-care cardiac diagnostics', amountInr: 18750, status: 'Demo only — not submitted' },
  { id: 'DCLM-DEMO-002', patientId: 'PAT-DEMO-02', hospitalId: 'HSP-DEMO-01', careType: 'Orthopaedic day-care procedure', amountInr: 124800, status: 'Demo only — not submitted' },
  { id: 'DCLM-DEMO-003', patientId: 'PAT-DEMO-03', hospitalId: 'HSP-DEMO-03', careType: 'Inpatient medical treatment', amountInr: 475000, status: 'Demo only — not submitted' },
  { id: 'DCLM-DEMO-004', patientId: 'PAT-DEMO-04', hospitalId: 'HSP-DEMO-04', careType: 'Maternity and newborn care', amountInr: 78500, status: 'Demo only — not submitted' },
  { id: 'DCLM-DEMO-005', patientId: 'PAT-DEMO-05', hospitalId: 'HSP-DEMO-05', careType: 'Cancer care treatment cycle', amountInr: 320000, status: 'Demo only — not submitted' },
  { id: 'DCLM-DEMO-006', patientId: 'PAT-DEMO-02', hospitalId: 'HSP-DEMO-01', careType: 'Pharmacy and laboratory package', amountInr: 26300, status: 'Demo only — not submitted' }
] as const;

export const prototypeInsurers = [
  'BharatSure Health (Demo)',
  'Niramaya Health Assurance (Demo)',
  'Sahyog Arogya Mutual (Demo)'
] as const;
