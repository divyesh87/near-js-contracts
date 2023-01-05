import { Contract } from ".";

export class Payout {
    payout: { [accountId: string]: bigint };
    constructor({ payout }: { payout: { [accountId: string]: bigint } }) {
        this.payout = payout;
    }
}

export class TokenMetadata {
    title?: string;
    description?: string;
    media?: string;

    constructor(
        {
            title,
            description,
            media,

        }: {
            title?: string,
            description?: string,
            media?: string,

        }
    ) {
        this.title = title
        this.description = description
        this.media = media
    }
}

export class Token {
    owner_id: string;
    approved_account_ids: { [accountId: string]: number };
    next_approval_id: number;

    constructor({
        ownerId,
        approvedAccountIds,
        nextApprovalId,
    }: {
        ownerId: string,
        approvedAccountIds: { [accountId: string]: number },
        nextApprovalId: number,
    }) {
        this.owner_id = ownerId;
        this.approved_account_ids = approvedAccountIds;
        this.next_approval_id = nextApprovalId
    }
}

export class JsonToken {
    token_id: string;
    owner_id: string;
    metadata: TokenMetadata;
    approved_account_ids: { [accountId: string]: number };

    constructor({
        tokenId,
        ownerId,
        metadata,
        approvedAccountIds,
    }: {
        tokenId: string,
        ownerId: string,
        metadata: TokenMetadata,
        approvedAccountIds: { [accountId: string]: number }
    }) {
        this.token_id = tokenId
        this.owner_id = ownerId
        this.metadata = metadata
        this.approved_account_ids = approvedAccountIds
    }
}