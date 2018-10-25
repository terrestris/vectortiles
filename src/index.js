/* global ol */
import { style_roads } from './styles/style-roads';
import { style_buildings } from './styles/style-buildings';
import { style_bluebackground } from './styles/style-bluebackground';
import { style_landusage } from './styles/style-landusage';
import { style_waterways } from './styles/style-waterways';
import { style_waterareas } from './styles/style-waterareas';
import { style_countries } from './styles/style-countries';

import OlStyle from 'ol/style/Style';
import OlStyleStroke from 'ol/style/Stroke';
import OlStyleText from 'ol/style/Text';
import OlStyleFill from 'ol/style/Fill';
import OlStyleIcon from 'ol/style/Icon';
import OlControlAttribution from 'ol/control/Attribution';
import OlGeomPoint from 'ol/geom/Point';
import OlLayerVectorTile from 'ol/layer/VectorTile';
import OlSourceVectorTile from 'ol/source/VectorTile';
import OlFormatMVT from 'ol/format/MVT';

// should labels be decluttered?
// needs to be set before the layer gets created
let useDeclutter = true;

// resources like imagery for highway label signs
let babImg = document.createElement('img');
babImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAbCAYAAADoOQYqAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA3XAAAN1wFCKJt4AAAAB3RJTUUH4gIIDjocExrEmgAAAlVJREFUWMPtmM1OE1EUx393vtoy7dDWpCBgVQJNrGhiYuI7GN2ZuPAdfAV9Bt/BhWufwrAh0UBSQeRToUBhOlOZGWaOiylQjR9BWbRJ/5ubyZ2593fOvZOc/1EiMg68BW4BMSD8oxIRkiQdRQRNKZQCTSk0TfEfUoAOLAGPlIjMA/cvskKcCEEYE0YJQRQThDFBELPQ2Gehscf80h7buz5TYza3p8vcnS1zr3aFopPBMnUypoZlpaOhaxcNYF6JiAfYv3vD9SPafki7E+F1IjwvZO2rx4dPLZY+H7K42mK1cQDtADIGZHQwNVAKROAkgTCGIAZL5+pMmfp0ifrNEvUbRWanHAqOhZ0zcWyTwoiFY5t/OhlfiYgLFPzjE740O+wfHbPb+obnBuwcHPNx84jlrTYrGy4rmy40fTC0FM7QQVfps/rLxTqdjxOIfwqmnGVy0qFWHWV6okDtmsNUxSY3YlEpZ6mUckxUbOysAdBWichRY+3QefHqHdtuwHazw8aOT9j0081MDUwdNJUCnmZAuBwpIAGSnmCiGBKBUo7qeJ7qeJ6p0Qwvnz+gdr3oGiLCh+UWb16/h7E8aKRgxeyvN7ks2N71FKBr6a9m6YDZnRPWt9qsb7iw4/HkYY3Z6ijG2Yd5K81qP0mpNBBdpXzdhGk/3Ld+1umJnEEPmIbQQ+gh9BB6CD2EHkIPOHRPMdK36inqzqs8L4QoSZ2F9EnJJ5IagyhJ+bqJNZRSzM2UePrsTn86l8lz5zI3U0IpxWB6xEF14wPZ9xjrdpjqA9BhWgQefwcq3oy642N9sQAAAABJRU5ErkJggg==';


// the OSM-attribution
const attribution = new OlControlAttribution({
  html: '© terrestris GmbH & Co. KG<br>' +
  'Data © OpenStreetMap <a href="http://www.openstreetmap.org/copyright/en" ' +
  'target="_blank">contributors</a>'
});

// the style template used for labels
let labelStyle = new OlStyle({
  text: new OlStyleText({
    font: '13px sans-serif',
    fill: new OlStyleFill({
      color: '#000'
    }),
    stroke: new OlStyleStroke({
      color: '#fff',
      width: 3
    }),
    placement: 'line',
    maxAngle: 0.4,
    padding: [10, 10, 10, 10]
  })
});

// the style template used for linestrings
let lineStringStyleBelow = new OlStyle({
  stroke: new OlStyleStroke({
    color: 'black',
    width: 2,
    lineCap: 'butt',
    lineDash: []
  }),
  zIndex: 0
});

// the style template used for linestrings
let lineStringStyleAbove = new OlStyle({
  stroke: new OlStyleStroke({
    color: 'white',
    width: 1,
    lineCap: 'round',
    lineDash: []
  }),
  zIndex: 1
});

// the style template used for polygons
const polygonStyleFill = new OlStyleFill({
  color: 'blue'
});
const polygonStyleStroke = new OlStyleStroke({
  color: 'blue',
  width: 1,
  lineCap: 'round'
});
let polygonStyle = new OlStyle({
  fill: polygonStyleFill,
  stroke: polygonStyleStroke,
  zIndex: 0
});

// the style template used for highway icons
let iconStyle = new OlStyle({
  image: new OlStyleIcon({
    scale: 0.9,
    imgSize: [45,27],
    img: babImg,
    opacity: 0.8
  }),
  text: new OlStyleText({
    padding: [50, 50, 50, 50],
    font: '12px sans-serif',
    fill: new OlStyleFill({
      color: '#fff'
    }),
    stroke: new OlStyleStroke({
      color: '#fff',
      width: 0.8
    })
  }),
  zIndex: 0
});

/**
 * Creates a style for labels of places like countries or cities
 *
 * @param  {ol.Feature} feature The feature to style
 * @param  {Number} resolution The current maps resolution
 * @return {ol.style.Style[]} The style to use for the given feature
 */
const buildLabelStyle = (feature, resolution) => {
  const text = feature.get('name');
  const type = feature.get('type');
  const population = feature.get('population');
  let fontString = 'px sans-serif';
  let fontSize;
  if (type === 'country') {
    fontSize = 17;
  } else if (type === 'city') {
    fontSize = 16;
  } else if (type === 'town' && resolution < 600) {
    fontSize = 15;
  } else if (type === 'village' && resolution < 75) {
    fontSize = 14;
  } else {
    return null;
  }
  fontString = fontSize + fontString;
  const olText = labelStyle.getText();
  olText.getFill().setColor('#000');
  olText.getStroke().setColor('#fff');
  olText.getStroke().setWidth(5);
  olText.setPlacement('point');
  olText.setText(text);
  olText.setFont(fontString);
  const zIndex = population ? population : fontSize + 1000;
  labelStyle.setZIndex(
    useDeclutter ? -zIndex : zIndex);
  return [labelStyle];
};

/**
 * [description]
 * @param  {ol.Feature} feature The feature to style
 * @param  {Number} resolution The current maps resolution
 * @param  {Object[]} styleArray The array of style objects to use
 * @param  {String} geom The geometry type, e.g. 'polygon'
 * @return {ol.style.Style[]} The style to use for the given feature
 */
const buildStyle = (feature, resolution, styleArray, geom) => {
  if (!styleArray) {
    return null;
  }

  const props = feature.getProperties();
  const type = props.type || '';
  const text = props.name || props.ref || null;
  const isHighWay = (type.indexOf('motorway') > -1 || type.indexOf('trunk') > -1) &&
      props.class === 'highway' && props.ref.indexOf('A') === 0;
  let styleToUse;

  styleArray.forEach(function(el) {
    if (el.minResolution <= resolution && el.maxResolution >= resolution) {
      styleToUse = el.style;
    }
  });

  if (!styleToUse || !styleToUse[type]) {
    return null;
  }

  let style = [];
  let stroke;
  let strokeAbove;
  let fill;
  if (geom === 'line') {
    stroke = lineStringStyleBelow.getStroke();
    stroke.setColor(styleToUse[type].colors[0] || 'black');
    stroke.setWidth(styleToUse[type].widths[0] || 2);
    stroke.setLineCap(styleToUse[type].caps[0] || 'butt');
    stroke.setLineDash(styleToUse[type].dasharray ?
      styleToUse[type].dasharray.split(' ') : []);
    lineStringStyleBelow.setZIndex(feature.get('z_order') || 0);
    if (styleToUse[type].opacity) {
      setOpacity(stroke, styleToUse[type].opacity);
    }
    style.push(lineStringStyleBelow);

    // check if we need a "outline" for this road
    if (styleToUse[type].widths.length > 1) {
      strokeAbove = lineStringStyleAbove.getStroke();
      strokeAbove.setColor(styleToUse[type].colors[1] || 'white');
      strokeAbove.setWidth(styleToUse[type].widths[1] || 1);
      strokeAbove.setLineCap(styleToUse[type].caps[1] || 'round');
      strokeAbove.setLineDash(styleToUse[type].dasharray ?
        styleToUse[type].dasharray.split(' ') : []);
      lineStringStyleAbove.setZIndex(feature.get('z_order') + 1 || 1);
      if (styleToUse[type].opacity) {
        setOpacity(strokeAbove, styleToUse[type].opacity);
      }
      style.push(lineStringStyleAbove);
    }
  } else if (geom === 'polygon') {
    const hasFill = styleToUse[type].fillColor || styleToUse[type].fillOpacity;
    const hasStroke = styleToUse[type].strokeColor || styleToUse[type].strokeWidth;
    if (hasFill) {
      fill = polygonStyle.getFill();
      if (!fill) {
        fill = polygonStyleFill;
        polygonStyle.setFill(fill);
      }
      fill.setColor(styleToUse[type].fillColor || 'blue');
    } else {
      polygonStyle.setFill(undefined);
    }
    if (hasStroke) {
      stroke = polygonStyle.getStroke();
      if (!stroke) {
        stroke = polygonStyleStroke;
        polygonStyle.setStroke(stroke);
      }
      stroke.setColor(styleToUse[type].strokeColor || 'blue');
      stroke.setWidth(styleToUse[type].strokeWidth || 1);
      stroke.setLineCap(styleToUse[type].lineCap || 'round');
    } else {
      polygonStyle.setStroke(undefined);
    }
    polygonStyle.setZIndex(styleToUse[type].zIndex || feature.get('z_order') || 0);

    // set the alpha values
    if (fill && styleToUse[type].fillOpacity) {
      setOpacity(fill, styleToUse[type].fillOpacity);
    }
    if (stroke && styleToUse[type].strokeOpacity) {
      setOpacity(stroke, styleToUse[type].strokeOpacity);
    }
    style.push(polygonStyle);
  }

  if (styleToUse[type].useLabels !== false) {
    if (isHighWay && resolution < 300) {
      // try to extract coordinates from an ol.render.feature
      const coords = feature.getGeometry().getFlatCoordinates();
      if (coords && coords.length > 1) {
        const point = new OlGeomPoint([coords[0], coords[1]]);
        iconStyle.setGeometry(point);
        iconStyle.getText().setText(props.ref || props.name);
        style.push(iconStyle);
      }
    } else if (resolution < 300) {
      // care about labels for streets, buildings etc.
      const olText = labelStyle.getText();
      fill = olText.getFill();
      stroke = olText.getStroke();
      fill.setColor(styleToUse[type].textFillColor || 'black');
      stroke.setColor(styleToUse[type].textStrokeColor || 'white');
      stroke.setWidth(styleToUse[type].textStrokeWidth || 5);
      olText.setPlacement(styleToUse[type].textPlacement || 'line');
      olText.setText(text);
      olText.setFont(styleToUse[type].font || '13px sans-serif');
      const zIndex = feature.get('z_order') || 1;
      labelStyle.setZIndex(useDeclutter ?
        -zIndex : zIndex);
      style.push(labelStyle);
    }
  }
  return style;
};

/**
 * Sets the opacity on a style
 * @param  {OlStyleFill or OlStyleStroke} style The style to set the opacity on
 * @param  {Number} opacity The opacity value to set
 */
const setOpacity = (style, opacity) => {
  const color = ol.color.asArray(style.getColor());
  color[3] = opacity;
  style.setColor(color);
};

/**
 * Creates and returns the terrestris OSM VectorTile layer
 *
 * @return {ol.layer.VectorTile} The terrestris OSM VectorTile layer
 */
export const getOSMLayer = () => {
  const osmLayer = new OlLayerVectorTile({
    name: 'terrestris-vectortiles',
    declutter: useDeclutter,
    source: new OlSourceVectorTile({
      format: new OlFormatMVT(),
      url: 'https://ows.terrestris.de/osm-vectortiles/' + 'osm:osm_world_vector' +
        '@mapbox-vector-tiles@pbf/{z}/{x}/{-y}.pbf',
      attributions: [attribution]
    }),
    style: function(feature, resolution) {
      var l = feature.get('layer');
      var style;
      switch (l) {
        case 'osm_roads':
          style = buildStyle(feature, resolution, style_roads, 'line');
          break;
        case 'osm_roads_gen0':
          style = buildStyle(feature, resolution, style_roads, 'line');
          break;
        case 'osm_roads_gen1':
          style = buildStyle(feature, resolution, style_roads, 'line');
          break;
        case 'osm_buildings':
          style = buildStyle(feature, resolution, style_buildings, 'polygon');
          break;
        case 'bluebackground_no_limit':
          style = buildStyle(feature, resolution, style_bluebackground, 'polygon');
          break;
        case 'osm_places':
          style = buildLabelStyle(feature, resolution);
          break;
        case 'osm_landusages':
          style = buildStyle(feature, resolution, style_landusage, 'polygon');
          break;
        case 'osm_landusages_gen0':
          style = buildStyle(feature, resolution, style_landusage, 'polygon');
          break;
        case 'osm_waterways':
          style = buildStyle(feature, resolution, style_waterways, 'line');
          break;
        case 'osm_waterareas':
          style = buildStyle(feature, resolution, style_waterareas, 'polygon');
          break;
        case 'osm_waterareas_gen0':
          style = buildStyle(feature, resolution, style_waterareas, 'polygon');
          break;
        case 'world_boundaries_labels':
          style = buildStyle(feature, resolution, style_countries, 'polygon');
          break;
        default:
          break;
      }
      return style;
    }
  });
  return osmLayer;
};