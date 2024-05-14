import { createSelector } from 'reselect';

import { OnboardingState, OnboardingSteps } from '@/constants/account';
import { ENVIRONMENT_CONFIG_MAP, type DydxNetwork } from '@/constants/networks';

import {
  getOnboardingGuards,
  getOnboardingState,
  getSubaccountId,
  getUncommittedOrderClientIds,
} from '@/state/accountSelectors';
import { getSelectedNetwork } from '@/state/appSelectors';

import { testFlags } from '@/lib/testFlags';

export const calculateOnboardingStep = createSelector(
  [getOnboardingState, getOnboardingGuards],
  (onboardingState: OnboardingState, onboardingGuards: ReturnType<typeof getOnboardingGuards>) => {
    const { hasAcknowledgedTerms, hasPreviousTransactions } = onboardingGuards;

    return {
      [OnboardingState.Disconnected]: OnboardingSteps.ChooseWallet,
      [OnboardingState.WalletConnected]: OnboardingSteps.KeyDerivation,
      [OnboardingState.AccountConnected]: !hasAcknowledgedTerms
        ? OnboardingSteps.AcknowledgeTerms
        : !hasPreviousTransactions
        ? OnboardingSteps.DepositFunds
        : undefined,
    }[onboardingState];
  }
);

/**
 * @description calculate whether an account is in a state where they can trade
 */
export const calculateCanAccountTrade = createSelector(
  [getOnboardingState],
  (onboardingState: OnboardingState) => {
    return onboardingState === OnboardingState.AccountConnected;
  }
);

/**
 * @description calculate whether the client has enough information to display account info.
 * User does not have to have AccountConnected. The dYdX account can be viewed if the client knows the dYdX address.
 */
export const calculateCanViewAccount = createSelector(
  [getOnboardingState, getSubaccountId],
  (onboardingState: OnboardingState, subaccountId?: number) =>
    onboardingState === OnboardingState.AccountConnected ||
    (onboardingState === OnboardingState.WalletConnected && subaccountId !== undefined)
);

/**
 * @description calculate whether the client is in view only mode
 * (Onboarding State is WalletConnected and Abacus has a connected subaccount)
 */
export const calculateIsAccountViewOnly = createSelector(
  [getOnboardingState, calculateCanViewAccount],
  (onboardingState: OnboardingState, canViewAccountInfo: boolean) =>
    onboardingState !== OnboardingState.AccountConnected && canViewAccountInfo
);

/**
 * @description calculate whether the subaccount has uncommitted positions
 */
export const calculateHasUncommittedOrders = createSelector(
  [getUncommittedOrderClientIds],
  (uncommittedOrderClientIds: number[]) => uncommittedOrderClientIds.length > 0
);

/**
 * @description calculate whether the client is loading info.
 * (account is connected but subaccountId is till missing)
 */
export const calculateIsAccountLoading = createSelector(
  [getOnboardingState, getOnboardingGuards, getSubaccountId],
  (
    onboardingState: ReturnType<typeof getOnboardingState>,
    onboardingGuards: ReturnType<typeof getOnboardingGuards>,
    subaccountId?: number
  ) => {
    const { hasPreviousTransactions } = onboardingGuards;
    return (
      onboardingState === OnboardingState.AccountConnected &&
      subaccountId === undefined &&
      hasPreviousTransactions
    );
  }
);

/**
 * @description calculate whether positions table should render triggers column
 */
export const calculateShouldRenderTriggersInPositionsTable = createSelector(
  [calculateIsAccountViewOnly, getSelectedNetwork],
  (isAccountViewOnly: boolean, selectedNetwork: DydxNetwork) =>
    !isAccountViewOnly && ENVIRONMENT_CONFIG_MAP[selectedNetwork].featureFlags.isSlTpEnabled
);

/**
 * @description calculate whether positions table should render actions column
 */
export const calculateShouldRenderActionsInPositionsTable = (isCloseActionShown: boolean) =>
  createSelector(
    [calculateIsAccountViewOnly, calculateShouldRenderTriggersInPositionsTable],
    (isAccountViewOnly: boolean, areTriggersRendered: boolean) => {
      const hasActionsInColumn = testFlags.isolatedMargin
        ? isCloseActionShown
        : areTriggersRendered || isCloseActionShown;
      return !isAccountViewOnly && hasActionsInColumn;
    }
  );
