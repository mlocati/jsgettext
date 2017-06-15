module.exports = {
    entry: './src/app.ts',
    output: {
        path: __dirname + '/docs/assets',
        filename: 'app.js'
    },
    resolve: {
        extensions: ['.ts']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader'
            }
        ]
    }
}