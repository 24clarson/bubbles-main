const port = process.env.PORT || 3000
const express = require('express');
const app = express();
const path = require('path');
const { MongoClient } = require('mongodb');

app.use(express.json({ limit: '50mb' }));

app.use(express.static( path.join(__dirname, 'public')))

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'))

app.get('/', (req, res) => {
  res.render('index');
})

app.get('/activities', (req, res) => {
  res.render('activities');
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
  const clientSecret = process.env.strava_secret;

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

const dbpw = process.env.db_password;
let client;
const dbName = process.env.db_name;

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

// Connect to MongoDB and fetch all activities from a year
app.post('/queryDB', async (req, res) => {
  try {
    const collectionName = req.body.year;

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const result = await collection.find().project({id: 1, name: 1, distance: 1, start_date_local: 1, moving_time: 1, type: 1, description: 1, workout_type: 1}).toArray();
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
    const db = client.db(dbName);
    for (let act of req.body.activity) {
      const collectionName = act.start_date_local.slice(0,4);
      const collections = await db.listCollections({ name: collectionName }).toArray();
      if (collections.length == 0) {
          await db.createCollection(collectionName);
      }

      const collection = db.collection(collectionName);

      const duplicates = await collection.find({id: act.id}).toArray();
      if (duplicates.length == 0) {
        await collection.insertOne(act);
      } else if (req.body.overwrite) {
        await collection.deleteOne({id: act.id})
        await collection.insertOne(act);
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

app.post('/earliestDB', async (req, res) => {
  try {
    const db = client.db(dbName);

    const collections = await db.listCollections({}).toArray();
    const minCollection = collections.map(obj => obj.name).sort()[0];
    const collection = db.collection(minCollection);

    const result = await collection.find({}).toArray();
    const leastrecent = result.map(obj => obj.start_date).sort()[0];
    res.json(leastrecent);

  } catch (err) {
    console.error('Error fetching activity:', err);
  } finally {
    // await client.close();
  }
});

app.post('/singleDB', async (req, res) => {
  try {
    const db = client.db(dbName);
    const collections = await db.listCollections({}).toArray();
    for (let col of collections) {
      const collection = db.collection(col.name);
      const result = await collection.find({id: parseInt(req.body.id)}).toArray();
      if (result.length > 0) {
        res.json(result[0]);
        break;
      }
    }
  } catch (err) {
    console.error('Error fetching activity:', err);
  } finally {
    // await client.close();
  }
});