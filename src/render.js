import { cellRender } from './cell-render';
import { eachCellRanges } from './cell-range';
import { newArea } from './table-area';
import { expr2xy } from './alphabet';

function renderLines(draw, area, { width, color }) {
  // render row-col-lines
  if (width > 0) {
    // const [rs, cs, re, ce, aw, ah] = area;
    draw.save().beginPath()
      .attr({ lineWidth: width, strokeStyle: color });

    area.rowEach((ri, v) => {
      const h = v.y + v.height;
      draw.line([0, h], [area.width, h]);
    });

    area.colEach((ci, v) => {
      const w = v.x + v.width;
      draw.line([w, 0], [w, area.height]);
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
  eachCellRanges(merges, (it) => {
    if (it.intersects(area)) {
      renderCell(draw, it.rowStart, it.colStart,
        cell, area.rect(it), cellStyle);
    }
  });

  // render select
  if (select && area.intersects(select)) {
    const {
      x, y, width, height,
    } = area.rect(select);
    const { bgcolor, borderWidth, borderColor } = selectStyle;
    const bw = type === 'content' ? borderWidth : 0;
    const bw2 = bw * 2;
    draw.save()
      .attr({ fillStyle: bgcolor })
      .rect(x + bw, y + bw, width - bw2, height - bw2)
      .fill();
    if (type === 'content') {
      draw.attr({
        strokeStyle: borderColor,
        lineWidth: borderWidth,
      }).stroke();
    }
    draw.restore();
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
function renderIndexRows(draw, area) {
  // render row-index
  if (this.$indexColWidth > 0) {
    draw.save().translate(0, area.y);
    const nselect = this.$select.clone();
    nselect.colStart = 0;
    nselect.colEnd = 0;
    renderLinesAndCells(draw, 'index-rows', area,
      this.$indexRowCell, this.$indexStyle, this.$indexLineStyle,
      nselect, this.$selectStyle);
    draw.restore();
  }
}

function renderIndexCols(draw, area) {
  // render col-index
  if (this.indexRowsHeight > 0) {
    draw.save().translate(area.x, 0);
    const nselect = this.$select.clone();
    nselect.rowStart = 0;
    nselect.rowEnd = area.rowEnd;
    renderLinesAndCells(draw, 'index-cols', area,
      this.$indexColCell, this.$indexStyle, this.$indexLineStyle,
      nselect, this.$selectStyle, this.$indexMerges);
    draw.restore();
  }
}

function renderBody(draw, area) {
  draw.save().translate(area.x, area.y);
  renderLinesAndCells(draw, 'content', area,
    this.$cell, this.$cellStyle, this.$lineStyle,
    this.$select, this.$selectStyle, this.$merges);
  draw.restore();
}

function renderFreezeLines(draw, x, y) {
  const [fc, fr] = expr2xy(this.$freeze);
  const { width, color } = this.$freezeLineStyle;
  // console.log('width:', width, color, fr, fc);
  if (width > 0 && (fr > 0 || fc > 0)) {
    draw.save().beginPath().attr({ lineWidth: width, strokeStyle: color });
    if (fr > 0) draw.line([0, y], [this.$width, y]);
    if (fc > 0) draw.line([x, 0], [x, this.$height]);
    draw.restore();
  }
}

export function render(draw,
  [area1, area2, area3, area4],
  [iarea1, iarea21, iarea23, iarea3]) {
  // const tx = this.$indexColWidth;
  // const ty = this.indexRowsHeight;
  // const { width, height } = area2;
  draw.resize(this.$width, this.$height);

  // render area-4
  renderBody.call(this, draw, area4);

  // render area-1
  renderBody.call(this, draw, area1);
  renderIndexCols.call(this, draw, iarea1);

  // render area-3
  renderBody.call(this, draw, area3);
  renderIndexRows.call(this, draw, iarea3);

  // render area-2
  renderBody.call(this, draw, area2);
  renderIndexCols.call(this, draw, iarea21);
  renderIndexRows.call(this, draw, iarea23);

  // render freeze
  renderFreezeLines.call(this, draw, area4.x, area4.y);

  // left-top
  const { x, y } = area2;
  if (x > 0 && y > 0) {
    renderLinesAndCells(draw, 'index',
      newArea(0, 0, 0, 0, () => ({ width: x }), () => ({ height: y })),
      () => '', this.$indexStyle, this.$indexLineStyle);
  }
}

export default {};
