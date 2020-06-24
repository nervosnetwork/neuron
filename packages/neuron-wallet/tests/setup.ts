export const originalXMLHttpRequest = window.XMLHttpRequest

export const mockedXMLHttpRequest = {
  open: jest.fn(),
  send: jest.fn(),
  readyState: null,
  responseText: null,
}

Object.defineProperty(mockedXMLHttpRequest, 'readyState', {
  get: jest.fn(() => 4),
  set: jest.fn()
});
Object.defineProperty(mockedXMLHttpRequest, 'responseText', {
  get: jest.fn(() => JSON.stringify([])),
  set: jest.fn()
});

Object.defineProperty(window, "XMLHttpRequest", jest.fn(() => ({
  open: mockedXMLHttpRequest.open,
  send: mockedXMLHttpRequest.send,
  readyState: mockedXMLHttpRequest.readyState,
  responseText: mockedXMLHttpRequest.responseText
})));

jest.mock('levelup')
