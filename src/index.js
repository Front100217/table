/* global window, document */
/* eslint func-names: ["error", "never"] */
import { cellRender } from './cell-render';
import { stringAt, expr2xy } from './alphabet';
import Canvas2d from './canvas2d';
import { newArea } from './table-area';
import { newCellRange } from './cell-range';

function renderLines(draw, area, { width, color }) {
  // render row-col-lines
  if (width > 0) {
    // const [rs, cs, re, ce, aw, ah] = area;
    draw.save().beginPath()
      .attr({ lineWidth: width, strokeStyle: color });

    area.rowEach((ri, { y, h }) => {
      draw.line([0, y + h], [area.width, y + h]);
    });

    area.colEach((ci, { x, w }) => {
      draw.line([x + w, 0], [x + w, area.height]);
    });
    draw.restore();
  }
}

// select: CellRange
// type: index-rows | index-cols | content
function renderCell(draw, ri, ci, cell, cellRect, cellStyle) {
  const c = cell(ri, ci);
  let text = '';
  let style = cellStyle;
  if (c !== undefined) {
    if (typeof c === 'string' || typeof c === 'number') text = `${c}`;
    else {
      text = c.text || '';
      if (c.style) {
        style = { ...style, ...c.style };
      }
    }
  }
  // console.log('text:', text, ', rect:', cellRect, style);
  cellRender(draw, text, cellRect, style);
}

// type: index-rows | index-cols | content
function renderCells(draw, type, area, cell, cellStyle, select, selectStyle, merges) {
  draw.save().rect(0, 0, area.width, area.height).clip();
  // const [rs, cs, re, ce] = area;
  area.each((ri, ci, rect) => {
    // console.log('ri:', ri, ', ci:', ci, ', rect:', rect);
    renderCell(draw, ri, ci, cell, rect, cellStyle);
  });

  // render merges
  if (merges && merges.length > 0) {
    merges.forEach((merge) => {
      const a = newCellRange(merge);
      if (a.intersects(area)) {
        renderCell(draw, a.rowStart, a.colStart,
          cell, area.rect(a), cellStyle);
      }
    });
  }

  // render select
  if (select && area.intersects(select)) {
    const {
      x, y, w, h,
    } = area.rect(select);
    const { bgcolor } = selectStyle;
    draw.save()
      .attr({ fillStyle: bgcolor })
      .rect(x, y, w, h)
      .fill()
      .restore();
  }
  draw.restore();
}

// type: index | content
// cell: Function
// cellStyle: cell-style
// select: CellRange
function renderLinesAndCells(draw, type, area,
  cell, cellStyle, lineStyle, select, selectStyle, merges) {
  renderLines(draw, area, lineStyle);
  renderCells(draw, type, area, cell, cellStyle,
    select, selectStyle, merges);
}

// private methods --- start ----
function $renderIndexRows(draw, area, ty) {
  // render row-index
  if (this.$indexColWidth > 0) {
    draw.save().translate(0, ty);
    const nselect = this.$select.clone();
    nselect.colStart = 0;
    nselect.colEnd = 0;
    renderLinesAndCells(draw, 'index-rows',
      newArea(area.rowStart, 0, area.rowEnd, 0, () => this.$indexColWidth, this.$rowHeight),
      this.$indexRowCell, this.$indexStyle, this.$indexLineStyle,
      nselect, this.$selectStyle);
    draw.restore();
  }
}

function $renderIndexCols(draw, area, tx) {
  // render col-index
  if (this.indexRowsHeight > 0) {
    draw.save().translate(tx, 0);
    const nselect = this.$select.clone();
    nselect.rowStart = 0;
    nselect.rowEnd = this.$indexRowsLength - 1;
    renderLinesAndCells(draw, 'index-cols',
      newArea(0, area.colStart, nselect.rowEnd, area.colEnd,
        this.$colWidth, () => this.$indexRowHeight),
      this.$indexColCell, this.$indexStyle, this.$indexLineStyle,
      nselect, this.$selectStyle, this.$indexMerges);
    draw.restore();
  }
}

function $renderBody(draw, area, tx, ty) {
  draw.save().translate(tx, ty);
  renderLinesAndCells(draw, 'content', area,
    this.$cell, this.$cellStyle, this.$lineStyle,
    this.$select, this.$selectStyle, this.$merges);
  draw.restore();
}

function $renderFreezeLines(draw, x, y) {
  const [fc, fr] = expr2xy(this.$freeze);
  const { width, color } = this.$freezeLineStyle;
  // console.log('width:', width, color, fr, fc);
  if (width > 0 && (fr > 0 || fc > 0)) {
    draw.save().attr({ lineWidth: width, strokeStyle: color });
    if (fr > 0) draw.line([0, y], [this.$width, y]);
    if (fc > 0) draw.line([x, 0], [x, this.$height]);
    draw.restore();
  }
}

function $render(draw) {
  const [area1, area2, area3, area4] = this.viewAreas;
  const tx = this.$indexColWidth;
  const ty = this.indexRowsHeight;
  const { width, height } = area2;
  draw.resize(this.$width, this.$height);

  // render area-4
  $renderBody.call(this, draw, area4, tx + width, ty + height);

  // render area-1
  $renderBody.call(this, draw, area1, tx + width, ty);
  $renderIndexCols.call(this, draw, area1, tx + width);

  // render area-3
  $renderBody.call(this, draw, area3, tx, ty + height);
  $renderIndexRows.call(this, draw, area3, ty + height);

  // render area-2
  $renderBody.call(this, draw, area2, tx, ty);
  $renderIndexRows.call(this, draw, area2, ty);
  $renderIndexCols.call(this, draw, area2, tx);

  // render freeze
  $renderFreezeLines.call(this, draw, tx + width, ty + height);

  // left-top
  if (tx > 0 && ty > 0) {
    renderLinesAndCells(draw, 'index',
      newArea(0, 0, 0, 0, () => tx, () => ty),
      () => '', this.$indexStyle, this.$indexLineStyle);
  }
}

function $newArea(rowStart, colStart, rowEnd, colEnd) {
  return newArea(rowStart, colStart, rowEnd, colEnd,
    this.$colWidth, this.$rowHeight);
}
// --- end ---

class TableRender {
  $drawMap = new Map();

  $rowsLength = 100;

  $colsLength = 26;

  $rowStart = 0;

  $colStart = 0;

  $rowHeight = () => 25;

  $colWidth = () => 100;

  // line-style
  $lineStyle = {
    width: 1,
    color: '#e6e6e6',
  };

  // scroll
  $scrollRow = 0;

  $scrollCol = 0;

  // freeze: A1
  $freeze = 'A1';

  $freezeLineStyle = {
    width: 2,
    color: '#d8d8d8',
  };

  // index...
  $indexRowHeight = 25;

  $indexRowsLength = 1;

  $indexRowCell = (r) => r + 1;

  $indexColWidth = 60;

  $indexColCell = (r, c) => stringAt(c);

  $indexMerges = [];

  $indexLineStyle = {
    width: 1,
    color: '#e6e6e6',
  };

  // index-style
  $indexStyle = {
    bgcolor: '#f4f5f8',
    align: 'center',
    valign: 'middle',
    fontSize: 9,
    fontFamily: 'Source Sans Pro',
    color: '#585757',
  };

  // select-area
  // 'A1:B1'
  $select = undefined;

  $selectStyle = {
    borderWidth: 1,
    borderColor: '#ffffff',
    bgcolor: '#4b89ff14',
  };

  // cell
  $cellStyle = {
    bgcolor: '#ffffff',
    align: 'left',
    valign: 'middle',
    textwrap: true,
    underline: false,
    color: '#0a0a0a',
    bold: false,
    italic: false,
    fontSize: 9,
    fontFamily: 'Source Sans Pro',
  };

  $cell = () => '';

  $merges = [];

  constructor(width, height) {
    this.$width = width;
    this.$height = height;
  }

  get indexRowsHeight() {
    return this.$indexRowHeight * this.$indexRowsLength;
  }

  //                |
  //    2(top-left) | 1(top-right)
  // ------------------------------------
  // 3(bottom-left) | 4(bottom-right)
  //                |
  get viewAreas() {
    const {
      $rowStart, $colStart, $width, $height,
    } = this;
    const [fc, fr] = expr2xy(this.$freeze);
    // console.log('fc:', fc, ', fr:', fr);
    const area2 = $newArea.call(this, $rowStart, $colStart, fr - 1, fc - 1);
    const rowStart4 = fr + this.$scrollRow;
    const colStart4 = fc + this.$scrollCol;
    let rowEnd = rowStart4;
    let totalHeight = area2.height;
    while (totalHeight < $height && rowEnd < this.$rowsLength) {
      const h = this.$rowHeight(rowEnd);
      totalHeight += h;
      rowEnd += 1;
    }
    let colEnd = colStart4;
    let totalWidth = area2.width;
    while (totalWidth < $width && colEnd < this.$colsLength) {
      const w = this.$colWidth(colEnd);
      totalWidth += w;
      colEnd += 1;
    }
    const area4 = $newArea.call(this, rowStart4, colStart4, rowEnd, colEnd);
    const area1 = $newArea.call(this, $rowStart, colStart4, fr - 1, colEnd);
    const area3 = $newArea.call(this, rowStart4, $colStart, rowEnd, fc - 1);
    // console.log('area1:', area1, ', area2:', area2, ', area3:', area3, ', area4:', area4);
    return [area1, area2, area3, area4];
  }

  // target: cssSelector | element
  to(target) {
    const { $drawMap } = this;
    let el = target;
    if (typeof target === 'string') {
      el = document.querySelector(target);
    }
    if (!$drawMap.has(el)) {
      $drawMap.set(el, Canvas2d.create(el));
    }
    const draw = $drawMap.get(el);
    $render.call(this, draw);
    return this;
  }

  select(ref) {
    this.$select = newCellRange(ref);
    return this;
  }

  freeze(ref) {
    if (ref !== 'A1') {
      this.$rowStart = this.$scrollRow;
      this.$colStart = this.$scrollCol;
      this.$scrollRow = 0;
      this.$scrollCol = 0;
    } else {
      this.$scrollRow = this.$rowStart;
      this.$scrollCol = this.$colStart;
      this.$rowStart = 0;
      this.$colStart = 0;
    }
    this.$freeze = ref;
    return this;
  }

  static create(width, height) {
    return new TableRender(width, height);
  }
}

// single property
[
  'width', 'height', 'rowsLength', 'colsLength',
  'rowHeight', 'colWidth', 'scrollRow', 'scrollCol',
  'indexRowHeight', 'indexRowsLength', 'indexColWidth', 'indexColText',
  'cell', 'indexColCell', 'indexRowCell',
  'merges', 'indexMerges',
].forEach((it) => {
  TableRender.prototype[it] = function (arg) {
    this[`$${it}`] = arg;
    return this;
  };
});

// object property
[
  'lineStyle', 'cellStyle', 'indexStyle', 'indexLineStyle',
  'selectStyle', 'freezeLineStyle',
].forEach((it) => {
  TableRender.prototype[it] = function (arg) {
    Object.assign(this[`$${it}`], arg || {});
    return this;
  };
});

export default TableRender;

window.WolfTableRender = TableRender;
