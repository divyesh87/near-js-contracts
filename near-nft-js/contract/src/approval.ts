import { assert, bytes, near } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { assertAtLeastOneYocto, assertOneYocto, bytesForApprovedAccountId, internalAddTokenToOwner, refundDeposit, refundApprovedAccountIds, refundApprovedAccountIdsIter } from "./internal";
import { Token } from "./metadata";

const GAS_FOR_NFT_ON_APPROVE = 35_000_000_000_000;

export function internalNftApprove({
    contract,
    tokenId,
    accountId,
    msg
}: {
    contract: Contract,
    tokenId: string,
    accountId: string,
    msg: string
}) {
    assertAtLeastOneYocto();

    let token = contract.tokensById.get(tokenId) as Token;
    if (token == null) {
        near.panic("no token");
    }
    assert(near.predecessorAccountId() === token.owner_id, "Predecessor must be the token owner");

    let approvalId = token.next_approval_id;

    let isNewApproval = token.approved_account_ids.hasOwnProperty(accountId);
    token.approved_account_ids[accountId] = approvalId;

    let storageUsed = isNewApproval ? bytesForApprovedAccountId(accountId) : 0;

    token.next_approval_id += 1;
    contract.tokensById.set(tokenId, token);

    refundDeposit(BigInt(storageUsed));

    if (msg != null) {
        const promise = near.promiseBatchCreate(accountId);
        near.promiseBatchActionFunctionCall(
            promise,
            "nft_on_approve",
            bytes(JSON.stringify({
                token_id: tokenId,
                owner_id: token.owner_id,
                approval_id: approvalId,
                msg
            })),
            0,
            GAS_FOR_NFT_ON_APPROVE
        );

        near.promiseReturn(promise);
    }
}

export function internalNftIsApproved({
    contract,
    tokenId,
    approvedAccountId,
    approvalId
}: {
    contract: Contract,
    tokenId: string,
    approvedAccountId: string,
    approvalId: number
}) {
    let token = contract.tokensById.get(tokenId) as Token;
    if (token == null) {
        near.panic("no token");
    }

    let approval = token.approved_account_ids[approvedAccountId];

    if (approval == null) {
        return false
    }

    if (approvalId == null) {
        return true
    }

    return approvalId == approval;
}

export function internalNftRevoke({
    contract,
    tokenId,
    accountId
}: {
    contract: Contract,
    tokenId: string,
    accountId: string
}) {
    assertOneYocto();

    let token = contract.tokensById.get(tokenId) as Token;
    if (token == null) {
        near.panic("no token");
    }

    let predecessorAccountId = near.predecessorAccountId();
    assert(predecessorAccountId == token.owner_id, "only token owner can revoke");

    if (token.approved_account_ids.hasOwnProperty(accountId)) {
        delete token.approved_account_ids[accountId];

        refundApprovedAccountIdsIter(predecessorAccountId, [accountId]);

        contract.tokensById.set(tokenId, token);
    }
}

export function internalNftRevokeAll({
    contract,
    tokenId
}: {
    contract: Contract,
    tokenId: string
}) {
    assertOneYocto();

    let token = contract.tokensById.get(tokenId) as Token;
    if (token == null) {
        near.panic("no token");
    }

    let predecessorAccountId = near.predecessorAccountId();
    assert(predecessorAccountId == token.owner_id, "only token owner can revoke");

    if (token.approved_account_ids && Object.keys(token.approved_account_ids).length === 0 && Object.getPrototypeOf(token.approved_account_ids) === Object.prototype) {
        refundApprovedAccountIds(predecessorAccountId, token.approved_account_ids);
        token.approved_account_ids = {};
        contract.tokensById.set(tokenId, token);
    }
}