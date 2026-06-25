/**
 * Rich Text Editor Type Definitions
 * Defines types for the rich text editor integration
 */

export interface RichTextContent {
  type?: 'doc';
  content?: RichTextNode[];
}

export type RichTextNode =
  | RichTextParagraph
  | RichTextHeading
  | RichTextBlockquote
  | RichTextCodeBlock
  | RichTextBulletList
  | RichTextOrderedList
  | RichTextListItem
  | RichTextHorizontalRule
  | RichTextImage
  | RichTextVideo;

export interface RichTextParagraph {
  type?: 'paragraph';
  content?: RichTextInline[];
  attrs?: Record<string, unknown>;
}

export interface RichTextHeading {
  type?: 'heading';
  attrs?: { level?: 1 | 2 | 3 | 4 | 5 | 6 };
  content?: RichTextInline[];
}

export interface RichTextBlockquote {
  type?: 'blockquote';
  content?: RichTextNode[];
}

export interface RichTextCodeBlock {
  type?: 'codeBlock';
  attrs?: { language?: string };
  content?: RichTextInline[];
}

export interface RichTextBulletList {
  type?: 'bulletList';
  content?: RichTextListItem[];
}

export interface RichTextOrderedList {
  type?: 'orderedList';
  attrs?: { start?: number };
  content?: RichTextListItem[];
}

export interface RichTextListItem {
  type?: 'listItem';
  content?: RichTextNode[];
}

export interface RichTextHorizontalRule {
  type?: 'horizontalRule';
}

export interface RichTextImage {
  type?: 'image';
  attrs?: {
    src?: string;
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
  };
}

export interface RichTextVideo {
  type?: 'video';
  attrs?: {
    src?: string;
    width?: number;
    height?: number;
    autoplay?: boolean;
    controls?: boolean;
    loop?: boolean;
  };
}

export type RichTextInline =
  | RichTextText
  | RichTextBold
  | RichTextItalic
  | RichTextUnderline
  | RichTextStrike
  | RichTextCode
  | RichTextLink
  | RichTextHardBreak;

export interface RichTextText {
  type?: 'text';
  text?: string;
  marks?: RichTextMark[];
}

export interface RichTextBold {
  type?: 'text';
  text?: string;
  marks?: [{ type?: 'bold' }];
}

export interface RichTextItalic {
  type?: 'text';
  text?: string;
  marks?: [{ type?: 'italic' }];
}

export interface RichTextUnderline {
  type?: 'text';
  text?: string;
  marks?: [{ type?: 'underline' }];
}

export interface RichTextStrike {
  type?: 'text';
  text?: string;
  marks?: [{ type?: 'strike' }];
}

export interface RichTextCode {
  type?: 'text';
  text?: string;
  marks?: [{ type?: 'code' }];
}

export interface RichTextLink {
  type?: 'text';
  text?: string;
  marks?: [{ type?: 'link', attrs?: { href?: string; target?: string } }];
}

export interface RichTextHardBreak {
  type?: 'hardBreak';
}

export type RichTextMark =
  | { type?: 'bold' }
  | { type?: 'italic' }
  | { type?: 'underline' }
  | { type?: 'strike' }
  | { type?: 'code' }
  | { type?: 'link'; attrs?: { href?: string; target?: string } };

export interface EditorConfig {
  features?: EditorFeature[];
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  readOnly?: boolean;
  spellCheck?: boolean;
}

export type EditorFeature =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'heading'
  | 'blockquote'
  | 'code-block'
  | 'bullet-list'
  | 'ordered-list'
  | 'link'
  | 'image'
  | 'video'
  | 'horizontal-rule'
  | 'table'
  | 'undo'
  | 'redo';
