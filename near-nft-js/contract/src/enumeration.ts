import { near, UnorderedSet } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { restoreOwners } from "./internal";
import { JsonToken } from "./metadata";
import { internalNftToken } from "./nft_core";

export function internalTotalSupply({
    contract
}: {
    contract: Contract
}): number {
    return contract.tokenMetadataById.len();
}

export function internalNftTokens({
    contract,
    fromIndex,
    limit
}: {
    contract: Contract,
    fromIndex?: string,
    limit?: number
}): JsonToken[] {
    let tokens = [];

    let start = fromIndex ? parseInt(fromIndex) : 0;
    let max = limit ? limit : 50;

    let keys = contract.tokenMetadataById.toArray();
    for (let i = start; i < keys.length && i < start + max; i++) {
        let jsonToken = internalNftToken({ contract, tokenId: keys[i][0] });
        tokens.push(jsonToken);
    }
    return tokens;
}

export function internalSupplyForOwner({
    contract,
    accountId
}: {
    contract: Contract,
    accountId: string
}): number {
    let tokens = restoreOwners(contract.tokensPerOwner.get(accountId));
    if (tokens == null) {
        return 0
    }
    return tokens.len();
}

export function internalTokensForOwner({
    contract,
    accountId,
    fromIndex,
    limit
}: {
    contract: Contract,
    accountId: string,
    fromIndex?: string,
    limit?: number
}): JsonToken[] {
    let tokenSet = restoreOwners(contract.tokensPerOwner.get(accountId));

    if (tokenSet == null) {
        return [];
    }

    let start = fromIndex ? parseInt(fromIndex) : 0;
    let max = limit ? limit : 50;

    let keys = tokenSet.toArray();
    let tokens: JsonToken[] = []
    for (let i = start; i < max; i++) {
        if (i >= keys.length) {
            break;
        }
        let token = internalNftToken({ contract, tokenId: keys[i] });
        tokens.push(token);
    }
    return tokens;
}