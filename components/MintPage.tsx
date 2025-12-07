
import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { Upload, X, Image as ImageIcon, Sparkles, CheckCircle2, Box, Info } from 'lucide-react';
import { Tooltip } from './Tooltip';
// Add the necessary imports for Sui functionality
import { 
  useCurrentAccount, 
  useSignAndExecuteTransaction,
  useSuiClient
} from '@mysten/dapp-kit';
import { buildTransaction, type Intent } from './lib/suiTxBuilder';
// Add toast import
import toast from 'react-hot-toast';

export const MintPage: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null); // Add file state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [blobId, setBlobId] = useState(""); // Add blobId state
  const [previewUrl, setPreviewUrl] = useState(""); // Add previewUrl state
  const [txDigest, setTxDigest] = useState(""); // Add transaction digest state
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add Sui hooks
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Update handleImageUpload to also set the file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file); // Set the file
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Walrus upload simulation function
  const uploadToWalrus = async (file: File) => {
    // In a real implementation, this would upload to Walrus
    // For now, we'll simulate with a timeout and generate a fake blobId
    await new Promise(resolve => setTimeout(resolve, 1000));
    const fakeBlobId = `blob_${Math.random().toString(36).substring(2, 15)}`;
    const previewUrl = URL.createObjectURL(file);
    return { blobId: fakeBlobId, previewUrl };
  };

  // Update handleMint to use Sui transaction
  const handleMint = async () => {
    if (!file) return toast.error("Please upload a file");
    if (!name) return toast.error("Please enter a title");
    if (!description) return toast.error("Please add a description");
    
    try {
      setIsMinting(true);
      toast.loading("Uploading data...");
      
      // Upload to Walrus (simulated)
      const result = await uploadToWalrus(file);
      setBlobId(result.blobId);
      setPreviewUrl(result.previewUrl);
      toast.dismiss();
      toast.success("Asset uploaded successfully!");
      
      // Mint the NFT
      toast.loading("Minting NFT...");
      const intent: Intent = {
        action: "mint",
        name,
        description,
        blobId: result.blobId,
      };

      const txb = await buildTransaction(intent);
      const resultTx = await signAndExecuteTransaction({
        transaction: txb as any,
      });

      toast.dismiss();
      toast.success(
        <div className="flex flex-col gap-2">
          <p>✅ NFT Minted!</p>
          <button
            onClick={() =>
              window.open(
                `https://suiexplorer.com/txblock/${resultTx.digest}?network=testnet`,
                "_blank"
              )
            }
            className="text-sm text-blue-500 underline"
          >
            View on Explorer
          </button>
        </div>,
        { duration: 10000 }
      );

      setTxDigest(resultTx.digest);
      setIsMinting(false);
      setIsSuccess(true);
    } catch (err: any) {
      setIsMinting(false);
      toast.error(`Mint failed: ${err.message || 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setImage(null);
    setFile(null);
    setName('');
    setDescription('');
    setIsSuccess(false);
    setBlobId("");
    setPreviewUrl("");
    setTxDigest("");
  };

  if (isSuccess) {
      return (
          <div className="flex-1 flex items-center justify-center h-full p-6 animate-fade-in">
              <div className="bg-white p-12 rounded-[2rem] shadow-2xl shadow-teal-900/10 border border-slate-100 text-center max-w-lg w-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-indigo-500"></div>
                  
                  <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                      <CheckCircle2 size={48} strokeWidth={1.5} />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Mint Successful!</h2>
                  <p className="text-slate-500 mb-10 text-lg">Your asset has been permanently recorded on the Sui Network.</p>
                  
                  <div className="bg-slate-50 p-6 rounded-2xl mb-10 border border-slate-100/50 shadow-inner">
                      <div className="flex items-center gap-4 text-left">
                          <div className="w-16 h-16 rounded-xl bg-white shadow-sm overflow-hidden flex-shrink-0">
                               {image && <img src={image} alt="Minted" className="w-full h-full object-cover" />}
                          </div>
                          <div>
                              <div className="text-sm font-bold text-slate-900">{name}</div>
                              <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{description || 'No description'}</div>
                              <div className="flex items-center gap-1.5 mt-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmed</span>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  {txDigest && (
                    <div className="mb-6">
                      <a 
                        href={`https://suiexplorer.com/txblock/${txDigest}?network=testnet`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        View transaction on Sui Explorer
                      </a>
                    </div>
                  )}

                  <div className="flex gap-4">
                      <Button variant="secondary" onClick={resetForm} className="flex-1">
                          Mint Another
                      </Button>
                      <Button onClick={() => window.location.hash = '#/gallery'} className="flex-1 shadow-lg shadow-teal-500/20">
                          View in Gallery
                      </Button>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 bg-slate-50/50">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Create NFT</h1>
                <p className="text-slate-500 text-lg">Mint unique digital assets directly to your wallet.</p>
            </div>
            <Tooltip content="Network Status: Active">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm cursor-help">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-semibold text-slate-600">Sui Mainnet Connected</span>
                </div>
            </Tooltip>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            
            {/* Left Column: Form */}
            <div className="lg:col-span-7 space-y-8">
                
                {/* File Upload Area */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Asset Image</label>
                    <Tooltip content="Supported formats: JPG, PNG, GIF" className="w-full">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                group relative w-full aspect-[2/1] rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden
                                ${image 
                                    ? 'border-teal-500/30 bg-teal-50/10' 
                                    : 'border-slate-300 bg-white hover:border-teal-400 hover:bg-teal-50/30 hover:shadow-xl hover:shadow-teal-900/5'
                                }
                            `}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                            />
                            
                            {image ? (
                                <>
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center backdrop-blur-sm">
                                        <div className="bg-white px-5 py-2.5 rounded-full text-slate-900 font-bold shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                            <Upload size={18} /> Replace Image
                                        </div>
                                    </div>
                                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                </>
                            ) : (
                                <div className="text-center p-8 transition-transform group-hover:scale-105 duration-300">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:text-teal-500 group-hover:bg-white shadow-sm border border-slate-100">
                                        <ImageIcon size={32} strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 mb-1">Click to upload</h3>
                                    <p className="text-sm text-slate-400 max-w-xs mx-auto">SVG, PNG, JPG or GIF (max. 10MB)</p>
                                </div>
                            )}
                        </div>
                    </Tooltip>
                </div>

                {/* Text Inputs */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Cosmic Fox #001"
                            className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium shadow-sm hover:border-slate-300"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Description</label>
                            <span className="text-xs text-slate-400 font-medium">{description.length}/300</span>
                        </div>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your asset..."
                            rows={4}
                            maxLength={300}
                            className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium resize-none shadow-sm hover:border-slate-300"
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-200 w-full my-8"></div>

                {/* Footer Action */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-1 w-full bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-white text-indigo-500 flex items-center justify-center shadow-sm">
                                 <Sparkles size={20} />
                             </div>
                             <div>
                                 <div className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Gas Fee</div>
                                 <div className="font-bold text-slate-700">~0.001 SUI</div>
                             </div>
                         </div>
                         <Tooltip content="Estimated network fee for minting">
                            <Info size={18} className="text-indigo-300 cursor-help" />
                         </Tooltip>
                    </div>
                    <Tooltip content={!image || !name ? "Please fill in details first" : "Create your NFT"}>
                        <Button 
                            onClick={handleMint} 
                            disabled={!image || !name || isMinting}
                            size="lg"
                            className={`w-full sm:w-auto min-w-[200px] h-16 text-lg rounded-2xl shadow-xl transition-all ${isMinting ? 'opacity-80' : 'shadow-teal-500/20 hover:shadow-teal-500/30 hover:-translate-y-1'}`}
                        >
                            {isMinting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Minting...
                                </div>
                            ) : (
                                'Create Asset'
                            )}
                        </Button>
                    </Tooltip>
                </div>
            </div>

            {/* Right Column: Preview */}
            <div className="lg:col-span-5 sticky top-24">
                <div className="relative">
                    <div className="absolute inset-0 bg-teal-500 blur-[100px] opacity-10 rounded-full pointer-events-none"></div>
                    
                    <div className="relative bg-white rounded-[2.5rem] p-4 shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="text-center mb-6 mt-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Live Preview</h3>
                        </div>

                        {/* Card Preview */}
                        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-lg mx-auto max-w-[320px] transition-all duration-500 hover:scale-[1.02]">
                            <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden mb-4 relative">
                                {image ? (
                                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                                        <Box size={40} strokeWidth={1} />
                                        <span className="text-xs mt-2 font-medium">No Image</span>
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">NFT</span>
                                </div>
                            </div>
                            
                            <div className="space-y-1 px-1">
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-bold text-lg text-slate-900 ${!name && 'opacity-30 italic'}`}>
                                        {name || 'Asset Name'}
                                    </h4>
                                    <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                                        <Box size={14} />
                                    </div>
                                </div>
                                <p className={`text-sm text-slate-500 leading-relaxed ${!description && 'opacity-30 italic'}`}>
                                    {description || 'Description will appear here...'}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500"></div>
                                    <span className="text-xs font-bold text-slate-700">@You</span>
                                </div>
                                <span className="text-xs font-semibold text-slate-400">Just Now</span>
                            </div>
                        </div>

                        <div className="text-center mt-8 mb-4">
                             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                 <span className="text-[10px] font-bold text-slate-500 uppercase">Ready to Mint</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
