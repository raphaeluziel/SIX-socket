$( document ).ready(function() {
  
  /*global io*/
  var socket = io();
  
  // Form submittion with new message in field with id 'm'
  $('form').submit(function(){
    var messageToSend = $('#m').val();
    //send message to server here?
    socket.emit('chat message', messageToSend);
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
  
  socket.on('user', function(data){
    // Lets client see how many users are on chat using jQuery
    $('#num-users').text(data.currentUsers+' users online');
    var message = data.name;  // any users name
    if(data.connected) {
      message += ' has joined the chat.';
    } else {
      message += ' has left the chat.';
    }
    // Using jQuery to make a list of all users in chat room and 
    // whether they have just connected or diesconnected
    $('#messages').append($('<li>').html('<b>'+ message +'</b>'));
  });
  
  // Listen for event 'chat-message' emitted by server
  // Use jQuery to show message sent as a list
  socket.on('chat message', function(data){
    $('#messages').append($('<li>').html('<b>'+ data.name +':<\/b> ' + data.message));
  });
  

});
