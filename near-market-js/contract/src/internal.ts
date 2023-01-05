import { assert, near, UnorderedSet } from "near-sdk-js";
import { Contract, DELIMETER } from ".";
import { Sale } from "./sale";

export function restoreOwners(collection) {
    if (collection == null) {
        return null;
    }
    return UnorderedSet.deserialize(collection as UnorderedSet);
}

export function assertOneYocto() {
    assert(near.attachedDeposit().toString() === "1", "Requires attached deposit of exactly 1 yoctoNEAR");
}

export function internallyRemoveSale(contract: Contract, nftContractId: string, tokenId: string): Sale {
    let contractAndTokenId = `${nftContractId}${DELIMETER}${tokenId}`;
    let sale = contract.sales.remove(contractAndTokenId) as Sale;
    if (sale == null) {
        near.panic("no sale");
    }
    let byOwnerId = restoreOwners(contract.byOwnerId.get(sale.owner_id));
    if (byOwnerId == null) {
        near.panic("no sales by owner");
    }
    byOwnerId.remove(contractAndTokenId);

    if (byOwnerId.isEmpty()) {
        contract.byOwnerId.remove(sale.owner_id);
    } else {
        contract.byOwnerId.set(sale.owner_id, byOwnerId);
    }

    let byNftContractId = restoreOwners(contract.byNftContractId.get(nftContractId));
    if (byNftContractId == null) {
        near.panic("no sales by nft contract");
    }

    byNftContractId.remove(tokenId);
    if (byNftContractId.isEmpty()) {
        contract.byNftContractId.remove(nftContractId);
    } else {
        contract.byNftContractId.set(nftContractId, byNftContractId);
    }

    return sale;
}