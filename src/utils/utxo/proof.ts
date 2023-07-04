import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree";
import { poseidon4, poseidon5, poseidon6 } from "poseidon-lite";
import { BigNumber } from "ethers";

import { ExtData, UTXOMerkleTree, UTXONote, getExtDataHash } from ".";
import { Account, EdDSASigner, Registry, createRegistryMerkleProof } from "../account";
import { createMerkleTree } from "../merkle";
import { UTXOInputs } from "../prover";
import { MERKLE_DEPTH } from "../constants";
import assert from "assert";


export async function signForUTXOProof(params: {
    account: Account,
    signer: EdDSASigner,
    role: bigint,
    root: bigint,
    extDataHash: bigint,
    inputs: UTXONote[],
    outputs: UTXONote[],
}): Promise<{publicKey: [bigint, bigint], signature: [bigint, bigint, bigint], aclPathSiblings: any[], aclPathIndices: number[]}>{
    const { account, signer, role, inputs, outputs, root, extDataHash } = params
    const signature = await generateJoinSplitSignature(
        signer,
        root,
        extDataHash,
        inputs.map(input => input.getNullifier()),
        outputs.map(output => output.getCommitment()),
    )

    const accIndex = account.indexOf(signer.scalarPubKey, role)
    const accMerkleProof = account.generateMerkleProof(accIndex)

    return {
        publicKey: signer.scalarPubKey,
        signature,
        aclPathSiblings: accMerkleProof.siblings,
        aclPathIndices: accMerkleProof.pathIndices,
    }
}


export async function multiSignForUTXOProof(params: {
    account: Account,
    signers: EdDSASigner[],
    roles: bigint[],
    root: bigint,
    extDataHash: bigint,
    inputs: UTXONote[],
    outputs: UTXONote[],
}): Promise<{publicKey: [bigint, bigint], signature: [bigint, bigint, bigint], aclPathSiblings: any[], aclPathIndices: number[]}[]>{
    const { account, signers, roles, inputs, outputs, root, extDataHash } = params
    assert(signers.length === roles.length, "signers and roles must have the same length")
    const mfa = []
    for (let i = 0; i < signers.length; i++) {
        mfa.push(await signForUTXOProof({
            account,
            signer: signers[i],
            role: roles[i],
            root,
            extDataHash,
            inputs,
            outputs,
        }))
    }
    return mfa
}


export async function generateUTXOProofInputs(params: {
    account: Account,
    publicKeys: [bigint, bigint][],
    roles: bigint[],
    signatures: [bigint, bigint, bigint][],
    registry: Registry,
    utxoTree: UTXOMerkleTree,
    extDataHash: bigint,
    inputs: UTXONote[],
    outputs: UTXONote[],
    nullifyingKey: bigint
}): Promise<UTXOInputs> {
    const { account, publicKeys, signatures, roles, registry, extDataHash, inputs, outputs, utxoTree, nullifyingKey } = params
    assert(
        publicKeys.length === signatures.length && publicKeys.length === roles.length,
        "publicKeys, roles and signatures must have the same length"
    )
    const { inPathElements, inPathIndices } = utxoTree.generateMerkleProof(inputs)
    
    const {
        siblings: registryPathSiblings,
        pathIndices: registryPathIndices
    } = registry.generateMerkleProofByAddress(account.address)

    const aclPathSiblings = []
    const aclPathIndices = []
    for (let i = 0; i < publicKeys.length; i++) {
        let accIndex = account.indexOf(publicKeys[i], roles[i])
        let accMerkleProof = account.generateMerkleProof(accIndex)
        aclPathSiblings.push(accMerkleProof.siblings)
        aclPathIndices.push(accMerkleProof.pathIndices)
    }
    
    return {
        root: utxoTree.root,
        registryRoot: registry.root,
        extDataHash: extDataHash,
        inNullifiers: inputs.map(input => input.getNullifier()),
        outCommitments: outputs.map(output => output.getCommitment()),
        publicKeys,
        signatures,
        roles,
        aclRoot: account.root,
        aclPathSiblings,
        aclPathIndices,
        accountId: account.accountId,
        nullifyingKey,
        registryPathSiblings,
        registryPathIndices,
        token: inputs[0].token,
        tokenId: inputs[0].identifier,
        inAmounts: inputs.map(input => input.amount),
        inRandoms: inputs.map(input => input.random),
        inPathElements,
        inPathIndices,
        outAmounts: outputs.map(output => output.amount),
        outAccountHashes: outputs.map(output => output.getAccountHash()),
    }
}


export async function prepareUTXOProof(params: {
    account: Account,
    signer: EdDSASigner,
    role: bigint,
    registry: Registry,
    utxoTree: UTXOMerkleTree,
    extData: ExtData,
    inputs: UTXONote[],
    outputs: UTXONote[],
    nullifyingKey: bigint
}): Promise<UTXOInputs> {
    const { account, signer, role, registry, extData, inputs, outputs, utxoTree, nullifyingKey } = params
    const { inPathElements, inPathIndices } = utxoTree.generateMerkleProof(inputs)
    const root = utxoTree.root;
    const extDataHash = getExtDataHash(extData).toBigInt();
    const member = await signForUTXOProof({
        account,
        signer,
        role,
        root,
        extDataHash,
        inputs,
        outputs,
    })

    const registryRoot = BigNumber.from(registry.root).toBigInt()
    const {
        siblings: registryPathSiblings,
        pathIndices: registryPathIndices
    } = registry.generateMerkleProofByAddress(account.address)
    
    return {
        root: root,
        registryRoot,
        extDataHash: extDataHash,
        inNullifiers: inputs.map(input => input.getNullifier()),
        outCommitments: outputs.map(output => output.getCommitment()),
        publicKeys: [member.publicKey],
        signatures: [member.signature],
        roles: [role],
        aclRoot: account.root,
        aclPathSiblings: [member.aclPathSiblings],
        aclPathIndices: [member.aclPathIndices],
        accountId: account.accountId,
        nullifyingKey,
        registryPathSiblings,
        registryPathIndices,
        token: inputs[0].token,
        tokenId: inputs[0].identifier,
        inAmounts: inputs.map(input => input.amount),
        inRandoms: inputs.map(input => input.random),
        inPathElements,
        inPathIndices,
        outAmounts: outputs.map(output => output.amount),
        outAccountHashes: outputs.map(output => output.getAccountHash()),
    }
}


export async function prepareUTXOProofWithMFA(params: {
    account: Account,
    signers: EdDSASigner[],
    roles: bigint[],
    registry: Registry,
    utxoTree: UTXOMerkleTree,
    extData: ExtData,
    inputs: UTXONote[],
    outputs: UTXONote[],
    nullifyingKey: bigint
}): Promise<UTXOInputs> {
    const { account, signers, roles, registry, extData, inputs, outputs, utxoTree, nullifyingKey } = params
    const { inPathElements, inPathIndices } = utxoTree.generateMerkleProof(inputs)
    const root = utxoTree.root;
    const extDataHash = getExtDataHash(extData).toBigInt();
    const bulkSign = await multiSignForUTXOProof({
        account,
        signers,
        roles,
        root,
        extDataHash,
        inputs,
        outputs,
    })

    const registryRoot = BigNumber.from(registry.root).toBigInt()
    const {
        siblings: registryPathSiblings,
        pathIndices: registryPathIndices
    } = registry.generateMerkleProofByAddress(account.address)
    
    return {
        root: root,
        registryRoot,
        extDataHash: extDataHash,
        inNullifiers: inputs.map(input => input.getNullifier()),
        outCommitments: outputs.map(output => output.getCommitment()),
        publicKeys: bulkSign.map(sign => sign.publicKey),
        signatures: bulkSign.map(sign => sign.signature),
        roles,
        aclRoot: account.root,
        aclPathSiblings: bulkSign.map(sign => sign.aclPathSiblings),
        aclPathIndices: bulkSign.map(sign => sign.aclPathIndices),
        accountId: account.accountId,
        nullifyingKey,
        registryPathSiblings,
        registryPathIndices,
        token: inputs[0].token,
        tokenId: inputs[0].identifier,
        inAmounts: inputs.map(input => input.amount),
        inRandoms: inputs.map(input => input.random),
        inPathElements,
        inPathIndices,
        outAmounts: outputs.map(output => output.amount),
        outAccountHashes: outputs.map(output => output.getAccountHash()),
    }
}




// SNARK Signature
export async function generateJoinSplitSignature(
    eddsaSigner: EdDSASigner,
    root: bigint,
    extDataHash: bigint,
    nullifiers: bigint[],
    commitments: bigint[],
) {
    const msgParams = [root, extDataHash, ...nullifiers, ...commitments]

    let message: any
    if (msgParams.length === 4) {
        message = poseidon4(msgParams)
    } else if (msgParams.length === 5) {
        message = poseidon5(msgParams)
    } else if (msgParams.length === 6) {
        message = poseidon6(msgParams)
    }

    return await eddsaSigner.signFormatted(message);
}


// UTXO Merkle Tree
// export async function buildUTXOMerkleTree(
//     inputs: UTXONote[],
//     prevCommitments?: bigint[],
// ) {
//     let tree: IncrementalMerkleTree
//     if (prevCommitments && prevCommitments.length > 0) {
//         const allCommitments = [...prevCommitments, ...inputs.map((i: UTXONote) => i.getCommitment())]
//         tree = createMerkleTree(0, allCommitments, MERKLE_DEPTH);
//     } else {
//         tree = createMerkleTree(0, inputs.map((i: UTXONote) => i.getCommitment()), MERKLE_DEPTH);
//     }

//     const { inPathIndices, inPathElements } = getUTXOMerkleProof(tree, inputs)

//     return { tree, inPathIndices, inPathElements }
// }


// export function getUTXOMerkleProof(
//     tree: IncrementalMerkleTree,
//     inputs: UTXONote[],
// ) {
//     let inPathIndices: number[] = [];
//     let inPathElements: bigint[][] = [];
//     for (const input of inputs) {
//         if (input.amount > 0) {
//             input.setIndex(tree.indexOf(input.getCommitment()))
//             if (input.index < 0) {
//                 throw new Error(`Input commitment ${input.getCommitment()} was not found`)
//             }
//             inPathIndices.push(input.index)
//             const element = tree.createProof(input.index).siblings
//             inPathElements.push(element.map((e: bigint) => e))
//         } else {
//             inPathIndices.push(0)
//             inPathElements.push(new Array(tree.depth).fill(BigInt(0)))
//         }
//     }

//     return { inPathIndices, inPathElements }
// }