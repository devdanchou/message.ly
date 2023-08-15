"use strict";


const { NotFoundError } = require("../expressError");
const db = require("../db");
const bcrypt = require("bcrypt");

const { BCRYPT_WORK_FACTOR } = require("../config");
const { json } = require("body-parser");


/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    console.log("register here", username, password);
    const hashPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (username,
                              password,
                              first_name,
                              last_name,
                              phone,
                              join_at,
                              last_login_at
                              )
          VALUES
            ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
          RETURNING username, password, first_name, last_name, phone`,
      [username, hashPassword, first_name, last_name, phone]);

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(`
          SELECT password
          FROM users
          WHERE username = $1`,
      [username]);

    const user = result.rows[0];
    // if (!user) {
    //   throw new NotFoundError(`No ${username} exists`);
    // }
    //TODO: check for user test case
    return user && await bcrypt.compare(password, user.password) === true;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    // CURR_TIMESTAMP

    const result = await db.query(`
                  UPDATE users
                  SET last_login_at = CURRENT_TIMESTAMP
                  WHERE username = $1
                  RETURNING username`,
      [username]);

    const user = result.rows[0];

    if (!user) {
      return new NotFoundError(`No ${username} exists`);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(`
      SELECT username, first_name, last_name
      FROM users
      ORDER BY username`);

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(`
            SELECT username,
                  first_name,
                  last_name,
                  phone,
                  join_at,
                  last_login_at
            FROM users
            WHERE username = $1`,
      [username]);

    const user = results.rows[0];

    if (!user) {
      return new NotFoundError(`No ${username} exists`);
    }

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */




  static async messagesFrom(username) {
    const results = await db.query(
      `SELECT m.id,
             m.to_username,
             m.body,
             m.sent_at,
             m.read_at,
             u.last_name,
             u.phone,
             u.first_name
        FROM messages AS m
          JOIN users AS u ON u.username = m.to_username
          WHERE from_username = $1`, [username]
    );
    // console.log("resultss rows here:",results.rows)
    return results.rows.map(m => ({
      id: m.id,
      to_user: {
        username: m.to_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(
      `SELECT m.id,
             m.from_username,
             m.body,
             m.sent_at,
             m.read_at,
             u.last_name,
             u.phone,
             u.first_name
        FROM messages AS m
          JOIN users AS u ON m.from_username = u.username
          WHERE to_username = $1`, [username]
    );
    return results.rows.map(m => ({
      id: m.id,
      from_user: {
        username: m.from_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
  }
}


module.exports = User;
