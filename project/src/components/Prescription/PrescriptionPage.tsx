import React from 'react';
import PrescriptionForm from './PrescriptionForm';
import { PrescriptionData } from '../../types';

const PrescriptionPage: React.FC = () => {
  const handleSubmit = (data: PrescriptionData) => {
    console.log('Prescription data:', data);
    // Here we would normally send the data to a backend service
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Prescription Entry Form</h2>
      <PrescriptionForm onSubmit={handleSubmit} />
    </div>
  );
};

export default PrescriptionPage;