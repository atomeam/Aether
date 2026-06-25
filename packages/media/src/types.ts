/**
 * @aether/media - TypeScript Types
 * 
 * Comprehensive type definitions for media processing operations.
 */

// ============================================================================
// Common Types
// ============================================================================

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other';

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp' | 'tiff' | 'svg' | 'avif';
export type VideoFormat = 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv' | 'flv' | 'wmv';
export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'aac' | 'm4a' | 'opus';

export type ImageMimeType = `image/${ImageFormat}`;
export type VideoMimeType = `video/${VideoFormat}`;
export type AudioMimeType = `audio/${AudioFormat}`;

export interface MediaMetadata {
  type: MediaType;
  format: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
  fps?: number;
  channels?: number;
  sampleRate?: number;
  createdAt: Date;
  modifiedAt: Date;
}

export interface MediaProcessingOptions {
  quality?: number;
  preserveMetadata?: boolean;
  stripExif?: boolean;
  progressive?: boolean;
}

export interface MediaProcessingResult {
  success: boolean;
  data?: Buffer;
  metadata?: MediaMetadata;
  error?: string;
  duration?: number;
}

// ============================================================================
// Image Types
// ============================================================================

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageResizeOptions extends MediaProcessingOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'entropy' | 'attention';
  background?: string;
  kernel?: 'nearest' | 'cubic' | 'mitchell' | 'lanczos2' | 'lanczos3';
  withoutEnlargement?: boolean;
  fastShrinkOnLoad?: boolean;
}

export interface ImageCropOptions {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ImageRotateOptions {
  angle: number;
  background?: string;
}

export interface ImageFlipOptions {
  horizontal?: boolean;
  vertical?: boolean;
}

export interface ImageBlurOptions {
  sigma?: number;
}

export interface ImageSharpenOptions {
  sigma?: number;
  flat?: number;
  jagged?: number;
}

export interface ImageModulateOptions {
  brightness?: number;
  saturation?: number;
  hue?: number;
  lightness?: number;
}

export interface ImageTintOptions {
  r: number;
  g: number;
  b: number;
}

export interface ImageGrayscaleOptions {
  grayscale?: boolean;
}

export interface ImageNormalizeOptions {
  normalize?: boolean;
}

export interface ImageOptimizeOptions extends MediaProcessingOptions {
  format?: ImageFormat;
  quality?: number;
  progressive?: boolean;
  chromaSubsampling?: '4:2:0' | '4:4:4' | '4:2:2';
  trellisQuantisation?: boolean;
  overshootDeringing?: boolean;
  optimizeScans?: boolean;
  effort?: number;
}

export interface ImageWatermarkOptions {
  text?: string;
  image?: Buffer;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  padding?: number;
}

// ============================================================================
// Video Types
// ============================================================================

export interface VideoDimensions {
  width: number;
  height: number;
}

export interface VideoMetadata extends MediaMetadata {
  type: 'video';
  format: VideoFormat;
  width: number;
  height: number;
  duration: number;
  fps: number;
  bitrate: number;
  codec?: string;
  audioCodec?: string;
  hasAudio: boolean;
}

export interface VideoTranscodeOptions extends MediaProcessingOptions {
  format?: VideoFormat;
  codec?: string;
  audioCodec?: string;
  bitrate?: number;
  audioBitrate?: number;
  fps?: number;
  resolution?: VideoDimensions;
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  crf?: number;
  keyframeInterval?: number;
  audioSampleRate?: number;
  audioChannels?: number;
  removeAudio?: boolean;
  hardwareAcceleration?: boolean;
}

export interface VideoThumbnailOptions {
  timestamp?: number;
  width?: number;
  height?: number;
  format?: ImageFormat;
  quality?: number;
}

export interface VideoTrimOptions {
  startTime: number;
  endTime: number;
}

export interface VideoConcatOptions {
  videos: Buffer[];
  transition?: 'none' | 'fade' | 'slide' | 'wipe';
  transitionDuration?: number;
}

export interface VideoOverlayOptions {
  overlay: Buffer;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  startTime?: number;
  endTime?: number;
  opacity?: number;
}

// ============================================================================
// Audio Types
// ============================================================================

export interface AudioMetadata extends MediaMetadata {
  type: 'audio';
  format: AudioFormat;
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  codec?: string;
}

export interface AudioTranscodeOptions extends MediaProcessingOptions {
  format?: AudioFormat;
  codec?: string;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  quality?: number;
  normalize?: boolean;
  trimStart?: number;
  trimEnd?: number;
}

export interface AudioNormalizeOptions {
  targetLevel?: number;
  method?: 'peak' | 'rms' | 'ebu_r128';
  threshold?: number;
}

export interface AudioFadeOptions {
  fadeInDuration?: number;
  fadeOutDuration?: number;
  shape?: 'linear' | 'exponential' | 'logarithmic';
}

export interface AudioMixOptions {
  tracks: Buffer[];
  volumes?: number[];
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

export interface AudioFilterOptions {
  highpass?: number;
  lowpass?: number;
  bandpass?: { low: number; high: number };
  equalizer?: { frequency: number; gain: number; q: number }[];
  compressor?: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
}

// ============================================================================
// Conversion Types
// ============================================================================

export interface ConversionOptions {
  inputFormat: string;
  outputFormat: string;
  quality?: number;
  bitrate?: number;
  sampleRate?: number;
  resolution?: { width: number; height: number };
  preserveMetadata?: boolean;
}

export interface BatchConversionOptions extends ConversionOptions {
  concurrency?: number;
  onProgress?: (progress: number, current: number, total: number) => void;
}

// ============================================================================
// Streaming Types
// ============================================================================

export interface StreamOptions {
  chunkSize?: number;
  bufferSize?: number;
  highWaterMark?: number;
}

export interface VideoStreamOptions extends StreamOptions {
  format?: VideoFormat;
  codec?: string;
  bitrate?: number;
  resolution?: VideoDimensions;
  fps?: number;
}

export interface AudioStreamOptions extends StreamOptions {
  format?: AudioFormat;
  codec?: string;
  bitrate?: number;
  sampleRate?: number;
}

export interface AdaptiveStreamingOptions {
  formats: VideoFormat[];
  resolutions: VideoDimensions[];
  segmentDuration?: number;
  hls?: boolean;
  dash?: boolean;
}

export interface StreamSegment {
  index: number;
  duration: number;
  data: Buffer;
  size: number;
}

// ============================================================================
// Error Types
// ============================================================================

export class MediaProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MediaProcessingError';
  }
}

export class ImageProcessingError extends MediaProcessingError {
  constructor(message: string, details?: any) {
    super(message, 'IMAGE_PROCESSING_ERROR', details);
    this.name = 'ImageProcessingError';
  }
}

export class VideoProcessingError extends MediaProcessingError {
  constructor(message: string, details?: any) {
    super(message, 'VIDEO_PROCESSING_ERROR', details);
    this.name = 'VideoProcessingError';
  }
}

export class AudioProcessingError extends MediaProcessingError {
  constructor(message: string, details?: any) {
    super(message, 'AUDIO_PROCESSING_ERROR', details);
    this.name = 'AudioProcessingError';
  }
}

export class ConversionError extends MediaProcessingError {
  constructor(message: string, details?: any) {
    super(message, 'CONVERSION_ERROR', details);
    this.name = 'ConversionError';
  }
}

export class StreamingError extends MediaProcessingError {
  constructor(message: string, details?: any) {
    super(message, 'STREAMING_ERROR', details);
    this.name = 'StreamingError';
  }
}
