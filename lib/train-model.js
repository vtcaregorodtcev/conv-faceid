import { lazyUserNet, reloadUserNet } from './knn-model';
import * as tf from '@tensorflow/tfjs-node';
import { lazyNet } from './mobilenet';
import { getUsers } from './redis-store';

const users = getUsers();

export const trainModel = async (user, set) => {
  const net = await lazyNet();
  const nn = await lazyUserNet(user.username);

  const noiseSet = [];
  for (let i = 0; i < set.length; i++) {
    noiseSet[i] = generateNoise(set[i], 0.15);
  }

  const X = [];
  const Y = [];

  set.map((img, i) => {
    const logits = net.infer(tf.tensor3d(img, [40, 40, 3]), 'conv_preds');
    const badLogits = net.infer(tf.tensor3d(noiseSet[i], [40, 40, 3]), 'conv_preds');

    nn.model.addExample(logits, 'user');
    nn.model.addExample(badLogits, 'not_user');
  });

  await nn.save(user.username);

  reloadUserNet(user.username);

  user.tfaEnabled = true;
  await users.push(user);

  return true;
}


const generateNoise = (img, eps) => {
  const noiseSample = [];

  for (let i = 0; i < 40; i++) {
    if (!noiseSample[i]) noiseSample[i] = [];
    for (let j = 0; j < 40; j++) {
      if (!noiseSample[i][j]) noiseSample[i][j] = [];
      for (let k = 0; k < 3; k++) {
        noiseSample[i][j][k] = Math.random() < eps
          ? Math.random()
          : img[i][j][k];
      }
    }
  }

  return noiseSample;
}
