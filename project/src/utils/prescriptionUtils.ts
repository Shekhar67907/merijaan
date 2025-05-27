import { PRESCRIPTION_RANGES, PrescriptionData, ValidationError, VisualAcuity, VA_THRESHOLDS, VA_CONVERSION, PRESCRIPTION_ALERTS } from '../components/types';

// Helper to check if a value is within a step size
const isValidStep = (value: number, step: number): boolean => {
  return Math.abs(Math.round(value / step) * step - value) < 0.001;
};

// Helper to normalize visual acuity to 6/x format
const normalizeVa = (value: string): string => {
  // If already in 6/x format, return as is
  if (value.startsWith('6/')) return value;
  
  // Convert from 20/x format to 6/x format
  if (value.startsWith('20/')) {
    const denominator = parseInt(value.substring(3));
    Object.entries(VA_CONVERSION).forEach(([key, val]) => {
      if (val === value) return key;
    });
  }
  
  return value;
};

// Get visual acuity status from fraction
const getVaStatus = (fraction: string): VisualAcuity['status'] => {
  const normalized = normalizeVa(fraction);
  
  // Create arrays of valid values for each status
  const normal = [...VA_THRESHOLDS.NORMAL];
  const slightlyReduced = [...VA_THRESHOLDS.SLIGHTLY_REDUCED];
  const reduced = [...VA_THRESHOLDS.REDUCED];
  const severelyReduced = [...VA_THRESHOLDS.SEVERELY_REDUCED];
  
  if (normal.includes(normalized)) return "Normal";
  if (slightlyReduced.includes(normalized)) return "Slightly reduced";
  if (reduced.includes(normalized)) return "Reduced";
  if (severelyReduced.includes(normalized)) return "Severely reduced";
  
  return "Severely reduced"; // Default for unknown values
};

// Calculate decimal value from fraction
const calculateDecimalVa = (fraction: string): number => {
  const normalized = normalizeVa(fraction);
  const [numerator, denominator] = normalized.split('/').map(Number);
  return numerator / denominator;
};

// Visual Acuity calculation functions
export const calculateSnellenFromDecimal = (decimal: number): string => {
  // Convert decimal VA to nearest standard Snellen value
  const standardSnellen = [
    { decimal: 1.0, fraction: '6/6' },
    { decimal: 0.8, fraction: '6/7.5' },
    { decimal: 0.67, fraction: '6/9' },
    { decimal: 0.5, fraction: '6/12' },
    { decimal: 0.33, fraction: '6/18' },
    { decimal: 0.25, fraction: '6/24' },
    { decimal: 0.17, fraction: '6/36' },
    { decimal: 0.1, fraction: '6/60' }
  ];

  // Find closest match
  const match = standardSnellen.reduce((prev, curr) => {
    return Math.abs(curr.decimal - decimal) < Math.abs(prev.decimal - decimal) ? curr : prev;
  });

  return match.fraction;
};

// Calculate expected VA based on prescription
export const calculateExpectedVa = (
  sph: string, 
  cyl: string, 
  age: string | number
): VisualAcuity | null => {
  // Convert inputs to numbers
  const sphericalValue = parseFloat(sph);
  const cylinderValue = parseFloat(cyl || '0');
  const ageValue = typeof age === 'string' ? parseInt(age) : age;
  
  if (isNaN(sphericalValue) || isNaN(cylinderValue) || isNaN(ageValue)) return null;

  // Calculate spherical equivalent
  const se = sphericalValue + (cylinderValue / 2);
  
  // Base VA calculation (this is a simplified model - real world values vary)
  let expectedDecimalVa = 1.0; // Start with perfect vision
  
  // Reduce VA based on refractive error
  const absoluteSE = Math.abs(se);
  if (absoluteSE > 0) {
    expectedDecimalVa -= (absoluteSE * 0.1); // Rough approximation
  }
  
  // Reduce VA based on cylinder
  const absoluteCyl = Math.abs(cylinderValue);
  if (absoluteCyl > 0) {
    expectedDecimalVa -= (absoluteCyl * 0.05); // Cylinder affects VA less than sphere
  }
  
  // Age-related reduction (after 40)
  if (ageValue > 40) {
    expectedDecimalVa -= ((ageValue - 40) * 0.005); // Gradual reduction with age
  }
  
  // Ensure VA doesn't go below minimum or above maximum
  expectedDecimalVa = Math.max(0.1, Math.min(1.0, expectedDecimalVa));
  
  // Convert to Snellen notation
  const snellenValue = calculateSnellenFromDecimal(expectedDecimalVa);
  
  // Get status based on decimal VA
  let status: VisualAcuity['status'];
  if (expectedDecimalVa >= 0.8) status = "Normal";
  else if (expectedDecimalVa >= 0.5) status = "Slightly reduced";
  else if (expectedDecimalVa >= 0.25) status = "Reduced";
  else status = "Severely reduced";
  
  // Format result
  return {
    fraction: snellenValue,
    equivalentValue: VA_CONVERSION[snellenValue as keyof typeof VA_CONVERSION],
    status,
    decimalValue: expectedDecimalVa
  };
};

// Compare actual VA with expected VA
export const analyzeVisualAcuity = (
  actualVa: string,
  expectedVa: VisualAcuity | null
): {
  difference: number;
  status: 'Better than expected' | 'As expected' | 'Worse than expected';
  recommendation?: string;
} => {
  if (!expectedVa || !actualVa) return { 
    difference: 0, 
    status: 'As expected' 
  };

  // Convert actual VA to decimal
  const [num, denom] = actualVa.split('/').map(Number);
  const actualDecimal = num / denom;

  const difference = actualDecimal - expectedVa.decimalValue;
  
  let status: 'Better than expected' | 'As expected' | 'Worse than expected';
  let recommendation: string | undefined;

  if (difference > 0.1) {
    status = 'Better than expected';
  } else if (difference < -0.1) {
    status = 'Worse than expected';
    recommendation = difference < -0.2 
      ? 'Consider referral for medical evaluation'
      : 'Monitor on next visit';
  } else {
    status = 'As expected';
  }

  return {
    difference: Number(difference.toFixed(2)),
    status,
    recommendation
  };
};

// Update validateAndFormatVn to use new VA calculations
export const validateAndFormatVn = (
  value: string,
  prescriptionData?: { sph: string; cyl: string; age?: string | number }
): VisualAcuity | null => {
  // Handle empty values
  if (!value) return null;
  
  // Normalize to 6/x format
  const normalized = normalizeVa(value);
  
  // Check if it's a valid format (either 6/x or 20/x)
  if (!normalized.match(/^(6|20)\/\d+$/)) return null;
  
  // Extract the base and denominator
  const [base, denominator] = normalized.split('/');
  const numDenominator = parseInt(denominator);
  
  // Calculate decimal value
  const decimalValue = calculateDecimalVa(normalized);
  
  // Create VA object
  const va: VisualAcuity = {
    fraction: normalized,
    status: getVaStatus(normalized),
    decimalValue
  };
  
  // Add equivalent value if available
  if (base === '6' && VA_CONVERSION[normalized as keyof typeof VA_CONVERSION]) {
    va.equivalentValue = VA_CONVERSION[normalized as keyof typeof VA_CONVERSION];
  } else if (base === '20') {
    va.equivalentValue = normalized;
  }
  
  // If prescription data is provided, compare with expected VA
  if (prescriptionData) {
    const expectedVa = calculateExpectedVa(
      prescriptionData.sph,
      prescriptionData.cyl,
      prescriptionData.age || 0
    );
    
    if (expectedVa) {
      const analysis = analyzeVisualAcuity(normalized, expectedVa);
      va.comparisonToExpected = analysis;
    }
  }
  
  return va;
};

// Check for high prescription values
export const checkHighPrescription = (
  sph: string, 
  cyl: string
): { isHigh: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  const sphValue = parseFloat(sph);
  const cylValue = parseFloat(cyl);
  
  if (!isNaN(sphValue)) {
    if (sphValue < PRESCRIPTION_ALERTS.HIGH_POWER.SPH.min || 
        sphValue > PRESCRIPTION_ALERTS.HIGH_POWER.SPH.max) {
      warnings.push(`High spherical power (${sph}D)`);
    }
  }
  
  if (!isNaN(cylValue)) {
    if (cylValue < PRESCRIPTION_ALERTS.HIGH_POWER.CYL.min || 
        cylValue > PRESCRIPTION_ALERTS.HIGH_POWER.CYL.max) {
      warnings.push(`High cylindrical power (${cyl}D)`);
    }
  }
  
  return {
    isHigh: warnings.length > 0,
    warnings
  };
};

// Validate numeric value within range and step
export const validateNumericField = (
  value: string,
  field: keyof typeof PRESCRIPTION_RANGES,
  isRequired: boolean = true
): ValidationError | null => {
  if (!value && !isRequired) return null;
  if (!value && isRequired) return { field, message: 'Field is required' };

  const numValue = parseFloat(value);
  const range = PRESCRIPTION_RANGES[field];

  if (isNaN(numValue)) return { field, message: 'Must be a number' };
  if (numValue < range.min) return { field, message: `Must be at least ${range.min}` };
  if (numValue > range.max) return { field, message: `Must be at most ${range.max}` };
  if (!isValidStep(numValue, range.step)) {
    return { field, message: `Must be in steps of ${range.step}` };
  }

  return null;
};

// Calculate Near Vision SPH based on Distance Vision SPH and ADD
export const calculateNearVisionSph = (dvSph: string, add: string): string => {
  if (!dvSph || !add) return '';
  
  const dvValue = parseFloat(dvSph);
  const addValue = parseFloat(add);
  
  if (isNaN(dvValue) || isNaN(addValue)) return '';
  
  const nvValue = dvValue + addValue;
  return nvValue > 0 ? `+${nvValue.toFixed(2)}` : nvValue.toFixed(2);
};

// Calculate total IPD from RPD and LPD
export const calculateTotalPD = (rpd: string, lpd: string): string => {
  const rpdNum = parseFloat(rpd);
  const lpdNum = parseFloat(lpd);

  if (isNaN(rpdNum) || isNaN(lpdNum)) return '';
  
  if (rpdNum < PRESCRIPTION_RANGES.PD.min || rpdNum > PRESCRIPTION_RANGES.PD.max) return '';
  if (lpdNum < PRESCRIPTION_RANGES.PD.min || lpdNum > PRESCRIPTION_RANGES.PD.max) return '';

  return (rpdNum + lpdNum).toFixed(1);
};

// Calculate spherical equivalent
export const calculateSphericalEquivalent = (sph: string, cyl: string): number | null => {
  const sphValue = parseFloat(sph);
  const cylValue = parseFloat(cyl);
  
  if (isNaN(sphValue) || isNaN(cylValue)) return null;
  
  return sphValue + (cylValue / 2);
};

// Enhanced axis validation
export const validateAxisWhenCylPresent = (cyl: string, axis: string): ValidationError | null => {
  const cylValue = parseFloat(cyl);
  const axisValue = parseInt(axis);
  
  if (cylValue !== 0) {
    if (!axis || axis === '0' || axis === '') {
      return { field: 'axis', message: 'AXIS required when CYL is present' };
    }
    
    if (isNaN(axisValue) || axisValue < 0 || axisValue > 180) {
      return { field: 'axis', message: 'AXIS must be between 0 and 180 degrees' };
    }
  }
  
  return null;
};

// Enhanced validation for prescription data
export const validatePrescriptionData = (data: PrescriptionData, isBalanceLens: boolean): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (isBalanceLens) {
    if (data.sph !== '0' && data.sph !== '') 
      errors.push({ field: 'sph', message: 'Must be 0 for balance lens' });
    if (data.cyl !== '0' && data.cyl !== '') 
      errors.push({ field: 'cyl', message: 'Must be 0 for balance lens' });
    if (data.ax !== '' && data.ax !== '-') 
      errors.push({ field: 'ax', message: 'Must be empty for balance lens' });
    return errors;
  }

  // SPH validation
  const sphError = validateNumericField(data.sph, 'SPH');
  if (sphError) errors.push(sphError);

  // CYL validation
  const cylError = validateNumericField(data.cyl, 'CYL', false);
  if (cylError) errors.push(cylError);

  // Enhanced AXIS validation
  const axisError = validateAxisWhenCylPresent(data.cyl, data.ax);
  if (axisError) errors.push(axisError);

  // ADD validation with stricter range
  if (data.add) {
    const addError = validateNumericField(data.add, 'ADD');
    if (addError) errors.push(addError);
    
    // Additional validation for minimum ADD power
    const addValue = parseFloat(data.add);
    if (!isNaN(addValue) && addValue < PRESCRIPTION_RANGES.ADD.min) {
      errors.push({ 
        field: 'add', 
        message: `ADD power must be at least ${PRESCRIPTION_RANGES.ADD.min}D for presbyopia correction` 
      });
    }
  }

  // VN validation
  if (data.vn && !validateAndFormatVn(data.vn)) {
    errors.push({ field: 'vn', message: 'Invalid visual acuity format (e.g., 6/6)' });
  }

  // PD validation
  if (data.rpd) {
    const rpdError = validateNumericField(data.rpd, 'PD');
    if (rpdError) errors.push(rpdError);
  }
  if (data.lpd) {
    const lpdError = validateNumericField(data.lpd, 'PD');
    if (lpdError) errors.push(lpdError);
  }

  return errors;
};

// Format numeric input to maintain step sizes
export const formatPrescriptionNumber = (value: string, field: keyof typeof PRESCRIPTION_RANGES): string => {
  if (!value) return '';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '';

  const range = PRESCRIPTION_RANGES[field];
  const steppedValue = Math.round(numValue / range.step) * range.step;
  
  return steppedValue.toFixed(2);
};

// Enhanced special cases handling
export const handleSpecialCases = (data: PrescriptionData): PrescriptionData => {
  const updated = { ...data };

  // If CYL is 0, clear AXIS
  if (updated.cyl === '0' || updated.cyl === '') {
    updated.ax = '';
  }

  // Ensure ADD is always positive and within range
  if (updated.add) {
    const addValue = parseFloat(updated.add);
    if (!isNaN(addValue)) {
      if (addValue < PRESCRIPTION_RANGES.ADD.min) {
        updated.add = PRESCRIPTION_RANGES.ADD.min.toFixed(2);
      } else if (addValue > PRESCRIPTION_RANGES.ADD.max) {
        updated.add = PRESCRIPTION_RANGES.ADD.max.toFixed(2);
      }
    }
  }

  // Calculate and store spherical equivalent if both SPH and CYL are present
  if (updated.sph && updated.cyl) {
    const se = calculateSphericalEquivalent(updated.sph, updated.cyl);
    if (se !== null) {
      updated.sphericalEquivalent = se.toFixed(2);
    }
  }

  return updated;
}; 