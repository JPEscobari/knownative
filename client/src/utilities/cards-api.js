// --------------------------------------------------------------------- 
// This file contains functions to interact with the server's cards API.
// --------------------------------------------------------------------- 

import sendRequest from './send-request'
const BASE_URL = '/api/cards'

export function getAllCards() {
  return sendRequest(BASE_URL);
}

// Future functions for cards can go here, such as:
// addCard, deleteCard, updateCard, etc.