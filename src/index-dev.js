// index-dev.js
import Table from './index';

const longText = 'you are a good boy, a very good boy!!!';

function cellText(ri, ci) {
  return (ri === 8 && ci === 1) ? longText : `${ri}-${ci}`;
}

  // .selection('B9:D11')
Table.create('#table', 800, 500)
  .colHeader({ height: 50, rows: 2, merges: ['A1:C1', 'D1:D2'] })
  .merges(['G9:H11', 'B9:D11'])
  .scrollRows(2)
  .freeze('C6')
  .scrollRows(2)
  .scrollCols(1)
  .cell((ri, ci) => cellText(ri, ci))
  .onClick((type, cell) => {
    console.log('click.type:', type, ', cell:', cell);
  })
  .render();
