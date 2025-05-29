import React, { useState, useRef, useEffect } from 'react';
import PrescriptionForm from './PrescriptionForm';
import { PrescriptionData } from '../../types';
import ToastNotification from '../ui/ToastNotification';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { supabase } from '../../utils/supabaseClient';
import { prescriptionService } from '../../Services/supabaseService';

// Interface for search suggestions based on API response
interface SearchSuggestion extends PrescriptionData {
  id: string;
}

const PrescriptionPage: React.FC = () => {
  // Reference for search timeout
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [activeField, setActiveField] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  // Handle clicks outside the suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current && 
        !suggestionRef.current.contains(event.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [formData, setFormData] = useState<PrescriptionData>({
    prescriptionNo: '',
    referenceNo: '',
    class: '',
    prescribedBy: '',
    date: new Date().toISOString().split('T')[0],
    name: '',
    title: 'Mr.',
    age: '',
    gender: 'Male',
    customerCode: '',
    birthDay: '',
    marriageAnniversary: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    phoneLandline: '',
    mobileNo: '',
    email: '',
    ipd: '',
    rightEye: {
      dv: { sph: '', cyl: '', ax: '', add: '', vn: '', rpd: '' },
      nv: { sph: '', cyl: '', ax: '', add: '', vn: '' }
    },
    leftEye: {
      dv: { sph: '', cyl: '', ax: '', add: '', vn: '', lpd: '' },
      nv: { sph: '', cyl: '', ax: '', add: '', vn: '' }
    },
    remarks: {
      forConstantUse: false,
      forDistanceVisionOnly: false,
      forNearVisionOnly: false,
      separateGlasses: false,
      biFocalLenses: false,
      progressiveLenses: false,
      antiReflectionLenses: false,
      antiRadiationLenses: false,
      underCorrected: false
    },
    retestAfter: '',
    others: '',
    balanceLens: false
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Use separate callback handlers for auto-save and manual save
  const showSuccessToast = () => {
    setToastMessage('Prescription saved successfully');
    setToastType('success');
    setShowToast(true);
  };

  const showErrorToast = (error: string) => {
    setToastMessage(`Error saving prescription: ${error}`);
    setToastType('error');
    setShowToast(true);
  };
  
  // Search functionality
  const searchPrescriptions = (query: string, field: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous timeout if it exists
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Define the column to search based on the field
        let column = '';
        switch (field) {
          case 'prescriptionNo': column = 'prescription_no'; break;
          case 'referenceNo': column = 'reference_no'; break;
          case 'name': column = 'name'; break;
          case 'mobileNo': column = 'mobile_no'; break;
          default: return; // Don't search for other fields
        }

        console.log(`Searching for ${column} containing: ${query}`);
        
        // Simplify query to match the pattern used in OrderCardForm
        console.log(`Executing query for ${column}=${query}`);
        
        // Create a simpler selection string to avoid formatting issues
        const selectString = '*,eye_prescriptions(id,prescription_id,eye_type,vision_type,sph,cyl,ax,add_power,vn,rpd,lpd),prescription_remarks(*)'; 
        
        // Try exact match first
        let { data, error } = await supabase
          .from('prescriptions')
          .select(selectString)
          .eq(column, query)
          .limit(5);
          
        // If no exact matches, try partial match for name/mobile
        if ((!data || data.length === 0) && (column === 'name' || column === 'mobile_no')) {
          console.log(`No exact matches, trying partial match for: ${query}`);
          const result = await supabase
            .from('prescriptions')
            .select(selectString)
            .ilike(column, `%${query}%`)
            .limit(5);
            
          data = result.data;
          error = result.error;
        }
          
        if (error) {
          console.error('Supabase search error:', error);
          setToastMessage(`Search failed: ${error.message}`);
          setToastType('error');
          setShowToast(true);
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }
        
        if (!data || data.length === 0) {
          console.log('No search results found');
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }
          
        console.log('Search results:', data);
      
        // Helper function to find eye prescription data
        const findEyeData = (eyeType: string, visionType: string, field: string, defaultValue: string = '') => {
          const eyePrescriptions = data?.[0]?.eye_prescriptions || [];
          
          // Convert to lowercase and handle potential differences in field naming
          const prescription = eyePrescriptions.find((ep: any) => {
            // Check for various field name possibilities
            const recordEyeType = ep.eye_type || ep.eyeType || ep.eye;
            const recordVisionType = ep.vision_type || ep.visionType || ep.type;
            
            // Map vision types from UI format to database format
            const visionTypeMap: {[key: string]: string[]} = {
              'dv': ['distance', 'dv', 'distance_vision'],
              'nv': ['near', 'nv', 'near_vision']
            };
            
            // Check if eye type matches
            const eyeTypeMatches = String(recordEyeType).toLowerCase() === eyeType.toLowerCase();
            
            // Check if vision type matches any of the possible formats
            let visionTypeMatches = false;
            if (visionType in visionTypeMap) {
              visionTypeMatches = visionTypeMap[visionType].includes(String(recordVisionType).toLowerCase());
            } else {
              visionTypeMatches = String(recordVisionType).toLowerCase() === visionType.toLowerCase();
            }
            
            return eyeTypeMatches && visionTypeMatches;
          });
          
          // If we found a matching prescription, extract the requested field
          if (prescription) {
            // Handle field name variations
            let fieldValue = null;
            
            // Map UI field names to possible database field names
            const fieldMappings: {[key: string]: string[]} = {
              'sph': ['sph', 'sphere'],
              'cyl': ['cyl', 'cylinder'],
              'ax': ['ax', 'axis'],
              'add': ['add_power', 'add', 'addition'],  // Note: Database uses add_power but UI uses add
              'vn': ['vn', 'visual_acuity', 'va'],
              'rpd': ['rpd', 'right_pd', 'pupillary_distance_right'],
              'lpd': ['lpd', 'left_pd', 'pupillary_distance_left']
            };
            
            // Try all possible field name variations
            if (field in fieldMappings) {
              for (const possibleField of fieldMappings[field]) {
                if (prescription[possibleField] !== undefined) {
                  fieldValue = prescription[possibleField];
                  break;
                }
              }
            } else {
              // If not in our mappings, try direct access
              fieldValue = prescription[field];
            }
            
            return fieldValue !== null && fieldValue !== undefined ? String(fieldValue) : defaultValue;
          }
          
          return defaultValue;
        };

        // Helper function to check if a remark type exists
        const hasRemarkType = (remarkType: string) => {
          const remarks = data?.[0]?.prescription_remarks || [];
          if (remarks.length === 0) return false;
          
          // Convert remarkType from camelCase to snake_case for database field comparison
          const dbField = remarkType.replace(/([A-Z])/g, '_$1').toLowerCase();
          return remarks[0][dbField] === true;
        };

        // Transform database results to match your interface
        const transformedData: SearchSuggestion[] = data.map((item: any) => {
          return {
            id: item.id,
            prescriptionNo: item.prescription_no || '',
            referenceNo: item.reference_no || '',
            class: item.class || '',
            prescribedBy: item.prescribed_by || '',
            date: item.date || '',
            name: item.name || '',
            title: item.title || 'Mr.',
            age: item.age || '',
            gender: item.gender || 'Male',
            customerCode: item.customer_code || '',
            birthDay: item.birth_day || '',
            marriageAnniversary: item.marriage_anniversary || '',
            address: item.address || '',
            city: item.city || '',
            state: item.state || '',
            pinCode: item.pin_code || '',
            phoneLandline: item.phone_landline || '',
            mobileNo: item.mobile_no || '',
            email: item.email || '',
            ipd: item.ipd || '',
            rightEye: {
              dv: {
                sph: findEyeData('right', 'dv', 'sph'),
                cyl: findEyeData('right', 'dv', 'cyl'),
                ax: findEyeData('right', 'dv', 'ax'),
                add: findEyeData('right', 'dv', 'add'),
                vn: findEyeData('right', 'dv', 'vn'),
                rpd: findEyeData('right', 'dv', 'rpd')
              },
              nv: {
                sph: findEyeData('right', 'nv', 'sph'),
                cyl: findEyeData('right', 'nv', 'cyl'),
                ax: findEyeData('right', 'nv', 'ax'),
                add: findEyeData('right', 'nv', 'add'),
                vn: findEyeData('right', 'nv', 'vn')
              }
            },
            leftEye: {
              dv: {
                sph: findEyeData('left', 'dv', 'sph'),
                cyl: findEyeData('left', 'dv', 'cyl'),
                ax: findEyeData('left', 'dv', 'ax'),
                add: findEyeData('left', 'dv', 'add'),
                vn: findEyeData('left', 'dv', 'vn'),
                lpd: findEyeData('left', 'dv', 'lpd')
              },
              nv: {
                sph: findEyeData('left', 'nv', 'sph'),
                cyl: findEyeData('left', 'nv', 'cyl'),
                ax: findEyeData('left', 'nv', 'ax'),
                add: findEyeData('left', 'nv', 'add'),
                vn: findEyeData('left', 'nv', 'vn')
              }
            },
            remarks: {
              forConstantUse: hasRemarkType('forConstantUse'),
              forDistanceVisionOnly: hasRemarkType('forDistanceVisionOnly'),
              forNearVisionOnly: hasRemarkType('forNearVisionOnly'),
              separateGlasses: hasRemarkType('separateGlasses'),
              biFocalLenses: hasRemarkType('biFocalLenses'),
              progressiveLenses: hasRemarkType('progressiveLenses'),
              antiReflectionLenses: hasRemarkType('antiReflectionLenses'),
              antiRadiationLenses: hasRemarkType('antiRadiationLenses'),
              underCorrected: hasRemarkType('underCorrected')
            },
            retestAfter: item.retest_after || '',
            others: item.others || '',
            balanceLens: item.balance_lens || false
          };
        });

        console.log('Transformed suggestions:', transformedData);
        setSuggestions(transformedData);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error during search:', error);
        setToastMessage(`Search error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setToastType('error');
        setShowToast(true);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce time: 300ms
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchTerm(value);
    setActiveField(name);
    searchPrescriptions(value, name);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    console.log('Selected suggestion raw data:', suggestion);
    
    // Create a deep clone of the suggestion to avoid mutation issues
    const processedSuggestion = {
      ...suggestion,
      // Format dates properly - ensure they're valid or empty strings
      birthDay: suggestion.birthDay || '',
      marriageAnniversary: suggestion.marriageAnniversary || '',
      date: suggestion.date || '',
      retestAfter: suggestion.retestAfter || '',
      
      // Explicitly map eye prescription data to ensure proper field mapping
      rightEye: {
        dv: {
          sph: suggestion.rightEye?.dv?.sph || '',
          cyl: suggestion.rightEye?.dv?.cyl || '',
          ax: suggestion.rightEye?.dv?.ax || '',
          add: suggestion.rightEye?.dv?.add || '', // Handle add_power vs add
          vn: suggestion.rightEye?.dv?.vn || '',
          rpd: suggestion.rightEye?.dv?.rpd || ''
        },
        nv: {
          sph: suggestion.rightEye?.nv?.sph || '',
          cyl: suggestion.rightEye?.nv?.cyl || '',
          ax: suggestion.rightEye?.nv?.ax || '',
          add: suggestion.rightEye?.nv?.add || '', // Handle add_power vs add
          vn: suggestion.rightEye?.nv?.vn || ''
        }
      },
      leftEye: {
        dv: {
          sph: suggestion.leftEye?.dv?.sph || '',
          cyl: suggestion.leftEye?.dv?.cyl || '',
          ax: suggestion.leftEye?.dv?.ax || '',
          add: suggestion.leftEye?.dv?.add || '', // Handle add_power vs add
          vn: suggestion.leftEye?.dv?.vn || '',
          lpd: suggestion.leftEye?.dv?.lpd || ''
        },
        nv: {
          sph: suggestion.leftEye?.nv?.sph || '',
          cyl: suggestion.leftEye?.nv?.cyl || '',
          ax: suggestion.leftEye?.nv?.ax || '',
          add: suggestion.leftEye?.nv?.add || '', // Handle add_power vs add
          vn: suggestion.leftEye?.nv?.vn || ''
        }
      },
      
      // Ensure remarks are properly mapped
      remarks: {
        forConstantUse: suggestion.remarks?.forConstantUse || false,
        forDistanceVisionOnly: suggestion.remarks?.forDistanceVisionOnly || false,
        forNearVisionOnly: suggestion.remarks?.forNearVisionOnly || false,
        separateGlasses: suggestion.remarks?.separateGlasses || false,
        biFocalLenses: suggestion.remarks?.biFocalLenses || false,
        progressiveLenses: suggestion.remarks?.progressiveLenses || false,
        antiReflectionLenses: suggestion.remarks?.antiReflectionLenses || false,
        antiRadiationLenses: suggestion.remarks?.antiRadiationLenses || false,
        underCorrected: suggestion.remarks?.underCorrected || false
      },
      
      // Make sure balanceLens is properly cast to boolean
      balanceLens: !!suggestion.balanceLens
    };
    
    console.log('Processed suggestion for form:', processedSuggestion);
    setFormData(processedSuggestion);
    setShowSuggestions(false);
    setSearchTerm('');
  };

  // Track saving state
  const [isSaving, setIsSaving] = useState(false);
  
  // Manual save function
  const savePrescription = async (data: PrescriptionData) => {
    setIsSaving(true);
    try {
      const result = await prescriptionService.autoSavePrescription(data);
      if (result.success) {
        showSuccessToast();
        return result;
      } else {
        showErrorToast(result.error || 'Unknown error');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error saving prescription';
      showErrorToast(errorMessage);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (data: PrescriptionData) => {
    console.log('PrescriptionPage: handleSubmit triggered', data);
    setFormData(data);
    
    // Save the prescription manually (only when the Add Prescription button is clicked)
    await savePrescription(data);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Prescription Entry Form</h2>
      
      {/* Search Section */}
      <Card className="mb-4">
        <div className="grid grid-cols-4 gap-4 mb-4" ref={searchRef}>
          <div>
            <Input
              label="Search by Prescription No"
              name="prescriptionNo"
              value={activeField === 'prescriptionNo' ? searchTerm : ''}
              onChange={handleSearchInputChange}
              placeholder="Enter prescription number"
            />
          </div>
          <div>
            <Input
              label="Search by Reference No"
              name="referenceNo"
              value={activeField === 'referenceNo' ? searchTerm : ''}
              onChange={handleSearchInputChange}
              placeholder="Enter reference number"
            />
          </div>
          <div>
            <Input
              label="Search by Name"
              name="name"
              value={activeField === 'name' ? searchTerm : ''}
              onChange={handleSearchInputChange}
              placeholder="Enter patient name"
            />
          </div>
          <div>
            <Input
              label="Search by Mobile No"
              name="mobileNo"
              value={activeField === 'mobileNo' ? searchTerm : ''}
              onChange={handleSearchInputChange}
              placeholder="Enter mobile number"
            />
          </div>
        </div>
        
        {/* Search suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            className="absolute z-50 w-full md:w-1/2 bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
            ref={suggestionRef}
          >
            <ul className="py-1">
              {suggestions.map((suggestion) => (
                <li 
                  key={suggestion.id} 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{suggestion.name}</span>
                    <span className="text-sm text-gray-500">{suggestion.prescriptionNo}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {suggestion.mobileNo && <span className="mr-2">📱 {suggestion.mobileNo}</span>}
                    {suggestion.date && <span>📅 {suggestion.date}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      
      <PrescriptionForm onSubmit={handleSubmit} initialData={formData} />
      {showToast && (
        <ToastNotification
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow">
          Saving...
        </div>
      )}
    </div>
  );
};

export default PrescriptionPage;