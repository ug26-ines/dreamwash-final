import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, sheet = true, center = false }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else       document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`modal-backdrop ${center ? 'center' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={sheet && !center ? 'modal-sheet' : 'modal-dialog'}>
        {sheet && !center && <div className="modal-handle" />}
        {title && (
          <div className="modal-header">
            <span className="modal-title">{title}</span>
            <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '0 0.5rem' }}>
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
