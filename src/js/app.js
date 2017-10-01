/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Vector2 = require('vector2');
var ajax = require('ajax');
var Settings = require('settings');
var Clay = require('./clay');
var clayConfig = require('./config');
var clay = new Clay(clayConfig, null, {autoHandleEvents: false});


var NASCHPUNKTE_URL="https://naschpunkte.appspot.com/";
var USER_ID = Settings.option('user_id') || undefined;
var ACTIVITIES = Settings.option('activities') || undefined;

// clay settings
Pebble.addEventListener('showConfiguration', function(e) {
  Pebble.openURL(clay.generateUrl());
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (e && !e.response) {
    return;
  }
  var dict = clay.getSettings(e.response);
  // Save the Clay settings to the Settings module. 
  Settings.option(dict);
});

// UIs
var main = new UI.Card({
  title: 'NaschPebble',
  //icon: 'mainIcon',
  subtitle: 'verfügbare Punkte:',
  body: 'hole...',
  subtitleColor: 'indigo', // Named colors
  bodyColor: '#9a0036' // Hex colors
});

var activityMenu = new UI.Menu({
    sections: [{
      items: [{
        title: 'Activities',
        subtitle: 'hole...'
      }]
    }]
  });
  activityMenu.on('select', function(e) {
    console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
    console.log('The item is titled "' + e.item.title + '"');
  });

function updateActivityMenu(){
  var data = Settings.option('activities');
    var items = [];
    for (var i = 0; i < data.length; i++){
      var obj = data[i];
      items.push({title: obj.name, subtitle: obj.punkte + "pkt pro " + obj.defaultValue + " " + obj.einheit});
    }
    activityMenu.items(0, items);
}

// ajax requests
function login(){
  ajax({ url: NASCHPUNKTE_URL+'login/?csrf'},
    function(data, code, request) {
      console.log('Logging in with ' + data + '...');
      var loginData = { username: Settings.option('username'), password: Settings.option('password'), csrfmiddlewaretoken: data};
      
      ajax({ url: NASCHPUNKTE_URL+'login/', method:"post", data:loginData, type:"json"},
        function(data, code, req) {
          console.log('Logged in!');
          USER_ID=req.getResponseHeader("user_id");
          Settings.option('user_id', USER_ID);
          console.log("UserId: " + USER_ID);
          updatePunkte();
        },
        function(data, code) {
          console.log('Error logging in: ' + code + ": " + data);
        }
    );
    }
  );
}

function updateActivities() {
  if (USER_ID === undefined){
    login();
  }
  ajax({ url: NASCHPUNKTE_URL+'rest/lsa/?user_id='+USER_ID, type:"json"},
  function(data) {
    console.log('updateActivitiesCall successful!' + data);
    Settings.option('activities', data);
    updateActivityMenu();
  },
  function(data, code) {
    console.log('Error getting activities: ' + code + ": " + data);
    var title="Fehler!";
    var subtitle="";
    if (code == 401){
      subtitle="Nicht angemeldet!";
    }
    activityMenu.items(0, [{title: title, subtitle: subtitle}]);
  }
  );
}
if (ACTIVITIES === undefined){
  updateActivities();
}

function updatePunkte() {
  if (USER_ID === undefined){
    login();
  }
  ajax({ url: NASCHPUNKTE_URL+'rest/lsp/?user_id='+USER_ID},
  function(data) {
    console.log('updatePunkteCall successful!');
    main.body(data);
  },
  function(data, code) {
    console.log('Error getting punkte: ' + code + ": " + data);
    main.body("Fehler!");
    if (code == 401){
      main.body("Nicht angemeldet!");
    }
  }
  );
}
updatePunkte();

main.show();

main.on('click', 'up', function(e) {
  updateActivityMenu();
  activityMenu.show();
});

main.on('click', 'select', function(e) {
  var wind = new UI.Window({
    backgroundColor: 'black'
  });
  var radial = new UI.Radial({
    size: new Vector2(140, 140),
    angle: 0,
    angle2: 300,
    radius: 20,
    backgroundColor: 'cyan',
    borderColor: 'celeste',
    borderWidth: 1,
  });
  var textfield = new UI.Text({
    size: new Vector2(140, 60),
    font: 'gothic-24-bold',
    text: 'Dynamic\nWindow',
    textAlign: 'center'
  });
  var windSize = wind.size();
  // Center the radial in the window
  var radialPos = radial.position()
      .addSelf(windSize)
      .subSelf(radial.size())
      .multiplyScalar(0.5);
  radial.position(radialPos);
  // Center the textfield in the window
  var textfieldPos = textfield.position()
      .addSelf(windSize)
      .subSelf(textfield.size())
      .multiplyScalar(0.5);
  textfield.position(textfieldPos);
  wind.add(radial);
  wind.add(textfield);
  wind.show();
});

main.on('click', 'down', function(e) {
  var card = new UI.Card();
  card.title('A Card');
  card.subtitle('Is a Window');
  card.body('The simplest window type in Pebble.js.');
  card.show();
});
