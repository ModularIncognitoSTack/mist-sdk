import { IncrementalMerkleTree, MerkleProof } from "@zk-kit/incremental-merkle-tree";
import { BigNumber, utils, BytesLike } from "ethers";
import { poseidon2 } from "poseidon-lite";


export function zeroValue(accountId: BytesLike | number | bigint): bigint {
    accountId = BigNumber.from(accountId).toTwos(256).toHexString()
    accountId = utils.zeroPad(accountId, 32)

    return BigInt(utils.keccak256(accountId)) >> BigInt(8)
}


export function createMerkleTree(id: number | bigint, leaves: bigint[], merkleDepth: number) {
    const tree = new IncrementalMerkleTree(poseidon2, merkleDepth, zeroValue(id), 2);
    leaves.forEach((leaf) => {
        tree.insert(leaf);
    })
    return tree;
}


export function createMerkleProof(tree: IncrementalMerkleTree, leaf: bigint, ): MerkleProof {
    const proof = tree.createProof(tree.indexOf(leaf));
    return proof;
}