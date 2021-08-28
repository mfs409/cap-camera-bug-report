const webpack = require('webpack')
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
    mode: "development",
    plugins: [new webpack.HotModuleReplacementPlugin()],
    devtool: "source-map",
    devServer: { historyApiFallback: true, compress: true, hot: true, port: 8080, },
})