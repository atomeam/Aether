/**
 * @aether/media - Audio Processing Module
 * 
 * High-level API for audio processing operations.
 */

import type {
  AudioTranscodeOptions,
  AudioNormalizeOptions,
  AudioFadeOptions,
  AudioMixOptions,
  AudioFilterOptions,
  MediaProcessingResult,
} from './types.js';
import { AudioProcessor } from './audio-processor.js';

/**
 * Audio processing class providing a fluent API for audio operations
 */
export class Audio {
  private processor: AudioProcessor;

  constructor(private data: Buffer) {
    this.processor = new AudioProcessor(data);
  }

  /**
   * Transcode the audio
   */
  async transcode(options: AudioTranscodeOptions): Promise<Audio> {
    const result = await this.processor.transcode(options);
    return new Audio(result.data!);
  }

  /**
   * Normalize the audio
   */
  async normalize(options: AudioNormalizeOptions): Promise<Audio> {
    const result = await this.processor.normalize(options);
    return new Audio(result.data!);
  }

  /**
   * Apply fade in/out
   */
  async fade(options: AudioFadeOptions): Promise<Audio> {
    const result = await this.processor.fade(options);
    return new Audio(result.data!);
  }

  /**
   * Mix multiple audio tracks
   */
  static async mix(options: AudioMixOptions): Promise<Audio> {
    const processor = new AudioProcessor(options.tracks[0]);
    const result = await processor.mix(options);
    return new Audio(result.data!);
  }

  /**
   * Apply audio filters
   */
  async filter(options: AudioFilterOptions): Promise<Audio> {
    const result = await this.processor.filter(options);
    return new Audio(result.data!);
  }

  /**
   * Get audio metadata
   */
  async getMetadata() {
    return this.processor.getMetadata();
  }

  /**
   * Get audio duration
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
   * Clone the audio
   */
  clone(): Audio {
    return new Audio(Buffer.from(this.data));
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create an Audio instance from a buffer
 */
export function createAudio(data: Buffer): Audio {
  return new Audio(data);
}

/**
 * Transcode audio
 */
export async function transcodeAudio(
  data: Buffer,
  options: AudioTranscodeOptions
): Promise<MediaProcessingResult> {
  const processor = new AudioProcessor(data);
  return processor.transcode(options);
}

/**
 * Normalize audio
 */
export async function normalizeAudio(
  data: Buffer,
  options: AudioNormalizeOptions
): Promise<MediaProcessingResult> {
  const processor = new AudioProcessor(data);
  return processor.normalize(options);
}

/**
 * Apply fade to audio
 */
export async function fadeAudio(
  data: Buffer,
  options: AudioFadeOptions
): Promise<MediaProcessingResult> {
  const processor = new AudioProcessor(data);
  return processor.fade(options);
}

/**
 * Mix audio tracks
 */
export async function mixAudio(
  options: AudioMixOptions
): Promise<MediaProcessingResult> {
  const processor = new AudioProcessor(options.tracks[0]);
  return processor.mix(options);
}

/**
 * Apply audio filters
 */
export async function filterAudio(
  data: Buffer,
  options: AudioFilterOptions
): Promise<MediaProcessingResult> {
  const processor = new AudioProcessor(data);
  return processor.filter(options);
}

/**
 * Get audio metadata
 */
export async function getAudioMetadata(data: Buffer) {
  const processor = new AudioProcessor(data);
  return processor.getMetadata();
}

/**
 * Get audio duration
 */
export async function getAudioDuration(data: Buffer): Promise<number> {
  const metadata = await getAudioMetadata(data);
  return metadata.duration;
}
