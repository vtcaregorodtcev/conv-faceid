import * as mobilenet from '@tensorflow-models/mobilenet';

let _net;

export const lazyNet = async () => {
  if (_net) return _net;

  _net = await mobilenet.load({ alpha: 1.0, version: 2, inputRange: [0, 1] });

  return _net;
};
