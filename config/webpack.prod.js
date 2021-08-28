const webpack = require('webpack')
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
    mode: "production",
    plugins: [new webpack.NormalModuleReplacementPlugin(/src[\\\/]CameraHelper.ts/, './CameraHelper.empty.ts')],
    devtool: false,
    optimization: { minimize: true, },
    performance: { hints: false, }
})