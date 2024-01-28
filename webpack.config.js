const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
    mode: 'development',
    devtool: process.env.NODE_ENV === 'production' ? 'none' : 'inline-source-map',
    entry: {
        background: path.join(__dirname, 'src', 'client', 'extension', 'background', 'index.ts'),
        popup: path.join(__dirname, 'src', 'client', 'extension', 'popup.ts'),
       // readCred: path.join(__dirname, 'src', 'client', 'read-cred.ts'),
        writeCred: path.join(__dirname, 'src', 'client', 'write-cred.ts'),
        util: path.join(__dirname, 'src', 'client', 'util.ts')
    },
    output: {
        path: path.resolve(__dirname, 'dist1'),
        filename: (chunkData) => {
            if (chunkData.chunk.name === 'background') {
                return '[name].js';
            } else if (chunkData.chunk.name === 'popup') {
                return 'client/extension/[name].js';
            } else {
                return 'client/[name].js';
            }
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            "path": require.resolve("path-browserify"),
            "os": require.resolve("os-browserify/browser"),
            "crypto": require.resolve("crypto-browserify"),
            "stream": require.resolve("stream-browserify"),
            "fs": false
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser',
        }),
        new CopyPlugin({
            patterns: [
                { from: './manifest.json', to: '.' },
                { from: 'src/client/extension/popup.html', to: './client/extension' },
                { from: 'src/client/extension/popup.css', to: './client/extension' },
                { from: 'icons/', to: 'icons/' } // This line copies all files in the 'icons' directory
                // Add any other files or directories you want to copy to 'dist' here
            ],
        }),
    ],
};