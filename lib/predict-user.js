import { NN } from './model';
import * as tf from '@tensorflow/tfjs-node';
import * as mobilenet from '@tensorflow-models/mobilenet';

export const predictUser = async (username, image, treshold = 0.5) => {
  const net = await mobilenet.load({ alpha: 1.0, version: 2, inputRange: [0, 1] });
  const nn = new NN();

  await nn.load(username);

  const logits = net.infer(tf.tensor3d(image, [40, 40, 3]), 'conv_preds');

  const prob = nn.model.predict(logits).dataSync();

  return prob > treshold;
}
