import TileQueue from 'ol/TileQueue';
import stringify from 'json-stringify-safe';
import { get } from 'ol/proj';
import { inView } from 'ol/layer/Layer';
import { getTilePriority as tilePriorityFunction } from 'ol/TileQueue';
import terrestrisVectorTiles from './index';

const worker = self;
let frameState;
let pixelRatio;
let rendererTransform;
const canvas = new OffscreenCanvas(1, 1);
// OffscreenCanvas does not have a style, so we mock it
canvas.style = {};
const context = canvas.getContext('2d');
const layers = [];
const vectortileslayer = new terrestrisVectorTiles({
  useOffscreenCanvas: true,
  calledFromWorker: true
});
layers.push(vectortileslayer);
vectortileslayer.getRenderer().useContainer = function (target, transform) {
  this.containerReused = this.getLayer() !== layers[0];
  this.canvas = canvas;
  this.context = context;
  this.container = {
    firstElementChild: canvas,
    style: {
      opacity: vectortileslayer.getOpacity(),
    }
  };
  rendererTransform = transform;
};
worker.postMessage({action: 'requestRender'});

// Minimal map-like functionality for rendering
const tileQueue = new TileQueue(
  (tile, tileSourceKey, tileCenter, tileResolution) =>
    tilePriorityFunction(
      frameState,
      tile,
      tileSourceKey,
      tileCenter,
      tileResolution
    ),
  () => worker.postMessage({action: 'requestRender'})
);

const maxTotalLoading = 8;
const maxNewLoads = 2;

worker.addEventListener('message', (event) => {
  if (event.data.action !== 'render') {
    return;
  }
  frameState = event.data.frameState;
  if (!pixelRatio) {
    pixelRatio = frameState.pixelRatio;
  }
  frameState.tileQueue = tileQueue;
  frameState.viewState.projection = get('EPSG:3857');
  layers.forEach((layer) => {
    if (inView(layer.getLayerState(), frameState.viewState)) {
      const renderer = layer.getRenderer();
      renderer.renderFrame(frameState, canvas);
    }
  });
  layers.forEach(
    (layer) => layer.getRenderer().context && layer.renderDeclutter(frameState)
  );
  if (tileQueue.getTilesLoading() < maxTotalLoading) {
    tileQueue.reprioritize();
    tileQueue.loadMoreTiles(maxTotalLoading, maxNewLoads);
  }
  const imageData = canvas.transferToImageBitmap();
  worker.postMessage(
    {
      action: 'rendered',
      imageData: imageData,
      transform: rendererTransform,
      frameState: JSON.parse(stringify(frameState)),
    },
    [imageData]
  );
});
