import { assert, near, UnorderedSet } from "near-sdk-js";
import { Contract, DELIMETER } from ".";
import { Sale } from "./sale";
import { internalSupplyByOwnerId } from "./sale_views";

export function internalNftOnApprove({
    contract,
    tokenId,
    ownerId,
    approvalId,
    msg
}: {
    contract: Contract,
    tokenId: string,
    ownerId: string,
    approvalId: number,
    msg: string
}) {
    let contractId = near.predecessorAccountId();
    let signerId = near.signerAccountId();

    assert(signerId != contractId, "this function can only be called via a cross-contract call");
    assert(ownerId == signerId, "only the owner of the token can approve it");

    let storageAmount = contract.storage_minimum_balance();
    let ownerPaidStorage = contract.storageDeposits.get(signerId) || BigInt(0);
    let signerStorageRequired = (BigInt(internalSupplyByOwnerId({ contract, accountId: signerId })) + BigInt(1)) * BigInt(storageAmount);

    assert(ownerPaidStorage >= signerStorageRequired, "the owner does not have enough storage to approve this token");

    let saleConditions = JSON.parse(msg);
    if (!saleConditions.hasOwnProperty('sale_conditions') || Object.keys(saleConditions).length != 1) {
        near.panic("invalid sale conditions");
    }
    let contractAndTokenId = `${contractId}${DELIMETER}${tokenId}`;

    contract.sales.set(contractAndTokenId, new Sale({
        ownerId: ownerId,
        approvalId: approvalId,
        nftContractId: contractId,
        tokenId: tokenId,
        saleConditions: saleConditions.sale_conditions
    }));

    let byOwnerId = contract.byOwnerId.get(ownerId) as UnorderedSet || new UnorderedSet(ownerId);
    byOwnerId.set(contractAndTokenId);
    contract.byOwnerId.set(ownerId, byOwnerId);

    let byNftContractId = contract.byNftContractId.get(contractId) as UnorderedSet || new UnorderedSet(contractId);
    byNftContractId.set(tokenId);
    contract.byNftContractId.set(contractId, byNftContractId);

}