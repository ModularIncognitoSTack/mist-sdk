import * as LitProtocolSDK from '@lit-protocol/lit-node-client'

export class Lit {
    litNodeClient: any
    _aclConditions?: any[]
    private _chain?: string
    private _initialized = false

    constructor() {
        this.litNodeClient = new LitProtocolSDK.LitNodeClient(undefined)
    }

    async connect() {
        await this.litNodeClient.connect()
        this._initialized = true
    }

    get accessControlConditions() {
        if (!this._aclConditions) throw Error("Not initialized");
        return this._aclConditions;
    }

    setACL(addresses: string[], chain: string) {
        if (addresses.length !== 2) throw Error("Invalid number of addresses")
        const conditions = addresses.map(address => {
            return [
                {
                    conditionType: "evmBasic",
                    contractAddress: "",
                    standardContractType: "",
                    chain,
                    method: "",
                    parameters: [":userAddress"],
                    returnValueTest: {
                        comparator: "=",
                        value: addresses[0]
                    }
                }
            ]
        })
        this._aclConditions = conditions
        this._chain = chain
    }

    async encryptNote(chain: string, data: {
        sender: string,
        receiver: string,
        token: string,
        identifier: string,
        amount: string,
        random: string,
        memo?: string,
    }) {
        if (!this._initialized) await this.connect()
        this.setACL([data.sender, data.receiver], chain)
        const authSig =  await LitProtocolSDK.checkAndSignAuthMessage({ chain })
        const { encryptedString, symmetricKey } = await LitProtocolSDK.encryptString(JSON.stringify(data))

        const encryptedKeys = await Promise.all([data.sender, data.receiver].map(async address => {
            const conditions = [
                {
                    conditionType: "evmBasic",
                    contractAddress: "",
                    standardContractType: "",
                    chain,
                    method: "",
                    parameters: [":userAddress"],
                    returnValueTest: {
                        comparator: "=",
                        value: address
                    }
                }
            ]

            return await this.litNodeClient.saveEncryptionKey({
                accessControlConditions: conditions,
                symmetricKey,
                authSig,
                chain,
            });
        }))

        return {
            encryptedData: await LitProtocolSDK.blobToBase64String(encryptedString),
            encryptedSenderKey: LitProtocolSDK.uint8arrayToString(encryptedKeys[0], "base16"),
            encryptedReceiverKey: LitProtocolSDK.uint8arrayToString(encryptedKeys[1], "base16"),
        };
    }

    async encrypt(chain: string, address: string, data: string) {
        if (!this._initialized) await this.connect()
        const authSig =  await LitProtocolSDK.checkAndSignAuthMessage({ chain })
        const { encryptedString, symmetricKey } = await LitProtocolSDK.encryptString(data)

        const conditions = [
            {
                conditionType: "evmBasic",
                contractAddress: "",
                standardContractType: "",
                chain,
                method: "",
                parameters: [":userAddress"],
                returnValueTest: {
                    comparator: "=",
                    value: address
                }
            }
        ]

        const encryptedKey = await this.litNodeClient.saveEncryptionKey({
            accessControlConditions: conditions,
            symmetricKey,
            authSig,
            chain,
        });

        return {
            data: await LitProtocolSDK.blobToBase64String(encryptedString),
            key: LitProtocolSDK.uint8arrayToString(encryptedKey, "base16"),
        };
    }

    async decrypt(encryptedData: string, encryptedSymmetricKey: string, address: string, chain: string): Promise<string> {
        await this.connect()
        const authSig = await LitProtocolSDK.checkAndSignAuthMessage({ chain });
        const conditions = [
            {
                conditionType: "evmBasic",
                contractAddress: "",
                standardContractType: "",
                chain,
                method: "",
                parameters: [":userAddress"],
                returnValueTest: {
                    comparator: "=",
                    value: address
                }
            }
        ]
        const symmetricKey = await this.litNodeClient.getEncryptionKey({
            accessControlConditions: conditions,
            toDecrypt: encryptedSymmetricKey,
            chain,
            authSig
        });
        const value = LitProtocolSDK.base64StringToBlob(encryptedData)
    
        const decryptedOutput = await LitProtocolSDK.decryptString(
            value,
            symmetricKey
        );
        
        return decryptedOutput
    }

    async decryptNote(encryptedData: string, encryptedSymmetricKey: string, address: string, chain: string) {
        await this.connect()
        const authSig = await LitProtocolSDK.checkAndSignAuthMessage({ chain });
        const conditions = [
            {
                conditionType: "evmBasic",
                contractAddress: "",
                standardContractType: "",
                chain,
                method: "",
                parameters: [":userAddress"],
                returnValueTest: {
                    comparator: "=",
                    value: address
                }
            }
        ]
        const symmetricKey = await this.litNodeClient.getEncryptionKey({
            accessControlConditions: conditions,
            toDecrypt: encryptedSymmetricKey,
            chain,
            authSig
        });
        const value = LitProtocolSDK.base64StringToBlob(encryptedData)
    
        const decryptedOutput = await LitProtocolSDK.decryptString(
            value,
            symmetricKey
        );
        
        return JSON.parse(decryptedOutput)
    }

    disconnect(): void {
        LitProtocolSDK.disconnectWeb3()
    }
}
