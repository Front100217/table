table {
  head,
  rows<Collection>, // include head
  createHead(),
  deleteHead(),

  insertRow(index),
  deleteRow(index)
}

DataTableCol {
  width<int>,
  style-index<int>,
  hide<boolean>
}

DataTableRow {
  row-index<int>,
  cells<Array>,
  style-index<int>,
  height<int>,
  hide<boolean>,

  insertCell(index),
  deleteCell(index)
}

DataTableCell {
  cell-index<int>,
  style-index<int>,
  text,
}

Data {
  styles: [],
  merges: [],
  rows: {},
  cols: {},
  scroll: ['A1', 0, 0],
  select: ['A1', 'A1:A1'],
  validations: [],
}

DataTable {
  settings,
  data<Data>
}




/*
 * {
 *  styles: [
 *    {
 *      bgcolor: '',
 *      align: '',
 *      valign: '',
 *      textwrap: false,
 *      underline: false,
 *      color: '',
 *      border: {
 *        left: [style, color],
 *        right: [style, color],
 *        top: [style, color],
 *        bottom: [style, color],
 *      },
 *      font: {
 *        name: 'Helvetica',
 *        size: 10,
 *        bold: false,
 *        italic: false,
 *      }
 *    }
 *  ],
 *  merges: [
 *    'A1:F11',
 *    ...
 *  ],
 *  rows: {
 *    1: {
 *      height: 50,
 *      style: 1,
 *      hide: false,
 *      cells: {
 *        1: {
 *          style: 2,
 *          type: 'string',
 *          text: '',
 *          value: '', // cal result
 *        }
 *      }
 *    },
 *    ...
 *  },
 *  cols: {
 *    2: { width: 100, style: 1, hide: true }
 *  }
 * }
 */


style {
  bgcolor: '#ffffff',
  align: 'left',
  valign: 'middle',
  textwrap: true,
  underline: false,
  color: '#0a0a0a',
  font: {
    name: 'Arial',
    size: 10,
    bold: false,
    italic: false,
  },
}