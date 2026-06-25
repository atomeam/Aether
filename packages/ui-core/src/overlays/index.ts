/**
 * Overlay components module
 * Contains overlay/modal UI component types and schemas
 */

// Re-export overlay types
export interface OverlayProps {
  isOpen: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export interface ModalProps extends OverlayProps {
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
}
