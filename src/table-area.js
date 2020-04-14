import CellRange from './cell-range';

function rangeEach(min, max, getv, cb) {
  for (let i = min; i <= max; i += 1) {
    const v = getv(i);
    if (v.hide !== true) cb(i, v);
  }
}

export default class TableArea extends CellRange {
  constructor(rowStart, colStart, rowEnd, colEnd, col, row) {
    super(rowStart, colStart, rowEnd, colEnd);
    this.$col = col;
    this.$row = row;
    this.$width = 0;
    this.$height = 0;
    this.$rows = new Map();
    this.$cols = new Map();
    rangeEach(rowStart, rowEnd, (i) => row(i), (i, { height }) => {
      this.$rows.set(i, { y: this.$height, h: height });
      this.$height += height;
    });
    rangeEach(colStart, colEnd, (i) => col(i), (i, { width }) => {
      this.$cols.set(i, { x: this.$width, w: width });
      this.$width += width;
    });
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
    this.rowEach((ri, { y, h }) => {
      this.colEach((ci, { x, w }) => {
        cb(ri, ci, {
          x, y, w, h,
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
      let h = 0;
      rangeEach(index, eIndex, (i) => $row(i), (i, { height }) => {
        if (i < $rowStart) y -= height;
        h += height;
      });
      return { y, h };
    }
    const { y } = $rows.get(index);
    let h = 0;
    rangeEach(index, eIndex, (i) => $row(i), (i, { height }) => {
      h += height;
    });
    return { y, h };
  }

  col(index, eIndex) {
    const { $cols, $colStart, $col } = this;
    if ((eIndex === undefined || index === eIndex) && $cols.has(index)) {
      return $cols.get(index);
    }
    // top of $colStart
    if (index < $colStart) {
      let x = 0;
      let w = 0;
      rangeEach(index, eIndex, (i) => $col(i), (i, { width }) => {
        if (i < $colStart) x -= width;
        w += width;
      });
      return { x, w };
    }
    const { x } = $cols.get(index);
    let w = 0;
    rangeEach(index, eIndex, (i) => $col(i), (i, { width }) => {
      w += width;
    });
    return { x, w };
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
