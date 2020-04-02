/* global window, document */
/* eslint func-names: ["error", "never"] */
import { cellRender } from './cell-render';
import { stringAt, expr2xy } from './alphabet';
import Canvas2d from './canvas2d';

// refs: 'A1:C3'
// return: [row-start, col-start, row-end, col-end]
function refs2area(refs) {
  const ary = refs.split(':');
  const s = expr2xy(ary[0]);
  const e = expr2xy(ary[1]);
  return [s[1], s[0], e[1], e[0], e[1] - s[1], e[0] - s[0]];
}

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

function maxSpansInMerges(...mergess) {
  const spans = [0, 0];
  mergess.forEach((merges) => {
    merges.forEach((merge) => {
      const [,,,, rn, cn] = refs2area(merge);
      if (rn > spans[0]) spans[0] = rn;
      if (cn > spans[1]) spans[1] = cn;
    });
  });
  return spans;
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
      const { y, h } = rows(ri);
      draw.line([0, y + h], [aw, y + h]);
    }

    for (let ci = cs; ci <= ce; ci += 1) {
      const { x, w } = cols(ci);
      draw.line([x + w, 0], [x + w, ah]);
    }
    draw.restore();
  }
}

// draw: Canvas2d
// cell: Function<{ text, style }>
// cellRect: { left, top, width, height }
// cellStyle
// hlArea: highlightArea
// hlStyle: highlightStyle
function renderCell(draw, ri, ci, cell, cellRect, cellStyle, hlArea, hlStyle) {
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
  if (hlArea && inArea(hlArea, ri, ci)) {
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
// area: [row-start, col-start, row-end, col-end]
// rows: Function<{y, h}>
// cols: Function<{x, w}>
// cell: Function<{ text, style }>
// cellStyle: the default cell style
// hlArea: highlightArea
// hlStyle: highlightStyle
// merges: ['A1:B2',....]
function renderCells(draw, area, rows, cols, cell, cellStyle, hlArea, hlStyle, merges) {
  draw.save();
  const [rs, cs, re, ce] = area;
  for (let ri = rs; ri <= re; ri += 1) {
    const { y, h } = rows(ri);
    for (let ci = cs; ci <= ce; ci += 1) {
      const { x, w } = cols(ci);
      renderCell(draw, ri, ci, cell, {
        left: x, top: y, width: w, height: h,
      }, cellStyle, hlArea, hlStyle);
    }
  }
  if (merges && merges.length > 0) {
    merges.forEach((merge) => {
      const [mrs, mcs, mre, mce] = refs2area(merge);
      // console.log('merge:', merge, [mrs, mcs, mre, mce], area);
      if (mrs <= re && mcs <= ce && rs <= mre && cs <= mce) {
        // console.log('merge>>:', merge);
        const { x } = cols(mcs);
        const { y } = rows(mrs);
        let width = 0;
        let height = 0;
        for (let ri = mrs; ri <= mre; ri += 1) height += rows(ri).h;
        for (let ci = mcs; ci <= mce; ci += 1) width += cols(ci).w;
        // console.log('x:', x, ', y:', y, ', width:', width, ', height:', height);
        renderCell(draw, mrs, mcs, cell, {
          left: x, top: y, width, height,
        }, cellStyle, hlArea, hlStyle);
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
    // [row-start, col-start, row-end, col-end]
    this.$highlightArea = [-1, -1, -1, -1];
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
      $highlightArea, $highlightStyle,
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

    // <- cols, rows for merges
    if ($rowStart > 0 || $colStart > 0) {
      const [rowMaxSpan, colMaxSpan] = maxSpansInMerges($merges, $indexMerges);
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
      [$rowStart, $colStart, rowEnd, colEnd, $width, $height],
      (i) => rows.get(i),
      (i) => cols.get(i),
      this.$cell, this.$cellStyle, $lineStyle,
      $highlightArea, $highlightStyle, $merges);
    draw.restore();

    // render row-index
    if ($indexColWidth > 0) {
      draw.save().translate(0, indexRowsHeight);
      renderContent(draw,
        [$rowStart, 0, rowEnd, 0, $indexColWidth, $height],
        (i) => rows.get(i),
        () => ({ x: 0, w: $indexColWidth }),
        this.$indexRowCell, $indexStyle, $indexLineStyle,
        [$highlightArea[0], 0, $highlightArea[2], 0], $highlightStyle);
      draw.restore();
    }
    // render col-index
    if (indexRowsHeight > 0) {
      draw.save().translate($indexColWidth, 0);
      renderContent(draw,
        [0, $colStart, $indexRowsLength - 1, colEnd, $width, indexRowsHeight],
        (i) => ({ y: i * $indexRowHeight, h: $indexRowHeight }),
        (i) => cols.get(i),
        this.$indexColCell, $indexStyle, $indexLineStyle,
        [0, $highlightArea[1], 0, $highlightArea[3]], $highlightStyle, $indexMerges);
      draw.restore();
    }

    // top-left
    if ($indexColWidth > 0 && indexRowsHeight > 0) {
      renderContent(draw,
        [0, 0, 0, 0, $indexColWidth, indexRowsHeight],
        () => ({ y: 0, h: indexRowsHeight }),
        () => ({ x: 0, w: $indexColWidth }),
        () => '', $indexStyle, $indexLineStyle);
    }
  }
}

// single property
[
  'width', 'height', 'rowsLength', 'colsLength',
  'rowHeight', 'colWidth', 'rowStart', 'colStart',
  'indexRowHeight', 'indexRowsLength', 'indexColWidth', 'indexColText',
  'cell', 'indexColCell', 'indexRowCell', 'highlightArea',
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

export function wolfTableRender(width, height) {
  return new TableRender(width, height);
}

export default TableRender;

window.wolfTableRender = wolfTableRender;
