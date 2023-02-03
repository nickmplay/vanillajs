// load data from API
// vjsdata = []; //debugging
async function callAPI(callback) {
  try {
    let response = await fetch('https://vanillajsacademy.com/api/photos.json');
    if (!response.ok) throw response;
    let data = await response.json();
    callback(data);
  } catch (error) {
    console.warn(error);
    callback();
  }
}



export { callAPI };