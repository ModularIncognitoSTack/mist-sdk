import { RawProof, ZKProver, AccountInputs, BalanceInputs, UTXOInputs } from "./types";


export async function fullProve(
  prover: ZKProver,
  inputs: any,
  snarkjs: any
): Promise<RawProof> {
  const { proof } = await snarkjs.groth16.fullProve(
    inputs,
    prover.wasm,
    prover.zKey
  )
  return {
    a: [proof.pi_a[0], proof.pi_a[1]] as [bigint, bigint],
    b: [proof.pi_b[0].reverse(), proof.pi_b[1].reverse()] as [
      [bigint, bigint],
      [bigint, bigint]
    ],
    c: [proof.pi_c[0], proof.pi_c[1]] as [bigint, bigint],
  };
}


export async function fullProveMembership(
  inputs: AccountInputs,
  snarkjs: any,
  wasmFilePath: string,
  zKeyFilePath: string
): Promise<RawProof> {
  const prover: ZKProver = {
    wasm: wasmFilePath,
    zKey: zKeyFilePath,
  }
  return await fullProve(prover, inputs, snarkjs);
}


export async function fullProveUTXO(
  inputs: UTXOInputs,
  snarkjs: any,
  wasmFilePath: string,
  zKeyFilePath: string,
): Promise<RawProof> {
  const prover: ZKProver = {
    wasm: wasmFilePath,
    zKey: zKeyFilePath,
  }
  return await fullProve(prover, inputs, snarkjs);
}


export async function fullProveBalance(
  inputs: BalanceInputs,
  snarkjs: any,
  wasmFilePath: string,
  zKeyFilePath: string
): Promise<RawProof> {
  const prover: ZKProver = {
    wasm: wasmFilePath,
    zKey: zKeyFilePath,
  }
  return await fullProve(prover, inputs, snarkjs);
}