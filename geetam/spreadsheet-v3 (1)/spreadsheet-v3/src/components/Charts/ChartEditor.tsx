// import React, { useState } from 'react';
// import { useSpreadsheetStore } from '../../stores/spreadsheetStore';
// import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// interface ChartEditorProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export const ChartEditor: React.FC<ChartEditorProps> = ({ isOpen, onClose }) => {
//   const { sheets, activeSheet, addChart, theme } = useSpreadsheetStore();
  
//   const [chartType, setChartType] = useState<'line' | 'bar' | 'column' | 'pie' | 'scatter'>('line');
//   const [dataRange, setDataRange] = useState('A1:B10');
//   const [chartTitle, setChartTitle] = useState('');
//   const [colors, setColors] = useState(['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00']);

//   const parseDataRange = (range: string) => {
//     // Simple parser for A1:B10 format
//     const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
//     if (!match) return [];

//     const [, startCol, startRow, endCol, endRow] = match;
//     const data = [];
    
//     // Convert column letters to numbers
//     const colToNum = (col: string) => {
//       let result = 0;
//       for (let i = 0; i < col.length; i++) {
//         result = result * 26 + (col.charCodeAt(i) - 65 + 1);
//       }
//       return result - 1;
//     };

//     const startColNum = colToNum(startCol);
//     const endColNum = colToNum(endCol);
//     const startRowNum = parseInt(startRow) - 1;
//     const endRowNum = parseInt(endRow) - 1;

//     for (let row = startRowNum; row <= endRowNum; row++) {
//       const rowData: any = {};
//       for (let col = startColNum; col <= endColNum; col++) {
//         const cell = sheets[activeSheet]?.[row]?.[col];
//         const colName = String.fromCharCode(65 + col - startColNum);
//         rowData[colName] = cell?.value || '';
//       }
//       data.push(rowData);
//     }

//     return data;
//   };

//   const chartData = parseDataRange(dataRange);

//   const renderChart = () => {
//     if (chartData.length === 0) return null;

//     const commonProps = {
//       width: 400,
//       height: 300,
//       data: chartData,
//     };

//     switch (chartType) {
//       case 'line':
//         return (
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart {...commonProps}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="A" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Line type="monotone" dataKey="B" stroke={colors[0]} />
//             </LineChart>
//           </ResponsiveContainer>
//         );
      
//       case 'bar':
//       case 'column':
//         return (
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart {...commonProps}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="A" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="B" fill={colors[0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         );
      
//       case 'pie':
//         return (
//           <ResponsiveContainer width="100%" height={300}>
//             <PieChart>
//               <Pie
//                 data={chartData}
//                 cx="50%"
//                 cy="50%"
//                 labelLine={false}
//                 outerRadius={80}
//                 fill="#8884d8"
//                 dataKey="B"
//                 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//               >
//                 {chartData.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
//                 ))}
//               </Pie>
//               <Tooltip />
//             </PieChart>
//           </ResponsiveContainer>
//         );
      
//       default:
//         return null;
//     }
//   };

//   const handleCreateChart = () => {
//     const chart = {
//       id: `chart-${Date.now()}`,
//       type: chartType,
//       dataRange,
//       position: { x: 100, y: 100 },
//       size: { width: 400, height: 300 },
//       title: chartTitle,
//       colors
//     };

//     addChart(chart);
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className={`rounded-lg p-6 w-3/4 max-w-4xl max-h-3/4 overflow-auto ${
//         theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
//       }`}>
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold">Create Chart</h2>
//           <button
//             onClick={onClose}
//             className={`text-gray-500 hover:text-gray-700 ${
//               theme === 'dark' ? 'hover:text-gray-300' : ''
//             }`}
//           >
//             ✕
//           </button>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Chart Configuration */}
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium mb-2">Chart Type</label>
//               <select
//                 value={chartType}
//                 onChange={(e) => setChartType(e.target.value as any)}
//                 className={`w-full p-2 border rounded ${
//                   theme === 'dark' 
//                     ? 'bg-gray-700 border-gray-600 text-white' 
//                     : 'bg-white border-gray-300 text-gray-900'
//                 }`}
//               >
//                 <option value="line">Line Chart</option>
//                 <option value="bar">Bar Chart</option>
//                 <option value="column">Column Chart</option>
//                 <option value="pie">Pie Chart</option>
//                 <option value="scatter">Scatter Plot</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-2">Data Range</label>
//               <input
//                 type="text"
//                 value={dataRange}
//                 onChange={(e) => setDataRange(e.target.value)}
//                 placeholder="A1:B10"
//                 className={`w-full p-2 border rounded ${
//                   theme === 'dark' 
//                     ? 'bg-gray-700 border-gray-600 text-white' 
//                     : 'bg-white border-gray-300 text-gray-900'
//                 }`}
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-2">Chart Title</label>
//               <input
//                 type="text"
//                 value={chartTitle}
//                 onChange={(e) => setChartTitle(e.target.value)}
//                 placeholder="Enter chart title"
//                 className={`w-full p-2 border rounded ${
//                   theme === 'dark' 
//                     ? 'bg-gray-700 border-gray-600 text-white' 
//                     : 'bg-white border-gray-300 text-gray-900'
//                 }`}
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-2">Colors</label>
//               <div className="flex gap-2">
//                 {colors.map((color, index) => (
//                   <input
//                     key={index}
//                     type="color"
//                     value={color}
//                     onChange={(e) => {
//                       const newColors = [...colors];
//                       newColors[index] = e.target.value;
//                       setColors(newColors);
//                     }}
//                     className="w-8 h-8 border rounded cursor-pointer"
//                   />
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Chart Preview */}
//           <div>
//             <h3 className="text-lg font-medium mb-4">Preview</h3>
//             <div className={`border rounded p-4 ${
//               theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
//             }`}>
//               {chartTitle && (
//                 <h4 className="text-center font-medium mb-4">{chartTitle}</h4>
//               )}
//               {renderChart()}
//             </div>
//           </div>
//         </div>

//         <div className="flex justify-end gap-2 mt-6">
//           <button
//             onClick={onClose}
//             className={`px-4 py-2 border rounded hover:bg-gray-50 ${
//               theme === 'dark' 
//                 ? 'border-gray-600 text-white hover:bg-gray-700' 
//                 : 'border-gray-300 text-gray-700'
//             }`}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleCreateChart}
//             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//           >
//             Create Chart
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };





































import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSpreadsheetStore } from '../../stores/spreadsheetStore';
import * as echarts from 'echarts/core';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  PolarComponent,
  RadarComponent,
} from 'echarts/components';
import {
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  HeatmapChart,
  TreemapChart,
  SunburstChart,
  RadarChart,
  GaugeChart,
  FunnelChart,
  BoxplotChart,
} from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

// Register ECharts components
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  PolarComponent,
  RadarComponent,
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  HeatmapChart,
  TreemapChart,
  SunburstChart,
  RadarChart,
  GaugeChart,
  FunnelChart,
  BoxplotChart,
  CanvasRenderer,
]);

interface ChartEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'treemap' | 
  'sunburst' | 'radar' | 'gauge' | 'funnel' | 'boxplot' | 'metric' | 
  'area' | 'stacked-bar' | 'stacked-area';

type AggregationType = 'sum' | 'average' | 'count' | 'min' | 'max' | 'median';

interface DataSeries {
  id: string;
  column: string;
  label: string;
  color: string;
  aggregation: AggregationType;
  type?: 'line' | 'bar' | 'scatter';
  yAxisIndex?: number;
  stack?: string;
}

interface AxisConfig {
  type: 'value' | 'category' | 'time' | 'log';
  label: string;
  min?: number | 'auto';
  max?: number | 'auto';
  scale?: boolean;
}

export const ChartEditor: React.FC<ChartEditorProps> = ({ isOpen, onClose }) => {
  const { sheets, activeSheet, addChart, theme } = useSpreadsheetStore();
  
  const [chartType, setChartType] = useState<ChartType>('line');
  const [dataRange, setDataRange] = useState('A1:D10');
  const [chartTitle, setChartTitle] = useState('');
  const [xAxisColumn, setXAxisColumn] = useState('');
  const [xAxisConfig, setXAxisConfig] = useState<AxisConfig>({
    type: 'category',
    label: '',
    scale: false
  });
  const [yAxisConfig, setYAxisConfig] = useState<AxisConfig>({
    type: 'value',
    label: '',
    min: 'auto',
    max: 'auto',
    scale: false
  });
  const [dataSeries, setDataSeries] = useState<DataSeries[]>([
    { id: '1', column: '', label: '', color: '#5470c6', aggregation: 'sum' }
  ]);
  const [showLegend, setShowLegend] = useState(true);
  const [showToolbox, setShowToolbox] = useState(true);
  const [showDataZoom, setShowDataZoom] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [colorScheme, setColorScheme] = useState<string[]>([
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
  ]);
  const [metricFormat, setMetricFormat] = useState<'number' | 'currency' | 'percentage'>('number');
  const [metricPrefix, setMetricPrefix] = useState('');
  const [metricSuffix, setMetricSuffix] = useState('');

  // Parse columns from data range
  useEffect(() => {
    const columns = parseColumns(dataRange);
    setAvailableColumns(columns);
    if (columns.length > 0 && !xAxisColumn) {
      setXAxisColumn(columns[0]);
    }
    if (columns.length > 1 && dataSeries[0].column === '') {
      setDataSeries([{
        ...dataSeries[0],
        column: columns[1],
        label: columns[1]
      }]);
    }
  }, [dataRange]);

  const parseColumns = (range: string): string[] => {
    const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
    if (!match) return [];

    const [, startCol, , endCol] = match;
    const columns: string[] = [];
    
    const colToNum = (col: string) => {
      let result = 0;
      for (let i = 0; i < col.length; i++) {
        result = result * 26 + (col.charCodeAt(i) - 65 + 1);
      }
      return result - 1;
    };

    const numToCol = (num: number) => {
      let result = '';
      while (num >= 0) {
        result = String.fromCharCode(65 + (num % 26)) + result;
        num = Math.floor(num / 26) - 1;
      }
      return result;
    };

    const startColNum = colToNum(startCol);
    const endColNum = colToNum(endCol);

    for (let col = startColNum; col <= endColNum; col++) {
      columns.push(numToCol(col));
    }

    return columns;
  };

  const parseDataForChart = useMemo(() => {
    const match = dataRange.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
    if (!match) return { data: [], categories: [] };

    const [, startCol, startRow, endCol, endRow] = match;
    const data: any[] = [];
    const categories: string[] = [];
    
    const colToNum = (col: string) => {
      let result = 0;
      for (let i = 0; i < col.length; i++) {
        result = result * 26 + (col.charCodeAt(i) - 65 + 1);
      }
      return result - 1;
    };

    const startColNum = colToNum(startCol);
    const endColNum = colToNum(endCol);
    const startRowNum = parseInt(startRow) - 1;
    const endRowNum = parseInt(endRow) - 1;

    // Check if first row has headers
    const firstRowHasHeaders = sheets[activeSheet]?.[startRowNum]?.some(
      (cell: any, col: number) => col >= startColNum && col <= endColNum && isNaN(Number(cell?.value))
    );

    const dataStartRow = firstRowHasHeaders ? startRowNum + 1 : startRowNum;

    // Parse data
    for (let row = dataStartRow; row <= endRowNum; row++) {
      const rowData: any = {};
      for (let col = startColNum; col <= endColNum; col++) {
        const cell = sheets[activeSheet]?.[row]?.[col];
        const colLetter = String.fromCharCode(65 + col - startColNum);
        const value = cell?.value || '';
        rowData[colLetter] = isNaN(Number(value)) ? value : Number(value);
      }
      data.push(rowData);
      
      // Collect categories from xAxis column
      if (xAxisColumn && rowData[xAxisColumn] !== undefined) {
        categories.push(String(rowData[xAxisColumn]));
      }
    }

    return { data, categories };
  }, [dataRange, sheets, activeSheet, xAxisColumn]);

  const addDataSeries = () => {
    const newSeries: DataSeries = {
      id: Date.now().toString(),
      column: availableColumns.find(col => col !== xAxisColumn) || '',
      label: '',
      color: colorScheme[dataSeries.length % colorScheme.length],
      aggregation: 'sum',
      type: chartType === 'line' ? 'line' : 'bar'
    };
    setDataSeries([...dataSeries, newSeries]);
  };

  const removeDataSeries = (id: string) => {
    if (dataSeries.length > 1) {
      setDataSeries(dataSeries.filter(series => series.id !== id));
    }
  };

  const updateDataSeries = (id: string, field: keyof DataSeries, value: any) => {
    setDataSeries(dataSeries.map(series => 
      series.id === id ? { ...series, [field]: value } : series
    ));
  };

  const formatMetricValue = (value: number) => {
    switch (metricFormat) {
      case 'currency':
        return `${metricPrefix}${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value)}${metricSuffix}`;
      case 'percentage':
        return `${metricPrefix}${(value * 100).toFixed(2)}%${metricSuffix}`;
      default:
        return `${metricPrefix}${new Intl.NumberFormat().format(value)}${metricSuffix}`;
    }
  };

  const generateEChartsOption = () => {
    const { data, categories } = parseDataForChart;
    
    if (data.length === 0 && chartType !== 'metric') return {};

    const baseOption: any = {
      title: {
        text: chartTitle,
        left: 'center',
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#333'
        }
      },
      tooltip: {
        trigger: chartType === 'pie' || chartType === 'sunburst' ? 'item' : 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: showLegend ? {
        bottom: 0,
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#333'
        }
      } : undefined,
      toolbox: showToolbox ? {
        feature: {
          saveAsImage: {},
          restore: {},
          dataView: {},
          dataZoom: {},
          magicType: {
            type: ['line', 'bar', 'stack']
          }
        }
      } : undefined,
      dataZoom: showDataZoom ? [
        {
          type: 'slider',
          show: true,
          start: 0,
          end: 100
        },
        {
          type: 'inside',
          start: 0,
          end: 100
        }
      ] : undefined,
      color: colorScheme,
    };

    // Generate specific chart options based on type
    switch (chartType) {
      case 'line':
      case 'area':
        return {
          ...baseOption,
          xAxis: {
            type: xAxisConfig.type,
            data: xAxisConfig.type === 'category' ? categories : undefined,
            name: xAxisConfig.label,
            nameLocation: 'middle',
            nameGap: 30,
            axisLabel: {
              color: theme === 'dark' ? '#fff' : '#333'
            }
          },
          yAxis: {
            type: yAxisConfig.type,
            name: yAxisConfig.label,
            nameLocation: 'middle',
            nameGap: 50,
            min: yAxisConfig.min === 'auto' ? undefined : yAxisConfig.min,
            max: yAxisConfig.max === 'auto' ? undefined : yAxisConfig.max,
            scale: yAxisConfig.scale,
            axisLabel: {
              color: theme === 'dark' ? '#fff' : '#333'
            }
          },
          series: dataSeries.map(s => ({
            name: s.label || s.column,
            type: 'line',
            data: data.map(d => d[s.column]),
            itemStyle: { color: s.color },
            areaStyle: chartType === 'area' ? { opacity: 0.7 } : undefined,
            smooth: true,
            emphasis: {
              focus: 'series'
            }
          }))
        };

      case 'bar':
      case 'stacked-bar':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: categories,
            name: xAxisConfig.label,
            nameLocation: 'middle',
            nameGap: 30,
            axisLabel: {
              color: theme === 'dark' ? '#fff' : '#333'
            }
          },
          yAxis: {
            type: 'value',
            name: yAxisConfig.label,
            nameLocation: 'middle',
            nameGap: 50,
            min: yAxisConfig.min === 'auto' ? undefined : yAxisConfig.min,
            max: yAxisConfig.max === 'auto' ? undefined : yAxisConfig.max,
            scale: yAxisConfig.scale,
            axisLabel: {
              color: theme === 'dark' ? '#fff' : '#333'
            }
          },
          series: dataSeries.map(s => ({
            name: s.label || s.column,
            type: 'bar',
            data: data.map(d => d[s.column]),
            itemStyle: { color: s.color },
            stack: chartType === 'stacked-bar' ? 'total' : undefined,
            emphasis: {
              focus: 'series'
            }
          }))
        };

      case 'scatter':
        return {
          ...baseOption,
          xAxis: {
            type: 'value',
            name: xAxisConfig.label,
            scale: true
          },
          yAxis: {
            type: 'value',
            name: yAxisConfig.label,
            scale: true
          },
          series: [{
            name: dataSeries[0]?.label || 'Data',
            type: 'scatter',
            data: data.map(d => [d[xAxisColumn], d[dataSeries[0]?.column]]),
            symbolSize: 10,
            itemStyle: {
              color: dataSeries[0]?.color
            }
          }]
        };

      case 'pie':
        return {
          ...baseOption,
          series: [{
            name: dataSeries[0]?.label || 'Data',
            type: 'pie',
            radius: '50%',
            data: data.map(d => ({
              value: d[dataSeries[0]?.column],
              name: d[xAxisColumn]
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        };

      case 'heatmap':
        const heatmapData: any[] = [];
        const yCategories = categories;
        const xCategories = availableColumns.filter(col => col !== xAxisColumn);
        
        // Create heatmap data in the format [x, y, value]
        data.forEach((row, yIndex) => {
          xCategories.forEach((col, xIndex) => {
            const value = row[col] || 0;
            heatmapData.push([xIndex, yIndex, value]);
          });
        });

        const maxValue = Math.max(...heatmapData.map(d => d[2]));
        const minValue = Math.min(...heatmapData.map(d => d[2]));

        return {
          ...baseOption,
          tooltip: {
            position: 'top'
          },
          grid: {
            height: '50%',
            top: '10%'
          },
          xAxis: {
            type: 'category',
            data: xCategories,
            splitArea: {
              show: true
            }
          },
          yAxis: {
            type: 'category',
            data: yCategories,
            splitArea: {
              show: true
            }
          },
          visualMap: {
            min: minValue,
            max: maxValue,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '15%',
            inRange: {
              color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
            }
          },
          series: [{
            name: 'Heatmap',
            type: 'heatmap',
            data: heatmapData,
            label: {
              show: true
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        };

      case 'treemap':
        return {
          ...baseOption,
          series: [{
            type: 'treemap',
            data: data.map(d => ({
              name: d[xAxisColumn],
              value: d[dataSeries[0]?.column]
            })),
            leafDepth: 1,
            roam: false,
            label: {
              show: true,
              formatter: '{b}: {c}'
            },
            itemStyle: {
              borderColor: '#fff'
            },
            levels: [
              {
                itemStyle: {
                  borderWidth: 0,
                  gapWidth: 5
                }
              }
            ]
          }]
        };

      case 'sunburst':
        return {
          ...baseOption,
          series: [{
            type: 'sunburst',
            data: data.map(d => ({
              name: d[xAxisColumn],
              value: d[dataSeries[0]?.column],
              itemStyle: {
                color: colorScheme[Math.floor(Math.random() * colorScheme.length)]
              }
            })),
            radius: [0, '90%'],
            label: {
              rotate: 'radial'
            }
          }]
        };

      case 'radar':
        // Create indicators from non-x-axis columns
        const indicators = availableColumns
          .filter(col => col !== xAxisColumn)
          .map(col => ({
            name: col,
            max: Math.max(...data.map(d => Number(d[col]) || 0)) * 1.2
          }));

        // Create series data
        const radarData = data.map((row, index) => ({
          name: row[xAxisColumn],
          value: availableColumns
            .filter(col => col !== xAxisColumn)
            .map(col => Number(row[col]) || 0),
          areaStyle: {
            color: colorScheme[index % colorScheme.length],
            opacity: 0.2
          },
          lineStyle: {
            color: colorScheme[index % colorScheme.length]
          }
        }));

        return {
          ...baseOption,
          radar: {
            indicator: indicators,
            shape: 'polygon',
            splitNumber: 5,
            axisName: {
              color: theme === 'dark' ? '#fff' : '#333'
            },
            splitLine: {
              lineStyle: {
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
              }
            },
            splitArea: {
              show: true,
              areaStyle: {
                color: theme === 'dark' ? 
                  ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] : 
                  ['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.05)']
              }
            }
          },
          series: [{
            type: 'radar',
            data: radarData,
            emphasis: {
              lineStyle: {
                width: 4
              }
            }
          }]
        };

      case 'gauge':
        const gaugeValue = data.reduce((sum, d) => 
          sum + (Number(d[dataSeries[0]?.column]) || 0), 0
        ) / data.length;

        return {
          ...baseOption,
          series: [{
            name: dataSeries[0]?.label || 'Gauge',
            type: 'gauge',
            detail: { formatter: '{value}' },
            data: [{ value: gaugeValue.toFixed(2), name: dataSeries[0]?.label }],
            axisLine: {
              lineStyle: {
                color: [[0.3, '#67e0e3'], [0.7, '#37a2da'], [1, '#fd666d']]
              }
            }
          }]
        };

      case 'funnel':
        return {
          ...baseOption,
          series: [{
            name: dataSeries[0]?.label || 'Funnel',
            type: 'funnel',
            left: '10%',
            top: 60,
            bottom: 60,
            width: '80%',
            min: 0,
            max: 100,
            minSize: '0%',
            maxSize: '100%',
            sort: 'descending',
            gap: 2,
            label: {
              show: true,
              position: 'inside'
            },
            labelLine: {
              length: 10,
              lineStyle: {
                width: 1,
                type: 'solid'
              }
            },
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 1
            },
            emphasis: {
              label: {
                fontSize: 20
              }
            },
            data: data
              .map(d => ({
                value: d[dataSeries[0]?.column],
                name: d[xAxisColumn]
              }))
              .sort((a, b) => b.value - a.value)
          }]
        };

      case 'metric':
        // Metric doesn't use ECharts, return empty option
        return {};

      default:
        return baseOption;
    }
  };

  const renderMetric = () => {
    const { data } = parseDataForChart;
    if (!dataSeries[0]?.column) return null;

    let value = 0;
    switch (dataSeries[0].aggregation) {
      case 'sum':
        value = data.reduce((sum, d) => sum + (Number(d[dataSeries[0].column]) || 0), 0);
        break;
      case 'average':
        value = data.reduce((sum, d) => sum + (Number(d[dataSeries[0].column]) || 0), 0) / data.length;
        break;
      case 'count':
        value = data.length;
        break;
      case 'min':
        value = Math.min(...data.map(d => Number(d[dataSeries[0].column]) || 0));
        break;
      case 'max':
        value = Math.max(...data.map(d => Number(d[dataSeries[0].column]) || 0));
        break;
      case 'median':
        const sorted = data.map(d => Number(d[dataSeries[0].column]) || 0).sort((a, b) => a - b);
        value = sorted[Math.floor(sorted.length / 2)];
        break;
    }

    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-6xl font-bold mb-4" style={{ color: dataSeries[0].color }}>
          {formatMetricValue(value)}
        </div>
        <div className="text-xl text-gray-600 dark:text-gray-400">
          {dataSeries[0].label || dataSeries[0].column}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          {dataSeries[0].aggregation.toUpperCase()}
        </div>
      </div>
    );
  };

  const handleCreateChart = () => {
    const chart = {
      id: `chart-${Date.now()}`,
      type: chartType,
      dataRange,
      position: { x: 100, y: 100 },
      size: { width: 500, height: 400 },
      title: chartTitle,
      config: {
        xAxisColumn,
        xAxisConfig,
        yAxisConfig,
        dataSeries,
        showLegend,
        showToolbox,
        showDataZoom,
        colorScheme,
        metricFormat,
        metricPrefix,
        metricSuffix,
        echartsOption: chartType !== 'metric' ? generateEChartsOption() : null
      }
    };

    addChart(chart);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 w-[95%] max-w-7xl h-[95vh] flex flex-col ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create Advanced Visualization</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 overflow-y-auto pr-2">
            <div className="space-y-4">
              {/* Chart Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Visualization Type</label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as ChartType)}
                  className={`w-full p-2 border rounded ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <optgroup label="Basic Charts">
                    <option value="line">Line Chart</option>
                    <option value="area">Area Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="scatter">Scatter Plot</option>
                    <option value="pie">Pie Chart</option>
                  </optgroup>
                  <optgroup label="Stacked Charts">
                    <option value="stacked-bar">Stacked Bar</option>
                  </optgroup>
                  <optgroup label="Advanced Charts">
                    <option value="heatmap">Heatmap</option>
                    <option value="treemap">Treemap</option>
                    <option value="sunburst">Sunburst</option>
                    <option value="radar">Radar Chart</option>
                    <option value="gauge">Gauge</option>
                    <option value="funnel">Funnel</option>
                    <option value="metric">Metric</option>
                  </optgroup>
                </select>
              </div>

              {/* Data Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Data Range</label>
                <input
                  type="text"
                  value={dataRange}
                  onChange={(e) => setDataRange(e.target.value)}
                  placeholder="A1:D10"
                  className={`w-full p-2 border rounded ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              {/* Chart Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Chart Title</label>
                <input
                  type="text"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                  placeholder="Enter chart title"
                  className={`w-full p-2 border rounded ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              {/* X-Axis Configuration */}
              {!['gauge', 'pie', 'sunburst', 'treemap', 'metric'].includes(chartType) && (
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">X-Axis Configuration</h4>
                  <div className="space-y-2">
                    <select
                      value={xAxisColumn}
                      onChange={(e) => setXAxisColumn(e.target.value)}
                      className={`w-full p-2 border rounded ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="">Select Column</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    {chartType !== 'radar' && chartType !== 'heatmap' && (
                      <>
                        <input
                          type="text"
                          value={xAxisConfig.label}
                          onChange={(e) => setXAxisConfig({...xAxisConfig, label: e.target.value})}
                          placeholder="X-Axis Label"
                          className={`w-full p-2 border rounded ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                        <select
                          value={xAxisConfig.type}
                          onChange={(e) => setXAxisConfig({...xAxisConfig, type: e.target.value as any})}
                          className={`w-full p-2 border rounded ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value="category">Category</option>
                          <option value="value">Value</option>
                          <option value="time">Time</option>
                          <option value="log">Logarithmic</option>
                        </select>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Y-Axis Configuration */}
              {['line', 'area', 'bar', 'scatter', 'stacked-bar'].includes(chartType) && (
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">Y-Axis Configuration</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={yAxisConfig.label}
                      onChange={(e) => setYAxisConfig({...yAxisConfig, label: e.target.value})}
                      placeholder="Y-Axis Label"
                      className={`w-full p-2 border rounded ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Min (auto)"
                        onChange={(e) => setYAxisConfig({
                          ...yAxisConfig, 
                          min: e.target.value === '' ? 'auto' : Number(e.target.value)
                        })}
                        className={`p-2 border rounded ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Max (auto)"
                        onChange={(e) => setYAxisConfig({
                          ...yAxisConfig, 
                          max: e.target.value === '' ? 'auto' : Number(e.target.value)
                        })}
                        className={`p-2 border rounded ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={yAxisConfig.scale}
                        onChange={(e) => setYAxisConfig({...yAxisConfig, scale: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Scale (ignore zero)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Data Series */}
              {chartType !== 'heatmap' && chartType !== 'radar' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Data Series</label>
                    {['line', 'area', 'bar', 'scatter', 'stacked-bar'].includes(chartType) && (
                      <button
                        onClick={addDataSeries}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Add Series
                      </button>
                    )}
                  </div>
                  {dataSeries.map((series, index) => (
                    <div key={series.id} className="border rounded p-3 mb-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Series {index + 1}</span>
                        {dataSeries.length > 1 && (
                          <button
                            onClick={() => removeDataSeries(series.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <select
                        value={series.column}
                        onChange={(e) => updateDataSeries(series.id, 'column', e.target.value)}
                        className={`w-full p-1 border rounded text-sm ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="">Select Column</option>
                        {availableColumns.filter(col => col !== xAxisColumn).map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={series.label}
                        onChange={(e) => updateDataSeries(series.id, 'label', e.target.value)}
                        placeholder="Series Label"
                        className={`w-full p-1 border rounded text-sm ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={series.color}
                          onChange={(e) => updateDataSeries(series.id, 'color', e.target.value)}
                          className="w-8 h-8 border rounded cursor-pointer"
                        />
                        <select
                          value={series.aggregation}
                          onChange={(e) => updateDataSeries(series.id, 'aggregation', e.target.value)}
                          className={`flex-1 p-1 border rounded text-sm ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value="sum">Sum</option>
                          <option value="average">Average</option>
                          <option value="count">Count</option>
                          <option value="min">Min</option>
                          <option value="max">Max</option>
                          <option value="median">Median</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Metric Specific Options */}
              {chartType === 'metric' && (
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">Metric Options</h4>
                  <div className="space-y-2">
                    <select
                      value={metricFormat}
                      onChange={(e) => setMetricFormat(e.target.value as any)}
                      className={`w-full p-2 border rounded ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="number">Number</option>
                      <option value="currency">Currency</option>
                      <option value="percentage">Percentage</option>
                    </select>
                    <input
                      type="text"
                      value={metricPrefix}
                      onChange={(e) => setMetricPrefix(e.target.value)}
                      placeholder="Prefix (e.g., $)"
                      className={`w-full p-2 border rounded ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      value={metricSuffix}
                      onChange={(e) => setMetricSuffix(e.target.value)}
                      placeholder="Suffix (e.g., USD)"
                      className={`w-full p-2 border rounded ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Display Options */}
              {chartType !== 'metric' && (
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showLegend}
                      onChange={(e) => setShowLegend(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Show Legend</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showToolbox}
                      onChange={(e) => setShowToolbox(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Show Toolbox</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showDataZoom}
                      onChange={(e) => setShowDataZoom(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Enable Data Zoom</span>
                  </label>
                </div>
              )}

              {/* Color Scheme */}
              <div>
                <label className="block text-sm font-medium mb-2">Color Scheme</label>
                <div className="flex flex-wrap gap-1">
                  {colorScheme.map((color, index) => (
                    <input
                      key={index}
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const newColors = [...colorScheme];
                        newColors[index] = e.target.value;
                        setColorScheme(newColors);
                      }}
                      className="w-8 h-8 border rounded cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chart Preview */}
          <div className="lg:col-span-2 flex flex-col">
            <h3 className="text-lg font-medium mb-4">Preview</h3>
            <div className={`flex-1 border rounded p-4 ${
              theme === 'dark' ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-gray-50'
            }`}>
              {chartType === 'metric' ? (
                renderMetric()
              ) : (
                <ReactECharts
                  key={chartType + JSON.stringify(dataSeries) + xAxisColumn} // Force re-render on config change
                  option={generateEChartsOption()}
                  style={{ height: '100%', width: '100%' }}
                  theme={theme}
                  opts={{ renderer: 'canvas' }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className={`px-4 py-2 border rounded hover:bg-gray-50 ${
              theme === 'dark' 
                ? 'border-gray-600 hover:bg-gray-700' 
                : 'border-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateChart}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={!xAxisColumn || (dataSeries[0].column === '' && !['gauge', 'metric'].includes(chartType))}
          >
            Create Visualization
          </button>
        </div>
      </div>
    </div>
  );
};