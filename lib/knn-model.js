import * as tf from '@tensorflow/tfjs-node';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

const _users = {};

const fs = require('fs');

export class KNN {
  async save(username) {
    let json = JSON.stringify(
      Object
        .entries(this.model.getClassifierDataset())
        .map(([label, data]) => [label, Array.from(data.dataSync()), data.shape]));

    writeFileSyncRecursive(`./models/${username}/model.json`, json, 'utf-8');
  }

  async load(username) {
    let model;

    try {
      let rawdata = fs.readFileSync(`./models/${username}/model.json`);
      model = knnClassifier.create();

      model.setClassifierDataset(
        Object
          .fromEntries(
            JSON
              .parse(rawdata)
              .map(([label, data, shape]) => [label, tf.tensor(data, shape)])));
    } catch {
      model = knnClassifier.create();
    }

    return this.model = model;
  }
}

export const lazyUserNet = async (username) => {
  if (_users[username]) return _users[username];

  const nn = new KNN();
  await nn.load(username);

  _users[username] = nn;

  return _users[username];
}

export const reloadUserNet = async (username) => {
  const nn = new KNN();
  await nn.load(username);

  _users[username] = nn;
}

function writeFileSyncRecursive(filename, content, charset) {
  // -- normalize path separator to '/' instead of path.sep,
  // -- as / works in node for Windows as well, and mixed \\ and / can appear in the path
  let filepath = filename.replace(/\\/g, '/');

  // -- preparation to allow absolute paths as well
  let root = '';
  if (filepath[0] === '/') {
    root = '/';
    filepath = filepath.slice(1);
  }
  else if (filepath[1] === ':') {
    root = filepath.slice(0, 3);   // c:\
    filepath = filepath.slice(3);
  }

  // -- create folders all the way down
  const folders = filepath.split('/').slice(0, -1);  // remove last item, file
  folders.reduce(
    (acc, folder) => {
      const folderPath = acc + folder + '/';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      return folderPath
    },
    root // first 'acc', important
  );

  // -- write file
  fs.writeFileSync(root + filepath, content, charset);
}
