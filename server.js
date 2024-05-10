const express = require("express");
const app = express();
const port = process.env.PORT || 8081;
const path = require("path");
process.stdin.setEncoding("utf8");
require("dotenv").config({ path: path.resolve(__dirname, '.env') }) 
const axios = require('axios'); // for API calls
const bodyParser = require("body-parser"); /* To handle post parameters */


/* directory where templates will reside */
app.set("views", path.resolve(__dirname, "templates"));
/* view/templating engine */
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended:false})); // express middleware

const mongoUsername = process.env.MONGO_DB_USERNAME;
const mongoPassword = process.env.MONGO_DB_PASSWORD;
const dbName = process.env.MONGO_DB_NAME;
const mongoCollection = process.env.MONGO_COLLECTION;
const uri = `mongodb+srv://${mongoUsername}:${mongoPassword}@finalcluster.sjq9pk8.mongodb.net/?retryWrites=true&w=majority&appName=finalcluster`;
/* Our database and collection */
const databaseAndCollection = {db: dbName, collection:mongoCollection};
const { MongoClient, ServerApiVersion } = require('mongodb');
const { error } = require("console");
const client = new MongoClient(uri, {serverApi: ServerApiVersion.v1 });


app.get("/", (req, res) => {
  async function retrieveComments() {
    await client.connect();
    const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find({});
    const result = await cursor.toArray();
    return result;
  }
  (async () => {
    let comments = "";
    let commentsData = await retrieveComments();
    if (commentsData.length === 0) {
      comments = "Be the first to comment";
    } else {
      
      comments += "<table >";
      for (comment of commentsData) {
        comments += `<tr><td>${comment.commentUserName}: ${comment.singleComment}</td></tr>`;
      }
      comments += "</table>";
    }
    const baseURL = process.env.BASE_URL || 'http://localhost:8081';
    res.render("index", {comments, baseURL});
  })();
});

app.listen(port, () => {
  console.log(`App running and listening on port ${port}!`);
});

app.get("/retrieveData/", (req, res) => {
  const team = req.query.teamName;
  const year = req.query.seasonYear;

  // fetch the ID of the team 
  async function fetchTeamID(teamName) {
    const options = {
      method: 'GET',
      url: 'https://api-nba-v1.p.rapidapi.com/teams',
      params: {
        search: teamName
      },
      headers: {
        'X-RapidAPI-Key': process.env.XRapidAPIKey,
        'X-RapidAPI-Host': process.env.XRapidAPIHost
      }
    };

    const response = await axios.request(options);
    if (response.data.response[0] !== undefined) {
      return response.data.response[0].id;
    }
    else {
      throw new Error("No data received");
    }
  
  };
  async function fetchTeamStatistics(teamID) {
    const options = {
      method: 'GET',
      url: 'https://api-nba-v1.p.rapidapi.com/teams/statistics',
      params: {
        id: teamID,
        season: year
      },
      headers: {
        'X-RapidAPI-Key': process.env.XRapidAPIKey,
        'X-RapidAPI-Host': process.env.XRapidAPIHost
      }
    };
      const response = await axios.request(options);
      return response.data;
  };

  fetchTeamID(team).then((id) => {
  fetchTeamStatistics(id).then((data) => {
    let {games, points, fgp, assists, steals, turnovers, blocks} = data.response[0];
    res.render("forum", {team, games, points, fgp, assists, steals, turnovers, blocks});
  })
  }).catch( (err) => {
    res.status(500).json({ error: "Failed to retrieve team data. Please try again later." });
  }
  );
});


app.post("/postComment", (req,res) => {
  async function addComment(comment) {
    await client.connect();
    await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(comment);
  }
  let {username, comment} = req.body;
  addComment({commentUserName: username, singleComment:comment})
  res.redirect("/");
});