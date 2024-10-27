import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import TokenLaunchPad from './components/TokenLaunchPad'
import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css'

function App() {
  
   const rpcUrl='https://api.devnet.solana.com'
 

  return (
   <ConnectionProvider endpoint={rpcUrl}>
    <WalletProvider wallets={[]} autoConnect>
      <WalletModalProvider>
        <WalletMultiButton/>
         <TokenLaunchPad/>
      </WalletModalProvider>
    </WalletProvider>
   </ConnectionProvider>
  )
}

export default App
