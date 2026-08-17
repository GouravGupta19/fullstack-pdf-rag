'use client';
import * as React from 'react';
import { Upload, FileText, CheckCircle2, Loader2 } from 'lucide-react';

const FileUploadComponent = () => {
    const [isHovering, setIsHovering] = React.useState(false);
    const [uploadState, setUploadState] = React.useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'

    const handleFileUpload = async (file) => {
        if (!file) return;
        
        setUploadState('uploading');
        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_URL}/upload/pdf`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                setUploadState('success');
                setTimeout(() => setUploadState('idle'), 3000);
            } else {
                setUploadState('error');
            }
        } catch (e) {
            setUploadState('error');
        }
    };

    const handleFileUploadButtonClick = () => {
        if (uploadState === 'uploading') return;
        const el = document.createElement('input');
        el.setAttribute('type', 'file');
        el.setAttribute('accept', 'application/pdf');
        el.addEventListener('change', async (ev) => {
            if (el.files && el.files.length > 0) {
                handleFileUpload(el.files.item(0));
            }
        });
        el.click();
    };

    return (
        <div 
            className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer overflow-hidden
                ${uploadState === 'uploading' ? 'border-indigo-500/50 bg-indigo-500/5' : 
                  uploadState === 'success' ? 'border-emerald-500/50 bg-emerald-500/5' :
                  isHovering ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
            onClick={handleFileUploadButtonClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsHovering(false); }}
            onDrop={(e) => {
                e.preventDefault();
                setIsHovering(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    if (file.type === 'application/pdf') {
                        handleFileUpload(file);
                    }
                }
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex flex-col items-center gap-4 text-center">
                <div className={`p-4 rounded-full bg-black/40 border border-white/5 shadow-xl transition-transform duration-300 ${isHovering && uploadState === 'idle' ? 'scale-110' : 'scale-100'}`}>
                    {uploadState === 'idle' && <Upload className="w-8 h-8 text-indigo-400" />}
                    {uploadState === 'uploading' && <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />}
                    {uploadState === 'success' && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                    {uploadState === 'error' && <FileText className="w-8 h-8 text-red-400" />}
                </div>
                
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-200">
                        {uploadState === 'idle' && 'Upload Document'}
                        {uploadState === 'uploading' && 'Uploading...'}
                        {uploadState === 'success' && 'Uploaded Successfully!'}
                        {uploadState === 'error' && 'Upload Failed'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-[200px]">
                        {uploadState === 'idle' && 'Click or drag a PDF here to begin extracting knowledge.'}
                        {uploadState === 'uploading' && 'Processing document and generating vector embeddings...'}
                        {uploadState === 'success' && 'Your document is ready for chat.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FileUploadComponent;