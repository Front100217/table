// index-dev.js
import { wolfTableRender } from './index';

wolfTableRender(500, 500)
  .indexRowsLength(2)
  .indexMerges(['A1:C1', 'D1:D2'])
  .rowStart(5)
  .colStart(1)
  // .indexRowHeight(0)
  // .indexColWidth(0)
  // .indexColText((index) => index)
  .cell((ri, ci) => `${ri}-${ci}`)
  .to('#table-render');
