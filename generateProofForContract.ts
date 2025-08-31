import fs from "fs/promises";
import path from "path";
import zkeSDK, { initZkEmailSdk, ProofStatus } from "@zk-email/sdk";

// Copy slug from UI homepage
const blueprintSlug = "yagopajarino/Deel_YouHaveBeenPaid@v2";

interface ContractProofData {
  pA: [string, string];
  pB: [[string, string], [string, string]];
  pC: [string, string];
  pubSignals: [string, string, string, string, string];
  functionCall: string;
  rawCalldata: {
    _pA: [string, string];
    _pB: [[string, string], [string, string]];
    _pC: [string, string];
    _pubSignals: [string, string, string, string, string];
  };
}

/**
 * Generate ZK Email proof from email content and format for smart contract verification
 * @param emailContent - Raw email content as string
 * @returns Formatted proof data ready for smart contract calls
 */
async function generateProofForContract(emailContent: string): Promise<ContractProofData> {
  console.log("🚀 Initializing ZK Email SDK...");
  const sdk = initZkEmailSdk();

  // Get an instance of Blueprint
  console.log("📋 Loading blueprint...");
  const blueprint = await sdk.getBlueprint(blueprintSlug);

  // Create a prover from the blueprint
  console.log("⚡ Creating prover...");
  const prover = blueprint.createProver({
    isLocal: true
  });

  // Generate a proof request
  console.log("🔄 Generating proof (this may take a while)...");
  const proof = await prover.generateProofRequest(emailContent);

  // Check the status of the proof
  let status = await proof.checkStatus();
  console.log("📊 Initial status:", status === ProofStatus.InProgress ? "In Progress" : status);

  // Wait for completion
  console.log("⏳ Waiting for proof completion...");
  status = await proof.waitForCompletion();
  
  if (status === ProofStatus.Failed) {
    throw new Error("❌ Failed to generate proof");
  }

  console.log("✅ Proof generated successfully!");

  // Get the proof data
  const { proofData, publicData, externalInputs, publicOutputs } = proof.getProofData();
  
  console.log("📄 Public data:", publicData);
  console.log("🔍 External inputs:", externalInputs);

  // Format proof data for Solidity verifier contract
  const formattedProofData = formatProofForSolidity(proofData, publicOutputs);
  
  return formattedProofData;
}

/**
 * Helper function to format proof data for Solidity verifier contract
 */
function formatProofForSolidity(proofData: any, publicOutputs: string[] | any): ContractProofData {
  // Extract pi_a (first 2 elements, ignore the 3rd which is always 1)
  const pA: [string, string] = [proofData.pi_a[0], proofData.pi_a[1]];
  
  // Extract pi_b (2x2 matrix, but we need to reorder for Solidity)
  // Solidity expects [[x1, x2], [y1, y2]] format with swapped order for Fq2
  const pB: [[string, string], [string, string]] = [
    [proofData.pi_b[0][1], proofData.pi_b[0][0]], // Swap order for Fq2
    [proofData.pi_b[1][1], proofData.pi_b[1][0]]  // Swap order for Fq2
  ];
  
  // Extract pi_c (first 2 elements, ignore the 3rd which is always 1)
  const pC: [string, string] = [proofData.pi_c[0], proofData.pi_c[1]];
  
  // Handle both string[] and PublicOutputsSp1Response formats
  let pubSignalsArray: string[];
  if (Array.isArray(publicOutputs)) {
    pubSignalsArray = publicOutputs;
  } else {
    // If it's a PublicOutputsSp1Response object, extract the actual values
    pubSignalsArray = publicOutputs.outputs ? Object.values(publicOutputs.outputs).flat().map(String) : [];
  }
  
  // Public signals (first 5 elements)
  const pubSignals: [string, string, string, string, string] = [
    pubSignalsArray[0] || "0",
    pubSignalsArray[1] || "0", 
    pubSignalsArray[2] || "0",
    pubSignalsArray[3] || "0",
    pubSignalsArray[4] || "0"
  ];
  
  const functionCall = `verifyProof([${pA.join(', ')}], [[${pB[0].join(', ')}], [${pB[1].join(', ')}]], [${pC.join(', ')}], [${pubSignals.join(', ')}])`;
  
  return {
    pA,
    pB,
    pC,
    pubSignals,
    functionCall,
    rawCalldata: {
      _pA: pA,
      _pB: pB,
      _pC: pC,
      _pubSignals: pubSignals
    }
  };
}

/**
 * Generate proof from email file
 * @param emailFilePath - Path to the email file
 */
async function generateProofFromFile(emailFilePath: string): Promise<ContractProofData> {
  console.log(`📂 Reading email from: ${emailFilePath}`);
  
  try {
    const emailContent = await fs.readFile(emailFilePath, 'utf-8');
    return await generateProofForContract(emailContent);
  } catch (error) {
    throw new Error(`Failed to read email file: ${error}`);
  }
}

/**
 * Save proof data to JSON file for later use
 */
async function saveProofData(proofData: ContractProofData, outputPath: string = "./contract-proof-data.json"): Promise<void> {
  await fs.writeFile(outputPath, JSON.stringify(proofData, null, 2));
  console.log(`💾 Proof data saved to: ${outputPath}`);
}

/**
 * Main function for CLI usage
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📧 ZK Email Proof Generator for Smart Contracts

Usage:
  npm run generate-proof <email-file-path>
  
Example:
  npm run generate-proof ./eml/deel.eml
  
This will:
1. Generate a ZK proof from the email
2. Format it for smart contract verification  
3. Save the formatted data to contract-proof-data.json
4. Display the calldata for Remix IDE
    `);
    return;
  }

  const emailFilePath = args[0];
  
  try {
    // Generate proof from email file
    const proofData = await generateProofFromFile(emailFilePath);
    
    // Save to file
    await saveProofData(proofData);
    
    // Display results
    console.log("\n🎉 SUCCESS! Proof generated and formatted for smart contract use.");
    console.log("\n📋 REMIX IDE CALLDATA:");
    console.log("Copy these values into Remix IDE:");
    console.log("\n_pA:");
    console.log(JSON.stringify(proofData.rawCalldata._pA));
    console.log("\n_pB:");
    console.log(JSON.stringify(proofData.rawCalldata._pB));
    console.log("\n_pC:");
    console.log(JSON.stringify(proofData.rawCalldata._pC));
    console.log("\n_pubSignals:");
    console.log(JSON.stringify(proofData.rawCalldata._pubSignals));
    
    console.log("\n🔧 FUNCTION CALL:");
    console.log(proofData.functionCall);
    
    console.log("\n📄 Full proof data saved to: contract-proof-data.json");
    
  } catch (error) {
    console.error("❌ Error generating proof:", error);
    process.exit(1);
  }
}

// Export functions for programmatic use
export {
  generateProofForContract,
  generateProofFromFile,
  saveProofData,
  ContractProofData
};

// Run main if called directly
if (require.main === module) {
  main().catch(console.error);
}
