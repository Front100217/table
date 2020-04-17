import { expr2xy } from './alphabet';

export default class CellRange {
  constructor(rowStart, colStart, rowEnd, colEnd) {
    this.$rowStart = rowStart;
    this.$colStart = colStart;
    this.$rowEnd = rowEnd;
    this.$colEnd = colEnd;
  }

  get rowStart() {
    return this.$rowStart;
  }

  get rowEnd() {
    return this.$rowEnd;
  }

  get colStart() {
    return this.$colStart;
  }

  get colEnd() {
    return this.$colEnd;
  }

  set rowStart(v) {
    this.$rowStart = v;
  }

  set rowEnd(v) {
    this.$rowEnd = v;
  }

  set colStart(v) {
    this.$colStart = v;
  }

  set colEnd(v) {
    this.$colEnd = v;
  }

  get length() {
    return [
      this.$rowEnd - this.$rowStart,
      this.$colEnd - this.$colStart,
    ];
  }

  inRow(index) {
    return this.$rowStart <= index && index <= this.$rowEnd;
  }

  inCol(index) {
    return this.$colStart <= index && index <= this.$colEnd;
  }

  includes(ri, ci) {
    return this.inRow(ri) && this.inCol(ci);
  }

  rowEach(cb) {
    for (let ri = this.$rowStart; ri <= this.$rowEnd; ri += 1) {
      cb(ri);
    }
  }

  colEach(cb) {
    for (let ci = this.$colStart; ci <= this.$colEnd; ci += 1) {
      cb(ci);
    }
  }

  each(cb) {
    this.rowEach((ri) => {
      this.colEach((ci) => (cb(ri, ci)));
    });
  }

  clone() {
    return new CellRange(
      this.$rowStart,
      this.$colStart,
      this.$rowEnd,
      this.$colEnd,
    );
  }

  intersects(other) {
    return this.$rowStart <= other.$rowEnd
      && this.$colStart <= other.$colEnd
      && other.$rowStart <= this.$rowEnd
      && other.$colStart <= this.$colEnd;
  }
}

export function newCellRange(ref) {
  if (ref === undefined) return undefined;
  const ary = ref.split(':');
  const start = expr2xy(ary[0]);
  const end = expr2xy(ary[1]);
  return new CellRange(start[1], start[0], end[1], end[0]);
}

export function eachCellRanges(refs, cb) {
  if (refs && refs.length > 0) {
    refs.forEach((ref) => {
      cb(newCellRange(ref));
    });
  }
}

export function findCellRanges(refs, cb) {
  if (refs && refs.length > 0) {
    const it = refs.find((ref) => cb(newCellRange(ref)));
    return it ? newCellRange(it) : null;
  }
  return null;
}
