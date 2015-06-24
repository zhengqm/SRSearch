Items = new Mongo.Collection("log_info");

if (Meteor.isServer) {
  Meteor.publish('items', function (queryString) {
      return query(Items, queryString)
  })
}

if (Meteor.isClient) {
  Session.set('queryString', '')
  Meteor.subscribe('items', '')
   
  Template.body.helpers({
    items: function () {
      return query(Items, Session.get('queryString'))
    }
  });

  Template.body.events({
    "keyup #search-box":_.throttle(function(event){
      Session.set('queryString', event.target.value)
      Meteor.subscribe('items', event.target.value)
    }, 50)
  })
}

function splitKeyword(str){
  return str.split(' ')
}

function isSpecial(str){
  var relation
  var result = {}
  if (str.indexOf('<') != -1){
    relation = str.split('<')
    result[relation[0]] = { $lt: Number(relation[1])}
    return result
  } else if (str.indexOf('>') != -1){
    relation = str.split('>')
    result[relation[0]] = { $gt: Number(relation[1])}
    return result
  } else if (str.indexOf('=') != -1){
    relation = str.split('=')
    result[relation[0]] = relation[1]
    return result
  } else if (str.indexOf(':') != -1){
    relation = str.split(':')
    result[relation[0]] = new RegExp(relation[1], 'ig')
    return result
  } 
  return null;
}

function query(collections, queryString){
  var limit = 40
  var query = queryString.split(' ')
  var andArray = []
  for (var i = query.length - 1; i >= 0; i--) {
    if (query[i] == '') {
      continue
    }
    var testSpecial  = isSpecial(query[i])
    if (testSpecial != null) {
      andArray.push(testSpecial)
    } else {
      var regEx = new RegExp(query[i], 'ig')
      andArray.push({prj: regEx})
    }
  }

  if (andArray.length != 0){
    return collections.find({$and: andArray}, {limit:limit})
  } else {
    return collections.find({},{limit:limit})
  }
}