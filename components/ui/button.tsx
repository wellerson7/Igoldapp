import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary'; // Agora só aceita 'primary'
};

export function Button({
  children,
  variant = 'primary', // Default é 'primary'
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const baseStyles =
    'px-4 py-2 rounded shadow-sm transition-opacity duration-150 focus:outline-none disabled:opacity-50';
  const variantStyles = 'bg-black text-white hover:bg-gray-900'; // Só tem o estilo primary

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
