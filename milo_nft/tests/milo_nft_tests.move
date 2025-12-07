#[test_only]
module milo_nft::milo_nft_tests {

    use std::string;
    use milo_nft::nft_module;
    use sui::test_scenario as ts;


    #[test]
    fun test_mint_and_check_fields() {
        let user = @0x1;
        let mut scenario = ts::begin(user);

        let name = string::utf8(b"Test NFT");
        let description = string::utf8(b"Test Description");
        let blob_id = string::utf8(b"blob123");
        nft_module::mint(name, description, blob_id, scenario.ctx());

        scenario.next_tx(user);

        let nft: nft_module::MiloNFT = scenario.take_from_sender();

        let got_name = nft_module::get_name(&nft);
        let got_description = nft_module::get_description(&nft);
        let got_blob_id = nft_module::get_blob_id(&nft);
        let got_creator = nft_module::get_creator(&nft);

        assert!(got_name == string::utf8(b"Test NFT"), 0);
        assert!(got_description == string::utf8(b"Test Description"), 1);
        assert!(got_blob_id == string::utf8(b"blob123"), 2);
        assert!(got_creator == user, 3);

        scenario.return_to_sender(nft);
        scenario.end();
    }
}
