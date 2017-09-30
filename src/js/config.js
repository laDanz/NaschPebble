module.exports = [
  {
    "type": "heading",
    "defaultValue": "App Configuration"
  },
  {
    "type": "text",
    "defaultValue": "personalize your experience"
  },
  {
    "type": "section",
    "items": [
      {
        "type": "heading",
        "defaultValue": "Settings"
      },
      {
        "type": "input",
        "appKey": "username",
        "label": "Username",
        "attributes": {
          "type": "text"
        }
      },
      {
        "type": "input",
        "appKey": "password",
        "label": "Passwort",
        "attributes": {
          "type": "password"
        }
      }
    ]
  },
  {
    "type": "submit",
    "defaultValue": "Save Settings"
  }
];