import React from 'react';
import { X } from 'lucide-react';

interface EndWebinarModalProps {
  onClose: () => void;
}

const EndWebinarModal: React.FC<EndWebinarModalProps> = ({ onClose }) => {
  return (
    <div className="fitino-landing fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="fp-card fp-notch relative w-full max-w-lg bg-[#101314] p-6 md:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 transition-colors hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-white md:text-3xl">
            کارگاه به پایان رسید
          </h2>
          <p className="mb-6 text-white/60">
            ممنون از حضور شما در این کارگاه. حالا نوبت شماست که با راهنمایی مربی، مسیر تمرین و تغذیه اختصاصی‌تان را شروع کنید.
          </p>
          <button
            onClick={onClose}
            className="fp-notch-btn bg-gradient-to-l from-[#187272] via-[#2a9c96] to-[#26fce3] px-6 py-3 font-bold text-white shadow-[0_0_24px_-6px_rgba(38,252,227,0.5)] transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            شروع مسیر من
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndWebinarModal;
