"use client";

import { useState, useRef, useEffect } from "react";

interface VideoPlayerProps {
  className?: string;
}

export default function VideoPlayer({ className = "" }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const extractVideoId = (url: string): string | null => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  };

  const handleUrlSubmit = () => {
    setError("");

    if (!videoUrl.trim()) {
      setError("Please enter a video URL");
      return;
    }

    // Check if it's already an embed URL or iframe
    if (videoUrl.includes("embed/") || videoUrl.includes("<iframe")) {
      if (videoUrl.includes("<iframe")) {
        // Extract src from iframe
        const srcMatch = videoUrl.match(/src="([^"]+)"/);
        if (srcMatch) {
          setEmbedUrl(srcMatch[1]);
        } else {
          setError("Invalid iframe code");
          return;
        }
      } else {
        setEmbedUrl(videoUrl);
      }
    } else {
      // Extract video ID from regular YouTube URL
      const videoId = extractVideoId(videoUrl);
      if (videoId) {
        setEmbedUrl(`https://www.youtube.com/embed/${videoId}?enablejsapi=1`);
      } else {
        setError("Invalid YouTube URL. Please check the URL and try again.");
        return;
      }
    }

    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      if (isPlaying) {
        // Pause video by sending postMessage
        iframe.contentWindow?.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          "*"
        );
        setIsPlaying(false);
      } else {
        // Play video by sending postMessage
        iframe.contentWindow?.postMessage(
          '{"event":"command","func":"playVideo","args":""}',
          "*"
        );
        setIsPlaying(true);
      }
    }
  };

  const stopVideo = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        '{"event":"command","func":"stopVideo","args":""}',
        "*"
      );
      setIsPlaying(false);
    }
  };

  const clearVideo = () => {
    setEmbedUrl("");
    setVideoUrl("");
    setIsPlaying(false);
    setError("");
  };

  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 ${className}`}>
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">YouTube Video Player</h3>

          {/* URL Input */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                YouTube URL or Embed Code
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or <iframe>..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              onClick={handleUrlSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              Load Video
            </button>
          </div>
        </div>

        {/* Video Player */}
        {embedUrl && (
          <div className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                ref={iframeRef}
                src={embedUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Video Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlayPause}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                {isPlaying ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,19H18V5H14M6,19H10V5H6V19Z" />
                    </svg>
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                    </svg>
                    <span>Play</span>
                  </>
                )}
              </button>

              <button
                onClick={stopVideo}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18,18H6V6H18V18Z" />
                </svg>
                <span>Stop</span>
              </button>

              <button
                onClick={clearVideo}
                className="flex items-center space-x-2 bg-red-600/20 hover:bg-red-600/30 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
                <span>Clear</span>
              </button>
            </div>

            {/* Video Info */}
            <div className="text-sm text-white/60">
              <p>Use the controls above to play, pause, or stop the video.</p>
              <p>You can also use the standard YouTube controls within the video player.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
