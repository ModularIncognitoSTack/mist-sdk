import { ethers, Contract, Signer } from "ethers";
import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree";
import { Account } from "./types";


export async function signAccountData(
    signer: any, 
    contractAddress: string, 
    data: {
        account: string,
        root: bigint,
        quorum: bigint | number,
        registry: bigint | number,
        merkleProof: string,
        nonce: bigint | number
    },
    options?: {
        chainId?: number,
    }
) {
    const domain = {
        name: "MISTRegistry",
        version: "1",
        chainId: options?.chainId ?? await signer.getChainId(),
        verifyingContract: contractAddress,
    }
    const types = {
        AccountData: [
            {name: "account", type: "address"},
            {name: "root", type: "uint256"},
            {name: "quorum", type: "uint256"},
            {name: "registry", type: "uint256"},
            {name: "merkleProof", type: "bytes"},
            {name: "nonce", type: "uint256"},
        ]
    }
    return await signer._signTypedData(domain, types, data)
}


export async function createAccount(params: {
    contract: Contract,
    account: Account,
    signer: Signer,
    registry: bigint | number,
    useRelayer?: boolean,
    options?: {
        chainId?: number,
    }
}) {
    const { contract, account, signer, registry, useRelayer, options } = params;
    const accountData = {
        account: account.address,
        root: account.root,
        quorum: account.quorum,
        registry,
        merkleProof: ethers.utils.defaultAbiCoder.encode(["uint256[]", "uint8[]"], [[],[]]),
        nonce: BigInt(1)
    }
    if (useRelayer) {
        const signature = await signAccountData(signer, contract.address, accountData, options)
        return await contract.manageAccount(accountData, signature)
    }
    return await contract.connect(signer).manageAccount(accountData, [])
}


export async function manageAccount(params: {
    contract: Contract,
    account: Account,
    signer: Signer,
    registry: bigint | number,
    registryTree: IncrementalMerkleTree,
    useRelayer?: boolean,
    options?: {
        chainId?: number,
    }
}) {
    const { contract, account, signer, registry, registryTree, useRelayer, options } = params;
    const proof = registryTree.createProof(registryTree.indexOf(account.root))
    const merkleProof = ethers.utils.defaultAbiCoder.encode(
        ["uint256[]", "uint8[]"],
        [proof.siblings.map((sibling) => sibling[0]), proof.pathIndices]
    )

    const accountData = {
        account: account.address,
        root: account.root,
        quorum: account.quorum,
        registry,
        merkleProof,
        nonce: (await contract.getNonce(account.address)).add(1).toBigInt()
    }

    if (useRelayer) {
        const signature = await signAccountData(signer, contract.address, accountData, options)
        return await contract.manageAccount(accountData, signature)
    }
    return await contract.connect(signer).manageAccount(accountData, [])
}

