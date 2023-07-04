import { BigNumber, Contract, ethers } from "ethers";

import { DepositData, ExtData, PreCommitment, TokenData, TransferType, UTXOMerkleTree, UTXONote, prepareUTXOProofWithMFA } from ".";
import { Account, EdDSASigner, Registry } from "../account";
import { fullProveUTXO } from "../prover";


/****************************
 * Full Execution Functions *
 ****************************/

export async function deposit(
    signer: any,
    utxoContract: Contract,
    preCommitments: PreCommitment[],
): Promise<any> {
    const { depositData, signature } = await prepareDeposit(signer, utxoContract, preCommitments)
    return await utxoContract.deposit(depositData, signature)
}


export async function transfer(contract: Contract, params: {
    account: Account,
    signers: EdDSASigner[],
    roles: bigint[],
    registry: Registry,
    utxoTree: UTXOMerkleTree,
    extData: ExtData,
    inputs: UTXONote[],
    outputs: UTXONote[],
    snarkjs: any,
    wasmFilePath: string,
    zKeyFilePath: string
}): Promise<any> {
    const { extData } = params
    const nullifyingKey = await contract.getNullifyingKey()
    const { encodedProof, encodedInputs } = await prepareTransfer({ ...params, nullifyingKey })
    return await contract.transfer(encodedProof, encodedInputs, extData)
}


export async function withdraw(contract: Contract, params: {
    account: Account,
    signers: EdDSASigner[],
    roles: bigint[],
    registry: Registry,
    utxoTree: UTXOMerkleTree,
    extData: ExtData,
    inputs: UTXONote[],
    outputs: UTXONote[],
    snarkjs: any,
    wasmFilePath: string,
    zKeyFilePath: string
}): Promise<any> {
    const { extData } = params
    const nullifyingKey = await contract.getNullifyingKey()
    const { encodedProof, encodedInputs } = await prepareWithdrawal({ ...params, nullifyingKey })
    return await contract.withdraw(encodedProof, encodedInputs, extData)
}


/*************************
 * Preparation Functions *
 *************************/

export async function prepareDeposit(
    signer: any,
    utxoContract: Contract,
    preCommitments: PreCommitment[],
): Promise<{ depositData: DepositData, signature: any }> {
    const nonce = await utxoContract.getNonce(signer.address)
    const depositData: DepositData = {
        nonce,
        sender: signer.address,
        preCommitments,
    }
    const signature = await signDepositData(signer, depositData, utxoContract)
    
    return {
        depositData,
        signature
    }
}


export async function prepareTransfer(params: {
    account: Account,
    signers: EdDSASigner[],
    roles: bigint[],
    registry: Registry,
    utxoTree: UTXOMerkleTree,
    extData: ExtData,
    inputs: UTXONote[],
    outputs: UTXONote[],
    nullifyingKey: bigint,
    snarkjs: any,
    wasmFilePath: string,
    zKeyFilePath: string
}): Promise<any> {
    const { account, signers, roles, registry, extData, inputs, outputs, utxoTree, nullifyingKey, snarkjs, wasmFilePath, zKeyFilePath } = params
    const proofInputs = await prepareUTXOProofWithMFA({ account, signers, roles, registry, extData, inputs, outputs, utxoTree, nullifyingKey })

    const nullifiers = proofInputs.inNullifiers
    const commitments = proofInputs.outCommitments
    // const proof = await fullProveUTXO(wasmFilePath, zKeyFilePath, utxoInput);
    const proof = await fullProveUTXO(proofInputs, snarkjs, wasmFilePath, zKeyFilePath);
    const encodedNotes = await Promise.all(outputs.map(async note => await note.encryptPacked('goerli')))
    const encodedProof = ethers.utils.defaultAbiCoder.encode(
        ["uint256[2]", "uint256[2][2]", "uint256[2]"],
        [proof.a, proof.b, proof.c]
    );
    const encodedInputs = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "uint256", "uint256[]", "uint256[]", "bytes[]"],
        [proofInputs.root, proofInputs.registryRoot, nullifiers, commitments, encodedNotes]
    )

    return { proof, nullifiers, commitments, encodedProof, encodedInputs, proofInputs, encodedNotes }
}


export async function prepareWithdrawal(params : {
    account: Account,
    signers: EdDSASigner[],
    roles: bigint[],
    registry: Registry,
    utxoTree: UTXOMerkleTree,
    extData: ExtData,
    inputs: UTXONote[],
    outputs: UTXONote[],
    nullifyingKey: bigint,
    snarkjs: any,
    wasmFilePath: string,
    zKeyFilePath: string
}): Promise<any> {
    const { account, signers, extData, registry, roles, inputs, outputs, utxoTree, snarkjs, nullifyingKey, wasmFilePath, zKeyFilePath } = params
    const withdrawalNote = new UTXONote({
        sender: account.address,
        receiver: extData.account,
        token: extData.tokenData.token,
        identifier: BigNumber.from(extData.tokenData.identifier).toBigInt(),
        amount: BigNumber.from(extData.tokenData.amount).toBigInt(),
        nullifyingKey,
        transferType: TransferType.Withdrawal
    })

    const proofInputs = await prepareUTXOProofWithMFA({
        account,
        signers,
        roles,
        registry,
        extData,
        inputs,
        outputs: [...outputs, withdrawalNote],
        utxoTree,
        nullifyingKey
    })
    const proof = await fullProveUTXO(proofInputs, snarkjs, wasmFilePath, zKeyFilePath);

    const nullifiers = proofInputs.inNullifiers
    const commitments = proofInputs.outCommitments.slice(0, outputs.length)
    const encodedNotes = await Promise.all(outputs.map(async note => await note.encryptPacked('goerli')))
    const encodedProof = ethers.utils.defaultAbiCoder.encode(
        ["uint256[2]", "uint256[2][2]", "uint256[2]"],
        [proof.a, proof.b, proof.c]
    );
    const encodedInputs = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "uint256", "uint256[]", "uint256[]", "bytes[]"],
        [proofInputs.root, proofInputs.registryRoot, nullifiers, commitments, encodedNotes]
    )

    return { proof, nullifiers, commitments, encodedProof, encodedInputs, proofInputs, encodedNotes }
}


/********************
 * Helper Functions *
 ********************/

export async function signDepositData(
    signer: any,
    depositData: DepositData,
    contract: Contract
): Promise<any> {
    const domain = {
        name: "MISTPool",
        version: "1",
        chainId: await signer.getChainId(),
        verifyingContract: contract.address,
    }
    const types = {
        DepositData: [
            {name: "nonce", type: "uint256"},
            {name: "sender", type: "address"},
            {name: "preCommitments", type: "PreCommitment[]"},
        ],
        PreCommitment: [
            {name: "receiverHash", type: "uint256"},
            {name: "encryptedNote", type: "bytes"},
            {name: "tokenData", type: "TokenData"},
        ],
        TokenData: [
            {name: "standard", type: "uint8"},
            {name: "token", type: "address"},
            {name: "identifier", type: "uint256"},
            {name: "amount", type: "uint256"},
        ],
    }
    return await signer._signTypedData(domain, types, depositData)
}


export async function generatePreCommitments(
    sender: string,
    receivers: string[],
    tokenDatas: TokenData[],
    nullifyingKey: bigint
): Promise<{ preCommitments: PreCommitment[], commitments: bigint[], notes: UTXONote[] }> {
    if (receivers.length !== tokenDatas.length) {
        throw new Error("receivers and tokenDatas must have the same length")
    }
    const preCommitments: PreCommitment[] = Array(receivers.length)
    const commitments: bigint[] = Array(receivers.length)
    const notes: UTXONote[] = Array(receivers.length)
    for (let i=0; i<receivers.length; i++) {
        const note = new UTXONote({
            index: 0,
            sender: sender,
            receiver: receivers[i],
            token: tokenDatas[i].token,
            identifier: BigNumber.from(tokenDatas[i].identifier).toBigInt(),
            amount: BigNumber.from(tokenDatas[i].amount).toBigInt(),
            nullifyingKey
        })
        const receiverHash = note.getAccountHash()
        const encryptedNote = await note.encryptPacked('goerli')
        preCommitments[i] = {
            receiverHash,
            tokenData: tokenDatas[i],
            encryptedNote,
        }
        commitments[i] = note.getCommitment()
        notes[i] = note
    }
    return { preCommitments, commitments, notes }
}
