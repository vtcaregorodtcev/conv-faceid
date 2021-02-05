import { useState, useEffect } from 'react';
import { useUser } from '../lib/hooks';
import Layout from '../components/layout';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';

tf.setBackend('cpu');

const ENOUGH_SAMPLES = 1;

const Profile = () => {
  const [trainingSet, seTrainingSet] = useState([]);
  const [tfaEnabled, setTfaEnabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fm, setFm] = useState(null);

  const user = useUser({ redirectTo: '/login' });

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

        document.getElementById('images-thumbnails').innerHTML = '';
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

    document.getElementById('images-thumbnails').appendChild(img);

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

  useEffect(() => {
    if (tfaEnabled) allowVideo()
  }, [tfaEnabled])

  return (
    <Layout>
      <h1>Profile</h1>
      {user && (
        <>
          <label htmlFor="tfa">
            <input
              id="tfa"
              name="tfa"
              onChange={e => {
                setTfaEnabled(e.target.checked);
              }}
              disabled={user.tfaEnabled}
              checked={tfaEnabled || user.tfaEnabled} type='checkbox'
            />
            Use 2fa
          </label>
          {tfaEnabled && (<>
            <p>
              Please, start the video and capture 20-25 snapshots to train 2fa model
              <br />
              <br />
              <video disabled={user.tfaEnabled} id="player" controls autoPlay></video>
            </p>
            <p>
              <button onClick={captureImage} disabled={user.tfaEnabled} id="capture">Capture</button>
            </p>
            <p>
              <canvas id="canvas" width="320" height="240"></canvas>
            </p>
            <p id='images-thumbnails'></p>
            <p>
              <button onClick={trainOnSet} disabled={trainingSet.length < ENOUGH_SAMPLES} id="train">Train</button>
            </p>
          </>)}
          {loading && <div className="loading">Training in progress...</div>}
        </>
      )
      }

      <style>{`
        label {
          font-size: 18px;
          user-select: none;
        }
        input {
          margin-right: 10px;
        }
        canvas {
          position: absolute;
          z-index: -100;
          visibility: hidden;
        }
        #images-thumbnails {
          display: flex;
          flex-wrap: wrap;
        }
        #images-thumbnails img {
          height: 128px;
          width: 96px;
        }
        .loading {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #ddd;
          opacity: 0.6;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </Layout >
  )
}

export default Profile
