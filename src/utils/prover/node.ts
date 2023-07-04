import { buildBabyjub } from "circomlibjs";
import * as snarkjs from "snarkjs";
import fs from "fs";

import { AccountInputs, ZKProver, RawProof, BalanceInputs, UTXOInputs } from "./types";
import buildCalculator from "../../zk/witness_calculator";


export async function prove(
  prover: ZKProver,
  inputs: any
): Promise<RawProof> {
  let zkey: any;
  let calculator: any;
  let babyjub: any;
  [zkey, calculator, babyjub] = await Promise.all([
    prover.zKey,
    buildCalculator(prover.wasm),
    buildBabyjub(),
  ]);
  zkey.type = "mem";

  const wtns = await calculator.calculateWTNSBin(inputs, 0);
  const { proof } = await snarkjs.groth16.prove(zkey, wtns);
  return {
    a: [proof.pi_a[0], proof.pi_a[1]] as [bigint, bigint],
    b: [proof.pi_b[0].reverse(), proof.pi_b[1].reverse()] as [
      [bigint, bigint],
      [bigint, bigint]
    ],
    c: [proof.pi_c[0], proof.pi_c[1]] as [bigint, bigint],
  };
}


export async function proveMembership(
  wasmFilePath: string,
  zKeyFilePath: string,
  inputs: AccountInputs
): Promise<RawProof> {
  const prover: ZKProver = {
    wasm: fs.readFileSync(wasmFilePath),
    zKey: fs.readFileSync(zKeyFilePath),
  }
  return await prove(prover, inputs);
}


export async function proveUTXO(
  wasmFilePath: string,
  zKeyFilePath: string,
  inputs: UTXOInputs
): Promise<RawProof> {
  const prover: ZKProver = {
    wasm: fs.readFileSync(wasmFilePath),
    zKey: fs.readFileSync(zKeyFilePath),
  }
  return await prove(prover, inputs);
}


export async function proveBalance(
  wasmFilePath: string,
  zKeyFilePath: string,
  inputs: BalanceInputs
): Promise<RawProof> {
  const prover: ZKProver = {
    wasm: fs.readFileSync(wasmFilePath),
    zKey: fs.readFileSync(zKeyFilePath),
  }
  return await prove(prover, inputs);
}


export class SSProver {
  baseURI: string;
  accountCID?: string;
  balanceCID?: string;
  utxoCIDs?: { 1?: string; 2?: string; };

  constructor(params: {
    baseURI: string;
    accountCID?: string;
    balanceCID?: string;
    utxoCIDs?: {
        1?: string;
        2?: string;
    }
  }) {
    this.baseURI = params.baseURI;
    this.accountCID = params.accountCID;
    this.balanceCID = params.balanceCID;
    this.utxoCIDs = params.utxoCIDs;
  }

  async proveMembership(inputs: AccountInputs) {
    let uri: string;
    if (!this.accountCID) {
      uri = `${this.baseURI}`
    } else {
      uri = `${this.baseURI}/${this.accountCID}`
    }
    return await proveMembership(
      `${uri}/account20.wasm`,
      `${uri}/account20.zkey`,
      inputs,
    )
  }

  async proveUTXO(inputs: UTXOInputs) {
    let uri: string;
    const faNum = inputs.roles.length;
    const fileName = `mfa_transaction_${inputs.inNullifiers.length}x${inputs.outCommitments.length}_${faNum}`
    if (!this.utxoCIDs) {
      uri = `${this.baseURI}`
    } else {
      uri = `${this.baseURI}/${this.utxoCIDs[faNum as keyof typeof this.utxoCIDs]}`
    }
    return await proveUTXO(
      `${uri}/${fileName}.wasm`,
      `${uri}/${fileName}.zkey`,
      inputs,
    )
  }

  async proveBalance(inputs: BalanceInputs) {
    let uri: string;
    if (!this.balanceCID) {
      uri = `${this.baseURI}`
    } else {
      uri = `${this.baseURI}/${this.balanceCID}`
    }
    return await proveBalance(
      `${uri}/balance1.wasm`,
      `${uri}/balance1.zkey`,
      inputs,
    )
  }
}