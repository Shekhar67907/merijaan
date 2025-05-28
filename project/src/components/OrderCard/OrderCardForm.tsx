import React, { useState, useEffect, useRef } from 'react';
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
import { PrescriptionFormData, PrescriptionData, SelectedItem } from '../types';
import ToastNotification from '../ui/ToastNotification';

// Interface for the structure of a search suggestion (based on API response which is a full Prescription object)
interface SearchSuggestion extends PrescriptionFormData {
  id: string; // Assuming an ID field exists in your DB schema and API response
  status: string; // Make status required to match PrescriptionFormData
}

// Helper function to format date for datetime-local input
const formatDateForInput = (date: string | null | undefined): string => {
  if (!date) return '';
  // Ensure date is a string before trying to include('T')
  if (typeof date !== 'string') return '';
  // If the date is already in datetime-local format, return as is
  if (date.includes('T')) return date;
  // Otherwise, append the time component (assuming midnight if no time is available)
  return `${date}T00:00`;
};

// Initial form state with proper nested structure and default datetime-local format
// Define this before the component where it's used
const initialFormState: PrescriptionFormData = {
  prescriptionNo: '',
  referenceNo: '',
  currentDateTime: formatDateForInput(getTodayDate()),
  deliveryDateTime: formatDateForInput(getNextMonthDate()),
  date: getTodayDate(), // Assuming date is just date in PrescriptionFormData
  class: '',
  bookingBy: '',
  namePrefix: 'Mr.',
  name: '',
  gender: 'Male',
  age: '',
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
  prescribedBy: '',
  billed: false,
  rightEye: {
    dv: { sph: '', cyl: '', ax: '', add: '', vn: '6/', rpd: '' },
    nv: { sph: '', cyl: '', ax: '', add: '', vn: 'N' }
  },
  leftEye: {
    dv: { sph: '', cyl: '', ax: '', add: '', vn: '6/', lpd: '' },
    nv: { sph: '', cyl: '', ax: '', add: '', vn: 'N' }
  },
  balanceLens: false,
  selectedItems: [],
  remarks: { // Initialize remarks as an object with boolean flags based on PrescriptionForm.tsx
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
  orderStatus: 'Processing',
  orderStatusDate: formatDateForInput(getTodayDate()),
  retestAfter: '',
  billNo: '',
  paymentEstimate: '0.00',
  schAmt: '0.00',
  advance: '0.00',
  balance: '0.00',
  // Added missing payment fields based on linter error and likely PaymentSection requirements
  cashAdv1: '0.00',
  ccUpiAdv: '0.00',
  chequeAdv: '0.00',
  cashAdv2: '0.00',
  cashAdv2Date: formatDateForInput(getTodayDate()),

  // Keep discount fields, although their usage needs confirmation
  applyDiscount: '',
  discountType: 'percentage',
  discountValue: '', // Value for the discount (either % or fixed amount)
  discountReason: '',

  // Manual entry fields
  manualEntryType: 'Frames',
  manualEntryItemName: '',
  manualEntryRate: '',
  manualEntryQty: 1,
  manualEntryItemAmount: 0,

  // Assuming these are also part of PrescriptionFormData based on your initial state
  others: '',
  status: '', // Assuming a status field exists based on linter error (might be for RemarksAndStatusSection)
  title: 'Mr.' // Added the missing title property
};

const OrderCardForm: React.FC = () => {
  // Use the imported PrescriptionFormData type for state
  const [formData, setFormData] = useState<PrescriptionFormData>(initialFormState);

  const [showManualEntryPopup, setShowManualEntryPopup] = useState(false);
  const [showLensEntryPopup, setShowLensEntryPopup] = useState(false);
  const [lensEntry, setLensEntry] = useState({ brandName: '', itemName: '', index: '', coating: '', rate: '', qty: '', itemAmount: '' });
  const [retestAfterChecked, setRetestAfterChecked] = useState(false);
  const [showItemSelectionPopup, setShowItemSelectionPopup] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<'Frames' | 'Sun Glasses'>('Frames');
  // Ensure notification type aligns with ToastNotification props
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({ message: '', type: 'success', visible: false });

  // States for search suggestions
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle click outside suggestions to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the clicked element is within the suggestions dropdown or the input field
      const clickedInsideSuggestions = suggestionsRef.current && suggestionsRef.current.contains(event.target as Node);
      const clickedOnInput = activeField && (event.target as Element).closest(`input[name='${activeField}']`);

      if (!clickedInsideSuggestions && !clickedOnInput) {
        setActiveField(null);
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeField]); // Add activeField to dependency array

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

  // Effect to handle prescription logic (IPD calculation)
  useEffect(() => {
    // Calculate IPD from RPD and LPD
    const rpdValue = parseFloat(formData.rightEye.dv.rpd || '0');
    const lpdValue = parseFloat(formData.leftEye.dv.lpd || '0');

    if (!isNaN(rpdValue) && !isNaN(lpdValue) && (rpdValue > 0 || lpdValue > 0)) {
        const calculatedIPD = (rpdValue + lpdValue).toFixed(1);
        setFormData(prev => ({ ...prev, ipd: calculatedIPD }));
    } else {
         setFormData(prev => ({ ...prev, ipd: '' }));
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

  // Auto-suggestion search function
  const searchPrescriptions = async (query: string, field: string) => {
    if (!query || query.length < 2) { // Add a minimum query length to avoid too many searches
      setSuggestions([]);
      return;
    }

    // Clear previous timeout to debounce
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Indicate loading state if you have one
        // setIsLoading(true);
        const params = new URLSearchParams();
        // Map field name to API query parameter name
        let paramName = '';
        switch (field) {
          case 'prescriptionNo': paramName = 'prescriptionNo'; break;
          case 'referenceNo': paramName = 'referenceNo'; break;
          case 'name': paramName = 'name'; break;
          case 'mobileNo': paramName = 'phone'; break;
          default: return; // Don't search for other fields
        }

        params.append(paramName, query);

        const response = await fetch(`/api/prescriptions/search?${params.toString()}`);

        if (!response.ok) {
           // Check if the response is JSON before parsing
           const contentType = response.headers.get('content-type');
           if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              setNotification({
                message: errorData.message || 'Search failed',
                type: 'error',
                visible: true
              });
           } else {
              // Handle non-JSON error responses (like HTML)
              setNotification({
                message: `Search failed: Unexpected response from server (Status: ${response.status})`,
                type: 'error',
                visible: true
              });
           }
           setSuggestions([]);
           return;
        }

        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Search error:', error);
        setNotification({
          message: error instanceof Error ? `Search error: ${error.message}` : 'An unknown error occurred during search',
          type: 'error',
          visible: true
        });
        setSuggestions([]);
      } finally {
         // Reset loading state
        // setIsLoading(false);
      }
    }, 300); // Debounce delay
  };

  // Handle input change for search fields
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Update the form data immediately
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Set the active field and trigger search
    setActiveField(name);
    searchPrescriptions(value, name);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    // Populate form data with the selected suggestion's data
    setFormData(prevData => ({
      ...prevData,
      // Personal Info
      name: suggestion.name || '',
      // Ensure age is treated as string for the input value
      age: suggestion.age?.toString() || '',
      gender: suggestion.gender || 'Male',
      customerCode: suggestion.customerCode || '',
      // Format dates for datetime-local input if necessary
      birthDay: formatDateForInput(suggestion.birthDay), // Assuming birthDay is a date string
      marriageAnniversary: formatDateForInput(suggestion.marriageAnniversary), // Assuming marriageAnniversary is a date string
      address: suggestion.address || '',
      city: suggestion.city || '',
      state: suggestion.state || '',
      pinCode: suggestion.pinCode || '',
      phoneLandline: suggestion.phoneLandline || '',
      mobileNo: suggestion.mobileNo || '',
      email: suggestion.email || '',
      ipd: suggestion.ipd || '',
      prescribedBy: suggestion.prescribedBy || '', // Assuming prescribedBy is on the Prescription object

      // Order Info
      prescriptionNo: suggestion.prescriptionNo || '',
      referenceNo: suggestion.referenceNo || '',
      // Note: currentDateTime and deliveryDateTime are not part of the search result typically,
      // so we keep the existing values or generate new ones as per initial state logic.
      // If you intend to load these from search, update the SearchSuggestion interface and this mapping.
      currentDateTime: prevData.currentDateTime, // Keep existing
      deliveryDateTime: prevData.deliveryDateTime, // Keep existing
      class: suggestion.class || '', // Assuming class is on the Prescription object
      bookingBy: suggestion.bookingBy || '', // Assuming bookingBy is on the Prescription object
      billed: suggestion.billed || false, // Assuming billed is on the Prescription object

      // Prescription Data (Ensure nested structure is handled)
      rightEye: {
        ...prevData.rightEye, // Preserve other rightEye properties if any
        dv: {
          ...prevData.rightEye.dv, // Preserve other rightEye DV properties if any
          sph: suggestion.rightEye?.dv?.sph || '',
          cyl: suggestion.rightEye?.dv?.cyl || '',
          ax: suggestion.rightEye?.dv?.ax || '',
          add: suggestion.rightEye?.dv?.add || '',
          vn: suggestion.rightEye?.dv?.vn || '6/', // Default if empty
          rpd: suggestion.rightEye?.dv?.rpd || ''
        },
        nv: {
          ...prevData.rightEye.nv, // Preserve other rightEye NV properties if any
          sph: suggestion.rightEye?.nv?.sph || '',
          cyl: suggestion.rightEye?.nv?.cyl || '',
          ax: suggestion.rightEye?.nv?.ax || '',
          add: suggestion.rightEye?.nv?.add || '',
          vn: suggestion.rightEye?.nv?.vn || 'N' // Default if empty
        }
      },
      leftEye: {
        ...prevData.leftEye, // Preserve other leftEye properties if any
        dv: {
          ...prevData.leftEye.dv, // Preserve other leftEye DV properties if any
          sph: suggestion.leftEye?.dv?.sph || '',
          cyl: suggestion.leftEye?.dv?.cyl || '',
          ax: suggestion.leftEye?.dv?.ax || '',
          add: suggestion.leftEye?.dv?.add || '',
          vn: suggestion.leftEye?.dv?.vn || '6/', // Default if empty
          lpd: suggestion.leftEye?.dv?.lpd || ''
        },
        nv: {
          ...prevData.leftEye.nv, // Preserve other leftEye NV properties if any
          sph: suggestion.leftEye?.nv?.sph || '',
          cyl: suggestion.leftEye?.nv?.cyl || '',
          ax: suggestion.leftEye?.nv?.ax || '',
          add: suggestion.leftEye?.nv?.add || '',
          vn: suggestion.leftEye?.nv?.vn || 'N' // Default if empty
        }
      },
      balanceLens: suggestion.balanceLens || false, // Assuming balanceLens is on the Prescription object
      remarks: suggestion.remarks || { // Initialize remarks as an object if null/undefined from search
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
      orderStatus: suggestion.orderStatus || 'Processing', // Assuming orderStatus is on the Prescription object
      orderStatusDate: formatDateForInput(suggestion.orderStatusDate), // Assuming orderStatusDate is on the Prescription object
      retestAfter: formatDateForInput(suggestion.retestAfter), // Assuming retestAfter is on the Prescription object
      billNo: suggestion.billNo || '', // Assuming billNo is on the Prescription object
      // Keep other fields as they are not typically loaded from a basic prescription search
      selectedItems: prevData.selectedItems,
      paymentEstimate: prevData.paymentEstimate,
      schAmt: prevData.schAmt,
      advance: prevData.advance,
      balance: prevData.balance,
      cashAdv1: prevData.cashAdv1,
      ccUpiAdv: prevData.ccUpiAdv,
      chequeAdv: prevData.chequeAdv,
      cashAdv2: prevData.cashAdv2,
      cashAdv2Date: prevData.cashAdv2Date,
      applyDiscount: prevData.applyDiscount,
      discountType: prevData.discountType,
      discountValue: prevData.discountValue,
      discountReason: prevData.discountReason,
      manualEntryType: prevData.manualEntryType,
      manualEntryItemName: prevData.manualEntryItemName,
      manualEntryRate: prevData.manualEntryRate,
      manualEntryQty: prevData.manualEntryQty,
      manualEntryItemAmount: prevData.manualEntryItemAmount,
      others: suggestion.others || '', // Assuming others is on the Prescription object
      status: suggestion.status || '', // Assuming status is on the Prescription object

    }));
    setActiveField(null);
    setSuggestions([]);
     setNotification({
       message: 'Prescription data loaded from search',
       type: 'success',
       visible: true
     });
  };

  // Keep existing handleChange for non-search fields and nested updates
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // If the changed field is one of the search fields, use the dedicated handler
    if (['prescriptionNo', 'referenceNo', 'name', 'mobileNo'].includes(name)) {
        // Ensure value is a string before passing to handleSearchInputChange
        handleSearchInputChange(e as React.ChangeEvent<HTMLInputElement>);
        return;
    }

    // Handle date inputs to ensure datetime-local format
    if (name === 'currentDateTime' || name === 'deliveryDateTime' ||
        name === 'orderStatusDate' || name === 'retestAfter' ||
        name === 'cashAdv2Date') {
      setFormData(prev => ({
        ...prev,
        [name]: formatDateForInput(value)
      }));
      return;
    }

    // Handle nested properties (e.g., "rightEye.dv.sph")
    if (name.includes('.')) {
      const parts = name.split('.');
      setFormData(prev => {
        const newData: any = { ...prev }; // Use any temporarily for nested updates
        let current = newData;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
             current[parts[i]] = {}; // Initialize if undefined
          }
          current[parts[i]] = { ...current[parts[i]] };
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        return newData as PrescriptionFormData; // Cast back to the correct type
      });
    } else {
      // Handle top-level properties
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Keep existing handleCheckboxChange
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    if (name.includes('.')) {
      // Handle nested checkbox properties
      const parts = name.split('.');
      setFormData(prev => {
        const newData: any = { ...prev }; // Use any temporarily
        let current = newData;
        for (let i = 0; i < parts.length - 1; i++) {
           if (!current[parts[i]]) {
             current[parts[i]] = {}; // Initialize if undefined
          }
          current[parts[i]] = { ...current[parts[i]] };
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = checked;
        return newData as PrescriptionFormData; // Cast back
      });
    } else {
      // Handle top-level checkbox properties
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    }
  };

  // Keep existing handleNumericInputChange
  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Skip processing if name is undefined
    if (!name) {
      console.error('Input name is undefined in handleNumericInputChange');
      return;
    }

    let processedValue = value;

    // For RPD and LPD fields, allow direct input without formatting
    if (name.includes('rpd') || name.includes('lpd')) {
      processedValue = value;
    } else if (name.includes('ax')) {
      // For axial, ensure integer between 0-180
      processedValue = value.replace(/[^0-9]/g, '');
      const numValue = parseInt(processedValue, 10);
      if (!isNaN(numValue)) {
         if (numValue > 180) {
           processedValue = '180';
         } else if (numValue < 0) {
            processedValue = '0';
         }
      } else {
        processedValue = '';
      }
    } else {
      // For other numeric fields, allow numbers, decimal point, and negative sign
      processedValue = value.replace(/[^0-9.-]/g, '');
    }

    // Create a synthetic event with the processed value
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: name,
        value: processedValue,
      }
    } as React.ChangeEvent<HTMLInputElement>;

    // Call the main handleChange with the synthetic event (this will now route back to handleSearchInputChange for search fields if applicable)
    handleChange(syntheticEvent);
  };

   // Helper functions for manual entry (Keep these)
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
      setNotification({
        message: 'Please enter both item name and rate',
        type: 'error',
        visible: true,
      });
      return;
    }

    const newItem: SelectedItem = {
      si: formData.selectedItems.length + 1,
      itemCode: generateItemCode(formData.manualEntryType), // Assuming generateItemCode exists
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
     setNotification({
       message: 'Manual item added',
       type: 'success',
       visible: true
     });
  };

  const handleDeleteItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter((_, i) => i !== index)
    }));
     setNotification({
       message: 'Item deleted',
       type: 'success',
       visible: true
     });
  };

  const handleOrderCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Order Card Data Submitted:', formData);
     setNotification({
       message: 'Order Card submitted! Check console for data.',
       type: 'success',
       visible: true
     });
    // TODO: Implement actual save logic
  };

  const handleClear = () => {
    setFormData(initialFormState);
    setRetestAfterChecked(false);
     setNotification({
       message: 'Form cleared',
       type: 'success',
       visible: true
     });
  };

  const handleApplyDiscount = () => {
    const discountValue = parseFloat(formData.applyDiscount || '0');
    if (discountValue <= 0) {
      setNotification({
        message: 'Please enter a valid discount value (greater than 0)',
        type: 'error',
        visible: true
      });
      return;
    }
    const totalBeforeDiscount = formData.selectedItems.reduce(
      (sum, item) => sum + (item.rate * item.qty),
      0
    );
    if (totalBeforeDiscount <= 0) {
      setNotification({
        message: 'No items to apply discount to',
        type: 'error',
        visible: true
      });
      return;
    }
    const discountType = formData.discountType || 'percentage';
    const discountAmount = discountType === 'percentage'
      ? (totalBeforeDiscount * discountValue) / 100
      : Math.min(discountValue, totalBeforeDiscount);
    const updatedItems = formData.selectedItems.map(item => {
      const itemTotal = item.rate * item.qty;
      // Avoid division by zero if itemTotal is 0
      const ratio = itemTotal === 0 ? 0 : itemTotal / totalBeforeDiscount;
      const itemDiscount = discountAmount * ratio;
      const discountedTotal = itemTotal - itemDiscount;
      return {
        ...item,
        amount: parseFloat(discountedTotal.toFixed(2)),
        discountAmount: parseFloat(itemDiscount.toFixed(2)),
        discountPercent: itemTotal === 0 ? 0 : parseFloat(((itemDiscount / itemTotal) * 100).toFixed(2)), // Avoid division by zero
      };
    });
    setFormData(prev => ({
      ...prev,
      selectedItems: updatedItems,
      applyDiscount: '', // Clear discount input after applying
      // paymentEstimate is recalculated by useEffect based on selectedItems
    }));
    setNotification({
      message: `Discount applied successfully!`, // More generic message as it's applied item-wise
      type: 'success',
      visible: true
    });
  };

  const handleItemDiscountChange = (index: number, type: 'percentage' | 'fixed', value: string) => {
    const numericValue = parseFloat(value) || 0;

    setFormData(prev => {
      const updatedItems = [...prev.selectedItems];
      const item = { ...updatedItems[index] };
      const itemTotal = item.rate * item.qty;

      if (itemTotal === 0) return prev; // Prevent changes if item amount is 0

      if (type === 'percentage') {
        const percentage = Math.min(100, Math.max(0, numericValue));
        const discountAmount = (itemTotal * percentage) / 100;
        item.discountPercent = percentage;
        item.discountAmount = parseFloat(discountAmount.toFixed(2));
        item.amount = parseFloat((itemTotal - discountAmount).toFixed(2));
      } else { // type === 'fixed'
        const discountAmount = Math.min(itemTotal, Math.max(0, numericValue));
        const discountPercentage = (discountAmount / itemTotal) * 100;
        item.discountAmount = parseFloat(discountAmount.toFixed(2));
        item.discountPercent = parseFloat(discountPercentage.toFixed(2));
        item.amount = parseFloat((itemTotal - discountAmount).toFixed(2));
      }
      updatedItems[index] = item;

      // Manually trigger payment estimate update since selectedItems is the dependency
      const total = updatedItems.reduce((sum, i) => sum + i.amount, 0);
      const schAmt = updatedItems.reduce((sum, i) => sum + (i.discountAmount || 0), 0);
      const advance = prev.advance === '' ? 0 : parseFloat(prev.advance);
      const balance = total - (schAmt + advance); // Use total after item discounts

      return {
        ...prev,
        selectedItems: updatedItems,
        paymentEstimate: total.toFixed(2), // Update payment estimate based on discounted item amounts
        schAmt: schAmt.toFixed(2), // Update scheme amount based on item discounts
        balance: balance.toFixed(2) // Recalculate balance
      };
    });
  };


  // Helper functions (Keep these)
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
    const prefix = type === 'Frames' ? 'FRM' : (type === 'Sun Glasses' ? 'SUN' : 'LEN');
    return `${prefix}${Date.now().toString().slice(-4)}`;
  }

  return (
    <form onSubmit={handleOrderCardSubmit} className="w-full max-w-screen-xl mx-auto p-4 bg-gray-100 font-sans text-sm">
      <Card className="mb-4 p-4 shadow-lg rounded-md bg-white border border-gray-200">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b pb-3 bg-blue-100 rounded-t-md px-4 py-2">
          <div className="flex space-x-1 mb-2 sm:mb-0">
            {/* Navigation Buttons - Keep these for now */} 
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
            {/* Prescription No. with Autocomplete */}
            <div className="relative">
              <Input
                label="Prescription No.:"
                name="prescriptionNo"
                value={formData.prescriptionNo}
                onChange={handleChange} // Use the main handleChange
                onFocus={() => setActiveField('prescriptionNo')}
                autoComplete="off" // Prevent browser autocomplete
              />
              {activeField === 'prescriptionNo' && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto"
                >
                  <ul className="divide-y divide-gray-200">
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.id} // Use unique ID from API
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        {suggestion.prescriptionNo} - {suggestion.name} ({suggestion.mobileNo || suggestion.phoneLandline})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Reference No. with Autocomplete */}
            <div className="relative">
              <Input
                label="Reference No.:"
                name="referenceNo"
                value={formData.referenceNo}
                onChange={handleChange} // Use the main handleChange
                onFocus={() => setActiveField('referenceNo')}
                 autoComplete="off"
              />
               {activeField === 'referenceNo' && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto"
                >
                  <ul className="divide-y divide-gray-200">
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                         {suggestion.referenceNo} - {suggestion.name} ({suggestion.mobileNo || suggestion.phoneLandline})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Input label="Current Date/Time:" value={formData.currentDateTime} name="currentDateTime" onChange={handleChange} type="datetime-local" readOnly />
            <Input label="Delivery Date/Time:" value={formData.deliveryDateTime} name="deliveryDateTime" onChange={handleChange} type="datetime-local"/>
            <Select label="Class:" options={classOptions} value={formData.class} name="class" onChange={handleChange} />
            <Input label="Booking By" value={formData.bookingBy} name="bookingBy" onChange={handleChange} />
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 gap-3 text-gray-700 border p-4 rounded bg-blue-50 shadow-sm">
            {/* Name with Autocomplete */}
            <div className="relative">
              <Input
                label="Name"
                value={formData.name}
                onChange={handleChange} // Use the main handleChange
                name="name"
                required
                onFocus={() => setActiveField('name')}
                 autoComplete="off"
              />
               {activeField === 'name' && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto"
                >
                  <ul className="divide-y divide-gray-200">
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                         {suggestion.name} - {suggestion.mobileNo || suggestion.phoneLandline} ({suggestion.prescriptionNo || suggestion.referenceNo})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
             <Select
                label="Title"
                options={titleOptions}
                value={formData.title}
                onChange={handleChange}
                name="title"
                className="w-24"
                fullWidth={false}
              />
               {/* Reverted Gender to RadioGroup as per original code */} 
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
            <Input
              label="Age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              name="age"
            />
             <Input
                label="Customer Code:"
                value={formData.customerCode}
                onChange={handleChange}
                name="customerCode"
              />
              <Input
                label="Birth Day:"
                type="date"
                value={formData.birthDay}
                onChange={handleChange}
                name="birthDay"
              />
              <Input
                label="Marr Anniv:"
                type="date"
                value={formData.marriageAnniversary}
                onChange={handleChange}
                name="marriageAnniversary"
              />
               <Input
                label="Address"
                value={formData.address}
                onChange={handleChange}
                name="address"
              />
              <Input
                label="City"
                value={formData.city}
                onChange={handleChange}
                name="city"
              />
              <Input
                label="State"
                value={formData.state}
                onChange={handleChange}
                name="state"
              />
              <Input
                label="Pin"
                value={formData.pinCode}
                onChange={handleChange}
                name="pinCode"
              />
            {/* Phone No. with Autocomplete */}
            <div className="relative">
              <Input
                label="Mobile No.:"
                value={formData.mobileNo}
                onChange={handleChange} // Use the main handleChange
                name="mobileNo"
                required
                onFocus={() => setActiveField('mobileNo')}
                 autoComplete="off"
              />
               {activeField === 'mobileNo' && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto"
                >
                  <ul className="divide-y divide-gray-200">
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                         {suggestion.mobileNo || suggestion.phoneLandline} - {suggestion.name} ({suggestion.prescriptionNo || suggestion.referenceNo})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
             <Input
                label="Phone (L.L.)"
                value={formData.phoneLandline}
                onChange={handleChange}
                name="phoneLandline"
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                name="email"
              />
            </div>
             <Input label="IPD:" value={formData.ipd} name="ipd" onChange={handleNumericInputChange} className="text-center" readOnly /> 
            <Input label="Prescribed By" value={formData.prescribedBy} name="prescribedBy" onChange={handleChange} />
            <Checkbox label="Billed" checked={formData.billed} onChange={handleCheckboxChange} name="billed" />
        </div>

        {/* Prescription Section */}
        {/* Re-using your existing PrescriptionSection component */} 
        <PrescriptionSection
          formData={{
            rightEye: formData.rightEye,
            leftEye: formData.leftEye,
            balanceLens: formData.balanceLens,
            age: parseInt(formData.age) || 0 // Ensure age is a number
          }}
          handleChange={handleChange}
          handleNumericInputChange={handleNumericInputChange}
          handleCheckboxChange={handleCheckboxChange}
        />

        {/* Spectacles Section */}
         {/* Re-integrating the Spectacles Section structure */} 
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
                                              // Recalculate amount based on updated rate and existing discount/qty
                                              const itemTotal = value * updatedItems[index].qty;
                                              const discountAmount = updatedItems[index].discountAmount || 0;
                                              updatedItems[index].amount = itemTotal - discountAmount;
                                               // Recalculate discount % based on new rate and fixed discount amount
                                              updatedItems[index].discountPercent = itemTotal === 0 ? 0 : parseFloat(((discountAmount / itemTotal) * 100).toFixed(2));

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
                                              // Recalculate amount based on updated qty and existing discount/rate
                                               const itemTotal = updatedItems[index].rate * value;
                                              const discountAmount = updatedItems[index].discountAmount || 0;
                                              updatedItems[index].amount = itemTotal - discountAmount;
                                                // Recalculate discount % based on new qty and fixed discount amount
                                              updatedItems[index].discountPercent = itemTotal === 0 ? 0 : parseFloat(((discountAmount / itemTotal) * 100).toFixed(2));
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
                              )))}
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
                              onChange={handleChange} // Use main handleChange
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
                              onChange={handleChange} // Use main handleChange
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
                            onChange={handleChange} // Use main handleChange
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
        {/* Remarks and Payment Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Remarks and Status */} 
            <RemarksAndStatusSection
                formData={formData}
                handleChange={handleChange}
            />
            {/* Payment Section */} 
            <PaymentSection
                formData={formData}
                handleChange={handleChange}
                handleNumericInputChange={handleNumericInputChange}
            />
        </div>

        {/* Bottom Buttons */}
        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 mt-8">
          <Button type="submit" variant="action">&#60;&#60; Add Order Card &#62;&#62;</Button>
          {/* These buttons might need logic to interact with search/edit/print features */} 
          <Button type="button" variant="action">&#60;&#60; Edit/Search Order Card &#62;&#62;</Button> 
          <Button type="button" variant="action">&#60;&#60; Print Order Card &#62;&#62;</Button>
          <Button type="button" variant="action" onClick={handleClear}>&#60;&#60; Clear Order &#62;&#62;</Button>
          <Button type="button" variant="action">&#60;&#60; Exit &#62;&#62;</Button>
        </div>

      </Card>

      {/* Render the Toast Notification */} 
      {notification.visible && (
        <ToastNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, visible: false })}
        />
      )}

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
              {/* Assuming RadioGroup is needed, it was in the original CustomerInfoSection */} 
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
              <Button type="button" variant="action" onClick={() => {
                if (!formData.manualEntryItemName || !formData.manualEntryRate) {
                  setNotification({
                    message: 'Please enter both item name and rate',
                    type: 'error',
                    visible: true,
                  });
                  return;
                }
                const newItem: SelectedItem = {
                  si: formData.selectedItems.length + 1,
                  itemCode: generateItemCode(formData.manualEntryType), // Assuming generateItemCode exists
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
                 setNotification({
                   message: 'Manual item added',
                   type: 'success',
                   visible: true
                 });
              }}>Add</Button>
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
                if (!lensEntry.itemName || !lensEntry.rate) { setNotification({ message: 'Please enter item name and rate', type: 'error', visible: true }); return; }
                const newItem: SelectedItem = {
                  si: formData.selectedItems.length + 1,
                  itemCode: generateItemCode('Lens'), // Assuming generateItemCode exists
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
                 setNotification({
                   message: 'Lens item added',
                   type: 'success',
                   visible: true
                 });
              }}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default OrderCardForm; 