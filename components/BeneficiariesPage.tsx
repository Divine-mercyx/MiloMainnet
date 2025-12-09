import React, { useState } from 'react';
import { Button } from './Button';
import { Plus, Trash2, Copy, User, Search, AlertCircle, Check, Send } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import toast from 'react-hot-toast';
import { buildTransaction } from './lib/suiTxBuilder';

interface Contact {
  id: string;
  name: string;
  address: string;
}

interface BeneficiariesPageProps {
  contacts: Contact[];
  addContact: (newContact: Omit<Contact, 'id'>) => Promise<any>;
  deleteContact: (id: string) => Promise<any>;
  loading?: boolean;
  error?: string | null;
  refetch: () => void;
}

export const BeneficiariesPage: React.FC<BeneficiariesPageProps> = ({ 
  contacts: beneficiaries, 
  addContact, 
  deleteContact,
  loading,
  error: hookError,
  refetch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Send modal states
  const [isSending, setIsSending] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendContact, setSendContact] = useState<Contact | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const handleAdd = async () => {
    setFormError(null);
    if (!newName.trim() || !newAddress.trim()) {
      setFormError("Name and address are required.");
      return;
    }

    // Check for duplicates
    const duplicateName = beneficiaries.find(b => b.name.toLowerCase() === newName.trim().toLowerCase());
    if (duplicateName) {
      setFormError("A beneficiary with this name already exists.");
      return;
    }

    const duplicateAddress = beneficiaries.find(b => b.address === newAddress.trim());
    if (duplicateAddress) {
      setFormError("This wallet address is already saved.");
      return;
    }

    try {
      // Create the transaction
      const tx = await addContact({
        name: newName.trim(),
        address: newAddress.trim()
      });
      
      // Sign and execute the transaction
      const result = await signAndExecute({ transaction: tx });
      
      // Check if transaction was successful
      if (result.digest) {
        toast.success("Contact added successfully!");
        // Reset form
        setNewName('');
        setNewAddress('');
        setIsAdding(false);
        // Refresh contacts
        refetch();
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err: any) {
      console.error("Error adding contact:", err);
      setFormError(err.message || "Failed to add contact. Please try again.");
      toast.error("Failed to add contact");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Create the transaction
      const tx = await deleteContact(id);
      
      // Sign and execute the transaction
      const result = await signAndExecute({ transaction: tx });
      
      // Check if transaction was successful
      if (result.digest) {
        toast.success("Contact deleted successfully!");
        // Refresh contacts
        refetch();
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err: any) {
      console.error("Error deleting contact:", err);
      toast.error("Failed to delete contact");
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle send button click
  const handleSendClick = (contact: Contact) => {
    setSendContact(contact);
    setIsSending(true);
    setSendAmount('');
    setSendError(null);
  };

  // Handle send transaction
  const handleSendTransaction = async () => {
    if (!sendContact || !sendAmount) {
      setSendError("Please enter an amount");
      return;
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      setSendError("Please enter a valid amount");
      return;
    }

    try {
      // Create the transfer transaction
      const tx = await buildTransaction({
        action: "transfer",
        amount: amount,
        recipient: sendContact.address
      });

      // Sign and execute the transaction
      const result = await signAndExecute({ transaction: tx });

      if (result.digest) {
        toast.success(`Successfully sent ${amount} SUI to ${sendContact.name}!`);
        setIsSending(false);
        setSendContact(null);
        setSendAmount('');
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err: any) {
      console.error("Error sending SUI:", err);
      setSendError(err.message || "Failed to send SUI. Please try again.");
      toast.error("Failed to send SUI");
    }
  };

  const filtered = beneficiaries.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Beneficiaries</h1>
                <p className="text-slate-500">Manage your saved contacts for quick transactions.</p>
            </div>
            <Tooltip content="Add a new contact">
                <Button onClick={() => setIsAdding(!isAdding)} className="shadow-lg shadow-teal-500/20">
                    <Plus size={18} className="mr-2" />
                    Add Contact
                </Button>
            </Tooltip>
        </div>

        {/* Add Form */}
        {isAdding && (
            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 animate-fade-in-down">
                <h3 className="text-lg font-bold text-slate-800 mb-4">New Beneficiary</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
                        <input 
                            type="text" 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#3B8D85] focus:ring-2 focus:ring-teal-50 outline-none transition-all"
                            placeholder="e.g. Alice"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Wallet Address</label>
                        <input 
                            type="text" 
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#3B8D85] focus:ring-2 focus:ring-teal-50 outline-none transition-all font-mono text-sm"
                            placeholder="0x..."
                        />
                    </div>
                </div>
                {(formError || hookError) && (
                    <div className="flex items-center gap-2 text-red-500 text-sm mb-4 bg-red-50 p-2 rounded-lg">
                        <AlertCircle size={16} />
                        {formError || hookError}
                    </div>
                )}
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button onClick={handleAdd}>Save Contact</Button>
                </div>
            </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or address..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-white shadow-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-100 outline-none"
            />
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-4">
            <p>Loading contacts...</p>
          </div>
        )}

        {/* List */}
        <div className="grid gap-4">
            {filtered.length === 0 && !loading ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <User size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-600">No beneficiaries found</h3>
                    <p className="text-slate-400">Add people to your list to easily send assets.</p>
                </div>
            ) : (
                filtered.map(b => (
                    <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-indigo-100 flex items-center justify-center text-[#3B8D85] font-bold text-lg">
                                {b.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{b.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 truncate max-w-[200px] md:max-w-xs block">
                                        {b.address}
                                    </span>
                                    <Tooltip content="Copy Address">
                                        <button 
                                            onClick={() => handleCopy(b.id, b.address)}
                                            className="text-slate-300 hover:text-[#3B8D85] transition-colors"
                                        >
                                            {copiedId === b.id ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="text-slate-500 hover:text-slate-700"
                              onClick={() => handleSendClick(b)}
                            >
                                <Send size={14} className="mr-1" />
                                Send
                            </Button>
                            <Tooltip content="Delete Contact">
                                <button 
                                    onClick={() => handleDelete(b.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Send Modal */}
      {isSending && sendContact && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Send SUI</h3>
              <button 
                onClick={() => setIsSending(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-indigo-100 flex items-center justify-center text-[#3B8D85] font-bold">
                  {sendContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{sendContact.name}</p>
                  <p className="text-xs text-slate-500 font-mono truncate">{sendContact.address}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount (SUI)</label>
                <input 
                  type="number" 
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#3B8D85] focus:ring-2 focus:ring-teal-50 outline-none transition-all text-lg"
                  placeholder="0.00"
                  step="0.000000001"
                />
                <p className="text-xs text-slate-500 mt-1">Enter amount in SUI</p>
              </div>
              
              {sendError && (
                <div className="flex items-center gap-2 text-red-500 text-sm mb-4 bg-red-50 p-2 rounded-lg">
                  <AlertCircle size={16} />
                  {sendError}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setIsSending(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendTransaction}
                className="flex-1"
              >
                Send SUI
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};