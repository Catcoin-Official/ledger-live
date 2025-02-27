import { BigNumber } from "bignumber.js";
import { utils } from "near-api-js";
import { formatCurrencyUnit } from "../../currencies";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import {
  NearMappedStakingPosition,
  Transaction,
  NearStakingPosition,
  NearValidatorItem,
  NearAccount,
} from "./types";
import { createTransaction, updateTransaction } from "./js-transaction";
import { getCurrentNearPreloadData } from "./preload";

export const FALLBACK_STORAGE_AMOUNT_PER_BYTE = "10000000000000000000";
export const NEW_ACCOUNT_SIZE = 182;
export const MIN_ACCOUNT_BALANCE_BUFFER = "50000000000000000000000";
export const STAKING_GAS_BASE = "25000000000000";
export const FIGMENT_NEAR_VALIDATOR_ADDRESS = "ledgerbyfigment.poolv1.near";
export const FRACTIONAL_DIGITS = 5;

export const isValidAddress = (address: string): boolean => {
  const readableAddressRegex =
    /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
  const hexAddressRegex = /^[a-f0-9]{64}$/;

  if (isImplicitAccount(address)) {
    return hexAddressRegex.test(address);
  }

  return readableAddressRegex.test(address);
};

export const isImplicitAccount = (address: string): boolean => {
  return !address.includes(".");
};

export const getStakingGas = (t?: Transaction, multiplier = 5): BigNumber => {
  const stakingGasBase = new BigNumber(STAKING_GAS_BASE);

  if (t?.mode === "withdraw" && t?.useAllAmount) {
    multiplier = 7;
  }

  return stakingGasBase.multipliedBy(multiplier);
};

/*
 * Get the max amount that can be spent, taking into account tx type and pending operations.
 */
export const getMaxAmount = (
  a: NearAccount,
  t: Transaction,
  fees?: BigNumber
): BigNumber => {
  let maxAmount;
  const selectedValidator = a.nearResources?.stakingPositions.find(
    ({ validatorId }) => validatorId === t.recipient
  );

  let pendingUnstakingAmount = new BigNumber(0);
  let pendingWithdrawingAmount = new BigNumber(0);
  let pendingDefaultAmount = new BigNumber(0);

  a.pendingOperations.forEach(({ type, value, recipients }) => {
    const recipient = recipients[0];

    if (type === "UNSTAKE" && recipient === selectedValidator?.validatorId) {
      pendingUnstakingAmount = pendingUnstakingAmount.plus(value);
    } else if (
      type === "WITHDRAW_UNSTAKED" &&
      recipient === selectedValidator?.validatorId
    ) {
      pendingWithdrawingAmount = pendingWithdrawingAmount.plus(value);
    } else {
      pendingDefaultAmount = pendingDefaultAmount.plus(value);
    }
  });

  switch (t.mode) {
    case "unstake":
      maxAmount = selectedValidator?.staked.minus(pendingUnstakingAmount);
      break;
    case "withdraw":
      maxAmount = selectedValidator?.available.minus(pendingWithdrawingAmount);
      break;
    default:
      maxAmount = a.spendableBalance.minus(pendingDefaultAmount);

      if (fees) {
        maxAmount = maxAmount.minus(fees);
      }
  }

  if (maxAmount.lt(0)) {
    return new BigNumber(0);
  }

  return maxAmount;
};

export const getTotalSpent = (
  a: NearAccount,
  t: Transaction,
  fees: BigNumber
): BigNumber => {
  if (["unstake", "withdraw"].includes(t.mode)) {
    return fees;
  }

  if (t.useAllAmount) {
    return a.spendableBalance;
  }

  return new BigNumber(t.amount).plus(fees);
};

export const mapStakingPositions = (
  stakingPositions: NearStakingPosition[],
  validators: NearValidatorItem[],
  unit: Unit
): NearMappedStakingPosition[] => {
  return stakingPositions.map((sp) => {
    const rank = validators.findIndex(
      (v) => v.validatorAddress === sp.validatorId
    );
    const validator = validators[rank] ?? sp;
    const formatConfig = {
      disableRounding: false,
      alwaysShowSign: false,
      showCode: true,
    };

    return {
      ...sp,
      formattedAmount: formatCurrencyUnit(unit, sp.staked, formatConfig),
      formattedRewards: formatCurrencyUnit(unit, sp.rewards, formatConfig),
      formattedPending: formatCurrencyUnit(unit, sp.pending, formatConfig),
      formattedAvailable: formatCurrencyUnit(unit, sp.available, formatConfig),
      rank,
      validator,
    };
  });
};

/*
 * Make sure that an account has enough funds to stake, unstake, AND withdraw before staking.
 */
export const canStake = (a: NearAccount): boolean => {
  let transaction = createTransaction();
  transaction = updateTransaction(transaction, {
    mode: "stake",
  });

  const { gasPrice } = getCurrentNearPreloadData();

  const fees = getStakingFees(transaction, gasPrice).multipliedBy(3);

  return getMaxAmount(a, transaction, fees).gt(0);
};

export const canUnstake = (
  stakingPosition: NearMappedStakingPosition | NearStakingPosition
): boolean => {
  return stakingPosition.staked.gte(getYoctoThreshold());
};

export const canWithdraw = (
  stakingPosition: NearMappedStakingPosition | NearStakingPosition
): boolean => {
  return stakingPosition.available.gte(getYoctoThreshold());
};

/*
 * The threshold that the NEAR wallet uses for staking, unstaking, and withdrawing.
 * A "1" is subtracted due to the value from the node being 1 yoctoNEAR less than what was staked.
 */
export const getYoctoThreshold = (): BigNumber => {
  return new BigNumber(10)
    .pow(new BigNumber(utils.format.NEAR_NOMINATION_EXP - FRACTIONAL_DIGITS))
    .minus("1");
};

/*
 * An estimation for the fee by using the staking gas and scaling accordingly.
 * Buffer added so that the transaction never fails - we'll always overestimate.
 */
export const getStakingFees = (
  t: Transaction,
  gasPrice: BigNumber
): BigNumber => {
  const stakingGas = getStakingGas(t);

  return stakingGas
    .plus(STAKING_GAS_BASE) // Buffer
    .multipliedBy(gasPrice)
    .dividedBy(10);
};
