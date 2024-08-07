import { useMemo } from 'react';

import { StatSigFlags } from '@/types/statsig';
import { shallowEqual } from 'react-redux';
import tw from 'twin.macro';

import { TransferType } from '@/constants/abacus';
import {
  cctpTokensByChainId,
  getMapOfHighestFeeTokensByChainId,
  getMapOfLowestFeeTokensByChainId,
} from '@/constants/cctp';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';
import { WalletType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import { SearchSelectMenu } from '@/components/SearchSelectMenu';

import { useAppSelector } from '@/state/appTypes';
import { getTransferInputs } from '@/state/inputsSelectors';

import { isTruthy } from '@/lib/isTruthy';

import { HighestFeesDecoratorText } from './HighestFeesText';
import { LowestFeesDecoratorText } from './LowestFeesText';

type ElementProps = {
  label?: string;
  selectedExchange?: string;
  selectedChain?: string;
  onSelect: (name: string, type: 'chain' | 'exchange') => void;
};

export const SourceSelectMenu = ({
  label,
  selectedExchange,
  selectedChain,
  onSelect,
}: ElementProps) => {
  const { walletType } = useAccounts();
  // eslint-disable-next-line prefer-const
  let { CCTPWithdrawalOnly, CCTPDepositOnly } = useEnvFeatures();

  // Only CCTP deposits are supported for Phantom / Solana
  if (walletType === WalletType.Phantom) CCTPDepositOnly = true;
  const stringGetter = useStringGetter();
  const { type, depositOptions, withdrawalOptions } =
    useAppSelector(getTransferInputs, shallowEqual) ?? {};
  const chains =
    (type === TransferType.deposit ? depositOptions : withdrawalOptions)?.chains?.toArray() ??
    EMPTY_ARR;

  const exchanges =
    (type === TransferType.deposit ? depositOptions : withdrawalOptions)?.exchanges?.toArray() ??
    EMPTY_ARR;

  const skipEnabled = useStatsigGateValue(StatSigFlags.ffSkipMigration);

  const lowestFeeTokensByChainId = useMemo(
    () => getMapOfLowestFeeTokensByChainId(type, skipEnabled),
    [type, skipEnabled]
  );

  const highestFeeTokensByChainId = useMemo(
    () => getMapOfHighestFeeTokensByChainId(type, skipEnabled),
    [type, skipEnabled]
  );

  // withdrawals SourceSelectMenu is half width size so we must throw the decorator text
  // in the description prop (renders below the item label) instead of in the slotAfter
  const feesDecoratorProp = type === TransferType.deposit ? 'slotAfter' : 'description';

  const getFeeDecoratorComponentForChainId = (chainId: string) => {
    if (lowestFeeTokensByChainId[chainId]) return <LowestFeesDecoratorText />;
    if (highestFeeTokensByChainId[chainId]) return <HighestFeesDecoratorText />;
    return null;
  };

  const chainItems = Object.values(chains)
    .map((chain) => ({
      value: chain.type,
      label: chain.stringKey,
      onSelect: () => {
        onSelect(chain.type, 'chain');
      },
      slotBefore: <$Img src={chain.iconUrl ?? undefined} alt="" />,
      [feesDecoratorProp]: getFeeDecoratorComponentForChainId(chain.type),
    }))
    .filter((chain) => {
      // only solana chains are supported on phantom
      if (walletType === WalletType.Phantom && !chain.value.startsWith('solana')) return false;
      return true;
    })
    .filter((chain) => {
      // if deposit and CCTPDepositOnly enabled, only return cctp tokens
      if (type === TransferType.deposit && CCTPDepositOnly) {
        return !!cctpTokensByChainId[chain.value];
      }
      // if withdrawal and CCTPWithdrawalOnly enabled, only return cctp tokens
      if (type === TransferType.withdrawal && CCTPWithdrawalOnly) {
        return !!cctpTokensByChainId[chain.value];
      }

      return true;
    })
    // we want lowest fee tokens first followed by non-lowest fee cctp tokens
    .sort((chain) => (cctpTokensByChainId[chain.value] ? -1 : 1))
    .sort((chain) => (lowestFeeTokensByChainId[chain.value] ? -1 : 1));

  const exchangeItems = Object.values(exchanges).map((exchange) => ({
    value: exchange.type,
    label: exchange.string,
    onSelect: () => {
      onSelect(exchange.type, 'exchange');
    },
    slotBefore: <$Img src={exchange.iconUrl ?? undefined} alt="" />,
    [feesDecoratorProp]: <LowestFeesDecoratorText />,
  }));

  const selectedChainOption = chains.find((item) => item.type === selectedChain);
  const selectedExchangeOption = exchanges.find((item) => item.type === selectedExchange);
  const isNotPrivyDeposit = type === TransferType.withdrawal || walletType !== WalletType.Privy;
  return (
    <SearchSelectMenu
      items={[
        exchangeItems.length > 0 && {
          group: 'exchanges',
          groupLabel: stringGetter({ key: STRING_KEYS.EXCHANGES }),
          items: exchangeItems,
        },
        // only block privy wallets for deposits
        isNotPrivyDeposit &&
          chainItems.length > 0 && {
            group: 'chains',
            groupLabel: stringGetter({ key: STRING_KEYS.CHAINS }),
            items: chainItems,
          },
      ].filter(isTruthy)}
      label={label ?? (type === TransferType.deposit ? 'Source' : 'Destination')}
    >
      <div tw="row gap-0.5 text-color-text-2 font-base-book">
        {selectedChainOption ? (
          <>
            <$Img src={selectedChainOption.iconUrl ?? undefined} alt="" />{' '}
            {selectedChainOption.stringKey}
          </>
        ) : selectedExchangeOption ? (
          <>
            <$Img src={selectedExchangeOption.iconUrl ?? undefined} alt="" />{' '}
            {selectedExchangeOption.string}
          </>
        ) : (
          stringGetter({ key: STRING_KEYS.SELECT_CHAIN })
        )}
      </div>
    </SearchSelectMenu>
  );
};

const $Img = tw.img`h-1.25 w-1.25 rounded-[50%]`;
