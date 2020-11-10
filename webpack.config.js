const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    worker: path.join(__dirname, 'src/index.ts')
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  optimization: {
    minimize: false
  },
  target: 'node',
  mode: 'development',
  module: {
    rules: [
      {
        test: [/\.tsx?$/],
        exclude: [/node_modules/, /\.test.tsx?$/],
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/package_analyzer/data', to: 'data' }
      ],
    })
  ],
  resolve: {
    modules: ['node_modules', 'scripts'],
    extensions: ['.ts', '.tsx', '.json', '.js', '.jsx']
  }
};
