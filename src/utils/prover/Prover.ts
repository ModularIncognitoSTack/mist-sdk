import { BigNumber } from "ethers";
import { ProverAccountParams, ProverBalanceParams, ProverUTXOParams, MISTAPIBalanceParams, MISTAPIUTXOParams, MISTAPIAccountParams, ProverOutput } from "./types";


export class Prover {
    baseURI: string;
    apiKey: string;

    constructor(params: {
        baseURI: string;
        apiKey?: string;
    }) {
        this.baseURI = params.baseURI;
        this.apiKey = params.apiKey || "";
    }

    async proveAccountMembership(inputs: ProverAccountParams): Promise<ProverOutput> {
        const body: MISTAPIAccountParams = {
            root: BigNumber.from(inputs.root).toString(),
            message: BigNumber.from(inputs.message).toString(),
            publicKey: [BigNumber.from(inputs.publicKey[0]).toString(), BigNumber.from(inputs.publicKey[1]).toString()],
            role: BigNumber.from(inputs.role).toString(),
            signature: [BigNumber.from(inputs.signature[0]).toString(), BigNumber.from(inputs.signature[1]).toString(), BigNumber.from(inputs.signature[2]).toString()],
            pathIndices: inputs.pathIndices.map((i) => BigNumber.from(i).toString()),
            pathSiblings: inputs.pathSiblings.map((s) => BigNumber.from(s).toString())
        }
        const res = await fetch(`${this.baseURI}/prover/account`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.apiKey
            },
            body: JSON.stringify(body)
        })
        return await res.json() as ProverOutput
    }

    async proveBalance(inputs: ProverBalanceParams): Promise<ProverOutput> {
        const body: MISTAPIBalanceParams = {
            root: BigNumber.from(inputs.root).toString(),
            registryRoot: BigNumber.from(inputs.registryRoot).toString(),
            nullifiers: inputs.nullifiers.map((n) => BigNumber.from(n).toString()),
            token: BigNumber.from(inputs.token).toString(),
            balance: BigNumber.from(inputs.balance).toString(),
            publicKey: [BigNumber.from(inputs.publicKey[0]).toString(), BigNumber.from(inputs.publicKey[1]).toString()],
            signature: [BigNumber.from(inputs.signature[0]).toString(), BigNumber.from(inputs.signature[1]).toString(), BigNumber.from(inputs.signature[2]).toString()],
            role: BigNumber.from(inputs.role).toString(),
            aclRoot: BigNumber.from(inputs.aclRoot).toString(),
            aclPathSiblings: inputs.aclPathSiblings.map((s) => BigNumber.from(s).toString()),
            aclPathIndices: inputs.aclPathIndices.map((i) => BigNumber.from(i).toString()),
            quorum: BigNumber.from(inputs.quorum).toString(),
            accountId: BigNumber.from(inputs.accountId).toString(),
            nullifyingKey: BigNumber.from(inputs.nullifyingKey).toString(),
            registryPathSiblings: inputs.registryPathSiblings.map((s) => BigNumber.from(s).toString()),
            registryPathIndices: inputs.registryPathIndices.map((i) => BigNumber.from(i).toString()),
            tokenIds: inputs.tokenIds.map((i) => BigNumber.from(i).toString()),
            inAmounts: inputs.inAmounts.map((i) => BigNumber.from(i).toString()),
            inRandoms: inputs.inRandoms.map((i) => BigNumber.from(i).toString()),
            inPathElements: inputs.inPathElements.map(
                (i) => i.map((j) => j.toString())
            ),
            inPathIndices: inputs.inPathIndices.map((i) => BigNumber.from(i).toString()),
        }
        const res = await fetch(`${this.baseURI}/prover/balance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.apiKey
            },
            body: JSON.stringify(body)
        })
        return await res.json() as ProverOutput
    }

    async proveUTXO(inputs: ProverUTXOParams): Promise<ProverOutput> {
        const body: MISTAPIUTXOParams = {
            root: BigNumber.from(inputs.root).toString(),
            registryRoot: BigNumber.from(inputs.registryRoot).toString(),
            extDataHash: BigNumber.from(inputs.extDataHash).toString(),
            inNullifiers: inputs.inNullifiers.map((n) => BigNumber.from(n).toString()),
            outCommitments: inputs.outCommitments.map((c) => BigNumber.from(c).toString()),
            publicKeys: inputs.publicKeys.map((pk) => [BigNumber.from(pk[0]).toString(), BigNumber.from(pk[1]).toString()]),
            signatures: inputs.signatures.map((s) => [BigNumber.from(s[0]).toString(), BigNumber.from(s[1]).toString(), BigNumber.from(s[2]).toString()]),
            roles: inputs.roles.map((r) => BigNumber.from(r).toString()),
            aclRoot: BigNumber.from(inputs.aclRoot).toString(),
            aclPathSiblings: inputs.aclPathSiblings.map((s) => s.map((i) => BigNumber.from(i).toString())),
            aclPathIndices: inputs.aclPathIndices.map((i) => i.map((j) => BigNumber.from(j).toString())),
            accountId: BigNumber.from(inputs.accountId).toString(),
            nullifyingKey: BigNumber.from(inputs.nullifyingKey).toString(),
            registryPathSiblings: inputs.registryPathSiblings.map((s) => BigNumber.from(s).toString()),
            registryPathIndices: inputs.registryPathIndices.map((i) => BigNumber.from(i).toString()),
            token: BigNumber.from(inputs.token).toString(),
            tokenId: BigNumber.from(inputs.tokenId).toString(),
            inAmounts: inputs.inAmounts.map((i) => BigNumber.from(i).toString()),
            inRandoms: inputs.inRandoms.map((i) => BigNumber.from(i).toString()),
            inPathElements: inputs.inPathElements.map((i) => i.map((j) => j.toString())),
            inPathIndices: inputs.inPathIndices.map((i) => BigNumber.from(i).toString()),
            outAmounts: inputs.outAmounts.map((i) => BigNumber.from(i).toString()),
            outAccountHashes: inputs.outAccountHashes.map((i) => BigNumber.from(i).toString()),
        }
        const res = await fetch(`${this.baseURI}/prover/utxo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.apiKey
            },
            body: JSON.stringify(body)
        })
        return await res.json() as ProverOutput
    }
}