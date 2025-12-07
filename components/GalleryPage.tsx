import React from 'react';
import { ExternalLink, Heart, Filter, RefreshCw } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { useNFTs } from '../hooks/useNFTs';

export const GalleryPage: React.FC = () => {
  const { nfts, loading, error, refetch } = useNFTs();

  // Generate preview URLs for blobs using Walrus
    function getPreviewUrl(blobId) {
        return `http://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`;
    }

// In your component

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10">
       <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">My Gallery</h1>
                <p className="text-slate-500">Your collected digital assets and NFTs on the Sui Network.</p>
            </div>
            <div className="flex items-center gap-4">
                 <Tooltip content="Refresh gallery">
                     <button 
                       onClick={() => refetch()} 
                       className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
                     >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                     </button>
                 </Tooltip>
                 <div className="text-right hidden md:block">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Total NFTs</p>
                    <p className="text-lg font-bold text-[#3B8D85]">{nfts.length}</p>
                </div>
            </div>
        </div>
        
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3B8D85]"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">Error loading NFTs: {error}</p>
          </div>
        )}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
              {nfts.map(nft => (
                  <div key={nft.id} className="group bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-300 transform hover:-translate-y-1">
                      <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative mb-3">
                          <img src={getPreviewUrl(nft.blob_id)} alt={nft.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Tooltip content="Favorite">
                                  <button className="p-2 bg-white/30 backdrop-blur-md text-white rounded-full hover:bg-white/50 transition-colors">
                                      <Heart size={16} className="fill-current" />
                                  </button>
                              </Tooltip>
                          </div>
                      </div>
                      <div className="px-1 pb-1">
                          <div className="flex justify-between items-start mb-1">
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Milo NFT</p>
                          </div>
                          <div className="flex items-center justify-between">
                              <h3 className="font-bold text-slate-800 text-sm truncate">{nft.name}</h3>
                              <Tooltip content="View Details">
                                  <button className="text-slate-300 hover:text-[#3B8D85] transition-colors">
                                      <ExternalLink size={16} />
                                  </button>
                              </Tooltip>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 truncate">{nft.description}</p>
                      </div>
                  </div>
              ))}
              
              {nfts.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-500">No NFTs found in your wallet</p>
                </div>
              )}
              
              {/* Add New Placeholder */}
              <Tooltip content="Explore new collections">
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-[#3B8D85] hover:text-[#3B8D85] hover:bg-teal-50/50 transition-all cursor-pointer group min-h-[250px] h-full">
                      <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center mb-3 transition-colors">
                          <span className="text-2xl">+</span>
                      </div>
                      <p className="font-medium text-sm">Discover Collection</p>
                  </div>
              </Tooltip>
          </div>
        )}
    </div>
  );
};