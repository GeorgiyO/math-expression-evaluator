const path = require("path");

module.exports = {
    mode: "development",
    entry: "./src/index.ts",
    module: {
        rules: [
            {
                test: /\.ts/,
                exclude: /(node_modules)/,
                loader: "ts-loader"
            },
        ],
    },
    resolve: {
        extensions: [
            ".ts", ".js"
        ],
        modules: [
            __dirname,
            "node_modules"
        ]
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "public"),
    },
};