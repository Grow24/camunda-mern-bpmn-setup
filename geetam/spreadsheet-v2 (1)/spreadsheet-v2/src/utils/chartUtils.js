export const getColumnLetter = (colIndex) => {
  let letter = "";
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode(65 + (temp % 26)) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

export const parseRange = (rangeStr) => {
  // Parse range like "A1:C3" into coordinates
  const [start, end] = rangeStr.split(':');
  const startMatch = start.match(/([A-Z]+)(\d+)/);
  const endMatch = end.match(/([A-Z]+)(\d+)/);
  
  if (!startMatch || !endMatch) return null;
  
  const startCol = columnLetterToIndex(startMatch[1]);
  const startRow = parseInt(startMatch[2]);
  const endCol = columnLetterToIndex(endMatch[1]);
  const endRow = parseInt(endMatch[2]);
  
  return {
    start: { row: startRow, col: startCol },
    end: { row: endRow, col: endCol }
  };
};

export const columnLetterToIndex = (letter) => {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 64);
  }
  return result;
};

export const extractDataFromRange = (data, range) => {
  const labels = [];
  const values = [];
  
  for (let row = range.start.row; row <= range.end.row; row++) {
    for (let col = range.start.col; col <= range.end.col; col++) {
      const cellValue = data[row - 1]?.[col - 1] || '';
      
      // Try to parse as number, otherwise use as label
      const numValue = parseFloat(cellValue);
      if (!isNaN(numValue) && cellValue !== '') {
        values.push(numValue);
        labels.push(`${getColumnLetter(col - 1)}${row}`);
      } else if (cellValue !== '') {
        labels.push(cellValue);
      }
    }
  }
  
  // If we have more labels than values, use labels as categories and values as data
  if (labels.length > values.length && values.length > 0) {
    return {
      labels: labels.slice(0, values.length),
      data: values
    };
  }
  
  // If we have equal or more values, use indices as labels
  return {
    labels: values.map((_, index) => labels[index] || `Item ${index + 1}`),
    data: values
  };
};

export const createChartData = (data, range, chartType) => {
  const { labels, data: chartData } = extractDataFromRange(data, range);
  
  if (chartData.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [{
        data: [1],
        backgroundColor: '#e5e7eb'
      }]
    };
  }
  
  const colors = {
    Bar: '#3b82f6',
    Line: '#10b981',
    Pie: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
    Scatter: '#f59e0b'
  };
  
  return {
    labels,
    datasets: [{
      data: chartData,
      backgroundColor: chartType === 'Pie' ? colors[chartType] : colors[chartType] || '#3b82f6'
    }]
  };
};