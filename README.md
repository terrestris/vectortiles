# terrestris vectortiles
A simple library that makes use of free available world-wide terrestris vectortiles in MapBox MVT format from OpenStreetMap data.

The main method `getOSMLayer` creates an openlayers VectorTile Layer, which you
can use straight in your openlayers application.

![example](https://rawgit.com/terrestris/vectortiles/master/terrestris-vectortiles.png "Example")

# demo
A simple demonstration application can be found here:

https://ows.terrestris.de/anwendungen.html#osm-vectortiles

# how to use
Install the module e.g. by
`npm i @terrestris/vectortiles`

Then, in your code, you can create the OSM-VectorTile layer by calling
```
terrestrisVectorTiles.getOSMLayer();
```
which returns the layer you can then add to your openlayers map.

Optionally, you can set
```
terrestrisVectorTiles.useDeclutter = false;
```
before calling `getOSMLayer` in order to disable decluttering of labels. This will improve performance, but will also make labels overlap.