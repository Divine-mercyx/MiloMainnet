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
    if (!currentAccount?.address) {
      setNfts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
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

      const nftList: MiloNFT[] = [];
      
      for (const obj of response.data) {
        if (obj.data?.content?.dataType === "moveObject") {
          const fields = obj.data.content.fields as any;
          // Extract metadata correctly from the nested structure
          const metadata = fields.metadata || {};
          console.log(obj)
          nftList.push({
            id: obj.data.objectId,
            name: metadata.fields.name || "Unnamed NFT",
            description: metadata.fields.description || "No description",
            creator: fields.creator,
            blob_id: fields.blob_id
          });
        }
      }

      setNfts(nftList);
    } catch (err: any) {
      setError(err.message || "Failed to fetch NFTs");
    } finally {
      setLoading(false);
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