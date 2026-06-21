import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // primary, outline, ghost
  size = 'md', // sm, md, lg
  className = '',
  loading = false,
  disabled = false,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary-glow",
    outline: "border border-primary text-primary hover:bg-primary/10",
    ghost: "text-text-secondary hover:text-primary hover:bg-white/5",
    danger: "bg-danger hover:bg-red-600 text-white shadow-md shadow-red-500/20"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-8 py-3.5 text-lg"
  };

  // Note: we are using inline styles for pure CSS implementation without Tailwind,
  // but using generic classnames allows for easier porting.
  // Actually, wait, the index.css doesn't use Tailwind, so we should map these to regular CSS or use inline styles carefully.
  // Let's refine this to use standard CSS classes that we can define or just inline some of them if not in index.css.
  // We'll add some button classes to index.css if needed, but let's just output raw standard classes for now and update index.css to match.

  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <><i className="fas fa-spinner animate-spin mr-2"></i> Memproses...</>
      ) : (
        children
      )}
    </button>
  );
};
