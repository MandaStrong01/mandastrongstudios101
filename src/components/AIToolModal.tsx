import { X, Upload, Sparkles } from 'lucide-react';

interface AIToolModalProps {
  toolName: string;
  onClose: () => void;
  onOpenAssetPage: (mode: 'upload' | 'create') => void;
}

export default function AIToolModal({ toolName, onClose, onOpenAssetPage }: AIToolModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900/30 to-black/50 backdrop-blur-xl border-2 border-purple-500/60 rounded-2xl max-w-2xl w-full">
        <div className="bg-gradient-to-br from-purple-900/50 to-black/50 backdrop-blur-xl border-b border-purple-500/30 p-4 sm:p-6 flex items-center justify-between">
          <h2 className="text-xl sm:text-3xl font-bold text-purple-400">{toolName}</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-8">
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => onOpenAssetPage('upload')}
              className="bg-gradient-to-br from-purple-900/40 to-black/60 border-2 border-purple-500/50 hover:border-purple-400 rounded-xl p-8 transition-all group"
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <h4 className="text-2xl font-bold text-white">Upload</h4>
            </button>

            <button
              onClick={() => onOpenAssetPage('create')}
              className="bg-gradient-to-br from-purple-900/40 to-black/60 border-2 border-purple-500/50 hover:border-purple-400 rounded-xl p-8 transition-all group"
            >
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <h4 className="text-2xl font-bold text-white">Create</h4>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
