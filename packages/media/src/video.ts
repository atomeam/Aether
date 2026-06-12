/**
 * @aether/media - Video Processing Module
 * 
 * High-level API for video processing operations.
 */

import type {
  VideoTranscodeOptions,
  VideoThumbnailOptions,
  VideoTrimOptions,
  VideoConcatOptions,
  VideoOverlayOptions,
  VideoDimensions,
  MediaProcessingResult,
} from './types.js';
import { VideoProcessor } from './video-processor.js';

/**
 * Video processing class providing a fluent API for video operations
 */
export class Video {
  private processor: VideoProcessor;

  constructor(private data: Buffer) {
    this.processor = new VideoProcessor(data);
  }

  /**
   * Transcode the video
   */
  async transcode(options: VideoTranscodeOptions): Promise<Video> {
    const result = await this.processor.transcode(options);
    return new Video(result.data!);
  }

  /**
   * Generate a thumbnail
   */
  async thumbnail(options: VideoThumbnailOptions): Promise<Buffer> {
    const result = await this.processor.thumbnail(options);
    return result.data!;
  }

  /**
   * Trim the video
   */
  async trim(options: VideoTrimOptions): Promise<Video> {
    const result = await this.processor.trim(options);
    return new Video(result.data!);
  }

  /**
   * Concatenate videos
   */
  static async concat(options: VideoConcatOptions): Promise<Video> {
    const processor = new VideoProcessor(options.videos[0]);
    const result = await processor.concat(options);
    return new Video(result.data!);
  }

  /**
   * Overlay content on video
   */
  async overlay(options: VideoOverlayOptions): Promise<Video> {
    const result = await this.processor.overlay(options);
    return new Video(result.data!);
  }

  /**
   * Get video metadata
   */
  async getMetadata() {
    return this.processor.getMetadata();
  }

  /**
   * Get video dimensions
   */
  async getDimensions(): Promise<VideoDimensions> {
    const metadata = await this.getMetadata();
    return {
      width: metadata.width,
      height: metadata.height,
    };
  }

  /**
   * Get video duration
   */
  async getDuration(): Promise<number> {
    const metadata = await this.getMetadata();
    return metadata.duration;
  }

  /**
   * Convert to buffer
   */
  toBuffer(): Buffer {
    return this.data;
  }

  /**
   * Clone the video
   */
  clone(): Video {
    return new Video(Buffer.from(this.data));
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a Video instance from a buffer
 */
export function createVideo(data: Buffer): Video {
  return new Video(data);
}

/**
 * Transcode a video
 */
export async function transcodeVideo(
  data: Buffer,
  options: VideoTranscodeOptions
): Promise<MediaProcessingResult> {
  const processor = new VideoProcessor(data);
  return processor.transcode(options);
}

/**
 * Generate a video thumbnail
 */
export async function generateVideoThumbnail(
  data: Buffer,
  options: VideoThumbnailOptions
): Promise<MediaProcessingResult> {
  const processor = new VideoProcessor(data);
  return processor.thumbnail(options);
}

/**
 * Trim a video
 */
export async function trimVideo(
  data: Buffer,
  options: VideoTrimOptions
): Promise<MediaProcessingResult> {
  const processor = new VideoProcessor(data);
  return processor.trim(options);
}

/**
 * Concatenate videos
 */
export async function concatVideos(
  options: VideoConcatOptions
): Promise<MediaProcessingResult> {
  const processor = new VideoProcessor(options.videos[0]);
  return processor.concat(options);
}

/**
 * Overlay content on video
 */
export async function overlayVideo(
  data: Buffer,
  options: VideoOverlayOptions
): Promise<MediaProcessingResult> {
  const processor = new VideoProcessor(data);
  return processor.overlay(options);
}

/**
 * Get video metadata
 */
export async function getVideoMetadata(data: Buffer) {
  const processor = new VideoProcessor(data);
  return processor.getMetadata();
}

/**
 * Get video dimensions
 */
export async function getVideoDimensions(data: Buffer): Promise<VideoDimensions> {
  const metadata = await getVideoMetadata(data);
  return {
    width: metadata.width,
    height: metadata.height,
  };
}

/**
 * Get video duration
 */
export async function getVideoDuration(data: Buffer): Promise<number> {
  const metadata = await getVideoMetadata(data);
  return metadata.duration;
}
