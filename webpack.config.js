const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Production entries — widget + config panel only (no App.tsx harness)
const COMPONENTS = {
  ImageWidget: './src/components/ImageWidget/index.ts',
  ImageWidgetConfiguration: './src/components/ImageWidgetConfiguration/index.ts',
};

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    mode: isProd ? 'production' : 'development',

    // Prod: only self-registering index.ts entries
    // Dev: App.tsx harness only
    entry: isProd
      ? COMPONENTS
      : { app: './src/index.tsx' },

    output: {
      path: path.resolve(__dirname, isProd ? 'dist-bundle' : 'dist'),
      filename: isProd ? '[name].bundle.js' : '[name].js',
      globalObject: 'this',
      clean: true,
    },

    // Prod: React is provided globally by Lens — external
    // Dev: React bundled in (no globals needed)
    externals: isProd
      ? {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-dom/client': 'ReactDOM',
          'react-dom/server': 'ReactDOMServer',
          'react/jsx-runtime': 'ReactJSXRuntime',
          'react/jsx-dev-runtime': 'ReactJSXRuntime',
        }
      : {},

    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },

    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript',
              ],
            },
          },
        },
        {
          test: /\.css$/,
          // Dev: style-loader injects into <style> tags with hot reload
          // Prod: MiniCssExtractPlugin extracts to [name].bundle.css
          use: [
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif|webp|svg)$/i,
          type: 'asset/resource',
          generator: { filename: 'assets/[name][ext]' },
        },
      ],
    },

    plugins: [
      ...(isProd
        ? [new MiniCssExtractPlugin({ filename: '[name].bundle.css' })]
        : [new HtmlWebpackPlugin({ template: './public/index.html', chunks: ['app'] })]),
    ],

    ...(!isProd && {
      devServer: {
        port: 3001,
        hot: true,
        open: true,
        historyApiFallback: true,
      },
    }),
  };
};
