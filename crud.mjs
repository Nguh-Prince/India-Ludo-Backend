const { MongoClient } = require("mongodb");

async function connect(client) {
//   const uri =
//     "mongodb+srv://nguhprince1:hLK1saVssBmvATem@cluster0.5dlksug.mongodb.net/?retryWrites=true&w=majority";
//   const client = new MongoClient(uri);

  return client.connect()
}

async function main() {
  const uri =
    "mongodb+srv://nguhprince1:hLK1saVssBmvATem@cluster0.5dlksug.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  connect(client).then(() => {{
    listDatabases(client).then(() => {
        console.log("Databases listed successfully")
    })
  }}).finally(() => {
    client.close()
  })

}

async function listDatabases(client) {
  databasesList = await client.db().admin().listDatabases();

  console.log("Databases:");
  databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
}

module.exports.main = main;
module.exports.connect = connect;
module.exports.listDatabases = listDatabases;
