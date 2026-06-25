/**
 * @aether/media - Zod Schemas
 * 
 * Zod validation schemas for media processing operations.
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const MediaTypeSchema = z.enum(['image', 'video', 'audio', 'document', 'other']);

export const ImageFormatSchema = z.enum([
  'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg', 'avif'
]);

export const VideoFormatSchema = z.enum([
  'mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'
]);

export const AudioFormatSchema = z.enum([
  'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus'
]);

export const MediaMetadataSchema = z.object({
  type: MediaTypeSchema,
  format: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().nonnegative().optional(),
  bitrate: z.number().int().nonnegative().optional(),
  fps: z.number().nonnegative().optional(),
  channels: z.number().int().nonnegative().optional(),
  sampleRate: z.number().int().nonnegative().optional(),
  createdAt: z.coerce.date(),
  modifiedAt: z.coerce.date(),
});

export const MediaProcessingOptionsSchema = z.object({
  quality: z.number().min(0).max(100).optional(),
  preserveMetadata: z.boolean().optional(),
  stripExif: z.boolean().optional(),
  progressive: z.boolean().optional(),
});

export const MediaProcessingResultSchema = z.object({
  success: z.boolean(),
  data: z.instanceof(Buffer).optional(),
  metadata: MediaMetadataSchema.optional(),
  error: z.string().optional(),
  duration: z.number().nonnegative().optional(),
});

// ============================================================================
// Image Schemas
// ============================================================================

export const ImageDimensionsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const ImageResizeOptionsSchema = MediaProcessingOptionsSchema.extend({
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional(),
  position: z.enum(['top', 'bottom', 'left', 'right', 'center', 'entropy', 'attention']).optional(),
  background: z.string().optional(),
  kernel: z.enum(['nearest', 'cubic', 'mitchell', 'lanczos2', 'lanczos3']).optional(),
  withoutEnlargement: z.boolean().optional(),
  fastShrinkOnLoad: z.boolean().optional(),
});

export const ImageCropOptionsSchema = z.object({
  left: z.number().int().nonnegative(),
  top: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const ImageRotateOptionsSchema = z.object({
  angle: z.number(),
  background: z.string().optional(),
});

export const ImageFlipOptionsSchema = z.object({
  horizontal: z.boolean().optional(),
  vertical: z.boolean().optional(),
});

export const ImageBlurOptionsSchema = z.object({
  sigma: z.number().positive().optional(),
});

export const ImageSharpenOptionsSchema = z.object({
  sigma: z.number().positive().optional(),
  flat: z.number().optional(),
  jagged: z.number().optional(),
});

export const ImageModulateOptionsSchema = z.object({
  brightness: z.number().min(0).max(2).optional(),
  saturation: z.number().min(0).max(2).optional(),
  hue: z.number().min(-180).max(180).optional(),
  lightness: z.number().min(0).max(2).optional(),
});

export const ImageTintOptionsSchema = z.object({
  r: z.number().min(0).max(255),
  g: z.number().min(0).max(255),
  b: z.number().min(0).max(255),
});

export const ImageGrayscaleOptionsSchema = z.object({
  grayscale: z.boolean().optional(),
});

export const ImageNormalizeOptionsSchema = z.object({
  normalize: z.boolean().optional(),
});

export const ImageOptimizeOptionsSchema = MediaProcessingOptionsSchema.extend({
  format: ImageFormatSchema.optional(),
  quality: z.number().min(0).max(100).optional(),
  progressive: z.boolean().optional(),
  chromaSubsampling: z.enum(['4:2:0', '4:4:4', '4:2:2']).optional(),
  trellisQuantisation: z.boolean().optional(),
  overshootDeringing: z.boolean().optional(),
  optimizeScans: z.boolean().optional(),
  effort: z.number().min(0).max(10).optional(),
});

export const ImageWatermarkOptionsSchema = z.object({
  text: z.string().optional(),
  image: z.instanceof(Buffer).optional(),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']).optional(),
  opacity: z.number().min(0).max(1).optional(),
  fontSize: z.number().int().positive().optional(),
  fontFamily: z.string().optional(),
  color: z.string().optional(),
  padding: z.number().int().nonnegative().optional(),
}).refine(
  (data) => data.text !== undefined || data.image !== undefined,
  { message: 'Either text or image must be provided' }
);

// ============================================================================
// Video Schemas
// ============================================================================

export const VideoDimensionsSchema = ImageDimensionsSchema;

export const VideoMetadataSchema = MediaMetadataSchema.extend({
  type: z.literal('video'),
  format: VideoFormatSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  duration: z.number().nonnegative(),
  fps: z.number().nonnegative(),
  bitrate: z.number().int().nonnegative(),
  codec: z.string().optional(),
  audioCodec: z.string().optional(),
  hasAudio: z.boolean(),
});

export const VideoTranscodeOptionsSchema = MediaProcessingOptionsSchema.extend({
  format: VideoFormatSchema.optional(),
  codec: z.string().optional(),
  audioCodec: z.string().optional(),
  bitrate: z.number().int().positive().optional(),
  audioBitrate: z.number().int().positive().optional(),
  fps: z.number().nonnegative().optional(),
  resolution: VideoDimensionsSchema.optional(),
  preset: z.enum(['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow']).optional(),
  crf: z.number().min(0).max(51).optional(),
  keyframeInterval: z.number().int().positive().optional(),
  audioSampleRate: z.number().int().positive().optional(),
  audioChannels: z.number().int().positive().optional(),
  removeAudio: z.boolean().optional(),
  hardwareAcceleration: z.boolean().optional(),
});

export const VideoThumbnailOptionsSchema = z.object({
  timestamp: z.number().nonnegative().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: ImageFormatSchema.optional(),
  quality: z.number().min(0).max(100).optional(),
});

export const VideoTrimOptionsSchema = z.object({
  startTime: z.number().nonnegative(),
  endTime: z.number().positive(),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'startTime must be less than endTime' }
);

export const VideoConcatOptionsSchema = z.object({
  videos: z.array(z.instanceof(Buffer)).min(2),
  transition: z.enum(['none', 'fade', 'slide', 'wipe']).optional(),
  transitionDuration: z.number().nonnegative().optional(),
});

export const VideoOverlayOptionsSchema = z.object({
  overlay: z.instanceof(Buffer),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  startTime: z.number().nonnegative().optional(),
  endTime: z.number().positive().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

// ============================================================================
// Audio Schemas
// ============================================================================

export const AudioMetadataSchema = MediaMetadataSchema.extend({
  type: z.literal('audio'),
  format: AudioFormatSchema,
  duration: z.number().nonnegative(),
  bitrate: z.number().int().nonnegative(),
  sampleRate: z.number().int().positive(),
  channels: z.number().int().positive(),
  codec: z.string().optional(),
});

export const AudioTranscodeOptionsSchema = MediaProcessingOptionsSchema.extend({
  format: AudioFormatSchema.optional(),
  codec: z.string().optional(),
  bitrate: z.number().int().positive().optional(),
  sampleRate: z.number().int().positive().optional(),
  channels: z.number().int().positive().optional(),
  quality: z.number().min(0).max(10).optional(),
  normalize: z.boolean().optional(),
  trimStart: z.number().nonnegative().optional(),
  trimEnd: z.number().positive().optional(),
});

export const AudioNormalizeOptionsSchema = z.object({
  targetLevel: z.number().min(-60).max(0).optional(),
  method: z.enum(['peak', 'rms', 'ebu_r128']).optional(),
  threshold: z.number().min(-60).max(0).optional(),
});

export const AudioFadeOptionsSchema = z.object({
  fadeInDuration: z.number().nonnegative().optional(),
  fadeOutDuration: z.number().nonnegative().optional(),
  shape: z.enum(['linear', 'exponential', 'logarithmic']).optional(),
});

export const AudioMixOptionsSchema = z.object({
  tracks: z.array(z.instanceof(Buffer)).min(2),
  volumes: z.array(z.number().min(0).max(2)).optional(),
  fadeInDuration: z.number().nonnegative().optional(),
  fadeOutDuration: z.number().nonnegative().optional(),
});

export const AudioFilterOptionsSchema = z.object({
  highpass: z.number().positive().optional(),
  lowpass: z.number().positive().optional(),
  bandpass: z.object({
    low: z.number().positive(),
    high: z.number().positive(),
  }).optional(),
  equalizer: z.array(z.object({
    frequency: z.number().positive(),
    gain: z.number().min(-20).max(20),
    q: z.number().positive(),
  })).optional(),
  compressor: z.object({
    threshold: z.number().min(-60).max(0),
    ratio: z.number().min(1).max(20),
    attack: z.number().nonnegative(),
    release: z.number().nonnegative(),
  }).optional(),
});

// ============================================================================
// Conversion Schemas
// ============================================================================

export const ConversionOptionsSchema = z.object({
  inputFormat: z.string(),
  outputFormat: z.string(),
  quality: z.number().min(0).max(100).optional(),
  bitrate: z.number().int().positive().optional(),
  sampleRate: z.number().int().positive().optional(),
  resolution: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }).optional(),
  preserveMetadata: z.boolean().optional(),
});

export const BatchConversionOptionsSchema = ConversionOptionsSchema.extend({
  concurrency: z.number().int().positive().optional(),
  onProgress: z.function().optional(),
});

// ============================================================================
// Streaming Schemas
// ============================================================================

export const StreamOptionsSchema = z.object({
  chunkSize: z.number().int().positive().optional(),
  bufferSize: z.number().int().positive().optional(),
  highWaterMark: z.number().int().positive().optional(),
});

export const VideoStreamOptionsSchema = StreamOptionsSchema.extend({
  format: VideoFormatSchema.optional(),
  codec: z.string().optional(),
  bitrate: z.number().int().positive().optional(),
  resolution: VideoDimensionsSchema.optional(),
  fps: z.number().nonnegative().optional(),
});

export const AudioStreamOptionsSchema = StreamOptionsSchema.extend({
  format: AudioFormatSchema.optional(),
  codec: z.string().optional(),
  bitrate: z.number().int().positive().optional(),
  sampleRate: z.number().int().positive().optional(),
});

export const AdaptiveStreamingOptionsSchema = z.object({
  formats: z.array(VideoFormatSchema).min(1),
  resolutions: z.array(VideoDimensionsSchema).min(1),
  segmentDuration: z.number().positive().optional(),
  hls: z.boolean().optional(),
  dash: z.boolean().optional(),
});

export const StreamSegmentSchema = z.object({
  index: z.number().int().nonnegative(),
  duration: z.number().nonnegative(),
  data: z.instanceof(Buffer),
  size: z.number().int().nonnegative(),
});
