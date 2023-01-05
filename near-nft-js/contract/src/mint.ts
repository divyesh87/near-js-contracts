import { Contract } from "."
import { Token, TokenMetadata } from "./metadata"
import { assert, near } from "near-sdk-js"
import { internalAddTokenToOwner, refundDeposit } from "./internal";

export function internalMint({
    contract,
    tokenId,
    metadata,
    receiverId,
}: {
    contract: Contract,
    tokenId: string,
    metadata: TokenMetadata,
    receiverId: string,
}): void {
    let initialStorage = near.storageUsage();

    let token = new Token({
        ownerId: receiverId,
        approvedAccountIds: {},
        nextApprovalId: 0
    })

    assert(!contract.tokensById.containsKey(tokenId), "Token already exists, try with a unique key")

    contract.tokensById.set(tokenId, token);
    contract.tokenMetadataById.set(tokenId, metadata);

    internalAddTokenToOwner(contract, token.owner_id, tokenId)

    let reqStorage = near.storageUsage().valueOf() - initialStorage.valueOf();

    refundDeposit(reqStorage);
}