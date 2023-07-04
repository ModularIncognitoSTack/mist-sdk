import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree";
import { poseidon2, poseidon4 } from "poseidon-lite";
import { BigNumber } from "ethers";

import { UTXONote, getUTXOMerkleProof } from "../utxo";
import { Account, EdDSASigner, createRegistryMerkleProof } from "../account";
import { BalanceInputs } from "../prover";


export async function prepareBalanceProof(params: {
    account: Account,
    signer: EdDSASigner,
    role: bigint,
    registry: IncrementalMerkleTree,
    utxoTree: IncrementalMerkleTree,
    tokenAddress: string,
    minBalance: bigint,
    notes: UTXONote[],
    nullifyingKey: bigint
}): Promise<BalanceInputs> {
    const { account, signer, role, registry, notes, utxoTree, nullifyingKey, tokenAddress, minBalance: balance } = params
    const { inPathElements, inPathIndices } = getUTXOMerkleProof(utxoTree, notes)
    const root = utxoTree.root;
    const token = BigNumber.from(tokenAddress).toBigInt()
    const message = poseidon4([
        root,
        token,
        balance,
        notes[0].getNullifier(),
    ])
    const signature = await signer.signFormatted(message);

    const accIndex = account.indexOf(signer.scalarPubKey, role)
    const accMerkleProof = account.generateMerkleProof(accIndex)
    const registryRoot = BigNumber.from(registry.root).toBigInt()
    const {
        registryPathSiblings,
        registryPathIndices,
    } = createRegistryMerkleProof(registry, poseidon2([account.root, account.quorum]))

    return {
        root,
        registryRoot,
        token,
        balance,
        nullifiers: notes.map(note => note.getNullifier()),
        publicKey: signer.scalarPubKey,
        signature,
        role,
        aclRoot: accMerkleProof.root,
        aclPathIndices: accMerkleProof.pathIndices,
        aclPathSiblings: accMerkleProof.siblings,
        quorum: account.quorum,
        accountId: account.accountId,
        nullifyingKey,
        registryPathIndices,
        registryPathSiblings,
        tokenIds: notes.map(note => note.identifier),
        inAmounts: notes.map(note => note.amount),
        inRandoms: notes.map(note => note.random),
        inPathIndices,
        inPathElements,
    }
}
