import React, { useState } from 'react';
import { ethers } from 'ethers';

function App() {
  const [account, setAccount] = useState(null);
  const [poapNftId, setPoapNftId] = useState('');
  const [tutorialName, setTutorialName] = useState('');
  const [deployedTestnetAddress, setDeployedTestnetAddress] = useState('');

  const connectMetamask = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } else {
      alert('Please install Metamask extension to continue.');
    }
  };

  const submitTutorial = async () => {
    if (!account) {
      alert('Please connect to Metamask first.');
      return;
    }

    const CONTRACT_ADDRESS = 'YOUR_ZKSYNC_TESTNET_ADDRESS_HERE';  // TODO: input deployed contract testnet address
    const ABI = [
      {
        "name": "submitTutorial",
        "type": "function",
        "inputs": [
          { "name": "poapNftId", "type": "uint256" },
          { "name": "deployedTestnetAddress", "type": "string" },
          { "name": "tutorialName", "type": "string" }
        ],
        "outputs": []
      }
    ];

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider.getSigner());
    await contract.submitTutorial(poapNftId, deployedTestnetAddress, tutorialName);
  };

  return (
    <div className="App">
      {!account ? (
        <button onClick={connectMetamask}>Connect with Metamask</button>
      ) : (
        <div>
          <input
            type="number"
            placeholder="POAP NFT ID"
            value={poapNftId}
            onChange={(e) => setPoapNftId(e.target.value)}
          />
          <select value={tutorialName} onChange={(e) => setTutorialName(e.target.value)}>
            {/* Add your tutorial names here */}
            <option value="Tutorial 1">Tutorial 1</option>
            <option value="Tutorial 2">Tutorial 2</option>
            {/* ... */}
          </select>
          <input
            type="text"
            placeholder="Deployed Contract Testnet Address"
            value={deployedTestnetAddress}
            onChange={(e) => {
              const value = e.target.value;
              if (value.startsWith('0x') && value.length === 42) {
                setDeployedTestnetAddress(value);
              }
            }}
          />
          <button onClick={submitTutorial}>Submit</button>
        </div>
      )}
    </div>
  );
}

export default App;
