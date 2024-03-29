let headers = new Headers({
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
	'Access-Control-Allow-Headers': '*'
});

/**
 * Get the user token from the API request
 * @param  {Request} request The request object
 * @return {String}          The session token
 */
function getToken (request) {

	// If GET request, get query parameter
	if (request.method === 'GET') {
		return new URL(request.url).searchParams.get('token');
	}

	// Otherwise, get authorization header
	let [scheme, encoded] = request.headers.get('Authorization').split(' ');

	// if Bearer, get token
	if (scheme === 'Bearer') {
		return encoded;
	}

}

/**
 * Check if token is for a valid session
 * @param  {String}  token The session token
 * @return {Boolean}       If true, user is logged in
 */
async function isLoggedIn (token) {

	// Check for token in database
	let session = await TOKENS.get(token);

	// If session exists, user is logged in
	return session === null ? false : true;

}

/**
 * Get the index of the photo to edit by its ID
 * @param  {Array}  photos All photos
 * @param  {String} id     The ID of the photo to get
 * @return {Object}        The photo index
 */
function getPhotoIndexByID (photos, id) {
	return photos.findIndex(function (photo) {
		return photo.id === id;
	});
}

/**
 * Handle GET requests
 * @param  {Request}  request The request object
 * @return {Response}         The response object
 */
async function handleGET (request) {

	// Get photos from database
	let photos = await PHOTOS.get('photos');

	// return a Response object
	return new Response(photos, {
		status: 200,
		headers: headers
	});

}

/**
 * Handle PUT requests
 * @param  {Request}  request The request object
 * @return {Response}         The response object
 */
async function handlePUT (request) {

	// Get photos from database
	let photos = await PHOTOS.get('photos', {type: 'json'});

	// Get the photo details
	let {id, name, description, price} = await request.json();

	// If there are missing details, return an error
	if (!id || !name || !description || !price) {
		return new Response('Please provide all required data', {
			status: 400,
			headers: headers
		});
	}

	// Make sure price is a number
	price = parseFloat(price);
	if (Number.isNaN(price)) {
		return new Response('Price must be a valid number', {
			status: 400,
			headers: headers
		});
	}

	// Get the photo index
	let index = getPhotoIndexByID(photos, id);

	// If there's no matching photo, return an error
	if (index < 0) {
		return new Response('Photo not found', {
			status: 404,
			headers: headers
		});
	}

	// Otherwise, update the photo
	Object.assign(photos[index], {name, description, price});
	let updated = await PHOTOS.put('photos', JSON.stringify(photos));

	// If update failed
	if (updated === null) {
		return new Response('Unable to update. Please try again.', {
			status: 500,
			headers: headers
		});
	}

	// return a Response object
	return new Response('Photo updated', {
		status: 200,
		headers: headers
	});

}

/**
 * Handle DELETE requests
 * @param  {Request}  request The request object
 * @return {Response}         The response object
 */
async function handleDELETE (request) {

	// Get photos from database
	let photos = await PHOTOS.get('photos', {type: 'json'});

	// Get the photo details
	let {id} = await request.json();

	// If there is no id, return an error
	if (!id) {
		return new Response('Please provide photo ID', {
			status: 400,
			headers: headers
		});
	}

	// Get the photo index
	let index = getPhotoIndexByID(photos, id);

	// If there's no matching photo, return an error
	if (index < 0) {
		return new Response('Photo not found', {
			status: 404,
			headers: headers
		});
	}

	// Otherwise, delete the photo
	photos = photos.filter((e, i) => i != index);
	let updated = await PHOTOS.put('photos', JSON.stringify(photos));

	// If update failed
	if (updated === null) {
		return new Response('Unable to delete. Please try again.', {
			status: 500,
			headers: headers
		});
	}

	// return a Response object
	return new Response('Photo deleted', {
		status: 200,
		headers: headers
	});

}

/**
 * Handle POST requests
 * @param  {Request}  request The request object
 * @return {Response}         The response object
 */
async function handlePOST (request) {

	// Get photos from database
	let photos = await PHOTOS.get('photos', {type: 'json'});

	// Get the photo details
	let {id, name, url, description, price} = await request.json();

	// If there are missing details, return an error
	if (!id || !name || !url || !description || !price) {
		return new Response('Please provide all required data', {
			status: 400,
			headers: headers
		});
	}

	// Make sure price is a number
	price = parseFloat(price);
	if (Number.isNaN(price)) {
		return new Response('Price must be a valid number', {
			status: 400,
			headers: headers
		});
	}

	// Check for existing photo with that ID
	let index = getPhotoIndexByID(photos, id);

	// If there's already a photo with that ID, return an error
	if (index > -1) {
		return new Response('A photo with this ID already exists. Please use a different one.', {
			status: 400,
			headers: headers
		});
	}

	// Otherwise, add the photo
	photos.push({id, name, url, description, price});
	let added = await PHOTOS.put('photos', JSON.stringify(photos));

	// If update failed
	if (added === null) {
		return new Response('Unable to add the photo. Please try again.', {
			status: 500,
			headers: headers
		});
	}

	// return a Response object
	return new Response('Photo added', {
		status: 200,
		headers: headers
	});

}

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {

	// HEAD/OPTIONS requests
	if (['HEAD', 'OPTIONS'].includes(request.method)) {
		return new Response('ok', {
			status: 200,
			headers
		});
	}

	// Get token from request
	let token = getToken(request);

	// If user is not logged in, return error
	let loggedIn = await isLoggedIn(token);
	if (!loggedIn) {
		return new Response('Not logged in', {
			status: 401,
			headers: headers
		});
	}

	// GET requests
	if (request.method === 'GET') {
		return await handleGET(request);
	}

	// PUT requests
	if (request.method === 'PUT') {
		return await handlePUT(request);
	}

	// POST requests
	if (request.method === 'POST') {
		return await handlePOST(request);
	}

	// DELETE requests
	if (request.method === 'DELETE') {
		return await handleDELETE(request);
	}

	// Everything else
	return new Response('Not allowed', {
		status: 400,
		headers
	});

}

// Listen for API calls
addEventListener('fetch', function (event) {
	event.respondWith(handleRequest(event.request));
});