import { endCell, newArea } from './table-area';
import { expr2xy } from './alphabet';

function $newArea(rowStart, colStart, rowEnd, colEnd, x, y) {
  return newArea(rowStart, colStart, rowEnd, colEnd,
    this.$col, this.$row, x, y);
}

//                |
//    2(top-left) | 1(top-right)
// ------------------------------------
// 3(bottom-left) | 4(bottom-right)
//                |
function newViewAreas() {
  const {
    $rowStart, $colStart, $width, $height,
  } = this;
  const tx = this.$indexColWidth;
  const ty = this.indexRowsHeight;
  const [fc, fr] = expr2xy(this.$freeze);
  // console.log('fc:', fc, ', fr:', fr);
  const area2 = $newArea.call(this, $rowStart, $colStart, fr - 1, fc - 1, tx, ty);
  const rowStart4 = fr + this.$scrollRow;
  const colStart4 = fc + this.$scrollCol;
  const { row, col } = endCell(this.$row, this.$col,
    rowStart4, colStart4, this.$rowsLength, this.$colsLength,
    area2.width, area2.height, $width, $height);
  const area4 = $newArea.call(this, rowStart4, colStart4, row, col,
    tx + area2.width, ty + area2.height);
  const area1 = $newArea.call(this, $rowStart, colStart4, fr - 1, col,
    tx + area2.width, ty + 0);
  const area3 = $newArea.call(this, rowStart4, $colStart, row, fc - 1,
    tx + 0, ty + area2.height);
  // console.log('area1:', area1, ', area2:', area2, ', area3:', area3, ', area4:', area4);
  return [area1, area2, area3, area4];
}

// return [1, 2-1, 2-3, 3]
function newIndexViewAreas([area1, area2, area3, area4]) {
  return [
    // 1
    newArea(0, area1.colStart, this.$indexRowsLength - 1, area1.colEnd,
      this.$col, () => ({ height: this.$indexRowHeight }), area4.x, 0),
    // 2-1
    newArea(0, area2.colStart, this.$indexRowsLength - 1, area2.colEnd,
      this.$col, () => ({ height: this.$indexRowHeight }), area2.x, 0),
    // 2-3
    newArea(area2.rowStart, 0, area2.rowEnd, 0,
      () => ({ width: this.$indexColWidth }), this.$row, 0, area2.y),
    // 3
    newArea(area3.rowStart, 0, area3.rowEnd, 0,
      () => ({ width: this.$indexColWidth }), this.$row, 0, area4.y),
  ];
}

//  2 | 1
// -------
//  3 | 4
// return [type, {row, col,  x, y, width, height }, evt]
function cellInAreas([area1, area2, area3, area4],
  [iarea1, iarea21, iarea23, iarea3], x, y, merges) {
  const inIndexRows = x < area2.x;
  const inIndexCols = y < area2.y;
  // const { $indexColWidth } = this;
  if (inIndexRows && inIndexCols) {
    return [2, {
      row: 0, col: 0, x: 0, y: 0, width: area2.x, height: area2.y,
    }];
  }

  const cellfn = (a) => a.cell(x, y, merges);

  if (inIndexRows) {
    if (iarea23.iny(y)) {
      return [3, cellfn(iarea23)];
    }
    return [3, cellfn(iarea3)];
  }
  if (inIndexCols) {
    if (iarea21.inx(x)) {
      return [1, cellfn(iarea21)];
    }
    return [1, cellfn(iarea1)];
  }
  const ary = [area4, area2, area1, area3];
  for (let i = 0; i < ary.length; i += 1) {
    const area = ary[i];
    if (area.inxy(x, y)) {
      return [4, cellfn(area)];
    }
  }
  return null;
}

export default class ViewAreas {
  constructor(t) {
    this.merges = t.$merges;
    this.body = newViewAreas.call(t);
    this.index = newIndexViewAreas.call(t, this.body);
  }

  cell(x, y) {
    return cellInAreas(this.body, this.index, x, y, this.merges);
  }
}
