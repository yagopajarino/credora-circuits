import { generateProofFromFile, generateProofForContract, saveProofData } from './generateProofForContract';

/**
 * Example 1: Generate proof from existing email file
 */
async function exampleFromFile() {
  console.log("🔄 Example 1: Generating proof from email file...");
  
  try {
    const proofData = await generateProofFromFile('./eml/deel.eml');
    
    console.log("✅ Proof generated successfully!");
    console.log("📋 Ready for Remix IDE:");
    console.log("_pA:", JSON.stringify(proofData.rawCalldata._pA));
    console.log("_pB:", JSON.stringify(proofData.rawCalldata._pB));
    console.log("_pC:", JSON.stringify(proofData.rawCalldata._pC));
    console.log("_pubSignals:", JSON.stringify(proofData.rawCalldata._pubSignals));
    
    // Save for later use
    await saveProofData(proofData, './example-proof-data.json');
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

/**
 * Example 2: Programmatic usage in your dApp
 */
async function exampleForDApp() {
  console.log("🔄 Example 2: Programmatic usage for dApp integration...");
  
  try {
    // Generate proof
    const proofData = await generateProofFromFile('./eml/deel.eml');
    
    // Use in your smart contract call (pseudo-code)
    console.log("📝 Smart contract integration example:");
    console.log(`
// Using ethers.js
const tx = await verifierContract.verifyProof(
  ${JSON.stringify(proofData.pA)},
  ${JSON.stringify(proofData.pB)},
  ${JSON.stringify(proofData.pC)},
  ${JSON.stringify(proofData.pubSignals)}
);

// Using web3.js  
const result = await verifierContract.methods.verifyProof(
  ${JSON.stringify(proofData.pA)},
  ${JSON.stringify(proofData.pB)},
  ${JSON.stringify(proofData.pC)},
  ${JSON.stringify(proofData.pubSignals)}
).call();
    `);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run examples
async function runExamples() {
  console.log("🚀 ZK Email Proof Generator Examples\n");
  
  // Uncomment the example you want to run:
  await exampleFromFile();
  // await exampleForDApp();
}

if (require.main === module) {
  runExamples().catch(console.error);
}

export { exampleFromFile, exampleForDApp };
