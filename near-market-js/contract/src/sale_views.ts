import { Contract } from ".";
import { restoreOwners } from "./internal";
import { Sale } from "./sale";

export function internalSupplySales({
    contract
}: {
    contract: Contract
}): string {
    return contract.sales.len().toString();
}

export function internalSupplyByOwnerId({
    contract,
    accountId
}: {
    contract: Contract,
    accountId: string
}): string {
    let byOwnerId = restoreOwners(contract.byOwnerId.get(accountId));
    if (byOwnerId == null) {
        return "0"
    }

    return byOwnerId.len().toString();
}

export function internalSalesByOwnerId({
    contract,
    accountId,
    fromIndex,
    limit
}: {
    contract: Contract,
    accountId: string,
    fromIndex?: string,
    limit?: number
}): Sale[] {
    let tokenSet = restoreOwners(contract.byOwnerId.get(accountId));

    if (tokenSet == null) {
        return [];
    }

    let start = fromIndex ? parseInt(fromIndex) : 0;
    let max = limit ? limit : 50;

    let keys = tokenSet.toArray();
    let sales: Sale[] = []
    for (let i = start; i < max; i++) {
        if (i >= keys.length) {
            break;
        }
        let sale = contract.sales.get(keys[i]) as Sale;
        if (sale != null) {
            sales.push(sale);
        }
    }
    return sales;
}

export function internalSupplyByNftContractId({
    contract,
    nftContractId
}: {
    contract: Contract,
    nftContractId: string
}): string {
    let byNftContractId = restoreOwners(contract.byNftContractId.get(nftContractId));
    if (byNftContractId == null) {
        return "0"
    }

    return byNftContractId.len().toString();
}

export function internalSalesByNftContractId({
    contract,
    accountId,
    fromIndex,
    limit
}: {
    contract: Contract,
    accountId: string,
    fromIndex?: string,
    limit?: number
}): Sale[] {
    let tokenSet = restoreOwners(contract.byNftContractId.get(accountId));

    if (tokenSet == null) {
        return [];
    }

    let start = fromIndex ? parseInt(fromIndex) : 0;
    let max = limit ? limit : 50;

    let keys = tokenSet.toArray();
    let sales: Sale[] = []
    for (let i = start; i < max; i++) {
        if (i >= keys.length) {
            break;
        }
        let sale = contract.sales.get(keys[i]) as Sale;
        if (sale != null) {
            sales.push(sale);
        }
    }
    return sales;
}

export function internalGetSale({
    contract,
    nftContractToken,
}: {
    contract: Contract,
    nftContractToken: string
}): Sale {
    return contract.sales.get(nftContractToken) as Sale;
}