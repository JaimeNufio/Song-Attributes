(function() {

  var stateKey = 'spotify_auth_state';
  var Tracks = 1000; //data called from library temporary
  var TracksCollect = [];
  var DumpAttributes = [];

  var averages = {
    "valence":0,
    "instrumentalness":0,
    "energy":0,
    "acousticness":0,
    "loudness":0,
    "mode":0,
    "speechiness":0,
    "tempo":0,
    "danceability":0,
  }

  /**
   * Obtains parameters from the hash of the URL
   * @return Object
   */
  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  $(document).ajaxStop(function () {
     // console.log("done with ajax");
  });

  /*
   * Generates a random string containing numbers and letters
   * @param  {number} length The length of the string
   * @return {string} The generated string
   */
  function generateRandomString(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  function listOfURI(offset){
    let str = "";
    for (let i=offset; i<offset+100; i++){
      
      if (TracksCollect[i]){
        str+=TracksCollect[i]['id'];
      }

      if (i!=99){
        str+=",";
      }

   } 
    return str;
  }

  var userProfileSource = document.getElementById('user-profile-template').innerHTML,
      userProfileTemplate = Handlebars.compile(userProfileSource),
      userProfilePlaceholder = document.getElementById('user-profile');

      oauthSource = document.getElementById('oauth-template').innerHTML,
      oauthTemplate = Handlebars.compile(oauthSource),
      oauthPlaceholder = document.getElementById('oauth');

  var params = getHashParams();

  var access_token = params.access_token,
      state = params.state,
      storedState = localStorage.getItem(stateKey);

  if (access_token && (state == null || state !== storedState)) {
    alert('There was an error during the authentication');
  } else {
    localStorage.removeItem(stateKey);
    if (access_token) {
      $.ajax({
          url: 'https://api.spotify.com/v1/me',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          success: function(response) {
            userProfilePlaceholder.innerHTML = userProfileTemplate(response);

      //      $('#login').hide();
        //    $('#loggedin').show();
          }
      });
      //Establish how many Tracks we need to retrieve
      $.ajax({
          url: "https://api.spotify.com/v1/me/tracks?limit=1",
          type: 'GET',
          headers: { 
            'Authorization' : 'Bearer ' + access_token
          },
          success: function(data){Tracks=data['total'];console.log("Tracks:"+Tracks)  } 
        });
    } else {
      //  $('#login').show();
       // $('#loggedin').hide();
    }

//Login with Spotify
  document.getElementById('login-button').addEventListener('click', function() {

    var client_id = 'e80925f0ded1400d9e4a8c2ac9c7f449'; // Your client id
    var redirect_uri = 'http://localhost:8888'; // Your redirect uri

    var state = generateRandomString(16);

    localStorage.setItem(stateKey, state);
    var scope ="user-library-read user-read-private user-read-email";

    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(client_id);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
    url += '&state=' + encodeURIComponent(state);
    window.location = url;


  }, false);
	
//Collect songs from USER LIBRARY
//TODO: Write versions for Album, Playlists, and Individual Songs (Next: Current Song)
//TODO: Don't individual songs have a listing for Albums? Perhaps there's a genre track there

  document.getElementById('test').addEventListener('click',function(){
	//let time = 50;
  let songs=[]
  let next = "https://api.spotify.com/v1/me/tracks?limit=50&offset=0";
  let count = 0;
	for(let i = 0; i<(Tracks/50)+1;i++) {
			 $.ajax({
				url: "https://api.spotify.com/v1/me/tracks?limit=50&offset="+((i)*50),
				type: 'GET',
				headers: { 
					'Authorization' : 'Bearer ' + access_token
				},
				success: function(data){
          for (let j = 0; j<data['items'].length;j++){
          //  console.log("FUCK");
            console.log(data['items'][j]['track']['name']);// console.log(i); 
            TracksCollect.push(data['items'][j]['track'])
            count++;
          }

        }	
			});
	      
	}
 // console.log("DONE");
  },false);	


//Requires an array of URI's, but should work no matter the sequence
document.getElementById('analyze').addEventListener('click',function(){
    let base = "https://api.spotify.com/v1/audio-features/?ids=";
    for(let i = 0; i<(TracksCollect.length/100)+1; i++) {
        setTimeout(function() {
         $.ajax({
          url: base+listOfURI(100*i),
          type: 'GET',
          headers: { 
            'Authorization' : 'Bearer ' + access_token
          },
          success: function(data){
              //console.log(data['audio_features']);
              //console.log(i);
              for (let j = 0; j<100;j++){
                if (data['audio_features'][j]){
                  DumpAttributes.push(data['audio_features'][j]);
                  console.log(i);
                }
              }
          } 
        });
        },5*i);
    }
    },false); 


//TODO: chain these functions, probably keep a count of Tracks and check to trigger this part
//This function is independent on what process is used to collect songs
document.getElementById('averages').addEventListener('click',function(){

/*
"valence":0,
"instrumentals":0,
"energy":0,
"acousticness":0,
"loudness":0,
"mode":0,
"speechiness":0,
"tempo":0,
*/    

  for (let i = 0; i<DumpAttributes.length; i++){
    averages['valence']+=DumpAttributes[i]['valence'];
    averages['instrumentalness']+=DumpAttributes[i]['instrumentalness'];
    averages['energy']+=DumpAttributes[i]['energy'];
    averages['acousticness']+=DumpAttributes[i]['acousticness'];
    averages['loudness']+=DumpAttributes[i]['loudness'];
    averages['mode']+=DumpAttributes[i]['mode'];
    averages['speechiness']+=DumpAttributes[i]['speechiness'];
    averages['tempo']+=DumpAttributes[i]['tempo'];
    averages['danceability']+=DumpAttributes[i]['danceability'];
  }
  averages['valence']/=Tracks;
  averages['instrumentalness']/=Tracks;
  averages['energy']/=Tracks;
  averages['acousticness']/=Tracks;
  averages['loudness']/=Tracks;
  averages['mode']/=Tracks;
  averages['speechiness']/=Tracks;
  averages['tempo']/=Tracks;
  averages['danceability']/=Tracks;
  console.log(averages);
  },false); 


  }
})();