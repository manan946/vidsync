/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  Trash2, 
  Plus, 
  Upload, 
  Film, 
  Settings,
  Share2,
  Clock,
  Layers,
  Search
} from 'lucide-react';

// --- Types ---

interface MediaItem {
  id: string;
  name: string;
  url: string;
  duration: number; // in seconds
  thumbnail?: string;
}

interface TimelineClip {
  id: string;
  mediaId: string;
  name: string;
  startTime: number; // position on timeline in seconds
  duration: number;
  trackIndex: number; 
}

// --- Mock Data ---

const INITIAL_MEDIA: MediaItem[] = [
  { id: 'm1', name: 'Intro_Shot.mp4', url: '#', duration: 12 },
  { id: 'm2', name: 'B-Roll_Forest.mov', url: '#', duration: 45 },
  { id: 'm3', name: 'Interview_Lead.mp4', url: '#', duration: 120 },
  { id: 'm4', name: 'Music_Upbeat.wav', url: '#', duration: 180 },
];

export default function App() {
  const [media, setMedia] = useState<MediaItem[]>(INITIAL_MEDIA);
  const [clips, setClips] = useState<TimelineClip[]>([
    { id: 'c1', mediaId: 'm1', name: 'Intro_Shot.mp4', startTime: 0, duration: 8, trackIndex: 0 },
    { id: 'c2', mediaId: 'm2', name: 'B-Roll_Forest.mov', startTime: 8, duration: 15, trackIndex: 1 },
  ]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1); // Pixels per second
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize-start' | 'resize-end';
    clipId: string;
    startX: number;
    initialStart: number;
    initialDuration: number;
  } | null>(null);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const totalDuration = 300; // 5 minutes fixed for now

  // Constants for UI
  const PIXELS_PER_SECOND = 10 * zoomLevel;
  const TRACK_HEIGHT = 80;

  // Sync playhead
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return prev + 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  // Handle Drag/Resize
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const x = e.clientX - rect.left + scrollLeft - 128; // Subtract sidebar width
      const deltaSeconds = (e.clientX - dragState.startX) / PIXELS_PER_SECOND;

      setClips(prev => prev.map(clip => {
        if (clip.id !== dragState.clipId) return clip;

        if (dragState.type === 'move') {
          const newStart = Math.max(0, dragState.initialStart + deltaSeconds);
          return { ...clip, startTime: newStart };
        } else if (dragState.type === 'resize-start') {
          const newStart = Math.max(0, dragState.initialStart + deltaSeconds);
          const newDuration = Math.max(0.5, dragState.initialDuration - (newStart - clip.startTime));
          // Simplified: just update start and duration if valid
          return { ...clip, startTime: newStart, duration: dragState.initialDuration - deltaSeconds };
        } else if (dragState.type === 'resize-end') {
          const newDuration = Math.max(0.5, dragState.initialDuration + deltaSeconds);
          return { ...clip, duration: newDuration };
        }
        return clip;
      }));
    };

    const handleMouseUp = () => setDragState(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, PIXELS_PER_SECOND]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || dragState) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const x = e.clientX - rect.left + scrollLeft - 128;
    if (x >= 0) {
      setCurrentTime(Math.max(0, x / PIXELS_PER_SECOND));
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const startDrag = (e: React.MouseEvent, clip: TimelineClip, type: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    setDragState({
      type,
      clipId: clip.id,
      startX: e.clientX,
      initialStart: clip.startTime,
      initialDuration: clip.duration
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-[#E0E0E0] font-sans overflow-hidden select-none">
      {/* Header Navigation */}
      <header className="h-12 border-b border-[#2A2A2A] bg-[#121212] flex items-center px-4 justify-between select-none">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#3B82F6] rounded-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-white rotate-45"></div>
            </div>
            <span className="font-bold tracking-tight uppercase">Vidsync<span className="text-[#3B82F6]">Editor</span></span>
          </div>
          <nav className="flex gap-4 text-xs font-medium text-[#888]">
            <span className="text-white cursor-pointer transition-colors hover:text-[#3B82F6]">File</span>
            <span className="hover:text-white cursor-pointer transition-colors">Edit</span>
            <span className="hover:text-white cursor-pointer transition-colors">View</span>
            <span className="hover:text-white cursor-pointer transition-colors">Tools</span>
            <span className="hover:text-white cursor-pointer transition-colors">Help</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] text-[#555] bg-[#1A1A1A] px-2 py-1 rounded border border-[#2A2A2A] uppercase tracking-widest font-mono">Project: movie_edit_v1.vsp</div>
          <button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs px-4 py-1.5 rounded font-semibold transition-all active:scale-95 shadow-lg shadow-[#3B82F6]/10">Export</button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left: Media Assets */}
        <aside className="w-64 border-r border-[#2A2A2A] bg-[#121212] flex flex-col">
          <div className="p-3 border-b border-[#2A2A2A] flex justify-between items-center bg-[#181818]">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#666]">Media Assets</h2>
            <div className="flex gap-2">
              <button 
                className="text-[10px] bg-[#2A2A2A] px-2 py-1 rounded hover:bg-[#333] cursor-pointer text-zinc-300 transition-colors flex items-center gap-1"
                onClick={() => {}}
              >
                <Plus className="w-3 h-3" />
                Import
              </button>
            </div>
          </div>
          
          <div className="p-3">
             <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#444]" />
                <input 
                  type="text" 
                  placeholder="Search assets..." 
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded py-1.5 pl-9 pr-4 text-[11px] focus:outline-none focus:border-[#3B82F6] transition-colors text-[#888]"
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {media.map(item => (
              <div 
                key={item.id} 
                className="bg-[#1A1A1A] border border-[#1A1A1A] hover:border-[#2A2A2A] rounded p-2 flex gap-3 cursor-grab group transition-all"
                draggable
              >
                <div className="w-20 h-12 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded relative overflow-hidden flex items-center justify-center border border-white/5">
                  <Film className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                  <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 px-1 font-mono">
                    {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex flex-col justify-center overflow-hidden">
                  <div className="text-[11px] font-medium truncate w-32 text-[#E0E0E0]">{item.name}</div>
                  <div className="text-[9px] text-[#555]">1920x1080 | 30fps</div>
                </div>
              </div>
            ))}

            <div className="mt-4 border border-dashed border-[#2A2A2A] rounded p-6 flex flex-col items-center justify-center text-[#444] hover:text-[#666] hover:border-[#333] transition-all cursor-pointer">
              <Upload className="w-6 h-6 mb-2 opacity-50" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Drag Files Here</span>
            </div>
          </div>
        </aside>

        {/* Center: Preview Monitor */}
        <section className="flex-1 bg-[#050505] flex flex-col items-center justify-center relative p-8">
          <div className="w-full max-w-[800px] aspect-video bg-[#111] border border-[#222] shadow-2xl relative flex items-center justify-center group overflow-hidden rounded-sm">
            <div className="w-full h-full bg-gradient-to-tr from-[#111] to-[#1a1a1a] flex items-center justify-center">
               {/* Simulated Video Frame */}
               <div className="w-[85%] h-[85%] border border-dashed border-[#333]/30 flex items-center justify-center">
                 <Film className="absolute text-[#333]/10 w-32 h-32" />
                 <span className="text-[#333] text-[10px] uppercase tracking-[0.4em] font-medium select-none">Preview Stream Output</span>
               </div>
            </div>
            
            {/* Playback Overlay Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-black/40 backdrop-blur-md px-8 py-2 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => setCurrentTime(0)} className="text-lg cursor-pointer text-white/60 hover:text-[#3B82F6] transition-colors"><SkipBack /></button>
               <button 
                 onClick={togglePlay}
                 className="text-4xl cursor-pointer text-[#3B82F6] hover:scale-110 active:scale-95 transition-all"
               >
                 {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
               </button>
               <button className="text-lg cursor-pointer text-white/60 hover:text-[#3B82F6] transition-colors"><SkipForward /></button>
            </div>
            <div className="absolute top-3 right-5 text-[10px] font-mono text-[#444] tracking-widest">FULL RES | 60 FPS</div>
          </div>
          
          <div className="mt-8 flex flex-col items-center">
            <div className="font-mono text-4xl text-[#3B82F6] font-light tracking-tighter shadow-[#3B82F6]/5 drop-shadow-md">
              {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
              {Math.floor(currentTime % 60).toString().padStart(2, '0')}:
              {Math.floor((currentTime % 1) * 30).toString().padStart(2, '0')}
            </div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-[#444] mt-2 font-bold select-none">Current Timecode</div>
          </div>
        </section>

        {/* Right: Inspector */}
        <aside className="w-64 border-l border-[#2A2A2A] bg-[#121212] flex flex-col">
          <div className="p-3 border-b border-[#2A2A2A] bg-[#181818]">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#666]">Inspector</h2>
          </div>
          <div className="p-4 space-y-8 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <label className="text-[10px] uppercase text-[#555] font-bold block tracking-widest">Transform</label>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#888]">Opacity</span>
                  <span className="text-[#3B82F6] font-mono">100%</span>
                </div>
                <div className="h-1 bg-[#222] rounded-full overflow-hidden">
                  <div className="w-full h-full bg-[#3B82F6]"></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                   <span className="text-[#888]">Scale</span>
                   <span className="text-[#3B82F6] font-mono">1.0x</span>
                </div>
                <div className="h-1 bg-[#222] rounded-full overflow-hidden">
                  <div className="w-[45%] h-full bg-[#3B82F6]"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="space-y-1">
                  <span className="text-[9px] text-[#555] uppercase block">Position X</span>
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded px-2 py-1 text-[11px] text-[#888] font-mono tracking-tighter">0.00</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-[#555] uppercase block">Position Y</span>
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded px-2 py-1 text-[11px] text-[#888] font-mono tracking-tighter">0.00</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase text-[#555] font-bold block tracking-widest">Effects</label>
              <div className="text-[10px] p-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[#555] italic text-center border-dashed">
                No effects applied to selected clip
              </div>
            </div>
            
            <div className="pt-4 border-t border-[#2A2A2A]">
               <button className="w-full py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[10px] font-bold uppercase tracking-widest text-[#888] hover:bg-[#222] hover:text-white transition-colors">Reset Properties</button>
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom: Timeline */}
      <footer className="h-64 border-t border-[#2A2A2A] bg-[#0E0E0E] flex flex-col">
        {/* Timeline Tools */}
        <div className="h-10 border-b border-[#2A2A2A] flex items-center px-4 justify-between bg-[#121212]">
          <div className="flex gap-4 items-center">
            <button className="p-1 text-[#888] hover:text-[#3B82F6] cursor-pointer transition-colors"><Scissors className="w-4 h-4" /></button>
            <button className="p-1 text-[#888] hover:text-[#3B82F6] cursor-pointer transition-colors"><Trash2 className="w-4 h-4" /></button>
            <div className="w-[1px] h-4 bg-[#2A2A2A] mx-1"></div>
            <button className="text-[10px] uppercase tracking-widest font-bold text-[#3B82F6]">Snap</button>
            <div className="flex items-center gap-2 ml-4">
               <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest">Zoom</span>
               <input 
                type="range" 
                min="0.1" 
                max="5" 
                step="0.1" 
                value={zoomLevel} 
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-24 accent-[#3B82F6] h-1 bg-[#222] rounded-full appearance-none" 
               />
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="text-[10px] text-[#555] font-mono tracking-widest uppercase">Project Limit: 00:05:00:00</div>
             <div className="flex items-center gap-2">
               <Clock className="w-3 h-3 text-[#444]" />
               <span className="text-[10px] text-[#555] font-bold">1080p | 30fps</span>
             </div>
          </div>
        </div>
        
        {/* Timeline Tracks */}
        <div 
          className="flex-1 flex overflow-hidden relative" 
          ref={timelineRef}
          onClick={handleTimelineClick}
        >
          {/* Sidebar Labels */}
          <div className="w-24 border-r border-[#2A2A2A] flex flex-col z-30 sticky left-0 bg-[#121212]">
            <div className="h-16 border-b border-[#2A2A2A] p-2 flex flex-col justify-center items-center bg-[#151515] hover:bg-[#1a1a1a] cursor-pointer transition-colors">
              <span className="text-[10px] font-bold text-[#444]">V2</span>
              <Layers className="w-3.5 h-3.5 text-[#333] mt-1" />
            </div>
            <div className="h-16 border-b border-[#2A2A2A] p-2 flex flex-col justify-center items-center bg-[#181818] hover:bg-[#1a1a1a] cursor-pointer transition-colors">
              <span className="text-[10px] font-bold text-[#666]">V1</span>
              <Film className="w-3.5 h-3.5 text-[#444] mt-1" />
            </div>
            <div className="h-16 border-b border-[#2A2A2A] p-2 flex flex-col justify-center items-center bg-[#151515] hover:bg-[#1a1a1a] cursor-pointer transition-colors">
              <span className="text-[10px] font-bold text-[#444]">A1</span>
              <div className="flex gap-[1px] items-center h-2 mt-2">
                 <div className="w-[2px] h-1 bg-[#333]"></div>
                 <div className="w-[2px] h-2 bg-[#333]"></div>
                 <div className="w-[2px] h-1.5 bg-[#333]"></div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-x-auto custom-scrollbar relative bg-[#0A0A0A]">
            {/* Ruler */}
            <div 
              className="sticky top-0 z-20 h-6 border-b border-[#2A2A2A] bg-[#121212] flex items-end font-mono text-[9px] text-[#444]"
              style={{ width: totalDuration * PIXELS_PER_SECOND }}
            >
              {Array.from({ length: Math.ceil(totalDuration / 5) }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute bottom-0 border-l border-[#2A2A2A] h-2 pl-1"
                  style={{ left: i * 5 * PIXELS_PER_SECOND }}
                >
                  {Math.floor(i * 5 / 60)}:{(i * 5 % 60).toString().padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* Clips Area */}
            <div className="relative flex-1" style={{ width: totalDuration * PIXELS_PER_SECOND }}>
              {/* Playhead Line */}
              <div 
                className="absolute top-0 bottom-0 w-px bg-[#3B82F6] z-40 pointer-events-none shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-none"
                style={{ left: currentTime * PIXELS_PER_SECOND }}
              >
                <div className="w-3 h-3 bg-[#3B82F6] rounded-full -ml-1.5 mt-[-6px]"></div>
              </div>

              {/* Tracks Background Pattern */}
              <div className="absolute inset-x-0 h-16 border-b border-[#1A1A1A] top-0"></div>
              <div className="absolute inset-x-0 h-16 border-b border-[#1A1A1A] top-16"></div>
              <div className="absolute inset-x-0 h-16 border-b border-[#1A1A1A] top-32"></div>

              {/* Clips Mapping */}
              {clips.map(clip => (
                <div 
                  key={clip.id}
                  className="absolute py-1 px-0.5"
                  style={{ 
                    left: clip.startTime * PIXELS_PER_SECOND, 
                    width: clip.duration * PIXELS_PER_SECOND,
                    top: (1 - clip.trackIndex) * 64, // Using 64 for track height based on new layout
                    height: 64
                  }}
                  onMouseDown={(e) => startDrag(e, clip, 'move')}
                >
                  <div className="w-full h-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-[2px] overflow-hidden relative group cursor-grab active:cursor-grabbing hover:bg-[#3B82F6]/20 transition-all shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/5 to-transparent"></div>
                    <div className="absolute top-1 left-2 flex flex-col pointer-events-none">
                      <span className="text-[10px] font-bold text-[#3B82F6] truncate pr-2 uppercase tracking-tight">{clip.name}</span>
                      <span className="text-[8px] text-[#555] font-mono">{clip.duration.toFixed(1)}s</span>
                    </div>

                    {/* Resize Handles */}
                    <div 
                      className="absolute inset-y-0 left-0 w-1.5 hover:bg-[#3B82F6]/50 cursor-ew-resize z-50 transition-colors"
                      onMouseDown={(e) => startDrag(e, clip, 'resize-start')}
                    ></div>
                    <div 
                      className="absolute inset-y-0 right-0 w-1.5 hover:bg-[#3B82F6]/50 cursor-ew-resize z-50 transition-colors"
                      onMouseDown={(e) => startDrag(e, clip, 'resize-end')}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0A0A0A;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2A2A2A;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3B82F6;
        }
        
        input[type='range'] {
          -webkit-appearance: none;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 10px;
          width: 10px;
          border-radius: 50%;
          background: #3B82F6;
          box-shadow: 0 0 5px rgba(59, 130, 246, 0.4);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
