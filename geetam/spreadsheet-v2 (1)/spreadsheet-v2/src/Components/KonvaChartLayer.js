import React, {
  useEffect, useRef, useState, forwardRef, useImperativeHandle
} from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  ArcElement,
  PieController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, BarController,
  PointElement, LineElement, LineController,
  ArcElement, PieController,
  Title, Tooltip, Legend,
  ChartDataLabels
);

const ChartComponent = ({ chart, onSelect, onDragEnd, isLocked, setIsDragging }) => {
  const ref = useRef(null);
  const [img, setImg] = useState(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const { width, height } = chart.size;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ref.current) ref.current.destroy();

    ref.current = new ChartJS(ctx, {
      type: chart.type, data: chart.data,
      options: {
        responsive: false, maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: chart.title, font: { size: 14 } },
          tooltip: { enabled: true },
          datalabels: {
            display: true, color: 'black',
            formatter: (v, ctx) => chart.type === 'pie'
              ? `${v} (${((v / ctx.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)`
              : v
          }
        },
        scales: chart.type === 'pie' ? {} : {
          x: { beginAtZero: true, grid: { display: false } },
          y: { beginAtZero: true, grid: { display: true } }
        },
        animation: { duration: 0 }
      }
    });

    const image = new window.Image();
    image.src = canvas.toDataURL();
    image.onload = () => setImg(image);

    return () => {
      if (ref.current) ref.current.destroy();
    };
  }, [chart]);

  return (
    <Group
      x={chart.x} y={chart.y}
      draggable={!isLocked}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={e => {
        onDragEnd(chart.id, e.target.x(), e.target.y());
        setIsDragging(false);
      }}
      onClick={e => {
        setIsDragging(false);
        onSelect(chart.id);
        e.cancelBubble = true;
      }}
      onTap={e => {
        setIsDragging(false);
        onSelect(chart.id);
        e.cancelBubble = true;
      }}
    >
      <Rect
        width={chart.size.width} height={chart.size.height}
        fill="white"
        stroke={chart.isSelected ? '#3B82F6' : '#E5E7EB'}
        strokeWidth={chart.isSelected ? 2 : 1}
        shadowBlur={5} shadowColor="rgba(0,0,0,0.1)"
        shadowOffsetX={2} shadowOffsetY={2}
      />
      {img && (
        <Rect
          width={chart.size.width} height={chart.size.height}
          fillPatternImage={img}
        />
      )}
      {chart.isSelected && (
        ['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => {
          const [x, y] = {
            'top-left': [0, 0],
            'top-right': [chart.size.width - 8, 0],
            'bottom-left': [0, chart.size.height - 8],
            'bottom-right': [chart.size.width - 8, chart.size.height - 8],
          }[corner];
          return <Rect key={corner} x={x} y={y} width={8} height={8}
            fill="#3B82F6" stroke="white" strokeWidth={1} />;
        })
      )}
      {isLocked && (
        <Text x={chart.size.width - 20} y={5} text="🔒" fontSize={16} />
      )}
    </Group>
  );
};

const KonvaChartLayer = forwardRef(({
  charts,
  onSelectChart,
  onDragChartEnd,
  gridWidth,
  gridHeight,
  layers,
  scrollLeft,
  scrollTop
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef();

  const isLocked = id => layers.find(l => l.chartId === id)?.locked;

  const clearSelection = e => {
    // Only clear chart selection if clicking on empty space, not on grid cells
    if (e.target === e.target.getStage()) {
      onSelectChart(null);
    }
  };

  useImperativeHandle(ref, () => ({
    exitInteractionMode: () => {
      onSelectChart(null);
    }
  }));

  const sortedCharts = [...charts].sort((a, b) => {
    const oa = layers.find(l => l.chartId === a.id)?.order ?? 0;
    const ob = layers.find(l => l.chartId === b.id)?.order ?? 0;
    return oa - ob;
  });

  return (
    <Stage
      ref={stageRef}
      width={gridWidth}
      height={gridHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 2,
        pointerEvents: 'auto'
      }}
      onMouseDown={clearSelection}
      onTouchStart={clearSelection}
      onWheel={(e) => {
        const container = document.querySelector('.ReactVirtualized__Grid');
        if (container) {
          container.scrollTop += e.evt.deltaY;
          container.scrollLeft += e.evt.deltaX;
        }
      }}
    >
      <Layer x={-scrollLeft} y={-scrollTop} listening={true}>
        {sortedCharts.map((c) => (
          <ChartComponent
            key={c.id}
            chart={c}
            onSelect={onSelectChart}
            onDragEnd={onDragChartEnd}
            isLocked={isLocked(c.id)}
            setIsDragging={setIsDragging}
          />
        ))}
      </Layer>
    </Stage>
  );
});

export default KonvaChartLayer;