import React from 'react';
import Input from '../ui/Input';

interface PaymentSectionProps {
  formData: { // TODO: Replace with specific form data type
    paymentEstimate: string;
    schAmt: string;
    advanceCash: string;
    advanceCheque: string;
    advanceCard: string;
    advanceGPay: string;
    advancePaytm: string;
    advanceOther: string;
    balance: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleNumericInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Assuming some fields are numeric
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  formData,
  handleChange,
  handleNumericInputChange,
}) => {
  return (
    <div className="mb-6 border p-4 rounded bg-white shadow-sm text-gray-700">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 text-blue-700">Payment Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Payment Estimate:"
          value={formData.paymentEstimate}
          name="paymentEstimate"
          onChange={handleNumericInputChange}
          type="text" // Use text for formatted input
        />
        <Input
          label="*Sch Amt:"
          value={formData.schAmt}
          name="schAmt"
          onChange={handleNumericInputChange}
          type="text"
        />
        <Input
          label="Advance Cash:"
          value={formData.advanceCash}
          name="advanceCash"
          onChange={handleNumericInputChange}
          type="text"
        />
        <Input
          label="Advance Cheque:"
          value={formData.advanceCheque}
          name="advanceCheque"
          onChange={handleNumericInputChange}
          type="text"
        />
        <Input
          label="Advance Card:"
          value={formData.advanceCard}
          name="advanceCard"
          onChange={handleNumericInputChange}
          type="text"
        />
        <Input
          label="Advance GPay:"
          value={formData.advanceGPay}
          name="advanceGPay"
          onChange={handleNumericInputChange}
          type="text"
        />
        <Input
          label="Advance Paytm:"
          value={formData.advancePaytm}
          name="advancePaytm"
          onChange={handleNumericInputChange}
          type="text"
        />
        <Input
          label="Advance Other:"
          value={formData.advanceOther}
          name="advanceOther"
          onChange={handleNumericInputChange}
          type="text"
        />
        <Input
          label="Balance:"
          value={formData.balance}
          name="balance"
          readOnly // Balance will be calculated
          type="text"
          className="bg-blue-100"
        />
      </div>
      {/* TODO: Add Balance calculation logic */}
    </div>
  );
};

export default PaymentSection; 