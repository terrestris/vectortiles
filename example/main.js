import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import {FullScreen} from 'ol/control';
import {createXYZ} from 'ol/tilegrid';
import terrestrisVectorTiles from '../dist';

const map = new Map({
  target: 'map',
  view: new View({
    resolutions: createXYZ({tileSize: 512}).getResolutions(),
    center: [790236.44, 6576275.84],
    zoom: 12
  })
});
map.addLayer(new terrestrisVectorTiles({
  map
}));
map.addControl(new FullScreen());
