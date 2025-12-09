import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useCallback, useEffect, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";

// Package ID for the contacts module
const CONTACTS_PACKAGE_ID = "0x29d07d06afb4c8e90f89231e4bf4fdac27b4ca504a9b0e697ca00cbe01a0e46c";

export type Contact = {
    id: string;
    name: string;
    address: string;
};

export function useContacts() {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch contacts from the blockchain
    const fetchContacts = useCallback(async () => {
        if (!currentAccount?.address) {
            setContacts([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // Fetch owned objects that are contacts
            const response = await suiClient.getOwnedObjects({
                owner: currentAccount.address,
                filter: {
                    StructType: `${CONTACTS_PACKAGE_ID}::contacts::Contacts`
                },
                options: {
                    showContent: true,
                    showDisplay: true
                }
            });

            const contactList: Contact[] = [];
            
            for (const obj of response.data) {
                if (obj.data?.content?.dataType === "moveObject") {
                    const fields = obj.data.content.fields as any;
                    contactList.push({
                        id: obj.data.objectId,
                        name: fields.name,
                        address: fields.wallet
                    });
                }
            }
            
            setContacts(contactList);
        } catch (err: any) {
            setError(err.message || "Failed to fetch contacts");
            console.error("Error fetching contacts:", err);
        } finally {
            setLoading(false);
        }
    }, [suiClient, currentAccount?.address]);

    // Add a new contact to the blockchain
    const addContact = async (newContact: Omit<Contact, 'id'>) => {
        if (!currentAccount) {
            throw new Error("Wallet not connected");
        }

        try {
            const tx = new Transaction();
            
            // Call the create_contact function in the contacts module
            tx.moveCall({
                target: `${CONTACTS_PACKAGE_ID}::contacts::create_contact`,
                arguments: [
                    tx.pure.string(newContact.name),
                    tx.pure.address(newContact.address)
                ]
            });

            // Return the transaction for the caller to execute
            return tx;
        } catch (err: any) {
            setError(err.message || "Failed to create contact");
            throw err;
        }
    };

    // Delete a contact from the blockchain
    const deleteContact = async (id: string) => {
        if (!currentAccount) {
            throw new Error("Wallet not connected");
        }

        try {
            // First, we need to get the contact object
            const contactObj = await suiClient.getObject({
                id: id,
                options: {
                    showContent: true
                }
            });

            if (!contactObj.data) {
                throw new Error("Contact not found");
            }

            const tx = new Transaction();
            
            // Call the delete_profile function in the contacts module
            tx.moveCall({
                target: `${CONTACTS_PACKAGE_ID}::contacts::delete_profile`,
                arguments: [
                    tx.object(id)
                ]
            });

            // Return the transaction for the caller to execute
            return tx;
        } catch (err: any) {
            setError(err.message || "Failed to delete contact");
            throw err;
        }
    };

    // Resolve a contact by name or return the address if it's already an address
    const resolveContact = (nameOrAddress: string): string => {
        const found = contacts.find(
            (c) => c.name.toLowerCase() === nameOrAddress.toLowerCase()
        );
        if (found) {
            return found.address;
        }
        // Basic check if it looks like a Sui address (starts with 0x and is long enough)
        if (nameOrAddress.startsWith('0x') && nameOrAddress.length > 10) {
            return nameOrAddress;
        }
        // If it's not a saved contact and doesn't look like an address, throw an error.
        throw new Error(`"${nameOrAddress}" is not a saved contact and does not appear to be a valid Sui address.`);
    };

    // Refresh contacts when the account changes
    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    return { 
        contacts, 
        loading, 
        error,
        addContact, 
        deleteContact, 
        resolveContact,
        refetch: fetchContacts
    };
}