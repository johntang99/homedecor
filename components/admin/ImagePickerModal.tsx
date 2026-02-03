'use client';

import { useEffect, useMemo, useState } from 'react';
 
 interface ImagePickerModalProps {
   open: boolean;
   siteId: string;
   onClose: () => void;
   onSelect: (url: string) => void;
 }
 
 interface MediaItem {
   id: string;
   url: string;
   path: string;
 }
 
 export function ImagePickerModal({ open, siteId, onClose, onSelect }: ImagePickerModalProps) {
   const [items, setItems] = useState<MediaItem[]>([]);
   const [query, setQuery] = useState('');
   const [loading, setLoading] = useState(false);
 
   useEffect(() => {
     if (!open) return;
     setLoading(true);
     fetch(`/api/admin/media/list?siteId=${siteId}`)
       .then((response) => response.json())
       .then((payload) => setItems(payload.items || []))
       .finally(() => setLoading(false));
   }, [open, siteId]);
 
   const filtered = useMemo(() => {
     if (!query) return items;
     const lower = query.toLowerCase();
     return items.filter((item) => item.path.toLowerCase().includes(lower));
   }, [items, query]);
 
   if (!open) return null;
 
   return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
       <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[80vh] flex flex-col">
         <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
           <div>
             <h2 className="text-lg font-semibold">Media Library</h2>
             <p className="text-xs text-gray-500">Select an image</p>
           </div>
           <button
             type="button"
             onClick={onClose}
             className="px-3 py-1.5 rounded-md border border-gray-200 text-xs"
           >
             Close
           </button>
         </div>
 
         <div className="px-5 py-3 border-b border-gray-200">
           <input
             className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
             placeholder="Search by filename"
             value={query}
             onChange={(event) => setQuery(event.target.value)}
           />
         </div>
 
         <div className="p-5 overflow-y-auto">
           {loading ? (
             <div className="text-sm text-gray-500">Loading images…</div>
           ) : (
             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
               {filtered.map((item) => (
                 <button
                   key={item.id}
                   type="button"
                   onClick={() => {
                     onSelect(item.url);
                     onClose();
                   }}
                   className="border border-gray-200 rounded-lg overflow-hidden text-left hover:shadow-sm"
                 >
                   <div className="aspect-[4/3] bg-gray-100">
                     <img
                       src={item.url}
                       alt={item.path}
                       className="w-full h-full object-cover"
                       loading="lazy"
                     />
                   </div>
                   <div className="px-3 py-2 text-xs text-gray-600 truncate">
                     {item.path}
                   </div>
                 </button>
               ))}
               {filtered.length === 0 && (
                 <div className="text-sm text-gray-500">No images found.</div>
               )}
             </div>
           )}
         </div>
       </div>
     </div>
   );
 }
