const port = process.env.PORT || 3000
const express = require('express');
const app = express();
const path = require('path');
const { MongoClient } = require('mongodb');

app.use(express.json());

app.use(express.static( path.join(__dirname, 'public')))

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'))

app.get('*', (req, res) => {
  res.render('index');
})

app.listen(port,() => {
  console.log(`Server running at port `+port);
});


app.post("/fetchAccessToken", async (req, res) => {
  console.log("Received access token request");
  result = await fetchAccessToken(req.body);
  res.json(result);
});

async function fetchAccessToken(info) {
  const clientSecret = process.env.secret;

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: info.client_id,
        client_secret: clientSecret,
        code: info.code,
        grant_type: info.grant_type,
        redirect_uri: info.redirect_uri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch access token: ${response.status}`);
    }

    const data = await response.json();
    console.log('Access Token:', data.access_token);

    return data;
  } catch (error) {
    console.error('Error fetching access token:', error);
  }
}


const uri = `mongodb+srv://cedarlarson:${process.env.db_password}@bubbles.qn6sb.mongodb.net/?retryWrites=true&w=majority&appName=Bubbles`;
let client;

// Middleware to ensure MongoDB client is connected
async function connectToMongoDB(req, res, next) {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
  }
  next();
}

app.use(connectToMongoDB);

// Connect to MongoDB and fetch an activity
app.post('/queryDB', async (req, res) => {
  try {
    const dbName = "Activities";
    const collectionName = req.body.year;

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const result = await collection.find({}).toArray();
    res.json(result);

  } catch (err) {
    console.error('Error fetching activity:', err);
  } finally {
    // await client.close();
  }
});

// Connect to MongoDB and insert an activity
app.post('/sendDB', async (req, res) => {
  try {
    const dbName = "Activities";
    const db = client.db(dbName);
    for (let act of req.body.activity) {
      const collectionName = act.start_date.slice(0,4);
      const collections = await db.listCollections({ name: collectionName }).toArray();
      if (collections.length == 0) {
          await db.createCollection(collectionName);
      }

      const collection = db.collection(collectionName);

      const duplicates = await collection.find({id: act.id}).toArray();
      if (duplicates.length == 0) {
        const result = await collection.insertOne(act);
      }
    }
    
  } catch (err) {
    console.error('Error inserting activity:', err);
  } finally {
    // await client.close();
  }
});

app.post('/ultimateDB', async (req, res) => {
  try {
    const dbName = "Activities";
    const db = client.db(dbName);

    const collections = await db.listCollections({}).toArray();
    const maxCollection = collections.map(obj => obj.name).sort().pop();
    const collection = db.collection(maxCollection);

    const result = await collection.find({}).toArray();
    const mostrecent = result.map(obj => obj.start_date).sort().pop();
    res.json(mostrecent);

  } catch (err) {
    console.error('Error fetching activity:', err);
  } finally {
    // await client.close();
  }
});
