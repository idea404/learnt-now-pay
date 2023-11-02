import React, { useState } from 'react';
import * as ethers from 'zksync-web3';

const CONTRACT_ADDRESS = "0x28f959283F7Fc0a9c56e9Dc70e9d77dE99442603"; // Get contract address from deploy script: TutorialSubmission

function App() {
  const [account, setAccount] = useState(null);
  const [poapNftId, setPoapNftId] = useState('');
  const [tutorialName, setTutorialName] = useState('Tutorial');  // Set default value to 'Tutorial'
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

    if (deployedTestnetAddress.length !== 42 || !deployedTestnetAddress.startsWith('0x')) {
      alert('Please input a valid testnet address.');
      return;
    }

    const ABI = [
      {
        "name": "submitTutorial",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
          { "name": "poapNftId", "type": "uint256" },
          { "name": "deployedTestnetAddress", "type": "string" },
          { "name": "tutorialName", "type": "string" }
        ],
        "outputs": []
      }
    ];

    const provider = new ethers.Web3Provider(window.ethereum);
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
            <option value="PoapMultiplier">PoapMultiplier</option>
            <option value="Tutorial 1">Tutorial 1</option>
            <option value="Tutorial 2">Tutorial 2</option>
            {/* ... */}
          </select>
          <input
            type="text"
            placeholder="Paste your Testnet Address"
            value={deployedTestnetAddress}
            onChange={(e) => {
              const value = e.target.value;
              setDeployedTestnetAddress(value);
            }}
          />
          <button onClick={submitTutorial}>Submit</button>
        </div>
      )}
    </div>
  );
}

export default App;
