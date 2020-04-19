/* global window, document */
/* eslint func-names: ["error", "never"] */
import { stringAt, expr2xy } from './alphabet';
import Canvas2d from './canvas2d';
import { newRange } from './range';
import { render } from './render';
import Viewport from './viewport';

function bind(target, eventName, func) {
  let name = eventName;
  if (name === 'mousewheel'
    && /Firefox/i.test(window.navigator.userAgent)) {
    name = 'DOMMouseScroll';
  }
  target.addEventListener(name, func);
}

/**
 * ----------------------------------------------------------------
 * |            | column header                                   |
 * ----------------------------------------------------------------
 * |            |                                                 |
 * | row header |              body                               |
 * |            |                                                 |
 * ----------------------------------------------------------------
 * row { height, hide, autoFit }
 * col { width, hide, autoFit }
 * cell {
 *   text,
 *   style: {
 *     border, fontSize, fontName,
 *     bold, italic, color, bgcolor,
 *     align, valign, underline, strike,
 *     rotate, textwrap, padding,
 *   },
 *   type: text | button | link | checkbox | radio | list | progress | image | imageButton | date
 * }
 */
class Table {
  $drawMap = new Map();

  // the count of rows
  $rows = 100;

  // the count of cols;
  $cols = 26;

  /**
   * get row given rowIndex
   * @param {int} rowIndex
   * @returns { height, hide, autoFit } row
   */
  $row = () => ({ height: 25, hide: false, autoFit: false });

  /**
   * get col given colIndex
   * @param {int} coIndex
   * @returns { width, hide, autoFit } col
   */
  $col = () => ({ width: 100, hide: false, autoFit: false });

  /**
   * get cell given rowIndex, colIndex
   * @param {int} rowIndex
   * @param {int} colIndex
   * @returns { text, style, type, ...} cell
   */
  $cell = () => '';

  $lineStyle = {
    width: 1,
    color: '#e6e6e6',
  };

  $cellStyle = {
    bgcolor: '#ffffff',
    align: 'left',
    valign: 'middle',
    textwrap: true,
    underline: false,
    color: '#0a0a0a',
    bold: false,
    italic: false,
    rotate: 0,
    fontSize: 9,
    fontName: 'Source Sans Pro',
  };

  $merges = [];

  // row header
  $rowHeader = {
    width: 60,
    cell(r) {
      return r + 1;
    },
  }

  // column header
  $colHeader = {
    height: 25,
    rows: 1,
    merges: [],
    cell(r, c) {
      return stringAt(c);
    },
    get rowHeight() {
      return this.height / this.rows;
    },
  }

  $headerLineStyle = {
    width: 1,
    color: '#e6e6e6',
  };

  $headerCellStyle = {
    bgcolor: '#f4f5f8',
    align: 'center',
    valign: 'middle',
    color: '#585757',
    fontSize: 9,
    fontName: 'Source Sans Pro',
  };

  // a highlight cell without background filled shows as focused cell
  $focus = undefined;

  // The selection range contains multiple cells
  $selection = undefined;

  $selectionStyle = {
    borderWidth: 2,
    borderColor: '#4b89ff',
    bgcolor: '#4b89ff14',
  };

  // row of the start position in table
  $startRow = 0;

  // col of the start position in table
  $startCol = 0;

  // scroll to row
  $scrollRow = 0;

  // scroll to col
  $scrollCol = 0;

  // freezed cell
  $freeze = 'A1';

  $freezeLineStyle = {
    width: 2,
    color: '#d8d8d8',
  };

  /**
   * trigger the event by clicking
   * @param {int} type
   * @param {row, col,  x, y, width, height } cellRect
   * @param {Event} evt
   */
  $onClick = () => {};

  constructor(width, height) {
    this.$width = width;
    this.$height = height;
  }

  // target: cssSelector | element
  to(target) {
    const { $drawMap } = this;
    let el = target;
    if (typeof target === 'string') {
      el = document.querySelector(target);
    }
    const viewport = new Viewport(this);
    if (!$drawMap.has(el)) {
      // bind events
      bind(el, 'click', (evt) => {
        const cell = viewport.cell(evt.offsetX, evt.offsetY);
        this.$onClick(...cell, evt);
      });
      $drawMap.set(el, Canvas2d.create(el));
    }
    const draw = $drawMap.get(el);
    render.call(this, draw, viewport.body, viewport.header);
    return this;
  }

  // ref: 'A1:B2' | 'A:B' | '1:4' | 'A1'
  selection(ref) {
    this.$selection = newRange(ref);
    this.$focus = [this.$selection.startRow, this.$selection.startCol];
    return this;
  }

  // ref: 'A1:B2' | 'A:B' | '1:4' | 'A1'
  freeze(ref) {
    if (ref !== 'A1') {
      this.$startRow = this.$scrollRow;
      this.$startCol = this.$scrollCol;
      this.$scrollRow = 0;
      this.$scrollCol = 0;
    } else {
      this.$scrollRow = this.$startRow;
      this.$scrollCol = this.$startCol;
      this.$startRow = 0;
      this.$startCol = 0;
    }
    this.$freeze = expr2xy(ref).reverse();
    return this;
  }

  static create(width, height) {
    return new Table(width, height);
  }
}

// single property
[
  'width', 'height', 'rows', 'cols', 'row', 'col', 'cell',
  'startRow', 'startCol', 'scrollRow', 'scrollCol',
  'merges',
  'onClick',
].forEach((it) => {
  Table.prototype[it] = function (arg) {
    this[`$${it}`] = arg;
    return this;
  };
});

// object property
[
  'lineStyle', 'cellStyle',
  'headerCellStyle', 'headerLineStyle',
  'selectionStyle', 'freezeLineStyle',
  'rowHeader', 'colHeader',
].forEach((it) => {
  Table.prototype[it] = function (arg) {
    Object.assign(this[`$${it}`], arg || {});
    return this;
  };
});

export default Table;

window.WolfTable = Table;
