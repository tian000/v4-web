import { useCallback } from 'react';

import stableStringify from 'fast-json-stable-stringify';
import { useSignTypedData } from 'wagmi';

import { getSignTypedData, WalletType } from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { useEnvConfig } from './useEnvConfig';

export default function useSignForWalletDerivation(walletType: WalletType | undefined) {
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const ethereumChainId = useEnvConfig('ethereumChainId');
  const chainId = Number(ethereumChainId);

  const signTypedData = getSignTypedData(selectedDydxChainId);
  const { signTypedDataAsync: signEvmMessage } = useSignTypedData({
    ...signTypedData,
    domain: {
      ...signTypedData.domain,
      chainId,
    },
  });

  const signSolanaMessage = useCallback(async (): Promise<string> => {
    const resp: { signature: Uint8Array } = await (window as any).phantom.solana.signMessage(
      new TextEncoder().encode(stableStringify(signTypedData))
    );
    // Left pad the signature with a 0 byte so that the signature is 65 bytes long, a solana signature is 64 bytes by default.
    return Buffer.from([0, ...resp.signature]).toString('hex');
  }, [signTypedData]);

  const signMessage = useCallback(async (): Promise<string> => {
    if (walletType === 'PHANTOM') {
      return signSolanaMessage();
    }
    return signEvmMessage();
  }, [signEvmMessage, signSolanaMessage, walletType]);

  return signMessage;
}
