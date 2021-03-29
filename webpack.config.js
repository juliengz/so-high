const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
    entry: "./src/index",
    mode: "development",
    resolve: {
        extensions: [".js"],
    },
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        port: 3000,
        historyApiFallback: true,
    },
    output: {
        publicPath: "http://localhost:3000/",
    },
    module: {
        rules: [
            {
                test: /\.jp[e]?g$|\.png$|\.ogg$/,
                use: [
                    'file-loader',
                ],
            },
            {
                test: /\.jsx?$/,
                loader: "babel-loader",
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./public/index.html",
        }),
    ],
};
