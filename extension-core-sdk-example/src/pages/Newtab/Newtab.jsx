import React from 'react';
import logo from '../../assets/img/logo.svg';
import './Newtab.css';
import './Newtab.scss';

const Newtab = () => {
  const onClickAttest = () => {
    chrome.runtime.sendMessage({
      type: 'PrimusExtCoreTLS',
      method: 'startAttestation',
    });
  };
  return (
    <div className="App">
      <header className="App-header">
        <button className="btn btn3" onClick={onClickAttest}>
          attest
        </button>
      </header>
    </div>
  );
};

export default Newtab;
