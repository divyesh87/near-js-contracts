import { assert, near, UnorderedSet, Vector } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { Token } from "./metadata";

export function restoreOwners(collection) {
    if (collection == null) {
        return null;
    }
    return UnorderedSet.deserialize(collection as UnorderedSet);
}

export function refundApprovedAccountIdsIter(accountId: string, approvedAccountIds: string[]) {
    let storageReleased = approvedAccountIds.map(e => bytesForApprovedAccountId(e)).reduce((partialSum, a) => partialSum + a, 0);
    let amountToTransfer = BigInt(storageReleased) * near.storageByteCost().valueOf();
    const promise = near.promiseBatchCreate(accountId);
    near.promiseBatchActionTransfer(promise, amountToTransfer)
}

export function refundApprovedAccountIds(accountId: string, approvedAccountIds: { [key: string]: number }) {
    refundApprovedAccountIdsIter(accountId, Object.keys(approvedAccountIds));
}

export function internalAddTokenToOwner(contract: Contract, accountId: string, tokenId: string) {
    let tokenSet = restoreOwners(contract.tokensPerOwner.get(accountId));

    if (tokenSet == null) {
        tokenSet = new UnorderedSet("tokensPerOwner" + accountId.toString());
    }

    tokenSet.set(tokenId);
    contract.tokensPerOwner.set(accountId, tokenSet);
}

export function internalRemoveTokenFromOwner(contract: Contract, accountId: string, tokenId: string) {
    let tokenSet = restoreOwners(contract.tokensPerOwner.get(accountId));
    if (tokenSet == null) {
        near.panic("Token should be owned by the sender");
    }
    tokenSet.remove(tokenId)

    if (tokenSet.isEmpty()) {
        contract.tokensPerOwner.remove(accountId);
    } else {
        contract.tokensPerOwner.set(accountId, tokenSet);
    }
}

export function refundDeposit(storageUsed: bigint) {
    let requiredCost = storageUsed * near.storageByteCost().valueOf()
    let attachedDeposit = near.attachedDeposit().valueOf();

    assert(
        requiredCost <= attachedDeposit,
        `Must attach ${requiredCost} yoctoNEAR to cover storage`
    )

    let refund = attachedDeposit - requiredCost;
    near.log(`Refunding ${refund} yoctoNEAR`);

    if (refund > 1) {
        const promise = near.promiseBatchCreate(near.predecessorAccountId());
        near.promiseBatchActionTransfer(promise, refund)
    }
}

export function bytesForApprovedAccountId(accountId: string): number {
    return accountId.length + 4 + 8;
}

export function assertAtLeastOneYocto() {
    assert(near.attachedDeposit().valueOf() >= BigInt(1), "Requires attached deposit of at least 1 yoctoNEAR");
}

export function assertOneYocto() {
    assert(near.attachedDeposit().toString() === "1", "Requires attached deposit of exactly 1 yoctoNEAR");
}

export function internalTransfer(contract: Contract, senderId: string, receiverId: string, tokenId: string, approvalId: number, memo: string): Token {
    let token = contract.tokensById.get(tokenId) as Token;
    if (token == null) {
        near.panic("no token found");
    }

    if (senderId != token.owner_id) {
        if (!token.approved_account_ids.hasOwnProperty(senderId)) {
            near.panic("Unauthorized");
        }

        if (approvalId != null) {
            let actualApprovalId = token.approved_account_ids[senderId];
            if (actualApprovalId == null) {
                near.panic("Sender is not approved account");
            }

            assert(actualApprovalId == approvalId, `The actual approval_id ${actualApprovalId} is different from the given approval_id ${approvalId}`);
        }
    }

    assert(token.owner_id != receiverId, "The token owner and the receiver should be different")

    internalRemoveTokenFromOwner(contract, token.owner_id, tokenId);
    internalAddTokenToOwner(contract, receiverId, tokenId);

    let newToken = new Token({
        ownerId: receiverId,
        approvedAccountIds: {},
        nextApprovalId: token.next_approval_id,
    });

    contract.tokensById.set(tokenId, newToken);

    if (memo != null) {
        near.log(`Memo: ${memo}`);
    }

    let authorizedId;

    if (approvalId != null) {
        authorizedId = senderId
    }

    let nftTransferLog = {
        standard: NFT_STANDARD_NAME,
        version: NFT_METADATA_SPEC,
        event: "nft_transfer",
        data: [
            {
                authorized_id: authorizedId,
                old_owner_id: token.owner_id,
                new_owner_id: receiverId,
                token_ids: [tokenId],
                memo,
            }
        ]
    }

    near.log(JSON.stringify(nftTransferLog));
    return token
}