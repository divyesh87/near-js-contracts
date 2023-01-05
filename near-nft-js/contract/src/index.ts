import { NearContract, NearBindgen, near, call, view, LookupMap, UnorderedMap } from 'near-sdk-js';
import { Token, TokenMetadata } from './metadata';
import { internalMint } from './mint';
import { internalNftTransfer, internalNftTransferCall, internalResolveTransfer, internalNftToken } from './nft_core';
import { internalNftTokens, internalSupplyForOwner, internalTokensForOwner, internalTotalSupply } from './enumeration';
import { internalNftApprove, internalNftIsApproved, internalNftRevoke, internalNftRevokeAll } from './approval';


export const NFT_METADATA_SPEC = "nft-1.0.0";
export const NFT_STANDARD_NAME = "nep171";


@NearBindgen
export class Contract extends NearContract {
  owner_id: string;
  tokensPerOwner: LookupMap;
  tokensById: LookupMap;
  tokenMetadataById: UnorderedMap;


  constructor({ owner_id }: { owner_id: string }) {
    super()
    this.owner_id = owner_id;
    this.tokensPerOwner = new LookupMap("tokensPerOwner");
    this.tokensById = new LookupMap("tokensById");
    this.tokenMetadataById = new UnorderedMap("tokenMetadataById");
  }

  default() {
    return new Contract({ owner_id: near.predecessorAccountId() })
  }

  @call
  nft_mint({ token_id, metadata, receiver_id }) {
    return internalMint({ contract: this, tokenId: token_id, metadata: metadata, receiverId: receiver_id })
  }
  @view
  nft_token({ token_id }) {
    return internalNftToken({ contract: this, tokenId: token_id });
  }

  @call
  nft_transfer({ receiver_id, token_id, approval_id, memo }) {
    return internalNftTransfer({ contract: this, receiverId: receiver_id, tokenId: token_id, approvalId: approval_id, memo: memo });
  }

  @call
  nft_transfer_call({ receiver_id, token_id, approval_id, memo, msg }) {
    return internalNftTransferCall({ contract: this, receiverId: receiver_id, tokenId: token_id, approvalId: approval_id, memo: memo, msg: msg });
  }

  @call
  nft_resolve_transfer({ authorized_id, owner_id, receiver_id, token_id, approved_account_ids, memo }) {
    return internalResolveTransfer({ contract: this, authorizedId: authorized_id, ownerId: owner_id, receiverId: receiver_id, tokenId: token_id, approvedAccountIds: approved_account_ids, memo: memo });
  }

  @view
  nft_is_approved({ token_id, approved_account_id, approval_id }) {
    return internalNftIsApproved({ contract: this, tokenId: token_id, approvedAccountId: approved_account_id, approvalId: approval_id });
  }
  @call
  nft_approve({ token_id, account_id, msg }) {
    return internalNftApprove({ contract: this, tokenId: token_id, accountId: account_id, msg: msg });
  }

  @view
  nft_payout() {
    return "Royalty not supported";
  }

  @view
  nft_transfer_payout() {
    return "Royalty not supported";
  }

  @call
  nft_revoke({ token_id, account_id }) {
    return internalNftRevoke({ contract: this, tokenId: token_id, accountId: account_id });
  }

  @call
  nft_revoke_all({ token_id }) {
    return internalNftRevokeAll({ contract: this, tokenId: token_id });
  }

  @view
  nft_total_supply() {
    return internalTotalSupply({ contract: this });
  }


  @view
  nft_tokens({ from_index, limit }) {
    return internalNftTokens({ contract: this, fromIndex: from_index, limit: limit });
  }

  @view
  nft_tokens_for_owner({ account_id, from_index, limit }) {
    return internalTokensForOwner({ contract: this, accountId: account_id, fromIndex: from_index, limit: limit });
  }

  @view
  nft_supply_for_owner({ account_id }) {
    return internalSupplyForOwner({ contract: this, accountId: account_id });
  }

  @view
  nft_metadata() {
    return "Ignitus networks, NEP171"
  }

}