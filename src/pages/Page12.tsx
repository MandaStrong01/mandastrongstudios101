import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Film, Scissors, Crop, Music, FileText, Sparkles, Volume2, Maximize, Play, Pause, Rewind, FastForward, RotateCcw, Shield, Target, Key, Grid3X3, PictureInPicture2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';
import QuickAccess from '../components/QuickAccess';
import GrokChat from '../components/GrokChat';

interface PageProps {
  onNavigate: (page: number) => void;
}

interface AIAsset {
  id: string;
  tool_name: string;
  output_data: any;
  created_at: string;
}

export default function Page12({ onNavigate }: PageProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<AIAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<AIAsset | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [ratio, setRatio] = useState('16:9');
  const [size, setSize] = useState('1080p');
  const [speed, setSpeed] = useState(1);
  const [reverseVideo, setReverseVideo] = useState(false);
  const [stabilization, setStabilization] = useState(false);

  useEffect(() => {
    if (user) {
      loadAssets();
    }
  }, [user]);

  const loadAssets = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_tool_outputs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
      if (data && data.length > 0) {
        setSelectedAsset(data[0]);
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-black to-purple-900/20 text-white flex flex-col">
      <div className="flex-1 flex flex-col px-4 py-6">
        <div className="max-w-full w-full mx-auto flex-1 flex flex-col">
          <h1 className="text-3xl font-black text-purple-400 mb-4 text-center">DOXY THE SCHOOL BULLY - Timeline Editor</h1>

          <div className="grid grid-cols-12 gap-4 flex-1">
            <div className="col-span-3 bg-black/30 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-4 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-purple-400">MEDIA BOX</h2>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-slate-400">Loading...</p>
                  </div>
                ) : assets.length === 0 ? (
                  <div className="text-center py-8">
                    <Film className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-400">No assets yet</p>
                  </div>
                ) : (
                  assets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`w-full bg-purple-900/20 border rounded-lg p-3 text-left transition-all hover:bg-purple-900/40 ${
                        selectedAsset?.id === asset.id ? 'border-purple-400 bg-purple-900/40' : 'border-purple-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <h3 className="font-semibold text-sm truncate">{asset.tool_name}</h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="col-span-6 bg-black/30 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-4 flex flex-col">
              <h2 className="text-xl font-bold mb-4 text-purple-400">VIEWER</h2>
              <div className="flex-1 flex flex-col">
                <div className="aspect-video bg-black rounded-lg border border-purple-500/30 mb-4 flex items-center justify-center">
                  {selectedAsset ? (
                    <div className="text-center p-8">
                      <Film className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                      <h3 className="text-lg font-bold mb-2">{selectedAsset.tool_name}</h3>
                      <p className="text-sm text-white/70">Trim, Crop, Combine, Add Music, Subtitles, Filters</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Film className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                      <p className="text-slate-400">Select an asset to edit</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-all"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <span className="text-sm text-slate-400">{formatTime(currentTime)}</span>
                  </div>

                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max={duration}
                      step="0.1"
                      value={currentTime}
                      onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                      className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #9333ea ${(currentTime / duration) * 100}%, rgba(147, 51, 234, 0.2) ${(currentTime / duration) * 100}%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>0:00</span>
                      <span>180:00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-3 bg-black/30 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-4 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-purple-400">EDITING TOOLS</h2>
              <div className="space-y-4">
                <button className="w-full flex items-center gap-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 rounded-lg p-3 transition-all">
                  <Scissors className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Trim</span>
                </button>

                <button className="w-full flex items-center gap-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 rounded-lg p-3 transition-all">
                  <Crop className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Crop</span>
                </button>

                <button className="w-full flex items-center gap-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 rounded-lg p-3 transition-all">
                  <Film className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Combine</span>
                </button>

                <button className="w-full flex items-center gap-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 rounded-lg p-3 transition-all">
                  <Music className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Add Music</span>
                </button>

                <button className="w-full flex items-center gap-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 rounded-lg p-3 transition-all">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Subtitles</span>
                </button>

                <div className="pt-4 border-t border-purple-500/30">
                  <label className="text-sm font-semibold mb-2 block">Speed Controls</label>
                  <div className="grid grid-cols-5 gap-1 mb-2">
                    <button
                      onClick={() => setSpeed(0.25)}
                      className={`px-2 py-1 text-xs rounded transition-all ${speed === 0.25 ? 'bg-purple-600' : 'bg-purple-900/30 hover:bg-purple-900/50'} border border-purple-500/30`}
                    >
                      0.25x
                    </button>
                    <button
                      onClick={() => setSpeed(0.5)}
                      className={`px-2 py-1 text-xs rounded transition-all ${speed === 0.5 ? 'bg-purple-600' : 'bg-purple-900/30 hover:bg-purple-900/50'} border border-purple-500/30`}
                    >
                      0.5x
                    </button>
                    <button
                      onClick={() => setSpeed(1)}
                      className={`px-2 py-1 text-xs rounded transition-all ${speed === 1 ? 'bg-purple-600' : 'bg-purple-900/30 hover:bg-purple-900/50'} border border-purple-500/30`}
                    >
                      1x
                    </button>
                    <button
                      onClick={() => setSpeed(2)}
                      className={`px-2 py-1 text-xs rounded transition-all ${speed === 2 ? 'bg-purple-600' : 'bg-purple-900/30 hover:bg-purple-900/50'} border border-purple-500/30`}
                    >
                      2x
                    </button>
                    <button
                      onClick={() => setSpeed(4)}
                      className={`px-2 py-1 text-xs rounded transition-all ${speed === 4 ? 'bg-purple-600' : 'bg-purple-900/30 hover:bg-purple-900/50'} border border-purple-500/30`}
                    >
                      4x
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setReverseVideo(!reverseVideo)}
                  className={`w-full flex items-center gap-3 border rounded-lg p-3 transition-all ${reverseVideo ? 'bg-purple-600 border-purple-400' : 'bg-purple-900/30 hover:bg-purple-900/50 border-purple-500/30'}`}
                >
                  <RotateCcw className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Reverse Video</span>
                </button>

                <button
                  onClick={() => setStabilization(!stabilization)}
                  className={`w-full flex items-center gap-3 border rounded-lg p-3 transition-all ${stabilization ? 'bg-purple-600 border-purple-400' : 'bg-purple-900/30 hover:bg-purple-900/50 border-purple-500/30'}`}
                >
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Stabilization</span>
                </button>

                <button className="w-full flex items-center gap-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 rounded-lg p-3 transition-all">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Green Screen/Chroma Key</span>
                </button>

                <button className="w-full flex items-center gap-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 rounded-lg p-3 transition-all">
                  <Target className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Motion Tracking</span>
                </button>

                <button className="w-full flex items-center gap-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 rounded-lg p-3 transition-all">
                  <Key className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Keyframe Animation</span>
                </button>

                <button className="w-full flex items-center gap-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 rounded-lg p-3 transition-all">
                  <Grid3X3 className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Split Screen Effects</span>
                </button>

                <button className="w-full flex items-center gap-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 rounded-lg p-3 transition-all">
                  <PictureInPicture2 className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Picture-in-Picture</span>
                </button>

                <div className="pt-4 border-t border-purple-500/30">
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    Volume
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-right text-xs text-slate-400 mt-1">{volume}%</div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <Maximize className="w-4 h-4 text-purple-400" />
                    Ratio
                  </label>
                  <select
                    value={ratio}
                    onChange={(e) => setRatio(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="16:9">16:9</option>
                    <option value="4:3">4:3</option>
                    <option value="21:9">21:9</option>
                    <option value="1:1">1:1</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Size</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="1440p">1440p</option>
                    <option value="4K">4K</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={() => onNavigate(11)}
              className="flex items-center gap-2 bg-black text-white font-bold px-8 py-4 rounded-lg text-lg hover:bg-purple-900 transition-all border border-purple-500"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={() => onNavigate(13)}
              className="flex items-center gap-2 bg-purple-600 text-white font-bold px-8 py-4 rounded-lg text-lg hover:bg-purple-500 transition-all"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <QuickAccess onNavigate={onNavigate} />
      <GrokChat onNavigate={onNavigate} />
      <Footer />
    </div>
  );
}
