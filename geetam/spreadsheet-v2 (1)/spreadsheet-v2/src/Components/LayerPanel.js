// Components/LayerPanel.js
import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const LayerItem = ({ layer, index, onVisibilityToggle, onLockToggle, onDelete, onRename, moveLayer }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);

  const [{ isDragging }, drag] = useDrag({
    type: 'layer',
    item: { index, id: layer.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'layer',
    hover: (item) => {
  const dragIndex = item.index;
  const hoverIndex = index;
  if (dragIndex === hoverIndex) return;

  moveLayer(dragIndex, hoverIndex);
  item.index = hoverIndex;
},

    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleRename = () => {
    if (editName.trim() && editName !== layer.name) {
      onRename(layer.id, editName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(layer.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`
        flex items-center justify-between p-2 border-b border-gray-200
        ${isDragging ? 'opacity-50' : ''}
        ${isOver ? 'bg-blue-50' : 'bg-white'}
        hover:bg-gray-50 cursor-move
      `}
    >
      <div className="flex items-center space-x-2 flex-grow">
        {/* Layer Type Icon */}
        <span className="text-gray-500">
          {layer.type === 'grid' ? '⊞' : layer.type === 'chart' ? '📊' : '✍️'}
        </span>

        {/* Layer Name */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="px-1 py-0.5 border border-blue-400 rounded text-sm flex-grow"
            autoFocus
          />
        ) : (
          <span
            className="text-sm flex-grow cursor-text"
            onDoubleClick={() => layer.type !== 'grid' && setIsEditing(true)}
          >
            {layer.name}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-1">
        {/* Visibility Toggle */}
        <button
          onClick={() => onVisibilityToggle(layer.id)}
          className="p-1 hover:bg-gray-200 rounded"
          title={layer.visible ? "Hide layer" : "Show layer"}
        >
          {layer.visible ? '👁️' : '🚫'}
        </button>

        {/* Lock Toggle */}
        <button
          onClick={() => onLockToggle(layer.id)}
          className="p-1 hover:bg-gray-200 rounded"
          title={layer.locked ? "Unlock layer" : "Lock layer"}
        >
          {layer.locked ? '🔒' : '🔓'}
        </button>

        {/* Delete Button (not for grid layer) */}
        {layer.type !== 'grid' && (
          <button
            onClick={() => onDelete(layer.id)}
            className="p-1 hover:bg-red-100 rounded text-red-600"
            title="Delete layer"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

const LayerPanel = ({ layers, onVisibilityToggle, onLockToggle, onReorder, onDelete, onRename }) => {
  const sortedLayers = [...layers].sort((a, b) => b.order - a.order);

  return (
    <div className="w-64 bg-white border-l border-gray-300 shadow-lg flex flex-col">
      <div className="p-3 border-b border-gray-300 bg-gray-50">
        <h3 className="font-semibold text-gray-700">Layers</h3>
      </div>

      <div className="flex-grow overflow-y-auto">
        <DndProvider backend={HTML5Backend}>
          {sortedLayers.map((layer, index) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              // The index prop for LayerItem should be its position in the currently sorted (visible) list, not the original 'layers' state
              index={index}
              onVisibilityToggle={onVisibilityToggle}
              onLockToggle={onLockToggle}
              onDelete={onDelete}
              onRename={onRename}
              moveLayer={onReorder}
            />
          ))}
        </DndProvider>
      </div>

      <div className="p-3 border-t border-gray-300 bg-gray-50 text-xs text-gray-600">
        <p>• Drag to reorder layers</p>
        <p>• Double-click to rename</p>
        <p>• Top layers appear above others</p>
      </div>
    </div>
  );
};

export default LayerPanel;