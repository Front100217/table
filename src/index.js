/* global window, document */
/* eslint func-names: ["error", "never"] */
import { cellRender } from './cell-render';
import { stringAt } from './alphabet';
import Canvas2d from './canvas2d';
import { newArea } from './table-area';

function maxSpansInMerges(area, merges) {
  const spans = [0, 0];
  merges.forEach((merge) => {
    const a = newArea(merge);
    if (a.intersects(area)) {
      // console.log('a:', a);
      if (a.rowLen > spans[0]) spans[0] = a.rowLen;
      if (a.colLen > spans[1]) spans[1] = a.colLen;
    }
  });
  return spans;
}

// draw
// area: TableArea
// rows: Function<{y, h}>
// cols: Function<{x, w}>
function renderLines(draw, area, rows, cols, { width, color }) {
  // render row-col-lines
  if (width > 0) {
    // const [rs, cs, re, ce, aw, ah] = area;
    draw.save().beginPath()
      .attr({ lineWidth: width, strokeStyle: color });

    area.rowEach((ri) => {
      const { y, h } = rows(ri);
      draw.line([0, y + h], [area.width, y + h]);
    });

    area.colEach((ci) => {
      const { x, w } = cols(ci);
      draw.line([x + w, 0], [x + w, area.height]);
    });
    draw.restore();
  }
}

// draw: Canvas2d
// cell: Function<{ text, style }>
// cellRect: { left, top, width, height }
// cellStyle
// hl: highlight
// hlStyle: highlightStyle
function renderCell(draw, ri, ci, cell, cellRect, cellStyle, hl, hlStyle) {
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
  cellRender(draw, text, cellRect, style);
  if (hl && newArea(hl).includes(ri, ci)) {
    const {
      left, top, width, height,
    } = cellRect;
    draw.save()
      .attr({ fillStyle: hlStyle.bgcolor })
      .fillRect(left, top, width, height)
      .restore();
  }
}

// draw: Canvas2d
// area: TableArea
// rows: Function<{y, h}>
// cols: Function<{x, w}>
// cell: Function<{ text, style }>
// cellStyle: the default cell style
// hl: highlight
// hlStyle: highlightStyle
// merges: ['A1:B2',....]
function renderCells(draw, area, rows, cols, cell, cellStyle, hl, hlStyle, merges) {
  draw.save();
  // const [rs, cs, re, ce] = area;
  area.each((ri, ci) => {
    const { y, h } = rows(ri);
    const { x, w } = cols(ci);
    renderCell(draw, ri, ci, cell, {
      left: x, top: y, width: w, height: h,
    }, cellStyle, hl, hlStyle);
  });
  if (merges && merges.length > 0) {
    merges.forEach((merge) => {
      const a = newArea(merge);
      // console.log('merge:', merge, [mrs, mcs, mre, mce], area);
      if (a.intersects(area)) {
        const { rowStart, colStart } = a;
        // console.log('rowStart:', rowStart, ', colStart:', colStart);
        const { x } = cols(colStart);
        const { y } = rows(rowStart);
        let width = 0;
        let height = 0;
        a.rowEach((i) => { height += rows(i).h; });
        a.colEach((i) => { width += cols(i).w; });
        // console.log('x:', x, ', y:', y, ', width:', width, ', height:', height);
        renderCell(draw, rowStart, colStart, cell, {
          left: x, top: y, width, height,
        }, cellStyle, hl, hlStyle);
      }
    });
  }
  draw.restore();
}

function renderContent(draw, area, rows, cols,
  cell, cellStyle, lineStyle, hlArea, hlStyle, merges) {
  renderLines(draw, area, rows, cols, lineStyle);
  renderCells(draw, area, rows, cols, cell, cellStyle, hlArea, hlStyle, merges);
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
    this.$indexMerges = [];
    this.$indexLineStyle = {
      width: 1,
      color: '#e6e6e6',
    };
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
    // ref: 'A1' || 'A1:B1'
    this.$highlight = undefined;
    this.$highlightStyle = {
      color: '#4b89ff',
      bgcolor: '#4b89ff14',
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
    // ['A1:B2',...]
    this.$merges = [];
  }

  get indexRowsHeight() {
    return this.$indexRowHeight * this.$indexRowsLength;
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
      $highlight, $highlightStyle,
      $indexRowHeight, $indexRowsLength, indexRowsHeight,
      $merges, $indexMerges, $indexLineStyle,
    } = this;
    draw.resize($width, $height);

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

    const viewArea = newArea($rowStart, $colStart, rowEnd, colEnd, $width, $height);
    const colViewArea = newArea(0, $colStart, $indexRowsLength - 1, colEnd,
      $width, indexRowsHeight);

    // <- cols, rows for merges
    if ($rowStart > 0 || $colStart > 0) {
      let [rowMaxSpan, colMaxSpan] = [0, 0];
      ([rowMaxSpan, colMaxSpan] = maxSpansInMerges(viewArea, $merges));
      const [, indexColMaxSpan] = maxSpansInMerges(colViewArea, $indexMerges);
      if (colMaxSpan < indexColMaxSpan) colMaxSpan = indexColMaxSpan;
      // console.log('rowMaxSpan:', rowMaxSpan, ', colMaxSpan:', colMaxSpan);
      if ($rowStart > 0 && rowMaxSpan > 0) {
        totalh = 0;
        for (let i = 1; i <= rowMaxSpan; i += 1) {
          const ii = $rowStart - i;
          if (ii >= 0) {
            const h = this.$rowHeight(ii);
            totalh -= h;
            rows.set(ii, { y: totalh, h });
          }
        }
      }
      if ($colStart > 0 && colMaxSpan > 0) {
        totalw = 0;
        for (let i = 1; i <= colMaxSpan; i += 1) {
          const ii = $colStart - i;
          if (ii >= 0) {
            const w = this.$colWidth(ii);
            totalw -= w;
            cols.set(ii, { x: totalw, w });
          }
        }
      }
    }

    // render content
    draw.save().translate($indexColWidth, indexRowsHeight);
    renderContent(draw,
      viewArea,
      (i) => rows.get(i),
      (i) => cols.get(i),
      this.$cell, this.$cellStyle, $lineStyle,
      $highlight, $highlightStyle, $merges);
    draw.restore();

    // render row-index
    if ($indexColWidth > 0) {
      draw.save().translate(0, indexRowsHeight);
      renderContent(draw,
        newArea($rowStart, 0, rowEnd, 0, $indexColWidth, $height),
        (i) => rows.get(i),
        () => ({ x: 0, w: $indexColWidth }),
        this.$indexRowCell, $indexStyle, $indexLineStyle,
        $highlight && $highlight.replace(/\w+/g, 'A'), $highlightStyle);
      draw.restore();
    }
    // render col-index
    if (indexRowsHeight > 0) {
      draw.save().translate($indexColWidth, 0);
      renderContent(draw,
        colViewArea,
        (i) => ({ y: i * $indexRowHeight, h: $indexRowHeight }),
        (i) => cols.get(i),
        this.$indexColCell, $indexStyle, $indexLineStyle,
        $highlight && $highlight.replace(/\d+/g, '0'), $highlightStyle, $indexMerges);
      draw.restore();
    }

    // top-left
    if ($indexColWidth > 0 && indexRowsHeight > 0) {
      renderContent(draw,
        newArea(0, 0, 0, 0, $indexColWidth, indexRowsHeight),
        () => ({ y: 0, h: indexRowsHeight }),
        () => ({ x: 0, w: $indexColWidth }),
        () => '', $indexStyle, $indexLineStyle);
    }
  }

  static create(width, height) {
    return new TableRender(width, height);
  }
}

// single property
[
  'width', 'height', 'rowsLength', 'colsLength',
  'rowHeight', 'colWidth', 'rowStart', 'colStart',
  'indexRowHeight', 'indexRowsLength', 'indexColWidth', 'indexColText',
  'cell', 'indexColCell', 'indexRowCell', 'highlight',
  'merges', 'indexMerges',
].forEach((it) => {
  TableRender.prototype[it] = function (arg) {
    this[`$${it}`] = arg;
    return this;
  };
});

// object property
[
  'lineStyle', 'cellStyle', 'indexStyle', 'indexLineStyle', 'highlightStyle',
].forEach((it) => {
  TableRender.prototype[it] = function (arg) {
    Object.assign(this[`$${it}`], arg || {});
    return this;
  };
});

export default TableRender;

window.WolfTableRender = TableRender;
