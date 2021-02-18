import { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';

export function useTfInBrowser() {
  const [loading, setLoading] = useState(false);
  const [trainingSet, seTrainingSet] = useState([]);
  const [fm, setFm] = useState(null);

  const trainOnSet = async () => {
    setLoading(true);
    fetch('/api/train', {
      method: 'POST',
      body: JSON.stringify(trainingSet)
    })
      .then(res => res.json())
      .then(() => {
        alert('Training is done! Now you can use 2fa with your photo.');
        seTrainingSet([]);

        const thumbnails = document.getElementById('images-thumbnails');

        if (thumbnails)
          thumbnails.innerHTML = '';
      })
      .finally(() => setLoading(false));
  }

  const prepareImageForTraining = async (img) => {
    const preparedData = tf.tidy(() => {
      const imgTensor = tf.browser.fromPixels(img).asType('float32');
      const resizedImgTensor = tf.image.resizeBilinear(imgTensor, [40, 40]);

      const normalized = resizedImgTensor.div(255);

      return normalized;
    });

    const data = await preparedData.array();

    seTrainingSet(set => [...set, data]);
  };

  const cropImageAroundFace = async (face, image) => {
    const [x1, y1] = face.boundingBox.topLeft;
    const [x2, y2] = face.boundingBox.bottomRight;

    const height = y2 - y1;
    const width = x2 - x1;

    const cropCanvas = document.createElement('canvas');

    cropCanvas.setAttribute('width', width);
    cropCanvas.setAttribute('height', height);

    const cropContext = cropCanvas.getContext('2d');

    cropContext.drawImage(image, x1, y1, width, height, 0, 0, width, height);

    const img = new Image();
    img.src = cropCanvas.toDataURL();

    const thumbnails = document.getElementById('images-thumbnails');
    if (thumbnails)
      thumbnails.appendChild(img);

    img.onload = () => prepareImageForTraining(img)
  }

  const processVideoSample = async (image) => {
    let m;

    if (!fm) {
      m = await facemesh.load()

      setFm(m);
    }

    const [face] = await (fm || m).estimateFaces(image);

    cropImageAroundFace(face, image);
  }

  const allowVideo = async () => {
    const player = document.getElementById('player');

    const constraints = {
      video: {
        width: 320,
        height: 240
      },
    };

    // Attach the video stream to the video element and autoplay.
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        player.srcObject = stream;
      });
  }

  const captureImage = async () => {
    const player = document.getElementById('player');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    // Draw the video frame to the canvas.
    context.drawImage(player, 0, 0, canvas.width, canvas.height);

    const image = new Image();
    image.onload = () => processVideoSample(image);
    image.src = canvas.toDataURL();
  };

  return {
    loading,
    trainingSet,
    allowVideo,
    captureImage,
    trainOnSet
  }
}
