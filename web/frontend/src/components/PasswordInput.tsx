import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './Icons';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const PasswordInput: React.FC<PasswordInputProps> = ({ className, ...props }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="password-input-wrap">
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={className}
      />
      <button
        type="button"
        className="password-toggle-btn"
        aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
        tabIndex={-1}
        onClick={() => setShow((prev) => !prev)}
      >
        {show ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
      </button>
    </div>
  );
};
