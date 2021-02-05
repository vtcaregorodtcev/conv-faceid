import * as tf from '@tensorflow/tfjs-node';

export class NN {
  async save(username) {
    return await this.model.save(`file://models/${username}/model.json`);
  }

  async load(username) {
    let model;

    try {
      model = await tf.loadLayersModel(`file://models/${username}/model.json`);
    } catch {
      model = this.create();
    }

    return this.model = model;
  }

  create() {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      inputShape: [1280],
      units: 100,
      activation: 'sigmoid'
    }));

    model.add(tf.layers.dense({ units: 100, activation: 'sigmoid' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }
}
