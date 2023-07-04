import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree";

import { UTXONote } from ".";
import { createMerkleTree } from "../merkle";
import { MERKLE_DEPTH } from "../constants";


export class UTXOMerkleTree {
    id: number | bigint;
    merkleTree: IncrementalMerkleTree;

    constructor(id: number | bigint, commitments?: bigint[], treeDepth?: number) {
        this.id = id;
        this.merkleTree = createMerkleTree(id, commitments ?? [], treeDepth ?? MERKLE_DEPTH);
    }

    get root(): bigint {
        return this.merkleTree.root;
    }

    get depth(): number {
        return this.merkleTree.depth;
    }

    get zeroValue(): bigint {
        return this.merkleTree.zeroes[0];
    }

    get leaves(): bigint[] {
        return this.merkleTree.leaves;
    }

    indexOf(commitment: bigint): number {
        return this.merkleTree.indexOf(commitment);
    }

    insert(commitment: bigint) {
        this.merkleTree.insert(commitment);
    }

    bulkInsert(commitments: bigint[]) {
        commitments.forEach((c) => this.insert(c));
    }

    generateMerkleProof(notes: UTXONote[]): {inPathIndices: number[], inPathElements: bigint[][]} {
        return getUTXOMerkleProof(this.merkleTree, notes)
    }
}


// UTXO Merkle Tree
export async function buildUTXOMerkleTree(
    inputs: UTXONote[],
    prevCommitments?: bigint[],
) {
    let tree: IncrementalMerkleTree
    if (prevCommitments && prevCommitments.length > 0) {
        const allCommitments = [...prevCommitments, ...inputs.map((i: UTXONote) => i.getCommitment())]
        tree = createMerkleTree(0, allCommitments, MERKLE_DEPTH);
    } else {
        tree = createMerkleTree(0, inputs.map((i: UTXONote) => i.getCommitment()), MERKLE_DEPTH);
    }

    const { inPathIndices, inPathElements } = getUTXOMerkleProof(tree, inputs)

    return { tree, inPathIndices, inPathElements }
}


export function getUTXOMerkleProof(
    tree: IncrementalMerkleTree,
    inputs: UTXONote[],
) {
    let inPathIndices: number[] = [];
    let inPathElements: bigint[][] = [];
    for (const input of inputs) {
        if (input.amount > 0) {
            input.setIndex(tree.indexOf(input.getCommitment()))
            if (input.index < 0) {
                throw new Error(`Input commitment ${input.getCommitment()} was not found`)
            }
            inPathIndices.push(input.index)
            const element = tree.createProof(input.index).siblings
            inPathElements.push(element.map((e: bigint) => e))
        } else {
            inPathIndices.push(0)
            inPathElements.push(new Array(tree.depth).fill(BigInt(0)))
        }
    }

    return { inPathIndices, inPathElements }
}