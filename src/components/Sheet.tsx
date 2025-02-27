'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CellClickArgs, CellMouseEvent, Column, DataGrid, textEditor } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

interface Row {
  id: number;
  [key: string]: string | number;
}

interface GridProps {
  rowCount: number;
  columnCount: number;
}

interface FormulaData {
  formula: string;
  dependencies: { row: number; col: number }[];
}

const formulaMap = new Map<string, FormulaData>();

const generateColumns = (count: number): Column<Row>[] => {
  const columns: Column<Row>[] = [];
  for (let i = 0; i < count; i++) {
    const columnName = String(i + 1);
    columns.push({
      key: columnName,
      name: columnName,
      editable: true,
      renderEditCell: textEditor,
    });
  }
  return columns;
};

const generateInitialRows = (rowsCount: number, columnsCount: number): Row[] => {
  const rows: Row[] = [];
  for (let i = 0; i < rowsCount; i++) {
    const row: Row = { id: i + 1 };
    for (let j = 0; j < columnsCount; j++) {
      const columnName = String(j + 1);
      row[columnName] = '';
    }
    rows.push(row);
  }
  return rows;
};

const Spreadsheet: React.FC<GridProps> = ({ rowCount, columnCount }) => {
  const [rows, setRows] = useState<Row[]>(generateInitialRows(rowCount, columnCount));
  const [columns] = useState<Column<Row>[]>(generateColumns(columnCount));
  const [formulaInput, setFormulaInput] = useState<string>('');
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const rowsRef = useRef(rows);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const handleApplyFormula = () => {
    if (activeCell && formulaInput) {
      updateFormulaMap(activeCell.row, activeCell.col, formulaInput);
      recalculateDependentCells(activeCell.row, activeCell.col);
      updateCellValue(activeCell.row, activeCell.col, evaluateFormula(formulaInput));
      setFormulaInput('');
      setActiveCell(null);
    }
  };

  function rowKeyGetter(row: Row) {
    return row.id;
  }

  const handleRowsChange = (updatedRows: Row[], { indexes }: { indexes: number[] }) => {
    if (indexes && indexes.length > 0) {
      const rowIndex = indexes[0];
      const changedRow = updatedRows[rowIndex];
      const changedCol = parseInt(Object.keys(changedRow).find(key => rows[rowIndex][key] !== changedRow[key]) || '0');

      if (changedCol !== 0) {
        recalculateDependentCells(rowIndex + 1, changedCol);
      }
    }
    setRows(updatedRows);
  };

  const onCellClick = (args: CellClickArgs<Row, unknown>, event: CellMouseEvent) => {
    setActiveCell({ row: args.row.id, col: parseInt(args.column.key) });
    const formula = formulaMap.get(`${args.row.id},${args.column.key}`)?.formula;
    if (formula) {
      setFormulaInput(formula);
    } else {
      setFormulaInput("");
    }
  };

  function parseFormula(formula: string): { row: number; col: number }[] {
    const dependencies: { row: number; col: number }[] = [];
    const parts = formula.split(/[\s+\-*/]+/);

    parts.forEach((part) => {
      const cellRef = part.trim();
      if (cellRef.includes(',')) {
        const [rowStr, colStr] = cellRef.split(',');
        const row = parseInt(rowStr);
        const col = parseInt(colStr);
        if (!isNaN(row) && !isNaN(col)) {
          dependencies.push({ row, col });
        }
      }
    });

    return dependencies;
  }

  function updateFormulaMap(row: number, col: number, formula: string) {
    const dependencies = parseFormula(formula);
    formulaMap.set(`${row},${col}`, { formula, dependencies });
  }

  function recalculateDependentCells(changedRow: number, changedCol: number) {
    formulaMap.forEach((formulaData, cellKey) => {
      const [rowStr, colStr] = cellKey.split(',');
      const row = parseInt(rowStr);
      const col = parseInt(colStr);

      if (formulaData.dependencies.some((dep) => dep.row === changedRow && dep.col === changedCol)) {
        const newValue = evaluateFormula(formulaData.formula);
        updateCellValue(row, col, newValue);
      }
    });
  }

  function evaluateFormula(formula: string): number {
    const parts = formula.split(/([\s+\-*/])/);
    let result: number | undefined;
    let currentOperator: string | undefined;

    parts.forEach((part) => {
      const cellRef = part.trim();
      if (cellRef.includes(',')) {
        const [rowStr, colStr] = cellRef.split(',');
        const row = parseInt(rowStr);
        const col = parseInt(colStr);
        if (!isNaN(row) && !isNaN(col)) {
          const cellValue = +(rowsRef.current[row - 1][col]);
          if (result === undefined) {
            result = cellValue;
          } else if (currentOperator === '+') {
            result += cellValue;
          } else if (currentOperator === '-') {
            result -= cellValue;
          } else if (currentOperator === '*') {
            result *= cellValue;
          } else if (currentOperator === '/') {
            result /= cellValue;
          }
        }
      } else if (/\s*[+\-*/]\s*/.test(cellRef)) {
        currentOperator = cellRef.trim();
      } else if (!isNaN(parseInt(cellRef))){
          const numValue = parseInt(cellRef)
          if(result === undefined){
              result = numValue;
          } else if (currentOperator === '+') {
            result += numValue;
          } else if (currentOperator === '-') {
            result -= numValue;
          } else if (currentOperator === '*') {
            result *= numValue;
          } else if (currentOperator === '/') {
            result /= numValue;
          }
      }
    });

    return result !== undefined ? result : 0;
  }

  function updateCellValue(row: number, col: number, newValue: number) {
    setRows((prevRows) => {
      const newRows = prevRows.map((r, i) => {
        if (i === row - 1) {
          return { ...r, [col]: newValue.toString() };
        }
        return r;
      });
      return [...newRows];
    });
  }

  const handleFormulaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApplyFormula();
    }
  };

  const rowNumberColumn: Column<Row> = {
    key: 'id',
    name: '#-ID',
    width: 80,
    renderCell: ({ row }) => row.id.toString(),
  };

  return (
    <div className='flex flex-col'>
      <div className='flex gap-xl text-sm'>
        <input
          type='text'
          className='border-1 border-[grey] rounded-lg flex-grow py-1 bg-white border border-[lightgrey] px-1 mr-2'
          value={formulaInput}
          onChange={(e) => setFormulaInput(e.target.value)}
          disabled={!activeCell}
          onKeyDown={handleFormulaKeyDown}
          placeholder={!activeCell ? 'Select a cell to apply formula' : 'Format: (Col,Row) + (Col,Row) - (Col,Row) * (Col,Row) / (Col,Row)'} 
        />
        <button className='border-2 px-2 rounded-lg' onClick={handleApplyFormula}>Apply</button>
      </div>
      <DataGrid
        rows={rows}
        columns={[rowNumberColumn, ...columns]}
        rowKeyGetter={rowKeyGetter}
        onRowsChange={handleRowsChange}
        onCellClick={onCellClick}
        className='rdg-light mt-4'
      />
    </div>
  );
};

export default Spreadsheet;