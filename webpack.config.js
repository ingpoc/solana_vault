const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        background: path.join(__dirname, 'src', 'client', 'extension', 'background', 'index.ts'),
        popup: path.join(__dirname, 'src', 'client', 'extension', 'popup.ts'),
    },
    output: {
        path: path.resolve(__dirname, 'dist1', 'client', 'extension'),
        filename: '[name].js',
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
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: './manifest.json', to: '.' },
                { from: 'src/client/extension/popup.html', to: '.' },
                { from: 'src/client/extension/popup.css', to: '.' },
                { from: 'icons/', to: 'icons/' } // This line copies all files in the 'icons' directory
                // Add any other files or directories you want to copy to 'dist' here
            ],
        }),
    ],
};