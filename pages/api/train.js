import { getLoginSession } from '../../lib/auth'
import { findUser } from '../../lib/user'
import { trainModel } from '../../lib/train-model';

export default async function train(req, res) {
  try {
    const session = await getLoginSession(req);
    const user = (session && (await findUser(session))) ?? null;

    const response = await trainModel(user, JSON.parse(req.body));

    res.status(200).json(response)
  } catch (error) {
    console.error(error)
    res.status(500).end('Authentication token is invalid, please log in')
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}
