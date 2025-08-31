import fs from "fs/promises";
import { initZkEmailSdk, ProofStatus } from "@zk-email/sdk";

// Copy slug from UI homepage
const blueprintSlug = "yagopajarino/Deel_YouHaveBeenPaid@v2";
const emailFilePath = "./eml/deel.eml";

async function main() {
  const sdk = initZkEmailSdk();

  // Get an instance of Blueprint
  const blueprint = await sdk.getBlueprint(blueprintSlug);

  // Create a prover from the blueprint
  const prover = blueprint.createProver({
    isLocal: true
  });

  // Get eml
  const eml = (await fs.readFile(emailFilePath)).toString();

  // Generate a proof request and don't wait till it is done.
  const proof = await prover.generateProofRequest(eml);


  // Check the status of the proof
  // It will be InProgress after starting
  let status = await proof.checkStatus();
  // Should be InProgress
  console.log(
    "Initial Status is in progress: ",
    status === ProofStatus.InProgress
  );

  // You can now either manually use checkStatus in interval or use waitForCompletion
  status = await proof.waitForCompletion();
  if (status === ProofStatus.Failed) {
    status
    throw new Error("Failed to generate proof");
  }

  // Get the proof data
  const { proofData, publicOutputs } = proof.getProofData();
  const verification = await blueprint.verifyProof(proof); // Local verification
  console.log("verification: ", verification);

  // Format proof data for Solidity verifier contract
  const formattedProofData = formatProofForSolidity(proofData, publicOutputs);
  console.log("Formatted proof data for Solidity verifier:");
  console.log(JSON.stringify(formattedProofData, null, 2));
}

// Helper function to format proof data for Solidity verifier contract
function formatProofForSolidity(proofData: any, publicOutputs: string[] | any) {
  // Extract pi_a (first 2 elements, ignore the 3rd which is always 1)
  const pA = [proofData.pi_a[0], proofData.pi_a[1]];
  
  // Extract pi_b (2x2 matrix, but we need to reorder for Solidity)
  // Solidity expects [[x1, x2], [y1, y2]] format
  const pB = [
    [proofData.pi_b[0][1], proofData.pi_b[0][0]], // Swap order for Fq2
    [proofData.pi_b[1][1], proofData.pi_b[1][0]]  // Swap order for Fq2
  ];
  
  // Extract pi_c (first 2 elements, ignore the 3rd which is always 1)
  const pC = [proofData.pi_c[0], proofData.pi_c[1]];
  
  // Handle both string[] and PublicOutputsSp1Response formats
  let pubSignalsArray: string[];
  if (Array.isArray(publicOutputs)) {
    pubSignalsArray = publicOutputs;
  } else {
    // If it's a PublicOutputsSp1Response object, we need to extract the actual values
    // For now, let's log the structure to understand it better
    console.log("PublicOutputs object structure:", JSON.stringify(publicOutputs, null, 2));
    // Try to find the actual public signals in the object
    pubSignalsArray = publicOutputs.outputs ? Object.values(publicOutputs.outputs).flat().map(String) : [];
  }
  
  // Public signals (first 5 elements)
  const pubSignals = pubSignalsArray.slice(0, 5);
  
  return {
    pA,
    pB, 
    pC,
    pubSignals,
    // Also provide the raw function call format
    functionCall: `verifyProof([${pA.join(', ')}], [[${pB[0].join(', ')}], [${pB[1].join(', ')}]], [${pC.join(', ')}], [${pubSignals.join(', ')}])`
  };
}

main();