import { BigNumber } from "ethers";


export enum TransferType {
    Deposit,
    Withdrawal,
    Transfer
}

export enum TokenStandard {
    ERC20,
    ERC721,
    ERC1155
}

export interface TokenData {
    standard: TokenStandard,
    token: string,
    identifier: BigNumber | number | bigint,
    amount: BigNumber | number | bigint,
}

export interface ExtData {
    chainId: number
    treeIndex: BigNumber | number
    account: string
    transferType: TransferType
    tokenData: TokenData
}

export interface PreCommitment {
    receiverHash: bigint
    encryptedNote: string
    tokenData: TokenData
}

export interface DepositData {
    nonce: BigNumber | number | bigint
    sender: string
    preCommitments: PreCommitment[]
}

export interface EncryptedNote {
    encryptedData: string
    encryptedSenderKey: string
    encryptedReceiverKey: string
}