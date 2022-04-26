const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')

module.exports = {
    entry: {
        index: path.resolve(__dirname, '../src/script.js'),
        simpleObjPlacement: path.resolve(__dirname, '../src/1-simpleObjPlacement/simpleObjPlacement.js'), 
        advancedObjPlacement: path.resolve(__dirname, '../src/2-advancedObjPlacement/advancedObjPlacement.js'), 
        arExpositor: path.resolve(__dirname, '../src/3-arExpositor/arExpositor.js'), 
        mesureTool: path.resolve(__dirname, '../src/4-mesureTool/mesureTool.js'), 
        prototype: path.resolve(__dirname, '../src/0-prototypes/prototype.js'),
    },
    output:
    {
        hashFunction: 'xxhash64',
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, '../dist')
    },
    devtool: 'source-map',
    plugins:
    [
        new CopyWebpackPlugin({
            patterns: [
                { from: path.resolve(__dirname, '../static') }
            ]
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(__dirname, '../src/index.html'),
            chunks: ['index'],
            minify: true
        }),
        new HtmlWebpackPlugin({
            filename: 'simpleObjPlacement.html',
            template: path.resolve(__dirname, '../src/1-simpleObjPlacement/simpleObjPlacement.html'),
            chunks: ['simpleObjPlacement'],
            minify: true
        }),
        new HtmlWebpackPlugin({
            filename: 'advancedObjPlacement.html',
            template: path.resolve(__dirname, '../src/2-advancedObjPlacement/advancedObjPlacement.html'),
            chunks: ['advancedObjPlacement'],
            minify: true
        }),
        new HtmlWebpackPlugin({
            filename: 'arExpositor.html',
            template: path.resolve(__dirname, '../src/3-arExpositor/arExpositor.html'),
            chunks: ['arExpositor'],
            minify: true
        }),
        new HtmlWebpackPlugin({
            filename: 'mesureTool.html',
            template: path.resolve(__dirname, '../src/4-mesureTool/mesureTool.html'),
            chunks: ['mesureTool'],
            minify: true
        }),
        new HtmlWebpackPlugin({
            filename: 'prototype.html',
            template: path.resolve(__dirname, '../src/0-prototypes/prototype.html'),
            chunks: ['prototype'],
            minify: true
        }),
        new MiniCSSExtractPlugin()
    ],
    module:
    {
        rules:
        [
            // HTML
            {
                test: /\.(html)$/,
                use:
                [
                    'html-loader'
                ]
            },

            // JS
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use:
                [
                    'babel-loader'
                ]
            },

            // CSS
            {
                test: /\.css$/,
                use:
                [
                    MiniCSSExtractPlugin.loader,
                    'css-loader'
                ]
            },

            // Images
            {
                test: /\.(jpg|png|gif|svg)$/,
                type: 'asset/resource',
                generator:
                {
                    filename: 'assets/images/[hash][ext]'
                }
            },

            // Fonts
            {
                test: /\.(ttf|eot|woff|woff2)$/,
                type: 'asset/resource',
                generator:
                {
                    filename: 'assets/fonts/[hash][ext]'
                }
            },

            // Shaders
            {
                test: /\.(glsl|vs|fs|vert|frag)$/,
                type: 'asset/source',
                generator:
                {
                    filename: 'assets/images/[hash][ext]'
                }
            },

            //GLTF / GLB
            {
                test: /\.(glb|gltf)$/i,
                loader: 'file-loader',
                options: {
                    publicPath: './',
                    name: '[name].[ext]'
                },
            }
        ]
    }
}
