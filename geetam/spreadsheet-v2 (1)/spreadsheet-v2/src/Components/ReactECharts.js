// src/Components/ReactECharts.jsx
import React from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core'; // Import echarts core
// Import necessary charts and components from echarts
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register the charts and components you will use
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  LineChart,
  PieChart, // Add PieChart
  CanvasRenderer,
]);

const ReactECharts = ({ option, style, settings, loading, theme }) => {
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={style}
      settings={settings}
      loading={loading}
      theme={theme}
      notMerge={true} // Important to prevent merging options between updates
      lazyUpdate={true} // Optional: for performance
    />
  );
};

export default ReactECharts;