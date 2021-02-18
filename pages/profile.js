import { useState, useEffect } from 'react';
import { useUser } from '../lib/hooks';
import Layout from '../components/layout';
import * as tf from '@tensorflow/tfjs';
import { useTfInBrowser } from '../lib/use-tf-in-broswer';

tf.setBackend('cpu');

const ENOUGH_SAMPLES = 1;

const Profile = () => {
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const user = useUser({ redirectTo: '/login' });

  const {
    loading,
    trainingSet,
    allowVideo,
    captureImage,
    trainOnSet
  } = useTfInBrowser();

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
