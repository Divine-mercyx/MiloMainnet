import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useCallback, useEffect, useState } from "react";

export interface MiloNFT {
  id: string;
  name: string;
  description: string;
  creator: string;
  blob_id: string;
}

export function useNFTs() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [nfts, setNfts] = useState<MiloNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = useCallback(async () => {
    console.log('Fetching NFTs...');
    if (!currentAccount?.address) {
      console.log('No current account, setting NFTs to empty array');
      setNfts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching NFTs for address:', currentAccount.address);
      
      // Fetch owned objects
      const response = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: "0xefcbc248490404305070c7de5c7c0a7dc4e4e7bcb1fc796c64a61d7c9b80a7ee::nft_module::MiloNFT"
        },
        options: {
          showContent: true,
          showDisplay: true
        }
      });

      console.log('Received response from Sui client:', response);

      const nftList: MiloNFT[] = [];
      
      for (const obj of response.data) {
        if (obj.data?.content?.dataType === "moveObject") {
          const fields = obj.data.content.fields as any;
          // Extract metadata correctly from the nested structure
          const metadata = fields.metadata || {};
          nftList.push({
            id: obj.data.objectId,
            name: metadata.fields.name || "Unnamed NFT",
            description: metadata.fields.description || "No description",
            creator: fields.creator,
            blob_id: fields.blob_id
          });
        }
      }

      console.log('Processed NFTs:', nftList);
      setNfts(nftList);
    } catch (err: unknown) {
      console.error('Error fetching NFTs:', err);
      // Ensure error is always a string
      const errorMessage = err instanceof Error ? err.message : String(err) || "Failed to fetch NFTs";
      setError(errorMessage);
      // Also set nfts to empty array on error to prevent stale data
      setNfts([]);
    } finally {
      setLoading(false);
      console.log('Finished fetching NFTs');
    }
  }, [suiClient, currentAccount?.address]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  return {
    nfts,
    loading,
    error,
    refetch: fetchNFTs
  };
}