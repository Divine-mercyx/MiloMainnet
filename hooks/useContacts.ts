import { useState, useEffect } from "react";

export type Contact = {
    id: string;
    name: string;
    address: string;
};

const STORAGE_KEY = "mylo_beneficiaries";

export function useContacts() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        console.log("Loading contacts from localStorage:", saved);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                console.log("Parsed contacts:", parsed);
                const formatted = parsed.map((item: any) => ({
                    id: item.id || Date.now().toString() + Math.random().toString().substr(2, 8),
                    name: item.name,
                    address: item.address
                }));
                console.log("Formatted contacts:", formatted);
                setContacts(formatted);
            } catch (e) {
                console.error("Failed to parse contacts", e);
            }
        }
        setIsLoaded(true); // Mark as loaded after attempting to load
    }, []);

    useEffect(() => {
        // Only save after initial load is complete
        if (isLoaded) {
            console.log("Saving contacts to localStorage:", contacts);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
        }
    }, [contacts, isLoaded]);

    const addContact = (newContact: Omit<Contact, 'id'>) => {
        const contactWithId: Contact = {
            id: Date.now().toString() + Math.random().toString().substr(2, 8),
            name: newContact.name,
            address: newContact.address
        };
        setContacts((prev) => [...prev, contactWithId]);
    };

    const deleteContact = (id: string) => {
        setContacts((prev) => prev.filter(contact => contact.id !== id));
    };

    const listContacts = () => contacts;

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
        // Your AI should catch this first, but this is a good safety net.
        throw new Error(`"${nameOrAddress}" is not a saved contact and does not appear to be a valid Sui address.`);
    };

    return { contacts, addContact, deleteContact, listContacts, resolveContact };
}