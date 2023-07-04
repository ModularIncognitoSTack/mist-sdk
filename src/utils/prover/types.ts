import { BigNumberish } from "ethers";

export interface G1Point {
  X: bigint;
  Y: bigint;
}

export interface G2Point {
  X: [bigint, bigint];
  Y: [bigint, bigint];
}

export interface Proof {
  A: G1Point;
  B: G2Point;
  C: G1Point;
}

export interface RawProof {
  a: [bigint, bigint];
  b: [[bigint, bigint], [bigint, bigint]];
  c: [bigint, bigint];
}

export interface ZKProver {
  wasm: Buffer | string;
  zKey: Buffer | string;
}

/**
 * AccountInputs is the signals for the Account circuit.
 * @param root The root of the account (Membership) merkle tree.
 * @param message The message to be signed.
 * @param publicKey The EdDSA scalar public key of the signer.
 * @param role The ACL role of the signer. Either 0 (guardian) or 1 (spender).
 * @param signature The EdDSA signature of the message.
 * @param pathIndices The leaf indices of the account (Membership) path.
 * @param pathSiblings The siblings of the account (Membership) path.
 */
export interface AccountInputs {
  root: bigint;
  message: bigint;
  publicKey: [bigint, bigint];
  role: bigint; // 0: guardian, 1: spender
  signature: [bigint, bigint, bigint];
  pathIndices: number[];
  pathSiblings: bigint[];
}


export interface UTXOInputs {
  root: bigint;
  registryRoot: bigint;
  extDataHash: bigint;
  inNullifiers: bigint[];
  outCommitments: bigint[];
  publicKeys: [bigint, bigint][];
  signatures: [bigint, bigint, bigint][];
  roles: bigint[];
  aclRoot: bigint;
  aclPathSiblings: bigint[][];
  aclPathIndices: number[][];
  accountId: bigint; // accountId = uint256(keccak256(abi.encodePacked(address(this)))
  nullifyingKey: bigint;
  registryPathSiblings: bigint[];
  registryPathIndices: number[];
  token: bigint; // token = uint256(keccak256(abi.encodePacked(tokenAddress)))
  tokenId: bigint;
  inAmounts: bigint[];
  inRandoms: bigint[];
  inPathElements: bigint[][];
  inPathIndices: number[];
  outAmounts: bigint[];
  outAccountHashes: bigint[];
}


export interface BalanceInputs {
  root: bigint;
  registryRoot: bigint;
  token: bigint;
  balance: bigint;
  nullifiers: bigint[];
  publicKey: [bigint, bigint];
  signature: [bigint, bigint, bigint];
  role: bigint;
  aclRoot: bigint;
  aclPathSiblings: bigint[];
  aclPathIndices: number[];
  quorum: number | bigint;
  accountId: bigint; // accountId = uint256(keccak256(abi.encodePacked(address(this)))
  nullifyingKey: bigint;
  registryPathSiblings: bigint[];
  registryPathIndices: number[];
  tokenIds: bigint[];
  inAmounts: bigint[];
  inRandoms: bigint[];
  inPathElements: bigint[][];
  inPathIndices: number[];
}


/************************************
 * Input Params for MIST Prover API *
 ************************************/

export interface ProverAccountParams {
  root: BigNumberish;
  message: BigNumberish;
  publicKey: [BigNumberish, BigNumberish];
  role: BigNumberish; // 0: guardian, 1: spender
  signature: [BigNumberish, BigNumberish, BigNumberish];
  pathIndices: BigNumberish[];
  pathSiblings: BigNumberish[];
}


export interface ProverUTXOParams {
  root: BigNumberish;
  registryRoot: BigNumberish;
  extDataHash: BigNumberish;
  inNullifiers: BigNumberish[];
  outCommitments: BigNumberish[];
  publicKeys: [BigNumberish, BigNumberish][];
  signatures: [BigNumberish, BigNumberish, BigNumberish][];
  roles: BigNumberish[];
  aclRoot: BigNumberish;
  aclPathSiblings: BigNumberish[][];
  aclPathIndices: BigNumberish[][];
  accountId: BigNumberish; // accountId = uint256(keccak256(abi.encodePacked(address(this)))
  nullifyingKey: BigNumberish;
  registryPathSiblings: BigNumberish[];
  registryPathIndices: BigNumberish[];
  token: BigNumberish; // token = uint256(keccak256(abi.encodePacked(tokenAddress)))
  tokenId: BigNumberish;
  inAmounts: BigNumberish[];
  inRandoms: BigNumberish[];
  inPathElements: bigint[][];
  inPathIndices: BigNumberish[];
  outAmounts: BigNumberish[];
  outAccountHashes: BigNumberish[];
}


export interface ProverBalanceParams{
  root: BigNumberish;
  registryRoot: BigNumberish;
  token: BigNumberish;
  balance: BigNumberish;
  nullifiers: BigNumberish[];
  publicKey: [BigNumberish, BigNumberish];
  signature: [BigNumberish, BigNumberish, BigNumberish];
  role: BigNumberish;
  aclRoot: BigNumberish;
  aclPathSiblings: BigNumberish[];
  aclPathIndices: BigNumberish[];
  quorum: BigNumberish;
  accountId: BigNumberish; // accountId = uint256(keccak256(abi.encodePacked(address(this)))
  nullifyingKey: BigNumberish;
  registryPathSiblings: BigNumberish[];
  registryPathIndices: BigNumberish[];
  tokenIds: BigNumberish[];
  inAmounts: BigNumberish[];
  inRandoms: BigNumberish[];
  inPathElements: bigint[][];
  inPathIndices: BigNumberish[];
}


export interface MISTAPIBalanceParams {
  root: string;
  registryRoot: string;
  token: string;
  balance: string;
  nullifiers: string[];
  publicKey: [string, string];
  signature: [string, string, string];
  role: string;
  aclRoot: string;
  aclPathSiblings: string[];
  aclPathIndices: string[];
  quorum: string;
  accountId: string; // accountId = uint256(keccak256(abi.encodePacked(address(this)))
  nullifyingKey: string;
  registryPathSiblings: string[];
  registryPathIndices: string[];
  tokenIds: string[];
  inAmounts: string[];
  inRandoms: string[];
  inPathElements: string[][];
  inPathIndices: string[];
}


export interface MISTAPIAccountParams {
  root: string;
  message: string;
  publicKey: [string, string];
  role: string; // 0: guardian, 1: spender
  signature: [string, string, string];
  pathIndices: string[];
  pathSiblings: string[];
}


export interface MISTAPIUTXOParams {
  root: string;
  registryRoot: string;
  extDataHash: string;
  inNullifiers: string[];
  outCommitments: string[];
  publicKeys: [string, string][];
  signatures: [string, string, string][];
  roles: string[];
  aclRoot: string;
  aclPathSiblings: string[][];
  aclPathIndices: string[][];
  accountId: string; // accountId = uint256(keccak256(abi.encodePacked(address(this)))
  nullifyingKey: string;
  registryPathSiblings: string[];
  registryPathIndices: string[];
  token: string; // token = uint256(keccak256(abi.encodePacked(tokenAddress)))
  tokenId: string;
  inAmounts: string[];
  inRandoms: string[];
  inPathElements: string[][];
  inPathIndices: string[];
  outAmounts: string[];
  outAccountHashes: string[];
}


export interface ProverOutput {
  publicSignals: bigint[],
  proof: {
    a: [bigint, bigint],
    b: [[bigint, bigint], [bigint, bigint]],
    c: [bigint, bigint]
  },
  error: string | undefined
}