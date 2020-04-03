import { expr2xy } from './alphabet';

export default class TableArea {
  constructor(rowStart, colStart, rowEnd, colEnd, width = 0, height = 0) {
    this.rowStart = rowStart;
    this.colStart = colStart;
    this.rowEnd = rowEnd;
    this.colEnd = colEnd;
    this.width = width;
    this.height = height;
  }

  get rowLen() {
    return this.rowEnd - this.rowStart;
  }

  get colLen() {
    return this.colEnd - this.colStart;
  }

  inRow(index) {
    return this.rowStart <= index && index <= this.rowEnd;
  }

  inCol(index) {
    return this.colStart <= index && index <= this.colEnd;
  }

  includes(ri, ci) {
    return this.inRow(ri) && this.inCol(ci);
  }

  rowEach(cb) {
    for (let ri = this.rowStart; ri <= this.rowEnd; ri += 1) {
      cb(ri);
    }
  }

  colEach(cb) {
    for (let ci = this.colStart; ci <= this.colEnd; ci += 1) {
      cb(ci);
    }
  }

  each(cb) {
    this.rowEach((ri) => {
      this.colEach((ci) => (cb(ri, ci)));
    });
  }

  intersects(other) {
    return this.rowStart <= other.rowEnd
      && this.colStart <= other.colEnd
      && other.rowStart <= this.rowEnd
      && other.colStart <= this.colEnd;
  }
}

export function newArea(...args) {
  let nargs = args;
  if (typeof args[0] === 'string') {
    const ary = args[0].split(':');
    if (ary.length === 1) ary.push(ary[0]);
    const start = expr2xy(ary[0]);
    const end = expr2xy(ary[1]);
    // console.log('ary:', ary, start, end);
    nargs = [start[1], start[0], end[1], end[0]];
  }
  return new TableArea(...nargs);
}
