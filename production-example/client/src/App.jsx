import './App.css'
import { primusProof } from './primus'

function App() {

  return (
    <>
      <h1>Primus Demo</h1>
      <div className="card">
        <button onClick={primusProof}>
          Start Attestaion
        </button>
      </div>
    </>
  )
}

export default App
