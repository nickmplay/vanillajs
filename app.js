// load data from API
// vjsdata = []; //debugging
async function callAPI(callback) {
  //query local storage first 
  let local = getPhotos();
  if(local){
    callback(local);
    return;
  }
  
  try {
    let response = await fetch('https://vanillajsacademy.com/api/photos.json');
    if (!response.ok) throw response;
    let data = await response.json();
    savePhotos(data);
    callback(data);
  } catch (error) {
    console.warn(error);
    callback();
  }
}

// get & set session storage
function savePhotos(photos){
  sessionStorage.setItem('photos', JSON.stringify(photos));
}

function getPhotos(){
  return JSON.parse(sessionStorage.getItem('photos'));
}


export { callAPI, savePhotos };