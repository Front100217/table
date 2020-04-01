// index-dev.js
import { wolfTableRender } from './index';

wolfTableRender(500, 500)
  .cell((ri, ci) => `${ri}-${ci}`)
  .to('#table-render');
