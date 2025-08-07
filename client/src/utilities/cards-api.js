import sendRequest from './send-request'
const BASE_URL = '/api/cards'

export function getCards() {
  return sendRequest(BASE_URL);
}