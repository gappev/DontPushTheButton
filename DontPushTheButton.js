Clicks = new Meteor.Collection("Clicks");
Users = new Meteor.Collection("Users");
var connectedUsers = 0;
var _id = '1';

Clicks.allow({
  update: function(userId,clicksCollection,field,modifier){
    return modifier && 
           modifier['$inc'] && 
           modifier['$inc'].click && 
           modifier['$inc'].click === 1;           
  }
});

if (Meteor.isClient) {
  Template.clicker.clicks = function () {
    var v = Clicks.find({_id: _id}).fetch()[0]; 
    return v === undefined ? 0 : v.click;
  };

  Template.clicker.events({
    'click img' : function () {
         Clicks.update(_id,{$inc: {click: 1} }); 
      }  
  });

  Template.clicker.rendered = function() {
    var clicks = Template.clicker.clicks();
    window.document.title = '(' + clicks + ') Dont Push The Button';    
  };

  Template.clicker.count = function() {
    if(Users.find() != undefined) {

        var userCount = Users.find().fetch().length;

          if (userCount < connectedUsers){  
            // just            
              toastr.warning(' ', 'A User has disconnected');
          }
          else if( userCount > connectedUsers){
              toastr.info(' ', 'A User has connected');
          }          
        

        connectedUsers = userCount;
        return connectedUsers;
    }
    return '...';
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    if ( Clicks.find().count()==0){
      Clicks.insert({_id: _id, click: 0});
    }

    Users.remove({});
    Meteor.default_server.stream_server.register( Meteor.bindEnvironment( function(socket) {
        var intervalID = Meteor.setInterval(function() {
            if (socket.meteor_session) {

                var connection = {
                    connectionID: socket.meteor_session.id,
                    connectionAddress: socket.address,
                    userID: socket.meteor_session.userId
                };
                connection.log(socket.address);
                socket.id = socket.meteor_session.id;
                Users.insert(connection); 
                Meteor.clearInterval(intervalID);
            }
        }, 1000);

        socket.on('close', Meteor.bindEnvironment(function () {
            Users.remove({
                connectionID: socket.id
                });
        }, function(e) {
            Meteor._debug("Exception from connection close callback:", e);
        }));
    }, function(e) {
        Meteor._debug("Exception from connection registration callback:", e);
    }));
  });
}