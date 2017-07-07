// From https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

document.addEventListener('DOMContentLoaded', function () {

  var imageDropZone = document.querySelector('#image-drop-zone');
  var imageContainer = document.querySelector('#image-container');
  var zoomSelector = document.querySelector('#zoom-selector');
  var zoomedIntermediaryImage = document.createElement('canvas');
  var zoomedImage = document.querySelector('#zoomed-image');
  var storedImage = document.querySelector('#stored-image');
  var outputSizeRange = document.querySelector('#output-size');

  function setIntermediaryImageSize () {
    var size = Math.round(Math.pow(2, outputSizeRange.max - outputSizeRange.value)*5);

    zoomedIntermediaryImage.width = size;
    zoomedIntermediaryImage.height = size;
  }

  function processZoomedImage () {
    var imageRect = storedImage.getBoundingClientRect();
    var zoomRect = zoomSelector.getBoundingClientRect();

    var rect;

    if (zoomSelector.classList.contains('on')) {
      rect = {
        top: zoomRect.top - imageRect.top,
        left: zoomRect.left - imageRect.left,
        width: zoomRect.width,
        height: zoomRect.height
      };
    }
    else {
      var size = Math.min(imageRect.width, imageRect.height);

      rect = {
        top: imageRect.height/2 - size/2,
        left: imageRect.width/2 - size/2,
        width: size,
        height: size
      };
    }

    var intermediaryContext = zoomedIntermediaryImage.getContext('2d');
    var finalContext = zoomedImage.getContext('2d');

    var widthRatio = storedImage.width / storedImage.naturalWidth;
    var heightRatio = storedImage.height / storedImage.naturalHeight;

    intermediaryContext.drawImage(storedImage,
      rect.left / widthRatio,
      rect.top / heightRatio,
      rect.width / widthRatio,
      rect.height / heightRatio,
      0, 0, zoomedIntermediaryImage.width, zoomedIntermediaryImage.height);

    finalContext.drawImage(zoomedIntermediaryImage,
      0, 0, zoomedIntermediaryImage.width, zoomedIntermediaryImage.height,
      0, 0, zoomedImage.width, zoomedImage.height);

    try {
      finalContext.getImageData(0, 0, 1, 1);
      document.querySelector('#download').disabled = false;
    }
    catch (e) {
      document.querySelector('#download').disabled = true;
    }

    console.log(document.querySelector('#download').disabled);
  }

  storedImage.onload = function () {
    if (storedImage.naturalWidth > storedImage.naturalHeight) {
      storedImage.style.width = '100%';
      storedImage.style.height = 'auto';
    }
    else {
      storedImage.style.width = 'auto';
      storedImage.style.height = '100%';
    }

    processZoomedImage();
  };

  document.querySelector('#double-down').addEventListener('click', function () {
    storedImage.src = zoomedImage.toDataURL('image/jpg');
  });

  document.querySelector('#download').addEventListener('click', function () {
    var dataURL = zoomedImage.toDataURL('image/jpg');
    download(dataURL, guid() + '.jpg', 'image/jpg');
  });

  document.querySelector('#clear-selection').addEventListener('click', function (e) {
    zoomSelector.classList.remove('on');

    processZoomedImage();
  });

  outputSizeRange.addEventListener('input', function (e) {
    setIntermediaryImageSize();
    processZoomedImage();
  });

  document.querySelector('#image-smoothing-toggle').addEventListener('change', function (e) {
    var context = zoomedImage.getContext('2d');

    context.imageSmoothingEnabled = e.target.checked;
    context.webkitImageSmoothingEnabled = e.target.checked;
    context.mozImageSmoothingEnabled = e.target.checked;

    processZoomedImage();
  });

  document.querySelector('#image-smoothing-quality').addEventListener('input', function (e) {
    var context = zoomedImage.getContext('2d');

    var values = ["low", "medium", "high"];

    context.imageSmoothingQuality = values[e.target.value];
    context.webkitImageSmoothingQuality = values[e.target.value];
    context.mozImageSmoothingQuality = values[e.target.value];

    processZoomedImage();
  });

  imageDropZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    imageDropZone.classList.add('dragover');
  });

  imageDropZone.addEventListener('dragleave', function (e) {
    e.preventDefault();
    imageDropZone.classList.remove('dragover');
  });

  imageDropZone.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();

    document.body.classList.remove('dragging');
    zoomSelector.classList.remove('on');
    imageDropZone.classList.remove('dragover');
    imageDropZone.classList.remove('nothing-yet');
    
    setIntermediaryImageSize();

    var url = e.dataTransfer.getData('URL');

    if (url) {
      storedImage.src = url;
      imageDropZone.classList.add('filled');
    }
    else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      var fileReader = new FileReader();

      fileReader.onload = function (e) {
        storedImage.src = e.target.result;
        imageDropZone.classList.add('filled');
      };

      fileReader.readAsDataURL(e.dataTransfer.items[0].getAsFile());
    }
  });

  zoomSelector.addEventListener('mousedown', function (e) {
    e.preventDefault();

    function initZoomSelectorMovement () {
      var minLeft = storedImage.offsetLeft;
      var minTop = storedImage.offsetTop;
      var maxLeft = storedImage.offsetWidth - zoomSelector.offsetWidth + storedImage.offsetLeft;
      var maxTop = storedImage.offsetHeight - zoomSelector.offsetHeight + storedImage.offsetTop;

      var originalMousePosition = [e.clientX, e.clientY];
      var originalZoomRectPosition = [zoomSelector.offsetLeft, zoomSelector.offsetTop];

      function onMouseMove (e) {
        e.preventDefault();

        var newMousePosition = [e.clientX, e.clientY];
        var difference = [newMousePosition[0] - originalMousePosition[0], newMousePosition[1] - originalMousePosition[1]];

        zoomSelector.style.left = Math.min(maxLeft, Math.max(minLeft, (originalZoomRectPosition[0] + difference[0]))) + 'px';
        zoomSelector.style.top = Math.min(maxTop, Math.max(minTop, (originalZoomRectPosition[1] + difference[1]))) + 'px';

        processZoomedImage();
      }

      function onMouseUp (e) {
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('mousemove', onMouseMove);
      }

      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('mousemove', onMouseMove);

      processZoomedImage();
    }

    function initZoomSelectorResize () {
      var originalSize = zoomSelector.offsetWidth / 2;
      var originalOffset = [zoomSelector.offsetLeft + originalSize, zoomSelector.offsetTop + originalSize];
      var originalMousePosition = [e.clientX - originalSize, e.clientY - originalSize];

      function onMouseMove (e) {
        e.preventDefault();

        var newMousePosition = [e.clientX, e.clientY];
        var difference = [
          Math.abs(newMousePosition[0] - originalMousePosition[0]), 
          Math.abs(newMousePosition[1] - originalMousePosition[1])
        ];
        var newSize = Math.max(difference[0], difference[1]);

        zoomSelector.style.width = (newSize * 2) + 'px';
        zoomSelector.style.height = (newSize * 2) + 'px';
        zoomSelector.style.left = originalOffset[0] - (newSize) + 'px';
        zoomSelector.style.top = originalOffset[1] - (newSize) + 'px';
        processZoomedImage();
      }

      function onMouseUp (e) {
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('mousemove', onMouseMove);
      }

      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('mousemove', onMouseMove);

      processZoomedImage();
    }

    if (e.shiftKey && zoomSelector.classList.contains('on')) {
      initZoomSelectorResize();
    }
    else {
      initZoomSelectorMovement();
    }

  });

  storedImage.addEventListener('mousedown', function (e) {
    e.preventDefault();

    if (!imageDropZone.classList.contains('filled')) return;

    var imageContainerRect = imageContainer.getBoundingClientRect();
    var imageRect = storedImage.getBoundingClientRect();

    var minLeft = imageRect.left - imageContainerRect.left;
    var minTop = imageRect.top - imageContainerRect.top;

    var originalMousePosition = [e.clientX, e.clientY];
    var originalOffset = [e.offsetX + storedImage.offsetLeft, e.offsetY + storedImage.offsetTop];

    zoomSelector.style.width = 10 + 'px';
    zoomSelector.style.height = 10 + 'px';

    zoomSelector.style.left = originalOffset[0] - 5 + 'px';
    zoomSelector.style.top = originalOffset[1] - 5 + 'px';

    zoomSelector.classList.add('on');

    function onMouseMove (e) {
      e.preventDefault();

      var newMousePosition = [e.clientX, e.clientY];
      var difference = [Math.abs(newMousePosition[0] - originalMousePosition[0]), Math.abs(newMousePosition[1] - originalMousePosition[1])];
      var newSize = Math.max(difference[0], difference[1]);

      zoomSelector.style.width = (newSize * 2) + 'px';
      zoomSelector.style.height = (newSize * 2) + 'px';
      zoomSelector.style.left = originalOffset[0] - (newSize) + 'px';
      zoomSelector.style.top = originalOffset[1] - (newSize) + 'px';

      processZoomedImage();
    }

    function onMouseUp (e) {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);
    }

    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);

    processZoomedImage();
  });

  function nudgeZoomSelector (xDirection, yDirection) {
    var minLeft = storedImage.offsetLeft;
    var minTop = storedImage.offsetTop;
    var maxLeft = storedImage.offsetWidth - zoomSelector.offsetWidth + storedImage.offsetLeft;
    var maxTop = storedImage.offsetHeight - zoomSelector.offsetHeight + storedImage.offsetTop;

    var zoomRectPosition = [zoomSelector.offsetLeft, zoomSelector.offsetTop];

    zoomSelector.style.left = Math.min(maxLeft, Math.max(minLeft, (zoomRectPosition[0] + xDirection))) + 'px';
    zoomSelector.style.top = Math.min(maxTop, Math.max(minTop, (zoomRectPosition[1] + yDirection))) + 'px';

    processZoomedImage();
  }

  document.addEventListener('keydown', function (e) {
    if (e.keyCode === 37) {
      nudgeZoomSelector(-1, 0);
    }
    else if (e.keyCode === 38) {
      nudgeZoomSelector(0, -1);
    }
    else if (e.keyCode === 39) {
      nudgeZoomSelector(1, 0);
    }
    else if (e.keyCode === 40) {
      nudgeZoomSelector(0, 1);
    }
  });

  document.addEventListener('dragover', function (e) {
    e.preventDefault();
    document.body.classList.add('dragging');
  });


  document.addEventListener('drop', function (e) {
    e.preventDefault();
    document.body.classList.remove('dragging');
  });

});
