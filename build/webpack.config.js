const path = require('path');

const resolve = dir => path.join(__dirname, '..', dir);

module.exports = {
  entry: {
    'wolf-table-core': './src/index.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
        },
        include: [resolve('src'), resolve('test')],
      },
    ],
  },
};
