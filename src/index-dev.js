// index-dev.js
import Table from './index';

Table.create(800, 500)
  .indexRowsLength(2)
  .indexMerges(['A1:C1', 'D1:D2'])
  .merges(['G9:H11', 'B9:D11'])
  .select('E5:E8')
  .scrollRow(2)
  .freeze('C6')
  .scrollRow(2)
  .scrollCol(1)
  .cell((ri, ci) => `${ri}-${ci}`)
  .to('#table-render');
