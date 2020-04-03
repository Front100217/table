// index-dev.js
import WolfTableRender from './index';

WolfTableRender.create(800, 500)
  .indexRowsLength(2)
  .indexMerges(['A1:C1', 'D1:D2'])
  .merges(['G9:H11', 'B9:D11'])
  .rowStart(9)
  .colStart(1)
  // .indexRowHeight(0)
  // .indexColWidth(0)
  // .indexColText((index) => index)
  .cell((ri, ci) => `${ri}-${ci}`)
  .to('#table-render');
