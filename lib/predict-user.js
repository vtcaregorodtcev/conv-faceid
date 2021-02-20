import { lazyUserNet, reloadUserNet } from './knn-model';
import { lazyNet } from './mobilenet';
import * as tf from '@tensorflow/tfjs-node';

export const predictUser = async (username, image, treshold = 0.5) => {
  const net = await lazyNet();
  const nn = await lazyUserNet(username);

  const logits = net.infer(tf.tensor3d(image, [40, 40, 3]), 'conv_preds');

  const prob = await nn.model.predictClass(logits);

  console.log(prob.label);
  reloadUserNet(username);

  return prob.label == 'user';
}
