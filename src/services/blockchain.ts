export async function anchorRecordOnChain(): Promise<never> {
  throw new Error('Blockchain anchoring is unavailable: no RPC endpoint, signer, or deployed contract is configured.');
}

export async function executeSettlementPayout(): Promise<never> {
  throw new Error('Settlement is unavailable: no insurer authorization or deployed payment contract is configured.');
}
