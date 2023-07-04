import { IncrementalMerkleTree, MerkleProof } from "@zk-kit/incremental-merkle-tree";
import { BigNumber, utils } from "ethers";
import { poseidon2 } from "poseidon-lite";
import { zeroValue, createMerkleProof } from "../../merkle";


export function createRegistryMerkleProof(registry: IncrementalMerkleTree, leaf: bigint): { registryPathSiblings: bigint[], registryPathIndices: number[] } {
    const proof = createMerkleProof(registry, leaf)
    return {
        registryPathSiblings: proof.siblings.map((sibling) => sibling[0]),
        registryPathIndices: proof.pathIndices
    }
}


export class Registry {
    id: number | bigint;
    merkleTree: IncrementalMerkleTree;
    accounts: IncrementalMerkleTree;

    constructor(id: number | bigint, treeDepth?: number) {
        this.id = id;
        this.merkleTree = new IncrementalMerkleTree(poseidon2, treeDepth ?? 20, zeroValue(id), 2);
        this.accounts = new IncrementalMerkleTree(poseidon2, treeDepth ?? 20, zeroValue(id), 2);
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

    indexOf(root: bigint, quorum: bigint): number {
        const leaf = poseidon2([root, quorum]);
        return this.merkleTree.indexOf(leaf);
    }

    findAccount(address: string): number {
        const leaf = BigNumber.from(address).toBigInt()
        return this.accounts.indexOf(leaf);
    }

    insertLeaf(leaf: bigint) {
        this.merkleTree.insert(leaf);
    }

    updateLeaf(index: number, leaf: bigint) {
        this.merkleTree.update(index, leaf);
    }

    addAccount(address: string, root: bigint, quorum: bigint) {
        const leaf = poseidon2([root, quorum]);
        this.merkleTree.insert(leaf);
        this.accounts.insert(BigNumber.from(address).toBigInt());
    }

    updateAccount(address: string, root: bigint, quorum: bigint) {
        const index = this.findAccount(address);
        const leaf = poseidon2([root, quorum]);
        this.merkleTree.update(index, leaf);
    }

    generateMerkleProof(index: number): MerkleProof {
        const merkleProof = this.merkleTree.createProof(index);
        merkleProof.siblings = merkleProof.siblings.map((sibling) => sibling[0]);
        return merkleProof;
    }

    generateMerkleProofByAddress(address: string): MerkleProof {
        const index = this.findAccount(address);
        return this.generateMerkleProof(index);
    }

    generateMerkleProofByRoot(root: bigint, quorum: bigint): MerkleProof {
        const index = this.indexOf(root, quorum);
        return this.generateMerkleProof(index);
    }

    generateMerkleProofByLeaf(leaf: bigint): MerkleProof {
        const index = this.merkleTree.indexOf(leaf);
        return this.generateMerkleProof(index);
    }
}