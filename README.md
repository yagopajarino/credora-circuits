# ZK Email Proof Generator for Smart Contracts

This script generates ZK Email proofs from email content and formats them for smart contract verification using your Groth16 verifier.

## 🚀 Quick Start

### Generate proof from email file:
```bash
npm run generate-proof ./eml/my-email.eml
```

### Or use yarn:
```bash
yarn generate-proof ./eml/my-email.eml
```

## 📋 Output

The script will generate:

1. **Console output** with Remix IDE calldata
2. **JSON file** (`contract-proof-data.json`) with formatted proof data
3. **Ready-to-use parameters** for smart contract calls

### Example Output:
```
🎉 SUCCESS! Proof generated and formatted for smart contract use.

📋 REMIX IDE CALLDATA:
Copy these values into Remix IDE:

_pA:
["5935342429905669798909694160966625259556108435122261200506747692825214770252","7737080687389232745161034148670034495085102585920655274302291277546831021785"]

_pB:
[["20913831459680004226941204658017231128717233593749262560960809911561791910570","16930313845145212763390348133607137273752112325984693749932391786861229722145"],["4026565236083366998374496089484852302675920547012199177549402294755483743206","8562875466915112525812459155447087319217617292806894465414462226890545266640"]]

_pC:
["6411231600650276422069650765836218869466311751482780230200532592979205292025","2854063234785198537624287713180918149293719408593712268228182116712084492152"]

_pubSignals:
["2947746231636927925276790830637267471457698983303944749031642962373791107985","142529241059546559772806697304092831350","199117628540160284500033034902936894931","11362788075416929775276022722411606929241","0"]
```

## 🔧 Programmatic Usage

### Import and use in your code:

```typescript
import { generateProofFromFile, generateProofForContract } from './generateProofForContract';

// From file
const proofData = await generateProofFromFile('./path/to/email.eml');

// From string content
const emailContent = "from: sender@example.com\nsubject: You've been paid!\n...";
const proofData = await generateProofForContract(emailContent);

// Use in smart contract call
const isValid = await verifierContract.verifyProof(
  proofData.pA,
  proofData.pB, 
  proofData.pC,
  proofData.pubSignals
);
```

## 📄 Data Structure

The generated proof data includes:

```typescript
interface ContractProofData {
  pA: [string, string];                           // Proof point A
  pB: [[string, string], [string, string]];      // Proof point B (2x2 matrix)
  pC: [string, string];                           // Proof point C
  pubSignals: [string, string, string, string, string]; // Public signals (5 elements)
  functionCall: string;                           // Ready-to-use function call
  rawCalldata: {                                  // Raw parameters for contract calls
    _pA: [string, string];
    _pB: [[string, string], [string, string]];
    _pC: [string, string];
    _pubSignals: [string, string, string, string, string];
  };
}
```

## 🎯 Smart Contract Integration

### Using ethers.js:
```typescript
const verifierContract = new ethers.Contract(contractAddress, verifierABI, signer);
const isValid = await verifierContract.verifyProof(
  proofData.pA,
  proofData.pB,
  proofData.pC, 
  proofData.pubSignals
);
```

### Using web3.js:
```typescript
const verifierContract = new web3.eth.Contract(verifierABI, contractAddress);
const isValid = await verifierContract.methods.verifyProof(
  proofData.pA,
  proofData.pB,
  proofData.pC,
  proofData.pubSignals
).call();
```

## 🔍 What the Proof Verifies

This ZK proof demonstrates that you received an email with the subject "You've been paid!" from a Deel email address, without revealing any other email content or metadata.

## ⚠️ Requirements

- Node.js and npm/yarn
- TypeScript
- ZK Email SDK dependencies (already in package.json)
- Valid email file in `.eml` format

## Generate Verifier Contract

Based on the [Docs](https://docs.zk.email/zk-email-verifier/usage-guide#on-chain-verification)

Download the zkey from the registry blueprint and run the following command

`snarkjs zkey export solidityverifier circuit.zkey verifier.sol`

