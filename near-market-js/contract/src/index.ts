import { NearContract, NearBindgen, near, call, view, LookupMap, UnorderedMap, Vector, UnorderedSet, assert } from 'near-sdk-js'
import { assertOneYocto, restoreOwners } from './internal';
import { internalNftOnApprove } from './nft_callbacks';
import { internalOffer, internalRemoveSale, internalResolvePurchase, internalUpdatePrice, Sale } from './sale';
import { internalGetSale, internalSalesByNftContractId, internalSalesByOwnerId, internalSupplyByNftContractId, internalSupplyByOwnerId, internalSupplySales } from './sale_views';

export const NFT_METADATA_SPEC = "nft-1.0.0";

export const NFT_STANDARD_NAME = "nep171";

export const STORAGE_PER_SALE: bigint = BigInt(1000) * near.storageByteCost().valueOf();

export const DELIMETER = ".";

@NearBindgen
export class Contract extends NearContract {
  ownerId: string;
  sales: UnorderedMap;
  byOwnerId: LookupMap;
  byNftContractId: LookupMap;
  storageDeposits: LookupMap;

  constructor({ owner_id }: { owner_id: string }) {
    super()
    this.ownerId = owner_id;
    this.sales = new UnorderedMap("sales");
    this.byOwnerId = new LookupMap("byOwnerId");
    this.byNftContractId = new LookupMap("byNftContractId");
    this.storageDeposits = new LookupMap("storageDeposits");
  }

  default() {
    return new Contract({ owner_id: near.predecessorAccountId() })
  }

  @call
  storage_deposit({ account_id }: { account_id?: string }) {
    let storageAccountId = account_id || near.predecessorAccountId();
    let deposit = near.attachedDeposit().valueOf();

    assert(deposit >= STORAGE_PER_SALE, `Requires minimum deposit of ${STORAGE_PER_SALE}`);

    let balance: string = this.storageDeposits.get(storageAccountId) as string || "0";
    let newBalance = BigInt(balance) + deposit;
    this.storageDeposits.set(storageAccountId, newBalance.toString());
  }

  @call
  storage_withdraw() {
    assertOneYocto();
    let ownerId = near.predecessorAccountId();
    let amount: string = this.storageDeposits.remove(ownerId) as string || "0";
    let sales = restoreOwners(this.byOwnerId.get(ownerId));
    let len = 0;
    if (sales != null) {
      len = sales.len();
    }
    let diff = BigInt(len) * STORAGE_PER_SALE;
    let amountLeft = BigInt(amount) - diff;

    if (amountLeft > 0) {
      const promise = near.promiseBatchCreate(ownerId);
      near.promiseBatchActionTransfer(promise, amountLeft)
    }
    if (diff > 0) {
      this.storageDeposits.set(ownerId, diff.toString());
    }
  }

  @view
  storage_minimum_balance(): string {
    return STORAGE_PER_SALE.toString()
  }

  @view
  storage_balance_of({ account_id }: { account_id: string }): string {
    return this.storageDeposits.get(account_id) as string || "0";
  }

  @call
  remove_sale({ nft_contract_id, token_id }: { nft_contract_id: string, token_id: string }) {
    return internalRemoveSale({ contract: this, nftContractId: nft_contract_id, tokenId: token_id });
  }

  @call
  update_price({ nft_contract_id, token_id, price }: { nft_contract_id: string, token_id: string, price: string }) {
    return internalUpdatePrice({ contract: this, nftContractId: nft_contract_id, tokenId: token_id, price: price });
  }

  @call
  offer({ nft_contract_id, token_id }: { nft_contract_id: string, token_id: string }) {
    return internalOffer({ contract: this, nftContractId: nft_contract_id, tokenId: token_id });
  }

  @call
  resolve_purchase({ buyer_id, price }: { buyer_id: string, price: string }) {
    return internalResolvePurchase({ buyerId: buyer_id, price: price });
  }

  @view
  get_supply_sales(): string {
    return internalSupplySales({ contract: this });
  }

  @view
  get_supply_by_owner_id({ account_id }: { account_id: string }): string {
    return internalSupplyByOwnerId({ contract: this, accountId: account_id });
  }

  @view
  get_sales_by_owner_id({ account_id, from_index, limit }: { account_id: string, from_index?: string, limit?: number }): Sale[] {
    return internalSalesByOwnerId({ contract: this, accountId: account_id, fromIndex: from_index, limit: limit });
  }

  @view
  get_supply_by_nft_contract_id({ nft_contract_id }: { nft_contract_id: string }): string {
    return internalSupplyByNftContractId({ contract: this, nftContractId: nft_contract_id });
  }

  @view
  get_sales_by_nft_contract_id({ nft_contract_id, from_index, limit }: { nft_contract_id: string, from_index?: string, limit?: number }): Sale[] {
    return internalSalesByNftContractId({ contract: this, accountId: nft_contract_id, fromIndex: from_index, limit: limit });
  }

  @view
  get_sale({ nft_contract_token }: { nft_contract_token: string }): Sale {
    return internalGetSale({ contract: this, nftContractToken: nft_contract_token });
  }

  @call
  nft_on_approve({ token_id, owner_id, approval_id, msg }: { token_id: string, owner_id: string, approval_id: number, msg: string }) {
    return internalNftOnApprove({ contract: this, tokenId: token_id, ownerId: owner_id, approvalId: approval_id, msg: msg });
  }

}