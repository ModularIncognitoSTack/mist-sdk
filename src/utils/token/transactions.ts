import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree";
import { Contract, ethers } from "ethers";

import { prepareBalanceProof } from ".";
import { UTXONote } from "../utxo";
import { Account, EdDSASigner } from "../account";
import { BalanceInputs, fullProveBalance } from "../prover";


/****************************
 * Full Execution Functions *
 ****************************/

export async function checkBalance(contract: Contract, params: {
    account: Account,
    signer: EdDSASigner,
    role: bigint,
    registry: IncrementalMerkleTree,
    utxoTree: IncrementalMerkleTree,
    tokenAddress: string,
    minBalance: bigint,
    notes: UTXONote[],
    nullifyingKey: bigint
    snarkjs: any,
    wasmFilePath: string,
    zKeyFilePath: string
}) {
    const prep = await prepareBalanceCheck(params)
    return await contract.verifyBalanceOf(...prep.params)
}


/*************************
 * Preparation Functions *
 *************************/

export async function prepareBalanceCheck(params: {
    account: Account,
    signer: EdDSASigner,
    role: bigint,
    registry: IncrementalMerkleTree,
    utxoTree: IncrementalMerkleTree,
    tokenAddress: string,
    minBalance: bigint,
    notes: UTXONote[],
    nullifyingKey: bigint
    snarkjs: any,
    wasmFilePath: string,
    zKeyFilePath: string
}): Promise<{proof: any, encodedProof: string, proofInputs: BalanceInputs, params: any[]}> {
    const { account, signer, role, registry, notes, utxoTree, nullifyingKey, tokenAddress, minBalance, snarkjs, wasmFilePath, zKeyFilePath } = params
    const proofInputs = await prepareBalanceProof({ account, signer, role, registry, notes, utxoTree, nullifyingKey, tokenAddress, minBalance })
    const proof = await fullProveBalance(proofInputs, snarkjs, wasmFilePath, zKeyFilePath);

    const encodedProof = ethers.utils.defaultAbiCoder.encode(
        ["uint256[2]", "uint256[2][2]", "uint256[2]"],
        [proof.a, proof.b, proof.c]
    );

    return {
        proof,
        encodedProof,
        proofInputs,
        params: [tokenAddress, minBalance, proofInputs.root, proofInputs.registryRoot, proofInputs.nullifiers, encodedProof]
    }
}
