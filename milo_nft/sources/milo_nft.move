/*
/// Module: milo_nft
module milo_nft::milo_nft;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions


module milo_nft::nft_module {
    use std::string::String;
    use sui::object::{UID, new};
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;


    public struct Metadata has store, copy, drop {
        name: String,
        description: String,
    }
    public struct MiloNFT has key, store {
        id: UID,
        metadata: Metadata,
        creator: address,
        blob_id: String,
    }

    public fun get_name(nft: &MiloNFT): String {
        nft.metadata.name
    }

    public fun get_description(nft: &MiloNFT): String {
        nft.metadata.description
    }

    public fun get_blob_id(nft: &MiloNFT): String {
        nft.blob_id
    }

    public fun get_creator(nft: &MiloNFT): address {
        nft.creator
    }

    public entry fun mint(
        name: String,
        description: String,
        blob_id: String,
        ctx: &mut TxContext
    ) {
        let meta = Metadata {name, description};

        let nft = MiloNFT {
            id:new(ctx),
            metadata: meta,
            creator:sender(ctx),
            blob_id,
        };
        transfer::transfer(nft, sender(ctx));
    }

    public entry fun transfer_nft(nft: MiloNFT, recipient: address) {
        transfer::transfer(nft, recipient);
    }
}
