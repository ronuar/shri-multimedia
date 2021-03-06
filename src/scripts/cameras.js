import Camera from './camera';

const SELECTORS = {
  camera: '.camera',
  cameraContainer: '.camera__container',
  controlsButton: '.controls__button',
  brightnessControl: '#brightness-control',
  contrastControl: '#contrast-control',
  fullScreen: '.full-screen',
  controls: '.controls'
};

const NODES = {
  brightnessControl: document.querySelector(SELECTORS.brightnessControl),
  contrastControl: document.querySelector(SELECTORS.contrastControl),
  cameras: document.querySelectorAll(SELECTORS.camera),
  fullScreen: document.querySelector(SELECTORS.fullScreen),
  controls: document.querySelector(SELECTORS.controls)
};

class Cameras {
  constructor({ analysers }) {
    this.cameras = {};
    this.openedCamera = null;
    this.analysers = analysers;

    this.closeCamera = cameraId => this.cameras[cameraId].close();
    this.openCamera = cameraId => this.cameras[cameraId].open();
    this.toggleFullScreen = (cameraId = null) => { this.openedCamera = cameraId; };

    this.onCameraClick = this.onCameraClick.bind(this);
    this.onCloseClick = this.onCloseClick.bind(this);
    this.onTransitionEnd = this.onTransitionEnd.bind(this);
  }

  init() {
    const cameras = Array.from(NODES.cameras);

    this.cameras = cameras.reduce(
      (info, cameraNode) => Object.assign(info, {
        [cameraNode.dataset.id]: new Camera(cameraNode)
      }), {}
    );

    this.subscribe();
    this.render();
  }

  subscribe() {
    NODES.cameras.forEach(camera => camera.addEventListener('click', this.onCameraClick));

    const videoContainers = document.querySelectorAll(SELECTORS.cameraContainer);
    videoContainers.forEach(container => container.addEventListener('transitionend', this.onTransitionEnd));

    const closeButton = document.querySelector(SELECTORS.controlsButton);
    closeButton.addEventListener('click', this.onCloseClick);

    NODES.brightnessControl.addEventListener('input', this.onControlChange('brightness'));
    NODES.contrastControl.addEventListener('input', this.onControlChange('contrast'));
  }

  onTransitionEnd(event) {
    const cameraId = event.target.closest(SELECTORS.camera).dataset.id;
    const isCameraOpen = cameraId === this.openedCamera;
    if (!isCameraOpen && event.propertyName === 'transform') {
      this.cameras[cameraId].putDown();
      this.render();
    }
  }

  onControlChange(field) {
    return (event) => {
      const { cameras, openedCamera } = this;
      cameras[openedCamera].styleChange(field, event.target.value);

      this.render();
    };
  }

  onCloseClick() {
    this.closeCamera(this.openedCamera);
    this.showCameras(this.openedCamera);
    this.toggleFullScreen();

    this.analysers.forEach(analyser => analyser.stopAnalyse());

    this.render();
  }

  onCameraClick(event) {
    const camera = event.target.closest(SELECTORS.camera);
    const cameraId = camera.dataset.id;

    if (cameraId === this.openedCamera) return;

    this.analysers.forEach(analyser => analyser.analyse({
      source: this.cameras[cameraId].videoNode,
      sourceId: cameraId
    }));

    this.toggleFullScreen(cameraId);
    this.openCamera(cameraId);
    this.hideCameras(cameraId);
    this.render();
  }

  hideCameras(cameraId) {
    Object.values(this.cameras).forEach((camera) => {
      if (camera.id !== cameraId) camera.hide();
    });
  }

  showCameras(cameraId) {
    Object.values(this.cameras).forEach((camera) => {
      if (camera.id !== cameraId) camera.show();
    });
  }

  render() {
    const { openedCamera, cameras } = this;
    const hasOpenedCamera = Boolean(openedCamera);

    Object.values(cameras).forEach(camera => camera.render());

    const classAction = hasOpenedCamera ? 'add' : 'remove';
    NODES.fullScreen.classList[classAction]('full-screen--opened');
    NODES.controls.classList[classAction]('controls--opened');

    if (hasOpenedCamera) {
      NODES.brightnessControl.value = cameras[openedCamera].style.brightness;
      NODES.contrastControl.value = cameras[openedCamera].style.contrast;
    }
  }
}

export default Cameras;
