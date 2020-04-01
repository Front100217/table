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
    this.$indexColWidth = 60;
    this.$indexColText = (index) => stringAt(index);
    // index-style
    this.$indexStyle = {
      bgcolor: '#f4f5f8',
      align: 'center',
      valign: 'middle',
      font: '500 9pt Source Sans Pro',
      color: '#585757',
    };

    // highlight-area
    // [row-start, col-start, row-end, col-end]
    this.$highlightArea = [2, 2, 3, 3];
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
      $indexStyle, $lineStyle, $indexRowHeight, $indexColWidth, $indexColText,
      $highlightArea, $highlightStyle,
    } = this;
    draw.resize($width, $height);

    // col-line
    const colLines = [];
    // row-line
    const rowLines = [];

    let totalh = 0;
    let rowEnd = $rowStart;
    const rows = new Map();
    while (totalh < $height) {
      const h = this.$rowHeight(rowEnd);
      rowLines.push([[0, totalh], [$width, totalh]]);
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
      colLines.push([[totalw, 0], [totalw, $height]]);
      cols.set(colEnd, { x: totalw, w });
      totalw += w;
      colEnd += 1;
    }
    cols.set(colEnd, { x: totalw, w: this.$colWidth(colEnd) });

    // index
    draw.save().beginPath();
    // index-background
    draw.attr({ fillStyle: $indexStyle.bgcolor })
      .fillRect(0, 0, $width, $indexRowHeight)
      .fillRect(0, 0, $indexColWidth, $height);
    draw.attr({
      textAlign: $indexStyle.align,
      textBaseline: $indexStyle.valign,
      font: $indexStyle.font,
      fillStyle: $indexStyle.color,
      lineWidth: $lineStyle.width,
      strokeStyle: $lineStyle.color,
    });
    // render row-index
    if ($indexRowHeight > 0) {
      draw.save().translate(0, $indexRowHeight);
      for (let ri = $rowStart; ri <= rowEnd; ri += 1) {
        const { y, h } = rows.get(ri);
        if (inAreaRow($highlightArea, ri)) {
          draw.save()
            .attr({ fillStyle: $highlightStyle.bgcolor })
            .fillRect(0, y, $indexColWidth, h)
            .restore();
        }
        draw.line([0, y], [$indexColWidth, y])
          .fillText(ri + 1, $indexColWidth / 2, y + (h / 2));
      }
      draw.line([$indexColWidth, 0], [$indexColWidth, totalh])
        .restore();
    }
    // render col-index
    if ($indexColWidth > 0) {
      draw.save().translate($indexColWidth, 0);
      for (let ci = $colStart; ci <= colEnd; ci += 1) {
        const { x, w } = cols.get(ci);
        if (inAreaCol($highlightArea, ci)) {
          draw.save()
            .attr({ fillStyle: $highlightStyle.bgcolor })
            .fillRect(x, 0, w, $indexRowHeight)
            .restore();
        }
        draw.line([x, 0], [x, $indexRowHeight])
          .fillText($indexColText(ci), x + (w / 2), $indexRowHeight / 2);
      }
      draw.line([0, $indexRowHeight], [totalw, $indexRowHeight])
        .restore();
    }
    draw.restore();

    // to x, y
    draw.translate($indexColWidth, $indexRowHeight);
    // render row-col-lines
    if ($lineStyle.width > 0) {
      draw.save().beginPath()
        .attr({ lineWidth: $lineStyle.width, strokeStyle: $lineStyle.color })
        .lines(...colLines)
        .lines(...rowLines)
        .restore();
    }
    // render content
    draw.save();
    for (let ri = $rowStart; ri <= rowEnd; ri += 1) {
      const { y, h } = rows.get(ri);
      for (let ci = $colStart; ci <= colEnd; ci += 1) {
        const { x, w } = cols.get(ci);
        const c = this.$cell(ri, ci);
        let text = '';
        let style = this.$cellStyle;
        if (c) {
          if (typeof c === 'string') text = c;
          else {
            text = c.text || '';
            if (c.style) {
              style = { ...style, ...c.style };
            }
          }
        }
        cellRender(draw, text, {
          left: x, top: y, width: w, height: h,
        }, style);
        if (inArea($highlightArea, ri, ci)) {
          draw.save()
            .attr({ fillStyle: $highlightStyle.bgcolor })
            .fillRect(x, y, w, h)
            .restore();
        }
      }
    }
    draw.restore();
  }
}

// single property
[
  'width', 'height', 'rowsLength', 'colsLength',
  'rowHeight', 'colWidth', 'rowStart', 'colStart',
  'cell', 'indexRowHeight', 'indexColWidth', 'indexCellText',
  'highlightArea',
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
