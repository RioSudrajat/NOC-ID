export const IDRX_MINT = "idrxZcP8xiKkYk6XGD4uz1dxEYCWSgKDHqgjsBbwDur";
export const DEPRECATED_IDRX_MINT_PREFIX = "idrxTdN";
export const USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export const paymentCurrencyConfig = {
  IDRX: {
    mint: IDRX_MINT,
    decimals: 2,
    label: "IDRX",
    settlement: "SPL_TOKEN"
  },
  USDC: {
    mint: USDC_DEVNET_MINT,
    decimals: 6,
    label: "USDC",
    settlement: "SPL_TOKEN"
  },
  IDR: {
    mint: null,
    decimals: 0,
    label: "IDR",
    settlement: "OFFCHAIN_PLACEHOLDER"
  },
  NOC: {
    mint: null,
    decimals: 9,
    label: "NOC",
    settlement: "FUTURE_TOKEN"
  }
} as const;
