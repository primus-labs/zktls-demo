import { FundDemo } from './FundDemo_Extension'
import { ClaimDemo } from './ClaimDemo'
// import { PrimusCoreTLSDemo } from './PrimusCoreTLSDemo'
import { FundCoreDemo } from './FundDemo_CoreSDK'
import { ClaimCoreDemo } from './ClaimDemo_CoreSDK'
import './App.css'

function App() {
  return (
    <div className="container">
      <h1>Primus Fund SDK Demo</h1>
      <p>This demo shows how to use the Primus Fund SDK on Monad Testnet.</p>
      
      <div className="demo-container">
        <div className="grid grid-cols-2 gap-4">
          <div className="demo-section">
            <FundDemo />
          </div>
          
          <div className="demo-section">
            <ClaimDemo />
          </div>
          
          <div className="demo-section">
            <FundCoreDemo />
          </div>
          
          <div className="demo-section">
            <ClaimCoreDemo />
          </div>
          
          {/* Use this to debug Core SDK */}
          {/* <div className="demo-section col-span-2">
            <PrimusCoreTLSDemo />
          </div> */}
        </div>
      </div>
    </div>
  )
}

export default App
