import CellRange from './cell-range';

export default class TableArea extends CellRange {
  constructor(rowStart, colStart, rowEnd, colEnd, colWidth, rowHeight) {
    super(rowStart, colStart, rowEnd, colEnd);
    this.colWidth = colWidth;
    this.rowHeight = rowHeight;
    this.width = 0;
    this.height = 0;
    this.rows = new Map();
    this.cols = new Map();
    for (let i = rowStart; i <= rowEnd; i += 1) {
      const h = rowHeight(i);
      this.rows.set(i, { y: this.height, h });
      this.height += h;
    }
    for (let i = colStart; i <= colEnd; i += 1) {
      const w = colWidth(i);
      this.cols.set(i, { x: this.width, w });
      this.width += w;
    }
  }

  rowEach(cb) {
    super.rowEach((i) => {
      cb(i, this.rows.get(i));
    });
  }

  colEach(cb) {
    super.colEach((i) => {
      cb(i, this.cols.get(i));
    });
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
    const { rows, rowStart, rowHeight } = this;
    if ((eIndex === undefined || index === eIndex) && rows.has(index)) {
      return rows.get(index);
    }
    // left of $rowStart
    if (index < rowStart) {
      let y = 0;
      let h = 0;
      for (let i = index; i <= eIndex; i += 1) {
        const rh = rowHeight(i);
        if (i < rowStart) y -= rh;
        h += rh;
      }
      return { y, h };
    }
    const { y } = rows.get(index);
    let h = 0;
    for (let i = index; i <= eIndex; i += 1) {
      h += rowHeight(i);
    }
    return { y, h };
  }

  col(index, eIndex) {
    const { cols, colStart, colWidth } = this;
    if ((eIndex === undefined || index === eIndex) && cols.has(index)) {
      return cols.get(index);
    }
    // top of $colStart
    if (index < colStart) {
      let x = 0;
      let w = 0;
      for (let i = index; i <= eIndex; i += 1) {
        const cw = colWidth(i);
        if (i < colStart) x -= cw;
        w += cw;
      }
      return { x, w };
    }
    const { x } = cols.get(index);
    let w = 0;
    for (let i = index; i <= eIndex; i += 1) {
      w += colWidth(i);
    }
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
