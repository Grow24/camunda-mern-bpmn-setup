import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { removeToast } from '../../store/slices/uiSlice';
import { Toast } from './Toast';

export function ToastContainer() {
  const toasts = useSelector((state: RootState) => state.ui.toasts);
  const dispatch = useDispatch();

  const handleRemove = (id: string) => {
    dispatch(removeToast(id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onRemove={() => handleRemove(toast.id)}
        />
      ))}
    </div>
  );
}