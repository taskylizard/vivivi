import { X } from 'lucide-react';
import type { Node } from './types';

interface NodePropertiesPanelProps {
  node: Node | null;
  onClose: () => void;
}

export const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  node,
  onClose,
}) => {
  if (!node) return null;

  return (
    <div className='fixed top-4 left-4 z-50 bg-neutral-3/90 backdrop-blur-md border border-neutral-7 rounded-xl p-4 min-w-80 max-w-md font-sans'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-lg font-semibold text-neutral-12'>
          Node Properties
        </h3>
        <button
          onClick={onClose}
          className='p-1 hover:bg-neutral-4 rounded-md transition-colors text-neutral-11 hover:text-neutral-12'
          aria-label='Close properties panel'
        >
          <X size={16} />
        </button>
      </div>

      <div className='space-y-3'>
        <div>
          <label className='text-sm font-medium text-neutral-11 block mb-1'>
            Type
          </label>
          <div className='flex items-center gap-2'>
            <span
              className='inline-block w-3 h-3 rounded-full'
              style={{
                backgroundColor: node.isExternal
                  ? 'rgb(var(--neutral-6))'
                  : 'rgb(var(--primary-9))',
              }}
            />
            <span className='text-sm text-neutral-12'>
              {node.isExternal ? 'External Link' : 'Internal Page'}
            </span>
          </div>
        </div>

        <div>
          <label className='text-sm font-medium text-neutral-11 block mb-1'>
            ID
          </label>
          <code className='text-sm bg-neutral-4 px-2 py-1 rounded text-neutral-12 break-all block'>
            {node.id}
          </code>
        </div>

        {node.text && (
          <div>
            <label className='text-sm font-medium text-neutral-11 block mb-1'>
              Display Text
            </label>
            <div className='text-sm bg-neutral-4 px-2 py-1 rounded text-neutral-12 break-words'>
              {node.text}
            </div>
          </div>
        )}

        {node.isExternal && (
          <div>
            <label className='text-sm font-medium text-neutral-11 block mb-1'>
              URL
            </label>
            <a
              href={node.id}
              target='_blank'
              rel='noopener noreferrer'
              className='text-sm text-primary-11 hover:text-primary-12 underline break-all block'
            >
              {node.id}
            </a>
          </div>
        )}

        {/* Debug info */}
        <details className='text-xs'>
          <summary className='text-neutral-11 cursor-pointer hover:text-neutral-12'>
            Debug Info
          </summary>
          <pre className='mt-2 bg-neutral-4 p-2 rounded text-neutral-12 overflow-auto text-xs'>
						{JSON.stringify(node, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};
