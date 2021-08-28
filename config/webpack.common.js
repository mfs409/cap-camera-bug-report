const path = require("path");

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: './src/main.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, "../dist")
    },

    plugins: [
        new HtmlWebpackPlugin({ template: "index.html" }),
        new CleanWebpackPlugin(),
    ],

    module: {
        rules: [
            { test: /\.ts$/, loader: 'ts-loader', exclude: /node_modules/ }
        ]
    },
    resolve: { extensions: [".ts", ".js"] },
};
