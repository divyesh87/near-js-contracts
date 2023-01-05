import { assert, bytes, near } from "near-sdk-js";
import { Contract, DELIMETER } from ".";
import { assertOneYocto, internallyRemoveSale } from "./internal";

const GAS_FOR_NFT_TRANSFER = 15_000_000_000_000;

export class Sale {
    owner_id: string;
    approval_id: number;
    nft_contract_id: string;
    token_id: String;
    sale_conditions: string;

    constructor(
        {
            ownerId,
            approvalId,
            nftContractId,
            tokenId,
            saleConditions,
        }: {
            ownerId: string,
            approvalId: number,
            nftContractId: string,
            tokenId: String,
            saleConditions: string,
        }) {
        this.owner_id = ownerId;
        this.approval_id = approvalId;
        this.nft_contract_id = nftContractId;
        this.token_id = tokenId;
        this.sale_conditions = saleConditions;
    }
}

export function internalRemoveSale({
    contract,
    nftContractId,
    tokenId
}: {
    contract: Contract,
    nftContractId: string,
    tokenId: string
}) {
    assertOneYocto();

    let sale = internallyRemoveSale(contract, nftContractId, tokenId);

    let ownerId = near.predecessorAccountId();

    assert(ownerId == sale.owner_id, "only the owner of the sale can remove it");
}

export function internalUpdatePrice({
    contract,
    nftContractId,
    tokenId,
    price
}: {
    contract: Contract,
    nftContractId: string,
    tokenId: string,
    price: string
}) {
    assertOneYocto();

    let contractAndTokenId = `${nftContractId}${DELIMETER}${tokenId}`;

    let sale = contract.sales.get(contractAndTokenId) as Sale;
    if (sale == null) {
        near.panic("no sale");
    }

    assert(near.predecessorAccountId() == sale.owner_id, "only the owner of the sale can update it");
    sale.sale_conditions = price;
    contract.sales.set(contractAndTokenId, sale);
}

export function internalOffer({
    contract,
    nftContractId,
    tokenId
}: {
    contract: Contract,
    nftContractId: string,
    tokenId: string
}) {
    let deposit = near.attachedDeposit().valueOf();
    assert(deposit > 0, "deposit must be greater than 0");

    let contractAndTokenId = `${nftContractId}${DELIMETER}${tokenId}`;
    let sale = contract.sales.get(contractAndTokenId) as Sale;
    if (sale == null) {
        near.panic("no sale");
    }

    let buyerId = near.predecessorAccountId();
    assert(buyerId != sale.owner_id, "you can't offer on your own sale");

    let price = BigInt(sale.sale_conditions);
    assert(deposit >= price, "deposit must be greater than or equal to price");

    processPurchase({ contract, nftContractId, tokenId, price: deposit.toString(), buyerId });
}

export function processPurchase({
    contract,
    nftContractId,
    tokenId,
    price,
    buyerId
}: {
    contract: Contract,
    nftContractId: string,
    tokenId: string,
    price: string,
    buyerId: string
}) {
    let sale = internallyRemoveSale(contract, nftContractId, tokenId);

    const promise = near.promiseBatchCreate(nftContractId);
    near.promiseBatchActionFunctionCall(
        promise,
        "nft_transfer_payout",
        bytes(JSON.stringify({
            receiver_id: buyerId,
            token_id: tokenId,
            approval_id: sale.approval_id,
            memo: "payout from market",
            balance: price,
            max_len_payout: 10
        })),
        1,
        GAS_FOR_NFT_TRANSFER
    );

    near.promiseThen(
        promise,
        near.currentAccountId(),
        "resolve_purchase",
        bytes(JSON.stringify({
            buyer_id: buyerId,
            price: price
        })),
        0,
        0
    );
    return near.promiseReturn(promise);
}

export function internalResolvePurchase({
    buyerId,
    price
}: {
    buyerId: string,
    price: string
}) {
    assert(near.currentAccountId() === near.predecessorAccountId(), "Only the contract itself can call this method");

    let result = near.promiseResult(0);
    let payout = null;
    if (typeof result === 'string') {

        try {
            let payoutOption = JSON.parse(result);
            if (Object.keys(payoutOption.payout).length > 10 || Object.keys(payoutOption.payout).length < 1) {
                throw "Cannot have more than 10 royalties";
            } else {
                let remainder = BigInt(price);
                Object.entries(payoutOption.payout).forEach(([key, value], index) => {
                    remainder = remainder - BigInt(value as string);
                });

                if (remainder == BigInt(0) || remainder == BigInt(1)) {
                    payout = payoutOption.payout;
                } else {
                    throw "Payout is not correct";
                }
            }
        } catch (e) {
            near.log(`error parsing payout object ${result}`);
            payout = null;
        }
    }

    if (payout == null) {
        const promise = near.promiseBatchCreate(buyerId);
        near.promiseBatchActionTransfer(promise, BigInt(price))
        return price;
    }
    for (let [key, value] of Object.entries(payout)) {
        const promise = near.promiseBatchCreate(key);
        near.promiseBatchActionTransfer(promise, BigInt(value as string))
    }

    return price;
}
