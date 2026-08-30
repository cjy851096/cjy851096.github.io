'use strict';

const fs = require('fs');

const assets = {
  'vendor/jquery/jquery.min.js': 'jquery/dist/jquery.min.js',
  'vendor/bootstrap/css/bootstrap.min.css': 'bootstrap/dist/css/bootstrap.min.css',
  'vendor/bootstrap/js/bootstrap.min.js': 'bootstrap/dist/js/bootstrap.min.js',
  'vendor/typed/typed.min.js': 'typed.js/lib/typed.min.js',
  'vendor/nprogress/nprogress.min.js': 'nprogress/nprogress.js',
  'vendor/nprogress/nprogress.min.css': 'nprogress/nprogress.css'
};

hexo.extend.generator.register('vendor-assets', () => Object.entries(assets).map(([path, modulePath]) => ({
  path,
  data: () => fs.createReadStream(require.resolve(modulePath))
})));
