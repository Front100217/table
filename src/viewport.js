import { endCell, newArea } from './area';

function $newArea(startRow, startCol, endRow, endCol, x, y) {
  return newArea(startRow, startCol, endRow, endCol,
    this.$col, this.$row, x, y);
}

//                |
//    2(top-left) | 1(top-right)
// ------------------------------------
// 3(bottom-left) | 4(bottom-right)
//                |
function $newBodyAreas() {
  const {
    $startRow, $startCol, $width, $height,
    $colHeader, $rowHeader, $scrollRow, $scrollCol,
    $freeze, $row, $col, $rows, $cols,
  } = this;
  const tx = $rowHeader.width;
  const ty = $colHeader.height;
  const [fr, fc] = $freeze;
  // console.log('fc:', fc, ', fr:', fr);
  const area2 = $newArea.call(this, $startRow, $startCol, fr - 1, fc - 1, tx, ty);
  const startRow4 = fr + $scrollRow;
  const startCol4 = fc + $scrollCol;
  const { row, col } = endCell($row, $col,
    startRow4, startCol4, $rows, $cols,
    area2.width, area2.height, $width, $height);
  const area4 = $newArea.call(this, startRow4, startCol4, row, col,
    tx + area2.width, ty + area2.height);
  const area1 = $newArea.call(this, $startRow, startCol4, fr - 1, col,
    tx + area2.width, ty + 0);
  const area3 = $newArea.call(this, startRow4, $startCol, row, fc - 1,
    tx + 0, ty + area2.height);
  // console.log('area1:', area1, ', area2:', area2, ', area3:', area3, ', area4:', area4);
  return [area1, area2, area3, area4];
}

// return [1, 2-1, 2-3, 3]
function $newHeaderAreas([area1, area2, area3, area4]) {
  const {
    $colHeader, $rowHeader, $row, $col,
  } = this;
  const columnHeaderRows = $colHeader.rows - 1;
  return [
    // 1
    newArea(0, area1.startCol, columnHeaderRows, area1.endCol,
      $col, () => ({ height: $colHeader.rowHeight }), area4.x, 0),
    // 2-1
    newArea(0, area2.startCol, columnHeaderRows, area2.endCol,
      $col, () => ({ height: $colHeader.rowHeight }), area2.x, 0),
    // 2-3
    newArea(area2.startRow, 0, area2.endRow, 0,
      () => ({ width: $rowHeader.width }), $row, 0, area2.y),
    // 3
    newArea(area3.startRow, 0, area3.endRow, 0,
      () => ({ width: $rowHeader.width }), $row, 0, area4.y),
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

/**
 * it contains header(areas), body(areas) with table
 * @author myliang
 */
export default class Viewport {
  constructor(table) {
    this.$merges = table.$merges;
    this.body = $newBodyAreas.call(table);
    this.header = $newHeaderAreas.call(table, this.body);
  }

  cell(x, y) {
    return cellInAreas(this.body, this.header, x, y, this.$merges);
  }
}
