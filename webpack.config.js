module.exports = {
    entry: './src/app.ts',
    output: {
        path: __dirname + '/docs/assets',
        filename: 'app.js'
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        alias: {
            'jquery-ui/draggable': __dirname + '/node_modules/jquery-ui/ui/widgets/draggable',
            'jquery-ui/droppable': __dirname + '/node_modules/jquery-ui/ui/widgets/droppable',
            'jquery-ui/dialog': __dirname + '/node_modules/jquery-ui/ui/widgets/dialog',
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader'
            }
        ]
    },
}