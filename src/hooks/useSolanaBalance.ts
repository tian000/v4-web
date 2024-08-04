import { Connection } from "@/lib/connection";
import { PublicKey } from "@solana/web3.js";
import { QueryFunction, useQuery, UseQueryOptions } from "@tanstack/react-query";

type SolanaBalanceResult = {
  formatted: number,
  amount: number,
  decimals: number
};

// TODO: Consolidate into one hook, if no token mint provided perhaps assume native balance.

export const useSolanaNativeBalance = (address: string | undefined): SolanaBalanceResult | undefined => {

  const queryFn: QueryFunction<SolanaBalanceResult> = async () => {
    try {
      if (!address) {
        throw new Error('Account public key is undefined');
      }
      const publicKey = new PublicKey(address);
      const lamports = await Connection.getBalance(publicKey);

      // Convert lamports to SOL
      return {
        formatted: lamports / 1e9,
        amount: lamports,
        decimals: 9
      };

    } catch (error) {
      throw new Error('Failed to fetch Solana balance: ' + error.message);
    }
  };

  const { data } = useQuery<SolanaBalanceResult, Error>({
    queryKey: ['solanaNativeBalance', address],
    queryFn,
    enabled: !!address,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return data
};

type BalanceProps = {
  address: string | undefined;
  token: string | undefined;
  query?: Pick<UseQueryOptions, 'enabled'>;
};

export const useSolanaTokenBalance = ({ address, token, query }: BalanceProps) => {
  const queryFn = async () => {
    try {
      if (!address || !token) {
        throw new Error('Account or token address is not present');
      }
      const accountOwner = new PublicKey("ob2htHLoCu2P6tX7RrNVtiG1mYTas8NGJEVLaFEUngk");
      const tokenMint = new PublicKey(token)
      const tokenAccounts = await Connection.getParsedTokenAccountsByOwner(accountOwner, { mint: tokenMint })
      return {
        data: {
          formatted: tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount,
          amount: tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount,
          decimals: tokenAccounts.value[0].account.data.parsed.info.tokenAmount.decimals,
        }
      }
    } catch (error) {
      throw new Error('Failed to fetch Solana balance: ' + error.message);
    }
  };

  const { data } = useQuery({
    queryKey: ['solanaTokenBalance'],
    queryFn,
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return data;
};