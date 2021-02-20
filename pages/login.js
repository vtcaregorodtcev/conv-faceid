import { useState, useEffect } from 'react'
import Router from 'next/router'
import { useUser } from '../lib/hooks'
import Layout from '../components/layout'
import Form from '../components/form'
import { useTfInBrowser } from '../lib/use-tf-in-broswer';

const Login = () => {
  useUser({ redirectTo: '/', redirectIfFound: true });
  const [fields, setFields] = useState({});
  const [isFlowLocked, setIsFlowLocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    trainingSet,
    seTrainingSet,
    allowVideo,
    captureImage,
  } = useTfInBrowser();

  useEffect(() => {
    allowVideo();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    seTrainingSet(() => []);

    if (errorMsg) return setErrorMsg('');

    setFields({
      username: e.currentTarget.username.value,
      password: e.currentTarget.password.value,
    });

    setIsFlowLocked(true);

    captureImage();
  }

  async function continueSubmit() {
    const body = {
      ...fields,
      image: trainingSet[0]
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.status === 200) {
        Router.push('/')
      } else {
        throw new Error(await res.text())
      }
    } catch (error) {
      console.error('Sorry, we didn\'t recognize you:', error)
      setErrorMsg(error.message)
    } finally {
      setIsFlowLocked(false);
      setFields({});
    }
  }

  useEffect(() => {
    if (trainingSet.length) {
      continueSubmit();
    }
  }, [trainingSet.length]);

  return (
    <Layout>
      <div className="login" disabled={isFlowLocked}>
        <Form isLogin errorMessage={errorMsg} onSubmit={handleSubmit} />
        <video id="player" controls autoPlay></video>
      </div>
      <p>
        <canvas id="canvas" width="320" height="240"></canvas>
      </p>
      {isFlowLocked && <div className="loading">loading...</div>}
      <style jsx>{`
        .login {
          max-width: 22rem;
          margin: 0 auto;
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        canvas {
          position: absolute;
          z-index: -100;
          visibility: hidden;
        }
        video {
          margin-top: 20px;
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
    </Layout>
  )
}

export default Login
