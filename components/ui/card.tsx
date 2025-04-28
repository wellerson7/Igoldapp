import React from 'react';

export function Card({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white rounded-xl shadow ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 ${className || ''}`} {...props}>
      {children}
    </div>
  );
}
