# MIST SDK
A TypeScript SDK for interacting with MIST zero-knowledge proofs and smart contracts.

## Installation
Install the SDK as a dependency in your project with either npm or yarn.

npm:
```bash
npm install @mist/sdk
```
yarn:
```bash
yarn add @mist/sdk
```

## Getting Started
For generating zero-knowledge proofs needed in the MIST smart contracts, it is recommended to use the `Prover` class and MIST API.

1. Setup the prover.
```typescript
import { Prover } from '@mist/sdk'

const prover = new Prover({
    baseURI: 'MIST API link',
    apiKey: process.env.MIST_API_KEY
})
```
2. Prove membership of signer in account.
```typescript
// Using setup from step 1
async function main() {
    const proofInputs = generateProofInputs() // Fake function for example purposes
    const { proof, publicSignals, error } = await prover.proveAccountMembership(proofInputs)
}
```
3. Generate ZKP for transfers and withdrawals in MIST Pool.
```typescript
// Using setup from step 1
async function main() {
    const proofInputs = generateProofInputs() // Fake function for example purposes
    const { proof, publicSignals, error } = await prover.proveUTXO(proofInputs)
}
```
4. Prove an account meets a specified minimum balance of some token.
```typescript
// Using setup from step 1
async function main() {
    const proofInputs = generateProofInputs() // Fake function for example purposes
    const { proof, publicSignals, error } = await prover.proveBalance(proofInputs)
}
```

## Development
To develop on the SDK on your own computer, clone the repo and install the dependencies:
```bash
yarn
```
Since it is written in TypeScript, code must be compiled with the command:
```bash
yarn build
```