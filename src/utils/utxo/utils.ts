import { ethers, BigNumber, Contract, BytesLike } from "ethers";

import { ExtData, EncryptedNote, UTXONote } from ".";
import { SCALAR_FIELD } from "../constants";
import { Lit } from "../encryption";
import { Proof, RawProof } from "../prover";

const { defaultAbiCoder } = ethers.utils


export function formatProof(proof: RawProof): Proof {
    return {
        A: {
            X: proof.a[0],
            Y: proof.a[1],
        },
        B: {
            X: [proof.b[0][0], proof.b[0][1]],
            Y: [proof.b[1][0], proof.b[1][1]],
        },
        C: {
            X: proof.c[0],
            Y: proof.c[1],
        },
    }
}


export function encodeFormattedProof(proof: Proof): BytesLike {
    return defaultAbiCoder.encode(
        ["tuple(tuple(uint256 X, uint256 Y) A, tuple(uint256[2] X, uint256[2] Y) B, tuple(uint256 X, uint256 Y) C)"],
        [proof]
    )
}


export function getExtDataHash(extData: ExtData): BigNumber {
    const abi = new ethers.utils.AbiCoder()
    const tokenTuple = 'tuple(uint256 standard, address token, uint256 identifier, uint256 amount)'
    const encodedData = abi.encode(
        [
            `tuple(uint256 chainId, uint256 treeIndex, address account, uint256 transferType, ${tokenTuple} tokenData)`,
        ],
        [ extData ],
    )
    const hash = ethers.utils.keccak256(encodedData)
    return BigNumber.from(hash).mod(SCALAR_FIELD)
}


export async function fetchUTXONotes(params: {
    chain: string,
    contract: Contract,
    address: string,
    startTreeIndex: number,
    startLeafIndex: number,
    endLeafIndex?: number,
}) {
    const lit = new Lit()
    const filter = params.contract.filters.Commitment(params.startTreeIndex)
    const events = await params.contract.queryFilter(filter)
    const args = events.map(e => e.args)
    const startIndex = args.findIndex(a => a?.leafIndex.eq(params.startLeafIndex))
    const endIndex = params.endLeafIndex ? args.findIndex(a => a?.leafIndex.eq(params.endLeafIndex)) : args.length
    const sentNotes: any[] = []
    const receivedNotes: any[] = []
    for (const arg of args.slice(startIndex, endIndex)) {
        let note: EncryptedNote = defaultAbiCoder.decode(["tuple(string encryptedData, string encryptedSenderKey, string encryptedReceiverKey)"], arg?.encryptedNote)[0]
        try {
            const sent = await lit.decryptNote(note.encryptedData, note.encryptedSenderKey, params.address, params.chain)
            if (sent) sentNotes.push({ tree: arg?.treeIndex.toString(), leaf: arg?.leafIndex.toString(), commitment: arg?.commitment.toString(), ...sent })
        } catch (e) {
            try {
                const received = await lit.decryptNote(note.encryptedData, note.encryptedReceiverKey, params.address, params.chain)
                if (received) receivedNotes.push({ tree: arg?.treeIndex.toString(), leaf: arg?.leafIndex.toString(), commitment: arg?.commitment.toString(), ...received })
            } catch (error) {
                console.error(error)
            }
        }
    }
    return { sentNotes, receivedNotes }
}


export async function fetchUTXONotesSent(params: {
    chain: string,
    contract: Contract,
    address: string,
    startTreeIndex: number,
    startLeafIndex: number,
    endLeafIndex?: number,
}) {
    const lit = new Lit()
    const filter = params.contract.filters.Commitment(params.startTreeIndex)
    const events = await params.contract.queryFilter(filter)
    const args = events.map(e => e.args)
    const startIndex = args.findIndex(a => a?.leafIndex.eq(params.startLeafIndex))
    const endIndex = params.endLeafIndex ? args.findIndex(a => a?.leafIndex.eq(params.endLeafIndex)) : args.length
    const sentNotes: any[] = []
    for (const arg of args.slice(startIndex, endIndex)) {
        let note: EncryptedNote = defaultAbiCoder.decode(["tuple(string encryptedData, string encryptedSenderKey, string encryptedReceiverKey)"], arg?.encryptedNote)[0]
        try {
            const sent = await lit.decryptNote(note.encryptedData, note.encryptedSenderKey, params.address, params.chain)
            if (sent) sentNotes.push({ tree: arg?.treeIndex.toString(), leaf: arg?.leafIndex.toString(), commitment: arg?.commitment.toString(), ...sent })
        } catch (e) {
            console.error(e)
        }
    }
    return sentNotes
}


export async function fetchUTXONotesReceived(params: {
    chain: string,
    contract: Contract,
    address: string,
    startTreeIndex: number,
    startLeafIndex: number,
    endLeafIndex?: number,
}) {
    const lit = new Lit()
    const filter = params.contract.filters.Commitment(params.startTreeIndex)
    const events = await params.contract.queryFilter(filter)
    const args = events.map(e => e.args)
    const startIndex = args.findIndex(a => a?.leafIndex.eq(params.startLeafIndex))
    const endIndex = params.endLeafIndex ? args.findIndex(a => a?.leafIndex.eq(params.endLeafIndex)) : args.length
    const receivedNotes: any[] = []
    for (const arg of args.slice(startIndex, endIndex)) {
        let note: EncryptedNote = defaultAbiCoder.decode(["tuple(string encryptedData, string encryptedSenderKey, string encryptedReceiverKey)"], arg?.encryptedNote)[0]
        try {
            const received = await lit.decryptNote(note.encryptedData, note.encryptedReceiverKey, params.address, params.chain)
            if (received) receivedNotes.push({ tree: arg?.treeIndex.toString(), leaf: arg?.leafIndex.toString(), commitment: arg?.commitment.toString(), ...received })
        } catch (e) {
            console.error(e)
        }
    }
    return receivedNotes
}


export function generateTransferNotes(params: {
    sender: string,
    receiver: string,
    token: string,
    identifier: bigint,
    amount: bigint,
    memo?: string,
    notes: any[],
    nullifyingKey: bigint,
}) {
    const { sender, receiver, token, identifier, amount, memo, notes, nullifyingKey } = params
    const inputs = selectUTXOInputNotes(token, identifier, amount, notes)
    // const inputs = selectedInputs.map(input => new UTXONote({
    //     index: input.index,
    //     amount: input.amount,
    //     random: input.random,
    //     token: input.tokenAddress,
    //     identifier: input.identifier,
    //     commitment: input.getCommitment(),
    //     sender,
    //     receiver,
    //     nullifyingKey
    // }))
    const inputTotal = inputs.reduce((total, input) => total + input.amount, BigInt(0))
    let outputs: UTXONote[] = []
    if (inputTotal > amount) {
        outputs = [
            new UTXONote({ sender, receiver, amount, token, identifier, memo, nullifyingKey }),
            new UTXONote({ sender, receiver, amount: inputTotal - amount, token, identifier, nullifyingKey })
        ]
    } else {
        outputs = [
            new UTXONote({ sender, receiver, amount, token, identifier, memo, nullifyingKey })
        ]
    }
    return { inputs, outputs }
}


export function selectUTXOInputNotes(
    tokenAddress: string,
    identifier: bigint,
    amount: bigint,
    notes: UTXONote[]
): UTXONote[] {
    const available = notes.filter(note => tokenAddress === note.tokenAddress && identifier === note.identifier)
    const inputs: UTXONote[] = []
    for(let i=0; i<available.length; i++) {
        let note1 = available[i]
        if (note1.amount >= amount) {
            inputs.push(note1)
            break
        }
        for (let j=i+1; j<available.length; j++) {
            let note2 = available[j]
            if (note1.amount + note2.amount >= amount) {
                inputs.push(note1, note2)
                break
            }
        }
        if (inputs.length > 0) break
    }
    return inputs
}