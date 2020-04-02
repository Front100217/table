/* global window, document */
/* eslint func-names: ["error", "never"] */
import { cellRender } from './cell-render';
import { stringAt } from './alphabet';
import Canvas2d from './canvas2d';

// area: [row-start, col-start, row-end, col-end]
// r: row-index
function inAreaRow(area, r) {
  return r >= area[0] && r <= area[2];
}

// area: [row-start, col-start, row-end, col-end]
// c: col-index
function inAreaCol(area, c) {
  return c >= area[1] && c <= area[3];
}

// area: [row-start, col-start, row-end, col-end]
function inArea(area, r, c) {
  return inAreaRow(area, r) && inAreaCol(area, c);
}

// draw
// area: [row-start, col-start, row-end, col-end, width, height]
// rows: Function<{y, h}>
// cols: Function<{x, w}>
function renderLines(draw, area, rows, cols, { width, color }) {
  // render row-col-lines
  if (width > 0) {
    const [rs, cs, re, ce, aw, ah] = area;
    draw.save().beginPath()
      .attr({ lineWidth: width, strokeStyle: color });

    for (let ri = rs; ri <= re; ri += 1) {
      const { y } = rows(ri);
      draw.line([0, y], [aw, y]);
    }
    for (let ci = cs; ci <= ce; ci += 1) {
      const { x } = cols(ci);
      draw.line([x, 0], [x, ah]);
    }
    draw.restore();
  }
}

// draw
// area: [row-start, col-start, row-end, col-end]
// rows: Function<{y, h}>
// cols: Function<{x, w}>
// cell: Function<{ text, style }>
// style: the default cell style
// hlArea: highlightArea
// hlStyle: highlightStyle
function renderCells(draw, area, rows, cols, cell, cellStyle, hlArea, hlStyle) {
  draw.save();
  const [rs, cs, re, ce] = area;
  for (let ri = rs; ri <= re; ri += 1) {
    const { y, h } = rows(ri);
    for (let ci = cs; ci <= ce; ci += 1) {
      const { x, w } = cols(ci);
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
      // console.log('text:', text, ', x:', x, ', y:', y, style);
      cellRender(draw, text, {
        left: x, top: y, width: w, height: h,
      }, style);
      if (inArea(hlArea, ri, ci)) {
        draw.save()
          .attr({ fillStyle: hlStyle.bgcolor })
          .fillRect(x, y, w, h)
          .restore();
      }
    }
  }
  draw.restore();
}

class TableRender {
  constructor(width, height) {
    this.$drawMap = new Map();
    this.$width = width;
    this.$height = height;
    this.$rowsLength = 100;
    this.$colsLength = 26;
    this.$rowStart = 0;
    this.$colStart = 0;
    this.$rowHeight = () => 25;
    this.$colWidth = () => 100;

    // line-style
    this.$lineStyle = {
      width: 1,
      color: '#e6e6e6',
    };

    // index...
    this.$indexRowHeight = 25;
    this.$indexRowsLength = 1;
    this.$indexRowCell = (r) => r + 1;
    this.$indexColWidth = 60;
    this.$indexColCell = (r, c) => stringAt(c);
    // index-style
    this.$indexStyle = {
      bgcolor: '#f4f5f8',
      align: 'center',
      valign: 'middle',
      fontSize: 9,
      fontFamily: 'Source Sans Pro',
      color: '#585757',
    };

    // highlight-area
    // [row-start, col-start, row-end, col-end]
    this.$highlightArea = [-1, -1, -1, -1];
    this.$highlightStyle = {
      color: '#4b89ff',
      bgcolor: '#4b89ff14',
      lineWidth: 2,
      lineColor: '#4b89ff',
    };

    // cell
    this.$cellStyle = {
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
    this.$cell = () => '';
  }

  to(cssSelector) {
    const { $drawMap } = this;
    if (!$drawMap.has(cssSelector)) {
      const el = document.querySelector(cssSelector);
      $drawMap.set(cssSelector, Canvas2d.create(el));
    }
    const draw = $drawMap.get(cssSelector);

    const {
      $width, $height, $rowStart, $colStart,
      $indexStyle, $lineStyle, $indexColWidth,
      $highlightArea, $highlightStyle, $indexRowHeight, $indexRowsLength,
    } = this;
    draw.resize($width, $height);

    const indexRowsHeight = $indexRowHeight * $indexRowsLength;

    let totalh = 0;
    let rowEnd = $rowStart;
    const rows = new Map();
    while (totalh < $height) {
      const h = this.$rowHeight(rowEnd);
      rows.set(rowEnd, { y: totalh, h });
      totalh += h;
      rowEnd += 1;
    }
    rows.set(rowEnd, { y: totalh, h: this.$rowHeight(rowEnd) });

    let totalw = 0;
    let colEnd = $colStart;
    const cols = new Map();
    while (totalw < $width) {
      const w = this.$colWidth(colEnd);
      cols.set(colEnd, { x: totalw, w });
      totalw += w;
      colEnd += 1;
    }
    cols.set(colEnd, { x: totalw, w: this.$colWidth(colEnd) });

    if ($indexColWidth > 0 && indexRowsHeight > 0) {
      draw.save().attr({ fillStyle: $indexStyle.bgcolor })
        .rect(0, 0, $indexColWidth, indexRowsHeight)
        .fill()
        .restore();
    }

    // render row-index
    if ($indexColWidth > 0) {
      draw.save().translate(0, indexRowsHeight);
      const area = [$rowStart, 0, rowEnd, 0, $indexColWidth, $height];
      const colsFunc = () => ({ x: 0, w: $indexColWidth });
      renderLines(draw, area, (i) => rows.get(i), colsFunc, $lineStyle);
      renderCells(draw, area, (i) => rows.get(i), colsFunc,
        this.$indexRowCell, $indexStyle,
        [$highlightArea[0], 0, $highlightArea[2], 0], $highlightStyle);
      draw.restore();
    }
    // render col-index
    if (indexRowsHeight > 0) {
      draw.save().translate($indexColWidth, 0);
      const area = [0, $colStart, $indexRowsLength - 1, colEnd, $width, indexRowsHeight];
      const rowsFunc = (i) => ({ y: i * $indexRowHeight, h: $indexRowHeight });
      renderLines(draw, area, rowsFunc, (i) => cols.get(i), $lineStyle);
      renderCells(draw, area, rowsFunc, (i) => cols.get(i),
        this.$indexColCell, $indexStyle,
        [0, $highlightArea[1], 0, $highlightArea[3]], $highlightStyle);
      draw.restore();
    }

    // render content
    const area = [$rowStart, $colStart, rowEnd, colEnd, $width, $height];
    draw.translate($indexColWidth, indexRowsHeight);
    renderLines(draw, area, (i) => rows.get(i), (i) => cols.get(i), $lineStyle);
    renderCells(draw, area, (i) => rows.get(i), (i) => cols.get(i),
      this.$cell, this.$cellStyle, $highlightArea, $highlightStyle);
  }
}

// single property
[
  'width', 'height', 'rowsLength', 'colsLength',
  'rowHeight', 'colWidth', 'rowStart', 'colStart',
  'indexRowHeight', 'indexRowsLength', 'indexColWidth', 'indexColText',
  'cell', 'indexColCell', 'indexRowCell', 'highlightArea',
].forEach((it) => {
  TableRender.prototype[it] = function (arg) {
    this[`$${it}`] = arg;
    return this;
  };
});

// object property
[
  'lineStyle', 'cellStyle', 'indexStyle', 'highlightStyle',
].forEach((it) => {
  TableRender.prototype[it] = function (arg) {
    Object.assign(this[`$${it}`], arg || {});
    return this;
  };
});

export function wolfTableRender(width, height) {
  return new TableRender(width, height);
}

export default TableRender;

window.wolfTableRender = wolfTableRender;
