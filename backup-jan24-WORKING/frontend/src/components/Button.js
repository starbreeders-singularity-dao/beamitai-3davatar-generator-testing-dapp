import React from 'react';
import '../App.css';  // Correct relative path to App.css

const Button = ({ label, onClick, disabled }) => (
  <button className="App-link" onClick={onClick} disabled={disabled}>
    {label}
  </button>
);

export default Button;
