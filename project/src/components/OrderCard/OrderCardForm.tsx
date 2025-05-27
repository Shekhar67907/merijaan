import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import RadioGroup from '../ui/RadioGroup';
import Button from '../ui/Button';
// Assuming helper functions like getTodayDate, getNextMonthDate, etc. exist in utils
import { getTodayDate, getNextMonthDate, titleOptions, classOptions, prescribedByOptions, formatNumericInput } from '../../utils/helpers';
import CustomerInfoSection from './CustomerInfoSection';
import PrescriptionSection from './PrescriptionSection';
import RemarksAndStatusSection from './RemarksAndStatusSection';
import PaymentSection from './PaymentSection';
import { PrescriptionFormData } from '../types';

// Define interfaces for form data and table rows
interface PrescriptionEyeData {
  sph: string;
  cyl: string;
  ax: string;
  add: string;
  vn: string;
  rpd?: string; // RPD only for Right eye
  lpd?: string; // LPD only for Left eye
}

interface PrescriptionData {
  dv: PrescriptionEyeData;
  nv: PrescriptionEyeData;
}

interface SelectedItem {
  si: number;
  itemCode: string;
  itemName: string;
  unit: string;
  taxPercent: number;
  rate: number;
  amount: number;
  qty: number;
  discountAmount: number;
  discountPercent: number;
  // Lens-specific fields
  brandName?: string;
  index?: string;
  coating?: string;
}

interface OrderCardFormData {
  orderNo: string;
  referenceNo: string;
  currentDateTime: string;
  deliveryDateTime: string;
  class: string;
  bookingBy: string;
  namePrefix: string;
  name: string;
  gender: string;
  age: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phoneLandline: string;
  mobileNo: string;
  email: string;
  customerCode: string;
  birthDay: string;
  marriageAnniversary: string;
  ipd: string;
  prescribedBy: string;
  billed: boolean;
  rightEye: PrescriptionData;
  leftEye: PrescriptionData;
  balanceLens: boolean;
  selectedItems: SelectedItem[];
  remarks: string;
  status: string;
  orderStatus: string;
  orderStatusDate: string;
  retestAfter: string;
  billNo: string;
  paymentEstimate: string;
  schAmt: string;
  advance: string;
  balance: string;
  cashAdv1: string;
  ccUpiAdv: string;
  chequeAdv: string;
  cashAdv2: string;
  cashAdv2Date: string;
  applyDiscount: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  discountReason: string;
  manualEntryType: 'Frames' | 'Sun Glasses';
  manualEntryItemName: string;
  manualEntryRate: string;
  manualEntryQty: number;
  manualEntryItemAmount: number;
}

// Initial form state with proper nested structure
const initialFormState: PrescriptionFormData = {
  prescriptionNo: '',
  referenceNo: '',
  currentDateTime: getTodayDate(),
  deliveryDateTime: getNextMonthDate(),
  date: getTodayDate(),
  class: '',
  prescribedBy: '',
  name: '',
  title: '',
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
  ipd: '0.0',
  rightEye: {
    dv: {
      sph: '',
      cyl: '',
      ax: '',
      add: '',
      vn: '6/',
      rpd: ''
    },
    nv: {
      sph: '',
      cyl: '',
      ax: '',
      add: '',
      vn: '',
      rpd: ''
    }
  },
  leftEye: {
    dv: {
      sph: '',
      cyl: '',
      ax: '',
      add: '',
      vn: '6/',
      lpd: ''
    },
    nv: {
      sph: '',
      cyl: '',
      ax: '',
      add: '',
      vn: '',
      lpd: ''
    }
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
  balanceLens: false,
  bookingBy: '',
  namePrefix: 'Mr.',
  billed: false,
  selectedItems: [],
  orderStatus: 'Processing',
  orderStatusDate: getTodayDate(),
  billNo: '',
  paymentEstimate: '0.00',
  schAmt: '0.00',
  advance: '0.00',
  balance: '0.00',
  cashAdv1: '0.00',
  ccUpiAdv: '0.00',
  chequeAdv: '0.00',
  cashAdv2: '0.00',
  cashAdv2Date: getTodayDate(),
  discountType: 'percentage',
  applyDiscount: '',
  discountValue: '',
  discountReason: '',
  manualEntryType: 'Frames',
  manualEntryItemName: '',
  manualEntryRate: '',
  manualEntryQty: 1,
  manualEntryItemAmount: 0
};

const OrderCardForm: React.FC = () => {
  const [formData, setFormData] = useState<PrescriptionFormData>(initialFormState);

  const [showManualEntryPopup, setShowManualEntryPopup] = useState(false);
  const [showLensEntryPopup, setShowLensEntryPopup] = useState(false);
  const [lensEntry, setLensEntry] = useState({ brandName: '', itemName: '', index: '', coating: '', rate: '', qty: '', itemAmount: '' });
  const [retestAfterChecked, setRetestAfterChecked] = useState(false);
  const [showItemSelectionPopup, setShowItemSelectionPopup] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<'Frames' | 'Sun Glasses'>('Frames');

  // Effect to calculate Item Amount in manual entry popup
  useEffect(() => {
    const rate = parseFloat(formData.manualEntryRate || '0');
    const qty = formData.manualEntryQty || 0;
    setFormData(prev => ({ ...prev, manualEntryItemAmount: rate * qty }));
  }, [formData.manualEntryRate, formData.manualEntryQty]);

  // Effect to calculate Balance and total Advance in Payment Section
  useEffect(() => {
    const paymentEstimate = parseFloat(formData.paymentEstimate || '0');
    const schAmt = parseFloat(formData.schAmt || '0');
    const cashAdv1 = parseFloat(formData.cashAdv1 || '0');
    const ccUpiAdv = parseFloat(formData.ccUpiAdv || '0');
    const chequeAdv = parseFloat(formData.chequeAdv || '0');
    const cashAdv2 = parseFloat(formData.cashAdv2 || '0');

    // Calculate total advance
    const totalAdvance = cashAdv1 + ccUpiAdv + chequeAdv + cashAdv2;

    // Calculate balance
    const balance = paymentEstimate - schAmt - totalAdvance;

    // Update state for both balance and the calculated advance
    setFormData(prev => ({ 
      ...prev, 
      balance: balance.toFixed(2), 
      advance: totalAdvance.toFixed(2) 
    }));

  }, [
    formData.paymentEstimate,
    formData.schAmt,
    formData.cashAdv1,
    formData.ccUpiAdv,
    formData.chequeAdv,
    formData.cashAdv2
  ]);

  // Effect to handle prescription logic
  useEffect(() => {
    // Calculate IPD from RPD and LPD
    if (formData.rightEye.dv.rpd && formData.leftEye.dv.lpd) {
      const rpdValue = parseFloat(formData.rightEye.dv.rpd);
      const lpdValue = parseFloat(formData.leftEye.dv.lpd);
      if (!isNaN(rpdValue) && !isNaN(lpdValue)) {
        const calculatedIPD = (rpdValue + lpdValue).toFixed(1);
        setFormData(prev => ({ ...prev, ipd: calculatedIPD }));
      }
    }
  }, [formData.rightEye.dv.rpd, formData.leftEye.dv.lpd]);

  // Payment Section: Auto-calculate Payment Estimate and Sch Amt from selectedItems
  useEffect(() => {
    // Payment Estimate: sum of (rate * qty) for all items
    const paymentEstimate = formData.selectedItems.reduce((sum, item) => sum + (item.rate * item.qty), 0);
    // Sch Amt: sum of all discountAmount fields
    const schAmt = formData.selectedItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    // Advance: user input, default to 0 if empty
    const advance = formData.advance === '' ? 0 : parseFloat(formData.advance);
    // Balance: Payment Estimate - Sch Amt - Advance
    const balance = paymentEstimate - schAmt - advance;
    setFormData(prev => ({
      ...prev,
      paymentEstimate: paymentEstimate.toFixed(2),
      schAmt: schAmt.toFixed(2),
      balance: balance.toFixed(2)
    }));
  }, [formData.selectedItems, formData.advance]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (e.g., "rightEye.dv.sph")
      const parts = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current: any = newData;
        for (let i = 0; i < parts.length - 1; i++) {
          current[parts[i]] = { ...current[parts[i]] };
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        return newData;
      });
    } else {
      // Handle top-level properties
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle numeric input changes with validation
  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/[^0-9.-]/g, '');
    
    if (name.includes('.')) {
      // Handle nested numeric properties
      const parts = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current: any = newData;
        for (let i = 0; i < parts.length - 1; i++) {
          current[parts[i]] = { ...current[parts[i]] };
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = numericValue;
        return newData;
      });
    } else {
      // Handle top-level numeric properties
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested checkbox properties
      const parts = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current: any = newData;
        for (let i = 0; i < parts.length - 1; i++) {
          current[parts[i]] = { ...current[parts[i]] };
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = checked;
        return newData;
      });
    } else {
      // Handle top-level checkbox properties
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    }
  };

  const handleManualEntryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    const processedValue = (name === 'manualEntryQty') ? parseInt(value) || 0 : (name === 'manualEntryRate' || name === 'manualEntryItemAmount') ? parseFloat(value) || 0 : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleAddManualEntry = (type: 'Frames' | 'Sun Glasses') => {
    setSelectedItemType(type);
    setShowItemSelectionPopup(true);
  };

  const handleAddItemClick = (type: 'Frames' | 'Sun Glasses') => {
    setFormData(prev => ({
      ...prev,
      manualEntryType: type,
      manualEntryItemName: '',
      manualEntryRate: '',
      manualEntryQty: 1,
      manualEntryItemAmount: 0.00
    }));
    setShowItemSelectionPopup(false);
    setShowManualEntryPopup(true);
  };

  const handleAddManualEntryItem = () => {
    if (!formData.manualEntryItemName || !formData.manualEntryRate) {
      alert('Please enter both item name and rate');
      return;
    }

    const newItem: SelectedItem = {
      si: formData.selectedItems.length + 1,
      itemCode: generateItemCode(formData.manualEntryType),
      itemName: formData.manualEntryItemName,
      unit: 'PCS',
      taxPercent: 0,
      rate: parseFloat(formData.manualEntryRate),
      qty: formData.manualEntryQty || 1,
      amount: parseFloat(formData.manualEntryRate) * (formData.manualEntryQty || 1),
      discountAmount: 0,
      discountPercent: 0
    };

    setFormData(prev => ({
      ...prev,
      selectedItems: [...prev.selectedItems, newItem],
      manualEntryItemName: '',
      manualEntryRate: '',
      manualEntryQty: 1,
      manualEntryItemAmount: 0
    }));
    setShowManualEntryPopup(false);
  };

  const handleDeleteItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter((_, i) => i !== index)
    }));
  };

  const handleOrderCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Order Card Data Submitted:', formData);
    alert('Order Card submitted! Check console for data.');
  };

  const handleClear = () => {
    setFormData(initialFormState);
    setRetestAfterChecked(false);
  };

  const handleApplyDiscount = () => {
    const discountValue = parseFloat(formData.applyDiscount || '0');
    if (discountValue <= 0) {
      alert('Please enter a valid discount value (greater than 0)');
      return;
    }
    const totalBeforeDiscount = formData.selectedItems.reduce(
      (sum, item) => sum + (item.rate * item.qty),
      0
    );
    if (totalBeforeDiscount <= 0) {
      alert('No items to apply discount to');
      return;
    }
    const discountType = formData.discountType || 'percentage';
    const discountAmount = discountType === 'percentage'
      ? (totalBeforeDiscount * discountValue) / 100
      : Math.min(discountValue, totalBeforeDiscount);
    const updatedItems = formData.selectedItems.map(item => {
      const itemTotal = item.rate * item.qty;
      const ratio = itemTotal / totalBeforeDiscount;
      const itemDiscount = discountAmount * ratio;
      const discountedTotal = itemTotal - itemDiscount;
      return {
        ...item,
        amount: parseFloat(discountedTotal.toFixed(2)),
        discountAmount: parseFloat(itemDiscount.toFixed(2)),
        discountPercent: parseFloat(((itemDiscount / itemTotal) * 100).toFixed(2)),
      };
    });
    setFormData(prev => ({
      ...prev,
      selectedItems: updatedItems,
      applyDiscount: '',
      paymentEstimate: (totalBeforeDiscount - discountAmount).toFixed(2)
    }));
    alert(`Successfully applied ${discountType === 'percentage' ? `${discountValue}%` : `$${discountValue.toFixed(2)}`} discount`);
  };

  const handleItemDiscountChange = (index: number, type: 'percentage' | 'fixed', value: string) => {
    const numericValue = parseFloat(value) || 0;

    setFormData(prev => {
      const updatedItems = [...prev.selectedItems];
      const item = { ...updatedItems[index] };
      const itemTotal = item.rate * item.qty;

      if (type === 'percentage') {
        const percentage = Math.min(100, Math.max(0, numericValue));
        const discountAmount = (itemTotal * percentage) / 100;
        item.discountPercent = percentage;
        item.discountAmount = parseFloat(discountAmount.toFixed(2));
        item.amount = parseFloat((itemTotal - discountAmount).toFixed(2));
      } else {
        const discountAmount = Math.min(itemTotal, Math.max(0, numericValue));
        const discountPercentage = (discountAmount / itemTotal) * 100;
        item.discountAmount = parseFloat(discountAmount.toFixed(2));
        item.discountPercent = parseFloat(discountPercentage.toFixed(2));
        item.amount = parseFloat((itemTotal - discountAmount).toFixed(2));
      }
      updatedItems[index] = item;
      return {
        ...prev,
        selectedItems: updatedItems
      };
    });
  };

  const updatePaymentEstimate = (items: SelectedItem[]) => {
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    setFormData(prev => ({
      ...prev,
      paymentEstimate: total.toFixed(2)
    }));
  };

  return (
    <form onSubmit={handleOrderCardSubmit} className="max-w-7xl mx-auto p-4 bg-gray-100 font-sans text-sm">
      <Card className="mb-4 p-4 shadow-lg rounded-md bg-white border border-gray-200">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b pb-3 bg-blue-100 rounded-t-md px-4 py-2">
          <div className="flex space-x-1 mb-2 sm:mb-0">
            <Button type="button" variant="outline" size="sm" className="text-xs">&#60;&#60; First</Button>
            <Button type="button" variant="outline" size="sm" className="text-xs">&#60; Prev</Button>
            <Button type="button" variant="outline" size="sm" className="text-xs">Next &#62;</Button>
            <Button type="button" variant="outline" size="sm" className="text-xs">Last &#62;&#62;</Button>
          </div>
          <Button type="button" variant="outline" size="sm" className="text-xs">&#60;&#60; Display Prescription History &#62;&#62;</Button>
        </div>

        {/* Order and Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Order Info */}
          <div className="grid grid-cols-1 gap-3 text-gray-700 border p-4 rounded bg-blue-50 shadow-sm">
            <Input label="Prescription No.:" value={formData.prescriptionNo} name="prescriptionNo" onChange={handleChange} readOnly />
            <Input label="Reference No.:" value={formData.referenceNo} name="referenceNo" onChange={handleChange} />
            <Input label="Current Date/Time:" value={formData.currentDateTime} name="currentDateTime" onChange={handleChange} readOnly />
            <Input label="Delivery Date/Time:" value={formData.deliveryDateTime} name="deliveryDateTime" onChange={handleChange} type="datetime-local"/>
            <Select label="Class:" options={classOptions} value={formData.class} name="class" onChange={handleChange} />
            <Input label="Booking By:" value={formData.bookingBy} name="bookingBy" onChange={handleChange} />
          </div>

          {/* Customer Info */}
          <CustomerInfoSection
            formData={formData}
            handleChange={handleChange}
            handleCheckboxChange={handleCheckboxChange}
            handleNumericInputChange={handleNumericInputChange}
          />
        </div>

        {/* Prescription Section */}
        <PrescriptionSection
          formData={{
            rightEye: formData.rightEye,
            leftEye: formData.leftEye,
            balanceLens: formData.balanceLens,
            age: parseInt(formData.age) || 0
          }}
          handleChange={handleChange}
          handleNumericInputChange={handleNumericInputChange}
          handleCheckboxChange={handleCheckboxChange}
        />

        {/* Spectacles Section (Restored Layout)*/}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="flex flex-col space-y-2">
                 <Button type="button" variant="action" className="text-xs">&#60;&#60; Add Spectacle &#62;&#62;</Button>
                 <Button 
                   type="button" 
                   variant="action" 
                   className="text-xs" 
                   onClick={() => handleAddManualEntry('Frames')}
                 >
                   &#60;&#60; Add Frame / Sun Glasses &#62;&#62;
                 </Button>
                 <Button type="button" variant="action" className="text-xs" onClick={() => setShowLensEntryPopup(true)}>&#60;&#60; Add Lenses &#62;&#62;</Button>
             </div>
             <div className="md:col-span-3 border p-4 rounded bg-white shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1 text-blue-700">Selected Frames / Sun Glasses Details</h4>
                  <table className="w-full border-collapse text-sm text-gray-700">
                      <thead>
                          <tr className="bg-blue-50">
                              <th className="border border-gray-300 px-1 py-1 text-left text-xs w-8">S.I.</th>
                              <th className="border border-gray-300 px-1 py-1 text-left text-xs w-16">Item Code</th>
                              <th className="border border-gray-300 px-1 py-1 text-left text-xs w-40">Item Name</th>
                              <th className="border border-gray-300 px-1 py-1 text-right text-xs w-14">Tax (%)</th>
                              <th className="border border-gray-300 px-1 py-1 text-right text-xs w-14">Rate</th>
                              <th className="border border-gray-300 px-1 py-1 text-right text-xs w-16">Amount</th>
                              <th className="border border-gray-300 px-1 py-1 text-right text-xs w-10">Qty</th>
                              <th className="border border-gray-300 px-1 py-1 text-right text-xs w-16">Discount Amt</th>
                              <th className="border border-gray-300 px-1 py-1 text-right text-xs w-16">Discount %</th>
                              <th className="border border-gray-300 px-1 py-1 text-xs w-10"></th>
                          </tr>
                      </thead>
                      <tbody>
                          {formData.selectedItems.length === 0 ? (
                               <tr>
                                   <td colSpan={10} className="text-center border border-gray-300 py-4 text-gray-500">No items added yet.</td>
                               </tr>
                          ) : (
                              formData.selectedItems.map((item, index) => (
                                  <tr key={index}>
                                      <td className="border border-gray-300 px-1 py-1 text-xs text-left">{item.si}</td>
                                      <td className="border border-gray-300 px-1 py-1 text-xs text-left">{item.itemCode}</td>
                                      <td className="border border-gray-300 px-1 py-1 text-xs text-left">{item.itemName}</td>
                                      <td className="border border-gray-300 px-1 py-1 text-xs text-right">
                                        <Input
                                          value={item.taxPercent}
                                          name={`selectedItems.${index}.taxPercent`}
                                          onChange={e => {
                                            const value = parseFloat(e.target.value) || 0;
                                            setFormData(prev => {
                                              const updatedItems = [...prev.selectedItems];
                                              updatedItems[index].taxPercent = value;
                                              return { ...prev, selectedItems: updatedItems };
                                            });
                                          }}
                                          type="number"
                                          step="0.01"
                                          className="w-12 text-right text-xs px-1 py-0.5"
                                          placeholder="0.00"
                                        />
                                      </td>
                                      <td className="border border-gray-300 px-1 py-1 text-xs text-right">
                                        <Input
                                          value={item.rate}
                                          name={`selectedItems.${index}.rate`}
                                          onChange={e => {
                                            const value = parseFloat(e.target.value) || 0;
                                            setFormData(prev => {
                                              const updatedItems = [...prev.selectedItems];
                                              updatedItems[index].rate = value;
                                              updatedItems[index].amount = value * updatedItems[index].qty - updatedItems[index].discountAmount;
                                              return { ...prev, selectedItems: updatedItems };
                                            });
                                          }}
                                          type="number"
                                          step="0.01"
                                          className="w-14 text-right text-xs px-1 py-0.5"
                                          placeholder="0.00"
                                        />
                                      </td>
                                      <td className="border border-gray-300 px-1 py-1 text-xs text-right">{item.amount.toFixed(2)}</td>
                                      <td className="border border-gray-300 px-1 py-1 text-xs text-right">
                                        <Input
                                          value={item.qty}
                                          name={`selectedItems.${index}.qty`}
                                          onChange={e => {
                                            const value = parseInt(e.target.value) || 1;
                                            setFormData(prev => {
                                              const updatedItems = [...prev.selectedItems];
                                              updatedItems[index].qty = value;
                                              updatedItems[index].amount = updatedItems[index].rate * value - updatedItems[index].discountAmount;
                                              return { ...prev, selectedItems: updatedItems };
                                            });
                                          }}
                                          type="number"
                                          min="1"
                                          className="w-10 text-right text-xs px-1 py-0.5"
                                          placeholder="1"
                                        />
                                      </td>
                                      <td className="border border-gray-300 px-1 py-1 text-xs text-right">
                                        <Input
                                          value={item.discountAmount}
                                          name={`selectedItems.${index}.discountAmount`}
                                          onChange={e => handleItemDiscountChange(index, 'fixed', e.target.value)}
                                          type="number"
                                          step="0.01"
                                          className="w-14 text-right text-xs px-1 py-0.5"
                                          placeholder="0.00"
                                        />
                                      </td>
                                      <td className="border border-gray-300 px-1 py-1 text-xs text-right">
                                        <Input
                                          value={item.discountPercent}
                                          name={`selectedItems.${index}.discountPercent`}
                                          onChange={e => handleItemDiscountChange(index, 'percentage', e.target.value)}
                                          type="number"
                                          step="0.01"
                                          className="w-14 text-right text-xs px-1 py-0.5"
                                          placeholder="0.00"
                                        />
                                      </td>
                                      <td className="border border-gray-300 px-1 py-1 text-xs text-center">
                                          <Button variant="danger" size="sm" onClick={() => handleDeleteItem(index)}>Delete</Button>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
                  {/* Apply Discount Section */}
                  <div className="flex justify-between items-center mt-3 p-2 bg-gray-50 rounded border">
                    <div className="flex items-center space-x-4">
                      <span className="text-xs font-medium">Discount Type:</span>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="discountType"
                          value="percentage"
                          checked={formData.discountType === 'percentage'}
                          onChange={() => setFormData(prev => ({ ...prev, discountType: 'percentage' }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-1 text-xs">%</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="discountType"
                          value="fixed"
                          checked={formData.discountType === 'fixed'}
                          onChange={() => setFormData(prev => ({ ...prev, discountType: 'fixed' }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-1 text-xs">Fixed Amount</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-medium">
                        {formData.discountType === 'percentage' ? 'Discount %:' : 'Discount Amount:'}
                      </label>
                      <Input
                        value={formData.applyDiscount}
                        name="applyDiscount"
                        onChange={handleChange}
                        className="w-16 text-right text-xs px-1 py-0.5"
                        placeholder={formData.discountType === 'percentage' ? '0.00%' : '0.00'}
                      />
                      <Button
                        type="button"
                        variant="action"
                        size="sm"
                        className="text-xs"
                        onClick={handleApplyDiscount}
                      >
                        Apply Disc
                      </Button>
                    </div>
                  </div>
             </div>
         </div>

        {/* Remarks and Payment Section (New Layout)*/}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Remarks and Status */}
            <div className="border p-4 rounded bg-white shadow-sm text-gray-700">
                <h3 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-2">Remarks / Status</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                      <textarea
                        value={JSON.stringify(formData.remarks)}
                        onChange={handleChange}
                        name="remarks"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-blue-50"
                      />
                    </div>
                    {/* Order Status, Retest After, Bill No. */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {/* Left Column - Order Status */}
                        <div className="col-span-2">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">Order Status:</label>
                                <div className="flex flex-wrap gap-4">
                                    {['Processing', 'Fitting', 'Ready', 'Hand Over'].map((status) => (
                                        <label key={status} className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="orderStatus"
                                                value={status}
                                                checked={formData.orderStatus === status}
                                                onChange={handleChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{status}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="mt-2">
                                    <Input 
                                        label="Date:" 
                                        value={formData.orderStatusDate} 
                                        name="orderStatusDate" 
                                        onChange={handleChange} 
                                        type="date" 
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Retest After and Bill No */}
                        <div className="col-span-1">
                            <div className="flex flex-col space-y-3">
                                {/* Retest After with Checkbox and Input */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="retestAfterCheckbox"
                                        checked={retestAfterChecked}
                                        onChange={handleCheckboxChange}
                                        name="retestAfterChecked"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="retestAfterCheckbox" className="text-sm font-medium text-gray-700">
                                        Retest After:
                                    </label>
                                    <Input
                                        value={formData.retestAfter}
                                        name="retestAfter"
                                        onChange={handleChange}
                                        type="date"
                                        className="text-sm flex-1 min-w-0"
                                        disabled={!retestAfterChecked}
                                        label=""
                                    />
                                </div>
                                
                                {/* Handed Over Checkbox */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="handedOver"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="handedOver" className="ml-2 text-sm font-medium text-gray-700">
                                        Handed Over
                                    </label>
                                </div>

                                {/* Bill No. */}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                        Bill No.:
                                    </label>
                                    <Input 
                                        value={formData.billNo} 
                                        name="billNo" 
                                        onChange={handleChange} 
                                        className="text-sm flex-1"
                                        label=""
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Section (Updated Layout) */}
            <div className="border p-4 rounded bg-white shadow-sm text-gray-700">
                <h3 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-2">Payment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left Column of Payment */}
                    <div className="space-y-3">
                        <Input
                          label="Payment Estimate:"
                          value={formData.paymentEstimate}
                          name="paymentEstimate"
                          readOnly
                          className="bg-blue-100 text-sm"
                        />
                        <Input
                          label="*Sch Amt:"
                          value={formData.schAmt}
                          name="schAmt"
                          readOnly
                          className="bg-blue-100 text-sm"
                        />
                        <Input
                          label="Advance:"
                          value={formData.advance}
                          name="advance"
                          onChange={handleNumericInputChange}
                          className="text-sm"
                          placeholder=""
                        />
                        <Input
                          label="Balance:"
                          value={formData.balance}
                          name="balance"
                          readOnly
                          className="bg-blue-100 text-sm"
                        />
                    </div>
                    {/* Right Column of Payment */}
                    <div className="space-y-3">
                        <Input
                          label="Cash adv.:"
                          value={formData.cashAdv1}
                          name="cashAdv1"
                          onChange={handleNumericInputChange}
                          className="text-sm"
                        />
                        <Input
                          label="CC / UPI Adv.:"
                          value={formData.ccUpiAdv}
                          name="ccUpiAdv"
                          onChange={handleNumericInputChange}
                          className="text-sm"
                        />
                         <Input
                          label="Cheque Adv.:"
                          value={formData.chequeAdv}
                          name="chequeAdv"
                          onChange={handleNumericInputChange}
                          className="text-sm"
                        />
                        {/* Cash Adv. 2 with Date */}
                        <div className="flex items-center space-x-2">
                            <Input
                              label="Cash Adv. 2:"
                              value={formData.cashAdv2}
                              name="cashAdv2"
                              onChange={handleNumericInputChange}
                              className="text-sm"
                            />
                            <Input
                              label="Date:"
                              value={formData.cashAdv2Date}
                              name="cashAdv2Date"
                              onChange={handleChange}
                              type="date"
                              className="text-sm w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 mt-8">
          <Button type="submit" variant="action">&#60;&#60; Add Order Card &#62;&#62;</Button>
          <Button type="button" variant="action">&#60;&#60; Edit/Search Order Card &#62;&#62;</Button>
          <Button type="button" variant="action">&#60;&#60; Print Order Card &#62;&#62;</Button>
          <Button type="button" variant="action" onClick={handleClear}>&#60;&#60; Clear Order &#62;&#62;</Button>
          <Button type="button" variant="action">&#60;&#60; Exit &#62;&#62;</Button>
        </div>

      </Card>

      {/* Item Selection Popup */}
      {showItemSelectionPopup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative p-6 border w-11/12 md:w-1/3 shadow-lg rounded-md bg-white">
            <h4 className="text-lg font-semibold mb-4 border-b pb-2 text-blue-700">Select Item Type</h4>
            <div className="space-y-4">
              <Button 
                type="button" 
                variant="action" 
                className="w-full text-left justify-start"
                onClick={() => handleAddItemClick('Frames')}
              >
                Add Frames
              </Button>
              <Button 
                type="button" 
                variant="action" 
                className="w-full text-left justify-start"
                onClick={() => handleAddItemClick('Sun Glasses')}
              >
                Add Sunglasses
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setShowItemSelectionPopup(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Popup */}
      {showManualEntryPopup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative p-6 border w-11/12 md:w-2/3 lg:w-1/3 shadow-lg rounded-md bg-white">
            <h4 className="text-lg font-semibold mb-4 border-b pb-2 text-blue-700">
              Add {formData.manualEntryType} Manually
            </h4>
            <div className="mb-4">
              <RadioGroup
                label="Type:"
                name="manualEntryType"
                options={[
                  { label: 'Frames', value: 'Frames' },
                  { label: 'Sun Glasses', value: 'Sun Glasses' }
                ]}
                value={formData.manualEntryType}
                onChange={handleManualEntryChange}
              />
            </div>
            <div className="space-y-3 text-gray-700">
              <Input label="Item Name:" value={formData.manualEntryItemName} name="manualEntryItemName" onChange={handleManualEntryChange} />
              <Input label="Rate:" value={formData.manualEntryRate} name="manualEntryRate" onChange={handleManualEntryChange} type="number" step="0.01" />
              <Input label="Quantity:" value={formData.manualEntryQty} name="manualEntryQty" onChange={handleManualEntryChange} type="number" min="1" />
              <Input label="Item Amount:" value={formData.manualEntryItemAmount.toFixed(2)} name="manualEntryItemAmount" readOnly />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowManualEntryPopup(false)}>Cancel</Button>
              <Button type="button" variant="action" onClick={handleAddManualEntryItem}>Add</Button>
            </div>
          </div>
        </div>
      )}

      {/* Lens Entry Popup */}
      {showLensEntryPopup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative p-6 border w-11/12 md:w-2/3 lg:w-1/3 shadow-lg rounded-md bg-white">
            <h4 className="text-lg font-semibold mb-4 border-b pb-2 text-blue-700">Add Lenses Manually</h4>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <Input label="Brand Name" value={lensEntry.brandName} name="brandName" onChange={e => setLensEntry({ ...lensEntry, brandName: e.target.value })} />
              <Input label="Item Name" value={lensEntry.itemName} name="itemName" onChange={e => setLensEntry({ ...lensEntry, itemName: e.target.value })} />
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <Input label="Index" value={lensEntry.index} name="index" onChange={e => setLensEntry({ ...lensEntry, index: e.target.value })} />
              <Input label="Coating" value={lensEntry.coating} name="coating" onChange={e => setLensEntry({ ...lensEntry, coating: e.target.value })} />
            </div>
            <div className="mb-2 grid grid-cols-3 gap-2">
              <Input label="Rate" value={lensEntry.rate} name="rate" type="number" onChange={e => {
                const rate = e.target.value;
                const qty = lensEntry.qty === '' ? 1 : parseInt(lensEntry.qty);
                setLensEntry(le => ({ ...le, rate, itemAmount: rate && qty ? (parseFloat(rate) * qty).toString() : '' }));
              }} />
              <Input label="Qty" value={lensEntry.qty} name="qty" type="number" min="1" onChange={e => {
                const qty = e.target.value;
                const rate = lensEntry.rate === '' ? 0 : parseFloat(lensEntry.rate);
                setLensEntry(le => ({ ...le, qty, itemAmount: qty && rate ? (rate * parseInt(qty)).toString() : '' }));
              }} />
              <Input label="Item Amount" value={lensEntry.itemAmount} name="itemAmount" readOnly />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowLensEntryPopup(false)}>Cancel</Button>
              <Button type="button" variant="action" onClick={() => {
                if (!lensEntry.itemName || !lensEntry.rate) { alert('Please enter item name and rate'); return; }
                const newItem: SelectedItem = {
                  si: formData.selectedItems.length + 1,
                  itemCode: generateItemCode('Lens'),
                  itemName: lensEntry.itemName,
                  unit: 'PCS',
                  taxPercent: 0,
                  rate: parseFloat(lensEntry.rate),
                  qty: lensEntry.qty ? parseInt(lensEntry.qty) : 1,
                  amount: lensEntry.itemAmount ? parseFloat(lensEntry.itemAmount) : 0,
                  discountAmount: 0,
                  discountPercent: 0,
                  brandName: lensEntry.brandName,
                  index: lensEntry.index,
                  coating: lensEntry.coating
                };
                setFormData(prev => ({ ...prev, selectedItems: [...prev.selectedItems, newItem] }));
                setLensEntry({ brandName: '', itemName: '', index: '', coating: '', rate: '', qty: '', itemAmount: '' });
                setShowLensEntryPopup(false);
              }}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

// Helper functions
function generateOrderNo(): string {
  // TODO: Implement proper order number generation logic
  return `ORD${Date.now().toString().slice(-6)}`;
}

function generateBillNo(): string {
  // TODO: Implement proper bill number generation logic
  return `BILL${Date.now().toString().slice(-6)}`;
}

function generateItemCode(type: string): string {
  // TODO: Implement proper item code generation logic
  const prefix = type === 'Frames' ? 'FRM' : 'SUN';
  return `${prefix}${Date.now().toString().slice(-4)}`;
}

export default OrderCardForm; 