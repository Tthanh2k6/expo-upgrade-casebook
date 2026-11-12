jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('expo-constants', () => ({ expoConfig: { extra: {} } }));
jest.mock('firebase/app', () => ({ initializeApp: jest.fn(), setLogLevel: jest.fn() }));
jest.mock('firebase/database', () => ({}));
jest.mock('./random', () => ({ generateRandomHex: jest.fn() }));

describe('Android Firebase timers', () => {
  const originalRequestIdleCallback = global.requestIdleCallback;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    global.requestIdleCallback = jest.fn();
    require('./firebase');
  });

  afterEach(() => {
    jest.useRealTimers();
    global.requestIdleCallback = originalRequestIdleCallback;
  });

  it('runs a long timer once during idle time with its arguments', () => {
    const callback = jest.fn();
    setTimeout(callback, 61000, 'value');
    jest.advanceTimersByTime(61000);
    expect(callback).not.toHaveBeenCalled();
    expect(requestIdleCallback).toHaveBeenCalledTimes(1);
    requestIdleCallback.mock.calls[0][0]();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('value');
  });

  it('can cancel a long timer after its idle callback has been queued', () => {
    const callback = jest.fn();
    const timer = setTimeout(callback, 61000);
    jest.advanceTimersByTime(61000);
    clearTimeout(timer);
    requestIdleCallback.mock.calls[0][0]();
    expect(callback).not.toHaveBeenCalled();
  });

  it('keeps short timers on the normal timer queue', () => {
    const callback = jest.fn();
    setTimeout(callback, 100, 'value');
    jest.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('value');
    expect(requestIdleCallback).not.toHaveBeenCalled();
  });
});
