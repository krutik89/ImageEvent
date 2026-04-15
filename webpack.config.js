const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const COMPONENTS = {
  ImageWidget: './src/components/ImageWidget/index.ts',
  ImageWidgetConfiguration: './src/components/ImageWidgetConfiguration/index.ts',
};

module.exports = (env = {}) => {
  const isDev = !!env.dev;

  const entries = isDev
    ? { ...COMPONENTS, app: './src/index.tsx' }
    : COMPONENTS;

  return {
    mode: isDev ? 'development' : 'production',
    entry: entries,
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: !isDev,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      // React 18 UMD exposes createRoot directly on window.ReactDOM — no .client sub-property
      'react-dom/client': 'ReactDOM',
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
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: isDev
      ? [new HtmlWebpackPlugin({ template: './public/index.html', chunks: ['app'] })]
      : [],
    devServer: isDev
      ? {
          port: 3001,
          hot: true,
          open: true,
        }
      : undefined,
  };
};
