// babel.config.test.js - Used only for Jest testing, not for Next.js builds
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    '@babel/plugin-syntax-import-attributes'
  ]
}; 