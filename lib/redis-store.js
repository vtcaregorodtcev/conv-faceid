import redis from "redis";
import { promisify } from "util";

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {}
});

client.on("error", function (err) { throw err; });

class Users {
  constructor() {
    this.get = promisify(client.get).bind(client);
    this.set = promisify(client.set).bind(client);
  }

  async push(user) {
    return this.set(user.username, JSON.stringify(user));
  }

  async find(username) {
    return this.get(username).then(u => JSON.parse(u));
  }
}

let _users = null;

export const getUsers = () => {
  if (_users) return _users;

  _users = new Users();

  return _users;
}
