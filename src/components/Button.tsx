import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode; 
}

const Button: React.FC<ButtonProps> = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`px-1 py-1 text-white bg-pink-500 rounded-lg hover:bg-black justify-end transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;


  