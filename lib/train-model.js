import { lazyUserNet, reloadUserNet } from './model';
import * as tf from '@tensorflow/tfjs-node';
import { lazyNet } from './mobilenet';
import { getUsers } from './redis-store';

const users = getUsers();

export const trainModel = async (user, set) => {
  const net = await lazyNet();
  const nn = await lazyUserNet(user.username);

  const noiseSet = [];
  for (let i = 0; i < set.length; i++) {
    noiseSet[i] = generateNoise()
  }

  const X = [];
  const Y = [];

  set.map((img, i) => {
    const logits = net.infer(tf.tensor3d(img, [40, 40, 3]), 'conv_preds');
    const badLogits = net.infer(tf.tensor3d(noiseSet[i], [40, 40, 3]), 'conv_preds');

    X.push(logits.dataSync());
    X.push(badLogits.dataSync());

    Y.push(1);
    Y.push(0);
  });

  await nn.model.fit(
    tf.tensor(X, [set.length * 2, 1280]),
    tf.tensor(Y, [set.length * 2, 1]),
    { epochs: 800, verbose: 0 });

  await nn.save(user.username);

  reloadUserNet(user.username);

  user.tfaEnabled = true;
  await users.push(user);

  return true;
}


const generateNoise = () => {
  const noiseSample = [];

  for (let i = 0; i < 40; i++) {
    if (!noiseSample[i]) noiseSample[i] = [];
    for (let j = 0; j < 40; j++) {
      if (!noiseSample[i][j]) noiseSample[i][j] = [];
      for (let k = 0; k < 3; k++) {
        noiseSample[i][j][k] = Math.random();
      }
    }
  }

  return noiseSample;
}
