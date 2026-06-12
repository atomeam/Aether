/**
 * @aether/slug-generator - Slug Generator
 */

export class SlugGenerator {
  generate(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}

export const slugGenerator = new SlugGenerator();