import React from 'react';
import logo from '../../assets/img/logo.svg';
import './Newtab.css';
import './Newtab.scss';

const Newtab = () => {
  const onClickInit = () => {};
  const onClickStartOffline = () => {};
  const onClickAttest = () => {};
  return (
    <div className="App">
      <header className="App-header">
        <button className="btn btn1" onClick={onClickInit}>
          init
        </button>
        <button className="btn btn2" onClick={onClickStartOffline}>
          startOffline
        </button>
        <button className="btn btn3" onClick={onClickAttest}>
          attest
        </button>
      </header>
    </div>
  );
};

export default Newtab;
