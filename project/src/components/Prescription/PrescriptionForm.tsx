import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import RadioGroup from '../ui/RadioGroup';
import Button from '../ui/Button';
import { 
  PrescriptionData
} from '../../types';
import { 
  generatePrescriptionNo, 
  calculateIPD, 
  getTodayDate,
  getNextMonthDate,
  titleOptions,
  classOptions,
  prescribedByOptions
} from '../../utils/helpers';
import {
  validatePrescriptionData
} from '../../utils/prescriptionUtils';
import LensPrescriptionSection from './LensPrescriptionSection';

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

  // Handle initial reference number setting and IPD calculation
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
  }, [formData.referenceNo, formData.rightEye.dv.rpd, formData.leftEye.dv.lpd, formData.prescriptionNo]);
  
  // Handle copying DV values to NV when DV values change
  useEffect(() => {
    // Copy DV values to NV for right eye if NV values are empty
    if (formData.rightEye.dv.sph && !formData.rightEye.nv.sph) {
      setFormData(prev => ({
        ...prev,
        rightEye: {
          ...prev.rightEye,
          nv: { ...prev.rightEye.dv, rpd: prev.rightEye.dv.rpd }
        }
      }));
    }
  }, [formData.rightEye.dv, formData.rightEye.nv.sph]);
  
  // Handle copying DV values to NV for left eye
  useEffect(() => {
    if (formData.leftEye.dv.sph && !formData.leftEye.nv.sph) {
      setFormData(prev => ({
        ...prev,
        leftEye: {
          ...prev.leftEye,
          nv: { ...prev.leftEye.dv, lpd: prev.leftEye.dv.lpd }
        }
      }));
    }
  }, [formData.leftEye.dv, formData.leftEye.nv.sph]);
  
  // Handle balance lens functionality with a separate effect and ref to prevent infinite loops
  const previousBalanceLensValue = React.useRef(formData.balanceLens);
  
  useEffect(() => {
    // Only update if balanceLens has actually changed
    if (formData.balanceLens !== previousBalanceLensValue.current) {
      previousBalanceLensValue.current = formData.balanceLens;
      
      // Only apply balance lens if it's toggled on
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
    }
  }, [formData.balanceLens, formData.rightEye.dv, formData.rightEye.nv, formData.leftEye.dv.lpd]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.prescribedBy) {
      newErrors.prescribedBy = 'Prescribed By is required';
    }
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
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
    if (!name) {
      console.error('[handleChange] Missing name on event target:', e.target, e);
      console.trace();
      return;
    }
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
    // Format the value based on field type
    let formattedValue = value;
    // Apply common formatting for numeric fields
    if (name.includes('sph') || name.includes('cyl') || name.includes('add')) {
      // Remove non-numeric chars except decimal point and minus sign
      formattedValue = value.replace(/[^0-9.-]/g, '');
      // Ensure proper decimal format
      if (formattedValue && !isNaN(parseFloat(formattedValue))) {
        // Limit to 2 decimal places for most fields
        const numValue = parseFloat(formattedValue);
        formattedValue = numValue.toFixed(2);
        // Remove trailing zeros
        formattedValue = formattedValue.replace(/\.?0+$/, '');
      }
    } else if (name.includes('ax')) {
      // For axis, ensure integer between 0-180
      formattedValue = value.replace(/[^0-9]/g, '');
      const numValue = parseInt(formattedValue);
      if (!isNaN(numValue) && numValue > 180) {
        formattedValue = '180';
      }
    }
    // Call handleChange with a proper event object
    handleChange({
      target: {
        name,
        value: formattedValue
      }
    } as React.ChangeEvent<HTMLInputElement>);
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
    <form onSubmit={handleFormSubmit} className="w-full max-w-screen-xl mx-auto">
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
        <LensPrescriptionSection
          formData={{
            ...formData,
            age: parseInt(formData.age) || 0
          }}
          handleChange={handleChange}
          handleNumericInputChange={handleNumericInput}
          handleCheckboxChange={handleCheckboxChange}
        />
        
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