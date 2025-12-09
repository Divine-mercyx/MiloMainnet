import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Heart, Filter, RefreshCw } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { useNFTs } from '../hooks/useNFTs';

export const GalleryPage: React.FC = () => {
  const { nfts, loading, error, refetch } = useNFTs();
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const loadImagesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const retrieveImageFromWalrus = async (blobId: string): Promise<string | null> => {
    try {
      console.log('Retrieving image from Walrus for blobId:', blobId);
      const response = await fetch(`https://walhost-production.up.railway.app/retrieve/${blobId}`);
      
      if (!response.ok) {
        console.error(`Failed to retrieve image with status ${response.status}`);
        throw new Error(`Failed to retrieve image with status ${response.status}`);
      }
      
      // Get the response as ArrayBuffer (binary)
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      // Convert to string to find boundaries (only for searching)
      const textDecoder = new TextDecoder('utf-8');
      const dataAsText = textDecoder.decode(data.slice(0, 1000)); // Only decode first 1000 bytes for searching
      
      // Find the boundary
      const boundaryMatch = dataAsText.match(/^([-]+[a-zA-Z0-9]+)/);
      if (!boundaryMatch) {
        console.error('No boundary found in response');
        return null;
      }
      
      const boundary = boundaryMatch[1];
      const boundaryBytes = new TextEncoder().encode(boundary);
      
      console.log('Found boundary:', boundary);
      
      // Find the start of file content (after headers and empty line)
      // Look for pattern: boundary + headers + \r\n\r\n
      let fileStartIndex = -1;
      
      // Search for the boundary followed by headers and then empty line
      const searchWindow = data.slice(0, 2000); // Search in first 2000 bytes
      const searchText = textDecoder.decode(searchWindow);
      
      // Find the empty line after headers (indicates start of binary data)
      const emptyLineIndex = searchText.indexOf('\r\n\r\n');
      if (emptyLineIndex !== -1) {
        fileStartIndex = emptyLineIndex + 4; // +4 for \r\n\r\n
      }
      
      // Find the end boundary
      const endBoundary = boundary + '--';
      const endBoundaryBytes = new TextEncoder().encode(endBoundary);
      let fileEndIndex = -1;
      
      // Search for end boundary from the end
      for (let i = data.length - endBoundaryBytes.length; i >= 0; i--) {
        let match = true;
        for (let j = 0; j < endBoundaryBytes.length; j++) {
          if (data[i + j] !== endBoundaryBytes[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          fileEndIndex = i;
          break;
        }
      }
      
      if (fileStartIndex === -1 || fileEndIndex === -1 || fileStartIndex >= fileEndIndex) {
        console.error('Could not extract file from multipart data');
        return null;
      }
      
      // Extract the file content (binary)
      const fileContent = data.slice(fileStartIndex, fileEndIndex);
      console.log('Extracted file size:', fileContent.length, 'bytes');
      
      // Get content type from headers if available
      let contentType = 'image/jpeg';
      const headersText = searchText.substring(0, emptyLineIndex);
      const contentTypeMatch = headersText.match(/Content-Type:\s*([^\r\n]+)/i);
      if (contentTypeMatch) {
        contentType = contentTypeMatch[1].trim();
        console.log('Detected content type:', contentType);
      }
      
      // Create blob from binary data
      const blob = new Blob([fileContent], { type: contentType });
      const imageUrl = URL.createObjectURL(blob);
      
      // Test if image loads
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          console.log('Image loaded successfully');
          resolve(imageUrl);
        };
        img.onerror = (err) => {
          console.error('Image failed to load:', err);
          URL.revokeObjectURL(imageUrl);
          resolve(null);
        };
        img.src = imageUrl;
      });
      
    } catch (error) {
      console.error('Error retrieving image from Walrus:', error);
      return null;
    }
  };

  // Load images for all NFTs with debounce
  useEffect(() => {
    console.log('GalleryPage useEffect triggered, nfts:', nfts.length, 'imageMap:', Object.keys(imageMap).length);
    
    // Early exit if no NFTs
    if (nfts.length === 0) {
      console.log('No NFTs to process, exiting early');
      return;
    }
    
    // Clear any existing timeout
    if (loadImagesTimeoutRef.current) {
      clearTimeout(loadImagesTimeoutRef.current);
    }

    // Set a new timeout to debounce the image loading
    loadImagesTimeoutRef.current = setTimeout(() => {
      const loadImages = async () => {
        console.log('Loading images...');
        // Only proceed if we have NFTs and some of them need images loaded
        const nftsNeedingImages = nfts.filter(nft => nft.blob_id && !imageMap[nft.id]);
        console.log('NFTs needing images:', nftsNeedingImages.length);
        
        if (nftsNeedingImages.length > 0) {
          const newImageMap: Record<string, string> = {};
          
          for (const nft of nftsNeedingImages) {
            if (nft.blob_id) {
              console.log('Loading image for NFT:', nft.id);
              const imageUrl = await retrieveImageFromWalrus(nft.blob_id);
              if (imageUrl) {
                newImageMap[nft.id] = imageUrl;
                console.log('Successfully loaded image for NFT:', nft.id);
              } else {
                console.log('Failed to load image for NFT:', nft.id);
              }
            }
          }
          
          if (Object.keys(newImageMap).length > 0) {
            console.log('Setting new images in state');
            setImageMap(prev => ({ ...prev, ...newImageMap }));
          }
        } else {
          console.log('No new images to load');
        }
      };
      
      loadImages();
    }, 300); // Debounce for 300ms

    // Cleanup function to clear timeout
    return () => {
      if (loadImagesTimeoutRef.current) {
        clearTimeout(loadImagesTimeoutRef.current);
      }
    };
  }, [nfts, imageMap]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all object URLs to prevent memory leaks
      Object.values(imageMap).forEach(url => {
        URL.revokeObjectURL(url as string);
      });
    };
  }, [imageMap]);

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
                       onClick={() => {
                         console.log('Refresh button clicked');
                         refetch();
                       }} 
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
            <p className="text-red-700">Error loading NFTs: {String(error)}</p>
          </div>
        )}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
              {nfts.map(nft => (
                  <div key={nft.id} className="group bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-300 transform hover:-translate-y-1">
                      <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative mb-3">
                          {imageMap[nft.id] ? (
                            <img 
                              src={imageMap[nft.id]} 
                              alt={nft.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3B8D85]"></div>
                            </div>
                          )}
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