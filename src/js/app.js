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
var NASCHIES = Settings.option('naschies') || undefined;

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
    var value = e.item.entity.defaultValue;
    var card = new UI.Card();
    card.title(e.item.title);
    card.subtitle(e.item.subtitle);
    card.body(value + " " + e.item.entity.einheit + ' ?');
    card.show();
    card.on('click', 'select', function(event) {
      console.log("adding " + value + e.item.entity.einheit + " of " + e.item.entity.name + "(" + JSON.stringify(e.item.entity)+")");
      createEvent(e.item.entity.urlsafe, value);
      activityMenu.hide();
      card.hide();
    });
    function updateValue(){
      card.body(value + " " + e.item.entity.einheit + ' ?');
    }
    card.on('click', 'up', function(e) {
      if (value>=1){
        value++;
      }else{
        value+=0.25;  
      }
      updateValue();
    });
    card.on('click', 'down', function(e) {
      if (value>1){
        value--;
      }else if (value == 0){}else{
        value-=0.25;
      }
      updateValue();
    });
    
  });

main.on('click', 'up', function(e) {
  updateActivityMenu();
  activityMenu.show();
});

function updateActivityMenu(){
  var data = Settings.option('activities');
    var items = [];
    for (var i = 0; i < data.length; i++){
      var obj = data[i];
      items.push({title: obj.name, subtitle: obj.punkte + "pkt pro " + obj.defaultValue + " " + obj.einheit, entity: obj});
    }
    activityMenu.items(0, items);
}

var naschMenu = new UI.Menu({
    sections: [{
      items: [{
        title: 'Naschies',
        subtitle: 'hole...'
      }]
    }]
  });
  naschMenu.on('select', function(e) {
    console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
    console.log('The item is titled "' + e.item.title + '"');
    var value = e.item.entity.defaultValue;
    var card = new UI.Card();
    card.title(e.item.title);
    card.subtitle(e.item.subtitle);
    card.body(value + " " + e.item.entity.einheit + ' ?');
    card.show();
    card.on('click', 'select', function(event) {
      console.log("adding " + value + e.item.entity.einheit + " of " + e.item.entity.name + "(" + JSON.stringify(e.item.entity)+")");
      createEvent(e.item.entity.urlsafe, value);
      naschMenu.hide();
      card.hide();
    });
    function updateValue(){
      card.body(value + " " + e.item.entity.einheit + ' ?');
    }
    card.on('click', 'up', function(e) {
      if (value>=1){
        value++;
      }else{
        value+=0.25;  
      }
      updateValue();
    });
    card.on('click', 'down', function(e) {
      if (value>1){
        value--;
      }else if (value == 0){}else{
        value-=0.25;
      }
      updateValue();
    });
    
  });

main.on('click', 'down', function(e) {
  updateNaschMenu();
  naschMenu.show();
});

function updateNaschMenu(){
  var data = Settings.option('naschies');
    var items = [];
    for (var i = 0; i < data.length; i++){
      var obj = data[i];
      items.push({title: obj.name, subtitle: obj.punkte + "pkt pro " + obj.defaultValue + " " + obj.einheit, entity: obj});
    }
    naschMenu.items(0, items);
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

function updateNaschies() {
  if (USER_ID === undefined){
    login();
  }
  ajax({ url: NASCHPUNKTE_URL+'rest/lsn/?user_id='+USER_ID, type:"json"},
  function(data) {
    console.log('updateNaschiesCall successful!' + data);
    Settings.option('naschies', data);
    updateNaschMenu();
  },
  function(data, code) {
    console.log('Error getting naschies: ' + code + ": " + data);
    var title="Fehler!";
    var subtitle="";
    if (code == 401){
      subtitle="Nicht angemeldet!";
    }
    naschMenu.items(0, [{title: title, subtitle: subtitle}]);
  }
  );
}
if (NASCHIES === undefined){
  updateNaschies();
}

function createEvent(event, value) {
  if (USER_ID === undefined){
    login();
  }
  var data={user_id: USER_ID, event:event, value:value};
  ajax({ url: NASCHPUNKTE_URL+'rest/cre/', data: data, method: "post"},
  function(data) {
    console.log('createEvent successful!');
    updatePunkte();
  },
  function(data, code) {
    console.log('Error creatingEvent: ' + code + ": " + data);
  });
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

main.on('click', 'select', function(e) {
  updateActivities();
  updateNaschies();
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