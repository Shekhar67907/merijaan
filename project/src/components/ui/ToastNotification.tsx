import React, { useEffect } from 'react';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | '';
  visible: boolean;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type,
  visible,
  onClose
}) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-dismiss after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-gray-500';

  return (
    <div className={`fixed bottom-4 right-4 p-4 text-white rounded shadow-lg ${bgColor} z-50`}>
      {message}
    </div>
  );
};

export default ToastNotification; 