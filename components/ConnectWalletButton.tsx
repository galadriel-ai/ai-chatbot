import { FC, useEffect, useState } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

interface TransactionDetails {
  transaction_data: string;
  input_mint: string;
  output_mint: string;
  input_amount: string;
}

const ConnectWalletButton: FC<{
  transactionDetails?: TransactionDetails;
  onTransactionComplete?: (signature: string) => void;
}> = ({ transactionDetails, onTransactionComplete }) => {
  const [wallet, setWallet] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (transactionDetails) {
      const getProvider = () => {
        if ('phantom' in window) {
          const provider = (window as any).phantom?.solana;
          if (provider?.isPhantom) {
            return provider;
          }
        }
        window.open('https://phantom.app/', '_blank');
      };

      setWallet(getProvider());
    }
  }, [transactionDetails]);

  const handleTransaction = async () => {
    if (!transactionDetails || !wallet) return;

    try {
      // Connect wallet if not connected
      if (!connected) {
        await wallet.connect();
        setConnected(true);
      }

      // Create and send transaction
      const connection = new Connection('https://api.mainnet-beta.solana.com');
      
      // Parse the input amount from lamports
      const lamports = parseInt(transactionDetails.input_amount.split(' ')[0]);
      
      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(transactionDetails.output_mint),
          lamports: lamports,
        })
      );

      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Sign and send transaction
      const signed = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      
      // Notify parent component
      if (onTransactionComplete) {
        onTransactionComplete(signature);
      }

      console.log('Transaction successful:', signature);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  // Only render if we have transaction details
  if (!transactionDetails) {
    return null;
  }

  return (
    <button
      onClick={handleTransaction}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
    >
      <span>Sign Transaction</span>
    </button>
  );
};

export default ConnectWalletButton; 