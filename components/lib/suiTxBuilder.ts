import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

export const SUPPORTED_ASSETS = ["SUI", "CETUS", "USDC", "BTC", "ETH", "USDT"] as const;
export type Asset = typeof SUPPORTED_ASSETS[number];

export interface Intent {
  action: "transfer" | "mint" | "stake" | "swap" | "query-balance";
  asset?: Asset;
  amount?: number;
  recipient?: string;
  gasBudget?: number,
  name?: string;
  description?: string;
  target?: string;
  blobId?: string;
}

export async function buildTransaction(intent: Intent): Promise<Transaction> {
  const tx = new Transaction();

  if (intent.gasBudget) {
    tx.setGasBudget(intent.gasBudget);
  }

  switch (intent.action) {
    case "transfer":
      buildTransferTx(tx, intent);
      break;
    case "mint":
      buildMintTx(tx, intent);
      break;
    case "stake":
      buildStakeTx(tx, intent);
      break;
    case "swap":
      buildSwapTx(tx, intent);
      break;
    case "query-balance":
      throw new Error("query-balance is not a transaction. Use queryBalance() instead.");
    default:
      throw new Error(`Unknown action: ${intent.action}`);
  }

  return tx;
}

/** --- ACTION HANDLERS --- **/
// 🔹 Transfer SUI

function buildTransferTx(
    tx: Transaction,
    { amount = 0, recipient }: Intent
) {
  if (!recipient) throw new Error("Recipient is required for transfer");
  if (amount <= 0) throw new Error("Transfer amount must be greater than 0");

  const mistAmount = BigInt(amount * 1e9);

  const [coin] = tx.splitCoins(tx.gas, [mistAmount]);
  tx.transferObjects([coin], recipient);
}

// 🔹 Mint NFT
function buildMintTx(
    txb: Transaction,
    { name = "My NFT", description = "Minted via Milo", blobId= "" }: Intent
) {
  if(!blobId)throw new Error("Asset id is required for minting");
  txb.moveCall({
    target: "0xefcbc248490404305070c7de5c7c0a7dc4e4e7bcb1fc796c64a61d7c9b80a7ee::nft_module::mint",
    arguments: [
      txb.pure.string(name),
      txb.pure.string(description),
      txb.pure.string(blobId),
    ],
  });
}

// 🔹 Stake SUI
function buildStakeTx(
    tx: Transaction,
    { amount = 0, recipient: validator }: Intent
) {
  if (!validator) throw new Error("Validator address required for stake");
  const mistAmount = BigInt(amount * 1e9);

  const [stakeCoin] = tx.splitCoins(tx.gas, [mistAmount]);
  tx.moveCall({
    target: "0x3::sui_system::request_add_stake",
    arguments: [
      tx.object("0x5"),
      stakeCoin,
      tx.pure.address(validator)
    ],
  });
}

// 🔹 Swap
function buildSwapTx(
    tx: Transaction,
    { amount = 0, asset, target }: Intent
) {
  if (!asset || !target) throw new Error("Swap requires asset + target");

  tx.moveCall({
    target: "0xDEX_PACKAGE::swap_module::swap_exact_input",
    arguments: [
      tx.pure.string(asset),
      tx.pure.string(target),
      tx.pure.u64(amount * 1e9),
    ],
  });
}


/** --- QUERY HANDLER --- **/
export async function queryBalance(address: string, asset: Asset = "SUI") {
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });

  let coinType = "0x2::sui::SUI";
  if (asset !== "SUI") {
    throw new Error(`Balance query for ${asset} not implemented yet`);
  }

  const res = await client.getBalance({ owner: address, coinType });
  return Number(res.totalBalance) / 1e9;
}