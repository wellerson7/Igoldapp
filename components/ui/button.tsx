import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'; // Aceita 'secondary' e 'danger' agora
};

export function Button({
  children,
  variant = 'primary', // Default para 'primary'
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const baseStyles =
    'px-4 py-2 rounded shadow-sm transition-opacity duration-150 focus:outline-none disabled:opacity-50';
  let variantStyles = '';

  switch (variant) {
    case 'secondary':
      variantStyles = 'bg-white text-black border border-gray-300 hover:bg-gray-100';
      break;
    case 'danger':
      variantStyles = 'bg-red-600 text-white hover:bg-red-700';
      break;
    default:
      variantStyles = 'bg-black text-white hover:bg-gray-900'; // Default é 'primary'
  }

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
