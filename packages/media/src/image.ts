/**
 * @aether/media - Image Processing Module
 * 
 * High-level API for image processing operations.
 */

import type {
  ImageResizeOptions,
  ImageCropOptions,
  ImageRotateOptions,
  ImageFlipOptions,
  ImageBlurOptions,
  ImageSharpenOptions,
  ImageModulateOptions,
  ImageTintOptions,
  ImageGrayscaleOptions,
  ImageNormalizeOptions,
  ImageOptimizeOptions,
  ImageWatermarkOptions,
  ImageDimensions,
  MediaProcessingResult,
} from './types.js';
import { ImageProcessor } from './image-processor.js';

/**
 * Image processing class providing a fluent API for image operations
 */
export class Image {
  private processor: ImageProcessor;

  constructor(private data: Buffer) {
    this.processor = new ImageProcessor(data);
  }

  /**
   * Resize the image
   */
  async resize(options: ImageResizeOptions): Promise<Image> {
    const result = await this.processor.resize(options);
    return new Image(result.data!);
  }

  /**
   * Crop the image
   */
  async crop(options: ImageCropOptions): Promise<Image> {
    const result = await this.processor.crop(options);
    return new Image(result.data!);
  }

  /**
   * Rotate the image
   */
  async rotate(options: ImageRotateOptions): Promise<Image> {
    const result = await this.processor.rotate(options);
    return new Image(result.data!);
  }

  /**
   * Flip the image
   */
  async flip(options: ImageFlipOptions): Promise<Image> {
    const result = await this.processor.flip(options);
    return new Image(result.data!);
  }

  /**
   * Blur the image
   */
  async blur(options: ImageBlurOptions): Promise<Image> {
    const result = await this.processor.blur(options);
    return new Image(result.data!);
  }

  /**
   * Sharpen the image
   */
  async sharpen(options: ImageSharpenOptions): Promise<Image> {
    const result = await this.processor.sharpen(options);
    return new Image(result.data!);
  }

  /**
   * Modulate brightness, saturation, and hue
   */
  async modulate(options: ImageModulateOptions): Promise<Image> {
    const result = await this.processor.modulate(options);
    return new Image(result.data!);
  }

  /**
   * Tint the image
   */
  async tint(options: ImageTintOptions): Promise<Image> {
    const result = await this.processor.tint(options);
    return new Image(result.data!);
  }

  /**
   * Convert to grayscale
   */
  async grayscale(options: ImageGrayscaleOptions = {}): Promise<Image> {
    const result = await this.processor.grayscale(options);
    return new Image(result.data!);
  }

  /**
   * Normalize the image
   */
  async normalize(options: ImageNormalizeOptions = {}): Promise<Image> {
    const result = await this.processor.normalize(options);
    return new Image(result.data!);
  }

  /**
   * Add watermark
   */
  async watermark(options: ImageWatermarkOptions): Promise<Image> {
    const result = await this.processor.watermark(options);
    return new Image(result.data!);
  }

  /**
   * Optimize the image
   */
  async optimize(options: ImageOptimizeOptions): Promise<Image> {
    const result = await this.processor.optimize(options);
    return new Image(result.data!);
  }

  /**
   * Get image metadata
   */
  async getMetadata() {
    return this.processor.getMetadata();
  }

  /**
   * Get image dimensions
   */
  async getDimensions(): Promise<ImageDimensions> {
    const metadata = await this.getMetadata();
    return {
      width: metadata.width!,
      height: metadata.height!,
    };
  }

  /**
   * Convert to buffer
   */
  toBuffer(): Buffer {
    return this.data;
  }

  /**
   * Convert to base64
   */
  toBase64(): string {
    return this.data.toString('base64');
  }

  /**
   * Clone the image
   */
  clone(): Image {
    return new Image(Buffer.from(this.data));
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create an Image instance from a buffer
 */
export function createImage(data: Buffer): Image {
  return new Image(data);
}

/**
 * Resize an image
 */
export async function resizeImage(
  data: Buffer,
  options: ImageResizeOptions
): Promise<MediaProcessingResult> {
  const processor = new ImageProcessor(data);
  return processor.resize(options);
}

/**
 * Crop an image
 */
export async function cropImage(
  data: Buffer,
  options: ImageCropOptions
): Promise<MediaProcessingResult> {
  const processor = new ImageProcessor(data);
  return processor.crop(options);
}

/**
 * Rotate an image
 */
export async function rotateImage(
  data: Buffer,
  options: ImageRotateOptions
): Promise<MediaProcessingResult> {
  const processor = new ImageProcessor(data);
  return processor.rotate(options);
}

/**
 * Flip an image
 */
export async function flipImage(
  data: Buffer,
  options: ImageFlipOptions
): Promise<MediaProcessingResult> {
  const processor = new ImageProcessor(data);
  return processor.flip(options);
}

/**
 * Blur an image
 */
export async function blurImage(
  data: Buffer,
  options: ImageBlurOptions
): Promise<MediaProcessingResult> {
  const processor = new ImageProcessor(data);
  return processor.blur(options);
}

/**
 * Sharpen an image
 */
export async function sharpenImage(
  data: Buffer,
  options: ImageSharpenOptions
): Promise<MediaProcessingResult> {
  const processor = new ImageProcessor(data);
  return processor.sharpen(options);
}

/**
 * Modulate an image
 */
export async function modulateImage(
  data: Buffer,
  options: ImageModulateOptions
): Promise<MediaProcessingResult> {
  const processor = new ImageProcessor(data);
  return processor.modulate(options);
}

/**
 * Tint an image
 */
export async function tintImage(
  data: Buffer,
  options: ImageTintOptions
): Promise<MediaProcessingResult> {
  const processor = new ImageProcessor(data);
  return processor.tint(options);
}

/**
 * Convert image to grayscale
 */
export async function grayscaleImage(
  data: Buffer,
  options: ImageGrayscaleOptions = {}
): Promise<MediaProcessingResult> {
  const processor = new ImageProcessor(data);
  return processor.grayscale(options);
}

/**
 * Normalize an image
 */
export async function normalizeImage(
  data: Buffer,
  options: ImageNormalizeOptions = {}
): Promise<MediaProcessingResult> {
  const processor = new ImageProcessor(data);
  return processor.normalize(options);
}

/**
 * Add watermark to image
 */
export async function watermarkImage(
  data: Buffer,
  options: ImageWatermarkOptions
): Promise<MediaProcessingResult> {
  const processor = new ImageProcessor(data);
  return processor.watermark(options);
}

/**
 * Optimize an image
 */
export async function optimizeImage(
  data: Buffer,
  options: ImageOptimizeOptions
): Promise<MediaProcessingResult> {
  const processor = new ImageProcessor(data);
  return processor.optimize(options);
}

/**
 * Get image metadata
 */
export async function getImageMetadata(data: Buffer) {
  const processor = new ImageProcessor(data);
  return processor.getMetadata();
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(data: Buffer): Promise<ImageDimensions> {
  const metadata = await getImageMetadata(data);
  return {
    width: metadata.width!,
    height: metadata.height!,
  };
}
