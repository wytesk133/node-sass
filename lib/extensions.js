/*!
 * node-sass: lib/extensions.js
 */

var flags = {},
    fs = require('fs'),
    pkg = require('../package.json'),
    path = require('path');

/**
 * Collect Arguments
 *
 * @param {Array} args
 * @api private
 */

function collectArguments(args) {
  for (var i = 0; i < args.length; i += 2) {
    if (args[i].lastIndexOf('--', 0) !== 0) {
      --i;
      continue;
    }

    flags[args[i]] = args[i + 1];
  }
}

/**
 * Get binary name.
 * If environment variable SASS_BINARY_NAME,
 * .npmrc variable sass_binary_name or
 * process argument --binary-name is provided,
 * return it as is, otherwise make default binary
 * name: {platform}-{arch}-{v8 version}.node
 *
 * @api private
 */

function getBinaryName() {
  var binaryName;

  if (flags['--sass-binary-name']) {
    binaryName = flags['--sass-binary-name'];
  } else if (process.env.SASS_BINARY_NAME) {
    binaryName = process.env.SASS_BINARY_NAME;
  } else if (process.env.npm_config_sass_binary_name) {
    binaryName = process.env.npm_config_sass_binary_name;
  } else if (pkg.nodeSassConfig && pkg.nodeSassConfig.binaryName) {
    binaryName = pkg.nodeSassConfig.binaryName;
  } else {
    binaryName = [process.platform, '-',
                  process.arch, '-',
                  process.versions.modules].join('');
  }

  return [binaryName, 'binding.node'].join('_');
}

/**
 * Determine the URL to fetch binary file from.
 * By default fetch from the node-sass distribution
 * site on GitHub.
 *
 * The default URL can be overriden using
 * the environment variable SASS_BINARY_SITE,
* .npmrc variable sass_binary_site or
 * or a command line option --sass-binary-site:
 *
 *   node scripts/install.js --sass-binary-site http://example.com/
 *
 * The URL should to the mirror of the repository
 * laid out as follows:
 *
 * SASS_BINARY_SITE/
 *
 *  v3.0.0
 *  v3.0.0/freebsd-x64-14_binding.node
 *  ....
 *  v3.0.0
 *  v3.0.0/freebsd-ia32-11_binding.node
 *  v3.0.0/freebsd-x64-42_binding.node
 *  ... etc. for all supported versions and platforms
 *
 * @api private
 */

function getBinaryUrl() {
  var site = flags['--sass-binary-site'] ||
             process.env.SASS_BINARY_SITE  ||
             process.env.npm_config_sass_binary_site ||
             (pkg.nodeSassConfig && pkg.nodeSassConfig.binarySite) ||
             'https://github.com/sass/node-sass/releases/download';

	return [site, 'v' + pkg.version, sass.binaryName].join('/');
}


collectArguments(process.argv.slice(2));

var sass = process.sass = {};

sass.binaryName = getBinaryName();
sass.binaryUrl = getBinaryUrl();

/**
 * Get binary path.
 * If environment variable SASS_BINARY_PATH,
 * .npmrc variable sass_binary_path or
 * process argument --sass-binary-path is provided,
 * select it by appending binary name, otherwise
 * make default binary path using binary name.
 * Once the primary selection is made, check if
 * callers wants to throw if file not exists before
 * returning.
 *
 * @param {Boolean} throwIfNotExists
 * @api private
 */

sass.getBinaryPath = function(throwIfNotExists) {
  var binaryPath;

  if (flags['--sass-binary-path']) {
    binaryPath = flags['--sass-binary-path'];
  } else if (process.env.SASS_BINARY_PATH) {
    binaryPath = process.env.SASS_BINARY_PATH;
  } else if (process.env.npm_config_sass_binary_path) {
    binaryPath = process.env.npm_config_sass_binary_path;
  } else if (pkg.nodeSassConfig && pkg.nodeSassConfig.binaryPath) {
    binaryPath = pkg.nodeSassConfig.binaryPath;
  } else {
    binaryPath = path.join(__dirname, '..', 'vendor', sass.binaryName.replace(/_/, '/'));
  }

  if (!fs.existsSync(binaryPath) && throwIfNotExists) {
    throw new Error([
      ['The `libsass` binding was not found in', binaryPath].join(' '),
      ['This usually happens because your node version has changed.'],
      ['Run `npm rebuild node-sass` to build the binding for your current node version.'],
    ].join('\n'));
  }

  return binaryPath;
};

sass.binaryPath = sass.getBinaryPath();
