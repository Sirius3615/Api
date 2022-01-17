
const express = require("express");
const app = express();
var cors = require('cors')
const fetch = require('node-fetch');
const JSONdb = require('simple-json-db');
const db = new JSONdb('./database.json');
const store = require('data-store')({ path: process.cwd() + '/data.json' });

var API_KEY = process.env.API_KEY;
var API_KEY_SECRET = process.env.API_KEY_SECRET;
var ACCES_TOKEN = process.env.ACCES_TOKEN;
var ACCES_SECRET = process.env.ACCES_SECRET;


// === TWITTER NPM === //
const twitter = require('twitter-lite');
const twitterclient = new twitter ({
  subdomain: "api", // "api" is the default (change for other subdomains)
  version: "1.1", // version "1.1" is the default (change for other subdomains)
  consumer_key: API_KEY, // from Twitter.
  consumer_secret: API_KEY_SECRET, // from Twitter.
  access_token_key: ACCES_TOKEN, // from your User (oauth_token)
  access_token_secret: ACCES_SECRET // from your User (oauth_token_secret)
 });

var truncate = require('truncate');
 
app.use(cors())
app.use(express.json());


//=============
// ROUTES
//=============

app.get('/', function(req, res) {
  res.send('Hello there! Please dont use this API, if you want to, please send us an email at: beyond.earth0@gmail.com Thanks!')
});


// ==========
//fetch launches
setInterval(function(){
   ;(async () => {
 var url = 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10&hide_recent_previous=true&mode=detailed&format=json';
      fetch(url)
    .then(res => res.json())
    .then(json => {
store.del('launch_list');
store.union('launch_list', json);
        console.log('fetched launch')
      });
      })()

},6 * 60000);

//  ======= 
//fetch events
setInterval(function(){
   ;(async () => {
  
var url = 'https://ll.thespacedevs.com/2.0.0/event/upcoming/?limit=15';
      fetch(url)
    .then(res => res.json())
    .then(json => {
store.del('events_list');
store.union('events_list', json);
        console.log('fetched events')
      });
      })()

},30 * 60000);

const api_prefix_launch = "/launch/api/v2"

// launch events
app.get(api_prefix_launch + "/all", (req, res) => {
 const launches = store.get('launch_list')
  res.send(launches)
});


//space events
app.get(api_prefix_launch + "/events", (req, res) => {
 const space_events = store.get('events_list')
  res.send(space_events)
    console.log('Requested')

});
  

  //======= SOCILA MEDIA ======== //
  
  setInterval(function() {
    
    var url = 'https://api.spaceflightnewsapi.net/v3/articles?_limit=1';
        fetch(url)
          .then(response => response.json())
          .then(data => {
            data.forEach((article) => {
              
              var title = article.title;
              var summary = article.summary;
              var url = article.url;
              console.log('Api out title:' + title)
              
              
              var news_title = db.get('news_title'); // -> title
              var db_title = news_title;
              console.log('DB title: ' + db_title)
              
              if (title === db_title ) { console.log('Its same!') }
              
              else {
                console.log('Thats the one!!')
                
                db.delete('news_title');
                db.set('news_title', title)
                
                var text = title + ' | ' + summary;
                
                
                const the_actual_txt = title + ' | ' + 'Read more: ' + url;
  
                ;(async () => {
     
       // ======= TWITTER ======= //
       
       twitterclient.post('statuses/update', { status: the_actual_txt }).then(() => {
         console.log("Tweet posted")
}).catch(console.error);
            
              
           
                })()
              }
              
            })
          })
          .catch(error => {
            console.log(error);
        })
  
    },  300 * 1000); // checks time every 5 minutes



 app.get(api_prefix_launch + "/:slug", (req, res) => {
  const launches = store.get('launch_list')
    
      const launched = launches[0].results.find(
        (obj) => obj.slug === req.params.slug);
    

        if(!launched) {
          fetch('https://lldev.thespacedevs.com/2.2.0/launch/previous/?slug=' + req.params.slug + '&mode=detailed&format=json') 
          .then(response => response.json())
          .then(data => {
            res.send(data.results[0]);
          })
        } else { res.send(launched) }
          // res.send(launched)
       console.log('Requested')
 });
  

app.get("/api/events/:slug", (req, res) => {
      const space_events = store.get('events_list')
        
      const event = space_events[0].results.find(
        (obj) => obj.slug === req.params.slug);

        if(!event) {
          fetch('https://devll.thespacedevs.com/2.0.0/event/previous/?slug=' + req.params.slug)
          .then(response => response.json())
          .then(data => {
            res.send(data);
          })
        } else { res.send(event) }

       console.log('Requested')
     });

//============
// LISTENER

const listener = app.listen(process.env.PORT, () => {
  console.log("API is listening on port " + listener.address().port );
});

