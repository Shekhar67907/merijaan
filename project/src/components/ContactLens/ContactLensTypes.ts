// Define interfaces for form data
export interface ContactLensEyeData {
  sph: string;
  cyl: string;
  ax: string;
  add: string;
  vn: string;
  rpd?: string; // Right Pupillary Distance
  lpd?: string; // Left Pupillary Distance
  sphericalEquivalent?: string; // For calculated spherical equivalent
}

export interface ContactLensEyePrescription {
  dv: ContactLensEyeData;
  nv: ContactLensEyeData;
}

export interface ContactLensItem {
  si: number;
  bc: string;
  power: string;
  material: string;
  dispose: string;
  brand: string;
  qty: number;
  diameter: string;
  rate: number;
  amount: number;
  lensCode: string;
  side: 'Right' | 'Left' | '';
  sph: string;
  cyl: string;
  ax: string;
}

export interface ContactLensFormData {
  clNo: string;
  refNo: string;
  date: string;
  time: string;
  dvDate: string;
  dvTime: string;
  class: string;
  bookingBy: string;
  title: string;
  name: string;
  gender: 'Male' | 'Female';
  age: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  phoneLandline: string;
  mobile: string;
  email: string;
  customerCode: string;
  birthDay: string;
  marriageAnniversary: string;
  prescBy: string;
  billed: boolean;
  billNumber: string;
  rightEye: ContactLensEyePrescription;
  leftEye: ContactLensEyePrescription;
  ipd: string;
  balanceLens: boolean;
  contactLensItems: ContactLensItem[];
  remarks: string;
  orderStatus: 'Processing' | 'Ready' | 'Hand Over';
  orderStatusDate: string;
  retestAfter: string;
  expiryDate: string;
  payment: string;
  estimate: string;
  schAmt: string;
  advance: string;
  balance: string;
  cashAdv: string;
  ccUpiAdv: string;
  chequeAdv: string;
  cashAdv2: string;
  advDate: string;
}
