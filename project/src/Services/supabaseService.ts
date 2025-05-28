// src/services/supabaseService.ts
import { createClient } from '@supabase/supabase-js';
import { PrescriptionData } from '../types';

// Debug environment variables
console.log('Environment variables:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing'
});

// Initialize Supabase client with error checking
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? '✓' : '✗',
    key: supabaseAnonKey ? '✓' : '✗'
  });
  throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test connection method
export const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('prescriptions').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test error:', error);
      throw error;
    }
    console.log('Supabase connection successful');
    return { success: true, message: 'Connected to Supabase successfully' };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to connect to Supabase' 
    };
  }
};

// Database Types
export interface DatabasePrescription {
  id?: string;
  prescription_no: string;
  reference_no?: string;
  class?: string;
  prescribed_by: string;
  date: string;
  name: string;
  title?: string;
  age?: string;
  gender?: string;
  customer_code?: string;
  birth_day?: string;
  marriage_anniversary?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  phone_landline?: string;
  mobile_no?: string;
  email?: string;
  ipd?: string;
  retest_after?: string;
  others?: string;
  balance_lens?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseEyePrescription {
  id?: string;
  prescription_id: string;
  eye_type: 'right' | 'left';
  vision_type: 'dv' | 'nv';
  sph?: string;
  cyl?: string;
  ax?: string;
  add_power?: string;
  vn?: string;
  rpd?: string;
  lpd?: string;
  spherical_equivalent?: string;
}

export interface DatabaseRemarks {
  id?: string;
  prescription_id: string;
  for_constant_use?: boolean;
  for_distance_vision_only?: boolean;
  for_near_vision_only?: boolean;
  separate_glasses?: boolean;
  bi_focal_lenses?: boolean;
  progressive_lenses?: boolean;
  anti_reflection_lenses?: boolean;
  anti_radiation_lenses?: boolean;
  under_corrected?: boolean;
}

// Helper function to convert database format to PrescriptionData format
function mapDatabaseToPrescriptionData(dbData: any): PrescriptionData | null {
  if (!dbData || !dbData.prescription) return null;

  const prescription = dbData.prescription;
  const eyePrescriptions = dbData.eyePrescriptions || [];
  const remarks = dbData.remarks;

  // Helper to find raw eye data
  const findRawEyeData = (eye: 'right' | 'left', type: 'dv' | 'nv') => {
    return eyePrescriptions.find((ep: any) => ep.eye_type === eye && ep.vision_type === type);
  };

  const rightDvData = findRawEyeData('right', 'dv');
  const rightNvData = findRawEyeData('right', 'nv');
  const leftDvData = findRawEyeData('left', 'dv');
  const leftNvData = findRawEyeData('left', 'nv');

  return {
    prescriptionNo: prescription.prescription_no || '',
    referenceNo: prescription.reference_no || '',
    class: prescription.class || '',
    prescribedBy: prescription.prescribed_by || '',
    date: prescription.date || '',
    name: prescription.name || '',
    title: prescription.title || '',
    age: String(prescription.age || ''),
    gender: prescription.gender || 'Male',
    customerCode: prescription.customer_code || '',
    birthDay: prescription.birth_day || '',
    marriageAnniversary: prescription.marriage_anniversary || '',
    address: prescription.address || '',
    city: prescription.city || '',
    state: prescription.state || '',
    pinCode: prescription.pin_code || '',
    phoneLandline: prescription.phone_landline || '',
    mobileNo: prescription.mobile_no || '',
    email: prescription.email || '',
    ipd: String(prescription.ipd || ''),
    rightEye: {
      dv: {
        sph: String(rightDvData?.sph || ''),
        cyl: String(rightDvData?.cyl || ''),
        ax: String(rightDvData?.ax || ''),
        add: String(rightDvData?.add_power || ''),
        vn: rightDvData?.vn || '',
        rpd: String(rightDvData?.rpd || ''),
      },
      nv: {
        sph: String(rightNvData?.sph || ''),
        cyl: String(rightNvData?.cyl || ''),
        ax: String(rightNvData?.ax || ''),
        add: String(rightNvData?.add_power || ''),
        vn: rightNvData?.vn || '',
      }
    },
    leftEye: {
      dv: {
        sph: String(leftDvData?.sph || ''),
        cyl: String(leftDvData?.cyl || ''),
        ax: String(leftDvData?.ax || ''),
        add: String(leftDvData?.add_power || ''),
        vn: leftDvData?.vn || '',
        lpd: String(leftDvData?.lpd || ''),
      },
      nv: {
        sph: String(leftNvData?.sph || ''),
        cyl: String(leftNvData?.cyl || ''),
        ax: String(leftNvData?.ax || ''),
        add: String(leftNvData?.add_power || ''),
        vn: leftNvData?.vn || '',
      }
    },
    remarks: {
      forConstantUse: remarks?.for_constant_use || false,
      forDistanceVisionOnly: remarks?.for_distance_vision_only || false,
      forNearVisionOnly: remarks?.for_near_vision_only || false,
      separateGlasses: remarks?.separate_glasses || false,
      biFocalLenses: remarks?.bi_focal_lenses || false,
      progressiveLenses: remarks?.progressive_lenses || false,
      antiReflectionLenses: remarks?.anti_reflection_lenses || false,
      antiRadiationLenses: remarks?.anti_radiation_lenses || false,
      underCorrected: remarks?.under_corrected || false,
    },
    retestAfter: prescription.retest_after || '',
    others: prescription.others || '',
    balanceLens: prescription.balance_lens || false,
    id: prescription.id
  };
}

class PrescriptionService {
  // Auto-save prescription with all related data
  async autoSavePrescription(data: PrescriptionData, prescriptionId?: string) {
    try {
      console.log('supabaseService: autoSavePrescription triggered', { data, prescriptionId });
      let prescriptionDataResult;
      
      const prescriptionToSave: Partial<DatabasePrescription> = {
        prescription_no: data.prescriptionNo,
        reference_no: data.referenceNo,
        class: data.class,
        prescribed_by: data.prescribedBy,
        date: data.date || new Date().toISOString().split('T')[0],
        name: data.name,
        title: data.title,
        age: data.age,
        gender: data.gender,
        customer_code: data.customerCode,
        birth_day: data.birthDay || undefined,
        marriage_anniversary: data.marriageAnniversary || undefined,
        address: data.address,
        city: data.city,
        state: data.state,
        pin_code: data.pinCode,
        phone_landline: data.phoneLandline,
        mobile_no: data.mobileNo,
        email: data.email,
        ipd: data.ipd,
        retest_after: data.retestAfter || undefined,
        others: data.others,
        balance_lens: data.balanceLens,
      };

      if (prescriptionId) {
        // Update existing prescription
         const { data: updatedPrescription, error: prescriptionError } = await supabase
          .from('prescriptions')
          .update({ ...prescriptionToSave, updated_at: new Date().toISOString() })
          .eq('id', prescriptionId)
          .select()
          .single();

        if (prescriptionError) throw prescriptionError;
        prescriptionDataResult = updatedPrescription;
      } else {
        // Create new prescription
         const { data: newPrescription, error: prescriptionError } = await supabase
          .from('prescriptions')
          .insert({ ...prescriptionToSave, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .select()
          .single();

        if (prescriptionError) throw prescriptionError;
        prescriptionDataResult = newPrescription;
      }

      // Save eye prescriptions
      const eyePrescriptionsToSave = [
        {
          prescription_id: prescriptionDataResult.id,
          eye_type: 'right',
          vision_type: 'dv',
          sph: data.rightEye.dv.sph,
          cyl: data.rightEye.dv.cyl,
          ax: data.rightEye.dv.ax,
          add_power: data.rightEye.dv.add,
          vn: data.rightEye.dv.vn,
          rpd: data.rightEye.dv.rpd,
          spherical_equivalent: (parseFloat(data.rightEye.dv.sph || '0') + parseFloat(data.rightEye.dv.cyl || '0') / 2).toFixed(2)
        },
        {
          prescription_id: prescriptionDataResult.id,
          eye_type: 'right',
          vision_type: 'nv',
          sph: data.rightEye.nv.sph,
          cyl: data.rightEye.nv.cyl,
          ax: data.rightEye.nv.ax,
          add_power: data.rightEye.nv.add,
          vn: data.rightEye.nv.vn,
          spherical_equivalent: (parseFloat(data.rightEye.nv.sph || '0') + parseFloat(data.rightEye.nv.cyl || '0') / 2).toFixed(2)
        },
        {
          prescription_id: prescriptionDataResult.id,
          eye_type: 'left',
          vision_type: 'dv',
          sph: data.leftEye.dv.sph,
          cyl: data.leftEye.dv.cyl,
          ax: data.leftEye.dv.ax,
          add_power: data.leftEye.dv.add,
          vn: data.leftEye.dv.vn,
          lpd: data.leftEye.dv.lpd,
          spherical_equivalent: (parseFloat(data.leftEye.dv.sph || '0') + parseFloat(data.leftEye.dv.cyl || '0') / 2).toFixed(2)
        },
        {
          prescription_id: prescriptionDataResult.id,
          eye_type: 'left',
          vision_type: 'nv',
          sph: data.leftEye.nv.sph,
          cyl: data.leftEye.nv.cyl,
          ax: data.leftEye.nv.ax,
          add_power: data.leftEye.nv.add,
          vn: data.leftEye.nv.vn,
          spherical_equivalent: (parseFloat(data.leftEye.nv.sph || '0') + parseFloat(data.leftEye.nv.cyl || '0') / 2).toFixed(2)
        }
      ].filter(ep => ep.sph || ep.cyl || ep.ax || ep.add_power || ep.vn || ep.rpd || ep.lpd);

      // Delete existing eye prescriptions if updating
      if (prescriptionId) {
        const { error: deleteError } = await supabase
          .from('eye_prescriptions')
          .delete()
          .eq('prescription_id', prescriptionId);

        if (deleteError) throw deleteError;
      }

      // Insert new eye prescriptions if there are any to save
       if (eyePrescriptionsToSave.length > 0) {
        const { error: eyeError } = await supabase
          .from('eye_prescriptions')
          .insert(eyePrescriptionsToSave as any);

        if (eyeError) throw eyeError;
       }

      // Save remarks
      const remarksToSave = {
        prescription_id: prescriptionDataResult.id,
        for_constant_use: data.remarks.forConstantUse,
        for_distance_vision_only: data.remarks.forDistanceVisionOnly,
        for_near_vision_only: data.remarks.forNearVisionOnly,
        separate_glasses: data.remarks.separateGlasses,
        bi_focal_lenses: data.remarks.biFocalLenses,
        progressive_lenses: data.remarks.progressiveLenses,
        anti_reflection_lenses: data.remarks.antiReflectionLenses,
        anti_radiation_lenses: data.remarks.antiRadiationLenses,
        under_corrected: data.remarks.underCorrected
      };

      if (prescriptionId) {
        // Update existing remarks
        const { error: remarksError } = await supabase
          .from('prescription_remarks')
          .update(remarksToSave)
          .eq('prescription_id', prescriptionId);

        if (remarksError) throw remarksError;
      } else {
        // Insert new remarks
        const { error: remarksError } = await supabase
          .from('prescription_remarks')
          .insert(remarksToSave);

        if (remarksError) throw remarksError;
      }

      return {
        success: true,
        data: {
          id: prescriptionDataResult.id,
          ...prescriptionDataResult
        }
      };
    } catch (error) {
      console.error('Error auto-saving prescription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Auto-save failed'
      };
    }
  }

  // Get prescription by ID with all related data
  async getPrescription(prescriptionId: string) {
    try {
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('id', prescriptionId)
        .single();

      if (prescriptionError) throw prescriptionError;

      const { data: eyePrescriptions, error: eyeError } = await supabase
        .from('eye_prescriptions')
        .select('*')
        .eq('prescription_id', prescriptionId);

      if (eyeError) throw eyeError;

      const { data: remarks, error: remarksError } = await supabase
        .from('prescription_remarks')
        .select('*')
        .eq('prescription_id', prescriptionId)
        .single();

      if (remarksError) throw remarksError;

      return { success: true, data: { prescription, eyePrescriptions, remarks } };
    } catch (error) {
      console.error('Error fetching prescription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  }

  // Search prescriptions by number (Prescription No. or Reference No.)
  async searchPrescriptionsByNumber(searchQuery: string) {
    try {
      // Escape special characters in the search query for LIKE pattern matching
      const escapedQuery = searchQuery.replace(/[_%]/g, '\$&');

      const { data, error } = await supabase
        .from('prescriptions')
        .select(
          `
          *,
          eye_prescriptions (*),
          prescription_remarks (*)
        `
        )
        .or(`prescription_no.ilike.${escapedQuery},reference_no.ilike.${escapedQuery}`)
        .limit(1); // Limit to 1 since prescription_no is unique

      if (error) throw error;

      if (data && data.length > 0) {
        // Assuming only one result due to unique prescription_no
        const rawData = data[0];
        const formattedData = mapDatabaseToPrescriptionData({
          prescription: rawData,
          eyePrescriptions: rawData.eye_prescriptions,
          remarks: rawData.prescription_remarks
        });
        return { success: true, data: formattedData };
      } else {
        return { success: true, data: null, message: 'No prescription found' };
      }
    } catch (error) {
      console.error('Error searching prescriptions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Search failed' };
    }
  }

  // Search prescriptions
  async searchPrescriptions(searchQuery: string) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,prescription_no.ilike.%${searchQuery}%,mobile_no.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error searching prescriptions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Search failed' };
    }
  }

  // Helper methods
  private parseNumber(value: string | undefined): number | null {
    if (!value || value === '') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  private hasEyeData(eyeData: any): boolean {
    return eyeData.sph || eyeData.cyl || eyeData.ax || eyeData.add || eyeData.vn;
  }
}

export const prescriptionService = new PrescriptionService();