import React from 'react';
import logo from '../images/beamit-ai-logo.png';
import '../App.css';

function MainApp() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} alt="Beamit AI Logo" />
        <h1>Main Application Page</h1>
      </header>
      <div className="App-content">
        <p>Welcome to the main application page!</p>
        <button>Click Me</button>
        {/* Add more content or components here as needed */}
      </div>
    </div>
  );
}

export default MainApp; 