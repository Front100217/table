// index-dev.js
import { wolfTableRender } from './index';

wolfTableRender(500, 500)
  .indexRowsLength(2)
  // .indexRowHeight(0)
  // .indexColWidth(0)
  // .indexColText((index) => index)
  .cell((ri, ci) => `${ri}-${ci}`)
  .to('#table-render');
