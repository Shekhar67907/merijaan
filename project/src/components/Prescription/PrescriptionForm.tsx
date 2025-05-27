import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import RadioGroup from '../ui/RadioGroup';
import Button from '../ui/Button';
import { 
  PrescriptionData, 
  Option,
  EyeData,
  VisualAcuity
} from '../../types';
import { 
  generatePrescriptionNo, 
  calculateIPD, 
  formatNumericInput,
  getTodayDate,
  getNextMonthDate,
  titleOptions,
  classOptions,
  prescribedByOptions
} from '../../utils/helpers';
import {
  validateNumericField,
  calculateNearVisionSph,
  validateAndFormatVn,
  calculateTotalPD,
  validatePrescriptionData,
  formatPrescriptionNumber,
  handleSpecialCases,
  calculateSphericalEquivalent,
  checkHighPrescription
} from '../../utils/prescriptionUtils';
import { PRESCRIPTION_RANGES } from '../types';

interface PrescriptionFormProps {
  onSubmit: (data: PrescriptionData) => void;
}

const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<PrescriptionData>({
    prescriptionNo: generatePrescriptionNo(),
    referenceNo: '',
    class: '',
    prescribedBy: '',
    date: getTodayDate(),
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
    retestAfter: getNextMonthDate(),
    others: '',
    balanceLens: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Add new states for warnings and VA status
  const [warnings, setWarnings] = useState<{
    rightEye: string[],
    leftEye: string[]
  }>({
    rightEye: [],
    leftEye: []
  });

  const [vaStatus, setVaStatus] = useState<{
    rightEye: VisualAcuity | null,
    leftEye: VisualAcuity | null
  }>({
    rightEye: null,
    leftEye: null
  });

  useEffect(() => {
    // Set reference number same as prescription number initially
    if (!formData.referenceNo) {
      setFormData(prev => ({ ...prev, referenceNo: prev.prescriptionNo }));
    }
    
    // Calculate IPD from RPD and LPD
    const calculatedIPD = calculateIPD(formData.rightEye.dv.rpd, formData.leftEye.dv.lpd);
    if (calculatedIPD) {
      setFormData(prev => ({ ...prev, ipd: calculatedIPD }));
    }
    
    // Copy DV values to NV for both eyes if NV values are empty
    if (formData.rightEye.dv.sph && !formData.rightEye.nv.sph) {
      setFormData(prev => ({
        ...prev,
        rightEye: {
          ...prev.rightEye,
          nv: { ...prev.rightEye.dv, rpd: prev.rightEye.dv.rpd }
        }
      }));
    }
    
    if (formData.leftEye.dv.sph && !formData.leftEye.nv.sph) {
      setFormData(prev => ({
        ...prev,
        leftEye: {
          ...prev.leftEye,
          nv: { ...prev.leftEye.dv, lpd: prev.leftEye.dv.lpd }
        }
      }));
    }
    
    // Balance lens functionality - copy right eye values to left eye
    if (formData.balanceLens) {
      setFormData(prev => ({
        ...prev,
        leftEye: {
          dv: {
            ...prev.rightEye.dv,
            lpd: prev.leftEye.dv.lpd // Keep original LPD
          },
          nv: { ...prev.rightEye.nv }
        }
      }));
    }
  }, [formData.referenceNo, formData.rightEye.dv, formData.leftEye.dv, formData.balanceLens]);

  // Effect to handle balance lens functionality
  useEffect(() => {
    if (formData.balanceLens) {
      // Copy right eye values to left eye
      const newLeftEye = {
        dv: {
          ...formData.rightEye.dv,
          lpd: formData.leftEye.dv.lpd // Keep original LPD
        },
        nv: { ...formData.rightEye.nv }
      };

      // Update each field individually to ensure proper state updates
      Object.entries(newLeftEye.dv).forEach(([key, value]) => {
        handleChange({
          target: {
            name: `leftEye.dv.${key}`,
            value: value?.toString() || ''
          }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      Object.entries(newLeftEye.nv).forEach(([key, value]) => {
        handleChange({
          target: {
            name: `leftEye.nv.${key}`,
            value: value?.toString() || ''
          }
        } as React.ChangeEvent<HTMLInputElement>);
      });
    }
  }, [formData.balanceLens, formData.rightEye]);

  // Effect to update spherical equivalent when SPH or CYL changes
  useEffect(() => {
    // Update right eye SE
    const rightDvSe = calculateSphericalEquivalent(formData.rightEye.dv.sph, formData.rightEye.dv.cyl);
    const rightNvSe = calculateSphericalEquivalent(formData.rightEye.nv.sph, formData.rightEye.nv.cyl);
    
    if (rightDvSe !== null) {
      handleChange({
        target: {
          name: 'rightEye.dv.sphericalEquivalent',
          value: rightDvSe.toFixed(2)
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }
    
    if (rightNvSe !== null) {
      handleChange({
        target: {
          name: 'rightEye.nv.sphericalEquivalent',
          value: rightNvSe.toFixed(2)
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }

    // Update left eye SE
    const leftDvSe = calculateSphericalEquivalent(formData.leftEye.dv.sph, formData.leftEye.dv.cyl);
    const leftNvSe = calculateSphericalEquivalent(formData.leftEye.nv.sph, formData.leftEye.nv.cyl);
    
    if (leftDvSe !== null) {
      handleChange({
        target: {
          name: 'leftEye.dv.sphericalEquivalent',
          value: leftDvSe.toFixed(2)
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }
    
    if (leftNvSe !== null) {
      handleChange({
        target: {
          name: 'leftEye.nv.sphericalEquivalent',
          value: leftNvSe.toFixed(2)
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [
    formData.rightEye.dv.sph,
    formData.rightEye.dv.cyl,
    formData.rightEye.nv.sph,
    formData.rightEye.nv.cyl,
    formData.leftEye.dv.sph,
    formData.leftEye.dv.cyl,
    formData.leftEye.nv.sph,
    formData.leftEye.nv.cyl
  ]);

  // Effect to check for high prescription values
  useEffect(() => {
    const rightEyeWarnings = checkHighPrescription(
      formData.rightEye.dv.sph,
      formData.rightEye.dv.cyl
    ).warnings;

    const leftEyeWarnings = checkHighPrescription(
      formData.leftEye.dv.sph,
      formData.leftEye.dv.cyl
    ).warnings;

    setWarnings({
      rightEye: rightEyeWarnings,
      leftEye: leftEyeWarnings
    });
  }, [
    formData.rightEye.dv.sph,
    formData.rightEye.dv.cyl,
    formData.leftEye.dv.sph,
    formData.leftEye.dv.cyl
  ]);

  // Effect to update visual acuity status
  useEffect(() => {
    const rightVa = validateAndFormatVn(formData.rightEye.dv.vn);
    const leftVa = validateAndFormatVn(formData.leftEye.dv.vn);

    setVaStatus({
      rightEye: rightVa,
      leftEye: leftVa
    });
  }, [formData.rightEye.dv.vn, formData.leftEye.dv.vn]);

  // Effect to initialize Vn fields
  useEffect(() => {
    // Initialize D.V Vn fields with "6/" if empty
    (['rightEye', 'leftEye'] as const).forEach(eye => {
      if (!formData[eye].dv.vn) {
        handleChange({
          target: {
            name: `${eye}.dv.vn`,
            value: '6/'
          }
        } as React.ChangeEvent<HTMLInputElement>);
      }
      // Initialize N.V Vn fields with "N" if empty
      if (!formData[eye].nv.vn) {
        handleChange({
          target: {
            name: `${eye}.nv.vn`,
            value: 'N'
          }
        } as React.ChangeEvent<HTMLInputElement>);
      }
    });
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate required fields
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.mobileNo) newErrors.mobileNo = "Mobile number is required";
    if (!formData.prescribedBy) newErrors.prescribedBy = "Prescribed by is required";
    
    // Validate right eye prescription
    const rightEyeErrors = validatePrescriptionData(formData.rightEye.dv, false);
    rightEyeErrors.forEach(error => {
      newErrors[`rightEye.dv.${error.field}`] = error.message;
    });

    // Validate left eye prescription
    const leftEyeErrors = validatePrescriptionData(formData.leftEye.dv, formData.balanceLens);
    leftEyeErrors.forEach(error => {
      newErrors[`leftEye.dv.${error.field}`] = error.message;
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof PrescriptionData] as object),
          [child]: grandchild 
            ? { 
                ...(prev[parent as keyof PrescriptionData] as any)[child],
                [grandchild]: value 
              }
            : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when field is filled
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof PrescriptionData] as object),
          [child]: checked,
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: checked }));
    }
  };

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [eye, row, field] = name.split('.');
    
    // Format the value according to field type
    let formattedValue = value;
    if (['sph', 'cyl'].includes(field)) {
      formattedValue = formatPrescriptionNumber(value, field.toUpperCase() as keyof typeof PRESCRIPTION_RANGES);
    } else if (field === 'add') {
      formattedValue = formatPrescriptionNumber(value, 'ADD');
    } else if (['rpd', 'lpd'].includes(field)) {
      formattedValue = formatPrescriptionNumber(value, 'PD');
    }

    // Update the form data
    setFormData(prev => {
      const newData = { ...prev };
      newData[eye as 'rightEye' | 'leftEye'][row as 'dv' | 'nv'][field] = formattedValue;

      // Handle special cases
      if (row === 'dv') {
        // Auto-calculate NV Sph when DV Sph and Add are present
        if (field === 'sph' || field === 'add') {
          const dvSph = field === 'sph' ? formattedValue : prev[eye as 'rightEye' | 'leftEye'].dv.sph;
          const add = field === 'add' ? formattedValue : prev[eye as 'rightEye' | 'leftEye'].dv.add;
          const nvSph = calculateNearVisionSph(dvSph, add);
          if (nvSph) {
            newData[eye as 'rightEye' | 'leftEye'].nv.sph = nvSph;
          }
        }

        // Copy CYL and AXIS to NV row when they change in DV
        if (field === 'cyl' || field === 'ax') {
          newData[eye as 'rightEye' | 'leftEye'].nv[field] = formattedValue;
        }
      }

      // Handle balance lens
      if (prev.balanceLens && eye === 'leftEye') {
        newData.leftEye = {
          dv: { ...prev.rightEye.dv, lpd: prev.leftEye.dv.lpd },
          nv: { ...prev.rightEye.nv }
        };
      }

      // Calculate total IPD when RPD or LPD changes
      if (field === 'rpd' || field === 'lpd') {
        const rpd = field === 'rpd' ? formattedValue : prev.rightEye.dv.rpd;
        const lpd = field === 'lpd' ? formattedValue : prev.leftEye.dv.lpd;
        const totalPD = calculateTotalPD(rpd, lpd);
        if (totalPD) {
          newData.ipd = totalPD;
        }
      }

      // Apply special case handling
      newData[eye as 'rightEye' | 'leftEye'][row as 'dv' | 'nv'] = 
        handleSpecialCases(newData[eye as 'rightEye' | 'leftEye'][row as 'dv' | 'nv']);

      return newData;
    });

    // Validate the new value
    const error = validateNumericField(formattedValue, field.toUpperCase() as keyof typeof PRESCRIPTION_RANGES);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error.message }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle Vn field changes
  const handleVnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    let value = input.value;
    const [eye, row] = input.name.split('.');

    // Handle N.V row differently - always set to "N" and make read-only
    if (input.name.includes('.nv.vn')) {
      handleChange({
        ...e,
        target: {
          ...e.target,
          value: 'N'
        }
      });
      return;
    }

    // Handle D.V row
    if (input.name.includes('.dv.vn')) {
      // Remove any non-numeric characters except '/' and '6'
      value = value.replace(/[^0-9/6]/g, '');

      // If value doesn't start with 6/, add it
      if (!value.startsWith('6/')) {
        // If user is typing a number directly, prepend 6/
        if (/^\d+$/.test(value)) {
          value = `6/${value}`;
        } else {
          value = '6/';
        }
      }

      // Create a new event with the modified value
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          value
        }
      };

      handleChange(newEvent);

      // Update VA status if we have a complete value
      if (value.length > 2) {
        const prescriptionData = {
          sph: formData[eye as 'rightEye' | 'leftEye'].dv.sph,
          cyl: formData[eye as 'rightEye' | 'leftEye'].dv.cyl,
          age: formData.age
        };

        const vaResult = validateAndFormatVn(value, prescriptionData);
        if (vaResult) {
          setVaStatus(prev => ({
            ...prev,
            [eye]: vaResult
          }));
        }
      }
    }
  };

  // Handle Vn field focus
  const handleVnFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    
    // Handle N.V row - always set to "N" and make read-only
    if (input.name.includes('.nv.vn')) {
      if (!input.value) {
        handleChange({
          ...e,
          target: {
            ...e.target,
            value: 'N'
          }
        });
      }
      return;
    }

    // Handle D.V row
    if (input.name.includes('.dv.vn')) {
      if (!input.value || !input.value.startsWith('6/')) {
        handleChange({
          ...e,
          target: {
            ...e.target,
            value: '6/'
          }
        });
      }
    }
  };

  // Handle Vn field keydown
  const handleVnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    
    // For N.V row, prevent any changes
    if (input.name.includes('.nv.vn')) {
      e.preventDefault();
      return;
    }

    // For D.V row, allow only numbers and control keys
    if (input.name.includes('.dv.vn')) {
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
      }
    }
  };

  // Calculate the division result for Vn field
  const calculateVnDivision = (value: string): string => {
    if (!value.startsWith('6/')) return value;
    const denominator = value.substring(2);
    if (!denominator || denominator === '0') return value;
    
    const result = 6 / parseInt(denominator, 10);
    // Only show division result if it's a clean number
    if (Number.isInteger(result)) {
      return `6/${denominator} (${result})`;
    }
    return value;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      
      // Reset form or show success message
      alert(`Prescription ${formData.prescriptionNo} added successfully!`);
      
      // Generate new prescription number for next entry
      setFormData(prev => ({
        ...prev,
        prescriptionNo: generatePrescriptionNo(),
        referenceNo: ''
      }));
    }
  };

  const handleClear = () => {
    const newPrescriptionNo = generatePrescriptionNo();
    
    setFormData({
      prescriptionNo: newPrescriptionNo,
      referenceNo: newPrescriptionNo,
      class: '',
      prescribedBy: '',
      date: getTodayDate(),
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
      retestAfter: getNextMonthDate(),
      others: '',
      balanceLens: false
    });
    
    setErrors({});
  };

  return (
    <form onSubmit={handleFormSubmit} className="max-w-6xl mx-auto">
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <Button type="button" variant="outline" size="sm">
            &lt;&lt; Consultation Fee &gt;&gt;
          </Button>
          
          <div className="flex space-x-2">
            <Button type="button" variant="outline" size="sm">
              &lt;&lt; First
            </Button>
            <Button type="button" variant="outline" size="sm">
              &lt; Prev
            </Button>
            <Button type="button" variant="outline" size="sm">
              Next &gt;
            </Button>
            <Button type="button" variant="outline" size="sm">
              Last &gt;&gt;
            </Button>
          </div>
          
          <Button type="button" variant="outline" size="sm">
            &lt;&lt; Display Prescription History &gt;&gt;
          </Button>
        </div>
        
        {/* Header Section */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <Input 
              label="Prescription No.:" 
              value={formData.prescriptionNo} 
              onChange={handleChange}
              name="prescriptionNo"
              readOnly
            />
          </div>
          <div>
            <Input 
              label="Reference No.:" 
              value={formData.referenceNo} 
              onChange={handleChange}
              name="referenceNo"
            />
          </div>
          <div>
            <Select 
              label="Class:" 
              options={classOptions}
              value={formData.class} 
              onChange={handleChange}
              name="class"
            />
          </div>
          <div>
            <Select 
              label="Prescribed By:" 
              options={prescribedByOptions}
              value={formData.prescribedBy} 
              onChange={handleChange}
              name="prescribedBy"
              required
              error={errors.prescribedBy}
            />
          </div>
          <div>
            <Input 
              label="Date:" 
              type="date"
              value={formData.date} 
              onChange={handleChange}
              name="date"
            />
          </div>
        </div>
        
        {/* Personal Information Section */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2 border-b pb-1">
            Personal Information (Customer's Personal Information Can Only Be Edited Through Customer Master Form)
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Select 
                label="Title"
                options={titleOptions}
                value={formData.title} 
                onChange={handleChange}
                name="title"
                className="w-24"
                fullWidth={false}
              />
              <Input 
                label="Name" 
                value={formData.name} 
                onChange={handleChange}
                name="name"
                required
                error={errors.name}
              />
            </div>
            <div>
              <Input 
                label="Age" 
                type="number"
                value={formData.age} 
                onChange={handleChange}
                name="age"
              />
            </div>
            <div>
              <Input 
                label="Customer Code:" 
                value={formData.customerCode} 
                onChange={handleChange}
                name="customerCode"
              />
            </div>
            
            <div>
              <RadioGroup
                label="Gender"
                name="gender"
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' }
                ]}
                value={formData.gender}
                onChange={handleChange}
              />
            </div>
            <div>
              <Input 
                label="Birth Day:" 
                type="date"
                value={formData.birthDay} 
                onChange={handleChange}
                name="birthDay"
              />
            </div>
            <div>
              <Input 
                label="Marr Anniv:" 
                type="date"
                value={formData.marriageAnniversary} 
                onChange={handleChange}
                name="marriageAnniversary"
              />
            </div>
            
            <div className="col-span-3">
              <Input 
                label="Address" 
                value={formData.address} 
                onChange={handleChange}
                name="address"
              />
            </div>
            
            <div>
              <Input 
                label="City" 
                value={formData.city} 
                onChange={handleChange}
                name="city"
              />
            </div>
            <div>
              <Input 
                label="State" 
                value={formData.state} 
                onChange={handleChange}
                name="state"
              />
            </div>
            <div>
              <Input 
                label="IPD:" 
                value={formData.ipd} 
                onChange={handleNumericInput}
                name="ipd"
                className="text-center"
              />
            </div>
            
            <div>
              <Input 
                label="Phone (L.L.)" 
                value={formData.phoneLandline} 
                onChange={handleChange}
                name="phoneLandline"
              />
            </div>
            <div>
              <Input 
                label="Pin" 
                value={formData.pinCode} 
                onChange={handleChange}
                name="pinCode"
              />
            </div>
            <div className="row-span-2 flex items-center justify-center">
              <div className="bg-gray-200 h-32 w-32 flex items-center justify-center border border-gray-300">
                <span className="text-gray-500 text-sm">Photo</span>
              </div>
            </div>
            
            <div>
              <Input 
                label="Mobile No." 
                value={formData.mobileNo} 
                onChange={handleChange}
                name="mobileNo"
                required
                error={errors.mobileNo}
              />
            </div>
            <div>
              <Input 
                label="Email" 
                type="email"
                value={formData.email} 
                onChange={handleChange}
                name="email"
              />
            </div>
          </div>
        </div>
        
        {/* Prescription Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 text-blue-700">Lens Prescription</h3>
          {/* Display high prescription warnings if any */}
          {(warnings.rightEye.length > 0 || warnings.leftEye.length > 0) && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-medium text-yellow-800 mb-2">High Prescription Warnings:</h4>
              {warnings.rightEye.length > 0 && (
                <div className="mb-2">
                  <span className="font-medium">Right Eye:</span>
                  <ul className="list-disc list-inside ml-4">
                    {warnings.rightEye.map((warning, i) => (
                      <li key={i} className="text-yellow-700">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              {warnings.leftEye.length > 0 && (
                <div>
                  <span className="font-medium">Left Eye:</span>
                  <ul className="list-disc list-inside ml-4">
                    {warnings.leftEye.map((warning, i) => (
                      <li key={i} className="text-yellow-700">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Right Eye */}
            <div className="border p-4 rounded bg-white shadow-sm">
              <h4 className="text-center font-medium mb-2 text-blue-600">
                Right 
                {vaStatus.rightEye && (
                  <span className={`ml-2 text-sm ${
                    vaStatus.rightEye.status === "Normal" ? 'text-green-600' :
                    vaStatus.rightEye.status === "Slightly reduced" ? 'text-yellow-600' :
                    vaStatus.rightEye.status === "Reduced" ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    ({vaStatus.rightEye.status})
                    {vaStatus.rightEye.equivalentValue && 
                      ` - ${vaStatus.rightEye.equivalentValue}`
                    }
                  </span>
                )}
              </h4>
              <table className="w-full border-collapse text-gray-700">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-2 py-1 text-sm"></th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Spherical: Measures nearsightedness (-) or farsightedness (+) in diopters">Sph</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Cylindrical: Corrects astigmatism">Cyl</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Axis: Orientation of astigmatism correction (0-180°)">Ax</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Addition: Extra power for near vision">Add</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Visual Acuity: Expected vision with correction (e.g., 6/6)">Vn</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Right Pupillary Distance in mm">RPD</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Spherical Equivalent">SE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-1 text-sm font-medium text-left">D.V</td>
                    <td className="border border-gray-300 p-1"><Input value={formData.rightEye.dv.sph} name="rightEye.dv.sph" onChange={handleNumericInput} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1"><Input value={formData.rightEye.dv.cyl} name="rightEye.dv.cyl" onChange={handleNumericInput} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1"><Input value={formData.rightEye.dv.ax} name="rightEye.dv.ax" onChange={handleChange} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1"><Input value={formData.rightEye.dv.add} name="rightEye.dv.add" onChange={handleNumericInput} onBlur={(e) => calculateNearVision('rightEye', e)} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1 relative">
                      <Input 
                        value={formData.rightEye.dv.vn} 
                        name="rightEye.dv.vn" 
                        onChange={handleVnChange} 
                        onFocus={handleVnFocus} 
                        onKeyDown={handleVnKeyDown} 
                        className="text-center text-sm"
                        placeholder="6/"
                      />
                      {vaStatus.rightEye?.comparisonToExpected && (
                        <div className={`absolute -bottom-6 left-0 right-0 text-xs px-1 ${
                          vaStatus.rightEye.comparisonToExpected.status === 'Better than expected' ? 'text-green-600' :
                          vaStatus.rightEye.comparisonToExpected.status === 'Worse than expected' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {vaStatus.rightEye.comparisonToExpected.status}
                          {vaStatus.rightEye.comparisonToExpected.recommendation && (
                            <span className="block text-xs text-orange-600">
                              {vaStatus.rightEye.comparisonToExpected.recommendation}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-1"><Input value={formData.rightEye.dv.rpd} name="rightEye.dv.rpd" onChange={handleNumericInput} onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        handleChange({
                          target: {
                            name: e.target.name,
                            value: value.toFixed(1)
                          }
                        } as React.ChangeEvent<HTMLInputElement>);
                      }
                    }} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1 text-sm text-gray-600">{formData.rightEye.dv.sphericalEquivalent || '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-1 text-sm font-medium text-left">N.V</td>
                    <td className="border border-gray-300 p-1"><Input value={formData.rightEye.nv.sph} name="rightEye.nv.sph" onChange={handleNumericInput} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1"><Input value={formData.rightEye.nv.cyl} name="rightEye.nv.cyl" onChange={handleNumericInput} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1"><Input value={formData.rightEye.nv.ax} name="rightEye.nv.ax" onChange={handleChange} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1"><Input value={formData.rightEye.nv.add} name="rightEye.nv.add" onChange={handleNumericInput} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1">
                      <Input 
                        value={formData.rightEye.nv.vn} 
                        name="rightEye.nv.vn" 
                        onChange={handleVnChange}
                        className="text-center text-sm"
                        readOnly
                      />
                    </td>
                    <td className="border border-gray-300 p-1"></td>
                    <td className="border border-gray-300 p-1 text-sm text-gray-600">{formData.rightEye.nv.sphericalEquivalent || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Left Eye */}
            <div className="border p-4 rounded bg-white shadow-sm">
              <h4 className="text-center font-medium mb-2 text-blue-600">
                Left
                {vaStatus.leftEye && (
                  <span className={`ml-2 text-sm ${
                    vaStatus.leftEye.status === "Normal" ? 'text-green-600' :
                    vaStatus.leftEye.status === "Slightly reduced" ? 'text-yellow-600' :
                    vaStatus.leftEye.status === "Reduced" ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    ({vaStatus.leftEye.status})
                    {vaStatus.leftEye.equivalentValue && 
                      ` - ${vaStatus.leftEye.equivalentValue}`
                    }
                  </span>
                )}
              </h4>
              <table className="w-full border-collapse text-gray-700">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-2 py-1 text-sm"></th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Spherical: Measures nearsightedness (-) or farsightedness (+) in diopters">Sph</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Cylindrical: Corrects astigmatism">Cyl</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Axis: Orientation of astigmatism correction (0-180°)">Ax</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Addition: Extra power for near vision">Add</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Visual Acuity: Expected vision with correction (e.g., 6/6)">Vn</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Left Pupillary Distance in mm">LPD</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm" title="Spherical Equivalent">SE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-1 text-sm font-medium text-left">D.V</td>
                    <td className="border border-gray-300 p-1"><Input value={formData.leftEye.dv.sph} name="leftEye.dv.sph" onChange={handleNumericInput} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1"><Input value={formData.leftEye.dv.cyl} name="leftEye.dv.cyl" onChange={handleNumericInput} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1"><Input value={formData.leftEye.dv.ax} name="leftEye.dv.ax" onChange={handleChange} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1"><Input value={formData.leftEye.dv.add} name="leftEye.dv.add" onChange={handleNumericInput} onBlur={(e) => calculateNearVision('leftEye', e)} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1 relative">
                      <Input 
                        value={formData.leftEye.dv.vn} 
                        name="leftEye.dv.vn" 
                        onChange={handleVnChange}
                        onFocus={handleVnFocus}
                        onKeyDown={handleVnKeyDown}
                        className="text-center text-sm"
                        placeholder="6/"
                      />
                      {vaStatus.leftEye?.comparisonToExpected && (
                        <div className={`absolute -bottom-6 left-0 right-0 text-xs px-1 ${
                          vaStatus.leftEye.comparisonToExpected.status === 'Better than expected' ? 'text-green-600' :
                          vaStatus.leftEye.comparisonToExpected.status === 'Worse than expected' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {vaStatus.leftEye.comparisonToExpected.status}
                          {vaStatus.leftEye.comparisonToExpected.recommendation && (
                            <span className="block text-xs text-orange-600">
                              {vaStatus.leftEye.comparisonToExpected.recommendation}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-1"><Input value={formData.leftEye.dv.lpd} name="leftEye.dv.lpd" onChange={handleNumericInput} onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        handleChange({
                          target: {
                            name: e.target.name,
                            value: value.toFixed(1)
                          }
                        } as React.ChangeEvent<HTMLInputElement>);
                      }
                    }} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1 text-sm text-gray-600">{formData.leftEye.dv.sphericalEquivalent || '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-1 text-sm font-medium text-left">N.V</td>
                    <td className="border border-gray-300 p-1"><Input value={formData.leftEye.nv.sph} name="leftEye.nv.sph" onChange={handleNumericInput} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1"><Input value={formData.leftEye.nv.cyl} name="leftEye.nv.cyl" onChange={handleNumericInput} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1"><Input value={formData.leftEye.nv.ax} name="leftEye.nv.ax" onChange={handleChange} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1"><Input value={formData.leftEye.nv.add} name="leftEye.nv.add" onChange={handleNumericInput} className="text-center text-sm" /></td>
                    <td className="border border-gray-300 p-1">
                      <Input 
                        value={formData.leftEye.nv.vn} 
                        name="leftEye.nv.vn" 
                        onChange={handleVnChange}
                        className="text-center text-sm"
                        readOnly
                      />
                    </td>
                    <td className="border border-gray-300 p-1 text-right">
                      <Checkbox 
                        label="BALANCE LENS"
                        checked={formData.balanceLens}
                        onChange={handleCheckboxChange}
                        name="balanceLens"
                      />
                    </td>
                    <td className="border border-gray-300 p-1 text-sm text-gray-600">{formData.leftEye.nv.sphericalEquivalent || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Remarks Section */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Remarks:</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Checkbox 
                label="FOR CONSTANT USE"
                checked={formData.remarks.forConstantUse}
                onChange={handleCheckboxChange}
                name="remarks.forConstantUse"
              />
              <Checkbox 
                label="FOR DISTANCE VISION ONLY"
                checked={formData.remarks.forDistanceVisionOnly}
                onChange={handleCheckboxChange}
                name="remarks.forDistanceVisionOnly"
              />
              <Checkbox 
                label="FOR NEAR VISION ONLY"
                checked={formData.remarks.forNearVisionOnly}
                onChange={handleCheckboxChange}
                name="remarks.forNearVisionOnly"
              />
            </div>
            <div>
              <Checkbox 
                label="SEPARATE GLASSES"
                checked={formData.remarks.separateGlasses}
                onChange={handleCheckboxChange}
                name="remarks.separateGlasses"
              />
              <Checkbox 
                label="BI FOCAL LENSES"
                checked={formData.remarks.biFocalLenses}
                onChange={handleCheckboxChange}
                name="remarks.biFocalLenses"
              />
              <Checkbox 
                label="PROGRESSIVE LENSES"
                checked={formData.remarks.progressiveLenses}
                onChange={handleCheckboxChange}
                name="remarks.progressiveLenses"
              />
            </div>
            <div>
              <Checkbox 
                label="ANTI REFLECTION LENSES"
                checked={formData.remarks.antiReflectionLenses}
                onChange={handleCheckboxChange}
                name="remarks.antiReflectionLenses"
              />
              <Checkbox 
                label="ANTI RADIATION LENSES"
                checked={formData.remarks.antiRadiationLenses}
                onChange={handleCheckboxChange}
                name="remarks.antiRadiationLenses"
              />
              <Checkbox 
                label="UNDERCORRECTED"
                checked={formData.remarks.underCorrected}
                onChange={handleCheckboxChange}
                name="remarks.underCorrected"
              />
            </div>
          </div>
        </div>
        
        {/* Additional Info Section */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <Input 
              label="Retest After" 
              type="date"
              value={formData.retestAfter} 
              onChange={handleChange}
              name="retestAfter"
            />
          </div>
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Others
            </label>
            <textarea
              value={formData.others}
              onChange={handleChange}
              name="others"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button type="submit" variant="action">
            &lt;&lt; Add Prescription &gt;&gt;
          </Button>
          <Button type="button" variant="action">
            &lt;&lt; Edit/Search Prescription &gt;&gt;
          </Button>
          <Button type="button" variant="action">
            &lt;&lt; Print Prescription &gt;&gt;
          </Button>
          <Button type="button" variant="action" onClick={handleClear}>
            &lt;&lt; Clear Prescription &gt;&gt;
          </Button>
          <Button type="button" variant="action">
            &lt;&lt; Exit &gt;&gt;
          </Button>
        </div>
      </Card>
    </form>
  );
};

export default PrescriptionForm;