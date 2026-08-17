import FileUploadComponent from './components/file-upload';
import ChatComponent from './components/chat';

export default function Home() {
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar for Upload */}
      <div className="w-[320px] shrink-0 border-r border-white/10 bg-[#09090b]/80 p-6 flex flex-col gap-6 backdrop-blur-xl">
        <div className="space-y-1">
          <h2 className="text-sm font-medium tracking-tight text-slate-200">Knowledge Base</h2>
          <p className="text-xs text-slate-400">Upload PDFs to chat with them</p>
        </div>
        <FileUploadComponent />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0f]">
        <ChatComponent />
      </div>
    </div>
  );
}