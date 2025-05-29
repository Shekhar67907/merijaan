import React, { useState } from 'react';
import PrescriptionForm from './PrescriptionForm';
import { PrescriptionData } from '../../types';
import { useAutoSave } from '../../hooks/useAutoSave';
import ToastNotification from '../ui/ToastNotification';

const PrescriptionPage: React.FC = () => {
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

  // Auto-save will run silently without showing notifications
  const { manualSave, isSaving } = useAutoSave(formData, {
    onSaveSuccess: (data) => {
      // Don't show notifications for background auto-saves
      console.log('Auto-save completed silently');
    },
    onSaveError: (error) => {
      // Only show error notifications (important for users to know)
      showErrorToast(error);
    }
  });

  const handleSubmit = async (data: PrescriptionData) => {
    console.log('PrescriptionPage: handleSubmit triggered', data);
    setFormData(data);
    
    try {
      await manualSave();
      // Show success notification only for manual saves
      showSuccessToast();
    } catch (error) {
      // Error handling is already covered by onSaveError
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Prescription Entry Form</h2>
      <PrescriptionForm onSubmit={handleSubmit} />
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