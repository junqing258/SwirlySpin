const path = require('path');
const os = require('os');
const webpack = require('webpack');
const WebpackNotifierPlugin = require('webpack-notifier');
const webpackDevServer = require('webpack-dev-server');
const localServer = require('./server/index');


var env = process.env.NODE_ENV || 'development';

const PUB_PATH = "../../gamehall_new/www/files/game/zuma";

var definePlugin = new webpack.DefinePlugin({
    __DEV__: env!=="production"
});

var plugins = [
    definePlugin,
    new WebpackNotifierPlugin()
];


var plugins2 = [
    new webpack.optimize.UglifyJsPlugin({
        drop_console: true,
        compress: true,
        mangle: false,
        output: {
            comments: false,
        },
        beautify: false,
        sourceMap: false,
        test: /js\/.*build\.js($|\?)/i
    })
];

if (process.env.NODE_ENV === 'production') {
    plugins = plugins.concat(plugins2);
}

/**************************************************************************************************************************
 **
 */
module.exports = {
    entry: (function() {
        if (process.env.NODE_ENV === 'production' ) {
            return {
                dev: [  path.resolve(__dirname, 'src/main.js') ],
                build: [  path.resolve(__dirname, 'src/main.js') ],
            };
        } else {
            return {
                dev: [  path.resolve(__dirname, 'src/main.js') ]
            };
        }
    })(),
    devtool: 'source-map',
    output: {
        pathinfo: false,
        path: path.resolve(__dirname, PUB_PATH), 
        filename: 'js/bundle.[name].js'
    },
    watch:  env!=="production",
    plugins: plugins,
    module: {
        rules: [ { test: /\.js$/, use: ['babel-loader'], include: path.join(__dirname, 'src') } ]
    },
    devServer: {
        hot: false,
        port: 8090,
        host: (function() {
            let wlan;
            if (os && os.networkInterfaces) wlan = os.networkInterfaces()['WLAN'];
            if (wlan) return (wlan[1]||wlan[0])['address'];
            else return null;
        })(),
        disableHostCheck: true,
        contentBase: "./bin/",
        before: function(app) {
            localServer(app);
        }
    },
    resolve: {
        modules: [
          path.resolve('./src'),
          path.resolve('./node_modules')
        ], 
        alias: {

        }
  }
};