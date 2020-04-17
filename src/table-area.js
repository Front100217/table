import CellRange, { findCellRanges } from './cell-range';

function rangeEach(min, max, getv, cb) {
  for (let i = min; i <= max; i += 1) {
    const v = getv(i);
    if (v.hide !== true) cb(i, v);
  }
}

function endRow(row, minRow, maxRow, miny, maxy) {
  let r = minRow;
  let y = miny;
  let lasth = 0;
  while (y < maxy && r < maxRow) {
    const { height, hide } = row(r);
    if (hide !== true) {
      lasth = height;
      y += height;
    }
    r += 1;
  }
  y -= lasth;
  return { row: r - 1, y, height: lasth };
}

function endCol(col, minCol, maxCol, minx, maxx) {
  let c = minCol;
  let x = minx;
  let lastw = 0;
  while (x < maxx && c < maxCol) {
    const { width, hide } = col(c);
    if (hide !== true) {
      lastw = width;
      x += width;
    }
    c += 1;
  }
  x -= lastw;
  return { col: c - 1, x, width: lastw };
}

export function endCell(row, col,
  minRow, minCol, maxRow, maxCol,
  minx, miny, maxx, maxy) {
  return {
    ...endRow(row, minRow, maxRow, miny, maxy),
    ...endCol(col, minCol, maxCol, minx, maxx),
  };
}

export default class TableArea extends CellRange {
  constructor(rowStart, colStart, rowEnd, colEnd, col, row, x = 0, y = 0) {
    super(rowStart, colStart, rowEnd, colEnd);
    this.$col = col;
    this.$row = row;
    this.$x = x;
    this.$y = y;
    this.$width = 0;
    this.$height = 0;
    this.$rows = new Map();
    this.$cols = new Map();
    rangeEach(rowStart, rowEnd, (i) => row(i), (i, { height }) => {
      this.$rows.set(i, { y: this.$height, height });
      this.$height += height;
    });
    rangeEach(colStart, colEnd, (i) => col(i), (i, { width }) => {
      this.$cols.set(i, { x: this.$width, width });
      this.$width += width;
    });
  }

  get x() {
    return this.$x;
  }

  get y() {
    return this.$y;
  }

  get width() {
    return this.$width;
  }

  get height() {
    return this.$height;
  }

  rowEach(cb) {
    rangeEach(this.$rowStart, this.$rowEnd,
      (i) => this.$rows.get(i), (i, v) => cb(i, v));
  }

  colEach(cb) {
    rangeEach(this.$colStart, this.$colEnd,
      (i) => this.$cols.get(i), (i, v) => cb(i, v));
  }

  each(cb) {
    this.rowEach((ri, { y, height }) => {
      this.colEach((ci, { x, width }) => {
        cb(ri, ci, {
          x, y, width, height,
        });
      });
    });
  }

  row(index, eIndex) {
    const { $rows, $rowStart, $row } = this;
    if ((eIndex === undefined || index === eIndex) && $rows.has(index)) {
      return $rows.get(index);
    }
    // left of $rowStart
    if (index < $rowStart) {
      let y = 0;
      let height = 0;
      rangeEach(index, eIndex, (i) => $row(i), (i, v) => {
        if (i < $rowStart) {
          y -= v.height;
        }
        height += v.height;
      });
      return { y, height };
    }
    const { y } = $rows.get(index);
    let height = 0;
    rangeEach(index, eIndex, (i) => $row(i), (i, v) => {
      height += v.height;
    });
    return { y, height };
  }

  col(index, eIndex) {
    const { $cols, $colStart, $col } = this;
    if ((eIndex === undefined || index === eIndex) && $cols.has(index)) {
      return $cols.get(index);
    }
    // top of $colStart
    if (index < $colStart) {
      let x = 0;
      let width = 0;
      rangeEach(index, eIndex, (i) => $col(i), (i, v) => {
        if (i < $colStart) x -= v.width;
        width += v.width;
      });
      return { x, width };
    }
    const { x } = $cols.get(index);
    let width = 0;
    rangeEach(index, eIndex, (i) => $col(i), (i, v) => {
      width += v.width;
    });
    return { x, width };
  }

  inx(x) {
    return x >= this.$x && x < (this.$x + this.$width);
  }

  iny(y) {
    return y >= this.$y && y < (this.$y + this.$height);
  }

  inxy(x, y) {
    return this.inx(x) && this.iny(y);
  }

  // row: row-index
  // col: col-index
  // { row, col, x, y, width, height }
  cell(x, y, merges) {
    const ret = endCell(this.$row, this.$col,
      this.$rowStart, this.$colStart, this.$rowEnd, this.$colEnd,
      this.$x, this.$y, x, y);
    const cr = findCellRanges(merges,
      (it) => it.includes(ret.row, ret.col));
    if (cr) {
      return {
        row: cr.rowStart,
        col: cr.colStart,
        ...this.rect(cr),
      };
    }
    return ret;
  }

  // cr: CellRange
  rect(cr) {
    return {
      ...this.col(cr.colStart, cr.colEnd),
      ...this.row(cr.rowStart, cr.rowEnd),
    };
  }
}

export function newArea(...args) {
  return new TableArea(...args);
}
