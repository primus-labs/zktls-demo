import { useState } from 'react'
import './App.css'
import { primusProofTest } from './testprimus'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Primus Demo</h1>
      <div className="card">
        <button onClick={primusProofTest}>
          Start Attestaion
        </button>
      </div>
    </>
  )
}

export default App
