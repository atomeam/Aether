import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useBrain } from '../lib/brain-context';

interface CaptureEditorProps {
  onSave?: (nodeId: string) => void;
  initialContent?: string;
  initialTitle?: string;
  editNodeId?: string;
}

export function CaptureEditor({ onSave, initialContent = '', initialTitle = '', editNodeId }: CaptureEditorProps) {
  const { createNode, updateNode, nodes } = useBrain();
  const existingNode = editNodeId ? nodes.find((n) => n.id === editNodeId) : undefined;

  const [title, setTitle] = useState(existingNode?.title || initialTitle);
  const [content, setContent] = useState(existingNode?.content || initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (existingNode) {
      setTitle(existingNode.title);
      setContent(existingNode.content);
    }
  }, [existingNode]);

  useEffect(() => {
    if (textareaRef.current && !initialContent && !editNodeId) {
      textareaRef.current.focus();
    }
  }, []);

  // Ctrl+S save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [title, content, editNodeId]);

  const handleSave = useCallback(async () => {
    if (!content.trim()) return;
    setSaving(true);

    try {
      if (editNodeId) {
        await updateNode(editNodeId, { title: title.trim() || 'Untitled', content });
      } else {
        const node = await createNode(title.trim() || 'Untitled', content);
        onSave?.(node.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [title, content, editNodeId, createNode, updateNode, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setContent('');
      setTitle('');
      textareaRef.current?.focus();
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#050608] text-[#e0e0e0] font-sans">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5">
        <input
          type="text"
          placeholder="Untitled note"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-transparent border-none text-sm text-white/90 font-mono tracking-tight outline-none placeholder:text-white/20"
          aria-label="Note title"
        />
        <div className="flex items-center gap-3">
          {saved && (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-[#2cffc0] uppercase tracking-widest"
            >
              Saved locally
            </motion.span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className={cn(
              'px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold border transition-all cursor-pointer',
              saving || !content.trim()
                ? 'border-white/10 text-white/20 cursor-not-allowed'
                : 'border-[#2cffc0]/30 text-[#2cffc0] hover:bg-[#2cffc0]/10'
            )}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start typing... #tag [[link]] Markdown is your interface."
          className="w-full h-full bg-transparent border-none text-sm text-white/80 font-mono leading-relaxed p-6 resize-none outline-none placeholder:text-white/15"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect={false}
        />

        <div className="absolute bottom-4 right-6 flex items-center gap-4 text-[9px] text-white/20 font-mono">
          <span>{content.split('\n').length} lines</span>
          <span>{content.length} chars</span>
          <span className="text-white/10">Ctrl+S to save · Esc to clear</span>
        </div>
      </div>
    </div>
  );
}
