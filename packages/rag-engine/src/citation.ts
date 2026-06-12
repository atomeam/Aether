import { Citation, DocumentChunk, VectorSearchResult } from './types';

export class CitationTracker {
  private citations: Map<string, Citation> = new Map();

  addCitation(chunk: DocumentChunk, score: number): Citation {
    const citation: Citation = {
      id: this.generateId(),
      documentId: chunk.documentId,
      chunkId: chunk.id,
      text: chunk.content,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
      score
    };

    this.citations.set(citation.id, citation);
    return citation;
  }

  addCitationsFromSearch(results: VectorSearchResult[]): Citation[] {
    const citations: Citation[] = [];

    for (const result of results) {
      const citation = this.addCitation(result.document, result.score);
      citations.push(citation);
    }

    return citations;
  }

  getCitation(id: string): Citation | undefined {
    return this.citations.get(id);
  }

  getAllCitations(): Citation[] {
    return Array.from(this.citations.values());
  }

  getCitationsByDocument(documentId: string): Citation[] {
    return this.getAllCitations().filter((c) => c.documentId === documentId);
  }

  getCitationsByChunk(chunkId: string): Citation[] {
    return this.getAllCitations().filter((c) => c.chunkId === chunkId);
  }

  formatCitations(format: 'markdown' | 'html' | 'text' = 'markdown'): string {
    const citations = this.getAllCitations();

    if (citations.length === 0) {
      return '';
    }

    switch (format) {
      case 'markdown':
        return this.formatMarkdown(citations);
      case 'html':
        return this.formatHTML(citations);
      case 'text':
        return this.formatText(citations);
      default:
        return this.formatMarkdown(citations);
    }
  }

  private formatMarkdown(citations: Citation[]): string {
    let text = '\n\n**Sources:**\n\n';
    citations.forEach((citation, index) => {
      text += `${index + 1}. ${citation.text} [${citation.documentId}]\n`;
    });
    return text;
  }

  private formatHTML(citations: Citation[]): string {
    let text = '\n\n<div class="citations">\n  <h3>Sources:</h3>\n  <ol>\n';
    citations.forEach((citation) => {
      text += `    <li data-doc-id="${citation.documentId}">${citation.text}</li>\n`;
    });
    text += '  </ol>\n</div>';
    return text;
  }

  private formatText(citations: Citation[]): string {
    let text = '\n\nSources:\n';
    citations.forEach((citation, index) => {
      text += `\n${index + 1}. ${citation.text} (${citation.documentId})`;
    });
    return text;
  }

  clear(): void {
    this.citations.clear();
  }

  private generateId(): string {
    return `cit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
