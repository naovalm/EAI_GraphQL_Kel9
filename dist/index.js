import { ApolloServer, gql } from 'apollo-server';
import mysql from 'mysql';
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'holidays',
};
const db = mysql.createConnection(dbConfig);
const typeDefs = gql `  
  type Place {
    place_id: ID
    name: String
    province: String
    regency: String
    category: String
    price: Float
  }

  input PlaceInput {
    name: String
    province: String
    regency: String
    category: String
    price: Float
  }

  type Query {
    places: [Place]
    place(place_id: ID!): Place
  }

  type Mutation {
    createPlace(input: PlaceInput): Place
    updatePlace(place_id: ID!, input: PlaceInput): Place
    deletePlace(place_id: ID!): Place
  }
`;
const resolvers = {
    Query: {
        places: (parent, args) => {
            return new Promise((resolve, reject) => {
                db.query('SELECT * FROM places', (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(rows);
                    }
                });
            });
        },
        place: (parent, args) => {
            const { place_id } = args;
            return new Promise((resolve, reject) => {
                db.query('SELECT * FROM places WHERE place_id = ?', [place_id], (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(rows[0]);
                    }
                });
            });
        },
    },
    Mutation: {
        createPlace: (parent, args) => {
            const { name, province, regency, category, price } = args.input;
            return new Promise((resolve, reject) => {
                const place_id = generateId();
                db.query('INSERT INTO places (place_id, name, province, regency, category, price) VALUES (?, ?, ?, ?, ?, ?)', [place_id, name, province, regency, category, price], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const newPlace = {
                            place_id,
                            name,
                            province,
                            regency,
                            category,
                            price,
                        };
                        resolve(newPlace);
                    }
                });
            });
        },
        updatePlace: (parent, args) => {
            const { place_id, input } = args;
            return new Promise((resolve, reject) => {
                db.query('UPDATE places SET name = ?, province = ?, regency = ?, category = ?, price = ? WHERE place_id = ?', [input.name, input.province, input.regency, input.category, input.price, place_id], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        db.query('SELECT * FROM places WHERE place_id = ?', [place_id], (err, rows) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(rows[0]);
                            }
                        });
                    }
                });
            });
        },
        deletePlace: (parent, args) => {
            const { place_id } = args;
            return new Promise((resolve, reject) => {
                db.query('SELECT * FROM places WHERE place_id = ?', [place_id], (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const place = rows[0];
                        db.query('DELETE FROM places WHERE place_id = ?', [place_id], (err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(place);
                            }
                        });
                    }
                });
            });
        },
    },
};
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
async function startServer() {
    try {
        await new Promise((resolve, reject) => {
            db.connect((err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
        const server = new ApolloServer({ typeDefs, resolvers });
        const { url } = await server.listen();
        console.log(`Server running at ${url}`);
    }
    catch (err) {
        console.error('Error starting the server', err);
    }
}
startServer();
