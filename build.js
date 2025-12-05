/* [build] */

    // ##ESBUILD
const ESBUILD = require('esbuild')

// #FUNCTIONS

    // ##ESBUILD
ESBUILD.build(
{
    entryPoints: ['src/pslogs.ts'],
    outfile    : 'dist/pslogs.js',
    bundle     : true,
    minify     : true,
    platform   : 'node',
    target     : 'node19',
    external   : ['pm2']
})
.catch(() => process.exit(1))