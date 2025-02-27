// @flow
import { setSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { setPlatformVersion } from "@ledgerhq/live-common/platform/version";
import { PLATFORM_VERSION } from "@ledgerhq/live-common/platform/constants";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";

setPlatformVersion(PLATFORM_VERSION);
setWalletAPIVersion(WALLET_API_VERSION);

setSupportedCurrencies([
  "bitcoin",
  "ethereum",
  "bsc",
  "polkadot",
  "solana",
  "ripple",
  "litecoin",
  "polygon",
  "bitcoin_cash",
  "stellar",
  "dogecoin",
  "cosmos",
  "crypto_org",
  "celo",
  "dash",
  "tron",
  "tezos",
  "elrond",
  "ethereum_classic",
  "zcash",
  "decred",
  "digibyte",
  "algorand",
  "qtum",
  "bitcoin_gold",
  "komodo",
  "pivx",
  "zencash",
  "vertcoin",
  "peercoin",
  "viacoin",
  "stakenet",
  "bitcoin_testnet",
  "ethereum_ropsten",
  "ethereum_goerli",
  "cosmos_testnet",
  "hedera",
  "cardano",
  "filecoin",
  "osmosis",
  "fantom",
  "cronos",
  "moonbeam",
  "songbird",
  "flare",
  "near",
]);
