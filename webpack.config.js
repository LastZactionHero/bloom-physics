const webpack = require('webpack'); //to access built-in plugins
const path = require('path');

module.exports = {
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'physics.bundle.js'
  },
  module: {
    rules: [
    //   {
    //     test: /\.jsx?$/,         // Match both .js and .jsx files
    //     exclude: /node_modules/,
    //     loader: "babel-loader",
    //     query:
    //       {
    //         presets:['react']
    //       }
    //   }
    ]
  },
  plugins: [
  ]
};
