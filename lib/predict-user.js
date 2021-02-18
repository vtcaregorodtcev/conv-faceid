import { NN } from './model';
import { lazyNet } from './mobilenet';
import * as tf from '@tensorflow/tfjs-node';

export const predictUser = async (username, image, treshold = 0.5) => {
  const net = await lazyNet();

  const nn = new NN();

  await nn.load(username);

  const logits = net.infer(tf.tensor3d(image, [40, 40, 3]), 'conv_preds');

  const prob = nn.model.predict(logits).dataSync();

  return prob > treshold;
}
