import './App.css'
import { primusProofTest } from './testprimus'

function App() {
  return (
    <>
      <h1>Primus Demo</h1>
      <div className="card">
        {/* Live attestation via the Primus extension. There is deliberately no
            "replay a captured attestation" path: a real attestation cannot be
            de-identified (the signature covers the account data), so committing one
            would mean shipping somebody's portfolio and salt. */}
        <button onClick={primusProofTest}>
          Start Attestation (live)
        </button>
      </div>
    </>
  )
}

export default App
