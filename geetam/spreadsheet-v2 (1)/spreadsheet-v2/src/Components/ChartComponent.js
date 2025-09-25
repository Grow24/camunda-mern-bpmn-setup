// Components/ChartComponent.js
import React, { useRef, useEffect } from 'react';
import { Rect, Group } from 'react-konva';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const ChartComponent = ({ chart, onSelectChart, onDragChartEnd }) => {
  const groupRef = useRef();

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.getLayer()?.batchDraw();
    }
  }, [chart.data, chart.type, chart.x, chart.y, chart.size, chart.isSelected]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: chart.title,
        font: { size: 14 }
      },
      legend: {
        display: true,
        position: chart.type === 'pie' ? 'right' : 'top',
        labels: { font: { size: 10 } }
      },
      tooltip: { enabled: true }
    },
    animation: { duration: 0 },
    scales: chart.type !== 'pie' ? {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 10 } } }
    } : {}
  };

  return (
    <Group
      ref={groupRef}
      x={chart.x}
      y={chart.y}
      draggable // This makes the Group interactive (and thus receives pointer events)
      onClick={(e) => {
        if (!e.target.isDragging()) {
          onSelectChart(chart.id);
        }
      }}
      onDragEnd={(e) => {
        onDragChartEnd(chart.id, e.target.x(), e.target.y());
      }}
      style={{ pointerEvents: 'auto' }}
    >
      <Rect
        width={chart.size.width}
        height={chart.size.height}
        fill="white"
        stroke={chart.isSelected ? 'blue' : 'gray'}
        strokeWidth={chart.isSelected ? 3 : 1}
        shadowBlur={5}
        cornerRadius={5}
      />
      <foreignObject
        x={0}
        y={0}
        width={chart.size.width}
        height={chart.size.height}
      >
        {chart.type === 'bar' && (
          <Bar data={chart.data} options={chartOptions} width={chart.size.width} height={chart.size.height} />
        )}
        {chart.type === 'pie' && (
          <Pie data={chart.data} options={chartOptions} width={chart.size.width} height={chart.size.height} />
        )}
        {chart.type === 'line' && (
          <Line data={chart.data} options={chartOptions} width={chart.size.width} height={chart.size.height} />
        )}
      </foreignObject>
      {chart.isSelected && (
        <Rect
          x={0}
          y={0}
          width={chart.size.width}
          height={chart.size.height}
          stroke="blue"
          strokeWidth={3}
          dash={[10, 5]}
        />
      )}
    </Group>
  );
};

export default ChartComponent;