# SkillChain upgrade notes

## What's added
- ERC-20 amounts consistently use 18 decimals; registry reward settings are specified in whole SKC and stored in smallest units.
- `CertificateHashRegistry` stores hashes that the trusted admin registers only after checking the issuer through a trusted source. A matching hash proves file integrity, not issuer identity by itself.
- `AchievementRegistry.approveAchievementWithHash` requires a previously registered certificate hash.
- `SkillBounty` escrows SKC, requires a non-transferable badge type for submissions, records IPFS proof URIs, and releases rewards after creator/verifier approval.
- Angular `Skill Quest & Bounties` page and certificate-hash controls in Verifier Panel.
- Employer lookup uses `nextTokenId()` rather than a hard-coded 20-token scan.

## Important: new deployment required
These contracts have changed and two contracts were added. Existing Polygon Amoy deployments cannot acquire these functions. Deploy all five contracts fresh and update `src/app/contracts/addresses.ts` with the new addresses. Until then, the UI intentionally reports that addresses are not configured.

## Local development
1. Install Node.js 22, then run `npm install` in this contracts folder.
2. Run `npx hardhat compile` and `npx hardhat test`.
3. Start a local JSON-RPC node in terminal 1: `npx hardhat node --network hardhatMainnet`.
4. Deploy in terminal 2: `npx hardhat ignition deploy ignition/modules/SkillChain.ts --network localhost`.
5. Copy the five deployed addresses into the frontend's `src/app/contracts/addresses.ts`. Keep `NETWORK_MODE = 'local'` for local development. Add MetaMask's Hardhat Local network if it is not offered automatically. For transactions, import a local-only Hardhat test account into MetaMask; never use a real wallet key for this.
6. In the frontend folder, run `npm install`, `npm start`, then open the local Angular URL.
7. For Polygon Amoy, configure `AMOY_RPC_URL` and `AMOY_PRIVATE_KEY` in a local `.env` file that is never committed or shared. Use a disposable test wallet only. Set `NETWORK_MODE = 'amoy'`, deploy with `npx hardhat ignition deploy ignition/modules/SkillChain.ts --network amoy`, and replace the frontend addresses with the five new addresses from `ignition/deployments/chain-80002/deployed_addresses.json`.

## Certificate verification semantics
- Compute Keccak-256 from the exact original file in the browser.
- Independently authenticate the certificate with the issuing body or trusted credential record.
- Only then should the trusted issuer/admin register the hash.
- An exact hash match proves the uploaded file's bytes match the registered file. It does not, on its own, prove the named student's identity, certificate validity, or the issuer's legitimacy.
- The current prototype does not upload files to IPFS automatically. Upload documents/submissions separately and store only their `ipfs://` references in the app. Never place Pinata/API secrets in frontend code.

## Bounty flow
- Bounty creator approves SKC allowance; contract transfers the reward into escrow.
- A student can submit once per bounty only if their wallet has the required badge type.
- Creator or authorized verifier approves or rejects the submission.
- Approval pays the winner. A bounty can be cancelled/refunded only when it has no active submissions. A student may withdraw their submission.

## Security / limits
- This is a learning prototype for a testnet, not production-audited code.
- Admin/verifier permissions are trusted roles; they do not make dishonest humans impossible.
- A verifier must inspect source authenticity and bounty work off-chain.
- No deployment has been performed by this upgrade package. Compile, test, review, and deploy from your machine before using a public network.
