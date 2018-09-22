# local color

Do images taken in the same area have lots of the same colors? Here's an experiment to find out.

## Installation

Unless previously installed you'll need Cairo. This is used by a dependency - the canvas module. Full instructions on installing Cairo can be found at https://www.npmjs.com/package/canvas

```
npm install
```

## Running

Once modules are installed you can run the dev version of the application using
```
npm run dev
```
Then open your favorite browser and navigate to http://localhost:5000

The frontend uses static bootstrap assets and handlebars but this will need to be replaced.
The backend uses express.

### references, links and libraries

*npm packages*
https://www.npmjs.com/package/google-images
https://github.com/lovell/sharp
https://www.npmjs.com/package/jimp
https://www.npmjs.com/package/localtunnel

for https://www.npmjs.com/package/color-thief
https://stackoverflow.com/questions/22100213/package-cairo-was-not-found-in-the-pkg-config-search-path-node-j-s-install-canv

*google api*
https://cse.google.com/cse/all
https://console.developers.google.com

*image manipulation*
https://docs.gimp.org/en/plug-in-convmatrix.html
http://setosa.io/ev/image-kernels/
https://github.com/openseadragon/openseadragon
http://www.leptonica.com/
http://lokeshdhakar.com/projects/color-thief/
