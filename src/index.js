/* global window, document */
/* eslint func-names: ["error", "never"] */
import { stringAt, expr2xy } from './alphabet';
import Canvas2d from './canvas2d';
import { newArea } from './table-area';
import { newCellRange } from './cell-range';
import { render } from './render';

function bind(target, eventName, func) {
  let name = eventName;
  if (name === 'mousewheel'
    && /Firefox/i.test(window.navigator.userAgent)) {
    name = 'DOMMouseScroll';
  }
  target.addEventListener(name, func);
}

function $newArea(rowStart, colStart, rowEnd, colEnd, x, y) {
  return newArea(rowStart, colStart, rowEnd, colEnd,
    this.$col, this.$row, x, y);
}

//                |
//    2(top-left) | 1(top-right)
// ------------------------------------
// 3(bottom-left) | 4(bottom-right)
//                |
function $newViewAreas() {
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
  let rowEnd = rowStart4;
  let totalHeight = area2.height;
  while (totalHeight < $height && rowEnd < this.$rowsLength) {
    const { height, hide } = this.$row(rowEnd);
    if (hide !== true) {
      totalHeight += height;
      rowEnd += 1;
    }
  }
  let colEnd = colStart4;
  let totalWidth = area2.width;
  while (totalWidth < $width && colEnd < this.$colsLength) {
    const { width, hide } = this.$col(colEnd);
    if (hide !== true) {
      totalWidth += width;
      colEnd += 1;
    }
  }
  const area4 = $newArea.call(this, rowStart4, colStart4, rowEnd, colEnd,
    tx + area2.width, ty + area2.height);
  const area1 = $newArea.call(this, $rowStart, colStart4, fr - 1, colEnd,
    tx + area2.width, ty + 0);
  const area3 = $newArea.call(this, rowStart4, $colStart, rowEnd, fc - 1,
    tx + 0, ty + area2.height);
  // console.log('area1:', area1, ', area2:', area2, ', area3:', area3, ', area4:', area4);
  return [area1, area2, area3, area4];
}

// event
function $clickHandler(viewAreas, evt) {
  const { offsetX, offsetY } = evt;
  console.log('click.evt:', evt, viewAreas);
}
// --- end ---

class Table {
  $drawMap = new Map();

  $rowsLength = 100;

  $colsLength = 26;

  $rowStart = 0;

  $colStart = 0;

  $row = () => ({ height: 25, hide: false });

  $col = () => ({ width: 100, hide: false });

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
    borderWidth: 2,
    borderColor: '#4b89ff',
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

  // target: cssSelector | element
  to(target) {
    const { $drawMap } = this;
    let el = target;
    if (typeof target === 'string') {
      el = document.querySelector(target);
    }
    const viewAreas = $newViewAreas.call(this);
    if (!$drawMap.has(el)) {
      // bind events
      bind(el, 'click', $clickHandler.bind(this, viewAreas));
      $drawMap.set(el, Canvas2d.create(el));
    }
    const draw = $drawMap.get(el);
    render.call(this, draw, viewAreas);
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
    return new Table(width, height);
  }
}

// single property
[
  'width', 'height', 'rowsLength', 'colsLength',
  'scrollRow', 'scrollCol',
  'indexRowHeight', 'indexRowsLength', 'indexColWidth', 'indexColText',
  'cell', 'indexColCell', 'indexRowCell',
  'merges', 'indexMerges',
].forEach((it) => {
  Table.prototype[it] = function (arg) {
    this[`$${it}`] = arg;
    return this;
  };
});

// object property
[
  'lineStyle', 'cellStyle', 'indexStyle', 'indexLineStyle',
  'selectStyle', 'freezeLineStyle', 'row', 'col',
].forEach((it) => {
  Table.prototype[it] = function (arg) {
    Object.assign(this[`$${it}`], arg || {});
    return this;
  };
});

export default Table;

window.WolfTable = Table;
