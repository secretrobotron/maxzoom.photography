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
  var zoomedImage = document.querySelector('#zoomed-image');
  var storedImage = document.querySelector('#stored-image');

  document.querySelector('#clear-selection').addEventListener('click', function (e) {
    zoomSelector.classList.remove('on');

    processZoomedImage();
  });

  document.querySelector('#output-size').addEventListener('input', function (e) {
    zoomedImage.width = e.target.value * 10;
    zoomedImage.height = e.target.value * 10;

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

    var context = zoomedImage.getContext('2d');

    var widthRatio = storedImage.width / storedImage.naturalWidth;
    var heightRatio = storedImage.height / storedImage.naturalHeight;

    context.drawImage(storedImage,
      rect.left / widthRatio,
      rect.top / heightRatio,
      rect.width / widthRatio,
      rect.height / heightRatio,
      0, 0, zoomedImage.width, zoomedImage.height);
  }

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
    
    var url = e.dataTransfer.getData('URL');

    function resizeStoredImage () {
      if (storedImage.naturalWidth > storedImage.naturalHeight) {
        storedImage.style.width = '100%';
        storedImage.style.height = 'auto';
      }
      else {
        storedImage.style.width = 'auto';
        storedImage.style.height = '100%';
      }

      processZoomedImage();
    }

    storedImage.onload = resizeStoredImage;

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

    var minLeft = storedImage.offsetLeft;
    var minTop = storedImage.offsetTop;
    var maxLeft = storedImage.offsetWidth - zoomSelector.offsetWidth;
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


  document.addEventListener('dragover', function (e) {
    e.preventDefault();
    document.body.classList.add('dragging');
  });


  document.addEventListener('drop', function (e) {
    e.preventDefault();
    document.body.classList.remove('dragging');
  });

  document.querySelector('#download').addEventListener('click', function () {
    var dataURL = zoomedImage.toDataURL('image/jpg');
    download(dataURL, guid() + '.jpg', 'image/jpg');
  });

});
