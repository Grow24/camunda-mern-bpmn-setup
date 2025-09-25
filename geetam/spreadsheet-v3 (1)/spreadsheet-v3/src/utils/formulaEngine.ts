import { CellData } from '../stores/spreadsheetStore';

export const getExcelColumnName = (colIndex: number): string => {
  let columnName = "";
  let dividend = colIndex + 1;
  let modulo;

  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return columnName;
};

export const getCellName = (col: number, row: number) =>
  `${getExcelColumnName(col)}${row + 1}`;

export const parseCellName = (name: string): [number, number] | null => {
  const match = name.match(/^([A-Z]+)([0-9]+)$/i);
  if (!match) return null;
  const [, colStr, rowStr] = match;
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 65 + 1);
  }
  col -= 1;
  const row = parseInt(rowStr) - 1;
  return [col, row];
};

const getCellNumericValue = (col: number, row: number, data: CellData[][]): number => {
  const cell = data[row]?.[col];
  if (!cell) return 0;
  const num = parseFloat(cell.value);
  return isNaN(num) ? 0 : num;
};

const getCellRangeValues = (
  start: [number, number],
  end: [number, number],
  data: CellData[][]
): number[] => {
  const [startCol, startRow] = start;
  const [endCol, endRow] = end;
  const values: number[] = [];
  for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
    for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
      values.push(getCellNumericValue(c, r, data));
    }
  }
  return values;
};

const parseArg = (arg: string, data: CellData[][]): number[] => {
  const rangeMatch = arg.match(/^([A-Z]+\d+):([A-Z]+\d+)$/i);
  if (rangeMatch) {
    const start = parseCellName(rangeMatch[1]);
    const end = parseCellName(rangeMatch[2]);
    if (!start || !end) return [];
    return getCellRangeValues(start, end, data);
  }
  
  const cell = parseCellName(arg);
  if (cell) {
    const [col, row] = cell;
    return [getCellNumericValue(col, row, data)];
  }
  const num = parseFloat(arg);
  if (!isNaN(num)) return [num];
  if (arg.trim() === '') return [];
  return [];
};

export const evaluateFormula = (formula: string, data: CellData[][]): string => {
  if (!formula.startsWith('=')) return formula;
  
  const funcMatch = formula.match(/^=(\w+)\(([^)]*)\)$/i);
  if (!funcMatch) {
    // Handle simple cell references like =A1
    const cellRef = formula.substring(1);
    const cell = parseCellName(cellRef);
    if (cell) {
      const [col, row] = cell;
      return data[row]?.[col]?.value || '';
    }
    return formula;
  }

  const [, func, args] = funcMatch;
  const funcUpper = func.toUpperCase();
  const parsedArgs = args.split(',').map(s => s.trim()).flatMap(arg => parseArg(arg, data));
  const error = (msg: string) => `#ERROR: ${msg}`;

  try {
    switch (funcUpper) {
      case "SUM":
        return parsedArgs.reduce((sum, val) => sum + val, 0).toString();
      case "AVERAGE":
        return parsedArgs.length > 0
          ? (parsedArgs.reduce((sum, val) => sum + val, 0) / parsedArgs.length).toString()
          : error("No valid numbers");
      case "MIN":
        return parsedArgs.length > 0 ? Math.min(...parsedArgs).toString() : error("No valid numbers");
      case "MAX":
        return parsedArgs.length > 0 ? Math.max(...parsedArgs).toString() : error("No valid numbers");
      case "COUNT":
        return parsedArgs.length.toString();
      case "PRODUCT":
        return parsedArgs.length > 0 ? parsedArgs.reduce((prod, val) => prod * val, 1).toString() : "0";
      case "IF":
        const [cond, trueVal, falseVal] = args.split(',').map(s => s.trim());
        const condVal = parseArg(cond, data)[0] || 0;
        return condVal ? parseArg(trueVal, data)[0]?.toString() || trueVal : parseArg(falseVal, data)[0]?.toString() || falseVal;
      case "ROUND":
        const [numArg, digitsArg] = args.split(',').map(s => s.trim());
        const num = parseArg(numArg, data)[0] || 0;
        const digits = parseInt(digitsArg) || 0;
        return Number(num.toFixed(digits)).toString();
      case "ABS":
        const absArg = parseArg(args, data)[0] || 0;
        return Math.abs(absArg).toString();
      case "SQRT":
        const sqrtArg = parseArg(args, data)[0] || 0;
        return sqrtArg >= 0 ? Math.sqrt(sqrtArg).toString() : error("Negative number");
      case "POWER":
        const [baseArg, expArg] = args.split(',').map(s => s.trim());
        const base = parseArg(baseArg, data)[0] || 0;
        const exp = parseArg(expArg, data)[0] || 1;
        return Math.pow(base, exp).toString();
      case "TODAY":
        return new Date().toLocaleDateString();
      case "NOW":
        return new Date().toLocaleString();
      case "CONCATENATE":
        return args.split(',').map(s => s.trim().replace(/"/g, '')).join('');
      default:
        return formula;
    }
  } catch (e) {
    return error("Invalid formula");
  }
};